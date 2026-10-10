# BL-056 — D4 new-route design validation (R2): findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts. Sandbox/analysis only. D4's registered `not_derived` (`provenance/DECISION_LEDGER.md:2195-2252`) is unchanged and may be amended only by its own claim event. R2 is validated as a *design*, not admitted as a contract route; route admission is a separate ceremony. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7, polarity synthesis) was not used as design input; it is available as interpretation vocabulary only.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-d4-r2-route-review.mjs` | deterministic builder (canonical serialization + fingerprint `e25851f975a84a290bc4794916dd16ead7d99c7f3694bae21b7c6bb6f13e91b3`) |
| Artifact | `orrery/src/generated/d4-r2-route-review.v1.json` | `status: planning_evidence` (raw-byte SHA-256 `5a1a787eb47a939d8f1ba727689a9cc2db0adb21fe716d5e1600d7a19406c4b3`) |
| Validator | `orrery/scripts/validate-d4-r2-route-review.mjs` | independent re-derivation (own R/E re-extraction from the canonical network, own cycle walk, own gate re-evaluation; fail-loud; mutation-verified) |
| Pins | `orrery/src/d4-r2-route-review.test.ts` | 10 vitest pins (header, route, per-office, G1–G5, constraint table, fences) |
| Wiring | `package.json` `orrery:d4-r2-route-review:check`; `orrery/package.json` `check`/`build` | gate runs after `d4-selection-review:check`, before `derived-path-graph:check` |

Verification: `npm run orrery:d4-r2-route-review:check` PASS (generator `--check` fresh, validator PASS); the 10 pins pass; full `orrery:check` exit 0; orrery suite 264 green (254 prior + 10). Mutation probes: a fabricated `selected` list, a flipped cycle-twin hold, a promoted midpoint exactness, and a corrupted cycle-walk count were each rejected by the validator (after fingerprint repair) at the corresponding content check. Landing-time packaging (manifest/checksums regen) is a separate step outside this sandbox scope.

## 2. The route, restated

> **R2(h) = {(o(h), s) : s ∈ satellites(h) ∧ P(s)}** — for each A1 anchor `h`, the derived contacts are exactly its satellites satisfying `P(s) = [forte(s) = 7-27]`.

Derivation: (1) extract the anchor's two A0 CONSTRUCTS parents (the cycle edge); (2) verify `cycle_twin(a, b, d) ⟺ rotateMaskZ12^d(a) = b` at the edge's interval `d` — gated, per-office justification tier; (3) select the `P` satellites; (4) emit contacts. The cycle edge is *derivation ground*; the predicate is *selection within*. The route is P expressed as a derivation over the cycle geometry.

## 3. G1 — cycle-twin verification: the T2 question answered

`rotateMaskZ12` is +1 semitone on the pitch mask, so `rotateMaskZ12^d` is the edge's transposition interval by construction. The build-phase verification **holds at all 7 edges** — no office requires the predicate-only fallback:

| Office | Cycle edge (walk direction) | d | Check | Holds | Justification |
|---|---|---|---|---|---|
| 0 | 2741 → 1387 | 1 (T1) | `rotate¹(2741) = 1387` | ✅ | cycle-twin-verified |
| 1 | 1717 → 2773 | 2 (T2) | `rotate²(1717) = 2773` | ✅ | cycle-twin-verified |
| 2 | 1709 → 2741 | 2 (T2) | `rotate²(1709) = 2741` | ✅ | cycle-twin-verified |
| 3 | 1453 → 1717 | 2 (T2) | `rotate²(1453) = 1717` | ✅ | cycle-twin-verified |
| 4 | 1451 → 1709 | 2 (T2) | `rotate²(1451) = 1709` | ✅ | cycle-twin-verified |
| 5 | 1387 → 1453 | 2 (T2) | `rotate²(1387) = 1453` | ✅ | cycle-twin-verified |
| 6 | 2773 → 1451 | 1 (T1) | `rotate¹(2773) = 1451` | ✅ | cycle-twin-verified |

**OD-R2-1 adjudicated:** the generalized `cycle_twin(a, b, d)` relation covers the full cycle. The structural expectation held — the T2 edges connect seeds transposed by exactly 2 semitones, and `rotateMaskZ12²` is exactly the +2 mask rotation. `justificationSummary: {cycleTwinVerified: 7, predicateOnly: 0}`; `fallbackOffices: []`. The per-office tier field remains in the artifact so that any future replacement relation can flip an office's tier without touching the route output; the tier is the route's explanatory ground, not its correctness (G2/G3 prove correctness independently).

