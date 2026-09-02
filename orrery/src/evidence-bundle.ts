import bundleDocument from "./generated/evidence-bundle.v1.json";
import { GOVERNORS, TIERS, type AnchorTier, type Governor, type NodesResponse } from "./types";

export const EVIDENCE_BUNDLE_SCHEMA_VERSION = "harmonic-orrery.evidence-bundle.v1";
export const EVIDENCE_BUNDLE_ID = "EVIDENCE_BUNDLE_A012_v1";

type JsonRecord = Record<string, unknown>;

export interface ExactRatio {
  numerator: number;
  denominator: number;
}

export interface EvidenceBundleCertificate {
  epsilonStar: ExactRatio;
  nextTightestSlack: ExactRatio & { pair: string };
  tightSet: string[];
  activeSetLabel: "active-set rank 8 (7 binding + normalization)";
  optimalityClaim: "unique_max_margin";
  witness: { weightDenominator: number; weightNumerators: number[] };
  dualCertificate: JsonRecord;
  verifier: string;
}

export interface EvidenceBundleRecord {
  stateId: number;
  name: string;
  tier: AnchorTier;
  forteFamily: "7-35" | "7-34" | "7-33";
  stateGovernor: Governor;
  stateGovernorDegree: number;
  pitchClasses: number[];
  intervalVector: number[];
  governorSeatCompressionClass: number;
  triadicCompressionSignature: number[];
  weightedProjection: ExactRatio;
  wA012Wording: "unique max-margin optimum under the declared objective";
  recordFingerprint: string;
}

export interface EvidenceBundle {
  schemaVersion: typeof EVIDENCE_BUNDLE_SCHEMA_VERSION;
  bundleId: typeof EVIDENCE_BUNDLE_ID;
  bundleFingerprint: string;
  harmonicDescriptorBinding: {
    candidateId: "CH_A012_q_v1";
    coordinateId: "harmonic.CH_A012_q_v1";
    releaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0";
    status: "admitted_scoped_A012";
    candidateFingerprint: string;
  };
  legalMoveCatalogBinding: {
    schemaVersion: "harmonic-orrery.legal-moves.v2";
    catalogId: string;
    catalogFingerprint: string;
  };
  sources: Array<{ artifact: string; sha256: string; role: string }>;
  labelMap: Record<string, { label: string; source: string; note?: string; absentValue: string }>;
  method: {
    algorithmVersion: string;
    qClasses: Array<{ runtimeQuality: string; signature: number[]; value: number }>;
    governorDegreeMap: Record<Governor, number>;
    degreeOrder: number[];
    weightDenominator: number;
    weightNumerators: number[];
    weightOrdering: string;
    weightSum: { numerator: number; denominator: number };
    uniquenessClaim: false;
  };
  certificate: EvidenceBundleCertificate;
  invariants: {
    a0A1Gap: ExactRatio;
    a1A2Gap: ExactRatio;
    tierSumOrder: number[];
    strictBandSeparation: boolean;
  };
  globalAggregate: {
    namespace: "harmonic.C_H";
    status: "unresolved";
    value: null;
    guardLiteral: string;
  };
  records: EvidenceBundleRecord[];
}

export class EvidenceBundleCompatibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceBundleCompatibilityError";
  }
}

function record(value: unknown, context: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new EvidenceBundleCompatibilityError(`${context} must be an object`);
  }
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: readonly string[], context: string): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (actual.length !== sortedExpected.length || actual.some((key, index) => key !== sortedExpected[index])) {
    throw new EvidenceBundleCompatibilityError(`${context} has unexpected fields`);
  }
}

function string(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new EvidenceBundleCompatibilityError(`${context} must be a non-empty string`);
  }
  return value;
}

function fingerprint(value: unknown, context: string): string {
  const parsed = string(value, context);
  if (!/^[a-f0-9]{64}$/.test(parsed)) {
    throw new EvidenceBundleCompatibilityError(`${context} must be a SHA-256 fingerprint`);
  }
  return parsed;
}

