/**
 * GOV-206 projection contracts, builder, and semantic validator.
 *
 * The projection builder consumes trusted inputs (frozen policy release,
 * verified classification results, and verified runtime export) and produces
 * a canonical graph snapshot with stable logical IDs, strict namespace
 * isolation, and deterministic fingerprints.
 *
 * Negative boundaries enforced here:
 * - No ScaleState.office, OCCUPIES_OFFICE, or degreeGovernor fields.
 * - Only Gov* labels and GOV_* relationship types.
 * - Legal moves are contextual-only with zero execution authority.
 * - No Neo4j internal IDs, validation tokens, or private state data.
 */

import {
  compareCodePoint,
  canonicalize,
  canonicalJsonBytes,
  sha256,
  GOV_206_SCHEMA_VERSION,
  NODE_LABELS,
  RELATIONSHIP_TYPES,
  GOVERNORS,
  ADMISSION_STATUSES,
  VERIFICATION_STATUSES,
  PROHIBITED_FIELDS,
  LIMITS,
} from "./canonical.mjs";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;

function assert(condition, code, detail) {
  if (!condition) throw new ProjectionError(code, detail);
}

export class ProjectionError extends Error {
  constructor(code, detail) {
    super(`${code}${detail ? ": " + JSON.stringify(detail) : ""}`);
    this.code = code;
    this.detail = detail;
  }
}

function checkProhibited(value, path = "") {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) checkProhibited(value[i], `${path}[${i}]`);
    return;
  }
  for (const key of Object.keys(value)) {
    if (PROHIBITED_FIELDS.has(key)) {
      throw new ProjectionError("projection_reserved_field", { path: `${path}.${key}`, field: key });
    }
    checkProhibited(value[key], `${path}.${key}`);
  }
}

function sortById(items) {
  return [...items].sort((a, b) => compareCodePoint(a.logicalId, b.logicalId));
}

function sortEdges(items) {
  return [...items].sort((a, b) => compareCodePoint(a.logicalId, b.logicalId));
}

function normalizeIdArray(arr) {
  const set = new Set(arr);
  return [...set].sort(compareCodePoint);
}

function sha256Field(value) {
  return sha256(value);
}

function governorRef(gov) {
  return {
    logicalId: `gov:ref:${gov}`,
    label: "GovGovernorReference",
    projectionFingerprint: null,
    sourceFingerprint: null,
    policyFingerprint: null,
    recordSha256: sha256({ governor: gov }),
    admissionStatus: "not_applicable",
    verificationStatus: "not_applicable",
    properties: { governor: gov },
  };
}

function profileView(profile, projectionFp, sourceFp, policyFp) {
  return {
    logicalId: `gov:profile:${profile.governor}`,
    label: "GovGovernorProfileView",
    projectionFingerprint: projectionFp,
    sourceFingerprint: sourceFp,
    policyFingerprint: policyFp,
    recordSha256: null,
    admissionStatus: profile.admissionStatus || "canonical",
    verificationStatus: "not_applicable",
    properties: {
      profileId: profile.profileId,
      profileVersion: profile.profileVersion,
      releaseId: profile.releaseId,
      governor: profile.governor,
      profileFingerprint: profile.profileFingerprint,
    },
  };
}

function provenanceSource(sourceId, contentSha, runtimeAuthority, projectionFp, sourceFp, policyFp) {
  return {
    logicalId: `gov:src:${sourceId}`,
    label: "GovProvenanceSource",
    projectionFingerprint: projectionFp,
    sourceFingerprint: sourceFp,
    policyFingerprint: policyFp,
    recordSha256: sha256({ sourceId, contentSha256: contentSha, runtimeAuthority }),
    admissionStatus: "not_applicable",
    verificationStatus: "not_applicable",
    properties: {
      sourceId,
      contentSha256: contentSha,
      runtimeAuthority,
    },
  };
}

