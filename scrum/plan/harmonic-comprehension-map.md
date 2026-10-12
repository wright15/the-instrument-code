# Harmonic Comprehension Map

**Status:** sprint artifact. Shared context for BL-020, BL-031, BL-033. No ledger
entry, no evidence obligations. Mutable plan space.

**Input classification (binding).** This map mixes three classes, tagged inline:

- `[ADMITTED]` — traceable to SPEC-001 §2.1, the Q-table freeze memo, or the committed
  tests. Citable in sprint artifacts.
- `[HYPOTHESIS]` — inputs and predictions only. Must not be asserted anywhere. If any
  claim here contradicts the frozen design or fails verification, it is demoted and
  reported, not smoothed over.
- `[OPEN CANON QUESTION]` — resolve only from framework docs, never from this text.

## §2.1 precision rule (carried everywhere both events appear)

Completion (k=4: five distinct tones present) and closure (k=12: the orbit returns to
origin) are **different events and must not be conflated**. Pure-ratio drift and modular
12-TET closure are likewise distinct. Source: `docs/specs/fivefold_constructs_engine_spec.md:137-149`.

## 1. Admitted

### 1.1 Fifth-stack generator

`[ADMITTED]` t_k = 7k mod 12, k=0..11 -> (0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5); the
Q1 orbit is this 12-cycle. Completion at k=4, closure at k=12 per the §2.1 precision
rule above. Sources: SPEC-001 §2.1 (`docs/specs/fivefold_constructs_engine_spec.md:130-149`);
generator and traversal transcription: `src/fivefold/quintessence.py:44`
(`TRAVERSAL_CYCLE`); completion/closure pair: `tests/test_fivefold_q_table.py`
(`test_completion_window_at_z4`, `test_closure_at_z12`).

### 1.2 Composition (4+1)

`[ADMITTED]` The substrate's four bits are the elemental governors (Mars/Fire b3,
Jupiter/Air b2, Venus/Water b1, Saturn/Earth b0); states enumerate their engagement
configurations. Quintessence (Mercury) is not a bit but the transition law. Luminary
brackets (Sun/Moon) are outside this substrate. Sources: freeze memo §1
(`scrum/plan/bl-010-q-table-freeze-memo.md`), deriving from
`framework/AGENTS.md:257-261` and `framework/TOPOLOGICAL_ANCHORING.md:90-96`.

### 1.3 Stationarity

`[ADMITTED]` 0000 is on-path: the unengaged ground is the origin from which mediation
begins. 1111 lies in the still set: the fully-realized configuration is the boundary at
which motion rests, not a stop on the path. Overlay decision (canon points opposite for
1111); Court runtime's C3<->C4 register moves are a different layer; correspondence
gated SPEC-001 §6(4). Source: freeze memo §2 (repaired wording and motivation).

Precision note (2026-09-25): the gate named here is the composition's use as the SPEC-001
§6(4) bridge (overlay↔GOV-517 input lanes; freeze memo §4). The engagement↔position
correspondence (§1.5) is a separate new Tier-2 admission (admitted per ENTRY 13), **not** a
§6(4) resolution; §6(4) remains separately open
(`scrum/plan/fivefold-mesh-adjudication.md`, pre-landing corrections).

### 1.4 Teleology completes early

`[ADMITTED with composite citation]` The generative window at z=0..4 is the five-state
segment {0000, 0111, 0010, 1001, 0100} — completion at k=4 per the §2.1 precision rule,
while closure remains at k=12. The five states' positions spell the fifth-stack window
{0, 7, 2, 9, 4} = the pentatonic set; canon identifies the C0-C4 courts as Forte 5-35
(complement family of 7-35) at `provenance/OBSERVATION_LEDGER.md:68` and `:369`. The
phrase "teleology completes early" is this map's language, not canon wording.

### 1.5 Registry engagement↔mask pairing

`[ADMITTED]` The five Court registry positions pair the ascending engagement vectors
`0000 -> 1111` with the masks `{0,2,4,7,9} -> {0,3,5,8,10}` and the internalization order
Mars -> Jupiter -> Venus -> Saturn (Fire -> Air/Wind -> Water -> Earth). The origin state
0000's registered mask equals the pitch positions of the Q completion window z=0..4:
`{0,2,4,7,9}` = `{0,7,2,9,4}` (`docs/specs/fivefold_constructs_engine_spec.md:130-149`;
`src/fivefold/quintessence.py:37-41`;
`seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json:11-36`).
Field-for-field certification: `scrum/plan/bl-044-court-voicing-audit.md:15-21`. The
identification of these Court engagement configurations with the Q substrate's 16-state
states is **admitted** as `SPEC-FIVEFOLD-COURT-CORRESPONDENCE-001` v0.1.1
(`provenance/DECISION_LEDGER.md` ENTRY 13; receipt
`qa/specs/bl-011-correspondence-admission.json`; machine check
`tests/test_court_engagement_correspondence.py`). SPEC-001 §6(4) (overlay↔GOV-517 input
lanes) remains separately open.

## 2. Hypotheses

### 2.1 Bucket layer

`[HYPOTHESIS — FORM REGISTRY-GROUNDED, SESSION POLARITY REJECTED 2026-09-25]` The
keep-or-sharpen form survives: each engagement flip sharpens one fifth-stack degree by a
semitone, and the admitted XOR supports `{4,5}`, `{9,10}`, `{2,3}`, `{7,8}` pair each flip
with its sharpened degree (`framework/AGENTS.md:293-298`; registry
`xorSupportFromPrevious`). The session polarity — internal = keep, so 1111 = pure stack —
is **rejected as a registry claim**: the registry pairs ascending engagement with the
sharpened chain (C0 all-external `{0,2,4,7,9}` … C4 all-internal `{0,3,5,8,10}`;
`seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json:11-192`).
External keeps the stack degree; internal sharpens to the semitone-raised neighbor. The
rejected orientation survives only as the Orrery bucket overlay's counterfactual version
(labeled, toggleable, unasserted). This layer does **not** touch
`src/fivefold/quintessence.py`. See `scrum/plan/fivefold-mesh-adjudication.md` (A1) and
`scrum/plan/fivefold-mesh-spec-v3.md` §1.3.

### 2.2 Rest state sounds the pure stack — DEMOTED AND INVERTED

