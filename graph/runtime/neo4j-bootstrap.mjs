import fs from "node:fs";
import path from "node:path";
import neo4j from "neo4j-driver";

import { validateGraphSnapshot } from "./contracts.mjs";
import {
  canonicalJsonBytes,
  NODE_LABELS as GOVERNOR_NODE_LABELS,
  RELATIONSHIP_TYPES as GOVERNOR_RELATIONSHIP_TYPES,
  sha256,
  sha256Bytes,
} from "./canonical.mjs";


export const TOPOLOGY_NODE_LABELS = Object.freeze([
  "ScaleState", "ScaleFamily", "GovernorOffice",
]);
export const TOPOLOGY_RELATIONSHIP_TYPES = Object.freeze([
  "GOVERNS", "CONSTRUCTS", "SEAT_CONTACT", "MODAL_SUCCESSOR",
  "AUDITED_HAMMING2", "PHASE_SHIFT", "CONVERGENCE_CONTACT",
  "JUNCTION_CONTACT", "LEAF_CONTACT", "BELONGS_TO_FAMILY",
  "OCCUPIES_OFFICE", "RELATIONAL_OFFICE_EVIDENCE",
]);
export const PROVENANCE_NODE_LABELS = Object.freeze([
  "AuditRelease", "FrameworkDocument", "InvariantDefinition",
]);
export const PROVENANCE_RELATIONSHIP_TYPES = Object.freeze([
  "INCLUDES_DOCUMENT", "DECLARES_INVARIANT", "DEFINED_BY",
]);
export const MUTATION_NODE_LABELS = Object.freeze(["MutationOperator"]);
export const MUTATION_RELATIONSHIP_TYPES = Object.freeze([
  "MODAL_MUTATES_TO", "LOCAL_MUTATES_TO",
]);
export const SEMANTIC_NODE_LABELS = Object.freeze([
  "RegistryRelease", "CanonicalFeatureProfile", "PhotonicRecord",
  "FeatureDefinition", "HarmonicMeasureDefinition", "SemanticOperator",
  "SemanticUnresolvedScope", "DomainProjection", "LandformReference",
  "CompiledFeatureProfile", "DerivationRoute", "DerivationStep",
  "ValidationFixture",
]);
export const SEMANTIC_RELATIONSHIP_TYPES = Object.freeze([
  "PART_OF_RELEASE", "HAS_CANONICAL_PROFILE", "CANONICALIZED_BY",
  "ACTIVE_PROFILE", "HAS_PHOTONIC_RECORD", "HAS_FEATURE", "REALIZES",
  "ACTIVE_SEMANTIC_OPERATOR", "HAS_UNRESOLVED_SCOPE", "REFERENCES_LANDFORM",
  "PROJECTS_FEATURE", "HAS_NORMAL_FORM", "PRODUCES", "HAS_STEP",
  "STARTS_AT", "ENDS_AT", "APPLIES", "TESTS_ROUTE",
]);
export const COURT_NODE_LABELS = Object.freeze([
  "CourtCommutationRecord", "CourtFilterApplication", "CourtFilterOperator",
  "CourtLedgerSnapshot", "CourtRootedPosition", "CourtRuntimeSession",
  "CourtState", "CourtTransitionEvent", "PentatonicSetClass", "PoleRegister",
  "TopologicalTranslocationRecord", "Triad",
]);
export const COURT_RELATIONSHIP_TYPES = Object.freeze([
  "FILTERS", "HAS_COMMUTATION_RESULT", "HAS_LEDGER_SNAPSHOT",
  "HAS_POLE_REGISTER", "HAS_TRANSITION_EVENT", "HAS_TRANSLOCATION",
  "HAS_TRIAD", "SNAPSHOTS_STATE", "USES_FILTER", "USES_ROUTE_RECORD",
  "YIELDS_ADMITTED_SET",
]);
export const GOV210_NODE_LABELS = Object.freeze([
  "Gov210AvailabilityRelease", "Gov210ContextHousing", "Gov210CourtTarget",
  "Gov210SkillAssignment", "Gov210SkillAvailability", "Gov210SkillEligibility",
  "Gov210SkillLifecycle", "Gov210TopologyTarget",
]);
export const GOV210_RELATIONSHIP_TYPES = Object.freeze([
  "GOV210_ASSIGNS_SKILL", "GOV210_DECLARES_AVAILABILITY",
  "GOV210_DECLARES_HOUSING", "GOV210_DECLARES_LIFECYCLE",
  "GOV210_HAS_ELIGIBILITY", "GOV210_REFERENCES_SKILL", "GOV210_TARGETS",
]);

