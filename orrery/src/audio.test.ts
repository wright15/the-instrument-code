import { describe, expect, it, vi } from "vitest";

import {
  AUDIO_A4_HZ,
  AUDIO_CROSSFADE_SECONDS,
  AUDIO_LOOP_ASSETS,
  AUDIO_PROFILE_REGISTRY_RELEASE_ID,
  AUDIO_ROOT_MIDI_NOTE,
  AUDIO_VOICE_STAGGER_SECONDS,
  AUDIO_VOICING_STORAGE_KEY,
  OFFICE_PALETTES,
  OrreryAudioEngine,
  loadVoicingMode,
  midiToFrequency,
  pitchClassToMidi,
  resolveAudioSelection,
  saveVoicingMode,
  validateAudioManifest,
  type AudioContextLike,
  type AudioResponseLike,
  type AudioRuntime,
} from "./audio";
import type { Governor, OrreryNode } from "./types";

class FakeParam {
  readonly values: number[] = [];

  setValueAtTime(value: number): void {
    this.values.push(value);
  }

  linearRampToValueAtTime(value: number): void {
    this.values.push(value);
  }
}

class FakeNode {
  connections = 0;

  connect(_destination: unknown): this {
    this.connections += 1;
    return this;
  }

  disconnect(): void {}
}

class FakeGainNode extends FakeNode {
  readonly gain = new FakeParam();
}

class FakeOscillatorNode extends FakeNode {
  readonly detune = new FakeParam();
  readonly frequency = new FakeParam();
  onended: (() => void) | null = null;
  readonly startTimes: number[] = [];
  readonly stopTimes: number[] = [];
  type: OscillatorType = "sine";

  start(when = 0): void {
    this.startTimes.push(when);
  }

  stop(when = 0): void {
    this.stopTimes.push(when);
  }
}

class FakeBufferSourceNode extends FakeNode {
  buffer: { duration: number } | null = null;
  loop = false;
  loopEnd = 0;
  loopStart = 0;
  onended: (() => void) | null = null;
  readonly startTimes: number[] = [];
  readonly stopTimes: number[] = [];

  start(when = 0): void {
    this.startTimes.push(when);
  }

  stop(when = 0): void {
    this.stopTimes.push(when);
  }
}

class FakeAudioContext implements AudioContextLike {
  closeCount = 0;
  currentTime = 4;
  readonly destination = new FakeNode();
  readonly gains: FakeGainNode[] = [];
  readonly oscillators: FakeOscillatorNode[] = [];
  readonly bufferSources: FakeBufferSourceNode[] = [];
  resumeCount = 0;
  suspendCount = 0;

  async close(): Promise<void> {
    this.closeCount += 1;
  }

  createBufferSource(): FakeBufferSourceNode {
    const source = new FakeBufferSourceNode();
    this.bufferSources.push(source);
    return source;
  }

  createGain(): FakeGainNode {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  }

