import bundleDocument from "./generated/field-derivation-bundle.v1.json";

export const FIELD_DERIVATION_SCHEMA_VERSION = "harmonic-orrery.field-derivation.v1";
export const FIELD_DERIVATION_BUNDLE_ID = "FIELD_DERIVATION_OBS014_015_016_v1";

export const VERDICTS = ["confirmed", "refuted", "partial", "unavailable", "incompatible"] as const;
export type Verdict = (typeof VERDICTS)[number];

export const AUTHORITY_BOUNDARY = "planning_evidence";

type JsonRecord = Record<string, unknown>;

export class FieldDerivationCompatibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FieldDerivationCompatibilityError";
  }
}

export interface FieldDerivationReceipt {
  artifact: string;
  sha256: string;
  verdict: string;
  checksPassed: number;
  reportFingerprint: string;
}

export interface FieldDerivationSource {
  artifact: string;
  sha256: string;
  candidateFingerprint: string;
  role: string;
  receipt: FieldDerivationReceipt;
}

export interface FieldDerivationObservation {
  id: "OBS-014" | "OBS-015" | "OBS-016";
  title: string;
  verdict: Verdict;
  authority: typeof AUTHORITY_BOUNDARY;
  sourceArtifact: string;
  receiptArtifact: string;
  facts: Record<string, unknown>;
}

export interface FieldDerivationBundle {
  schemaVersion: typeof FIELD_DERIVATION_SCHEMA_VERSION;
  bundleId: typeof FIELD_DERIVATION_BUNDLE_ID;
  authorityBoundary: typeof AUTHORITY_BOUNDARY;
  authorityNote: string;
  sources: FieldDerivationSource[];
  observations: FieldDerivationObservation[];
  bundleFingerprint: string;
}

function record(value: unknown, context: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new FieldDerivationCompatibilityError(`${context} must be an object`);
  }
  return value as JsonRecord;
}

function string(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new FieldDerivationCompatibilityError(`${context} must be a non-empty string`);
  }
  return value;
}

function fingerprint(value: unknown, context: string): string {
  const parsed = string(value, context);
  if (!/^[a-f0-9]{64}$/.test(parsed)) {
    throw new FieldDerivationCompatibilityError(`${context} must be a SHA-256 fingerprint`);
  }
  return parsed;
}

function verdict(value: unknown, context: string): Verdict {
  const parsed = string(value, context);
  if (!(VERDICTS as readonly string[]).includes(parsed)) {
    throw new FieldDerivationCompatibilityError(`${context} must be confirmed, refuted, partial, unavailable, or incompatible`);
  }
  return parsed as Verdict;
}

function parseSource(value: unknown, index: number): FieldDerivationSource {
  const item = record(value, `bundle.sources[${index}]`);
  const receipt = record(item.receipt, `bundle.sources[${index}].receipt`);
  if (
    typeof item.checksPassed === "undefined"
    && typeof receipt.checksPassed !== "number"
  ) {
    throw new FieldDerivationCompatibilityError(`bundle.sources[${index}].receipt.checksPassed must be a number`);
  }
  return {
    artifact: string(item.artifact, `bundle.sources[${index}].artifact`),
    sha256: fingerprint(item.sha256, `bundle.sources[${index}].sha256`),
    candidateFingerprint: fingerprint(item.candidateFingerprint, `bundle.sources[${index}].candidateFingerprint`),
    role: string(item.role, `bundle.sources[${index}].role`),
    receipt: {
      artifact: string(receipt.artifact, `bundle.sources[${index}].receipt.artifact`),
      sha256: fingerprint(receipt.sha256, `bundle.sources[${index}].receipt.sha256`),
      verdict: string(receipt.verdict, `bundle.sources[${index}].receipt.verdict`),
      checksPassed: Number(receipt.checksPassed),
      reportFingerprint: fingerprint(
        receipt.reportFingerprint,
        `bundle.sources[${index}].receipt.reportFingerprint`,
      ),
    },
  };
}

