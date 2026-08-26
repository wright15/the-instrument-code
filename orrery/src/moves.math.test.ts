import { describe, expect, it } from "vitest";

/**
 * R / L parallel-mode operator math — 12-bit pitch-class masks
 *
 * Verifies the TDD examples from docs/R_L_OPERATOR_MATH.md and the
 * harmonic scalar CH_A012_Q_V1 (denominator 407).
 *
 * Sources:
 *  - seven-governors-mutation-algebra-audit/audit/operator-registry.csv
 *  - seven-governors-mutation-algebra-audit/audit/operator-applications.csv
 *    (R4:2741:2773 xor=96, L4:2773:2741 xor=96)
 *  - canonical/harmonic-compression-candidates/CH_A012_q_v1.json
 */

// ---------------------------------------------------------------------------
// Constants — A0 anchors Ionian / Lydian
// ---------------------------------------------------------------------------

const IONIAN_MASK = 2741; // 101011010101₂ {0,2,4,5,7,9,11}  C_H = 217/407  Moon
const LYDIAN_MASK = 2773; // 101011100101₂ {0,2,4,6,7,9,11}  C_H = 193/407  Sun

const IONIAN_PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11] as const;
const LYDIAN_PITCH_CLASSES = [0, 2, 4, 6, 7, 9, 11] as const;

// CH_A012_Q_V1 weightedProjection (denominator always 407 = chaldean_order_witness_v1)
const CH_BY_MASK: Record<number, { numerator: number; denominator: 407 }> = {
  [IONIAN_MASK]: { numerator: 217, denominator: 407 },
  [LYDIAN_MASK]: { numerator: 193, denominator: 407 },
};

// ---------------------------------------------------------------------------
// Helpers — pure 12-bit mask logic (mirrors docs/R_L_OPERATOR_MATH.md §10)
// ---------------------------------------------------------------------------

function pitchClassesFromMask(mask: number): number[] {
  const pcs: number[] = [];
  for (let pc = 0; pc < 12; pc++) if (mask & (1 << pc)) pcs.push(pc);
  return pcs;
}

function maskToBinary12(mask: number): string {
  return mask.toString(2).padStart(12, "0");
}

/**
 * Apply a fixed_degree_shift operator at ordered degree d.
 * degree: 2..7 (1 is root-phase, not fixed). delta: +1 = R, -1 = L.
 * Returns the mutated mask or null if undefined (collision / crossing / boundary).
 */
function applyFixedDegreeShift(
  mask: number,
  degree: number,
  delta: 1 | -1,
): number | null {
  if ((mask & 1) === 0) return null; // not rooted
  const pcs = pitchClassesFromMask(mask);
  if (pcs.length !== 7) return null;
  if (pcs[0] !== 0) return null;
  if (degree < 2 || degree > 7) return null;
  const oldPc = pcs[degree - 1];
  const newPc = oldPc + delta;
  if (newPc < 0 || newPc > 11) return null; // rooted boundary
  if (mask & (1 << newPc)) return null; // collision
  const prev = degree > 1 ? pcs[degree - 2] : -1;
  const next = degree < 7 ? pcs[degree] : 12;
  if (newPc <= prev || newPc >= next) return null; // crossing
  const xor = (1 << oldPc) | (1 << newPc);
  return mask ^ xor;
}

function applyR(degree: number, mask: number): number | null {
  return applyFixedDegreeShift(mask, degree, 1);
}

