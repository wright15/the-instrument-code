import datasetDocument from "./generated/d-tier-taxonomy-dataset.v1.json";
import { TAXONOMY_READ_MODEL, type TaxonomyRecord } from "./taxonomy-read-model";

export type DatasetState = "ready" | "loading" | "unavailable" | "incompatible";
export interface DatasetsRecord extends Pick<TaxonomyRecord, "stateId" | "sourceOrder" | "name" | "forte" | "role" | "tier" | "office" | "officeStatus"> {
  authority: "planning_evidence";
  fifthMask: number;
  fifthPositions: number[];
  fifthSpan: number;
  fifthArc: unknown;
  holes: number[];
  gapMultiset: number[];
  provenancePath: unknown;
}
export interface DTierDataset { schemaVersion: "harmonic-orrery.d-tier-taxonomy-dataset.v1"; datasetId: "D_TIER_TAXONOMY_DATASET_v1"; authorityBoundary: "planning_evidence"; authorityNote: string; taxonomyBinding: { canonicalLedgerSha256: string }; censusBinding: { researchVerdict: { verdict: "confirmed" | "refuted" | "partial" } }; recordCount: 175; records: DatasetsRecord[]; datasetFingerprint: string; }
export interface DTierViewRecord { identity: TaxonomyRecord; ordinal: number; fifthSpace: Pick<DatasetsRecord, "fifthMask" | "fifthPositions" | "fifthSpan" | "fifthArc" | "holes" | "gapMultiset" | "provenancePath"> | null; }
export interface DTierDatasetView { state: DatasetState; records: DTierViewRecord[]; verdict: "confirmed" | "refuted" | "partial" | null; notice: string; }
export class DTierDatasetCompatibilityError extends Error {}

export function parseDTierDataset(value: unknown): DTierDataset {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new DTierDatasetCompatibilityError("D-tier dataset must be an object");
  const dataset = value as Record<string, unknown>;
  if (dataset.schemaVersion !== "harmonic-orrery.d-tier-taxonomy-dataset.v1" || dataset.datasetId !== "D_TIER_TAXONOMY_DATASET_v1" || dataset.authorityBoundary !== "planning_evidence" || dataset.recordCount !== 175 || !Array.isArray(dataset.records) || dataset.records.length !== 175) throw new DTierDatasetCompatibilityError("unsupported D-tier dataset");
  const binding = dataset.taxonomyBinding as Record<string, unknown>;
  if (binding?.canonicalLedgerSha256 !== TAXONOMY_READ_MODEL.sources[0]?.sha256) throw new DTierDatasetCompatibilityError("D-tier dataset is incompatible with the taxonomy source");
  const verdict = (dataset.censusBinding as { researchVerdict?: { verdict?: unknown } })?.researchVerdict?.verdict;
  if (!(["confirmed", "refuted", "partial"] as string[]).includes(String(verdict))) throw new DTierDatasetCompatibilityError("D-tier dataset has an invalid research verdict");
  const records = dataset.records as DatasetsRecord[];
  if (records.some((record, index) => !String(record.tier).startsWith("D") || (index && record.sourceOrder <= records[index - 1].sourceOrder))) throw new DTierDatasetCompatibilityError("D-tier dataset records are invalid");
  return dataset as unknown as DTierDataset;
}

export const D_TIER_DATASET = parseDTierDataset(datasetDocument as unknown);
function fallback(state: Exclude<DatasetState, "ready">, notice: string): DTierDatasetView {
  const records = TAXONOMY_READ_MODEL.records.filter((record) => record.tier?.startsWith("D")).map((identity, ordinal) => ({ identity, ordinal: ordinal + 1, fifthSpace: null }));
  return { state, records, verdict: null, notice };
}
export function dTierDatasetView(input: unknown): DTierDatasetView {
  if (input === "loading") return fallback("loading", "D-tier census is loading; deterministic ordinal-by-tier layout is shown without fifth-space values.");
  if (input === null || input === undefined) return fallback("unavailable", "D-tier census is unavailable; deterministic ordinal-by-tier layout is shown without fifth-space values.");
  try {
    const dataset = parseDTierDataset(input);
    return { state: "ready", verdict: dataset.censusBinding.researchVerdict.verdict, notice: dataset.authorityNote, records: dataset.records.map((record, ordinal) => ({ identity: TAXONOMY_READ_MODEL.records.find((identity) => identity.stateId === record.stateId)!, ordinal: ordinal + 1, fifthSpace: { fifthMask: record.fifthMask, fifthPositions: record.fifthPositions, fifthSpan: record.fifthSpan, fifthArc: record.fifthArc, holes: record.holes, gapMultiset: record.gapMultiset, provenancePath: record.provenancePath } })) };
  } catch {
    return fallback("incompatible", "D-tier census is incompatible; deterministic ordinal-by-tier layout is shown without fifth-space values.");
  }
}
