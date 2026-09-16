# D4 Boundary Draft

**Status:** DRAFT ONLY. Authorized work is this boundary proposal, not registration,
freeze, scaffolding, or execution. No new GOV, OBS, or ENTRY identifier is assigned.
This document is planning evidence of intent, not mathematical or admission state.

Review history: the maintainer approved the first draft subject to four amendments
before freeze. This revision proposes operational targets and D4-specific
semantics, names freeze-time H-mapping registration (approved timing), and repeats
the contact/construction count distinction in exclusions. The new predicates and
input grant remain subject to relay review; conditional approval is not freeze.

Correction review: the pre-freeze reachability hold remains in the decision
ledger as the pre-correction record. The maintainer approved reversing T-A's
ordered kernel endpoints, classifying beyond-R output as nonconformance, and
completing the Outcome Contract below. The corrected predicate must receive
one-line verbatim re-verification before the freeze lands. Reachability
demonstrations caught a review defect; review verified meaning, enumeration
verified possibility. This document is still not a frozen execution grant.

## Governing Sources

- `framework/AGENTS.md`: separate state office, degree mutation, family, and
  anchor tier; direct eligible relations only, not arbitrary graph reachability.
- `provenance/DECISION_LEDGER.md`, "Standing rules recorded - 2026-09-05":
  all eleven rules apply. Artifacts outrank prose; receipts, not ticket status,
  are state; ledger-to-scrum is the sync direction; vocabulary must satisfy
  exists-or-ticketed. This draft registers no vocabulary or authority.
- The same ledger, ENTRY 7 and ENTRY 8: the former freezes a D5 definition but
  does not itself authorize execution; the latter closes D5 contact geometry
  relative to registered semantics and explicitly quarantines D4.
- `scrum/GOV-517-d5-signature-derivation-definition.md`, frozen body beginning
  at "Derivation Targets (T1-T3)" (heading uses typographic punctuation in source):
  generation/comparison separation, outcome-honest categories, controls and stops.
- `qa/gov-517-generative-semantics-registration.json`: G1-G5 define finite
  witness space, distinct route criteria, convergence and downstream office-level
  classification. These are D5 precedent, not inherited D4 semantics or authority.
- `qa/gov-517-input-boundary-registration.json` and
  `qa/gov-517-nc3-boundary-registration.json`: input-slice and reachable-control
  precedents only; their grants, bindings and verification do not transfer.
- `provenance/OBSERVATION_LEDGER.md`, OBS-014 and OBS-022: observed asymmetry
  and bounded D5 frame-level result, respectively. OBS-008 owns K exhaustivity;
  OBS-009 supplies window-intersection structural provenance.
- `scrum/EPIC-520-1-unified-operator-planning.md`: registered language,
  per-signature limits, and no promotion of an A-tier reconstruction alone into
  a D-signature or unified-operator result.

References above are read for drafting. No outcome read, including this draft's
summary of one, is reusable as generator input. No carried hash is claimed live.

## D4 Question And Asymmetry

Proposed question: can independently specified A-tier structural rules generate
the office-coordinate contact geometry relevant to D4 through A1 satellite twins,
including its relation to already seated midpoints, without consuming the D4
contact signature or observed contact/convergence answer?

OBS-014 reports D4 (`7-Z17`) contact chains with satellite tier = parent tier =
A1: D-anchor <- `SEAT_CONTACT` <- satellite <- `GOVERNS` <- parent anchor,
one parent hop only. Its D4 scope is 14 selected `SEAT_CONTACT` rows across seven
offices. These are downstream observation scope, not generation cardinalities.
The combined 28 selected D4/D5 `SEAT_CONTACT` chain-audit rows are not the separate
28 `CONSTRUCTS` edges.

Keep two twin statements distinct. OBS-014's A1-tier twin census pairs are
{Mars,Sun} and {Saturn,Jupiter}, disjoint with no hub. Its A1-generating twin
pairs {Moon,Saturn} and {Sun,Venus} belong to A0; their midpoint offices
{Sun,Saturn} are already seated as A1 phase seams. D4 is convergence-through-twins
to already seated structure, not creation of new seats.

