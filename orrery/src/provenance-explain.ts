export const PROVENANCE_QUERY_IDS = [
  "rule_explanation",
  "legal_move_context",
  "provenance_path",
] as const;

export type ProvenanceQueryId = (typeof PROVENANCE_QUERY_IDS)[number];

export const NAMED_QUERY_REQUEST_SCHEMA_VERSION = "gov-206.named-query-request.v1";
export const NAMED_QUERY_RESPONSE_SCHEMA_VERSION = "gov-206.named-query-response.v1";

export const MAX_ROWS = 100;
export const MAX_DEPTH = 3;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]*$/;

const FORBIDDEN_REQUEST_KEYS = new Set([
  "cypher",
  "provider",
  "query",
  "statement",
  "credential",
  "credentials",
  "password",
  "token",
  "write",
]);

type JsonRecord = Record<string, unknown>;

export class ProvenanceExplainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProvenanceExplainError";
  }
}

export class ProvenanceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProvenanceUnavailableError";
  }
}

export class ProvenanceCompatibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProvenanceCompatibilityError";
  }
}

export function isProvenanceQueryId(value: unknown): value is ProvenanceQueryId {
  return typeof value === "string" && (PROVENANCE_QUERY_IDS as readonly string[]).includes(value);
}

function validIdentifier(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 256 && IDENTIFIER_PATTERN.test(value);
}

interface QuerySpec {
  requiredParameters: readonly string[];
  optionalParameters: readonly string[];
  validateParams(parameters: Record<string, unknown>): string[];
}

const QUERY_SPECS: Record<ProvenanceQueryId, QuerySpec> = {
  rule_explanation: {
    requiredParameters: ["ruleId"],
    optionalParameters: [],
    validateParams(parameters) {
      return validIdentifier(parameters.ruleId) ? [] : ["invalid_rule_id"];
    },
  },
  legal_move_context: {
    requiredParameters: ["snapshotId"],
    optionalParameters: [],
    validateParams(parameters) {
      return validIdentifier(parameters.snapshotId) ? [] : ["invalid_snapshot_id"];
    },
  },
  provenance_path: {
    requiredParameters: ["logicalId"],
    optionalParameters: ["maxDepth"],
    validateParams(parameters) {
      const errors: string[] = [];
      if (!validIdentifier(parameters.logicalId)) errors.push("invalid_logical_id");
      if (parameters.maxDepth !== undefined) {
        const depth = parameters.maxDepth;
        if (typeof depth !== "number" || !Number.isInteger(depth) || depth < 1 || depth > MAX_DEPTH) {
          errors.push("invalid_max_depth");
        }
      }
      return errors;
    },
  },
};

export interface NamedQueryRequest {
  schemaVersion: typeof NAMED_QUERY_REQUEST_SCHEMA_VERSION;
  queryId: ProvenanceQueryId;
  parameters: Record<string, unknown>;
}

export function buildNamedQueryRequest(
  queryId: unknown,
  parameters: unknown,
): NamedQueryRequest {
  if (!isProvenanceQueryId(queryId)) {
    throw new ProvenanceExplainError(
      "The provenance surface may request only rule_explanation, legal_move_context, or provenance_path.",
    );
  }
  if (parameters === null || typeof parameters !== "object" || Array.isArray(parameters)) {
    throw new ProvenanceExplainError("Named-query parameters must be an object.");
  }
  for (const key of Object.keys(parameters as JsonRecord)) {
    if (FORBIDDEN_REQUEST_KEYS.has(key)) {
      throw new ProvenanceExplainError(`The key ${key} is not permitted in a named-query request.`);
    }
  }
  const spec = QUERY_SPECS[queryId];
  const allowedParameters = new Set([...spec.requiredParameters, ...spec.optionalParameters]);
  for (const key of Object.keys(parameters as JsonRecord)) {
    if (!allowedParameters.has(key)) {
      throw new ProvenanceExplainError(`Unknown parameter ${key} for ${queryId}.`);
    }
  }
  for (const key of spec.requiredParameters) {
    if (!(key in (parameters as JsonRecord))) {
      throw new ProvenanceExplainError(`Missing required parameter ${key} for ${queryId}.`);
    }
  }
  const errors = spec.validateParams(parameters as Record<string, unknown>);
  if (errors.length > 0) {
    throw new ProvenanceExplainError(errors[0]);
  }
  const normalized: Record<string, unknown> = {};
  for (const key of spec.requiredParameters) {
    normalized[key] = (parameters as JsonRecord)[key];
  }
  for (const key of spec.optionalParameters) {
    if ((parameters as JsonRecord)[key] !== undefined) {
      normalized[key] = (parameters as JsonRecord)[key];
    }
  }
  return {
    schemaVersion: NAMED_QUERY_REQUEST_SCHEMA_VERSION,
    queryId,
    parameters: normalized,
  };
}