function ratio(value: unknown, context: string): ExactRatio {
  const item = record(value, context);
  exactKeys(item, ["numerator", "denominator"], context);
  if (
    typeof item.numerator !== "number"
    || !Number.isInteger(item.numerator)
    || typeof item.denominator !== "number"
    || !Number.isInteger(item.denominator)
    || item.denominator !== 407
  ) {
    throw new EvidenceBundleCompatibilityError(`${context} must be an exact integer ratio over 407`);
  }
  return { numerator: item.numerator, denominator: item.denominator };
}

function anchorId(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 4095) {
    throw new EvidenceBundleCompatibilityError(`${context} must be an Orrery anchor ID`);
  }
  return value;
}

function parseRecord(value: unknown, index: number): EvidenceBundleRecord {
  const item = record(value, `bundle.records[${index}]`);
  exactKeys(
    item,
    [
      "stateId",
      "name",
      "tier",
      "forteFamily",
      "stateGovernor",
      "stateGovernorDegree",
      "pitchClasses",
      "intervalVector",
      "governorSeatCompressionClass",
      "triadicCompressionSignature",
      "weightedProjection",
      "wA012Wording",
      "recordFingerprint",
    ],
    `bundle.records[${index}]`,
  );
  const tier = string(item.tier, `bundle.records[${index}].tier`);
  const forteFamily = string(item.forteFamily, `bundle.records[${index}].forteFamily`);
  const stateGovernor = string(item.stateGovernor, `bundle.records[${index}].stateGovernor`);
  if (
    !TIERS.includes(tier as AnchorTier)
    || !["7-35", "7-34", "7-33"].includes(forteFamily)
    || !GOVERNORS.includes(stateGovernor as Governor)
    || typeof item.stateGovernorDegree !== "number"
    || !Number.isInteger(item.stateGovernorDegree)
    || item.stateGovernorDegree < 1
    || item.stateGovernorDegree > 7
    || item.wA012Wording !== "unique max-margin optimum under the declared objective"
  ) {
    throw new EvidenceBundleCompatibilityError(`bundle.records[${index}] is not a supported anchor evidence record`);
  }
  if (!Array.isArray(item.pitchClasses) || item.pitchClasses.length !== 7) {
    throw new EvidenceBundleCompatibilityError(`bundle.records[${index}].pitchClasses must be seven classes`);
  }
  if (
    !Array.isArray(item.triadicCompressionSignature)
    || item.triadicCompressionSignature.length !== 7
    || item.triadicCompressionSignature.some(
      (value) => typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 3,
    )
  ) {
    throw new EvidenceBundleCompatibilityError(`bundle.records[${index}] must enumerate all seven Q(S) positions`);
  }
  return {
    stateId: anchorId(item.stateId, `bundle.records[${index}].stateId`),
    name: string(item.name, `bundle.records[${index}].name`),
    tier: tier as AnchorTier,
    forteFamily: forteFamily as EvidenceBundleRecord["forteFamily"],
    stateGovernor: stateGovernor as Governor,
    stateGovernorDegree: item.stateGovernorDegree as number,
    pitchClasses: item.pitchClasses as number[],
    intervalVector: item.intervalVector as number[],
    governorSeatCompressionClass: item.governorSeatCompressionClass as number,
    triadicCompressionSignature: item.triadicCompressionSignature as number[],
    weightedProjection: ratio(item.weightedProjection, `bundle.records[${index}].weightedProjection`),
    wA012Wording: item.wA012Wording as EvidenceBundleRecord["wA012Wording"],
    recordFingerprint: fingerprint(item.recordFingerprint, `bundle.records[${index}].recordFingerprint`),
  };
}

