# R / L Operator Math — Parallel Modes (12-bit Pitch-Class Masks)

> **Scope:** This document describes exactly how the `R` (Raise) and `L` (Lower) operators mutate a 12-bit pitch-class mask. It replaces the `M` (modal successor) operator used in the original Orrery MVP.
>
> **Sources:**
> - `seven-governors-mutation-algebra-audit/audit/operator-registry.csv` (rows `R2`–`R7`, `L2`–`L7`; `R1`/`L1` root-phase for context)
> - `seven-governors-mutation-algebra-audit/audit/operator-applications.csv` (e.g. `R4:2741:2773`, `L4:2773:2741`, xor masks)
> - `seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json` (invariants — not directly used by R/L but defines the A0–A2 scope)
> - `canonical/harmonic-compression-candidates/CH_A012_q_v1.json` (A0–A2 anchor definitions and `weightedProjection` = C_H scalar)

---

## 1. 12-bit pitch-class masks

A **rooted** heptatonic scale is a weight-7 subset of **Z₁₂** containing pitch class `0`. Its mask is the integer `stateId` whose binary expansion has bit *p* = 1 iff pitch class *p* is in the set:

```
mask = Σ (1 << pc)   for pc ∈ pitchClasses    ;   0 ≤ mask ≤ 4095
pc = 0 is the root (Saturn, degree 1) — always set for rooted scales
bit 0 = LSB = pitch class 0
```

Example — Ionian (stateId `2741`):

```
pitchClasses = {0, 2, 4, 5, 7, 9, 11}
bits set     =  0, 2, 4, 5, 7, 9, 11

  bit11 bit10 bit9 bit8 bit7 bit6 bit5 bit4 bit3 bit2 bit1 bit0
    1     0    1    0    1    0    1    1    0    1    0    1
  = 101010110101₂ = 2741

Check: 1 + 4 + 16 + 32 + 128 + 512 + 2048 = 2741 ✓
```

Example — Lydian (stateId `2773`):

```
pitchClasses = {0, 2, 4, 6, 7, 9, 11}
bits set     =  0, 2, 4, 6, 7, 9, 11

  bit11 bit10 bit9 bit8 bit7 bit6 bit5 bit4 bit3 bit2 bit1 bit0
    1     0    1    0    1    1    0    1    0    1    0    1
  = 101011010101₂ = 2773

Check: 1 + 4 + 16 + 64 + 128 + 512 + 2048 = 2773 ✓
```

Forte family `7-35` (the diatonic family) contains all modal rotations of these masks; Hamming distance between successive `M` modes is 4, between parallel `R`/`L` neighbours is 2.

---

## 2. Ordered degrees and governor seats

Degrees are the **sorted** pitch classes (ascending, rooted at 0), indexed from 1:

| Degree | Governor  | Role in a rooted genus-7 scale |
|-------:|-----------|--------------------------------|
| 1      | Saturn    | Root — always pitch class 0    |
| 2      | Jupiter   | 2nd scale tone                 |
| 3      | Mars      | 3rd scale tone                 |
| 4      | Sun       | 4th scale tone                 |
| 5      | Venus     | 5th scale tone                 |
| 6      | Mercury   | 6th scale tone                 |
| 7      | Moon      | 7th scale tone                 |

Mapping from `CH_A012_q_v1.json` → `method.governorDegreeMap` and from `operator-registry.csv` column `degree_governor`. The registry confirms:

- `R2`/`L2` — degree 2, Jupiter
- `R3`/`L3` — degree 3, Mars
- `R4`/`L4` — degree 4, **Sun**
- `R5`/`L5` — degree 5, Venus
- `R6`/`L6` — degree 6, Mercury
- `R7`/`L7` — degree 7, **Moon**

Concrete ordered pitches for the two scales of interest:

```
Ionian [0, 2, 4, 5, 7, 9, 11]  →  d1=0 d2=2 d3=4 d4=5 d5=7 d6=9 d7=11
Lydian [0, 2, 4, 6, 7, 9, 11]  →  d1=0 d2=2 d3=4 d4=6 d5=7 d6=9 d7=11
                                         ^^^               ^^^
                                         Sun               Moon
```

---

## 3. R / L operator definition

