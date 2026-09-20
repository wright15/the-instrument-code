# Evidence Binding Convention v1

| Field | Value |
|---|---|
| Convention ID | CONV-EVIDENCE-BINDING-001 |
| Version | 0.1.2 |
| Status | Admitted; the authority for that status is the admission ledger entry and compliance receipt, not this header. `[DERIVED - provenance/DECISION_LEDGER.md, admission entry for CONV-EVIDENCE-BINDING-001 — located by content per §3.3]` |
| Scope | Evidence registrations, receipts, bindings, digests, ledger citations and machine-emitted evidence; not conceptual design prose or root inventory mechanics. `[DEFINED]` |
| Migration | Prospective-only; no silent historical rewrite. `[DEFINED]` |
| Content Digest | External-only; no in-document self-hash. `[DEFINED]` |
| Intended Home | `provenance/EVIDENCE_BINDING_CONVENTION.md` |
| Draft Mandate | D1-D5 and their three refinements are incorporated under the current maintainer drafting directive. This does not constitute repository admission. `[DEFINED]` |
| Historical Authority Limit | ENTRY 11 motivates this work but expressly did not adopt a convention. `[DERIVED - provenance/DECISION_LEDGER.md:2423-2426]` |

## Revision History

`[DEFINED]` Versions identify candidate text, not an assertion of completed admission.

| Version | Change |
|---|---|
| 0.1.0 | Initial SPEC-001-cycle candidate; source review identified self-application and attribution findings. |
| 0.1.1 | Incorporates D1-D5: post-commit reproducibility, semantic ledger-hash scope, compliance receipts and pinned primitive reference, content-located enforcement boundary, and this convention's own release disposition. Splits precomputable blob OIDs from post-hoc commit discovery; retains corrected incident scope and nine-plus-four probe attribution. Regenerated after volatile-storage loss of the first v0.1.1 draft; content reconstructed from the ratified decisions and repository-anchored sources; no prior bytes were admitted or cited. |
| 0.1.2 | Admission-time corrections on reviewed v0.1.1: header status resolved to admitted-by-ledger-reference; §8 registry/receipt sentence converted from temporal to causal form. All other bytes identical to the reviewed candidate. |

`[DEFINED]` The artifact ID and work-item ticket are different identities. Allocate
the next available GOV-52X ticket at admission execution without changing this
CONV ID. If that execution changes these reviewed bytes, use v0.1.2 or a later
version with a revision row, then reverify the final bytes before binding.

## 0. Purpose, Scope, and Self-Application

### 0.1 Purpose

`[DEFINED]` Each of the six rules names a documented motivating incident. The
convention turns session lessons into persistent, discoverable evidence-handling
policy. Registered availability is not proof that every future agent has read it.

### 0.2 Scope Boundary

`[DEFINED]` The convention governs evidence claims and authoritative dependencies,
not conceptual design content. It grants no mathematical derivation status,
runtime, topology, GOVERNS, Court or Neo4j authority. Root inventory integrity is
distinct from evidence-authority binding; its raw-file hashing remains intact.

SPEC-001 distinguished historical claims, design overlays and gated correspondence
within that specification. This convention's prospective project-level scope is
not a retroactive enlargement of SPEC-001.
`[DERIVED - docs/specs/fivefold_constructs_engine_spec.md:46-63]`

### 0.3 Self-Application

`[DEFINED]` This convention applies to its own admission artifacts. Registration
may be prepared from final worktree bytes; R1's enforceable invariant is checked
against committed content, not a requirement that newly written bytes already
have a containing commit before registration is prepared.

`[DEFINED]` Self-application does not require an artifact to contain its own
digest, blob OID or containing commit ID. Bindings describe their subject bytes
externally. Do not create mutual digest cycles between a receipt and the ledger
entry that cites it. Paths, artifact IDs and admission declarations can resolve
without both artifacts embedding each other's final digest.

## 1. Evidence-Class Tags and Directive Intake

### 1.1 Claims and Citations

`[DEFINED]` After admission, these tags apply prospectively to evidence claims.
A tag on an introductory paragraph scopes its immediately following table or
list unless an item supplies its own tag.

| Tag | Meaning |
|---|---|
| `[DERIVED - citation]` | A historical fact supported at the cited record's scope. The locator and the interpretation must both be verified. |
| `[DEFINED]` | A construct, rule or policy; no claim of prior derivation or admission. |
| `[GATED - condition]` | Unresolved claim or execution prerequisite; not an established fact. |
| `[PROPOSAL - decision]` | Implementation detail awaiting a later authorized decision, not an implicit rule. |

