# BL-070 — The D7 derivation attempt (office-purity route): the ti-pole's R2-analogue executed — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. Sandbox/analysis only. **D7 remains hypothesis-tier throughout**: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (`provenance/DECISION_LEDGER.md:2703-2712`). D4's amended `derivable-via-R2` (ENTRY 15) and ENTRY 10's immutable `not_derived` are unchanged. No GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) was not used as design input; session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl070-d7-derivation.v1.json` — status `planning_evidence` (raw-byte SHA-256 `169ce7064c2ee11ab857f5a8fec682fe3a245ed945ba9d61d5f659851eccd7c5`; `derivationFingerprint` `9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731`). Generator `scripts/build-bl070-d7-derivation.mjs` (raw-byte SHA-256 `85e631e1440b6d36cadf057d275374af7902f38e75659afa9a430df66e7d2caf`); independent validator `orrery/scripts/validate-bl070-d7-derivation.mjs` (34 mutation probes rejected; two-sided static region check); pins `orrery/src/bl070-d7-derivation.test.ts` (11 tests). Wired `orrery:bl070-d7-derivation:check` (after `bl068-d7-asymmetry:check`, before `derived-path-graph:check`); full `orrery:check` exit 0; suite 362 green (36 files); `validate:ledger-pins` unchanged (pre-existing 13-violation BL-058 inventory, zero added); manifest regen.

