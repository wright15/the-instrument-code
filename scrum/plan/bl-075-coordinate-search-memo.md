# BL-075 — The coordinate transformation search: the affine carrier census and the PARTIAL_ISOMETRY's resolution

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. The search is **measurement**; the scoping accretion is **planning vocabulary**; neither is a claim event, neither amends records, neither touches the GOVERNS relation's formal status. D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim, `provenance/DECISION_LEDGER.md:2703-2712`). No GOVERNS admission; no GOVERNS authority change; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl075-coordinate-search.v1.json` — status `planning_evidence` (raw-byte SHA-256 `1cb710d872f3b5564c138c83c9fd589b2655a9133bf7aba8b1455cc28d426914`; `investigationFingerprint` `88838e225276432427f2a7c765d8e1f9105c5c6bd87d4db04ef5e1bb2e93704e`). Generator `scripts/build-bl075-coordinate-search.mjs` (raw-byte SHA-256 `429940710f80f4b2ae23e1272be52a6cc67783033059054584d175e985a5245b`); independent validator `orrery/scripts/validate-bl075-coordinate-search.mjs` (raw-byte SHA-256 `d20e34f301666f9eafa9f0a9b3d5e1e7bc0efce62946c6021ce2a9d08d6883e2`; **61 mutation probes** — 48 artifact-drift + 1 fingerprint + 5 smuggled-read + 7 presence-strip — each rejected; two-sided census-core static check); pins `orrery/src/bl075-coordinate-search.test.ts` (raw-byte SHA-256 `29845b27557af54961334a1859a2bfde9f6bddb1e24d3bf07db8b1c6a8a6967a`; 11 tests). Wired `orrery:bl075-coordinate-search:check` (after `bl073-isometry-probe:check`, before `derived-path-graph:check`); full `orrery:check` exit 0 (`tsc --noEmit` clean); suite 395 green (39 files).

**Chain anchors (self-checked by fingerprint):** BL-073 `811fa786…`; BL-071 `8b2a1f6c…`; BL-070 `9db10a08…`. The Gate 3 receipt (`qa/d4-r2-execution-receipt.json`) is bound by raw sha256 and re-read per edge.

**Rulings executed (OD-CT-1…OD-CT-7, approved 2026-10-12).** Class scope L0 (12, separate) + L1 Aff(48, primary), class P cited not re-searched (OD-CT-1); levels S/D/U with the ladder secondary (OD-CT-2); the four-branch table with CHIRAL_PAIR predicted (OD-CT-3); full probe landing (OD-CT-4); the reflection split into pc-level and index-level sub-tests (OD-CT-5); the brief's candidates (a)/(b) falsified by construction AND mechanically in L0 (OD-CT-6); the C2 fiber-coordinate note recorded without endorsement (OD-CT-7).

## 1. Pre-registration

The planning pass's necessity proof, pre-registered as the primary hypothesis: for an affine map `A(x) = u·x + t`, `A(rot^d(x)) = rot^{u·d}(A(x))` — the transported edge interval is `d·u`. The addressing requirement `11u ≡ 7 (mod 12)` **forces `u = 5` uniquely** among the units `{1,5,7,11}`; every odd unit fixes the closure (`6u ≡ 6`). Pre-registered prediction: **`T1 = (u=5, t=0)` directed carrier, `T2 = (u=7, t=0)` chiral partner, branch `CHIRAL_PAIR`.** The levels: **S** (node-set), **D** (directed-cycle, addressing transported `^11→^7`, closure `^6→^6`), **U** (undirected-cycle). The pure-reindexing class is disposed of by the landed BL-073 P2 census (0/14 dihedral + 0/5040 symmetric) and is cited, never re-searched.

## 2. The search (measurement, read-only)

### 2.1 The cycles (cited; re-derived masks-only and cross-checked key-for-key)

| Cycle | Order | Directed intervals | Closure |
|---|---|---|---|
| **D₇ modal orbit** | `127→2111→3103→3599→3847→3971→4033` | `^11 ×6 + ^6 ×1` | `4033→127`, Hamming-10 |
| **A₀ P₇ ring** | `1387→1451→1453→1709→1717→2741→2773` | `^7 ×6 + ^6 ×1` | `2773→1387`, Hamming-10 |

