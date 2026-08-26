import catalogDocument from "./generated/legal-moves.v2.json";
import { GOVERNORS, TIERS, type AnchorTier, type Governor, type NodesResponse, type OrreryNode } from "./types";

export const LEGAL_MOVE_SCHEMA_VERSION = "harmonic-orrery.legal-moves.v2";
export const LEGAL_MOVE_CATALOG_ID = "harmonic-orrery.parallel-anchor-edges.v1";
export const LEGACY_CATALOG_ID = "harmonic-orrery.modal-anchor-cycles.v1";

type JsonRecord = Record<string, unknown>;

export interface LegalMoveCatalogScope {
  nodesSchemaVersion: NodesResponse["schemaVersion"];
  harmonicDescriptorReleaseId: NodesResponse["harmonicDescriptor"]["releaseId"];
  harmonicDescriptorFingerprint: string;
  anchorIds: number[];
  anchors: LegalMoveCatalogAnchor[];
}

export interface LegalMoveCatalogAnchor {
  stateId: number;
  tier: AnchorTier;
  forteFamily: OrreryNode["state"]["forteFamily"];
  office: Governor;
}

export interface LegalMoveCatalogSource {
  artifact: string;
  sha256: string;
  role: string;
}

export type LegalMoveOperatorId = "M" | `R${2 | 3 | 4 | 5 | 6 | 7}` | `L${2 | 3 | 4 | 5 | 6 | 7}`;

export interface ModalOperator {
  operatorId: "M";
  notation: "M";
  name: "Modal successor";
  operatorClass: "modal_re_rooting";
  degree: null;
  degreeGovernor: null;
  direction: "successor";
  inverseOperatorId: "M^6";
  partial: false;
  status: "structurally_validated";
}

export interface ParallelOperator {
  operatorId: `R${2 | 3 | 4 | 5 | 6 | 7}` | `L${2 | 3 | 4 | 5 | 6 | 7}`;
  notation: string;
  name: string;
  operatorClass: "fixed_degree_shift";
  degree: 2 | 3 | 4 | 5 | 6 | 7;
  degreeGovernor: Governor;
  direction: "raise" | "lower";
  inverseOperatorId: string;
  partial: true;
  status: "structurally_validated";
}

export type LegalMoveOperator = ModalOperator | ParallelOperator;

export interface LegalMoveProvenance {
  applicationId: string;
  projectionStatus: "canonical_modal_edge_projected" | "audited_parallel_edge_projected";
  structuralEvidence: boolean;
  structuralEdgeTypes: string | null;
  structuralEdgeIds: string[];
  // optional parallel fields, preserved for new catalog
  fieldEvidence?: boolean;
  provenanceEdgeTypes?: string | null;
  provenanceEdgeIds?: string[];
}

export interface LegalMove {
  id: string;
  sourceId: number;
  targetId: number;
  operatorId: LegalMoveOperatorId;
  availability: "available";
  provenance: LegalMoveProvenance;
}

export interface LegalMoveCatalog {
  schemaVersion: typeof LEGAL_MOVE_SCHEMA_VERSION;
  catalogId: typeof LEGAL_MOVE_CATALOG_ID | typeof LEGACY_CATALOG_ID;
  catalogFingerprint: string;
  scope: LegalMoveCatalogScope;
  sources: LegalMoveCatalogSource[];
  operators: LegalMoveOperator[];
  moves: LegalMove[];
}

export interface LegalMoveCatalogIndex {
  catalog: LegalMoveCatalog;
  movesById: ReadonlyMap<string, LegalMove>;
  movesBySourceId: ReadonlyMap<number, readonly LegalMove[]>;
}

export interface LegalMoveCatalogIdentity {
  legalMoveCatalogSchemaVersion: LegalMoveCatalog["schemaVersion"];
  legalMoveCatalogFingerprint: string;
}

export class LegalMoveCatalogCompatibilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LegalMoveCatalogCompatibilityError";
  }
}