`[HYPOTHESIS — INVERTED 2026-09-25]` Under the registry polarity the origin 0000 sounds
the pure stack `{0,2,4,7,9}` (all external = all kept), and the still anchor 1111 sounds
Man Gong `{0,3,5,8,10}` (all internal = all sharpened). The earlier reading (1111 sounds
the pure stack) is **demoted** and now describes only the Orrery overlay's counterfactual
behavior, not the registry pairing. Depends on the bucket layer (2.1) under the corrected
orientation.

### 2.3 Modal chain and its direction — SUPERSEDED

`[HYPOTHESIS — SUPERSEDED 2026-09-25]` The engagement-to-mask mapping is the ascending
registry pairing `C0 -> C4` (`0000 -> 1000 -> 1100 -> 1110 -> 1111`), registry-admitted.
The descending chain `1111 -> 0111 -> 0011 -> 0001 -> 0000` is **retired as a mapping
hypothesis** (it shared endpoints with canon, not path, exactly as recorded). The
**antiparallel observation is promoted**: engagement ascends while Court compression
darkens (`kappa_court` monotone 0 -> 1,
`seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json`; proposed
brightness ordinal 22 -> 26 `schemas/elemental_pentatonic_scale_map_v1.0.0.yaml:95-218`,
field semantics `[OPEN]`), registry-evidenced rather than hypothesis.

### 2.4 Luminary brackets and poles

`[HYPOTHESIS]` Luminary brackets correspond to the fa/ti poles; 5-35 reads as 7-35
unbracketed; D4/D7 read as non-derivable-bracket configurations. Sharpens the freeze
memo §4 bridge hypothesis. `fa`/`ti` have zero framework hits — the terminology is novel
to this map. **D4 qualifier (binding):** the registered `not_derived` outcome certifies
non-derivability under the registered single-phase boundary — recorded difficulty of
derivation, not authorship of impossibility (`provenance/DECISION_LEDGER.md:2195-2252`;
SPEC-001 `:42-44`). D7 has no derivation record (transition labels only,
`neo4j/csv/governs.csv`). The bracket reading is a prediction about why derivation is
hard; it must never be phrased as explaining the `not_derived` record.

### 2.5 fa-distance reading of D4

`[HYPOTHESIS]` fa-distance / eleven-steps-for-one: poles are boundary entities of the
motion, so a single-phase construct cannot reach across them (eleven steps for one).
This is BL-033's testable prediction, recorded as prediction, not conclusion.

### 2.6 Ontology/teleology behavioral framing

`[MAINTAINER HYPOTHESIS — registered framing]` Registered 2026-10-04 from the pre-build
session. This entry registers the maintainer's being/becoming vocabulary for how the layer
stack relates. It is not fresh invention: the split and its music-theory content are already
an admitted Blueprint distinction (`docs/ARCHITECTURAL_BLUEPRINT.md:16-23` — Ontology = 7
Governors / 7-35 / photonic `C_P`; Teleology = 4-pole Court + Quintessence / 5-35 /
electric-magnetic labels as authored correspondence; built out at `:27-53` and `:55-97`).
The frame is maintainer framing *extending* that admitted distinction into the
transport/interpretation context — not a new layer model.

**Founding distinction.** Ontology = the Forms at rest (what things are); teleology = a
Form's repertoire of behavior in the mathematical substrate (the different ways any
particular Form can behave). Applied here: the semantic payload layer (landforms) is the
ontology — Forms assigned to coordinates; the operator algebras (row 1 structural mutation,
row 2 R/L projection, row 6 Q-overlay) are the teleology — the universal physics of behavior
any Form plugged into the substrate expresses. Identity-preservation guarantee: operations
change a Form's posture, never its identity. Rests on: Q-engine closure on the 16-state
substrate (`tests/test_fivefold_q_table.py`); row 1's exhaustive structural audit with
semantic authority explicitly withheld (`seven-governors-mutation-algebra-audit/`;
`tests/verification/test_mutation_algebra.py`); ENTRY 13's configuration-level-only boundary
(`provenance/DECISION_LEDGER.md:2490-2565`; `qa/specs/bl-011-correspondence-admission.json`);
the projection's own payload policy
(`seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/domain-projection-registry.json`
— office origin pools admitted; every office carries `semanticMutationPolicy: No
operator-specific landform delta is admitted in v0.1.1`).

**5/7 explanation (the office-key ruling's rationale).** The five-element schema (Fire,
Water, Air, Earth, Quintessence) is native to the five-fold Court/pentatonic space; Sun and
Moon are the luminary pair whose offices take the count from 5 to the full 7-35 heptatonic
space. Cited structure: `semantic.element` is `authored_correspondence`, typed
`string_or_null`
(`seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/csv/feature-definitions.csv:16`);
the population is 5/7 — Mars Fire, Mercury Quintessence, Jupiter Air, Venus Water, Saturn
Earth, Sun and Moon null
(`seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json:22,78,549,605,1077,1133,1655,1711,2218,2274,2793,2849,3454,3510`);
the luminaries are identity-level brackets, `type: monopolar_luminary`
(`schemas/governors.yaml:43,202`; `docs/ARCHITECTURAL_BLUEPRINT.md:49-53`). The *expansion*
sentence (5-35 plus luminaries = 7-35) is this frame's language, not recorded canon wording —
the artifacts record the 5/7 population and the bracket role, not the expansion claim. The
frame's consequence: elemental keys force a lossy 7→5 projection; office identity keys
preserve 7/7 native coverage. Probe design is untouched by this entry.

