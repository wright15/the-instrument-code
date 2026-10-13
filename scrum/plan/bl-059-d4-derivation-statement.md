# BL-059 (Track 1) — D4 Derivation Statement: the bounded contact-geometry theorem

**Status:** `planning_evidence` — formal restatement of a discharged result. This statement
formalizes a result already derived, executed, and admitted through the four-gate corridor
(ENTRY 15); it introduces no new derivation and claims nothing beyond the corridor's admitted
scope. No ledger entry, no evidence obligations accepted, no claim event, no verdicts, no
admission of any kind.

**Citation-stability (binding).** This artifact is closed at landing and is not edited by
future findings. The open question above the result — whether the granted GOVERNS structure
itself is derivable — is carried by the companion memo
(`scrum/plan/bl-059-governs-derivability-scoping-memo.md`, Track 2), which accretes; this
statement does not.

## 0. What this artifact is (genre and authority)

This is a derivation **statement**, not a derivation. Three genres are separated here:

- **A spec proposes** — it defines a result to be obtained and the gates that would admit it
  (e.g., `scrum/plan/bl-057-d4-amendment-spec.md` before its ruling).
- **A claim event admits** — it rules a proposition into the record (Gate 1
  `design_validated → claim_admitted`; Gate 4 `execution_verified → record_amended`).
- **A derivation statement organizes** — it states, in theorem form, a result that has already
  completed those steps: object, inputs-with-status, rule, obligations, scope, assembled into
  one citation-stable object.

The authority of every line below flows from the corridor's receipts, not from this statement:
the frozen D4 comparison (`qa/d4-production-receipt.json`), the frozen projection
(`qa/d4-production-generation.json`), the BL-055/BL-056 validation artifacts, the Gate 2
contract implementation, the Gate 3 execution receipt (`qa/d4-r2-execution-receipt.json`), and
the Gate 4 additive amendment (ENTRY 15, `provenance/DECISION_LEDGER.md:2665-2810`). Nothing
below is new evidence; every value is a pointer to a receipt.

## 1. The object: the D4 contact geometry

A retained contact row is `(d, s, h, o(h))`: SEAT_CONTACT `d` (a D4 anchor), satellite `s`,
the unique R parent `h`, and the parent office `o(h)`. The comparison key is `(o(h), s)` — not
`d`'s office (`provenance/DECISION_LEDGER.md:2069-2071`, Attachment F). The **D4 contact
geometry** is the observed key set

> **O = {(o(h), s)}**, with |O| = 14 — exactly 2 keys per office across all seven offices.

The derived characterization — the result this statement formalizes — is:

> **The contacting satellites are exactly the 7-27 satellites of their parents, two per
> office**: O = {(o(h), s) : s ∈ satellites(h) ∧ forte(s) = 7-27}.

| Office | Parent h (A1) | Satellites | Selected (7-27) | Unselected (7-31) |
|---|---|---|---|---|
| 0 | 1371 | 1243, 1339, 1627, 2395 | **1339, 2395** | 1243, 1627 |
| 1 | 1749 | 1747, 1753, 1765, 3497 | **1765, 3497** | 1747, 1753 |
| 2 | 2733 | 2669, 2717, 2861, 3245 | **2717, 3245** | 2669, 2861 |
| 3 | 1461 | 731, 949, 1465, 2921 | **949, 1465** | 731, 2921 |
| 4 | 1707 | 1691, 1703, 1739, 1835 | **1703, 1835** | 1691, 1739 |
| 5 | 1389 | 695, 877, 1261, 2413 | **695, 1261** | 877, 2413 |
| 6 | 2901 | 2893, 2899, 2917, 2965 | **2899, 2965** | 2893, 2917 |

Source: BL-055 W1 table (`scrum/plan/bl-055-d4-selection-review-memo.md:25-39`), re-verified
against `qa/d4-production-receipt.json` `comparison.routes.*.matchedObservedKeys` and
`comparison.uKeys`. The 14 selected keys are exactly O; the 14 unselected are U \ O.