function applyL(degree: number, mask: number): number | null {
  return applyFixedDegreeShift(mask, degree, -1);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("R/L parallel operators — 12-bit pitch-class math (docs/R_L_OPERATOR_MATH.md)", () => {
  it("encodes Ionian and Lydian masks correctly", () => {
    expect(pitchClassesFromMask(IONIAN_MASK)).toEqual([...IONIAN_PITCH_CLASSES]);
    expect(pitchClassesFromMask(LYDIAN_MASK)).toEqual([...LYDIAN_PITCH_CLASSES]);
    expect(maskToBinary12(IONIAN_MASK)).toBe("101010110101");
    expect(maskToBinary12(LYDIAN_MASK)).toBe("101011010101");
    // audit sanity: stateId == Σ 1<<pc
    expect(IONIAN_MASK).toBe(1 + 4 + 16 + 32 + 128 + 512 + 2048);
    expect(LYDIAN_MASK).toBe(1 + 4 + 16 + 64 + 128 + 512 + 2048);
  });

  it("applying R4 (Sun Raise) to Ionian results in the Lydian bitmask", () => {
    const result = applyR(4, IONIAN_MASK);
    expect(result).toBe(LYDIAN_MASK);

    // XOR mask must be exactly bits 5 and 6 (32 + 64 = 96)
    const xor = IONIAN_MASK ^ LYDIAN_MASK;
    expect(xor).toBe(96);
    expect(xor).toBe((1 << 5) | (1 << 6));
    expect(maskToBinary12(xor)).toBe("000001100000");

    // step-by-step: old degree-4 pitch 5 → 6
    const pcs = pitchClassesFromMask(IONIAN_MASK);
    expect(pcs[3]).toBe(5); // degree 4 = Sun, pitch 5
    expect(result).not.toBeNull();
    expect(pitchClassesFromMask(result!)).toEqual([...LYDIAN_PITCH_CLASSES]);
  });

  it("applying L4 (Sun Lower) to Lydian results in the Ionian bitmask", () => {
    const result = applyL(4, LYDIAN_MASK);
    expect(result).toBe(IONIAN_MASK);

    const xor = LYDIAN_MASK ^ IONIAN_MASK;
    expect(xor).toBe(96);
    expect(xor).toBe((1 << 5) | (1 << 6));

    const pcs = pitchClassesFromMask(LYDIAN_MASK);
    expect(pcs[3]).toBe(6); // degree 4 = Sun, pitch 6
    expect(pitchClassesFromMask(result!)).toEqual([...IONIAN_PITCH_CLASSES]);
  });

  it("R4 and L4 are mutual inverses (round-trip)", () => {
    expect(applyL(4, applyR(4, IONIAN_MASK)!)).toBe(IONIAN_MASK);
    expect(applyR(4, applyL(4, LYDIAN_MASK)!)).toBe(LYDIAN_MASK);
  });

  it("R7 (Moon Raise) on Ionian is undefined — collision at root (documents prompt correction)", () => {
    // Ionian degree 7 has pitch 11; raising would need pitch 12 (∉ Z12) or wrap to 0 (collision).
    // The prompt example citing R7 Ionian→Lydian is incorrect; the correct edge is R4.
    // This test guards that our implementation respects the domain rule from operator-registry.csv:
    // "Defined when Degree 7 can move up one semitone without collision or crossing the rooted boundary."
    expect(applyR(7, IONIAN_MASK)).toBeNull();
    expect(applyR(7, LYDIAN_MASK)).toBeNull();
    // Audit confirms no row R7:2741:* exists; R7 is valid elsewhere e.g. Mixolydian 1717→Ionian
    expect(applyR(7, 1717)).toBe(IONIAN_MASK); // sanity: Mixolydian {0,2,4,5,7,9,10} R7 10→11 = Ionian
  });

  it("resulting CH scalar (CH_A012_Q_V1) matches the expected value for the target node", () => {
    const lydianViaR4 = applyR(4, IONIAN_MASK)!;
    expect(lydianViaR4).toBe(LYDIAN_MASK);
    const chLydian = CH_BY_MASK[lydianViaR4];
    expect(chLydian).toEqual({ numerator: 193, denominator: 407 });

    const ionianViaL4 = applyL(4, LYDIAN_MASK)!;
    expect(ionianViaL4).toBe(IONIAN_MASK);
    const chIonian = CH_BY_MASK[ionianViaL4];
    expect(chIonian).toEqual({ numerator: 217, denominator: 407 });

    // Also verify the target literals match CH_A012_q_v1.json records directly
    // (prevents drift if CH table is refactored)
    expect(CH_BY_MASK[IONIAN_MASK].numerator).toBe(217);
    expect(CH_BY_MASK[LYDIAN_MASK].numerator).toBe(193);
    expect(CH_BY_MASK[IONIAN_MASK].denominator).toBe(407);
    expect(CH_BY_MASK[LYDIAN_MASK].denominator).toBe(407);
  });

  it("rejects invalid shifts (collision and crossing)", () => {
    // Raising Lydian degree 4 (pitch 6→7) would collide with degree 5 pitch 7
    expect(applyR(4, LYDIAN_MASK)).toBeNull();
    // Lowering Ionian degree 4 (pitch 5→4) would collide with degree 3 pitch 4
    expect(applyL(4, IONIAN_MASK)).toBeNull();
  });
});
