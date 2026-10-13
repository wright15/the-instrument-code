# BL-057 Track 1 — D4 amendment content specification (Gate 1 admission claim memo)

**Status:** `claim_admitted` — Gate 1 ruling **approved** (maintainer ruling
2026-10-10, this session; transition `design_validated → claim_admitted` executed
by this landing). The R₂ filtered cycle-walk route is admitted as a claim event
for D4 contract amendment, under the bounded scope, source pins, and non-claims
recorded in this memo. Beyond admission this memo remains planning evidence: no
ledger entry, no evidence obligations accepted, no verdicts, no implementation,
no contract execution, no ledger write is performed or authorized by this memo;
Gates 2–4 are separate, sequentially gated steps. D4's registered `not_derived`
(`provenance/DECISION_LEDGER.md:2195-2252`) is unchanged and may be amended only by
its own claim event (OD-7, additive). The Track 2 §2.7 amendment
(`scrum/plan/harmonic-comprehension-map.md:345-526`, landed `601d073`, raw-byte
SHA-256 `07356d15a815862c34c05a9f73dbcfe06680ba1ed701f6759c559fcd4683d4d3`) is
interpretation vocabulary only and was **not** used as design input here.

---

## 1. D1 — Amended outcome schema

### 1.1 Status token set — six tokens (happy path + rejection branch)

`derivable-via-R2` is formalized as distinct from historical contract derivation:
the pre-admission state (BL-056 `design_validated`) is absolutely separated from
the admitted, executed contract derivation state (post-Gate 3).

| # | Token | Meaning | Recorded where |
|---|---|---|---|
| 1 | `design_validated` | R2 validated as a **design** over pinned sources, in sandbox (BL-056). No admission, no implementation, no contract run. **Current state.** | BL-056 artifact + memo (landed) |
| 2 | `claim_admitted` | Gate 1: maintainer rules this claim event in; route definition, source pins, and admission criteria bounded. | This memo (header state change on ruling, via follow-up landing) |
| 3 | `implemented` | Gate 2: implementation PR/diff; dual-engine generator + independent validator code; test pins passing. | Implementation PR/diff |
| 4 | `execution_verified` | Gate 3: registered contract execution run derives `O` cleanly. | `qa/d4-r2-execution-receipt.json` (defined at Gate 3; not created by this memo) |
| 5 | `record_amended` (`derivable-via-R2`) | Gate 4: additive OD-7 provenance link landed, citing the Gate 3 receipt and the R2 route validation. | `provenance/DECISION_LEDGER.md` (**additive entry only**) |
| 6 | `attribution_incomplete` | Gate 3 failure branch: the execution run does **not** derive `O` cleanly (new invariant failures or unexpected failures surface). | Additive ledger **note** (not an amendment) |

**Rejection-branch semantics (`attribution_incomplete`), binding.** If Gate 3 does
not derive `O` cleanly, the amendment attempt is recorded as *attempted and
inconclusive*: the route-geometry attribution (D2) is marked `attribution_incomplete`,
the substrate question is preserved for investigation, no `derivable-via-R2` status
is recorded, and ENTRY 10 remains byte-untouched. A failed test is a finding and
receives a record status; the failure branch is additive only and never an
amendment.

### 1.2 Evidence provenance & citation obligations (byte-level SHA-256)

**The two provenance sets are real and separate — they document different stages of
one chain** (probe verification vs. design validation). Per the BL-057 planning-pass
resolution: the BL-056 artifact's own `sourceBindings` header is authoritative as the
**probe's provenance** (landed self-declaration, live-verified at registration);
the BL-055/BL-056 artifacts are cited separately as the **design layer's** artifacts.
The Gate 1 amendment cites both, clearly separated.

**Set A — probe provenance** (BL-056 artifact `sourceBindings`, all six re-verified
by live `sha256sum` on 2026-10-10; every value matches the artifact declaration):

| Artifact | Raw-byte SHA-256 | Role |
|---|---|---|
| `qa/d4-production-receipt.json` | `2057a75702ddb4952151d962fb680474ab6543387b604b3b5c37758b8e9c49d0` | frozen D4 comparison: U/O keyings, cells, route accounting, observed seam relations |
| `qa/d4-production-generation.json` | `f9ab736eb14a31ab68d0b1424e7e20dffc42768f7a8ccbf358e6f0ce107496ae` | frozen projection (R/E/anchors, witnesses) |
| `canonical/universal-heptatonic-ledger.csv` | `6d2603a2499aea55b6bc13d11694ae10e6bfad1d62cb488506a57333e182f6c9` | 462-record canonical ledger (forte per satellite) |
| `canonical/universal-network-data.json` | `21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc` | canonical network definitions (validator-side R/E re-extraction) |
| `orrery/src/generated/d4-selection-review.v1.json` | `40a1d7586c8643bac351a1b70c09fce35a977ce200888d08a40d2cc0022649d8` | BL-055 artifact (predicate, cycle geometry, per-anchor E-parents) |
| `orrery/src/generated/phase-c-probe.v1.json` | `48d460a2f001e54dc53d34cedde2a03c5d354b0ba0991b8dd941afa28b141d0c` | Phase C seam pairs, T-C relation inventory, strict-degree control |

