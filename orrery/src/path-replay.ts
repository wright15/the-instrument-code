// Path replay planner — a renderer, never an executor.
//
// This module consumes an already-verified path and emits one voiced hop per
// step for the Orrery audio engine. It never computes transition legality:
// Orrery hops must resolve in the committed legal-move catalog (`movesById`)
// and remain contiguous; fivefold hops follow the committed traversal cycle
// mirrored from `src/fivefold/quintessence.py` (`TRAVERSAL_CYCLE`, pinned by
// `tests/fixtures/fivefold_q_table.v1.json`). Nothing here mutates canonical
// data, the Court runtime, the catalog, or the audio manifest.
//
// Sonification layers (see `scrum/plan/harmonic-comprehension-map.md`):
// - cursor (base, admitted): orbit position z <-> pitch class t_z. A single
//   moving tone traces the fifth-stack; Orrery hops voice the destination
//   selection exactly as the existing selection path does.
// - bucket-overlay (hypothesis, opt-in): the state as a color. Provisional
//   formalization for the traversal states is orbit-prefix accumulation (the
//   pitches visited so far); the still anchor sounds the generative window
//   (the pure stack). This is an offered experiment, not an asserted claim;
//   the sprint memo records the listening verdict.
//
// The Q substrate is rendered, not executed: fivefold data feeds pitch
// content only, and no fivefold module imports Orrery code.
//
// Golden path (BL-021): the C-minor parallel-seam route C Aeolian -> C
// harmonic minor is planned from artifact-derived presentation data; the
// bridge hop is the first replay hop whose legality is both-collections
// containment rather than single-collection membership.
//
// Golden path (BL-022): the parallel-minor mode-axis route C Ionian <->
// C Aeolian moves inside one set-class (7-35) on the shared tonic pc 0. The
// stepwise walk is the committed legal-move vocabulary (L7/L3/L6 flattening,
// R6/R3/R7 brightening); the audit's M successor applications compress adjacent
// L pairs into one operation and are rendered as demonstrations with audit
// provenance, carrying no legality claim (M is not in the legal-move catalog).

import {
  OFFICE_PALETTES,
  resolveAudioSelection,
  type AudioSelection,
  type AudioVoicingMode,
  type ReplayVoice,
} from "./audio";
import type { CourtPosition } from "./court";
import type { DerivedPath } from "./path-find";
import type { LegalMoveCatalogIndex } from "./moves";
import type { OrreryNode } from "./types";

// Mirrors src/fivefold/quintessence.py TRAVERSAL_CYCLE / STILL_SET /
// GENERATIVE_WINDOW. Drift-checked against the committed fixture in
// orrery/src/path-replay.test.ts.
export const FIVEFOLD_TRAVERSAL_CYCLE: readonly number[] = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
export const FIVEFOLD_STILL_SET: readonly number[] = [12, 13, 14, 15];
export const FIVEFOLD_GENERATIVE_WINDOW: readonly number[] = FIVEFOLD_TRAVERSAL_CYCLE.slice(0, 5);
export const FIVEFOLD_REST_STATE = 15;

export type ReplayMapping = "cursor" | "bucket-overlay";

export interface ReplayHopBase {
  index: number;
  label: string;
  pitchClasses: readonly number[];
}

export interface OrreryReplayHop extends ReplayHopBase {
  kind: "route";
  moveId: string;
  operatorId: string;
  sourceId: number;
  targetId: number;
  cursorPitchClass: number | undefined;
  selection: AudioSelection;
}

export interface FivefoldReplayHop extends ReplayHopBase {
  kind: "orbit" | "rest";
  z: number;
  state: number;
  stateBits: string;
  stillSet: boolean;
  cursorPitchClass: number | undefined;
}

export interface CadenceReplayHop extends ReplayHopBase {
  kind: "cadence";
  chordLabel: string;
  chordRoot: number;
  collection: "aeolian" | "harmonic-minor";
  seamCrossing: boolean;
}

export type OrreryReplayPlan =
  | { substrate: "orrery-route"; kind: "ok"; hops: OrreryReplayHop[] }
  | { substrate: "orrery-route"; kind: "invalid"; message: string };

export type FivefoldReplayPlan =
  | {
      substrate: "fivefold-q-orbit";
      kind: "ok";
      mapping: ReplayMapping;
      closureHopIndex: number;
      hops: FivefoldReplayHop[];
    }
  | { substrate: "fivefold-q-orbit"; kind: "invalid"; message: string };

export type CadenceReplayPlan =
  | { substrate: "golden-cadence"; kind: "ok"; seamHopIndex: number; hops: CadenceReplayHop[] }
  | { substrate: "golden-cadence"; kind: "invalid"; message: string };

/**
 * A hop of the registered golden path (BL-021). `kind: "bridge"` hops carry
 * `legality: "both-collections-containment"` — the first replay legality class
 * that asserts containment in two collections at once, which is what makes the
 * voicing a bridge. `seamCrossing` marks the bridge pivot and its
 * harmonic-minor resolution (the raised-seventh arrival).
 */
export interface GoldenPathReplayHop extends ReplayHopBase {
  kind: "chord" | "bridge";
  nodeId: string;
  chordLabel: string;
  chordRoot: number | undefined;
  collection: "aeolian" | "harmonic-minor" | "bridge";
  seamCrossing: boolean;
  legality: "collection-membership" | "both-collections-containment";
}

export type GoldenPathReplayPlan =
  | {
      substrate: "golden-path";
      kind: "ok";
      bridgeNodeId: GoldenPathBridgeId;
      bridgeHopIndex: number;
      seamHopIndex: number;
      hops: GoldenPathReplayHop[];
    }
  | { substrate: "golden-path"; kind: "invalid"; message: string };

export type ReplayPlan =
  | OrreryReplayPlan
  | FivefoldReplayPlan
  | CadenceReplayPlan
  | GoldenPathReplayPlan
  | ParallelMinorReplayPlan
  | DerivedPathReplayPlan;

export interface OrreryReplayOptions {
  startAnchorId: number | null;
  moveIds: readonly string[];
  catalog: LegalMoveCatalogIndex;
  nodesById: ReadonlyMap<number, OrreryNode>;
  courtPosition: CourtPosition;
  voicingMode?: AudioVoicingMode;
}