function record(value: unknown, context: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${context} must be an object`);
  }

  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: readonly string[], context: string): void {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  if (actual.length !== sortedExpected.length || actual.some((key, index) => key !== sortedExpected[index])) {
    throw new Error(`${context} has unexpected fields`);
  }
}

function string(value: unknown, context: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${context} must be a non-empty string`);
  }

  return value;
}

function fingerprint(value: unknown, context: string): string {
  const parsed = string(value, context);
  if (!/^[a-f0-9]{64}$/.test(parsed)) {
    throw new Error(`${context} must be a SHA-256 fingerprint`);
  }

  return parsed;
}

function anchorId(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 4095) {
    throw new Error(`${context} must be an Orrery anchor ID`);
  }

  return value;
}

function scopeAnchor(value: unknown, index: number): LegalMoveCatalogAnchor {
  const item = record(value, `catalog.scope.anchors[${index}]`);
  exactKeys(item, ["stateId", "tier", "forteFamily", "office"], `catalog.scope.anchors[${index}]`);
  const stateId = anchorId(item.stateId, `catalog.scope.anchors[${index}].stateId`);
  if (
    !TIERS.includes(item.tier as AnchorTier) ||
    (item.forteFamily !== "7-35" && item.forteFamily !== "7-34" && item.forteFamily !== "7-33") ||
    !GOVERNORS.includes(item.office as Governor)
  ) {
    throw new Error(`catalog.scope.anchors[${index}] is not a supported anchor identity`);
  }

  return {
    stateId,
    tier: item.tier as AnchorTier,
    forteFamily: item.forteFamily,
    office: item.office as Governor,
  };
}

function scope(value: unknown): LegalMoveCatalogScope {
  const source = record(value, "catalog.scope");
  exactKeys(
    source,
    ["nodesSchemaVersion", "harmonicDescriptorReleaseId", "harmonicDescriptorFingerprint", "anchorIds", "anchors"],
    "catalog.scope",
  );
  if (
    source.nodesSchemaVersion !== "harmonic-orrery.nodes.v2" ||
    source.harmonicDescriptorReleaseId !== "harmonic-compression-candidate:CH_A012_q_v1:1.0.0" ||
    !Array.isArray(source.anchorIds) ||
    source.anchorIds.length !== 21 ||
    !Array.isArray(source.anchors) ||
    source.anchors.length !== 21
  ) {
    throw new Error("catalog.scope has an unsupported Orrery projection binding");
  }

  const anchorIds = source.anchorIds.map((value, index) => anchorId(value, `catalog.scope.anchorIds[${index}]`));
  if (
    new Set(anchorIds).size !== 21 ||
    anchorIds.some((value, index) => index > 0 && value <= anchorIds[index - 1])
  ) {
    throw new Error("catalog.scope.anchorIds must be 21 unique ascending anchor IDs");
  }
  const anchors = source.anchors.map(scopeAnchor);
  if (
    new Set(anchors.map((item) => item.stateId)).size !== 21 ||
    anchors.some((item, index) => item.stateId !== anchorIds[index])
  ) {
    throw new Error("catalog.scope.anchors must match the ordered scoped anchor IDs");
  }

  return {
    nodesSchemaVersion: "harmonic-orrery.nodes.v2",
    harmonicDescriptorReleaseId: "harmonic-compression-candidate:CH_A012_q_v1:1.0.0",
    harmonicDescriptorFingerprint: fingerprint(
      source.harmonicDescriptorFingerprint,
      "catalog.scope.harmonicDescriptorFingerprint",
    ),
    anchorIds,
    anchors,
  };
}

function source(value: unknown, index: number): LegalMoveCatalogSource {
  const item = record(value, `catalog.sources[${index}]`);
  exactKeys(item, ["artifact", "sha256", "role"], `catalog.sources[${index}]`);
  return {
    artifact: string(item.artifact, `catalog.sources[${index}].artifact`),
    sha256: fingerprint(item.sha256, `catalog.sources[${index}].sha256`),
    role: string(item.role, `catalog.sources[${index}].role`),
  };
}

function isParallelOperatorId(id: unknown): boolean {
  return typeof id === "string" && /^[RL][2-7]$/.test(id);
}