function parseCertificate(value: unknown): EvidenceBundleCertificate {
  const item = record(value, "bundle.certificate");
  exactKeys(
    item,
    ["epsilonStar", "nextTightestSlack", "tightSet", "activeSetLabel", "optimalityClaim", "witness", "dualCertificate", "verifier"],
    "bundle.certificate",
  );
  if (
    item.activeSetLabel !== "active-set rank 8 (7 binding + normalization)"
    || item.optimalityClaim !== "unique_max_margin"
    || !Array.isArray(item.tightSet)
    || item.tightSet.length !== 7
  ) {
    throw new EvidenceBundleCompatibilityError("bundle.certificate must carry the rank-8 active-set label and 7-member tight set");
  }
  const slackItem = record(item.nextTightestSlack, "bundle.certificate.nextTightestSlack");
  exactKeys(slackItem, ["numerator", "denominator", "pair"], "bundle.certificate.nextTightestSlack");
  if (
    typeof slackItem.numerator !== "number"
    || !Number.isInteger(slackItem.numerator)
    || typeof slackItem.denominator !== "number"
    || !Number.isInteger(slackItem.denominator)
    || slackItem.denominator !== 407
  ) {
    throw new EvidenceBundleCompatibilityError("bundle.certificate.nextTightestSlack must be an exact integer ratio over 407");
  }
  return {
    epsilonStar: ratio(item.epsilonStar, "bundle.certificate.epsilonStar"),
    nextTightestSlack: {
      numerator: slackItem.numerator,
      denominator: 407,
      pair: string(slackItem.pair, "bundle.certificate.nextTightestSlack.pair"),
    },
    tightSet: item.tightSet.map((member, index) => string(member, `bundle.certificate.tightSet[${index}]`)),
    activeSetLabel: item.activeSetLabel as EvidenceBundleCertificate["activeSetLabel"],
    optimalityClaim: item.optimalityClaim as EvidenceBundleCertificate["optimalityClaim"],
    witness: item.witness as EvidenceBundleCertificate["witness"],
    dualCertificate: item.dualCertificate as JsonRecord,
    verifier: string(item.verifier, "bundle.certificate.verifier"),
  };
}

export function parseEvidenceBundle(value: unknown): EvidenceBundle {
  const bundle = record(value, "bundle");
  exactKeys(
    bundle,
    [
      "schemaVersion",
      "bundleId",
      "bundleFingerprint",
      "harmonicDescriptorBinding",
      "legalMoveCatalogBinding",
      "sources",
      "labelMap",
      "method",
      "certificate",
      "invariants",
      "globalAggregate",
      "records",
    ],
    "bundle",
  );
  if (bundle.schemaVersion !== EVIDENCE_BUNDLE_SCHEMA_VERSION || bundle.bundleId !== EVIDENCE_BUNDLE_ID) {
    throw new EvidenceBundleCompatibilityError("Unsupported evidence-bundle version");
  }
  const descriptor = record(bundle.harmonicDescriptorBinding, "bundle.harmonicDescriptorBinding");
  exactKeys(
    descriptor,
    ["candidateId", "coordinateId", "releaseId", "status", "candidateFingerprint"],
    "bundle.harmonicDescriptorBinding",
  );
  if (
    descriptor.candidateId !== "CH_A012_q_v1"
    || descriptor.coordinateId !== "harmonic.CH_A012_q_v1"
    || descriptor.releaseId !== "harmonic-compression-candidate:CH_A012_q_v1:1.0.0"
    || descriptor.status !== "admitted_scoped_A012"
  ) {
    throw new EvidenceBundleCompatibilityError("bundle.harmonicDescriptorBinding is not the pinned CH_A012 descriptor");
  }
  const method = record(bundle.method, "bundle.method");
  if (method.uniquenessClaim !== false || !Array.isArray(bundle.records) || bundle.records.length !== 21) {
    throw new EvidenceBundleCompatibilityError("bundle.method.uniquenessClaim must stay false and records must be 21");
  }
  const aggregate = record(bundle.globalAggregate, "bundle.globalAggregate");
  if (aggregate.namespace !== "harmonic.C_H" || aggregate.status !== "unresolved" || aggregate.value !== null) {
    throw new EvidenceBundleCompatibilityError("bundle.globalAggregate must keep C_H unresolved null");
  }
  const parsedRecords = (bundle.records as unknown[]).map(parseRecord);
  if (new Set(parsedRecords.map((item) => item.stateId)).size !== 21) {
    throw new EvidenceBundleCompatibilityError("bundle records must be 21 unique anchors");
  }
  for (const tier of TIERS) {
    if (parsedRecords.filter((item) => item.tier === tier).length !== 7) {
      throw new EvidenceBundleCompatibilityError("bundle records must cover seven anchors per tier");
    }
  }
  const legalBinding = record(bundle.legalMoveCatalogBinding, "bundle.legalMoveCatalogBinding");
  exactKeys(legalBinding, ["schemaVersion", "catalogId", "catalogFingerprint"], "bundle.legalMoveCatalogBinding");
  if (legalBinding.schemaVersion !== "harmonic-orrery.legal-moves.v2") {
    throw new EvidenceBundleCompatibilityError("bundle.legalMoveCatalogBinding must pin the legal-move catalog");
  }
  return {
    schemaVersion: EVIDENCE_BUNDLE_SCHEMA_VERSION,
    bundleId: EVIDENCE_BUNDLE_ID,
    bundleFingerprint: fingerprint(bundle.bundleFingerprint, "bundle.bundleFingerprint"),
    harmonicDescriptorBinding: {
      candidateId: "CH_A012_q_v1",
      coordinateId: "harmonic.CH_A012_q_v1",
      releaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
      status: "admitted_scoped_A012",
      candidateFingerprint: fingerprint(
        descriptor.candidateFingerprint,
        "bundle.harmonicDescriptorBinding.candidateFingerprint",
      ),
    },
    legalMoveCatalogBinding: {
      schemaVersion: "harmonic-orrery.legal-moves.v2",
      catalogId: string(legalBinding.catalogId, "bundle.legalMoveCatalogBinding.catalogId"),
      catalogFingerprint: fingerprint(
        legalBinding.catalogFingerprint,
        "bundle.legalMoveCatalogBinding.catalogFingerprint",
      ),
    },
    sources: bundle.sources as EvidenceBundle["sources"],
    labelMap: bundle.labelMap as EvidenceBundle["labelMap"],
    method: {
      algorithmVersion: string(method.algorithmVersion, "bundle.method.algorithmVersion"),
      qClasses: method.qClasses as EvidenceBundle["method"]["qClasses"],
      governorDegreeMap: method.governorDegreeMap as EvidenceBundle["method"]["governorDegreeMap"],
      degreeOrder: method.degreeOrder as number[],
      weightDenominator: method.weightDenominator as number,
      weightNumerators: method.weightNumerators as number[],
      weightOrdering: string(method.weightOrdering, "bundle.method.weightOrdering"),
      weightSum: method.weightSum as { numerator: number; denominator: number },
      uniquenessClaim: false,
    },
    certificate: parseCertificate(bundle.certificate),
    invariants: bundle.invariants as EvidenceBundle["invariants"],
    globalAggregate: {
      namespace: "harmonic.C_H",
      status: "unresolved",
      value: null,
      guardLiteral: string(aggregate.guardLiteral, "bundle.globalAggregate.guardLiteral"),
    },
    records: parsedRecords,
  };
}