function hopLabel(nodesById: ReadonlyMap<number, OrreryNode>, stateId: number): string {
  return nodesById.get(stateId)?.state.name ?? `state ${stateId}`;
}

/**
 * Plan an Orrery route replay from the recorded session route. Contiguity and
 * catalog membership are checked; the planner does not decide legality beyond
 * resolving the recorded moves against the committed catalog.
 */
export function planOrreryRouteReplay(options: OrreryReplayOptions): OrreryReplayPlan {
  const { startAnchorId, moveIds, catalog, nodesById, courtPosition } = options;
  const voicingMode: AudioVoicingMode = options.voicingMode ?? "heptatonic";
  if (startAnchorId === null || moveIds.length === 0) {
    return {
      substrate: "orrery-route",
      kind: "invalid",
      message: "No local route is recorded. Start a route and apply declared moves before replaying sound.",
    };
  }

  const hops: OrreryReplayHop[] = [];
  let expectedSourceId = startAnchorId;
  for (const [index, moveId] of moveIds.entries()) {
    const move = catalog.movesById.get(moveId);
    if (!move) {
      return {
        substrate: "orrery-route",
        kind: "invalid",
        message: `Route hop ${index + 1} (${moveId}) is not in the committed legal-move catalog.`,
      };
    }
    if (move.sourceId !== expectedSourceId) {
      return {
        substrate: "orrery-route",
        kind: "invalid",
        message: `Route hop ${index + 1} (${moveId}) is not contiguous with the recorded route.`,
      };
    }
    const target = nodesById.get(move.targetId);
    if (!target) {
      return {
        substrate: "orrery-route",
        kind: "invalid",
        message: `Route hop ${index + 1} target ${move.targetId} is unavailable in the live projection.`,
      };
    }
    const selection = resolveAudioSelection(target, courtPosition, voicingMode);
    hops.push({
      index,
      kind: "route",
      label: `${move.operatorId}: ${hopLabel(nodesById, move.sourceId)} -> ${hopLabel(nodesById, move.targetId)}`,
      pitchClasses: [...selection.retainedPitchClasses],
      moveId,
      operatorId: move.operatorId,
      sourceId: move.sourceId,
      targetId: move.targetId,
      cursorPitchClass: selection.retainedPitchClasses[0],
      selection,
    });
    expectedSourceId = move.targetId;
  }

  return { substrate: "orrery-route", kind: "ok", hops };
}

export interface FivefoldReplayOptions {
  mapping?: ReplayMapping;
  startState?: number;
  includeRest?: boolean;
}

function binaryState(state: number): string {
  return state.toString(2).padStart(4, "0");
}

/**
 * Plan the fivefold Q orbit replay. The orbit runs z=0..12 so closure (the
 * return to the origin) is an audible hop; an optional rest hop then sounds
 * the still anchor under the selected mapping (cursor: silence = absence;
 * bucket-overlay: the pure stack = arrival).
 */
export function planFivefoldOrbitReplay(options: FivefoldReplayOptions = {}): FivefoldReplayPlan {
  const mapping: ReplayMapping = options.mapping ?? "cursor";
  const startState = options.startState ?? FIVEFOLD_TRAVERSAL_CYCLE[0];
  const includeRest = options.includeRest ?? true;

  if (mapping !== "cursor" && mapping !== "bucket-overlay") {
    return { substrate: "fivefold-q-orbit", kind: "invalid", message: `Unknown replay mapping: ${mapping}` };
  }
  const startIndex = FIVEFOLD_TRAVERSAL_CYCLE.indexOf(startState);
  if (startIndex < 0) {
    return {
      substrate: "fivefold-q-orbit",
      kind: "invalid",
      message: "The still set has no orbit position. Start the replay inside the traversal set.",
    };
  }

  const hops: FivefoldReplayHop[] = [];
  for (let z = 0; z <= FIVEFOLD_TRAVERSAL_CYCLE.length; z += 1) {
    const cursorPitchClass = FIVEFOLD_TRAVERSAL_CYCLE[(startIndex + z) % FIVEFOLD_TRAVERSAL_CYCLE.length];
    // Orbit-prefix accumulation (provisional bucket formalization): every
    // position keeps the pitches already visited; from closure the full orbit
    // has been heard.
    const prefixLength = Math.min(z + 1, FIVEFOLD_TRAVERSAL_CYCLE.length);
    const prefix = Array.from(
      { length: prefixLength },
      (_value, offset) => FIVEFOLD_TRAVERSAL_CYCLE[(startIndex + offset) % FIVEFOLD_TRAVERSAL_CYCLE.length],
    );
    const closure = z === FIVEFOLD_TRAVERSAL_CYCLE.length;
    hops.push({
      index: z,
      kind: "orbit",
      label: closure
        ? `z=${z}: closure, return to ${binaryState(cursorPitchClass)}`
        : `z=${z}: ${binaryState(cursorPitchClass)} (t=${cursorPitchClass})`,
      pitchClasses: mapping === "cursor" ? [cursorPitchClass] : prefix,
      z,
      state: cursorPitchClass,
      stateBits: binaryState(cursorPitchClass),
      stillSet: false,
      cursorPitchClass,
    });
  }

  if (includeRest) {
    const z = FIVEFOLD_TRAVERSAL_CYCLE.length + 1;
    hops.push({
      index: z,
      kind: "rest",
      label: `rest: still anchor ${binaryState(FIVEFOLD_REST_STATE)} (${mapping === "cursor" ? "absence" : "pure stack"})`,
      pitchClasses: mapping === "cursor" ? [] : [...FIVEFOLD_GENERATIVE_WINDOW],
      z,
      state: FIVEFOLD_REST_STATE,
      stateBits: binaryState(FIVEFOLD_REST_STATE),
      stillSet: true,
      cursorPitchClass: undefined,
    });
  }

  return {
    substrate: "fivefold-q-orbit",
    kind: "ok",
    mapping,
    closureHopIndex: FIVEFOLD_TRAVERSAL_CYCLE.length,
    hops,
  };
}

// The Q substrate is not an office walk. Its authored timbre uses the Mercury
// (Quintessence engine emblem) A0 preset as a presentation choice; it asserts
// no canonical correspondence.
const FIVEFOLD_REPLAY_PRESET = OFFICE_PALETTES.Mercury.preset;