export interface RuleExplanation {
  mode: "scalar";
  value: {
    logicalId: string;
    ruleId: string;
    ruleScope: string;
    admissionStatus: string;
    active: boolean;
    outputAspectLogicalId: string | null;
    primaryGovernor: string;
    antecedentIds: string[];
    provenanceLogicalIds: string[];
    recordSha256: string;
    causalClaim: boolean;
  } | null;
}

export interface LegalMoveContextRow {
  logicalId: string;
  snapshotLogicalId: string;
  operationId: string;
  capability: string;
  moveSha256: string;
  priorStateSha256: string;
  policyFingerprint: string;
  contextualOnly: boolean;
  executionAuthority: string;
  requiresFreshValidation: boolean;
}

export interface LegalMoveContext {
  mode: "tabular";
  columns: string[];
  rowCount: number;
  rows: LegalMoveContextRow[];
}

export interface ProvenancePathRow {
  sourceLogicalId: string;
  targetLogicalId: string;
  depth: number;
  pathLogicalIds: string[];
  relationshipTypes: string[];
}

export interface ProvenancePath {
  mode: "tabular";
  columns: string[];
  rowCount: number;
  rows: ProvenancePathRow[];
}

export type NamedQueryData = RuleExplanation | LegalMoveContext | ProvenancePath;

export interface NamedQueryResponse {
  schemaVersion: typeof NAMED_QUERY_RESPONSE_SCHEMA_VERSION;
  queryId: ProvenanceQueryId;
  queryVersion: string;
  projectionFingerprint: string;
  requestFingerprint: string;
  resultFingerprint: string;
  data: NamedQueryData;
}

function record(value: unknown, context: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ProvenanceExplainError(`${context} must be an object`);
  }
  return value as JsonRecord;
}

function string(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new ProvenanceExplainError(`${context} must be a non-empty string`);
  }
  return value;
}

function fingerprint(value: unknown, context: string): string {
  const parsed = string(value, context);
  if (!/^[a-f0-9]{64}$/.test(parsed)) {
    throw new ProvenanceExplainError(`${context} must be a SHA-256 fingerprint`);
  }
  return parsed;
}

function parseRuleExplanation(data: JsonRecord): RuleExplanation {
  const value = data.value;
  if (value === null) {
    return { mode: "scalar", value: null };
  }
  const item = record(value, "rule_explanation value");
  return {
    mode: "scalar",
    value: {
      logicalId: string(item.logicalId, "rule_explanation.logicalId"),
      ruleId: string(item.ruleId, "rule_explanation.ruleId"),
      ruleScope: string(item.ruleScope, "rule_explanation.ruleScope"),
      admissionStatus: string(item.admissionStatus, "rule_explanation.admissionStatus"),
      active: item.active === true,
      outputAspectLogicalId:
        item.outputAspectLogicalId === null || item.outputAspectLogicalId === undefined
          ? null
          : string(item.outputAspectLogicalId, "rule_explanation.outputAspectLogicalId"),
      primaryGovernor: string(item.primaryGovernor, "rule_explanation.primaryGovernor"),
      antecedentIds: (item.antecedentIds as unknown[]).map((v, i) => string(v, `rule_explanation.antecedentIds[${i}]`)),
      provenanceLogicalIds: (item.provenanceLogicalIds as unknown[]).map((v, i) =>
        string(v, `rule_explanation.provenanceLogicalIds[${i}]`),
      ),
      recordSha256: fingerprint(item.recordSha256, "rule_explanation.recordSha256"),
      causalClaim: item.causalClaim === true,
    },
  };
}

