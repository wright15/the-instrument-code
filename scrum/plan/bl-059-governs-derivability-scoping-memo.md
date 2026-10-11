# BL-059 (Track 2) — Higher-Theorem Scoping memo: can the GOVERNS organization itself be derived?

**Status:** `planning_evidence` — **OPEN RESEARCH. This memo defines the question; it claims
no answer.** No ledger entry, no evidence obligations accepted, no claim event, no verdicts,
no admission of any kind. Companion to `scrum/plan/bl-059-d4-derivation-statement.md`
(Track 1, citation-stable); this memo is the one that accretes.

**Mutation contract (this memo's own discipline).** This is a question-defining artifact, not
a claims artifact. §4 (evidence for) and §5 (evidence against) are expected to accrete as
programs land — each new finding updates them under the house discipline: cited, tiered,
fail-loud, no smoothing, contradictory evidence retained in place. Nothing in this memo is
citable as a claim anywhere. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6–2.7)
is interpretation vocabulary only and was not used as design input.

## 1. The question, formally stated

> **Can the GOVERNS organization itself — the seven offices, the parent/satellite assignments
> (the A1 GOVERNS relation R), and its edge structure — be derived from the same machinery
> that derived the D4 contact geometry, rather than entering the derivation as
> authorized/granted input?**

This is stated in writing here for the first time.

**"The same machinery", defined for scoping purposes.** The corridor's machinery,
generalized: closed-relation traversal (the cycle-walk); rotation/twin verification of
traversal edges; intrinsic-predicate selection within a granted or derived domain; and
midpoint/consistency relations between tiers. Whether that machinery generalizes at all is
part of the question, not part of its statement.

**What the D4 corridor derived, and what it did not.** The corridor derived the *contact
geometry* — a bounded result through a granted input (Track 1, §7). This memo asks the
question one level up: can the granted input itself be derived — can the framework's own
organizational structure fall out of the same machinery rather than standing as an assumed
input? That is the difference between deriving a *result within* the framework and deriving
the framework's own *architecture*. The corridor is complete; this question was never scoped.
This memo scopes it.

## 2. What was granted — the inputs a derivation would replace

### 2.1 The grant, as recorded

| Granted input | Content | Recorded status | Source |
|---|---|---|---|
| A1 GOVERNS relation R | 28 edges (7 parents × 4 satellites); parent/satellite membership | "the principal authored inheritance input… It gives parent/satellite membership, not a derived inheritance theorem. No selection by D4 contact rows is permitted." | `provenance/DECISION_LEDGER.md:2052-2062` |
| Office assignments o(h) | seven office indices on the A1 parents | carried by the frozen projection; comparison key is `(o(h), s)` | `qa/d4-production-generation.json`; `provenance/DECISION_LEDGER.md:2069-2071` |
| A0→A1 CONSTRUCTS parent pairs | 14 edges; exactly 2 distinct parents per A1 anchor — the cycle ground R2 traverses | granted projection input | `qa/d4-production-generation.json`; BL-055 §5 W3 |

The grant was surfaced by the drafting agent and explicitly accepted with its interpretive
cost (`provenance/DECISION_LEDGER.md:2037-2038`), and it carried the required interpretation
verbatim (`:2058`): "D₄'s derivation is relative to granted inheritance structure; a positive
result derives the contact geometry, not the inheritance relation."

### 2.2 The grant's status in the framework's own design

**The GOVERNS relation enters the derivation machinery as authored input by the framework's
own design** — the original contract declares it the principal authored input, and no
framework document records it as derivable. The framework's intrinsic-vs-route separation
principle (`framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:141-144,1377`;
`framework/AGENTS.md:68`) distinguishes intrinsic identity from route context; it makes no
derivability promise about the relation itself. The intrinsic-structure evidence that does
exist is first-evidence-grade (BL-055's 14-vs-14; BL-056's midpoint invariant), not recorded
intent (grounding check: no framework line asserting GOVERNS derivability was found).