## 2. Theorem D4 (bounded)

> **Given** the granted inputs of §3, **under** the rule R2 of §4 and the predicate P of §5,
> the derived key set satisfies **G_R2 = O exactly** — complete coverage, no extras, and no
> collapse into the full granted satellite domain U.

Discharged, in the receipt's own counting:

- **Exact coverage:** |G_R2| = 14 = |O|; G_R2 = O; `missing: []`; `extra: []`
  (`extra_beyond_R_count = 0`; `in_R_count = 14`).
- **Non-collapse:** |G_R2| = 14 ≠ 28 = |U|, where U = {(o(h), s) : (h, s) ∈ R}
  (`qa/d4-production-receipt.json` `comparison.uKeys`).
- **Edge validity:** every emitted key is in-R; no invalid input; no D–D edges are produced
  (R2 traverses the A0 cycle and emits A1 contact keys).

The theorem is **bounded**: it derives the contact geometry *under the granted structure*. It
does not derive the GOVERNS relation R, the office assignments o(h), the CONSTRUCTS relation,
or the cycle; those are inputs (§3). Whether the inputs themselves are derivable is not
addressed here and is the companion memo's question.

## 3. Inputs, with status

| Input | Content | Status | Source |
|---|---|---|---|
| A1 GOVERNS relation R | 28 edges = 7 A1 anchors × 4 satellites; parent/satellite membership, no selection by D4 contact rows | **GRANTED** — "the principal authored inheritance input … not a derived inheritance theorem", accepted with its interpretive cost | `provenance/DECISION_LEDGER.md:2052-2062`; `:2037-2038`; receipt `comparison.uKeys` |
| Office assignments o(h) | seven parent offices 0–6 | **GRANTED** (carried by the frozen projection) | `qa/d4-production-generation.json` `projection`; receipt `comparison.rows[].parentOffice` |
| A0 anchors | 7 A0 states | **GRANTED** (Tier-A anchor set) | generation projection `anchors` (digest `d2d74533…`) |
| A0→A1 CONSTRUCTS relation E | 14 edges; exactly 2 distinct parents per A1 anchor | **GRANTED** | generation projection `E` (digest `6f3100d8…`); BL-055 §5 W3 |
| Satellite forte / interval vector | canonical ledger fields | **CANONICAL READ** (admitted canonical release) | `canonical/universal-heptatonic-ledger.csv` |
| Pitch masks | canonical network definitions | **CANONICAL READ** | `canonical/universal-network-data.json` |
| Cycle edges, twin checks, P-selection, contacts | derived by R2 | **DERIVED** | BL-056 §§3–4; Gate 3 receipt `routeExecution.perOffice` |
| Phase licensing (patch {11, 0, 1}; seam keying) | execution scope | **ADMITTED SUBSTRATE** (ENTRY 14 / GOV-523 / `b30833c`) | `docs/specs/phase-extended-topology-candidate-v0.1.0.md`; Gate 3 memo §3 |

The grant carries its required interpretation verbatim
(`provenance/DECISION_LEDGER.md:2058`):

> "D₄'s derivation is relative to granted inheritance structure; a positive result derives the
> contact geometry, not the inheritance relation; comparability with D₅ is preserved by
> substrate-parity (CONSTRUCTS granted there, GOVERNS granted here)."

## 4. The rule R2 (filtered cycle-walk)

> **R2(h) = {(o(h), s) : s ∈ satellites(h) ∧ P(s)}** — for each A1 anchor h, the derived
> contacts are exactly its satellites satisfying P(s). (BL-056 §2.)

Derivation steps (frozen):

1. Extract the anchor's two A0 CONSTRUCTS parents — the cycle edge.
2. Verify `cycle_twin(a, b, d) ⟺ rotateMaskZ12^d(a) = b` at the edge's interval d — gated,
   per-office justification tier.
3. Select the P satellites.
4. Emit contacts.