function typedAspectNode(aspect, projectionFp, sourceFp, policyFp) {
  const props = {
    aspectId: aspect.aspectId,
    aspectVersion: aspect.aspectVersion,
    facetPath: aspect.facetPath,
    featureId: aspect.featureId,
    ownerScope: aspect.ownerScope,
    valueContractId: aspect.valueContractId,
    epistemicClass: aspect.epistemicClass,
    primaryGovernor: aspect.primaryGovernor,
  };
  return {
    logicalId: `gov:aspect:${aspect.aspectId}`,
    label: "GovTypedAspect",
    projectionFingerprint: projectionFp,
    sourceFingerprint: sourceFp,
    policyFingerprint: policyFp,
    recordSha256: null,
    admissionStatus: aspect.admission || "proposed",
    verificationStatus: "not_applicable",
    properties: props,
  };
}

function bridgeRuleNode(rule, projectionFp, sourceFp, policyFp) {
  const props = {
    ruleId: rule.ruleId,
    ruleVersion: rule.ruleVersion,
    ruleScope: rule.ruleScope,
    epistemicClass: rule.epistemicClass,
    priority: rule.priority,
    missingPolicy: rule.missingPolicy,
    conflictPolicy: rule.conflictPolicy,
    causalClaim: false,
    outputAspectId: rule.output.aspectId,
    primaryGovernor: rule.output.primaryGovernor,
    antecedentIds: normalizeIdArray(rule.antecedents.map((a) => a.antecedentId)),
    authoritySourceIds: normalizeIdArray(rule.authoritySourceIds),
  };
  return {
    logicalId: `gov:rule:${rule.ruleId}`,
    label: "GovBridgeRule",
    projectionFingerprint: projectionFp,
    sourceFingerprint: sourceFp,
    policyFingerprint: policyFp,
    recordSha256: null,
    admissionStatus: rule.admission || "proposed",
    verificationStatus: "not_applicable",
    properties: props,
  };
}

function classificationEvidenceNode(result, projectionFp, sourceFp, policyFp) {
  const facet = result.facetResults[0] || result.facetResults.find((f) => f.outcome === "classified");
  const candidates = (result.facetResults || [])
    .filter((f) => f.outcome === "ambiguous")
    .flatMap((f) => f.candidates || []);
  const props = {
    evidenceId: `gov:evidence:${result.resultFingerprint}`,
    resultFingerprint: result.resultFingerprint,
    requestFingerprint: result.requestFingerprint,
    subjectId: result.subjectId,
    facetId: facet ? facet.facetId : (result.facetResults[0] || {}).facetId,
    requestedAspectId: facet ? facet.requestedAspectId : (result.facetResults[0] || {}).requestedAspectId,
    outcome: facet ? facet.outcome : (result.facetResults[0] || {}).outcome,
    ruleIds: normalizeIdArray(
      (facet && facet.evidencePaths ? facet.evidencePaths : []).map((e) => e.ruleId),
    ),
    factIds: normalizeIdArray(
      (facet && facet.evidencePaths ? facet.evidencePaths : []).flatMap((e) => e.factIds || []),
    ),
    provenanceSourceIds: normalizeIdArray(
      (facet && facet.evidencePaths ? facet.evidencePaths : []).flatMap((e) => e.provenanceSourceIds || []),
    ),
    candidates: (candidates || []).map((c) => ({
      aspectId: c.aspectId,
      primaryGovernor: c.primaryGovernor,
      ruleIds: normalizeIdArray(c.ruleIds || []),
    })),
    reasonCodes: normalizeIdArray(
      result.facetResults
        ? result.facetResults.filter((f) => f.outcome === "unresolved" || f.outcome === "invalid").map((f) => f.reasonCodes || []).flat()
        : [],
    ),
  };
  if (facet && facet.outcome === "classified") {
    props.aspectId = facet.aspectId;
    props.primaryGovernor = facet.primaryGovernor;
  }
  return {
    logicalId: `gov:evidence:${result.resultFingerprint}`,
    label: "GovClassificationEvidence",
    projectionFingerprint: projectionFp,
    sourceFingerprint: sourceFp,
    policyFingerprint: policyFp,
    recordSha256: null,
    admissionStatus: "not_applicable",
    verificationStatus: "verified",
    properties: props,
  };
}

