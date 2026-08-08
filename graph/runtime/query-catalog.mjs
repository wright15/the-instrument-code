/**
 * GOV-206 Named Query Catalog.
 *
 * Six allow-listed, parameterized, bounded, read-only named queries.
 * Each query has: parameter schema, result mode (scalar/tabular),
 * stable ORDER BY, row/byte/depth limits, and transaction timeout.
 *
 * No query accepts raw Cypher. No query can write, create, delete, or authorize.
 */

import { LIMITS, GOVERNORS, compareCodePoint } from "./canonical.mjs";

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;

function validateIdentifier(value, name) {
  if (typeof value !== "string" || !IDENTIFIER_PATTERN.test(value) || value.length > LIMITS.MAX_STRING_LENGTH) {
    return false;
  }
  return true;
}

export const QUERY_CATALOG = {
  aspect_context: {
    queryId: "aspect_context",
    queryVersion: "1.0.0",
    mode: "scalar",
    requiredParameters: ["aspectId"],
    optionalParameters: [],
    parameterTypes: { aspectId: "identifier" },
    maxRows: 1,
    maxDepth: 1,
    timeoutMs: LIMITS.NEO4J_TIMEOUT_MS,
    cypher: `
      MATCH (aspect:GovTypedAspect)
      WHERE aspect.aspectId = $aspectId
      OPTIONAL MATCH (release:GovRuntimePolicyRelease)-[decl:GOV_DECLARES_ASPECT]->(aspect)
      OPTIONAL MATCH (rule:GovBridgeRule)-[output:GOV_RULE_OUTPUT]->(aspect)
      OPTIONAL MATCH (aspect)-[derived:GOV_DERIVED_FROM_SOURCE]->(source:GovProvenanceSource)
      WITH aspect, collect(DISTINCT rule.logicalId) AS ruleLogicalIds, collect(DISTINCT source.logicalId) AS provenanceLogicalIds
      RETURN aspect.logicalId AS logicalId,
             aspect.aspectId AS aspectId,
             aspect.primaryGovernor AS primaryGovernor,
             aspect.admissionStatus AS admissionStatus,
             aspect.verificationStatus AS verificationStatus,
             ruleLogicalIds,
             provenanceLogicalIds,
             aspect.recordSha256 AS recordSha256
      ORDER BY logicalId
      LIMIT 1
    `,
    validateParams(params) {
      if (!validateIdentifier(params.aspectId, "aspectId")) return ["invalid_aspect_id"];
      return [];
    },
  },
  governor_profile: {
    queryId: "governor_profile",
    queryVersion: "1.0.0",
    mode: "scalar",
    requiredParameters: ["governor"],
    optionalParameters: [],
    parameterTypes: { governor: "governor" },
    maxRows: 1,
    maxDepth: 1,
    timeoutMs: LIMITS.NEO4J_TIMEOUT_MS,
    cypher: `
      MATCH (profile:GovGovernorProfileView {governor: $governor})
      OPTIONAL MATCH (aspect:GovTypedAspect)-[ref:GOV_REFERENCES_GOVERNOR]->(:GovGovernorReference {governor: $governor})
      OPTIONAL MATCH (rule:GovBridgeRule)-[ref2:GOV_REFERENCES_GOVERNOR]->(:GovGovernorReference {governor: $governor})
      OPTIONAL MATCH (profile)-[derived:GOV_DERIVED_FROM_SOURCE]->(source:GovProvenanceSource)
      WITH profile,
           collect(DISTINCT aspect.logicalId) AS aspectLogicalIds,
           collect(DISTINCT rule.logicalId) AS ruleLogicalIds,
           collect(DISTINCT source.logicalId) AS provenanceLogicalIds
      RETURN profile.logicalId AS logicalId,
             profile.profileId AS profileId,
             profile.profileVersion AS profileVersion,
             profile.releaseId AS releaseId,
             profile.governor AS governor,
             profile.profileFingerprint AS profileFingerprint,
             aspectLogicalIds,
             ruleLogicalIds,
             provenanceLogicalIds
      ORDER BY logicalId
      LIMIT 1
    `,
    validateParams(params) {
      if (!GOVERNORS.includes(params.governor)) return ["invalid_governor"];
      return [];
    },
  },
  rule_explanation: {
    queryId: "rule_explanation",
    queryVersion: "1.0.0",
    mode: "scalar",
    requiredParameters: ["ruleId"],
    optionalParameters: [],
    parameterTypes: { ruleId: "identifier" },
    maxRows: 1,
    maxDepth: 1,
    timeoutMs: LIMITS.NEO4J_TIMEOUT_MS,
    cypher: `
      MATCH (rule:GovBridgeRule)
      WHERE rule.ruleId = $ruleId
      OPTIONAL MATCH (:GovRuntimePolicyRelease)-[declaration:GOV_DECLARES_RULE]->(rule)
      OPTIONAL MATCH (rule)-[output:GOV_RULE_OUTPUT]->(aspect:GovTypedAspect)
      OPTIONAL MATCH (rule)-[derived:GOV_DERIVED_FROM_SOURCE]->(source:GovProvenanceSource)
      WITH rule,
           declaration.active AS active,
           aspect.logicalId AS outputAspectLogicalId,
           collect(DISTINCT source.logicalId) AS provenanceLogicalIds
      RETURN rule.logicalId AS logicalId,
             rule.ruleId AS ruleId,
             rule.ruleScope AS ruleScope,
             rule.admissionStatus AS admissionStatus,
             active AS active,
             rule.causalClaim AS causalClaim,
             outputAspectLogicalId,
             rule.primaryGovernor AS primaryGovernor,
             rule.antecedentIds AS antecedentIds,
             provenanceLogicalIds,
             rule.recordSha256 AS recordSha256
      ORDER BY logicalId
      LIMIT 1
    `,
    validateParams(params) {
      if (!validateIdentifier(params.ruleId, "ruleId")) return ["invalid_rule_id"];
      return [];
    },
  },
  legal_move_context: {
    queryId: "legal_move_context",
    queryVersion: "1.0.0",
    mode: "tabular",
    requiredParameters: ["snapshotId"],
    optionalParameters: [],
    parameterTypes: { snapshotId: "identifier" },
    maxRows: LIMITS.MAX_ROWS,
    maxDepth: 1,
    timeoutMs: LIMITS.NEO4J_TIMEOUT_MS,
    cypher: `
      MATCH (snapshot:GovLedgerSnapshot)-[has:GOV_SNAPSHOT_HAS_MOVE]->(move:GovLegalMoveView)
      WHERE snapshot.snapshotSha256 = $snapshotId OR snapshot.logicalId = $snapshotId
      RETURN move.logicalId AS logicalId,
             snapshot.logicalId AS snapshotLogicalId,
             move.operationId AS operationId,
             move.capability AS capability,
             move.moveSha256 AS moveSha256,
             move.priorStateSha256 AS priorStateSha256,
             move.policyFingerprint AS policyFingerprint,
             move.contextualOnly AS contextualOnly,
             move.executionAuthority AS executionAuthority,
             move.requiresFreshValidation AS requiresFreshValidation
      ORDER BY logicalId
      LIMIT 100
    `,
    validateParams(params) {
      if (!validateIdentifier(params.snapshotId, "snapshotId")) return ["invalid_snapshot_id"];
      return [];
    },
    columns: [
      "logicalId", "snapshotLogicalId", "operationId", "capability",
      "moveSha256", "priorStateSha256", "policyFingerprint",
      "contextualOnly", "executionAuthority", "requiresFreshValidation",
    ],
  },
  provenance_path: {
    queryId: "provenance_path",
    queryVersion: "1.0.0",
    mode: "tabular",
    requiredParameters: ["logicalId"],
    optionalParameters: ["maxDepth"],
    parameterTypes: { logicalId: "identifier", maxDepth: "integer" },
    maxRows: LIMITS.MAX_ROWS,
    maxDepth: LIMITS.MAX_DEPTH,
    timeoutMs: LIMITS.NEO4J_TIMEOUT_MS,
    cypher: `
      MATCH path = (source)-[r*1..3]->(target)
      WHERE source.logicalId = $logicalId
        AND ALL(rel IN relationships(path) WHERE type(rel) IN [
          'GOV_DECLARES_ASPECT','GOV_DECLARES_RULE','GOV_RULE_OUTPUT',
          'GOV_SUPPORTED_BY','GOV_DERIVED_FROM_SOURCE','GOV_SNAPSHOT_HAS_MOVE','GOV_REFERENCES_GOVERNOR'
        ])
        AND length(path) <= $maxDepth
      WITH source, target, relationships(path) AS rels, nodes(path) AS pathNodes
      RETURN source.logicalId AS sourceLogicalId,
             target.logicalId AS targetLogicalId,
             size(rels) AS depth,
             [n IN pathNodes | n.logicalId] AS pathLogicalIds,
             [r IN rels | type(r)] AS relationshipTypes
      ORDER BY sourceLogicalId, targetLogicalId, depth, pathLogicalIds
      LIMIT 100
    `,
    validateParams(params) {
      const errors = [];
      if (!validateIdentifier(params.logicalId, "logicalId")) errors.push("invalid_logical_id");
      if (params.maxDepth !== undefined) {
        if (!Number.isInteger(params.maxDepth) || params.maxDepth < 1 || params.maxDepth > LIMITS.MAX_DEPTH) {
          errors.push("invalid_max_depth");
        }
      }
      return errors;
    },
    columns: ["sourceLogicalId", "targetLogicalId", "depth", "pathLogicalIds", "relationshipTypes"],
  },
  prior_verified_outcomes: {
    queryId: "prior_verified_outcomes",
    queryVersion: "1.0.0",
    mode: "tabular",
    requiredParameters: ["taskId"],
    optionalParameters: ["limit"],
    parameterTypes: { taskId: "identifier", limit: "integer" },
    maxRows: LIMITS.MAX_ROWS,
    maxDepth: 1,
    timeoutMs: LIMITS.NEO4J_TIMEOUT_MS,
    cypher: `
      MATCH (snapshot:GovLedgerSnapshot)
      WHERE snapshot.taskId = $taskId AND snapshot.lifecycleVerified = true
       RETURN snapshot.logicalId AS logicalId,
             snapshot.snapshotSha256 AS snapshotSha256,
             snapshot.taskId AS taskId,
             snapshot.phase AS phase,
             snapshot.revision AS revision,
             snapshot.eventCount AS eventCount,
             snapshot.stateSha256 AS stateSha256,
             snapshot.ledgerHeadSha256 AS ledgerHeadSha256,
             snapshot.verificationStatus AS verificationStatus
       ORDER BY revision, logicalId
       LIMIT $limit
    `,
    validateParams(params) {
      const errors = [];
      if (!validateIdentifier(params.taskId, "taskId")) errors.push("invalid_task_id");
      if (params.limit !== undefined) {
        if (!Number.isInteger(params.limit) || params.limit < 1 || params.limit > LIMITS.MAX_ROWS) {
          errors.push("invalid_limit");
        }
      }
      return errors;
    },
    columns: [
      "logicalId", "snapshotSha256", "taskId", "phase",
      "revision", "eventCount", "stateSha256", "ledgerHeadSha256", "verificationStatus",
    ],
  },
};

export const QUERY_IDS = Object.keys(QUERY_CATALOG);

export function getQuerySpec(queryId) {
  return QUERY_CATALOG[queryId] || null;
}

export function normalizeParams(queryId, params) {
  const spec = getQuerySpec(queryId);
  if (!spec) return null;
  const normalized = {};
  for (const key of spec.requiredParameters) {
    normalized[key] = params[key];
  }
  for (const key of spec.optionalParameters) {
    if (params[key] !== undefined) normalized[key] = params[key];
  }
  return normalized;
}
