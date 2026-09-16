# D4 Implementation Specification Draft

**Status:** draft for maintainer relay review only. No engine, scaffolding,
pre-flight, production execution, result, or H-disposition is authorized or
emitted. No GOV identifier is allocated. ENTRY 9 freezes the boundary, not this
implementation spec. Proposed interface/gate names below are reviewable receipt
labels, not additional research categories or independently registered authority.

## 1. Authority And Bindings

`provenance/DECISION_LEDGER.md`, ENTRY 9, is the authority for the unchanged
`scrum/plan/d4-boundary-draft.md` bytes, despite their historical draft wording.
Frozen boundary SHA-256:
`751d56d4f01ea1a0d054c8119d178a64b20787aa9fb095a02c99f3ba3b135de2`.
The preceding reachability hold and orientation correction remain provenance;
neither is erased by the freeze or by this spec.

| Artifact | SHA-256 Recomputed For This Draft | Role |
|---|---|---|
| `canonical/universal-heptatonic-ledger.json` | `e6570972260fdae5c4ca878272dc89a9ff353d48762eefbe019707d229cd242d` | Bound identity/anchor source; mixed file, not blanket generation permission |
| `canonical/universal-network-data.json` | `21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc` | Bound structural source, split generation/comparison projections |
| `qa/twin-hub-convergence-validation.json` | `b7f924ca53859b832334200245f690196433e8c8eb213e2ce26afa5e62e230d2` | Existing field/chain audit receipt; not a generator input or substitute observation |

At future pre-flight, recompute source, spec, implementation-closure and fixture
bindings against the accepted registration and current manifest/checksums. A
matching hash identifies bytes; it does not authorize every field in those bytes.
Do not migrate a stale source binding silently. Diagnostic metadata and all
observations stay outside the generator's input closure.

The GOVERNS grant and its cost remain:
"D4's derivation is relative to granted inheritance structure; a positive result
derives the contact geometry, not the inheritance relation; comparability with D5
is preserved by substrate-parity (CONSTRUCTS granted there, GOVERNS granted here)."
This does not derive satellite membership or parent assignment, transfer D5's
semantics, or establish quantitative cross-boundary evidence strength.

`scrum/GOV-517-implementation-spec-draft.md` is architectural history only. Its
superseded offset control and older claim-level semantics must not be copied.
Use the registered later G1-G5/code-review lessons for isolation discipline,
not D5 predicates, outcome rules, input grants or runtime constants.

## 2. Stages And Route Isolation

The observable stage order is binding verification, trusted structural extraction,
generation, complete materialization and seal, separate comparison startup,
comparison accounting, and frozen outcome selection. Comparison cannot start
without a valid complete seal. There is no feedback edge to generation.

Required input/call-graph boundaries, independently checked at code review:

| Root / Stage | Permitted Inputs | Forbidden Dependencies |
|---|---|---|
| Trusted extraction | Bound ledger/network bytes, section 3 projection rules | D4-based filtering of R/E/anchors; passing full documents to generation |
| T-A | A0 masks/offices/identities, A1 parent identities/offices, complete R | E, T-B/T-C outputs, seam labels, D4 contacts or comparison results |
| T-B | A0/A1 endpoint identities/tiers, complete E, complete R, parent offices | Mask rotation, K/twin tests, T-A/T-C outputs, observed contact/seam results |
| T-C | A0/A1 anchor masks/offices/identities | R, E, T-A/T-B outputs, seam labels, selected midpoint answers |
| Sealing | Complete typed outputs and binding metadata | Observation-dependent filtering or partial-success selection |
| Comparison | Valid sealed outputs, bound comparator projections in section 3 | Calling a generator, repairing outputs, changing the seal or inputs |

T-A and T-B must have separate reachable call trees for generative predicates.
T-C must recompute its full relation from its own input projection, not collect
T-A matches. Shared inputs are shared axioms, not evidence of independence.
Shared helpers, if any, require an explicit exact-name allowlist with non-empty
reasons showing neutral deterministic behavior, no mutable cross-route state,
no target selection and no observation access. Shared generative predicates
between T-A and T-B are prohibited; sharing a pure rotation utility between
T-A and T-C requires explicit review and does not make those routes independent.

