import { courtPositionById, filterPitchClasses, type CourtPosition, type CourtPresentation } from "./court";
import {
  CHALDEAN_WEIGHT_NUMERATORS,
  buildNodeChords,
  generateProgression,
  isChordSize,
  nodeProgressionSeed,
  type ChordSize,
} from "./harmony";
import type { Governor, OrreryNode } from "./types";

export const AUDIO_SCHEMA_VERSION = "harmonic-orrery.audio.v1";
export const AUDIO_PROFILE_REGISTRY_RELEASE_ID = "canonical-profile-registry:0.1.1";
export const AUDIO_ROOT_MIDI_NOTE = 60;
export const AUDIO_A4_HZ = 440;
export const AUDIO_VOICE_LIMIT = 8;
export const AUDIO_CROSSFADE_SECONDS = 0.15;
export const AUDIO_VOICE_STAGGER_SECONDS = 0.5;
export const AUDIO_OCTAVE_SEMITONES = 12;
export const AUDIO_PROGRESSION_STEP_SECONDS = 1.8;
export const AUDIO_CHORD_ROLL_SECONDS = 0.04;

export interface ProgressionStepView {
  index: number;
  rootDegree: number;
  governor: Governor;
  weightNumerator: number;
  weightLabel: string;
  qualityLabel: string;
  pitchClasses: number[];
  voicedPitchClasses: number[];
}

export interface ProgressionOptions {
  steps?: number;
  chordSize?: ChordSize;
  seed?: number;
}
export const AUDIO_VOICING_STORAGE_KEY = "seven-governors.harmonic-orrery.audio-voicing";

export type AudioVoicingMode = "heptatonic" | "court-pentatonic";

const VOICING_MODES: readonly AudioVoicingMode[] = ["heptatonic", "court-pentatonic"];

interface VoicingStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isAudioVoicingMode(value: unknown): value is AudioVoicingMode {
  return typeof value === "string" && (VOICING_MODES as readonly string[]).includes(value);
}

export function loadVoicingMode(storage: VoicingStorageLike | undefined): AudioVoicingMode {
  if (!storage) {
    return "heptatonic";
  }
  try {
    return storage.getItem(AUDIO_VOICING_STORAGE_KEY) === "court-pentatonic"
      ? "court-pentatonic"
      : "heptatonic";
  } catch {
    return "heptatonic";
  }
}

export function saveVoicingMode(storage: VoicingStorageLike | undefined, mode: AudioVoicingMode): void {
  if (!storage) {
    return;
  }
  try {
    storage.setItem(AUDIO_VOICING_STORAGE_KEY, mode);
  } catch {
    // Voicing preference is non-critical; ignore write failures.
  }
}

type AudioNodeLike = {
  connect(destination: AudioNodeLike): AudioNodeLike;
  disconnect?(): void;
};

type AudioParamLike = {
  setValueAtTime(value: number, startTime: number): void;
  linearRampToValueAtTime(value: number, endTime: number): void;
};

type GainNodeLike = AudioNodeLike & {
  gain: AudioParamLike;
};

type OscillatorNodeLike = AudioNodeLike & {
  detune: AudioParamLike;
  frequency: AudioParamLike;
  onended: (() => void) | null;
  type: OscillatorType;
  start(when?: number): void;
  stop(when?: number): void;
};

type AudioBufferLike = {
  duration: number;
};

type AudioBufferSourceNodeLike = AudioNodeLike & {
  buffer: AudioBufferLike | null;
  loop: boolean;
  loopEnd: number;
  loopStart: number;
  onended: (() => void) | null;
  start(when?: number): void;
  stop(when?: number): void;
};

export interface AudioContextLike {
  readonly currentTime: number;
  readonly destination: AudioNodeLike;
  close(): Promise<void>;
  createBufferSource(): AudioBufferSourceNodeLike;
  createGain(): GainNodeLike;
  createOscillator(): OscillatorNodeLike;
  decodeAudioData(data: ArrayBuffer): Promise<AudioBufferLike>;
  resume(): Promise<void>;
  suspend(): Promise<void>;
}

