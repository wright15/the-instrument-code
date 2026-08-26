// Intra-node harmony — degree-addressed chord voicings and the seeded
// progression generator. Canon sources:
//  - docs/INTRA_NODE_DYNAMICS.md (Chaldean weights, stacked-degree subsets,
//    render-gravity amplitude, rank-4 v2 extension)
//  - canonical/harmonic-compression-candidates/CH_A012_q_v1.json method
//    (qClasses triad-quality signatures, governorDegreeMap, denominator 407)
//  - court-mathematics/src/court_mathematics/triads.py DegreeTriad
//    (stacked-degree index arithmetic via +12 extended intervals)

export const CHALDEAN_WEIGHT_NUMERATORS = [116, 56, 41, 35, 77, 44, 38] as const;
export const CHALDEAN_WEIGHT_DENOMINATOR = 407;
export const CHALDEAN_ORDER_WITNESS = "w1>w5>w2>w6>w3>w7>w4";

export const DEGREE_GOVERNORS = [
  "Saturn",
  "Jupiter",
  "Mars",
  "Sun",
  "Venus",
  "Mercury",
  "Moon",
] as const;

interface TriadQClass {
  runtimeQuality: string;
  signature: readonly [number, number];
}

const TRIAD_Q_CLASSES: readonly TriadQClass[] = [
  { runtimeQuality: "major", signature: [4, 7] },
  { runtimeQuality: "minor", signature: [3, 7] },
  { runtimeQuality: "diminished", signature: [3, 6] },
  { runtimeQuality: "augmented", signature: [4, 8] },
];

const FIFTH_LABELS: Record<number, string> = {
  6: "diminished fifth dyad",
  7: "perfect fifth dyad",
  8: "augmented fifth dyad",
};

const SEVENTH_LABELS: Record<string, string> = {
  "major-11": "maj7",
  "major-10": "dominant 7",
  "minor-10": "min7",
  "minor-11": "min-maj7",
  "diminished-9": "dim7",
  "diminished-10": "half-diminished",
};

export type ChordSize = 2 | 3 | 4;
export const CHORD_SIZES: readonly ChordSize[] = [2, 3, 4];

export function isChordSize(value: unknown): value is ChordSize {
  return typeof value === "number" && (CHORD_SIZES as readonly number[]).includes(value);
}

const STACK_OFFSETS: Record<ChordSize, readonly number[]> = {
  2: [0, 4],
  3: [0, 2, 4],
  4: [0, 2, 4, 6],
};

export interface NodeChord {
  rootDegree: number;
  degrees: number[];
  pitchClasses: number[];
  weightNumerator: number;
  weightLabel: string;
  qualityLabel: string;
}

function validateNodePitchClasses(pitchClasses: readonly number[]): void {
  if (
    pitchClasses.length !== 7 ||
    pitchClasses[0] !== 0 ||
    new Set(pitchClasses).size !== 7 ||
    pitchClasses.some((pc) => !Number.isInteger(pc) || pc < 0 || pc > 11)
  ) {
    throw new Error("Intra-node chords require a rooted seven-note ascending pitch-class set.");
  }
}

function triadQualityLabel(third: number, fifth: number): string {
  const match = TRIAD_Q_CLASSES.find((q) => q.signature[0] === third && q.signature[1] === fifth);
  return match ? match.runtimeQuality : "other";
}

function tetradQualityLabel(third: number, fifth: number, seventh: number): string {
  const triad = triadQualityLabel(third, fifth);
  return SEVENTH_LABELS[`${triad}-${seventh}`] ?? `other (${third},${fifth},${seventh})`;
}

export function buildNodeChords(
  pitchClasses: readonly number[],
  size: ChordSize,
): NodeChord[] {
  validateNodePitchClasses(pitchClasses);
  if (!isChordSize(size)) {
    throw new Error("Chord size must be 2, 3, or 4.");
  }

  // Port of court_mathematics.DegreeTriad: extend the ordered pitch classes by
  // one octave so stacked indexes never wrap past the root.
  const extended = [...pitchClasses, ...pitchClasses.map((pc) => pc + 12)];
  const offsets = STACK_OFFSETS[size];

  return DEGREE_GOVERNORS.map((_governor, index) => {
    const degrees = offsets.map((offset) => ((index + offset) % 7) + 1);
    const chordPitchClasses = offsets.map((offset) => extended[index + offset] % 12);
    const third = extended[index + 2] - extended[index];
    const fifth = extended[index + 4] - extended[index];
    const seventh = size === 4 ? extended[index + 6] - extended[index] : 0;

    let qualityLabel: string;
    if (size === 2) {
      qualityLabel = FIFTH_LABELS[fifth] ?? `other fifth (${fifth})`;
    } else if (size === 3) {
      qualityLabel = triadQualityLabel(third, fifth);
    } else {
      qualityLabel = tetradQualityLabel(third, fifth, seventh);
    }

    const numerator = CHALDEAN_WEIGHT_NUMERATORS[index];
    return {
      rootDegree: index + 1,
      degrees,
      pitchClasses: [...chordPitchClasses].sort((left, right) => left - right),
      weightNumerator: numerator,
      weightLabel: `${numerator}/${CHALDEAN_WEIGHT_DENOMINATOR}`,
      qualityLabel,
    };
  });
}

export function chaldeanWeightNumerator(degree: number): number {
  if (!Number.isInteger(degree) || degree < 1 || degree > 7) {
    throw new Error("Degree must be an integer 1 through 7.");
  }
  return CHALDEAN_WEIGHT_NUMERATORS[degree - 1];
}

/**
 * Seeded weighted walk over root degrees. Weight sampling follows the Chaldean
 * numerators; consecutive steps never repeat a degree and the walk opens and
 * closes on degree 1 (Saturn bookends). Same seed => same sequence.
 */
export function generateProgression(seed: number, steps = 8): number[] {
  if (!Number.isSafeInteger(seed) || seed <= 0) {
    throw new Error("Progression seed must be a positive safe integer.");
  }
  if (!Number.isInteger(steps) || steps < 2 || steps > 32) {
    throw new Error("Progression length must be between 2 and 32 steps.");
  }

  let state = seed >>> 0;
  const nextRandom = (): number => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };

  const sequence: number[] = [1];
  while (sequence.length < steps) {
    const previous = sequence[sequence.length - 1];
    const candidates = DEGREE_GOVERNORS.map((_governor, index) => index + 1).filter(
      (degree) => degree !== previous,
    );
    const total = candidates.reduce((sum, degree) => sum + chaldeanWeightNumerator(degree), 0);
    let threshold = nextRandom() * total;
    let chosen = candidates[candidates.length - 1];
    for (const candidate of candidates) {
      threshold -= chaldeanWeightNumerator(candidate);
      if (threshold < 0) {
        chosen = candidate;
        break;
      }
    }
    sequence.push(chosen);
  }
  sequence[steps - 1] = 1;
  return sequence;
}

/** Deterministic per-node default seed so reloads replay the same progression until reseeded. */
export function nodeProgressionSeed(stateId: number, steps: number, chordSize: ChordSize): number {
  return ((stateId * 2654435761) ^ (steps * 97 + chordSize)) >>> 0 || 1;
}