**Transport reframing.** A multi-hop route does not mutate a Form; it puts the Form through
a sequence of behavioral phase changes. Route divergences at one target are not corruption —
they are the refractive measurement: different operator histories produce different postures
at arrival while identity is carried in the pool ("verbatim carry", the frame's term) and
expression is set by the route (geometry record). This is a reading lens for the transport
probe's findings, not a probe input. Adjacent measured context: BL-035 already recorded the
teleological/ontological derivation difference — pentatonic claims collision-prone at shared
structure, heptatonic office inheritance collision-free
(`scrum/plan/bl-035-semantic-derivation-census-memo.md:23-31,64-75`).

**Falsifiable stake (dated; first check resolved).** As of this registration (2026-10-04),
the frame's first empirical check is the transport probe's same-origin multi-route
pool-identity expectation: if operations change posture and not identity, same-origin
multi-route arrivals must be pool-identical, and route-dependent pool divergence at
same-origin would falsify the separation (mechanics altering Forms, not postures).

**First empirical check PASSED (2026-10-04, BL-031 Phase 2 semantic transport probe,
`fec745a`, artifact fingerprint
`9138a7ab2988382a9a1012b0c0a07bd661ce61f8f6d9b40a5054a9d67e58a6d4`).** Same-origin
multi-route arrivals were pool-identical across all queries — operations changed posture,
never identity. The separation stands after its first test. Qualifier (binding): the control
is verified as a construction invariant — "one origin's pool is carried verbatim on every
route; same-origin multi-route agreement is a control, never a finding"
(`orrery/src/generated/semantic-transport-probe.v1.json` `preRegistration.sameOriginControl`;
`scrum/plan/bl-031-semantic-transport-probe-memo.md:90-91`) — with lossless verbatim carry
and a passed fail-loud overlap check
(`scrum/plan/bl-031-semantic-transport-probe-memo.md:80-85`). The pass validates the
construction first and supports the frame through it, not as an independent discovery.
Program note: this is the Phase 2 semantic transport probe; the Phase-A lattice program
(`scrum/BACKLOG.md:343-395`) is separate and untouched
(`scrum/plan/bl-031-semantic-transport-probe-memo.md:39-43`).

**Interpretation (findings pinned; probe memo + artifact).** Transport divergence observed:
1,510 divergent-route queries; arrivals distinct per office (0 identical / 0 subset
cross-office; 3,926 disjoint / 620 overlapping, overlapping exactly the three admitted
shared landforms) — refraction, not corruption, per this frame's prediction
(`scrum/plan/bl-031-semantic-transport-probe-memo.md:80-91`). Postural layering observed:
depth-2/3 transport origins are structurally disjoint from one-hop claimants, so the
contested band is stable under deeper transport and new arrivals build new expression
without disturbing existing conflicts
(`scrum/plan/bl-031-semantic-transport-probe-memo.md:69-76`; gap map/feeds
`scrum/plan/bl-035-semantic-derivation-census-memo.md:88-102`).

**Second test (pending).** The directional-semantics check remains gated on the polarity
synthesis's closure-review admission (§2.7 Q2). This block is updated at future
interpretation points under this map's rules; BL-031 design is not edited by this entry.

**Blueprint vs. map — two axes, no reduction.** The Blueprint's Ontology/Teleology is the
being/becoming axis (7 Governors vs 4-pole Court + Quintessence); this map's Layers 1–4
(`docs/ARCHITECTURE_MAP.md:28-76`) are the edge-ownership axis (heptatonic universe /
bipartite containment / pentatonic inter-node space / engagement substrate). Different axes,
both valid, neither reduces to the other: a payload Form is ontological under the Blueprint
axis while its coordinate lives in Layer 1 or 3 under the map axis; the Q overlay is
teleological behavior while it is Layer 4 dynamics under the map axis. Nothing in this entry
renumbers either scheme.

`[INTUITIVE GLOSS — UNCITED]` The maintainer's electric/magnetic and light/matter analogies
(M as a phase rotation in an alternating magnetic field; R/L as electrical potential shifts;
mechanics as electricity/magnetism running the circuit; forms as the light/matter spectrum
emitted at the terminal) are carried as explicitly-labeled intuitive framing only. No
artifact states them; they are intentionally uncited. Provenance separates them from the
Blueprint's own electric/magnetic labels (`docs/ARCHITECTURAL_BLUEPRINT.md:72-83`), which are
authored correspondence in the register-axis context with physical claims excluded by
CRT-348: citing those labels does not cite this gloss, and this gloss does not extend them
into probe context.

### 2.7 Phenomena layer and electrodynamic teleology — proposed revision

`[MAINTAINER DESIGN INTENT — registered]` Registered 2026-10-04 from the pre-build
session. This entry registers the design intent behind the mutation algebra's
natural-phenomena origins and the polar structure of the teleological layer. **It is a
proposed canon revision, not a registration of existing canon.** The maintainer's
photonic-coherence set (below) proposes changing, as primary at five of seven offices, the
phenomena the framework currently records; adoption is a framework-revision-ceremony matter,
not something this fast-lane entry effects. The recorded set is framework prose — §5 "Seven
Natural Phenomena" (`framework/NATURAL_ORGANIZATION_THESIS.md:150-233`) and the functional-map
column (`framework/AGENTS.md:408-414`) — formalized in the toolkit's proposed registry
(`seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/physical_phenomena.yaml`,
`admission: proposed`; the registry is **not** a pre-framework draft — it faithfully mirrors
the canon). Nothing here demotes the recorded set by declaration.

**Revision rationale (photonic coherence).** The ontological layer's register is light and
matter; the proposed revision makes every governing phenomenon a photonic/light-matter
interaction, matching that register. The delta is per-office, not wholesale: canon already
contains some revision picks (blackbody under Sun `:162`; "refraction into medium" under
Venus `:220`), so the proposal elevates the photonic subset to primary rather than importing
foreign material; Mars and Saturn are the two genuine category shifts.

**Three-way table (recorded canon → registry formalization → proposed revision).**

| Office | Recorded canon (thesis §5 / AGENTS.md) | Registry formalization | Proposed revision | Delta |
|---|---|---|---|---|
| Sun | Thermal Emission / Radiative Release (`:157-166`; `AGENTS.md:408`) | Thermal radiative emission — Planck/blackbody (`:16-46`) | Direct spectral emission | reweight/relabel |
| Moon | Reflected Reception / Warmth Held (`:168-177`; `:409`) | Diffuse reflection and reception — Lambertian (`:47-77`) | Specular reflection and phase angle | reweight/relabel |
| Mars | Combustion / Ignition Fronts (`:179-188`; `:410`) | Combustion activation front — Arrhenius (`:78-110`) | Incandescent thermal radiation (blackbody emission) | category shift (chemistry → photonic) |
| Mercury | Photosynthesis / Conversion Hinge (`:190-202`; `:411`) | Photosynthetic energy transduction (`:111-138`) | Photosynthesis | convergent |
| Jupiter | Rayleigh Scattering / Diffusion (`:204-213`; `:412`) | Rayleigh scattering (`:139-170`) | Rayleigh scattering | convergent |
| Venus | Selective Absorption / Molecular Bond (`:215-223`; `:413`) | Selective molecular absorption — Beer–Lambert (`:171-204`) | Refraction and polarization | reweight/relabel |
| Saturn | Crystallization / Phase Boundary (`:225-233`; `:414`) | Crystallization and phase-boundary fixation (`:205-235`) | Optical absorption and occlusion | category shift (condensed-matter → photonic) |

Tally: two convergent, three reweight/relabel, two category shifts. Registry line refs are
within `.../schemas/physical_phenomena.yaml`; thesis refs are within
`framework/NATURAL_ORGANIZATION_THESIS.md`.

**Registry annotation (map-held).** The supersession marker is held here rather than edited
into `physical_phenomena.yaml` because the toolkit package payload is pinned as a frozen
composite package identity (`scripts/validate-release.mjs:233`, payload hash `b7ebc166…`);
a comment-only edit would require re-pinning a frozen package payload — outside fast-lane
scope. Wording for the closure review: the registry formalizes framework canon; the
photonic-coherence revision is proposed; adjudication at closure.

**Teleological polarity structure — three tiers.**

1. *Declared (dipoles).* Each of the four classical elements (Fire, Air, Water, Earth)
   carries **both poles** — electric and magnetic — as intrinsic capacity, and Quintessence
   moves and pivots them. Declared design intent: the elements' polarity is native, not
   position-derived.
2. *Recorded tension (state-split).* The repo's proposed mechanics registry
   (`schemas/mechanics_thermodynamics_registry.yaml:9-10,40`) splits Electric = External/0
   and Magnetic = Internal/1 — pole-per-engagement-position, not both-poles-per-element.
   Genuine structural tension with tier 1; not smoothed.
3. *Proposed synthesis.* `[COMPOSITIONAL HYPOTHESIS — proposed resolution of polarity
   tension]` The engagement bit is proposed as the selection rule over the dipoles:
   elements carry both poles intrinsically (tier 1); the bit selects which is expressed
   (tier 2); so direction becomes derivable per node from (element, engagement state).
   Status: *"The registry's state-split is not contradicted by the directive's dipoles if
   the former is the selection rule for the latter; this composition is proposed, not
   admitted; the closure review adjudicates."* Intent rider: *"Synthesis consistent with
   declared intent on dipole structure; selection mechanism proposed (engagement-state
   projection), not declared — the closure review adjudicates whether engagement-projection
   is the full selection rule or a special case of a richer one."*

**Layer coupling.** Photonic and electromagnetic domains are physically coupled — light is
electromagnetic radiation, and each proposed phenomenon is a place where light/matter
(ontology) meets electrodynamic behavior (teleology). Distinguishable by register,
continuous through the phenomena. Adjacent admitted context: the Blueprint's
Ontology/Teleology distinction (`docs/ARCHITECTURAL_BLUEPRINT.md:16-23,55-97`); the
directional non-derivability finding this frame addresses
(`scrum/plan/bl-035-semantic-derivation-census-memo.md:77-86`).

**Tier boundary.** Declared maintainer design intent proposing a canon revision; the design
origin of the algebras' meaning, not a description of admitted semantics. Fills no finding
row automatically; finding statuses unchanged; not citable as claims.

**Forward hooks.** (a) Seeds the future governs-semantic-layer work item. (b) Supplies
polarity vocabulary for the topology candidate's directional semantics (proposed only).
(c) Transport-probe interpretation pointer (deferred): if the revision and synthesis are
adopted, same-form arrivals through different operator histories could be read as
pole-expression history — interpretation only; never a probe input. (d) Closure agenda, two
questions: **Q1** — does the photonic-coherence set supersede the recorded phenomena set as
primary? (evaluated by the register criterion at the revision ceremony). **Q2** — is the
registry's state-split the selection rule for the directive's element-dipoles?
(derivation-testable the way BL-035 tested non-derivability: attempt the direction
derivation; check coherent directional structure at the boundary nodes where the hole was
found). The ceremony validates or falsifies by whether the composition fills the hole
without contradiction.

`[INTUITIVE GLOSS — UNCITED]` The dipole/projection reading may be informally expressed as
an intrinsic pole pair selected by an engagement-state operator (illustrative notation:
P₀ → Electric expression, P₁ → Magnetic expression, D = f(e, s)); tensor/operator language
is illustrative formalization of the proposed composition, not repo-derived mathematics and
not cited. No electromagnetic equivalence or physical quantity claim is asserted (the
mechanics registry's own boundary: `no_electromagnetic_equivalence: true`).

### 2.7 Amendment — BL-057 R₂ + optical taxonomy [MAINTAINER DESIGN INTENT — registered §2.7 amendment]

Registered 2026-10-10 from the BL-057 planning pass. This entry extends the §2.7
registration above (fast-lane additive, BL-026/§2.6 precedent); the two entries
coexist — the original §2.7 (phenomena layer and electrodynamic teleology) and this
D4-corridor amendment (R₂ route proof + seven-form optical taxonomy). Operating
constraint: interpretation vocabulary only; never a probe input, design input, or
admitted canon claim. Does not alter §§1.x, 2.1–2.6, or ENTRY 10
(`provenance/DECISION_LEDGER.md:2195-2252`).

**A. R₂ filtered cycle-walk derivation proof.** Route definition
`R₂(h) = {(o(h), s) : s ∈ satellites(h) ∧ P(s)}` — for each A1 anchor `h`, the
derived contacts are exactly its satellites satisfying `P(s) = [forte(s) = 7-27]`.
Derivation steps: (1) extract the anchor's two A0 CONSTRUCTS parents (the cycle
edge); (2) verify `cycle_twin(a, b, d) ⟺ rotateMaskZ12^d(a) = b` at the edge's
interval `d` (gated, per-office justification tier); (3) select the `P` satellites;
(4) emit contacts. The cycle edge is derivation ground; the predicate is selection
within. Frozen cycle convention:
`2741 → 1387 → 1453 → 1717 → 2773 → 1451 → 1709 → 2741` (closed; 2×T₁ + 5×T₂,
interval sum 12; BL-055 §6 records the same cycle at a different entry point —
start point is presentation convention only; the cycle is closed and
M-successor-directed). The generalized twin relation holds at all 7 edges (offices
0 and 6 T₁; offices 1–5 T₂; `justificationSummary: {cycleTwinVerified: 7,
predicateOnly: 0}`; no fallback offices). Proof of non-collapse: `|G_R2| = 14 ≠ 28 =
|U|`; the T-B join output remains U — the cycle-edge ↔ construction-pair identity
is broken at the satellite-reading level (R₂ conjoins P where the T-B join never
reads `s` except as payload). Sources: BL-056 artifact
`orrery/src/generated/d4-r2-route-review.v1.json` (fingerprint `e25851f9…`), dual
harness `scripts/build-d4-r2-route-review.mjs` (deterministic generator) +
`orrery/scripts/validate-d4-r2-route-review.mjs` (fail-loud independent
re-derivation), 10 vitest pins `orrery/src/d4-r2-route-review.test.ts`.

**B. Intrinsic selection predicate.** `P(s) = [forte(s) = 7-27]`. Uniformly selects
exactly 2 satellites per office (14 total across 7 offices), separating observed
contacts (`7-27`, interval vector `<344451>`) from unobserved contacts (`7-31`,
`<336333>`). The predicate is intrinsic (interval content), Tn-invariant,
keying-invariant, and non-circular (canonical-ledger fields, not observation
membership). G2/G3: `G_R2 = O` exactly (`missing: []`, `extra: []`). Sources: BL-055
clean 14/14 split; BL-056 G2/G3.

**C. Construction-midpoint invariant.** `midZ7(edge) = office(child)` (`midZ7`
imported from `scripts/d4-derivation-engine.mjs`, the frozen T-C midpoint
definition). Census: 7 realized relations; 2 observation-exact (the frozen T₁ seam
relations `A0:1387:2741:0` and `A0:1451:2773:6`); 5 seam-derived predictions, each
carrying `predicted: A0:…; confirmable against comparison.tC.observedRelations,
qa/d4-production-receipt.json`. Seam cross-check: the Phase-C T-C relation inventory
(7 generated) is set-identical to the route's realized midpoint set; its observed
subset (2) is set-identical to the exact subset; `realizationOfObserved = true`.
Source: BL-056 G5.

**D. Seven-form optical & photophysical taxonomy.** `[MAINTAINER DESIGN INTENT —
registered]` A phenomenologically coherent macroscopic taxonomy bridging the 7
Governors to macroscopic light–matter phenomena, registered as declared design
inspiration for the mutation algebra (§2.7). Design correspondence, not derived
canon — see the closing line.

*Coupling structure & non-exclusivity (preamble, verbatim).* The seven forms are
not mutually exclusive quantum mechanisms; real physical light–matter interactions
naturally couple and combine them across scales (e.g., Rayleigh scattering induces
linear polarization, attenuation sums absorption and scattering, and optical
absorption necessarily precedes photochemical transduction). The taxonomy organizes
primary phenomenological regimes and operational roles, not mutually exclusive
physical partitions.

*The seven forms in motion.*

1. **Sun → Direct Spectral Emission (primary radiative origin).** Macroscopic
   observable spectrum: photospheric thermal emission governed by Planck's law
   (T ≈ 5778 K, sharing a continuous thermal physics layer with the Mars register).
   Microscopic mechanism: spontaneous and stimulated photon emission via quantum
   transitions described by Einstein A and B rate equations,
   `dN₂/dt = -A₂₁N₂ - B₂₁ρ(ν)N₂ + B₁₂ρ(ν)N₁`. Ontological invariant: primary
   unconditioned radiation originating from internal state potential. Why it fits:
   operates as the system's primary cosmological emitter — the origin point of
   radiative flux before boundary interaction or intermediate medium modification.
   Distinction from Mars: shared thermal physics, distinguished by role (primary
   cosmological emitter vs. matter-driven kinetic/blackbody conversion).
2. **Moon → Surface Reflection & Phase Angle (secondary luminance).** Directional
   surface reflectance, albedo, and BRDF, modulated by illumination phase angle α:
   `f_r(ω_i, ω_o) = dL_r(ω_o)/dE_i(ω_i) ≡ dL_r(ω_o)/(L_i(ω_i) cosθ_i dω_i)`.
   Ontological invariant: secondary, non-originating redirection of incident flux
   conditioned by surface orientation and phase geometry. Why it fits: produces no
   intrinsic light in the visible spectrum; its observed posture depends entirely
   on geometric position relative to primary illumination and the observer. Physics
   qualification: lunar surface reflection is predominantly diffuse/rough (governed
   by Lommel–Seeliger / Hapke particulate scattering) rather than specular; BRDF is
   a distribution function, not a reflection tensor.
3. **Mars (Fire) → Incandescent Thermal Radiation (blackbody emission).** Radiation
   driven by thermodynamic kinetic excitation of matter, governed by Planck's law
   `u(ν, T) = (8πhν³/c³) · 1/(e^{hν/k_B T} − 1)` and Wien's displacement law
   `λ_max T = b`. Ontological invariant: direct conversion of thermal/kinetic
   energy into electromagnetic radiation. Why it fits: incandescence is the
   physical point where kinetic/thermal agitation (Fire) converts directly into
   visible photonic flux — light born from heat and friction. Physics
   qualification: matter-driven thermal conversion; shares the Planck layer with
   the solar photosphere, but functions ontologically as energetic agitation of an
   active substrate.
4. **Jupiter (Air) → Rayleigh Scattering (atmospheric dispersion).** Elastic
   scattering of electromagnetic radiation by dielectric particles much smaller
   than the wavelength (r ≪ λ), with intensity scaling inversely with the fourth
   power of wavelength: `I(λ) = I₀ · (8π⁴ N α²)/(λ⁴ R²) · (1 + cos²θ)`.
   Ontological invariant: non-absorptive, wavelength-selective redirection of
   propagation vectors across a distributed medium. Why it fits: defining physics
   of planetary atmospheres (Air); explains blue-sky dispersion and sunset
   reddening across gaseous media without requiring absorption. Physics
   qualification: Rayleigh scattering is the small-particle limiting case of
   general Mie theory; scattering intrinsically induces partial linear polarization
   (coupling to Venus) and contributes to extinction (coupling to Saturn).
5. **Venus (Water) → Refraction & Boundary Polarization (dielectric phase shift).**
   Phase-velocity alteration and trajectory bending at dielectric interfaces
   governed by Snell's law and the Fresnel equations, including complete linear
   polarization at Brewster's angle: `n₁ sinθ₁ = n₂ sinθ₂`,
   `θ_B = arctan(n₂/n₁)`. Ontological invariant: trajectory redirection, phase
   deceleration, and transverse state filtering upon boundary entry into a
   transparent dielectric medium. Why it fits: characterizes light passing through
   fluid, transparent, or dielectric media (Water), altering propagation paths and
   filtering polar orientation. Physics qualification: polarization is an
   electromagnetic field state that arises through reflection, refraction, and
   scattering; the Fresnel equations simultaneously describe transmitted
   (refracted) and reflected amplitudes.
6. **Saturn (Earth) → Optical Absorption & Propagation Attenuation (terminal
   boundary).** Exponential decay of irradiance through absorbing media governed by
   the Beer–Lambert law and the imaginary component of the complex refractive index
   (`ñ = n + ik`): `I(x) = I₀ e^{−αx}`, `α = 4πk/λ`. Ontological invariant:
   dissipative termination or geometric occlusion of propagation paths, defining
   boundary limits and shadows. Why it fits: dense physical matter (Earth) absorbs
   photon momentum, converts radiation into internal thermal excitation, casts
   geometric shadows, and marks the terminal edge of propagation. Physics
   qualification: absorption (energy transfer to matter) and occlusion (geometric
   path obstruction) are distinct physical processes that produce a shared
   macroscopic attenuation effect; extinction in matter sums absorption and
   scattering (`κ_ext = κ_abs + κ_scat`).
7. **Mercury (Quintessence) → Photochemical Transduction & Exciton Transfer.**
   Quantum photochemistry, exciton transfer, and the conversion of absorbed photon
   energy into chemical bond configurations, governed by the Stark–Einstein law:
   `ΔE = N_A hν = N_A hc/λ`. Ontological invariant: functional mediation transducing
   radiant electromagnetic energy into organized chemical and structural state
   machines. Why it fits: Quintessence acts as the operative mediator — light is
   neither merely reflected, scattered, nor lost to heat; its energy is transduced
   into structured state machines (e.g., biological tissue, photochemical storage).
   Physics qualification: photosynthesis is a specialized biological implementation;
   the general physical category encompasses all molecular and electronic state
   transductions driven by light.

*Coverage & boundary matrix.* The seven forms are not mutually exclusive mechanisms
— real light–matter events combine them (scattering polarizes, attenuation sums,
absorption precedes transduction) — the taxonomy organizes primary phenomenological
regimes, not exclusive partitions.

| Form | Primary regime | Governing formulation | Known physical couplings / overlaps | Excluded / adjacent phenomena |
|---|---|---|---|---|
| Sun | Primary source emission | Einstein rate equations (A₂₁, B₁₂, B₂₁); Planck photosphere | Overlaps with thermal blackbody emission (Mars) | Non-thermal emission (synchrotron, Cherenkov); stimulated laser emission |
| Moon | Surface reflection | BRDF `f_r(ω_i, ω_o)`; albedo | Shares Fresnel boundary mechanics with refraction (Venus) | Lambertian/diffuse scattering; planetary thermal re-radiation |
| Mars | Incandescence / blackbody | Planck's law `u(ν, T)`; Wien's displacement law | Continuum overlap with solar photosphere | Combustion chemical kinetics (Arrhenius) |
| Jupiter | Elastic scattering | Rayleigh dispersion `I ∝ λ⁻⁴` | Scattering induces polarization (Venus); part of extinction (Saturn) | Mie scattering (`r ≳ λ`); Raman/Compton inelastic scattering |
| Venus | Dielectric refraction | Snell's law; Fresnel equations; Brewster's θ_B | Reflection occurs simultaneously at interfaces | Birefringence; optical activity; nonlinear Kerr/Pockels effects |
| Saturn | Absorption & attenuation | Beer–Lambert `I(x) = I₀ e^{−αx}`; extinction `k` | Total extinction combines absorption and scattering | Geometric occlusion; diffraction edge effects; shadowing |
| Mercury | Photochemical transduction | Stark–Einstein law; exciton transfer | Requires prior absorption (Saturn) before transduction occurs | Photoluminescence; fluorescence; phosphorescence; photoelectric effect |

*Literature context & epistemic boundaries.* `[STRUCTURAL OBSERVATION — uncited
context]` Standard remote-sensing models decompose observed radiance into direct
solar irradiance, atmospheric path radiance, surface reflectance, and thermal
emission; this demonstrates that macroscopic optical modeling naturally groups
phenomena into operational regimes similar to the seven forms, but remote-sensing
literature does not assert this specific sevenfold partition as a closed or
exhaustive system. Textbook references (Hecht; Bohren & Huffman; Chandrasekhar) are
cited strictly as sources of physical terminology and equations, not as empirical
validations of the governor mappings. `[INTUITIVE GLOSS — historical/intellectual
context, uncited]` Goethe (*Farbenlehre*, 1810): early qualitative observation of
light through turbid media (*trübe Medien*). Robert Grosseteste (*De Luce*,
c. 1225): early light-first metaphysical cosmology (lux as primary corporeal form).
Johannes Kepler (*Harmonices Mundi*, 1619): historical precedent for harmonic and
celestial correspondence; his optical work is separate (1604) and did not map
planetary offices to these optical equations.

*Core epistemic conclusion (verbatim).* Design Correspondence, Not Derived Canon:
the seven forms represent a phenomenologically coherent macroscopic taxonomy that
served as declared inspiration for the mutation algebra (§2.7). The framework
claims design correspondence — that the mathematical postures of the operators are
conceptually consistent with these optical regimes — not that the mutation algebra
is derived from, isomorphic to, or an exhaustive partition of physical quantum
electrodynamics.

## 3. Open canon question

`[OPEN CANON QUESTION]` **Sun/Moon <-> pole assignment.** Two cited readings conflict:

- **Office assignment:** Lydian is the Sun office — `framework/AGENTS.md:103`
  (`Lydian [State Governor: Sun; Family: 7-35]`), `framework/TOPOLOGICAL_ANCHORING.md:359`.
- **Pitch-governance assignment:** the Sun degree is the sharp 4th / raised fourth —
  `framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:83-84` (Mixolydian/Mars
  raises its Sun-governed fourth degree) and `framework/NATURAL_ORGANIZATION_THESIS.md:593-594,600-601`
  (Sun degree sharp-4 in Lydian, Sun degree 4 in Ionian).

The office assignment and the pitch-governance assignment pull opposite ways. **Resolve
only from framework docs, never from this map.** Left explicitly unresolved; a future
session (lattice Phase B, or the governs semantic layer) resolves it from the record.

## 4. Consumption index

| Consumer | Uses | Rules |
|---|---|---|
| BL-020 | 2.1, 2.2 as candidate sonification mappings (rest-state/bucket vs positional/cursor) | Decision deferred to the sprint's design discussion; hypotheses only. Post-adjudication: registry polarity corrects 2.1/2.2; the landed overlay is retained as the labeled counterfactual-polarity experiment (`scrum/plan/fivefold-mesh-adjudication.md` A1) |
| BL-031 | 2.5 as required Phase-A findings-memo context; seam census treats the mirror-relation prediction under this lens | Prediction, not conclusion |
| BL-031 (interpretation) | 2.6, 2.7 as findings-interpretation vocabulary only | interpretation-only; never a probe input; hypotheses not citable as claims |
| BL-033 | 2.4, 2.5 — the D4 bracket prediction is the hypothesis the Phase C probes test | Never phrased as explaining the `not_derived` record; qualifier binding |
| topology candidate (future) | 2.7 polarity vocabulary for directional semantics | Proposed only; closure review adjudicates; not citable as claims |
| BL-057 D3 | §2.7 amendment as interpretation vocabulary | never probe input, never citable as claim |
| claim documents | 1.x only | Hypotheses are not citable as claims anywhere |
| governs semantic layer (future synthesis) | §5 measured findings (selection mechanism, invariants, named residual) | planning evidence; measured, not admitted; not citable as claims |
| claim record `SPEC-GOVERNS-DERIVABILITY-001` (admitted; ENTRY 16) | §5 measured findings (GSL-1/1R/2) as corroborating measurement context only — the claim's load-bearing evidence is the BL-063/BL-064/BL-066 artifacts | consumed as context; §5 remains planning evidence — measured, not admitted, not citable as claims; the admission changes no §5 tag |
| BL-067 synthesis (`plan/bl-067-governs-semantic-synthesis.md`) | §5 measured findings (channels, polarity, geography) as the synthesis base; §2.7 lens in three template-bound codas | planning evidence; lens interpretation-only per the membrane; never load-bearing; finding statuses untouched; not citable as claims |
| BL-069 registration (GSL-3) | §5.6 GSL-3 — the fa/ti asymmetry's mechanism (the synthesis §6 Question 1 resolution) | planning evidence; D7 hypothesis-tier; finding statuses untouched; not citable as claims |
| BL-071 registration (GSL-4) | §5.7 GSL-4 — the interval-6 characterization (five universes × three measures; the mixed role verdict; the dual seven-cycle closure) | planning evidence; D7 hypothesis-tier; finding statuses untouched; not citable as claims |
| BL-077 registration (GSL-5, GSL-6) | §5.8 GSL-5/GSL-6 — the coordinate action's family-level involution (the tier↔family correspondence's covariance) and office-level permutation (Mercury fixed; the 4+1 signature) | planning evidence; D7 hypothesis-tier; finding statuses untouched; not citable as claims |