const ALL_NODE_LABELS = Object.freeze([
  ...TOPOLOGY_NODE_LABELS,
  ...PROVENANCE_NODE_LABELS,
  ...MUTATION_NODE_LABELS,
  ...SEMANTIC_NODE_LABELS,
  ...GOVERNOR_NODE_LABELS,
  ...COURT_NODE_LABELS,
  ...GOV210_NODE_LABELS,
]);
const ALL_RELATIONSHIP_TYPES = Object.freeze([
  ...TOPOLOGY_RELATIONSHIP_TYPES,
  ...PROVENANCE_RELATIONSHIP_TYPES,
  ...MUTATION_RELATIONSHIP_TYPES,
  ...SEMANTIC_RELATIONSHIP_TYPES,
  ...GOVERNOR_RELATIONSHIP_TYPES,
  ...COURT_RELATIONSHIP_TYPES,
  ...GOV210_RELATIONSHIP_TYPES,
]);

const GOVERNOR_NODE_QUERIES = Object.freeze(Object.fromEntries(
  GOVERNOR_NODE_LABELS.map((label) => [label, `
    UNWIND $records AS record
    MERGE (n:${label} {logicalId: record.logicalId})
    SET n += record
  `]),
));
function governorRelationshipQuery(relationshipType, sourceLabel, targetLabel) {
  if (
    !GOVERNOR_RELATIONSHIP_TYPES.includes(relationshipType)
    || !GOVERNOR_NODE_LABELS.includes(sourceLabel)
    || !GOVERNOR_NODE_LABELS.includes(targetLabel)
  ) throw new Error("governor_relationship_endpoint_not_allowed");
  return `
     UNWIND $records AS record
     MATCH (source:${sourceLabel} {logicalId: record.sourceLogicalId})
     MATCH (target:${targetLabel} {logicalId: record.targetLogicalId})
     MERGE (source)-[r:${relationshipType} {logicalId: record.logicalId}]->(target)
     SET r += record.properties
    SET r.logicalId = record.logicalId,
        r.projectionFingerprint = record.projectionFingerprint,
        r.sourceFingerprint = record.sourceFingerprint,
        r.policyFingerprint = record.policyFingerprint,
        r.recordSha256 = record.recordSha256,
        r.admissionStatus = record.admissionStatus,
         r.verificationStatus = record.verificationStatus
  `;
}

const paths = Object.freeze({
  topologySchema: "neo4j/schema.cypher",
  topologyImport: "neo4j/import.cypher",
  topologyValidation: "neo4j/validation.cypher",
  provenanceImport: "neo4j/provenance.cypher",
  provenanceValidation: "neo4j/provenance-validation.cypher",
  mutationSchema: "seven-governors-mutation-algebra-audit/neo4j/algebra-schema.cypher",
  mutationImport: "seven-governors-mutation-algebra-audit/neo4j/algebra-import.cypher",
  mutationValidation: "seven-governors-mutation-algebra-audit/neo4j/algebra-validation.cypher",
  semanticSchema: "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/01_semantic_schema.cypher",
  semanticImport: "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/02_semantic_import.cypher",
  semanticValidation: "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/03_semantic_validation.cypher",
  governorSchema: "neo4j/governor-runtime/schema.cypher",
  courtSchema: "neo4j/court-mathematics/schema.cypher",
  courtValidation: "neo4j/court-mathematics/validation.cypher",
  gov210Schema: "neo4j/gov-210/schema.cypher",
  gov210Validation: "neo4j/gov-210/validation.cypher",
});

