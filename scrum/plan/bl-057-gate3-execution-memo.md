# BL-057 Gate 3 — D4 R2 derivation execution run: results memo

**Status:** `execution_verified` — the registered R2 execution run derived `O`
cleanly at every licensed context and the Derivation Execution Receipt
(`qa/d4-r2-execution-receipt.json`, raw-byte SHA-256 `7e14cbbc680d4827a0d82eb04f3c8c25c187b73d9435fdbade143f014a406fe2`) carries the
status. **No D4 record amendment was performed.** D4's registered `not_derived`
(`provenance/DECISION_LEDGER.md:2195-2252`, region SHA-256 `201efe8193e1967cb91bb07b4876c906be5ba71a23bf4735be6d18a7df69f7a7`) is
byte-untouched; ENTRY 10 stands. Gate 4 (the OD-7 additive amendment) opens on
this receipt but is a **separate ceremony** — a passing run does not amend the
record by itself (no-collapse). The ledger raw-byte SHA-256 remains `8b7084bc7c55bd53a060434fbcaef1d0c7f4eb572079a01d3c1f3f05db4f2362` (no
ledger writes at this gate). D7 remains hypothesis-tier; no D7 claim event.

**Naming drift note:** the corridor's gates are BL-057-track; earlier session
prose referenced BL-031 for the D4 corridor — BL-031 is the topology/lattice
track; corrected as of Gate 3.

**S0–S5 provenance:** S0–S5 refers to the frozen derivation's stage structure
(`scripts/d4-production.mjs` stages: binding verification, complete structural
extraction, generation, durable materialization, durable seal, fresh comparison
process, accounting verification, frozen outcome selection), operationalized
under the lifted keying per the Phase C keying spec
(`scrum/plan/bl-033-phaseC-lifted-keying-spec.md` §§2–4); the frozen stack
remains the semantic reference, never executed.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Execution runner | `scripts/build-d4-r2-execution-receipt.mjs` | calibration + registered execution + seam derivation + D7 analogue + receipt assembly (byte-stable canonical serialization, fail-loud) |
| Receipt | `qa/d4-r2-execution-receipt.json` | the Derivation Execution Receipt (`d4-r2-execution-receipt.v1`); status determined by the run |
| Schema | `schemas/d4-r2-execution-receipt.schema.json` | authored at Gate 3 (the schema file reserved by the Gate 2 interface) |
| Validator | `orrery/scripts/validate-d4-r2-execution-receipt.mjs` | independent re-derivation from the six pinned primaries; fail-loud |
| Pins | `orrery/src/d4-r2-execution-receipt.test.ts` | 14 vitest pins (header/fingerprints, calibration, route gates, contexts, C1–C4, strict control, T-C scope, D7, branch/status, fences, schema shape) |
| Wiring | `package.json` `orrery:d4-r2-execution-receipt:check`; `orrery/package.json` `check`/`build` | runs after `d4-r2-contract:check`, before `derived-path-graph:check`, then `tsc` |

Gate 2 transition: `orrery/scripts/validate-d4-r2-contract.mjs`'s no-collapse
guard evolved from "the Gate 3 receipt must not exist" to "if the receipt
exists it must be a well-formed execution receipt and can never be an
amendment" — the Gate 2 artifact bytes and fingerprint are unchanged
(`5528510b…`).

## 2. Grounding step 1 — the calibration (Gate 3's first act, the license): EXACT

The implemented engine's identity-phase path (`calibrateIdentityPhase`, full
historical data: 7 A0 anchors, 28 R rows) reproduces the frozen pattern
**exactly**, and the reproduction is identical at every patch phase `{11, 0, 1}`:

| Route | generated | matched | in-R-but-unmatched | observed missed | restatement |
|---|---|---|---|---|---|
| T-A (calibration) | 8 | 4 | 4 | 10 | false |
| T-B (construction join) | 28 = U | 14 | 14 | 0 | true |

Cells `A-only:0 / B-only:10 / both:4 / neither:0`; T-C normalized A0 relation
set equals both observed seam relations exactly (`A0:1387:2741:0`,
`A0:1451:2773:6`). This reproduces OBS-023
(`provenance/OBSERVATION_LEDGER.md:485-532`) and the frozen receipt
(`qa/d4-production-receipt.json`, category `not_derived`). A deviation would
have halted the gate with no receipt (the implementation would be wrong, not
the hypothesis); none occurred.

## 3. Grounding step 2 — the seam-phase derivation: R2 derives `O` at every licensed context

Route mapping (pre-registered by maintainer ruling): **G_A := R2 output,
G_B := construction-join output, both per context X**. The construction join's
U-saturation is the recorded contrast; the C2 no-restatement guard applies
symmetrically (an R2-emits-U outcome would be blocked).

| Context X | keying | G_A (R2) | in-R-but-unmatched | cells (over O) | G_B | disposition |
|---|---|---|---|---|---|---|
| `phase-11` | lifted@11 | 14 = O | 0 | 0/0/14/0 | 28 = U (restatement) | `derived@phase-11` |
| `phase-0` | lifted@0 | 14 = O | 0 | 0/0/14/0 | 28 = U | `derived@phase-0` |
| `phase-1` | lifted@1 | 14 = O | 0 | 0/0/14/0 | 28 = U | `derived@phase-1` |
| `seam-familyA` | anchored projection (9 flank realizations, phase provenance recorded) | 14 = O | 0 | 0/0/14/0 | 28 = U | `derived@seam-familyA` |
| `strict-degree-control` (control, not licensed) | strict ±1 only (offices 0, 6) | 4 | 0 | 0/10/4/0 | 28 = U | `not_derived@strict-degree-control` |