## 5. Measured findings — the D4 boundary-geography selection layer [MEASURED — planning evidence]

*Class: measured findings (planning evidence). Distinct from §1 (admitted canon), §2
(design-intent / hypothesis tiers) and §3 (open canon question). Every item below is
computed by byte-stable generator-validated artifacts; none is citable as a claim, and
the admitted tags of §1/§2 are untouched.*

### 5.1 The selection mechanism (GSL-1, GSL-1R)

The D4 anchors' observed contact selection (14 of the 28-key granted domain) is
boundary-geography-selective. **GSL-1** (BL-060): the observed satellites are exactly
those whose non-Z D-tier containment sum is `<= 13` (clean 14/14, boundary gap 1).
**GSL-1R** (BL-061/062, the refinement): the canonical form is Z-interface polarization —
observed satellites are Z-majority in their D-tier containment interface
(`nonZSum < zSum`; observed −13..−3, unobserved +1..+11, gap 4), so GSL-1's threshold is
the w = 0 projection of the same structure; complementarily, observed satellites'
pentatonic composition carries Z-class subnodes (2–4 rooted entries) and achiral subnodes
(2–4), and unobserved carry none. The refinement scan's six clean shapes are projections
of this signal; the canonical sign rule is the sharpest.

### 5.2 Residual anatomy (GSL-2)