function parseObservation(value: unknown, index: number): FieldDerivationObservation {
  const item = record(value, `bundle.observations[${index}]`);
  const id = string(item.id, `bundle.observations[${index}].id`);
  if (!["OBS-014", "OBS-015", "OBS-016"].includes(id)) {
    throw new FieldDerivationCompatibilityError(`bundle.observations[${index}].id is not a registered field-derivation observation`);
  }
  if (item.authority !== AUTHORITY_BOUNDARY) {
    throw new FieldDerivationCompatibilityError(`bundle.observations[${index}].authority must be planning_evidence`);
  }
  return {
    id: id as FieldDerivationObservation["id"],
    title: string(item.title, `bundle.observations[${index}].title`),
    verdict: verdict(item.verdict, `bundle.observations[${index}].verdict`),
    authority: AUTHORITY_BOUNDARY,
    sourceArtifact: string(item.sourceArtifact, `bundle.observations[${index}].sourceArtifact`),
    receiptArtifact: string(item.receiptArtifact, `bundle.observations[${index}].receiptArtifact`),
    facts: item.facts as Record<string, unknown>,
  };
}

export function parseFieldDerivationBundle(value: unknown): FieldDerivationBundle {
  const bundle = record(value, "field-derivation bundle");
  if (bundle.schemaVersion !== FIELD_DERIVATION_SCHEMA_VERSION || bundle.bundleId !== FIELD_DERIVATION_BUNDLE_ID) {
    throw new FieldDerivationCompatibilityError("Unsupported field-derivation bundle version");
  }
  if (bundle.authorityBoundary !== AUTHORITY_BOUNDARY) {
    throw new FieldDerivationCompatibilityError("bundle authorityBoundary must stay planning_evidence");
  }
  const sources = bundle.sources as unknown[];
  if (!Array.isArray(sources) || sources.length !== 2) {
    throw new FieldDerivationCompatibilityError("bundle.sources must contain exactly two research artifacts");
  }
  const observations = bundle.observations as unknown[];
  if (!Array.isArray(observations) || observations.length !== 3) {
    throw new FieldDerivationCompatibilityError("bundle.observations must contain OBS-014, OBS-015, and OBS-016");
  }
  return {
    schemaVersion: FIELD_DERIVATION_SCHEMA_VERSION,
    bundleId: FIELD_DERIVATION_BUNDLE_ID,
    authorityBoundary: AUTHORITY_BOUNDARY,
    authorityNote: string(bundle.authorityNote, "bundle.authorityNote"),
    sources: sources.map((source, index) => parseSource(source, index)),
    observations: observations.map((observation, index) => parseObservation(observation, index)),
    bundleFingerprint: fingerprint(bundle.bundleFingerprint, "bundle.bundleFingerprint"),
  };
}

export const FIELD_DERIVATION_BUNDLE = parseFieldDerivationBundle(bundleDocument as unknown);

export const VERDICT_LABELS: Record<Verdict, string> = {
  confirmed: "Confirmed",
  refuted: "Refuted",
  partial: "Partial",
  unavailable: "Unavailable",
  incompatible: "Incompatible",
};

export const AUTHORITY_LABEL = "planning evidence / not admitted";

export interface ObservationView {
  id: FieldDerivationObservation["id"];
  title: string;
  verdict: Verdict;
  verdictLabel: string;
  authorityLabel: string;
  sourceArtifact: string;
  receiptArtifact: string;
  receiptChecks: number;
  facts: Record<string, unknown>;
}

export function observationViews(
  bundle: FieldDerivationBundle = FIELD_DERIVATION_BUNDLE,
): ObservationView[] {
  const receiptByArtifact = new Map(
    bundle.sources.map((source) => [source.receipt.artifact, source.receipt]),
  );
  return bundle.observations.map((observation) => {
    const receipt = receiptByArtifact.get(observation.receiptArtifact);
    return {
      id: observation.id,
      title: observation.title,
      verdict: observation.verdict,
      verdictLabel: VERDICT_LABELS[observation.verdict],
      authorityLabel: AUTHORITY_LABEL,
      sourceArtifact: observation.sourceArtifact,
      receiptArtifact: observation.receiptArtifact,
      receiptChecks: receipt ? receipt.checksPassed : 0,
      facts: observation.facts,
    };
  });
}
