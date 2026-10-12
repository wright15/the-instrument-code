# BL-078 — The D7 derivation re-test (office-purity route, region-scoped isolation): the ti-pole's selection re-tested — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. Sandbox/analysis only. **D7 remains hypothesis-tier throughout**: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (`provenance/DECISION_LEDGER.md:2703-2712`). D4's amended `derivable-via-R2` (ENTRY 15) and ENTRY 10's immutable `not_derived` are unchanged. No GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes. **BL-070's bytes are frozen** (`9db10a08…`): this re-test is a distinct artifact consuming BL-070 (and BL-068) by fingerprint self-check only. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) was not used as design input; session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl078-d7-retest.v1.json` — status `planning_evidence` (raw-byte SHA-256 `e9c3acdaedc9e0f59a893a05b22ece53092bd65c02760d5866dd8822a8995671`; `derivationFingerprint` `11644d401eff5ef951a2173f390041531743df682ad9c502f98a048c0f76e1b1`). Generator `scripts/build-bl078-d7-retest.mjs` (raw-byte SHA-256 `ebd548f8c9d04db62b226d445dfef0cb8808157fd431d11b3d110cbdaad82b62`); independent validator `orrery/scripts/validate-bl078-d7-retest.mjs` (raw-byte SHA-256 `041bd3de929630b728832fdfe4b3ced7c8fd735a86fa1bb991ad36d5d8828677`; **47 mutation probes rejected**; 11 static rejections; region-scoping probes: permissive pass + proof strip rejected); pins `orrery/src/bl078-d7-retest.test.ts` (11 tests; raw-byte SHA-256 `3cc5fa1d0090fe106c63119c4afe3f7efdf1a744860ee41b10c5f5918112a1a2`). Wired `orrery:bl078-d7-retest:check` (after `bl076-bijection-probe:check`, before `derived-path-graph:check`); full `orrery:check` exit 0; suite 41 files / 417 tests green (11 new BL-078 pins); `validate:ledger-pins` unchanged (pre-existing 13-violation BL-058 inventory, zero added); manifest regen; `validate:manifest` PASS.

**Chain anchors (self-checked by fingerprint):** BL-068 `b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849`; BL-070 `9db10a088a05664a5cf60f6fad14514a4fc9aab278dcf0359d684bce70607731` (both recomputed from the landed artifact cores; the literal pins live in the validator and pins only). The Gate 3 receipt (`qa/d4-r2-execution-receipt.json`) is bound by raw sha256 and re-read for the cycle-twin per-edge bytes.

## 1. What was built and the rulings executed

