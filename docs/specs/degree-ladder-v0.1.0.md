# Degree-Ladder Voicing Geometry (ADMITTED)

- **Spec ID:** `DEGREE-LADDER-V0.1.0`
- **Status:** ADMITTED at L31 (`L31-GOV-ADMISSION-DIR-1`, 2026-11-14). `admissionEffect: admitted_at_L31`. Authority flows from the L31 entry in `provenance/DECISION_LEDGER.md` and `qa/l31_governance_admission_receipt.json`. This specification governs the degree-ladder observatory and voicing layer; it does not amend `SPEC-FIVEFOLD-CONSTRUCTS-001` or `src/fivefold/quintessence.py`.
- **Layer:** `SPEC-001 §1.3 overlay dynamics + degree-ladder observatory`
- **Origin:** `MVP8.3-DEGREE-LADDER-DIR-1` rev 1, executed in scratch and landed as L30 on 2026-11-12.
- **Guard:** `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`, `gov517_correspondence_claimed: false`, `bipartiteEvidenceStatus: planning_evidence`, `observatoryArtifactClass: observation_only`, `degreeLadderSpecStatus: admitted`, `llmCalls: 0`.

## 1. Purpose

The degree ladder voices a governed node from its own ordered container rather than from imported chord-template names. Every chord is a subset of the active node by construction, so a degree stack cannot fail to exist and cannot emit an out-of-mask pitch. The landed eight-treatment catalog remains available and is deprecated by evidence, not deleted.

## 2. Definitions

Let `C(node) = (c_1, ..., c_7)` be the node's phase-ordered pitch classes, with degrees indexed `1..7` (L1).

For degree `d` in `1..7`, stride `s` in `{1,2,3}`, depth `k` in `{2..5}`, and rotation `m` in `0..k-1`:

```text
S(C,d,s,k) = { c_(((d-1+s*j) mod 7)+1) : j = 0..k-1 }
```

- `s=1` is the cluster family; `s=2` the tertian family; `s=3` the quartal family.
- The rotation anchor is degree `r = ((d-1+s*m) mod 7)+1`; the root pitch class is `c_r`.
- `m=0` is the unrotated stack; `m>0` is a rooted permutation (in-stack inversion).

The **shape** of a stack is the sorted integer vector of `(pc - c_r) mod 12` values. Shapes are reported as integer lists. Tonal names do not enter machine receipts.

The **stack-root bass rule** (L2) sets the degree-arm bass to `base_pitch_class_to_midi(c_r, offset) - 12`, replacing the landed inversion-following container bass.

## 3. Rooted Permutations

Because 7 is prime, non-zero strides generate transitive 7-cycles over the degrees. Rooting at interior members yields familiar sonorities without templates:

- `sus2` on root `r`: `S^(2)(C, r+1, 3, 3)`.
- `sus4` on root `r`: `S^(1)(C, r+4, 3, 3)`.
- `7sus4` on root `r`: `S^(1)(C, r+4, 3, 4)`.
- `6th` / `add6` on root `r`: `S^(1)(C, r+5, 2, 4)`.

The same formulas hold in every modal container; no mode-specific branch is required.

## 4. Expressibility

A landed template `T` on node `n` is:

- **EXACT** if `T` equals some stack set on `n`;
- **ONE-EDIT** if it differs from some stack set by exactly one pitch-class substitution, addition, or deletion;
- **OTHER** otherwise.

Measured under the L30 predeclaration:

- In the tertian space, `full`, `bare`, `triad`, and `seventh` are EXACT on every lifted node; `shell`, `triad_9`, `ninth_drop5`, and `rootless_13th` are ONE-EDIT.
- Under all uniform strides, `ninth_drop5` is EXACT as `S(C,7,1,4)` and `rootless_13th` as `S(C,7,3,4)`.
- In the complete five-orbit menu, all eight templates are EXACT.