`[DEFINED]` An untagged claim is void. Identity and structural fields, including
IDs, versions, headings and intended homes, are DEFINED-by-construction and need
no repetitive tag. Header assertions about authority, derivation and release
status require their own tag. A resolving citation is necessary, not sufficient:
the referenced text must actually support the attached claim.

`[DEFINED]` New JSON citations use RFC 6901 JSON Pointers; text citations use line
ranges. This is prospective-only; old JSON line citations are not rewritten.
`path.json#/field` locates content; it does not replace artifact integrity. Escape
`~` as `~0` and `/` as `~1` inside pointer tokens. Pointers tolerate reformatting,
not arbitrary changes to keys or array ordering. Version-sensitive code references
also pin the source blob, as in R4.

### 1.2 Anchor Discipline

`[DEFINED]` Verify orchestration-supplied anchors against an identified repository
snapshot. New or revised citations require the same check. Correct or demote an
unsupported claim before admission; do not convert a quoted historical record
into current authority merely by putting it inside a receipt.

### 1.3 Directive Intake

`[DEFINED]` Decompose maintainer design-intent prose into three layers:

1. Historical claims require supporting DERIVED citations or removal.
2. Design overlays are DEFINED and explicitly distinguished from registered semantics.
3. A claim that an overlay corresponds to registered semantics is GATED until explicit correspondence evidence supports it.

SPEC-001 retained elemental and operator-role overlays without equating them to
registered GOV-517 semantics, and deferred the Q table.
`[DERIVED - docs/specs/fivefold_constructs_engine_spec.md:73-121]`
`[DERIVED - docs/specs/fivefold_constructs_engine_spec.md:151-174]`
`[DERIVED - qa/specs/fivefold-constructs-001-admission-attempt-3.json#/deferrals]`

## 2. Binding Rules

### R1 - Post-Commit Reproducibility

`[DEFINED]` Registration may be computed from worktree bytes during an admission
session. Its enforceable invariant is post-commit: the registered digest must be
reproducible from the corresponding committed subject bytes using the named
recipe and any explicitly declared selection. A correct worktree hash paired
with different committed bytes is noncompliant.

`[DEFINED]` Mandatory-at-birth binding fields are `recipe`, `digest`, and
`byteLength`, associated unambiguously with the subject artifact path. The recipe
identifies its digest algorithm. `byteLength` counts the bytes actually presented
to the digest primitive: the full subject for an ordinary binding, or the selected
prefix length for R2. Do not confuse it with R2's entry-span length.

`[DEFINED]` The two Git identities have distinct treatment:

- **Blob OID:** deterministically computable before commit from finalized subject bytes, using `git hash-object --no-filters` without `-w`. A receipt or ledger entry may record that subject OID. This is not an instruction to embed a file's own OID inside itself. Post-commit verification must catch any difference introduced by staging, clean filters, line-ending conversion or other changes.
- **Containing commit ID:** not self-recorded at birth and never required as a later materialization field. Discover relevant commits post-hoc from history, then verify the subject path and blob in the appropriate tree. Recording the final containing commit inside one of its own files is circular.

`[DEFINED]` `git log --find-object=<oid>` is a discovery aid, not proof of a unique
origin. Its results can include additions, removals or repeated use of the same
blob. Inspect candidate diffs and trees; verify the blob at the claimed artifact
path in the relevant admission/source tree. An available dangling object is not
a substitute for committed subject bytes. Missing or ambiguous history is an
unresolved verification result, not permission to guess.

`[DEFINED]` Verification checks the committed subject's type/path association,
applies any declared byte selection, reproduces `digest` with `recipe`, and checks
`byteLength`. When a subject OID was recorded, it must also match. A pre-commit
receipt may describe checks already performed and this post-commit obligation;
it must not claim to have observed a future commit. No second evidence rewrite
is required just to insert a discovered commit ID.

The motivating census registration named bytes different from the committed
snapshot. The historical local sweep of 1,985 available blobs did not recover
its pin. This is a failed committed-content binding, not proof of global loss or
a uniquely established historical cause.
`[DERIVED - provenance/DECISION_LEDGER.md:2320-2349]`
`[DERIVED - provenance/DECISION_LEDGER.md:2373-2376]`

### R2 - Entry-Scoped Ledger Bindings

