import { describe, expect, it } from "vitest";

import {
  CHALDEAN_ORDER_WITNESS,
  CHALDEAN_WEIGHT_DENOMINATOR,
  CHALDEAN_WEIGHT_NUMERATORS,
  DEGREE_GOVERNORS,
  buildNodeChords,
  chaldeanWeightNumerator,
  generateProgression,
  nodeProgressionSeed,
} from "./harmony";
import { OFFICE_PALETTES } from "./audio";

const IONIAN = [...OFFICE_PALETTES.Moon.pitchClasses]; // [0,2,4,5,7,9,11]
const LYDIAN = [...OFFICE_PALETTES.Sun.pitchClasses]; // [0,2,4,6,7,9,11]
const LOCRIAN = [...OFFICE_PALETTES.Saturn.pitchClasses]; // [0,1,3,5,6,8,10]

function binomial(n: number, k: number): number {
  let result = 1;
  for (let index = 1; index <= k; index += 1) {
    result = (result * (n - k + index)) / index;
  }
  return Math.round(result);
}

describe("Intra-node harmony canon", () => {
  it("pins the admitted Chaldean order witness and weight numerators", () => {
    // docs/INTRA_NODE_DYNAMICS.md §Chaldean Degree Weights
    expect(CHALDEAN_WEIGHT_NUMERATORS).toEqual([116, 56, 41, 35, 77, 44, 38]);
    expect(CHALDEAN_WEIGHT_DENOMINATOR).toBe(407);
    expect(CHALDEAN_ORDER_WITNESS).toBe("w1>w5>w2>w6>w3>w7>w4");
    const ordering = CHALDEAN_WEIGHT_NUMERATORS.map((numerator, index) => ({
      degree: index + 1,
      numerator,
    }))
      .sort((left, right) => right.numerator - left.numerator)
      .map((entry) => `w${entry.degree}`);
    expect(ordering).toEqual(["w1", "w5", "w2", "w6", "w3", "w7", "w4"]);
    expect(CHALDEAN_WEIGHT_NUMERATORS.reduce((sum, value) => sum + value, 0)).toBe(
      CHALDEAN_WEIGHT_DENOMINATOR,
    );
    expect(chaldeanWeightNumerator(1)).toBe(116);
    expect(chaldeanWeightNumerator(4)).toBe(35);
    expect(() => chaldeanWeightNumerator(0)).toThrow("1 through 7");
  });

  it("materializes seven distinct root-addressed chords per size within lattice cardinalities", () => {
    // SubsetLattice cardinalities: rank-2 = C(7,2)=21, rank-3 = C(7,3)=35 and
    // the v2 rank-4 extension = C(7,4)=35. The renderer voices the root-stacked
    // family (one chord per degree) drawn from that inventory.
    expect([binomial(7, 2), binomial(7, 3), binomial(7, 4)]).toEqual([21, 35, 35]);

    for (const size of [2, 3, 4] as const) {
      const chords = buildNodeChords(IONIAN, size);
      expect(chords).toHaveLength(7);
      for (const chord of chords) {
        expect(chord.degrees[0]).toBe(chord.rootDegree);
        expect(new Set(chord.degrees).size).toBe(size);
        expect(DEGREE_GOVERNORS[chord.rootDegree - 1]).toBeDefined();
        expect(chord.weightLabel).toBe(`${chord.weightNumerator}/407`);
        for (const pitchClass of chord.pitchClasses) {
          expect(IONIAN).toContain(pitchClass);
        }
      }
      expect(new Set(chords.map((chord) => chord.pitchClasses.join(","))).size).toBe(7);
    }
  });

  it("reproduces court_mathematics.DegreeTriad parity on Ionian trichords", () => {
    const chords = buildNodeChords(IONIAN, 3);
    // C-E-G / D-F-A / E-G-B / F-A-C / G-B-D / A-C-E / B-D-F
    expect(chords.map((chord) => chord.pitchClasses.join(","))).toEqual([
      "0,4,7",
      "2,5,9",
      "4,7,11",
      "0,5,9",
      "2,7,11",
      "0,4,9",
      "2,5,11",
    ]);
    expect(chords.map((chord) => chord.qualityLabel)).toEqual([
      "major",
      "minor",
      "minor",
      "major",
      "major",
      "minor",
      "diminished",
    ]);
    expect(chords.map((chord) => chord.rootDegree)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("classifies Lydian's Sun-degree trichord via qClasses signatures", () => {
    const chords = buildNodeChords(LYDIAN, 3);
    // Lydian d4 stacked thirds: F#-A-C -> signature (3,6) = diminished
    const sunChord = chords[3];
    expect(sunChord.rootDegree).toBe(4);
    expect(sunChord.pitchClasses).toEqual([0, 6, 9]);
    expect(sunChord.qualityLabel).toBe("diminished");
    expect(sunChord.weightLabel).toBe("35/407");
    // d2 stacked thirds: D-F#-A -> signature (4,7) = major
    expect(chords[1].pitchClasses).toEqual([2, 6, 9]);
    expect(chords[1].qualityLabel).toBe("major");
    // Full Lydian sequence: maj, maj, min, dim, maj, min, min
    expect(chords.map((chord) => chord.qualityLabel)).toEqual([
      "major",
      "major",
      "minor",
      "diminished",
      "major",
      "minor",
      "minor",
    ]);
    // The qClasses "other" bucket fires off-diatonic: craft a set whose d1
    // stack is C-Eb-G# -> signature (3,8).
    const synthetic = [0, 2, 3, 5, 8, 9, 10];
    const syntheticChords = buildNodeChords(synthetic, 3);
    expect(syntheticChords[0].qualityLabel).toBe("other");
    const syntheticDyads = buildNodeChords(synthetic, 2);
    expect(syntheticDyads[0].qualityLabel).toBe("augmented fifth dyad");
  });

  it("labels Locrian's root dyad as a diminished fifth", () => {
    const chords = buildNodeChords(LOCRIAN, 2);
    expect(chords[0].pitchClasses).toEqual([0, 6]);
    expect(chords[0].qualityLabel).toBe("diminished fifth dyad");
  });

  it("derives seventh qualities for v2 tetrachords", () => {
    const ionianTetrads = buildNodeChords(IONIAN, 4);
    // Cmaj7 on Saturn, half-diminished on Moon
    expect(ionianTetrads[0].pitchClasses).toEqual([0, 4, 7, 11]);
    expect(ionianTetrads[0].qualityLabel).toBe("maj7");
    expect(ionianTetrads[6].pitchClasses).toEqual([2, 5, 9, 11]);
    expect(ionianTetrads[6].qualityLabel).toBe("half-diminished");

    const lydianTetrads = buildNodeChords(LYDIAN, 4);
    expect(lydianTetrads[0].qualityLabel).toBe("maj7");
    expect(() => buildNodeChords([1, 2, 3], 3)).toThrow("rooted seven-note");
    expect(() => buildNodeChords(IONIAN, 5 as never)).toThrow("Chord size must be 2, 3, or 4");
  });
});

describe("Progression generator", () => {
  it("is deterministic per seed and opens/closes on the Saturn degree", () => {
    const first = generateProgression(20260825, 8);
    const second = generateProgression(20260825, 8);
    expect(first).toEqual(second);
    expect(first).toHaveLength(8);
    expect(first[0]).toBe(1);
    expect(first[7]).toBe(1);
  });

  it("never repeats a degree on consecutive steps", () => {
    for (const seed of [7, 123456, 998877]) {
      const sequence = generateProgression(seed, 16);
      for (let index = 1; index < sequence.length; index += 1) {
        expect(sequence[index]).not.toBe(sequence[index - 1]);
      }
      expect(sequence.every((degree) => degree >= 1 && degree <= 7)).toBe(true);
    }
  });

  it("favors characteristic degrees across many seeds", () => {
    // w1 > w5 > w2 > ... : degree 1 must dominate mid-sequence frequency and
    // degree 4 (least gravity) must not outrank it.
    const counts = new Map<number, number>();
    for (let seed = 1; seed <= 400; seed += 1) {
      for (const degree of generateProgression(seed * 7919, 12)) {
        counts.set(degree, (counts.get(degree) ?? 0) + 1);
      }
    }
    expect(counts.get(1)!).toBeGreaterThan(counts.get(4)!);
    expect(counts.get(1)!).toBeGreaterThan(counts.get(7)!);
  });

  it("rejects bad seeds and lengths", () => {
    expect(() => generateProgression(0, 8)).toThrow("positive safe integer");
    expect(() => generateProgression(42, 1)).toThrow("between 2 and 32");
    expect(() => generateProgression(42, 64)).toThrow("between 2 and 32");
  });

  it("derives stable default seeds per node and configuration", () => {
    expect(nodeProgressionSeed(2773, 8, 3)).toBe(nodeProgressionSeed(2773, 8, 3));
    expect(nodeProgressionSeed(2773, 8, 3)).not.toBe(nodeProgressionSeed(2741, 8, 3));
    expect(nodeProgressionSeed(2773, 8, 3)).not.toBe(nodeProgressionSeed(2773, 8, 2));
  });
});