Generation must have no filesystem, network, process/environment, clock, random,
locale-sensitive or dynamic-import dependency. Prove transitive isolation,
including closures/defaults/caches/error paths; naming two functions is not
proof. Comparator, detection suites and control fixtures are unreachable from
production generation. Route-scoped defects must be attributable even when
the global conformance gate rejects the whole run. The implementation may choose
its internal rejection mechanism; this spec fixes the required observable gates.

## 3. Field-Level Registrations For Review

These registrations transcribe ENTRY 9's sources and joins at field level.
They are carried here for spec approval, not asserted as a new ledger entry.
An authorized extractor may inspect mixed source bytes to select structural
records; the pure generation runtime receives only the following projection.

### 3.1 Generation Projection

From the ledger, inspect `id`, `tier`, `role`, `officeIndex`. Select complete
A0/A1 anchor records and A1 satellite endpoint records. For anchors only, the
canonical integer `id` is the Z12 pitch-mask identity m(x); do not substitute a
fifth-position mask for this semitone-rotation operand. Satellite IDs are opaque
join identities for T-A/T-B, not satellite masks to interrogate or transform.
The seven-office index convention is the bound `officeIndex`, not an index
in input order and not an office-name lookup authored in the engine.

From `network.structuralEdges`, inspect `id`, `type`, `source`, `target`,
`directed` and resolve endpoint types against the ledger projection:

- R: `type=GOVERNS`, source h an A1 anchor, target s an A1 satellite;
  `directed=true`. Retain edge ID and ordered endpoints with their typed identities.
- E: `type=CONSTRUCTS`, source an A0 anchor, target an A1 anchor;
  `directed=true`. Retain edge ID and ordered endpoints with their typed identities.
- No selection by `SEAT_CONTACT`, D4 membership, observed midpoint, `selected`,
  `eligible`, `phaseDelta`, `provenance`, or a previously computed success flag.

Validate finite exact integer identities, unique anchor IDs/offices in each
complete tier, unambiguous typed endpoints, unique edge IDs and unique R pairs.
An anchor ID may legitimately occur in multiple edges: do not mistake repeated
parent references for duplicate anchor declarations. Malformed or conflicting
records are invalid, not silently dropped. Completeness is checked against the
bound source projection, not a hard-coded list of successful witnesses.

### 3.2 Comparator Registration: Endpoint Direction

Canonical source: `canonical/universal-network-data.json#/structuralEdges`;
identity source: `canonical/universal-heptatonic-ledger.json` fields
`id`, `tier`, `role`, `officeIndex`. After sealing, select `type=SEAT_CONTACT`
with source s an A1 satellite and target d a D4 anchor. Read and retain
`id`, `type`, `source`, `target`, `directed`. The stored contact rows have
`directed=false`: these are undirected contact incidences with fixed serialized
endpoint roles, not directed traversal permissions. Do not reverse the fields
to make a malformed observation match. R and E retain `directed=true`.

Receipt support: `qa/twin-hub-convergence-validation.json`, check
`d4-chains-valid`, is PASS for the 14 one-hop chains. This draft's read-only
field audit additionally checked all contact direction flags and endpoint roles;
it did not run a generator or compare any generated contact set.

### 3.3 Comparator Registration: Contact-To-Parent Join

Read comparison-time R independently from the same bound network source using
the section 3.1 selector. For every contact source s, require exactly one
`GOVERNS` edge with `target=s` and source h an A1 anchor. Read h's
`officeIndex` from the ledger. Keep `(contact row ID,d,s,h,o(h))` as provenance;
key = `(o(h),s)`. The D4 anchor's office is not the comparison coordinate.
Missing/ambiguous parents, wrong types/direction and duplicate contact IDs reject
at comparison-input validation; they never become the `neither` contact cell.
Retain distinct contact rows even if they yield the same key; count rows and
deduplicated keys separately, and never replace one with the other in a receipt.

Receipt support: `d4-chains-valid` and the source-only audit both establish
unique one-hop A1 parents for every selected source. This does not establish
generation or authorize a generation-time read of the selected contacts.

### 3.4 Comparator Registration: A1 Seam Provenance