## 4. G2/G3/G4 — the output proofs

**G2 (predicate):** every office has exactly 2 satellites with `forte(s) = 7-27` — `{2, 2, 2, 2, 2, 2, 2}`, total 14, all 7 offices at two.

**G3 (coverage):** `G_R2 = O` exactly — 14 generated keys, 14 matched, `missing: []`, `extra: []`. The route generates the complete observed contact set and nothing beyond it. This is the route's correctness proof.

**G4 (non-collapse):** `|G_R2| = 14 ≠ 28 = |U|`, strict subset, and T-B's output remains U (28). The cycle-edge ↔ construction-pair identity is broken at the **satellite-reading level**: T-B's join "never reads `s` except as payload" (BL-055 W3) and therefore restates U regardless of predicate; R2 conjoins `P` and selects within the same edge set. **Same cycle edges, different outputs — the identity is broken by selection, not by edge substitution.**

## 5. G5 — T-C midpoint census

Every cycle edge's midpoint (`midZ7` of its endpoint offices) equals the office of the anchor it constructs — an invariant asserted in the artifact. Census: **7 realized, 2 observation-exact, 5 seam-derived predictions**.

| Midpoint office | Cycle edge | d | Relation key | Tier |
|---|---|---|---|---|
| 0 | 2741 ↔ 1387 | 1 (T1) | `A0:1387:2741:0` | **exact** (frozen observation) |
| 1 | 1717 ↔ 2773 | 2 (T2) | `A0:1717:2773:1` | realized; exact unverified — prediction marker |
| 2 | 1709 ↔ 2741 | 2 (T2) | `A0:1709:2741:2` | realized; exact unverified — prediction marker |
| 3 | 1453 ↔ 1717 | 2 (T2) | `A0:1453:1717:3` | realized; exact unverified — prediction marker |
| 4 | 1451 ↔ 1709 | 2 (T2) | `A0:1451:1709:4` | realized; exact unverified — prediction marker |
| 5 | 1387 ↔ 1453 | 2 (T2) | `A0:1387:1453:5` | realized; exact unverified — prediction marker |
| 6 | 2773 ↔ 1451 | 1 (T1) | `A0:1451:2773:6` | **exact** (frozen observation) |

The two `exact` entries are exactly the frozen observed seam relations (`comparison.tC.matches`); the five unverified entries each carry a `prediction` marker naming the confirmation surface: `predicted: A0:…; confirmable against the D4 A0 seam-relation observation surface (comparison.tC.observedRelations, qa/d4-production-receipt.json), which currently records only the two T1 relations`. **Seam cross-check:** the Phase C seam keying's T-C relation inventory (7 generated) is set-identical to the route's realized midpoint set; its observed subset (2) is set-identical to the exact subset; `realizationOfObserved = true`. The geometry realizes all 7; the observations confirm 2; the 5 are testable predictions.

## 6. Constraint satisfaction

| Constraint | How R2 satisfies it | Evidence | Satisfied |
|---|---|---|---|
| Predicate P incorporated | step 3 SELECT *is* P; the route doesn't incorporate P — it is P as a derivation | G2 (2/office × 7) + G3 (output = O) | ✅ |
| Cycle-edge traversal T1 + T2 | step 2 traverses all 7 cycle edges (5×T2 + 2×T1); the edge's interval `d` drives the cycle-twin check | G1 (7/7 verified) | ✅ |
| Break cycle ↔ pair identity | satellite-reading selection (P conjunction); T-B is satellite-blind; same edges, 14 ≠ 28 = U | G4 | ✅ |
| T-C midpoint scope | 7 realized, 2 exact, 5 labeled predictions with confirmation markers | G5 | ✅ |

## 7. What R2 does NOT accomplish (bounded)