function parseTabularRows(data: JsonRecord, context: string): { columns: string[]; rowCount: number; rows: JsonRecord[] } {
  if (data.mode !== "tabular") {
    throw new ProvenanceExplainError(`${context} must be tabular`);
  }
  const columns = (data.columns as unknown[]).map((v, i) => string(v, `${context}.columns[${i}]`));
  const rows = data.rows as unknown[];
  if (!Array.isArray(rows)) {
    throw new ProvenanceExplainError(`${context}.rows must be an array`);
  }
  if (rows.length > MAX_ROWS) {
    throw new ProvenanceExplainError(`${context} exceeds the MAX_ROWS bound of ${MAX_ROWS}`);
  }
  const rowCount = Number(data.rowCount);
  if (!Number.isInteger(rowCount) || rowCount > MAX_ROWS) {
    throw new ProvenanceExplainError(`${context}.rowCount exceeds the MAX_ROWS bound of ${MAX_ROWS}`);
  }
  return { columns, rowCount, rows: rows.map((r, i) => record(r, `${context}.rows[${i}]`)) };
}

function parseProvenancePath(data: JsonRecord): ProvenancePath {
  const { columns, rowCount, rows } = parseTabularRows(data, "provenance_path");
  const parsedRows = rows.map((row, index) => {
    const depth = Number(row.depth);
    if (!Number.isInteger(depth) || depth < 1 || depth > MAX_DEPTH) {
      throw new ProvenanceExplainError(`provenance_path.rows[${index}].depth exceeds MAX_DEPTH ${MAX_DEPTH}`);
    }
    const pathLogicalIds = (row.pathLogicalIds as unknown[]).map((v, i) =>
      string(v, `provenance_path.rows[${index}].pathLogicalIds[${i}]`),
    );
    const relationshipTypes = (row.relationshipTypes as unknown[]).map((v, i) =>
      string(v, `provenance_path.rows[${index}].relationshipTypes[${i}]`),
    );
    if (pathLogicalIds.length !== relationshipTypes.length + 1) {
      throw new ProvenanceExplainError(`provenance_path.rows[${index}] path and relationship lengths mismatch`);
    }
    return {
      sourceLogicalId: string(row.sourceLogicalId, `provenance_path.rows[${index}].sourceLogicalId`),
      targetLogicalId: string(row.targetLogicalId, `provenance_path.rows[${index}].targetLogicalId`),
      depth,
      pathLogicalIds,
      relationshipTypes,
    };
  });
  return { mode: "tabular", columns, rowCount, rows: parsedRows };
}

function parseLegalMoveContext(data: JsonRecord): LegalMoveContext {
  const { columns, rowCount, rows } = parseTabularRows(data, "legal_move_context");
  const parsedRows = rows.map((row, index) => {
    const contextualOnly = row.contextualOnly;
    const executionAuthority = string(row.executionAuthority, `legal_move_context.rows[${index}].executionAuthority`);
    return {
      logicalId: string(row.logicalId, `legal_move_context.rows[${index}].logicalId`),
      snapshotLogicalId: string(row.snapshotLogicalId, `legal_move_context.rows[${index}].snapshotLogicalId`),
      operationId: string(row.operationId, `legal_move_context.rows[${index}].operationId`),
      capability: string(row.capability, `legal_move_context.rows[${index}].capability`),
      moveSha256: fingerprint(row.moveSha256, `legal_move_context.rows[${index}].moveSha256`),
      priorStateSha256: fingerprint(row.priorStateSha256, `legal_move_context.rows[${index}].priorStateSha256`),
      policyFingerprint: fingerprint(row.policyFingerprint, `legal_move_context.rows[${index}].policyFingerprint`),
      contextualOnly: contextualOnly === true,
      executionAuthority,
      requiresFreshValidation: row.requiresFreshValidation === true,
    };
  });
  return { mode: "tabular", columns, rowCount, rows: parsedRows };
}

