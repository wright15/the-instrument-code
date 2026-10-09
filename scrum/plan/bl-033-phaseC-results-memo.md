# BL-033 Phase C — boundary-govern derivation retry: results memo (W6)

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts. Sandbox-only. D4's registered `not_derived` (`provenance/DECISION_LEDGER.md:2195-2252`) is unchanged and may be amended only by its own claim event (OD-7). D7 remains hypothesis-tier. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7, polarity synthesis) was not used as design input; it is available as interpretation vocabulary only.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-phase-c-probe.mjs` | deterministic builder (canonical serialization + fingerprint) |
| Artifact | `orrery/src/generated/phase-c-probe.v1.json` | `status: planning_evidence`, fingerprint `5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49` |
| Validator | `orrery/scripts/validate-phase-c-probe.mjs` | independent re-derivation from the five pinned sources |
| Pins | `orrery/src/phase-c-probe.test.ts` | 10 vitest pins (scope, E1, calibration, seam, contract, strict control, T-C, D7, wall, fences) |
| Wiring | `package.json` `orrery:phase-c-probe:check`; `orrery/package.json` `check`/`build` | phase-c check runs before derived-path/golden-path, then `tsc` |
| Keying spec | `scrum/plan/bl-033-phaseC-lifted-keying-spec.md` | W1 pre-registered definitions |

Verification: `npm run orrery:phase-c-probe:check` PASS; `npm run orrery:check` exit 0; full orrery suite 243/243 green. Frozen inputs cross-checked: U/O keyings re-extracted from canonical sources equal the frozen receipt's; the frozen `not_derived` four-cell pattern is reproduced exactly by the calibration route. No MANIFEST/CHECKSUMS edits (packaging is a landing-time step, SPEC-001 §4.3).

## 2. E1 — boundary-representation check: PRESENT

All 7 D4 anchors lift at all three patch phases `{11,0,1}`, and every D4 seat neighbourhood (anchor or contact satellite) has ≥1 R1/L1 seam edge. E2 proceeded. The D4 boundary structure the single-phase topology could not represent is representable in the lift — the pre-condition for a meaningful retry held.

## 3. E2 — derivation retry

### 3.1 Calibration gate (A-same): EXACT

The anchored kernel-twin route, lifted uniformly at each patch phase, reproduces OBS-023 at every phase: T-A generates 8 keys (4 matched, 4 unmatched, 10 observed missed), T-B generates all 28 (restatement), cells `A-only:0 / B-only:10 / both:4 / neither:0`. The re-keying did not corrupt the original derivation's semantics; seam-phase results are licensed.

### 3.2 The seam keying (A-seam, pre-registered primary reading): all seven offices

The kernel-twin identity, re-expressed in lifted addressing as set-identity `T_qa(a.pcs) = T_qc(c.pcs)` with office straddle at patch phases, realizes pairs for **every office k = 0…6** (9 realizations; five offices completed by the flank pairs, two by both anchored and flank realizations). T-A@seam generates all 28 keys: `G_A@seam = U`, coverage 14/14, `in_R_but_unmatched = 14`, `restatement_signature = true`.

### 3.3 Frozen contract application

| Contract quantity | Frozen run | Retry (A-seam) |
|---|---|---|
| covered | no | yes (14/14 both routes) |
| G_A = U | no (8 keys) | yes (28 keys) |
| T-C midpoint_exact | yes (2/2) | no strict (7 generated vs 2 observed; 5 extra) |
| category | `not_derived` | **`restatement_signature`** |

The contract's `derived` branch requires “neither route = U”: unavailable again, now on **both** routes and **both** keyings (T-B by construction; T-A at the seam). The pre-registered impossibility note (`provenance/DECISION_LEDGER.md:2163-2164`) extends: the T-B restatement is keying-independent, and the seam keying makes the T-A route restate the full granted domain as well.

### 3.4 Pre-registered expectation vs measured (the deviation is the finding)

The plan pre-registered “T-A@seam covers >4/14 without collapsing to G=U.” Measured: coverage rose to **14/14** but only by collapsing to `G_A = U` (`held: false`). The non-collapse clause failed. This is the **new-failure-mode** branch of the interpretation table, not identical failure and not derivation.

### 3.5 The reading fork (recorded, not hidden)

- **Free-context reading (primary):** the kernel identity is the same-geometry relation; degree is an artifact of the flush keying. Result: all 7 offices → `restatement_signature`. This is the only reading under which the pre-registered >4/14 expectation is testable, and the faithful expression of “kernel twin” in an addressing where rotation and context shift are one action.
- **Strict-degree control:** keeping phase difference +1 only realizes the two anchored pairs → 8 keys, cells 0/10/4/0, category `not_derived` — the frozen failure exactly; T-C strict remains exact. If the re-key is read as degree-preserving, the retry is a **same-failure** and the suspect remains the registered route definition (contract design), per the branch table.

Both are in the artifact. **Ruling (OD-C1, maintainer 2026-10-09): both readings ratified as co-canonical at their own scope** — free-context is the boundary-representation reading (overshoot@seam); strict-degree is the frozen-reproduction control; neither supersedes. The fork is the finding.

### 3.6 What the retry revealed (branch-table reading: new failure mode)

The single-phase failure looked like insufficient coverage (4/14). Under full boundary representation the same route covers everything — and thereby restates the full granted relation. The mechanically visible obstruction: **the contact key domain is co-extensive with the granted R domain once the boundary is fully represented**; the `derived` branch's selectivity (`G ⊊ U`) is structurally unavailable, and the single-phase partial coverage was an artifact of the flattened keying, not evidence of a selective relation. The seam explanation for the failure is refined: the phase lift does represent the boundary (E1; 2→7 offices), but representation alone cannot produce selectivity. Direction assignment was not attempted (BL-035 carried). No amendment is proposed by this memo.

