import bestiaryData from "../../../data/bestiary-data.json";

export interface NarrativeSummary {
  narrativeKind: "deterministic_template" | "ai_generated";
  text: string;
  model: string | null;
  sha256: string | null;
}

export interface CommonFields {
  kind: string;
  id: string;
  name: string;
  admission: "admitted" | "proposed";
  summary: NarrativeSummary;
  sourcePath: string;
  scatterX: number;
  scatterY: number;
}

export interface ScaleState extends CommonFields {
  kind: "scaleState";
  nodeId: number;
  forte: string | null;
  pitchSetMask: number | null;
  pitchSetPcs: number[] | null;
  bitLabel: string | null;
  bitReverseLabel: string | null;
  role: "anchor" | "satellite" | "boundary";
  fineRole: string | null;
  tier: string | null;
  office: string | null;
  officeIndex: number | null;
  officeBearing: boolean;
  chirality: "achiral" | "chiral" | null;
  orientation: string | null;
  assignmentStatus: string;
  resolutionClass: string | null;
  parents: number[];
  incomingCount: number;
  outgoingCount: number;
  canonicalProfileId: string | null;
  compiledProfileId: string | null;
}

export interface ScaleFamily extends CommonFields {
  kind: "scaleFamily";
  forte: string;
  stateCount: number;
  modalOrientationCount: number;
  chirality: "achiral" | "chiral" | null;
  registeredBeforeCompletion: number;
  missingBeforeCompletion: number;
  zPartner: string | null;
  memberStateIds: number[];
}

export interface GovernorOffice extends CommonFields {
  kind: "governorOffice";
  office: string;
  officeIndex: number;
  color: string | null;
  profileId: string | null;
  stateCount: number;
  symbol: string | null;
}

export interface CanonicalProfile extends CommonFields {
  kind: "canonicalProfile";
  profileId: string;
  profileVersion: string;
  office: string;
  officeIndex: number;
  type: string;
  canonicalIdentity: {
    stateId: number;
    stateName: string;
    mode: string;
    forteFamily: string;
    pitchMask: string;
    pitchSet: string;
    anchorTier: string;
    chirality: string;
    assignmentStatus: string;
  };
  photonic: { photonicId: string; wavelengthNm: number; color: string } | null;
  intrinsicFingerprint: string;
  landformReferences: number;
  unresolvedScopeBindings: number;
}

export interface MutationOperator extends CommonFields {
  kind: "mutationOperator";
  operatorId: string;
  notation: string;
  operatorClass: "modal_re_rooting" | "root_phase" | "fixed_degree_shift";
  degree: number | null;
  degreeGovernor: string | null;
  direction: "successor" | "raise" | "lower";
  deltaSemitones: number | null;
  domainRule: string;
  action: string;
  inverseOperatorId: string;
  conjugateOperatorId: string;
  partial: boolean;
  status: string;
  applicationCount: number;
  domainSize: number;
  imageSize: number;
  structuralSupportCount: number;
  fieldSupportCount: number;
  projectionGapId: string;
  semanticOperatorId: string | null;
}

export interface ModalCycle extends CommonFields {
  kind: "modalCycle";
  cycleId: string;
  representativeStateId: number;
  cycleLength: number;
  forte: string;
  role: string;
  fineRole: string;
  tier: string;
  orientation: string | null;
  chirality: string | null;
  officeBearing: boolean;
  officeSequence: string[] | null;
  officeDeltaSequence: number[] | null;
  memberStateIds: number[];
}

export interface CandidateExtension extends CommonFields {
  kind: "candidateExtension";
  extensionId: string;
  category: "court" | "phenomena" | "thermodynamic";
  roadmapRef: string;
  proposedInvariants: string[];
}

export type Archetype =
  | ScaleState
  | ScaleFamily
  | GovernorOffice
  | CanonicalProfile
  | MutationOperator
  | ModalCycle
  | CandidateExtension;

export interface Relationship {
  id: string;
  source: number;
  target: number;
  type: string;
  governing: boolean;
  directed: boolean;
  mode: string | null;
  mutation: string | null;
  degree: number | null;
  hamming: number | null;
  selected: boolean;
  eligible: boolean;
  provenance: string;
}

export interface CommutationPair {
  operatorA: string;
  operatorB: string;
  sourceStatesTested: number;
  aThenBDefined: number;
  bThenADefined: number;
  bothDefined: number;
  equalWhenBothDefined: number;
  unequalWhenBothDefined: number;
  domainAsymmetry: number;
  neitherDefined: number;
  classification: "weak_common_domain_commutation" | "strong_partial_commutation";
}