function ledgerSnapshotNode(snapshotExport, projectionFp, sourceFp, policyFp) {
  const snap = snapshotExport.runtimeSnapshot;
  return {
    logicalId: `gov:snapshot:${snap.snapshotSha256}`,
    label: "GovLedgerSnapshot",
    projectionFingerprint: projectionFp,
    sourceFingerprint: sourceFp,
    policyFingerprint: policyFp,
    recordSha256: null,
    admissionStatus: "not_applicable",
    verificationStatus: "verified",
    properties: {
      snapshotSha256: snap.snapshotSha256,
      stateSha256: snap.stateSha256,
      ledgerHeadSha256: snap.ledgerHeadSha256,
      eventCount: snap.eventCount,
      taskId: snap.taskId,
      phase: snap.phase,
      revision: snap.revision,
      capabilities: normalizeIdArray(snap.capabilities),
      ledgerVerified: true,
      lifecycleVerified: snap.lifecycleVerified,
    },
  };
}

function legalMoveNode(move, snapshotLogicalId, projectionFp, sourceFp, policyFp) {
  return {
    logicalId: `gov:move:${move.moveSha256}`,
    label: "GovLegalMoveView",
    projectionFingerprint: projectionFp,
    sourceFingerprint: sourceFp,
    policyFingerprint: policyFp,
    recordSha256: null,
    admissionStatus: "not_applicable",
    verificationStatus: "not_applicable",
    properties: {
      operationId: move.operationId,
      capability: move.capability,
      moveSha256: move.moveSha256,
      priorStateSha256: move.priorStateSha256,
      policyFingerprint: move.policyFingerprint,
      contextualOnly: true,
      executionAuthority: "none",
      requiresFreshValidation: true,
    },
  };
}

function makeEdge(logicalId, relType, sourceId, sourceLabel, targetId, targetLabel, properties, fp, sfp, pfp, admission, verification) {
  return {
    logicalId,
    relationshipType: relType,
    sourceLogicalId: sourceId,
    sourceLabel,
    targetLogicalId: targetId,
    targetLabel,
    projectionFingerprint: fp,
    sourceFingerprint: sfp,
    policyFingerprint: pfp,
    recordSha256: null,
    admissionStatus: admission || "not_applicable",
    verificationStatus: verification || "not_applicable",
    properties: properties || {},
  };
}

/**
 * Build a canonical graph snapshot from trusted inputs.
 *
 * @param {object} policyRelease - The frozen GOV-202 policy-release.json (read-only).
 * @param {array} classificationResults - Trusted ClassificationResult documents (pre-validated).
 * @param {object} runtimeExport - A verified runtime export document from graph_export.py.
 * @param {array} profiles - Governor profile views (optional, defaults to empty).
 * @param {array} provenanceSources - Provenance source records (optional).
 * @returns {object} A canonical graph snapshot with deterministic fingerprints.
 */
