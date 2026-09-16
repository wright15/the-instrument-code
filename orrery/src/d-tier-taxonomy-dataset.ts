import datasetDocument from "./generated/d-tier-taxonomy-dataset.v1.json";
import Ajv2020 from "ajv/dist/2020";
import schema from "../../schemas/harmonic-orrery-d-tier-taxonomy-dataset.schema.json";
import { TAXONOMY_READ_MODEL, parseTaxonomyReadModel, taxonomyReadModelView, type TaxonomyRecord } from "./taxonomy-read-model";
const validate = new Ajv2020({ strict: false }).compile(schema);

export type DatasetState = "ready" | "loading" | "unavailable" | "incompatible";
export interface DatasetsRecord extends Pick<TaxonomyRecord, "stateId" | "sourceOrder" | "name" | "forte" | "role" | "tier" | "office" | "officeStatus"> {
  authority: "planning_evidence";
  fifthMask: number;
  fifthPositions: number[];
  fifthSpan: number;
  fifthArc: string;
  holes: number;
  gapMultiset: number[];
  provenancePath: string;
}
export interface DTierDataset { schemaVersion: "harmonic-orrery.d-tier-taxonomy-dataset.v1"; datasetId: "D_TIER_TAXONOMY_DATASET_v1"; authorityBoundary: "planning_evidence"; authorityNote: string; taxonomyBinding: { canonicalLedgerSha256: string }; censusBinding: { researchVerdict: { verdict: "confirmed" | "refuted" | "partial" } }; recordCount: 175; records: DatasetsRecord[]; datasetFingerprint: string; }
export interface DTierViewRecord { identity: TaxonomyRecord; ordinal: number; fifthSpace: Pick<DatasetsRecord, "fifthMask" | "fifthPositions" | "fifthSpan" | "fifthArc" | "holes" | "gapMultiset" | "provenancePath"> | null; }
export interface DTierDatasetView { state: DatasetState; records: DTierViewRecord[]; verdict: "confirmed" | "refuted" | "partial" | null; notice: string; }
export class DTierDatasetCompatibilityError extends Error {}

export function parseDTierDataset(value: unknown, model = TAXONOMY_READ_MODEL): DTierDataset {
  if (!validate(value)) throw new DTierDatasetCompatibilityError("invalid D-tier schema");
  const taxonomy = parseTaxonomyReadModel(model);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DTierDatasetCompatibilityError("D-tier dataset must be an object");
  const dataset = value as Record<string, unknown>;
  if (dataset.schemaVersion !== "harmonic-orrery.d-tier-taxonomy-dataset.v1" || dataset.datasetId !== "D_TIER_TAXONOMY_DATASET_v1" || dataset.authorityBoundary !== "planning_evidence" || dataset.recordCount !== 175 || !Array.isArray(dataset.records) || dataset.records.length !== 175) throw new DTierDatasetCompatibilityError("unsupported D-tier dataset");
  const binding = dataset.taxonomyBinding as Record<string, unknown>;
  if (binding?.canonicalLedgerSha256 !== taxonomy.sources[0]?.sha256 || binding?.bundleFingerprint !== taxonomy.bundleFingerprint) throw new DTierDatasetCompatibilityError("D-tier dataset is incompatible with the taxonomy source");
  const verdict = (dataset.censusBinding as { researchVerdict?: { verdict?: unknown } })?.researchVerdict?.verdict;
  const census = dataset.censusBinding as { sha256?: unknown; candidateFingerprint?: unknown };
  if (!taxonomy.evidenceBindings.census || census.sha256 !== taxonomy.evidenceBindings.census.sha256 || census.candidateFingerprint !== taxonomy.evidenceBindings.census.candidateFingerprint) throw new DTierDatasetCompatibilityError("stale census binding");
  if (!(["confirmed", "refuted", "partial"] as string[]).includes(String(verdict))) throw new DTierDatasetCompatibilityError("D-tier dataset has an invalid research verdict");
  const records = dataset.records as DatasetsRecord[];
  if (records.some((record, index) => !String(record.tier).startsWith("D") || (index && record.sourceOrder <= records[index - 1].sourceOrder))) throw new DTierDatasetCompatibilityError("D-tier dataset records are invalid");
  const identities = taxonomy.records.filter((record) => record.tier?.startsWith("D"));
  const identityFields = ["stateId", "sourceOrder", "name", "forte", "role", "tier", "office", "officeStatus"] as const;
  if (records.length !== identities.length || records.some((record, index) => identityFields.some((field) => record[field] !== identities[index][field]))) throw new DTierDatasetCompatibilityError("D-tier dataset identity differs from the taxonomy source");
  for (const record of records) {
    const positions = record.fifthPositions;
    if (record.authority !== "planning_evidence" || record.provenancePath !== "canonical/universal-heptatonic-ledger.json" || !Array.isArray(positions) || positions.length !== 7 || positions.some((p, i) => !Number.isInteger(p) || p < 0 || p > 11 || (i > 0 && p <= positions[i - 1])) || record.fifthMask !== positions.reduce((mask, p) => mask | (1 << p), 0)) throw new DTierDatasetCompatibilityError("invalid fifth-space positions");
    const gaps = positions.map((p, i) => (positions[(i + 1) % 7] - p + 12) % 12).sort((a, b) => a - b);
    if (record.fifthSpan !== 12 - gaps[6] || record.holes !== record.fifthSpan - 6 || JSON.stringify(record.gapMultiset) !== JSON.stringify(gaps) || typeof record.fifthArc !== "string" || !/^\[\d+,\d+\]$/.test(record.fifthArc)) throw new DTierDatasetCompatibilityError("invalid fifth-space measurements");
    const expectedPositions = Array.from({ length: 12 }, (_, pitch) => pitch).filter((pitch) => record.stateId & (1 << pitch)).map((pitch) => (pitch * 7) % 12).sort((a, b) => a - b);
    const [start, end] = JSON.parse(record.fifthArc) as number[];
    if (JSON.stringify(positions) !== JSON.stringify(expectedPositions) || !positions.includes(start) || !positions.includes(end) || (end - start + 12) % 12 !== record.fifthSpan) throw new DTierDatasetCompatibilityError("fifth-space derivation differs from the source state");
  }
  return dataset as unknown as DTierDataset;
}