export interface ProjectionGap {
  operatorId: string;
  formalApplications: number;
  structuralProjection: number;
  fieldProjection: number;
  unionProjection: number;
  unprojectedApplications: number;
  unionCoverageRate: number;
  interpretation: string;
}

export interface BestiaryData {
  schemaVersion: string;
  releaseId: string;
  build: { tool: string; toolVersion: string };
  sources: { path: string; sha256: string }[];
  summary: { archetypeCount: number; byCategory: Record<string, number> };
  archetypes: Archetype[];
  relationships: Relationship[];
  commutationPairs: CommutationPair[];
  projectionGaps: ProjectionGap[];
}

export const bestiary = bestiaryData as unknown as BestiaryData;

const STRUCTURAL_TYPES = new Set([
  "CONSTRUCTS",
  "GOVERNS",
  "MODAL_SUCCESSOR",
  "SEAT_CONTACT",
]);

export type RelationKind = "structural" | "field";

export function relationKind(relationship: Relationship): RelationKind {
  return STRUCTURAL_TYPES.has(relationship.type) ? "structural" : "field";
}

export function relationsFor(nodeId: number): {
  incoming: Relationship[];
  outgoing: Relationship[];
} {
  const incoming = bestiary.relationships.filter(
    (relationship) =>
      (relationKind(relationship) === "structural" &&
        relationship.target === nodeId) ||
      (relationKind(relationship) === "field" &&
        (relationship.source === nodeId || relationship.target === nodeId)),
  );
  const outgoing = bestiary.relationships.filter(
    (relationship) =>
      relationKind(relationship) === "structural" &&
      relationship.source === nodeId,
  );
  return { incoming, outgoing };
}

export function archetypeHref(id: string): string {
  return `/archetypes/${id}`;
}

export function stateHref(nodeId: number): string {
  return `/archetypes/state:${nodeId}`;
}

export function operatorHref(operatorId: string): string {
  const canonical = operatorId === "M^6" ? "M" : operatorId;
  return `/archetypes/operator:${canonical}`;
}

export function stateById(nodeId: number): ScaleState | undefined {
  return byKind("scaleState").find(
    (archetype) => archetype.nodeId === nodeId,
  ) as ScaleState | undefined;
}

export function familyForForte(forte: string): ScaleFamily | undefined {
  return byKind("scaleFamily").find(
    (archetype) => archetype.forte === forte,
  ) as ScaleFamily | undefined;
}

export function statesByOffice(office: string): ScaleState[] {
  return byKind("scaleState").filter(
    (archetype) => archetype.office === office,
  ) as ScaleState[];
}

export function officeForName(office: string): GovernorOffice | undefined {
  return byKind("governorOffice").find(
    (archetype) => archetype.office === office,
  ) as GovernorOffice | undefined;
}

export function profileForOffice(office: string): CanonicalProfile | undefined {
  return byKind("canonicalProfile").find(
    (archetype) => archetype.office === office,
  ) as CanonicalProfile | undefined;
}

export function cyclesContaining(nodeId: number): ModalCycle[] {
  return byKind("modalCycle").filter((archetype) =>
    archetype.memberStateIds.includes(nodeId),
  ) as ModalCycle[];
}

export const commutationOrder: string[] = [
  "R1",
  "L1",
  "R2",
  "L2",
  "R3",
  "L3",
  "R4",
  "L4",
  "R5",
  "L5",
  "R6",
  "L6",
  "R7",
  "L7",
];

export function commutationPairFor(
  operatorA: string,
  operatorB: string,
): CommutationPair | undefined {
  return bestiary.commutationPairs.find(
    (pair) => pair.operatorA === operatorA && pair.operatorB === operatorB,
  );
}

export function commutationPartners(
  operatorId: string,
): { partner: string; pair: CommutationPair }[] {
  const partners: { partner: string; pair: CommutationPair }[] = [];
  for (const pair of bestiary.commutationPairs) {
    if (pair.operatorA === operatorId) {
      partners.push({ partner: pair.operatorB, pair });
    } else if (pair.operatorB === operatorId) {
      partners.push({ partner: pair.operatorA, pair });
    }
  }
  return partners.sort(
    (a, b) =>
      commutationOrder.indexOf(a.partner) - commutationOrder.indexOf(b.partner),
  );
}

export function byKind(kind: Archetype["kind"]): Archetype[] {
  return bestiary.archetypes.filter((archetype) => archetype.kind === kind);
}

export function getArchetype(id: string): Archetype | undefined {
  return bestiary.archetypes.find((archetype) => archetype.id === id);
}