The 1765/1261 pair is explained, not primitive: the Z12-only interface extreme
(Z12=7, Z17=Z37=2; zSum 11 = observed minimum) with chiral-Z-only composition
(5-Z18/5-Z36; the unique observed pair with no achiral Z class), sitting inside the
canonical rule at margin 3. It defeats per-family and per-content-type thresholds by
construction — the mechanism's corner case, not an exception to it.

### 5.3 Structural invariants (measured)

- **Inversion-invariance:** all 14 inversion pairs share observed status; the selection
  selects whole pairs; orientation-polarized refinements are rejected at scan level.
- **Office-linking:** inversion pairs link offices summing to 6 (mod 7).
- **Tier↔family bijection:** D1=7-22, D2=7-15, D3=7-Z37, D4=7-Z17, D5=7-Z12, D6=7-8,
  D7=7-1 (49 anchors, 7 per tier; each tier family-pure). Also recorded at
  `docs/ARCHITECTURE_MAP.md` Layer 1.
- **Cornerstone confinement:** the five 5-35 cornerstones live only in D5/7-Z12 anchors.
- **Anchored enumeration:** mesh subnodes = the pc-0-anchored 5-subsets (verified
  462/462) — composition statistics are state-level, not class-determined.

### 5.4 Named residual

The Z12-corner case (1765/1261) — the mechanism's one extreme instance; the first test
case for any refined mechanism.