`[DEFINED]` Apply the semantic test: **does this hash assert that the ledger's
current state is the evidence?** If yes, a span binding is required. Otherwise
the following uses remain permitted, provided they are not repurposed as current
authority/freshness checks:

1. Root inventory hashes in MANIFEST/CHECKSUMS, whose purpose is distribution and workspace integrity.
2. Historical quotations and lineage fields such as `supersedesWholeFileSha`, recording what was previously bound.
3. Archival/distribution digests fixing the content of a frozen release or deposit.

`[DEFINED]` One binding covers one contiguous span. Non-contiguous entry sets
require multiple bindings. Extend the artifact's existing `evidenceBindings`
structure, rather than introducing a competing top-level ledger-binding format.
The span member fields are:

| Field | Meaning |
|---|---|
| `artifactPath` | Repository-relative source ledger path. |
| `entryIds` | Entry identities covered by this contiguous span. |
| `spanByteOffset` | Zero-based raw-byte start offset; nonnegative integer. |
| `spanByteLength` | Positive span length, within the source's bounds. |
| `spanPrefixSha256` | SHA-256 over raw bytes `[0, spanByteOffset + spanByteLength)`. |
| `supersedesWholeFileSha` | Optional historical whole-file digest retained as lineage, not a live authority check. |

`[DEFINED]` Prefix selection is a binding-field convention, not a second digest
primitive. Select the exact prefix specified above, then apply `raw-bytes-sha256`
from R4. No normalization, decoding or re-encoding intervenes. Where represented
alongside R1's fields, `digest` equals `spanPrefixSha256`, `recipe` is
`raw-bytes-sha256`, and `byteLength` is `spanByteOffset + spanByteLength`.

`[DEFINED]` Verify the source, entry identities and boundaries, integer bounds,
selection and digest. Byte offsets are not character offsets. An end-append
preserves an old prefix; insertion or alteration before its endpoint does not.
Prefix integrity includes the bytes preceding the span, but does not itself
establish whether a later entry revoked or superseded its authority. Applicable
current-authority checks remain part of the consuming ceremony.

`[DEFINED]` This convention defines the selection semantics; no range-selection
implementation is authored at its admission. The validator follow-up implements
selection and the versioned collection/consumer migration. Until then the
admission checklist uses manual checks against these explicit definitions.

Twin-hub's historical two ledger bindings diverged while its canonical-ledger
and network bindings matched, and D4's bound evidence was deliberately preserved
instead of refreshed.
`[DERIVED - qa/specs/fivefold-constructs-001-r1-forensics.md:171-187]`
`[DERIVED - qa/d4-production-landing.json#/preserved]`
`[DERIVED - qa/d4-production-landing.json#/deferred]`

The earlier pin migration implemented live whole-ledger artifact bindings and
separate admission-entry checks. It documents prior recognition of the freshness
class, not adoption of this new span policy.
`[DERIVED - scrum/plan/ledger-pin-migration.md:9-21]`
`[DERIVED - scrum/plan/ledger-pin-migration.md:56-58]`

The inspected schemas declare an `evidenceBindings` object; the current twin-hub
validator still requires the old whole-ledger fields and full binding equality.
The convention is therefore not a claim that live consumers already accept spans.
`[DERIVED - schemas/fivefold-incubator/twin-hub-convergence-v0.schema.json#/properties/evidenceBindings]`
`[DERIVED - schemas/fivefold-incubator/fifth-space-census-v0.schema.json#/properties/evidenceBindings]`
`[DERIVED - scripts/validate-twin-hub-convergence.py:280-292]`

### R3 - Payload and Provenance Separation

`[DEFINED]` Living pipeline artifacts separate immutable payload bytes from
ceremony-controlled binding sidecars. A payload version's digest does not change
merely because provenance is refreshed. Changed analytical content requires a
new payload version/identity and evidence. No sidecar authorizes overwriting a
sealed historical receipt.

`[DEFINED]` Verification compares payload identity and digest across a
provenance-only refresh and checks the sidecar's payload reference. Historical
bindings must remain resolvable when a shared live artifact changes.

The two inspected post-registration census updates changed only ledger bindings
and the candidate fingerprint. The diagnostic payload projection agreed for the
named committed snapshots, not for every conceivable or unavailable historical
state.
`[DERIVED - provenance/DECISION_LEDGER.md:2340-2349]`
`[DERIVED - qa/specs/fivefold-constructs-001-r1-forensics.md:121-142]`

