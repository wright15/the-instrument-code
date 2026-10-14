# BL-088 — The co-parenting generalization probe: does the BL-087 closure-edge co-parenting × cut characterization of the A1 spanning generalize? — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts of record, no admission of any kind. **No new measurement** — the census and the window recomputation are analysis over landed bytes (the bipartite containment graph, the BL-084 populations and orders, the BL-087 D1 diagnostics) through the BL-084 `windowAnalysis` code path (OD-84-5 same-code-path discipline); the pentatonic-layer reach is masks-only containment arithmetic (p is reached by a iff p ⊆ a iff Hamming-2; the BL-070/BL-086 descriptive-read precedent); any mismatch with a landed artifact was a halt — none occurred (the calibration is EXACT field-for-field). **No mechanism (causal) claim beyond the correspondence verdict.** D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim). No GOVERNS admission; **no new GSL number** (the GSL-8 candidate draft is inline, unapplied, un-promoted); no registration. No G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched). The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl088-co-parenting-probe.v1.json` — status `planning_evidence` (raw-byte SHA-256 `7472ee94…`; `investigationFingerprint` `cc865af8…`). Generator `scripts/build-bl088-co-parenting-probe.mjs` (raw-byte `8663712a…`); independent validator `orrery/scripts/validate-bl088-co-parenting-probe.mjs` (raw-byte `8919a561…`; **48 mutation probes rejected** — artifact-drift + fingerprint-zero + smuggled-read + forte-smuggle + presence-strip + region-scoping-proof-strip, plus the two-sided static region check); pins `orrery/src/bl088-co-parenting-probe.test.ts` (raw-byte `7aa167b2…`; 13 tests). Wired `orrery:bl088-co-parenting-probe:check` (after `bl087-klein-ladder-probe:check`, before `bl080-governs-derivation:check` in both `build` and `check` chains). `orrery:check` exit 0; suite 47 files / 487 tests green; `validate:ledger-pins` PASS (0 violations); `validate:prose-consistency` PASS; `validate:manifest` PASS; manifest/checksums regen (fileCount 1350).

**Chain anchors (self-checked by fingerprint; no literals in the generator):** the bipartite containment graph (sha256 `903eebf0…`); BL-084 `6865b076…`; BL-087 `ad74a7e6…`; BL-073 `811fa786…`; the d-tier operator probe `068f9007…`; the derived-path-graph `4c7abcb1…`.

**Rulings executed (OD-CP-1…OD-CP-4, maintainer-approved 2026-10-14):** **OD-CP-1** census scope — both directions, reported separately (pentatonic-side via `parentsRooted`, heptatonic-side via `subnodes`); the correspondence checks both against the spanning map. **OD-CP-2** spanning population — the BL-084 populations (Scope B: the ten M-cycles × all layers; Scope C: the 476 directed operator cycles × top layers); no new cycle discovery. **OD-CP-3** overlap threshold — ≥2 primary + ≥1/≥3 sensitivity columns; no extra verdict. **OD-CP-4** correspondence verdict — bijection / partial (with direction) / absent; set-equality.

**Grounding corrections carried (maintainer-prose class; recorded in-artifact as GC-1…GC-3).**
- **GC-1:** the brief's parenthetical co-parenting definition (`parentsRooted` overlap) is the pentatonic–heptatonic *containment* relation; the BL-087 characterized instance operates on the heptatonic–heptatonic *Hamming-2 reach* relation. Computed: **1359/1401 share exactly ONE rooted subnode (5-34:6)** — the D1 pair is a reach-co-parented pair, not a containment-co-parented pair. Both relations are censused; the correspondence binds each at its own scope.
- **GC-2:** the brief's "the same join the BL-076 probe used" — BL-076 carries no `parentsRooted` join (0 hits; planning-verified); the join precedent is the bipartite artifact + the BL-021 lookup.
- **GC-3:** "pentatonic-spanning cuts" — no pentatonic cycles exist (G1; no intra-330 edges); the pentatonic-side binding is executed through **pentatonic satellite layers** on the heptatonic cycles (reach = containment), the natural instantiation.

## 1. Grounding receipt (verified at build; fail-loud, no mismatch halted)