// Golden cadence (BL-021 seed). The Am-G-F-E structural reading: three
// intra-collection moves inside A Aeolian (7-35), then one seam-crossing move
// into A harmonic minor (7-32, raised seventh G#) per the Court-layer bridge
// admitted by CRT-302/CRT-304. Collections and chords are presentation data
// for the replay renderer; the membership check below is the only legality
// this planner asserts.
export const ANDALUSIAN_AEOLIAN_COLLECTION: readonly number[] = [9, 11, 0, 2, 4, 5, 7];
export const ANDALUSIAN_HARMONIC_MINOR_COLLECTION: readonly number[] = [9, 11, 0, 2, 4, 5, 8];

export interface CadenceChord {
  label: string;
  root: number;
  pitchClasses: readonly number[];
  collection: "aeolian" | "harmonic-minor";
}

export const ANDALUSIAN_CADENCE_CHORDS: readonly CadenceChord[] = [
  { label: "Am", root: 9, pitchClasses: [9, 0, 4], collection: "aeolian" },
  { label: "G", root: 7, pitchClasses: [7, 11, 2], collection: "aeolian" },
  { label: "F", root: 5, pitchClasses: [5, 9, 0], collection: "aeolian" },
  { label: "E", root: 4, pitchClasses: [4, 8, 11], collection: "harmonic-minor" },
];

function collectionFor(kind: CadenceChord["collection"]): readonly number[] {
  return kind === "aeolian" ? ANDALUSIAN_AEOLIAN_COLLECTION : ANDALUSIAN_HARMONIC_MINOR_COLLECTION;
}

/**
 * Plan the Andalusian cadence replay. Every chord must be contained in its
 * declared admitted collection, and the seam-crossing hop is flagged in the
 * trace (the first hop whose collection differs from its predecessor).
 */
export function planAndalusianCadenceReplay(): CadenceReplayPlan {
  const hops: CadenceReplayHop[] = [];
  let seamHopIndex = -1;
  let previousCollection: CadenceChord["collection"] | undefined;

  for (const [index, chord] of ANDALUSIAN_CADENCE_CHORDS.entries()) {
    const collection = collectionFor(chord.collection);
    const outside = chord.pitchClasses.filter((pitchClass) => !collection.includes(pitchClass));
    if (outside.length > 0) {
      return {
        substrate: "golden-cadence",
        kind: "invalid",
        message: `Cadence chord ${chord.label} contains pitches outside its admitted collection: ${outside.join(", ")}`,
      };
    }
    const seamCrossing = previousCollection !== undefined && previousCollection !== chord.collection;
    if (seamCrossing && seamHopIndex < 0) {
      seamHopIndex = index;
    }
    hops.push({
      index,
      kind: "cadence",
      label: `${chord.label} (${chord.collection})${seamCrossing ? " [seam crossing]" : ""}`,
      pitchClasses: [...chord.pitchClasses],
      chordLabel: chord.label,
      chordRoot: chord.root,
      collection: chord.collection,
      seamCrossing,
    });
    previousCollection = chord.collection;
  }

  if (seamHopIndex < 0) {
    return {
      substrate: "golden-cadence",
      kind: "invalid",
      message: "The cadence never crosses a seam; the golden path requires a collection change.",
    };
  }

  return { substrate: "golden-cadence", kind: "ok", seamHopIndex, hops };
}

// The cadence lives on an A tonic; no office is asserted. Its authored timbre
// uses the Jupiter (Aeolian office) A0 preset as a presentation choice.
const CADENCE_REPLAY_PRESET = OFFICE_PALETTES.Jupiter.preset;

// Registered golden path (BL-021): C Aeolian -> C harmonic minor with the
// tonic pc 0 held across the seam. Origin collection is 7-35:3 (the E-flat
// major collection sounding on C, tonic pc 0 as mode context); destination is
// 7-32:0 (C harmonic minor). The seam is the raised seventh: 10 -> 11, one
// semitone, six common tones. Every number below mirrors an artifact lookup in
// derived/hypergraph/bipartite-inclusion-v1.json (7-35:3 and 7-32:0 share
// exactly one anchored pentatonic per direction checks; both listed bridge
// candidates are contained in both endpoint collections). The planner asserts
// containment; it derives no containment itself.
export const GOLDEN_PATH_C_AEOLIAN_COLLECTION: readonly number[] = [0, 2, 3, 5, 7, 8, 10];
export const GOLDEN_PATH_C_HARMONIC_MINOR_COLLECTION: readonly number[] = [0, 2, 3, 5, 7, 8, 11];
export const GOLDEN_PATH_ORIGIN_NODE_ID = "7-35:3";
export const GOLDEN_PATH_DESTINATION_NODE_ID = "7-32:0";

export type GoldenPathBridgeId = "5-23:0" | "5-27:0";

export interface GoldenPathBridgeVoicing {
  nodeId: GoldenPathBridgeId;
  setClassId: "5-23" | "5-27";
  pitchClasses: readonly number[];
}

// Both admitted-class bridge voicings shared by the endpoint collections. The
// maintainer listening audition chose 5-27:0 ("more character and energy") for
// the registered path; 5-23:0 is the documented alternative. Both are legal
// pivots and remain selectable voicing options.
export const GOLDEN_PATH_BRIDGE_VOICINGS: readonly GoldenPathBridgeVoicing[] = [
  { nodeId: "5-23:0", setClassId: "5-23", pitchClasses: [0, 2, 3, 5, 7] },
  { nodeId: "5-27:0", setClassId: "5-27", pitchClasses: [0, 3, 5, 7, 8] },
];
export const GOLDEN_PATH_DEFAULT_BRIDGE: GoldenPathBridgeId = "5-27:0";

// The bridge is a brief pivot, not a fifth chord of equal weight: its hold is
// distinct from the chord-hop step. Rendering parameter; not part of the
// bridge-color audition.
export const GOLDEN_PATH_BRIDGE_HOLD_SECONDS = 0.6;

export function isGoldenPathBridgeId(value: string): value is GoldenPathBridgeId {
  return GOLDEN_PATH_BRIDGE_VOICINGS.some((voicing) => voicing.nodeId === value);
}