  createOscillator(): FakeOscillatorNode {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  async decodeAudioData(_data: ArrayBuffer): Promise<{ duration: number }> {
    return { duration: 2 };
  }

  async resume(): Promise<void> {
    this.resumeCount += 1;
  }

  async suspend(): Promise<void> {
    this.suspendCount += 1;
  }
}

function audioRuntime(
  context: FakeAudioContext,
  responseForPath: (path: string) => Promise<AudioResponseLike> = async () => ({
    ok: true,
    async arrayBuffer(): Promise<ArrayBuffer> {
      return new ArrayBuffer(12);
    },
  }),
): { createContext: ReturnType<typeof vi.fn>; fetchAudio: ReturnType<typeof vi.fn>; runtime: AudioRuntime } {
  const createContext = vi.fn((): AudioContextLike => context);
  const fetchAudio = vi.fn((path: string): Promise<AudioResponseLike> => responseForPath(path));
  return { createContext, fetchAudio, runtime: { createContext, fetchAudio } };
}

function node(office: Governor, tier: OrreryNode["state"]["tier"] = "A0"): OrreryNode {
  const canonicalStateId = OFFICE_PALETTES[office].canonicalStateId;
  return {
    state: {
      stateId: tier === "A0" ? canonicalStateId : 100 + canonicalStateId,
      pitchMask: canonicalStateId,
      pitchClasses: [...OFFICE_PALETTES[office].pitchClasses],
      intervalVector: [2, 5, 4, 3, 6, 1],
      chirality: "achiral",
      nodeId: `scale:${office.toLowerCase()}-${tier}`,
      name: `${office} ${tier}`,
      forteFamily: tier === "A0" ? "7-35" : tier === "A1" ? "7-34" : "7-33",
      tier,
      role: "anchor",
    },
    resolution: { office, officeBearing: true },
    photonic: {
      photonicId: `photonic:${office.toLowerCase()}`,
      office,
      representativeWavelengthNm: 500,
      photonicCompression: 0.5,
    },
    canonicalProfile: {
      profileId: `profile:${office.toLowerCase()}`,
      profileVersion: "0.1.1",
      office,
      domainReferences: { landforms: ["ridge"] },
    },
    scopedHarmonicDescriptor: {
      coordinateId: "harmonic.CH_A012_q_v1",
      status: "admitted_scoped_A012",
      stateGovernor: office,
      weightedProjection: { numerator: 1, denominator: 407 },
    },
  };
}

function pitchClassesFromOscillators(context: FakeAudioContext): number[] {
  return context.oscillators.map((oscillator) => {
    const frequency = oscillator.frequency.values[0];
    const midi = Math.round(69 + 12 * Math.log2(frequency / AUDIO_A4_HZ));
    return ((midi % 12) + 12) % 12;
  });
}

function nodeWithPitches(
  office: Governor,
  tier: OrreryNode["state"]["tier"],
  pitchClasses: readonly number[],
): OrreryNode {
  return {
    ...node(office, tier),
    state: { ...node(office, tier).state, pitchClasses: [...pitchClasses] },
  };
}

class MemoryVoicingStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("Harmonic Orrery audio manifest", () => {
  it("pins all seven canonical A0 pitch palettes and authored asset metadata", () => {
    validateAudioManifest();

    expect(OFFICE_PALETTES).toMatchObject({
      Sun: { canonicalStateId: 2773, mode: "Lydian", pitchClasses: [0, 2, 4, 6, 7, 9, 11] },
      Moon: { canonicalStateId: 2741, mode: "Ionian", pitchClasses: [0, 2, 4, 5, 7, 9, 11] },
      Mars: { canonicalStateId: 1717, mode: "Mixolydian", pitchClasses: [0, 2, 4, 5, 7, 9, 10] },
      Mercury: { canonicalStateId: 1709, mode: "Dorian", pitchClasses: [0, 2, 3, 5, 7, 9, 10] },
      Jupiter: { canonicalStateId: 1453, mode: "Aeolian", pitchClasses: [0, 2, 3, 5, 7, 8, 10] },
      Venus: { canonicalStateId: 1451, mode: "Phrygian", pitchClasses: [0, 1, 3, 5, 7, 8, 10] },
      Saturn: { canonicalStateId: 1387, mode: "Locrian", pitchClasses: [0, 1, 3, 5, 6, 8, 10] },
    });
    expect(AUDIO_LOOP_ASSETS).toHaveLength(3);
    expect(AUDIO_LOOP_ASSETS.every((asset) => /^[a-f0-9]{64}$/.test(asset.sha256))).toBe(true);
  });

  it("uses the documented C4 / MIDI 60 12-TET register convention", () => {
    expect(pitchClassToMidi(0)).toBe(AUDIO_ROOT_MIDI_NOTE);
    expect(pitchClassToMidi(11, 12)).toBe(AUDIO_ROOT_MIDI_NOTE + 23);
    expect(midiToFrequency(69)).toBe(AUDIO_A4_HZ);
    expect(() => pitchClassToMidi(12)).toThrow("0 through 11");
    expect(() => pitchClassToMidi(0, 1)).toThrow("octave register offset");
  });

  it("keeps A1 and A2 identity while inheriting their office A0 palette under court-pentatonic voicing", () => {
    const a0 = resolveAudioSelection(node("Mars", "A0"), "C0", "court-pentatonic");
    const a1 = resolveAudioSelection(node("Mars", "A1"), "C0", "court-pentatonic");
    const a2 = resolveAudioSelection(node("Mars", "A2"), "C0", "court-pentatonic");

    expect(a0.inheritedOfficePalette).toBe(false);
    expect(a1.inheritedOfficePalette).toBe(true);
    expect(a2.inheritedOfficePalette).toBe(true);
    expect(a1.selectedStateName).toBe("Mars A1");
    expect(a2.selectedStateName).toBe("Mars A2");
    expect(a1.palette).toBe(OFFICE_PALETTES.Mars);
    expect(a2.palette).toBe(OFFICE_PALETTES.Mars);
  });

  it("retains and exposes only office pitches admitted by the selected Court mask in court-pentatonic mode", () => {
    const selection = resolveAudioSelection(node("Sun"), "C1", "court-pentatonic");

    expect(selection.court).toMatchObject({ positionId: "C1", scaleName: "Scottish Pentatonic", pitchMask: 677 });
    expect(selection.palette.pitchClasses).toEqual([0, 2, 4, 6, 7, 9, 11]);
    expect(selection.retainedPitchClasses).toEqual([0, 2, 7, 9]);
    expect(selection.suppressedPitchClasses).toEqual([4, 6, 11]);
  });

  it("voices an anchor's own seven-note mask under heptatonic voicing regardless of Court", () => {
    // Melodic Minor (A1) must no longer sound like the inherited Mars/Mixolydian palette.
    const melodicMinor = nodeWithPitches("Mars", "A1", [0, 2, 3, 5, 7, 9, 11]);

    const heptatonic = resolveAudioSelection(melodicMinor, "C0", "heptatonic");
    expect(heptatonic.voicingMode).toBe("heptatonic");
    expect(heptatonic.retainedPitchClasses).toEqual([0, 2, 3, 5, 7, 9, 11]);
    expect(heptatonic.suppressedPitchClasses).toEqual([]);
    expect(heptatonic.inheritedOfficePalette).toBe(false);

    const heptatonicAtC4 = resolveAudioSelection(melodicMinor, "C4", "heptatonic");
    expect(heptatonicAtC4.retainedPitchClasses).toEqual([0, 2, 3, 5, 7, 9, 11]);

    const pentatonic = resolveAudioSelection(melodicMinor, "C0", "court-pentatonic");
    expect(pentatonic.retainedPitchClasses).toEqual([0, 2, 4, 7, 9]);
    expect(pentatonic.inheritedOfficePalette).toBe(true);
  });
});

describe("Harmonic Orrery audio engine", () => {
  it("does not create audio or request assets before an explicit enable action", async () => {
    const context = new FakeAudioContext();
    const fake = audioRuntime(context);
    const engine = new OrreryAudioEngine(fake.runtime);

    engine.select(node("Sun"), "C0");
    engine.select(node("Sun"), "C1");
    expect(fake.createContext).not.toHaveBeenCalled();
    expect(fake.fetchAudio).not.toHaveBeenCalled();
    expect(context.oscillators).toHaveLength(0);

    await engine.enable(AUDIO_PROFILE_REGISTRY_RELEASE_ID);

    expect(fake.createContext).toHaveBeenCalledTimes(1);
    expect(context.resumeCount).toBe(1);
    expect(fake.fetchAudio.mock.calls.map(([path]) => path)).toEqual(
      AUDIO_LOOP_ASSETS.map((asset) => asset.filename),
    );
    expect(context.oscillators).toHaveLength(8);
    expect(pitchClassesFromOscillators(context)).toEqual([0, 2, 4, 6, 7, 9, 11, 0]);
    expect(context.bufferSources).toHaveLength(1);
    expect(context.oscillators.filter((oscillator) => oscillator.stopTimes).length).toBe(8);
    expect(context.oscillators.filter((oscillator) => oscillator.stopTimes.length === 2)).toHaveLength(0);

    // Arpeggio pacing: consecutive onsets stagger by AUDIO_VOICE_STAGGER_SECONDS so the
    // seven scale notes spread across ~3 seconds and the octave close lands at 3.5s.
    const voiceStarts = context.oscillators.map((oscillator) => oscillator.startTimes[0]);
    for (let index = 1; index < voiceStarts.length; index += 1) {
      expect(voiceStarts[index] - voiceStarts[index - 1]).toBeCloseTo(AUDIO_VOICE_STAGGER_SECONDS, 5);
    }
  });

  it("rejects a mismatched canonical source before creating an audio context", async () => {
    const context = new FakeAudioContext();
    const fake = audioRuntime(context);
    const engine = new OrreryAudioEngine(fake.runtime);

    await engine.enable("canonical-profile-registry:0.1.0");

    expect(fake.createContext).not.toHaveBeenCalled();
    expect(fake.fetchAudio).not.toHaveBeenCalled();
    expect(engine.snapshot()).toMatchObject({ readiness: "error", transport: "stopped" });
  });

  it("degrades deterministically when a loop fails while synthesis and controls remain available", async () => {
    const context = new FakeAudioContext();
    const fake = audioRuntime(context, async (path) => {
      if (path.includes("ticks")) {
        throw new Error("offline");
      }
      return {
        ok: true,
        async arrayBuffer(): Promise<ArrayBuffer> {
          return new ArrayBuffer(12);
        },
      };
    });
    const engine = new OrreryAudioEngine(fake.runtime);

    engine.select(node("Mercury"), "C0");
    await engine.enable(AUDIO_PROFILE_REGISTRY_RELEASE_ID);

    expect(engine.snapshot()).toMatchObject({
      failedAssetIds: ["percussion-ticks-v1"],
      readiness: "degraded",
      transport: "playing",
    });
    expect(context.oscillators).toHaveLength(8);
    expect(context.bufferSources).toHaveLength(0);

    engine.setMuted(true);
    engine.setVolume(0.2);
    expect(engine.snapshot()).toMatchObject({ muted: true, volume: 0.2 });
    await engine.pause();
    expect(context.suspendCount).toBe(1);
    expect(engine.snapshot().transport).toBe("paused");

    engine.setVisualOnly(true);
    const oscillatorCount = context.oscillators.length;
    engine.select(node("Mercury", "A2"), "C0");
    expect(engine.snapshot().visualOnly).toBe(true);
    expect(context.oscillators).toHaveLength(oscillatorCount);
  });

  it("revoices a playing selection without reinitializing audio", async () => {
    const context = new FakeAudioContext();
    const fake = audioRuntime(context);
    const engine = new OrreryAudioEngine(fake.runtime);

    engine.select(node("Sun"), "C0");
    await engine.enable(AUDIO_PROFILE_REGISTRY_RELEASE_ID);
    const initialOscillatorCount = context.oscillators.length;

    expect(initialOscillatorCount).toBe(8);
    expect(pitchClassesFromOscillators(context)).toEqual([0, 2, 4, 6, 7, 9, 11, 0]);

    // Heptatonic voicing is Court-independent: the same eight onsets (scale + octave),
    // but the crossfade still revoices so the change stays audible as a smooth morph.
    engine.select(node("Sun"), "C1");

    expect(fake.createContext).toHaveBeenCalledTimes(1);
    expect(fake.fetchAudio).toHaveBeenCalledTimes(AUDIO_LOOP_ASSETS.length);
    expect(pitchClassesFromOscillators(context).slice(initialOscillatorCount)).toEqual([
      0, 2, 4, 6, 7, 9, 11, 0,
    ]);
  });

  it("crossfades a playing selection by delaying stops and ramping envelopes", async () => {
    const context = new FakeAudioContext();
    const fake = audioRuntime(context);
    const engine = new OrreryAudioEngine(fake.runtime);

    engine.select(node("Sun"), "C0");
    await engine.enable(AUDIO_PROFILE_REGISTRY_RELEASE_ID);
    expect(context.oscillators).toHaveLength(8);

    // Revoice through a new selection while playing: the old voices must fade
    // over AUDIO_CROSSFADE_SECONDS instead of being cut at currentTime.
    engine.select(node("Sun"), "C1");

    const fadingVoices = context.oscillators.slice(0, 8);
    expect(
      fadingVoices.every(
        (voice) => voice.stopTimes.at(-1) === context.currentTime + AUDIO_CROSSFADE_SECONDS,
      ),
    ).toBe(true);
    expect(context.gains.slice(1, 9).every((gain) => gain.gain.values.at(-1) === 0.0001)).toBe(true);

    expect(context.bufferSources[0]?.stopTimes[0]).toBe(context.currentTime + AUDIO_CROSSFADE_SECONDS);
    expect(context.gains[9]?.gain.values.at(-1)).toBe(0.0001);

    expect(pitchClassesFromOscillators(context).slice(8)).toEqual([0, 2, 4, 6, 7, 9, 11, 0]);
  });

  it("crossfades into court-pentatonic voicing on mode switch without refetching assets", async () => {
    const context = new FakeAudioContext();
    const fake = audioRuntime(context);
    const engine = new OrreryAudioEngine(fake.runtime);

    engine.select(node("Sun"), "C0");
    await engine.enable(AUDIO_PROFILE_REGISTRY_RELEASE_ID);
    expect(engine.currentVoicingMode()).toBe("heptatonic");
    const oscillatorCountBeforeSwitch = context.oscillators.length;
    const fetchCallsAfterEnable = fake.fetchAudio.mock.calls.length;

    const revoiced = engine.setVoicingMode("court-pentatonic");

    expect(revoiced?.voicingMode).toBe("court-pentatonic");
    expect(revoiced?.retainedPitchClasses).toEqual([0, 2, 4, 7, 9]);
    expect(fake.createContext).toHaveBeenCalledTimes(1);
    expect(fake.fetchAudio).toHaveBeenCalledTimes(fetchCallsAfterEnable);
    expect(context.oscillators.slice(oscillatorCountBeforeSwitch)).toHaveLength(6);
    expect(pitchClassesFromOscillators(context).slice(oscillatorCountBeforeSwitch)).toEqual([0, 2, 4, 7, 9, 0]);
    expect(engine.snapshot().detail).toContain("Court pentatonic voicing active");

    const countBeforeRestore = context.oscillators.length;
    engine.setVoicingMode("heptatonic");
    expect(pitchClassesFromOscillators(context).slice(countBeforeRestore)).toEqual([0, 2, 4, 6, 7, 9, 11, 0]);
    expect(engine.snapshot().detail).toContain("Heptatonic voicing active");
  });

  it("persists the voicing mode under a dedicated storage key with safe fallback", () => {
    expect(loadVoicingMode(undefined)).toBe("heptatonic");

    const storage = new MemoryVoicingStorage();
    expect(loadVoicingMode(storage)).toBe("heptatonic");

    saveVoicingMode(storage, "court-pentatonic");
    expect(storage.values.get(AUDIO_VOICING_STORAGE_KEY)).toBe("court-pentatonic");
    expect(loadVoicingMode(storage)).toBe("court-pentatonic");

    storage.values.set(AUDIO_VOICING_STORAGE_KEY, "bogus");
    expect(loadVoicingMode(storage)).toBe("heptatonic");
  });
});