| # | Claim (the load-bearing fact) | Verification | Verdict |
|---|---|---|---|
| G-1 | **The containment graph**: 330 pentatonic nodes × 21 `parentsRooted`; 462 heptatonic nodes × 15 `subnodes`; byte-stable `planning_evidence` | `derived/hypergraph/bipartite-inclusion-v1.json` (sha256 `903eebf0…`; recomputed live); arity + universe asserts | **GROUNDED (EXACT)** |
| G-2 | **The window machinery**: `windowAnalysis` imported verbatim from the BL-084 generator (OD-84-5); the BL-084 populations re-derived field-for-field | Scope B: 10 cycles / 57 layer records EXACT; Scope C: 476 rows (identity, order, rotationEdges, topLayers, verdict) EXACT | **GROUNDED (EXACT)** |
| G-3 | **The D1 anchor (V-CP-1)**: 1359/1401 parents `[1371,1389]`, indices `[0,6]`, non-consecutive; the wrap cut (k=6) pair-witnessed by exactly those two; the pair strict + fertile; ρ relocates the spanning to 3669/981 (parents `[2901,1749]`) | `bl087-klein-ladder-probe.v1.json` (fp `ad74a7e6…`) + full recomputation (independent data flow) | **GROUNDED (EXACT)** |
| G-4 | **BL-087 cut diagnostics**: the A0/D7/A1 rotation censuses reproduce the landed `cutSensitivity` (allConsecutive + verdict per shift) | recomputation vs `bl087.diagnostics.cutSensitivity` | **GROUNDED (EXACT)** |
| G-5 | **The containment identities**: pentatonic overlap-6 pairs are exactly the |p1 ∩ p2| = 4 pairs (4620); heptatonic overlap-5 pairs are exactly the Hamming-2 pairs (6930 = 6930, independently counted) | recomputation over the bipartite bytes | **GROUNDED (EXACT)** |
| G-6 | **GC-1**: the D1 containment overlap is exactly 1 (`5-34:6`) | recomputation | **GROUNDED (EXACT)** |
| G-7 | **The D2 dual-phenomenon trio** (471:1479, 2283:2787, 3189:3441): rot-6 ∧ disp-6, all three, both endpoints D2 | masks-only re-verification (context block) | **GROUNDED (EXACT)** |

## 2. The pre-registration (frozen before computation; approved 2026-10-14)

**Operationalizations.** **OP-CP-1** containment census (both directions, ≥2 primary + ≥1/≥3 sensitivity, complete pair map for ≥2). **OP-CP-2** reach co-parenting (two layer states share ≥2 reach parents — the D1 relation generalized). **OP-CP-3** spanning census — cut k = between `order[k]` and `order[(k+1) mod n]`; naive witnesses N(k) = windows containing both adjacent anchors with size < n; **non-cyclic windows witness every cut**; exact witnesses E(k) = N(k) ∪ nonCyclic; spanning(k) = |E(k)| ≥ 1; pair-produced(k) = |E(k)| ≥ 2; **the rotation cross-check asserts E(k) equals the set of windows non-consecutive under the cut's rotation for every cut of every row** (asserted, fail-loud). **OP-CP-4** correspondence (E-A reduction exactness; E-B pair bijection + fertility; E-C heptatonic containment pairs vs reach pairs; E-D pentatonic-side census bound to the pent layers). **OP-CP-5** per-family/per-class stratification.

**Decision rule (frozen).** exact row = spanning > 0 ∧ reductionExact (no non-cyclic and no full-range windows) ∧ no single-witness cuts ∧ every reach co-parented pair fertile. GENERAL: exact rate ≥ 0.90. A1_SPECIFIC: every exact row is the A1×A2 census or a landed image. **BOUNDARY_LAYER_CONDITIONAL: every exact row is a boundary-layer census (a Scope B M-cycle row, or an operator row whose anchor set is contained in the A-tier anchor set) and at least one exact row exists.** Fallback PARTIAL_GENERAL.

## 3. The censuses

### 3.1 The containment co-parenting censuses (both directions; complete maps in-artifact)

| side | universe | arity | pairs | ≥1 | ≥2 (primary) | ≥3 | overlap histogram |
|---|---|---|---|---|---|---|---|
| pentatonic (`parentsRooted`) | 330 | 21 | 54,285 | 25,410 | **4,620** | 4,620 | `{0:28875, 1:20790, 6:4620}` |
| heptatonic (`subnodes`) | 462 | 15 | 106,491 | 41,580 | **6,930** | 6,930 | `{0:64911, 1:34650, 5:6930}` |