export interface GoldenPathChord {
  label: string;
  root: number;
  pitchClasses: readonly number[];
  collection: "aeolian" | "harmonic-minor";
}

// Cm - Bb - Ab - G: the Andalusian descent on a fixed C tonic. The G chord's
// B natural (11) is the raised seventh and the only pitch outside the origin
// collection.
export const GOLDEN_PATH_CADENCE_CHORDS: readonly GoldenPathChord[] = [
  { label: "Cm", root: 0, pitchClasses: [0, 3, 7], collection: "aeolian" },
  { label: "Bb", root: 10, pitchClasses: [10, 2, 5], collection: "aeolian" },
  { label: "Ab", root: 8, pitchClasses: [8, 0, 3], collection: "aeolian" },
  { label: "G", root: 7, pitchClasses: [7, 11, 2], collection: "harmonic-minor" },
];

export interface GoldenPathReplayOptions {
  bridge?: GoldenPathBridgeId;
}

function goldenPathCollectionFor(kind: GoldenPathChord["collection"]): readonly number[] {
  return kind === "aeolian"
    ? GOLDEN_PATH_C_AEOLIAN_COLLECTION
    : GOLDEN_PATH_C_HARMONIC_MINOR_COLLECTION;
}

/**
 * Plan the registered golden-path replay: Cm - Bb - Ab inside C Aeolian, one
 * bridge voicing contained in both endpoint collections, then the raised
 * seventh arrival on G inside C harmonic minor. Interior chords verify by
 * collection membership; the bridge verifies by both-collections containment.
 */
export function planGoldenPathCadenceReplay(
  options: GoldenPathReplayOptions = {},
): GoldenPathReplayPlan {
  const bridgeNodeId = options.bridge ?? GOLDEN_PATH_DEFAULT_BRIDGE;
  const bridge = GOLDEN_PATH_BRIDGE_VOICINGS.find((voicing) => voicing.nodeId === bridgeNodeId);
  if (!bridge) {
    return { substrate: "golden-path", kind: "invalid", message: `Unknown golden-path bridge voicing: ${bridgeNodeId}` };
  }
  const outsideOrigin = bridge.pitchClasses.filter(
    (pitchClass) => !GOLDEN_PATH_C_AEOLIAN_COLLECTION.includes(pitchClass),
  );
  const outsideDestination = bridge.pitchClasses.filter(
    (pitchClass) => !GOLDEN_PATH_C_HARMONIC_MINOR_COLLECTION.includes(pitchClass),
  );
  if (outsideOrigin.length > 0 || outsideDestination.length > 0) {
    return {
      substrate: "golden-path",
      kind: "invalid",
      message: `Bridge ${bridge.nodeId} is not contained in both endpoint collections.`,
    };
  }

  const hops: GoldenPathReplayHop[] = [];
  let bridgeHopIndex = -1;
  let seamHopIndex = -1;
  for (const chord of GOLDEN_PATH_CADENCE_CHORDS) {
    if (chord.collection === "harmonic-minor" && bridgeHopIndex < 0) {
      bridgeHopIndex = hops.length;
      seamHopIndex = hops.length;
      hops.push({
        index: hops.length,
        kind: "bridge",
        label: `bridge ${bridge.nodeId} [seam crossing]`,
        pitchClasses: [...bridge.pitchClasses],
        nodeId: bridge.nodeId,
        chordLabel: "",
        chordRoot: undefined,
        collection: "bridge",
        seamCrossing: true,
        legality: "both-collections-containment",
      });
    }
    const collection = goldenPathCollectionFor(chord.collection);
    const outside = chord.pitchClasses.filter((pitchClass) => !collection.includes(pitchClass));
    if (outside.length > 0) {
      return {
        substrate: "golden-path",
        kind: "invalid",
        message: `Golden-path chord ${chord.label} contains pitches outside its admitted collection: ${outside.join(", ")}`,
      };
    }
    const arrival = chord.collection === "harmonic-minor";
    hops.push({
      index: hops.length,
      kind: "chord",
      label: `${chord.label} (${chord.collection})${arrival ? " [seam arrival]" : ""}`,
      pitchClasses: [...chord.pitchClasses],
      nodeId: arrival ? GOLDEN_PATH_DESTINATION_NODE_ID : GOLDEN_PATH_ORIGIN_NODE_ID,
      chordLabel: chord.label,
      chordRoot: chord.root,
      collection: chord.collection,
      seamCrossing: arrival,
      legality: "collection-membership",
    });
  }

  if (bridgeHopIndex < 0 || seamHopIndex < 0) {
    return {
      substrate: "golden-path",
      kind: "invalid",
      message: "The golden path never reaches its harmonic-minor destination.",
    };
  }

  return {
    substrate: "golden-path",
    kind: "ok",
    bridgeNodeId: bridge.nodeId,
    bridgeHopIndex,
    seamHopIndex,
    hops,
  };
}

// ---------------------------------------------------------------------------
// Parallel-minor mode-axis golden path (BL-022)
// ---------------------------------------------------------------------------
//
// C Ionian <-> C Aeolian on the shared tonic pc 0: the same rotated 7-35
// structure with a different focal point. The four states below are the
// parallel-mode readings of the tonic-fixed walk; node ids follow the
// collection-rooted convention (7-35:r, parent major scale rooted at r) while
// pitch classes stay tonic-fixed at pc 0, mirroring the BL-021 fixture
// convention. The stepwise moves and the M compression provenance are pinned
// against the committed legal-move catalog and the mutation-algebra audit in
// orrery/src/path-replay.test.ts; the planner asserts its declared constants
// and derives nothing.

export type ParallelMinorMode = "ionian" | "mixolydian" | "dorian" | "aeolian";

export type ParallelMinorRoute =
  | "walk-ionian-to-aeolian"
  | "walk-aeolian-to-ionian"
  | "m-demonstration-compress-first"
  | "m-demonstration-compress-second";

export const PARALLEL_MINOR_ROUTES: readonly ParallelMinorRoute[] = [
  "walk-ionian-to-aeolian",
  "walk-aeolian-to-ionian",
  "m-demonstration-compress-first",
  "m-demonstration-compress-second",
];