The derived cycles equal the landed BL-073 cycles element-for-element; the D₇ per-edge intervals match BL-070's `orbitalRotation` and Gate 3's bytes; the A₀ ring matches BL-071's `A0-P7` universe; the recorded cross-checks are all `matchesDerived: true`.

### 2.2 The 48-map Aff(Z₁₂) census

| Class | Size | Setwise (S) | Directed (D) | Reversed (U-only) |
|---|---|---|---|---|
| **L0 rotations** (`u=1`, `t=0..11`) | 12 | **0** | 0 | 0 |
| **L1 affine** (`u∈{1,5,7,11}`, `t=0..11`) | 48 | **2** | **1** | **1** |

**L0: the brief's candidates (a)/(b) are empty — falsified by construction and mechanically.** No whole-set mask rotation carries the D₇ anchor set onto the A₀ anchor set: rotations preserve interval content and the cycles' classes differ (7-1 versus 7-35). The constant-offset candidate (a) and the `rotateMaskZ12^4` composition (b) both live in this class; both fail 0/12.

**L1: exactly two carriers.** No translation offset (`t ≠ 0`) is setwise for any unit (`tCensus`: `{1:[], 5:[0], 7:[0], 11:[]}`).

| Carrier | Map | Level | Image order | Image intervals | Hamming | pcSums |
|---|---|---|---|---|---|---|
| **T1** | `x→5x` | **D** (directed) | `1387→1451→1453→1709→1717→2741→2773` (the A₀ order) | `^7×6 + ^6×1` | `[2×6,10]` | `33→39` (the A₀ ladder) |
| **T2** | `x→7x` | **U** (undirected only) | `2773→2741→1717→1709→1453→1451→1387` (the A₀ reversal) | `^5×6 + ^6×1` | `[2×6,10]` | `39→33` |

T1 maps the D₇ directed cycle onto the A₀ directed cycle edge-for-edge; T2 maps it onto the A₀ reversal (`^7` read backwards is `^5`); the closure `^6` (self-inverse) is preserved by both.

### 2.3 The necessity table (the arithmetic made explicit)

| `u` | `11u mod 12` | `6u mod 12` | carries `^11→^7`? |
|---|---|---|---|
| 1 | 11 | 6 | no |
| **5** | **7** | 6 | **yes (unique)** |
| 7 | 5 | 6 | no (the reverse `^11→^5`) |
| 11 | 1 | 6 | no |

`11u ≡ 7 (mod 12)` has the unique solution `u = 5`; the closure interval is fixed by every unit. The transformation is **canonically determined**, not merely available.

### 2.4 The group structure

The working set `{T1, T2}` is **not composition-closed**: `T1∘T1 = id`, `T2∘T2 = id`, `T1∘T2 = T2∘T1 = ρ` (`ρ = ×11`), none of which carries the D₇→A₀ correspondence. Its composition closure is the **unit subgroup `{M1, M5, M7, M11} ≅ Klein-4`** — order 4, all involutions, commutative, identity present (16/16 products verified inside). The relations: `M5∘M5 = M7∘M7 = M1`; `M5∘M7 = M7∘M5 = M11`; `M11∘M5 = M7`; `M11∘M7 = M5`. The group structure is the coordinate ambiguity's complete algebra.

### 2.5 The reflection constraint (V-CT-2, two sub-tests)

- **pc-level (verified):** `T2 = ρ ∘ T1` and `T1 = ρ ∘ T2`; the carriers' composition is the pc-reflection itself (`T1∘T2 = ρ`). The chiral partner is the reflection composed with the directed carrier.
- **index-level (verified, landed-witness alignment):** `T1`'s image order equals the BL-073 **φ-1** targets (r0, rotation, even, 0 inversions — the forward orientation); `T2`'s image order equals the **φ-2** targets (refl6, reflection, odd, 21 inversions — the chiral mirror). The coordinate carriers' orientations align with the distance witnesses' parities: **directed carrier ↔ rotation/even; reversed carrier ↔ reflection/odd.**

## 3. The branch and the synthesis

> **Branch verdict: `CHIRAL_PAIR`** (with `COORDINATE_MAP_FOUND` fired). The search found the coordinate map — T1, the unique unit satisfying `11u ≡ 7`, carries the D₇ addressing onto the A₀ addressing edge-for-edge — and its chiral partner T2, their relation the pc-reflection composition. **Reading 1 (the coordinate-system reading) is confirmed at planning level:** the two cycles are **one structure in two canonically related coordinate systems** — the same seven-cycle geometry, addressed differently.