D5 instead uses A2 satellites; its A2 twin pairs share Mercury and designate
{Mars,Jupiter}, unseated **as phase seams**, not absent as A2 anchors. OBS-022
reports D5 office-coordinate coverage under G1-G5 after sealing generation.
Neither its successful coverage nor its Mercury hub supplies a D4 target answer.
No shared-hub requirement or unseated-midpoint closure condition transfers to D4.

## Fresh Proposed Targets

The following are operational proposals for renewed review, not registered
semantics or a claim that they derive D4. Let A0 and A1 be the complete proposed
anchor slices, o(x) their registered office indices in Z7, and m(x) their Z12
pitch masks. T+1 rotates a pitch mask by one semitone modulo 12; it is not an
office-index increment. Define mid(a,b) = 4*(o(a)+o(b)) mod 7 (2*4 = 1 mod 7).
Diagonals are enumerated but rejected. No successful pair, office name, expected
count, D4 mask, or observed midpoint set is a literal in these predicates.

This proposal requests a complete A1 `GOVERNS` slice R of (h,s) pairs, with h an
A1 anchor and s an A1 satellite, plus endpoint identity/tier/role fields. It
does not claim to derive satellite membership or authored parent assignment.
R is the maintainer-accepted principal authored structural input; acceptance
does not authorize a loader, engine, or execution before the later gates.
It must contain all such pairs, never only satellites selected by D4 contacts.
Reject invalid endpoints, reversed edges and duplicate identities as invalid
input; a valid empty R produces empty route outputs rather than fabricated seats.

### T-A - Kernel And Twin Contact Candidates

Enumerate (a,b,h,s,k) in A0 x A0 x R x Z7, preserving ordered a,b.
Emit the tuple tagged `kernel_twin` iff a != b, o(a)=k+1 mod 7,
o(b)=k-1 mod 7, T+1(m(a))=m(b), and o(h)=k. These are respectively
the symmetric K support with retrograde ordered endpoints, the directed pitch-transposition twin test,
and an office-coordinate attachment to an A1 parent. No `CONSTRUCTS` edge or
phase-seam label is consulted by this route. This replaces D5's selected-pair
five-note overlap test with an explicitly proposed A0 twin predicate; review
must justify that choice independently of the observed D4 match.

The approved phase-seam retrograde convention pairs the forward semitone
rotation with office motion -2 mod 7, not +2. Exhaustive A0 enumeration found
directed pairs (2741,1387) at offices (1,6) and (2773,1451) at (0,5), both with
delta 5=-2 mod 7. The former endpoint order excluded both. Reversal changes
the ordered K attachment, not the unordered support {-1,+1}, T+1, midpoint
formula, source masks, or comparison target. These identities are correction
evidence only, never engine literals. No D4 contact observations chose the fix.

The emitted object is a candidate satellite-contact witness, not a D4 contact
declaration. Its comparison key is (o(h), s), retaining satellite identity;
a,b,h IDs retain structural provenance, not generated D4 state identity.
Empty, missing and extra keys are legal generated results. No test against the
14 observed rows controls generation or its success status.

### T-B - Construction Co-Parent Contact Candidates

Enumerate ordered pairs (e1,e2) from the complete proposed A0-to-A1
`CONSTRUCTS` slice E, joined with every (h,s) in R. Emit
(source(e1),source(e2),h,s,o(h),e1.id,e2.id) tagged `construction_join` iff
e1 != e2, their source anchors are distinct A0 members, and both targets equal
h. Each edge must independently match its bound ID, type, endpoints and tiers;
invalid records fail input well-formedness, while absent well-formed edges may
yield no witnesses. The operator is a directed co-parent relational join, not
K support, a ring-distance shortcut, a mask intersection, or a twin test.
No A1-to-A2 transition is used in this proposal.

T-B projects to the same (o(h),s) comparison key without invoking T-A or reading
its output. Both parent orders and all unmatched/extra keys are retained. R and
anchor identity are shared axioms, explicitly not evidence of independence.
Before freeze, a dissociation proof must show a reachable change to K or the
twin predicate can change T-A while E/R stay fixed, and deletion of a valid
construction edge can change T-B while T-A inputs stay fixed. Separate invalid
edge and invalid mask controls must also test the routes' distinct well-formedness
predicates. The boundary-level demonstrations below discharge arithmetic
reachability, not future engine-path control verification.