export type ParallelMinorDirection = "ionian-to-aeolian" | "aeolian-to-ionian";
export type ParallelMinorVariant = "walk" | "m-demonstration";

export const PARALLEL_MINOR_TONIC_PITCH_CLASS = 0;
export const PARALLEL_MINOR_SET_CLASS_ID = "7-35";

export interface ParallelMinorState {
  mode: ParallelMinorMode;
  nodeId: string;
  stateId: number;
  pitchClasses: readonly number[];
  triadLabel: string;
  triadPitchClasses: readonly number[];
}

export const PARALLEL_MINOR_STATES: readonly ParallelMinorState[] = [
  {
    mode: "ionian",
    nodeId: "7-35:0",
    stateId: 2741,
    pitchClasses: [0, 2, 4, 5, 7, 9, 11],
    triadLabel: "C major triad",
    triadPitchClasses: [0, 4, 7],
  },
  {
    mode: "mixolydian",
    nodeId: "7-35:5",
    stateId: 1717,
    pitchClasses: [0, 2, 4, 5, 7, 9, 10],
    triadLabel: "C major triad",
    triadPitchClasses: [0, 4, 7],
  },
  {
    mode: "dorian",
    nodeId: "7-35:10",
    stateId: 1709,
    pitchClasses: [0, 2, 3, 5, 7, 9, 10],
    triadLabel: "C minor triad",
    triadPitchClasses: [0, 3, 7],
  },
  {
    mode: "aeolian",
    nodeId: "7-35:3",
    stateId: 1453,
    pitchClasses: [0, 2, 3, 5, 7, 8, 10],
    triadLabel: "C minor triad",
    triadPitchClasses: [0, 3, 7],
  },
];

export const PARALLEL_MINOR_WALK_MOVES: Readonly<Record<ParallelMinorDirection, readonly string[]>> = {
  "ionian-to-aeolian": ["L7:2741:1717", "L3:1717:1709", "L6:1709:1453"],
  "aeolian-to-ionian": ["R6:1453:1709", "R3:1709:1717", "R7:1717:2741"],
};

/**
 * An audit M (modal successor) application rendered for comparison. M is not a
 * committed legal-move catalog operator, so these hops are demonstrations with
 * audit provenance; each one compresses two adjacent walk steps into one
 * successor operation. Sources: seven-governors-mutation-algebra-audit /
 * audit/operator-applications.csv rows `M:2741:1709` and `M:1717:1453`.
 */
export interface ParallelMinorMApplication {
  applicationId: string;
  canonicalId: string;
  auditSource: string;
  status: string;
  sourceStateId: number;
  targetStateId: number;
  compresses: readonly string[];
}

export const PARALLEL_MINOR_M_APPLICATIONS: readonly ParallelMinorMApplication[] = [
  {
    applicationId: "M:2741:1709",
    canonicalId: "modal:A0:2741:1709",
    auditSource: "seven-governors-mutation-algebra-audit/audit/operator-applications.csv:291",
    status: "formal_substrate_observed",
    sourceStateId: 2741,
    targetStateId: 1709,
    compresses: ["L7:2741:1717", "L3:1717:1709"],
  },
  {
    applicationId: "M:1717:1453",
    canonicalId: "modal:A0:1717:1453",
    auditSource: "seven-governors-mutation-algebra-audit/audit/operator-applications.csv:165",
    status: "formal_substrate_observed",
    sourceStateId: 1717,
    targetStateId: 1453,
    compresses: ["L3:1717:1709", "L6:1709:1453"],
  },
];

export const PARALLEL_MINOR_TRIAD_HOLD_SECONDS = 0.6;

export interface ParallelMinorCollectionHop extends ReplayHopBase {
  kind: "collection";
  layer: "walk";
  nodeId: string;
  mode: ParallelMinorMode;
  moveId: string | null;
  legality: "set-class-preserved";
  setClassId: "7-35";
  rotationAxis: true;
  seamCrossing: false;
}

export interface ParallelMinorTriadHop extends ReplayHopBase {
  kind: "triad";
  layer: "triad-overlay";
  nodeId: string;
  mode: ParallelMinorMode;
  triadLabel: string;
  minorThird: boolean;
  arrival: boolean;
  legality: null;
}

export interface ParallelMinorMJumpHop extends ReplayHopBase {
  kind: "m-jump";
  demonstration: true;
  nodeId: string;
  mode: ParallelMinorMode;
  sourceNodeId: string;
  applicationId: string;
  canonicalId: string;
  auditSource: string;
  compresses: readonly string[];
  legality: null;
  setClassId: "7-35";
  rotationAxis: true;
  seamCrossing: false;
}

export type ParallelMinorReplayHop =
  | ParallelMinorCollectionHop
  | ParallelMinorTriadHop
  | ParallelMinorMJumpHop;

export type ParallelMinorReplayPlan =
  | {
      substrate: "golden-path-parallel-minor";
      kind: "ok";
      route: ParallelMinorRoute;
      direction: ParallelMinorDirection;
      variant: ParallelMinorVariant;
      includeTriadOverlay: boolean;
      mJumpIndices: number[];
      hops: ParallelMinorReplayHop[];
    }
  | { substrate: "golden-path-parallel-minor"; kind: "invalid"; message: string };

export interface ParallelMinorReplayOptions {
  route?: ParallelMinorRoute;
  includeTriadOverlay?: boolean;
}

export function isParallelMinorRoute(value: string): value is ParallelMinorRoute {
  return (PARALLEL_MINOR_ROUTES as readonly string[]).includes(value);
}

interface ParallelMinorRouteSteps {
  direction: ParallelMinorDirection;
  variant: ParallelMinorVariant;
  stateIndices: readonly number[];
  moves: readonly (string | null)[];
  mApplication: ParallelMinorMApplication | null;
}

