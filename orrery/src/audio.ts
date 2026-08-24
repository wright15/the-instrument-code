import type { Governor, OrreryNode } from "./types";

export const AUDIO_SCHEMA_VERSION = "harmonic-orrery.audio.v1";
export const AUDIO_PROFILE_REGISTRY_RELEASE_ID = "canonical-feature-profile-registry:0.1.1";
export const AUDIO_ROOT_MIDI_NOTE = 60;
export const AUDIO_A4_HZ = 440;
export const AUDIO_VOICE_LIMIT = 4;

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
  inheritedOfficePalette: boolean;
  office: Governor;
  palette: OfficePalette;
  selectedStateId: number;
  selectedStateName: string;
  selectedTier: OrreryNode["state"]["tier"];
}

export type AudioReadiness = "idle" | "loading" | "ready" | "degraded" | "unsupported" | "error";
export type AudioTransport = "stopped" | "playing" | "paused";

export interface AudioEngineState {
  detail: string;
  failedAssetIds: readonly string[];
  muted: boolean;
  readiness: AudioReadiness;
  transport: AudioTransport;
  visualOnly: boolean;
  volume: number;
}

interface ActiveVoice {
  source: OscillatorNodeLike;
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

export function resolveAudioSelection(node: OrreryNode): AudioSelection {
  const office = node.resolution.office;
  return {
    inheritedOfficePalette: node.state.tier !== "A0",
    office,
    palette: OFFICE_PALETTES[office],
    selectedStateId: node.state.stateId,
    selectedStateName: node.state.name,
    selectedTier: node.state.tier,
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
  private activeLoop: AudioBufferSourceNodeLike | undefined;
  private activeVoices: ActiveVoice[] = [];
  private readonly buffers = new Map<string, AudioBufferLike>();
  private context: AudioContextLike | undefined;
  private currentSelection: AudioSelection | undefined;
  private readonly listeners = new Set<(state: AudioEngineState) => void>();
  private masterGain: GainNodeLike | undefined;
  private readonly runtime: AudioRuntime;
  private state: AudioEngineState = {
    detail: "Sound is off. Enable sound after selecting an anchor.",
    failedAssetIds: [],
    muted: false,
    readiness: "idle",
    transport: "stopped",
    visualOnly: false,
    volume: 0.65,
  };

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

  select(node: OrreryNode, playSound = true): AudioSelection {
    const selection = resolveAudioSelection(node);
    this.currentSelection = selection;
    if (playSound && this.state.transport === "playing" && !this.state.visualOnly) {
      this.playSelection(selection);
    }
    return selection;
  }

  clearSelection(): void {
    this.currentSelection = undefined;
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
          ? "Sound is enabled. Anchor selections play their authored office palette."
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

    this.stopSources();
    const start = context.currentTime + 0.02;
    selection.palette.pitchClasses.forEach((pitchClass, index) => {
      this.startVoice(
        context,
        masterGain,
        midiToFrequency(pitchClassToMidi(pitchClass, selection.palette.preset.registerOffset)),
        selection.palette.preset,
        start + index * 0.1,
      );
    });
    this.startLoop(context, masterGain, selection.palette.preset.loopAssetId);
  }

  private startVoice(
    context: AudioContextLike,
    masterGain: GainNodeLike,
    frequency: number,
    preset: TimbrePreset,
    start: number,
  ): void {
    while (this.activeVoices.length >= AUDIO_VOICE_LIMIT) {
      this.activeVoices.shift()?.source.stop(context.currentTime);
    }

    const source = context.createOscillator();
    const envelope = context.createGain();
    const end = start + preset.releaseSeconds;
    source.type = preset.waveform;
    source.frequency.setValueAtTime(frequency, start);
    source.detune.setValueAtTime(preset.detuneCents, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(preset.gain, start + preset.attackSeconds);
    envelope.gain.linearRampToValueAtTime(0.0001, end);
    source.connect(envelope).connect(masterGain);
    source.onended = () => {
      this.activeVoices = this.activeVoices.filter((voice) => voice.source !== source);
    };
    this.activeVoices.push({ source });
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
      if (this.activeLoop === source) {
        this.activeLoop = undefined;
      }
    };
    this.activeLoop = source;
    source.start(context.currentTime);
  }

  private stopSources(): void {
    const now = this.context?.currentTime ?? 0;
    for (const voice of this.activeVoices) {
      voice.source.stop(now);
    }
    this.activeVoices = [];
    if (this.activeLoop) {
      this.activeLoop.stop(now);
      this.activeLoop = undefined;
    }
  }
}