export const EVIDENCE_BUNDLE = parseEvidenceBundle(bundleDocument as unknown);

export function createEvidenceBundleIndex(
  response: NodesResponse,
  bundle: EvidenceBundle = EVIDENCE_BUNDLE,
  legalMoveCatalogFingerprint?: string,
): Map<number, EvidenceBundleRecord> {
  if (
    response.schemaVersion !== "harmonic-orrery.nodes.v2"
    || response.harmonicDescriptor.candidateFingerprint !== bundle.harmonicDescriptorBinding.candidateFingerprint
    || response.harmonicDescriptor.releaseId !== bundle.harmonicDescriptorBinding.releaseId
    || response.nodeCount !== 21
  ) {
    throw new EvidenceBundleCompatibilityError(
      "The bundled evidence bundle does not match this live anchor projection.",
    );
  }
  if (
    legalMoveCatalogFingerprint !== undefined
    && legalMoveCatalogFingerprint !== bundle.legalMoveCatalogBinding.catalogFingerprint
  ) {
    throw new EvidenceBundleCompatibilityError(
      "The bundled evidence bundle does not match the bundled legal-move catalog.",
    );
  }
  const liveIds = new Set(response.nodes.map((node) => node.state.stateId));
  for (const anchor of bundle.records) {
    if (!liveIds.has(anchor.stateId)) {
      throw new EvidenceBundleCompatibilityError(
        "The bundled evidence bundle names an anchor absent from the live projection.",
      );
    }
  }
  return new Map(bundle.records.map((anchor) => [anchor.stateId, anchor]));
}