function parallelMinorRouteSteps(route: ParallelMinorRoute): ParallelMinorRouteSteps | null {
  const forward = PARALLEL_MINOR_WALK_MOVES["ionian-to-aeolian"];
  const reverse = PARALLEL_MINOR_WALK_MOVES["aeolian-to-ionian"];
  const compressFirst = PARALLEL_MINOR_M_APPLICATIONS[0];
  const compressSecond = PARALLEL_MINOR_M_APPLICATIONS[1];
  switch (route) {
    case "walk-ionian-to-aeolian":
      return {
        direction: "ionian-to-aeolian",
        variant: "walk",
        stateIndices: [0, 1, 2, 3],
        moves: [null, ...forward],
        mApplication: null,
      };
    case "walk-aeolian-to-ionian":
      return {
        direction: "aeolian-to-ionian",
        variant: "walk",
        stateIndices: [3, 2, 1, 0],
        moves: [null, ...reverse],
        mApplication: null,
      };
    case "m-demonstration-compress-first":
      return {
        direction: "ionian-to-aeolian",
        variant: "m-demonstration",
        stateIndices: [0, 2, 3],
        moves: [null, compressFirst.applicationId, forward[2]],
        mApplication: compressFirst,
      };
    case "m-demonstration-compress-second":
      return {
        direction: "ionian-to-aeolian",
        variant: "m-demonstration",
        stateIndices: [0, 1, 3],
        moves: [null, forward[0], compressSecond.applicationId],
        mApplication: compressSecond,
      };
    default:
      return null;
  }
}

function parallelMinorPitchDelta(
  from: readonly number[],
  to: readonly number[],
): { removed: number[]; added: number[] } {
  return {
    removed: from.filter((pitchClass) => !to.includes(pitchClass)),
    added: to.filter((pitchClass) => !from.includes(pitchClass)),
  };
}

function capitalizeMode(mode: ParallelMinorMode): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function parallelMinorStepError(
  states: readonly ParallelMinorState[],
  moves: readonly (string | null)[],
  mApplication: ParallelMinorMApplication | null,
): string | null {
  if (states.length !== moves.length) {
    return "Parallel-minor route steps are inconsistent.";
  }
  for (const state of states) {
    if (!state.pitchClasses.includes(PARALLEL_MINOR_TONIC_PITCH_CLASS)) {
      return `Parallel-minor state ${state.nodeId} does not hold the tonic pc ${PARALLEL_MINOR_TONIC_PITCH_CLASS}.`;
    }
    if (state.pitchClasses.length !== 7) {
      return `Parallel-minor state ${state.nodeId} is not a weight-7 set.`;
    }
  }
  for (let index = 1; index < states.length; index += 1) {
    const from = states[index - 1];
    const to = states[index];
    const moveId = moves[index];
    if (!moveId) {
      return `Parallel-minor step ${index} carries no move identity.`;
    }
    const delta = parallelMinorPitchDelta(from.pitchClasses, to.pitchClasses);
    if (moveId === mApplication?.applicationId) {
      if (mApplication.sourceStateId !== from.stateId || mApplication.targetStateId !== to.stateId) {
        return `M demonstration ${moveId} does not match its declared source/target states.`;
      }
      if (delta.removed.length !== 2 || delta.added.length !== 2) {
        return `M demonstration ${moveId} must compress exactly two walk steps.`;
      }
      continue;
    }
    const parts = moveId.split(":");
    const operatorId = parts[0];
    const isLower = operatorId === "L7" || operatorId === "L3" || operatorId === "L6";
    const isRaise = operatorId === "R7" || operatorId === "R3" || operatorId === "R6";
    if (
      parts.length !== 3 ||
      (!isLower && !isRaise) ||
      Number(parts[1]) !== from.stateId ||
      Number(parts[2]) !== to.stateId
    ) {
      return `Parallel-minor move ${moveId} does not match the declared states.`;
    }
    if (delta.removed.length !== 1 || delta.added.length !== 1) {
      return `Parallel-minor move ${moveId} must change exactly one pitch class.`;
    }
    if (isLower && delta.added[0] !== delta.removed[0] - 1) {
      return `Parallel-minor move ${moveId} must lower its degree by one semitone.`;
    }
    if (isRaise && delta.added[0] !== delta.removed[0] + 1) {
      return `Parallel-minor move ${moveId} must raise its degree by one semitone.`;
    }
  }
  return null;
}

/**
 * Plan the parallel-minor mode-axis golden path (BL-022). The stepwise walk is
 * the legal-move vocabulary; the M-demonstration routes render one audit M
 * application in place of the two walk steps it compresses. Every walk hop
 * asserts the mode-axis legality class `set-class-preserved` (same set-class,
 * same tonic, one lowered degree); M hops are demonstration-typed and carry no
 * legality. With `includeTriadOverlay` (default true) each state is followed by
 * its tonic triad, so the minor-third arrival is heard at the step where the
 * collection actually flips it (Dorian, flattening; Mixolydian, brightening).
 */
