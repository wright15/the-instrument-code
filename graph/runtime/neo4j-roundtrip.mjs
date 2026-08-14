import { canonicalJsonBytes, compareCodePoint, sha256 } from "./canonical.mjs";
import {
  COURT_NODE_LABELS,
  COURT_RELATIONSHIP_TYPES,
  GOV210_NODE_LABELS,
  GOV210_RELATIONSHIP_TYPES,
  MUTATION_NODE_LABELS,
  MUTATION_RELATIONSHIP_TYPES,
  PROVENANCE_NODE_LABELS,
  PROVENANCE_RELATIONSHIP_TYPES,
  SEMANTIC_NODE_LABELS,
  SEMANTIC_RELATIONSHIP_TYPES,
  TOPOLOGY_NODE_LABELS,
  TOPOLOGY_RELATIONSHIP_TYPES,
  normalizeNeo4jValue,
} from "./neo4j-bootstrap.mjs";
import {
  NODE_LABELS as GOVERNOR_NODE_LABELS,
  RELATIONSHIP_TYPES as GOVERNOR_RELATIONSHIP_TYPES,
} from "./canonical.mjs";


const semanticIdentityFields = Object.freeze({
  RegistryRelease: "release_id",
  CanonicalFeatureProfile: "profile_id",
  PhotonicRecord: "photonic_id",
  FeatureDefinition: "feature_id",
  HarmonicMeasureDefinition: "measure_id",
  SemanticOperator: "semantic_operator_id",
  SemanticUnresolvedScope: "scope_id",
  DomainProjection: "projection_id",
  LandformReference: "landform_id",
  CompiledFeatureProfile: "normal_form_id",
  DerivationRoute: "route_id",
  DerivationStep: "step_id",
  ValidationFixture: "fixture_id",
});

const namespaceLabels = Object.freeze({
  topology: new Set(TOPOLOGY_NODE_LABELS),
  provenance: new Set(PROVENANCE_NODE_LABELS),
  mutation: new Set(MUTATION_NODE_LABELS),
  semantic: new Set(SEMANTIC_NODE_LABELS),
  governorRuntime: new Set(GOVERNOR_NODE_LABELS),
  court: new Set(COURT_NODE_LABELS),
  gov210: new Set(GOV210_NODE_LABELS),
});
const namespaceTypes = Object.freeze({
  topology: new Set(TOPOLOGY_RELATIONSHIP_TYPES),
  provenance: new Set(PROVENANCE_RELATIONSHIP_TYPES),
  mutation: new Set(MUTATION_RELATIONSHIP_TYPES),
  semantic: new Set(SEMANTIC_RELATIONSHIP_TYPES),
  governorRuntime: new Set(GOVERNOR_RELATIONSHIP_TYPES),
  court: new Set(COURT_RELATIONSHIP_TYPES),
  gov210: new Set(GOV210_RELATIONSHIP_TYPES),
});
const namespaceOrder = Object.freeze([
  "topology", "provenance", "mutation", "semantic",
  "governorRuntime", "court", "gov210",
]);
const allOwnedLabels = Object.freeze(namespaceOrder.flatMap(
  (namespace) => [...namespaceLabels[namespace]],
));
const allOwnedRelationshipTypes = Object.freeze(namespaceOrder.flatMap(
  (namespace) => [...namespaceTypes[namespace]],
));

function namespaceForLabels(labels) {
  const matches = namespaceOrder.filter((namespace) => (
    labels.some((label) => namespaceLabels[namespace].has(label))
  ));
  if (matches.length !== 1) throw new Error(`normalized_node_namespace_invalid:${labels}`);
  return matches[0];
}

function namespaceForRelationship(relationshipType) {
  const matches = namespaceOrder.filter((namespace) => (
    namespaceTypes[namespace].has(relationshipType)
  ));
  if (matches.length !== 1) {
    throw new Error(`normalized_relationship_namespace_invalid:${relationshipType}`);
  }
  return matches[0];
}

function stableNodeIdentity(labels, properties) {
  if (typeof properties.logicalId === "string") return properties.logicalId;
  const label = labels.find((item) => namespaceLabels.topology.has(item)
    || namespaceLabels.provenance.has(item)
    || namespaceLabels.mutation.has(item)
    || namespaceLabels.semantic.has(item));
  const identity = {
    ScaleState: ["scale", "id"],
    ScaleFamily: ["family", "forte"],
    GovernorOffice: ["office", "name"],
    AuditRelease: ["audit-release", "releaseId"],
    FrameworkDocument: ["framework-document", "documentId"],
    InvariantDefinition: ["invariant", "invariantId"],
    MutationOperator: ["mutation-operator", "id"],
  }[label] ?? (semanticIdentityFields[label]
    ? [label, semanticIdentityFields[label]]
    : null);
  if (!identity || properties[identity[1]] === undefined) {
    throw new Error(`normalized_node_identity_missing:${label}`);
  }
  return `${identity[0]}:${properties[identity[1]]}`;
}