**Set B — design layer** (the amendment's own artifacts, re-verified live):

| Artifact | Raw-byte SHA-256 | Self-declared fingerprint | Role |
|---|---|---|---|
| `orrery/src/generated/d4-selection-review.v1.json` | `40a1d7586c8643bac351a1b70c09fce35a977ce200888d08a40d2cc0022649d8` | `reviewFingerprint` `6d11fd932efbe96892b3cf2e6a6cdad6f54e69cd2a8f284ebb72232c59d8b745` | BL-055 design validation (selection mechanism review) |
| `orrery/src/generated/d4-r2-route-review.v1.json` | `5a1a787eb47a939d8f1ba727689a9cc2db0adb21fe716d5e1600d7a19406c4b3` | `reviewFingerprint` `e25851f975a84a290bc4794916dd16ead7d99c7f3694bae21b7c6bb6f13e91b3` | BL-056 design validation (R2 route review), `status: planning_evidence` |
| `scripts/build-d4-r2-route-review.mjs` | `d70a94e088d699616a45773077b18cffde896b692aed226262447801f204ac00` | — | deterministic generator (canonical serialization) |
| `orrery/scripts/validate-d4-r2-route-review.mjs` | `1462fc0588b8c894079b9b546ee0f5e1daa3ae1ec136b22c73486de96d675ff1` | — | fail-loud independent re-derivation validator |
| `orrery/src/d4-r2-route-review.test.ts` | `470db66330f1bf917d330cebd822afb1f7184c7cd1399fa331a5c836ec201f56` | — | 10 vitest regression pins (header, route, per-office, G1–G5, constraint table, fences) |

**Mandatory dual verification harness citation.** The amendment's evidence chain is
the pair `scripts/build-d4-r2-route-review.mjs` (deterministic generator) +
`orrery/scripts/validate-d4-r2-route-review.mjs` (fail-loud independent re-derivation)
+ the 10 vitest pins. Mutation-probe rejection record (BL-056 §1): a fabricated
`selected` list, a flipped cycle-twin hold, a promoted midpoint exactness, and a
corrupted cycle-walk count were each rejected by the validator (after fingerprint
repair) at the corresponding content check.

### 1.3 Immutable ledger fence

- ENTRY 10 (`provenance/DECISION_LEDGER.md:2195-2252`, D4 `not_derived`) is
  **immutable** and must never be edited or erased.
- The amendment operates strictly via an **additive provenance link** (OD-7 claim
  event) citing the Gate 3 execution receipt and the R2 route validation.
- Landing-time fence verification (this pass, 2026-10-10):
  `git diff -- provenance/DECISION_LEDGER.md` is empty; ledger raw-byte SHA-256 at memo date `8b7084bc7c55bd53a060434fbcaef1d0c7f4eb572079a01d3c1f3f05db4f2362`.
- The D4 qualifier (`provenance/DECISION_LEDGER.md:2260-2266`) remains binding at
  every gate: derivation difficulty under the registered route, not authorship proof.

---

## 2. D2 — Historical failure disposition

**Falsifiable attribution framing (binding wording):**

> "The single-phase under-coverage (4/14) is attributed to three individually
> verified route-geometry limitations; their joint sufficiency is untested pending
> Gate 2/3 execution."

**Three individually verified obstructions** (each verified in BL-055/BL-056; cited,
not re-proved here):

1. **T₁-link blindness.** The single-phase kernel-twin route traverses only the
   2×T₁ links of the closed 7-edge A0 transposition cycle
   (`2741 → 1387 → 1453 → 1717 → 2773 → 1451 → 1709 → 2741`), leaving the 5×T₂
   edges unvisited. Verified: `rot(a)` lands in-A0 at exactly 2 of 7 anchors,
   `rot(2741)=1387`, `rot(2773)=1451` (BL-055 §6; BL-056 §3).
2. **Satellite-blind T_B joins.** T_B construction joins treat satellites as
   uninspected payload (`7 anchors × 2 distinct E-parents × 4 satellites = 56 → 28
   = |U|`), reproducing `U` regardless of predicate; the join never reads `s`
   except as emitted payload (BL-055 §5 W3; BL-056 §4 G4).
3. **T_C midpoint overshoot.** Unconstrained seam joins generate predictions
   without office-filtering against the A0 seam observation surface; 7 generated
   vs. 2 observed (BL-055 §7 blocker 3; BL-056 §5 G5).

**Gate 3 as empirical falsification boundary (binding):**

- If the R2 contract execution run derives `O` cleanly **without surfacing new
  obstructions**, the route-geometry attribution is empirically validated.
- If the execution run **surfaces unmet contract invariants or unexpected
  failures**, the attribution is incomplete, preserving the substrate question for
  investigation — recorded as `attribution_incomplete` per §1.1.

---

## 3. D4 — Four-Gate admission roadmap

| Gate | Stage | Entry Criteria | Exit / Acceptance Artifact | Status Transition |
|---|---|---|---|---|
| 1 | R₂ Admission Claim Event | BL-056 findings memo approved; Track 1 spec signed off; scope and non-claims bounded. | Formal Claim Memo (route definition, primary source pins, admission criteria). | `design_validated → claim_admitted` |
| 2 | Contract Implementation | Gate 1 complete; schema definitions frozen. | Implementation PR/diff; dual-engine generator + independent validator code; test pins passing. | `claim_admitted → implemented` |
| 3 | Execution Run | Gate 2 passing all checks; pinned canonical inputs verified. | Derivation Execution Receipt (`qa/d4-r2-execution-receipt.json`: execution timestamp, inputs/outputs hashes, pass/fail status). | `implemented → execution_verified`, **or** `implemented → attribution_incomplete` on failure |
| 4 | Record Amendment | Gate 3 execution green; evidence obligations certified. | Provenance Ledger Entry (OD-7 amendment linking receipt, updating status to `derivable-via-R2` additively). | `execution_verified → record_amended` |

**No-collapse rule (binding).** No gate may collapse into another. In particular, a
successful implementation (Gate 2) is not an execution run (Gate 3), and an
execution run is not an amended ledger record (Gate 4). The sandbox `G_R2 = O`
computation is **not** an execution run.

**Cycle-walk presentation convention (frozen).** Gate 1 consistency freezes the
cycle listing at the kickoff order `2741 → 1387 → 1453 → 1717 → 2773 → 1451 →
1709 → 2741`: cycle start = the Ionian-adjacent seed, matching BL-055's table
order. The start point is presentation convention only — the cycle is closed and
M-successor-directed; BL-055 §6 records the same cycle from a different entry.
Freezing it prevents a third variant from appearing in later artifacts.

---

## 4. Read-only verification record (this planning pass, 2026-10-10)

| Check | Result |
|---|---|
| ENTRY 10 byte fence | `git diff -- provenance/DECISION_LEDGER.md` empty; ledger SHA-256 `8b7084bc7c55bd53a060434fbcaef1d0c7f4eb572079a01d3c1f3f05db4f2362` |
| Probe provenance (Set A) | all six `sha256sum` values live-verified, matching BL-056 `sourceBindings` |
| Design layer (Set B) | all hashes live-verified; artifact fingerprints read from landed bytes |
| Track 2 §2.7 landing | commit `601d073`; heading `scrum/plan/harmonic-comprehension-map.md:345`; amendment `345-526`; consumption row `:552`; map raw-byte SHA-256 `07356d15a815862c34c05a9f73dbcfe06680ba1ed701f6759c559fcd4683d4d3` |
| `npm run validate:manifest` | PASS (1,221 files at Track 2 landing; 1,222 after this memo's own addition, verified at this memo's landing commit) |
| `npm run orrery:check` | exit 0; all gates green; `tsc --noEmit` clean |
| `npm run orrery:test` | 27 files / 264 tests passed |
| `npm run validate:release` | 412 checks passed / 6 failed; **failure set identical with BL-057 changes stashed at HEAD** (pre-existing, environment/dev-state: missing Python `referencing` module, shadow-ladder freshness, retained 1.8.1 Neo4j baseline per cycle-open decision, pentatonic closure freshness ×2, frozen composite package payload identity) — listed as recommended follow-ups, not touched (standing rule 3) |

---

## 5. Bounded statement of what this memo does NOT do

No D4 record amendment; no route admission (Gate 1 admission is this memo's request,
pending ruling); no contract implementation; no registered derivation execution; no
`qa/d4-r2-execution-receipt.json` created; no governs admission; no INV-5
graduation; no M-walkability promotion; no topology/canon/runtime/schema/Court/Neo4j
writes; no G1 movement; no directional-semantics assignment; no frame/polarity
design input; no framework/probe/registry bytes moved; ENTRY 10 untouched. Session
prose is context, not evidence.

---

## 6. Requested ruling

**Gate 1 ruling request:** approve or reject admission of the R₂ filtered
cycle-walk route as a claim event for D4 contract amendment, under the bounded
scope, source pins, and non-claims recorded above.

- **On approval:** status `design_validated → claim_admitted`; this memo's header
  is updated by a follow-up landing; Gate 2 may then open as a separate step.
- **On rejection:** the claim event is recorded as not admitted; R2 remains
  `design_validated` planning evidence; no downstream gate opens.