**Rulings executed (OD-N0…OD-N3, approved 2026-10-12).** OD-N0: a new BL-078 probe, not a BL-070 rebuild; BL-070's bytes frozen. OD-N1: candidate-set scope — C-M1…C-M9 verbatim from the landed BL-070 definitions + the C-TB-R1 composite; the comparability with the landed `cleanSplitCount 0` baseline is the re-test's meaning. OD-N2: at most one disjunctive census composite ([|Δ| = 1] ∨ [reach-singleton]), recorded `UNPROMOTED_DISCOVERY`. OD-N3: R-NONE framing — the office field as the selection's ground, joins the anchoring remainder; not a wall-dissolution claim; not a governs-admission claim; the scoping memo §5.1 contrast reading intact.

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl078-d7-retest.mjs` | deterministic builder; region-scoped: the intrinsic region (marks-only: partition + masks + mesh + the eight mask-geometric predicate definitions) statically fenced; the comparison region carries the office reads |
| Artifact | `orrery/src/generated/bl078-d7-retest.v1.json` | the re-test: domain verification, calibration, the verbatim battery, the side-by-side comparison, near-miss, combination, invariants, orbit, isolation, branch, accounting |
| Validator | `orrery/scripts/validate-bl078-d7-retest.mjs` | independent re-derivation from the six pinned primaries; region-scoped static check with the region-scoping proof; **47 mutation probes** (35 artifact-drift + 5 smuggled-read + 6 presence-strip + 1 proof-strip) each rejected; 1 permissive probe passes |
| Pins | `orrery/src/bl078-d7-retest.test.ts` | 11 vitest pins (header/chain/pre-registration, domain + calibration, non-circularity, battery, near-miss, combination, side-by-side, isolation, invariants/orbit/direction, branch/interpretation, accounting/fences) |
| Wiring | root `package.json` `orrery:bl078-d7-retest:check`; `orrery/package.json` `check`/`build` | runs after `bl076-bijection-probe:check`, before `derived-path-graph:check` |

## 2. Grounding receipt (per-claim verification at build)

| # | Claim | Verification | Verdict |
|---|---|---|---|
| G-1 | Data bindings: 462-record ledger, network seat contacts + modal rows, containment mesh, BL-068, BL-070, Gate 3 | all six sha256-bound in `sourceBindings`; validator re-reads and re-checks each | **GROUNDED** |
| G-2 | Chain anchors: BL-068 and BL-070 fingerprints | recomputed from the landed cores and compared to the printed fields at build; literals checked in the validator against the pinned constants | **GROUNDED** |
| G-3 | The 36-instance domain: per-anchor 4/5/6/6/6/5/4, distinct 14, multiplicities 2/2/10 | re-derived masks-only (D1 partition + D2 Hamming-2 reach); set-equal to the BL-068 availability domain **and** the BL-070 derived domain, key-by-key; all-ledger reach uniform at 30/anchor | **GROUNDED** |
| G-4 | The recorded relation: 14 seat contacts = same-office subset | the office-equality subset set-equal to the network's `d7SeatContactRows`, key-by-key; remainder deltas {2:11, 5:11} | **GROUNDED** |
| G-5 | The landed battery (BL-070): confusions per candidate | re-derived from the primary sources; compared side-by-side per candidate, per sub-rule, per distribution (all match) | **GROUNDED** |
| G-6 | The BL-068 axes: zInterface 4/2/10/20 | re-computed C-M4 against the landed axis confusion (match) | **GROUNDED** |
| G-7 | The cycle-twin bytes: rotateInterval 11×6 + 6×1 | Gate 3 per-edge matched interval-by-interval; independent mask recomputation | **GROUNDED** |

## 3. V-D7D-1 — domain verification (PASS)

The D1 role/tier partition + the D2 Hamming-2 reach re-derive the **36-instance domain**, per-anchor **4/5/6/6/6/5/4**, 14 distinct states, multiplicities 2/2/10. **Set-equal to the landed BL-068 availability domain and the landed BL-070 derived domain, key-by-key.** The calibration control holds: the all-ledger Hamming-2 reach is **uniform at 30 per anchor**; the per-anchor asymmetry is the D6-satellite projection of that uniform reach — emergent, never an input. The domain block reads no office/class/network record (the validator's pins check the block's non-circularity).

## 4. V-D7D-2 — calibration (R-OFF) — **EXACT**

> **R-OFF: `[office(s) = office(h)]` (comparison region, labelled) — confusion 14/0/0/22 — `CLEAN_SPLIT` — EXACT.**

The office-field rule — evaluated against the **network's landed relation** (not against its own definition) — reproduces the 14 contacts exactly on the verified domain. The office-equality subset is set-equal to the seat-contact rows, key-by-key. The control's license holds: if R-OFF failed here, the domain would be wrong, not the rule.

## 5. V-D7D-3 — the battery re-test (the report: confusion matrices side-by-side)

Nine pre-registered candidates, verbatim from the BL-070 definitions; evaluated against the landed relation on the verified domain. **`cleanSplitCount 0`; expectations held 9/9.** Side-by-side (original = landed BL-070; re-test = this artifact):

| # | Candidate (family) | Original confusion (BL-070) | Re-test confusion (BL-078) | Verdict | Match |
|---|---|---|---|---|---|
| C-M1 | containment | 0/0/14/22 · 10/16/4/6 | 0/0/14/22 · 10/16/4/6 | NON_SEPARATING | ✅ |
| C-M2 | hamming/rotation | 0/0/14/22 · 0/0/14/22 | 0/0/14/22 · 0/0/14/22 | NON_SEPARATING | ✅ |
| C-M3 | pc-sum/mask-numeric | **12/0/2/22** · 7/0/7/22 · 8/3/6/19 | **12/0/2/22** · 7/0/7/22 · 8/3/6/19 | **NEAR_MISS_BOUNDARY** | ✅ |
| C-M4 | chiral-Z (GSL-2) | 4/2/10/20 | 4/2/10/20 | NON_SEPARATING | ✅ |
| C-M5 | displacement | **12/0/2/22** · 2/10/12/12 | **12/0/2/22** · 2/10/12/12 | **NEAR_MISS_BOUNDARY** | ✅ |
| C-M6 | interval-class | 0/0/14/22 | 0/0/14/22 | NON_SEPARATING | ✅ |
| C-M7 | orientation (labelled) | 7/11/7/11 | 7/11/7/11 | NON_SEPARATING | ✅ |
| C-M8 | inversion-image | 0/0/14/22 · 14/22/0/0 | 0/0/14/22 · 14/22/0/0 | NON_SEPARATING | ✅ |
| C-M9 | multiplicity/census | 2/0/12/22 · 2/2/12/20 · 10/20/4/2 | 2/0/12/22 · 2/2/12/20 · 10/20/4/2 | NON_SEPARATING | ✅ |

**Summary: every confusion matrix, verdict, and distribution matches the landed battery.** The near-miss anatomy re-derives exactly: `|ΔpcSum| = 1` selects the 12 single-semitone substitutions, missing exactly the terminal tritone contacts `127:253` and `4033:2017` (both Δ=6, both reach-singletons); the 22 non-contacts all sit at |Δ| ∈ {4,6}. The BL-068 `zInterface` axis re-computes to 4/2/10/20.

## 6. The comparison's meaning — **`REPLICATED`**

> **Comparison verdict: `REPLICATED`** — all nine side-by-side entries match (verdict, distributions, and every sub-rule), the domain comparison matches, the near-miss and composite comparisons match, and the BL-068 zInterface axis matches.

The pre-registered meaning (OD-N1): the comparison baseline is the landed BL-070 C-M battery and the BL-068 axes — not the phase-C probes. **Identical results = the original findings are robust under the stricter enforcement**; the isolation regime did not change what the candidates could see (they were masks-only by construction, and the region-scoped enforcement confirms it). **Differing results would have been the finding** — an office-correlated channel disclosed by the stricter isolation. The replication discipline is pinned in the artifact: *a different result means the candidates changed, not the test's conditions.*

## 7. The combination candidate — C-TB-R1 (recorded, un-promoted; OD-N2)

`[|ΔpcSum| = 1] ∨ [reach-singleton]` selects **14/0/0/22 masks-only** (identical to the landed C-TB-1 confusion). Status **`UNPROMOTED_DISCOVERY`**; branch effect none; mechanism none offered — separation ≠ derivation (the OD-66-2 / OD-70-5 bar); the mechanism question remains BL-072.

## 8. V-D7D-4 — input isolation (PASS, region-scoped)

- The generator carries **two marked regions**: the intrinsic region (partition + masks + mesh + the eight mask-geometric predicate definitions) and the comparison region (the office reads: recorded/unrecorded labels, R-OFF, C-M7 orientation, invariant sums, baseline reads).
- Static check (two-sided): forbidden office/class/network tokens absent from the intrinsic region **and** the head; the comparison region **must** contain the office reads — the **region-scoping proof** (a file-scoped scan that over-bans the whole file is rejected by construction). Smuggled office/class/network reads injected into the intrinsic region are rejected (5 probes); presence-strips are rejected (6 probes); a permissive probe injected into the comparison region **is not rejected**; a strip of the comparison-region office read is rejected.
- **`officeBytesInDerivationPath: 0`.** R-OFF is the calibration control, never the primary derivation; C-M7 orientation is a labelled canonical-read (not the office field).

## 9. Invariants, orbit, direction (re-verified)

- **Invariants:** 7 whole inversion pairs, all in-class, status-shared, orientation-complementary, **all office sums 6 mod 7**; the pairing set-equals the BL-068 block; whole-pair selection mechanically verified for every state-level rule; no rule splits an inversion pair. `INVARIANTS_OBEYED`.
- **Orbital rotation:** every modal edge an exact rotation (`rotateMaskZ12^11 ×6` plus the `4033→127` closure at `^6`); per-edge intervals matched to the landed Gate 3 bytes; the landed 0/7 is D4-interval-specific — an **interval-transport failure**, not a rotational absence.
- **Direction:** structural (anchor→contact) + unique-hub masks-only 2/14 — exactly the two reach-singletons.

## 10. Branch classification and interpretation

> **`PARTIAL_DERIVATION`** — V-D7D-1 PASS / V-D7D-2 PASS / V-D7D-3 FAIL / V-D7D-4 PASS / V-D7D-5 PASS.

**Statement.** The domain re-derives masks-only; the pre-registered battery carries **no clean mask-geometric selector** (best = near-miss 12/0/2/22). The sole clean separator remains office identity (14/0/0/22, comparison-only): **the selection is office-field-dependent** — and the re-test **replicated** that finding under the region-scoped isolation.

**Interpretation — `R_NONE` (OD-N3 framing).** No mask-geometric candidate discriminates same-office from cross-office; **the office field is the selection's ground and joins the anchoring remainder** — confirmed by the stricter re-test. Not a wall-dissolution claim; not a governs-admission claim; the scoping memo §5.1 contrast reading stays intact.

## 11. The three-tier accounting (V-D7D-5)

- **Discharged — masks-only:** the D1+D2 domain (36 instances; 4/5/6/6/6/5/4 emergent; multiplicities 2/2/10; set-equal BL-068 + BL-070); the uniform-30 calibration; the eight mask-geometric candidate predicate definitions (C-M1…C-M6, C-M8, C-M9), defined **inside** the statically checked intrinsic region; the near-miss anatomy; the reach census; the combination arithmetic (recorded, un-promoted); inversion pairing, IC counts, rotation relations, orbit intervals.
- **Discharged — canonical-computation (labelled):** the D1 partition (role/tier fields); the recorded/unrecorded status labels and office deltas (evaluation only — the target); the R-OFF calibration control; C-M7 orientation (labelled); the invariant office sums; the orbit order and closure; the BL-068/BL-070 baseline reads (fingerprint self-checked).
- **Remaining granted:** the D7/D6 partition membership; **the office field as the selection's ground** (R-NONE, replicated); the modal orbit record; the orientation bit (BL-065, labels only); presentation conventions.

## 12. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl078-d7-retest:check` | PASS (generator `--check` fresh; validator PASS; 47 mutation probes rejected; 11 static rejections; region-scoping probes confirmed) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | 41 files / 417 tests passed (11 new BL-078 pins) |
| `validate:ledger-pins` | unchanged at the BL-058 13-violation inventory — zero added |
| Manifest | regen (`npm run package:manifest`); `validate:manifest` PASS |
| Static isolation | region-scoped: forbidden tokens absent from the intrinsic region and head; comparison region carries the office reads (the region-scoping proof); smuggled-read probes rejected; permissive probe passed; proof-strip probe rejected |