The derivability question is therefore not just open but **contrary to the framework's
original modeling assumption**: the grant was built as an input, not attempted as an output.
A future derivation would revise an assumed input into a derived output — a deeper structural
revision than the D4 amendment was, which amended a *result within* the granted structure.
This raises the bar for any future derivation claim and makes the D4 predicate finding's
structural signal more significant by contrast.

Recorded as context, not as disproof: the grant's design predates the discovery that the
contact selection is structurally patterned (the 14-vs-14 predicate, BL-055 §4, §7). The
framework did not know, when it granted the structure, that its satellite layer carried a
clean intrinsic partition the frozen routes could not express.

## 3. What a derivation of the organization would require

A derivation of the organization would need machinery inputs replacing each grant. Candidate
replacement classes — named as *requirements on a future route*, not proposals:

1. **An intrinsic axis for membership.** An axis on the 21 A1 anchors / 28 satellites that
   recovers parent/satellite membership without reading R — the BL-055 pattern (intrinsic,
   Tn-invariant, keying-stable, non-circular) applied to the GOVERNS relation itself.
2. **A rule generating the seven offices** (or recovering `o(h)`) from non-office data; or a
   proof that the office label is recoverable from relations among non-office quantities.
3. **A rule generating the 28-edge edge structure**, or a closed relation from which it is
   readable without the grant.
4. **For any cycle-walk-based approach, a replacement for the granted CONSTRUCTS pairs** as
   the cycle's ground — or a derivation of the pairs themselves (§2.1, row 3), since R2's
   cycle edges are read from exactly those granted pairs (BL-055 §5 W3).

No such rule is proposed here. Any future candidate would require its own four-gate corridor —
admission → implementation → execution → amendment (the BL-057 roadmap pattern) — and its
amendment would target an input whose granted status is *declared in the frozen contract*,
not merely an outcome row: a deeper revision than Gate 4's additive link. The gates are named
for planning; none is opened.

## 4. Evidence for intrinsic structure (the question is not idle)

**4.1 The 14-vs-14 predicate (BL-055 §4, §7).** The contact selection is structural, not
historical: observed contacts are exactly the 7-27 satellites (interval vector `<344451>`),
the unobserved exactly the 7-31 (`<336333>`); globally the 462-record ledger contains exactly
fourteen of each, all A1 satellites; the predicate is intrinsic (interval content),
Tn-invariant, keying-invariant, representation-stable, and non-circular (canonical-ledger
fields, not observation membership). *Shows:* the satellite layer carries a clean intrinsic
partition that separates contacting from non-contacting members. *Does not show:* that
membership, offices, or edges are derivable — the partition selects *within* the grant; it
does not generate it.

**4.2 The midpoint invariant (BL-056 §5).** Every cycle edge's midpoint (`midZ7` of its
endpoint offices) equals the office of the anchor it constructs — 7 realized, 2
observation-exact, 5 confirmation-marked predictions; `realizationOfObserved = true`; the
Phase C seam relation inventory is set-identical to the route's realized midpoint set.
*Shows:* the office labels of the A1 anchors are consistent with the geometry of the cycle
edges that construct them — the strongest recorded candidate for a geometric route to office
structure. *Does not show:* that offices are recoverable *independent* of granted office
fields — the invariant is currently satisfied by granted values, and 5 of its 7 instances
remain predictions.

**4.3 The fa/ti asymmetry (BL-033 OD-C3; ENTRY 15 §D7 Clause).** The paired poles fail
differently — fa (D4): seam over-generation; ti (D7): orbit non-closure — and the asymmetry
is measured across selection, structure, and predicate axes simultaneously
(`scrum/plan/bl-033-phaseC-results-memo.md:75`; ENTRY 15 `:2703-2712`). *Shows:* the boundary
configuration is structurally variant, not uniform; paired suites carry comparable
distinctions. *Does not show:* which way the variance bears on derivability — it is data for
both columns of this memo.