### R4 - Named Digest Recipes

`[DEFINED]` Evidence bindings name a versioned digest recipe with a resolvable
implementation reference. Ad-hoc normalization is prohibited. The default
`raw-bytes-sha256` primitive computes SHA-256 directly over the selected raw byte
sequence and represents the result as lowercase hexadecimal; its operation
does not depend on a JSON serialization recipe.

`[DEFINED]` The recipe registry at `provenance/digest-recipes.json` is created
and inventory-registered during this convention's admission execution. Its
`raw-bytes-sha256` entry carries this pinned implementation reference:

```json
{
  "path": "scripts/manifest-utils.mjs",
  "range": { "startLine": 31, "endLine": 37 },
  "blobOid": "6f761dbecc620e4679dccae3d4ef8ca82e3a4833"
}
```

The cited helper reads a file's raw bytes, records their length and computes
SHA-256 over those bytes. The selected blob identifies the reviewed version of
that primitive, not an implementation of R2 range selection.
`[DERIVED - scripts/manifest-utils.mjs:31-37; blob 6f761dbecc620e4679dccae3d4ef8ca82e3a4833]`

`[DEFINED]` For this reference, the Git object format is SHA-1; it is distinct
from the recipe's SHA-256 content digest. Resolve the pinned blob before locating
the line range, and verify its occurrence at the stated path in committed
history. A later edit of the working file does not change the named primitive.
Historical objects must remain available; an absent object is a verification
failure, not an invitation to substitute current bytes.

`[DEFINED]` Recipe amendments preserve the meaning and resolvability of old
recipe versions. Verify the recipe ID, primitive definition, pinned reference,
declared selection and reproduced digest. R2 prefix handling is the application
of the raw primitive to explicitly selected bytes, not newly authored hashing
code at registry birth.

Nine R1 normalization probes and four authorized R2 serialization variants did
not reproduce the historical census pin. Some overlapped or were no-ops; their
failure did not establish why the original pin differed.
`[DERIVED - qa/specs/r1-census-normalization-exact.txt:1-9]`
`[DERIVED - provenance/DECISION_LEDGER.md:2362-2376]`
`[DERIVED - qa/specs/fivefold-constructs-001-admission-attempt-3.json#/incident/probes]`

### R5 - Generator Provenance

`[DEFINED]` Machine-emitted evidence records its emitting script path, script
digest at emit time, invocation arguments and timestamp. If it contains digests,
identify the component that computes each digest, distinguishing calculation
from carrying an upstream assertion. Verify those references under R1/R4.

`[DEFINED]` R5 applies to evidence artifacts, not root inventory envelopes.
MANIFEST/CHECKSUMS retain their existing schemas. The admission ledger entry
records the inventory-emitting tool and version in one line. A release-derived
inventory date is not asserted to be an execution timestamp.

`[DEFINED]` An entrypoint hash alone is not a claim to bind all runtime/import
dependencies required for replay. Put execution-specific provenance in the
binding sidecar when it would otherwise perturb a deterministic payload.

The GOV-517 registration helper hashes raw bytes and asserts inventory parity;
the inventory helper also hashes raw bytes. These are inspected code paths, not
proof of which historical process ran or of the exact cause of the mismatch.
`[DERIVED - qa/gov-517-input-registration.mjs:14-29]`
`[DERIVED - qa/gov-517-input-registration.mjs:96-103]`
`[DERIVED - scripts/manifest-utils.mjs:31-37; blob 6f761dbecc620e4679dccae3d4ef8ca82e3a4833]`
`[DERIVED - provenance/DECISION_LEDGER.md:2351-2376]`

### R6 - Receipts Registered at Birth

`[DEFINED]` Evidence created in a work session is inventory-registered in that
session; temporary storage is transit only. Ledger entries, specifications and
memos must not use unregistered paths as authoritative evidence. A temporary
origin quoted as history is not itself an active authority dependency.

`[DEFINED]` Compliance receipts for conventions live in `qa/conventions/`.
Verify each active dependency's registered path and bytes, and require R1's
post-commit reproducibility. Registration before the final commit is allowed;
unregistered evidence at the session's closure is not. Do not implement this
rule as a blanket ban on temporary-directory strings appearing in historical
quotations.

Two preservation operations are documented: attempt 1 was preserved and
registered, followed by the R1 memo with eleven annexes during attempt 3.
`[DERIVED - qa/specs/fivefold-constructs-001-admission-attempt-2.json#/attempt1Preservation]`
`[DERIVED - qa/specs/fivefold-constructs-001-admission-attempt-3.json#/evidencePreservation]`