function materializeResult(result) {
  return result.records.map((record) => normalizeNeo4jValue(record.toObject()));
}

function aggregateRelationships(records) {
  const byIdentity = new Map();
  for (const record of records) {
    const core = {
      relationshipType: record.relationshipType,
      sourceLogicalId: stableNodeIdentity(record.sourceLabels, record.sourceProperties),
      targetLogicalId: stableNodeIdentity(record.targetLabels, record.targetProperties),
      properties: record.properties,
    };
    const key = canonicalJsonBytes(core).toString("utf8");
    const existing = byIdentity.get(key);
    if (existing) existing.multiplicity += 1;
    else byIdentity.set(key, { ...core, multiplicity: 1 });
  }
  return [...byIdentity.values()].sort((left, right) => compareCodePoint(
    canonicalJsonBytes(left).toString("utf8"),
    canonicalJsonBytes(right).toString("utf8"),
  ));
}

function namespaceEnvelope(nodes, relationships) {
  const byLabel = {};
  for (const node of nodes) {
    for (const label of node.labels) byLabel[label] = (byLabel[label] ?? 0) + 1;
  }
  const byRelationshipType = {};
  for (const relationship of relationships) {
    byRelationshipType[relationship.relationshipType] = (
      byRelationshipType[relationship.relationshipType] ?? 0
    ) + relationship.multiplicity;
  }
  const counts = {
    nodeCount: nodes.length,
    relationshipCount: relationships.reduce(
      (total, relationship) => total + relationship.multiplicity,
      0,
    ),
    byLabel,
    byRelationshipType,
  };
  const core = { nodes, relationships, counts };
  return { ...core, namespaceFingerprint: sha256(core) };
}

export async function exportNormalizedNeo4jSnapshot(
  session,
  { releaseId, sourceBindings },
) {
  const nodeRows = materializeResult(await session.run(
    `MATCH (n)
     WHERE any(label IN labels(n) WHERE label IN $labels)
     RETURN labels(n) AS labels, properties(n) AS properties`,
    { labels: allOwnedLabels },
  ));
  const relationshipRows = materializeResult(await session.run(
    `MATCH (source)-[relationship]->(target)
     WHERE type(relationship) IN $relationshipTypes
     RETURN labels(source) AS sourceLabels,
            properties(source) AS sourceProperties,
            type(relationship) AS relationshipType,
            properties(relationship) AS properties,
            labels(target) AS targetLabels,
             properties(target) AS targetProperties`,
    { relationshipTypes: allOwnedRelationshipTypes },
  ));
  const nodesByNamespace = Object.fromEntries(namespaceOrder.map((item) => [item, []]));
  for (const row of nodeRows) {
    const labels = [...row.labels].sort(compareCodePoint);
    const namespace = namespaceForLabels(labels);
    nodesByNamespace[namespace].push({
      logicalId: stableNodeIdentity(labels, row.properties),
      labels,
      properties: row.properties,
    });
  }
  for (const nodes of Object.values(nodesByNamespace)) {
    nodes.sort((left, right) => compareCodePoint(left.logicalId, right.logicalId));
    if (new Set(nodes.map((node) => node.logicalId)).size !== nodes.length) {
      throw new Error("normalized_node_identity_duplicate");
    }
  }
  const relationshipsByNamespace = Object.fromEntries(
    namespaceOrder.map((item) => [item, []]),
  );
  for (const row of relationshipRows) {
    relationshipsByNamespace[namespaceForRelationship(row.relationshipType)].push(row);
  }
  const namespaces = {};
  for (const namespace of namespaceOrder) {
    namespaces[namespace] = namespaceEnvelope(
      nodesByNamespace[namespace],
      aggregateRelationships(relationshipsByNamespace[namespace]),
    );
  }
  const counts = Object.values(namespaces).reduce(
    (result, namespace) => ({
      nodeCount: result.nodeCount + namespace.counts.nodeCount,
      relationshipCount: result.relationshipCount + namespace.counts.relationshipCount,
    }),
    { nodeCount: 0, relationshipCount: 0 },
  );
  if (!Array.isArray(sourceBindings) || sourceBindings.length !== namespaceOrder.length) {
    throw new Error("normalized_source_bindings_invalid");
  }
  const sortedSourceBindings = [...sourceBindings].sort((left, right) => (
    compareCodePoint(
      `${left.namespace}\u0000${left.path}\u0000${left.sha256}`,
      `${right.namespace}\u0000${right.path}\u0000${right.sha256}`,
    )
  ));
  if (!sameSet(
    new Set(sortedSourceBindings.map((binding) => binding.namespace)),
    new Set(namespaceOrder),
  )) throw new Error("normalized_source_bindings_invalid");
  const core = {
    schemaVersion: "seven-governors.neo4j-normalized-snapshot.v1",
    releaseId,
    sourceBindings: sortedSourceBindings,
    namespaces,
    counts,
  };
  return { ...core, snapshotFingerprint: sha256(core) };
}

function sameSet(left, right) {
  return left.size === right.size && [...left].every((item) => right.has(item));
}

