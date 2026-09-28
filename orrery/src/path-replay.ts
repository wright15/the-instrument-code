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

import {
  OFFICE_PALETTES,
  resolveAudioSelection,
  type AudioSelection,
  type AudioVoicingMode,
  type ReplayVoice,
} from "./audio";
import type { CourtPosition } from "./court";
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
  | GoldenPathReplayPlan;

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
    return {
      label: hop.label,
      pitchClasses: [...hop.pitchClasses],
      emphasis: "none",
      preset: FIVEFOLD_REPLAY_PRESET,
    };
  });
}