**4.4 The D-tier's M-closure (BL-029 §3(c), §3(e); ARCHITECTURE_MAP §4).** The 49 D-anchors
are M-closed: exactly 49 modal applications — one out, one in per anchor — partitioning into
seven 7-cycles, one per tier, tier-, family-, and rooted-Q-preserving; the *complete* admitted
D–D relation set is this single-operator M structure, and every discriminant check passed
over it; the D-anchors' 228 fixed-degree departures / 228 arrivals all terminate in or
originate from satellite states. *Shows:* anchor-level organizational structure exists and is
structurally complete at the boundary layer — via M, the one operator row 2 excludes for
every tier. *Does not show:* fixed-degree (row-2-class) closure exists at anchor level — it
provably does not: zero D–D fixed-degree applications exist in the full admitted universe.

**4.5 The office-following baseline (BL-035 §4).** The heptatonic office-following
resolution is collision-free at office level (301 office-bearing + 154 boundary; single
inheritance by construction). *Shows:* the granted side of the comparison is unambiguous —
the ontological layer resolves deterministically. *Does not show:* derivability — the
baseline's cleanliness is a property *of the grant* (one office per state by construction),
so it cannot testify for or against deriving the grant; it is listed here to keep the two
readings distinct.

## 5. Evidence against / obstructing (honest tally)

**5.1 D7's modal non-closure (ENTRY 15 §D7 Clause; `qa/d4-r2-execution-receipt.json`
`d7Analogue`).** The paired case fails every D4 route test: literal predicate selects 0/14
(D7 satellites are set class 7-2 — input-level asymmetry); the domain-class predicate selects
14/14 = U = O, a full-domain restatement with **no selection gap** (U equals the contact set
by construction); cycle-twin verification is 0/7 — the orbit closure `M(4033) = 127` is
modal, not rotational; every edge is `predicate-only`. If the organization were uniformly
derivable, the paired boundary case would be expected to display analogous route structure;
it displays none. (D7 has no grant; the analogue-R is constructed. This is a constraint
observation, not a parity claim — parity claims are forbidden, OD-3.)

**5.2 The cycle ground is itself granted (BL-055 §5 W3; BL-056 §2, §8).** R2's derivation
ground — the closed 7-edge A0 cycle — is read from the granted CONSTRUCTS parent pairs; each
office's unordered E-parent pair is asserted set-equal to its cycle edge. The contact theorem
derives *selection within* granted edge structure; it does not derive the cycle, the parent
pairs, the offices, or the satellites. Deriving GOVERNS therefore requires also replacing or
deriving the CONSTRUCTS ground (§3, requirement 4) — a strictly larger task than the corridor
performed.

**5.3 Five midpoint predictions unconfirmed (BL-056 §5; Gate 3 §3).** Only 2 of the 7
midpoint relations are observation-exact; the remaining 5 are confirmation-marked predictions
awaiting direct observation on the D4 seam surface. The strongest candidate bridge from cycle
geometry to office structure is therefore 2/7 confirmed at landing.

**5.4 G1 shut (docs/ARCHITECTURE_MAP.md §4).** No intra-330 adjacency rule exists; the
pentatonic inter-node space is fragmentary (fragment edges only, several artifacts at
`proposed_pending_crt_309`). Any organization-derivation route needing that layer is fenced
until G1 moves — and this memo does not move it.

**5.5 Directional semantics unrecorded; teleological collision-proneness (BL-035 §5; BL-031
§3).** The one directional question ever asked returned negative derivability
(`directionAssigned: false`; kernel windows null for 90 of 105 entries); the teleological
layer is collision-prone exactly where shared structure concentrates (25 conflicting nodes
over 11 office pairs; 255 zero-claimant field). An organization derivation would have to
survive the same class of contest; nothing recorded so far suggests it would be easier than
the directional question was.

**5.6 The grant's design status (§2.2).** No framework document records GOVERNS as
derivable; the original modeling assumption is that it is an input. Nothing is proved by
this — but the burden of evidence lies on the derivability side, and it is currently carried
by first-evidence-grade findings only.

## 6. Candidate approaches (questions only; none endorsed)