export function projectionGapFor(operatorId: string): ProjectionGap | undefined {
  return bestiary.projectionGaps.find((gap) => gap.operatorId === operatorId);
}

export function search(query: string): Archetype[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") return bestiary.archetypes;
  return bestiary.archetypes.filter((archetype) =>
    archetypeSearchText(archetype).toLowerCase().includes(normalized),
  );
}

export function archetypeSearchText(archetype: Archetype): string {
  const bits = [archetype.id, archetype.name];
  if (archetype.kind === "scaleState") {
    if (archetype.forte) bits.push(archetype.forte);
    if (archetype.office) bits.push(archetype.office);
  }
  if (archetype.kind === "scaleFamily") bits.push(archetype.forte);
  if (archetype.kind === "mutationOperator") {
    bits.push(archetype.notation, archetype.operatorId);
  }
  if (archetype.kind === "governorOffice") bits.push(archetype.office);
  if (archetype.kind === "canonicalProfile") bits.push(archetype.office);
  if (archetype.kind === "modalCycle") bits.push(archetype.forte);
  return bits.join(" ");
}

export interface FacetValue {
  value: string;
  label: string;
  count: number;
}

export interface Facet {
  key: string;
  label: string;
  values: FacetValue[];
}

function countFacet(field: (archetype: Archetype) => string | null): FacetValue[] {
  const counts = new Map<string, number>();
  for (const archetype of bestiary.archetypes) {
    const value = field(archetype);
    if (value === null) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

const kindFacetLabels: Record<string, string> = {
  scaleState: "States",
  scaleFamily: "Families",
  governorOffice: "Offices",
  canonicalProfile: "Profiles",
  mutationOperator: "Operators",
  modalCycle: "Cycles",
  candidateExtension: "Candidates",
};

const kindFacetOrder: string[] = [
  "scaleState",
  "scaleFamily",
  "governorOffice",
  "canonicalProfile",
  "mutationOperator",
  "modalCycle",
  "candidateExtension",
];

const kindFacetCounts = new Map<string, number>();
for (const archetype of bestiary.archetypes) {
  kindFacetCounts.set(
    archetype.kind,
    (kindFacetCounts.get(archetype.kind) ?? 0) + 1,
  );
}

const kindFacetValues: FacetValue[] = kindFacetOrder.map((kind) => ({
  value: kind,
  label: kindFacetLabels[kind],
  count: kindFacetCounts.get(kind) ?? 0,
}));

export const facetIndex: Facet[] = [
  {
    key: "kind",
    label: "Kind",
    values: kindFacetValues,
  },
  {
    key: "admission",
    label: "Admission",
    values: countFacet((archetype) => archetype.admission),
  },
  {
    key: "role",
    label: "Role",
    values: countFacet((archetype) =>
      archetype.kind === "scaleState" ? archetype.role : null,
    ),
  },
  {
    key: "tier",
    label: "Tier",
    values: countFacet((archetype) =>
      archetype.kind === "scaleState" ? archetype.tier : null,
    ),
  },
  {
    key: "office",
    label: "Office",
    values: countFacet((archetype) =>
      archetype.kind === "scaleState" ? archetype.office : null,
    ),
  },
];

export const officeColors: Record<string, string> = {
  Sun: "#FF4444",
  Moon: "#FF8C00",
  Mars: "#FFD700",
  Mercury: "#44BB44",
  Jupiter: "#4488FF",
  Venus: "#8B008B",
  Saturn: "#9400D3",
};

export const kindLabels: Record<string, string> = {
  scaleState: "Scale state",
  scaleFamily: "Scale family",
  governorOffice: "Governor office",
  canonicalProfile: "Canonical profile",
  mutationOperator: "Mutation operator",
  modalCycle: "Modal cycle",
  candidateExtension: "Candidate extension",
};

export const kindMeta: Record<
  string,
  { label: string; glyph: string; glyphClass: string }
> = {
  scaleState: { label: "Scale state", glyph: "◇", glyphClass: "text-frost/70" },
  scaleFamily: { label: "Scale family", glyph: "⊞", glyphClass: "text-muted" },
  governorOffice: { label: "Governor office", glyph: "☉", glyphClass: "text-accent" },
  canonicalProfile: { label: "Canonical profile", glyph: "✦", glyphClass: "text-muted" },
  mutationOperator: { label: "Mutation operator", glyph: "⇄", glyphClass: "text-muted" },
  modalCycle: { label: "Modal cycle", glyph: "◎", glyphClass: "text-muted" },
  candidateExtension: {
    label: "Candidate extension",
    glyph: "▷",
    glyphClass: "text-amber-300",
  },
};
