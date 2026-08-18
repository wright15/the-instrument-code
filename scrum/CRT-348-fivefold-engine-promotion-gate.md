# CRT-348 — Fivefold engine promotion gate plan

**Status:** Done · **Priority:** Medium · **Points:** 8 · **Epic:** pre-EPIC-400 follow-on (planned; no epic activated)
**Depends on:** CRT-347 (Fivefold Capability Teleology planning evidence) · **Blocks:** the Fivefold promotion execution task
**Precondition:** CRT-347 closed with all Stage 1 acceptance criteria passing (done 2026-08-17: validator 22/22, tests 16/16, root validation 411/411).

## Story

As the release owner, I want a source-driven, maintainer-reviewable promotion
gate plan for the ten `fivefold_engine` items that
`schemas/court-admission-contract.json#fivefoldFieldDisposition` marks as
`eligibleForPromotionAtCrt309`, so the Fivefold engine can be promoted only
after review evidence exists for every item, without re-opening CRT-309 scope
or touching frozen/admitted surfaces.

## Gate nature

This is a **gate plan, not promotion execution**. It copies the
source-controlled inventory verbatim, maps every item to current machine
enforcement and validation evidence, fixes the exclusion list, and specifies
the outputs an execution task may create **after maintainer sign-off**.

## 1. Source-driven promotion inventory (verbatim)

Read from `schemas/court-admission-contract.json:138-154` (machine authority),
cross-checked at build time by the CRT-347 generator
(`promotionInventoryReplay`). The source array contains **ten** items:

```text
1. fivefold_engine.physical_quantity_claim=false
2. fivefold_engine.pole_order
3. fivefold_engine.bit_semantics
4. fivefold_engine.canonical_states
5. fivefold_engine.canonical_transitions
6. fivefold_engine.geometry.kappa_formula
7. fivefold_engine.geometry.paired_mask_hamming_formula
8. fivefold_engine.geometry.signed_gram_matrix
9. fivefold_engine.geometry.canonical_path_size
10. fivefold_engine.guards
```

`remainProposed` (excluded from this gate, copied verbatim):

```text
- fivefold_engine.macro_bracket
- fivefold_engine.controller
- fivefold_engine.runtime_cycle
```

Earlier prose citing "eight" items is stale; the binding count is ten and
includes `fivefold_engine.physical_quantity_claim=false` first.

## 2. Per-item mapping