`[DEFINED]` The associated near-miss lesson is exposure to loss before durable
registration/commit, not an assertion that a third preservation operation or an
actual loss event occurred. The sourced count remains two registered operations.

## 3. Enforcement

### 3.1 Admission Checklist Hook

`[DEFINED]` Each new admission receipt assesses applicable rules with PASS,
FAIL, or a reasoned prospective-scope exemption. Distinguish observed checks
from declared post-commit invariants. The convention's own receipt belongs in
`qa/conventions/`; a pending future commit must not be recorded as an observed
post-commit PASS.

`[DEFINED]` Manual checklist enforcement is sufficient for convention admission
before a dedicated validator exists. Advisory tool output is not a waiver of
the normative requirements or a substitute for checking the committed result.

### 3.2 Advisory Validator Follow-Up

`[DEFINED]` The follow-up names are `scripts/validate-evidence-bindings.mjs`
and `validate:evidence`. Authoring, tests and wiring occur in a separate work
item, beginning advisory-first. No validator code is part of this admission.

`[PROPOSAL - follow-up implementation]` The checker will cover:

- R1: committed source/path identity, recipe reproduction, selected byte length and any recorded subject OID.
- R2: the semantic current-ledger test, contiguous entry bounds, prefix selection and permitted historical/inventory/archive uses.
- R3: payload/sidecar identity and absence of provenance-only payload churn.
- R4: recipe identities and blob-pinned implementation references.
- R5: evidence-emitter and digest-origin records at evidence scope.
- R6: active registered dependencies rather than lexical string prohibitions.

### 3.3 Content-Located Enforcement Boundary

`[DEFINED]` The cut line is the commit introducing the ledger entry that records
this convention's admission. Identify that entry by the convention ID, version
and explicit admission disposition; inspect history to find the introducing
change. A later commit merely containing or quoting the same entry is not the
cut line. No containing-commit ID must be embedded in the convention or entry.

`[DEFINED]` Enforcement attaches at birth: classify evidence by its emitting
session relative to that cut, including the convention's own admission session.
Do not infer exemption solely from an old pathname or an arbitrary timestamp.
Detailed session/version classification and history traversal belong to the
validator follow-up. Missing or ambiguous evidence must not become an automatic
grandfathering PASS; preserve the unresolved result for review.

## 4. Migration and First Live Tests

`[DEFINED]` The policy is prospective-only. Preserve historical sealed evidence;
create forward bindings and payload versions at their authorized next ceremony.
This convention does not grant a cascade, replay, reclassification or historical
rebinding.

`[DEFINED]` The first intended live tests remain:

1. Preserve D4-bound twin-hub evidence before an authorized cascade; exercise span binding and payload/provenance separation.
2. Re-register GOV-517 inside the later SPEC-001 section 4.2 promotion refresh; exercise committed-content reproducibility, named recipes and generator provenance.

ENTRY 11 already requires the later refresh to settle its own boundary and
execution authorization, and requires preservation before shared refresh. It
did not adopt this convention or execute those actions.
`[DERIVED - provenance/DECISION_LEDGER.md:2392-2406]`
`[DERIVED - provenance/DECISION_LEDGER.md:2423-2426]`

## 5. Incident Inventory

`[DEFINED]` This inventory motivates the six rules without creating new ones.

| Incident | Strongest Record and Scope | Motivation |
|---|---|---|
| Unverified spec provenance and self-hash instruction rejected | Specific failed checks, not an admitted draft. `[DERIVED - qa/specs/fivefold-constructs-001-admission-attempt-1.json#/checks]` | Section 1; external integrity |
| Temporary evidence needed later preservation | Two documented preservation operations. `[DERIVED - qa/specs/fivefold-constructs-001-admission-attempt-2.json#/attempt1Preservation]` `[DERIVED - qa/specs/fivefold-constructs-001-admission-attempt-3.json#/evidencePreservation]` | R6 |
| Registered pin differed from committed snapshot | Historical local recovery failure, not a present/global absence claim. `[DERIVED - provenance/DECISION_LEDGER.md:2320-2338]` | R1 |
| Nine plus four unsuccessful probes | Correctly separated R1 and R2 series; no causal claim. `[DERIVED - qa/specs/r1-census-normalization-exact.txt:1-9]` `[DERIVED - provenance/DECISION_LEDGER.md:2362-2376]` | R4 |
| Digest origin required emitter/helper inspection | Raw computation roles known; historical execution mechanism not proved. `[DERIVED - provenance/DECISION_LEDGER.md:2351-2360]` | R5 |
| Whole-ledger bindings went stale on append | Documented source divergence and prior whole-file solution. `[DERIVED - qa/specs/fivefold-constructs-001-r1-forensics.md:171-187]` `[DERIVED - scrum/plan/ledger-pin-migration.md:9-21]` | R2 |
| Provenance-only census fingerprint churn | Limited to named inspected snapshots and transitions. `[DERIVED - provenance/DECISION_LEDGER.md:2340-2349]` | R3 |