### T-C - Generated Twin And Midpoint Relation

Independently enumerate (t,a,b) over t in {A0,A1} and ordered distinct anchors
in that tier. Emit (t,a,b,mid(a,b)) iff T+1(m(a))=m(b). Preserve the tier so
A0 twins generating A1 candidates cannot be confused with the A1 twin census.
This operator emits every qualifying midpoint relation, with no seating test,
no intersection of T-A/T-B office coverage, and no named midpoint selection.
Empty, additional or different midpoint relations must be materialized unchanged.

Only the downstream comparator may join sealed A0 midpoint outputs to the
source-bound observed A1 phase-seam relation, reporting matched, missing and
extra relations with their parent provenance. The A1 output is reported
separately, not silently substituted for A0. Thus the target is "generate the
midpoint relation", never "generate the seated midpoints". Agreement, if any,
is a comparison result; the engine can disagree and creates no new seat.

## Proposed D4 Generative Semantics

1. Space: complete A0/A1 anchors, complete A1 parent/satellite relation R, A0-to-A1 construction edges E; no A2 substrate.
2. T-A space: A0 x A0 x R x Z7; apply directed T+1 twin and K endpoints o(a)=k+1, o(b)=k-1 mod 7, then attach by parent office.
3. T-B space: E x E x R; apply the distinct-edge, distinct-source, same-child construction join, independently of T-A.
4. T-C space: the disjoint union of ordered A0 and A1 anchor pairs; emit directed twin pairs and computed modular midpoints.
5. Identity: route keys are (parent office, satellite ID), not D4 state IDs; full anchor/edge witnesses and pair order remain in output.
6. Arithmetic: exact integer pitch-mask rotation over Z12 and office indexing over Z7; no coefficient reduction or floating-point predicates.
7. Seal complete route sets and midpoint relations before comparison; deduplicate only identical full tuples, sort lexicographically by typed tuple fields.
8. Compare each observed D4 contact's (parent office, satellite ID) against both route sets: A-only, B-only, both, neither; separately report all extra generated keys.
9. Compare T-C relations with observed A1 seam structure only downstream; four-cell coverage alone cannot establish twins, seating or exact D4 state identity.
10. All predicates, projections and outcome mappings require review and freeze; D5 G1-G5 are precedent only, and these proposed semantics grant no execution authority.

The comparator contract below fixes endpoint direction, the observed
contact-to-parent join and A1 seam provenance fields for freeze review.
Review must explicitly reject a broad-coverage match that merely restates R as
a derivation. No H disposition follows from these proposed four cells alone.

## Comparator And Non-Restatement Contract

This completes the boundary-level comparison proposal for freeze; no comparator
is implemented or run here. Use the bound canonical ledger's `id`, `tier`,
`role`, `officeIndex` fields for endpoint typing. R consists of `structuralEdges`
with `type=GOVERNS`, source h an A1 anchor and target s an A1 satellite; E consists
of `type=CONSTRUCTS`, source an A0 anchor and target an A1 anchor. Preserve edge
IDs and source-to-target direction. Project only ID/type/endpoints/direction
and endpoint identity/tier/role/office plus anchor masks to generation; do not
include `provenance`, phase-seam labels, D-tier rows, or contact selections.

After sealing, the comparator selects `SEAT_CONTACT` rows whose source s is an
A1 satellite and target d a D4 anchor. Join s to the unique A1 h with
`GOVERNS.source=h`, `GOVERNS.target=s`. Retain (contact row ID,d,s,h,o(h));
the comparison key is (o(h),s), not the D4 anchor's office. Missing/ambiguous
parents, duplicate row IDs, wrong endpoint types, or source-binding drift are
invalid comparison input, not `neither`. Preserve every row even when multiple
rows project to the same key; report row coverage and deduplicated key coverage
separately. Let O be that deduplicated observed key set, U={(o(h),s):(h,s) in R},
and G_A/G_B be the route-key sets projected from their complete sealed witnesses.

