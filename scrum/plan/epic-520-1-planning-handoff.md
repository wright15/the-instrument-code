# EPIC-520-1 Planning Handoff — Build Plan (Sprint 4 intake)

**Status:** Approved for execution · **Story ID:** EPIC-520-1 (confirmed; GOV-numbering rejected — no verdict semantics by design) · **File:** `scrum/EPIC-520-1-unified-operator-planning.md` · **Epic:** EPIC-520 (opened by GOV-512, `DECISION_LEDGER.md:35`) · **Release:** `1.9.0-dev`
**Depends on:** GOV-512 (Done) · **Blocks:** EPIC-520's first research child (unspec'd)

Zero implementation. This story produces questions, definitions, and gates. Its DoD is the existence of those artifacts, not any answer to them.

## 1. Verification matrix (live, arithmetic wins)

| Draft item | Live receipt | Disposition |
|---|---|---|
| Two-state intersection `{2383, 3667}` | `DECISION_LEDGER.md:39`; `twin-hub-convergence-v0.json` 4×4 hits | Adopt — Class 1 verified clean |
| GOV-510 confirmed 30/30; Mercury hub; unseated `{Mars, Jupiter}` | `qa/twin-hub-convergence-validation.json` 30/0 PASS; artifact `d5Case`, OBS-014 | Adopt |
| GOV-511 confirmed 24/24; 462 records; span seq A `6→8→10`, D `9,8,9,8,9,10,10`; gap `[1,1,2,2,2,2,2]`; ceiling 7-33/7-8/7-1 | `qa/fifth-space-census-validation.json` 24/0 PASS; census `records=462`; OBS-015/016 | Adopt |
| LP margin ε\*=3/407; dual λ=(122,101,67,63,30,17,7)/407, Σλ=1 | `CH_A012_q_v1.json:certificate`; `A_TIER_TRIADIC_COMPRESSION_THEOREM.md:368-370,383-409` | Adopt, ℚ-framed, never Z₁₂ |
| K-convolution ownership ("OBS-004/005/009, constructionEdges 28 rows") | Real owners: **OBS-008** (`OBSERVATION_LEDGER.md:108-117`, "Hence K… is exhaustive") + `TIERED_PHOTONIC_THEOREM.md:53-66` + `DECISION_LEDGER.md:161`. OBS-009 = window-intersection; OBS-004/005 = core/conjugation | **Correct (Class 1)**: cite OBS-008 + co-receipts |
| Two-28s ambiguity | Both real, distinct: 28 `CONSTRUCTS` rows (`universal-network-data.json`) vs 28 D4/D5 `SEAT_CONTACT` chains (twin-hub `chainAudit`, OBS-014) | **Correct (Class 1)**: never "28 rows" unqualified |
| D-shadow "already queued, NEXT_STEPS" | Grep: no D-shadow queue line; NEXT_STEPS holds only interleaving/bands prose (`:133`) | **Correct (Class 1)**: (i) newly spec'd, not queued |
| "OBS-015 (registered as open question)" / odd-span anomaly | OBS-015 poses it open (`:257` "why does seam-closure concentrate at span 9?", `:298` well-poses for EPIC-520) but never coins "odd-span anomaly" | **Correct (Class 1)**: coin the term in this story's vocabulary table as newly registered here |
| D-signatures table (`TOPOLOGY_IDENTITY_AND_INVARIANTS.md:121-149`) | Verified; doc's terms are "declared signature + explicit admission as a new protocol tier" (`:132`) | Adopt with **Class 3 nuance**: keep "declared" status visible (H3 turns on it); drop "protocol-versioned" gloss |
| Comma-boundary framing; 15/2048 note; λ-as-Z₁₂ prohibition | Unreceipted as claims (correct — they are prohibitions); λ-prohibition grounded in `R_L_OPERATOR_MATH.md:15` mask-vs-Z₁₂ | Keep as-is (Class 2) |

## 2. Story conversion (house format)

Header `:3`: Backlog · Epic `[EPIC-520](EPIC-520-unified-operator.md)` · Sprint 4 proposed · Points 5 · Depends GOV-512 · Blocks first research child + dual-citation receipt line (gate-time + live fingerprints, `DECISION_LEDGER.md:35`).
§1 question · §2 H1/H2/H3 symmetric (H2 ring-force enumeration = **DoD-gating**, no close without it) · §3 Registered Vocabulary + prohibited list + spec-language guard ("exists-or-ticketed", modeled on `scripts/validate-validation-prose-consistency.mjs`, `package.json:28,32`) · §4 checks (i) D-shadow, (ii) GOV-227-interleave, (iii) ring-force enumeration — all newly spec'd Sprint 4; (iv) single-signature D4-or-D5 derivation = second-child candidate · §5 negative controls · §6 verification, zero code · §7 references + **conversion-verification note** (dated record of the four corrections + ID verification).

## 3. Board sync + intake queue

- `EPIC-520-unified-operator.md:3-5` gains its one planning child; `scrum/README.md:148` table synced ledger→scrum with citation.
- Intake: EPIC-520-1 + newly spec'd (i), (ii), (iii); (iv) deferred; ORR-521/ORR-522 unchanged; hygiene riders (prose-consistency→scrum literals; NEXT_STEPS stale-receipt line, re-verify live).
- Out-of-directive changes → recommendations list, not applied. Report tables from `git diff`, never composed.

## 4. Exit

Fixed point (`package:manifest → --check → validate`, clean tree, per-suite ran/skipped receipts). Correction table git-diff-derived in-commit, short form inside the story.