## 6. Amendment Procedure

`[DEFINED]` Amend through proposal, verification, an admission compliance receipt
and an append-only ledger decision. Include the new version and revision row
before calculating final bindings. An admission-time change to reviewed v0.1.1
requires v0.1.2 or later and renewed byte/citation checks, not a silent overwrite.

`[DEFINED]` The recipe registry is born and registered during this convention's
admission execution. Preserve historical recipe semantics and pinned code
references under later amendments. No new range-selection or validator code is
needed at this registry's birth; R2 defines the application of the raw primitive.

`[DEFINED]` Add rules only with a named incident or first-live-test finding.
Maintainer end-to-end review of the final candidate precedes admission. Agent
checks do not substitute for that sign-off.

## 7. Admission Checklist and Release Disposition

`[DEFINED]` This is a checklist for a later execution, not its completion record.

1. Obtain maintainer end-to-end review of v0.1.1 and its feedback. Select the reviewed bytes, or bump the version before any admission-time textual change.
2. Allocate the next free GOV-52X work-item ID and record it within the approved admission surfaces. Preserve the convention's independent artifact ID.
3. Verify factual anchors, JSON Pointers and pinned recipe blob/range. Compute registrations from the final subject bytes, recording recipe, digest, byte length and any desired subject OIDs without self-reference.
4. Create the convention at `provenance/EVIDENCE_BINDING_CONVENTION.md`, the recipe registry at `provenance/digest-recipes.json`, and a compliance receipt under `qa/conventions/`. Create no validator code or shared-artifact migration.
5. Append a self-contained admission entry, mirroring ENTRY 11's section/date/status/subsection form without introducing a new index requirement. Cite registered repository evidence and record inventory tool plus version in one line. Do not forward-cite temporary review files as admitted authority.
6. Register final file bytes in MANIFEST/CHECKSUMS; ensure all active cross-references resolve in the admission tree. Avoid cyclic final-digest dependencies between the receipt and its admission entry. Verify the resulting committed subjects under R1.
7. Record per-rule compliance and actual validation outcomes. Do not label unperformed post-commit checks as observed; committed-content invariants remain independently checkable without embedding the containing commit ID.

`[DEFINED]` **This convention's own release disposition:** admission scope is
manifest freshness, citation resolution and the binding/compliance checks above.
Run full `npm run validate` during the later authorized admission, but record
currently ledger-recorded stale gates as expected release state, not as automatic
convention-admission blockers. Identify the expected gate names and their record
before the run; an arbitrary new `STALE_*` error is not covered. Unexpected
failures halt. Do not repair shared artifacts, weaken controls or claim a green
integrated release merely to complete this convention's admission.

ENTRY 11 records the prior `STALE_TWIN_HUB_CONVERGENCE` stop for SPEC-001. This
candidate's disposition is defined above under the present directive; it is not
inherited historical authority from that earlier exception.
`[DERIVED - provenance/DECISION_LEDGER.md:2408-2426]`

## 8. Review and Follow-Up Boundary

`[DEFINED]` D1-D5 resolve the candidate's policy-level bootstrap findings. The
blob-OID/commit split and pinned primitive reference remove self-recording
requirements; the receipt home and inventory carve-outs fix the admission scope.
This statement defines the intended policy, not a claim of executed admission.

`[GATED - later authorized work]` The registry and admission receipt are created
by the separate admission execution, not by this document's text. Validator
implementation, session classifier, binding collection migration and first live
tests remain follow-up work. They are not admission-time code changes hidden
inside a prose convention.

`[DEFINED]` Readiness means ready for the maintainer's final reading and separate
admission execution plan. It does not mean admitted, committed, enforced by a
new validator, or clear of release gates.
