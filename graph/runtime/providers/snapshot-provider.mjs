/**
 * SnapshotProvider: executes named queries against an immutable in-memory graph snapshot.
 *
 * All responses are normalized canonically (code-point sorted keys, Neo4j integer
 * normalization, no timing/provider identity) so fingerprints match exactly across
 * SnapshotProvider, FileProvider, and Neo4jProvider.
 */

import {
  compareCodePoint,
  sha256,
  canonicalize,
  GOV_206_SCHEMA_VERSION,
  QUERY_RESPONSE_SCHEMA_VERSION,
  QUERY_VERSION,
} from "../canonical.mjs";
import { getQuerySpec, normalizeParams } from "../query-catalog.mjs";

function nativeInt(value) {
  if (value !== null && typeof value === "object" && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value);
}

function normalizeArray(arr) {
  return (arr || []).filter((v) => v !== null && v !== undefined).sort(compareCodePoint);
}

function buildResponseData(queryId, spec, records) {
  if (spec.mode === "scalar") {
    if (!records || records.length === 0) {
      return { mode: "scalar", value: null };
    }
    const record = records[0];
    if (queryId === "aspect_context") {
      return {
        mode: "scalar",
        value: {
          logicalId: record.logicalId,
          aspectId: record.aspectId,
          primaryGovernor: record.primaryGovernor,
          admissionStatus: record.admissionStatus,
          verificationStatus: record.verificationStatus,
          ruleLogicalIds: normalizeArray(record.ruleLogicalIds),
          provenanceLogicalIds: normalizeArray(record.provenanceLogicalIds),
          recordSha256: record.recordSha256,
        },
      };
    }
    if (queryId === "governor_profile") {
      return {
        mode: "scalar",
        value: {
          logicalId: record.logicalId,
          profileId: record.profileId,
          profileVersion: record.profileVersion,
          releaseId: record.releaseId,
          governor: record.governor,
          profileFingerprint: record.profileFingerprint,
          aspectLogicalIds: normalizeArray(record.aspectLogicalIds),
          ruleLogicalIds: normalizeArray(record.ruleLogicalIds),
          provenanceLogicalIds: normalizeArray(record.provenanceLogicalIds),
        },
      };
    }
    if (queryId === "rule_explanation") {
      return {
        mode: "scalar",
        value: {
          logicalId: record.logicalId,
          ruleId: record.ruleId,
          ruleScope: record.ruleScope,
          admissionStatus: record.admissionStatus,
          active: record.active === true,
          outputAspectLogicalId: record.outputAspectLogicalId,
          primaryGovernor: record.primaryGovernor,
          antecedentIds: normalizeArray(record.antecedentIds),
          provenanceLogicalIds: normalizeArray(record.provenanceLogicalIds),
          recordSha256: record.recordSha256,
          causalClaim: record.causalClaim === true,
        },
      };
    }
  }
  // tabular
  const rows = (records || []).slice(0, spec.maxRows);
  return {
    mode: "tabular",
    columns: spec.columns,
    rowCount: rows.length,
    rows,
  };
}

export class SnapshotProvider {
  constructor(snapshot) {
    this.snapshot = snapshot;
    this.nodeById = new Map((snapshot.nodes || []).map((n) => [n.logicalId, n]));
    this.nodesByLabel = {};
    for (const node of snapshot.nodes || []) {
      if (!this.nodesByLabel[node.label]) this.nodesByLabel[node.label] = [];
      this.nodesByLabel[node.label].push(node);
    }
    this.edges = snapshot.edges || [];
    this.providerName = "snapshot";
  }

  async executeNamedQuery(queryId, parameters, { projectionFingerprint } = {}) {
    const spec = getQuerySpec(queryId);
    if (!spec) throw new Error(`unknown_query:${queryId}`);
    const normalized = normalizeParams(queryId, parameters);
    const records = this._queryInMemory(queryId, spec, normalized);
    const data = buildResponseData(queryId, spec, records);
    return this._buildResponse(queryId, spec, normalized, data, projectionFingerprint);
  }

