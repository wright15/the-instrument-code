# EPIC-520-1 - Unified-operator planning and hypothesis discrimination

**Status:** Done · **Priority:** High · **Points:** 5 · **Epic:** [EPIC-520](EPIC-520-unified-operator.md) · **Sprint:** Sprint 4
**Depends on:** GOV-512 · **Blocks:** GOV-513, GOV-514, GOV-515

**Completion receipt:** Deliverable verified per the conversion-verification
table and review; definition of done satisfied - questions, vocabulary, gates,
negative controls, and check specifications exist; no answer is recorded.

**Receipt:** Research Gate 3 opened EPIC-520 as a research question, not a
conclusion (`provenance/DECISION_LEDGER.md:65-88`). Gate-time decision inputs
were twin-hub `38dc4131...` and fifth-space census `570679df...`; checked-in
QA receipts are PASS 30/30 with candidate `d7405100...` and PASS 24/24 with
candidate `6878c7fd...`, respectively. Gate-time and current fingerprints are
separate receipts and must not be collapsed into one value.

## Story

As a research maintainer, I want a bounded, symmetric plan for discriminating
possible explanations of the confirmed A/D seam observations so that a future
research child can be selected without treating an operator as already
established.

## Scope

- Register the question posed by OBS-015: why does seam-closure concentrate at
  span 9?
- Define three competing hypotheses, their discriminating evidence, and the
  work needed to reject or retain each. This story records no verdict.
- Specify three Sprint 4 checks: D-shadow, GOV-227 interleaving, and ring-force
  enumeration. These checks are newly specified here; none is represented as
  an already queued implementation.
- Identify, but do not open, Check (iv): a D5-only run-space derivability
  target that tests whether the frozen D-tier maxrun frame selects D5 without
  importing a declared contact signature, office result, or observed outcome.

## Hypotheses

| ID | Hypothesis | Discriminating result | Non-result / weakening result |
|---|---|---|---|
| H1 | A common construction relation can account for both A-tier `K` exhaustivity and the D4/D5 seam-contact pattern without adding a new declared signature. | A source-bound derivation reproduces the selected D4/D5 contacts and office results from the allowed A-tier relation alone. | Any required D4/D5 contact, office result, or orientation condition remains dependent on its declared D signature. |
| H2 | The constrained office-ring geometry alone forces the observed D4/D5 seam pattern. | An exhaustive ring-force enumeration over the pre-registered constraints produces one admissible D4/D5 outcome class. | More than one admissible outcome class remains, or the observed pattern requires a constraint outside the enumerated ring inputs. |
| H3 | The D4/D5 results are irreducibly declared second-order contact signatures, not evidence of a common construction operator. | Removing or varying a declared D4/D5 contact-signature condition leaves no source-authorized derivation of the observed result. | A source-authorized derivation supplies every required D4/D5 condition without the declared signature. |

H2's exhaustive ring-force enumeration is a non-bypassable definition-of-done
gate for the successor that executes it. This planning story defines its method,
input boundary, admissible outcome space, and result categories; it records no
enumeration result.

H2 is unfalsifiable as loosely stated - the frame can absorb any evidence
after the fact. The ring-force enumeration is what makes H2 answerable rather
than absorbent; it is load-bearing, not overhead.

## Registered vocabulary and language guard

| Term | Meaning in this story | Status |
|---|---|---|
| `K` | The A-tier office-ring convolution `delta_-1 + delta_+1` over `Z7`, exhaustive for the enumerated A-tier construction pairs. | Existing OBS-008 result; not a D-tier operator. |
| D4/D5 contact signature | The declared second-order, source-tier-specific seat-contact conditions for D4 and D5. | Existing declared protocol-tier input; not a versioned protocol claim. |
| two 28s | The distinct counts of 28 `CONSTRUCTS` edges and 28 selected D4/D5 `SEAT_CONTACT` chain-audit rows. | Existing, always qualified by noun. |
| D-shadow | A proposed check for a D-channel shadow relation. | Newly specified by this story; no current queue item found. |
| GOV-227 interleaving | A proposed check of whether the admitted D-tier compression scalar bands distinguish the relevant structure. | Newly specified by this story; existing evidence says scalar bands interleave. |
| ring-force enumeration | Exhaustive enumeration of the stated office-ring constraints and admissible D4/D5 outcomes. | Newly specified by this story; H2 DoD gate. |
| run-space frame | The ordered D1-D7 maxrun sequence derived from canonical pitch-class masks and used to test D5 target derivability. | GOV-515 Stage 1 definition only; no execution result. |
| odd-span anomaly | The newly registered name for the open OBS-015 question about seam-closure at span 9. | Registered here; not an OBS-015 term. |

Every named check or result in this story must be either (a) an existing,
cited receipt or (b) explicitly marked newly specified with a ticketed
deliverable. Spec language must not imply an existing artifact, queued work,
or executed result where neither exists.

## Acceptance criteria

1. The story preserves the confirmed inputs without expanding their authority:
   A2 twin pairs share Mercury and designate unseated `{Mars, Jupiter}`; the
   D4/D5 chain audit has 28 valid selected `SEAT_CONTACT` rows; the fifth-space
   census has 462 records, A spans `6 -> 8 -> 10`, D spans
   `9, 8, 9, 8, 9, 10, 10`, and the span-10 ceiling is attained by `7-33`,
   `7-8`, and `7-1` with gap multiset `[1,1,2,2,2,2,2]`.