**The overlap structure is two-valued:** no pair shares 2–5 parents (pentatonic side) or 2–4 subnodes (heptatonic side); co-parented pairs share **6 parents** (pentatonic; exactly the |p1 ∩ p2| = 4 pairs) or **5 subnodes** (heptatonic; exactly the Hamming-2 pairs). The ≥2 and ≥3 thresholds therefore coincide; the ≥1 column is the sensitivity contrast. **The co-parenting map is complete in-artifact** (all 4,620 + 6,930 pairs with overlap counts, plus per-family and family-pair aggregate tables).

### 3.2 The spanning census (BL-084 populations; every cut classified in-artifact)

| population | rows | spanning rows | reduction-exact | non-cyclic faults | full-range faults |
|---|---|---|---|---|---|
| Scope B, heptatonic layers | 57 | 9 | 4 | 5 | 0 |
| Scope B, pentatonic layers | 10 | 9 | 4 | 5 | 0 |
| Scope C, heptatonic top layers | 488 | 488 | 72 | 406 | 10 |
| Scope C, pentatonic layers | 476 | 476 | 0 | 456 | 20 |

**The boundary layer's exact censuses.** Heptatonic: **D7×D6** (6 spanning cuts, 25 pairs all fertile, 20 strict), **A0×A1** (6 cuts, 6 pairs), **A1×A2** (5 cuts, 5 strict pairs — the D1 census). Pentatonic: **D7** and **A0** (6 cuts each; **60 pairs each, all strict, all fertile** — the strongest pair correspondence measured), **A2** (5 cuts, 10 pairs). Partial: **A0×A0** (6 spanning cuts, 4 pair-produced, the two single-witness cuts `[1,4]`), **pent A1** (5 single-witness cuts, no pairs). Faults (non-cyclic windows): D2×D2 (12), D2×A2 (10), A2×D4 (10), A2×A2 (22 non-cyclic; 20 pairs, 3 fertile), A2×A0 (10); pent D6 (3), D3 (4), D2 (15; 30 pairs all infertile), D4 (5), D1 (5).

**The general topology.** All 488 heptatonic Scope C top-layer rows span (under the exact witnesses); 72 are reduction-exact; 416 carry faults (406 non-cyclic, 10 full-range). All 476 pentatonic Scope C rows carry non-cyclic or full-range windows.

## 4. The correspondence