function operator(value: unknown, index: number): LegalMoveOperator {
  const item = record(value, `catalog.operators[${index}]`);
  exactKeys(
    item,
    [
      "operatorId",
      "notation",
      "name",
      "operatorClass",
      "degree",
      "degreeGovernor",
      "direction",
      "inverseOperatorId",
      "partial",
      "status",
    ],
    `catalog.operators[${index}]`,
  );
  // Modal M
  if (item.operatorId === "M") {
    if (
      item.notation !== "M" ||
      item.name !== "Modal successor" ||
      item.operatorClass !== "modal_re_rooting" ||
      item.degree !== null ||
      item.degreeGovernor !== null ||
      item.direction !== "successor" ||
      item.inverseOperatorId !== "M^6" ||
      item.partial !== false ||
      item.status !== "structurally_validated"
    ) {
      throw new Error(`catalog.operators[${index}] is not a supported modal operator`);
    }
    return {
      operatorId: "M",
      notation: "M",
      name: "Modal successor",
      operatorClass: "modal_re_rooting",
      degree: null,
      degreeGovernor: null,
      direction: "successor",
      inverseOperatorId: "M^6",
      partial: false,
      status: "structurally_validated",
    };
  }
  // Parallel R/L
  if (isParallelOperatorId(item.operatorId)) {
    const degree = item.degree as number;
    const degreeGovernor = item.degreeGovernor as string;
    const direction = item.direction as string;
    const validDegrees: Record<string, Governor> = {
      "2": "Jupiter",
      "3": "Mars",
      "4": "Sun",
      "5": "Venus",
      "6": "Mercury",
      "7": "Moon",
    };
    if (
      typeof degree !== "number" ||
      !Number.isInteger(degree) ||
      degree < 2 ||
      degree > 7 ||
      validDegrees[String(degree)] !== degreeGovernor ||
      !["raise", "lower"].includes(direction) ||
      typeof item.inverseOperatorId !== "string" ||
      item.partial !== true ||
      item.status !== "structurally_validated" ||
      item.operatorClass !== "fixed_degree_shift"
    ) {
      throw new Error(`catalog.operators[${index}] is not a supported parallel operator`);
    }
    return {
      operatorId: item.operatorId as ParallelOperator["operatorId"],
      notation: string(item.notation, `catalog.operators[${index}].notation`),
      name: string(item.name, `catalog.operators[${index}].name`),
      operatorClass: "fixed_degree_shift",
      degree: degree as 2 | 3 | 4 | 5 | 6 | 7,
      degreeGovernor: degreeGovernor as Governor,
      direction: direction as "raise" | "lower",
      inverseOperatorId: string(item.inverseOperatorId, `catalog.operators[${index}].inverseOperatorId`),
      partial: true,
      status: "structurally_validated",
    };
  }
  throw new Error(`catalog.operators[${index}].operatorId is not supported`);
}

