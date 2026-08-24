import catalogDocument from "./generated/legal-moves.v1.json";
import { GOVERNORS, TIERS, type AnchorTier, type Governor, type NodesResponse, type OrreryNode } from "./types";

export const LEGAL_MOVE_SCHEMA_VERSION = "harmonic-orrery.legal-moves.v1";
export const LEGAL_MOVE_CATALOG_ID = "harmonic-orrery.modal-anchor-cycles.v1";

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

export interface LegalMoveOperator {
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

export interface LegalMoveProvenance {
  applicationId: string;
  projectionStatus: "canonical_modal_edge_projected";
  structuralEvidence: true;
  structuralEdgeTypes: "MODAL_SUCCESSOR";
  structuralEdgeIds: string[];
}

export interface LegalMove {
  id: string;
  sourceId: number;
  targetId: number;
  operatorId: "M";
  availability: "available";
  provenance: LegalMoveProvenance;
}

export interface LegalMoveCatalog {
  schemaVersion: typeof LEGAL_MOVE_SCHEMA_VERSION;
  catalogId: typeof LEGAL_MOVE_CATALOG_ID;
  catalogFingerprint: string;
  scope: LegalMoveCatalogScope;
  sources: LegalMoveCatalogSource[];
  operators: [LegalMoveOperator];
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
    source.nodesSchemaVersion !== "harmonic-orrery.nodes.v1" ||
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
    nodesSchemaVersion: "harmonic-orrery.nodes.v1",
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

function operator(value: unknown): LegalMoveOperator {
  const item = record(value, "catalog.operators[0]");
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
    "catalog.operators[0]",
  );
  if (
    item.operatorId !== "M" ||
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
    throw new Error("catalog.operators[0] is not the supported modal operator");
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

function provenance(value: unknown, moveId: string, index: number): LegalMoveProvenance {
  const item = record(value, `catalog.moves[${index}].provenance`);
  exactKeys(
    item,
    ["applicationId", "projectionStatus", "structuralEvidence", "structuralEdgeTypes", "structuralEdgeIds"],
    `catalog.moves[${index}].provenance`,
  );
  if (
    item.applicationId !== moveId ||
    item.projectionStatus !== "canonical_modal_edge_projected" ||
    item.structuralEvidence !== true ||
    item.structuralEdgeTypes !== "MODAL_SUCCESSOR" ||
    !Array.isArray(item.structuralEdgeIds) ||
    item.structuralEdgeIds.length === 0
  ) {
    throw new Error(`catalog.moves[${index}].provenance is not source-backed`);
  }

  return {
    applicationId: moveId,
    projectionStatus: "canonical_modal_edge_projected",
    structuralEvidence: true,
    structuralEdgeTypes: "MODAL_SUCCESSOR",
    structuralEdgeIds: item.structuralEdgeIds.map((edgeId, edgeIndex) =>
      string(edgeId, `catalog.moves[${index}].provenance.structuralEdgeIds[${edgeIndex}]`),
    ),
  };
}

function move(value: unknown, index: number, scopeIds: ReadonlySet<number>): LegalMove {
  const item = record(value, `catalog.moves[${index}]`);
  exactKeys(item, ["id", "sourceId", "targetId", "operatorId", "availability", "provenance"], `catalog.moves[${index}]`);
  const id = string(item.id, `catalog.moves[${index}].id`);
  const sourceId = anchorId(item.sourceId, `catalog.moves[${index}].sourceId`);
  const targetId = anchorId(item.targetId, `catalog.moves[${index}].targetId`);
  if (
    !/^M:[0-9]+:[0-9]+$/.test(id) ||
    id !== `M:${sourceId}:${targetId}` ||
    item.operatorId !== "M" ||
    item.availability !== "available" ||
    !scopeIds.has(sourceId) ||
    !scopeIds.has(targetId) ||
    sourceId === targetId
  ) {
    throw new Error(`catalog.moves[${index}] is not an available scoped modal move`);
  }

  return {
    id,
    sourceId,
    targetId,
    operatorId: "M",
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
  if (catalog.schemaVersion !== LEGAL_MOVE_SCHEMA_VERSION || catalog.catalogId !== LEGAL_MOVE_CATALOG_ID) {
    throw new Error("Unsupported legal-move catalog version");
  }
  if (!Array.isArray(catalog.sources) || catalog.sources.length < 4 || !Array.isArray(catalog.operators) || catalog.operators.length !== 1 || !Array.isArray(catalog.moves) || catalog.moves.length !== 21) {
    throw new Error("catalog has an invalid move catalog shape");
  }

  const parsedScope = scope(catalog.scope);
  const scopeIds = new Set(parsedScope.anchorIds);
  const moves = catalog.moves.map((item, index) => move(item, index, scopeIds));
  if (
    new Set(moves.map((item) => item.id)).size !== 21 ||
    new Set(moves.map((item) => item.sourceId)).size !== 21 ||
    new Set(moves.map((item) => item.targetId)).size !== 21
  ) {
    throw new Error("catalog moves must map each scoped anchor exactly once");
  }
  assertSevenStepTierCycles(moves, parsedScope.anchors);

  return {
    schemaVersion: LEGAL_MOVE_SCHEMA_VERSION,
    catalogId: LEGAL_MOVE_CATALOG_ID,
    catalogFingerprint: fingerprint(catalog.catalogFingerprint, "catalog.catalogFingerprint"),
    scope: parsedScope,
    sources: catalog.sources.map(source),
    operators: [operator(catalog.operators[0])],
    moves: moves.sort((left, right) => left.sourceId - right.sourceId),
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
  const movesBySourceId = new Map<number, readonly LegalMove[]>();
  for (const legalMove of catalog.moves) {
    const source = liveNodesById.get(legalMove.sourceId);
    const target = liveNodesById.get(legalMove.targetId);
    if (!source || !target || source.state.tier !== target.state.tier) {
      throw new LegalMoveCatalogCompatibilityError(
        "The bundled legal-move catalog contains a move outside the live anchor scope.",
      );
    }
    movesById.set(legalMove.id, legalMove);
    movesBySourceId.set(legalMove.sourceId, [legalMove]);
  }

  if (movesById.size !== 21 || movesBySourceId.size !== 21) {
    throw new LegalMoveCatalogCompatibilityError("The bundled legal-move catalog is incomplete.");
  }

  return { catalog, movesById, movesBySourceId };
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