## 5. Complete Five-Orbit Menu

The 35 triads and 35 tetrads of a seven-note container partition into five rotational orbits of seven:

| Depth | Orbit | Generator |
|---|---|---|
| 3 | `s1_k3` | `S(C,d,1,3)` |
| 3 | `s2_k3` | `S(C,d,2,3)` |
| 3 | `s3_k3` | `S(C,d,3,3)` |
| 3 | `s2_k4_drop_j2` | `S(C,d,2,4)` minus its interior element at index 2 |
| 3 | `s2_k4_drop_j1` | `S(C,d,2,4)` minus its interior element at index 1 |
| 4 | `s1_k4` | `S(C,d,1,4)` |
| 4 | `s2_k4` | `S(C,d,2,4)` |
| 4 | `s3_k4` | `S(C,d,3,4)` |
| 4 | `s2_k5_drop_j3` | `S(C,d,2,5)` minus its interior element at index 3 |
| 4 | `s2_k5_drop_j1` | `S(C,d,2,5)` minus its interior element at index 1 |

The menu is checked on every node for zero overlap and zero omission. The gapped orbits explain shapes such as the `379@0` target `{8,0,3}`, which is `s2_k4_drop_j2` at degree 1, rotation 2.

## 6. Degree Walk and Session Records

A degree walk advances the generator degree by `+1` per bar. The measured D1/D2 arms lock stride `2`, depth `4`, rotation `0`, and seven bars (L3). Degree-arm session sheets record `(bar, node, office, degree, stride, depth, rotation, root degree, root pitch class, shape, chord pitch classes, bass pitch class, bass MIDI)` and contain no template names.

## 7. Evidence Summary

- Bet A: 0 prediction mismatches and 0 OTHER across all lifted nodes; all-stride promotion exact on every node; delta-gated skips enumerated.
- Bet B: all 7-35 states reproduce the textbook modal triad and seventh tables; rooted `sus2`, `sus4`, and `add6` confirmed.
- Bet C: all four benchmark triad identities exact; the `379@0` target classified as a five-orbit exact / tertian one-edit.
- M1: the five-orbit partition holds on every node in all three scopes; the native shape census is recorded in `mvp8_3_shape_census.json`.
- Bet D: six paired sessions, identical lead layers, zero out-of-mask notes, score-true MIDI; the signed human ear gate adopts the degree path.

## 8. Posture

This spec is observation-language only. It makes no causal or physical-quantity claim, formulates no `C_H`, and does not admit the degree ladder into `SPEC-001` runtime. At L31 the specification itself is admitted as the canonical container-native degree voicing standard for the governed-loop observatory; `harmonic.C_H` remains null and the photonic fence stands.

## 9. Phase-Agnostic Chaldean Degree Address Corollary (Admitted at L31)

The ontology's seven fixed Chaldean degree addresses (`1=Saturn`, `2=Jupiter`, `3=Mars`, `4=Sun`, `5=Venus`, `6=Mercury`, `7=Moon`; `docs/INTRA_NODE_DYNAMICS.md` Chaldean degree weights, `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md` §5, `framework/AGENTS.md` Orthogonal Matrix) coincide identically with the degree ladder's positional container indices `1..7` in `C(node) = (c_1, ..., c_7)`.

- **Phase-Agnosticism Rule.** Chaldean degree addresses are strictly phase-relative positional addresses (`1..7`, anchored at `c_1 = phase`). Regardless of modal phase transposition (`phase = 0..11`), container index `d` carries the identical Chaldean degree address.
- **Label and weight fence.** Positional address coincidence does not import Chaldean render-gravity weights (`116/407`, etc.) as harmonic tension metrics, and machine receipts continue to record integer degrees `1..7` and integer interval shapes without tonal quality names.
- **Boundary.** The correspondence is positional; it is not a claim about modal rotation remapping (which never remaps the Chaldean weight map) and creates no runtime effect.