export const D_TIER_DATASET = datasetDocument as DTierDataset;
function fallback(state: Exclude<DatasetState, "ready">, notice: string, model = TAXONOMY_READ_MODEL): DTierDatasetView {
  const ordinals = new Map<string, number>();
  const records = (taxonomyReadModelView(model).model?.records ?? []).filter((record) => record.tier?.startsWith("D")).sort((a, b) => a.tier!.localeCompare(b.tier!) || a.sourceOrder - b.sourceOrder).map((identity) => {
    const ordinal = (ordinals.get(identity.tier!) ?? 0) + 1;
    ordinals.set(identity.tier!, ordinal);
    return { identity, ordinal, fifthSpace: null };
  });
  return { state, records, verdict: null, notice };
}
export function dTierDatasetView(input: unknown, model = TAXONOMY_READ_MODEL): DTierDatasetView {
  if (!taxonomyReadModelView(model).model) return fallback("unavailable", "Canonical taxonomy unavailable; no substitute identities or fifth-space values are shown.", model);
  if (input === "loading") return fallback("loading", "D-tier census is loading; deterministic ordinal-by-tier layout is shown without fifth-space values.", model);
  if (input === null || input === undefined) return fallback("unavailable", "D-tier census is unavailable; deterministic ordinal-by-tier layout is shown without fifth-space values.", model);
  try {
    const dataset = parseDTierDataset(input, model);
    return { state: "ready", verdict: dataset.censusBinding.researchVerdict.verdict, notice: dataset.authorityNote, records: dataset.records.map((record, ordinal) => ({ identity: model.records.find((identity) => identity.stateId === record.stateId)!, ordinal: ordinal + 1, fifthSpace: { fifthMask: record.fifthMask, fifthPositions: record.fifthPositions, fifthSpan: record.fifthSpan, fifthArc: record.fifthArc, holes: record.holes, gapMultiset: record.gapMultiset, provenancePath: record.provenancePath } })) };
  } catch {
    return fallback("incompatible", "D-tier census is incompatible; deterministic ordinal-by-tier layout is shown without fifth-space values.", model);
  }
}
