/**
 * GOV-206 Query API handler.
 *
 * Validates incoming named-query requests with strict schema enforcement,
 * enforces hard limits (request body, response size, rows, depth, timeout),
 * and delegates to the selected provider.
 *
 * Negative boundaries:
 * - No `cypher` parameter accepted.
 * - No `provider` selection from client.
 * - No raw query passthrough.
 * - Unknown properties rejected at every level.
 */

import {
  LIMITS,
  QUERY_REQUEST_SCHEMA_VERSION,
  QUERY_RESPONSE_SCHEMA_VERSION,
  compareCodePoint,
  sha256,
  canonicalize,
  canonicalJsonBytes,
} from "./canonical.mjs";
import { QUERY_CATALOG, getQuerySpec, normalizeParams } from "./query-catalog.mjs";

const QUERY_IDS = Object.keys(QUERY_CATALOG);
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;
const GOVERNORS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

export class QueryError extends Error {
  constructor(code, detail) {
    super(code);
    this.code = code;
    this.detail = detail;
  }
}

function validateRequest(body) {
  if (typeof body !== "object" || body === null) {
    throw new QueryError("invalid_request_body");
  }
  if (body.schemaVersion !== QUERY_REQUEST_SCHEMA_VERSION) {
    throw new QueryError("schema_version_mismatch");
  }
  if (typeof body.queryId !== "string" || !QUERY_IDS.includes(body.queryId)) {
    throw new QueryError("unknown_query_id");
  }
  if (typeof body.parameters !== "object" || body.parameters === null) {
    throw new QueryError("invalid_parameters");
  }
  // Reject cypher anywhere (must fire before unknown-property check)
  if ("cypher" in body || "cypher" in body.parameters) {
    throw new QueryError("raw_cypher_rejected");
  }
  // Reject provider selection (must fire before unknown-property check)
  if ("provider" in body) {
    throw new QueryError("provider_selection_rejected");
  }
  // Reject unknown top-level properties
  const allowedTop = new Set(["schemaVersion", "queryId", "parameters"]);
  for (const key of Object.keys(body)) {
    if (!allowedTop.has(key)) throw new QueryError("unknown_request_property");
  }

  const spec = getQuerySpec(body.queryId);
  const allowedParams = new Set([...spec.requiredParameters, ...spec.optionalParameters]);
  for (const key of Object.keys(body.parameters)) {
    if (!allowedParams.has(key)) throw new QueryError("unknown_parameter");
  }
  for (const key of spec.requiredParameters) {
    if (!(key in body.parameters)) throw new QueryError("missing_required_parameter");
  }

  // Type-check parameters
  const normalized = normalizeParams(body.queryId, body.parameters);
  const paramErrors = spec.validateParams(normalized);
  if (paramErrors.length > 0) {
    throw new QueryError(paramErrors[0]);
  }

  // Apply defaults
  if (body.queryId === "provenance_path" && normalized.maxDepth === undefined) {
    normalized.maxDepth = LIMITS.MAX_DEPTH;
  }
  if (body.queryId === "prior_verified_outcomes" && normalized.limit === undefined) {
    normalized.limit = 25;
  }

  return normalized;
}

/**
 * Handle a named query request.
 *
 * @param {Buffer|string|object} requestBody - Raw HTTP body.
 * @param {object} provider - A provider instance with executeNamedQuery().
 * @param {string} projectionFingerprint - The current projection fingerprint.
 * @returns {object} The canonical query response.
 */
export async function handleNamedQueryRequest(requestBody, provider, projectionFingerprint) {
  // Enforce request body size limit
  let bodyBytes;
  if (Buffer.isBuffer(requestBody)) {
    bodyBytes = requestBody;
  } else if (typeof requestBody === "string") {
    bodyBytes = Buffer.from(requestBody, "utf8");
  } else if (typeof requestBody === "object") {
    bodyBytes = canonicalJsonBytes(requestBody);
  } else {
    throw new QueryError("invalid_request_body");
  }

  if (bodyBytes.length > LIMITS.MAX_REQUEST_BYTES) {
    throw new QueryError("request_too_large");
  }

  let parsed;
  try {
    parsed = JSON.parse(bodyBytes.toString("utf8"));
  } catch {
    throw new QueryError("invalid_json");
  }

  const normalized = validateRequest(parsed);
  const queryId = parsed.queryId;
  const response = await provider.executeNamedQuery(queryId, normalized, { projectionFingerprint });

  // Enforce response size limit
  const responseBytes = canonicalJsonBytes(response);
  if (responseBytes.length > LIMITS.MAX_RESPONSE_BYTES) {
    throw new QueryError("response_too_large");
  }

  return response;
}

/**
 * Send a JSON HTTP response.
 */
export function sendJson(response, status, value) {
  const payload = Buffer.from(JSON.stringify(value, null, 2) + "\n");
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": payload.length,
  });
  response.end(payload);
}

/**
 * Handle the /api/governor-query route in an HTTP server.
 */
export async function handleGovernorQueryRoute(request, response, provider, projectionFingerprint) {
  if (request.method !== "POST") {
    response.setHeader("allow", "POST");
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const chunks = [];
  let totalBytes = 0;
  let aborted = false;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > LIMITS.MAX_REQUEST_BYTES) {
      aborted = true;
      sendJson(response, 413, { error: "request_too_large" });
      request.destroy();
      break;
    }
    chunks.push(chunk);
  }

  if (aborted) return;

  const body = Buffer.concat(chunks);
  try {
    const result = await handleNamedQueryRequest(body, provider, projectionFingerprint);
    sendJson(response, 200, result);
  } catch (error) {
    if (error instanceof QueryError) {
      sendJson(response, 400, { error: error.code });
    } else {
      sendJson(response, 500, { error: "internal_error" });
    }
  }
}