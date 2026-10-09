# BL-055 — D4 contract selection-mechanism review: findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts. Sandbox/analysis only. D4's registered `not_derived` (`provenance/DECISION_LEDGER.md:2195-2252`) is unchanged and may be amended only by its own claim event. D7 remains hypothesis-tier. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7, polarity synthesis) was not used as design input; it is available as interpretation vocabulary only. `BL-056` is queued as a design item, not executed.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-d4-selection-review.mjs` | deterministic builder (canonical serialization + fingerprint `6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745`) |
| Artifact | `orrery/src/generated/d4-selection-review.v1.json` | `status: planning_evidence` (raw-byte SHA-256 `40a1d7586c8643bac351a1b70c09fce35a977ce200888d08a40d2cc0022649d8`) |
| Validator | `orrery/scripts/validate-d4-selection-review.mjs` | independent re-derivation from the eight pinned sources |
| Pins | `orrery/src/d4-selection-review.test.ts` | 11 vitest pins (scope, domain, split, axes, T-B, T-A, cycle, OD-3, synthesis, fences) |
| Wiring | `package.json` `orrery:d4-selection-review:check`; `orrery/package.json` `check`/`build` | gate runs after phase-c-probe, before derived-path-graph, then `tsc` |

Verification: `npm run orrery:d4-selection-review:check` PASS (generator `--check` fresh, validator PASS); the 11 pins pass. Landing-time packaging (manifest/checksums regen) is a separate step outside this sandbox scope.

## 2. Step 0 — execution scope (gating): PATCH-ONLY CONFIRMED; Hypothesis B pre-falsified