**The PARTIAL_ISOMETRY resolution.** The BL-073 probe's P2-only failure is now explained structurally: the two addressings are related by the affine conjugation that transports `^11` to `^7`; the P2 divergence is the coordinate signature, and the shared P1/P3/P4 layers are the structure seen through it. The unity hypothesis (C6) gains its first structural confirmation — the strong form's "interval-addressing layer independent" reading is dissolved: the layer is a coordinate, and the coordinate is derived. The C2 fiber-bundle note is recorded without endorsement (OD-CT-7): T1's existence is consistent with the interval parameter being a fiber coordinate.

**The scoping accretion (recorded into the BL-073 memo §8):**

> *Canonicity:* the affine transformation is uniquely determined (`u = 5`, the only unit satisfying `11u ≡ 7`); the coordinate systems are canonically related, not conventionally related.
>
> *Klein-4 context:* the transformation lives in Aff(Z₁₂)'s unit subgroup `{1,5,7,11} ≅ Klein-4`; its two setwise-carrying non-trivial elements T1/T2 are the two maps between the addressings; the third non-trivial element (`ρ = ×11`) is their composition; all four elements are involutions and the group is commutative. *(Build-time grounding correction, maintainer-prose class: the ruling's phrasing "the two non-trivial elements T1/T2 are the two setwise maps" is corrected here — Klein-4 has three non-trivial elements; T1/T2 are the two setwise carriers and `T1∘T2 = ρ` is the third.)*

**The binding gate.** The result is *measured structure*. What it means for the GOVERNS relation is a semantic claim, gated separately on its own evidence. No mechanism claim; no GOVERNS admission; no record amendment.

## 4. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl075-coordinate-search:check` | PASS (generator `--check` fresh; validator PASS; 61 mutation probes rejected; 12 static rejections) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | suite green (395 tests, 39 files); 11 new BL-075 pins |
| Chain cross-checks | derived cycles = landed BL-073 cycles key-for-key; T1/T2 image orders = φ-1/φ-2 targets; BL-070/Gate-3 per-edge and BL-071 A0-P7 limbs re-verified |
| Static isolation | census-core region: forbidden label/record/witness tokens absent; 15 required masks-only tokens present; 5 smuggled-read + 7 presence-strip probes rejected |
| Manifest | regen; `validate:manifest` PASS |

## 5. Bounded non-accomplishments

No claim event; no record amendment (ENTRY 10/15/16 byte-untouched; BL-063/BL-065/BL-070/BL-071/BL-073 as landed). No GOVERNS admission; no GOVERNS authority change; the binding interpretation stays separately gated. No G1 movement; no INV-5 graduation; no M-walkability promotion. No mechanism claim beyond the recorded arithmetic. No directional-semantics assignment; no lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence. No C2 endorsement. The search resolves the PARTIAL_ISOMETRY's interpretation at planning level; it does not amend records or admit claims.

## 6. Result in one paragraph

The coordinate transformation search is discharged. The 48-map Aff(Z₁₂) census returns exactly two setwise carriers and none elsewhere: **T1 = `x→5x`** carries the D₇ addressing (`^11` path + `^6` closure) onto the A₀ addressing (`^7` path + `^6` closure) edge-for-edge, and **T2 = `x→7x` = `ρ∘T1`** carries the cycle onto the A₀ reversal — a **CHIRAL_PAIR**, exactly as pre-registered. The necessity proof is confirmed by computation: `11u ≡ 7 (mod 12)` selects `u = 5` uniquely, so the coordinate systems are **canonically related**; the carrier set's closure is the **Klein-4** unit subgroup `{1,5,7,11}` — the coordinate ambiguity's algebra; the reflection sub-tests align the carrier pair with the landed witness pair (T1↔φ-1/r0/even; T2↔φ-2/refl6/odd), at both the pc level and the index level. The BL-073 `PARTIAL_ISOMETRY`'s leading interpretation is resolved: **the boundary layer's two seven-cycles are one structure in two canonically related coordinate systems** — the first structural confirmation of the scoping's unity hypothesis, reviewed and separately gated for any semantic consequence.
