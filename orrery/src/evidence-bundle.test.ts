import { describe, expect, it } from "vitest";
import {
  EVIDENCE_BUNDLE,
  EvidenceBundleCompatibilityError,
  createEvidenceBundleIndex,
  parseEvidenceBundle,
} from "./evidence-bundle";
import { LEGAL_MOVE_CATALOG } from "./moves";
import type { NodesResponse, OrreryNode } from "./types";

function liveResponse(): NodesResponse {
  const records = EVIDENCE_BUNDLE.records;
  const nodes: OrreryNode[] = records.map((record) => ({
    state: {
      stateId: record.stateId,
      pitchMask: record.stateId,
      pitchClasses: record.pitchClasses,
      intervalVector: record.intervalVector,
      chirality: "achiral",
      nodeId: `scale:${record.stateId}`,
      name: record.name,
      forteFamily: record.forteFamily,
      tier: record.tier,
      role: "anchor",
    },
    resolution: { office: record.stateGovernor, officeBearing: true },
    photonic: {
      photonicId: `photonic:${record.stateGovernor.toLowerCase()}`,
      office: record.stateGovernor,
      representativeWavelengthNm: 400,
      photonicCompression: 0.5,
    },
    canonicalProfile: {
      profileId: `profile:${record.stateGovernor.toLowerCase()}`,
      profileVersion: "0.1.1",
      office: record.stateGovernor,
      domainReferences: { landforms: ["volcanic-plain"] },
    },
    scopedHarmonicDescriptor: {
      coordinateId: "harmonic.CH_A012_q_v1",
      status: "admitted_scoped_A012",
      stateGovernor: record.stateGovernor,
      weightedProjection: {
        numerator: record.weightedProjection.numerator,
        denominator: 407 as const,
      },
    },
  }));
  return {
    schemaVersion: "harmonic-orrery.nodes.v2",
    profileRegistryReleaseId: "canonical-profile-registry:0.1.1",
    harmonicDescriptor: {
      candidateId: "CH_A012_q_v1",
      coordinateId: "harmonic.CH_A012_q_v1",
      releaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
      status: "admitted_scoped_A012",
      candidateFingerprint: EVIDENCE_BUNDLE.harmonicDescriptorBinding.candidateFingerprint,
    },
    nodeCount: 21,
    nodes,
  };
}

