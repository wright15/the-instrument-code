/**
 * Neo4jProvider: executes catalog-owned parameterized Cypher through a READ session.
 *
 * No raw Cypher is accepted. Only queries from the catalog are executed.
 * Neo4j integers are normalized to safe integers. Provider identity and
 * timing are excluded from fingerprints.
 */

import neo4j from "neo4j-driver";
import {
  compareCodePoint,
  sha256,
  canonicalize,
  QUERY_RESPONSE_SCHEMA_VERSION,
  LIMITS,
} from "../canonical.mjs";
import { getQuerySpec, normalizeParams } from "../query-catalog.mjs";

function nativeInt(value) {
  if (neo4j.isInt(value)) {
    const n = value.toNumber();
    if (!Number.isSafeInteger(n)) throw new Error("integer_out_of_safe_range");
    return n;
  }
  return Number(value);
}

function normalizeValue(value) {
  if (value === null || value === undefined) return null;
  if (neo4j.isInt(value)) return nativeInt(value);
  if (Array.isArray(value)) return value.map(normalizeValue);
  if (typeof value === "object" && value.constructor === Object) {
    const result = {};
    for (const [key, child] of Object.entries(value)) {
      result[key] = normalizeValue(child);
    }
    return result;
  }
  return value;
}

function normalizeArray(arr) {
  return (arr || []).filter((v) => v !== null && v !== undefined).sort(compareCodePoint);
}

function normalizeRecord(record, queryId, spec) {
  const obj = {};
  for (const key of record.keys) {
    obj[key] = normalizeValue(record.get(key));
  }
  return obj;
}

function buildResponseData(queryId, spec, records) {
  const normalizedRecords = records.map((r) => normalizeRecord(r, queryId, spec));
  if (spec.mode === "scalar") {
    if (normalizedRecords.length === 0) return { mode: "scalar", value: null };
    const record = normalizedRecords[0];
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
  const rows = normalizedRecords.slice(0, spec.maxRows);
  return {
    mode: "tabular",
    columns: spec.columns,
    rowCount: rows.length,
    rows,
  };
}

export class Neo4jProvider {
  constructor({ uri, username, password, database = "neo4j", projectionFingerprint }) {
    this.uri = uri;
    this.username = username;
    this.password = password;
    this.database = database;
    this.projectionFingerprint = projectionFingerprint;
    this.providerName = "neo4j";
    this._driver = null;
  }

  _getDriver() {
    if (!this._driver) {
      this._driver = neo4j.driver(this.uri, neo4j.auth.basic(this.username, this.password));
    }
    return this._driver;
  }

  async executeNamedQuery(queryId, parameters, options = {}) {
    const spec = getQuerySpec(queryId);
    if (!spec) throw new Error(`unknown_query:${queryId}`);
    const normalized = normalizeParams(queryId, parameters);
    const projectionFp = options.projectionFingerprint || this.projectionFingerprint;
    if (!projectionFp) throw new Error("projection_fingerprint_required");

    const driver = this._getDriver();
    const session = driver.session({
      database: this.database,
      defaultAccessMode: neo4j.session.READ,
    });
    let records;
    try {
      records = await session.executeRead(
        (tx) => tx.run(spec.cypher, {
          ...normalized,
          maxDepth: neo4j.int(normalized.maxDepth || LIMITS.MAX_DEPTH),
          limit: neo4j.int(normalized.limit || 25),
        }),
        { timeout: spec.timeoutMs },
      );
    } finally {
      await session.close();
    }
    const data = buildResponseData(queryId, spec, records.records || []);
    return this._buildResponse(queryId, spec, normalized, data, projectionFp);
  }

  _buildResponse(queryId, spec, normalized, data, projectionFingerprint) {
    const requestFingerprintInput = {
      schemaVersion: QUERY_RESPONSE_SCHEMA_VERSION,
      queryId,
      queryVersion: spec.queryVersion,
      parameters: canonicalize(normalized),
      projectionFingerprint,
    };
    const requestFingerprint = sha256(requestFingerprintInput);
    const resultFingerprintInput = {
      schemaVersion: QUERY_RESPONSE_SCHEMA_VERSION,
      queryId,
      queryVersion: spec.queryVersion,
      projectionFingerprint,
      requestFingerprint,
      data: canonicalize(data),
    };
    const resultFingerprint = sha256(resultFingerprintInput);
    return {
      schemaVersion: QUERY_RESPONSE_SCHEMA_VERSION,
      queryId,
      queryVersion: spec.queryVersion,
      projectionFingerprint,
      requestFingerprint,
      resultFingerprint,
      data,
    };
  }

  async close() {
    if (this._driver) {
      await this._driver.close();
      this._driver = null;
    }
  }
}
