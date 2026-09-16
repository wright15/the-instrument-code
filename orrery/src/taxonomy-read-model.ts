import bundleDocument from "./generated/taxonomy-read-model.v1.json";
import Ajv2020 from "ajv/dist/2020";
import schema from "../../schemas/harmonic-orrery-taxonomy-read-model.schema.json";
const validate = new Ajv2020({ strict: false }).compile(schema);

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
  sourceProvenance: string | null;
  universalClassification: string | null;
  declaredRelationships: Array<{ id: string; type: string; source: number; target: number; directed: boolean; governing: boolean; provenance: string }>;
}
export interface TaxonomyReadModel {
  schemaVersion: typeof TAXONOMY_SCHEMA_VERSION;
  bundleId: typeof TAXONOMY_BUNDLE_ID;
  authorityBoundary: "canonical_release";
  authorityNote: string;
  evidenceBindings: Record<"census" | "gov510", { artifact: string; sha256: string; candidateFingerprint: string } | null>;
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
  if (!validate(value)) throw new TaxonomyCompatibilityError("invalid taxonomy schema");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TaxonomyCompatibilityError("taxonomy bundle must be an object");
  const bundle = value as Record<string, unknown>;
  if (bundle.schemaVersion !== TAXONOMY_SCHEMA_VERSION || bundle.bundleId !== TAXONOMY_BUNDLE_ID || bundle.authorityBoundary !== "canonical_release") throw new TaxonomyCompatibilityError("unsupported taxonomy bundle");
  if (bundle.recordCount !== 462 || !Array.isArray(bundle.records) || bundle.records.length !== 462) throw new TaxonomyCompatibilityError("taxonomy bundle must contain 462 records");
  const records = bundle.records.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TaxonomyCompatibilityError(`records[${index}] must be an object`);
    const record = value as Record<string, unknown>;
    if (!Number.isSafeInteger(record.stateId) || !Number.isSafeInteger(record.sourceOrder) || typeof record.name !== "string" || typeof record.forte !== "string" || typeof record.role !== "string" || (record.office !== null && typeof record.office !== "string") || (record.tier !== null && typeof record.tier !== "string") || (record.officeStatus !== "available" && record.officeStatus !== "withheld") || record.authority !== "canonical_release") throw new TaxonomyCompatibilityError(`records[${index}] is invalid`);
    if ((record.office === null) !== (record.officeStatus === "withheld")) throw new TaxonomyCompatibilityError(`records[${index}] has inconsistent office status`);
    for (const field of ["sourceProvenance", "universalClassification"]) if (record[field] !== null && typeof record[field] !== "string") throw new TaxonomyCompatibilityError(`invalid ${field}`);
    if (Number(record.stateId) < 1 || Number(record.stateId) > 4095 || record.sourceOrder !== record.stateId || !["anchor", "satellite", "boundary"].includes(String(record.role)) || !["achiral", "chiral"].includes(String(record.chirality)) || (record.fineRole !== null && typeof record.fineRole !== "string") || (record.officeIndex !== null && (!Number.isInteger(record.officeIndex) || Number(record.officeIndex) < 0 || Number(record.officeIndex) > 6)) || record.provenancePath !== "canonical/universal-heptatonic-ledger.json") throw new TaxonomyCompatibilityError(`records[${index}] has invalid source fields`);
    return record as unknown as TaxonomyRecord;
  });
  if (new Set(records.map((record) => record.stateId)).size !== 462 || records.some((record, index) => index > 0 && record.sourceOrder <= records[index - 1].sourceOrder)) throw new TaxonomyCompatibilityError("taxonomy records must be unique and source ordered");
  if (!Array.isArray(bundle.sources) || bundle.sources.length !== 3 || bundle.sources.some((source, index) => !source || source.artifact !== ["canonical/universal-heptatonic-ledger.json", "provenance/SOURCE_AUTHORITY.md", "canonical/universal-network-data.json"][index])) throw new TaxonomyCompatibilityError("invalid taxonomy source bindings");
  const ids = new Set(records.map((record) => record.stateId));
  for (const record of records) if (record.declaredRelationships.some((edge, index, edges) => !ids.has(edge.source) || !ids.has(edge.target) || (edge.source !== record.stateId && edge.target !== record.stateId) || (index > 0 && edge.id <= edges[index - 1].id))) throw new TaxonomyCompatibilityError("invalid declared relationship identity or order");
  const counts = bundle.roleCounts as Record<string, unknown> | undefined;
  if (!counts || Object.keys(counts).length !== 3 || Object.entries({ anchor: 70, satellite: 238, boundary: 154 }).some(([role, count]) => counts[role] !== count || records.filter((record) => record.role === role).length !== count)) throw new TaxonomyCompatibilityError("invalid taxonomy role partition");
  return { schemaVersion: TAXONOMY_SCHEMA_VERSION, bundleId: TAXONOMY_BUNDLE_ID, authorityBoundary: "canonical_release", authorityNote: string(bundle.authorityNote, "authorityNote"), evidenceBindings: bundle.evidenceBindings as TaxonomyReadModel["evidenceBindings"], sources: (bundle.sources as Array<{ artifact: string; sha256: string }>).map((source, index) => ({ artifact: string(source.artifact, `sources[${index}].artifact`), sha256: hash(source.sha256, `sources[${index}].sha256`) })), recordCount: 462, roleCounts: bundle.roleCounts as Record<string, number>, records, bundleFingerprint: hash(bundle.bundleFingerprint, "bundleFingerprint") };
}

// Validate at the consumption boundary rather than throwing during import.
export const TAXONOMY_READ_MODEL = bundleDocument as TaxonomyReadModel;
export function taxonomyReadModelView(input: unknown) {
  if (input === null || input === undefined || input === "loading") return { state: input === "loading" ? "loading" : "unavailable", model: null, notice: "Taxonomy data is unavailable. No nearby record is substituted." } as const;
  try {
    return { state: "ready", model: parseTaxonomyReadModel(input), notice: "Canonical taxonomy is read-only." } as const;
  } catch {
    return { state: "incompatible", model: null, notice: "Taxonomy data is incompatible. No nearby record is substituted." } as const;
  }
}
export function filterTaxonomyRecords(filter: TaxonomyFilter = {}, model = TAXONOMY_READ_MODEL): TaxonomyRecord[] {
  for (const [key, value] of Object.entries(filter)) if (!["role", "tier", "forte", "officeStatus", "authority"].includes(key) || (value !== undefined && typeof value !== "string")) throw new TaxonomyCompatibilityError(`invalid ${key} filter`);
  return (taxonomyReadModelView(model).model?.records ?? []).filter((record) => Object.entries(filter).every(([key, value]) => value === undefined || record[key as keyof TaxonomyRecord] === value));
}
export function taxonomyRecordById(stateId: number, model = TAXONOMY_READ_MODEL): TaxonomyRecord | null {
  return Number.isSafeInteger(stateId) ? taxonomyReadModelView(model).model?.records.find((record) => record.stateId === stateId) ?? null : null;
}