function provenance(value: unknown, moveId: string, index: number): LegalMoveProvenance {
  const item = record(value, `catalog.moves[${index}].provenance`);
  // allow both legacy and parallel provenance shapes
  const hasLegacy = "structuralEdgeTypes" in item && "structuralEdgeIds" in item;
  const hasParallel = "provenanceEdgeTypes" in item || "fieldEvidence" in item;
  if (!hasLegacy && !hasParallel) {
    throw new Error(`catalog.moves[${index}].provenance is not source-backed`);
  }
  // Normalize: support both shapes
  const appId = string(item.applicationId, `catalog.moves[${index}].provenance.applicationId`);
  if (appId !== moveId) throw new Error(`catalog.moves[${index}].provenance.applicationId mismatch`);
  const projectionStatus = string(item.projectionStatus, `catalog.moves[${index}].provenance.projectionStatus`);
  if (
    projectionStatus !== "canonical_modal_edge_projected" &&
    projectionStatus !== "audited_parallel_edge_projected"
  ) {
    throw new Error(`catalog.moves[${index}].provenance.projectionStatus unsupported`);
  }
  if (typeof item.structuralEvidence !== "boolean") {
    throw new Error(`catalog.moves[${index}].provenance.structuralEvidence must be boolean`);
  }
  // structuralEdgeTypes may be string or null for parallel
  const structuralEdgeTypes =
    item.structuralEdgeTypes === null ? null : string(item.structuralEdgeTypes as unknown, `catalog.moves[${index}].provenance.structuralEdgeTypes`);
  if (!Array.isArray(item.structuralEdgeIds)) {
    throw new Error(`catalog.moves[${index}].provenance.structuralEdgeIds must be array`);
  }
  const structuralEdgeIds = (item.structuralEdgeIds as unknown[]).map((edgeId, edgeIndex) =>
    string(edgeId, `catalog.moves[${index}].provenance.structuralEdgeIds[${edgeIndex}]`),
  );
  if (structuralEdgeIds.length === 0) {
    throw new Error(`catalog.moves[${index}].provenance.structuralEdgeIds is empty`);
  }

  return {
    applicationId: moveId,
    projectionStatus: projectionStatus as LegalMoveProvenance["projectionStatus"],
    structuralEvidence: item.structuralEvidence as boolean,
    structuralEdgeTypes: structuralEdgeTypes as string | null,
    structuralEdgeIds,
    fieldEvidence: typeof item.fieldEvidence === "boolean" ? (item.fieldEvidence as boolean) : undefined,
    provenanceEdgeTypes:
      typeof item.provenanceEdgeTypes === "string" ? (item.provenanceEdgeTypes as string) : undefined,
    provenanceEdgeIds: Array.isArray(item.provenanceEdgeIds)
      ? (item.provenanceEdgeIds as unknown[]).map((v) => String(v))
      : undefined,
  };
}

function move(value: unknown, index: number, scopeIds: ReadonlySet<number>): LegalMove {
  const item = record(value, `catalog.moves[${index}]`);
  exactKeys(item, ["id", "sourceId", "targetId", "operatorId", "availability", "provenance"], `catalog.moves[${index}]`);
  const id = string(item.id, `catalog.moves[${index}].id`);
  const sourceId = anchorId(item.sourceId, `catalog.moves[${index}].sourceId`);
  const targetId = anchorId(item.targetId, `catalog.moves[${index}].targetId`);
  const operatorId = string(item.operatorId, `catalog.moves[${index}].operatorId`) as LegalMoveOperatorId;
  const idPattern = /^([M]|R[2-7]|L[2-7]):[0-9]+:[0-9]+$/;
  if (
    !idPattern.test(id) ||
    id !== `${operatorId}:${sourceId}:${targetId}` ||
    (operatorId !== "M" && !isParallelOperatorId(operatorId)) ||
    item.availability !== "available" ||
    !scopeIds.has(sourceId) ||
    !scopeIds.has(targetId) ||
    sourceId === targetId
  ) {
    throw new Error(`catalog.moves[${index}] is not an available scoped move`);
  }

  return {
    id,
    sourceId,
    targetId,
    operatorId,
    availability: "available",
    provenance: provenance(item.provenance, id, index),
  };
}

function assertSevenStepTierCycles(moves: readonly LegalMove[], anchors: readonly LegalMoveCatalogAnchor[]): void {
  const anchorsById = new Map(anchors.map((anchor) => [anchor.stateId, anchor]));
  const movesBySourceId = new Map(moves.map((move) => [move.sourceId, move]));

  for (const tier of TIERS) {
    const tierAnchors = anchors.filter((anchor) => anchor.tier === tier);
    if (tierAnchors.length !== 7) {
      throw new Error("catalog scope must contain seven anchors in every tier");
    }

    const startAnchorId = tierAnchors[0].stateId;
    const visited = new Set<number>();
    let currentAnchorId = startAnchorId;
    for (let step = 0; step < 7; step += 1) {
      const move = movesBySourceId.get(currentAnchorId);
      const target = move ? anchorsById.get(move.targetId) : undefined;
      if (!move || !target || target.tier !== tier || visited.has(currentAnchorId)) {
        throw new Error("catalog moves must form three seven-step modal cycles");
      }
      visited.add(currentAnchorId);
      currentAnchorId = move.targetId;
    }
    if (currentAnchorId !== startAnchorId || visited.size !== 7) {
      throw new Error("catalog moves must form three seven-step modal cycles");
    }
  }
}