export function splitCypherStatements(source) {
  if (typeof source !== "string") throw new TypeError("cypher_source_must_be_string");
  return source.split(/;\s*(?:\n|$)/).map((value) => value.trim()).filter(Boolean);
}

export function normalizeNeo4jValue(value) {
  if (neo4j.isInt(value)) {
    if (!value.inSafeRange()) throw new Error("neo4j_integer_out_of_safe_range");
    return value.toNumber();
  }
  if (Array.isArray(value)) return value.map(normalizeNeo4jValue);
  if (value && typeof value === "object") {
    if (value.constructor?.name && /^Date(?:Time)?$|^LocalDate/.test(value.constructor.name)) {
      return value.toString();
    }
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, normalizeNeo4jValue(child)]),
    );
  }
  if (typeof value === "number" && !Number.isFinite(value)) {
    throw new Error("neo4j_non_finite_number");
  }
  return value;
}

export function asNeo4jParameters(value) {
  if (Number.isInteger(value)) return neo4j.int(value);
  if (Array.isArray(value)) return value.map(asNeo4jParameters);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, asNeo4jParameters(child)]),
    );
  }
  return value;
}

function rows(result) {
  return result.records.map((record) => normalizeNeo4jValue(record.toObject()));
}

export function stageNeo4jCsv({ importDir, packageRoot }) {
  if (!path.isAbsolute(importDir) || !path.isAbsolute(packageRoot)) {
    throw new Error("bootstrap_paths_must_be_absolute");
  }
  const topologyDestination = path.join(importDir, "seven-governors", "csv");
  fs.mkdirSync(path.dirname(topologyDestination), { recursive: true });
  fs.cpSync(path.join(packageRoot, "neo4j", "csv"), topologyDestination, {
    recursive: true,
  });
  for (const name of ["operator-registry.csv", "operator-applications.csv"]) {
    fs.copyFileSync(
      path.join(packageRoot, "seven-governors-mutation-algebra-audit", "audit", name),
      path.join(importDir, name),
    );
  }
  const semanticCsv = path.join(
    packageRoot,
    "seven-governors-canonical-feature-profile-registry-v0.1.1",
    "neo4j",
    "csv",
  );
  for (const name of fs.readdirSync(semanticCsv).filter((item) => item.endsWith(".csv"))) {
    fs.copyFileSync(path.join(semanticCsv, name), path.join(importDir, name));
  }
}

export async function runCypherFile(
  session,
  packageRoot,
  relativePath,
  { allowCommunityExistenceConstraints = false } = {},
) {
  const source = fs.readFileSync(path.join(packageRoot, relativePath), "utf8");
  const results = [];
  for (const statement of splitCypherStatements(source)) {
    try {
      results.push(await session.run(statement));
    } catch (error) {
      const unsupportedExistence = allowCommunityExistenceConstraints
        && statement.includes("IS NOT NULL")
        && /enterprise|property existence constraint/i.test(error.message);
      if (!unsupportedExistence) throw error;
    }
  }
  return results;
}

function validationRowPassed(row) {
  if (row.result !== undefined) return row.result === "PASS";
  if (row.status !== undefined) return row.status === "PASS";
  if (row.passed !== undefined) return row.passed === true;
  if (row.violations !== undefined) return row.violations === 0;
  return false;
}