export function planParallelMinorModulationReplay(
  options: ParallelMinorReplayOptions = {},
): ParallelMinorReplayPlan {
  const route = options.route ?? "walk-ionian-to-aeolian";
  const includeTriadOverlay = options.includeTriadOverlay ?? true;
  const steps = parallelMinorRouteSteps(route);
  if (!steps) {
    return { substrate: "golden-path-parallel-minor", kind: "invalid", message: `Unknown parallel-minor route: ${route}` };
  }

  const states = steps.stateIndices.map((stateIndex) => PARALLEL_MINOR_STATES[stateIndex]);
  const stepError = parallelMinorStepError(states, steps.moves, steps.mApplication);
  if (stepError) {
    return { substrate: "golden-path-parallel-minor", kind: "invalid", message: stepError };
  }

  const hops: ParallelMinorReplayHop[] = [];
  const mJumpIndices: number[] = [];
  const mApplication = steps.mApplication;
  let previousMinorThird: boolean | null = null;
  for (const [index, state] of states.entries()) {
    const moveId = steps.moves[index];
    if (index > 0 && mApplication !== null && moveId === mApplication.applicationId) {
      const source = states[index - 1];
      mJumpIndices.push(hops.length);
      hops.push({
        index: hops.length,
        kind: "m-jump",
        demonstration: true,
        sourceNodeId: source.nodeId,
        applicationId: mApplication.applicationId,
        canonicalId: mApplication.canonicalId,
        auditSource: mApplication.auditSource,
        compresses: [...mApplication.compresses],
        label: `${mApplication.applicationId} [audit demonstration] (${capitalizeMode(source.mode)} -> ${capitalizeMode(state.mode)}; compresses ${mApplication.compresses.join(" + ")})`,
        pitchClasses: [...state.pitchClasses],
        nodeId: state.nodeId,
        mode: state.mode,
        legality: null,
        setClassId: "7-35",
        rotationAxis: true,
        seamCrossing: false,
      });
    } else {
      hops.push({
        index: hops.length,
        kind: "collection",
        layer: "walk",
        nodeId: state.nodeId,
        mode: state.mode,
        moveId,
        pitchClasses: [...state.pitchClasses],
        label:
          moveId === null
            ? `C ${capitalizeMode(state.mode)} collection (origin)`
            : `C ${capitalizeMode(state.mode)} collection (${moveId})`,
        legality: "set-class-preserved",
        setClassId: "7-35",
        rotationAxis: true,
        seamCrossing: false,
      });
    }

    if (includeTriadOverlay) {
      const minorThird = state.triadPitchClasses.includes(3);
      const arrival = previousMinorThird !== null && previousMinorThird !== minorThird;
      hops.push({
        index: hops.length,
        kind: "triad",
        layer: "triad-overlay",
        nodeId: state.nodeId,
        mode: state.mode,
        triadLabel: state.triadLabel,
        pitchClasses: [...state.triadPitchClasses],
        minorThird,
        arrival,
        label: `${state.triadLabel}${arrival ? ` [${minorThird ? "minor" : "major"} third arrives]` : ""}`,
        legality: null,
      });
      previousMinorThird = minorThird;
    }
  }

  return {
    substrate: "golden-path-parallel-minor",
    kind: "ok",
    route,
    direction: steps.direction,
    variant: steps.variant,
    includeTriadOverlay,
    mJumpIndices,
    hops,
  };
}

// The parallel-minor path spans the Ionian/Aeolian duality on one tonic. Its
// authored timbre reuses the Jupiter (Aeolian office) A0 preset for continuity
// with the BL-021 golden path; a presentation choice, no pitch claim.
const PARALLEL_MINOR_REPLAY_PRESET = OFFICE_PALETTES.Jupiter.preset;

// ---------------------------------------------------------------------------
// Derived-path replay (BL-028)
// ---------------------------------------------------------------------------
//
// The finder (`path-find.ts`) derives a path over the composed graph; this
// planner renders it and asserts each hop's legality. Operator hops resolve in
// the committed legal-move catalog (`catalog-membership`). Containment hops
// assert the pentatonic subset relation against every heptatonic neighbor on
// the path; a pentatonic node with heptatonic neighbors on both sides is a
// bridge crossing (`both-collections-containment`, reusing the BL-021 class),
// otherwise a single containment step (`containment-membership`). Where two
// consecutive operator hops equal an audit M application's compressed pair, the
// first hop is annotated with the application id — annotation only; the M
// application is never walked as a legal move.

export type DerivedPathLegality =
  | "catalog-membership"
  | "both-collections-containment"
  | "containment-membership";

export interface DerivedPathReplayHop extends ReplayHopBase {
  kind: "derived-node";
  nodeId: string;
  nodeKind: "heptatonic" | "pentatonic";
  setClassId: string;
  arrivedBy: "origin" | "operator" | "containment";
  moveId: string | null;
  legality: DerivedPathLegality | null;
  bridge: boolean;
  admittedBridge: boolean;
  mShortcut: string | null;
}

export interface DerivedPathMShortcut {
  applicationId: string;
  canonicalId: string;
  hopIndices: readonly number[];
}

export type DerivedPathReplayPlan =
  | {
      substrate: "derived-path";
      kind: "ok";
      originId: string;
      destinationId: string;
      hopCount: number;
      crossesBridge: boolean;
      mShortcuts: readonly DerivedPathMShortcut[];
      hops: DerivedPathReplayHop[];
    }
  | { substrate: "derived-path"; kind: "invalid"; message: string };

function invalidDerivedPlan(message: string): DerivedPathReplayPlan {
  return { substrate: "derived-path", kind: "invalid", message };
}

/**
 * Plan the replay of a finder-produced derived path. Every hop is re-asserted
 * here (catalog move identity for operator hops, subset relations for
 * containment hops); a malformed path fails closed.
 */