export function parseLegalMoveCatalog(value: unknown): LegalMoveCatalog {
  const catalog = record(value, "catalog");
  exactKeys(
    catalog,
    ["schemaVersion", "catalogId", "catalogFingerprint", "scope", "sources", "operators", "moves"],
    "catalog",
  );
  if (
    catalog.schemaVersion !== LEGAL_MOVE_SCHEMA_VERSION ||
    (catalog.catalogId !== LEGAL_MOVE_CATALOG_ID && catalog.catalogId !== LEGACY_CATALOG_ID)
  ) {
    throw new Error("Unsupported legal-move catalog version");
  }
  if (
    !Array.isArray(catalog.sources) ||
    catalog.sources.length < 3 ||
    !Array.isArray(catalog.operators) ||
    catalog.operators.length < 1 ||
    catalog.operators.length > 12 ||
    !Array.isArray(catalog.moves) ||
    catalog.moves.length < 21 ||
    catalog.moves.length > 60
  ) {
    throw new Error("catalog has an invalid move catalog shape");
  }

  const parsedScope = scope(catalog.scope);
  const scopeIds = new Set(parsedScope.anchorIds);
  const operators = catalog.operators.map((op, idx) => operator(op, idx));
  const moves = catalog.moves.map((item, index) => move(item, index, scopeIds));

  if (new Set(moves.map((item) => item.id)).size !== moves.length) {
    throw new Error("catalog moves must have unique ids");
  }

  // Legacy modal catalog must preserve 1-to-1 cycles; parallel catalog covers all anchors with multiple edges
  const isLegacy = catalog.catalogId === LEGACY_CATALOG_ID;
  if (isLegacy) {
    if (
      moves.length !== 21 ||
      new Set(moves.map((item) => item.sourceId)).size !== 21 ||
      new Set(moves.map((item) => item.targetId)).size !== 21
    ) {
      throw new Error("legacy catalog moves must map each scoped anchor exactly once");
    }
    assertSevenStepTierCycles(moves, parsedScope.anchors);
  } else {
    // Parallel catalog: 60 moves, each anchor appears as source and target at least once, all within scope
    if (moves.length !== 60) {
      throw new Error("parallel catalog must contain exactly 60 moves");
    }
    if (operators.length !== 12) {
      throw new Error("parallel catalog must contain 12 operators");
    }
    const sources = new Set(moves.map((m) => m.sourceId));
    const targets = new Set(moves.map((m) => m.targetId));
    if (sources.size !== 21 || targets.size !== 21) {
      throw new Error("parallel catalog must cover all 21 anchors as source and target");
    }
    for (const op of operators) {
      if (op.operatorClass !== "fixed_degree_shift") {
        throw new Error("parallel catalog operators must be fixed_degree_shift");
      }
    }
    // Ensure every operator has at least one move
    const opsInMoves = new Set(moves.map((m) => m.operatorId));
    for (const op of operators) {
      if (!opsInMoves.has(op.operatorId)) {
        throw new Error(`parallel operator ${op.operatorId} has no moves`);
      }
    }
  }

  return {
    schemaVersion: LEGAL_MOVE_SCHEMA_VERSION,
    catalogId: catalog.catalogId as LegalMoveCatalog["catalogId"],
    catalogFingerprint: fingerprint(catalog.catalogFingerprint, "catalog.catalogFingerprint"),
    scope: parsedScope,
    sources: catalog.sources.map(source),
    operators: operators as LegalMoveOperator[],
    moves: moves.sort((left, right) => left.sourceId - right.sourceId || left.targetId - right.targetId || left.operatorId.localeCompare(right.operatorId)),
  };
}

export const LEGAL_MOVE_CATALOG = parseLegalMoveCatalog(catalogDocument as unknown);

export function catalogIdentity(catalog: LegalMoveCatalog = LEGAL_MOVE_CATALOG): LegalMoveCatalogIdentity {
  return {
    legalMoveCatalogSchemaVersion: catalog.schemaVersion,
    legalMoveCatalogFingerprint: catalog.catalogFingerprint,
  };
}