For each route, emit these first-class fields with sorted key lists as witnesses:

| Field | Exact Definition |
|---|---|
| `generated_key_count` | cardinality of G |
| `in_R_count` | cardinality of G intersect U |
| `extra_beyond_R_count` | cardinality of G minus U |
| `R_missed_count` | cardinality of U minus G |
| `in_R_but_unmatched_count` | cardinality of (G intersect U) minus O |

Also emit `observed_key_count`, per-route matched/missed observed keys, the
four-cell contact-row counts, and per-route `restatement_signature=(G==U)`.
Selectivity is `R_missed_count`; equality, not coverage alone, defines pure
restatement. Empty G=U still sets the flag and never establishes derivation.
The routes are R-bounded by construction. `extra_beyond_R_count>0` is
nonconformance with precedence over every mathematical category, not discovery.
In-R keys for non-contacting satellites are a separate overshoot dimension.

T-C carries the non-restatement evidence exclusively; T-A/T-B selectivity
measures filtering of the grant, not generation of a new inheritance relation.
Downstream seam evidence uses the A0-to-A1 `CONSTRUCTS` rows whose canonical
`provenance` is `phase-seam construction`. Group by A1 target h, requiring two
distinct A0 parents; compare (unordered parent-ID pair, o(h)) to the A0 part
of T-C, projecting its ordered witness to the unordered pair only in comparison.
Preserve the original directed witnesses and provenance; report all matches,
missing and extra relations. Set `midpoint_exact` only for nonempty equality
of the complete sets, never a selected subset. Report A1 T-C output separately.
T-C is absent from R as an encoded relation, but its computation shares anchor
masks with T-A: non-restatement does not assert statistical independence or
absence of all authored provenance. No T-C agreement is presumed here.

## Outcome Contract

This is the full proposed freeze-time disposition table, written before any
D4 comparison. It is to be SHA-bound by the freeze entry, not completed at
verdict time. Evaluate rows in the following order, first applicable row wins;
retain every diagnostic flag, including restatement and midpoint mismatch,
regardless of the selected category. Let `covered` mean O is nonempty and
O is a subset of both G_A and G_B; C means `midpoint_exact=true`.

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

Every category retains both routes' five counts and all four contact cells;
overshoot or restatement flags are never erased by precedence. Partial coverage
with restatement on one route selects `not_derived` and retains that flag.
Even `filter_plus_geometry` does not derive R. No retry, observed-output tuning,
predicate change, or favorable reclassification is permitted under the same
freeze. A correction requires a new registered boundary. The completed table
requires the requested pre-freeze relay; none of these categories is emitted now.

## Proposed Inputs And Exclusions

Possible structural sources for later review are the A-tier anchor slice of
`canonical/universal-heptatonic-ledger.json`, A-tier `CONSTRUCTS` relations from
`canonical/universal-network-data.json`, and source-derived A-tier fifth masks.
The A-tier slice of `canonical/fivefold-incubator/fifth-space-census-v0.json`
is a possible mask provenance source, not permission to read its D-tier rows.
K, integer window geometry and the office/phase convention require explicit
source justification. No source or slice is authorized for D4 runtime here.

The exact projection must be proposed field by field. The operational proposal
above requests complete A1 `GOVERNS` endpoints, not satellite masks, and keeps
phase-seam provenance exclusively downstream. A general network/ledger
file is a mixed source, not a blanket input grant. Prefer deriving satellite
relations to importing them; if authored structural content is needed, disclose
that dependence and narrow the claim. Do not silently transplant D5 I1-I4,
its empty I3 envelope, anchor list, constants, or grants.

Exclude from generation all D4/D5 `SEAT_CONTACT` rows (14 D4 rows, 28 combined
D4/D5 audit rows, distinct from the 28 `CONSTRUCTS` edges), D-tier masks and run-space
rows, declared D4/D5 signatures, observed twin-hub/midpoint conclusions, selected
intersections, witness counts, coverage flags, and verdicts. Also exclude their
re-encodings, complements, reordered forms, cached projections, fixtures, helper
constants and prose paraphrases when they carry the answer. In particular,
`canonical/fivefold-incubator/twin-hub-convergence-v0.json`, its QA receipt,
OBS-014/022, the D5 derivation report and this draft are not generator inputs.