function selectedTopologyRecord(node) {
  const properties = node.properties;
  return {
    id: properties.id,
    name: properties.name,
    forte: properties.forte,
    bit: properties.bit,
    bitReverse: properties.bitReverse,
    pitchSet: properties.pitchSet,
    office: properties.office ?? null,
    officeIndex: properties.officeIndex ?? null,
    tier: properties.tier ?? null,
    role: properties.role,
    fineRole: properties.fineRole,
    assignmentStatus: properties.assignmentStatus,
    resolutionClass: properties.resolutionClass,
    orientation: properties.orientation,
    chirality: properties.chirality,
    registeredBeforeCompletion: properties.registeredBeforeCompletion,
  };
}

function selectedCanonicalRecord(node) {
  return {
    id: node.id,
    name: node.name,
    forte: node.forte,
    bit: node.bit,
    bitReverse: node.bitReverse,
    pitchSet: node.pitchSet,
    office: node.office ?? null,
    officeIndex: node.officeIndex ?? null,
    tier: node.tier ?? null,
    role: node.role,
    fineRole: node.fineRole,
    assignmentStatus: node.assignmentStatus,
    resolutionClass: node.resolutionClass,
    orientation: node.orientation,
    chirality: node.chirality,
    registeredBeforeCompletion: node.registeredBeforeCompletion,
  };
}

export function verifyNormalizedNeo4jSnapshot(
  snapshot,
  {
    releaseId,
    canonicalTopology,
    mutationOperatorIds,
    mutationApplicationIds,
    semanticNodeIds,
    governorProjectionFingerprint,
    courtProjectionFingerprint,
    gov210ProjectionFingerprint,
    sourceBindings,
    expectedCounts = { nodeCount: 3061, relationshipCount: 10506 },
    expectedNamespaceFingerprints,
  },
) {
  try {
    const core = Object.fromEntries(
      Object.entries(snapshot).filter(([key]) => key !== "snapshotFingerprint"),
    );
    if (
      snapshot.schemaVersion !== "seven-governors.neo4j-normalized-snapshot.v1"
      || snapshot.releaseId !== releaseId
      || snapshot.snapshotFingerprint !== sha256(core)
      || !expectedNamespaceFingerprints
    ) return false;
    if (!canonicalJsonBytes(snapshot.sourceBindings).equals(canonicalJsonBytes(
      [...sourceBindings].sort((left, right) => compareCodePoint(
        `${left.namespace}\u0000${left.path}\u0000${left.sha256}`,
        `${right.namespace}\u0000${right.path}\u0000${right.sha256}`,
      )),
    ))) return false;
    if (!canonicalJsonBytes(snapshot.counts).equals(canonicalJsonBytes(expectedCounts))) return false;
    for (const namespace of namespaceOrder) {
      const value = snapshot.namespaces[namespace];
      const recomputed = namespaceEnvelope(value.nodes, value.relationships);
      if (!canonicalJsonBytes(value).equals(canonicalJsonBytes(recomputed))) return false;
      if (value.namespaceFingerprint !== expectedNamespaceFingerprints[namespace]) return false;
    }

    const liveStates = snapshot.namespaces.topology.nodes
      .filter((node) => node.labels.includes("ScaleState"))
      .map(selectedTopologyRecord)
      .sort((left, right) => left.id - right.id);
    const canonicalStates = canonicalTopology.nodes
      .map(selectedCanonicalRecord)
      .sort((left, right) => left.id - right.id);
    if (!canonicalJsonBytes(liveStates).equals(canonicalJsonBytes(canonicalStates))) return false;

    const liveOperatorIds = new Set(snapshot.namespaces.mutation.nodes.map(
      (node) => node.properties.id,
    ));
    const liveApplicationIds = new Set(snapshot.namespaces.mutation.relationships.map(
      (relationship) => relationship.properties.applicationId,
    ));
    if (!sameSet(liveOperatorIds, new Set(mutationOperatorIds))) return false;
    if (!sameSet(liveApplicationIds, new Set(mutationApplicationIds))) return false;

    for (const [label, expectedIds] of Object.entries(semanticNodeIds)) {
      const field = semanticIdentityFields[label];
      const actualIds = new Set(snapshot.namespaces.semantic.nodes
        .filter((node) => node.labels.includes(label))
        .map((node) => node.properties[field]));
      if (!sameSet(actualIds, new Set(expectedIds))) return false;
    }

    const fingerprints = (namespace) => new Set(
      snapshot.namespaces[namespace].nodes
        .map((node) => node.properties.projectionFingerprint)
        .filter((value) => value !== undefined),
    );
    if (!sameSet(fingerprints("governorRuntime"), new Set([governorProjectionFingerprint]))) {
      return false;
    }
    if (!sameSet(fingerprints("court"), new Set([courtProjectionFingerprint]))) return false;
    if (!sameSet(fingerprints("gov210"), new Set([gov210ProjectionFingerprint]))) return false;
    return true;
  } catch {
    return false;
  }
}