### R₍d₎ (Raise) — `fixed_degree_shift`, Δ = +1

> *Registry domain rule:* “Defined when Degree *d* can move up one semitone **without collision or crossing the rooted boundary**.”

```
let pcs = sorted pitchClasses from mask          // pcs[0] == 0
let oldPc = pcs[d-1]                             // 0-indexed
let newPc = oldPc + 1

pre-conditions (all must hold):
  1. 0 ≤ newPc ≤ 11                            // not outside Z₁₂
  2. (mask & (1 << newPc)) == 0               // no collision
  3. d == 7  →  newPc > pcs[5]                // only lower bound
     d <  7  →  pcs[d-2] < newPc < pcs[d]     // (when d>1) strictly between neighbours
  // (for d==1 the rule is special — root-phase R1/L1, not used in the parallel-mode catalog)

result:
  xorMask = (1 << oldPc) | (1 << newPc)       // two bits differ
  newMask = mask XOR xorMask
  raw Hamming distance = 2 ; rooted Hamming = 2
```

`L₍d₎` (Lower) is the exact inverse with `newPc = oldPc - 1` and the same neighbour checks (`-1` direction).  
Consequently `R₍d₎` and `L₍d₎` are mutual inverses:

```
L₍d₎( R₍d₎(mask) ) = mask     and     R₍d₎( L₍d₎(mask) ) = mask
xorMask is identical for the forward and reverse edge
```

Audit CSV columns encode this: `operator_id = R4`, `degree = 4`, `direction = raise`, `xor_mask_decimal = 96` for the Ionian↔Lydian edge.

**Contrast with `M`:** `M` (modal successor, `modal_re_rooting`) keeps the *same 12-bit set* and rotates the tonic — it re-roots to the next ascending pitch class (`M^6 = M⁻¹`). `R`/`L` keep the *same root* and alter one interior pitch — they create parallel modes.

### Root-phase operators `R1`/`L1`

For completeness, `R1`/`L1` (`root_phase`, Saturn, degree 1) move the tonic seam itself: `R1` replaces pitch class `0` with `1`, then renormalizes by `-1`. They are **not** `fixed_degree_shift` and are excluded from the A0–A2 parallel-mode catalog in this pivot (they change tier membership).

---

## 4. Worked example — R₄ (Sun Raise) Ionian → Lydian

**Goal:** Apply **R₄** (Sun degree, raise by 1 semitone) to Ionian.

### Step 0 — Source facts (from `CH_A012_q_v1.json` and mask encoding)

```
source name   = Ionian
sourceId      = 2741  (mask 101010110101₂)
pitchClasses  = {0, 2, 4, 5, 7, 9, 11}
forte         = 7-35, tier A0, governor Moon (degree 7), C_H = 217/407
ordered       = [0, 2, 4, 5, 7, 9, 11]
                d1 d2 d3 d4 d5 d6 d7
degree 4      = 5  (Sun)
```

### Step 1 — Identify degree 4 pitch

```
oldPc = pcs[3] = 5
```

### Step 2 — Compute target pitch

```
newPc = oldPc + 1 = 6
```

### Step 3 — Check domain rule

```
collision?    bit 6 in 2741?  No (mask has 0 at bit 6) → pass
neighbour?    prev = pcs[2] = 4, next = pcs[4] = 7  →  4 < 6 < 7 → pass
boundary?     0 ≤ 6 ≤ 11 → pass
⇒ R₄ is DEFINED for Ionian ✓
```

### Step 4 — Build XOR mask

```
xorMask = (1 << 5) | (1 << 6) = 32 | 64 = 96
binary  = 000001100000₂
decimal = 96  ← matches audit CSV row R4:2741:2773 column xor_mask_decimal
```

### Step 5 — Apply XOR

```
newMask = 2741 XOR 96

  2741 = 101010110101₂
     ^    000001100000₂  (96)
  ─────────────────────
  2773 = 101011010101₂

decimal 2773, pitchClasses {0, 2, 4, 6, 7, 9, 11}
```

### Step 6 — Identify result

```
mask 2773 = Lydian
  {0,2,4,6,7,9,11}, forte 7-35, tier A0, governor Sun (degree 4), C_H = 193/407
```