export function parseNamedQueryResponse(value: unknown, queryId: ProvenanceQueryId): NamedQueryResponse {
  const source = record(value, "named-query response");
  if (source.schemaVersion !== NAMED_QUERY_RESPONSE_SCHEMA_VERSION) {
    throw new ProvenanceCompatibilityError("Unsupported named-query response version");
  }
  const parsedQueryId = string(source.queryId, "named-query response queryId");
  if (parsedQueryId !== queryId) {
    throw new ProvenanceCompatibilityError("Named-query response queryId does not match the request");
  }
  const data = record(source.data, "named-query response data");
  let parsedData: NamedQueryData;
  if (queryId === "rule_explanation") {
    if (data.mode !== "scalar") {
      throw new ProvenanceExplainError("rule_explanation response must be scalar");
    }
    parsedData = parseRuleExplanation(data);
  } else if (queryId === "legal_move_context") {
    parsedData = parseLegalMoveContext(data);
  } else {
    parsedData = parseProvenancePath(data);
  }
  return {
    schemaVersion: NAMED_QUERY_RESPONSE_SCHEMA_VERSION,
    queryId,
    queryVersion: string(source.queryVersion, "named-query response queryVersion"),
    projectionFingerprint: fingerprint(source.projectionFingerprint, "named-query response projectionFingerprint"),
    requestFingerprint: fingerprint(source.requestFingerprint, "named-query response requestFingerprint"),
    resultFingerprint: fingerprint(source.resultFingerprint, "named-query response resultFingerprint"),
    data: parsedData,
  };
}

export function orderProvenancePathRows(rows: readonly ProvenancePathRow[]): ProvenancePathRow[] {
  return [...rows].sort((left, right) => {
    if (left.sourceLogicalId !== right.sourceLogicalId) {
      return left.sourceLogicalId < right.sourceLogicalId ? -1 : 1;
    }
    if (left.targetLogicalId !== right.targetLogicalId) {
      return left.targetLogicalId < right.targetLogicalId ? -1 : 1;
    }
    if (left.depth !== right.depth) {
      return left.depth - right.depth;
    }
    const leftPath = left.pathLogicalIds.join("|");
    const rightPath = right.pathLogicalIds.join("|");
    if (leftPath !== rightPath) {
      return leftPath < rightPath ? -1 : 1;
    }
    return 0;
  });
}

export interface ProvenancePathStep {
  sourceIdentity: string;
  targetIdentity: string;
  relationship: string;
  authorityStatus: string;
  depth: number;
}

export function provenancePathSteps(rows: readonly ProvenancePathRow[]): ProvenancePathStep[] {
  return orderProvenancePathRows(rows).map((row) => {
    const relationship = row.relationshipTypes.join(" → ");
    return {
      sourceIdentity: row.sourceLogicalId,
      targetIdentity: row.targetLogicalId,
      relationship,
      authorityStatus: "source-identified relationship; not an admission",
      depth: row.depth,
    };
  });
}

export function governorQueryEndpoint(): string {
  const baseUrl = (import.meta.env.VITE_ORRERY_API_BASE ?? "/api").replace(/\/$/, "");
  return `${baseUrl}/governor-query`;
}

export async function fetchNamedQuery(
  queryId: ProvenanceQueryId,
  parameters: Record<string, unknown>,
): Promise<NamedQueryResponse> {
  const request = buildNamedQueryRequest(queryId, parameters);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    let response: Response;
    try {
      response = await fetch(governorQueryEndpoint(), {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
    } catch {
      throw new ProvenanceUnavailableError(
        controller.signal.aborted
          ? "Provenance query timed out"
          : "Provenance query could not reach the API",
      );
    }
    if (!response.ok) {
      throw new ProvenanceUnavailableError(`Provenance query failed (${response.status})`);
    }
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ProvenanceCompatibilityError("Provenance query response was not valid JSON");
    }
    return parseNamedQueryResponse(payload, queryId);
  } finally {
    clearTimeout(timeout);
  }
}

export const PROVENANCE_LABELS = {
  admissionStatus: "Admission status",
  provenance: "Provenance",
  unavailable: "Projection unavailable",
  incompatible: "Projection update required",
  empty: "No provenance path is available for this logical identifier",
} as const;

export type ProvenanceSurfaceState = "success" | "unavailable" | "incompatible" | "invalid" | "empty";

export function classifyProvenanceState(
  response: NamedQueryResponse | null,
  error: unknown,
): ProvenanceSurfaceState {
  if (error) {
    if (error instanceof ProvenanceCompatibilityError) {
      return "incompatible";
    }
    if (error instanceof ProvenanceExplainError) {
      return "invalid";
    }
    return "unavailable";
  }
  if (!response) {
    return "empty";
  }
  if (response.data.mode === "scalar" && response.data.value === null) {
    return "empty";
  }
  if (response.data.mode === "tabular" && response.data.rows.length === 0) {
    return "empty";
  }
  return "success";
}