  _queryInMemory(queryId, spec, params) {
    if (queryId === "aspect_context") {
      const aspects = this.nodesByLabel["GovTypedAspect"] || [];
      const aspect = aspects.find((n) => n.properties.aspectId === params.aspectId);
      if (!aspect) return [];
      const ruleIds = this.edges
        .filter((e) => e.relationshipType === "GOV_RULE_OUTPUT" && e.targetLogicalId === aspect.logicalId)
        .map((e) => e.sourceLogicalId);
      const provenanceIds = this.edges
        .filter((e) => e.relationshipType === "GOV_DERIVED_FROM_SOURCE" && e.sourceLogicalId === aspect.logicalId)
        .map((e) => e.targetLogicalId);
      return [{
        logicalId: aspect.logicalId,
        aspectId: aspect.properties.aspectId,
        primaryGovernor: aspect.properties.primaryGovernor,
        admissionStatus: aspect.admissionStatus,
        verificationStatus: aspect.verificationStatus,
        ruleLogicalIds: normalizeArray(ruleIds),
        provenanceLogicalIds: normalizeArray(provenanceIds),
        recordSha256: aspect.recordSha256,
      }];
    }
    if (queryId === "governor_profile") {
      const profiles = this.nodesByLabel["GovGovernorProfileView"] || [];
      const profile = profiles.find((n) => n.properties.governor === params.governor);
      if (!profile) return [];
      const aspectIds = this.edges
        .filter((e) => e.relationshipType === "GOV_REFERENCES_GOVERNOR" && e.targetLabel === "GovGovernorReference")
        .filter((e) => {
          const govRef = this.nodeById.get(e.targetLogicalId);
          return govRef && govRef.properties.governor === params.governor;
        })
        .map((e) => e.sourceLogicalId)
        .filter((lid) => {
          const node = this.nodeById.get(lid);
          return node && node.label === "GovTypedAspect";
        });
      const ruleIds = this.edges
        .filter((e) => e.relationshipType === "GOV_REFERENCES_GOVERNOR" && e.targetLabel === "GovGovernorReference")
        .filter((e) => {
          const govRef = this.nodeById.get(e.targetLogicalId);
          return govRef && govRef.properties.governor === params.governor;
        })
        .map((e) => e.sourceLogicalId)
        .filter((lid) => {
          const node = this.nodeById.get(lid);
          return node && node.label === "GovBridgeRule";
        });
      const provenanceIds = this.edges
        .filter((e) => e.relationshipType === "GOV_DERIVED_FROM_SOURCE" && e.sourceLogicalId === profile.logicalId)
        .map((e) => e.targetLogicalId);
      return [{
        logicalId: profile.logicalId,
        profileId: profile.properties.profileId,
        profileVersion: profile.properties.profileVersion,
        releaseId: profile.properties.releaseId,
        governor: profile.properties.governor,
        profileFingerprint: profile.properties.profileFingerprint,
        aspectLogicalIds: normalizeArray(aspectIds),
        ruleLogicalIds: normalizeArray(ruleIds),
        provenanceLogicalIds: normalizeArray(provenanceIds),
      }];
    }
    if (queryId === "rule_explanation") {
      const rules = this.nodesByLabel["GovBridgeRule"] || [];
      const rule = rules.find((n) => n.properties.ruleId === params.ruleId);
      if (!rule) return [];
      const declarationEdge = this.edges.find(
        (e) => e.relationshipType === "GOV_DECLARES_RULE" && e.targetLogicalId === rule.logicalId,
      );
      const outputEdge = this.edges.find((e) => e.relationshipType === "GOV_RULE_OUTPUT" && e.sourceLogicalId === rule.logicalId);
      const provenanceIds = this.edges
        .filter((e) => e.relationshipType === "GOV_DERIVED_FROM_SOURCE" && e.sourceLogicalId === rule.logicalId)
        .map((e) => e.targetLogicalId);
      return [{
        logicalId: rule.logicalId,
        ruleId: rule.properties.ruleId,
        ruleScope: rule.properties.ruleScope,
        admissionStatus: rule.admissionStatus,
        active: declarationEdge?.properties.active === true,
        causalClaim: rule.properties.causalClaim,
        outputAspectLogicalId: outputEdge ? outputEdge.targetLogicalId : null,
        primaryGovernor: rule.properties.primaryGovernor,
        antecedentIds: normalizeArray(rule.properties.antecedentIds),
        provenanceLogicalIds: normalizeArray(provenanceIds),
        recordSha256: rule.recordSha256,
      }];
    }
    if (queryId === "legal_move_context") {
      const snapshots = this.nodesByLabel["GovLedgerSnapshot"] || [];
      const snapshot = snapshots.find((n) => n.properties.snapshotSha256 === params.snapshotId || n.logicalId === params.snapshotId);
      if (!snapshot) return [];
      const moveEdges = this.edges
        .filter((e) => e.relationshipType === "GOV_SNAPSHOT_HAS_MOVE" && e.sourceLogicalId === snapshot.logicalId)
        .sort((a, b) => compareCodePoint(a.targetLogicalId, b.targetLogicalId));
      return moveEdges.map((e) => {
        const move = this.nodeById.get(e.targetLogicalId);
        return {
          logicalId: move.logicalId,
          snapshotLogicalId: snapshot.logicalId,
          operationId: move.properties.operationId,
          capability: move.properties.capability,
          moveSha256: move.properties.moveSha256,
          priorStateSha256: move.properties.priorStateSha256,
          policyFingerprint: move.properties.policyFingerprint,
          contextualOnly: true,
          executionAuthority: "none",
          requiresFreshValidation: true,
        };
      });
    }
    if (queryId === "provenance_path") {
      const maxDepth = params.maxDepth || 3;
      const results = [];
      const startNode = this.nodeById.get(params.logicalId);
      if (!startNode) return [];
      this._dfs(params.logicalId, [startNode.logicalId], [], maxDepth, results);
      results.sort((a, b) => {
        const c = compareCodePoint(a.sourceLogicalId, b.sourceLogicalId);
        if (c !== 0) return c;
        const c2 = compareCodePoint(a.targetLogicalId, b.targetLogicalId);
        if (c2 !== 0) return c2;
        if (a.depth !== b.depth) return a.depth - b.depth;
        return compareCodePoint(a.pathLogicalIds.join("|"), b.pathLogicalIds.join("|"));
      });
      return results.slice(0, 100);
    }
    if (queryId === "prior_verified_outcomes") {
      const snapshots = this.nodesByLabel["GovLedgerSnapshot"] || [];
      const matching = snapshots
        .filter((n) => n.properties.taskId === params.taskId && n.properties.lifecycleVerified === true)
        .sort((a, b) => {
          if (a.properties.revision !== b.properties.revision) return a.properties.revision - b.properties.revision;
          return compareCodePoint(a.logicalId, b.logicalId);
        });
      return matching.map((n) => ({
        logicalId: n.logicalId,
        snapshotSha256: n.properties.snapshotSha256,
        taskId: n.properties.taskId,
        phase: n.properties.phase,
        revision: n.properties.revision,
        eventCount: n.properties.eventCount,
        stateSha256: n.properties.stateSha256,
        ledgerHeadSha256: n.properties.ledgerHeadSha256,
        verificationStatus: n.verificationStatus,
      })).slice(0, params.limit || 25);
    }
    return [];
  }