export function createLegalMoveCatalogIndex(
  response: NodesResponse,
  catalog: LegalMoveCatalog = LEGAL_MOVE_CATALOG,
): LegalMoveCatalogIndex {
  const liveNodesById = new Map(response.nodes.map((node) => [node.state.stateId, node]));
  const liveAnchorIds = [...liveNodesById.keys()].sort((left, right) => left - right);
  if (
    response.schemaVersion !== catalog.scope.nodesSchemaVersion ||
    response.harmonicDescriptor.releaseId !== catalog.scope.harmonicDescriptorReleaseId ||
    response.harmonicDescriptor.candidateFingerprint !== catalog.scope.harmonicDescriptorFingerprint ||
    liveAnchorIds.length !== catalog.scope.anchorIds.length ||
    liveAnchorIds.some((anchorId, index) => anchorId !== catalog.scope.anchorIds[index])
  ) {
    throw new LegalMoveCatalogCompatibilityError(
      "The bundled legal-move catalog does not match this live anchor projection.",
    );
  }

  for (const expectedAnchor of catalog.scope.anchors) {
    const liveAnchor = liveNodesById.get(expectedAnchor.stateId);
    if (
      !liveAnchor ||
      liveAnchor.state.tier !== expectedAnchor.tier ||
      liveAnchor.state.forteFamily !== expectedAnchor.forteFamily ||
      liveAnchor.resolution.office !== expectedAnchor.office ||
      liveAnchor.scopedHarmonicDescriptor.stateGovernor !== expectedAnchor.office
    ) {
      throw new LegalMoveCatalogCompatibilityError(
        "The bundled legal-move catalog does not match the live anchor identities.",
      );
    }
  }

  const movesById = new Map<string, LegalMove>();
  const movesBySourceId = new Map<number, LegalMove[]>();
  for (const legalMove of catalog.moves) {
    const source = liveNodesById.get(legalMove.sourceId);
    const target = liveNodesById.get(legalMove.targetId);
    if (!source || !target) {
      throw new LegalMoveCatalogCompatibilityError(
        "The bundled legal-move catalog contains a move outside the live anchor scope.",
      );
    }
    // For parallel catalog, moves may cross tiers — do not enforce tier equality.
    // Legacy modal catalog did require tier equality; we keep it permissive for parallel.
    movesById.set(legalMove.id, legalMove);
    const existing = movesBySourceId.get(legalMove.sourceId) ?? [];
    movesBySourceId.set(legalMove.sourceId, [...existing, legalMove]);
  }

  const expectedMoveCount = catalog.catalogId === LEGACY_CATALOG_ID ? 21 : 60;
  const expectedSourceCount = 21;
  if (movesById.size !== expectedMoveCount) {
    throw new LegalMoveCatalogCompatibilityError("The bundled legal-move catalog is incomplete.");
  }
  if (catalog.catalogId === LEGACY_CATALOG_ID && movesBySourceId.size !== expectedSourceCount) {
    throw new LegalMoveCatalogCompatibilityError("The bundled legal-move catalog is incomplete.");
  }
  // Parallel catalog: every anchor must have at least one outgoing move (already validated) and total 21 sources
  if (catalog.catalogId !== LEGACY_CATALOG_ID && movesBySourceId.size !== expectedSourceCount) {
    throw new LegalMoveCatalogCompatibilityError("The bundled parallel catalog must have 21 source groups.");
  }

  return { catalog, movesById, movesBySourceId: movesBySourceId as ReadonlyMap<number, readonly LegalMove[]> };
}

export function legalMovesForSource(
  index: LegalMoveCatalogIndex,
  sourceId: number | null | undefined,
): readonly LegalMove[] {
  return sourceId === null || sourceId === undefined ? [] : index.movesBySourceId.get(sourceId) ?? [];
}

export function moveTargetOffice(move: LegalMove, nodesById: ReadonlyMap<number, OrreryNode>): Governor {
  const target = nodesById.get(move.targetId);
  if (!target) {
    throw new Error(`Move ${move.id} target is absent from the live projection.`);
  }

  return target.resolution.office;
}