## 13. Bounded non-accomplishments

No D7 claim event; no D7 record amendment; no D7 derivation admission (hypothesis-tier preserved, ENTRY 15's clause unchanged). No GOVERNS admission; no derivation admission of any kind. No G1 movement; no INV-5 graduation; no M-walkability promotion. No canonical/Court/schema/Neo4j writes; no ledger writes. No D4-record movement (ENTRY 10 immutable; ENTRY 15 unchanged). **No BL-070 bytes changed** (the frozen artifact is consumed by fingerprint self-check only). No orientation-bit resolution (BL-065 carried). No lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence.

## 14. Result in one paragraph

The second D7 derivation attempt executed as a **replication under stricter conditions**, and the ti-pole's selection did not pass: the re-test reproduces the landed BL-070 battery **exactly** — calibration **EXACT** (R-OFF 14/0/0/22), all nine candidates side-by-side identical (cleanSplitCount 0; the near-miss 12/0/2/22 missing the two terminal tritone contacts), the domain set-equal to both landed domains, the BL-068 zInterface axis matched — under the **region-scoped input isolation** (zero office bytes in the derivation path; the region-scoping proof, the permissive probe, and the smuggled-read probes all enforced by the validator). Since the candidates' view was masks-only by construction, the replication confirms the original findings are **robust**; the comparison verdict is **`REPLICATED`**. The branch classification stands at **`PARTIAL_DERIVATION`**, and the interpretation branch **`R_NONE`** is the honest finding: **the ti-pole's selection is granted-dependent — the office field is the selection's ground and joins the anchoring remainder** (OD-N3 framing; not wall-dissolution, not governs-admission; scoping memo §5.1 intact). The composite C-TB-R1 is recorded un-promoted per OD-N2. No claim, no amendment, no admission — the bounded replication of the granted-dependent selection is the deliverable.
