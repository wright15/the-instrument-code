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
| BL-033 | 2.4, 2.5 — the D4 bracket prediction is the hypothesis the Phase C probes test | Never phrased as explaining the `not_derived` record; qualifier binding |
| claim documents | 1.x only | Hypotheses are not citable as claims anywhere |