### 5.5 Receipts and fences

`orrery/src/generated/d4-14v14-hunt.v1.json` (fingerprint `8a1295ca…`);
`orrery/src/generated/d4-zresidual-hunt.v1.json` (fingerprint `e1b3f655…`);
`scrum/plan/bl-060-14v14-hunt-memo.md`; `scrum/plan/bl-061-062-zresidual-memo.md`;
`orrery/src/generated/bl068-d7-asymmetry.v1.json` (fingerprint `b0d65bd6…`);
`scrum/plan/bl-068-d7-asymmetry-memo.md`;
`orrery/src/generated/bl071-interval-6-structure.v1.json` (fingerprint `8b2a1f6c…`,
raw-byte `80a98540…`); `scrum/plan/bl-071-interval-6-memo.md`.
Planning evidence: no claim event, no record amendment, no admission; GOVERNS remains
granted input; the higher-theorem question remains open. Not citable as claims.

### 5.6 The fa/ti asymmetry's mechanism (GSL-3)

*D4's domain is class-mixed (7-27/7-31) → class-selective predicate, office-flat; D7's
domain is class-pure (7-2) → class-exhaustive predicate, office-pure — same invariants,
different predicates, the asymmetry's mechanism.*

**GSL-3** (BL-068; the entry registering the synthesis §6 Question 1 resolution). The
measurements beneath the sentence, all on the D7 side's constructed availability layer
(the Hamming-2 reach of the 7-2 class): the recorded layer collapses (14 recorded / 0
unrecorded, 2 per anchor); the availability domain restores a 36 = 14 + 22 structure
(per-anchor 4–6; every unrecorded instance modal-bounded at office delta ±2 mod 7,
11 × +2 / 11 × −2); the class predicate restates over the domain (36/36,
`RESTATEMENT_UNIFORM`); the office-linking predicate is the sole clean separator
(14/0/0/22, `CLEAN_SPLIT`); the Z-interface polarization is non-separating at D7 (4/14
contact states Z-majority — GSL-1R's mechanism is fa-specific); the inversion-invariance
and office-linking invariants hold at both poles (7/7 in-class pairs, all office sums
6 mod 7, status shared — §5.3's invariants are pole-universal). Verdict
`DIFFERENT_PREDICATES`; the ti-pole's contact relation is class-exhaustive and
office-pure; the D4 remainder is governed-but-unreached, the D7 remainder
reached-but-office-excluded. *Receipts:*
`orrery/src/generated/bl068-d7-asymmetry.v1.json` (`synthesis.gsl3`,
`synthesis.asymmetry`, `axes`, `invariants`; fingerprint `b0d65bd6…`); memo
`scrum/plan/bl-068-d7-asymmetry-memo.md:20-56` (§5.5's list carries the registration).
D7 hypothesis-tier throughout — no D7 claim, no amendment, no derivation admission. Not
citable as claims.

### 5.7 The interval-6 structure (GSL-4)

*The boundary layer's tritone geometry measured across five universes and three distinct
measures — the measures disagree, and the disagreement is the characterization.*

**GSL-4** (BL-071, registered 2026-10-11; the entry continuing the GSL series with a new
interval-geometric finding class). **Displacement-6** (single-pitch tritone substitutions)
is ti-local: 12 of the D7 contact domain's 36 instances (1/3 against the 630/6930
structural baseline; the fa-pole domain carries none, 0/28 — ti-specific, not
boundary-wide; Fisher TEST-2 p = 3.8e-4), the two recorded instances being exactly the
terminal far contacts 127:253 and 4033:2017, while the fully excluded class is displacement
4. **Rotation-6** is the boundary cycles' closure interval: both of the layer's
seven-cycles close at rotation 6 — the D7 modal orbit (4033→127) and the A0 P7 ring
(2773→1387), both at Hamming 10 — and all seven D-tier anchor families carry at least one
rotation-6 pair (12/1176 against the ledger's 126/106491; TEST-3 p = 4.7e-8). **IC6
content** shows no boundary over-representation (the boundary is IC6-poor; TEST-4). The
7-27/7-31 split is *not* tritone-mediated (0 swap / 0 rotation-6 / 0 complement over all
196 cross pairs). The lifted-space representation is exact:
`lifted(2773@(p+6)) = T_6(lifted(1387@p))` for every phase, root-coherent across all 126
ledger rotation-6 pairs. Role verdict: **mixed** (the closed vocabulary — separation /
transition / none per measure); no mechanism claim; open edges BL-072 (the composite's
mechanism), BL-073 (the dual closure), BL-074 (the measures' disagreement). *Receipts:*
`orrery/src/generated/bl071-interval-6-structure.v1.json` (`investigationFingerprint`
`8b2a1f6c…`; pre-registered baselines B1/B2 and Fisher tests TEST-1…TEST-4); memo
`scrum/plan/bl-071-interval-6-memo.md`. D7 hypothesis-tier throughout — no D7 claim, no
amendment, no derivation admission. Not citable as claims.

### 5.8 The coordinate action's structure (GSL-5, GSL-6)

*The coordinate algebra's action on the ten anchor families and on the offices — the
tier↔family correspondence carried whole, and the mediator's fixed point.*

**GSL-5** (BL-076, registered 2026-10-12; the entry continuing the GSL series at the
coordinate scale). The boundary layer's coordinate algebra — the Klein-4 unit subgroup
`{1,5,7,11}` of Aff(Z₁₂), canonically determined by the interval-transport requirement
(`11u ≡ 7 (mod 12)`; BL-075) — acts on the ten anchor families as the family-level
involution: **7-35↔7-1** (A0↔D7, the closure pair), **7-34↔7-8** (A1↔D6, the BL-068
contact-target pair), **7-Z37↔7-Z17** (D3↔D4, the interior swap), fixing **7-33, 7-22,
7-15, 7-Z12**; identical for T1/T2, trivial for the identity and the pc-reflection (the
Klein-4 acts through its two-element quotient); whole-block (zero fragments, zero
ledger-absent images, 40/40 blocks, expectation exact); the pairing pairs the one IV-shared
Z-partner pair (7-Z37↔7-Z17) within its interval class and pairs IV-unique families with
IV-unique families; the action crosses the fa/ti pole in both directions. **GSL-6** (the
coordinate action's office-level structure; the 4+1 signature measured). The same maps act
on the offices as faithful whole per-tier permutations (moved office entries T1 56 / T2 52
/ ρ 60 / ID 0); **Mercury — Quintessence, the transition law — is the office-level fixed
point in every map and every tier** (the sole fixed point under each non-identity map),
while the other six offices permute (the permutation crosses the elemental/luminary
brackets — e.g., T1: Jupiter→Moon, Sun→Mars; grounding correction, maintainer-prose class:
the disposition's reading "the four elemental governors permute among themselves" is
recorded as the measured six-office permutation around the fixed mediator); ρ is
tier-uniform (`Sun↔Saturn`, `Moon↔Venus`, `Mars↔Jupiter`). Composition consistent with the
Klein-4 multiplication (family 160/160 + office 1120/1120 checks, zero mismatches); branch
`COVARIANT_CONFIRMED`, finding `probe-verified`. *Receipts:*
`orrery/src/generated/bl076-bijection-probe.v1.json` (`investigationFingerprint`
`81e6cf72…`; chain BL-075 `88838e22…`; validator 81 mutation probes); memo
`scrum/plan/bl-076-bijection-probe-memo.md`. D7 hypothesis-tier throughout — no D7 claim,
no amendment, no derivation admission. Not citable as claims.