After sealing only, read `network.structuralEdges` fields
`id`, `type`, `source`, `target`, `directed`, `provenance` for the A0-to-A1
CONSTRUCTS population identified by endpoint `id/tier/role`. Select exactly
`provenance="phase-seam construction"`; group by target h, require two distinct
A0 parents, and obtain `o(h)` from the ledger's `officeIndex`. Comparison value
is `(unordered parent-ID pair,o(h))`. Sort that pair only in the comparison
projection; preserve the directed T-C tuples and both edge IDs as evidence.
No seam label enters E's generation projection or any route's call tree.

Receipt support: the existing `d4-midpoints-seated` and
`d4-pairs-disjoint-no-hub` checks pass. The source-only field audit found four
selected edges in two groups, each with two distinct A0 parents. These are
observation-schema facts, not a fresh T-C agreement result. Observed office or
mask lists are not transcribed into generator code or control literals.

### 3.5 Read-Set Closure

The comparison data read-set is exactly the two bound canonical files with the
fields/selectors above, plus sealed generator outputs and binding/control metadata.
The existing QA receipt is audit provenance, not a third mathematical input.
Do not read `d4SeatContactRows` as an additional population or union it with
`structuralEdges`; that would double-count the same canonical relationships.
No other ledger columns, network sections, census rows, D5 reports, OBS-022
conclusions, twin-hub outputs, or their re-encodings enter generation/comparison
mathematics. Receipt verification may check hashes/status of cited provenance
without passing its observed conclusions into route inputs.

Bindings identify mixed files, so a hash alone cannot enforce the projection.
The extractor's declared field reads and generation's transitive call graph
must both be audited. This author has seen the comparison schema and prior
review; execution isolation is not retroactive proof of blind discovery.

## 4. Verbatim Predicate Anchors

The following excerpts are copied exactly from the frozen boundary. They are
the implementation's semantic anchors, not runnable code or a new algorithm.
Code review must compare the implementation and spec against these exact words.

### T-A

```text
Enumerate (a,b,h,s,k) in A0 x A0 x R x Z7, preserving ordered a,b.
Emit the tuple tagged `kernel_twin` iff a != b, o(a)=k+1 mod 7,
o(b)=k-1 mod 7, T+1(m(a))=m(b), and o(h)=k. These are respectively
the symmetric K support with retrograde ordered endpoints, the directed pitch-transposition twin test,
and an office-coordinate attachment to an A1 parent. No `CONSTRUCTS` edge or
phase-seam label is consulted by this route. This replaces D5's selected-pair
five-note overlap test with an explicitly proposed A0 twin predicate; review
must justify that choice independently of the observed D4 match.
```

### T-B

```text
Enumerate ordered pairs (e1,e2) from the complete proposed A0-to-A1
`CONSTRUCTS` slice E, joined with every (h,s) in R. Emit
(source(e1),source(e2),h,s,o(h),e1.id,e2.id) tagged `construction_join` iff
e1 != e2, their source anchors are distinct A0 members, and both targets equal
h. Each edge must independently match its bound ID, type, endpoints and tiers;
invalid records fail input well-formedness, while absent well-formed edges may
yield no witnesses. The operator is a directed co-parent relational join, not
K support, a ring-distance shortcut, a mask intersection, or a twin test.
No A1-to-A2 transition is used in this proposal.
```

### T-C

```text
Independently enumerate (t,a,b) over t in {A0,A1} and ordered distinct anchors
in that tier. Emit (t,a,b,mid(a,b)) iff T+1(m(a))=m(b). Preserve the tier so
A0 twins generating A1 candidates cannot be confused with the A1 twin census.
This operator emits every qualifying midpoint relation, with no seating test,
no intersection of T-A/T-B office coverage, and no named midpoint selection.
Empty, additional or different midpoint relations must be materialized unchanged.
```

Use exact integer Z12 rotation, Z7 indexing and
`mid(a,b) = 4*(o(a)+o(b)) mod 7`. No floats, coefficient reduction, fuzzy
matching, selected-only enumeration or named-office constants are allowed.
Complete domain sizes must be derived from actual structural input cardinalities:
T-A: |A0| squared times |R| times 7; T-B: |E| squared times |R|; T-C:
|A0|*(|A0|-1) + |A1|*(|A1|-1). T-A/T-B diagonals are enumerated then rejected;
T-C's declared domain is ordered distinct pairs. Counting domains is not
counting accepted witnesses. Empty valid output must be materialized honestly.