Future comparison may read source-bound D4 observations only after complete
generation is materialized and sealed. Freeze a typed comparison of the whole
output, retaining unmatched observations and extra generated witnesses, not
selected successes. Report each route separately. Comparison and detection code
must not feed observed values, selections, corrections or verdicts back into
generation; generation must remain byte-identical with observations unreadable.
Reviewing these outcomes now does not make subsequent hard-coded knowledge blind.

## Required Review And Controls

**Criteria independence:** require a dependency audit and a dissociation matrix.
Perturb the first route's kernel/geometry while holding construction inputs fixed;
corrupt construction relations while holding the first route's inputs fixed.
Both routes must remain separately executable, with all effects recorded and
justified. Different function names, shared output coverage, or two projections
of the same preselected answer do not establish independent criteria. Shared
utilities must be neutral, explicitly justified and unable to share target logic.
I1/I2-like copies of the same source require a candid dependence explanation.

**NC3 reachability:** a common translation of integer windows
`W(k) = [-k, 6-k]` preserves `|W(j) intersect W(j+d)| = 7-d`; it is not a negative
stimulus for that invariant. The D5 amendment's width mutant `[-k, 5-k]` instead
has intersection size `max(0, 6-d)` for `j,d` in `0..6`, and is a candidate only
if D4 retains that exact invariant. These are integer intervals, not wrapped
Z7 sets. Demonstrate every proposed control can reach its stated failure before
freeze, alongside a clean specificity counterpart. A later engine-path test must
then show the failure reaches the actual target gate; arithmetic reachability,
schema rejection and tooling-only green tests are not engine verification.
Do not invent a window-dependent target merely to reuse NC3. If the target has
no such dependency, stop for review of a genuinely relevant control.

**Answer-smuggling review:** an independent reviewer must trace every primitive,
literal, selector, join, equivalence rule and target predicate to structural
justification, including the choice of tier and seating provenance. Check whether
the proposed criteria already encode the compared answer, whether broad office
coverage makes every contact match, and whether a twin/seating claim is actually
tested. Target blindness alone cannot detect an answer encoded in criteria.
Semantic review and stimulus-reachability review are separate obligations; neither
substitutes for the other. Findings that change a predicate return to boundary
review, not silent implementation repair.

Later controls must also cover excluded-input injection through import closure
and runtime channels, non-A-tier/decoy masks, reversed or cross-tier parent chains,
missing structural joins, selected-only output, ordering changes, stale bindings
and rehashed semantic tampering. Each requires a named failure gate and clean
counterpart. No fixtures, scanners, engines or control suites are built or run here.

## Pre-Freeze Dissociation Attachment

Performed on the canonical ledger and network's structural projections only:
7 A0 anchors, 7 A1 anchors, complete A1 R (28 directed GOVERNS edges), and
complete A0-to-A1 E (14 directed CONSTRUCTS edges). The trusted arithmetic
check deserialized mixed source files to extract these inputs; it is not an
input-isolated engine. No D4 contact rows or observed seam comparison were
selected or evaluated. Counts below are unique (o(h),s) keys, not full witness
counts, contact-row coverage, or a D4 verdict.

| Stimulus | T-A Keys | T-B Keys | What Is Held Fixed |
|---|---:|---:|---|
| Clean corrected predicates | 8 | 28 | Complete granted structural slices |
| Swap corrected K endpoints back to the pre-correction order | 0 | 28 | A0/A1 masks, E and R |
| Delete `constructs:A0:1387:1371:0` from E | 8 | 24 | T-A inputs, all anchors and R |
| Restore the original E and corrected K | 8 | 28 | Exact original inputs restored |

The edge stimulus is selected by ascending edge-ID order, not D4 contact effects;
its source is 1387 and target 1371. Its removal leaves the other edge to that
child without a distinct co-parent partner. Exactly that child's four R keys
lose T-B witnesses; T-A has no E dependency. Conversely, the kernel perturbation
excludes the directed twin pairs without modifying T-B's edge join. Actual set
equalities for the unchanged route and restored sets were asserted, not inferred
merely from equal cardinalities. The arithmetic used BigInt for mask rotation
and modular office predicates; no D4 state ID was an input selection criterion.