export function planDerivedPathReplay(path: DerivedPath): DerivedPathReplayPlan {
  if (path.nodes.length === 0 || path.nodes.length !== path.edges.length + 1) {
    return invalidDerivedPlan("Derived path is malformed: node and edge counts disagree.");
  }
  if (path.nodes[0].id !== path.originId || path.nodes[path.nodes.length - 1].id !== path.destinationId) {
    return invalidDerivedPlan("Derived path endpoints do not match its declared origin/destination.");
  }

  const hops: DerivedPathReplayHop[] = [];
  for (const [index, node] of path.nodes.entries()) {
    if (index === 0) {
      hops.push({
        index: 0,
        kind: "derived-node",
        nodeId: node.id,
        nodeKind: node.kind,
        setClassId: node.setClassId,
        arrivedBy: "origin",
        moveId: null,
        legality: null,
        bridge: false,
        admittedBridge: node.admittedBridge,
        mShortcut: null,
        label: `${node.id} (${node.kind} origin)`,
        pitchClasses: [...node.pitchClasses],
      });
      continue;
    }

    const edge = path.edges[index - 1];
    if (edge.kind === "operator") {
      if (!edge.moveId || !edge.operatorId) {
        return invalidDerivedPlan(`Derived path hop ${index} is an operator hop without a move identity.`);
      }
      hops.push({
        index,
        kind: "derived-node",
        nodeId: node.id,
        nodeKind: node.kind,
        setClassId: node.setClassId,
        arrivedBy: "operator",
        moveId: edge.moveId,
        legality: "catalog-membership",
        bridge: false,
        admittedBridge: false,
        mShortcut: null,
        label: `${node.id} (${edge.moveId})`,
        pitchClasses: [...node.pitchClasses],
      });
      continue;
    }

    const pentatonicIndex = node.kind === "pentatonic" ? index : index - 1;
    const pentatonicNode = path.nodes[pentatonicIndex];
    if (pentatonicNode.kind !== "pentatonic") {
      return invalidDerivedPlan(`Derived path hop ${index} is a containment hop without a pentatonic node.`);
    }
    const neighborIndices = [pentatonicIndex - 1, pentatonicIndex + 1];
    const heptatonicNeighbors = neighborIndices
      .map((neighborIndex) => path.nodes[neighborIndex])
      .filter((neighbor): neighbor is NonNullable<typeof neighbor> => Boolean(neighbor) && neighbor.kind === "heptatonic");
    if (heptatonicNeighbors.length === 0) {
      return invalidDerivedPlan(`Containment hop ${index} (${pentatonicNode.id}) has no heptatonic endpoint.`);
    }
    for (const neighbor of heptatonicNeighbors) {
      const outside = pentatonicNode.pitchClasses.filter(
        (pitchClass) => !neighbor.pitchClasses.includes(pitchClass),
      );
      if (outside.length > 0) {
        return invalidDerivedPlan(
          `Containment hop ${index} (${pentatonicNode.id}) is not contained in ${neighbor.id}.`,
        );
      }
    }
    const bridge = heptatonicNeighbors.length === 2;
    hops.push({
      index,
      kind: "derived-node",
      nodeId: node.id,
      nodeKind: node.kind,
      setClassId: node.setClassId,
      arrivedBy: "containment",
      moveId: null,
      legality: bridge ? "both-collections-containment" : "containment-membership",
      bridge,
      admittedBridge: pentatonicNode.admittedBridge,
      mShortcut: null,
      label: `${node.id} (${node.kind}${bridge ? ", bridge crossing" : ""}${pentatonicNode.admittedBridge ? ", admitted bridge" : ""})`,
      pitchClasses: [...node.pitchClasses],
    });
  }

  const mShortcuts: DerivedPathMShortcut[] = [];
  for (let index = 0; index + 1 < hops.length; index += 1) {
    const first = hops[index];
    const second = hops[index + 1];
    if (first.arrivedBy !== "operator" || second.arrivedBy !== "operator") {
      continue;
    }
    const application = PARALLEL_MINOR_M_APPLICATIONS.find(
      (candidate) =>
        candidate.compresses[0] === first.moveId && candidate.compresses[1] === second.moveId,
    );
    if (application) {
      hops[index] = { ...first, mShortcut: application.applicationId };
      mShortcuts.push({
        applicationId: application.applicationId,
        canonicalId: application.canonicalId,
        hopIndices: [index, index + 1],
      });
    }
  }

  return {
    substrate: "derived-path",
    kind: "ok",
    originId: path.originId,
    destinationId: path.destinationId,
    hopCount: path.hopCount,
    crossesBridge: hops.some((hop) => hop.bridge),
    mShortcuts,
    hops,
  };
}

export interface DerivedPathRecord {
  pathId: string;
  substrate: "derived-path";
  origin: { nodeId: string; pitchClasses: number[] };
  destination: { nodeId: string; pitchClasses: number[] };
  hopCount: number;
  crossesBridge: boolean;
  mShortcuts: readonly DerivedPathMShortcut[];
  hops: DerivedPathReplayHop[];
}

/**
 * Export a derived plan in `golden-path.v1`-compatible fields so BL-023's
 * catalog can adopt finder output without inventing a new shape.
 */
export function derivedPathRecord(plan: DerivedPathReplayPlan): DerivedPathRecord | null {
  if (plan.kind !== "ok") {
    return null;
  }
  return {
    pathId: `derived-${plan.originId}-to-${plan.destinationId}`,
    substrate: "derived-path",
    origin: { nodeId: plan.originId, pitchClasses: [...plan.hops[0].pitchClasses] },
    destination: {
      nodeId: plan.destinationId,
      pitchClasses: [...plan.hops[plan.hops.length - 1].pitchClasses],
    },
    hopCount: plan.hopCount,
    crossesBridge: plan.crossesBridge,
    mShortcuts: plan.mShortcuts,
    hops: plan.hops.map((hop) => ({ ...hop, pitchClasses: [...hop.pitchClasses] })),
  };
}

/** Convert a plan into engine voices. Invalid plans produce no voices. */
export function toReplayVoices(plan: ReplayPlan): ReplayVoice[] {
  if (plan.kind !== "ok") {
    return [];
  }
  return plan.hops.map((hop) => {
    if (hop.kind === "route") {
      return {
        label: hop.label,
        pitchClasses: [...hop.pitchClasses],
        emphasis: "none",
        preset: hop.selection.palette.preset,
      };
    }
    if (hop.kind === "cadence") {
      // Reserved: the engine accepts seam emphasis but does not alter timing
      // or voicing from it yet; golden-path registration (BL-021) decides
      // onset separation/emphasis.
      return {
        label: hop.label,
        pitchClasses: [...hop.pitchClasses],
        emphasis: hop.seamCrossing ? "seam" : "none",
        preset: CADENCE_REPLAY_PRESET,
      };
    }
    if (hop.kind === "chord" || hop.kind === "bridge") {
      // Golden-path hop: the bridge gets a distinct hold (brief pivot) and
      // both seam hops carry the reserved emphasis.
      return {
        label: hop.label,
        pitchClasses: [...hop.pitchClasses],
        emphasis: hop.seamCrossing ? "seam" : "none",
        holdSeconds: hop.kind === "bridge" ? GOLDEN_PATH_BRIDGE_HOLD_SECONDS : undefined,
        preset: CADENCE_REPLAY_PRESET,
      };
    }
    if (
      hop.kind === "collection" ||
      hop.kind === "triad" ||
      hop.kind === "m-jump" ||
      hop.kind === "derived-node"
    ) {
      // Parallel-minor and derived-path hops carry no emphasis (the "seam"
      // class belongs to cross-family crossings); the triad overlay is a brief
      // color tag with its own hold.
      return {
        label: hop.label,
        pitchClasses: [...hop.pitchClasses],
        emphasis: "none",
        holdSeconds: hop.kind === "triad" ? PARALLEL_MINOR_TRIAD_HOLD_SECONDS : undefined,
        preset: PARALLEL_MINOR_REPLAY_PRESET,
      };
    }
    return {
      label: hop.label,
      pitchClasses: [...hop.pitchClasses],
      emphasis: "none",
      preset: FIVEFOLD_REPLAY_PRESET,
    };
  });
}