## 5. Receipt And Seal Obligations

Proposed field names in this section are interface requirements for review;
they do not add mathematical categories. JSON integer quantities may be encoded
as canonical decimal strings for lossless BigInt transport; the accepted schema
must choose one exact representation and reject coercion. Ordering must compare
typed integers numerically and edge/class strings by code-unit order, never locale.

- `bindings`: frozen boundary/spec/implementation hashes and source projection
  digests; record the accepted closure, not just a convenient top-level file.
- `generation.routes.T-A.witnesses`: complete (a,b,h,s,k) tuples tagged
  `kernel_twin`; preserve both ordered anchor identities and satellite identity.
- `generation.routes.T-B.witnesses`: complete
  (source(e1),source(e2),h,s,o(h),e1.id,e2.id) tuples tagged `construction_join`.
- `generation.T-C.relations`: complete (t,a,b,mid(a,b)) tuples by tier. No seating
  annotation, selected midpoint list or T-A/T-B convergence filter.
- `generation.completion`: expected and visited candidate counts per route,
  typed output counts and digests, explicit completion status. Deduplicate only
  identical full tuples; key projection must not erase witness provenance.
- `seal`: binds all outputs, completion and input identities before any observed
  contact/seam read. Truncation, substituted bytes or a forged completion claim
  is invalid; an absent unfinished seal without known corruption is incomplete.
- `comparison.rows`: every retained contact row with its `(o(h),s)` key and
  A-only/B-only/both/neither membership; no missing row may be silently discarded.
- `comparison.routes`: per-route counts AND sorted lists defined below, plus
  matched/missed observed keys and `restatement_signature`.
- `comparison.T-C`: complete generated/observed comparison relations, matches,
  missing/extras, directed-witness provenance and `midpoint_exact`; retain A1
  output separately. No nonempty-subset test substitutes for complete equality.
- `controls`: each required tuple's ran/skipped state, reason, observed
  gate, evidence-field value, clean counterpart, and tested implementation hash.
- `category`: exactly one frozen category, chosen only after validity/completeness
  gates; retain all diagnostics. A control-suite result is not a production result.

Let U be projected R keys, O the deduplicated observed contact keys, G a route's
projected generated keys. The five exact frozen count fields are:

| Field | Exact Definition |
|---|---|
| `generated_key_count` | cardinality of G |
| `in_R_count` | cardinality of G intersect U |
| `extra_beyond_R_count` | cardinality of G minus U |
| `R_missed_count` | cardinality of U minus G |
| `in_R_but_unmatched_count` | cardinality of (G intersect U) minus O |

Acceptance requires count/list equality and the identities
|G| = |G intersect U| + |G minus U| and
|U| = |G intersect U| + |U minus G|. Reconcile all contact-row cells to the
original row population independently of key counts. `restatement_signature`
means G=U, including empty equality; it is not inferred from contact coverage.
The routes are R-bounded by construction. Beyond-R output is nonconformance,
not a discovery. In-R-but-unmatched is a different field, never folded into it.
T-C carries non-restatement evidence exclusively; sharing anchor inputs with
T-A does not establish statistical independence.

## 6. Frozen Outcome Vocabulary And Precedence

Use these seven category rows verbatim, in this first-applicable order. Here
`covered` means O is nonempty and included in both G_A and G_B, and C means
`midpoint_exact=true`. The table is authority inherited from ENTRY 9, not a new
mapping designed around implementation output.

