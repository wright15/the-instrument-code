# CRT-310 Per-Class Admission Workflow

CRT-310 is an admission-planning workflow for the 35 pentatonic set classes
that remain proposed after CRT-309. It does not amend the bounded Court
admission, alter a frozen candidate package, or create graph/runtime authority.

The canonical planning artifact is
`provenance/pentatonic-set-class-admission-backlog.json`. Records are ordered by
Forte ordinal and exclude admitted 5-35 and bridge classes 5-23/5-27.

## Evidence Gates

Each class is reviewed independently through:

1. exact source identity;
2. complement closure;
3. class-specific harmonic characterization;
4. explicit transition semantics;
5. bounded application necessity;
6. authority-safety fixtures; and
7. a new deterministic versioned candidate release.

Passing all seven gates means `eligible_for_admission_review`, not admitted. A
separate external one-class decision, versioned substrate release, and
decision-ledger entry remain mandatory. Bulk promotion is prohibited.

The parent-incidence results in
`canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json`
may be cited as `planning_evidence` during a class review. They do not satisfy
any gate by themselves, execute CRT-310, change eligibility, or authorize an
active graph relationship.

The initial backlog has 70 satisfied source/complement results, 175 pending
results, zero eligible classes, and zero admissions. Run
`npm run validate:crt310` to verify source hashes, complement XOR closure,
schemas, per-item fingerprints, build-twice identity, and reversed-input
identity.