| # | Item | Authoritative source | Current machine enforcement | Validation evidence | Proposed contract field | Known exclusions | Promotion risk |
|---|---|---|---|---|---|---|---|
| 1 | `physical_quantity_claim=false` | `seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml` (frozen; digest `9cbf038c…`) | `fivefold-engine.schema.json:17,31` requires the field; CRT-347 generator rejects non-false (`engine_physical_claim_invalid`); `court-admission-contract.schema.json:269` pins the literal | `tests/test_fivefold_capability_teleology.py` (FCT-010); toolkit package validation | `physicalQuantityClaim: {const: false}` | No electromagnetic, thermodynamic, or energy-equivalence meaning | Low |
| 2 | `pole_order` | `fivefold_engine.yaml#fivefold_engine.pole_order` (Mars/Fire, Jupiter/Air, Venus/Water, Saturn/Earth + function + diagnostic question) | `schemas/court-runtime-policy.json:76` `poleOrder` (admitted, fingerprint `90431c…`); `src/governor/court_runtime.py:39` `COURT_POLE_ORDER` + policy check `court_policy_pole_order_mismatch` | CRT-347 FCT-005/FCT-006; pentatonic audit `representationChecks`; runtime policy tests | `poleOrder` array of four entries with element/function/diagnosticQuestion | Mercury never enters `poleOrder`; Sun/Moon excluded | Low |
| 3 | `bit_semantics` | `fivefold_engine.yaml#fivefold_engine.bit_semantics` (`0` External, `1` Internal) | Runtime pole vectors `"0000".."1111"` with `court-runtime-types.schema.json` enum; internal-poles derivation `COURT_POLE_ORDER[:index]` (`court_runtime.py:300`) | `tests/test_court_runtime_transitions.py`; policy positions replay (CRT-347 FCT-005) | `bitSemantics` const map + pole-vector enum | Zodiac sign names (Aries…Capricorn) are **not** part of bit semantics; the zodiac half stays prose/proposed per pre-EPIC-400 audit Distinction 2 | Medium (keep zodiac half excluded) |
| 4 | `canonical_states` | `fivefold_engine.yaml#fivefold_engine.canonical_states` (C0–C4, vectors, internal_poles, kappa_court) | `court-runtime-policy.json:69-75` `positions` (5, fingerprint-pinned); `court_runtime.py:40` `COURT_POLE_VECTORS`; policy schema exact enum | `tests/verification/test_court_admission_contract.py`; CRT-347 FCT-005; harmonic registry `kappaCourt` | `canonicalStates` array of exactly five records | The other 11 off-path 4-bit vectors remain rejected (audit Distinction 3); no fifth bit | Low |
| 5 | `canonical_transitions` | `fivefold_engine.yaml#fivefold_engine.canonical_transitions` (court:C0:C1…court:C3:C4, one pole each, reversible) | `court-runtime-policy.json:77-86` `ordinaryMoves` (8 adjacent); `operationAllowList`; runtime adjacency failure `court_policy_move_not_adjacent` (`court_runtime.py:318`) | `tests/test_court_runtime_transitions.py`; CRT-347 `courtParityReplay` | `canonicalTransitions` array of four adjacency pairs | `court:translocate` stays separately evidence-gated (R7/L7, 5-23/5-27 routes); no new move types | Low |
| 6 | `geometry.kappa_formula` | `fivefold_engine.yaml#fivefold_engine.geometry.kappa_formula` — `kappa(C_i) = i/4` | `court-admission-contract.json:90-112` `compressionCoordinate` (derivation + exact values + `forbiddenEquivalences`); policy `kappaCourt` + `forbiddenKappaNamespaces`; `court_runtime.py` `COURT_KAPPA` | Harmonic registry `court.kappa_exact` (`harmonic-invariant-registry.json:834`); CRT-347 FCT-010 | `compressionCoordinate` replay (derivation, values, forbidden equivalences) | kappa_court is not C_P, C_H, C_S, temperature, entropy, enthalpy, or free energy | Low |
| 7 | `geometry.paired_mask_hamming_formula` | `fivefold_engine.yaml` — `d_H(C_i,C_j) = 2*abs(i-j)` | Exact `hammingMatrix` computed by CRT-303 package (`harmonic-invariant-registry.json:508`); `court.hamming_path` invariant (`:782`) | Harmonic-invariant validation (admitted CRT-309); `verify_hamming_path` in `seven-governors-harmonic-invariants-v0.1.0/src` | `geometry.hammingFormula` + exact matrix replay | None beyond item scope | Low |
| 8 | `geometry.signed_gram_matrix` | `fivefold_engine.yaml` — `2*I_4` | Exact `gramMatrix` `2*I_4` computed by CRT-303 (`harmonic-invariant-registry.json:482`); `court.gram_matrix` invariant (`:741`) | `verify_court_gram` in harmonic-invariants package; admitted CRT-309 | `geometry.signedGramMatrix` + exact matrix replay | None beyond item scope | Low |
| 9 | `geometry.canonical_path_size` | `fivefold_engine.yaml` — `canonical_path_size: 5` | Policy positions length 5 (schema min/max 5); `COURT_POLE_VECTORS` length 5; five reviewed court-position witnesses in pentatonic audit | CRT-347 FCT-005 (`ordinaryMoveCount: 8` = 4 edges × 2 directions); pentatonic `reviewedRootedWitnesses` | `geometry.canonicalPathSize: {const: 5}` | `full_binary_field_size: 16` is context only; off-path vectors excluded | Low |
| 10 | `guards` | `fivefold_engine.yaml#fivefold_engine.guards` (adjacency, non-adjacent exceptional, Court state ≠ Governor identity, kappa guard literal) | Runtime adjacency + translocation evidence gate (`court_runtime.py:318,327`); policy `forbiddenKappaNamespaces`; admission-contract namespace `nonEquivalence` lists (`court-admission-contract.json:15,24,33,43`) | `tests/test_court_runtime_transitions.py`; admission-contract validation; CRT-347 FCT-009 | `guards` array with pointers to executable checks | Guards are declarative; they do not authorize `macro_bracket`, `controller`, or `runtime_cycle` | Medium (no new runtime authority) |

## 3. Explicit exclusions (not promoted by this gate)