- **No D4 amendment.** R2 is a design; the `not_derived` record amends only via its own claim event, requiring R2 to be admitted (separate ceremony), built into the contract (separate implementation), and executed (separate derivation run with its own evidence).
- **No route admission.** This is a design validation at `planning_evidence`; no route is admitted to the contract.
- **No registered derivation execution.** `G_R2` is computed in-sandbox over pinned sources; no contract run occurred.
- **No governs admission.** The route derives contact geometry, not the GOVERNS relation itself.
- **No wall dissolution.** R2 traverses the A0 cycle and emits A1 contact keys; no D–D edges; the boundary wall (BL-029) is untouched.
- **No directional semantics.** The polarity synthesis (§2.7) remains interpretation vocabulary, never design input.
- **No manifest/packaging.** Landing-time packaging is a separate step.

## 8. Grounding receipt

- **Primary sources:** `qa/d4-production-receipt.json` (U/O, cells, route accounting, observed seam relations); `qa/d4-production-generation.json` (R/E projection, frozen witnesses); `canonical/universal-heptatonic-ledger.csv` (forte per satellite); `canonical/universal-network-data.json` (validator-side R/E re-extraction); `orrery/src/generated/d4-selection-review.v1.json` (BL-055: predicate, cycle geometry, per-anchor E-parents); `orrery/src/generated/phase-c-probe.v1.json` (seam pairs, T-C relation inventory, strict-degree control). All six SHA-bound in the artifact and re-checked by the validator.
- **Engine reuse:** `midZ7` is imported from `scripts/d4-derivation-engine.mjs` (the frozen T-C midpoint definition); `rotateMaskZ12` is pinned at the Number/mask level in builder and validator, matching the BL-055 builder convention and the engine's BigInt-level primitive.
- **Cycle walk:** `2741 → 1387 → 1453 → 1717 → 2773 → 1451 → 1709 → 2741` — closes, 5×T2 + 2×T1, interval sum 12; matches the BL-055 recorded cycle exactly.
- **W3 assertion:** every office's unordered E-parent pair is asserted set-equal to its cycle edge pair (fail-loud if drift) — the identity that the route must traverse.

## 9. Findings inventory

1. **G1:** the generalized cycle-twin relation `rotateMaskZ12^d(a) = b` holds at all 7 cycle edges, including all 5 T2 edges; per-office justification is uniformly `cycle-twin-verified`; OD-R2-1 answered (the +2 mask rotation is the correct T2 generalization).
2. **G2:** the predicate selects exactly 2 satellites per office at all 7 offices (14 total).
3. **G3:** `G_R2 = O` exactly — the D4 contact geometry is derivable through a route that reads the satellites' set-class identity.
4. **G4:** non-collapse proven — 14 ≠ 28 = U; the cycle-edge ↔ construction-pair identity is broken by satellite-reading selection, not edge substitution.
5. **G5:** 7 midpoint relations realized (midpoint = constructed office invariant), 2 observation-exact, 5 seam-derived predictions with confirmation-surface markers; seam inventory cross-check green.
6. **Constraint table:** all four constraints satisfied, each with gate evidence, in-artifact.
7. **The finding the arc produced:** the governs relation has *selection structure* — the 7-27 satellites are the ones that contact D4 anchors, and that distinction is a property of their interval content, not their derivation history. R2 is the first route under which the D4 contact geometry is derivable.

## 10. Bounded statement of what this review did NOT accomplish

No D4 record amendment; no route admission; no registered derivation execution; no governs admission; no INV-5 graduation; no M-walkability promotion; no topology/canon/runtime/schema/Court/Neo4j writes; no G1 movement; no directional-semantics assignment; no frame/polarity design input; no manifest regen; no claim beyond the landed frozen bytes. Session prose is context, not evidence.

## 11. Result in one paragraph

The R2 filtered-cycle-walk design is validated. Over the 7 A0 cycle edges, the generalized cycle-twin relation `rotateMaskZ12^d(a) = b` holds at every office — the T2 question is answered affirmatively, with no predicate-only fallbacks — and the predicate `P(s) = [forte(s) = 7-27]` selects exactly 2 satellites per office, generating `G_R2 = O` exactly (14 keys, `missing: []`, `extra: []`) while breaking the cycle-edge ↔ construction-pair identity by satellite-reading selection (14 ≠ 28 = U). The T-C midpoint census carries 7 realized relations, 2 observation-exact, and 5 seam-derived predictions with explicit confirmation markers. All four design constraints are satisfied with in-artifact evidence. What remains is not design work: R2 is a validated candidate route awaiting its own admission ceremony before any D4 amendment event, and its five unverified midpoints await whatever D4 contact data can test them. The design is ready; the claim is not made.
