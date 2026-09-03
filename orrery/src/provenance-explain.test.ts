import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MAX_DEPTH,
  NAMED_QUERY_REQUEST_SCHEMA_VERSION,
  NAMED_QUERY_RESPONSE_SCHEMA_VERSION,
  PROVENANCE_QUERY_IDS,
  ProvenanceCompatibilityError,
  ProvenanceExplainError,
  ProvenanceUnavailableError,
  buildNamedQueryRequest,
  classifyProvenanceState,
  fetchNamedQuery,
  governorQueryEndpoint,
  orderProvenancePathRows,
  parseNamedQueryResponse,
  provenancePathSteps,
  type NamedQueryResponse,
  type ProvenancePathRow,
} from "./provenance-explain";

function ruleExplanationResponse(): NamedQueryResponse {
  return {
    schemaVersion: NAMED_QUERY_RESPONSE_SCHEMA_VERSION,
    queryId: "rule_explanation",
    queryVersion: "1.0.0",
    projectionFingerprint: "a".repeat(64),
    requestFingerprint: "b".repeat(64),
    resultFingerprint: "c".repeat(64),
    data: {
      mode: "scalar",
      value: {
        logicalId: "rule:jupiter:declared-wavelength:v1",
        ruleId: "rule:jupiter:declared-wavelength:v1",
        ruleScope: "declared-wavelength",
        admissionStatus: "canonical",
        active: true,
        outputAspectLogicalId: "aspect:jupiter:declared-wavelength:v1",
        primaryGovernor: "Jupiter",
        antecedentIds: ["aspect:jupiter:wavelength:v1"],
        provenanceLogicalIds: ["source:photonic-records.json"],
        recordSha256: "d".repeat(64),
        causalClaim: false,
      },
    },
  };
}

function provenancePathRows(): ProvenancePathRow[] {
  return [
    {
      sourceLogicalId: "aspect:jupiter:declared-wavelength:v1",
      targetLogicalId: "source:photonic-records.json",
      depth: 1,
      pathLogicalIds: ["aspect:jupiter:declared-wavelength:v1", "source:photonic-records.json"],
      relationshipTypes: ["GOV_DERIVED_FROM_SOURCE"],
    },
    {
      sourceLogicalId: "aspect:jupiter:declared-wavelength:v1",
      targetLogicalId: "rule:jupiter:declared-wavelength:v1",
      depth: 2,
      pathLogicalIds: [
        "aspect:jupiter:declared-wavelength:v1",
        "rule:jupiter:declared-wavelength:v1",
        "source:photonic-records.json",
      ],
      relationshipTypes: ["GOV_RULE_OUTPUT", "GOV_DERIVED_FROM_SOURCE"],
    },
  ];
}