export async function runValidationFile(session, packageRoot, relativePath) {
  const source = fs.readFileSync(path.join(packageRoot, relativePath), "utf8");
  const checks = [];
  let index = 0;
  for (const statement of splitCypherStatements(source)) {
    index += 1;
    const result = await session.run(statement);
    const materialized = rows(result);
    const passed = materialized.length === 0 || materialized.every(validationRowPassed);
    checks.push({ statement: index, passed, rows: materialized });
  }
  if (checks.some((check) => !check.passed)) {
    throw new Error(`neo4j_validation_failed:${relativePath}`);
  }
  return checks;
}

export async function resetOwnedDatabase(session) {
  await session.run(
    `MATCH ()-[relationship]->()
     WHERE type(relationship) IN $relationshipTypes
     DELETE relationship`,
    { relationshipTypes: ALL_RELATIONSHIP_TYPES },
  );
  // Preserve nodes carrying external labels or relationships by detaching only
  // the release-owned labels. The subsequent import creates fresh owned nodes.
  for (const label of ALL_NODE_LABELS) {
    await session.run(
      `MATCH (n:${label})
       WHERE any(item IN labels(n) WHERE NOT item IN $labels)
          OR EXISTS {
            MATCH (n)-[relationship]-()
            WHERE NOT type(relationship) IN $relationshipTypes
          }
       REMOVE n:${label}`,
      { labels: ALL_NODE_LABELS, relationshipTypes: ALL_RELATIONSHIP_TYPES },
    );
  }
  await session.run(
    `MATCH (n)
     WHERE any(label IN labels(n) WHERE label IN $labels)
     DETACH DELETE n`,
    { labels: ALL_NODE_LABELS },
  );
}

export async function importGovernorSnapshot(session, snapshot) {
  validateGraphSnapshot(snapshot);
  const labelByLogicalId = new Map(snapshot.nodes.map((node) => [node.logicalId, node.label]));
  const nodesByLabel = new Map();
  for (const node of snapshot.nodes) {
    if (!GOVERNOR_NODE_QUERIES[node.label]) throw new Error("governor_node_label_not_allowed");
    if (!nodesByLabel.has(node.label)) nodesByLabel.set(node.label, []);
    nodesByLabel.get(node.label).push({
      logicalId: node.logicalId,
      ...node.properties,
      recordSha256: node.recordSha256,
      projectionFingerprint: node.projectionFingerprint,
      sourceFingerprint: node.sourceFingerprint,
      policyFingerprint: node.policyFingerprint,
      admissionStatus: node.admissionStatus,
      verificationStatus: node.verificationStatus,
    });
  }
  for (const [label, records] of nodesByLabel) {
    await session.run(GOVERNOR_NODE_QUERIES[label], { records });
  }
  const edgesByType = new Map();
  for (const edge of snapshot.edges) {
    if (!GOVERNOR_RELATIONSHIP_TYPES.includes(edge.relationshipType)) {
      throw new Error("governor_relationship_type_not_allowed");
    }
    const sourceLabel = labelByLogicalId.get(edge.sourceLogicalId);
    const targetLabel = labelByLogicalId.get(edge.targetLogicalId);
    const key = `${edge.relationshipType}\u0000${sourceLabel}\u0000${targetLabel}`;
    if (!edgesByType.has(key)) {
      edgesByType.set(key, { relationshipType: edge.relationshipType, sourceLabel, targetLabel, records: [] });
    }
    edgesByType.get(key).records.push(edge);
  }
  for (const { relationshipType, sourceLabel, targetLabel, records } of edgesByType.values()) {
    await session.run(governorRelationshipQuery(relationshipType, sourceLabel, targetLabel), { records });
  }
}