export interface AudioResponseLike {
  readonly ok: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface AudioRuntime {
  createContext(): AudioContextLike | undefined;
  fetchAudio(path: string): Promise<AudioResponseLike>;
}

export interface AudioAsset {
  assetId: string;
  creator: string;
  filename: string;
  gain: number;
  license: "MIT";
  licenseUrl: string;
  loopEndSeconds: number;
  loopStartSeconds: number;
  provenance: string;
  sha256: string;
  version: string;
}

export interface TimbrePreset {
  attackSeconds: number;
  detuneCents: number;
  gain: number;
  loopAssetId: AudioAsset["assetId"];
  registerOffset: number;
  releaseSeconds: number;
  version: string;
  waveform: OscillatorType;
}

export interface OfficePalette {
  canonicalStateId: number;
  mode: string;
  pitchClasses: readonly number[];
  preset: TimbrePreset;
}

export const AUDIO_LOOP_ASSETS: readonly AudioAsset[] = [
  {
    assetId: "percussion-pulse-v1",
    creator: "Seven Governors project",
    filename: "/audio/orrery-pulse-v1.wav",
    gain: 0.22,
    license: "MIT",
    licenseUrl: "https://opensource.org/license/mit",
    loopEndSeconds: 2,
    loopStartSeconds: 0,
    provenance: "Self-authored deterministic noise-percussion recipe v1.",
    sha256: "24933450ab0546eef5ea4f24ce62f2b09848b08abfa66130bdcb17a8fa6ae95f",
    version: "1.0.0",
  },
  {
    assetId: "percussion-ticks-v1",
    creator: "Seven Governors project",
    filename: "/audio/orrery-ticks-v1.wav",
    gain: 0.16,
    license: "MIT",
    licenseUrl: "https://opensource.org/license/mit",
    loopEndSeconds: 2,
    loopStartSeconds: 0,
    provenance: "Self-authored deterministic noise-percussion recipe v1.",
    sha256: "b6a33c0522496fc61675c8b358b5951b5a483eca43d2a87a770f1b38c51b2e2c",
    version: "1.0.0",
  },
  {
    assetId: "percussion-grain-v1",
    creator: "Seven Governors project",
    filename: "/audio/orrery-grain-v1.wav",
    gain: 0.18,
    license: "MIT",
    licenseUrl: "https://opensource.org/license/mit",
    loopEndSeconds: 2,
    loopStartSeconds: 0,
    provenance: "Self-authored deterministic noise-percussion recipe v1.",
    sha256: "da2b72c9ddb1d148ef6eacd073acf1d8a60945d1bf2a346d65d89341c065def5",
    version: "1.0.0",
  },
] as const;

export const OFFICE_PALETTES: Readonly<Record<Governor, OfficePalette>> = {
  Sun: {
    canonicalStateId: 2773,
    mode: "Lydian",
    pitchClasses: [0, 2, 4, 6, 7, 9, 11],
    preset: {
      attackSeconds: 0.025,
      detuneCents: 3,
      gain: 0.12,
      loopAssetId: "percussion-pulse-v1",
      registerOffset: 12,
      releaseSeconds: 0.42,
      version: "1.0.0",
      waveform: "sawtooth",
    },
  },
  Moon: {
    canonicalStateId: 2741,
    mode: "Ionian",
    pitchClasses: [0, 2, 4, 5, 7, 9, 11],
    preset: {
      attackSeconds: 0.1,
      detuneCents: -5,
      gain: 0.11,
      loopAssetId: "percussion-grain-v1",
      registerOffset: 0,
      releaseSeconds: 0.54,
      version: "1.0.0",
      waveform: "sine",
    },
  },
  Mars: {
    canonicalStateId: 1717,
    mode: "Mixolydian",
    pitchClasses: [0, 2, 4, 5, 7, 9, 10],
    preset: {
      attackSeconds: 0.012,
      detuneCents: 7,
      gain: 0.095,
      loopAssetId: "percussion-ticks-v1",
      registerOffset: 12,
      releaseSeconds: 0.28,
      version: "1.0.0",
      waveform: "square",
    },
  },
  Mercury: {
    canonicalStateId: 1709,
    mode: "Dorian",
    pitchClasses: [0, 2, 3, 5, 7, 9, 10],
    preset: {
      attackSeconds: 0.045,
      detuneCents: -2,
      gain: 0.1,
      loopAssetId: "percussion-ticks-v1",
      registerOffset: 0,
      releaseSeconds: 0.38,
      version: "1.0.0",
      waveform: "triangle",
    },
  },
  Jupiter: {
    canonicalStateId: 1453,
    mode: "Aeolian",
    pitchClasses: [0, 2, 3, 5, 7, 8, 10],
    preset: {
      attackSeconds: 0.07,
      detuneCents: 4,
      gain: 0.105,
      loopAssetId: "percussion-grain-v1",
      registerOffset: 0,
      releaseSeconds: 0.5,
      version: "1.0.0",
      waveform: "triangle",
    },
  },
  Venus: {
    canonicalStateId: 1451,
    mode: "Phrygian",
    pitchClasses: [0, 1, 3, 5, 7, 8, 10],
    preset: {
      attackSeconds: 0.065,
      detuneCents: -8,
      gain: 0.09,
      loopAssetId: "percussion-grain-v1",
      registerOffset: 12,
      releaseSeconds: 0.48,
      version: "1.0.0",
      waveform: "sine",
    },
  },
  Saturn: {
    canonicalStateId: 1387,
    mode: "Locrian",
    pitchClasses: [0, 1, 3, 5, 6, 8, 10],
    preset: {
      attackSeconds: 0.018,
      detuneCents: 1,
      gain: 0.08,
      loopAssetId: "percussion-pulse-v1",
      registerOffset: -12,
      releaseSeconds: 0.34,
      version: "1.0.0",
      waveform: "square",
    },
  },
};

export interface AudioSelection {
  court: CourtPresentation;
  inheritedOfficePalette: boolean;
  office: Governor;
  palette: OfficePalette;
  retainedPitchClasses: readonly number[];
  selectedStateId: number;
  selectedStateName: string;
  selectedTier: OrreryNode["state"]["tier"];
  suppressedPitchClasses: readonly number[];
  voicingMode: AudioVoicingMode;
}

export type AudioReadiness = "idle" | "loading" | "ready" | "degraded" | "unsupported" | "error";
export type AudioTransport = "stopped" | "playing" | "paused";

export interface AudioEngineState {
  detail: string;
  failedAssetIds: readonly string[];
  muted: boolean;
  progression: boolean;
  readiness: AudioReadiness;
  transport: AudioTransport;
  visualOnly: boolean;
  volume: number;
}

interface ActiveVoice {
  source: OscillatorNodeLike;
  envelope: GainNodeLike;
}

interface ActiveLoop {
  source: AudioBufferSourceNodeLike;
  gain: GainNodeLike;
  level: number;
}

function browserRuntime(): AudioRuntime {
  return {
    createContext(): AudioContextLike | undefined {
      if (typeof window === "undefined" || typeof window.AudioContext !== "function") {
        return undefined;
      }
      return new window.AudioContext() as unknown as AudioContextLike;
    },
    async fetchAudio(path: string): Promise<AudioResponseLike> {
      if (typeof fetch !== "function") {
        throw new Error("Audio asset fetching is unavailable in this browser.");
      }
      return fetch(path);
    },
  };
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.65;
  }
  return Math.max(0, Math.min(1, value));
}