## 4. E3 — D7 pairing (hypothesis-tier preserved): asymmetry found

- **Analogue audit:** no D7 grant exists. `analogue-R` constructed from the 14 D7 seat-contact rows (parent `h = d`), audited in the artifact, labeled `hypothesis-analogue`; the 7-edge modal orbit recorded; parity-with-D4-grant claims forbidden (OD-3).
- **Anchored analogue:** 6 kernel pairs (mask rotation) covering offices {0,1,2,4,5,6} → 12/14 contacts; 2 missed (office 3) → `not_derived@anchored-analogue`.
- **Seam analogue:** the same 6 offices (12 realizations). The missing office 3 needs the tail–head pair `(127, 4033)`, which is a shift-6 relation — outside the patch's ±1 flank structure. Unlike the D4 A0 cycle, the D7 rotation chain does not close (its closure relation `M(4033)=127` is modal, not rotational). No coverage gain at the seam → `not_derived@seam-analogue`.
- **Contract layer:** D7 has no `CONSTRUCTS` seam provenance → empty expected seam domain → the frozen contract's `incomplete_or_anomalous` clause applies (`:2112`): the D4 contract is inapplicable to D7 at the seam-observation layer.

**Symmetry verdict:** route-level symmetry (both poles show the seam keying broadening coverage), input- and closure-level **asymmetry** (D4 completes its cycle at the seam and collapses to restatement; D7's orbit does not close under rotation and remains under-covered even at the seam). Per the branch table, the asymmetry is itself a finding requiring interpretation; D7 stays hypothesis-tier and this probe produces no D7 verdict.

## 5. E4 — wall census: NO_CHANGE

12/12 phases: zero D–D fixed-degree applications (the BL-029 wall stands at every phase; pre-registered null met). D–D modal 49 anchored / 588 lifted; Family-A (R1/L1) incidence touching D anchors 76 anchored / 912 lifted, reported separately per OD-4 and never called dissolution. The 456 fixed-degree applications touching exactly one D anchor are all D→satellite (no anchor-role endpoint), context only. Fail-loud path not triggered.

## 6. Rulings (maintainer, 2026-10-09)

- **OD-C1 (the fork) — RATIFIED BOTH AS CO-CANONICAL AT THEIR OWN SCOPE.** Free-context = the boundary-representation reading (`restatement_signature` / overshoot@seam); strict-degree = the frozen-reproduction control (`not_derived`). Both carried side-by-side in §3.5; neither supersedes. The fork is the finding.
- **OD-C2 (D7 analogue adequacy) — ADEQUATE AS LABELED.** Hypothesis-analogue, construction audit on record, non-closure reported as analogue-bound. The asymmetry finding stands; a different analogue construction might close differently — recorded as a limitation, not a disqualifier.
- **OD-C3 (fa/ti closure asymmetry) — RECORDED AS A NAMED STRUCTURAL FINDING.** The poles fail differently (fa: seam over-generation; ti: orbit non-closure). Hypothesis-tier interpretation permitted (genuinely different boundary mechanics possible); no claim event; feeds the governs semantic layer (rows 8/10 territory) as measured data.
- **OD-C4 (amendment) — CONFIRMED: NO AMENDMENT FROM PHASE C.** The new-failure-mode branch pre-registered no amendment event; the finding itself says why — the obstruction is in the contract, so amending D4's record would be premature before the contract-level question is addressed. The D4 record stands; the finding is the deliverable.

## 7. Bounded statement of what Phase C did NOT accomplish

No D4 record amendment; no governs admission; no D7 verdict (hypothesis-tier preserved); no wall-dissolution claim; no topology/canon/runtime/schema/Court/Neo4j writes; no G1 movement; no directional-semantics assignment; no claim that the seam explanation is confirmed or falsified beyond the branch-table reading; no frame/polarity input. Findings and sandbox artifacts only. Landing-time packaging (manifest/checksums regen) is a separate step outside this sandbox scope.

## 8. Result in one paragraph

The retry is fully specified, calibrated exact, and outcome-bearing: the phase lift makes the D4 boundary derivable-representable (E1 PRESENT; the seam keying completes the kernel relation to all seven offices), but the completed route collapses to the full granted relation (`G_A = U`, `restatement_signature`), extending the pre-registered restatement finding to both routes at every keying; the strict-degree control reproduces the frozen failure exactly; T-C at the seam overshoots (5 generated flank relations beyond the observed seam groups) while every observed seam is realizable; D7's mirror is asymmetric (its orbit closure is not rotational, leaving office 3 unqualified, `not_derived@seam-analogue`; contract seam clause inapplicable); the wall stands at all 12 phases. All three possible outcomes were legitimate; the measured outcome is the **new-failure-mode** branch, with the reading fork ruled co-canonical rather than resolved.

## 9. Closing frame

The arc from D4's failure to this finding is complete and honest: the original record said `not_derived` and was right; the phase machinery now shows exactly where the contract's selection fails and why it failed differently under different representations; the boundary layer is real, measured, and its two poles obstruct structurally differently. No amendment, no verdict — but the governs question now has what it never had before: **a mechanically characterized obstruction.** The single-phase under-coverage (4/14) and the seam over-generation (14/14 via restatement) are two views of the same contract property: the routes have no selection mechanism separating the 14 observed contacts from the 28-key granted domain in a way that survives representation change. Whether such a representation-stable selection mechanism exists, and what it looks like, is the next question in the governs program (captured as BL-055, `scrum/BACKLOG.md`). The second chance did not produce the derivation — it produced the precise statement of why the first attempt could not succeed and what the real problem is.