- **C1 holds at all four licensed contexts:** covered, `G_A ≠ U`, `G_A = O`
  proper subset of `U`, `in_R_but_unmatched = 0`, `C_lifted`; **no invalid@X**
  (no beyond-R keys, all phase bindings resolved in the patch, no cross-phase
  containment — P4 holds). The route's selectivity is representation-stable:
  unlike Phase C's routes (which collapsed to `G = U` at the seam), R2 selects
  the same 14 contacts at every context.
- **C_lifted scope (recorded explicitly):** the adjudicated R2 T-C scope (Gate 2
  constraint 4 / BL-056 §5): 7 realized, 2 observation-exact, 5
  confirmation-marked predictions, every observed seam realizable
  (`realizationOfObserved = true`); the frozen strict set-equality reading
  (7 generated vs 2 observed) is recorded as `cStrict: false` diagnostic — the
  5 T2 relations await direct observation on the D4 seam surface, as
  pre-registered at BL-056.
- **Literal-form note (recorded):** the frozen contract's two-route `derived`
  row (neither route equals U) remains structurally unavailable while the
  satellite-blind construction join is co-evaluated (`G_B = U` by
  construction, keying-independent; `DECISION_LEDGER.md:2163-2164`); the
  corridor's C1 as restated adjudicates R2's own selectivity with the
  construction join as the recorded contrast.
- **The co-canonical control (OD-C1):** the strict-degree re-key reproduces the
  frozen failure shape exactly (partial coverage, cells 0/10/4/0, T-C 2/2
  exact) — the frozen-reproduction reading carried side-by-side, not
  superseding.

## 4. Grounding step 3 — the D7 analogue (hypothesis-tier, reported separately)

The R2-style machinery was mirrored over the audited `analogue-R` (14 seat
contacts, parent `h = d`; modal orbit recorded; no D7 grant):

- **Literal predicate** `[forte = '7-27']` selects **0/14** (D7 contact
  satellites are set class `7-2` — input-level asymmetry).
- **Domain-class predicate** `[forte = '7-2']` selects **14/14 = U = O** — with
  no U/O gap (the analogue domain equals the contact set by construction), the
  outcome is a full-domain restatement (C2), never a selective derivation.
- **Cycle-twin verification: 0/7** — the modal orbit closure `M(4033) = 127` is
  modal, not rotational; D7 carries predicate-only justification.
- Phase C cross-reference: anchored analogue 12/14, seam analogue 12/14
  (`not_derived@…-analogue`, office 3 unqualified). **No D7 claim event; no
  parity-with-D4-grant claim; D7 stays hypothesis-tier.**

## 5. Branch-table classification and the fingerprint pair

- **Branch: `DERIVED@X`** — the seam hypothesis is confirmed under the lifted
  representation: R2 selects `O` at every licensed context while the
  construction join restates `U` as the recorded contrast. Status:
  `execution_verified`; `passFail: true`.
- **Fingerprint pair (no collapse):**
  - Gate 2 implementation state: `contractFingerprint`
    `5528510b495f12fa11ab713d8ee357e3798f728204eacd83ad491aafb8fdc7d5`;
    execution-time file-set digest (`implementationDigest`, engine + generator
    + validator + pins + artifact): `2789c46cb542cc4d1771110b0cfe113fb44baabf40e478bb94e0dfe55cff70bd`.
  - Gate 3 execution state: `executionFingerprint`
    `3ed80e6fef3b1a5a8211d046facaf2f2d15daf7eb34a398ccfd1fded1c783634` (over the
    receipt's canonical core; `generatedKeysDigest`
    `e075eb63604b7d9d5d484e574fcdd313f6e86f7e66e828ed6b527671df247c56`).
  - The receipt is *evidence*, not an amendment: the two fingerprints are
    distinct; a passing run does not amend the record.

## 6. Gate 4 readiness verdict

**OPEN.** `execution_verified` is the Gate 4 entry criterion (BL-057 §3). The
amendment event — the OD-7 additive provenance link updating the D4 record
toward `derivable-via-R2`, citing this receipt and the R2 validation — is
separately ceremonied, additive only, ENTRY 10 untouched. Gate 3 performs no
ledger write and claims no verdict beyond its own receipt.

## 7. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:d4-r2-execution-receipt:check` | PASS (runner `--check` fresh; independent validator PASS) |
| `npm run orrery:d4-r2-contract:check` | PASS (Gate 2 artifact unchanged; transition guard accepts the receipt) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | 29 files / 290 tests passed (14 new Gate 3 pins) |
| Six input primaries | live SHA-256 re-verified at execution and by the validator (identical to the Gate 1 memo / Gate 2 bindings) |
| Frozen nine-file closure | digest `7ab950fa…` re-verified; frozen stack never modified or re-executed |
| Ledger fence | full-file SHA `8b7084bc…`; ENTRY 10 region SHA `201efe81…`; both byte-untouched |
| Calibration | EXACT at all three patch phases; fail-loud path not triggered |

## 8. Bounded statement of what this run did NOT accomplish

No D4 record amendment; no ledger write; ENTRY 10 untouched; no `derivable-via-R2`
status recorded (Gate 4 is separate); no D7 verdict or claim; no governs
admission; no wall dissolution (R2 traverses the A0 cycle, emits A1 contacts; no
D–D edges); no G1 movement; direction unassigned; no canonical/Court/Neo4j
writes; no legal-move/audio bytes; no frozen-stack modification. The five T2
midpoint relations remain confirmation-marked predictions awaiting direct
observation on the D4 seam surface. Session prose is context, not evidence.