function assetById(assetId: string): AudioAsset | undefined {
  return AUDIO_LOOP_ASSETS.find((asset) => asset.assetId === assetId);
}

export function formatPitchClasses(pitchClasses: readonly number[]): string {
  return `{${pitchClasses.join(", ")}}`;
}

export function pitchClassToMidi(pitchClass: number, registerOffset = 0): number {
  if (!Number.isInteger(pitchClass) || pitchClass < 0 || pitchClass > 11 || registerOffset % 12 !== 0) {
    throw new Error("Audio pitch classes require 0 through 11 and an octave register offset.");
  }
  return AUDIO_ROOT_MIDI_NOTE + pitchClass + registerOffset;
}

export function midiToFrequency(midiNote: number): number {
  return AUDIO_A4_HZ * 2 ** ((midiNote - 69) / 12);
}

export function resolveAudioSelection(
  node: OrreryNode,
  courtPosition: CourtPosition,
  voicingMode: AudioVoicingMode = "heptatonic",
): AudioSelection {
  const office = node.resolution.office;
  const palette = OFFICE_PALETTES[office];
  const court = courtPositionById(courtPosition);
  // Heptatonic voicing plays the inspected anchor's own seven-note mask, so
  // every node is audibly distinct. Court pentatonic keeps the legacy behavior:
  // the office A0 palette re-filtered through the Court position mask.
  const inheritedOfficePalette =
    voicingMode === "court-pentatonic" && node.state.tier !== "A0";
  const retainedPitchClasses =
    voicingMode === "heptatonic"
      ? [...node.state.pitchClasses]
      : filterPitchClasses(palette.pitchClasses, court);
  return {
    court,
    voicingMode,
    inheritedOfficePalette,
    office,
    palette,
    retainedPitchClasses,
    selectedStateId: node.state.stateId,
    selectedStateName: node.state.name,
    selectedTier: node.state.tier,
    suppressedPitchClasses:
      voicingMode === "heptatonic"
        ? []
        : palette.pitchClasses.filter((pitchClass) => !retainedPitchClasses.includes(pitchClass)),
  };
}