**E-A — the reduction test (D-2 generalized).** The rule "a cut is non-consecutive exactly when its adjacent-across anchors are jointly co-parented by a layer window" holds **for every census row whose windows are all cyclic intervals and none is full-range** — verified by construction per cut (the exact-witness / rotation equivalence is asserted for every cut of every row; zero violations). **The failures are two measured classes:** (i) **non-cyclic windows** (the window's index set has gaps — e.g. `{0,2}`) span cuts without any adjacent-anchor witness at any single cut ("uncut spanning"); (ii) **full-range windows** witness every cut but never break consecutiveness. Fault census: **902 rows** — 872 non-cyclic, 30 full-range (disjoint). The boundary layer's exact censuses carry **zero** non-cyclic windows.

**E-B — the pair test.** Direction 1 ("every co-parented pair produces a spanning window at its cut"): every pair's shared set on a reduction-exact row is a cyclic run and contains an adjacent pair — **all-fertile holds exactly on the reduction-exact rows** (4/9 B_H, 8/9 B_PENT, 82/488 C_H, 30/476 C_PENT); infertile pairs occur exactly where non-cyclic windows exist. Direction 2 ("every spanning cut is produced by a co-parented pair" — i.e. pair-witnessed, |E(k)| ≥ 2): **the strict bijection holds on 8/9 B_H rows, 8/9 B_PENT rows, 424/488 C_H rows, 476/476 C_PENT rows (the last degenerate: non-cyclic windows flood every cut)**. The single-witness loci: A0×A0 (2 cuts), pent A1 (5 cuts), 64 Scope C H rows. **The D1 anchor satisfies both directions exactly** — the A1×A2 census is a clean pair bijection.

**E-C — the heptatonic containment cross-reference.** Among reached layer states, the containment pairs (`subnodes` ≥ 2 = Hamming-2 partner pairs) and the reach pairs (shared cycle-anchor parents) are **distinct relations**: D7×D6 carries 12 containment pairs vs 25 reach pairs with 10 coincidences; A1×A2 carries 69 containment pairs vs 5 reach pairs with **0** coincidences. The brief's containment-co-parenting and BL-087's reach-co-parenting do not coincide on the D1 census.

**E-D — the pentatonic-side binding.** No pentatonic cycles exist (G1), so the pentatonic-side correspondence binds through the pentatonic satellite layers: **every pent-layer reach pair is a global containment-co-parented pair** (verified fail-loud for all 486 rows; the shared cycle anchors are shared containment parents). Scope C: 72,840 pair instances, max 270/row; the M-cycle pent layers: D7 60, A0 60, A2 10, D2 30, A1 0.

## 5. Findings

**1. The mechanism generalizes in its exact form on the boundary layer — and its failures elsewhere are two measured structural classes.** The co-parenting ⟺ spanning correspondence (reduction + pair-witnessed cuts + all pairs fertile) is **BOUNDARY_LAYER_CONDITIONAL**: 14 exact rows of 982 spanning rows (14/982), and **every exact row is a boundary-layer census** — the dual-closure pair's censuses (D7×D6; A0×A1), the A1×A2 census (the D1 instance), the pentatonic layers of D7/A0/A2 (the 60-strict-pair ladders), and **8 A-tier operator rows** (three 8-cycles and one 4-cycle over A-tier anchors, both orientations; the same cycles BL-084 found sliding). The exact rows are *not* confined to the characterized instance: **the mechanism is not A1-specific** — it recurs on the boundary layer's reach-aligned censuses. But it is not universal either: the general operator population is dominated by faults (72/488 reduction-exact), and even boundary-layer censuses can degrade (A0×A0's two single-witness cuts; pent A1's five).

**2. The degradation's two classes are structural, not noise.** (i) **Non-cyclic windows** (872 fault rows): the reach geography produces windows with gaps (e.g. `{0,2}`) — spanning that is not attributable to any single cut's adjacent-anchor co-parenting; the D-2 reduction fails by construction, and the co-parented pairs sharing non-adjacent parent sets are infertile. (ii) **Full-range windows** (30 rows): satellites reached by every cycle anchor witness every cut but never break consecutiveness — the naive "contains both adjacent anchors" criterion overcounts; the exact criterion (non-consecutive under the cut's rotation) is the correct one. (iii) **Single-witness cuts** (66 rows across populations): spanning without a co-parented *pair* — the pair-level bijection is strictly stronger than the cut-level rule, and its failures locate exactly.

**3. The pentatonic side is the strongest correspondence measured — and it is the containment relation's natural home.** Because reach = containment for 5-in-7 (p ⊆ a iff Hamming-2), the pentatonic layers instantiate the brief's `parentsRooted` co-parenting directly. The D7 and A0 pentatonic layers reproduce the FULL ladder shape with **60 strict co-parented pairs each, all fertile, every spanning cut pair-witnessed** — a clean bijection with the tightest possible pairs (exactly 2 shared parents). The A2 pentatonic layer is a clean bijection with 10 pairs. The pentatonic-side E-D binding confirms every pent-layer pair is a global census pair.

**4. The D1 instance, reproduced and scoped.** The A1×A2 census: 1359/1401 reached by both endpoints 1371/1389, the wrap cut pair-witnessed by exactly those two states, the pair strict and fertile; ρ relocates the spanning (3669/981, parents 2901/1749) without creating or removing it — all re-verified independently. **The characterized instance is one member of a boundary-layer class, not a peculiarity**: its structure (closure-edge co-parenting × cut) is shared by D7×D6, A0×A1, and the pentatonic ladders; its partial siblings (A0×A0, pent A1) show where the pair-level strictness breaks even on the boundary.

**5. The mechanism inventory update.** The GSL-8 candidate draft (un-promoted, inline, unapplied): *the cut-level mechanism of the reach-order alignment — a cut is non-consecutive exactly when its adjacent-across anchors are jointly co-parented by a layer window (exact for cyclic-interval layers); pair-witnessing and fertility hold on the boundary layer's censuses and degrade in the general topology (non-cyclic windows, single-witness cuts).* This is the mechanism-level refinement of BL-084's reach-order alignment; no new GSL number, no registration.

**6. What this does not do.** No causal claim beyond the correspondence verdict; the production question stays open. No claim event, no record amendment, no GOVERNS admission, no registration. The D2 trio's re-verification is context (the D2 cycle is also the D-tier non-cyclic-fault locus: 12 + 10 non-cyclic windows).

## 6. Per-family breakdown

**Cycle families (exact rows only on the boundary families).** Exact: **7-1** (D7 orbit; 2 rows incl. the pent layer), **7-33** (A2 cycle; 1 hept + pent), **7-34** (A1; 1), **7-35** (A0; 2). Faults concentrate in the D-tier families (7-15: 3; 7-22/7-8/7-Z17/7-Z37: 1 each) and in **7-33** (the A2 cycle's D4/A2/A0 layers: 3 faults — the A2 cycle is the boundary's fault locus). **7-Z12 (D5 family): zero spanning cuts** in its boundary rows (the D5 cycle's layers are all singleton partitions or clean).

**Satellite classes (witness incidences over the Scope B H rows).** The dense classes carry the witness load: 7-2 (D6) 72 incidences / 0 non-consecutive windows; 7-24 (A2) 96/5; 7-26 96/10; 7-28 72/20; 7-30 96/10; 7-27/7-31 (A1 satellites) 72/0 and 48/0; 7-7 (D2) 48/12. The non-consecutive windows are class-structured: the A2 families (7-24/7-26/7-28) and the D2 family (7-7) carry them; the class-pure D6 (7-2) carries none.

## 7. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl088-co-parenting-probe:check` | PASS (generator `--check` fresh; validator PASS; **48 mutation probes rejected**; static two-region check PASS) |
| Calibration | **EXACT**: BL-084 Scope B (10 cycles / 57 layers) + Scope C (476 rows) field-for-field; BL-087 A0/D7/A1 cuts + ρ relocation; D1 anchor; containment identities (4620/6930; Hamming-2 6930) |
| Rotation equivalence | asserted for every cut of every census row (982 spanning rows + all layer rows); zero violations |
| `npm run orrery:check` | exit 0 (full chain incl. `tsc --noEmit`) |
| `npm run orrery:test` | suite green — 47 files / 487 tests (13 new BL-088 pins) |
| `validate:ledger-pins` / `validate:prose-consistency` / `validate:manifest` | PASS (0 violations; manifest/checksums regen; fileCount 1350) |
| Chain fingerprints | bipartite `903eebf0…`, BL-084 `6865b076…`, BL-087 `ad74a7e6…`, BL-073 `811fa786…`, probe `068f9007…`, dpg `4c7abcb1…` (all self-checked) |

## 8. Bounded non-accomplishments

No new measurement (landed bipartite + landed orders/layers + verbatim `windowAnalysis` + masks-only pentatonic containment arithmetic; the descriptive-read class); no mechanism (causal) claim beyond the correspondence verdict; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no new GSL number; the GSL-8 candidate draft is inline, unapplied, un-promoted; no registration; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; the frame is interpretation vocabulary; session prose is context, not evidence.

## 9. Result in one paragraph

The BL-087 closure-edge co-parenting × cut characterization of the A1 spanning **generalizes to the boundary layer and only to the boundary layer, in a precisely measured sense**. The calibration is EXACT (BL-084's populations and BL-087's D1 diagnostics re-derived field-for-field; the containment identities 4,620 pentatonic and 6,930 heptatonic co-parented pairs verified). The containment censuses show a two-valued overlap structure (6 parents / 5 subnodes; no intermediate values) with the ≥2/≥3 thresholds coinciding. The spanning census (982 spanning census rows across the BL-084 populations plus the pentatonic layers) classifies every cut; the correspondence's exact form — reduction + pair-witnessed cuts + all pairs fertile — holds on **14 rows, every one a boundary-layer census**: D7×D6, A0×A1, A1×A2 (the D1 instance, reproduced with the wrap cut pair-witnessed by 1359/1401), the pentatonic ladders of D7/A0/A2 (60 strict pairs each — the strongest instance), and 8 A-tier operator rows. The degradation is two measured structural classes: **non-cyclic windows** (872 rows; spanning not attributable to any single cut's adjacent-anchor co-parenting; infertile pairs) and **full-range windows** (30 rows; the naive criterion overcounts). The mechanism is **not A1-specific and not universal: BOUNDARY_LAYER_CONDITIONAL** — the cut-level refinement of BL-084's reach-order alignment, recorded as the un-promoted GSL-8 candidate draft. No claim, no amendment, no admission — the mechanism's scope determined, is the deliverable.