**Chain anchor (self-checked by fingerprint):** the BL-068 artifact is consumed by its self-checked `derivationFingerprint` `b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849` (the literal pin lives in the validator and pins, per the house ledger-pin discipline; the generator carries no 64-hex literal). The Gate 3 receipt (`qa/d4-r2-execution-receipt.json`) is bound by raw sha256 and re-read for the cycle-twin per-edge bytes.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl070-d7-derivation.mjs` | deterministic builder; intrinsic region statically fenced TWO-SIDED (forbidden office/class/network tokens absent; required masks-only tokens present) |
| Artifact | `orrery/src/generated/bl070-d7-derivation.v1.json` | the derivation attempt: domain derivation, the nine-candidate battery, near-miss anatomy, tie-break disclosure, invariants, orbital-rotation refinement, branch classification, accounting |
| Validator | `orrery/scripts/validate-bl070-d7-derivation.mjs` | independent re-derivation from the five pinned primaries; two-sided static check; **34 mutation probes** (24 artifact-drift + 5 smuggled-read + 5 presence-strip) each rejected |
| Pins | `orrery/src/bl070-d7-derivation.test.ts` | 11 vitest pins (header/chain/pre-registration, domain + calibration, domain non-circularity, battery, near-miss anatomy, tie-break, invariants, orbital rotation, direction, branch, accounting/fences) |
| Wiring | root `package.json` `orrery:bl070-d7-derivation:check`; `orrery/package.json` `check`/`build` | runs after `bl068-d7-asymmetry:check`, before `derived-path-graph:check` |

**Rulings executed (OD-70-1…OD-70-4, approved 2026-10-11).** C-M1…C-M9 as the exhaustive pre-registered battery, no silent additions; D6-satellite Hamming-2 reach primary (role/tier canonical-read + masks only, the class label forbidden in the derivation) with the all-ledger reach as robustness control; expectation-only (the battery is the search, the branch table is the verdict, no unregistered hunting on failure); NEAR_MISS_BOUNDARY named with the two misses identified, no tie-break promotion. Build notes absorbed: the near-miss anatomy pin and the pre-registered branch labels (FULL/PARTIAL/NO derivation).

## 2. Grounding receipt (per-claim verification at build)

| # | Claim | Verification | Verdict |
|---|---|---|---|
| G-1 | 7 D7 anchors / 14 D6 satellites; the D6 partition is class-pure | ledger bytes: `tier=D7,role=anchor` census 7; `tier=D6,role=satellite` census 14, all class `7-2`, set-equal to the ledger's 14-record 7-2 class (comparison) | **GROUNDED** |
| G-2 | Domain 36 instances, per-anchor 4/5/6/6/6/5/4 | derived masks-only (partition + Hamming-2 reach); set-equal to the landed BL-068 availability domain (36 keys, checked key-by-key); distinct states 14; multiplicities 2/2/10 | **GROUNDED** |
| G-3 | Recorded 14 = office-equality subset; remainder 22 at delta ±2 (11+11) | network seat-contact rows (14) set-equal the same-office subset of the derived domain; delta census {2:11, 5:11} | **GROUNDED** |
| G-4 | The three recorded obstructions | ENTRY 15 D7 clause + Gate 3 receipt re-read: literal 0/14, domain-class 14/14 = U = O (C2), cycle-twin 0/7; receipt perEdge rotateInterval values matched interval-by-interval | **GROUNDED (with the §7 refinement)** |
| G-5 | Invariants pole-universal | 7 inversion pairs, all in-class, status-shared, orientation-complementary, all office sums 6 mod 7; cross-checked against the BL-068 invariant block (same pairing) | **GROUNDED** |
| G-6 | GSL-3 mechanism (different predicates over different domain multiplicities) | BL-068 artifact `synthesis.verdict DIFFERENT_PREDICATES`, fingerprint self-checked; the battery's C-M4 re-derives the fa-specific non-separation (4/2/10/20) | **GROUNDED** |
| G-7 | Plan probes P-O1/P-O2/P-O3 (unlanded planning observations) | **P-O1 confirmed and sharpened** (§4): all-ledger reach uniform 30/anchor; D6-satellite projection 4/5/6/6/6/5/4; D6-any-tier 6/6/8/8/8/6/6. P-O2 confirmed (near-miss exactly 12/0/2/22, misses the two tritone terminals). P-O3 refined (§7): the orbit is an exact rotation orbit | **GROUNDED (re-derived fail-loud)** |

## 3. The domain derivation (D1 + D2) — V-D7-1 PASS

- **D1:** the D7/D6 anchor-satellite partition from the ledger's role/tier fields (canonical-read, labelled). The class label is **forbidden** in the derivation region — the partition's set-equality with the 7-2 class is verified only in comparison (OD-70-2's no-restatement-smuggling discipline at the domain layer).
- **D2:** `reach(h) = {s : hamming12(mask(h), mask(s)) = 2}` (masks only). Result: **36 instances, per-anchor 4/5/6/6/6/5/4, distinct 14, multiplicities 2/2/10**; set-equal to the landed BL-068 availability domain; all 14 contacts contained; the own-office subsets set-equal the seat-contact rows (comparison).
- **The calibration finding (P-O1, confirmed):** the all-ledger Hamming-2 reach is **uniform — 30 per anchor**; the D6-tier (anchors+satellites) reach is 6/6/8/8/8/6/6; the D6-**satellite** projection is 4/5/6/6/6/5/4. **The per-anchor asymmetry is the partition projection of a uniform reach — emergent, never an input** (the BL-066 emergent-count-4 pattern).

## 4. The battery (C-M1…C-M9) — V-D7-2 FAIL, all nine expectations held

Confusion vs recorded status on the 36-instance domain (tp/fp/fn/tn):

| # | Candidate (family) | Rule | Confusion | Verdict |
|---|---|---|---|---|
| C-M1 | containment | shared-subnode count ≥ 6 / family overlap ≥ 7 | 0/0/14/22 · 10/16/4/6 | NON_SEPARATING (overlap constant at 5) |
| C-M2 | hamming/rotation | rotation hit ≥ 1 / Hamming = 8 | 0/0/14/22 · 0/0/14/22 | NON_SEPARATING (0/36 rotations; all H=2) |
| C-M3 | pc-sum/mask-numeric | \|ΔpcSum\| = 1 | **12/0/2/22** | **NEAR_MISS_BOUNDARY** |
| | | min \|Δmask\| per anchor | 7/0/7/22 | NON_SEPARATING |
| | | \|Δmask\| ≤ 64 | 8/3/6/19 | NON_SEPARATING |
| C-M4 | chiral-Z (GSL-2) | nonZ < Z | 4/2/10/20 | NON_SEPARATING (fa-specific, confirmed) |
| C-M5 | displacement | \|Δ\| = 1 | **12/0/2/22** | **NEAR_MISS_BOUNDARY** (equivalent to C-M3.r1) |
| C-M6 | interval-class | IC(anchor) = IC(satellite) | 0/0/14/22 | NON_SEPARATING (anchor IC `[6,5,4,3,2,1]`, satellite IC `[5,5,4,3,3,1]`, both constant) |
| C-M7 | orientation (labelled) | orientation = A | 7/11/7/11 | NON_SEPARATING (every anchor's pair is 1A+1B) |
| C-M8 | inversion-image | invert(anchor) = satellite / image in reach | 0/0/14/22 · 14/22/0/0 | NON_SEPARATING (constant) |
| C-M9 | multiplicity/census | parentCount = 1 / 2 / 3 | 2/0/12/22 · 2/2/12/20 · 10/20/4/2 | NON_SEPARATING |

**Summary: cleanSplitCount 0.** No pre-registered mask-geometric candidate generates the 14 contacts; the best result is the near-miss. The pre-registered expectation (OD-70-3) was the near-miss shape — all nine expectations held.

## 5. The near-miss anatomy (OD-70-4, pinned)

> **NEAR_MISS_BOUNDARY — `|pcSum(anchor) − pcSum(satellite)| = 1` (equivalently `|single-pitch displacement| = 1`): 12/0/2/22.** The 12 selected are the single-semitone substitutions. The two misses are exactly the **terminal tritone contacts** `127:253` and `4033:2017` (Jupiter and Mars — the first and last anchors of the modal orbit; both ΔpcSum 6, displacement +6, and both **reach-singletons**, parentCount 1). Every one of the 22 non-contacts sits at **|ΔpcSum| ∈ {4,6}** (12 at 4, 10 at 6); no non-contact sits at |ΔpcSum| ≤ 3.

The anatomy is pinned as content (the 12-item selected list, the two miss records, the non-contact shape), so a future refactor cannot keep the count while losing the shape.

## 6. The tie-break candidate (recorded, un-promoted — OD-70-4)

The build-phase disclosure: composing the two pre-registered components — `[|ΔpcSum| = 1] ∨ [reach-singleton]` — selects **exactly the 14 contacts (14/0/0/22)**, masks-only. Per OD-70-4 (the maintainer pre-identified this exact "min-|Δ| + census" tie-break as unpromotable without a new ruling) and the OD-66-2 separation-≠-derivation line (no mechanism offered), the composite is recorded in the artifact as **`C-TB-1`, status `UNPROMOTED_DISCOVERY`, branch effect none**. The classification below is unchanged by it; a promotion ruling is a new decision (OD-70-5, §9).

## 7. The orbital-rotation refinement (the third obstruction, re-read)

The Gate 3 receipt's own per-edge bytes show `rotateInterval` = `11,11,11,11,11,11,6` — every modal-orbit edge is reproduced by `rotateMaskZ12^d` (d = 11 six times; d = 6 for the closure step `4033→127`, which absorbs the root-normalization offset). The landed `verified: 0` counts only the **D4 route's verification intervals {1,2}**. Recomputed and matched interval-by-interval at build: **exactRotationCount 7/7; intervals {11:6, 6:1}; the obstruction "cycle-twin non-closure (0/7)" is precise as an *interval-transport failure* (the D4 twin relation does not transport), not as an absence of rotational structure on the ti-pole.** Bounded refinement only: planning evidence, D7 hypothesis-tier unchanged, no corridor movement; whether the obstruction's wording is annotated at the next accretion is a maintainer ruling (OD-70-6, §9).

## 8. Invariants (V-D7-4) and direction

- **Invariants obey:** 7 whole inversion pairs, all in-class, status-shared, orientation-complementary, **all office sums 6 mod 7**; the pairing is set-equal to the BL-068 block. Whole-pair selection is mechanically verified for the near-miss (6 pairs selected, the pair (253, 2017) wholly excluded), the Z-majority set, the reach-census sets, the tie-break (all 7 pairs), and the domain itself. No rule splits an inversion pair.
- **Direction:** structural (anchor → contact by the domain construction; canonical-read, labelled) + unique-hub masks-only **2/14** — exactly the two reach-singletons, the near-miss misses.

## 9. Branch classification (pre-registered labels, OD-70-3)

> **PARTIAL_DERIVATION** — V-D7-1 PASS; V-D7-2 FAIL; V-D7-3 PASS; V-D7-4 PASS; V-D7-5 PASS.

**Statement:** the domain (36 instances, per-anchor 4/5/6/6/6/5/4) **derives masks-only**; the nine-candidate pre-registered battery carries **no clean mask-geometric selector** (best = the near-miss 12/0/2/22). The sole clean separator on the domain remains **office identity** (14/0/0/22, comparison-only): **the selection is office-field-dependent.** The tie-break candidate C-TB-1 is recorded un-promoted and does not alter the branch; if the maintainer rules it admissible (OD-70-5), a reclassification would follow as a separate act.

**Open decisions for maintainer ruling:**

1. **OD-70-5 — the tie-break candidate C-TB-1's status.** Promote (making the branch Full — a masks-only selection exists as a two-disjunct rule), or hold un-promoted pending a mechanism (recommended: hold, OD-66-2's separation-≠-derivation pattern; the record then carries the partial branch with the candidate named for future work).
2. **OD-70-6 — the orbital-rotation refinement's record treatment.** Record the refinement (every edge an exact rotation; the 0/7 is D4-interval-specific) as an annotation of the third obstruction at the next BL-059 accretion cycle (recommended: record as bounded refinement, no corridor movement, D7 hypothesis-tier preserved), or hold it artifact-local.

## 10. The three-tier accounting (V-D7-5)

- **Discharged — masks-only:** the D1+D2 domain (36 instances; per-anchor 4/5/6/6/6/5/4 emergent; multiplicities 2/2/10); the all-ledger calibration (uniform 30); the battery predicates C-M1…C-M6, C-M8, C-M9; the near-miss anatomy; the reach census; the tie-break arithmetic (recorded, un-promoted); inversion pairing, IC counts, rotation relations, orbit intervals.
- **Discharged — canonical-computation (labelled):** the D1 partition itself (role/tier fields); the recorded/unrecorded status labels and office deltas (evaluation only — the target); C-M7 orientation (labelled); the invariant office sums; the recorded orbit order; the landed-receipt interval cross-check.
- **Remaining granted:** the D7/D6 partition membership; **the office field as the selection's ground** (V-D7-2 FAIL — the honest bounded result); the modal orbit record; the orientation bit (BL-065, labels only); presentation conventions.

## 11. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl070-d7-derivation:check` | PASS (generator `--check` fresh; validator PASS; 34 mutation probes rejected) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | 36 files / 362 tests passed (11 new BL-070 pins) |
| `validate:ledger-pins` | unchanged at the BL-058 13-violation inventory — zero added |
| Static isolation | forbidden office/class/network tokens absent from the intrinsic region and head; required masks-only tokens present; 10 static probes rejected |
| Manifest | regen (`npm run package:manifest`); `validate:manifest` PASS |