function assertTrustedBatch(batch, allowedLabels, allowedTypes) {
  if (
    !batch
    || typeof batch.cypher !== "string"
    || !batch.parameters
    || typeof batch.parameters !== "object"
    || !Array.isArray(batch.parameters.records)
    || !/^\s*UNWIND\s+\$records\s+AS\s+record\b/i.test(batch.cypher)
    || /\b(?:CREATE|DELETE|DETACH|REMOVE|LOAD\s+CSV|DROP\s+(?:USER|DATABASE))\b/i.test(batch.cypher)
    || /,\s*\(/.test(batch.cypher)
    || /\bCALL\s+(?!\()/i.test(batch.cypher)
  ) throw new Error("untrusted_ingestion_batch");
  const labels = [...batch.cypher.matchAll(/\((?:[A-Za-z][A-Za-z0-9_]*)?:([A-Za-z][A-Za-z0-9_]*)/g)]
    .map((match) => match[1]);
  const types = [...batch.cypher.matchAll(/\[(?:[A-Za-z][A-Za-z0-9_]*)?:([A-Za-z][A-Za-z0-9_]*)/g)]
    .map((match) => match[1]);
  if (labels.some((label) => !allowedLabels.has(label))) {
    throw new Error("ingestion_batch_label_not_allowed");
  }
  if (types.some((type) => !allowedTypes.has(type))) {
    throw new Error("ingestion_batch_relationship_not_allowed");
  }
  const unlabeledMatches = [...batch.cypher.matchAll(/\bMATCH\s*\(\s*([^)]*)\)/gi)]
    .map((match) => match[1])
    .filter((pattern) => !/^\s*(?:[A-Za-z][A-Za-z0-9_]*\s*)?:[A-Za-z]/.test(pattern));
  const allowedUnionTarget = "target {logicalId: record.targetLogicalId}";
  if (
    unlabeledMatches.some((pattern) => pattern.trim() !== allowedUnionTarget)
    || (unlabeledMatches.length > 0 && !batch.cypher.includes(
      "WHERE any(label IN labels(target) WHERE label IN ['Gov210TopologyTarget', 'Gov210CourtTarget'])",
    ))
  ) throw new Error("ingestion_batch_node_match_not_allowed");
  const [kind, identity, extra] = String(batch.kind ?? "").split(":");
  if (extra !== undefined) throw new Error("ingestion_batch_kind_invalid");
  if (kind === "references") {
    if (
      identity !== "ScaleState"
      || !allowedLabels.has("ScaleState")
      || types.length !== 0
      || !/MERGE\s*\(n:ScaleState\s*\{id:\s*record\.scaleStateId\}\)/i.test(batch.cypher)
    ) throw new Error("ingestion_batch_kind_invalid");
  } else if (kind === "nodes") {
    if (
      !allowedLabels.has(identity)
      || types.length !== 0
      || !new RegExp(`MERGE\\s*\\(n:${identity}\\s*\\{logicalId:`).test(batch.cypher)
    ) throw new Error("ingestion_batch_kind_invalid");
  } else if (kind === "relationships") {
    if (
      !allowedTypes.has(identity)
      || types.length !== 1
      || types[0] !== identity
      || !new RegExp(`MERGE[\\s\\S]*\\[r:${identity}\\s*\\{logicalId:`).test(batch.cypher)
    ) throw new Error("ingestion_batch_kind_invalid");
  } else {
    throw new Error("ingestion_batch_kind_invalid");
  }
}

export async function runTrustedBatches(session, batches, namespace, trustedTemplates) {
  if (!Array.isArray(batches) || !trustedTemplates || typeof trustedTemplates !== "object") {
    throw new Error("ingestion_batches_invalid");
  }
  const court = namespace === "court";
  if (!court && namespace !== "gov210") throw new Error("ingestion_namespace_invalid");
  const labels = new Set(court ? [...COURT_NODE_LABELS, "ScaleState"] : GOV210_NODE_LABELS);
  const types = new Set(court ? COURT_RELATIONSHIP_TYPES : GOV210_RELATIONSHIP_TYPES);
  for (const batch of batches) {
    assertTrustedBatch(batch, labels, types);
    const templateSha256 = sha256Bytes(Buffer.from(batch.cypher, "utf8"));
    if (trustedTemplates[batch.kind] !== templateSha256) {
      throw new Error("ingestion_batch_template_mismatch");
    }
    await session.executeWrite((tx) => tx.run(
      batch.cypher,
      asNeo4jParameters(batch.parameters),
    ));
  }
  return sha256(batches.map((batch) => ({
    cypherSha256: sha256Bytes(Buffer.from(batch.cypher, "utf8")),
    parameters: batch.parameters,
  })));
}

async function bindCurrentRelease(session, release) {
  const sourceFingerprint = sha256(release);
  await session.run(
    `MERGE (release:AuditRelease {releaseId: $releaseId})
     SET release.version = $version,
         release.releaseDate = date($releaseDate),
         release.status = $status,
         release.rootedScaleStates = $counts.rootedScaleStates,
         release.anchorStates = $counts.anchorStates,
         release.satelliteStates = $counts.satelliteStates,
         release.boundaryStates = $counts.boundaryStates,
         release.officeBearingStates = $counts.officeBearingStates,
         release.canonicalRelationships = $counts.canonicalRelationships,
         release.neo4jProjectedRelationships = $counts.neo4jProjectedRelationships,
         release.sourceFingerprint = $sourceFingerprint
     WITH release
     MATCH (document:FrameworkDocument)
     MERGE (release)-[:INCLUDES_DOCUMENT]->(document)
     WITH DISTINCT release
     MATCH (invariant:InvariantDefinition)
     MERGE (release)-[:DECLARES_INVARIANT]->(invariant)`,
    {
      releaseId: release.releaseId,
      version: release.version,
      releaseDate: release.releaseDate,
      status: release.status,
      counts: release.canonicalCounts,
      sourceFingerprint,
    },
  );
}

async function countNamespace(session, labels, relationshipTypes) {
  const result = await session.run(
    `CALL {
       MATCH (n)
       WHERE any(label IN labels(n) WHERE label IN $labels)
       RETURN count(n) AS nodeCount
     }
     CALL {
       MATCH ()-[r]->()
       WHERE type(r) IN $relationshipTypes
       RETURN count(r) AS relationshipCount
     }
     RETURN nodeCount, relationshipCount`,
    { labels, relationshipTypes },
  );
  return rows(result)[0];
}

function storedProjectionFingerprint(snapshot) {
  const fingerprints = new Set(
    snapshot.nodes.map((node) => node.projectionFingerprint).filter(Boolean),
  );
  if (fingerprints.size === 0 && typeof snapshot.projectionFingerprint === "string") {
    return snapshot.projectionFingerprint;
  }
  if (fingerprints.size !== 1) throw new Error("snapshot_node_projection_fingerprint_invalid");
  return [...fingerprints][0];
}

export async function inspectFullDatabaseReadiness(
  session,
  { release, governorSnapshot, courtSnapshot, gov210Snapshot },
) {
  const expected = {
    topology: { nodeCount: 507, relationshipCount: 2818 },
    provenance: { nodeCount: 11, relationshipCount: 22 },
    mutation: { nodeCount: 15, relationshipCount: 3402 },
    semantic: { nodeCount: 136, relationshipCount: 459 },
    governorRuntime: {
      nodeCount: governorSnapshot.counts.nodeCount,
      relationshipCount: governorSnapshot.counts.edgeCount,
    },
    court: {
      nodeCount: courtSnapshot.counts.nodeCount,
      relationshipCount: courtSnapshot.counts.relationshipCount,
    },
    gov210: {
      nodeCount: gov210Snapshot.counts.nodeCount,
      relationshipCount: gov210Snapshot.counts.relationshipCount,
    },
  };
  const specs = {
    topology: [TOPOLOGY_NODE_LABELS, TOPOLOGY_RELATIONSHIP_TYPES],
    provenance: [PROVENANCE_NODE_LABELS, PROVENANCE_RELATIONSHIP_TYPES],
    mutation: [MUTATION_NODE_LABELS, MUTATION_RELATIONSHIP_TYPES],
    semantic: [SEMANTIC_NODE_LABELS, SEMANTIC_RELATIONSHIP_TYPES],
    governorRuntime: [GOVERNOR_NODE_LABELS, GOVERNOR_RELATIONSHIP_TYPES],
    court: [COURT_NODE_LABELS, COURT_RELATIONSHIP_TYPES],
    gov210: [GOV210_NODE_LABELS, GOV210_RELATIONSHIP_TYPES],
  };
  const projections = {};
  for (const [namespace, [labels, types]] of Object.entries(specs)) {
    const observed = await countNamespace(session, labels, types);
    projections[namespace] = {
      ready: observed.nodeCount === expected[namespace].nodeCount
        && observed.relationshipCount === expected[namespace].relationshipCount,
      expected: expected[namespace],
      observed,
    };
  }
  const currentRelease = rows(await session.run(
    `MATCH (release:AuditRelease {releaseId: $releaseId})
     OPTIONAL MATCH (release)-[:INCLUDES_DOCUMENT]->(document:FrameworkDocument)
     OPTIONAL MATCH (release)-[:DECLARES_INVARIANT]->(invariant:InvariantDefinition)
     RETURN count(DISTINCT release) AS releases,
            count(DISTINCT document) AS documents,
            count(DISTINCT invariant) AS invariants,
            collect(DISTINCT release.version) AS versions`,
    { releaseId: release.releaseId },
  ))[0];
  projections.provenance.ready = projections.provenance.ready
    && currentRelease.releases === 1
    && currentRelease.documents === 5
    && currentRelease.invariants === 4
    && currentRelease.versions.length === 1
    && currentRelease.versions[0] === release.version;

  const projectionFingerprints = rows(await session.run(
    `CALL {
       MATCH (n) WHERE any(label IN labels(n) WHERE label IN $governorLabels)
       RETURN collect(DISTINCT n.projectionFingerprint) AS governor
     }
     CALL {
       MATCH (n) WHERE any(label IN labels(n) WHERE label IN $courtLabels)
       RETURN collect(DISTINCT n.projectionFingerprint) AS court
     }
     CALL {
       MATCH (n) WHERE any(label IN labels(n) WHERE label IN $gov210Labels)
       RETURN collect(DISTINCT n.projectionFingerprint) AS gov210
     }
     RETURN governor, court, gov210`,
    {
      governorLabels: GOVERNOR_NODE_LABELS,
      courtLabels: COURT_NODE_LABELS,
      gov210Labels: GOV210_NODE_LABELS,
    },
  ))[0];
  projections.governorRuntime.ready = projections.governorRuntime.ready
    && projectionFingerprints.governor.length === 1
    && projectionFingerprints.governor[0] === storedProjectionFingerprint(governorSnapshot);
  projections.court.ready = projections.court.ready
    && projectionFingerprints.court.length === 1
    && projectionFingerprints.court[0] === storedProjectionFingerprint(courtSnapshot);
  projections.gov210.ready = projections.gov210.ready
    && projectionFingerprints.gov210.length === 1
    && projectionFingerprints.gov210[0] === storedProjectionFingerprint(gov210Snapshot);

  const expectedTotals = Object.values(expected).reduce(
    (result, counts) => ({
      nodeCount: result.nodeCount + counts.nodeCount,
      relationshipCount: result.relationshipCount + counts.relationshipCount,
    }),
    { nodeCount: 0, relationshipCount: 0 },
  );
  const totals = Object.values(projections).reduce(
    (result, projection) => ({
      nodeCount: result.nodeCount + projection.observed.nodeCount,
      relationshipCount: result.relationshipCount + projection.observed.relationshipCount,
    }),
    { nodeCount: 0, relationshipCount: 0 },
  );
  const unknown = rows(await session.run(
    `MATCH (n)
     WHERE any(label IN labels(n) WHERE label IN $labels)
     UNWIND labels(n) AS label
     WITH DISTINCT label WHERE NOT label IN $labels
     RETURN collect(label) AS labels`,
    { labels: ALL_NODE_LABELS },
  ))[0];
  const ready = Object.values(projections).every((projection) => projection.ready)
    && totals.nodeCount === expectedTotals.nodeCount
    && totals.relationshipCount === expectedTotals.relationshipCount
    && unknown.labels.length === 0;
  return {
    schemaVersion: "seven-governors.neo4j-full-readiness.v1",
    releaseId: release.releaseId,
    ready,
    projections,
    totals: { ...totals, expected: expectedTotals },
    unknown,
  };
}

export async function bootstrapFullDatabase({
  driver,
  importDir,
  packageRoot,
  release,
  governorSnapshot,
  courtSnapshot,
  courtBatches,
  gov210Snapshot,
  gov210Batches,
  ingestionTemplateBaseline,
  database = "neo4j",
}) {
  if (
    !driver || !importDir || !packageRoot || !ingestionTemplateBaseline
    || typeof database !== "string" || !database
  ) {
    throw new Error("bootstrap_configuration_invalid");
  }
  stageNeo4jCsv({ importDir, packageRoot });
  const session = driver.session({ database, defaultAccessMode: neo4j.session.WRITE });
  const validations = {};
  try {
    await resetOwnedDatabase(session);
    await runCypherFile(session, packageRoot, paths.topologySchema);
    await runCypherFile(session, packageRoot, paths.topologyImport);
    validations.topology = await runValidationFile(
      session, packageRoot, paths.topologyValidation,
    );

    await runCypherFile(session, packageRoot, paths.provenanceImport);
    await bindCurrentRelease(session, release);
    validations.provenance = await runValidationFile(
      session, packageRoot, paths.provenanceValidation,
    );

    await runCypherFile(session, packageRoot, paths.mutationSchema);
    await runCypherFile(session, packageRoot, paths.mutationImport);
    validations.mutation = await runValidationFile(
      session, packageRoot, paths.mutationValidation,
    );

    await runCypherFile(session, packageRoot, paths.semanticSchema);
    await runCypherFile(session, packageRoot, paths.semanticImport);
    validations.semantic = await runValidationFile(
      session, packageRoot, paths.semanticValidation,
    );

    await runCypherFile(session, packageRoot, paths.governorSchema);
    await importGovernorSnapshot(session, governorSnapshot);

    await runCypherFile(session, packageRoot, paths.courtSchema, {
      allowCommunityExistenceConstraints: true,
    });
    const courtBatchFingerprint = await runTrustedBatches(
      session,
      courtBatches,
      "court",
      ingestionTemplateBaseline.namespaces.court,
    );
    validations.court = await runValidationFile(session, packageRoot, paths.courtValidation);

    await runCypherFile(session, packageRoot, paths.gov210Schema);
    const gov210IngestionBatches = gov210Batches.filter(
      (batch) => !String(batch.kind).startsWith("reset:"),
    );
    const gov210BatchFingerprint = await runTrustedBatches(
      session, gov210IngestionBatches, "gov210",
      ingestionTemplateBaseline.namespaces.gov210,
    );
    validations.gov210 = await runValidationFile(session, packageRoot, paths.gov210Validation);

    const readiness = await inspectFullDatabaseReadiness(session, {
      release,
      governorSnapshot,
      courtSnapshot,
      gov210Snapshot,
    });
    if (!readiness.ready) {
      throw new Error(`full_database_not_ready:${JSON.stringify(readiness)}`);
    }
    return {
      schemaVersion: "seven-governors.neo4j-bootstrap-result.v1",
      releaseId: release.releaseId,
      ready: true,
      batchFingerprints: {
        court: courtBatchFingerprint,
        gov210: gov210BatchFingerprint,
      },
      validationCounts: Object.fromEntries(
        Object.entries(validations).map(([key, value]) => [key, value.length]),
      ),
      readiness,
    };
  } finally {
    await session.close();
  }
}