**Validated edge:** `R4:2741:2773` in `operator-applications.csv` — `rooted_output_hamming = 2`, `raw_exchange_hamming = 2`, `application_status = formal_substrate_observed`.

---

## 5. Reverse — L₄ (Sun Lower) Lydian → Ionian

This is the exact inverse; `L4 = R4⁻¹`.

```
source        = Lydian, stateId 2773, mask 101011010101₂, {0,2,4,6,7,9,11}
ordered       = [0, 2, 4, 6, 7, 9, 11]
degree 4      = 6
newPc         = 6 - 1 = 5
checks        = collision? bit 5 free → pass; 4 < 5 < 7 → pass
xorMask       = (1<<6)|(1<<5) = 96   (identical)
newMask       = 2773 XOR 96 = 2741 = Ionian
```

CSV row `L4:2773:2741` — same `xor_mask_decimal = 96`.

Round-trip:

```
L₄(R₄(2741)) = 2741   and   R₄(L₄(2773)) = 2773
```

---

## 6. Why the prompt's “R₇ Ionian → Lydian” is not the correct example

The task prompt illustrates with “R7 (Moon Degree Raise) applied to Ionian (101010110101)”. `R7` raises degree 7 (Moon), whose pitch in Ionian is `11`:

```
R7 attempt on Ionian:  oldPc = 11, newPc = 12
  → newPc = 12 is outside Z₁₂ (0..11)
  → modulo-12 wrap would be 0, but pitch class 0 is always present (collision)
  → neighbour/boundary violation

Result: R7 is UNDEFINED for Ionian (and for Lydian — both have pitch 11 at degree 7).
Domain check fails, so no XOR mask exists and no row R7:2741:* appears in the audit.
```

`R7` *is* valid elsewhere — e.g. `R7:1717:2741` (Mixolydian `{0,2,4,5,7,9,10}` → Ionian `{0,2,4,5,7,9,11}`, `newPc = 10→11`, xor = `1024|2048 = 3072`). The parallel-mode edge between Ionian and Lydian is `R4`/`L4` (Sun), not `R7`/`L7` (Moon). This document and the TDD tests in `orrery/src/moves.math.test.ts` therefore use **R4/L4**.

---

## 7. XOR mask quick-reference (Ionian/Lydian neighbourhood)

| Edge | Source → Target | Old→New | XOR decimal | XOR binary (12-bit) | Hamming |
|------|-----------------|---------|-------------|---------------------|---------|
| R4   | Ionian 2741 → Lydian 2773 | 5→6 | 96 | `000001100000` | 2 |
| L4   | Lydian 2773 → Ionian 2741 | 6→5 | 96 | `000001100000` | 2 |
| R7   | Mixolydian 1717 → Ionian 2741 | 10→11 | 3072 | `110000000000` | 2 |
| L7   | Dorian 1709 → Mixolydian 1717 | 10→9 | — | — | 2 |

All `fixed_degree_shift` edges in the audit have `raw_exchange_hamming = 2`, `rooted_output_hamming = 2`.

---

## 8. C_H scalar (harmonic compression coordinate)

From `CH_A012_q_v1.json` `records[].weightedProjection` — `q_v1` rooted triad, denominator 407:

```
Ionian  (2741):  C_H = 217 / 407    (governor Moon, degree 7)
Lydian  (2773):  C_H = 193 / 407    (governor Sun,  degree 4)
```

The `CH_A012_q_v1` invariants also record `a0Order = [Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian]` sorted by ascending C_H within tier `A0`.

A post-move assertion must recover the *target node's* scalar, e.g.:

```
applyR(4, 2741) = 2773  ⇒  CH(2773) must be 193/407
applyL(4, 2773) = 2741  ⇒  CH(2741) must be 217/407
```

---

## 9. A0–A2 anchor scope (21 nodes) — for the legal-move catalog

All 21 `CH_A012_q_v1` anchors are weight-7, rooted, `forte ∈ {7-35, 7-34, 7-33}`:

| Tier | Forte | stateId | Name | Pitch classes |
|------|-------|---------|------|---------------|
| A0 | 7-35 | 1387 | Locrian | {0,1,3,5,6,8,10} |
| A0 | 7-35 | 1451 | Phrygian | {0,1,3,5,7,8,10} |
| A0 | 7-35 | 1453 | Aeolian | {0,2,3,5,7,8,10} |
| A0 | 7-35 | 1709 | Dorian | {0,2,3,5,7,9,10} |
| A0 | 7-35 | 1717 | Mixolydian | {0,2,4,5,7,9,10} |
| A0 | 7-35 | 2741 | Ionian | {0,2,4,5,7,9,11} |
| A0 | 7-35 | 2773 | Lydian | {0,2,4,6,7,9,11} |
| A1 | 7-34 | 1371 | Superlocrian | {0,1,3,4,6,8,10} |
| A1 | 7-34 | 1389 | Half-Diminished | {0,2,3,5,6,8,10} |
| A1 | 7-34 | 1461 | Mixolydian ♭6 | {0,2,4,5,7,8,10} |
| A1 | 7-34 | 1707 | Dorian ♭2 | {0,1,3,5,7,9,10} |
| A1 | 7-34 | 1749 | Acoustic | {0,2,4,6,7,9,10} |
| A1 | 7-34 | 2733 | Melodic Minor | {0,2,3,5,7,9,11} |
| A1 | 7-34 | 2901 | Lydian Augmented | {0,2,4,6,8,9,11} |
| A2 | 7-33 | 1367 | Leading Whole-Tone Inverse | {0,1,2,4,6,8,10} |
| A2 | 7-33 | 1373 | Storian | {0,2,3,4,6,8,10} |
| A2 | 7-33 | 1397 | Major Locrian | {0,2,4,5,6,8,10} |
| A2 | 7-33 | 1493 | Lydian Minor | {0,2,4,6,7,8,10} |
| A2 | 7-33 | 1877 | Aeroptian | {0,2,4,6,8,9,10} |
| A2 | 7-33 | 2731 | Neapolitan Major | {0,1,3,5,7,9,11} |
| A2 | 7-33 | 3413 | Leading Whole-Tone | {0,2,4,6,8,10,11} |

The pivot catalog (`scripts/build-orrery-legal-move-catalog.mjs`) therefore sources moves from `operator-applications.csv` where `operator_id ∈ {R2..R7, L2..L7}` **and** both `source_id` and `target_id` are in this set — parallel edges that keep the root fixed.

---

## 10. Algorithm (reference implementation)

```typescript
function pitchClasses(mask: number): number[] {
  const pcs: number[] = [];
  for (let pc = 0; pc < 12; pc++) if (mask & (1 << pc)) pcs.push(pc);
  return pcs;
}

function applyFixedDegreeShift(mask: number, degree: number, delta: 1 | -1): number | null {
  if ((mask & 1) === 0) return null;               // not rooted
  const pcs = pitchClasses(mask);
  if (pcs.length !== 7) return null;
  if (degree < 2 || degree > 7) return null;       // 1 is root-phase, not fixed
  const oldPc = pcs[degree - 1];
  const newPc = oldPc + delta;
  if (newPc < 0 || newPc > 11) return null;        // rooted boundary
  if (mask & (1 << newPc)) return null;            // collision
  const prev = degree > 1 ? pcs[degree - 2] : -1;
  const next = degree < 7 ? pcs[degree] : 12;
  if (newPc <= prev || newPc >= next) return null; // crossing
  const xor = (1 << oldPc) | (1 << newPc);
  return mask ^ xor;                                // two bits flipped
}

const R = (d: number, m: number) => applyFixedDegreeShift(m, d, +1);
const L = (d: number, m: number) => applyFixedDegreeShift(m, d, -1);

// Assertions:
R(4, 2741) === 2773;   // Ionian → Lydian, xor 96
L(4, 2773) === 2741;   // Lydian  → Ionian, xor 96
R(7, 2741) === null;   // undefined — collision at root
```

---

## 11. Verification

```bash
# audit evidence for the worked edge:
grep "R4:2741:2773" seven-governors-mutation-algebra-audit/audit/operator-applications.csv
# R4:2741:2773,R4,fixed_degree_shift,4,Sun,raise,2741,Ionian,...,2773,Lydian,...,96,...

# TDD tests:
npm --prefix orrery test -- moves.math.test.ts
```