describe("provenance explain bounded-query contract", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("exposes exactly the three allowed named-query contracts", () => {
    expect(PROVENANCE_QUERY_IDS).toEqual(["rule_explanation", "legal_move_context", "provenance_path"]);
  });

  it("builds a bounded request with no forbidden keys", () => {
    const request = buildNamedQueryRequest("rule_explanation", { ruleId: "rule:jupiter:wavelength:v1" });
    expect(request.schemaVersion).toBe(NAMED_QUERY_REQUEST_SCHEMA_VERSION);
    expect(request.queryId).toBe("rule_explanation");
    expect(request.parameters).toEqual({ ruleId: "rule:jupiter:wavelength:v1" });
    expect(JSON.stringify(request)).not.toContain("cypher");
  });

  it("rejects unknown query IDs and forbidden keys", () => {
    expect(() => buildNamedQueryRequest("aspect_context", { aspectId: "x" })).toThrow(ProvenanceExplainError);
    expect(() => buildNamedQueryRequest("provenance_path", { logicalId: "x", cypher: "MATCH (n)" })).toThrow(
      ProvenanceExplainError,
    );
    expect(() => buildNamedQueryRequest("provenance_path", { logicalId: "x", provider: "neo4j" })).toThrow(
      ProvenanceExplainError,
    );
    expect(() => buildNamedQueryRequest("legal_move_context", { snapshotId: "s", credentials: "secret" })).toThrow(
      ProvenanceExplainError,
    );
    expect(() => buildNamedQueryRequest("provenance_path", { logicalId: "x", write: true })).toThrow(
      ProvenanceExplainError,
    );
  });

  it("rejects unknown parameters and invalid identifiers", () => {
    expect(() => buildNamedQueryRequest("rule_explanation", { ruleId: "x", extra: 1 })).toThrow(
      ProvenanceExplainError,
    );
    expect(() => buildNamedQueryRequest("provenance_path", {})).toThrow(ProvenanceExplainError);
    expect(() => buildNamedQueryRequest("provenance_path", { logicalId: "bad id" })).toThrow(
      ProvenanceExplainError,
    );
    expect(() =>
      buildNamedQueryRequest("provenance_path", { logicalId: "x", maxDepth: 99 }),
    ).toThrow(ProvenanceExplainError);
  });

  it("parses a scalar rule_explanation response and preserves authority status", () => {
    const response = parseNamedQueryResponse(ruleExplanationResponse(), "rule_explanation");
    expect(response.data.mode).toBe("scalar");
    if (response.data.mode === "scalar") {
      expect(response.data.value?.admissionStatus).toBe("canonical");
      expect(response.data.value?.causalClaim).toBe(false);
    }
  });

  it("rejects mismatched response queryId and out-of-bound rows/depth", () => {
    const scalar = ruleExplanationResponse();
    expect(() => parseNamedQueryResponse(scalar, "provenance_path")).toThrow(ProvenanceCompatibilityError);

    const tooDeep = {
      ...ruleExplanationResponse(),
      queryId: "provenance_path",
      data: {
        mode: "tabular",
        columns: ["sourceLogicalId", "targetLogicalId", "depth", "pathLogicalIds", "relationshipTypes"],
        rowCount: 1,
        rows: [
          {
            sourceLogicalId: "a",
            targetLogicalId: "b",
            depth: MAX_DEPTH + 1,
            pathLogicalIds: ["a", "b"],
            relationshipTypes: ["GOV_SUPPORTED_BY"],
          },
        ],
      },
    };
    expect(() => parseNamedQueryResponse(tooDeep, "provenance_path")).toThrow(ProvenanceExplainError);
  });

  it("orders provenance paths deterministically", () => {
    const rows = provenancePathRows();
    const reversed = [...rows].reverse();
    expect(orderProvenancePathRows(reversed)).toEqual(orderProvenancePathRows(rows));
    expect(orderProvenancePathRows(rows).map((r) => r.targetLogicalId)).toEqual([
      "rule:jupiter:declared-wavelength:v1",
      "source:photonic-records.json",
    ]);
  });

  it("renders provenance steps with source identity and non-inferential authority", () => {
    const steps = provenancePathSteps(provenancePathRows());
    expect(steps).toHaveLength(2);
    expect(steps[0]).toEqual({
      sourceIdentity: "aspect:jupiter:declared-wavelength:v1",
      targetIdentity: "rule:jupiter:declared-wavelength:v1",
      relationship: "GOV_RULE_OUTPUT → GOV_DERIVED_FROM_SOURCE",
      authorityStatus: "source-identified relationship; not an admission",
      depth: 2,
    });
  });

  it("classifies success, empty, unavailable, incompatible, and invalid states", () => {
    expect(classifyProvenanceState(ruleExplanationResponse(), null)).toBe("success");
    expect(
      classifyProvenanceState({ ...ruleExplanationResponse(), data: { mode: "scalar", value: null } }, null),
    ).toBe("empty");
    expect(classifyProvenanceState(null, new ProvenanceExplainError("bad"))).toBe("invalid");
    expect(classifyProvenanceState(null, new ProvenanceCompatibilityError("version"))).toBe("incompatible");
    expect(classifyProvenanceState(null, new TypeError("offline"))).toBe("unavailable");
    expect(classifyProvenanceState(null, new ProvenanceUnavailableError("503"))).toBe("unavailable");
  });

  it("never submits raw Cypher, credentials, or a write operation", async () => {
    const seenBodies: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        seenBodies.push(String(init?.body ?? ""));
        return new Response(
          JSON.stringify({
            ...ruleExplanationResponse(),
            data: { mode: "scalar", value: null },
          }),
          { status: 200 },
        );
      }),
    );
    await fetchNamedQuery("rule_explanation", { ruleId: "rule:x" });
    expect(seenBodies).toHaveLength(1);
    const body = seenBodies[0];
    expect(body).not.toContain("cypher");
    expect(body).not.toContain("CREATE");
    expect(body).not.toContain("MERGE");
    expect(body).not.toContain("password");
    expect(body).not.toContain("provider");
    const parsed = JSON.parse(body);
    expect(parsed.method).toBeUndefined();
    expect(parsed.queryId).toBe("rule_explanation");
  });

  it("uses the governor-query endpoint derived from the API base", () => {
    expect(governorQueryEndpoint()).toBe("/api/governor-query");
  });

  it("classifies an unavailable projection and an incompatible release from fetch", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 503 })));
    await expect(fetchNamedQuery("rule_explanation", { ruleId: "rule:x" })).rejects.toBeInstanceOf(
      ProvenanceUnavailableError,
    );

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ...ruleExplanationResponse(), schemaVersion: "gov-206.named-query-response.v2" }),
          { status: 200 },
        ),
      ),
    );
    await expect(fetchNamedQuery("rule_explanation", { ruleId: "rule:x" })).rejects.toBeInstanceOf(
      ProvenanceCompatibilityError,
    );
  });
});