export function buildGraphSnapshot({ policyRelease, classificationResults = [], runtimeExport = null, profiles = [], provenanceSources = [] }) {
  const sourceFingerprint = policyRelease.sourceFingerprint;
  const policyFingerprint = policyRelease.policyFingerprint;

  const nodes = [];
  const edges = [];
  const governorRefs = new Map();
  const sourceNodes = new Map();

  // Policy release node
  const releaseNode = {
    logicalId: `gov:policy:${policyRelease.releaseId}`,
    label: "GovRuntimePolicyRelease",
    projectionFingerprint: null,
    sourceFingerprint,
    policyFingerprint,
    recordSha256: null,
    admissionStatus: policyRelease.releaseAdmission || "proposed",
    verificationStatus: "not_applicable",
    properties: {
      releaseId: policyRelease.releaseId,
      schemaVersion: policyRelease.schemaVersion,
      packageVersion: policyRelease.packageVersion,
      releaseAdmission: policyRelease.releaseAdmission || "proposed",
      activeAspectIds: normalizeIdArray(policyRelease.activeAspectIds),
      activeRuleIds: normalizeIdArray(policyRelease.activeRuleIds),
    },
  };
  nodes.push(releaseNode);

  // Provenance source nodes
  for (const src of provenanceSources) {
    const node = provenanceSource(src.sourceId, src.contentSha256, src.runtimeAuthority, null, sourceFingerprint, policyFingerprint);
    sourceNodes.set(src.sourceId, node);
    nodes.push(node);
  }

  // Typed aspect nodes
  const activeAspectIds = new Set(policyRelease.activeAspectIds);
  for (const aspect of policyRelease.typedAspects) {
    const node = typedAspectNode(aspect, null, sourceFingerprint, policyFingerprint);
    node.admissionStatus = activeAspectIds.has(aspect.aspectId) ? "canonical" : (aspect.admission || "proposed");
    nodes.push(node);
    edges.push(makeEdge(
      `gov:e:declares-aspect:${aspect.aspectId}`,
      "GOV_DECLARES_ASPECT",
      releaseNode.logicalId, "GovRuntimePolicyRelease",
      node.logicalId, "GovTypedAspect",
      { active: activeAspectIds.has(aspect.aspectId) },
      null, sourceFingerprint, policyFingerprint,
      "canonical", "not_applicable",
    ));
    // Governor reference
    if (!governorRefs.has(aspect.primaryGovernor)) {
      governorRefs.set(aspect.primaryGovernor, governorRef(aspect.primaryGovernor));
    }
    const govRef = governorRefs.get(aspect.primaryGovernor);
    edges.push(makeEdge(
      `gov:e:ref-gov:${aspect.aspectId}`,
      "GOV_REFERENCES_GOVERNOR",
      node.logicalId, "GovTypedAspect",
      govRef.logicalId, "GovGovernorReference",
      { referenceKind: "aspect_primary_governor" },
      null, sourceFingerprint, policyFingerprint,
      "not_applicable", "not_applicable",
    ));
    // Provenance edges
    for (const prov of aspect.provenance || []) {
      if (sourceNodes.has(prov.sourceId)) {
        edges.push(makeEdge(
          `gov:e:src:${aspect.aspectId}:${prov.sourceId}`,
          "GOV_DERIVED_FROM_SOURCE",
          node.logicalId, "GovTypedAspect",
          sourceNodes.get(prov.sourceId).logicalId, "GovProvenanceSource",
          { sourcePointer: prov.pointer || "/" },
          null, sourceFingerprint, policyFingerprint,
          "not_applicable", "not_applicable",
        ));
      }
    }
  }

  // Bridge rule nodes
  const activeRuleIds = new Set(policyRelease.activeRuleIds);
  for (const rule of policyRelease.bridgeRules) {
    const node = bridgeRuleNode(rule, null, sourceFingerprint, policyFingerprint);
    node.admissionStatus = activeRuleIds.has(rule.ruleId) ? "canonical" : (rule.admission || "proposed");
    nodes.push(node);
    edges.push(makeEdge(
      `gov:e:declares-rule:${rule.ruleId}`,
      "GOV_DECLARES_RULE",
      releaseNode.logicalId, "GovRuntimePolicyRelease",
      node.logicalId, "GovBridgeRule",
      { active: activeRuleIds.has(rule.ruleId) },
      null, sourceFingerprint, policyFingerprint,
      "canonical", "not_applicable",
    ));
    // Rule output edge
    const aspectLogicalId = `gov:aspect:${rule.output.aspectId}`;
    edges.push(makeEdge(
      `gov:e:rule-output:${rule.ruleId}`,
      "GOV_RULE_OUTPUT",
      node.logicalId, "GovBridgeRule",
      aspectLogicalId, "GovTypedAspect",
      {},
      null, sourceFingerprint, policyFingerprint,
      "not_applicable", "not_applicable",
    ));
    // Governor reference for rule
    if (!governorRefs.has(rule.output.primaryGovernor)) {
      governorRefs.set(rule.output.primaryGovernor, governorRef(rule.output.primaryGovernor));
    }
    const govRef = governorRefs.get(rule.output.primaryGovernor);
    edges.push(makeEdge(
      `gov:e:ref-gov-rule:${rule.ruleId}`,
      "GOV_REFERENCES_GOVERNOR",
      node.logicalId, "GovBridgeRule",
      govRef.logicalId, "GovGovernorReference",
      { referenceKind: "rule_output_governor" },
      null, sourceFingerprint, policyFingerprint,
      "not_applicable", "not_applicable",
    ));
  }

  // Classification evidence nodes
  for (const result of classificationResults) {
    const node = classificationEvidenceNode(result, null, sourceFingerprint, policyFingerprint);
    nodes.push(node);
    // Supported by evidence
    for (const ruleId of node.properties.ruleIds) {
      edges.push(makeEdge(
        `gov:e:supported:${ruleId}:${node.logicalId}`,
        "GOV_SUPPORTED_BY",
        `gov:rule:${ruleId}`, "GovBridgeRule",
        node.logicalId, "GovClassificationEvidence",
        { evidenceRole: "rule_evidence" },
        null, sourceFingerprint, policyFingerprint,
        "not_applicable", "verified",
      ));
    }
    // Governor reference
    if (node.properties.primaryGovernor) {
      if (!governorRefs.has(node.properties.primaryGovernor)) {
        governorRefs.set(node.properties.primaryGovernor, governorRef(node.properties.primaryGovernor));
      }
      const govRef = governorRefs.get(node.properties.primaryGovernor);
      edges.push(makeEdge(
        `gov:e:ref-gov-evi:${node.logicalId}`,
        "GOV_REFERENCES_GOVERNOR",
        node.logicalId, "GovClassificationEvidence",
        govRef.logicalId, "GovGovernorReference",
        { referenceKind: "classification_governor" },
        null, sourceFingerprint, policyFingerprint,
        "not_applicable", "not_applicable",
      ));
    }
  }

  // Profile view nodes
  for (const profile of profiles) {
    const node = profileView(profile, null, sourceFingerprint, policyFingerprint);
    nodes.push(node);
    if (!governorRefs.has(profile.governor)) {
      governorRefs.set(profile.governor, governorRef(profile.governor));
    }
    const govRef = governorRefs.get(profile.governor);
    edges.push(makeEdge(
      `gov:e:ref-gov-profile:${profile.governor}`,
      "GOV_REFERENCES_GOVERNOR",
      node.logicalId, "GovGovernorProfileView",
      govRef.logicalId, "GovGovernorReference",
      { referenceKind: "profile_governor" },
      null, sourceFingerprint, policyFingerprint,
      "not_applicable", "not_applicable",
    ));
  }

  // Add all governor reference nodes (deduplicated)
  for (const govRef of governorRefs.values()) {
    nodes.push(govRef);
  }

  // Runtime ledger snapshot + legal moves
  if (runtimeExport) {
    const snapNode = ledgerSnapshotNode(runtimeExport, null, sourceFingerprint, policyFingerprint);
    nodes.push(snapNode);
    for (const move of runtimeExport.legalMoves || []) {
      const moveNode = legalMoveNode(move, snapNode.logicalId, null, sourceFingerprint, policyFingerprint);
      nodes.push(moveNode);
      edges.push(makeEdge(
        `gov:e:snapshot-move:${move.moveSha256}`,
        "GOV_SNAPSHOT_HAS_MOVE",
        snapNode.logicalId, "GovLedgerSnapshot",
        moveNode.logicalId, "GovLegalMoveView",
        { contextualOnly: true, executionAuthority: "none" },
        null, sourceFingerprint, policyFingerprint,
        "not_applicable", "not_applicable",
      ));
    }
  }

  // Sort nodes and edges
  const sortedNodes = sortById(nodes);
  const sortedEdges = sortEdges(edges);

  // Phase 1: Compute projection identity fingerprint (P1) from core body
  // excluding per-node projectionFingerprint and recordSha256.
  const p1Nodes = sortedNodes.map((n) => {
    const { projectionFingerprint, recordSha256, ...rest } = n;
    return rest;
  });
  const p1Edges = sortedEdges.map((e) => {
    const { projectionFingerprint, recordSha256, ...rest } = e;
    return rest;
  });
  const projectionId = `gov-206-projection`;
  const counts = computeCounts(sortedNodes, sortedEdges);
  const p1Core = {
    schemaVersion: GOV_206_SCHEMA_VERSION,
    projectionId,
    sourceFingerprint,
    policyFingerprint,
    classificationResultFingerprints: classificationResults.map((r) => r.resultFingerprint),
    runtimeSnapshotFingerprints: runtimeExport ? [runtimeExport.runtimeSnapshot.snapshotSha256] : [],
    nodes: p1Nodes,
    edges: p1Edges,
    counts,
  };
  const p1 = sha256(p1Core);

  // Phase 2: Set P1 on all nodes/edges, compute recordSha256 (includes P1)
  for (const node of sortedNodes) {
    node.projectionFingerprint = p1;
    const { recordSha256, ...rest } = node;
    node.recordSha256 = sha256(rest);
  }
  for (const edge of sortedEdges) {
    edge.projectionFingerprint = p1;
    const { recordSha256, ...rest } = edge;
    edge.recordSha256 = sha256(rest);
  }

  // Phase 3: Compute root projection fingerprint (P2) from full core body
  // (includes per-node P1 and recordSha256 values)
  const p2Core = {
    schemaVersion: GOV_206_SCHEMA_VERSION,
    projectionId,
    sourceFingerprint,
    policyFingerprint,
    classificationResultFingerprints: classificationResults.map((r) => r.resultFingerprint),
    runtimeSnapshotFingerprints: runtimeExport ? [runtimeExport.runtimeSnapshot.snapshotSha256] : [],
    nodes: sortedNodes,
    edges: sortedEdges,
    counts,
  };
  const projectionFingerprint = sha256(p2Core);

  const snapshot = {
    schemaVersion: GOV_206_SCHEMA_VERSION,
    projectionId,
    projectionFingerprint,
    sourceFingerprint,
    policyFingerprint,
    classificationResultFingerprints: classificationResults.map((r) => r.resultFingerprint),
    runtimeSnapshotFingerprints: runtimeExport ? [runtimeExport.runtimeSnapshot.snapshotSha256] : [],
    nodes: sortedNodes,
    edges: sortedEdges,
    counts,
  };

  return snapshot;
}