| Category | Condition | Bounded H-Disposition |
|---|---|---|
| `invalid` | Any input/binding/type/direction/control/isolation/semantic-conformance failure, including a beyond-R key; invalidity overrides apparent agreement | No H1/H2/H3 disposition; no mathematical verdict from invalid evidence |
| `incomplete_or_anomalous` | No known invalidity, but required suites, complete enumeration, seal, observations, or comparison evidence are missing; an empty expected observation/seam domain cannot pass vacuously | No H1/H2/H3 disposition; not a negative derivation result |
| `filter_plus_geometry` | Complete valid evidence, covered, at least one route has G=U, and C | Supports only the bounded T-C seam-geometry mechanism under granted structure; contact coverage retains its restatement flag; no claim of full D4 contact derivation and no H3 weakening from restated contacts; H2 no disposition |
| `restatement_signature` | Complete valid evidence, covered, at least one route has G=U, and not C | Coverage is restatement-suspect, not `derived`; no H1 support from coverage and no authorship proof; H2 no disposition; retain T-C mismatch explicitly |
| `overshoot` | Complete valid evidence, covered, neither route equals U, and either route has in-R-but-unmatched keys | Generated filters include non-contacting granted satellites; not full derivation, with C reported separately; no whole-contact H1 support or H3 confirmation; H2 no disposition |
| `derived` | Complete valid evidence, covered, neither route equals U, both in-R-but-unmatched counts are zero, and C (therefore G_A=G_B=O is a proper subset of U) | Supports H1 for D4 contact geometry under these semantics and the R grant; weakens H3 for that bounded contact pattern only; H2 no disposition; neither inheritance nor a unified operator is derived |
| `not_derived` | All remaining complete valid outcomes, including incomplete contact coverage or exact selective contact coverage with midpoint disagreement | Weakens only this registered route to H1(D4); compatible with H3, not confirmation; H2 no disposition; apply the qualifier below |

**D4 `not_derived` qualifier:** this is derivation difficulty under the registered
route, not authorship proof. The complete A1 GOVERNS inheritance substrate was
granted: a negative result says the required contact/seam pattern was not
generated even with that substrate given. It does not test the origin of satellite
membership or parent assignment, prove non-entailment under every other operator,
or automatically strengthen H3 relative to D5; the input grants and semantics
differ and provide no quantitative cross-boundary evidential ordering.

The clean structural T-B=U finding is already frozen: strict `derived` is not
reachable with that unchanged T-B output. Mapper tests may cover that category
on explicitly synthetic abstract inputs, but must not claim the production
engine can attain it on the registered sources. No category is renamed to make
an inconvenient result sound positive. Retain all restatement/overshoot/midpoint
flags even when a higher-precedence category wins.

## 7. Named Engine-Path Pre-Flight Obligations

These are obligations with acceptance criteria, not rejection implementation
designs. Every tuple states stimulus, expected gate, expected receipt evidence,
and frozen failure category. Gate names below label logical boundaries; no
function names, exception mechanisms, fixture files or scanners are mandated.
Every negative tuple requires a clean counterpart through the same production
code path and a receipt tied to the same implementation closure. Tooling-only
or arithmetic-only success cannot satisfy these obligations.