The cycle edge is *derivation ground*; the predicate is *selection within*.

**Frozen cycle convention** (`scrum/plan/bl-057-d4-amendment-spec.md` §3; presentation
convention only — the cycle is closed and M-successor-directed):

`2741 → 1387 → 1453 → 1717 → 2773 → 1451 → 1709 → 2741` — closed; 2×T1 + 5×T2; interval
sum 12.

| Office | Cycle edge (walk direction) | d | cycle-twin check |
|---|---|---|---|
| 0 | 2741 → 1387 | 1 (T1) | `rotateMaskZ12^1(2741) = 1387` |
| 1 | 1717 → 2773 | 2 (T2) | `rotateMaskZ12^2(1717) = 2773` |
| 2 | 1709 → 2741 | 2 (T2) | `rotateMaskZ12^2(1709) = 2741` |
| 3 | 1453 → 1717 | 2 (T2) | `rotateMaskZ12^2(1453) = 1717` |
| 4 | 1451 → 1709 | 2 (T2) | `rotateMaskZ12^2(1451) = 1709` |
| 5 | 1387 → 1453 | 2 (T2) | `rotateMaskZ12^2(1387) = 1453` |
| 6 | 2773 → 1451 | 1 (T1) | `rotateMaskZ12^1(2773) = 1451` |

Every office is `cycle-twin-verified`; `justificationSummary: {cycleTwinVerified: 7,
predicateOnly: 0}`; `fallbackOffices: []` (BL-056 §3; Gate 3 receipt `routeExecution.perOffice`).

**Structural fact used by the rule.** Each office's unordered E-parent pair is asserted
set-equal to its cycle edge pair (fail-loud on drift): the 7 CONSTRUCTS parent pairs are
exactly the 7 edges of the closed A0 cycle (BL-055 §5 W3; BL-056 §8). R2 traverses that
granted edge structure and, by conjoining P at the satellite-reading level, breaks the
cycle-edge ↔ construction-pair identity in the output (§6, G4).

## 5. The predicate P

> **P(s) = [forte(s) = 7-27]** — interval vector `<344451>`; the unobserved class is 7-31,
> `<336333>`. (BL-055 §4.)

Globally, the 462-record canonical ledger contains exactly fourteen 7-27 (all observed) and
fourteen 7-31 (all unobserved), all A1 satellites. Predicate properties, each verified in
BL-055 (§4, §7):

- **Intrinsic** — interval content, not observation membership (non-circular; canonical-ledger
  fields only).
- **Tn-invariant** — the partition is stable under transposition.
- **Keying-invariant / representation-stable** — P never selects an unobserved key under any
  registered keying; the frozen contract's miss was geometric (route reach), never semantic.
- **Selective exactly 2 per office** — the split is 14/14 across the full satellite layer.

## 6. Proof obligations, discharged