## 12. Bounded non-accomplishments

No D7 claim event; no D7 record amendment; no D7 derivation admission (hypothesis-tier preserved, ENTRY 15's clause unchanged). No GOVERNS admission; no derivation admission of any kind. No G1 movement; no INV-5 graduation; no M-walkability promotion. No canonical/Court/schema/Neo4j writes; no ledger writes. No D4-record movement (ENTRY 10 immutable; ENTRY 15 unchanged). No orientation-bit resolution (BL-065 carried); no dual-pole unification beyond this attempt. No lens application as evidence; the frame is vocabulary, not input. The tie-break candidate is disclosed, not promoted; the orbital-rotation refinement is bounded and carries no corridor movement.

## 13. Result in one paragraph

The D7 derivation attempt's branch classification is **PARTIAL_DERIVATION**: the ti-pole's domain — 36 anchor-satellite instances, per-anchor 4/5/6/6/6/5/4 — **derives masks-only** from the role/tier partition and the Hamming-2 reach (set-equal to the landed BL-068 availability domain; the per-anchor asymmetry is the projection of a uniform 30-instance all-ledger reach — emergent, not granted), while the **nine pre-registered mask-geometric selectors all fail**: the sole clean separator remains office identity (14/0/0/22), so **the selection is office-field-dependent** and the office field remains the selection's ground. The battery's near-miss is named with its anatomy — `|ΔpcSum| = 1` selects the 12 single-semitone substitutions and misses exactly the two terminal tritone contacts `127:253` and `4033:2017`, both reach-singletons; the min-|Δ| + census composite that would repair it (14/0/0/22, masks-only) is recorded **un-promoted** per the OD-70-4 ruling, so the pre-registered branch stands while the finding is on record for ruling. The third obstruction is refined from the landed bytes: the modal orbit is an exact rotation orbit (intervals 11×6 + 6×1); the recorded 0/7 is the D4 interval-set's verification, an interval-transport failure rather than a rotational absence. The invariants hold pole-universally (7 whole pairs, sums 6, status shared). No claim, no amendment, no admission — the characterization of the ti-pole's granted-adjacent selection, bounded and named, is the deliverable.

## 14. Post-landing register (maintainer dispositions 2026-10-11)

The two open decisions (§9) are ruled and recorded here; the dispositions **ratify the landed reading** — no artifact bytes change (`derivationFingerprint` `9db10a08…` unchanged; no re-pin, no validator change), and no record amendment occurs (DECISION_LEDGER/Court/schema/Neo4j untouched).

- **OD-70-5 — ruled: hold at UNPROMOTED, per OD-66-2.** The min-|Δ| + census composite C-TB-1 selects 14/0/0/22 masks-only, but **separation ≠ derivation**: the promotion bar stays a **mechanism argument** for why min-|Δ| + census is the selection's reason, not just its description. The composite's anatomy (the two tritone terminals against the single-semitone rule) is the finding's content; the candidate stays recorded, un-promoted. The mechanism question is captured as **BL-072**; if the interval-transport structure (BL-071) supplies the argument, the composite promotes then — with its mechanism.
- **OD-70-6 — ruled: the interval-transport correction is recorded as a bounded refinement, confirmed.** The one-line register is §7 above; the accretion note is placed in the scoping memo (`scrum/plan/bl-059-governs-derivability-scoping-memo.md` §5.1 accretion: the attempt executed — domain derives masks-only, selection office-field-dependent; the cycle-twin clause refined from "rotational absence" to "rotational presence at the orbit's own intervals {11, 6}, outside the D4 verification set"). No corridor movement; D7 hypothesis-tier unchanged.
- **Follow-on captures (this run):** **BL-071** — the interval-6 structure (the tritone as the shared geometry: the modal orbit's closure offset, the two terminal far contacts, and the near-miss misses triangulate on interval 6); **BL-072** — C-TB-1's mechanism question. Both registered in `scrum/BACKLOG.md`.

**Bounded statement (unchanged by the dispositions):** no D7 claim event, no D7 record amendment, no D7 derivation admission; no GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; session prose is context, not evidence.