S0.1 — the E2 derivation contexts are **patch-restricted `{11,0,1}`**, not global-12. Three independent confirmations: (i) the artifact itself (`e2Retry.keying.patchPhases`, per-phase calibration at 11/0/1, all 9 seam pairs' phases within the patch); (ii) builder-by-construction (`scripts/build-phase-c-probe.mjs` `PATCH_PHASES=[11,0,1]`, `ALL_PHASES` used only by E4); (iii) validator agreement (`orrery/scripts/validate-phase-c-probe.mjs` `PATCH=[11,0,1]`) and the pre-registered spec (`scrum/plan/bl-033-phaseC-lifted-keying-spec.md` §2.3).

S0.2 — within the patch, calibration is identical at all three phases (8 keys; cells 0/10/4/0); the artifact carries `G_A@seam` as a union only; the OD-3 per-phase reconstruction (§6) shows the union is reached at phases 1 and 11 (all 7 offices) while phase 0 reaches only offices {0,6} (the frozen 8 keys). The over-generation is phase-independent at the flanks; the seam extension's phase structure (T2 edges at (1,11)) is real but is not an observed-set discriminator.

Verdict: **H-B (global phase leakage) is pre-falsified by execution scope** — the bounding was in place; the saturation is intrinsic to the seam-extended contract. H-B is carried as considered-and-adjudicated, not adopted. Scope language is tightened: **"free-context" = keying mode; "patch" = phase scope — never conflated** (the same ambiguity class as tonic-vs-collection-root).

## 3. W1 — the 28-key table

U = 28 granted keys = 7 offices × 4 satellites; O = 14 observed = **exactly 2 per office** (all seven offices). Frozen T-A generates 8 keys (offices 0 and 6 only, 4 observed + 4 not); T-B generates U.

| Office | Parent h (A1) | Satellites (observed bold) | observed |
|---|---|---|---|
| 0 | 1371 | 1243, **1339**, 1627, **2395** | 2 |
| 1 | 1749 | 1747, 1753, **1765**, **3497** | 2 |
| 2 | 2733 | 2669, **2717**, 2861, **3245** | 2 |
| 3 | 1461 | 731, **949**, **1465**, 2921 | 2 |
| 4 | 1707 | 1691, **1703**, 1739, **1835** | 2 |
| 5 | 1389 | **695**, 877, **1261**, 2413 | 2 |
| 6 | 2901 | 2893, **2899**, 2917, **2965** | 2 |

Per key the artifact tabulates: O-membership, frozen T-A/T-B membership, contract cell, forte, interval vector, satellite office, containment degree, bridge-subnode count, cornerstone-subnode count, seam incidence, and the key's E-parent set. The 2-per-office fact is exact at every office.

## 4. W2 — axis hunt: one clean split, one near-miss, six fails/constants

| Axis | Result | Confusion (tp/fp/fn/tn) |
|---|---|---|
| **setClassFamily** | ✅ **CLEAN 14/14 SPLIT** | 14/0/0/14 |
| containmentDegree | CONSTANT (uniform mesh) | — |
| bridgeSubnodes | FAIL (one-sided 10/14 vs 0/14) | 10/0/4/14 |
| cornerstoneContainment | **FAIL — near-miss (OD-1)** | 12/0/2/14 |
| kernelWindowMembership | NON-APPLICABLE (axis absent at this layer) | — |
| officeElementPairing | CONSTANT (equal ∀28) | — |
| phaseContextMultiplicity | UNIFORM (12 phases, 7-fold) | — |
| seamIncidence | FAIL | 4/2/10/12 |
| satelliteRoleComposite | FORTE-ONLY (columns summarized) | — |

**The split:** all 14 observed keys are satellites of Forte class **7-27** (interval vector `<344451>`); all 14 unobserved are **7-31** (`<336333>`). Globally the 462-record ledger contains exactly fourteen 7-27 (all observed) and fourteen 7-31 (all unobserved), all A1 satellites. The predicate is intrinsic (interval content), Tn-invariant, keying-invariant, and non-circular (canonical-ledger fields, not observation membership).

**Near-miss handling (OD-1):** cornerstone containment (≥1 of the five 5-35 windows) selects 12/14 observed with 0/14 unobserved; the two missed observed keys (2395, 2899) are exactly the two zero-seam-incidence observed keys. Per OD-1 this is **recorded as a fail with the near-miss flagged**; no softened predicate is proposed. The under-cut: a predicate that misclassifies its own side is not almost a predicate.

**The build-phase correction (recorded).** The planning pass's execution-report numbers for three containment axes were computed with a pitch-class-order lookup slip and were wrong (containment degree was reported as varying 1–7; it is constant 15; bridge as 8/4; it is one-sided 10/14 vs 0/14; cornerstone as 4/14; it is the 12/14 near-miss above). The build-phase recomputation from `derived/hypergraph/bipartite-inclusion-v1.json` (`node.subnodes` + subnode flags; 462×15 = 330×21 = 6,930 uniform mesh) corrected all three. The primary finding (set-class split), the T-B/T-A/cycle geometry, the OD-3 diagnostic and the synthesis are unaffected; this memo and artifact carry the corrected numbers.

## 5. W3 — T-B proof: the construction-join is definitionally a restatement generator

Frozen join (`scripts/d4-derivation-engine.mjs`): emits `(parentOffice, s)` for every `r ∈ R` whose `r.source` has two distinct E-edges in, with distinct ids and distinct sources. Measured from the landed projection: **every one of the 7 A1 anchors has exactly 2 distinct A0 CONSTRUCTS parents** (1371←{1387,2741}, 1389←{1387,1453}, 1461←{1453,1717}, 1707←{1451,1709}, 1749←{1717,2773}, 2733←{1709,2741}, 2901←{1451,2773}) with 4 R-satellites each → 2 ordered pairs × 4 satellites × 7 anchors = **56 witnesses = U**. The join never reads `s` except as emitted payload. **No predicate on T-B can select a proper subset; it is a restatement generator by construction.** This mechanizes the pre-registered impossibility note (`provenance/DECISION_LEDGER.md:2163-2164`).

Deep structure: the 7 E-parent pairs are exactly the 7 edges of the closed A0 transposition cycle (§6) and are unordered-identical to the Phase-C seam-pair geometries. T-A@seam and T-B enumerate the same underlying pair structure — that is why both collapse to U.

## 6. W4 — T-A coverage geometry and the cycle

Frozen T-A needs `rotateMaskZ12(a)=b` (a +1-semitone mask rotation) with office straddle delta 2. Over the 7 A0 anchors, **`rot(a)` lands in-A0 for exactly 2 of 7**: rot(2741)=1387 (offices 1→6, k=0) and rot(2773)=1451 (0→5, k=6); the other five images fall outside A0. The kernel-twin relation therefore has exactly 2 edges on A0, yielding 2 parents × 4 satellites = 8 keys (4 observed, 4 not) — the frozen under-coverage is a **T1-link limitation**, not a predicate failure (T-A has no set-class selectivity at all).

The 7 A0 anchors form one closed transposition cycle, `1387 —T2→ 1453 —T2→ 1717 —T2→ 2773 —T1→ 1451 —T2→ 1709 —T2→ 2741 —T1→ 1387` (5×T2 + 2×T1, sum 12). The two T1 links are exactly the frozen pairs; the five T2 links are exactly the seam's (1,11) extreme-flank pairs (one per office 1–5). What the flank pairs "have that the frozen keying missed" is nothing but interval 2: the frozen predicate is T1-only by definition, so T2-adjacent pairs are invisible to it at any office.

**OD-3 diagnostic (per-phase, read-only; published union remains canonical):** phases 1 and 11 each touch all 7 offices (28 keys); phase 0 touches only {0,6} (8 keys = frozen bytes); a-side mirrors c-side. Verdict: the seam extension's phase structure is real but not an O-discriminator; center-phase restriction reproduces the frozen under-coverage.

## 7. W5 — synthesis: the predicate exists; the contract cannot express it

**Representation-stable predicate: `P(s) = [forte(s) = 7-27]`.** Under the frozen keying, T-A ∩ P = 4/14 (the T1-link limit); under the seam keying, P ∩ G_A@seam = O exactly (complete at full representation). P is sound under both keyings: it never selects an unobserved key; the frozen miss is geometric.

**Three independent blockers** (each sufficient for `not_derived`):
1. **frozen-geometry** — T-A reaches only offices 0/6 (8 keys; 4/14 observed);
2. **tb-definitional** — T-B = U regardless of any predicate; `restatement_signature` (C strict false) blocks `filter_plus_geometry`/`derived`;
3. **tc-overshoot** — seam T-C strict-inexact (7 generated vs 2 observed); C=false blocks every positive row.

**Verdict:** the failure is **route geometry** — no registered route conjoins a selective predicate with coverage. It is not topology (the lift works), not semantics (the predicate is structural and intrinsic), not phase machinery (the over-generation was characterized cleanly).

**Pre-registered no-predicate branch (Addition 2):** had no axis split 14/14, the finding would have been that O is distinguished by derivation history (recorded contacts) rather than intrinsic structure, reframing GOVERNS as a recorded relation. **It did not fire**: the distinction is structural and located in the satellite's set class. Recorded in the artifact as `synthesis.noPredicateBranch.fired = false`.

**BL-056 (queued design item; not executed here):** new-route design — a contact route conjoining full cycle-edge traversal (T1+T2) with P(7-27), generating exactly O with G strictly inside U; T-B replaced or P-restricted; T-C scope adjudicated. **Hard constraint:** the design must break the cycle-edge ↔ construction-pair identity (W3) — a route that merely joins the same A0 cycle-edges restates U regardless of predicate. Any D4 amendment remains a separate future claim event gated on that work.

**Standing:** the predicate finding stands entirely on its own merits — a clean, intrinsic, Tn-invariant, representation-stable set-class partition of the satellite layer, verified non-circularly from the canonical ledger, that the frozen contract's routes could never express. No resonance required; the predicate is the result.

**Closing observation (OD-5, observation only, not evidence):** O's predicate class 7-27 is the same-number complement sibling of admitted bridge class 5-27 (landed binding concept; observation only, not evidence).

## 8. Grounding receipt

- **Ninth catch (maintainer-prose class).** The research-exchange ROE-correlation claim was checked against landed bytes before memorialization and failed twice over plus a label error: (a) "7-27's IV `<344451>` is the GOV-517-eligible relation's own vector" — the string occurs nowhere in the repo and the census records carry no interval vectors; (b) "same set-class family as the D-tier anchors" — all 49 D-anchors are `7-1/7-8/7-Z12/7-15/7-Z17/7-22/7-Z37` (D4 anchors all `7-Z17`), zero 7-27; (c) the quoted prime `{0,1,3,5,8}` is 5-27's, not 7-27's. Rescued residue (OD-5): the same-Forte-number complement binding, carried as the one-line observation above. Lesson recorded: the true finding needed no embellishment.
- **Tenth catch (analyst-prose class).** The planning pass's containment-axis numbers (containment degree, bridge, cornerstone) were computed with an unsorted pitch-class-key lookup and corrected at build (§4). Caught by recomputation from the landed bipartite artifact; primary findings unaffected.
- **Step-0 pointers:** `orrery/src/generated/phase-c-probe.v1.json` (`e2Retry.keying.patchPhases`, calibration per-phase, seam pairs); `scripts/build-phase-c-probe.mjs` (`PATCH_PHASES` vs `ALL_PHASES`); `orrery/scripts/validate-phase-c-probe.mjs` (`PATCH`); `scrum/plan/bl-033-phaseC-lifted-keying-spec.md` §2.3.
- **Contract pointers:** `provenance/DECISION_LEDGER.md:2054-2075` (comparators), `:2104-2117` (outcome rows), `:2127-2130` (freeze guard), `:2163-2164` (impossibility note), `:2195-2252` (ENTRY 10); `provenance/OBSERVATION_LEDGER.md:485-532` (OBS-023).
- **Domain pointers:** `qa/d4-production-receipt.json` (U/O, cells, route accounting); `qa/d4-production-generation.json` (projection, witnesses); `canonical/universal-heptatonic-ledger.csv` (forte, interval vector, offices); `canonical/universal-network-data.json` (R/E/SEAT_CONTACT); `derived/hypergraph/bipartite-inclusion-v1.json` (containment); `seven-governors-mutation-algebra-audit/audit/operator-applications.csv` (seam incidence).

## 9. Findings inventory

1. **Step 0 scope:** E2 was patch-only (three confirmations); H-B pre-falsified.
2. **The predicate:** `P(s) = [forte(s) = 7-27]`, clean 14/14, intrinsic, representation-stable, non-circular.
3. **T-B is definitionally a restatement generator** (56 witnesses; never reads `s`); the cycle-edge ↔ construction-pair identity explains the collapse of both routes.
4. **T-A under-coverage is a T1-link limitation** on a closed 7-edge A0 cycle (5×T2 + 2×T1).
5. **OD-3:** over-generation is phase-independent at the flanks; the center phase reproduces the frozen set.
6. **Three independent blockers** stand between the predicate and any positive D4 outcome; the finding is route geometry.
7. **BL-056 queued** with the predicate, the cycle identity and the hard constraint as inputs.

## 10. Bounded statement of what this review did NOT accomplish

No D4 record amendment; no new derivation execution (the route variant is BL-056 design work, itself gated); no governs admission; no INV-5 graduation; no M-walkability promotion; no topology/canon/runtime/schema/Court/Neo4j writes; no G1 movement; no directional-semantics assignment; no frame/polarity design input; no claim beyond the landed frozen bytes. Session prose is context, not evidence.

## 11. Result in one paragraph

Frozen at `not_derived`, D4's contract was reviewed read-only against its landed bytes. Step 0 confirms the Phase-C retry ran patch-restricted, killing the phase-scope-artifact hypothesis with evidence. The 28-key hunt finds a clean, intrinsic, representation-stable predicate the contract could never express: the 14 observed contacts are exactly the 7-27 satellites, the 14 unobserved exactly the 7-31. The pair of route analyses explains why: T-B's construction-join is definitionally a restatement generator (every A1 anchor has exactly two E-parents), and T-A's kernel-twin sees only the two T1 edges of the closed A0 transposition cycle, missing the five T2 edges that the seam keying exposes. The contract needs a new route, not a filter — BL-056 captures the design with the predicate and the cycle identity as inputs and the cycle-edge ↔ construction-pair identity as its hard constraint. The D4 story now rests where it should: not derived, but fully explained — the predicate was always there, in the satellites' set class; the routes just could not see it.