| Obligation | Evidence | Source |
|---|---|---|
| Edge validity (G1) | cycle-twin holds 7/7 including all 5 T2 edges; no predicate-only fallback offices | BL-056 §3 |
| Predicate selectivity (G2) | exactly 2 satellites with forte 7-27 per office; count vector {2,2,2,2,2,2,2}, total 14 | BL-056 §4 |
| Exact coverage (G3) | G_R2 = O; 14 generated, 14 matched, `missing: []`, `extra: []` | BL-056 §4; Gate 3 receipt `routeExecution.outputComparison` |
| Non-collapse (G4) | 14 ≠ 28 = U; T-B construction join remains U (satellite-blind by construction — 56 witnesses; "never reads s except as payload"); identity broken by satellite-reading selection | BL-055 §5 W3; BL-056 §4 |
| T-C midpoint scope (G5) | `midZ7(edge) = office(child)` invariant; 7 realized; 2 observation-exact (`A0:1387:2741:0`, `A0:1451:2773:6`); 5 seam-derived predictions with confirmation markers (`A0:1717:2773:1`, `A0:1709:2741:2`, `A0:1453:1717:3`, `A0:1451:1709:4`, `A0:1387:1453:5`); `realizationOfObserved: true` | BL-056 §5; Gate 3 receipt `seamDerivation` |
| Calibration | EXACT at patch phases {11, 0, 1}: T-A 8 generated / 4 matched / cells 0/10/4/0; T-B 28 = U with `restatementSignature`; T-C normalized relation set exact | Gate 3 memo §2; receipt `calibration` |
| Execution at every licensed context | `phase-11`, `phase-0`, `phase-1`, `seam-familyA`: G_A = 14 = O, `in_R_but_unmatched = 0`, cells 0/0/14/0, disposition `derived@X`; no beyond-R keys; no cross-phase containment | Gate 3 memo §3; receipt `routeExecution` |
| Negative control | strict-degree re-key reproduces the frozen failure shape co-canonically: `not_derived@strict-degree-control` (4 keys, cells 0/10/4/0) — OD-C1 reading carried side-by-side, not superseding | Gate 3 memo §3 |
| Mutation probes | Gate 2: a fabricated selected list, a flipped cycle-twin hold, a promoted midpoint exactness, a corrupted cycle-walk count — each rejected; Gate 3 validator re-derivation fail-loud | BL-056 §1; Gate 3 memo §1 |
| Non-restatement at R2's own output | C1 as restated: covered, G_A ≠ U, G_A = O proper subset of U, C_lifted; the construction join carried as the recorded contrast | Gate 3 memo §3 |

Two T-C caveats, carried without smoothing: (i) 5 of the 7 midpoint relations remain
confirmation-marked **predictions** awaiting direct observation on the D4 seam surface (only
the two frozen T1 seam relations are observation-exact); (ii) the frozen contract's two-route
`derived` row remains structurally unavailable while the satellite-blind construction join is
co-evaluated — R2's selectivity is adjudicated with that join as the recorded contrast.

## 7. Scope

This theorem claims exactly: **the D4 contact geometry, as keyed and tabled in §1, is
derivable via the admitted R2 route**, per the Gate 3 execution receipt — recorded additively
by ENTRY 15 (`record_amended (derivable-via-R2)`).

Excluded (carried verbatim in substance from the corridor's fences, ENTRY 15 §Scope
`:2714-2727` and §Guard `:2802-2810`):

- No governs admission — the amendment records *derivable contact geometry*, not the GOVERNS
  relation itself.
- No inheritance derived; no unified operator derived.
- No wall dissolution — the wall holds at every phase; R2 traverses the A0 cycle and emits A1
  contact keys; no D–D edges.
- No G1 movement; no directional-semantics assignment; no INV-5 graduation; no M-walkability
  promotion; no canonical/Court/schema/Neo4j writes beyond ENTRY 15's own append.

The historical record is linked, not rewritten: ENTRY 10's `not_derived`
(`provenance/DECISION_LEDGER.md:2195-2252`) stands immutable, SHA-256 region `201efe8193e1967cb91bb07b4876c906be5ba71a23bf4735be6d18a7df69f7a7` (line-join recipe) / `50b8b73f75497082e6d2a38052a62da4f5374ee94fc08f8ff0312fc7746fbb00` (keepends variant). The
D4 qualifier remains binding at every reading: the historical negative was **derivation
difficulty under the registered route, not authorship proof** (`:2260-2266`).

## 8. The D7 boundary case (hypothesis-tier, carried honestly)

The paired D7 test bounds the theorem's scope — measured asymmetry, not parity:

| Axis | D4 (fa pole) | D7 analogue (ti pole) |
|---|---|---|
| Selection | O = 14 within U = 28 (gap 14); R2 selects | U = O = 14; no non-contact satellites exist; selection structurally unavailable |
| Predicate | observed 7-27 selects 14/14 O exactly | literal `[forte = 7-27]` selects 0/14 (D7 satellites are 7-2 — input-level asymmetry); domain-class `[forte = 7-2]` selects 14/14 = U (full-domain restatement, C2 guard) |
| Structure | rotational cycle closure (2×T1 + 5×T2, sum 12); cycle-twin 7/7 | modal orbit closure `M(4033) = 127` — modal, not rotational; cycle-twin 0/7, every edge `predicate-only` |

