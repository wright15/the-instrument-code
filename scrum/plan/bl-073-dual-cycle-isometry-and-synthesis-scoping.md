# BL-073 — The dual seven-cycle isometry probe and the boundary object's scoping: the first structural probe and the object's definition

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. The probe is **measurement**; the scoping is **definition**; neither is a claim event, neither amends records, neither touches the GOVERNS relation's formal status. D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim, `provenance/DECISION_LEDGER.md:2703-2712`). No GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl073-isometry-probe.v1.json` — status `planning_evidence` (raw-byte SHA-256 `2dca3e8b95eb3012136dd6e849b12b33b833ce0ef86d1580b376e6a06e3ce260`; `investigationFingerprint` `811fa786f3a03b03b0c334fe797c85b9b4aeed93332a183be43f86fa1133a65c`). Generator `scripts/build-bl073-isometry-probe.mjs` (raw-byte SHA-256 `b0fd0b16fbe6596ce3f8064e025491d4bbeb0cc85578dd6a21b022676a95c34e`); independent validator `orrery/scripts/validate-bl073-isometry-probe.mjs` (raw-byte SHA-256 `1c5011944bad4cf3d62ae9aa0cb839f8ea8fc5827dbf4da931afcb70066417f3`; 44 mutation probes — 34 artifact-drift + 5 smuggled-read + 5 presence-strip — each rejected; two-sided census-core static check); pins `orrery/src/bl073-isometry-probe.test.ts` (raw-byte SHA-256 `e62de73ae0644d7f11e44491580de1cf8b08ea727e07c8d73381e11fc877f49d`; 11 tests). Wired `orrery:bl073-isometry-probe:check` (after `bl071-interval-6-structure:check`, before `derived-path-graph:check`); full `orrery:check` exit 0 (`tsc --noEmit` clean).

**Chain anchors (self-checked by fingerprint):** BL-071 `8b2a1f6c…`; BL-070 `9db10a08…`. The Gate 3 receipt (`qa/d4-r2-execution-receipt.json`) is bound by raw sha256 and re-read per edge.