function computeCounts(nodes, edges) {
  const byLabel = {};
  const byRelationship = {};
  for (const label of NODE_LABELS) byLabel[label] = 0;
  for (const rel of RELATIONSHIP_TYPES) byRelationship[rel] = 0;
  for (const node of nodes) byLabel[node.label] = (byLabel[node.label] || 0) + 1;
  for (const edge of edges) byRelationship[edge.relationshipType] = (byRelationship[edge.relationshipType] || 0) + 1;
  return {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    byLabel,
    byRelationship,
  };
}

/**
 * Validate a graph snapshot semantically (beyond JSON Schema shape).
 * Returns an array of error codes (empty = valid).
 */
export function validateGraphSnapshot(snapshot) {
  const errors = [];

  // Check prohibited fields recursively
  try {
    checkProhibited(snapshot, "root");
  } catch (e) {
    errors.push(e.code);
  }

  // Node logical ID uniqueness
  const nodeIds = new Set();
  for (const node of snapshot.nodes || []) {
    if (nodeIds.has(node.logicalId)) errors.push("duplicate_node_logical_id");
    nodeIds.add(node.logicalId);
    if (!NODE_LABELS.includes(node.label)) errors.push(`invalid_node_label:${node.label}`);
    if (!ADMISSION_STATUSES.includes(node.admissionStatus)) errors.push("invalid_admission_status");
    if (!VERIFICATION_STATUSES.includes(node.verificationStatus)) errors.push("invalid_verification_status");
    if (!SHA256_PATTERN.test(node.projectionFingerprint || "")) errors.push("node_projection_fingerprint_invalid");
  }

  // Edge logical ID uniqueness
  const edgeIds = new Set();
  const nodeIdSet = new Set(snapshot.nodes.map((n) => n.logicalId));
  for (const edge of snapshot.edges || []) {
    if (edgeIds.has(edge.logicalId)) errors.push("duplicate_edge_logical_id");
    edgeIds.add(edge.logicalId);
    if (!RELATIONSHIP_TYPES.includes(edge.relationshipType)) errors.push(`invalid_relationship_type:${edge.relationshipType}`);
    if (!nodeIdSet.has(edge.sourceLogicalId)) errors.push("edge_source_dangling");
    if (!nodeIdSet.has(edge.targetLogicalId)) errors.push("edge_target_dangling");
  }

  // Root fingerprint recompute
  const { projectionFingerprint, ...core } = snapshot;
  if (sha256(core) !== projectionFingerprint) errors.push("projection_fingerprint_mismatch");

  return errors;
}

export function serializeSnapshot(snapshot) {
  return canonicalJsonBytes(snapshot);
}