1. `fivefold_engine.macro_bracket` (remainProposed)
2. `fivefold_engine.controller` (remainProposed)
3. `fivefold_engine.runtime_cycle` (remainProposed)
4. Win-condition enforcement (win conditions stay authored teleology, CRT-347)
5. Zodiac-to-Court runtime binding (zodiac Internal/External stays prose context)
6. Concurrent Governor/Court transition (no composite transition envelope)
7. Electromagnetic or thermodynamic physical claims
8. Active complement relation (complement map stays frozen/unclaimed)
9. Active subset-incidence projection (`SUBSET_OF_7_35` stays detached audit-only)
10. Bulk availability of unadmitted pentatonic set classes
11. Any claim that CRT-310 gates have been satisfied (CRT-310 stays 35 proposed / 0 eligible / 0 admitted)

## 4. Proposed outputs

```text
scrum/CRT-348-fivefold-engine-promotion-gate.md          ← this plan (exists)
schemas/fivefold-engine-admission-contract.json           (created 2026-08-17; admission: proposed)
schemas/fivefold-engine-admission-contract.schema.json    (created; pins proposed const values)
schemas/fivefold-engine-promotion-evidence.schema.json    (created; evidence report shape)
qa/fivefold-engine-promotion-evidence.json                (created; 10 item + 11 exclusion groups, verdict PASS)
scripts/build-fivefold-engine-promotion-evidence.py       (created; deterministic --check generator)
scripts/validate-fivefold-engine-promotion-evidence.py    (created; independent validator)
tests/test_fivefold_engine_promotion_evidence.py          (created; 9 tests)
```

The contract and evidence are created in `admission: proposed` status with
zero effect (flat `schemas/` naming, no new directory). Activation remains
blocked on the hard approval boundary below; repository policy requires
admission-authoritative contracts to be activated only inside a versioned
admission gate with decision-ledger evidence
(`CRT-301` contract model; `SOURCE_AUTHORITY.md` authority order).

## 5. Hard approval boundary

Resolved by maintainer approval on 2026-08-17. The activation below was
executed under that approval; all remaining actions are recorded as
follow-ups in the admission record's rollout note.

## 5a. Activation record (executed 2026-08-17)

- `schemas/fivefold-engine-admission-contract.json`: `admission: admitted`,
  `contractStatus: accepted_crt_348`, admissionRecord bound to
  `provenance/fivefold-engine-admission-release.json`.
- `provenance/fivefold-engine-admission-release.json`: admission authority,
  `admissionFingerprint 0d435971…f391`, release identity 1.7.0.
- `provenance/DECISION_LEDGER.md`: prepended "Fivefold engine promotion
  admission (CRT-348) — 2026-08-17" entry.
- `provenance/SOURCE_AUTHORITY.md`: two additive rows (contract, admission
  release). Bound-source cascades regenerated: pentatonic candidate/phase-1/
  phase-2/closure (decision-ledger pin updated to `32f08a16…b9bc6`), CRT-347
  candidate and validation report, CRT-348 evidence (`7c545c56…e61c`).
- Release-number rollout (package/release.json/README 1.7.0 literals) remains
  a separate release-management story.

## 6. Post-approval execution task (separate, not started)

If approved, a separate execution task will:

1. Re-verify the frozen digests with optimistic checks (already enforced by
   `scripts/build-fivefold-engine-promotion-evidence.py` at every build):
   `fivefold_engine.yaml` = `9cbf038c93a72719387e6a8094f5b466a79e61ce03371f5b2334fb26a480b64a`,
   `court-admission-contract.json` = `b4351a14aa3dfde6043a609e4158abcb17b006b666a35220e5833cf1cf7ffa9b`,
   `court-runtime-policy.json` = `5164b74bf6cbbb55625eb0e9b958542cf20ddacb426813b7a93c1bffd7347605`.
2. Create the versioned admitted contract (new contractStatus/admission
   value) only after activation approval.
3. Record the decision-ledger amendment and SOURCE_AUTHORITY updates only if
   the maintainer approves activation.

## Verification

Precondition evidence already recorded: CRT-347 chain
(`npm run validate:fivefold-capability-teleology`) and root
(`npm run validate`) green; inventory replayed verbatim with
`promotionItemCount: 10`.

**Gate-evidence results (2026-08-17):** evidence generator emits
10/10 PASS item groups and 11/11 PASS exclusion groups
(`evidenceFingerprint 7c914072…f115`); independent validator PASS;
pytest 9/9; contract schema-valid with `admission: proposed`.

## Definition of done (for this gate plan)

The inventory is copied verbatim from machine authority; every item has
authoritative source, current enforcement, validation evidence, proposed
contract field, exclusions, and risk recorded; the exclusion list matches the
approved plan; the approval boundary is explicit; no contract, ledger,
SOURCE_AUTHORITY, runtime, graph, or frozen-toolkit change is made by this
gate.