2. H1, H2, and H3 each name a claim, a discriminating result, and a weakening
   result; no hypothesis is presented as preferred or confirmed.
3. The ring-force enumeration defines its input sources, immutable constraints,
   enumeration boundary, result categories, and negative controls before it is
   run. A successor cannot close without its recorded result.
4. D-shadow and GOV-227-interleaving checks are each framed as a new Sprint 4
   specification with stated inputs, expected negative controls, and no
   predeclared outcome.
5. Check (iv) is restricted to the D5 run-space target: whether the frozen
   maxrun frame uniquely selects D5 without a declared contact signature,
   office result, or observed outcome. It is opened only as a separate child
   after this planning story records its scope.
6. The registered vocabulary distinguishes rooted 12-bit mask arithmetic in
   `Z12` from the rational LP witness: epsilon `3/407` and
   lambda `(122,101,67,63,30,17,7)/407` are rational certificate values, never
   `Z12` values. A mask-bit example or punctuation boundary is not evidence of
   a new mathematical claim.

## Non-goals and guards

- No implementation, unified operator, graph edge, office assignment, tier
  classifier, admission, runtime behavior, release pin, or global
  `harmonic.C_H` value is created or implied.
- Do not call the D signatures protocol-versioned. Their source status is
  declared signature plus explicit admission as a new protocol tier.
- Do not cite `OBS-004`, `OBS-005`, or `OBS-009` as the owner of K
  exhaustivity; that result belongs to `OBS-008`. OBS-009 is the
  window-intersection theorem.
- Do not say "28 rows" without identifying either `CONSTRUCTS` edges or
  selected D4/D5 `SEAT_CONTACT` chain-audit rows.
- Do not call D-shadow already queued, or call `odd-span anomaly` an existing
  OBS-015 label.
- The LP witness remains rational and feasible, not unique, natural, physical,
  or a `Z12` coordinate.

## Negative controls

- Treat an A-tier-only `K` reconstruction as insufficient for H1 unless it
  derives every required D4/D5 condition from authorized inputs.
- Treat multiple admissible ring outcomes as a weakening result for H2, not as
  an invitation to select an outcome by prose.
- Treat a D4-only or D5-only result as insufficient to generalize across both
  signatures.
- Treat scalar-band overlap in GOV-227 evidence as insufficient for tier or
  office identity.
- Treat the absence of a D-shadow queue item as absence of a result, not
  negative evidence for or against any hypothesis.

## Verification

- Re-read Research Gate 3's gate-time inputs and current twin-hub/fifth-space
  QA receipts before a follow-on check begins; record their exact fingerprints
  separately.
- Verify the existing inputs against `OBS-008`, `OBS-014`, `OBS-015`,
  `OBS-016`, the D-signature table, and the rational LP certificate.
- Review every future check against the exists-or-ticketed language guard,
  modeled on `scripts/validate-validation-prose-consistency.mjs` and wired by
  `package.json` `validate:prose-consistency` / `validate`.
- Run the relevant validation suites and root fixed-point loop after any
  follow-on artifact is intentionally wired. This planning story adds no code
  or executable check by itself.

## Definition of done

The question, symmetric hypotheses, registered vocabulary, prohibited claims,
negative controls, and specifications for the three newly specified checks are
recorded. Ring-force enumeration is explicitly non-bypassable for its
successor. No conclusion about a unified operator or authority change is made.

## Conversion-verification note - 2026-09-04

| Item | Verified conversion |
|---|---|
| Story ID | `EPIC-520-1` is the unique planning record at conversion. |
| K ownership | K exhaustivity is owned by OBS-008, not OBS-004/005/009. |
| Two 28s | The counts are qualified as `CONSTRUCTS` edges or D4/D5 `SEAT_CONTACT` chain-audit rows. |
| D-shadow | It is newly specified, not an existing queue item. |
| odd-span anomaly | The term is registered here, not attributed to OBS-015. |

This short-form table is limited to the handoff-to-story conversion; review it
against the containing commit diff when committing.

## References

- `provenance/DECISION_LEDGER.md:65-88,161-170`
- `provenance/OBSERVATION_LEDGER.md:108-119,217-279,291-301`
- `qa/twin-hub-convergence-validation.json`
- `qa/fifth-space-census-validation.json`
- `canonical/fivefold-incubator/twin-hub-convergence-v0.json`
- `canonical/fivefold-incubator/fifth-space-census-v0.json`
- `canonical/harmonic-compression-candidates/CH_A012_q_v1.json`
- `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md:357-409`
- `docs/TIERED_PHOTONIC_THEOREM.md:53-71`
- `docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md:119-149`
- `docs/R_L_OPERATOR_MATH.md:13-33`
- `provenance/NEXT_STEPS.md:129-137`
- [GOV-510](GOV-510-twin-hub-contact-convergence-audit.md)
- [GOV-511](GOV-511-d-tier-fifth-space-census.md)
- [GOV-512](GOV-512-research-gate-3.md)
