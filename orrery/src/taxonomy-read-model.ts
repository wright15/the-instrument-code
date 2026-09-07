import bundleDocument from "./generated/taxonomy-read-model.v1.json";

export const TAXONOMY_SCHEMA_VERSION = "harmonic-orrery.taxonomy-read-model.v1";
export const TAXONOMY_BUNDLE_ID = "TAXONOMY_READ_MODEL_v1";
export type OfficeStatus = "available" | "withheld";
export interface TaxonomyRecord {
  stateId: number;
  sourceOrder: number;
  name: string;
  forte: string;
  chirality: string;
  role: string;
  fineRole: string | null;
  tier: string | null;
  office: string | null;
  officeIndex: number | null;
  officeStatus: OfficeStatus;
  authority: "canonical_release";
  provenancePath: string;
}
export interface TaxonomyReadModel {
  schemaVersion: typeof TAXONOMY_SCHEMA_VERSION;
  bundleId: typeof TAXONOMY_BUNDLE_ID;
  authorityBoundary: "canonical_release";
  authorityNote: string;
  sources: Array<{ artifact: string; sha256: string }>;
  recordCount: 462;
  roleCounts: Record<string, number>;
  records: TaxonomyRecord[];
  bundleFingerprint: string;
}
export type TaxonomyFilter = Partial<Pick<TaxonomyRecord, "role" | "tier" | "forte" | "officeStatus" | "authority">>;
export class TaxonomyCompatibilityError extends Error {}

const hash = (value: unknown, context: string) => {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) throw new TaxonomyCompatibilityError(`${context} must be a SHA-256 fingerprint`);
  return value;
};
const string = (value: unknown, context: string) => {
  if (typeof value !== "string" || !value) throw new TaxonomyCompatibilityError(`${context} must be a non-empty string`);
  return value;
};

export function parseTaxonomyReadModel(value: unknown): TaxonomyReadModel {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TaxonomyCompatibilityError("taxonomy bundle must be an object");
  const bundle = value as Record<string, unknown>;
  if (bundle.schemaVersion !== TAXONOMY_SCHEMA_VERSION || bundle.bundleId !== TAXONOMY_BUNDLE_ID || bundle.authorityBoundary !== "canonical_release") throw new TaxonomyCompatibilityError("unsupported taxonomy bundle");
  if (bundle.recordCount !== 462 || !Array.isArray(bundle.records) || bundle.records.length !== 462) throw new TaxonomyCompatibilityError("taxonomy bundle must contain 462 records");
  const records = bundle.records.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TaxonomyCompatibilityError(`records[${index}] must be an object`);
    const record = value as Record<string, unknown>;
    if (!Number.isSafeInteger(record.stateId) || !Number.isSafeInteger(record.sourceOrder) || typeof record.name !== "string" || typeof record.forte !== "string" || typeof record.role !== "string" || (record.office !== null && typeof record.office !== "string") || (record.tier !== null && typeof record.tier !== "string") || (record.officeStatus !== "available" && record.officeStatus !== "withheld") || record.authority !== "canonical_release") throw new TaxonomyCompatibilityError(`records[${index}] is invalid`);
    if ((record.office === null) !== (record.officeStatus === "withheld")) throw new TaxonomyCompatibilityError(`records[${index}] has inconsistent office status`);
    return record as unknown as TaxonomyRecord;
  });
  if (new Set(records.map((record) => record.stateId)).size !== 462 || records.some((record, index) => index > 0 && record.sourceOrder <= records[index - 1].sourceOrder)) throw new TaxonomyCompatibilityError("taxonomy records must be unique and source ordered");
  return { schemaVersion: TAXONOMY_SCHEMA_VERSION, bundleId: TAXONOMY_BUNDLE_ID, authorityBoundary: "canonical_release", authorityNote: string(bundle.authorityNote, "authorityNote"), sources: (bundle.sources as Array<{ artifact: string; sha256: string }>).map((source, index) => ({ artifact: string(source.artifact, `sources[${index}].artifact`), sha256: hash(source.sha256, `sources[${index}].sha256`) })), recordCount: 462, roleCounts: bundle.roleCounts as Record<string, number>, records, bundleFingerprint: hash(bundle.bundleFingerprint, "bundleFingerprint") };
}

export const TAXONOMY_READ_MODEL = parseTaxonomyReadModel(bundleDocument as unknown);
export function filterTaxonomyRecords(filter: TaxonomyFilter = {}, model = TAXONOMY_READ_MODEL): TaxonomyRecord[] {
  for (const [key, value] of Object.entries(filter)) if (value !== undefined && typeof value !== "string") throw new TaxonomyCompatibilityError(`invalid ${key} filter`);
  return model.records.filter((record) => Object.entries(filter).every(([key, value]) => value === undefined || record[key as keyof TaxonomyRecord] === value));
}
export function taxonomyRecordById(stateId: number, model = TAXONOMY_READ_MODEL): TaxonomyRecord | null {
  return Number.isSafeInteger(stateId) ? model.records.find((record) => record.stateId === stateId) ?? null : null;
}