  _dfs(currentId, pathIds, relTypes, maxDepth, results) {
    if (pathIds.length - 1 >= maxDepth) return;
    const outEdges = this.edges.filter((e) => e.sourceLogicalId === currentId);
    for (const edge of outEdges) {
      const targetId = edge.targetLogicalId;
      if (pathIds.includes(targetId)) continue;
      const newPath = [...pathIds, targetId];
      const newRels = [...relTypes, edge.relationshipType];
      results.push({
        sourceLogicalId: pathIds[0],
        targetLogicalId: targetId,
        depth: newPath.length - 1,
        pathLogicalIds: newPath,
        relationshipTypes: newRels,
      });
      this._dfs(targetId, newPath, newRels, maxDepth, results);
    }
  }

  _buildResponse(queryId, spec, normalized, data, projectionFingerprint) {
    const requestFingerprintInput = {
      schemaVersion: QUERY_RESPONSE_SCHEMA_VERSION,
      queryId,
      queryVersion: spec.queryVersion,
      parameters: canonicalize(normalized),
      projectionFingerprint: projectionFingerprint || this.snapshot.projectionFingerprint,
    };
    const requestFingerprint = sha256(requestFingerprintInput);
    const resultFingerprintInput = {
      schemaVersion: QUERY_RESPONSE_SCHEMA_VERSION,
      queryId,
      queryVersion: spec.queryVersion,
      projectionFingerprint: projectionFingerprint || this.snapshot.projectionFingerprint,
      requestFingerprint,
      data: canonicalize(data),
    };
    const resultFingerprint = sha256(resultFingerprintInput);
    return {
      schemaVersion: QUERY_RESPONSE_SCHEMA_VERSION,
      queryId,
      queryVersion: spec.queryVersion,
      projectionFingerprint: projectionFingerprint || this.snapshot.projectionFingerprint,
      requestFingerprint,
      resultFingerprint,
      data,
    };
  }
}
