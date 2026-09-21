# Tier Taxonomy — Ceremony vs. Sprint

**Status:** normative. Placement: `docs/` (normative rules live here; planning lives in `scrum/`).
Pointer back: `scrum/BACKLOG.md` header cites this path; both landed in the same commit so the pointer resolves at birth.

## Trigger test (normative)

If the sentence will appear in a **ledger entry or canonical document**, it is **ceremony**.
If it lives in **code, tests, or docs**, it is **sprint work**.

## Claim-event catalog

The following are claim events and require ceremony (candidate doc, compliance receipt,
ledger entry, born-compliant evidence per `provenance/EVIDENCE_BINDING_CONVENTION.md` §§1–3):

1. **Derivations** — asserting a result is `derived`/`not_derived` under a registered boundary
   (e.g. GOV-517 D5 verdict, `provenance/DECISION_LEDGER.md:1680-1692`; D4 outcome, `:2195-2252`).
2. **Canonical admissions, including new ontological domains** — admitting a spec, surface,
   or topology as a candidate record (e.g. SPEC-001 v0.2.1 document-only admission, ENTRY 11,
   `:2298-2426`; convention admission, ENTRY 12, `:2430-2486`).
3. **Release boundaries** — clearing a promotion gate or claiming a green release
   (e.g. `STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE`, `docs/specs/fivefold_constructs_engine_spec.md:10,40,229`).
4. **Amendments to admitted records** — any change to a sealed report, admitted spec,
   boundary, or `not_derived` record (e.g. a future D4 record amendment).

## Default-to-fast rule

Everything else defaults to **sprint**: authoring, prototyping, tests, replay harnesses,
read-only analyses, fixture catalogs, findings memos, sandbox probes, validator code.
Sprint artifacts carry no evidence obligations and are iterated by normal commit.
Only graduation of a sprint result into one of the four catalog classes above is a claim event.

Sandbox probes are sprint artifacts **only** while they touch no canonical topology,
ledger, Court runtime, Neo4j projection, or shared freshness sidecars
(SPEC-001 §4.3 do-not-touch boundary) and claim no verdict.

## Worked example — Q transition table

- **Authoring** the concrete Z12-indexed 16-state table for Quintessence
  (SPEC-001 §1.3, `docs/specs/fivefold_constructs_engine_spec.md:102-121`) is **sprint**:
  per the spec, extraction is reproducibility work while authoring is new design work
  with its own evidence trail — but both trails are built by normal iteration.
- **Asserting closure** (INV-5 joins the evidence-backed surface) is a **claim event**:
  it amends the admitted record and must go through ceremony.

## Citations

- Fences: `docs/specs/fivefold_constructs_engine_spec.md:33-40` (fence #5: multi-phase/toroidal
  work is a separate future candidate).
- Refresh procedure: SPEC-001 §4.2 (`:250-268`), not Convention §4.
- Binding convention: `provenance/EVIDENCE_BINDING_CONVENTION.md` §§1–4
  (cut line is content-located per §3.3 `:357-363`; never embed a commit hash in code).