describe("evidence bundle", () => {
  it("parses the bundled artifact strictly", () => {
    expect(EVIDENCE_BUNDLE.schemaVersion).toBe("harmonic-orrery.evidence-bundle.v1");
    expect(EVIDENCE_BUNDLE.records).toHaveLength(21);
    for (const tier of ["A0", "A1", "A2"]) {
      expect(EVIDENCE_BUNDLE.records.filter((record) => record.tier === tier)).toHaveLength(7);
    }
  });

  it("preserves uniquenessClaim=false and the qualified W_A012 wording", () => {
    expect(EVIDENCE_BUNDLE.method.uniquenessClaim).toBe(false);
    for (const record of EVIDENCE_BUNDLE.records) {
      expect(record.wA012Wording).toBe("unique max-margin optimum under the declared objective");
      expect(record.weightedProjection.denominator).toBe(407);
    }
  });

  it("carries the certificate margin, slack, and rank-8 active-set label", () => {
    expect(EVIDENCE_BUNDLE.certificate.epsilonStar).toEqual({ numerator: 3, denominator: 407 });
    expect(EVIDENCE_BUNDLE.certificate.nextTightestSlack.pair).toBe("Acoustic-Phrygian");
    expect(EVIDENCE_BUNDLE.certificate.nextTightestSlack.numerator).toBe(6);
    expect(EVIDENCE_BUNDLE.certificate.tightSet).toHaveLength(7);
    expect(EVIDENCE_BUNDLE.certificate.activeSetLabel).toBe("active-set rank 8 (7 binding + normalization)");
  });

  it("enumerates all seven Q(S) positions per anchor", () => {
    for (const record of EVIDENCE_BUNDLE.records) {
      expect(record.triadicCompressionSignature).toHaveLength(7);
      for (const value of record.triadicCompressionSignature) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(3);
      }
    }
  });

  it("keeps the global C_H guard unresolved null", () => {
    expect(EVIDENCE_BUNDLE.globalAggregate.namespace).toBe("harmonic.C_H");
    expect(EVIDENCE_BUNDLE.globalAggregate.status).toBe("unresolved");
    expect(EVIDENCE_BUNDLE.globalAggregate.value).toBeNull();
    expect(EVIDENCE_BUNDLE.globalAggregate.guardLiteral.length).toBeGreaterThan(0);
  });

  it("binds the legal-move catalog bytes by fingerprint", () => {
    expect(EVIDENCE_BUNDLE.legalMoveCatalogBinding.catalogFingerprint).toBe(
      LEGAL_MOVE_CATALOG.catalogFingerprint,
    );
  });

  it("creates an index only for a compatible live projection", () => {
    const index = createEvidenceBundleIndex(
      liveResponse(),
      EVIDENCE_BUNDLE,
      LEGAL_MOVE_CATALOG.catalogFingerprint,
    );
    expect(index.size).toBe(21);
    expect(index.get(2773)?.name).toBe("Lydian");
  });

  it("rejects a live projection with a mismatched descriptor pin", () => {
    const response = liveResponse();
    const incompatible = {
      ...response,
      harmonicDescriptor: {
        ...response.harmonicDescriptor,
        candidateFingerprint: "0".repeat(64),
      },
    };
    expect(() =>
      createEvidenceBundleIndex(
        incompatible,
        EVIDENCE_BUNDLE,
        LEGAL_MOVE_CATALOG.catalogFingerprint,
      ),
    ).toThrow(EvidenceBundleCompatibilityError);
  });

  it("rejects a mismatched legal-move catalog binding", () => {
    expect(() =>
      createEvidenceBundleIndex(liveResponse(), EVIDENCE_BUNDLE, "f".repeat(64)),
    ).toThrow(EvidenceBundleCompatibilityError);
  });

  it("rejects invalid, missing, and incompatible bundle data", () => {
    const bundle = JSON.parse(JSON.stringify(EVIDENCE_BUNDLE)) as Record<string, unknown>;
    const missing = { ...bundle } as Record<string, unknown>;
    delete missing.certificate;
    expect(() => parseEvidenceBundle(missing)).toThrow(EvidenceBundleCompatibilityError);

    const invalid = { ...bundle } as Record<string, unknown>;
    (invalid.method as Record<string, unknown>).uniquenessClaim = true;
    expect(() => parseEvidenceBundle(invalid)).toThrow(EvidenceBundleCompatibilityError);

    const incompatible = { ...bundle } as Record<string, unknown>;
    (incompatible.records as Array<Record<string, unknown>>)[0] = {
      ...(incompatible.records as Array<Record<string, unknown>>)[0],
      stateId: 1,
    };
    expect(() => parseEvidenceBundle(incompatible)).toThrow(EvidenceBundleCompatibilityError);
  });

  it("exposes a complete label map with source paths and absent values", () => {
    for (const key of [
      "stateGovernor",
      "tier",
      "forteFamily",
      "pitchClasses",
      "stateGovernorDegree",
      "triadicCompressionSignature",
      "weightedProjection",
      "certificate",
      "wavelength",
      "photonicCompression",
      "admissionStatus",
      "globalAggregate",
      "provenance",
    ]) {
      const entry = EVIDENCE_BUNDLE.labelMap[key];
      expect(entry?.label.length).toBeGreaterThan(0);
      expect(entry?.source.length).toBeGreaterThan(0);
      expect(entry?.absentValue.length).toBeGreaterThan(0);
    }
  });
});
