# GOV-519 — Ring-forcing negative-control scaffolding

**Status:** Done — receipt 4401bceadfd2370d99b5202d985740344994865f1eb687c17c4fa6e0dd3d0bad; closed per rule 5 (see activation entry) · **Sprint:** Sprint 4 · **Epic:** EPIC-520
**Depends on:** GOV-518 boundary accepted at binding B₂ = `77379a8654357a784cdadf23b230ff05845f840ea51f7997f1832fd6f25325bf` · **Blocks:** GOV-520 execution gate

**Lineage.** Mandate: DECISION_LEDGER.md:1309-1314 (GOV-518 named the H2 forcing successor). Grant: DECISION_LEDGER.md:1347-1349, as narrowed by entry "GOV-518 grant narrowing — execution condition — 2026-09-07" (the GOV-519 scaffolding receipt is the added execution precondition). Authorization: "GOV-518 boundary acceptance" paragraph (4) (two-ticket split) and entry "Ticket registration — GOV-519 scaffolding re-scope; GOV-520 execution shell opened — 2026-09-07" (this ticket's registration; board rows sync from it). Comparison semantics: amendment A1–A5 ("GOV-518 comparison-semantics amendment A1–A5 — 2026-09-07"). Process record: "Process record — early fixed-point commit 7f61d7c." GOV-516 remains Review with banked outcomes; GOV-517 queue untouched. Renamed from `GOV-519-ring-forcing-execution.md` per paragraph (4); the pre-rename text remains in history as provenance.

**Story.** As a research maintainer, I want the GOV-520 execution path proven blind to the comparison side before any production enumeration, so that a dependency or input-boundary failure can never be mistaken for an H2 result.

**Scope.** Negative-control scaffolding only: input-boundary screens, detector suite, decoy corpus (`tests/gov_518/`), implementations of the GOV-518:103 execution successor suites, fail-closed proof, scaffolding receipt.

**Non-scope.** No verdict, no search over the assignment space, no comparison against the observation side, no H2 disposition, no edits to the GOV-518 boundary. Enumerator implementation and ownership: GOV-520.

**Frozen boundary (read-only; not restated as new content).** GOV-518 at B₂ supplies the assignment space with bound, the derivation map P with primitive_variable_independence, the relational shape predicate with A1–A5 comparison semantics (statistic_orbit, equality_mode, matches, comparison_target), the D₇ quotient with granularity rationale, the registered order with order_invariance, and the completion_certificate gate. The canonical_observation_record is a fingerprint-verified post-enumeration comparison input only, read at the separate comparison entry point.

**Input-channel inventory.** The enumerator is zero-fs: inputs = source constants + pathless argv allowlist. The screen is therefore fully static: (a) import-closure check — closure = single file, zero project imports; fail-closed on dynamic import, require, and unknown fs constructs; (b) input_reach_boundary reachability guard — no reachable path into `tests/gov_518/`; (c) AST integer-literal allowlist scan of enumerator source — every integer literal on a registered structural allowlist, each with a one-line justification; unlisted literal fails; (d) live-value and decoy detection, in memory only, never persisted.

**Detector specifications (CR-1–CR-8; requirements canon, DoD language, semantics unchanged).**

- **CR-1** — No true observed values in any committed non-canonical source (checker, harness, enumerator, fixtures). Numeric observed literals and observed-derivative tuples are prohibited outside the audit allowlist.
- **CR-2** — Three-layer detection. (a) Import-closure + argv allowlist; (b) AST integer-literal allowlist scan of enumerator source: every integer literal must appear on a registered structural allowlist, each with a one-line justification — unlisted literal fails; (c) in-memory live-value suite: at test runtime, read fingerprint-verified canonical artifacts, compute the true-value set and its registered transform-family images (complements, per-tier differences, reversals, reorderings) in memory only, and scan the enumerator/input surfaces for matches. Nothing persisted, ever.
- **CR-3** — Decoy corpus (committed, `tests/gov_518/`): synthetic values across the registered transform families, each tagged with its family and fingerprinted. Sensitivity proof: all decoys rejected. Specificity proof: the clean enumerator and the registered structural constants pass.
- **CR-4** — Adversarial self-test: plants a temp enumerator copy containing a decoy forbidden literal (never a true value) → assert reject → delete → never committed. Unconditional in every pre-flight.
- **CR-5** — Per-term needle justification: no needle may match vocabulary the boundary itself requires the enumerator to use (run/maxrun/argmax-adjacent terms are the statistic's own domain). Retain identifier-class needles (OBS-*/GOV-514/516 references, artifact paths/fields). Class-label strings are registered vocabulary; retention as needles is permitted with recorded justification.
- **CR-6** — Canonical read authority is suite-scoped: the in-memory suite reads canonical artifacts for detection only; the enumerator never does (enforced by the closure check). No-persist enforced by construction; recorded as a review-verified property in the receipt.
- **CR-7** — Failure semantics: any detector red = pre-flight red = enumeration stage never starts. GOV-519 suite failures are GOV-519 scope (rule 5). GOV-520 production pre-flight failure = frozen invalid category. Control runs expose digests only — byte-identity proof without content disclosure; the production run remains the first content-bearing read.
- **CR-8** — Explicit audit allowlist: canonical artifacts (`canonical/fivefold-incubator/*`), validators bound to them, provenance ledgers, registered boundary documents quoting observations (including the GOV-518 ticket), `tests/gov_518/` (decoys only, verified), and the redesigned checker/suite sources post-verification. Assertion: no true R7 values anywhere else in the working tree.

**Build rules.** The CR-2b allowlist is structure-derived, never enumerator-derived: seed candidates carry one-line structural justifications; the list is finalized at GOV-520's first gated step. Enumerator-conformance failure path: the staged enumerator is the specificity specimen; a CR-2b failure is a recorded finding and its fix is GOV-520's first gated step (pre-flight surface; the boundary is untouched).

**Stdout purity.** The enumerator emits boundary id, counts, and classes only; the wrapper receipt carries environment, digests, and all nondeterminism.

**Single-pass reconciliation.** Control runs are pre-flight, compared to each other only (digests, not content), outputs discarded and verdict-ineligible; production enumerates exactly once, post-green.

**Conformance map (GOV-518:103 suites → implementation + D-slot; implemented here, executed at GOV-520 pre-flight).**

- source-binding → input-channel inventory + manifest binding; D9.
- schema → decoy corpus shape and fixture validation; D9/D10.
- exhaustive-completion → orbit-coverage proof + completion_certificate checks; R6/D8.
- determinism → wrapper run-twice digest comparison + D8 environment pin; R6/D8.
- build-twice → byte-identity rebuild check + D8; R6/D8.
- reordered-input → R4/order_invariance; D5.
- negative-control and adversarial-tamper → R7/input_reach_boundary primary; D3/D6 evidentiary only (selection-attestation record; witness-screening record), never sources.
- target_blindness → comparison-target exclusion per R5/A3 (comparison_target); D2.

Skip-with-reason is permitted per GOV-518:103 except the adversarial self-test, which is unconditional.

**State-delta disclosures (receipt-bound).** (1) Enumerator provenance: built under preparation scope pre-acceptance; recorded, not repeated. (2) True-value fixture corpus: staged into the commit path, entered history at commit 7f61d7c (per "Process record — early fixed-point commit 7f61d7c"), deleted from the working tree under this ticket as the recorded correction; the CR-8 audit operates on the working tree. (3) Checker rule-table finding: the staged rule table embedded true observed values; redesigned per CR-1–CR-8 (structural signatures + decoy needles; true-value detection in memory only). (4) Commit-ordering narrow escape: the fixed-point commit landed before fixture deletion; superseded by the standing commit policy recorded in the same process-record entry. (5) The pre-redesign scripts remain in history as provenance; the redesign is this ticket's build scope.

**Vocabulary disposition.** No new Rule-11 tokens are introduced; all snake_case terms used here are registered in the EPIC-520-1 addendum. The prose guard is the arbiter at the sprint fixed point.

**Verification.** Each suite above reports ran or skipped-with-reason at GOV-520 pre-flight per GOV-518:103. Fail-closed demonstration: every detector red on its negative (decoys, planted copies, tamper fixtures) and green on clean surfaces (clean enumerator, registered structural constants). True observed values never materialize outside canonical scope and the audit allowlist.

**Definition of done.** Proven fail-closed gate; scaffolding receipt landed (hashed into CHECKSUMS/MANIFEST at the fixed point); no disposition authority exercised; no search, comparison, or verdict executed.

**References.** GOV-518 ticket at B₂; amendment A1–A5; "GOV-518 grant narrowing — execution condition — 2026-09-07"; "GOV-518 boundary acceptance"; ticket-registration entry; "Process record — early fixed-point commit 7f61d7c"; DECISION_LEDGER.md:1309-1314,1347-1349; EPIC-520-1 addendum; GOV-515 template; GOV-516 Review ticket; canonical artifacts by path+field; MANIFEST.json.