| Stimulus | Expected Rejection / Failure Gate | Expected Receipt Field / Evidence | Frozen Failure Category |
|---|---|---|---|
| Bound source, projection or implementation bytes changed without registration | binding | `controls.binding.observed_gate`, expected/actual digests, `rejected=true`; clean accepted bytes pass | `invalid` |
| D4/D5 observation, seam label, GOV-517 output or re-encoding enters any generator read/import/default/cache channel | isolation | `controls.isolation.rejected=true`, closure/read-path witness; clean projected envelope passes | `invalid` |
| Generation root calls comparator or another route's forbidden predicate/output | isolation | `controls.route_isolation.rejected=true`, actual offending call path; independent clean roots pass | `invalid` |
| T-A implementation substitutes the old ordered K endpoints | route_conformance | `controls.kernel_perturbation`: T-A key set changes, T-B unchanged, actual conformance failure and corrected clean counterpart; bind executed route path | `invalid` for the nonconforming implementation, not for a legitimate empty output |
| Remove the first edge by bound E edge-ID order in an explicitly authorized control envelope | control_acceptance | `controls.edge_deletion`: T-B changes, T-A unchanged; restored sets equal clean sets; if the expected dissociation fails, record that failure | `invalid` if the control obligation fails; a correctly observed mutation is not a production verdict |
| Remove that edge from purported complete production E instead | binding | `controls.production_E_completeness.rejected=true`; unchanged complete E passes | `invalid` |
| Out-of-range/non-seven-note anchor mask; wrong-tier or non-anchor provenance | input_well_formedness | `controls.anchor_input.rejected=true`, field/reason; registered valid mask and endpoint pass | `invalid` |
| Wrong edge type, reversed R/E endpoints, conflicting duplicate ID or ambiguous R parent | input_well_formedness | `controls.edge_input.rejected=true`, edge and endpoint typing failure; clean directed records pass | `invalid` |
| T-C consults seam labels, uses selected-only pairs, changes midpoint arithmetic or substitutes A1 relations for A0 | route_conformance | `controls.T-C.rejected=true`, full-relation/direction/tier discrepancy with an independently specified oracle; clean T-C passes | `invalid` |
| Missing/ambiguous observed parent, duplicate contact row ID, wrong stored contact endpoint roles/direction flag | comparison_input | `controls.contact_join.rejected=true`, offending row and join cardinality; clean source projection passes | `invalid` |
| Bad seam group (not two distinct A0 parents), wrong target tier or source binding | comparison_input | `controls.seam_input.rejected=true`, group/type/binding reason; valid comparison schema passes without presuming midpoint agreement | `invalid` |
| Sealed output bytes altered, truncated but marked complete, or digest substituted | seal | `controls.seal.rejected=true`, failed digest/completion assertion; unchanged complete seal passes | `invalid` |
| Generation unfinished, seal absent, timeout or required suite skipped, with no known validity breach | seal / control_acceptance | `controls.completeness` names missing completion and skipped reason; no mathematical result inferred | `incomplete_or_anomalous` |
| A route emits a key outside U | comparison_accounting | `extra_beyond_R_count>0` with its key list and `controls.R_bounds.rejected=true`; conforming R-bounded output passes | `invalid` |
| Counts disagree with lists, contact rows lost during key deduplication, or a restatement flag suppressed | comparison_accounting | `controls.accounting.rejected=true`, failed conservation/equality assertion; exact full accounting passes | `invalid` |
| Outcome mapper ignores precedence or substitutes unregistered category/H language | outcome_precedence | `controls.outcome_precedence.rejected=true`, expected/actual category and full flags; section 8 oracle cases pass | `invalid` |
| Input order changed or a second clean build produces different output bytes | control_acceptance | `controls.determinism` binds both digests and reordered-input result; unexpected inequality is a control failure | `invalid` |
| Expected domain is empty or comparison evidence unavailable, with no known source/schema breach | comparison_input | `controls.nonvacuity` records absent/empty expected domain, no true `midpoint_exact` from empty equality | `incomplete_or_anomalous` |

Do not reject an otherwise valid generation merely for disagreeing with observed
contacts or midpoint structure: those are legitimate frozen outcome cases.
For the edge-deletion experiment, a declared control profile may pass a truncated
well-formed E to the actual route; this is never a production completeness grant.
Similarly, test-instrumented K mutation is not an alternative production option.
A correct negative control is a PASS for the control suite, not a new research
category. If the controls do not demonstrate the required rejection, the pre-flight
gate is `invalid` and production remains closed. If a suite did not run, it is
not silently converted into a passing rejection.

Prior source-only demonstrations (clean 8/28 keys; K reversal 0/28; edge deletion
8/24; restoration 8/28) are acceptance references from ENTRY 9, not observed D4
coverage or hard-coded generator outcomes. Recompute sets and compare actual
engine paths at pre-flight. Integer-window translation and D5's width mutant
remain inapplicable: these D4 predicates have no window dependency.

## 8. Seven-Category Mapper Acceptance

The following are abstract comparator-oracle obligations, not executable
fixtures, generated canonical data or reachability claims about registered E/R.
Choose synthetic typed keys unrelated to canonical observations; keep test data
outside generation reach. U={u,v,w}, O={u} below denote abstract key sets only.

| Expected Category | Comparator Conditions For Its Test |
|---|---|
| `invalid` | Add any known conformance/binding breach to otherwise positive conditions; it overrides every other row |
| `incomplete_or_anomalous` | No known invalidity, but omit a required seal/suite or use an empty expected observation domain |
| `filter_plus_geometry` | Complete valid evidence, G_A={u}, G_B=U, C=true; retain B's restatement flag and in-R-but-unmatched count |
| `restatement_signature` | Same coverage and restating route, C=false; not `derived` |
| `overshoot` | Complete valid evidence, G_A={u,v}, G_B={u}, C recorded; neither equals U and A has an unmatched in-R key |
| `derived` | Complete valid evidence, G_A=G_B={u}, C=true; both equal O as a proper subset of U |
| `not_derived` | Complete valid evidence, G_A empty and G_B=U; coverage fails even if C=true, and B's restatement flag remains |