Each approach below is stated as a question with its falsification shape. No approach is
recommended, funded, or sequenced here; each would require its own admission decision before
any design work begins.

**6.1 Cycle-walk generalization.** *Question:* can the closed-relation + twin verification
machinery run over a relation other than the A0 cycle — over the parent/office structure
itself, or over the D-tier's modal cycles? *Falsification shape:* if no second closed
relation exists whose edges pass a twin/validation check, the machinery is A0-specific and
does not generalize. *Recorded constraint:* the only anchor-level closure the admitted
universe contains is M (BL-029 §3(e)); row 2 excludes M for every tier; M-walkability is not
promoted and this memo does not promote it.

**6.2 Predicate transport (the BL-035 → BL-031 pattern).** *Question:* does an intrinsic axis
exist that splits parent/satellite membership or office assignment — and does it survive
alternate keying and transport (census first, then a transport probe, the methodology the
semantic-derivation census and semantic-transport probe established)? *Falsification shape:*
no axis splits the grant cleanly; or an axis splits but is keying-dependent, representation-
unstable, or circular (reads observation membership).

**6.3 The D-tier asymmetry as the boundary case.** *Question:* must any candidate rule handle
both rotational closure (D4: 2×T1 + 5×T2; cycle-twin 7/7) and modal closure (D7:
`M(4033) = 127`; cycle-twin 0/7)? *Falsification shape:* a rule that derives D4's offices but
is undefined or contradictory on D7 — or, symmetrically, a rule that handles only the modal
case. The asymmetry is a constraint on the rule space, in either direction.

**6.4 Midpoint reconstruction.** *Question:* can `o(h)` be recovered from the geometric
midpoint relation (`midZ7` of cycle endpoints equals the constructed office) rather than the
granted office field — and if so, can the A0 offices that the midpoint currently reads also
be recovered from deeper structure? *Falsification shape:* a counterexample office whose
midpoint is not unique, or a dependence chain that terminates in a granted field with no
geometric replacement. *Note:* the current invariant is a consistency relation among granted
values, not a reconstruction; this question is one level deeper than BL-056 §5.

**Gate note (binding).** None of these approaches is a route, a design, or a claim. Any
future candidate runs the four gates — admission → implementation → execution → amendment —
and any amendment would revise an input's granted status, a deeper revision than Gate 4's
additive link (§3).

## 7. Open-research declaration (binding)

This memo scopes the question. It records no derivation, proposes no route, admits nothing,
and amends nothing. Nothing in it constitutes evidence, a claim, an admission, or a verdict.
**The question remains open.** It defines what would count as an answer, what evidence would
bear on one, and what stands in the way — and stops there.

## 8. Fences and what this memo does not do

No claim events; no record amendments (D4's `derivable-via-R2` and D7's hypothesis-tier are
unchanged; ENTRY 10 and ENTRY 15 are byte-untouched by this memo); no G1 movement (intra-330
edges still gated); no governs admission; no INV-5 graduation; no M-walkability promotion; no
canonical/Court/schema/Neo4j writes; no directional-semantics assignment. The frame
(§§2.6/§2.7) is interpretation vocabulary, never design input; session prose is context, not
evidence. The higher-theorem scoping is explicitly open research: it defines the question, it
does not claim the answer. No manifest beyond the landing's own packaging is touched by the
memo's content.

## 9. Closing note: the biggest open question in the project, made askable

The D4 corridor derived the *contact geometry* — a bounded result through a granted input.
This memo formalizes the question above it: **can the granted input itself be derived — can
the framework's own organizational structure (the offices, the edges, the GOVERNS relation)
fall out of the same machinery, rather than standing as an assumed input?** That is the
difference between deriving a result *within* the framework and deriving the framework's own
*architecture*.

This memo does not answer it. It makes the question **askable for the first time**, with the
evidence for and against stated honestly — four items for, six obstructing, four candidate
approaches with their falsification shapes and none endorsed. That is the artifact's purpose:
to make the biggest open question in the project formally approachable, so that future
findings have a place to land and a question to be measured against.