export function isAudioSourceCompatible(profileRegistryReleaseId: string): boolean {
  return profileRegistryReleaseId === AUDIO_PROFILE_REGISTRY_RELEASE_ID;
}

export function validateAudioManifest(): void {
  const assetIds = new Set(AUDIO_LOOP_ASSETS.map((asset) => asset.assetId));
  if (assetIds.size !== AUDIO_LOOP_ASSETS.length) {
    throw new Error("Audio asset IDs must be unique.");
  }
  for (const asset of AUDIO_LOOP_ASSETS) {
    if (
      !/^\/[a-z0-9/_-]+\.wav$/.test(asset.filename) ||
      !/^[a-f0-9]{64}$/.test(asset.sha256) ||
      !asset.creator ||
      !asset.provenance ||
      asset.license !== "MIT" ||
      !asset.licenseUrl.startsWith("https://")
    ) {
      throw new Error(`Audio asset ${asset.assetId} has invalid metadata.`);
    }
  }
  for (const [office, palette] of Object.entries(OFFICE_PALETTES)) {
    if (palette.pitchClasses.length !== 7 || new Set(palette.pitchClasses).size !== 7) {
      throw new Error(`Audio palette ${office} must contain seven unique pitch classes.`);
    }
    if (!palette.pitchClasses.every((pitchClass) => Number.isInteger(pitchClass) && pitchClass >= 0 && pitchClass <= 11)) {
      throw new Error(`Audio palette ${office} has an invalid pitch class.`);
    }
    if (!assetById(palette.preset.loopAssetId) || palette.preset.registerOffset % 12 !== 0) {
      throw new Error(`Audio palette ${office} has an invalid authored preset.`);
    }
  }
}

export class OrreryAudioEngine {
  private activeLoop: ActiveLoop | undefined;
  private activeVoices: ActiveVoice[] = [];
  private readonly buffers = new Map<string, AudioBufferLike>();
  private context: AudioContextLike | undefined;
  private currentSelection: AudioSelection | undefined;
  private currentSource: { node: OrreryNode; courtPosition: CourtPosition } | undefined;
  private voicingMode: AudioVoicingMode = "heptatonic";
  private readonly listeners = new Set<(state: AudioEngineState) => void>();
  private masterGain: GainNodeLike | undefined;
  private readonly runtime: AudioRuntime;
  private state: AudioEngineState = {
    detail: "Sound is off. Enable sound after selecting an anchor.",
    failedAssetIds: [],
    muted: false,
    progression: false,
    readiness: "idle",
    transport: "stopped",
    visualOnly: false,
    volume: 0.65,
  };
  private progressionActive = false;
  private progressionIndex = 0;
  private progressionPlan: ProgressionStepView[] = [];
  private progressionTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(runtime: AudioRuntime = browserRuntime()) {
    validateAudioManifest();
    this.runtime = runtime;
  }