No D7 grant exists; the analogue-R is constructed from the 14 seat-contact rows (parent h = d).
**No D7 claim, no D7 amendment; D7 remains hypothesis-tier, preserved.** The asymmetry feeds
the governs semantic layer as data (ENTRY 15 §D7 Clause `:2703-2712`; receipt `d7Analogue`;
BL-033 OD-C3, `scrum/plan/bl-033-phaseC-results-memo.md:75`).

## 9. Provenance chain (the corridor, in one table)

| Stage | Artifact | Identifier |
|---|---|---|
| Predicate (design) | `orrery/src/generated/d4-selection-review.v1.json` | raw-byte SHA-256 `40a1d758…`; `reviewFingerprint 6d11fd93…` |
| Route (design) | `orrery/src/generated/d4-r2-route-review.v1.json` | raw-byte SHA-256 `5a1a787e…`; `reviewFingerprint e25851f9…` |
| Gate 1 admission | `scrum/plan/bl-057-d4-amendment-spec.md` | `claim_admitted` (2026-10-10; `6908e7b`, landed `ead2eec`) |
| Gate 2 implementation | `orrery/src/generated/d4-r2-contract.v1.json` | `contractFingerprint 5528510b…`; landed `59fa59a` |
| Gate 3 execution | `qa/d4-r2-execution-receipt.json` | raw-byte SHA-256 `7e14cbbc…`; `executionFingerprint 3ed80e6f…`; `implementationDigest 2789c46c…`; `generatedKeysDigest e075eb63…` |
| Gate 4 amendment | `provenance/DECISION_LEDGER.md` ENTRY 15 | `:2665-2810`; pre-amendment ledger SHA `8b7084bc…` |
| Frozen comparison (historical) | `qa/d4-production-receipt.json` | `category: not_derived`; U = 28, O = 14; cells 0/10/4/0 |
| Frozen projection | `qa/d4-production-generation.json` | R `e17bf1f2…`, E `6f3100d8…`, anchors `d2d74533…` |

Memos: `scrum/plan/bl-055-d4-selection-review-memo.md`;
`scrum/plan/bl-056-d4-r2-route-memo.md`; `scrum/plan/bl-057-gate3-execution-memo.md`;
`scrum/plan/bl-057-d4-amendment-spec.md`.

## 10. Bounded statement of what this statement does NOT do

No new derivation is introduced or executed. No ledger entry; no evidence obligations
accepted; no claim event; no record amendment; no verdict; no admission of any kind. No
governs admission; no wall dissolution; no G1 movement; no directional-semantics assignment;
no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes. The
statement is additive and citation-stable; it does not amend ENTRY 10 or ENTRY 15. Session
prose is context, not evidence.

## 11. Result in one paragraph

The D4 corridor's result is stated here in theorem form for the first time. Given the granted
A1 GOVERNS relation (28 edges), the granted CONSTRUCTS parent pairs (the closed 7-edge A0
cycle, 2×T1 + 5×T2), and the canonical ledger fields, the R2 filtered cycle-walk — cycle-edge
traversal, twin verification, predicate selection — derives exactly the observed D4 contact
geometry O = 14 keys, 2 per office, all 7-27 satellites, with no extras, no collapse into the
28-key granted domain, valid edges at 7/7, midpoint scope recorded (7 realized, 2 exact, 5
confirmation-marked predictions), and the frozen failure shape reproduced co-canonically as
the negative control. The theorem is bounded by its grant: it derives the *contact geometry*,
not the inheritance structure — and the question of deriving that structure itself is the
companion memo's. This artifact organizes a discharged result; it claims nothing new.
