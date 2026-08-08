import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Canonical JSON and SHA-256 helpers for the GOV-206 graph runtime.
 * Mirrors src/governor/hashing.py exactly: code-point sorted keys, lowercase
 * booleans/null, compact UTF-8 bytes, NaN/Inf rejection, no trailing whitespace.
 */

export function compareCodePoint(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function canonicalizeValue(value) {
  if (value === null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("non_finite_number");
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }
  if (typeof value === "object" && value.constructor === Object) {
    const entries = Object.entries(value).sort(([a], [b]) => compareCodePoint(a, b));
    const result = {};
    for (const [key, child] of entries) {
      if (typeof key !== "string") throw new Error("json_object_key_must_be_string");
      result[key] = canonicalizeValue(child);
    }
    return result;
  }
  throw new Error(`unsupported_json_type:${typeof value}`);
}

export function canonicalize(value) {
  return canonicalizeValue(value);
}

export function canonicalJsonBytes(value) {
  return Buffer.from(JSON.stringify(canonicalizeValue(value)), "utf8");
}

export function canonicalCompact(value) {
  return JSON.stringify(canonicalizeValue(value));
}

export function sha256Bytes(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

export function sha256(value) {
  return sha256Bytes(canonicalJsonBytes(value));
}

export function readJson(absolutePath) {
  const text = fs.readFileSync(absolutePath, "utf8");
  return JSON.parse(text);
}

export function writeAtomic(absolutePath, text) {
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const tmp = `${absolutePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, absolutePath);
}

export const GOV_206_SCHEMA_VERSION = "gov-206.graph-snapshot.v1";
export const QUERY_REQUEST_SCHEMA_VERSION = "gov-206.named-query-request.v1";
export const QUERY_RESPONSE_SCHEMA_VERSION = "gov-206.named-query-response.v1";
export const QUERY_VERSION = "1.0.0";

export const NODE_LABELS = [
  "GovRuntimePolicyRelease",
  "GovTypedAspect",
  "GovBridgeRule",
  "GovClassificationEvidence",
  "GovLedgerSnapshot",
  "GovGovernorProfileView",
  "GovLegalMoveView",
  "GovProvenanceSource",
  "GovGovernorReference",
];

export const RELATIONSHIP_TYPES = [
  "GOV_DECLARES_ASPECT",
  "GOV_DECLARES_RULE",
  "GOV_RULE_OUTPUT",
  "GOV_SUPPORTED_BY",
  "GOV_DERIVED_FROM_SOURCE",
  "GOV_SNAPSHOT_HAS_MOVE",
  "GOV_REFERENCES_GOVERNOR",
];

export const GOVERNORS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export const ADMISSION_STATUSES = [
  "unresolved",
  "proposed",
  "fixture_supported",
  "provisionally_admitted",
  "canonical",
  "not_applicable",
];

export const VERIFICATION_STATUSES = ["verified", "unverified", "not_applicable"];

export const PROHIBITED_FIELDS = new Set([
  "office",
  "ScaleState.office",
  "scaleState.office",
  "scale_state_office",
  "occupiesOffice",
  "occupies_office",
  "OCCUPIES_OFFICE",
  "degreeGovernor",
  "degree_governor",
  "mutationDegreeGovernor",
  "neo4jId",
  "neo4j_id",
  "elementId",
  "element_id",
  "identity",
  "validationToken",
  "validation_token",
  "tokenId",
  "token_id",
  "authorizationToken",
]);

export const LIMITS = {
  MAX_REQUEST_BYTES: 16384,
  MAX_RESPONSE_BYTES: 262144,
  MAX_ROWS: 100,
  MAX_DEPTH: 3,
  NEO4J_TIMEOUT_MS: 1000,
  MAX_STRING_LENGTH: 256,
};