  snapshot(): AudioEngineState {
    return { ...this.state, failedAssetIds: [...this.state.failedAssetIds] };
  }

  subscribe(listener: (state: AudioEngineState) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  select(node: OrreryNode, courtPosition: CourtPosition, playSound = true): AudioSelection {
    // A node change ends any active progression; the UI may restart it for the
    // newly selected node.
    this.stopProgression();
    const selection = resolveAudioSelection(node, courtPosition, this.voicingMode);
    this.currentSource = { node, courtPosition };
    this.currentSelection = selection;
    if (playSound && this.state.transport === "playing" && !this.state.visualOnly) {
      this.playSelection(selection);
    }
    return selection;
  }

  currentVoicingMode(): AudioVoicingMode {
    return this.voicingMode;
  }

  setVoicingMode(mode: AudioVoicingMode): AudioSelection | undefined {
    if (!isAudioVoicingMode(mode) || mode === this.voicingMode) {
      return this.currentSelection;
    }

    this.voicingMode = mode;
    const revoiced = this.currentSource
      ? resolveAudioSelection(this.currentSource.node, this.currentSource.courtPosition, mode)
      : undefined;
    if (revoiced) {
      this.currentSelection = revoiced;
      if (this.state.transport === "playing" && !this.state.visualOnly) {
        this.crossfadeSelection(revoiced);
      }
    }
    this.replaceState({
      detail:
        mode === "heptatonic"
          ? "Heptatonic voicing active. Each anchor sounds its own seven-note scale."
          : "Court pentatonic voicing active. The office A0 palette is filtered through the Court mask.",
    });
    return this.currentSelection;
  }

  /**
   * Start a seeded Chaldean-weighted chord progression inside the selected
   * node. Replaces the melodic arpeggio while active. Returns the planned
   * steps for UI readout, or an empty array when playback is unavailable.
   */
  startProgression(options: ProgressionOptions = {}): ProgressionStepView[] {
    const source = this.currentSource;
    if (
      !source ||
      this.state.transport !== "playing" ||
      this.state.visualOnly ||
      !this.context ||
      !this.masterGain
    ) {
      this.replaceState({
        detail: "Select an anchor and enable & play sound before starting an intra-node progression.",
      });
      return [];
    }

    const steps = options.steps ?? 8;
    const chordSize = options.chordSize ?? 3;
    if (!isChordSize(chordSize)) {
      return [];
    }
    const seed = options.seed ?? nodeProgressionSeed(source.node.state.stateId, steps, chordSize);

    this.stopProgression();
    const chords = buildNodeChords(source.node.state.pitchClasses, chordSize);
    const sizeLabel = chordSize === 2 ? "dyad" : chordSize === 3 ? "trichord" : "tetrachord";
    this.progressionPlan = generateProgression(seed, steps).map((rootDegree, index) => {
      const chord = chords[rootDegree - 1];
      const governor = source.node.resolution.office;
      return {
        index,
        rootDegree,
        governor,
        weightNumerator: chord.weightNumerator,
        weightLabel: chord.weightLabel,
        qualityLabel: chord.qualityLabel,
        pitchClasses: [...chord.pitchClasses],
        voicedPitchClasses: this.resolveChordVoices(chord.pitchClasses),
      };
    });
    this.progressionActive = true;
    this.progressionIndex = 0;
    // Stop the arpeggio path so the two voicing strategies never stack.
    this.stopSources();
    this.runProgressionTick();
    this.replaceState({
      detail: `Intra-node ${sizeLabel} progression active (${steps} steps). Amplitude follows Chaldean degree gravity.`,
      progression: true,
    });
    return this.progressionPlan.map((step) => ({ ...step }));
  }

  stopProgression(): void {
    if (this.progressionTimer !== undefined) {
      clearTimeout(this.progressionTimer);
      this.progressionTimer = undefined;
    }
    if (!this.progressionActive) {
      return;
    }
    this.progressionActive = false;
    this.progressionIndex = 0;
    this.replaceState({
      detail: "Intra-node progression stopped. Anchor selections resume their melodic arpeggio.",
      progression: false,
    });
  }

  private resolveChordVoices(pitchClasses: readonly number[]): number[] {
    if (this.voicingMode !== "court-pentatonic" || !this.currentSource) {
      return [...pitchClasses];
    }
    const court = courtPositionById(this.currentSource.courtPosition);
    const filtered = pitchClasses.filter((pc) => (court.pitchMask & (1 << pc)) !== 0);
    // The Court projection must remain playable; fall back to the full subset
    // when the filter would collapse the chord below a dyad.
    return filtered.length >= 2 ? filtered : [...pitchClasses];
  }

  private runProgressionTick(): void {
    const context = this.context;
    const masterGain = this.masterGain;
    if (
      !this.progressionActive ||
      !context ||
      !masterGain ||
      !this.currentSource ||
      this.state.transport !== "playing" ||
      this.state.visualOnly
    ) {
      this.stopProgression();
      return;
    }

    const step = this.progressionPlan[this.progressionIndex % this.progressionPlan.length];
    this.scheduleChordVoices(step);
    this.progressionIndex += 1;
    this.progressionTimer = setTimeout(
      () => this.runProgressionTick(),
      AUDIO_PROGRESSION_STEP_SECONDS * 1000,
    );
  }

  private scheduleChordVoices(step: ProgressionStepView): void {
    const context = this.context;
    const masterGain = this.masterGain;
    const preset = this.currentSelection?.palette.preset;
    if (!context || !masterGain || !preset) {
      return;
    }

    // Render gravity: heavier Chaldean degrees voice slightly louder.
    const relativeGravity = step.weightNumerator / CHALDEAN_WEIGHT_NUMERATORS[0];
    const gainScale = 0.7 + 0.45 * relativeGravity;
    const start = context.currentTime + 0.03;
    const voiced = step.voicedPitchClasses;

    // Bass root one octave down opens each chord, then the roll ascends.
    this.startVoice(
      context,
      masterGain,
      midiToFrequency(pitchClassToMidi(voiced[0], preset.registerOffset) - 12),
      preset,
      start,
      gainScale,
    );
    voiced.forEach((pitchClass, index) => {
      this.startVoice(
        context,
        masterGain,
        midiToFrequency(pitchClassToMidi(pitchClass, preset.registerOffset)),
        preset,
        start + (index + 1) * AUDIO_CHORD_ROLL_SECONDS,
        gainScale,
      );
    });
  }

  clearSelection(): void {
    this.stopProgression();
    this.currentSelection = undefined;
    this.currentSource = undefined;
    this.stopSources();
  }

  async enable(profileRegistryReleaseId: string): Promise<void> {
    if (!isAudioSourceCompatible(profileRegistryReleaseId)) {
      this.replaceState({
        detail: `Audio palettes require ${AUDIO_PROFILE_REGISTRY_RELEASE_ID}; the live projection uses ${profileRegistryReleaseId}.`,
        failedAssetIds: [],
        readiness: "error",
        transport: "stopped",
      });
      return;
    }
    if (this.state.visualOnly) {
      this.replaceState({
        detail: "Visual-only mode is active. Turn it off before enabling sound.",
        transport: "stopped",
      });
      return;
    }

    const context = this.context ?? this.runtime.createContext();
    if (!context) {
      this.replaceState({
        detail: "Web Audio is unavailable in this browser. The Orrery remains visual-only.",
        readiness: "unsupported",
        transport: "stopped",
      });
      return;
    }
    if (!this.context) {
      this.context = context;
      this.masterGain = context.createGain();
      this.masterGain.connect(context.destination);
      this.applyOutputGain();
    }

    try {
      // Resume while the explicit control gesture is still active in the browser.
      await context.resume();
    } catch {
      this.replaceState({
        detail: "The browser did not permit audio playback. Use Enable sound again.",
        readiness: "error",
        transport: "stopped",
      });
      return;
    }

    if (this.buffers.size !== AUDIO_LOOP_ASSETS.length) {
      this.replaceState({ detail: "Preparing authored percussion loops.", readiness: "loading", transport: "paused" });
      await this.preloadAssets(context);
    }

    this.replaceState({
      detail:
        this.state.failedAssetIds.length === 0
          ? "Sound is enabled. Anchor selections play their office palette through the selected Court mask."
          : `Sound is enabled with ${this.state.failedAssetIds.length} unavailable percussion loop${this.state.failedAssetIds.length === 1 ? "" : "s"}.`,
      readiness: this.state.failedAssetIds.length === 0 ? "ready" : "degraded",
      transport: "playing",
    });
    if (this.currentSelection) {
      this.playSelection(this.currentSelection);
    }
  }

  async pause(): Promise<void> {
    if (!this.context || this.state.transport !== "playing") {
      return;
    }
    this.stopProgression();
    this.stopSources();
    try {
      await this.context.suspend();
    } catch {
      this.replaceState({ detail: "Audio could not be paused in this browser.", readiness: "error" });
      return;
    }
    this.replaceState({ detail: "Sound is paused.", transport: "paused" });
  }

  setMuted(muted: boolean): void {
    this.replaceState({ detail: muted ? "Sound is muted." : "Sound is audible.", muted });
    this.applyOutputGain();
  }

  setVisualOnly(visualOnly: boolean): void {
    if (visualOnly) {
      this.stopProgression();
      this.stopSources();
      void this.context?.suspend().catch(() => undefined);
      this.replaceState({
        detail: "Visual-only mode is active. No audio will play until you explicitly enable it again.",
        transport: "stopped",
        visualOnly,
      });
    } else {
      this.replaceState({
        detail: "Visual-only mode is off. Sound remains off until you explicitly enable it.",
        transport: "stopped",
        visualOnly,
      });
    }
    this.applyOutputGain();
  }

  setVolume(volume: number): void {
    this.replaceState({ volume: clampVolume(volume) });
    this.applyOutputGain();
  }

  dispose(): void {
    this.stopProgression();
    this.stopSources();
    this.listeners.clear();
    if (this.context) {
      void this.context.close().catch(() => undefined);
      this.context = undefined;
    }
    this.masterGain = undefined;
  }

  private replaceState(next: Partial<AudioEngineState>): void {
    this.state = { ...this.state, ...next, failedAssetIds: next.failedAssetIds ?? this.state.failedAssetIds };
    for (const listener of this.listeners) {
      listener(this.snapshot());
    }
  }

  private applyOutputGain(): void {
    if (!this.context || !this.masterGain) {
      return;
    }
    const value = this.state.muted || this.state.visualOnly ? 0 : this.state.volume;
    this.masterGain.gain.setValueAtTime(value, this.context.currentTime);
  }

  private async preloadAssets(context: AudioContextLike): Promise<void> {
    const failedAssetIds: string[] = [];
    for (const asset of AUDIO_LOOP_ASSETS) {
      if (this.buffers.has(asset.assetId)) {
        continue;
      }
      try {
        const response = await this.runtime.fetchAudio(asset.filename);
        if (!response.ok) {
          throw new Error(`Audio asset request failed for ${asset.assetId}`);
        }
        this.buffers.set(asset.assetId, await context.decodeAudioData(await response.arrayBuffer()));
      } catch {
        failedAssetIds.push(asset.assetId);
      }
    }
    this.replaceState({ failedAssetIds: failedAssetIds.sort() });
  }

  private playSelection(selection: AudioSelection): void {
    const context = this.context;
    const masterGain = this.masterGain;
    if (!context || !masterGain || this.state.visualOnly || this.state.transport !== "playing") {
      return;
    }

    if (this.activeVoices.length > 0 || this.activeLoop) {
      // A selection is already sounding: release it over a short fade while the
      // mutated pitch mask attacks, so revoicing never hard-cuts the audio.
      this.crossfadeSelection(selection);
      return;
    }

    this.startSelection(context, masterGain, selection, context.currentTime + 0.02);
  }

  private crossfadeSelection(selection: AudioSelection): void {
    const context = this.context;
    const masterGain = this.masterGain;
    if (!context || !masterGain) {
      return;
    }

    const now = context.currentTime;
    const fadeEnd = now + AUDIO_CROSSFADE_SECONDS;

    for (const voice of this.activeVoices) {
      voice.envelope.gain.linearRampToValueAtTime(0.0001, fadeEnd);
      voice.source.stop(fadeEnd);
    }
    this.activeVoices = [];

    if (this.activeLoop) {
      const { source, gain, level } = this.activeLoop;
      gain.gain.setValueAtTime(level, now);
      gain.gain.linearRampToValueAtTime(0.0001, fadeEnd);
      source.stop(fadeEnd);
      this.activeLoop = undefined;
    }

    this.startSelection(context, masterGain, selection, now + 0.02);
  }

  private startSelection(
    context: AudioContextLike,
    masterGain: GainNodeLike,
    selection: AudioSelection,
    start: number,
  ): void {
    selection.retainedPitchClasses.forEach((pitchClass, index) => {
      this.startVoice(
        context,
        masterGain,
        midiToFrequency(pitchClassToMidi(pitchClass, selection.palette.preset.registerOffset)),
        selection.palette.preset,
        start + index * AUDIO_VOICE_STAGGER_SECONDS,
      );
    });
    // Close the arpeggio on the root an octave up, one stagger after the last note.
    const rootPitchClass = selection.retainedPitchClasses[0];
    if (rootPitchClass !== undefined) {
      this.startVoice(
        context,
        masterGain,
        midiToFrequency(
          pitchClassToMidi(rootPitchClass, selection.palette.preset.registerOffset) + AUDIO_OCTAVE_SEMITONES,
        ),
        selection.palette.preset,
        start + selection.retainedPitchClasses.length * AUDIO_VOICE_STAGGER_SECONDS,
      );
    }
    this.startLoop(context, masterGain, selection.palette.preset.loopAssetId);
  }

  private startVoice(
    context: AudioContextLike,
    masterGain: GainNodeLike,
    frequency: number,
    preset: TimbrePreset,
    start: number,
    gainScale = 1,
  ): void {
    while (this.activeVoices.length >= AUDIO_VOICE_LIMIT) {
      this.activeVoices.shift()?.source.stop(context.currentTime);
    }

    const source = context.createOscillator();
    const envelope = context.createGain();
    const end = start + preset.releaseSeconds;
    const peakGain = preset.gain * gainScale;
    source.type = preset.waveform;
    source.frequency.setValueAtTime(frequency, start);
    source.detune.setValueAtTime(preset.detuneCents, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(peakGain, start + preset.attackSeconds);
    envelope.gain.linearRampToValueAtTime(0.0001, end);
    source.connect(envelope).connect(masterGain);
    source.onended = () => {
      this.activeVoices = this.activeVoices.filter((voice) => voice.source !== source);
    };
    this.activeVoices.push({ source, envelope });
    source.start(start);
    source.stop(end);
  }

  private startLoop(context: AudioContextLike, masterGain: GainNodeLike, assetId: string): void {
    const asset = assetById(assetId);
    const buffer = this.buffers.get(assetId);
    if (!asset || !buffer) {
      return;
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = asset.loopStartSeconds;
    source.loopEnd = Math.min(asset.loopEndSeconds, buffer.duration);
    gain.gain.setValueAtTime(asset.gain, context.currentTime);
    source.connect(gain).connect(masterGain);
    source.onended = () => {
      if (this.activeLoop?.source === source) {
        this.activeLoop = undefined;
      }
    };
    this.activeLoop = { source, gain, level: asset.gain };
    source.start(context.currentTime);
  }

  private stopSources(): void {
    const now = this.context?.currentTime ?? 0;
    for (const voice of this.activeVoices) {
      voice.source.stop(now);
    }
    this.activeVoices = [];
    if (this.activeLoop) {
      this.activeLoop.source.stop(now);
      this.activeLoop = undefined;
    }
  }
}