**Rulings executed (OD-73-1…OD-73-6, approved 2026-10-11).** All four P1–P4 required for FULL (OD-73-1); primary dihedral (14) + secondary symmetric (5040) reported separately (OD-73-2); every passing witness recorded with parity (OD-73-3); probe JSON + scoping memo in one pass (OD-73-4); masks-only over the listed witnesses, no new universe enumeration (OD-73-5); candidates stated with falsification shapes, none endorsed (OD-73-6). Build notes executed: **R1** (the interval-vocabulary mapping — both cycles' directed rotation intervals computed by the identical function along the landed orders; the R₂ cycle-twin T₁/T₂ vocabulary cited as context only, never a P2 input); **N1** (P2-structural sharpened to the two-interval parallel); **N2** (witness parity semantics recorded per witness).

## 1. The probe (measurement, read-only)

### 1.1 The cycles and their derivation

| Cycle | Derived order (masks-only) | Directed intervals | Closure | pcSum ladder |
|---|---|---|---|---|
| **D₇ modal orbit** (ti-pole) | `127→2111→3103→3599→3847→3971→4033` | `^11 ×6 + ^6 ×1` | `4033→127`, Hamming-10 | 21→51, step +5 |
| **A₀ P₇ ring** (fa-pole; the mode-line's own geometry) | `1387→1451→1453→1709→1717→2741→2773` | `^7 ×6 + ^6 ×1` | `2773→1387`, Hamming-10 | 33→39, step +1 |

Both cycles are **derived masks-only** from the tier/role partition and masks (D₇: the `^11` path within the D₇ anchor set from its unique start, closed by the unique `^6` return; A₀: the Hamming-2 path from the lower-pcSum endpoint, closed by the `^6` return) and then cross-checked key-for-key against the landed bytes: the recorded modal order (network `d7ModalRows`), BL-070's `orbitalRotation.perEdge` (`exactRotationCount 7`; histogram `{11:6, 6:1}`), the Gate 3 per-edge intervals, and BL-071's A₀-P₇ universe (member set; closure witness `1387:2773`). Both closures are exact `^6` rotations at Hamming 10 — the landed dual-closure finding re-verified.

### 1.2 The four pre-registered properties — results

| # | Property | D₇ | A₀ | Verdict |
|---|---|---|---|---|
| **P1** | adjacency / distance distribution | 21-pair Hamming histogram `{2:6, 4:5, 6:4, 8:3, 10:3}` | identical | **PASS** (φ-invariant multiset) |
| **P2** | interval signature (primary strict) | directed `{11:6, 6:1}` | directed `{7:6, 6:1}` | **FAIL** (0/14 dihedral; 0/5040 symmetric) |
| **P3** | Hamming-distance matrix | matrix isomorphic | — | **PASS** (exactly 2 witnesses, both dihedral) |
| **P4** | tritone marking (per-node IC6) | `[1,1,1,1,1,1,1]` | `[1,1,1,1,1,1,1]` | **PASS** (φ-invariant uniform marking) |

**P2's primary strict test** compared like with like: the same `rotateMask12` computation along both landed orders. The path edges run at `^11` (D₇) versus `^7` (A₀); the closures coincide at `^6`. No bijection preserves the directed interval multiset under either search space.

**P3's witnesses** — the complete isomorphism set, both dihedral: `φ-1 = r0` (identity alignment; parity even, 0 inversions) and `φ-2 = refl6` (reversal; parity odd, 21 inversions). Each distance matrix has automorphism group `{identity, reversal}` (order 2), so the isomorphism set is exactly the identity witness and its composition with the reversal. **N2's fork, recorded:** the rotation witness (r0) reads as *identical re-indexed*; the reflection witness (refl6) reads as *chiral mirror*. Both readings exist simultaneously at the distance layer; neither is preferred by the record. **P4's full-vector observation:** the full interval vectors differ between the classes (D₇ all `<654321>`, A₀ all `<254361>`); the pre-registered P4 tests the tritone marking (which agrees); the full-vector contrast is recorded context, not a verdict input.

### 1.3 The P2-structural parallel (N1; non-verdict-bearing)

> **Both cycles are two-interval-structured:** six uniform path edges at one rotation interval plus one distinguished closure edge at rotation 6; both closures are Hamming-10 whole-set rotations; both path-edge sets are Hamming-2. The path intervals differ (`11` vs `7`), and the pcSum ladders ascend at different steps (`+5` vs `+1`). The two-interval *shape* is shared; the interval *values* are not.

### 1.4 The phase-relation secondary and the branch

The phase-relation secondary (from the BL-073 capture's "isometry / phase-relation / coincidence?" alternatives): under **both** witnesses the D₇ closure pair `{4033,127}` maps setwise onto the A₀ closure pair `{2773,1387}` — both closure relations are self-inverse `^6` rotations — and the A₀ closure pair is the lifted-congruence endpoint pair of BL-071 (`lifted(2773@(p+6)) = T_6(lifted(1387@p))`, root-coherent across all 126 rotation-6 pairs; cited, no new computation). Neither witness is rotation-induced (no mapped node pair is an exact rotation relation). Recorded as secondary; non-verdict-bearing.

> **Branch verdict: `PARTIAL_ISOMETRY`.** Passing subset `{P1, P3, P4}`; failing `{P2}`. The two seven-cycles share their adjacency/distance structure, their distance-matrix structure, and their tritone marking; they do **not** share their rotation-interval signature. Per the pre-registered branch table the differing property (P2) is the boundary layer's interval-signature asymmetry.

**The binding gate (gated, named for the record).** The result — whatever it is — is *measured structure*. What it means for the GOVERNS relation (whether the isometry binds A₀ to D₇, whether GOVERNS is derivable from it, whether office structure follows) is a semantic claim, gated separately on its own evidence, not this artifact's content. No mechanism claim; no GOVERNS admission; no record amendment.

## 2. The scoping — the boundary object's definition

### 2.1 The four properties as the object's definition

The boundary layer is simultaneously **polarized** (GSL-1R: Z-interface polarization, 14/0/0/14, gap 4 — `d4-zresidual-hunt.v1.json`, `e1b3f655…`), **asymmetric** (GSL-3: different predicates over different domain multiplicities — class-selective office-flat at fa, class-exhaustive office-pure at ti; `bl068-d7-asymmetry.v1.json`, `b0d65bd6…`), **invariant** (inversion-invariance whole-pair selection across all 14 pairs; office-linking sums 6 mod 7 — pole-universal; same BL-068 + BL-070 blocks), and **tritone-structured** (GSL-4: three measures — M-DISP substitution, M-ROT rotation, M-IC6 content — distributed by structural role, relational–relational–internal; `bl071-interval-6-structure.v1.json`, `8b2a1f6c…`; BL-074 anatomy). *The scoping's question: what mathematical object has these four properties?* The properties are stated as the object's defining characteristics; none is merged with another; every one cites its landed artifact.

### 2.2 Candidate object types (stated with falsification shapes; none endorsed)

| # | Candidate | What it would imply | Evidence that would distinguish it |
|---|---|---|---|
| C1 | **Manifold** | local charts (contact domains) with transition maps (cycle closures) | whether GSL-3's predicate-axis difference is chart-dependence; a predicate transporting cleanly across pole charts under one transition map favors it |
| C2 | **Fiber bundle** | base = anchor/cycle geometry; fibers = selection layer (satellites) | the probe's base/fiber dissociation: distance geometry shared (P1/P3) while the interval parameter diverges (P2); whether the interval parameter varies continuously across the switchboard |
| C3 | **Graded algebra** | layers (contact / anchor / composition per BL-074's trichotomy); the three measures' disagreement is grading | the D2 dual-phenomenon trio (rot-6 ∧ disp-6 overlap) as a graded-intersection rather than an exclusion artifact |
| C4 | **Category** | objects (states) + morphisms (M, rotation, containment); isometry = isomorphism in the morphism class | whether any φ respects morphism composition; the probe's witnesses are explicitly *not* rotation-induced — evidence weighing on which morphism class is native |
| C5 | **New structure** | the four properties jointly name something the existing vocabulary does not | a shape (e.g., the two-interval structure with a distinguished `^6` closure) that C1–C4 fail to account for |
| C6 | **Unity (reductionist)** | the four properties are *one mechanism at four scales*: polarization the selection mechanism, asymmetry its consequence across domain multiplicities, invariants its symmetries, tritone-structuring its geometry | the isometry probe: FULL isometry would gain it; PARTIAL/NONE would push toward independent structures |

### 2.3 The isometry as the object's first structural probe

The two seven-cycles' isometry is the object's **first structural test** — the smallest instance of the question "does the boundary layer have unified internal structure?" The probe's result feeds the definition: **PARTIAL_ISOMETRY** (P1/P3/P4 shared; P2 divergent) means the object's definition must carry **both** the shared substrate (distance geometry, tritone marking, the two-interval shape with the `^6` closure) **and** the interval-signature asymmetry (`^11` vs `^7` path intervals). The branches were pre-registered as three findings, none preferred: FULL would have read as existence-in-miniature; PARTIAL is the measured reading; NONE did not fire.

### 2.4 The scaling statement (stated, not pursued)

If the two seven-cycles are (partially) isometric, does the structure generalize — to the 70-bridge switchboard? To the 330↔462 universes? **Stated, not pursued.** The measured partial result sharpens the scaling question: does the *two-interval structure* (six uniform path edges at one interval + one distinguished `^6` closure, Hamming-10) recur across other seven-structures — the seven D-tier anchor families (each carrying at least one rot-6 pair, BL-071 §3; the BL-074 rot-6 census lists one to three per tier), the A₁ seam structures, the switchboard's seven-structures? The dependency chain is named: any scaling probe presupposes this probe's measured shape; no computation occurs here.

### 2.5 The membrane boundary

The object's definition is **structural** (mathematical properties, all measured). What the object *means* for the framework's semantics — the GOVERNS relation, the office structure, the phenomena layer — is interpretation vocabulary, gated separately, per the membrane (§§2.6/2.7: interpretation vocabulary only, never a probe input; the lens colors, the measurements ground; removing every reading leaves every finding intact).

## 3. The unity hypothesis's status (C6)

The pre-registered constraint rule: FULL isometry would gain the unity hypothesis; PARTIAL would push toward independent structures. **Measured shape: PARTIAL with a P2-only failure** (three of four properties shared, the failure exactly at the interval-signature layer). The honest status: **CONSTRAINED** — the strong form ("one mechanism at four scales") is disfavored at the interval layer, while the weak form (shared substrate, interval-parameterized) survives: the distance/marking layers remain shared under two witnesses, and the closure interval coincides (`^6`), but the path-interval parameter is a genuine difference the object must carry. Neither "supported" nor "independent" is the honest word for a 3-of-4 outcome; the constraint is recorded with its exact shape.

## 4. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl073-isometry-probe:check` | PASS (generator `--check` fresh; validator PASS; 44 mutation probes rejected; 10 static rejections) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | suite green; 11 new BL-073 pins |
| `validate:ledger-pins` | unchanged at the BL-058 13-violation inventory; zero added |
| Static isolation | census-core region: forbidden label/record tokens absent (region + head); required masks-only tokens present; 5 smuggled-read + 5 presence-strip probes rejected |
| Manifest | regen; `validate:manifest` PASS |

## 5. Bounded non-accomplishments

No claim event; no record amendment (D4's `derivable-via-R2` and D7's hypothesis-tier unchanged; ENTRY 10/15/16 byte-untouched). No GOVERNS admission; the binding interpretation of the isometry is separately gated. No mechanism claim. No G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; no ledger writes. No lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence. The scoping defines; the probe measures; neither claims nor admits.

## 6. Result in one paragraph

The boundary layer's two seven-cycles now have their measured geometry. Both derive masks-only (D₇: the `^11` path + `^6` return; A₀: the Hamming-2 path + `^6` closure) and cross-check key-for-key against the landed records. The pre-registered probe returns **PARTIAL_ISOMETRY**: P1 (identical 21-pair Hamming histograms), P3 (distance matrices isomorphic under exactly two witnesses, both dihedral — `r0` and `refl6`), and P4 (uniform tritone marking) pass; P2-strict (the directed interval signature `{11:6, 6:1}` vs `{7:6, 6:1}`) fails under every bijection in both search spaces. The two-interval structural parallel is shared (six uniform path edges + a distinguished `^6` Hamming-10 closure); the phase-relation secondary maps the closure pair onto the closure pair under both witnesses; the GOVERNS binding stays gated. The scoping defines the boundary object from its four landed properties, states six candidate object types (C1–C6) with falsification shapes and endorses none, registers the isometry as the object's first structural probe, and records the unity hypothesis as **CONSTRAINED** (strong form disfavored at the interval layer; shared substrate at the distance/marking layers). Measurement, definition, no claim — and the corridor's next conversation starts from a defined, probed object.

## 7. Post-landing register (maintainer disposition 2026-10-11)

The disposition **ratifies the landed reading** — no artifact bytes change (`investigationFingerprint` `811fa786…` unchanged; no re-pin, no validator change, no pins change), no record amendment, no claim event, no GOVERNS admission. The build-time statuses above stand as landed history; the register below is the later ruling they anticipated.

- **The tri-reading (recorded as the §2.3 linkage's and §3's interpretation layer).** The P2-only failure has three readings, none load-bearing, all planning evidence: **Reading 1 — the coordinate-system reading (leading, per the disposition):** the shared P1/P3/P4 is the cycles' internal structure (distance geometry, mark); the P2 failure is the rotational addressing (`^11` vs `^7`; the phase-relative intervals differ by 4); under this reading the boundary object is **one structure with two coordinate systems** — the same seven-cycle geometry, addressed differently. **Reading 2 — independence:** the shared layers are deep rhyme without identity; the P2 divergence is the proof of distinct objects. **Reading 3 — unity-constrained:** the C6 unity holds at the distance/marking/geometry layers but not at the rotation-addressing layer. **Testability (the disposition's recommendation):** Reading 1 is testable — if the cycles are one object in two coordinate systems, a coordinate transformation mapping the D₇ addressing (`^11`) to the A₀ addressing (`^7`) should exist and be derivable; its existence confirms Reading 1, its failure supports Reading 2. The test is captured as **BL-075** (`scrum/BACKLOG.md`); no computation occurs here.
- **The orientation bit's unification — one bit, three registrations (disposition finding, recorded).** The two distance-layer witnesses differ by exactly the cycles' reversal automorphism (`φ-2 = φ-1 ∘ reversal`; automorphism group `{identity, reversal}`, order 2). The disposition records the identification: the isometry's reflection witness (`φ-2`), the office-reconstruction's `κ₀` reflection orientation (BL-063: the reflection-fixed centre), and the carried orientation bit's brightness premise (BL-065 / the BL-059 memo's bit inventory) are **the same reversal — the P₇ line's reversal at three scales**. The bit inventory updates to: **one bit, three registrations** (brightness premise / `κ₀` / `φ-2`); the bit's content and formal status are otherwise unchanged. Accreted into the scoping memo (`scrum/plan/bl-059-governs-derivability-scoping-memo.md` §4.10) under its mutation contract. No corridor movement; BL-063/BL-065 remain as landed.
- **C6 confirmation.** The scoping's unity-hypothesis status (`CONSTRAINED`: 3-of-4 scales shared; the rotation-addressing layer independent) stands as landed; the tri-reading is its interpretation layer, recorded here.

**Bounded statement (unchanged by the disposition):** no claim event; no record amendment (ENTRY 10/15/16 byte-untouched); no GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; the binding interpretation of the isometry remains separately gated; session prose is context, not evidence.

## 8. Post-landing register (BL-075 coordinate search result, 2026-10-12)

The BL-075 search is landed (`orrery/src/generated/bl075-coordinate-search.v1.json`, fingerprint `88838e22…`; memo `scrum/plan/bl-075-coordinate-search-memo.md`): the **`CHIRAL_PAIR`** result — `T1 = x→5x` carries the D₇ addressing onto the A₀ addressing edge-for-edge; `T2 = x→7x = ρ∘T1` carries it onto the reversal. The **C6 entry's accretion** (the maintainer's 2026-10-12 addition, recorded here as planning vocabulary):

- **Canonicity.** The affine transformation is uniquely determined (`u = 5`, the only unit satisfying `11u ≡ 7 (mod 12)`); the coordinate systems are **canonically related, not conventionally related** — the strongest form of the coordinate-system reading: not "there exists a transformation" but "the transformation is uniquely determined by the interval-transport requirement."
- **The Klein-4 context.** The transformation lives in Aff(Z₁₂)'s unit subgroup `{1,5,7,11} ≅ Klein-4` — the coordinate ambiguity's complete algebra (all involutions, commutative). *Build-time grounding correction (maintainer-prose class):* the ruling's phrasing "the two non-trivial elements T1/T2 are the two setwise maps" is recorded in corrected form — Klein-4 has three non-trivial elements; **T1 and T2 are the two setwise carriers**, and the third (`ρ = ×11`) is their composition (`T1∘T2 = ρ`).

**Reading 1 resolved.** The tri-reading's leading interpretation (§7 above) is confirmed at planning level: the boundary layer's two seven-cycles are one structure in two canonically related coordinate systems. The C6 unity hypothesis gains its first structural confirmation; the semantic consequences remain separately gated (binding gate unchanged). No artifact bytes of this probe changed (`811fa786…` unchanged; no re-pin, no validator change, no pins change); no record amendment; no claim event; no GOVERNS admission.