Add pairwise precedence tests where flags coexist, a missing-midpoint-only case,
empty G=U equality without coverage, and row/key multiplicity cases. A test of
the mapper cannot turn a forged engine output into a valid production derivation.
It proves category mechanics only, not T-A/T-B/T-C semantics or H hypotheses.

For the midpoint-only disagreement case, use complete valid G_A=G_B=O={u},
O a proper subset of U, and C=false: the expected category is `not_derived`.
For an empty well-formed R control, both contact routes must materialize empty
sets; that control does not authorize replacing the complete production R
projection with an empty one or converting empty expected observations to success.

## 9. Language Guard And Relay Acceptance

Research categories are exactly the seven strings in section 6, copied from
ENTRY 9. Route classes are `kernel_twin` and `construction_join`; contact cells
are A-only, B-only, both, neither. `restatement_signature` is both the exact
frozen category name and the explicitly typed per-route equality flag; do not
conflate those fields. `overshoot` never means beyond-R discovery. H language
is only the verbatim table and qualifier; this document emits no H disposition.

New gate/receipt labels in sections 5 and 7 are proposed technical interface
vocabulary with their meaning given locally, not registered research claims.
The spec review must approve those labels and a concrete wire schema before
implementation. It must not delegate unresolved category meanings or read-set
choices to a pre-flight executor under pressure to pass.

Draft verification must check predicate excerpts, all seven outcome rows and
the qualifier verbatim against the bound text; check exact category/class/cell
sets and all five count-field names; review prose for category paraphrases and
unregistered H claims. A document-token check is not general natural-language
semantic verification. The repository prose-consistency writer is not a
standalone research vocabulary validator and must not be reported as one.

Relay review order: (1) call graph/isolation; (2) three field-level comparator
registrations with sources and receipts; (3) five-field mechanics; (4) seven-row
category/precedence controls; (5) verbatim T-A/T-B/T-C faithfulness;
(6) engine-path control tuples with clean counterparts. Resolve all findings
before spec acceptance. Any discovered need to change a frozen predicate goes
back to boundary registration, not a permissive implementation interpretation.

## 10. Verification Record And HALT

This pass performs source-field/receipt inspection and document fidelity checks
only. The field audit read the canonical data to verify direction, selection
schema and join uniqueness; it did not generate T-A/T-B/T-C output, execute
the mapper on D4 data, or emit a research verdict. Existing receipt facts stay
historical/source-bound, distinct from future engine-path receipts.

The binding checks confirmed the frozen boundary and both canonical source
hashes listed in section 1. All 14 selected contact rows have `directed=false`
and unique A1 parents; R has 28 `directed=true` records, E has 14; the four
phase-seam edges form two two-parent groups. The cited three existing QA checks
are PASS. These observations support only the field-level registrations.

**Ran:** read-only document guard against the frozen boundary: three predicate
excerpts, seven disposition rows in order, the full D4 qualifier and five
count-definition rows match verbatim. All seven abstract mapper categories
match that registered set; all 18 control tuples have four slots and frozen
failure-category labels. Category/route/cell spellings and absence of legacy
aliases were checked mechanically; surrounding H-language and interface-label
scope were reviewed manually. This is a bounded vocabulary check, not a claim
that a generic language guard proves all prose semantics. Whitespace checks ran
on this new file; no canonical or generated receipt was written by these checks.

**Skipped:** engine implementation, scaffolding, pre-flight suites and synthetic
mapper fixture execution, live derivation/comparison, H disposition, ledger
registration, manifest/checksum updates and integrated validation. This draft
changes the workspace and is not covered by a newly run release fixed point.
Only this spec file is authored; previous dirty-worktree changes are retained.

**HALT:** relay this draft for review. Spec acceptance, any implementation grant,
pre-flight execution and production authorization are separate gates. No source,
boundary, admission, topology, runtime, office, graph, Court or global
`harmonic.C_H` authority is changed by this document.