Well-formedness reachability was separately asserted: seven-note mask 2741
passes; 4096 fails the 12-bit range/cardinality predicate. The named valid edge
passes bound ID/type/endpoint validation; changing its type to GOVERNS or
reversing endpoints fails. These are rejection demonstrations, not zero-witness
successes. No production engine exists to receive these stimuli yet. The
implementation pre-flight must prove each reaches its actual rejection/failure
gate and must retest the clean counterparts.

T-B restates all 28 R keys in this structural check. This is explicitly retained
as a route-level restatement flag, not evidence of D4 coverage. Under the table's
strict `derived` criterion, a run with that unchanged T-B key set cannot qualify
as full `derived`; other outcomes still depend on the sealed downstream
comparison, which has not run. Reachability of the two perturbations is not
evidence that every named outcome category is reachable on these fixed inputs.

The reviewed integer-window translation remains a non-stimulus. No T-A/T-B/T-C
predicate in this corrected proposal depends on integer windows, so the D5
width-mutant is not imported as a D4 target control. The relevant D4 geometry
stimulus is the demonstrated ordered-K perturbation, with corrected K as its
clean counterpart. T-C midpoint comparison remains a separate downstream test.

## Sequence And Exact Blockers

`boundary draft -> relay -> review -> freeze -> HALT before implementation`

This sitting completes only the boundary draft. Relay means submission for
maintainer consideration, not approval; review must resolve the following blockers.
Freeze itself must still end at HALT. Any implementation or execution needs a
separate explicit authorization; D5 approval and this draft supply neither.

1. **Source binding pending:** structural projections and downstream joins are
   specified above; the accepted R grant does not derive satellites. Source SHA
   bindings and the loader isolation contract must accompany the freeze/spec gates.
2. **Semantics unresolved:** complete D4 predicates, candidate space, route
   independence, resolution, twin/seating output and comparison rules are not frozen.
3. **Operational review pending:** first-draft conditional approval does not
   discharge answer-smuggling review or criteria dissociation for the new
   predicates and proposed R input grant.
4. **Control review pending:** the corrected pre-freeze dissociation attachment
   demonstrates arithmetic reachability and clean counterparts. Review and later
   engine-path proof remain distinct; D5 controls are not D4 receipts.
5. **Process authority absent beyond drafting:** relay acceptance, maintainer
   review, any authorized registration/binding steps, freeze and subsequent
   implementation/execution permission remain pending. This draft assigns no
   registrar, identifier, manifest binding, approval or queue/capacity grant.
6. **Outcome contract completed for review:** the full table, precedence and
   D4-specific qualifier are in Outcome Contract above. Register that text at
   freeze, bound by the maintainer's append-only decision-ledger entry before
   any verdict emission; verdict landing applies it, not a later interpretation.

No D4 result or H1/H2/H3 disposition is emitted. No unified operator, sequence-level
claim, cosmology, topology, admission, office assignment, graph, runtime policy,
Court change or global `harmonic.C_H` authority is created. Ledgers, manifests,
checksums, frozen D5 files and formal registration JSON remain untouched.

## Draft Verification Scope

Check the new Markdown for scope fences, source citations, asymmetry, unresolved
gates and whitespace; inspect the actual diff and worktree for a one-file change.
These checks establish draft hygiene only, not derivability, fresh source bindings
or a registered boundary. Record each performed check as ran and every deferred
suite as skipped with reason. Implementation, derivation, comparison and pre-flight
suites are skipped because this is draft-only work. Manifest regeneration and the
release fixed-point loop are skipped because no artifact is being wired and writes
to ledgers/manifests are forbidden; no fixed-point or full-suite PASS is claimed.

Amendment verification: source review of the existing draft, shadow-ladder
construction classification, and D5 semantics precedent ran; no derivation or
comparison was executed. `git diff --no-index --check /dev/null
scrum/plan/d4-boundary-draft.md` passed for the untracked draft. Only this draft
was edited in the amendment pass; existing worktree changes were left intact.
