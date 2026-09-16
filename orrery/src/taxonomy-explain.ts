import { taxonomyReadModelView, taxonomyRecordById, TAXONOMY_READ_MODEL } from "./taxonomy-read-model";
import { dTierDatasetView } from "./d-tier-taxonomy-dataset";
import { MAX_ROWS } from "./provenance-explain";

const LEDGER = "canonical/universal-heptatonic-ledger.json";
const CENSUS = "canonical/fivefold-incubator/fifth-space-census-v0.json";
const GOV510 = "canonical/fivefold-incubator/twin-hub-convergence-v0.json";
const NETWORK = "canonical/universal-network-data.json";
const SOURCE_URLS: Record<string, string> = {
  [LEDGER]: new URL("../../canonical/universal-heptatonic-ledger.json", import.meta.url).href,
  [CENSUS]: new URL("../../canonical/fivefold-incubator/fifth-space-census-v0.json", import.meta.url).href,
  [GOV510]: new URL("../../canonical/fivefold-incubator/twin-hub-convergence-v0.json", import.meta.url).href,
  [NETWORK]: new URL("../../canonical/universal-network-data.json", import.meta.url).href,
};
export const TAXONOMY_EXPLANATION_GUARD = "Descriptive only: no theorem, operator, graph edge, legal move, mutation request, office assignment, or admission decision is created.";

// Fixed artifact allowlist; neither query text nor record labels can become URLs.
export function taxonomySourceLink(artifact: string): string | null {
  return Object.hasOwn(SOURCE_URLS, artifact) ? SOURCE_URLS[artifact] : null;
}

export function explainTaxonomyRecord(stateId: number, modelInput: unknown = TAXONOMY_READ_MODEL, datasetInput: unknown = null, contextInput: unknown = null) {
  const view = taxonomyReadModelView(modelInput);
  const record = view.model ? taxonomyRecordById(stateId, view.model) : null;
  if (!record) return { state: view.model ? "unavailable" : view.state, record: null, relationships: [], context: { state: "unavailable", verdict: null }, notice: "No source-backed record is available for this ID. No nearby record is substituted." };
  const relationships: Array<{ type: string; value: string | null; state: string; authority: string; artifact: string }> = [
    { type: "source_derivation", value: record.sourceProvenance, state: record.sourceProvenance === null ? "withheld" : "available", authority: record.authority, artifact: LEDGER },
    { type: "declared_role", value: [record.role, record.fineRole, record.universalClassification].filter(Boolean).join(" / "), state: "available", authority: record.authority, artifact: LEDGER },
    { type: "declared_office", value: record.office, state: record.officeStatus, authority: record.authority, artifact: LEDGER },
  ];
  for (const edge of record.declaredRelationships) relationships.push({ type: edge.type, value: `${edge.id}: ${edge.source} ${edge.directed ? "->" : "<->"} ${edge.target}; governing=${edge.governing}; ${edge.provenance}`, state: "available", authority: record.authority, artifact: NETWORK });
  if (record.declaredRelationships.length === 0) relationships.push({ type: "declared_network_relationship", value: null, state: "unavailable", authority: record.authority, artifact: NETWORK });
  if (record.tier?.startsWith("D")) {
    const dataset = dTierDatasetView(datasetInput, view.model!);
    const fifth = dataset.records.find((entry) => entry.identity.stateId === stateId)?.fifthSpace;
    relationships.push({ type: "fifth_space_description", value: fifth ? `span ${fifth.fifthSpan}; positions ${fifth.fifthPositions.join(",")}; holes ${fifth.holes}` : null, state: fifth ? "available" : dataset.state, authority: "planning_evidence", artifact: CENSUS });
  }
  if (relationships.length > MAX_ROWS) return { state: "incompatible", record: null, relationships: [], context: { state: "unavailable", verdict: null }, notice: "Declared explanation exceeds the bounded provenance row limit." };
  let context: { state: string; verdict: string | null; artifact?: string } = { state: "unavailable", verdict: null };
  if (contextInput !== null && contextInput !== undefined) {
    const candidate = contextInput as { candidateId?: unknown; candidateFingerprint?: unknown; verdict?: unknown; evidenceBindings?: { canonicalLedgerSha256?: unknown } };
    const compatible = candidate.candidateId === "TWIN_HUB_CONVERGENCE_v0" && !!view.model!.evidenceBindings.gov510 && candidate.candidateFingerprint === view.model!.evidenceBindings.gov510.candidateFingerprint && candidate.evidenceBindings?.canonicalLedgerSha256 === view.model!.sources[0].sha256 && ["confirmed", "refuted", "partial"].includes(String(candidate.verdict));
    context = compatible ? { state: "available", verdict: String(candidate.verdict), artifact: GOV510 } : { state: "incompatible", verdict: null };
  }
  return { state: "ready", record, relationships, context, notice: TAXONOMY_EXPLANATION_GUARD };
}

export function renderTaxonomyExplanation(container: HTMLElement, explanation: ReturnType<typeof explainTaxonomyRecord>): void {
  container.replaceChildren();
  const identity = document.createElement("p");
  identity.textContent = explanation.record ? `${explanation.record.name} / ${explanation.record.stateId} / ${explanation.record.tier ?? "tier withheld"} / ${explanation.record.forte} / ${explanation.record.authority}` : explanation.notice;
  container.append(identity);
  for (const relation of explanation.relationships) {
    const row = document.createElement("p");
    row.textContent = `${relation.type} / ${relation.state} / ${relation.value ?? "withheld or unavailable"} / ${relation.authority} / `;
    const link = document.createElement("a");
    link.textContent = relation.artifact;
    link.href = taxonomySourceLink(relation.artifact)!;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    row.append(link);
    container.append(row);
  }
  const context = document.createElement("p");
  context.textContent = `Optional GOV-510 context / planning_evidence / ${explanation.context.state} / ${explanation.context.verdict ?? "no research verdict"}. ${TAXONOMY_EXPLANATION_GUARD}`;
  if ("artifact" in explanation.context && explanation.context.artifact) {
    const link = document.createElement("a");
    link.textContent = explanation.context.artifact;
    link.href = taxonomySourceLink(explanation.context.artifact)!;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    context.append(" ", link);
  }
  container.append(context);
}
