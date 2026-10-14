# Backlog — Validated Plan Space (v0.3)

**Status:** ACTIVE (graduated from v0.2 capture + v0.3 fixture correction in a single commit).
**Tier taxonomy:** `docs/TIERING.md` — landed in the same commit; the pointer resolves in the landed tree.

## Lifecycle

- Capture labels (`BL-xxx` below) are **not tickets**. Real backlog IDs are assigned at graduation to ACTIVE.
- Lifecycle: `CAPTURED → ACTIVE → DONE` (or `SPLIT`/`BURIED` with a one-line reason).
- This document is **mutable plan space**: reorderable, revisable by normal commit.
  It makes no claims, carries no evidence obligations, and creates no receipts.
- Trigger test per `docs/TIERING.md`: ledger/canonical sentence = ceremony; code/tests/docs = sprint.

## Adjacent backlog (referenced, not duplicated)

Active work tracked elsewhere: `CRT-310` (per-class pentatonic admission),
`EPIC-511`/`EPIC-512`/`EPIC-520` families (`ORR-511–514`, `ORR-521–524`, `GOV-512`,
`GOV-516` in Review). Items below link to these where they touch; they never shadow them.

## Closed arcs (do not reopen)

D5/GOV-517 historical record (ENTRY 8 derived), census incident + document-only admission
(ENTRY 11), convention admission (ENTRY 12), C_both dual-route semantics (0.1.1 `2*7`
explanation retracted). Dedupe-surfaced items referencing these → DONE with pointer.

## Release-state framing

The project's first green release: `seven-governors-integrated-1.9.0`, fixed at
2026-10-13 with the integrated receipt at 418/0 (no predeclared stops, no known
failures). The two freeze-era authority questions were resolved at the release
gate by BL-083: the frozen composite payload expectations re-canonicalized (spec
drift at `67dcd14`, `.pyc`-only, zero payload change; commit `1b19d2f`) and the
Neo4j baseline re-established at `1.9.0` as a release-state update (six
projected payload namespaces byte-identical to the 1.8.1 baseline; counts
3061/10506; snapshot `5d26a803…`; OD-083-1 through OD-083-3). Both predeclared
stale gates had been cleared by BL-051/BL-052. ENTRY 21 records the release
ceremony; the grounding receipt is `qa/specs/bl-083-416-2-grounding.json`, the
closure receipt is `qa/specs/bl-053-green-release.json`.

## Anchor conventions

- SPEC-001 §6 is a 4-item list (`docs/specs/fivefold_constructs_engine_spec.md:287-296`):
  §6(1) grant instrument, §6(2) Q table, §6(3) T3 strong form, §6(4) overlay correspondence.
- "§4.2" always means SPEC-001 §4.2 (`:250-268`), not Convention §4.
- Convention cut line is content-located (Convention §3.3 `:357-363`); never embed a commit hash in code.
- `PROPOSAL` = new session-analysis language with no repo source; verified as test target, never cited as fact.

---

## TIER 0 — PROCESS INFRASTRUCTURE (sprint; no ceremony)

### BL-001 — Graduate this backlog [DONE]

Created this file from validated v0.2 capture + v0.3 fixture correction (§Phase A(b)).
All items transferred with validated scoping. Normal commit, single unit with `docs/TIERING.md`.
Exit (met): backlog exists, lifecycle in header, `docs/TIERING.md` present at cited path —
header pointer resolves in the landed tree.

### BL-002 — TIERING.md [DONE]

Landed `docs/TIERING.md` in the same commit: trigger test; claim-event catalog (derivations;
canonical admissions incl. new ontological domains; release boundaries; amendments to admitted
records); default-to-fast rule; Q-table worked example (authoring = sprint per SPEC-001 §1.3
`:117-121`; closure assertion = claim event). Normal commit, no ceremony.

---

## TIER 1 — ENGINE PROGRAM (sprint)

### BL-010 — Q transition table authoring [DONE]

Author the concrete Z12-indexed 16-state table for Quintessence
(SPEC-001 §1.3 `:102-115`; §6 item 2 `:290`). First extraction-or-authoring: search GOV-517
artifacts (`scrum/GOV-517-d5-signature-derivation-definition.md`,
`scrum/GOV-517-implementation-spec-draft.md`, `qa/gov-517-*`); settled forensics expect
NOT FOUND (`qa/specs/fivefold-constructs-001-admission-attempt-1.json:17`,
`attempt-2.json:71`) — confirm, don't relitigate. Prototype transitions, test closure on the
16-state substrate, replay-verify. Pure sprint. Charter: SPEC-001 §1.3 GATED deferral.
Exit (sprint): table + closure tests + replay harness + decision point whether the closure
assertion graduates to a claim event. Downstream: resolves §6(2) either way; feeds BL-052 with
an extraction receipt or an authoring trail. Extraction = reproducibility; authoring = new
derivation with its own ceremony — the biggest timeline variable, resolve early.
Next up per sequencing.

**Landed:** extraction NOT FOUND + designation search + freeze decisions recorded in
[`plan/bl-010-q-table-freeze-memo.md`](plan/bl-010-q-table-freeze-memo.md). Authored object is
Q1 + action law `Q_z = Q1^z`; 12×16 table generated, not transcribed; still-set behavior
primary fixed, rotation variant recorded. Artifacts: `src/fivefold/quintessence.py`,
`tests/test_fivefold_q_table.py`, `tests/fixtures/fivefold_q_table.v1.json` (192 rows).
Suite green (13 passed) including the completion/closure pair. **INV-5 graduation decision:
deferred** — documented decision point, no claim event opened; the §6(4) composition
hypothesis carries forward to BL-011.

### BL-011 — Court engagement correspondence admission (claim event) [DONE]

Maintainer decision 2026-09-25: opened with redefined scope; admitted the same day under
GOV-522.

**Landed:** `SPEC-FIVEFOLD-COURT-CORRESPONDENCE-001` v0.1.1
(`docs/specs/fivefold-court-engagement-correspondence-v0.1.0.md`) admitted in one atomic
landing with receipt `qa/specs/bl-011-correspondence-admission.json`, ENTRY 13,
inventories, and the comprehension-map §1.5 / spec-v3 §1b status propagation. Claim:
engagement-Cn = position-Cn with the derived element↔degree mapping (Fire 4→5, Air 9→10,
Water 2→3, Earth 7→8); rejected polarity recorded with reason and retained only as the
Orrery counterfactual overlay. Machine check:
`tests/test_court_engagement_correspondence.py`, green before admission. **SPEC-001 §6(4)
(overlay↔GOV-517 input lanes) remains separately open and is not resolved by this claim.**
Adjudication: `plan/fivefold-mesh-adjudication.md` (A1/A2); corrected spec:
`plan/fivefold-mesh-spec-v3.md`. Full validate observed first stop
`STALE_TWIN_HUB_CONVERGENCE` (predeclared, recorded); no promotion or green-release claim.

---

## TIER 1 — HARMONIC DEBUGGER PROGRAM (sprint; highest motivation value)

Overlap note: extends DONE `ORR-404`/`ORR-405`/`ORR-406`, `audio.v1`, `legal-moves.v2`.
No existing sonified paths, cadences, or golden catalog
(0 hits `sonif/cadence/Andalusian/golden/debugger` in `orrery/`). Boundary verified read-only
(`orrery/README.md:3-4,30-33,176-184`; `scrum/EPIC-009-harmonic-orrery-mvp.md:92-101`):
audio mutates nothing, no new fences — recorded here, not in the ledger.

### BL-020 — Debugger foundation: sonified transition paths [DONE]

Audio rendering of state-machine transition paths (Orrery or companion surface).
Extension of `ORR-404:19` (static mode-change events only — no path sonification exists).
Deliverables: path replay through legality checks with sonification; minimal start/end UI.
Exit: any two connected states heard as a move.
Candidate sonification mappings (decision deferred to the sprint's design discussion):
rest-state/bucket reading (sounds still-set 1111 as pure stack; HYPOTHESIS) vs.
positional/cursor mapping — see `plan/harmonic-comprehension-map.md` §2.1-2.2.

**Landed:** both mappings layered, per maintainer ruling — cursor base (admitted) always on;
bucket overlay opt-in behind a labeled toggle (hypothesis, offered not asserted; provisional
orbit-prefix formalization). Three substrates share the replay contract: Orrery route, Q orbit
(cursor + overlay), Andalusian cadence. `scrum/plan/bl-020-debugger-foundation-memo.md`.
Suite 161 passed; tsc and all Orrery checks green; no catalog/manifest bytes changed.
Listening verdicts pending maintainer (recipe in memo). Pre-existing browser-harness
objective-id mismatch surfaced in memo, untouched.

**Timing fix (post-listening):** replay onset is per-mode — chordal for multi-note bucket
hops, tone+octave for cursor hops, arpeggio only for single selections; staggering retired
from the replay path. Hops are sequential (`max(step, release tail)`) so no scheduled onset
is cut; the voice-cap evicts only sounding voices. `ReplayVoice.emphasis` reserved for
BL-021 seam rendering (engine accepts, ignores today).

### BL-021 — Andalusian cadence (cross-set-class seam edge) [ACTIVE]

Golden path 7-35 Aeolian → 7-32 harmonic minor (Am–G–F–E): three intra-collection moves plus
one seam-crossing move, 1-semitone drift, 6-of-7 common-tone retention, leading-tone (ti pole)
drive. Theory already admitted in the Court layer (`CRT-302:48-51`, `CRT-304:68-71`) but never
sonified — this item gives admitted theory a voice, plus per-hop legality verification.
Register as named golden path. Exit: cadence plays, every hop legal, seam flagged in trace.
Theory hook (hypothesis only, no repo source): seam move as audible signature of a D7-class
govern pull across a seam — links to BL-033.

**Progress (from BL-020 sprint):** cadence replay planner landed (`planAndalusianCadenceReplay`):
four hops, per-hop membership check against the admitted collections, seam hop flagged in trace
and UI. Seam emphasis reserved (`ReplayVoice.emphasis`, planner sets `"seam"`, engine accepts
and ignores); golden-path registration added the bridge hold (0.6s) as the audible pivot.
Remaining for this item: maintainer listening verdicts (seam motion/arrival; bridge color).

**Prerequisite landed (containment graph):** spec v1.4
(`plan/bipartite-inclusion-spec-v1.4.md`), generator `scripts/generate_hypergraph_matrix.py`,
artifact `derived/hypergraph/bipartite-inclusion-v1.json` (`planning_evidence`, byte-stable),
12-test pin `tests/test_bipartite_inclusion.py`, memo `plan/bl-021-hypergraph-memo.md`. Seam
query is now a lookup: `intersection(parentsRooted(7-35:0), parentsRooted(7-32:9))` = 5-23
`{9,11,0,2,4}` and 5-27 `{0,2,4,5,9}`. Measured census: 70 diatonic-boundary bridge subnodes,
55 of them shared with the 7-32 family (20 admitted-vocabulary). Destination corrected to
`7-32:9` (A harmonic minor); the abandoned `7-32:4` reading shares exactly one 5-27 voicing.

**Golden-path registration landed (C-minor parallel seam):** route origin `7-35:3`
(C Aeolian, tonic pc 0) -> interior kernels C2/C3/C4 -> bridge `5-27:0`/`5-23:0`
(chosen `5-27:0` by maintainer audition, `5-23:0` recorded as the alternative; both
legal, selectable voicing options)
-> `7-32:0` (C harmonic minor). New replay legality class: both-collections
containment (first instance). Fixture `orrery/test/fixtures/golden-paths.v1.json`
(pioneering `golden-path.v1` schema) + memo `plan/bl-021-golden-path-memo.md`;
substrate `path-replay.ts`, engine per-hop hold `audio.ts`, UI trigger + bridge
selector; 4 planner tests + 1 engine test; orrery suite 166 green; catalog and
audio-manifest bytes untouched. Root-dependence finding: the tonic-fixed seam admits
both vocabulary bridges (`5-23:0`, `5-27:0`), the collection-root-fixed seam admits
none (single `5-29:11`), and the A-route pair admits two — anchor choice decides
whether the admitted vocabulary serves the crossing. Listening verdicts recorded:
the seam reads as motion (tonic fixed, dominant tension unspent), the bridge 5-27:0
was chosen by ear (5-23 alternative), and the interior reads as one cadence gesture
while verification stays hopwise.

### BL-022 — Parallel minor modulation (mode-axis edge) [DONE]

7-35 Ionian → 7-35 Aeolian on a shared tonic (C Ionian ↔ C Aeolian). Same set-class, different
root — closed mod-7 rotation coordinate (PROPOSAL language). Genuinely new: only existing
modulation objective is Lydian→Aeolian (`ORR-406:44-46`). Second golden path.
Exit: plays and verifies; trace shows rotation-axis move, zero set-class change.

**Landed:** bidirectional mode-axis golden path `c-parallel-minor-mode-axis` registered:
forward walk `L7/L3/L6` (Ionian→Mixolydian→Dorian→Aeolian), reverse `R6/R3/R7`, new legality
class `set-class-preserved` on every walk hop (`seamCrossing:false`, 7-35 pinned). Both layers
landed per maintainer ruling — collection walk + per-state tonic-triad overlay (E♭ arrival at
the Dorian step; default-on toggle), M-comparison recorded as findings: audit applications
`M:2741:1709` (`operator-applications.csv:291`) and `M:1717:1453` (`:165`) each compress two
adjacent walk steps into one successor op; both compressed routes rendered as
`demonstration:true`/`legality:null` hops with audit provenance (M is not catalog vocabulary).
First multi-path `golden-path.v1` instance (alternatives differ in hop topology; `bridge`
optional). 7 new tests; orrery suite 173 green; `orrery:check` all green; no catalog/manifest/
palette bytes changed. Memo `plan/bl-022-parallel-minor-memo.md` (both theses, compression
table, G1 preview, BL-031 control reconciliation). Objective layer untouched — a future
`ionian-to-aeolian` objective is a one-line scoring addition if the game surface wants it.

### BL-023 — Golden-path catalog export [DONE]

Machine-readable fixture catalog of verified paths (test data — sprint artifact, not evidence).
Binding constraint (`EPIC-511:24`, `ORR-511:23-24` forbid legal-move byte changes): layer
read-only views + local session overlays; reuse `legal-moves.v2` pin + `audio.v1` manifest guard;
fail closed (`orrery/README.md:61-67,155-157`). Consumers: transition-logic regression tests;
BL-031 seam-edge seed fixtures. Exit: format defined, both cadences exported, consumed by ≥1 suite.
Inherits the `golden-path.v1` schema pioneered by BL-021
(`orrery/test/fixtures/golden-paths.v1.json`); generalizes it to multi-path catalog export.
BL-022 landed the first multi-path instance (`paths[1]`; alternatives may differ in hop
topology, `bridge` now optional, `modeAxis`/`triadOverlay` fields) — BL-023 formalizes the
export format on top of it.

**Landed:** `schemas/harmonic-orrery-golden-path-catalog.schema.json` (required core, closed
hop/legality/substrate/alternative enums, verdict contract recorded-needs-date /
pending-needs-recipe, additive-only versioning) + `orrery/scripts/validate-golden-path-catalog.mjs`
(ajv strict + semantic closure: hop contiguity, endpoint match, catalog move chaining, bridge/
kernel subset checks, mode-axis arithmetic, derived-path promotion checks) wired into
`orrery:check`/`orrery:build`; 4-test conformance suite including a BL-028 finder-export
record validating through the same schema (forward-compatibility proof) and a full-validator
promotion smoke test (validator PASS, reverted). Fixture: catalog thesis/segmentation/
promotion/versioning block; BL-021 verdicts recorded in-data, BL-022 verdicts pending with
recipe pointers; `bridge.legality` renamed `legalityNote` (prose vs enum finding); endpoint
`mode` optional (derived/pentatonic endpoints). Promotion ceremony documented (audition +
verdicts required; machine derivation alone never promotes). Suite 189 green; memo
`plan/bl-023-golden-path-catalog-memo.md`; no catalog/audio/palette bytes changed; no graph
embedding; G1 untouched.

### BL-024 — Pentatonic intra-family edge definition + unified route graph [CAPTURED]

The 330's internal connectivity is unformalized; the global edge rule is a design decision
(semitone adjacency? complement? voice-leading distance?) to be driven by the first route or
procedure that needs intra-family hops. Candidates and the decision record land here;
visualization parity and procedural pathfinding consume the result. Not blocking BL-023.
Structural gap G1 and layer-3 fragments: `docs/ARCHITECTURE_MAP.md` §1/§4.

### BL-026 — ARCHITECTURE_MAP semantic layer [CAPTURED]

One meaning-paragraph per algebra catalog row (11 rows + precursor),
sourced from existing repo documents (framework prose, package docs,
court lexicon, comprehension map, ledger entries). Rows with no
recorded meaning anywhere → finding rows, not invented text.
Fast lane, normal commit. Extends, does not replace, the map's
structural/receipt discipline.
Landed same commit: `docs/ARCHITECTURE_MAP.md` §2.5 (10 sourced paragraphs, 2 findings).

### BL-028 — General path finder: derive-and-play over the composed graph [DONE]

BFS/shortest-path over the union graph (row-2 legal moves intra-collection +
row-given containment cross-family). Inputs: any origin/destination node IDs
across both universes (462 heptatonic + 330 pentatonic). Output: hops in the
replay contract, legality typed per hop (`catalog-membership`,
`both-collections-containment`, `containment-membership`), bridge hops flagged
where crossings use census-bridge nodes. Return up to 3 minimal-hop paths +
admitted-bridge filter (5-23 / 5-27 vocabulary) + truncation flag; M
applications annotate derived routes where a hop-pair compresses (audit-real,
not traversable). Endpoints: 21 A-anchors first-class (full operator coverage);
all 792 nodes selectable via containment; D-anchor labeling states
reachable-to/not-departable. Validation: finder must reproduce consistency with
the two registered golden paths (match or recorded divergence). Consumes
BL-021/BL-022 ground truth; feeds BL-023 export shape and BL-031 path
enumeration. No intra-330 edges (G1 open).

**Landed:** generated composed graph (`scripts/build-derived-path-graph.mjs` → 149 KB
`orrery/src/generated/derived-path-graph.v1.json`; 462+330 nodes, 60 operator + 6,930
containment edges; canonical fingerprint) with an independent validator wired into
`orrery:check`; pure BFS finder (`orrery/src/path-find.ts`; ≤3 minimal paths, admitted-bridge
filter, truncation flag, deterministic); `planDerivedPathReplay` + `derivedPathRecord` export
seam; 792-node from/to selectors + endpoint-coverage labeling + result options in the Orrery
UI. Validation-as-audit: seam route `7-35:3 → 7-32:0` returns exactly 5 minimal crossings
(registered `5-27:0` among them); mode axis `7-35:0 → 7-35:3` returns exactly 7 minimal paths
(the exact `L7/L3/L6` chain among them, both M compressions annotated); full graph is one
792-node component; the seven 7-35 modes are mutually operator-reachable and all 21 anchors
operator-reachable. 12 new tests; suite 185 green; `orrery:check` + `orrery:build` green; no
catalog/manifest/palette bytes changed; no intra-330 edges. Memo
`plan/bl-028-path-finder-memo.md`. Feeds BL-023 export and BL-031 path enumeration; D-tier
asymmetry queued as BL-029.

### BL-029 — D-tier operator coverage investigation [DONE]

Dependency note (binding): self-contained against GOV-227 sidecars + operator canon;
no multi-phase topology dependency. Phase-dependence in findings is an output
(topology-candidate motivation), not an input.

D1–D7 anchors (49) are admitted mathematics (GOV-227/`CH_D17_q_v2`) with zero
legal-move catalog coverage (verified: catalog scope = 21 A-anchors exactly;
D-anchor overlap ∅) and no office-network seating. Investigate whether the
D-tier compression theorem implies an operator set (row-1 analogue over
D-anchors). If yes, a D-tier move-catalog projection is a candidate work item
(row 2 extension or new row); if no, the asymmetry is structural and gets
recorded in the architecture map. Feeds BL-028's endpoint scope (currently
A-first by catalog coverage).

**Landed:** read-only probe (`scripts/build-d-tier-operator-probe.mjs` →
`orrery/src/generated/d-tier-operator-probe.v1.json`; independent validator +
vitest pins wired into `orrery:check`/`orrery:build`). Corrected framing: row 1
is domain-local, not tier-gated; the gap is row-2 projection scope. Findings:
zero admitted fixed-degree anchor-to-anchor applications in D (full 3,402-row
universe, not a scope filter); A-control reproduces 60 moves / 12 operators /
21×21 coverage exactly; discriminant assertions PASS; D-anchors are M-closed
(seven tier cycles) but M is row-2-excluded for every tier; 228 fixed-degree
touches each way all terminate at satellites; no phase entanglement.
Classification: outcome (3) refined — structural asymmetry with no available
row-2 extension; map updated (§1 Layer 1 anchor-coverage note, §4 bounded
item); finder label confirmed with a sharper cause (recommendation recorded,
not implemented). Memo `plan/bl-029-d-tier-operator-probe-memo.md`; no
canonical/catalog/audio bytes changed; G1 untouched.

### BL-030 — D-tier M-cycle demonstration routes [DONE]

Seven boundary-layer exhibit routes, one per D1–D7 M-cycle (BL-029's `modalClosure.dToD`),
authored as demonstration-typed catalog entries grouped by the `d-cycle:` pathId prefix:
`d-cycle:{tier}`, substrate `boundary-demonstration`, audit-cited hops, discriminant-preservation
exhibits, no listening verdict. Full entry spec + the four additive schema decisions:
`plan/bl-030-d-cycle-demonstration-routes-spec.md`. Promotion is conformance-based (structural
exhibit; no audition — nothing to hear until the C-substrate question is answered). Feeds
BL-031's boundary-stratified sampling as the boundary layer's canonical traversal paths.

**Deferred claim event (recorded, not started):** M-walkability promotion (row-2 extension,
adding M to the Move-Desk set). Requires a motivation-driven claim event; candidate trigger:
BL-032 admission if phase work makes boundary traversal central. Named here so the exhibit
routes are not read as walkability.

**Landed:** seven `d-cycle:D1`–`d-cycle:D7` exhibit entries in
`orrery/test/fixtures/golden-paths.v1.json` (eight hops per closed cycle, seven audit-cited M
edges, one exhibit verdict per entry citing the discriminant check); schema v1.1 additive defs
(cycle demonstration move/variant/alternative, exhibit verdict, `boundary-demonstration`
substrate) in `schemas/harmonic-orrery-golden-path-catalog.schema.json`; validator
boundary-demonstration branch (BL-029 probe-cycle match, audit-line resolution, cycle closure,
alternative/hop agreement, citation checks; fail-closed verified by mutation test); founders
byte-identical (payload hash pinned in the test); spec §9 build record. `golden-path-catalog:check`
PASS at pathCount 9; suite 202 green; `orrery:check`/`orrery:build` green; no legal-move/audio
bytes changed; G1 untouched.

---

## TIER 1 → CEREMONY — THREE-PHASE LATTICE PROGRAM

Charter: SPEC-001 fence #5 (`:39`) defers multi-phase/toroidal work to a separate future
candidate. This program IS that candidate.

### BL-031 — Phase A: build (sprint) [ACTIVE]

Phase coordinate (mod 12) as data, never hardcode B/C/C#. All numerics are PROPOSAL
(0 hits `5544/phase-extended/seam graph/phase-class` in `*.md`; 462 verified only as the
GOV-511 census count):

- (a) Phase-extended state representation (lift target 5544 = 462×12 — proposer arithmetic).
  Freeness of the phase action = claim to re-verify as a test, never cited as fact.
- (b) Seam graph with phase-mediated neighbor relations. Canonical seam relation:
  Lydian(collection p) ↔ Locrian(collection p+1) — the two tonics are exactly the pitch pair
  exchanged between adjacent collections (tonic-for-tonic handoff). Fixtures:
  - Sharp-side flank of the C cut: C Lydian ↔ C♯ Locrian
    (tonics C→C♯; swapped pitches = the tonics; F♯ retained; 6/7 common tones).
  - Flat-side flank of the C cut: B Lydian ↔ C Locrian
    (tonics B→C; swapped pitches = the tonics; F retained; 6/7 common tones).
  - Mode-axis control (NOT a seam edge — same collection, same phase): C Ionian ↔ C Aeolian.
  - Cross-set-class contrast (debugger linkage, 7-35→7-32): the Andalusian edge.
  All pairings are intra-set-class (7-35); "cross-set-class" applies only to the
  Andalusian-type edge. The mirror relation Lydian(p) ↔ Locrian(p−1) (tritone-degree trade,
  tonics as common tones) is a predicted secondary adjacency — the seam census (d) enumerates
  it mechanically; if it does not appear, that is a finding about the equivariance symmetry,
  which is exactly what Phase A probes are for. (v0.3 correction; supersedes the v0.2 fixture.)
- (c) Mutation equivariance probe (phase-shifted inputs → phase-shifted outputs;
  rooting-dependent mutations are the failure to look for).
- (d) Seam census (phase distance across every seam; radius-1 patches vs. full torus).
- (e) B/C/C# three-phase patch as the minimal instance.

Exit: probes run clean on canonical data; findings memo (sprint artifact) states whether the
Phase B claim is supportable.

Required Phase-A findings-memo context: the fa-distance argument (poles as boundary entities
of the motion; eleven-steps-for-one) — see `plan/harmonic-comprehension-map.md` §2.5; the seam
census (d) treats the mirror-relation prediction under that lens (prediction, not conclusion).

**Boundary-stratification amendment (BL-029/BL-030).** The seam census (d) and the mutation
equivariance probe (c) stratify their sampling by boundary-proximity: interior paths vs. paths
touching boundary-adjacent structures (the 70-bridge switchboard; the D-tier's M-closed,
fixed-degree-isolated anchors). The `d-cycle:{tier}` exhibit routes (BL-030) are the boundary
layer's canonical sampling paths. Naming note: the session's "transport probe" is this Phase A
census/equivariance sampling in repo terms — one item, not two. This makes Phase A the
two-motivation probe: if interior transport holds but boundary-adjacent paths show
path-dependence, that is a second measured motivation for the phase-extended topology alongside
the BL-029 boundary wall.

**Phase-1 spin-out and gating (BL-034/BL-035).** The semantic census originally sketched as
Phase 1 is now its own two-mechanism item, BL-035 (`plan/bl-035-semantic-derivation-census-memo.md`):
pentatonic four-way claimant classification (single 50 / agreeing 0 / conflicting 25 / zero 255;
all 70 census bridges claimed; the five 5-35 cornerstones are the only 3-claimant, windowed
nodes) plus the 455-node heptatonic office-following baseline. The 255-node zero-claimant
coverage map is the gap multi-hop transport must address, and the BL-034 surface fix
(`plan/bl-034-orrery-provenance-fix-memo.md`) makes the recording layer provenance-trustworthy.
Multi-hop transport is gated on BL-035's gap map and the BL-034 rule; direction semantics stay
unassigned (no admitted source) and any direction key is a follow-on input, not a census column.

**Landed (semantic multi-hop transport probe, Phase 2).** The Phase-2 probe under the semantic
transport reading of BL-031: `scripts/build-semantic-transport-probe.mjs` →
`orrery/src/generated/semantic-transport-probe.v1.json` (`planning_evidence`; 1,750 queries,
330 targets; fingerprint `9138a7ab…`) + independent validator + 8 vitest pins wired into
`orrery:check`/`orrery:build`. Findings: every one of the 330 pentatonic targets receives ≥2
seed origins within 3 hops (255 gap + 50 single + 25 conflict nodes all multi-origin); transport
origins (d2–3) are disjoint from census claimants (d1), so multi-hop can only deepen one-hop
collisions, never reproduce or resolve them; `5-35:10` receives all seven offices; 4,546 pool
comparisons (3,926 disjoint / 620 overlapping / 0 identical / 0 subset) track exactly the
admitted overlap inventory (`Jupiter–Sun` plains, `Mars–Saturn` cliffs, `Mercury–Moon`
estuaries); 1,510 queries with divergent alternative routes; BL-028 ground truth reproduced
(5 seam crossings / 2 admitted-bridge / 7 mode-axis paths with L-chain). Boundary layer
(`d-cycle:D1–D7`) recorded as non-traversable geometry (M not walkable). No topology claims,
G1 untouched, direction unassigned, no catalog promotion. Memo
`plan/bl-031-semantic-transport-probe-memo.md`. This landing is the semantic transport probe
only; the Phase-A seam/equivariance program above remains separately gated and untouched.

### BL-032 — Phase B: claim event (ceremony — ONE session) [DONE]

**Landed 2026-10-08:** phase-extended topology admitted as a candidate record
`SPEC-PHASE-EXTENDED-TOPOLOGY-001` v0.1.1 (`docs/specs/phase-extended-topology-candidate-v0.1.0.md`),
with receipt `qa/specs/bl-032-phase-topology-admission.json` and ENTRY 14 under GOV-523 (one
atomic landing). The admitted claim is the bounded candidate-record form — covering-pair lift,
equivariant operator semantics, seam census, radius-1, mirror confirmed — available for
dependent work (Phase C governs probes); it explicitly does NOT claim that boundary governs
now derive. Wall stands per-phase (P5); G1 untouched; direction unassigned; no governs
verdicts; SPEC-001 unamended (fence #5 charter). Phase C gate satisfied.

If and only if Phase A's memo supports it: admit the phase-extended topology as a candidate
record. Standard ceremony: candidate doc, compliance receipt per convention, ledger entry,
born-compliant R1–R6 evidence at birth. Claim: phase-extended topology resolves seam
connections; govern re-evaluation warranted. Does NOT amend SPEC-001 — cites fence #5 as charter.
Gate: maintainer decision on Phase A's memo. Exit: admitted topology record, or honest negative
memo (legitimate).

### BL-033 — Phase C: dependent govern probes (sprint until claim) [FINDINGS RECORDED — obstruction-visible row-class]

**Probed 2026-10-09:** the retry executed as sandbox planning evidence. Generator + artifact
`orrery/src/generated/phase-c-probe.v1.json` (fingerprint `5085e274…`) + independent validator
+ 10 vitest pins wired into `orrery:check`/`orrery:build`; memo
`scrum/plan/bl-033-phaseC-results-memo.md`; keying spec `scrum/plan/bl-033-phaseC-lifted-keying-spec.md`.
Results: E1 boundary representation PRESENT (all 7 D4 anchors, patch phases, seam incidence);
calibration EXACT (OBS-023 reproduced at every patch phase); the seam keying completes the
kernel-twin relation to all seven offices but collapses to the full granted domain
(`G_A = U`, contract `restatement_signature`, pre-registered expectation not held — new
failure mode); the strict-degree control reproduces the frozen `not_derived` exactly; T-C at
the seam overshoots (7 generated vs 2 observed; strict control exact); D7 mirror asymmetric
(rotation orbit does not close; office 3 unqualified; `not_derived@seam-analogue`; contract
seam clause inapplicable); wall NO_CHANGE at all 12 phases. No D4 verdict, no amendment, no
D7 verdict; rulings OD-C1…OD-C4 in the memo (both readings co-canonical at their own scope;
D7 analogue adequate as labeled; fa/ti closure asymmetry recorded as a named structural
finding; no amendment from Phase C). Follow-on captured as BL-055. Suite 243 green.

Re-run the D4 govern derivation in the phase-extended sandbox (dual-phase assignment at seams).
D4 `not_derived` verified (`DECISION_LEDGER.md:2195-2252`): certification → amend D4 record
(its own claim event); continued failure falsifies the seam explanation, points at the D4
definition. Then D7 predicted seam-pole failure (hypothesis — no D4/D7 derivation record beyond
transition labels in `neo4j/csv/governs.csv`). Guards (binding): sandbox-only; no
Neo4j/canonical/Court/schema/shared-sidecar writes (SPEC-001 §4.3); no D4 verdict claim from
sandbox; memo labeled sprint artifact. Gate: BL-032 admission, OR explicit maintainer decision
for pre-admission sandbox probing (allowed, costs nothing). Exit: results memo; any amendment
graduates to its own ceremony.

Test hypothesis (prediction, not conclusion): D4 is not single-phase-constructible — the
bracket reading carries the ledger's difficulty-of-derivation-not-authorship qualifier; see
`plan/harmonic-comprehension-map.md` §2.4-2.5.

---

## TIER 1 — BOUNDED INVESTIGATIONS (sprint; filler)

### BL-034 — Orrery semantic provenance fix [DONE]

A1/A2 surfaces stated the office A0 landform pool under the static A0 label; canon carries no
native pool for non-seed tiers (the office-following projection is admitted, the provenance
display was not). Fix: tier-branched provenance labels (A0 native with seed; A1/A2 explicitly
derived with office + seed citation), inheritance-pattern audit across the surface
(find-and-report; A1/A2 fixed only), rule recorded: no tier's semantic payload displays as
another tier's native content; inherited display carries office + seed. Fast lane; prerequisite
for BL-031's recording layer.

**Landed:** `orrery/src/landform-provenance.ts` (pure resolver + labels) with 4 vitest pins;
`main.ts` tier-branched render + inspector reset; `index.html`/`style.css` label/note surface.
Audit: scene prompt and audio palette already explicitly derived (not fixed); no kernel-window
surface exists. Memo `plan/bl-034-orrery-provenance-fix-memo.md`; no payload/canonical/audio
bytes changed.

### BL-035 — Semantic-derivation census (two-mechanism) [DONE]

Pentatonic (330): four-way landform-claimant census via the seven A0 seeds among each node's 21
containment parents (single / multi-agreeing / multi-conflicting / zero), stratified by
diatonic-parent count, census-bridge flag, and kernel-window presence. Heptatonic (455): 
office-following baseline table from the canonical ledger; mechanism verified from canon
(`projection:landforms:v0.1.1`, `compiler.mjs`) before use. Comparison: teleological vs.
ontological derivation behavior. Direction fields recorded; no Earth-ward/Fire-ward value
assigned (no admitted source). Feeds BL-031 multi-hop design (zero-claimant gap map) and gives
the teleology/ontology design its first measured comparison.

**Landed:** `scripts/build-semantic-derivation-census.mjs` →
`orrery/src/generated/semantic-derivation-census.v1.json`; independent validator + 7 vitest pins
wired into `orrery:check`/`orrery:build`. Results: single 50 / agreeing 0 / conflicting 25 /
zero 255; 105 claims over 75 nodes; all 70 census bridges claimed (50 single + 20 conflicting);
the five 5-35 cornerstones are the only 3-claimant, windowed nodes; 255-node derivation gap;
heptatonic baseline 301 office-bearing + 154 boundary, collision-free at office level;
direction unassigned (finding). Memo `plan/bl-035-semantic-derivation-census-memo.md`; no
topology claims, no G1 movement, no governs implications, no M-walkability promotion.

### BL-040 — T3 strong-form artifact hunt [ACTIVE]

Search GOV-517 artifacts for anything establishing the 7×7 matrix / zero-leakage form
(SPEC-001 §6 item 3, `:212,291`). Cite settled forensics first
(`attempt-1.json:15`, `attempt-2.json:78`, ledger `:2414`): binary outcome FOUND (cite it,
INV-3b unblocks at BL-052) or NOT FOUND (§6 item 3 stands open — no action).

### BL-041 — GOV-517 grant instrument search [ACTIVE]

Exhaustive ledger/scrum search for a numbered GOV-517 authorization instrument
(SPEC-001 §6 item 1, `:9,289`). Cite settled forensics (`attempt-1.json:14`,
`attempt-2.json:64`, `attempt-3.json:163`; ledger `:1349` pattern-only, `:2195` Grant 2 =
D4-only). Binary outcome: fills the Grant Limitation row or confirms the composite-authority
reading.

### BL-042 — 70-anchor phase-class probe [ACTIVE]

Read-only analysis of Governor Seat Invariant coverage (70-anchor verified:
`docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md:72-92`, `DECISION_LEDGER.md:347`) across
proposer-defined phase classes (`phase-class`, `2×5×7`: 0 repo hits — hypothesis, not source).
Cheap; feeds Phase A iff informative.

### BL-044 — Court voicing surface audit vs. canon [DONE]

Pre-D5-era C0–C4 voicing feature (palette thinning, pole labels) predates
the engagement-semantics freeze (BL-010) and the bucket-layer hypothesis
(comprehension map). Audit: (1) reconcile C0–C4 labels to engagement
semantics per canon; (2) verify position→mask-pitch mappings against
admitted Court records (CRT-302/304, schema); (3) decide thinning's fate:
retire, or relabel as explicit "mask filter demo"; (4) document which
pitch-color associations are hypothesis-layer vs. canon-layer, with the
toggle/label convention consistent with the bucket overlay elsewhere.
Sprint. Outcome: relabeled/verified surface + audit note in memo.

**Landed:** audit note `scrum/plan/bl-044-court-voicing-audit.md`. Certify table: all five
positions match `court-rooted-positions.json` field-for-field (mask, pitchClasses, pole
vector, internalPoles, kappa); registry clean, no drift. Labels relabeled to engagement
semantics; three-layer disclosure sentence added to the voicing readout. Thinning retired
from the voicing path — Court pentatonic now voices the position's own five registered mask
pitches; `filterPitchClasses` retained for demo use, the "mask filter demo" explicitly not
built. Tests pin the layer boundary (position-identity voicing + sharpened-member
assertions).

---

## TIER 2 — GOVERNANCE REMAINDER (parked until pre-release)

Disambiguation (binding): the executed D4-freeze cascade (`plan/d4-freeze-handoff.md:62-88`)
is NOT this refresh. These live tests run inside the later SPEC-001 §4.2 refresh (`:250-268`)
under Convention §4 (`:379-382`).

### BL-050 — Advisory validator (parked sprint work, ceremony-adjacent activation) [ACTIVE]

Build `scripts/validate-evidence-bindings.mjs` + `validate:evidence` wiring, advisory-first,
per Convention §3.2 (`:342-356`). Code+tests = sprint labor; activation parked. Includes the
session-classifier against the content-located cut line (Convention §3.3 `:357-363`; identify by
ID/version/disposition, never embed a hash).

### BL-051 — Twin-hub cascade refresh (parked) [DONE]

Live test 1 (Convention §4 item 1): D4-bound evidence preserved first per ENTRY 11 mandate,
then first R2/R3 span bindings born (`qa/conventions/evidence-binding-001-admission.json:100`
confirms none born yet); payload/provenance separation exercised. Required before green release.

**Landed 2026-10-13 (BL-082 execution; D4-preservation first, then the ledger-dependent stale cascade):** P0 preservation under `qa/halt-evidence/twin-hub-convergence-pre-refresh/` — byte-identical copies of the pre-refresh candidate (fingerprint `3885bf83…`, projection `cf796971…`, sha256 `972394e5…`, 12,396 B) and its validation report (fingerprint `35f88720…`, 30/0 PASS), with the preservation receipt pinning both raw-byte digests, pre-commit blob OIDs, the payload-projection recipe, and the ENTRY 10 region under both labeled recipes (line-join `201efe81…`; keepends `50b8b73f…`; ledger at preservation `fb2b9b9e…`/214,223 B). The ENTRY 11 precondition is recorded as met **before** the first shared-artifact refresh; no historical byte was restored or synthesized. The four-artifact cascade refreshed against the amended ledger with payload projections byte-identical (provenance-only; OD-2 geometry-drift halt pre-registered, not triggered): twin-hub convergence (`confirmed`, 30/30; candidate `31c1bf00…`, report `c8f4cf5f…`), fifth-space census (24/24; `2bfad475…`/`8bdcbd37…`), shadow-ladder (37/37; `3aea3277…`/`1605ed23…`), and the pentatonic binding audit closure (11/11; report `ed2c98d1…`, decision-ledger binding re-issued). OD-4(a) enforcement vehicle: the advisory validator's bounded registry gains explicit `CANONICAL_PLANNING_EVIDENCE` + `PROMOTION_EVIDENCE` lists; the twin-hub generator emits the convention's R5 fields (generator/generatorDigest/invocation/generatedAt) at emit time (twin-hub R5 PASS; the promotion evidence follows in BL-052); the two schemas gain only the four declared R5 property definitions; the frozen-chain resolution update (`orrery/scripts/validate-bl080-governs-derivation-execution.mjs` resolves the frozen `twinHubReceiptSha256` binding against the preserved copy per the preservation receipt; the sealed receipt and the frozen generation are byte-untouched; `orrery:bl080-governs-derivation-execution:check` green). Verification: focused suites 22 passed; `validate:ledger-pins` PASS (0 violations); `validate:evidence` advisory run recorded; full `npm run validate` passes the twin-hub gate and stops at `validate:release`'s recorded 416/2 (pre-existing authority questions, unchanged). Receipt `qa/specs/bl-051-twin-hub-cascade-refresh.json`; memo `plan/bl-051-twin-hub-cascade-refresh-memo.md`; ENTRY 19. Fences: no claim event; no record amendment (ENTRY 10/15/16/17/18 byte-untouched); no governs admission; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no G1 movement.

### BL-052 — Promotion refresh (parked) [DONE]

Live test 2 (Convention §4 item 2; SPEC-001 §4.2): GOV-517 re-registration under R1/R4/R5;
INV-1–4 re-assertion on fresh execution (INV-3b/5 only if gates resolved); clears
`STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE`. Consumes BL-010 outcome. Required before green release.

**Landed 2026-10-13 (BL-082 execution; the second landing):** GOV-517 re-registered under **GOV-526** (the next free GOV-52X ticket) with the convention's R1/R4/R5 model — `qa/gov-517-input-registration.mjs` records per-binding `recipe`/`digest`/`byteLength` (R1), declares the named `raw-bytes-sha256` recipe (R4) and carries top-level generator provenance (R5); the fresh registration `qa/gov-517-input-boundary-registration.json` (`GOV-526-GOV-517-re-registration`, green) binds the currently committed bytes — the ENTRY 11 census-binding incident resolved by binding the committed refreshed census digest `effa4389…` in place of the historical unmatched pin `ad857ab9…`, disclosed in the registration's `re_registration` block and never restored or synthesized. Full authorized re-execution bounded to the G1–G5 stages: preflight green (121 tests); the single licensed derivation run `derived` with the generation block identical, the canonical reference digest `02fd68db…` reproduced exactly, and the seal delta `7bb41ba1…` → `170fd50b…` explained by the corrected census binding; INV-1/INV-2/INV-4 re-asserted, INV-3b/INV-5 gated. Promotion evidence refreshed (`verdict PASS`; 10 + 11 groups; R5 fields; builder `--check` reproduces — `STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE` cleared; registry member R5/R6 clean). The ledger-bound cascade re-refreshed against ENTRY 20 (append-first order): twin-hub `6e020a5d…`/report `09dcdba7…`, fifth-space census `6918526a…`/`eecc3e6f…`, shadow-ladder `9b645463…`/`93b605e0…`, pentatonic closure report `a0ed21f1…`; payload projections unchanged. Verification: 35 focused tests; `validate:ledger-pins` PASS; `validate:evidence` PASS (registry 35/35); `validate:fivefold-engine-promotion-evidence` PASS; `orrery:check` exit 0; full `npm run validate` reaches `validate:release` with the integrated receipt 416/2 — the two recorded pre-existing authority questions only, no new unnamed regression. Receipt `qa/specs/bl-052-promotion-refresh.json`; memo `plan/bl-052-promotion-refresh-memo.md`; ENTRY 20. Fences: no claim event; no record amendment (ENTRY 10/15/16/17/18/19 byte-untouched); no governs admission; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no G1 movement; G1–G5 scope only, no expansion.

### BL-053 — Green release [DONE]

Unblocked 2026-10-13 (BL-051 + BL-052 landed; both predeclared stale gates
cleared); landed 2026-10-13 as the release ceremony (ENTRY 21), with the two
freeze-era authority questions resolved by BL-083 under the maintainer's
disposition (OD-083-1 through OD-083-3).

**Landed 2026-10-13 (BL-083 execution; the green release):** Grounding first: the 416/2 stop was exactly two failing checks, both grounded mechanically (`qa/specs/bl-083-416-2-grounding.json`). Q1 `frozen composite package payload identities` — spec drift at `67dcd14` (the exclusion-rule change added `__pycache__`/`.pytest_cache` to the frozen-payload walk without re-canonicalizing the two expectations; the delta is exclusively `.pyc` bytecode, inherently unreproducible; zero tracked-file change since `4ea389a`); resolved as housekeeping re-canonicalization at `1b19d2f` (`3bf5f181…`/`a2ca5141…` → `1f5b656e…`/`3d4f3b65…`, walker-verified tracked-only, manifest-convention aligned). Q2 `retained 1.8.1 full-database baseline` — the retained PASS receipt had been overwritten by a dev-cycle run (`67dcd14`), and the retained baseline is release-stamped by design, so no development cycle can verify against it; resolved as the release-state re-baseline under OD-083-1 (GOV-501 precedent): version flip to `1.9.0` (`validated_admitted`, release date 2026-10-13), fresh native reproducibility capture, baseline re-stamp, fresh receipts — native `6/0` (`qa/neo4j-full-database-validation.json`; snapshot `5d26a803…`) and disposable-local deployment `3/0` (`qa/neo4j-deployment-roundtrip-validation.json`; target class `disposable_local`; credentials excluded; both bind the same 148-path evidence list). Pre-flip verification: 6/7 projected payload namespaces byte-identical to the 1.8.1 baseline; only `provenance` changes (release identity); counts 3061/10506. OD-083-2: the 1.8.1 receipt superseded but cited (`fd089ea9…` lineage; git-discoverable). Cascade refreshed against ENTRY 21 (append-first): twin-hub `5d0c5eef…`/report `96b18d4b…` 30/30, census `3234257c…`/`e38330ac…` 24/24, shadow-ladder `9e92362d…`/`8f1e5558…` 37/37, promotion evidence `5ae56d69…` PASS, pentatonic closure report `74e3f555…` 11/11 (ledger + source-authority bindings re-issued), downstream orrery projections regenerated (field-derivation `dabe0bea…`, taxonomy, D-tier). Prose/state: release notes 1.9.0, SOURCE_AUTHORITY baseline row, NEXT_STEPS (ORR-524 decisions marked resolved), VALIDATION_CENSUS transition row, ARCHITECTURE_MAP maintenance addendum (§7), comprehension-map §4 row, this section + v1.60; the 20 pre-existing `validate:prose-consistency` violations resolved (19 scrum fingerprint literals re-bound by context — line reflows and section-heading SHA-256 markers, no semantic change; 1 docs test-count claim historical-qualified) — validator PASS 0 violations. Verification (pre-manifest): 35 focused tests; `npm run orrery:check` exit 0. Receipt `qa/specs/bl-053-green-release.json`; memo `plan/bl-053-green-release-memo.md`; ENTRY 21. Fences: no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20 byte-untouched; ENTRY 10 fence re-verified `201efe81…`/`50b8b73f…`); no governs admission; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no G1 movement; no semantic registration beyond the release's own housekeeping; the higher-theorem question ships formally stated, not answered; D4 `derivable-from-derived-inputs` and D7 hypothesis-tier unchanged.

### BL-054 — Phenomena closure review (parked until EPIC-004) [ACTIVE]

Adjudicate the proposed phenomena revision at registry closure: (Q1) whether the
photonic-coherence set (`plan/harmonic-comprehension-map.md` §2.7 — the directive's seven:
2 convergent / 3 reweight-relabel / 2 category-shift) supersedes the recorded phenomena
set (thesis §5 `framework/NATURAL_ORGANIZATION_THESIS.md:150-233` + `framework/AGENTS.md:408-414`,
formalized in the toolkit's proposed `schemas/physical_phenomena.yaml`) as primary; (Q2)
whether the registry's Electric/External vs Magnetic/Internal state-split is the selection
rule for the directive's element-dipoles (§2.7 compositional hypothesis). Queued behind
EPIC-004's opening (CRT-309 defers natural-phenomena/thermodynamic packages, still
`admission: proposed`, to a future EPIC-004; `provenance/DECISION_LEDGER.md:1238-1245`). No
framework/registry bytes move until the review's ceremony; §2.7's map-held annotation is the
interim record.

### BL-055 — D4 contract selection-mechanism review [FINDINGS RECORDED]

Phase C finding (`plan/bl-033-phaseC-results-memo.md`; artifact
`orrery/src/generated/phase-c-probe.v1.json`): the D4 contract's routes under-cover in
single-phase (4/14, frozen `not_derived`) and over-generate at full boundary representation
(14/14 via restatement, `G_A = U`). The observed 14 contacts are real; the contract lacks a
representation-stable selection mechanism separating them from the 28-key granted domain.
Review the contract's selection structure (T-A kernel-twin, T-B construction-join, T-C
midpoint) for a representation-stable predicate; feeds the governs semantic layer (rows 8/10
+ the directional finding) and any future amendment event. No claim event until the
contract-level question is addressed (OD-C4).

**Reviewed 2026-10-09:** sandbox planning evidence landed — generator
`scripts/build-d4-selection-review.mjs` + artifact `orrery/src/generated/d4-selection-review.v1.json`
(fingerprint `6d11fd93…`, raw-byte SHA-256 `40a1d758…`) + independent validator
`orrery/scripts/validate-d4-selection-review.mjs` + 11 vitest pins wired into
`orrery:check`/`orrery:build`; memo `plan/bl-055-d4-selection-review-memo.md`. Findings:
Step 0 patch-only confirmed (three independent confirmations; the phase-scope-artifact
hypothesis pre-falsified by execution scope). **The predicate exists and is intrinsic:
`P(s) = [forte(s) = 7-27]` — a clean 14/14 split** (all 14 observed contacts are 7-27
satellites; all 14 unobserved are 7-31; globally exactly fourteen of each, all A1
satellites). T-B is definitionally a restatement generator (every A1 anchor has exactly two
distinct E-parents; 56 witnesses = U; the join never reads the satellite except as payload).
T-A's under-coverage is a T1-link limitation on one closed 7-edge A0 transposition cycle
(5×T2 + 2×T1, sum 12): the frozen rotation sees only the two T1 edges (offices 0/6); the
five T2 edges are exactly the seam's (1,11) flank pairs. Three independent blockers
(frozen geometry, T-B definitional restatement, seam T-C overshoot) stand between the
predicate and any positive contract row: **the failure is route geometry, not topology,
semantics, or phase machinery.** Near-miss axis (cornerstone containment, one-sided 12/14)
recorded as fail per OD-1; build-phase recomputation corrected three containment-axis
numbers from the planning pass (recorded in the memo). No D4 verdict, no amendment.
Follow-on captured as BL-056.

### BL-056 — D4 new-route design [FINDINGS RECORDED]

Inputs: predicate `P(s) = [forte(s) = 7-27]` (BL-055; clean 14/14, intrinsic,
representation-stable) + the cycle-edge identity (the 7 E-parent pairs are exactly the 7
edges of the closed A0 transposition cycle and unordered-identical to the seam-pair
geometries) + the T-B route-definitional proof (BL-055 W3). Design a contact route
conjoining full cycle-edge traversal (T1+T2) with P, generating exactly O with G strictly
inside U; T-B replaced or P-restricted; T-C scope adjudicated (7-edge seam reality vs 2-group
observation). **Hard constraint: the design must break the cycle-edge ↔ construction-pair
identity (BL-055 W3) — a route that merely joins the same A0 cycle-edges restates U
regardless of predicate.** Precondition for any D4 amendment event (its own separate
ceremony gated on this work). Sandbox-only until admission.

**Validated 2026-10-10:** design build landed — generator
`scripts/build-d4-r2-route-review.mjs` + artifact `orrery/src/generated/d4-r2-route-review.v1.json`
(fingerprint `e25851f9…`, raw-byte SHA-256 `5a1a787e…`) + independent validator
`orrery/scripts/validate-d4-r2-route-review.mjs` (mutation-verified) + 10 vitest pins wired into
`orrery:check`/`orrery:build`; memo `plan/bl-056-d4-r2-route-memo.md`. Route:
**R2(h) = {(o(h), s) : s ∈ satellites(h) ∧ P(s)}** — cycle-edge derivation ground, predicate
selection within. Findings: **G1 cycle-twin `rotateMaskZ12^d(a) = b` verified 7/7** (2×T1 +
5×T2; the +2 mask rotation is the correct T2 generalization — no predicate-only fallbacks;
per-office justification tier is uniformly `cycle-twin-verified`). **G2** predicate selects
exactly 2 satellites per office at all 7 offices. **G3 `G_R2 = O` exactly** (14 keys,
`missing: []`, `extra: []`) — the D4 contact geometry is derivable through a route that reads
the satellites' set-class identity. **G4 non-collapse** |G_R2| = 14 ≠ 28 = U: the cycle-edge ↔
construction-pair identity is broken by satellite-reading selection, not edge substitution
(T-B remains satellite-blind and emits U). **G5** T-C midpoint census: 7 realized, 2
observation-exact, 5 seam-derived predictions with confirmation-surface markers; midpoint =
constructed-office invariant found; seam inventory cross-check green (7 = 7 realized, 2 = 2
exact). Constraint table 4/4 satisfied in-artifact (P incorporated / T1+T2 traversal /
identity broken / T-C tiered). Suite 264 green. Bounded: no D4 amendment, no route admission,
no registered derivation execution, no governs admission, no wall movement, no direction
assignment. Next: any R2 admission is its own separate ceremony.

### BL-057 — D4 record amendment (four-gate corridor) [DONE]

The corridor admitting the R2 derivation route and amending the D4 record additively.
Gates: (1) admission — `plan/bl-057-d4-amendment-spec.md` (`6908e7b`; header
`claim_admitted` per ruling 2026-10-10, landed `ead2eec`); (2) contract implementation —
`orrery/src/generated/d4-r2-contract.v1.json` (`contractFingerprint 5528510b…`) + engine +
generator + validator + 12 pins (landed `59fa59a`); (3) execution — receipt
`qa/d4-r2-execution-receipt.json` (raw-byte `7e14cbbc…`, status `execution_verified`,
branch `DERIVED@X`; calibration EXACT; R2 = O at all four licensed contexts with the
construction join = U contrast; D7 asymmetric analogue hypothesis-tier; memo
`plan/bl-057-gate3-execution-memo.md`; landed `85a62a6`); (4) record amendment — ENTRY 15
(`provenance/DECISION_LEDGER.md:2665-2804`, status `record_amended (derivable-via-R2)`),
additive only; ENTRY 10's historical `not_derived` record stands immutable and is linked
forward, never rewritten; receipt `qa/specs/bl-057-d4-record-amendment.json`.

**Landed 2026-10-10:** ENTRY 15 appended additively; ENTRY 10 byte-untouched (region
SHA-256 `201efe81…` line-join recipe / `50b8b73f…` keepends, both labeled in the
receipt); the Gate 3 ledger fence evolved from whole-file equality to execution-time
prefix preservation (frozen byteLength 174314; the Gate 3 receipt bytes and all corridor
fingerprints unchanged); backlog, receipt and inventories in one atomic commit.

**Governs program — still live (not closed by this corridor):** the BL-056 design item
(queued), the 14-vs-14 predicate's semantic registration, the asymmetric fa/ti finding
(row-class material), rows 8/10's semantic holes, and the directional-semantics gate all
remain separate live items feeding the governs semantic layer. The corridor's completion
does not close the program it was part of.

### BL-058 [DONE] — Ledger-pin inventory repair (ledger-named literal class)

13 `validate:ledger-pins` violations in corridor generators (BL-033 Phase C → Gate 2/3
lineage): 12 `unreviewed_literal_pin` + 1 `literal_ledger_pin` (structurally
non-allowlistable per the migration memo — "ledger-named literals cannot be allowlisted;
no generic frozen-prefix exemption exists"). Pre-existing since Phase C (`ac94862`);
recorded as accepted release state at the Gate 4 landing (ENTRY 15 Release Gate
Disposition). Repair design needed: the migration memo's own note implies the scanner's
allowlist model doesn't cover ledger-named literals — the repair may be a scanner
extension (entry-scoped pin recognition per the binding convention's R2) rather than
allowlist additions. Queued; own ceremony. Scoping document:
`scrum/plan/ledger-pin-migration.md`; destination design:
`provenance/EVIDENCE_BINDING_CONVENTION.md` R2 (entry-scoped bindings) — these corridor
scripts are pre-convention consumers whose pins predate the R2 model; the repair is a
migration to entry-scoped bindings, the convention's first retroactive consumer.

**Repair landed 2026-10-12 — the BL-081 landing** (the evidence-binding infrastructure sprint: validator + migration, one landing, so the migrated pins are born under their own enforcement). The inventory went from **13 violations to 0** with zero new violations: the 12 `unreviewed_literal_pin` chain-anchor fingerprints (R1-class committed-bytes bindings; each verified against its consumed artifact at landing) reviewed and registered in `schemas/ledger-pin-allowlist.json` with reasoned entries; the 1 `literal_ledger_pin` (`DECISION_LEDGER_SHA256` in `scripts/build-d4-r2-execution-receipt.mjs`) migrated to the convention's R2 model — the literal deleted, its frozen value (`8b7084bc…`) and prefix endpoint (byte 174314) preserved in the registered binding sidecar `qa/d4-r2-execution-receipt-ledger-binding.json` (span `[147049, 174314)` over ENTRY 10–14; the generator's fence reads the sidecar; `--check` and all five corridor outputs byte-identical to their pre-migration baselines). `npm run validate:ledger-pins` PASS (0 violations; inventory tests 8 passed). Record: memo `plan/bl-081-evidence-binding-validator-and-pin-migration.md`.

### BL-059 — D4 Derivation Statement + higher-theorem scoping (governs derivability) [FINDINGS RECORDED]

Two fast-lane planning artifacts landed in one commit (hypothesis/observation tier,
planning evidence; no claim event, no record amendment, no admission):

- **Track 1 — D4 Derivation Statement** (`plan/bl-059-d4-derivation-statement.md`): the
  bounded contact-geometry theorem stated in theorem form — object (O = 14 keys, exactly
  2/office), inputs-with-status (granted GOVERNS R, office assignments, CONSTRUCTS cycle
  ground, canonical reads — vs derived cycle-walk output), rule R2 (filtered cycle-walk;
  frozen cycle 2×T1 + 5×T2, interval sum 12), predicate P = forte-7-27, the discharged
  obligations (exact coverage, non-collapse 14 ≠ 28 = U, edge validity 7/7, T-C scope
  7 realized / 2 observation-exact / 5 confirmation-marked predictions, calibration +
  strict-degree negative control + mutation probes), and the scope conclusion (bounded D4;
  wall intact; D7 asymmetric boundary case carried hypothesis-tier). Formal restatement of a
  discharged result: authority flows from the four-gate corridor's receipts (ENTRY 15), not
  from the statement; citation-stable — not edited by future findings.
- **Track 2 — Higher-Theorem Scoping memo**
  (`plan/bl-059-governs-derivability-scoping-memo.md`): first formal statement of the open
  question above the corridor — can the GOVERNS organization (seven offices, parent/satellite
  assignments, edge structure) itself be derived from the same machinery rather than
  entering as granted input? Sections: the grant as recorded; the grant's status in the
  framework's own design (no recorded derivability intent — the question is contrary to the
  original modeling assumption, which raises the bar for any future claim); what a
  derivation would require; evidence for (14-vs-14 predicate, midpoint invariant, fa/ti
  asymmetry, D-tier M-closure) and against (D7 modal non-closure, cycle ground read from
  granted CONSTRUCTS, 5 unconfirmed midpoint predictions, G1 shut, BL-035
  direction/collision findings, grant-status); candidate approaches as questions only
  (cycle-walk generalization, predicate transport, D-tier asymmetry boundary case, midpoint
  reconstruction), each with a falsification shape and none endorsed. **OPEN RESEARCH —
  defines the question, claims no answer.** Accretes future evidence; the companion
  statement does not.

Fences both: no claim events; no record amendments (D4 `derivable-via-R2` and D7
hypothesis-tier unchanged); no G1 movement; no governs admission; no INV-5 graduation; no
M-walkability promotion; no canonical/Court/schema/Neo4j writes; frame is interpretation
vocabulary only; session prose is context, not evidence.

### BL-060 — D4 14-vs-14 structural hunt [FINDINGS RECORDED]

The governs semantic layer's first data-driven investigation: *why* the D4 anchors'
observed contact selection follows the 7-27/7-31 satellite set-class split (BL-055's clean
predicate), beyond the seven failed/constant BL-055 axes. Seven new characterization axes,
each tested for the 14/14 split and adjudicated under the OD-60-2 restatement guard; D7
fenced out entirely (OD-60-D7; ENTRY 15 D7 clause). Sandbox-only; feeds the higher-theorem
question's evidence base (BL-059 §4); no attempt at the higher theorem itself.

**Hunted 2026-10-10:** generator `scripts/build-d4-14v14-hunt.mjs` + artifact
`orrery/src/generated/d4-14v14-hunt.v1.json` (fingerprint `8a1295ca…`, raw-byte SHA-256
`3e31a653…`) + independent validator (mutation-verified; four probes rejected) + 9 vitest
pins wired into `orrery:check`/`orrery:build`; memo `plan/bl-060-14v14-hunt-memo.md`.
BL-055 imported by fingerprint (`6d11fd93…`) per OD-60-4; base artifact untouched.
Findings: **the non-Z D-tier containment composite splits cleanly 14/14** —
`nonZSum <= 13` (shared pentatonic subnodes with the four non-Z D-tier anchor families
7-1/7-8/7-15/7-22) selects all 14 observed, `>= 14` all 14 unobserved; boundary gap exactly
1 (13/14); within-class rooted-state variance (8..13 vs 14..19) proves it is not the class
label restated; inversion-stable 28/28 — the hunt's **independent structural basis**.
Per-family breakdown: four one-sided near-misses (7-Z17/7-Z37 `>= 5` selects 12/14 observed
with 0 false positives; 7-8/7-22 reverse `<= 3`/`<= 5` select 14/14 with the same two false
positives 731/2921); no single family splits cleanly. IV-delta recomputed from ledger bytes
(signed `[0,1,-2,1,2,-2]`; absolute `[0,1,2,1,2,2]`; IC1 equal) — the brief's hand-derived
`<010120>` dropped per OD-60-1 (build-phase self-catch: IC4 differs +1; thresholds scan to
the values present). Complement-bridge link splits cleanly but is **restatement-grade**
(canonical complement bijection; OD-60-2) — the canon-level asymmetry is recorded (5-27
admitted bridge with rooted record vs 5-31 proposed, none; representative-mask probe hit
14). Symmetry does not separate (both classes chiral, inversionally asymmetric, zPartner
null). **The split is office-transverse** — every office contributes exactly 2 observed + 2
unobserved, so every office-level axis (cycle position, governor-element, ENTRY 13
degree-fates — the last two correlation-only under the ENTRY 13 scope fence, OD-60-3) is
provably non-separating (office lemma, hit = 14 identically). **Synthesis verdict:
DERIVED** — the contact selection is boundary-geography-selective; primitive branch did not
fire; governs semantic layer gains entry GSL-1; scoping memo §4 accretion item carried in
the memo (memo not edited; accretes by its own discipline). Grounding: 15 claims verified
(two subagent passes); Gate-2 mutation-probe scope corrected (design-level, not
Gate-2-native); ledger-pins inventory unchanged at the BL-058 13 (zero added). Fences: no
claim event, no record amendment, no governs admission, no higher-theorem answer, no G1
movement, no D7 computation, no canonical/Court/schema/Neo4j writes. Suite 299 green.
Post-landing register: memo addendum §13 (exception pairs, mechanism-level representation
stability, Z/non-Z follow-on); follow-ons captured as BL-061/BL-062.

### BL-061 [FINDINGS RECORDED] — The two escapee satellites (1765, 1261)

Both observed keys are the residual pair of the Z-family side of the hunt: they are the two
observed keys missed (fn = 2) by the one-sided 7-Z17/7-Z37 scans (`>= 5`) and by the zSum
composite (`>= 14`), while sitting well inside the clean non-Z split (nonZ 8). Their
incidence profile is otherwise high (seam 4, bridge 4, cornerstone 2). Characterize: what
distinguishes them from the other 12 observed — they are the residual the Z-side partial
axes do not explain, and their exception structure is correlated across three scans,
suggesting a single unrecognized property. Feeds GSL-1's refinement.

**Grounding correction (twelfth catch, maintainer-prose class).** The capture text proposed
in the post-landing disposition described this pair with the profile of a different pair
("zero seam incidence, no bridge subnodes, no cornerstone containment, below the non-Z
containment threshold's clean split"): those facts belong to 2395/2899 (the BL-055
zero-seam near-miss pair, which sits inside the clean split at its boundary value 13 and is
already recorded in BL-055 §4). The pair named in the title — 1765/1261 — carries seam 4 /
bridge 4 / cornerstone 2, nonZ 8, zSum 11 per the landed artifact `table28`. Corrected here
before memorialization; the named pair stands, the description is replaced by the artifact
bytes. The correction exposes the bracket structure: 2395/2899 (boundary 13, observed) and
731/2921 (boundary 14, unobserved) are the pairs at the clean composite's boundary values —
the two pairs that bracket the 1-integer gap.

**Characterized 2026-10-10 (joint artifact with BL-062):** `orrery/src/generated/d4-zresidual-hunt.v1.json`
(fingerprint `e1b3f655…`) + generator + mutation-verified validator + 9 pins; memo
`plan/bl-061-062-zresidual-memo.md`. **Verdict: EXPLAINED_NOT_PRIMITIVE** — the pair is the
Z12-only interface extreme (Z12=7, Z17=Z37=2; zSum 11 = observed minimum) and the unique
observed pair with chiral-Z-only pentatonic composition (5-Z18/5-Z36; achiralZClasses
empty); it defeats per-family Z and per-content-type thresholds by construction and sits
inside the canonical sign rule at margin 3. Its members are inversion siblings (status
shared; not an orientation artifact). Feeds GSL-2.

### BL-062 [FINDINGS RECORDED] — The Z/non-Z boundary-selection asymmetry

The D-tier containment composite selects on non-Z families only; the three Z-classes
(7-Z12, 7-Z17, 7-Z37) fail as single axes and are absorbed by the composite's threshold.
Investigate: is the non-Z selectivity structural (chiral classes genuinely don't participate
in the selection geography) or threshold-artifact? Feeds the boundary-layer semantics
(BL-029's wall, the directional finding) and the governs semantic layer.

**Characterized 2026-10-10 (joint artifact with BL-061):** **Verdict: STRUCTURAL** — the
Z-structure participates through two channels: (i) interface polarization — observed
satellites are Z-majority in D-tier containment (`nonZSum < zSum`; observed −13..−3,
unobserved +1..+11, gap 4), the canonical refinement of GSL-1's `nonZSum <= 13` (its w = 0
projection); (ii) composition content — every observed carries Z-class pentatonic subnodes
(2-4 rooted) and achiral subnodes (2-4), every unobserved carries none. Mechanism verdicts:
(a) Z-paired vs IV-unique anchor profiles PARTIAL (families individually distinct,
cornerstones confined to D5/7-Z12, no clean band dichotomy); (b) satellite Z-content
SUPPORTED; (c) achiral-content presence SUPPORTED, A/B counts NOT SUPPORTED. Refinement
scan: 6 clean hits + 1 degenerate dual-threshold hit; near-misses 5 (complementary
Z-content-type pairs); orientation-polarized shapes rejected as inversion-splitting. New
structural facts: tier↔family bijection (D1=7-22 … D7=7-1); mesh subnodes = pc-0-anchored
5-subsets (462/462); 14 inversion pairs all status-shared (selection selects whole pairs;
pairs link offices summing to 6 mod 7). GSL-1R + GSL-2 recorded.

### BL-063 [FINDINGS RECORDED] — Intrinsic office reconstruction via midZ7 (un-granting Phase 1)

Phase 1 of the BL-059 un-granting roadmap (requirement 2 — office recovery from
non-office data): derive the anchor office coordinates from pitch masks rather than
reading granted ledger fields. Pre-registered before execution: the claim-free BFS
scaffold (O-0), the brightness premise (O-A, interpretation-tagged), the D-tier
containment asymmetry probe (O-B, existence-only), the Hamming-2-restricted sandwich
identification for π(h) with the twin-closure boundary branch, and the M1/M2/M3
midpoint protocol.

**Reconstructed 2026-10-11 (read-only):** generator
`scripts/build-bl063-office-reconstruction.mjs` + artifact
`orrery/src/generated/bl063-office-reconstruction.v1.json` (fingerprint
`6d33c67b…`, raw-byte SHA-256 `57932f37…`) + independent validator (static
grant-isolation check + five mutation probes rejected: flipped endpoint, scrambled
constructor pair, inverted orientation, smuggled officeIndex read, corrupted midpoint
constant) + 9 vitest pins wired into `orrery:check`/`orrery:build`; memo
`plan/bl-063-office-reconstruction-memo.md`; chain anchor BL-060 by self-checked
fingerprint `8a1295ca…`.

Findings: **the seven A0 masks carry the Hamming-2 line graph P7** (endpoints
1387/2773; pcSum ladder 33→39, Locrian→Lydian; degrees 1,2,2,2,2,2,1). **κ₁
reproduces all 7 canonical offices; κ₀ only the reflection-fixed center** (outcome
M1; κ₀ 1/7). The constructor identification splits into **two construction
mechanisms**: 5 interior anchors via the unique Hamming-2-adjacent sandwich pair,
2 boundary anchors via **twin-closure** (sole Hamming-2 neighbor + unique T±1
rotation partner, sandwich not holding); every π constructor set equals the granted
E-pair (validation comparison only). **The frozen midpoint form is
reflection-equivariant** (verified 49/49: `midZ7(6−a,6−b) = (6 − midZ7(a,b)) % 7`):
the midpoint law is reflection-blind — g₀ and g₁ are complementary (sum 6 on every
anchor, each orientation satisfying the law in its own frame); the canonical
comparison resolves the orientation. Self-catches recorded: the **unrestricted
sandwich is non-unique** (5/8/7/5/7 pairs; the boundary satisfying pair is the line
terminals 1387/2773, not the constructor) — the Hamming-2 restriction is the
identifying condition; and the degree expectation was corrected to sorted form
before landing.

**Verdict: `CONSTRAINED_TO_REFLECTION`** — office structure intrinsically recoverable
from mask geometry up to the Lydian/Locrian reversal; the reversal requires exactly
one bit, supplied by the interpretive brightness premise (corroborated by the unique
canonical match; coincides with κ₁) or by one grant comparison (M1: κ₁ 7/7, κ₀ 1/7) —
both routes agree. H_B (D-tier containment) returned the containment-twin null
(identical terminal profiles; no structural asymmetry available). Precisely: without
the bit each office is determined as {k, 6−k}; one bit determines all seven. Fences:
no claim event, no record amendment, no GOVERNS derivation claim, no governs
admission, no higher-theorem answer, no G1 movement, no D7 computation, no
canonical/Court/schema/Neo4j writes; requirement 2 only, up to the named bit. Suite
317 green; ledger-pins unchanged (13, zero added); manifest regen. Follow-ons
captured as BL-064 and BL-065.

### BL-064 [LANDED] — Phase 2: cycle-ground derivation via κ (un-granting Phase 2)

Derive the A0→A1 CONSTRUCTS pairs from κ (the recovered office coordinates) rather
than reading granted E-edges. Inputs: κ (7/7 up to reflection), the sandwich
construction (internal), twin-closure (boundary). Pre-register: the derivation's
output must set-equal the granted E-pairs (14 edges). Dependency: consumes BL-063's
κ; the reflection bit is inherited (Phase 2's derivation is reflection-relative
unless the bit resolves).

**Landed 2026-10-11 (commit `341aada`; backlog registration completed at the GOV-524
claim event).** Generator `scripts/build-bl064-cycle-ground.mjs` + artifact
`orrery/src/generated/bl064-cycle-ground.v1.json` (fingerprint `aa975820…`, raw-byte
`9432aa76…`) + independent validator (static grant-isolation + 10 mutation probes
rejected incl. smuggled officeIndex and ledger reads) + 10 vitest pins wired into
`orrery:check`/`orrery:build` after `bl063-office-reconstruction:check`; chain anchor
BL-063 by self-checked fingerprint `6d33c67b…`; memo
`plan/bl-064-cycle-ground-memo.md`. Findings: the seven constructor pairs are exactly
the cyclic distance-2 pairs in κ; dual formulations (child-side S-int/T-bdy +
coordinate-side K-int/K-bdy) independently re-proven equivalent; derived 14 directed
edges set-equal the granted E pairs (`missing: []`, `extra: []`, per-child 7/7,
office alignment 7/7 under κ₁); **`midZ7(c−1, c+1) = c` — the coordinate rule and the
frozen midpoint law are one relation read backward** (boundary centres = the 2
observation-exact T1 seam relations; internal = the 5 confirmation-marked T2
predictions); direction masks-only 5/5 internal + canonical class 7/7; gates
V-P2-1…4 PASS; **verdict `CYCLE_GROUND_DERIVED`**. Suite 327 green; ledger-pins
unchanged (13, zero added); no claim event, no record amendment, no GOVERNS
derivation claim, no GOVERNS admission, no higher-theorem answer, no G1 movement, no
D7 computation. *(Claim event follow-on: BL-064's finding feeds GOV-524 below.)*

### BL-065 [CAPTURED] — The brightness-premise bit (the shared remaining dependency)

Two independent derivations (the semantic layer's brightness ordinal, §2.7; the
office reconstruction's endpoint orientation, BL-063) converge on one unresolved
assumption: the bright-end identification (Lydian = office 0). One bit, shared,
named. Resolution paths: (a) a mechanical office-independent discriminator (search —
none found in BL-063's grounding); (b) one grant comparison (accept one bit of
granted input as the resolution — the honest minimal grant); (c) future discovery.
Queued; feeds both the semantic layer and the un-granting chain.

**Grounding correction (maintainer-prose class, applied before capture).** The
capture text attributed the one-bit registration to §2.7's amendment; grounding
check — §2.7 (both entries) carries no brightness premise. The grounded convergence
is with the comprehension map's §3 `[OPEN CANON QUESTION]` Sun/Moon pole assignment
(office assignment `Lydian is the Sun office`, `framework/AGENTS.md:103` — the very
premise BL-063's bit consumes — versus the pitch-governance reading,
`framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:83-84`); §3 requires
resolution from framework docs and names the governs semantic layer among the
expected resolvers — the layer BL-063/BL-065 sit in. The nearest registered
brightness-ordinal material is §2.3's Court-compression ordinal 22→26
(`schemas/elemental_pentatonic_scale_map_v1.0.0.yaml:95-218`, field semantics
`[OPEN]`): a pentatonic/Court ordinal, adjacent to but distinct from BL-063's
heptatonic pcSum ladder 33→39. The shared-dependency framing is recorded as
corrected: **one unresolved identification, two framework registrations** (geometry
endpoint; open Sun/Moon canon question).

### BL-066 [LANDED] — Phase 3: the 28 R-edge derivation (the capstone)

Derive the 28-edge A1 GOVERNS relation (7 parents × 4 satellites) from the
pre-grant machinery — masks, the canonical ledger's role/tier domain, Phase 1's
coordinates and Phase 2's ground — with the granted R edges appearing only in the
comparison gate. Generator `scripts/build-bl066-r-edge-derivation.mjs` + artifact
`orrery/src/generated/bl066-r-edge-derivation.v1.json` (fingerprint `94f0661f…`,
raw-byte `ac2db3d9…`) + independent validator (two-sided static input-isolation
check + 25 mutation probes rejected, including a lobotomized region) + 13 vitest
pins wired into `orrery:check`/`orrery:build` after `bl064-cycle-ground:check`;
chain anchor BL-064 by self-checked fingerprint `aa975820…`; memo
`plan/bl-066-r-edge-derivation-memo.md`. Findings: **reach R-H2 24/28 masks-only,
zero extras, unique hubs**; the 4 unplaced `{695, 3497, 731, 2921}` resolved by the
**H8 reach-census closure law** (each attaches to its H8-parent with the smaller
H2-reach count; equivalently the unique H8 matching that equalizes the reach
census — 16 matchings enumerated, exactly one, the granted assignment); the
pre-registered **swap-bit candidate dissolved** (the planning-pass
distance-invisibility record tested proximity axes, not census ordering); the
battery corroborates (pcSum + mask-numeric agree; κ orientation-relative;
containment the inapplicable control); **count-4 emerges** from the completion
(OD-P3-5 strongest form); GSL-1R reproduced per parent (2×7-27 Z-majority +
2×7-31, 28/28 sign agreement); direction dual-report (structural + unique-hub
24/24 + IC-distinguishability 28/28 candidate, A1-anchor IC `[2,5,4,4,4,2]` —
grounding correction applied: the ruling's parenthetical `[2,5,4,3,6,1]` is
BL-064's A0-anchor IC); gates V-P3-1…5 all PASS (set-equal 28/28, `missing: []`,
`extra: []`; reflection-invariant with labels `c → 6−c` carried to BL-065);
**verdict `R_EDGES_DERIVED`** — the GOVERNS relation's edge content is intrinsic
to the satellite layer's reach geometry; the bit inventory stands at **one carried
bit** (office-orientation, BL-065, two agreeing sources), the swap dissolved; the
higher-theorem question (BL-059) gains its first direct, bounded, affirmative
finding. Suite 340 green (34 files); ledger-pins unchanged (13, zero added); no
claim event, no record amendment, no GOVERNS admission (finding, not admission),
no orientation-bit resolution, no IC-tier promotion, no G1 movement, no D7
computation, no Phase-4 work; manifest regen. Follow-on: BL-064's backlog
registration remains a separate step; BL-065 unchanged.

### BL-067 [LANDED] — The governs semantic layer synthesis (the boundary layer's first coherent statement)

The boundary layer's scattered measured findings assembled into their first coherent
semantic statement: what the layer is (the D4 contact selection), how its mechanism works
(three channels), what its asymmetries mean (the fa/ti polarity), and where its open
questions live. A synthesis of **landed findings, not new measurement** — every
substantive claim cites its landing artifact; the registered §2.7 lens (commit `601d073`)
applied as interpretation vocabulary in three template-bound codas; open questions
inventoried; finding-row statuses untouched.

**Landed 2026-10-11:** memo `plan/bl-067-governs-semantic-synthesis.md` + comprehension-map
§4 consumption row. Structure (by channel, per maintainer ruling): §0 reading contract
(membrane verbatim + the lens-freedom note) → §1 set-class identity (P(s) = 7-27, clean
14/14, Tn-invariant; **lens-free by design** — the findings-ground-themselves
demonstration) → §2 Z-interface polarization (GSL-1R sign rule, gap 4; GSL-1 as its w = 0
projection; Jupiter/Saturn coda) → §3 composition content (GSL-2's chiral-Z-only
Z12-corner, margin 3; Mercury coda) → §4 fa/ti polarity (the asymmetry measured three
ways: D4 rotational derivation vs D7 literal-P 0/14, class-P 14/14 = U restatement,
cycle-twin 0/7; Venus/Moon coda; D7 hypothesis-tier fenced throughout) → §5 geography
(tier↔family bijection; threshold anatomy 13/14; the three exception pairs;
inversion-invariance; office-linking; filtering-regime pointer; BL-066/GOV-524
corroboration paragraph as context only) → §6 open questions inventory (D7 asymmetry
explanation; Z12-corner case; Z/non-Z mechanism; directional-semantics gate; anchoring
remainder — each with evidence status + natural next investigation) → §7 integration
verification + fences. The three codas are the synthesis's only novel prose, structurally
identical and non-load-bearing; removing every coda leaves every finding intact. No claim
event; no record amendment; no governs admission; no G1 movement; no INV-5 graduation; no
M-walkability promotion; no canonical/Court/schema/Neo4j writes; finding rows 8/10, the
phenomena-closure items, and the directional-semantics gate untouched; manifest regen.

---

### GOV-524 — GOVERNS edge-content derivability claim event (admission) [DONE]

The fifth claim event; the formal admission of the un-granting programme's capstone
finding (BL-063 → BL-064 → BL-066). **Landed 2026-10-11** in one atomic commit:
candidate record `docs/specs/governs-derivability-candidate-v0.1.0.md`
(`SPEC-GOVERNS-DERIVABILITY-001` v0.1.1) + compliance receipt
`qa/specs/gov-524-governs-derivability-admission.json` + ENTRY 16 + the BL-059
scoping-memo accretion (§4.7 + §7 status update + §8 accretion note) + the
comprehension-map §4 consumption row + the BL-064 landing registration above + this
row's revision entry + refreshed inventories. Claim (verbatim in the record): the A1
GOVERNS relation's **edge content** — which parent–satellite pairs exist (28 edges,
7 offices × 4 satellites) — is derivable from pre-grant machinery (κ coordinates,
Hamming/containment reach, the H8 reach-census closure law) **up to one named bit**
(office-orientation; BL-065) **and the anchoring remainder** (the A0/A1 anchor sets +
tier/role partition + presentation conventions). Significance, recorded: the original
D4 contract's modeling assumption ("the principal authored inheritance input") is
revised **by evidence** — the relation's edge content is intrinsic to the satellite
layer's reach geometry; the D4 ledger record itself is not amended. Excluded
(binding): semantics, role, anchor-set/tier-partition derivability, GOVERNS
authority, any D7 implication, INV-5/§6(4)/M-walkability, G1 movement, record
amendments beyond the claim's own entry, release promotion. The BL-059
higher-theorem question closes with its bounded affirmative answer; what remains
open beyond the claim's bounded scope (orientation bit BL-065; anchoring remainder;
semantics) is registered in the scoping memo §7. Gates: full validate observed first
stop `validate:ledger-pins` (pre-existing 13-violation inventory, recorded not
repaired; BL-058); focused phase-chain checks green. **No GOVERNS admission** — the
claim is about derivability, not authority.

---

### GOV-525 — The expanded GOVERNS derivability claim event (admission) [DONE]

The sixth claim event; the expansion of the admitted object (ENTRY 16) with the
**tier↔family correspondence**'s derivability. **Landed 2026-10-12** in one atomic commit:
the candidate record `docs/specs/governs-derivability-candidate-v0.1.0.md` bumped to
v0.2.0 (`SPEC-GOVERNS-DERIVABILITY-001`; the v0.1.1 text preserved in the git history and
pinned as the delta baseline, verified by mechanical reversal) + the expansion compliance
receipt `qa/specs/gov-525-governs-derivability-expansion-admission.json` + ENTRY 17 + the
BL-059 scoping-memo accretion (§4.11 evidence + §4.12 admission record + §7 status update)
+ the comprehension-map §4 consumption row + this section + revision row v1.51 + refreshed
inventories. Expanded claim (verbatim in the record and ENTRY 17): beyond the edge content
(ENTRY 16), the **tier↔family correspondence** — the coordinate action's family-level
structure over the ten anchor families — is derivable from pre-grant machinery (the
coordinate algebra: the Klein-4 unit subgroup {1,5,7,11} of Aff(Z₁₂), canonically
determined by `11u ≡ 7 (mod 12)`; BL-075), whose induced action is the exact family-level
involution **7-35↔7-1, 7-34↔7-8, 7-Z37↔7-Z17**, fixing **7-33/7-22/7-15/7-Z12** —
identical for T1/T2, trivial for {ID, ρ}, whole-block, Z-pair-consistent, crossing the
fa/ti pole (BL-076; branch `COVARIANT_CONFIRMED`, finding `probe-verified`) — up to one
named bit and the anchoring remainder. **Scope precision (binding):** the correspondence's
*derivability* is admitted; the families' identities remain read from the canonical
ledger; the offices' semantic assignments remain framework-declared. Grounding correction
carried (maintainer-prose class): the disposition's "four elemental governors permute
among themselves" recorded as the measured six-office permutation around the fixed
mediator. Excluded (binding): everything from ENTRY 16's scope plus the two expansion
exclusions (family-identity derivation; office-semantics assignment); no GOVERNS authority;
ENTRY 10/15/16 byte-untouched. Gates: full validate observed first stop
`validate:ledger-pins` (pre-existing 13-violation inventory, recorded not repaired;
BL-058); focused checks green (BL-075/BL-076 validators; `orrery:check` exit 0; suite
406). **No GOVERNS admission** — derivability, not authority.

---

### BL-068 [LANDED] — The D7 asymmetry investigation (GSL-3: the governs semantic layer's first explanatory entry)

The boundary layer's deepest open question executed: why the fa-pole's contact route selects via set-class identity while the ti-pole's analogue restates its domain (synthesis §6 Question 1). The investigation establishes the true starting condition (OD-68-0: the analogue-R collapsed its own domain by construction — the "no selection gap" means the construction consumed the domain, not that unobserved keys resist selection) and moves the discrimination question to the anchors' ledger/mesh relations (OD-68-1): the recorded layer (14 seat relations, 2 per anchor, **0 unrecorded** — the collapse confirmed from the ledger side) and the constructed availability layer (Hamming-2 reach of the 7-2 class: **36 instances = 14 recorded same-office + 22 unrecorded modal-neighbour**, per-anchor 4–6, every unrecorded instance at office delta ±2 mod 7, 11 × +2 / 11 × −2). **Verdict `DIFFERENT_PREDICATES`** — the four axes: (1) native set-class hunt **RESTATEMENT_UNIFORM** (the class is the domain; 36/36); (2) office-linking / modal remainder **CLEAN_SPLIT** (14/0/0/22; the sole clean separator is the seat-contact's own office condition, and the remainder is modal-bounded); (3) Z-interface **NON_SEPARATING** (only 4/14 contact states Z-majority — the GSL-1R polarization does not extend; fa-specific); (4) invariant geography **INVARIANTS_OBEYED** (7/7 inversion pairs in-class, all office sums 6 mod 7, status shared, orientation-complementary — pole-universal). GSL-3 recorded: the contact-target tiers differ in class multiplicity (A1: two satellite classes; D6: one), so the fa-pole's selection rides set-class identity and the ti-pole's rides the office condition alone — same invariants, different predicates; the ti-pole's contact relation is class-exhaustive and office-pure.

**Landed 2026-10-11:** generator `scripts/build-bl068-d7-asymmetry.mjs` + artifact `orrery/src/generated/bl068-d7-asymmetry.v1.json` (fingerprint `b0d65bd6…`, raw-byte `3de92695…`) + independent validator (16 mutation probes rejected; static generator-isolation checks — no grant projection, no analogue-R, no route review) + 11 vitest pins wired into `orrery:check`/`orrery:build` after `bl066-r-edge-derivation:check`; chain anchors by self-checked fingerprint (D4 hunt `8a1295ca…`, zresidual `e1b3f655…`, Phase C `5085e274…`; Gate 3 receipt and frozen D4 receipt by raw sha256); memo `plan/bl-068-d7-asymmetry-memo.md` (7-2 control in appendix, summary row in the census section). Grounding correction (maintainer-prose class, BL-060 G-13 pattern): the planning brief's "59 7-2 states" figure was a raw string-occurrence count across `canonical/universal-network-data.json` sections — the canonical ledger carries exactly 14, all D6 satellites, all set-equal to the D7 contacts (corrected in-artifact). Fences: **D7 hypothesis-tier throughout** (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim); no GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; no D4-record movement; the frame is not design input. `orrery:check` exit 0; suite 351 green (35 files); `validate:ledger-pins` unchanged (pre-existing 13-violation BL-058 inventory, zero added); `validate:manifest` PASS; manifest regen.

---

### BL-069 [DONE] — The GSL-3 registration (the governs semantic layer's first explanatory entry registered)

Fast-lane additive registration of **GSL-3** — the fa/ti asymmetry's mechanism (different
predicates over different domain multiplicities, with pole-universal invariants) — into
the synthesis memo, the comprehension map's finding structure, and the scoping memo's
evidence-for column. **A registration of the landed finding** (BL-068, commit `1a0a903`),
not new measurement: every registered claim cites
`orrery/src/generated/bl068-d7-asymmetry.v1.json` (fingerprint `b0d65bd6…`) and memo
`plan/bl-068-d7-asymmetry-memo.md`.

**Landed 2026-10-11:** (1) synthesis `plan/bl-067-governs-semantic-synthesis.md` — §6
entry 1 flips to **explained** (mechanism: GSL-3; verdict `DIFFERENT_PREDICATES`); §4
gains the mechanism paragraph beneath the Venus/Moon coda (the lens stays vocabulary; the
mechanism is the finding); §7.3/§7.5/§7.6 and §8 updated to carry the registration. (2)
comprehension map `plan/harmonic-comprehension-map.md` — §4 consumption row + new §5.6
(GSL-3: the condensed one-line mechanism plus the supporting measurements;
`[MEASURED — planning evidence]` class via §5; D7 hypothesis-tier fenced) + §5.5
receipts gain the BL-068 artifact + memo. (3) scoping memo
`plan/bl-059-governs-derivability-scoping-memo.md` — §4.8 accretion: the fa/ti selection
characterized at both poles (class-selective/office-flat at fa, class-exhaustive/
office-pure at ti; same invariants) — *shows* discoverable structure in the relation;
*does not show* derivability; evidence accrues to §4's column; §7 open declaration
unchanged. (4) this row + v1.39. (5) manifest/checksums regen. Fences: no claim event, no
record amendment, no D7 movement, no governs admission, no higher-theorem answer, no G1
movement, no INV-5 graduation, no M-walkability promotion, no canonical/Court/schema/Neo4j
writes; finding-row statuses untouched; session prose context, not evidence.

---

### BL-070 [LANDED] — The D7 derivation attempt (office-purity route): PARTIAL_DERIVATION, the third obstruction refined (interval-transport, not rotational absence)

The ti-pole's R2-analogue, aimed by GSL-3's mechanism and executed against the pre-registered
battery (OD-70-1…OD-70-4). **Branch classification `PARTIAL_DERIVATION`** (V-D7-1 PASS /
V-D7-2 FAIL / V-D7-3/4/5 PASS): the domain — 36 anchor-satellite instances, per-anchor
4/5/6/6/6/5/4 — **derives masks-only** (role/tier partition + Hamming-2 reach; set-equal to
BL-068's availability domain; the per-anchor asymmetry is **emergent** — the projection of a
**uniform all-ledger reach of 30 per anchor**); the nine pre-registered mask-geometric
selectors (C-M1…C-M9: containment, Hamming/rotation, pc-sum/mask-numeric, chiral-Z,
displacement, IC-counts, orientation, inversion, reach census) **all fail** (cleanSplitCount
0). Near-miss anatomy: `|ΔpcSum| = 1` selects the 12 single-semitone substitutions (12/0/2/22),
missing exactly the **terminal tritone contacts** 127:253 and 4033:2017 (both Δ=6, both
reach-singletons); the 22 non-contacts all sit at |Δ| ∈ {4,6}. The min-|Δ| + census composite
**C-TB-1** selects 14/0/0/22 masks-only, recorded **UNPROMOTED** (OD-70-5: separation ≠
derivation; mechanism question = BL-072). **The third obstruction refined:** the Gate 3
cycle-twin bytes show every modal edge is an **exact rotation** — rotateMaskZ12^11 ×6 plus the
4033→127 closure at 6 (root-normalization offset); the landed 0/7 counts only the D4
verification intervals {1, 2} — the obstruction is an **interval-transport failure**, not a
rotational absence. Invariants pole-universal (7 whole pairs, all office sums 6 mod 7, status
shared; whole-pair selection mechanically verified); the office field is the selection's
ground; three-tier accounting (domain masks-only; selection canonical-read/granted).

**Landed 2026-10-11:** generator `scripts/build-bl070-d7-derivation.mjs` + artifact
`orrery/src/generated/bl070-d7-derivation.v1.json` (fingerprint `9db10a08…`, raw-byte
`169ce706…`) + independent validator (34 mutation probes rejected; two-sided static
input-isolation check — office/class/network tokens absent from the intrinsic region, required
masks-only tokens present) + 11 vitest pins wired into `orrery:check`/`orrery:build` after
`bl068-d7-asymmetry:check`; chain anchor BL-068 by self-checked fingerprint `b0d65bd6…`; the
Gate 3 receipt re-read interval-by-interval (per-edge rotateInterval 11/6 matched); memo
`plan/bl-070-d7-derivation-memo.md` (battery tables, near-miss anatomy, tie-break disclosure,
orbital-rotation refinement, branch classification, three-tier accounting). Fences: **D7
hypothesis-tier throughout** (no D7 claim event, no D7 record amendment, no D7 derivation
admission; ENTRY 15's D7 clause verbatim); no GOVERNS admission; no G1 movement; no INV-5
graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; the frame is
vocabulary, not input. `orrery:check` exit 0; suite 362 green (36 files); `validate:ledger-pins`
unchanged (pre-existing 13-violation BL-058 inventory, zero added); manifest regen.

---

### BL-071 [LANDED] — The interval-6 characterization: the tritone's role measured (mixed; GSL-4 candidate)

The tritone's role in the boundary geography, measured across **five universes
(D7-36, D6-tier, A1-28, A0-P7, D-anchor-49) x three distinct measures kept
separate (displacement 6 / rotation 6 / IC6 content)**. The measures disagree,
and the disagreement is the finding: **M-DISP** is a ti-pole-local
concentration (12/36 = 1/3 of the D7 domain vs the 630/6930 structural
baseline, TEST-1 p=5.3e-5; the fa-pole domain carries none, 0/28, TEST-2
p=3.8e-4) whose two recorded instances are exactly the terminal far contacts
127:253/4033:2017, while the fully excluded class is displacement 4 (0/12
recorded) — so **separation, not exclusion, and ti-specific, not
boundary-wide**; **M-ROT** is the boundary cycles' closure interval — the new
census discovery: **both boundary seven-cycles close at rotation 6** (the D7
modal orbit 4033→127—the landed refinement—mirrored by the A0 P7 ring
2773→1387; both Hamming-10), and **every one of the seven D-tier anchor
families carries at least one rotation-6 pair (12/1176, TEST-3 p=4.7e-8)**;
**M-IC6** carries no boundary signature (the boundary is IC6-poor; TEST-4).
**The 7-27/7-31 split is NOT tritone-structured** (0 swap / 0 rotation-6 / 0
complement across all 196 cross pairs; min Hamming 4 — the split follows class
identity, the tritone entering only as the classes' IC6 content contrast 1 vs
3). **The lifted representation is exact**: the fa/ti endpoints 1387/2773 are
rotation-6 partners with root-coherence (1→7), so
`lifted(2773@(p+6)) = T_6(lifted(1387@p))` for every phase — universal across
all 126 ledger rotation-6 pairs. **Role verdict: `mixed`** (separation /
transition / none per measure) from the closed vocabulary; **no mechanism
claim**. **Grounding correction (maintainer-prose class):** the approved B2
pre-registration claimed 2 instances at displacement 6 in the D4 domain —
the bytes say **0/28** (the 2 tritone-displaced instances are D7 facts); the
baseline slot and Fisher tables are exactly as pre-registered, only the prose
value corrected (V-BL-071-3). T-1/T-2 re-verified key-for-key from the landed
BL-070 bytes; **T-3 carried as labelled `[HYPOTHESIS]` framing and excluded
from the verdict** (OD-71-2 — the triangulation stated as two landed + one
framed). **GSL-4 recorded as an un-promoted candidate** (OD-71-5).

**Landed 2026-10-11:** generator `scripts/build-bl071-interval-6-structure.mjs`
+ artifact `orrery/src/generated/bl071-interval-6-structure.v1.json`
(fingerprint `8b2a1f6c…`, raw-byte `80a98540…`) + independent validator (34
artifact-drift + 5 smuggled-read + 5 presence-strip probes rejected; two-sided
census-core static check) + 11 vitest pins wired into `orrery:check`/
`orrery:build` after `bl070-d7-derivation:check`, before `derived-path-graph:check`;
chain anchors by self-checked fingerprint (BL-070 `9db10a08…`, BL-068
`b0d65bd6…`, D4 hunt `8a1295ca…`, Phase A probe `c8271c20…`); Gate 3 receipt
re-read interval-by-interval; memo `plan/bl-071-interval-6-memo.md` (the 5×3
census table, the two-baseline Fisher comparison, the split geometry, the
lifted congruence, the role verdict, the GSL-4 draft). Fences: **no mechanism
claim**; D7 hypothesis-tier throughout; no claim event, no record amendment,
no governs admission, no directional-semantics assignment, no G1 movement, no
INV-5 graduation, no M-walkability promotion, no canonical/Court/schema/Neo4j
writes; the frame is vocabulary, not input. `orrery:check` exit 0; suite 373
green (37 files); `validate:ledger-pins` unchanged (13 pre-existing, zero
added); manifest regen.

---

### BL-072 [DONE] — C-TB-1's mechanism question (the composite's why): the orbit-window two-regime characterization — the verdict set

The min-|Δ| + census composite selects 14/0/0/22 masks-only (UNPROMOTED per
OD-70-5). The composite separates; its mechanism is unexplained. The interval-
transport finding (BL-070: the modal orbit's rotations exist at interval 6)
and the near-miss anatomy (the tritone terminals) suggest the composite's
separation power lives in the interval-6 structure. Investigate: why does
min-|Δ| + census separate? Feeds the C-TB-1 promotion decision and the
governs semantic layer's mechanism inventory.

**Landed 2026-10-13 (planning evidence; rulings OD-72-1…OD-72-6 executed; the
four hypotheses pre-registered non-exclusive):** the composite-mechanism
investigation — artifact `orrery/src/generated/bl072-composite-mechanism.v1.json`
(fingerprint `45d0afd1…`, raw-byte `8a06eaee…`) + generator
`scripts/build-bl072-composite-mechanism.mjs` + independent validator (64
mutation probes rejected + region-scoping probes; two-sided static region
check) + 11 vitest pins wired after `bl078-d7-retest:check` + memo
`plan/bl-072-composite-mechanism-memo.md`. **Grounding:** the 36-instance
domain re-derived and set-equal the landed BL-070 domain; the 14 contacts;
the composite's landed confusion (14/0/0/22) and the near-miss bytes matched
fail-loud. **Per-term:** Term-A `[|ΔpcSum| = 1]` 12/0/2/22 + Term-B
`[reach-singleton]` 2/0/12/22 = the joint 14/0/0/22; the terms are **disjoint**
(12 + 2 = 14; exact residual; whole-pair respect). **The geometric finding
(H-Geometric SUPPORTED, production NOT ESTABLISHED):** the D7 orbit induces a
**consecutive-window ladder** on the satellite reach census (windows of size
1/2/3; the per-anchor 4/5/6/6/6/5/4 is the window-overlap structure); the
size-1 terminals are exactly the reach-singletons `127:253`/`4033:2017` (an
inversion pair at the orbit's poles; displacement 6 = the closure interval on
the unique `^6` edge `4033→127`); the interior carries the 12 semitone
contacts — the composite is the **interior regime ∨ the terminal regime**;
the ladder is inversion-symmetric (`k → 6−k`; anchors paired at summed index
6; `3599` self-paired) and the orbit's ledger offices step `+2 mod 7`
uniformly. **The permutation (H-Artifact REFUTED; OD-72-2):** 0/1000
fixed-margin shuffles reproduce the separation; TP histogram peaked at 5–6
(max 9), central 95% interval [3, 8], observed TP = 14 outside; exact
supplementary value 1/C(36,14) = 1/3,796,297,200; the **selection-effect
disclosure carried verbatim**. **The cross-domain read (H-Informational
SUPPORTED, attribution INDETERMINATE; OD-72-1):** Term-A on the class-mixed
fa-pole table (BL-055 `6d11fd93…`) is **12/12/2/2** — it selects both classes
in equal number (12 + 12); Term-B `NOT-APPLICABLE` (no landed reach-census
counterpart; never constructed); the composite's separation does not survive
cross-domain. **The minimality enumeration (H-Primitive SUPPORTED,
language-relative; OD-72-4):** nine canonical singles — clean 0; 36 pairwise
disjunctions — exactly two clean (`P3+P9`, `P5+P9` = one equivalence class
under P3 ≡ P5); the composite is the **unique minimal description (up to
degeneracy)** within the tested language. **Verdict set (non-exclusive):**
H-Geometric SUPPORTED / H-Informational SUPPORTED / H-Artifact REFUTED /
H-Primitive SUPPORTED. **GSL treatment (OD-72-6):** the GSL-4 annotated
refinement recorded inline, unapplied; the **GSL-7 candidate draft
(un-promoted)** — the composite's separation as the reach-geography's
two-regime rule; registration none performed. Fences: no new measurement;
no mechanism (causal) claim beyond the verdict set (production NOT
ESTABLISHED); no C-TB-1 promotion (status unchanged `UNPROMOTED_DISCOVERY`);
no claim event; no record amendment; no GOVERNS admission; no G1 movement;
no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/
Neo4j writes; D7 hypothesis-tier throughout; session prose is context, not
evidence. `orrery:check` exit 0; suite green; `validate:ledger-pins` PASS;
manifest/checksums regen.

---

### BL-073 [DONE] — The dual seven-cycle closure at rotation 6

Both boundary seven-cycles (the D7 modal orbit, the A0 P₇ ring) close at
rotation 6, both at Hamming 10 — the boundary layer's two seven-structures
share their closure geometry. Characterize: is the shared closure an isometry
(the two cycles are the same structure in different universes), a
phase-relation (the cycles' closure points are phase-related), or
coincidental? Feeds the boundary geography's characterization and the
governs semantic layer's structural entry.

**Landed 2026-10-11 (planning evidence; measurement + definition, one pass, two deliverables;
rulings OD-73-1…6 + build notes R1/N1/N2 executed):** the isometry probe + the synthesis
scoping — artifact `orrery/src/generated/bl073-isometry-probe.v1.json` (fingerprint
`811fa786…`, raw-byte `2dca3e8b…`) + memo `plan/bl-073-dual-cycle-isometry-and-synthesis-scoping.md`.
**Probe result `PARTIAL_ISOMETRY`** (pre-registered properties, both cycles derived masks-only
and cross-checked key-for-key against the landed records): **P1 PASS** (identical 21-pair
Hamming histograms `{2:6,4:5,6:4,8:3,10:3}`); **P2 FAIL strict** (directed rotation intervals
`{11:6,6:1}` vs `{7:6,6:1}`; closures coincide at `^6`; 0/14 dihedral + 0/5040 symmetric
witnesses) with the **two-interval structural parallel** recorded (six uniform path edges +
one distinguished `^6` Hamming-10 closure — both cycles); **P3 PASS** (distance matrices
isomorphic under exactly two witnesses, both dihedral: `φ-1 = r0` rotation/even/0 inversions —
the identical-reindexed reading — and `φ-2 = refl6` reflection/odd/21 inversions — the chiral
reading; N2 fork recorded, both readings coexist); **P4 PASS** (uniform tritone marking, every
node IC6=1; full interval-vector contrast `<654321>` vs `<254361>` recorded as context).
Phase-relation secondary: both witnesses map the D7 closure pair `{4033,127}` setwise onto
the A0 closure pair `{2773,1387}` (the BL-071 lifted-congruence endpoints; cited, no new
computation); neither witness rotation-induced. **Binding gate:** the GOVERNS interpretation
stays separately gated — measurement only, no claim. **Scoping:** the four landed properties
(polarized/asymmetric/invariant/tritone-structured, each cited) define the boundary object;
six candidate object types C1–C6 stated with falsification shapes and none endorsed
(manifold / fiber bundle / graded algebra / category / new structure / **unity reduction**);
the isometry registered as the object's first structural probe; the scaling statement (70-bridge
switchboard → 330↔462 → seven-structures) stated, not pursued; membrane boundary stated.
**Unity hypothesis status: CONSTRAINED** (3-of-4 pass; the P2-only failure localizes
independence to the interval layer; distance/marking layers shared). Fences: no claim event,
no record amendment (ENTRY 10/15/16 byte-untouched), no GOVERNS admission, no G1 movement, no
INV-5 graduation, no M-walkability promotion, no directional-semantics assignment, no
canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; generator + independent
validator (44 mutation probes rejected) + 11 vitest pins; `orrery:check` exit 0; ledger-pins
unchanged (13 pre-existing, zero added); manifest/checksums regen.

---

### BL-074 [DONE] — The three-measure disagreement's mechanism

M-DISP, M-ROT, and M-IC6 measure "tritone" differently and disagree
structurally (M-DISP ti-local, M-ROT anchor-distributed, M-IC6 graded
fa-rich/D7-poor). Characterize: what does each measure actually measure
(substitution distance, rotational closure, content density), and what
does their disagreement imply about the boundary layer's structure?
Feeds GSL-4's refinement and the governs semantic layer's mechanism
inventory.

**Landed 2026-10-11 (planning evidence; memo-only per OD-74-5; OD-74-1's Descriptive-Read
boundary — the census's witness lists are the population; no new measurement, no new universe
enumeration, no new pair discovery):** the tritone anatomy characterized read-only from the
BL-071 census — memo `plan/bl-074-tritone-anatomy-memo.md`. **W-1 (M-DISP, substitution):** all
12 D7-36 disp-6 instances are 7-1↔7-2 single-pc complement swaps (dPcSum 6), office-blind; the
fa-pole domain substitutes at ±1 only (0/28) — the contact-layer substitution tritone is
ti-pole-local. **W-2 (M-ROT, rotation):** all 12 D-tier anchor rot-6 pairs are same-tier/
same-class T⁶ mappings; both seven-cycles close at rot-6 Hamming-10 (`4033:127`; `1387:2773`);
rotation appears in no contact domain; the **D2 dual-phenomenon trio** (`471:1479`, `2283:2787`,
`3189:3441`) satisfies M-ROT and M-DISP simultaneously — the overlap zone, named. **W-2b
(decomposition, OD-74-2 required):** the 15 D-anchor disp-6 pairs = 6× fa↔ti + 6× D1↔D5 +
3× D2↔D2 — "ti-local" is true at the contact scale, incomplete at the anchor scale. **W-3
(M-IC6, content):** IC6 tracks set-class exactly (7-31/7-15 → 3; 7-8/7-34/7-22/7-Z12 → 2;
7-1/7-2/7-27/7-35/7-Z17/7-Z37 → 1); office carries no signal; the fa-domain is rich via its
7-31 satellite family, D7 poor via its 7-1/7-2 classes. **W-4 (the mechanism's shape):** the
**relational–relational–internal trichotomy** — two pairwise phenomena (substitution at the
contact layer, rotation at the anchor layer) and one internal phenomenon (content in the
composition layer); *distinct distributions, overlapping instances*; the disagreement is
distributional, not logical. **W-5:** GSL-4 refined to an annotated sub-entry (no status
change, no new GSL number; inline, unapplied). Lens coda recorded template-bound (OD-74-6).
Fences: no new measurement; no mechanism claim (the why stays open — recorded, not closed;
BL-072's family); no claim event; no record amendment; no D7 movement (hypothesis-tier
preserved); no governs admission; no directional-semantics assignment; no G1 movement; no
INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; session
prose is context, not evidence.

---

### BL-075 [DONE] — The coordinate transformation search (D₇ ^11 ↔ A₀ ^7)

The BL-073 isometry returned PARTIAL_ISOMETRY (P1/P3/P4 shared — distance geometry and mark;
P2 divergent — rotational addressing: D₇ paths at ^11, A₀ paths at ^7, closures coinciding at
^6). The disposition's leading interpretation (Reading 1, the coordinate-system reading): the
two cycles are one structure in two coordinate systems. Test: find (or fail to find) a
coordinate transformation mapping the D₇ addressing to the A₀ addressing — the transformation
that carries ^11 edges onto ^7 edges while preserving the shared P1/P3/P4 structure. Existence
confirms the coordinate-system reading; failure supports the independence reading (Reading 2);
a partial transformation constrains the unity hypothesis further (Reading 3). Feeds the
boundary object's definition (whose candidate C2 fiber-bundle reading predicts the interval
parameter as a fiber coordinate) and the synthesis's leading interpretation. Pre-registration
required: the transformation class (whole-set rotations? phase shifts? κ conjugations?), the
preservation set, and the branch table — no unregistered hunting.

**Landed 2026-10-12 (planning evidence; the planning pass's necessity proof pre-registered as
the primary hypothesis; rulings OD-CT-1…7 executed):** the coordinate search — artifact
`orrery/src/generated/bl075-coordinate-search.v1.json` (fingerprint `88838e22…`, raw-byte
`1cb710d8…`) + generator + independent validator (61 mutation probes rejected; two-sided
census-core static check) + 11 vitest pins wired after `bl073-isometry-probe:check` + memo
`plan/bl-075-coordinate-search-memo.md`. **Result `CHIRAL_PAIR`** (with
`COORDINATE_MAP_FOUND`): the 48-map Aff(Z₁₂) census returns exactly two setwise carriers —
**`T1 = x→5x`** maps the D₇ directed cycle (`^11` path + `^6` closure) onto the A₀ directed
cycle (`^7` path + `^6` closure) edge-for-edge, and **`T2 = x→7x = ρ∘T1`** maps it onto the
A₀ reversal (`^5` path; closure `^6`); the **L0 rotation class is empty (0/12)** — the brief's
candidates (a)/(b) falsified by construction and mechanically. **The necessity proof confirmed
by computation:** `11u ≡ 7 (mod 12)` selects `u = 5` uniquely among the units {1,5,7,11} (the
closure `6u ≡ 6` is auto-preserved) — **the transformation is canonically determined**; the
carrier set's composition closure is the **Klein-4** unit subgroup `{1,5,7,11}` (all
involutions, commutative; the working set itself not closed: `T1∘T1 = id`, `T1∘T2 = ρ`).
**Reflection sub-tests verified:** pc-level `T2 = ρ∘T1` (carriers' composition = the
pitch-circle reflection) and index-level alignment with the landed witnesses (T1 ↔ φ-1/r0/
even/forward; T2 ↔ φ-2/refl6/odd/reversed). Derived cycles cross-checked key-for-key against
BL-073/BL-071/BL-070/Gate-3. **The PARTIAL_ISOMETRY's interpretation resolves: the boundary
layer's two seven-cycles are one structure in two canonically related coordinate systems —
Reading 1 confirmed in its strongest form; the scoping's C6 unity hypothesis gains its first
structural confirmation** (memo §8 accretion: the canonicity sentence + the Klein-4 algebra;
build-time grounding correction, maintainer-prose class: "the two non-trivial elements T1/T2"
recorded as "the two setwise carriers", the third non-trivial element being `ρ = T1∘T2`).
Fences: no claim event; no record amendment (ENTRY 10/15/16 byte-untouched); no GOVERNS
admission; no GOVERNS authority change; no G1 movement; no INV-5 graduation; no M-walkability
promotion; no directional-semantics assignment; no C2 endorsement; no canonical/Court/schema/
Neo4j writes; D7 hypothesis-tier throughout; session prose is context, not evidence.
`orrery:check` exit 0; suite 395 green (39 files); ledger-pins unchanged (13 pre-existing,
zero added); manifest/checksums regen.

---

### BL-076 [DONE] — The coordinate-covariant bijection probe (the tier↔family correspondence's covariance)

BL-075's disposition register recorded the session-level hypothesis: the coordinate maps' action on the ten anchor families is a whole-block quotient involution (D₇↔A₀, D₆↔A₁, D₃↔D₄; A₂/D₁/D₂/D₅ fixed), identical for T1/T2 and trivial for {id, ρ} — the first mechanistic explanation for the measured tier↔family bijection (BL-061/062), explicitly "session-level, not artifact-backed … confirmation a separate probe." The probe tests the family-level involution (the strongest form, after the planning pass's grounding correction that the A-tier families are tier-specific: A0=7-35, A1=7-34, A2=7-33), the office-level action, the Klein-4 composition consistency, the Z-pair structure of the pairing, and the fa/ti crossing — fail-loud on fragments and ledger-absent images. Pre-registration required: the family-level expectation, the office-wholeness expectation, the Z-pair prediction, the branch table and the gates V-BC-1…4.

**Landed 2026-10-12 (planning evidence; rulings OD-76-1…4 executed; no claim event — the finding tier and the claim scope conditionally pre-authorized per OD-76-4):** the bijection probe — artifact `orrery/src/generated/bl076-bijection-probe.v1.json` (fingerprint `81e6cf72…`, raw-byte `74bcd025…`) + generator + independent validator (**81 mutation probes rejected** — 66 artifact-drift + 1 fingerprint-zero + 5 smuggled-read + 7 presence-strip + 2 verdict-logic, the ledger-absent and family-fragment fail-loud probes; two-sided family-core static check) + 11 vitest pins wired after `bl075-coordinate-search:check` + memo `plan/bl-076-bijection-probe-memo.md`; chain anchors by self-checked fingerprint (BL-075 `88838e22…`, BL-068 `b0d65bd6…`, BL-061/062 `e1b3f655…`). **Result `COVARIANT_CONFIRMED`; finding `probe-verified`.** The family-level permutation table (all 10 families × {T1, T2, ρ, ID}): **7-1↔7-35** (the closure pair), **7-8↔7-34** (the BL-068 contact-target pair), **7-Z37↔7-Z17** (the interior swap), fixed **7-22, 7-15, 7-Z12, 7-33**; identical for T1/T2, trivial for {ID, ρ} — the Klein-4 acts on the families through its two-element quotient; zero family fragments, zero office fragments, zero ledger-absent images, 40/40 blocks whole, expectation exact. The office-level table (all 21 A-tier anchors × 4 maps; complete tables in-artifact): every map's office action is a whole per-tier permutation — measured moved counts T1 56 / T2 52 / ρ 60 / ID 0 — **faithful**, strictly richer than the family action (whose kernel is {ID, ρ}). Composition consistency: family 160/160 + office 1120/1120 checks, zero mismatches (`T1∘T1 = T2∘T2 = ρ∘ρ = ID`, `T1∘T2 = ρ`). Interval structure: the pairing pairs the one IV-shared Z-partner pair (7-Z37↔7-Z17 within IV `[4,3,4,5,4,1]`) and IV-unique families with IV-unique families — the Z-pair prediction confirmed. Crossing: D7↔A0 and D6↔A1 present in both directions (plus the D3↔D4 interior swap). **Grounding corrections (bytes-class):** the A-tier carries tier-specific families (not a uniform 7-35); the ledger's family census is 38, not the briefed 66; the probe scope reframed to family level accordingly. Fences: **no claim event** (the expanded claim event's scope per OD-76-4 remains a maintainer decision); no record amendment (ENTRY 10/15/16 byte-untouched); no GOVERNS admission; no GOVERNS authority change; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no C2 endorsement; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; session prose is context, not evidence. `orrery:check` exit 0; suite 406 green (40 files); ledger-pins unchanged (13 pre-existing, zero added); prose-consistency unchanged (16, zero added); manifest/checksums regen.

---

### BL-077 [DONE] — The GSL-5/GSL-6 registration (the coordinate action's family- and office-level structures registered)

Fast-lane additive registration of **GSL-5** — the family-level involution (the coordinate maps' whole-block action on the ten anchor families: **7-35↔7-1** (the closure pair), **7-34↔7-8** (the contact-target pair), **7-Z37↔7-Z17** (the interior swap), fixing **7-33/7-22/7-15/7-Z12**; identical for T1/T2, trivial for {ID, ρ}; the Z-pair structure confirmed; the fa/ti crossing present) — and **GSL-6** — the coordinate action's office-level structure (faithful whole per-tier permutations; **Mercury the sole fixed point in every map and tier**; the 4+1 signature measured). **A registration of the landed finding** (BL-076, commit `3c6d404`), not new measurement: every registered claim cites `orrery/src/generated/bl076-bijection-probe.v1.json` (fingerprint `81e6cf72…`) and memo `plan/bl-076-bijection-probe-memo.md`. Grounding correction (maintainer-prose class): the disposition's office reading "the four elemental governors permute among themselves" is recorded as the measured six-office permutation around the fixed mediator (the permutation crosses the elemental/luminary brackets; e.g., T1: Jupiter→Moon, Sun→Mars).

**Landed 2026-10-12:** (1) synthesis `plan/bl-067-governs-semantic-synthesis.md` — §5 gains the coordinate-action block (GSL-5/GSL-6, after the interval-6 block); §7.3/§7.5/§7.6 registration notes; §8 mention. (2) comprehension map `plan/harmonic-comprehension-map.md` — §5.8 GSL-5/GSL-6 + the §4 consumption row. (3) scoping memo `plan/bl-059-governs-derivability-scoping-memo.md` — §4.11 accretion (evidence-for: the correspondence is coordinate-covariant). (4) this section + revision row v1.50. Registration only: no claim event, no record amendment, no GOVERNS admission, no finding-row status change; D7 hypothesis-tier throughout; session prose is context, not evidence. `validate:manifest` PASS; manifest/checksums regen.

---

### BL-078 [LANDED] — The D7 derivation re-test (office-purity route, region-scoped isolation): REPLICATED; the granted-dependence confirmed

The ti-pole's selection re-tested under stricter conditions (approved planning pass 2026-10-12, rulings OD-N0…OD-N3): the BL-070 battery re-run against the re-verified 36-instance domain with the **region-scoped input isolation** enforced — the derivation path (domain + the eight mask-geometric candidate predicates) reads zero granted-office bytes; R-OFF and C-M7 are labelled comparison-region reads; the validator proves the scan is region-scoped (permissive probe passes; proof-strip probe rejected). **BL-070's bytes frozen** (`9db10a08…`); the re-test is a distinct artifact consuming BL-068/BL-070 by fingerprint self-check only. **Calibration EXACT:** R-OFF `[office(s) = office(h)]` 14/0/0/22 on the verified domain (evaluated against the landed seat-contact relation, not its own definition). **The battery replicated exactly:** all nine candidates (C-M1…C-M9) side-by-side identical to the landed BL-070 confusions, verdicts, and distributions — cleanSplitCount 0; near-miss `|ΔpcSum| = 1` 12/0/2/22 missing exactly the terminal tritone contacts 127:253/4033:2017; the BL-068 zInterface axis matched (4/2/10/20); combination **C-TB-R1** (`min-|Δ| ∨ reach-singleton`) 14/0/0/22 recorded **UNPROMOTED_DISCOVERY** (OD-N2); invariants and the orbital-rotation refinement re-verified. **Comparison verdict `REPLICATED`** — the original findings are robust under the stricter enforcement; the isolation did not change what the candidates could see. **Branch `PARTIAL_DERIVATION`; interpretation `R_NONE`:** the office field is the selection's ground and joins the anchoring remainder (OD-N3 framing; not wall-dissolution, not governs-admission; scoping memo §5.1 intact).

**Landed 2026-10-12:** generator `scripts/build-bl078-d7-retest.mjs` + artifact `orrery/src/generated/bl078-d7-retest.v1.json` (fingerprint `11644d40…`, raw-byte `e9c3acda…`) + independent validator (**47 mutation probes rejected** — 35 artifact-drift + 5 smuggled-read + 6 presence-strip + 1 proof-strip; region-scoping probes: permissive pass + proof strip rejected) + 11 vitest pins wired into `orrery:check`/`orrery:build` after `bl076-bijection-probe:check`; chain anchors by self-checked fingerprint (BL-068 `b0d65bd6…`, BL-070 `9db10a08…`); Gate 3 receipt re-read interval-by-interval; memo `plan/bl-078-d7-retest-memo.md` (the side-by-side battery table, the comparison's meaning, the isolation block, the accounting). Fences: **D7 hypothesis-tier throughout** (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause verbatim); no GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; no BL-070 bytes changed; the frame is vocabulary, not input. `orrery:check` exit 0; suite 41 files / 417 tests green; `validate:ledger-pins` unchanged (13 pre-existing, zero added); manifest regen.

---

### BL-079 [DONE] — The BL-078 registration (the D7 replication-confirmation) + the GOVERNS derivation design specification (the planning pass's Track A + Track B)

**Track A — the registration (fast-lane additive).** The D7 derivation re-test's landing (BL-078: comparison verdict `REPLICATED`; branch `PARTIAL_DERIVATION`; interpretation `R_NONE` — the office field is the selection's ground and joins the anchoring remainder) is registered across the mutable documents: (1) synthesis `plan/bl-067-governs-semantic-synthesis.md` — §6 gains entry 6 (the D7 derivation status, replication-confirmed; cited to the BL-078 artifact) + §7.3/§7.5/§7.6/§8 registration notes; (2) scoping memo `plan/bl-059-governs-derivability-scoping-memo.md` — §5.1 accretion (obstruction-side: the replication strengthens the against column; the contrast reading stays intact) + §7 status update; (3) comprehension map `plan/harmonic-comprehension-map.md` — §4 consumption row + §5.9 (the replication-confirmed grant-dependence) + §5.5 receipts. Registration only: every claim cites `orrery/src/generated/bl078-d7-retest.v1.json` (fingerprint `11644d40…`) and memo `plan/bl-078-d7-retest-memo.md`; the registration adds no measurement. No GSL-5/GSL-6 re-registration (BL-077 stands; the grounding pass's correction of the brief's stale assumption). Canonical spelling `R_NONE` (alias `R-NONE`) per the landed bytes.

**Track B — the design specification.** `plan/bl-079-governs-derivation-design-spec.md`: the derived-input mapping across the frozen D4 pipeline's stages (S0–S5 equivalents; per-stage granted input → derived replacement → verification status), the remaining-grant verification (the pipeline consumes the A0/A1 anchor sets + tier/role partition, the orientation bit, and presentation conventions ⇒ **conditional green light** — the derivation runs on derived inputs *plus* the named anchoring remainder), the pre-registered success criteria (set-equal 14-key D4 contact geometry vs `qa/d4-production-receipt.json`; deviations are findings, not failures), the three-branch falsifiability structure, and the output contract. The design spec is planning evidence; **the derivation's implementation is a separate gate (Gate 2), separately authorized, and this pass performs no derivation execution**.

**Landed 2026-10-12:** synthesis + scoping memo + map + this section + `plan/bl-079-governs-derivation-design-spec.md`; revision row v1.53; manifest/checksums regen; `validate:manifest` PASS. Fences: no claim event; no record amendment (ENTRY 10/15/16/17 byte-untouched); no governs admission; no D7 movement (hypothesis-tier throughout); no anchoring-remainder resolution; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; the frame (§§2.6/2.7) is interpretation vocabulary; session prose is context, not evidence.

---

### BL-080 [DONE] — The GOVERNS derivation, Gate 2 (implementation): the re-specified stack — S0' assembly exact, predicate selection exact

**Gate 2 of the BL-079 design specification executed (rulings OD-80-1…OD-80-6).** The re-specified stack: generator `scripts/build-bl080-governs-derivation.mjs` + artifact `orrery/src/generated/bl080-governs-derivation.v1.json` (fingerprint `63699437…`, raw-byte `50735819…`) + independent validator `orrery/scripts/validate-bl080-governs-derivation.mjs` (**60 mutation probes** — 46 artifact-drift + 2 fingerprint + 10 smuggled-read/presence-strip/proof-strip rejected + 1 permissive probe passing; the region-scoping proof; two-sided static isolation) + 12 vitest pins wired after `bl078-d7-retest:check`, before `derived-path-graph:check`; chain anchors by self-checked fingerprint (BL-063 `6d33c67b…`, BL-064 `aa975820…`, BL-066 `94f0661f…`, BL-078 `11644d40…` isolation-pattern precedent, BL-055 `6d11fd93…` predicate source); memo `plan/bl-080-governs-derivation-memo.md`.

**Findings.** V-G2-1 — projection assembly set-equality PASS: the derived projection (κ + the seven constructor pairs + the 28-edge R structure + the labelled remainder: anchor identities, 42 edge ids) is set-equal to the frozen projection field-for-field (anchors 14/14, R 28/28, E 14/14; `missing []` / `extra []`; semantic and full-row), with `projectionDigests` equal to the frozen bindings — **the derived inputs are indistinguishable from the granted ones at the pipeline's interface** (the un-granting program's final validation). V-G2-2 — predicate selection set-equality PASS: `P(s) = [forte(s) = '7-27']` selects exactly the observed 14-key contact set (confusion 14/0/0/14; exactly 2 per office); the office-flatness calibration records the fa-side reading (28/28 satellites share their parent's ledger office — the office rule is degenerate on D4). V-G2-3 — orientation PASS: pair/edge/selection structures invariant; labels flip `c → 6-c` (14/14 label map; 28/28 cross-check vs BL-066's per-edge derived centers). V-G2-4 — isolation PASS: region-scoped, `grantedBytesInDerivationPath: 0`, four labelled licensed reads. V-G2-5 — frozen `validateProjection` PASS + digests equal the frozen bindings.

**S1'–S5' code paths landed and unexecuted** (the frozen pure modules imported verbatim; the re-specification confined to S0' assembly/selection). The conditional green light stated and mechanically enforced: the derivation runs on derived inputs **plus the named anchoring remainder** (the A0/A1 anchor sets + tier/role partition, the orientation bit, the presentation conventions) — not a full green light.

**Landed 2026-10-12:** generator + artifact + validator + 12 pins + wiring + memo `plan/bl-080-governs-derivation-memo.md` + this section + v1.54; `orrery:check` exit 0; suite 42 files / 429 green; `validate:ledger-pins` unchanged (13 pre-existing, zero added); `validate:manifest` PASS; manifest/checksums regen. Fences: no pipeline execution; no Gate 3 receipt; no claim event; no record amendment (ENTRY 10/15/16/17 byte-untouched); no GOVERNS admission; no anchoring-remainder resolution; D4 `derivable-via-R2` and D7 hypothesis-tier unchanged; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; frozen stack byte-untouched; the frame (§§2.6/2.7) is interpretation vocabulary; session prose is context, not evidence.

---

### BL-080 [DONE] — The GOVERNS derivation, Gate 3 (execution): `DERIVED_FROM_DERIVED_INPUTS` — the derived-input run reproduces the frozen result exactly

**Gate 3 of the BL-079 design specification executed** (the approved execution plan; the branch classification determined by the run). The single licensed run: `scripts/build-bl080-governs-derivation-execution.mjs` on the Gate 2 derived projection — pin + self-check (Gate 2 `63699437…`; chain anchors BL-063/064/066/078 + BL-055; frozen receipt `2057a757…` / generation `f9ab736e…` byte-pinned) → S0' reload (frozen `validateProjection`; digests equal the frozen bindings) → S1'–S3' the frozen pure modules imported verbatim (`generate`) → S4' `sealGeneration` under the frozen sealing context → S5' `compareSealed` with exactly one licensed canonical observation read (asserted) → `buildReceipt` recomputation → the full-field baseline comparison → the branch classification. Receipt `qa/bl080-governs-derivation-receipt.json` (raw-byte `b7f9bfbc…`; `executionFingerprint` `437de068…`; no timestamps — deterministic, byte-stable) + schema `schemas/bl080-governs-derivation-receipt.schema.json` + independent validator `orrery/scripts/validate-bl080-governs-derivation-execution.mjs` (**59 mutation probes** — 48 receipt-drift + 2 fingerprint + 4 smuggled-read/double-read + 3 presence-strip + 1 proof-strip rejected; 1 permissive region probe passing; the two-sided static isolation check) + 12 vitest pins wired after `bl080-governs-derivation:check`, before `derived-path-graph:check`; memo `plan/bl-080-governs-derivation-execution-memo.md`. Two fingerprints, never conflated: `implementationDigest` `2d53cee4…` (the Gate 2 file-set + the execution builder) and `frozenClosureDigest` `7ab950fa…` (the frozen sealing context).

**Findings.** G3-1 seal PASS: the derived-input generation seals under the frozen sealing context; `generationDigest` = the frozen `c4a7f48d…`. G3-2 PASS: exactly one canonical observation read (instrumented; the ledger/network sha binding asserted at the read — no double-read, no selective read). G3-3 PASS: the comparison block recomputes canonically through the frozen `compareSynthetic`; `--check` reproduces the receipt byte-for-byte. G3-4 PASS: the run's comparison block is **canonically equal** to the frozen receipt's comparison block field-for-field (9/9) with equal whole-block digests (`1f66764b…`) — the **full routeAccounting objects** compared: T-A `8 generated / 4 matched / 4 in-R-but-unmatched / 10 missed / 20 R-missed / 0 extra / restatement false`; T-B `28 = U / 14 matched / 14 in-R-but-unmatched / 0 missed / 0 R-missed / 0 extra / restatement true`; cells `0/10/4/0`; tC `A0:1387:2741:0` + `A0:1451:2773:6` exact; category `not_derived`. G3-5 PASS (not fired): no deviation. **Branch `DERIVED_FROM_DERIVED_INPUTS`** — the derived-input pipeline produces the identical result: the pipeline's semantics are independent of the inputs' provenance; the receipt carries `inputProvenance: "derived"` beside the frozen context. Controls ABSENT (documented; the frozen production run's 18 pre-flight controls not re-run).

**Landed 2026-10-12:** generator + receipt + schema + validator + 12 pins + wiring + memo `plan/bl-080-governs-derivation-execution-memo.md` + this section + v1.55; `orrery:check` exit 0; suite green; `validate:ledger-pins` unchanged (13 pre-existing, zero added); `validate:manifest` PASS; manifest/checksums regen. Fences: no Gate 4 amendment (a separate, later ceremony); no record mutation (ENTRY 10/15/16/17 byte-untouched); no claim event; no GOVERNS admission; no anchoring-remainder resolution; D4 `derivable-via-R2` and D7 hypothesis-tier unchanged; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; frozen stack byte-untouched (imported verbatim; never re-executed under its old freeze); the frame (§§2.6/2.7) is interpretation vocabulary; session prose is context, not evidence; the branch classification was determined by the run, never written toward an expected outcome.

---

### BL-080 [DONE] — The GOVERNS derivation, Gate 4 (record amendment): the D4 record amended additively toward `derivable-from-derived-inputs` — the corridor complete

**Gate 4 of the BL-079 design specification executed — the record amendment, the final gate of the corridor (the seventh ceremony).** ENTRY 18 (`provenance/DECISION_LEDGER.md`; span 3130-3330; region SHA-256 `9fb561f0…`/11950 line-join, `7ed4a45b…`/11951 keepends) appended as a **true end-append**: the historical `not_derived` record (ENTRY 10, `:2195-2252`; region `201efe81…`/3487 + `50b8b73f…`/3488) and the first amendment (ENTRY 15, `:2665-2810`; `derivable-via-R2`; region `26c0cb43…`/9342 byte-intact) stand untouched; prefix preservation proved (sha256 of the first 202266 bytes = `701ff300…`, the current pre-amendment authority; first 174314 bytes = `8b7084bc…`). The record is **linked, not rewritten** — three entries, three tiers, one story: `not_derived` (immutable) → `derivable-via-R2` (ENTRY 15) → `derivable-from-derived-inputs` (ENTRY 18). The ledger's own history, three SHAs: `8b7084bc…` (174314) → `e551850c…` (183663) → `701ff300…` (202266).

**The amendment's distinguishing evidence (provenance-independence).** The D4 record's original `not_derived` outcome was derived under granted inputs; this corridor's re-derivation ran under derived inputs (`grantedBytesInDerivationPath: 0`, mechanically enforced by the two-sided static isolation check; 59 mutation probes rejected; one licensed observation read, asserted) and produced the identical comparison block — field-for-field, digest-for-digest (`1f66764b…`, 9/9; seal `c4a7f48d…` matching the frozen receipt's seal) — proving the record's resolution is independent of the inputs' provenance, and completing the un-granting program's arc from granted architecture to derived architecture. **The first amendment in project history with this property.**

**Compliance receipt:** `qa/specs/bl-080-d4-record-amendment.json` — R1–R6 per-rule with the observed-vs-declared split; the corridor's complete evidence chain as citations (Gate 1 `6908e7b`/`ead2eec`; the BL-057 Gate 2 contract `5528510b…`; this corridor's Gate 2 `63699437…`; Gate 3 `b7f9bfbc…`/`437de068…`; the un-granting program `6d33c67b…`/`aa975820…`/`94f0661f…`; BL-075 Klein-4 `88838e22…`; BL-073 PARTIAL_ISOMETRY `811fa786…`; BL-055 predicate `6d11fd93…`; the three motivation legs; the frame §§2.6/2.7); the maintainer attestation (all six OD-80-4 rulings + the significance-sentence addition); the predeclared gates; the point-(c) post-commit obligation.

**Un-granting program completion recorded.** The chain is complete: Phase 1 κ (BL-063), Phase 2 cycle-ground (BL-064), Phase 3 R-edges (BL-066), the Gate 2 derived-input assembly, the Gate 3 execution (`DERIVED_FROM_DERIVED_INPUTS`), and now the record amendment. The result is on the record: the architecture derived from its own machinery, the derivation executed on derived inputs, the comparison identical.

**Follow-on pointers (no new captures).** BL-058 (the ledger-pin inventory repair, queued); the D7 open items (hypothesis-tier; the ti-pole's selection granted-dependent — BL-070/BL-078, C-TB-R1 un-promoted); the anchoring remainder (anchor sets + tier/role partition, the orientation bit, presentation conventions — ENTRY 16/17 carried); the GOVERNS admission question (derivability admitted; authority untouched); the directional-semantics gate.

**Landed 2026-10-12:** ENTRY 18 + compliance receipt + this section + revision row v1.56 + refreshed inventories; `orrery:check` exit 0; focused checks PASS (Gate 2/Gate 3 validators, the BL-057 Gate 3 receipt check, pins/prose unchanged); full `npm run validate` observed first stop `validate:ledger-pins` (pre-existing 13, recorded not repaired; BL-058); `validate:manifest` PASS. Fences: no governs admission; no wall-dissolution claim; no D7 movement; no G1 movement; no INV-5 graduation; no M-walkability promotion; no anchoring-remainder resolution; no canonical/Court/schema/Neo4j writes beyond the ledger's own append; ENTRY 10/15 bytes immutable; the frame is interpretation vocabulary; session prose is context, not evidence; **the amendment records the derivation's result — it does not admit the GOVERNS relation, dissolve the wall, or resolve the remainder.**

---

### BL-081 [DONE] — Evidence-binding infrastructure: the advisory validator (the convention's §3.2 follow-up) + the BL-058 pin migration (13 → 0)

The convention's §3.2 named follow-up — `scripts/validate-evidence-bindings.mjs` and `validate:evidence`, advisory-first, "authoring, tests and wiring occur in a separate work item" (`provenance/EVIDENCE_BINDING_CONVENTION.md:342-355`) — executed together with the BL-058 repair (above) in one landing, so the migrated pins are born under their own enforcement.

**Landed 2026-10-12 (planning evidence; advisory-first; no claim event, no record amendment — ENTRY 10/15/16/17/18 byte-untouched):** the validator `scripts/validate-evidence-bindings.mjs` (+ 9 tests in `scripts/validate-evidence-bindings.test.mjs`) enforcing R1–R6 over a bounded registry (convention chain + registered binding sidecars + the 29 machine-emitted evidence artifacts): R1 committed-bytes binding reproduction (`git cat-file` over HEAD blobs; recipe/digest/byteLength/blobOid) — 2 PASS; R2 entry-scoped ledger span verification (source, entry identities, bounds, prefix digest over `[0, offset+length)`) — 1 PASS (its first live consumer: the migrated BL-058 binding); R3 payload/provenance separation (canonical fingerprint recomputation) — 1 PASS; R4 named digest recipes (pinned blob resolves + range + committed-history occurrence) — 1 PASS; R5 generator-provenance records — 29 findings (23 enforced post-cut artifacts carry a generator path only; 6 pre-cut artifacts carry no record — advisory-only); R6 inventory registration (MANIFEST + CHECKSUMS) — 0 findings after the landing regen. **The session classifier** resolves the cut line by content (first addition of the ENTRY 12 marker → `6e3607b`, never embedded in code) and classifies per-artifact first-appearance: at-cut 3 (the convention's own admission artifacts, enforced per §0.3), pre-cut 6 (advisory-only), post-cut 23 (enforced), unresolved 1 (the new sidecar, pre-commit). Advisory exit 0; `--strict` exit 1 on enforced findings; `--json` deterministic. Wiring: root `validate:evidence`; `orrery/package.json` `evidence-bindings:check` at the check/build chain tails. **Zero-regression:** all five corridor generator outputs byte-identical to their pre-registered baselines (phase-c-probe `48d460a2…`; selection-review `40a1d758…`; route-review `5a1a787e…`; contract `8b269412…`; execution-receipt `7e14cbbc…`), all `--check` exit 0; `validate:ledger-pins` 13 → 0; `orrery:check` exit 0; suite 43 files / 441 green; full `npm run validate` observed first stop `STALE_TWIN_HUB_CONVERGENCE` (predeclared; the chain now passes `validate:ledger-pins`); `validate:manifest` PASS (1,319 files). **Enforcement-gap finding recorded:** the corridor generators' pins predate the convention's validator — a known enforcement gap (§3.3 advisory-first, §3.2 deferred); the convention's admission didn't include the enforcement machinery, and the corridor's artifacts were born during that gap. Fences: no twin-hub refresh (BL-051), no promotion refresh (BL-052), no green release (BL-053), no gate promotion (advisory-first); no twin-hub consumer-schema migration; no canonical/Court/schema/Neo4j writes; frozen D4 stack byte-untouched; session prose is context, not evidence. Record: memo `plan/bl-081-evidence-binding-validator-and-pin-migration.md`.

---

### BL-084 [DONE] — The window-ladder structure: the D₇ orbit's consecutive-window geometry — the generalization verdict (boundary-layer-conditional)

BL-072's geometric mapping discovered that the D₇ modal orbit induces a
consecutive-window ladder on the D6 satellite layer: each anchor's H2-reachable
satellites form a consecutive window [a,b] on the orbit, with per-anchor reach
counts = window-overlap counts (4/5/6/6/6/5/4). Term-A selects the interior
windows' semitone substitutions; Term-B selects the terminal windows' inversion
poles. The composite = interior regime ∨ terminal regime. Characterize: is the
window-ladder structure unique to the D₇ orbit, or does it generalize to other
cycles in the topology? Feeds the boundary geography's completed characterization
and the governs semantic layer's structural inventory.

**Landed 2026-10-13 (planning evidence; rulings OD-84-1…OD-84-5 executed; the full sweep A+B+C+D; OD-84-5: the calibration-as-reference-implementation discipline — one window-detection code path for the calibration and every generalization test):** generator `scripts/build-bl084-window-ladder.mjs` + artifact `orrery/src/generated/bl084-window-ladder.v1.json` (fingerprint `6865b076…`, raw-byte `88c1a92f…`) + independent validator (50 artifact-drift mutation probes + 20 static/presence-strip rejections + 1 region-scoping proof-strip rejection; 1 permissive probe passing; the two-sided static region check) + 12 vitest pins wired after `bl072-composite-mechanism:check`, before `bl080-governs-derivation:check`; chain anchors by self-checked fingerprint (BL-072 `45d0afd1…` frozen, BL-073 `811fa786…`, BL-055 `6d11fd93…`, BL-066 `94f0661f…`, d-tier operator probe `068f9007…`, derived-path-graph `4c7abcb1…`); memo `plan/bl-084-window-ladder-memo.md`. **The calibration gate — EXACT:** the D₇ orbit × D6 layer re-derived through the shared window machinery matches BL-072's `geometricMapping` **field-for-field** (14 windows, sizes `{1:2, 2:2, 3:10}`, per-anchor `4/5/6/6/6/5/4` = overlap counts, terminals `253`/`2017`, mirroring, `^6` closure). **Scope A (the A₀ ring × the full 28 A1 satellites; OD-84-3):** **PARTIAL / SLIDING_ONE_REGIME** — 12 satellites each reached by exactly one ring edge (12 consecutive size-2 windows; per-anchor `2/4/4/4/4/4/2`; mirror true; no terminals); overlay (comparison-only): the reached set is sound (0/14 unobserved) and set-equal to the **BL-055 cornerstone near-miss selection** (12 keys; misses `2395`/`2899`, the zero-seam pair). **Scope B (the D-tier cycles; B1 all-ledger reach uniform 30/anchor for all ten M-cycles; B2 the layer found empirically):** D7 **FULL** (D6 layer); D1/D3/D4/D5/D6 **PARTIAL** (singleton partitions — no overlap structure); **D2 ABSENT** at the top layers (A2/D2 non-consecutive; a lower A0 layer is a singleton partition). The D₇ orbit is the only D-tier cycle with a sliding layer. Supplementary A-tier census: the A0 ring's own-tier layer is **FULL** (`{1:28, 2:10}`), its A1 layer the Scope A sliding variant; the A1 cycle top-layer ABSENT; the A2 cycle all-ABSENT; exactly **two of ten** M-cycles slide — the **dual-closure pair** (D7, A0), the only two-interval orders (`^11`/`^7` path + `^6` closure). **Scope C (the composed graph's operator layer — all 476 directed cycles over the 60 catalog edges; all edges Hamming-2, inverse-paired; no length-7 cycles):** **14 directed (14 unordered) cycles slide**, lengths 4/10/12, each in exactly one orientation; 462 non-consecutive. **Scope D:** (a) length-7 **REFUTED** (neither necessary nor sufficient); (b) ratio **REFUTED** (same-ratio layers carry different verdicts); (c) uniform all-ledger reach **SUPPORTED (property), non-discriminating**; (d) Hamming-2 generality **REFUTED as stated** (necessary in the data, not sufficient). **Synthesis: `BOUNDARY_LAYER_CONDITIONAL`** — not universal, not D₇-specific; the principle is **reach-order alignment**; the D₇ orbit's special property is its dense class-pure D6 layer (BL-068) turning its two-interval order into the FULL two-regime ladder with tritone terminals. GSL treatment: the **GSL-4 generalization refinement inline, unapplied**; no new GSL entry; no registration. Fences: no new measurement beyond masks-only Hamming-2 reach arithmetic (BL-070 precedent); no mechanism claim; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; session prose is context, not evidence. `orrery:check` exit 0; suite 45 files / 464 green (12 new pins); `validate:ledger-pins` PASS; `validate:prose-consistency` PASS; `validate:manifest` PASS; manifest/checksums regen.

---

### BL-085 [DONE] — The BL-084 registration sweep + the alignment principle's first prediction (the post-BL-084 planning pass, two phases)

**The program** (rulings OD-P2-1…OD-P2-6): Phase 1 — the fast-lane synthesis accretion of BL-084's window-ladder geometry (the synthesis §5 geography block, the scoping memo §4.13 evidence accretion, the map §5.10 + §4 consumption row, the G-9 reconciliation); Phase 2 — the first *predictive* use of the reach-order alignment principle, tested against BL-072's open Term-B confound (the fa-domain postdiction; the five D-tier PARTIAL predictions; the D₇ control; the pre-registered refutation conditions). The prediction, stated before any computation: **Term-B's inapplicability on the fa domain is a consequence of the alignment principle** — the fa domain scores PARTIAL (sliding one-regime, no terminals); FULL-with-terminals is the sole applicability trigger (OD-P2-6); therefore NOT-APPLICABLE. If the prediction holds, the attribution moves from INDETERMINATE to alignment-conditional; either outcome is a finding. Fences: no new measurement; no claim event; no record amendment; no G1 movement; no governs admission; production questions stay open throughout; D7 hypothesis-tier.

**Phase 1 landed 2026-10-14 (registration, fast-lane additive; every added claim cites `orrery/src/generated/bl084-window-ladder.v1.json` — fingerprint `6865b076…` — and `scrum/plan/bl-084-window-ladder-memo.md`):** (1) synthesis `plan/bl-067-governs-semantic-synthesis.md` — §5 gains the window-ladder geography block (the boundary-layer-conditional verdict; the reach-order alignment principle with the descriptive-not-production qualification carried verbatim; the dual-closure pair; the D₇ special property — the dense class-pure D6 layer; the 14/238 unordered operator rarity), §7.3/§7.5/§7.6/§8 registration notes. (2) scoping memo `plan/bl-059-governs-derivability-scoping-memo.md` — §4.13 accretion (evidence-for: the boundary geography's reach structure is alignment-conditional, not universal — Shows/Does-not-show), §7 status update 2026-10-14, §8 accretion note. (3) comprehension map `plan/harmonic-comprehension-map.md` — §5.10 block + §4 consumption row (OD-P2-3, the BL-077 precedent — the triple stays in sync). (4) the BL-084 memo gains the G-9 prose-correction note: the artifact's `gslTreatment` one-liner "7 of 238" vs the authoritative `scopeC.aggregate.slidingUnorderedCount` = 14 (OD-P2-5; artifact bytes unchanged). Registration only: no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no finding-row status change; no G1 movement; no INV-5 graduation; no M-walkability promotion; D7 hypothesis-tier throughout; session prose is context, not evidence. `validate:manifest` PASS; manifest/checksums regen.

**Phase 2 landed 2026-10-14 (the prediction test — memo-only per OD-P2-4; the pre-registration fixed before any computation; no machine-checkable artifact — the escalation was not triggered):** memo `plan/bl-085-alignment-prediction-memo.md`. The prediction: **Term-B's inapplicability on the fa domain is a consequence of the alignment principle, not a confound.** The pre-registered table (core 7 + Tier-4 appendix per OD-P2-1; the D2 top-layer grain per OD-P2-2; refutation conditions (a)–(d); the scoring method re-deriving each domain's alignment verdict from the landed census fields by the OD-84-4 rule; the applicability rule per OD-P2-6 — FULL-with-terminals the sole trigger; the sliding-PARTIAL vs. singleton-PARTIAL distinction named). **Results — the core 7 holds, 7/7:** the re-derivation audited all 546 stored layer verdicts with 0 mismatches; the fa census (12 windows, all size 2, zero size-1) shows the predicate selecting 0/12 — the recorded NOT-APPLICABLE now structurally explained (not merely the OD-72-1 data-availability reason); the five D-tier PARTIAL domains land the predicted NOT-APPLICABLE (whole-layer restatement — the too-fragmented shape; predicate 24/24, 24/24, 24/24, 24/24, 36/36); the D7 control's 2/14 proper-subset selection is the realized D7 role (BL-072 2/0/12/22). **No refutation condition fires.** The BL-072 attribution refines from INDETERMINATE to **alignment-conditional** (the reach-geometry side suffices — the named confound dissolves as stated; the production direction stays open). Appendix: 3 rows hold (D2/A1/A2 — fragmented, no ladder, with the pre-registered sensitivity note on the mechanical proper-subset firing), 1 live unobserved prediction (the A0 own-tier layer — FULL-with-terminals predicts Term-B applicability; the concrete checkable follow-up), 1 alignment-half row (the 14 operator sliders — no contact domain). The G1 scoping sketch (questions only): the alignment vocabulary mapped onto BL-024 — candidate addressing cycles, candidate layers, reach-for-intra-family-hops; the central observation: on the 330 side the reach measure and the edge rule are the same choice viewed twice; FULL ⇒ an alignment-privileged edge rule exists; PARTIAL/ABSENT ⇒ no alignment purchase. **The alignment principle's status: descriptive characterization → predictive within the tested topology** (the directive's "mechanistic" sense — it predicts, not merely describes; the causal/production question remains open — no mechanism claim beyond the verdict). Fences: no new measurement; Term-B never constructed where NOT-APPLICABLE (the inapplicability is the datum); no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no new GSL number; no C-TB-1 promotion; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; D7 hypothesis-tier throughout; the frame is interpretation vocabulary; session prose is context, not evidence. `validate:manifest` PASS; `validate:prose-consistency` PASS (0 violations); `validate:ledger-pins` PASS; manifest/checksums regen.

---

### BL-086 [DONE] — The A₀ own-tier Term-B test: the alignment principle's live prediction (CONFIRMED) + the A1-top-A2 discriminating experiment (Branch L: the principle predicts the ladder)

**The program** (the directive's sprint; rulings OD-1…OD-4 approved 2026-10-14): BL-085's one live prediction — the A₀ own-tier layer (FULL / TWO_REGIME, `{1:28, 2:10}`) would show Term-B applicable with a 28/38 proper-subset selection — computed on the landed census, with the A1-top-A2 case (same histogram, no ladder) as the pre-registered discriminating experiment between the histogram-tracking and ladder-tracking readings of the reach-order alignment principle. Fences: no new measurement (the window re-derivation is the OD-1 descriptive-read over landed bytes); memo-first (OD-2: artifact-on-Branch-X-or-refutation); no claim event; no record amendment; no GOVERNS admission; no G1 movement; D7 hypothesis-tier throughout.

**Landed 2026-10-14 (planning evidence; memo-only per OD-2 — Branch L is prose-grade; the escalation did not trigger):** memo `plan/bl-086-term-b-own-tier-memo.md`. Pre-registered before any computation (the frozen prefix — 16,830 bytes, sha256 `9021f925…`; the prefix is byte-unchanged in the landed file). **Gate 1 PASS:** the census landed in BL-084's artifact (`orrery/src/generated/bl084-window-ladder.v1.json`, fp `6865b076…`, raw-byte `88c1a92f…`; `scopeB.supplementaryCycles[0]`), the `{1:28, 2:10}` histogram verified field-for-field. **The re-derivation — EXACT, both layers:** the windows re-derived through the BL-084 `windowAnalysis` code path (OD-84-5 discipline) match the landed supplementary records field-for-field (the A₀ own-tier FULL record; the A1-top-A2 ABSENT record). **Core outcome — CONFIRMED (full):** the predicate (BL-072 Term-B, verbatim — `[reach-singleton: parentCount(satellite) = 1]`, fp `45d0afd1…`) selects exactly **28/38** — the 28 singleton windows, a proper subset of the two-regime layer — and the terminal correspondence holds in the strong form: pole windows occupied (1383 via `1387`; 2517 via `2773`), the one-step windows `[0,1]`/`[5,6]` interior (size 2), and the singleton census `6/4/3/2/3/4/6` with the endpoints the unique maxima (terminal dominance, mirror-symmetric). Refutation modes (i)/(ii)/(iii) do not fire. **The A1-top-A2 discriminating experiment — Branch L (ladder-tracking):** the mechanical firing is 28/38 on both layers (histogram-forced; recorded as the component fact under every branch), while the A1 layer's non-consecutiveness — exactly two endpoint-spanning windows `[0,6]` (states 1359/1401) break contiguity — carries no ladder, hence no selection; the selection-level principle tracks the ladder's reach-order alignment, and "FULL-with-terminals" as the applicability condition means the regime structure (consecutiveness + both regimes + terminal correspondence), not the count. **The principle's predictive range extends to a genuinely new case** (the A₀ own-tier row moves from LIVE/unobserved to CONFIRMED — not a retrodiction); no live-unobserved instance of the applicability rule remains in the M-cycle census (D₇ × D6 constructed; A₀ own-tier now constructed; the 14 operator FULL cycles carry no contact domain). The production/mechanism question stays open. Verification: re-derivation 0 mismatches; predicate bytes 28/38 both; terminal sub-checks b1/b2/b3 + mirror all PASS; BL-084 generator `--check` fresh; `validate:manifest` PASS; `validate:prose-consistency` PASS; `validate:ledger-pins` PASS; manifest/checksums regen. Fences: no new measurement; no production claim beyond the verdict; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no new GSL number; no C-TB-1 promotion; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; no machine-checkable artifact (escalation not triggered); D7 hypothesis-tier throughout; the frame is interpretation vocabulary; session prose is context, not evidence.

---

## Sequencing

BL-001/002 first (landed — everything else is now fast), BL-010 next (biggest timeline variable:
extraction vs. authoring), debugger anytime (motivating, no dependencies, fixtures feed BL-031
via BL-023), lattice after debugger fixtures, investigations as filler, governance parked.

## Revision history

| Version | Change |
|---|---|
| v0.1 | Pre-validation capture (mutable plan space). |
| v0.2 | Planning-agent validation: §6 renumber, §4.2 retarget, cut-line fix, PROPOSAL demotions, dedupe findings, BL-033 guards, cascade disambiguation. |
| v0.3 | BL-031(b) fixture correction: tonic-for-tonic handoff relation; B Lydian ↔ C Locrian replaces C Lydian ↔ B Locrian as flat-side seam; C Ionian ↔ C Aeolian reclassified as control; mirror relation as census prediction. Graduated to ACTIVE in this commit. |
| v0.4 | BL-010 landed DONE: Q table authored under the freeze memo; suite green; INV-5 graduation deferred. Next: BL-011 gated on maintainer decision; debugger program (BL-020–023) open. |
| v0.5 | Comprehension map landed (`plan/harmonic-comprehension-map.md`): admitted/hypothesis/open- canon tags; antiparallel direction-only precision fix; D4 qualifier carried; Sun/Moon pole question recorded with both citations. One-line cross-refs added to BL-020/031/033. |
| v0.6 | BL-020 landed DONE: layered cursor/bucket replay, three substrates (route, Q orbit, cadence), 155 tests green, no catalog/manifest bytes changed; listening verdicts pending. BL-021 cadence planner landed as BL-020 acceptance; maintainer listening verdict remains. Pre-existing browser-harness objective-id mismatch surfaced. |
| v0.7 | BL-044 landed DONE: Court voicing surface audited — registry clean (certify table in audit memo), labels relabeled to engagement semantics, three-layer disclosure added, thinning retired in favor of position-identity voicing, layer-boundary tests added. |
| v0.8 | Replay timing fix from maintainer listening: chordal replay onset (stagger retired from replay), sequential hop timing, eviction guard for future-scheduled voices; seam emphasis parameter reserved for BL-021; tetrachord listening finding deferred to audition mode. 161 tests green. |
| v0.9 | Adjudication arc: fivefold mesh spec v2.2.0 adjudicated read-only (registry polarity retained; session flip rejected), corrected spec v3 landed, BL-011 opened and admitted under GOV-522 same day as `SPEC-FIVEFOLD-COURT-CORRESPONDENCE-001` v0.1.1 with receipt + ENTRY 13 + status propagation; correspondence machine check green before admission; manifest 1,155. |
| v1.10 | BL-021 prerequisite landed: bipartite containment spec v1.4, generator, `derived/hypergraph/bipartite-inclusion-v1.json` (planning evidence, byte-stable), 12 tests green; Andalusian destination corrected to `7-32:9`; census 70 boundary bridges / 330 literal orbit-span; manifest regen. |
| v1.11 | BL-021 golden-path registration: tonic-fixed C-minor parallel seam `7-35:3` -> bridge `5-27:0` (audition pick, `5-23:0` alternative) -> `7-32:0`; first both-collections-containment legality; pioneering `golden-path.v1` fixture; engine bridge hold; root-dependence finding; listening verdicts recorded (seam reads as motion, interior as one gesture, verified hopwise); 166 orrery tests green; no catalog bytes changed. |
| v1.12 | Cross-layer architecture map landed (`docs/ARCHITECTURE_MAP.md`, sprint artifact): four structural layers, 11-row operator/algebra catalog with owns/consumes columns, invariant ledger with the three distinct 66s, grounding receipts; BL-024 captured (pentatonic intra-family edge definition + unified route graph, structural gap G1); manifest regen. |
| v1.13 | BL-026 landed: semantic layer at `docs/ARCHITECTURE_MAP.md` §2.5 (descriptive authority) — one meaning-paragraph per catalog row sourced to existing repo documents; 9 sourced rows, 2 finding rows (governor-runtime schemas-only; T-primitives meaning-less), 1 sourced precursor; manifest regen. |
| v1.14 | BL-022 landed DONE: bidirectional parallel-minor golden path (`c-parallel-minor-mode-axis`) — stepwise L/R walk with `set-class-preserved` legality, walk+triad overlay (both layers), M compression comparisons rendered as audit demonstrations (`M:2741:1709`, `M:1717:1453`); first multi-path `golden-path.v1` instance; 7 tests, suite 173 green; memo `plan/bl-022-parallel-minor-memo.md`; objective layer untouched. |
| v1.15 | BL-028 landed DONE: derived-path finder over the composed graph (60 catalog operator edges + 6,930 containment pairs; generated artifact + independent validator in `orrery:check`); ≤3 minimal paths, admitted-bridge filter, legality-typed replay, 792-node UI selectors with coverage labeling. Validation-as-audit: both registered golden paths reproduced consistently among minimal routes; 792-node connectivity census + seven-mode operator reachability pinned. BL-029 captured (D-tier operator coverage, verified 0/49 catalog overlap). 12 tests, suite 185 green; memo `plan/bl-028-path-finder-memo.md`; architecture map updated (G2 partially realized, no G1 change). |
| v1.16 | BL-023 landed DONE: golden-path catalog formalized — JSON schema (closed hop/legality/substrate/alternative enums, verdict contract, additive-only versioning) + strict validator with semantic closure wired into `orrery:check`; conformance suite proves both registered paths and a BL-028 finder-export record validate through one schema; BL-021 verdicts transcribed (recorded), BL-022 verdicts pending with recipe pointers; `bridge.legality`→`legalityNote` finding; promotion ceremony documented (audition + verdicts required). 4 tests, suite 189 green; memo `plan/bl-023-golden-path-catalog-memo.md`; no catalog/audio/palette bytes changed; no graph embedding; G1 untouched. |
| v1.17 | BL-029 landed DONE: read-only D-tier operator probe + independent validator + vitest pins wired into `orrery:check`/`orrery:build`; corrected framing (row 1 domain-local; gap is row-2 projection scope); zero fixed-degree anchor-to-anchor D applications (full admitted universe), exact A-control 60/12/21×21, discriminant assertions PASS, M-closure seven tier cycles, 228 satellite-only fixed-degree touches each way, no phase entanglement; classification outcome (3) refined — no row-2 D extension available; architecture map §1/§4 updated; memo `plan/bl-029-d-tier-operator-probe-memo.md`. |
| v1.18 | BL-030 landed DONE: seven D-tier M-cycle demonstration routes (`d-cycle:D1`–`d-cycle:D7`, substrate `boundary-demonstration`) + schema v1.1 additive defs + validator boundary-demonstration branch (probe-cycle match, audit-line resolution, cycle closure, exhibit-citation checks; fail-closed mutation-verified); founders byte-identical (payload hash pin); BL-029 memo §3(c) edge-set provenance completed; BL-031 boundary-stratification amendment; spec `plan/bl-030-d-cycle-demonstration-routes-spec.md`; pathCount 9, suite 202 green. |
| v1.19 | BL-034 landed DONE: Orrery semantic provenance fix — pure landform provenance resolver, tier-branched labels (A0 native with seed; A1/A2 explicitly derived with office + seed citation), inheritance audit (scene prompt + audio palette already derived; no kernel-window surface), rule recorded. BL-035 landed DONE: two-mechanism semantic-derivation census — pentatonic four-way claimant classification (single 50 / agreeing 0 / conflicting 25 / zero 255; 105 claims over 75 nodes; all 70 census bridges claimed; five 5-35 cornerstones the only 3-claimant, windowed nodes) + 455-node heptatonic office-following baseline (301 + 154, collision-free at office level); direction recorded unassigned (negative derivability finding); generator + independent validator + 7 vitest pins wired into `orrery:check`/`orrery:build`; BL-031 Phase-1 spin-out/gating note; memos `plan/bl-034-*`, `plan/bl-035-*`; suite 213 green. |
| v1.20 | BL-031 Phase 2 (semantic multi-hop transport probe) landed: seed-pool carry over the BL-028 composed graph at distances 2–3 — 1,750 queries / 330 targets; every target multi-origin within 3 hops; collisions deepen (d2–3 origins disjoint from d1 claimants); `5-35:10` all seven offices; pool relations exactly the three admitted overlaps (3,926 disjoint / 620 overlapping / 0 identical / 0 subset); route divergence 1,510 queries; BL-028 ground truth reproduced; boundary `d-cycle` layer geometry-only; generator + independent validator + 8 vitest pins wired into `orrery:check`/`orrery:build`; memo `plan/bl-031-semantic-transport-probe-memo.md`; suite 221 green; G1 untouched. |
| v1.21 | BL-054 captured: phenomena closure review parked until EPIC-004 — adjudicates §2.7's photonic-coherence revision (Q1) + dipole-selector synthesis (Q2) at registry closure; no framework/registry bytes move until the ceremony; manifest regen. |
| v1.22 | BL-032 landed DONE: phase-extended topology admitted as candidate record `SPEC-PHASE-EXTENDED-TOPOLOGY-001` v0.1.1 (`docs/specs/phase-extended-topology-candidate-v0.1.0.md`) with receipt `qa/specs/bl-032-phase-topology-admission.json` and ENTRY 14 under GOV-523, one atomic landing; bounded claim only (no governs verdicts, wall stands, G1 untouched, direction unassigned); candidate numbers machine-pinned before the candidate existed (phase-a probe 12 pins + independent validator); Phase C gate satisfied. |
| v1.23 | BL-033 Phase C probed (sprint, read-only): boundary-govern derivation retry executed in the phase-extended sandbox — generator + artifact `orrery/src/generated/phase-c-probe.v1.json` (fingerprint `5085e274…`) + independent validator + 10 vitest pins wired into `orrery:check`/`orrery:build`; E1 PRESENT; calibration EXACT (OBS-023 reproduced per phase); seam keying completes the kernel relation to all 7 offices but collapses to `G_A = U` → contract `restatement_signature` (pre-registered expectation not held; new failure mode); strict-degree control reproduces frozen `not_derived` exactly; T-C seam overshoot (7 vs 2) with all observed seams realizable; D7 mirror asymmetric (`not_derived@seam-analogue`, rotation orbit does not close; contract seam clause inapplicable); wall NO_CHANGE at 12/12 phases; memos `plan/bl-033-phaseC-lifted-keying-spec.md`, `plan/bl-033-phaseC-results-memo.md`; suite 243 green; no D4/D7 verdict, no amendment; OD-C1…OD-C4 for maintainer. |
| v1.24 | BL-033 findings recorded (maintainer rulings OD-C1…OD-C4): both keying readings ratified co-canonical at their own scope; D7 analogue adequate as labeled; fa/ti closure asymmetry recorded as a named structural finding; no amendment from Phase C (obstruction is in the contract). Follow-on captured as BL-055 (D4 contract selection-mechanism review); BL-033 status → findings-recorded (obstruction-visible row-class); manifest regen. |
| v1.25 | BL-055 reviewed (sprint, read-only): D4 contract selection-mechanism review executed — generator + artifact `orrery/src/generated/d4-selection-review.v1.json` (fingerprint `6d11fd93…`) + independent validator + 11 vitest pins wired into `orrery:check`/`orrery:build`; Step 0 patch-only confirmed (Hypothesis B pre-falsified by execution scope); **clean 14/14 predicate found: `P(s) = [forte(s) = 7-27]`** (observed = 7-27, unobserved = 7-31, all A1 satellites); T-B definitional restatement proof (7 anchors × 2 distinct E-parents × 4 satellites = 56 = U); T-A under-coverage = T1-link limit on the closed 7-edge A0 cycle (5×T2 + 2×T1); OD-3 per-phase diagnostic (flanks reach U, center reproduces the frozen set); three independent blockers ⇒ failure is route geometry; near-miss axis (cornerstone) recorded as fail per OD-1; build-phase recomputation corrected three containment-axis numbers from the planning pass (memo §4/§8); no amendment; memo `plan/bl-055-d4-selection-review-memo.md`; suite 254 green; BL-056 (new-route design) captured with the cycle-edge ↔ construction-pair hard constraint. |
| v1.26 | BL-056 validated (sprint): D4 R2 filtered-cycle-walk design validation executed — generator + artifact `orrery/src/generated/d4-r2-route-review.v1.json` (fingerprint `e25851f9…`) + independent validator (mutation-verified) + 10 vitest pins wired into `orrery:check`/`orrery:build`; **G1 cycle-twin `rotateMaskZ12^d(a) = b` verified 7/7** (2×T1 + 5×T2; +2 mask rotation confirmed as the T2 generalization; per-office justification tier uniformly `cycle-twin-verified`, no fallbacks); **G2** 2 selected per office × 7; **G3 `G_R2 = O` exactly** (14 keys, missing/extra empty); **G4 non-collapse** 14 ≠ 28 = U (identity broken by satellite-reading selection, not edge substitution; T-B remains satellite-blind); **G5** midpoint census 7 realized / 2 observation-exact / 5 seam-derived predictions with confirmation markers; midpoint = constructed-office invariant; seam cross-check 7 = 7 and 2 = 2; constraint table 4/4; no amendment, no route admission, no governs admission, no wall movement, no direction assignment; memo `plan/bl-056-d4-r2-route-memo.md`; suite 264 green; BL-056 status → findings-recorded. |
| v1.27 | BL-057 four-gate corridor completed: D4 record amended additively — ENTRY 15 `record_amended (derivable-via-R2)` appended; ENTRY 10 stands immutable (region hashes labeled under both recipes); Gate 3 receipt certified (`execution_verified`, `DERIVED@X`, calibration EXACT, R2 = O at four licensed contexts, construction join = U contrast, D7 asymmetric analogue hypothesis-tier) in receipt `qa/specs/bl-057-d4-record-amendment.json`; Gate 3 ledger fence evolved to execution-time prefix preservation (Gate 3 receipt bytes/fingerprints unchanged); pre-existing `validate:ledger-pins` inventory recorded as accepted release state (BL-058 captured for repair); governs program left live (BL-056 remainder, 14-vs-14 predicate semantic registration, fa/ti asymmetry, rows 8/10 holes, directional-semantics gate); manifest regen; no governs admission, no wall dissolution, no G1 movement, no direction assignment, no green claim. |
| v1.28 | BL-059 landed: D4 Derivation Statement (`plan/bl-059-d4-derivation-statement.md` — bounded contact-geometry theorem restated from the corridor's receipts; citation-stable) + Higher-Theorem Scoping memo (`plan/bl-059-governs-derivability-scoping-memo.md` — first formal statement of the GOVERNS derivability question: grant status in the framework's own design, evidence for/against, candidate approaches with falsification shapes; no answer claimed); two companion memos, one commit; manifest regen; no claim event, no record amendment, no admission, no G1 movement. |
| v1.29 | BL-060 hunted (sprint, read-only): D4 14-vs-14 structural hunt executed — generator + artifact `orrery/src/generated/d4-14v14-hunt.v1.json` (fingerprint `8a1295ca…`) + independent validator (mutation-verified, 4 probes) + 9 vitest pins wired into `orrery:check`/`orrery:build`; BL-055 imported by fingerprint (`6d11fd93…`, OD-60-4); **synthesis verdict DERIVED** — the non-Z D-tier containment composite (`nonZSum <= 13` vs the four non-Z D-tier anchor families 7-1/7-8/7-15/7-22) splits cleanly 14/14 with boundary gap 1 (13/14), within-class variance and inversion stability proving independence from the class label; IV-delta recomputed from ledger bytes (brief string dropped per OD-60-1); complement-bridge split restatement-grade under OD-60-2 (canon asymmetry recorded; representative probe hit 14); office lemma proves all office-level axes non-separating (cycle, governor-element, ENTRY 13 — last two correlation-only under the ENTRY 13 fence, OD-60-3); D7 fenced (OD-60-D7); governs semantic layer gains GSL-1; scoping memo §4 accretion item carried; memo `plan/bl-060-14v14-hunt-memo.md`; ledger-pins inventory unchanged (13, zero added); no claim event, no record amendment, no governs admission, no higher-theorem answer, no G1 movement; suite 299 green. |
| v1.30 | BL-060 post-landing disposition: BL-061 captured (the 1765/1261 Z-family residual pair — twelfth grounding catch, maintainer-prose class: the proposed capture described this pair with the 2395/2899 zero-seam profile; corrected against landed `table28` bytes before memorialization; the three exception pairs and their boundary roles registered) + BL-062 captured (Z/non-Z boundary-selection asymmetry: structural or threshold-artifact?); memo addendum §13 (post-landing register: exception pairs, mechanism-level representation stability, Z/non-Z follow-on); no claim event, no record amendment, no admission, no G1 movement. |
| v1.31 | BL-061/BL-062 combined sprint executed (read-only): artifact `orrery/src/generated/d4-zresidual-hunt.v1.json` (fingerprint `e1b3f655…`) importing BL-060 by fingerprint (`8a1295ca…`) + generator + mutation-verified validator (4 probes) + 9 pins wired into `orrery:check`/`orrery:build`; memo `plan/bl-061-062-zresidual-memo.md`. Findings: **Z-verdict STRUCTURAL** — the Z-structure participates via interface polarization (`nonZSum < zSum`, gap 4; GSL-1's `nonZSum <= 13` is its w = 0 projection) and composition content (observed carry Z-class + achiral subnodes, unobserved none; mechanisms b/c SUPPORTED; a PARTIAL); **residual verdict EXPLAINED_NOT_PRIMITIVE** — 1765/1261 = Z12-only interface extreme (7/2/2) with chiral-Z-only composition (5-Z18/5-Z36), margin 3 inside the sign rule; refinement scan: 6 clean hits + 1 degenerate dual hit, 5 near-misses, 2 orientation-polarized shapes rejected as inversion-splitting; new facts: tier↔family bijection (D1=7-22 … D7=7-1), mesh subnodes = pc-0-anchored 5-subsets (462/462), 14 inversion pairs all status-shared (whole-pair selection; office sums 6 mod 7), cornerstones confined to D5/7-Z12; GSL-1R + GSL-2 recorded; both tickets closed by the joint artifact; suite 308 green; ledger-pins unchanged (13, zero added); no claim event, no record amendment, no governs admission, no higher-theorem answer, no G1 movement, no D7 computation. |
| v1.32 | BL-060/061/062 post-landing registrations: comprehension map §5 (measured-findings class — GSL-1/1R/2, structural invariants, named Z12-corner residual; consumption row added; admitted §1/§2 tiers untouched) + scoping memo §4.6 accretion (boundary-geography selection layer as evidence-for, per its own mutation discipline; tally updated to five-for/six-against) + architecture map Layer 1 tier↔family bijection note; no claim event, no record amendment, no governs admission, no higher-theorem answer, no G1 movement; manifest regen. |
| v1.33 | BL-063 landed (sprint, read-only): intrinsic office reconstruction via midZ7 — un-granting roadmap Phase 1 (BL-059 §3 requirement 2) — generator `scripts/build-bl063-office-reconstruction.mjs` + artifact `orrery/src/generated/bl063-office-reconstruction.v1.json` (fingerprint `6d33c67b…`, raw-byte `57932f37…`) + independent validator (static grant-isolation check + 5 mutation probes rejected) + 9 vitest pins wired into `orrery:check`/`orrery:build`; BL-060 chain anchor by self-checked fingerprint `8a1295ca…`; memo `plan/bl-063-office-reconstruction-memo.md`. Findings: **P7 Hamming-line confirmed** (endpoints 1387/2773; pcSum 33→39); **κ₁ = canonical 7/7 vs κ₀ 1/7 (M1)**; two construction mechanisms (5 interior sandwich + 2 boundary twin-closure; π = granted E-pairs); **reflection-equivariance 49/49** (`midZ7(6−a,6−b) = (6 − midZ7(a,b)) % 7`; midpoint law reflection-blind, g₀+g₁=6); H_B containment-twin null. Self-catches: unrestricted sandwich non-unique (Hamming-2 restriction load-bearing), sorted-degree expectation. **Verdict CONSTRAINED_TO_REFLECTION** (one bit: brightness premise or one grant comparison, agreeing). Follow-ons: **BL-064 captured** (Phase 2 cycle-ground derivation via κ; E-pair set-equality pre-registered) + **BL-065 captured** (the shared one-bit dependency — grounding correction, maintainer-prose class: the convergence is with map §3's open Sun/Moon pole question and the framework's canonical office assignment, not a §2.7 registration; nearest registered brightness material = §2.3's Court ordinal 22→26, field semantics `[OPEN]`). Suite 317 green; ledger-pins unchanged (13, zero added); no claim event, no record amendment, no GOVERNS derivation claim, no governs admission, no higher-theorem answer, no G1 movement, no D7 computation; manifest regen. |
| v1.34 | BL-066 landed (sprint, read-only): the 28 R-edge derivation — un-granting roadmap Phase 3, the capstone (BL-059 §3 requirements 1 and 3) — generator `scripts/build-bl066-r-edge-derivation.mjs` + artifact `orrery/src/generated/bl066-r-edge-derivation.v1.json` (fingerprint `94f0661f…`, raw-byte `ac2db3d9…`) + independent validator (two-sided static input-isolation check — forbidden-token absence AND required canonical-input presence — + 25 mutation probes rejected incl. smuggled R/officeIndex/forte reads and a lobotomized region) + 13 vitest pins wired into `orrery:check`/`orrery:build` after `bl064-cycle-ground:check`; BL-064 chain anchor by self-checked fingerprint `aa975820…`; memo `plan/bl-066-r-edge-derivation-memo.md`. Findings: **R-H2 reach 24/28 masks-only, zero extras, unique hubs**; the 4 unplaced `{695, 3497, 731, 2921}` resolved by the **H8 reach-census closure law** (each attaches to its H8-parent with the smaller H2-reach count; equivalently the unique H8 matching that equalizes the reach census — 16 enumerated, exactly one, the granted assignment); **the pre-registered swap-bit candidate dissolved** (the planning-pass distance-invisibility record tested proximity axes, not census ordering; the battery corroborates: pcSum + mask-numeric agree, κ orientation-relative, containment inapplicable); **count-4 emergent** (OD-P3-5 strongest form); GSL-1R reproduced per parent (2×7-27 Z-majority + 2×7-31, 28/28); direction dual-report (unique-hub 24/24 + IC-distinguishability 28/28 candidate, A1-anchor IC `[2,5,4,4,4,2]` — grounding correction: the ruling's parenthetical is BL-064's A0-anchor IC); gates V-P3-1…5 all PASS (set-equal 28/28, `missing: []`, `extra: []`; reflection-invariant, labels `c → 6−c` carried to BL-065); **verdict `R_EDGES_DERIVED`** — the GOVERNS relation's edge content is intrinsic to the satellite layer's reach geometry; bit inventory: **one carried bit** (office-orientation, BL-065, two agreeing sources), the swap dissolved; the higher-theorem question (BL-059) gains its first direct, bounded, affirmative finding. Suite 340 green (34 files); ledger-pins unchanged (13, zero added); no claim event, no record amendment, no GOVERNS admission (finding, not admission), no orientation-bit resolution, no IC-tier promotion, no G1 movement, no D7 computation, no Phase-4 work; manifest regen. |
| v1.35 | BL-066 post-landing dispositions (maintainer rulings 2026-10-11, memo §10, additive): **OD-66-1** — the H8 reach-census closure law recorded as the closure's **mechanism/primary**, the battery (pcSum + mask-numeric) as corroboration (the artifact already read this way; ruling ratifies, no bytes change); the planning-pass P3-E record to be annotated at the next BL-059 accretion cycle as "no **proximity** discriminator exists; the **census-consistency** law was the discriminator" (precision about what was searched). **OD-66-2** — the IC-extension held at candidate per OD-64-1's pattern (separation ≠ derivation; promotion would need *why*, not just *that*, the IC structure discriminates — the OD-60-2 restatement-vs-explanation line). **OD-66-3** — one named carried bit confirmed (office-orientation; one identification, two registrations); the swap dissolution resolved a **matching** ambiguity, the orientation bit is a **labeling** ambiguity — different classes, no interaction; BL-065's question exactly as open as before. No artifact bytes changed (`94f0661f…` unchanged), no record amendment, no claim event; the formal claim event ("GOVERNS is derivable") remains a separate ceremony, unperformed; manifest regen. |
| v1.36 | GOV-524 claim event landed (the fifth ceremony): `SPEC-GOVERNS-DERIVABILITY-001` v0.1.1 admitted (`docs/specs/governs-derivability-candidate-v0.1.0.md`) with receipt `qa/specs/gov-524-governs-derivability-admission.json` and ENTRY 16, one atomic landing — the A1 GOVERNS relation's edge content is admitted as derivable from pre-grant machinery up to one named bit and the anchoring remainder (κ coordinates + Hamming/containment reach + the H8 reach-census closure law; 28/28 masks-only set-equal with `missing: []`/`extra: []`; count-4 emergent); the modeling-assumption revision recorded as the claim's significance; scope exclusions binding (no semantics, no role, no anchor-set/tier-partition derivability, no GOVERNS authority, no D7 implication, no INV-5/§6(4)/M-walkability, no G1, no record amendments beyond the claim's own entry, no green claim); consequence updates: BL-059 scoping memo §4.7 accretion + §7 status update + §8 accretion note, comprehension-map §4 consumption row, BL-064 landing registration completed above, this row; full validate observed first stop `validate:ledger-pins` (pre-existing 13, recorded not repaired; BL-058); ENTRY 10/15 byte-untouched; manifest regen. |
| v1.37 | BL-067 landed (the governs semantic layer synthesis — the boundary layer's first coherent statement): memo `plan/bl-067-governs-semantic-synthesis.md` + comprehension-map §4 consumption row; structure by channel per maintainer ruling — §1 set-class identity (P(s) = 7-27, clean 14/14) **lens-free by design** as the membrane demonstration; §2 Z-interface polarization (GSL-1R; Jupiter/Saturn coda); §3 composition content (GSL-2; Mercury coda); §4 fa/ti polarity (asymmetry measured three ways; Venus/Moon coda; D7 hypothesis-tier fenced); §5 geography (bijection, threshold anatomy, exception pairs, invariants; filtering-regime pointer; BL-066/GOV-524 corroboration context only); §6 open questions inventory (D7 asymmetry explanation; Z12-corner; Z/non-Z mechanism; directional-semantics gate; anchoring remainder); §7 integration verification + fences. Three template-bound codas are the synthesis's only novel prose, non-load-bearing; every substantive claim cites its landing artifact; no new measurement, no new structural claim, no new phenomena mapping, no lens extension; finding-row statuses untouched (rows 8/10, phenomena-closure items, directional-semantics gate); build-time grounding correction (maintainer-prose class): the approved reading-contract note read "§§2–3", corrected to "§§2–4" to match the authorized coda placement. No claim event, no record amendment, no governs admission, no G1 movement, no INV-5 graduation, no M-walkability promotion, no canonical/Court/schema/Neo4j writes; manifest regen. |
| v1.38 | BL-068 landed (the D7 asymmetry investigation — GSL-3, the governs semantic layer's first explanatory entry): memo `plan/bl-068-d7-asymmetry-memo.md` + generator `scripts/build-bl068-d7-asymmetry.mjs` + artifact `orrery/src/generated/bl068-d7-asymmetry.v1.json` (fingerprint `b0d65bd6…`, raw-byte `3de92695…`) + independent validator (16 mutation probes rejected; static generator-isolation checks) + 11 vitest pins wired into `orrery:check`/`orrery:build` after `bl066-r-edge-derivation:check`; chain anchors by self-checked fingerprint (D4 hunt `8a1295ca…`, zresidual `e1b3f655…`, Phase C `5085e274…`). Findings: the premise corrected (OD-68-0 — the analogue-R consumed its own domain by construction; the recorded layer collapses too, 14/14/0); the availability domain constructed from ledger bytes (OD-68-1 — Hamming-2 reach of the 7-2 class: 36 = 14 recorded same-office + 22 unrecorded modal-neighbour, per-anchor 4–6, all unrecorded at ±2 mod 7, 11+11); **verdict `DIFFERENT_PREDICATES`** — axis 1 native set-class hunt RESTATEMENT_UNIFORM (the class is the domain, 36/36), axis 2 office-linking/modal remainder CLEAN_SPLIT (14/0/0/22), axis 3 Z-interface NON_SEPARATING (4/14 Z-majority — the GSL-1R polarization is fa-specific), axis 4 invariant geography INVARIANTS_OBEYED (7/7 in-class inversion pairs, all office sums 6 mod 7 — pole-universal); **GSL-3**: the contact-target tiers differ in class multiplicity (A1 two classes vs D6 one), so the fa-pole's selection rides set-class identity while the ti-pole's rides the office condition alone — same invariants, different predicates; the ti-pole's contact relation is class-exhaustive and office-pure. Grounding correction (maintainer-prose class): the brief's "59 7-2 states" figure was a JSON string-occurrence count — the ledger carries exactly 14 (corrected in-artifact). D7 hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause verbatim); no GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; no D4-record movement; frame not design input; suite 351 green (35 files); ledger-pins unchanged (13, zero added); manifest regen. |
| v1.39 | BL-069 registered (fast-lane additive): **GSL-3** — the fa/ti asymmetry's mechanism (different predicates over different domain multiplicities: fa class-selective/office-flat over the two-class A1 domain; ti class-exhaustive/office-pure over the single-class D6 domain; invariants pole-universal) — landed into the synthesis (`plan/bl-067-governs-semantic-synthesis.md`: §6 entry 1 resolves to *explained*, §4 mechanism paragraph beneath the Venus/Moon coda, §7/§8 carry the registration), the comprehension map (`plan/harmonic-comprehension-map.md`: §4 consumption row + §5.6 + §5.5 receipts), and the scoping memo (`plan/bl-059-governs-derivability-scoping-memo.md`: §4.8 accretion; §7 unchanged). Registration of BL-068's landed finding (commit `1a0a903`; artifact `orrery/src/generated/bl068-d7-asymmetry.v1.json`, fingerprint `b0d65bd6…`; memo `plan/bl-068-d7-asymmetry-memo.md`) — no measurement; no claim event, no record amendment, no D7 movement, no governs admission, no higher-theorem answer, no G1 movement; manifest/checksums regen. |
| v1.40 | BL-070 landed (the D7 derivation attempt — the ti-pole's R2-analogue, office-purity route): **`PARTIAL_DERIVATION`** — the domain derives masks-only (36 instances, per-anchor 4/5/6/6/6/5/4, the asymmetry emergent from a uniform 30-per-anchor all-ledger reach; set-equal to BL-068's availability domain), all nine pre-registered mask-geometric selectors fail (cleanSplitCount 0); the near-miss `|ΔpcSum| = 1` = 12/0/2/22 missing exactly the terminal tritone contacts 127:253/4033:2017 (both reach-singletons); the min-|Δ| + census composite C-TB-1 (14/0/0/22) recorded un-promoted; **the third obstruction refined** from the Gate 3 bytes — every modal edge is an exact rotation (11×6 + 6×1), so the 0/7 is an interval-transport failure, not a rotational absence; invariants pole-universal (7 whole pairs, sums 6, status shared). Artifacts: generator `scripts/build-bl070-d7-derivation.mjs` + artifact `orrery/src/generated/bl070-d7-derivation.v1.json` (fingerprint `9db10a08…`, raw-byte `169ce706…`) + independent validator (34 mutation probes rejected; two-sided static isolation) + 11 vitest pins wired into `orrery:check`/`orrery:build` after `bl068-d7-asymmetry:check`; chain anchor BL-068 `b0d65bd6…`; memo `plan/bl-070-d7-derivation-memo.md`. D7 hypothesis-tier throughout (no claim event, no record amendment, no derivation admission; ENTRY 15's clause verbatim); no GOVERNS admission; no G1 movement; suite 362 green (36 files); ledger-pins unchanged (13, zero added); manifest regen. |
| v1.41 | BL-070 post-landing dispositions + follow-on captures: **OD-70-5** — C-TB-1 held at **UNPROMOTED** (separation ≠ derivation; the promotion bar is a mechanism argument); **OD-70-6** — the interval-transport correction recorded as a **bounded refinement** (memo §14; scoping memo `plan/bl-059-governs-derivability-scoping-memo.md` §5.1 accretion: the attempt executed — domain derives masks-only, selection office-field-dependent; the cycle-twin clause refined to an interval-transport failure, the orbit's own intervals {11, 6} vs the D4 verification set). Captures: **BL-071** (the interval-6 structure — the tritone as the shared geometry: the orbit's closure offset, the two terminal far contacts, and the near-miss misses triangulate on interval 6) + **BL-072** (C-TB-1's mechanism question — why does min-|Δ| + census separate?); no artifact bytes changed (`9db10a08…` unchanged), no record amendment, no claim event; manifest/checksums regen. |
| v1.42 | BL-071 landed (the interval-6 characterization — the tritone's role measured; GSL-4 candidate): **five universes × three distinct measures** (kept separate by construction) — D7-36 (12/36 displacement-6, 0 rotation-6), D6-tier (0/98), A1-28/D4 (0/28), A0-P7 (1/7 — the ring closure at rotation 6), D-anchor-49 (15 disp6, 12 rot6). **Headline discovery: both boundary seven-cycles close at rotation 6** (D7 modal orbit 4033→127; A0 P7 ring 2773→1387; both Hamming-10), and every D-tier anchor family carries ≥1 rotation-6 pair. **Baselines pre-registered before the comparison (OD-71-3):** B1 structural reach (630/6930) and B2 D4 control — with the **grounding correction** (maintainer-prose class): the approved B2 value 2/28 is corrected to **0/28** by bytes (the 2 tritone-displaced instances are D7 facts); baseline slot and Fisher tables unchanged (V-BL-071-3). Fisher: TEST-1 p=5.3e-5 (vs B1), TEST-2 p=3.8e-4 (vs B2 — **ti-specific, not boundary-wide**), TEST-3 p=4.7e-8 (rotation at the anchor scale), TEST-4 (boundary IC6-**poor**). **The 7-27/7-31 split is NOT tritone-structured** (0 swap / 0 rot6 / 0 complement over 196 cross pairs; class-structured split; tritone only as IC6 content contrast 1 vs 3). **Lifted representation exact:** `lifted(2773@(p+6)) = T_6(lifted(1387@p))` per phase; root-coherent across all 126 ledger rotation-6 pairs. **Role verdict `mixed`** (separation / transition / none per measure; closed vocabulary OD-71-6); **no mechanism claim** (V-BL-071-4). T-1/T-2 re-verified; **T-3 labelled `[HYPOTHESIS]` framing, excluded** (OD-71-2: two landed + one framed). **GSL-4 candidate draft, un-promoted** (OD-71-5). Artifacts: generator `scripts/build-bl071-interval-6-structure.mjs` + artifact `orrery/src/generated/bl071-interval-6-structure.v1.json` (fingerprint `8b2a1f6c…`, raw-byte `80a98540…`) + independent validator (44 mutation probes rejected) + 11 vitest pins wired after `bl070-d7-derivation:check`; chain anchors by self-checked fingerprint (BL-070 `9db10a08…`, BL-068 `b0d65bd6…`, D4 hunt `8a1295ca…`, Phase A `c8271c20…`); memo `plan/bl-071-interval-6-memo.md`. Fences: no claim event, no record amendment, no governs admission, no directional-semantics assignment, no G1 movement; D7 hypothesis-tier throughout; `orrery:check` exit 0; suite 373 green (37 files); ledger-pins unchanged (13 pre-existing, zero added); manifest regen. |
| v1.43 | BL-071 post-landing dispositions + follow-on captures: **GSL-4 promoted** to the governs semantic layer (the disposition ruling the separate admission the candidate anticipated — the **characterization** is promoted; the **mechanism question stays open**, BL-072's family) — registered into the synthesis (`plan/bl-067-governs-semantic-synthesis.md` §5 interval-6 block + §7.3/§7.6/§8), the comprehension map (`plan/harmonic-comprehension-map.md` §4 consumption row + §5.7 + §5.5 receipts), and the scoping memo (`plan/bl-059-governs-derivability-scoping-memo.md` §4.9 accretion); the template-bound Venus/Moon coda recorded in the BL-071 memo §8 (lens vocabulary, non-load-bearing, per the synthesis template); captures **BL-073** (the dual seven-cycle closure at rotation 6 — isometry / phase-relation / coincidence?) + **BL-074** (the three-measure disagreement's mechanism — substitution distance / rotational closure / content density). No artifact bytes changed (`8b2a1f6c…` unchanged; no re-pin, no validator change — the build-time candidate status stands as landed history), no record amendment, no claim event, no GOVERNS admission (the GSL series remains planning-evidence exemplars), no directional-semantics assignment, no G1 movement; D7 hypothesis-tier throughout; manifest/checksums regen. |
| v1.44 | BL-074 landed (the three-measure tritone characterization — the tritone anatomy; planning evidence, memo-only per OD-74-5; OD-74-1's Descriptive-Read boundary — the census's witness lists are the population; no new measurement, no new universe enumeration, no new pair discovery): read-only descriptive characterization of the BL-071 census's landed witness lists (base re-hashed: fingerprint `8b2a1f6c…`, raw-byte `80a98540…`). **W-1** (M-DISP, substitution): all 12 D7-36 disp-6 instances are 7-1↔7-2 single-pc complement swaps (dPcSum 6), office-blind; the fa-pole substitutes ±1 only (0/28) — ti-local at the contact scale. **W-2** (M-ROT, rotation): all 12 D-anchor rot-6 pairs same-tier/same-class; both seven-cycle closures rot-6 Hamming-10; absent from every contact domain; the **D2 dual-phenomenon trio** (`471:1479`, `2283:2787`, `3189:3441`) satisfies M-ROT and M-DISP simultaneously — *distinct distributions, overlapping instances*. **W-2b** (OD-74-2, required): 15 D-anchor disp-6 = 6× fa↔ti + 6× D1↔D5 + 3× D2↔D2 — the "ti-local" shorthand's reconciliation. **W-3** (M-IC6, content): IC6 tracks set-class exactly; office carries no signal; fa-rich via 7-31, D7-poor via 7-1/7-2. **W-4** (mechanism's shape): the **relational–relational–internal trichotomy** named; the disagreement is distributional, not logical. **W-5:** GSL-4 refined to an annotated sub-entry (no status change, no new GSL number; inline, unapplied). Lens coda recorded template-bound (OD-74-6). Fences: no mechanism claim (the why stays open — recorded, not closed; BL-072's family); no claim event, no record amendment, no D7 movement, no governs admission, no directional-semantics assignment, no G1 movement, no INV-5 graduation, no M-walkability promotion, no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; manifest/checksums regen. |
| v1.45 | BL-073 landed (the dual seven-cycle isometry probe + the synthesis scoping — measurement + definition, one pass, two deliverables; planning evidence; rulings OD-73-1…6 + build notes R1/N1/N2): probe artifact `orrery/src/generated/bl073-isometry-probe.v1.json` (fingerprint `811fa786…`, raw-byte `2dca3e8b…`) + generator + independent validator (44 mutation probes rejected) + 11 vitest pins wired after `bl071-interval-6-structure:check`; memo `plan/bl-073-dual-cycle-isometry-and-synthesis-scoping.md`. **Result `PARTIAL_ISOMETRY`** — both cycles derived masks-only (D7 `^11` path + `^6` return; A0 Hamming-2 path + `^6` closure) and cross-checked key-for-key against the landed records; **P1 PASS** (identical 21-pair Hamming histograms), **P2 FAIL strict** (`{11:6,6:1}` vs `{7:6,6:1}`; 0/14 dihedral + 0/5040 symmetric witnesses) with the **two-interval structural parallel** recorded (six uniform path edges + one distinguished `^6` Hamming-10 closure), **P3 PASS** (exactly two distance-matrix isomorphisms, both dihedral: `φ-1 = r0` rotation/even — identical-reindexed reading — and `φ-2 = refl6` reflection/odd — chiral reading; the N2 fork recorded with both readings coexisting), **P4 PASS** (uniform tritone marking; full interval-vector contrast recorded as context). Phase-relation secondary: both witnesses map the D7 closure pair onto the A0 closure pair (the BL-071 lifted-congruence endpoints; cited); neither rotation-induced. **Binding gate:** the GOVERNS interpretation stays separately gated — no claim, no admission. **Scoping:** four landed properties define the boundary object; six candidate object types C1–C6 with falsification shapes, none endorsed (manifold / fiber bundle / graded algebra / category / new structure / unity reduction); isometry registered as the object's first structural probe; scaling statement (70-bridge switchboard → 330↔462) stated, not pursued; membrane boundary stated. **Unity hypothesis status: CONSTRAINED** (3-of-4 pass; the P2-only failure localizes independence to the interval layer). Fences: no claim event, no record amendment (ENTRY 10/15/16 byte-untouched), no GOVERNS admission, no G1 movement, no INV-5 graduation, no M-walkability promotion, no directional-semantics assignment, no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; `orrery:check` exit 0; ledger-pins unchanged (13 pre-existing, zero added); manifest/checksums regen. |
| v1.46 | BL-073 post-landing dispositions (maintainer ruling 2026-10-11, memo §7 register + scoping memo §4.10 accretion): **the tri-reading of the P2-only failure recorded** — Reading 1 (the coordinate-system reading: one structure, two addressings; leading per the disposition), Reading 2 (independence), Reading 3 (unity-constrained); testability noted (a coordinate transformation D7 ^11 ↔ A0 ^7 would confirm Reading 1). **The orientation bit's unification recorded** — the isometry's reflection witness φ-2 (= φ-1 ∘ the cycles' reversal automorphism), BL-063's κ₀ reflection orientation, and BL-065's brightness premise are the same reversal (the P7 line's reversal at three scales); the bit inventory updates to **one bit, three registrations** (brightness premise / κ₀ / φ-2), content and formal status otherwise unchanged. **C6 confirmation:** unity hypothesis CONSTRAINED (3-of-4 scales shared; rotation-addressing layer independent) stands as landed. **Capture BL-075** (the coordinate transformation search — the probe that resolves whether the ambiguity is two objects or one; pre-registration required). No artifact bytes changed (`811fa786…` unchanged; no re-pin, no validator change), no record amendment (BL-063/BL-065 as landed; ENTRY 10/15/16 byte-untouched), no claim event, no GOVERNS admission, no G1 movement; D7 hypothesis-tier throughout; manifest/checksums regen. |
| v1.47 | BL-075 landed (the coordinate transformation search — the PARTIAL_ISOMETRY leading interpretation's probe; planning evidence; the planning pass's necessity proof pre-registered as the primary hypothesis; rulings OD-CT-1…7 executed): artifact `orrery/src/generated/bl075-coordinate-search.v1.json` (fingerprint `88838e22…`, raw-byte `1cb710d8…`) + generator + independent validator (61 mutation probes rejected; two-sided census-core static check) + 11 vitest pins wired after `bl073-isometry-probe:check`; memo `plan/bl-075-coordinate-search-memo.md`. **Result `CHIRAL_PAIR`** (with `COORDINATE_MAP_FOUND`): the 48-map Aff(Z₁₂) census returns exactly two setwise carriers — **T1 = x→5x** carries the D₇ addressing (`^11` path + `^6` closure) onto the A₀ addressing (`^7` path + `^6` closure) edge-for-edge (level D); **T2 = x→7x = ρ∘T1** carries the cycle onto the A₀ reversal (level U; `^5` path); the **L0 rotation class is empty (0/12)** — the brief's candidates (a)/(b) falsified by construction and mechanically. **The necessity proof confirmed by computation:** `11u ≡ 7 (mod 12)` selects `u = 5` uniquely (closure `6u ≡ 6` auto-preserved) — **the transformation is canonically determined**; the carrier set's composition closure is the **Klein-4** unit subgroup `{1,5,7,11}` (all involutions, commutative; the working set not closed: `T1∘T1 = id`, `T1∘T2 = ρ`). **Reflection sub-tests verified separately:** pc-level (`T2 = ρ∘T1`; composition = the pc-reflection) and index-level (T1 ↔ φ-1/r0/even; T2 ↔ φ-2/refl6/odd). **The PARTIAL_ISOMETRY's interpretation resolves: the two seven-cycles are one structure in two canonically related coordinate systems — Reading 1 confirmed; the scoping's C6 unity hypothesis gains its first structural confirmation** (memo §8 accretion: the canonicity sentence + the Klein-4 algebra; grounding correction, maintainer-prose class: "the two non-trivial elements T1/T2" recorded as "the two setwise carriers", the third being `ρ = T1∘T2`). Fences: no claim event; no record amendment (ENTRY 10/15/16 byte-untouched); no GOVERNS admission; no GOVERNS authority change; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no C2 endorsement; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; `orrery:check` exit 0; suite 395 green (39 files); ledger-pins unchanged (13 pre-existing, zero added); manifest/checksums regen. |
| v1.48 | BL-075 post-landing dispositions (maintainer disposition 2026-10-12, memo §7 register): **the Klein-4 landing's recognition recorded** — (1) **canonicity** (one affine map, forced; the coordinate systems are one canonical coordinate relationship, not a convention); (2) **the Klein-4 as the ambiguity's complete algebra** — commutative, order 4, all involutions, the simplest non-trivial abelian group, the boundary layer's self-symmetry exactly; (3) **the tier↔family bijection's candidate explanation** (a hypothesis to record, not a claim to admit — the first mechanistic explanation for the measured bijection; grounding note, maintainer-prose class: the session-level check of the coordinate action on the ten anchor families shows the action identical for T1/T2 and trivial for {id, ρ} — the quotient involution **D₇↔A₀** (closure pair), **D₆↔A₁** (BL-068's contact pair), **D₃↔D₄** (interior swap), fixed A₂/D₁/D₂/D₅; every tier block maps whole, so the bijection is coordinate-covariant; the seven D-families are **not** closed — the corrected form of "permute the families"; session-level, not artifact-backed; confirmation a separate probe); (4) **the interval-6 fixed point** (artifact-backed: `6u ≡ 6` for every unit — interval 6 is the fixed point of the coordinate ambiguity's entire symmetry group; BL-071's rotation-6 universality read as a consequence); **the un-granting program's ledger, final** (each row cited; the orientation-bit row corrected, maintainer-prose class: "two registrations" → the landed **one bit, three registrations**, BL-073 §7/v1.46); **the answer to BL-059's question, final form**: derived up to one named bit, the anchoring remainder, and the Klein-4 algebra — the Klein-4 a derived structure, not a remainder; **the expanded claim event recorded ready-when-wanted** (a maintainer decision; nothing performed). Push authorized per "push when batching" (batch: `7fe5d44` + this register). No artifact bytes changed (`88838e22…` unchanged; no re-pin, no validator change, no pins change), no record amendment (ENTRY 10/15/16 byte-untouched), no claim event, no GOVERNS admission, no GOVERNS authority change, no G1 movement, no INV-5 graduation, no M-walkability promotion, no directional-semantics assignment, no C2 endorsement, no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; session prose is context, not evidence; manifest/checksums regen. |
| v1.49 | **BL-076 landed** (the coordinate-covariant bijection probe — the tier↔family correspondence's covariance; planning evidence; rulings OD-76-1…4 executed; **no claim event — the finding tier and the expanded claim event's scope conditionally pre-authorized per OD-76-4**): artifact `orrery/src/generated/bl076-bijection-probe.v1.json` (fingerprint `81e6cf72…`, raw-byte `74bcd025…`) + generator + independent validator (**81 mutation probes rejected** — 66 artifact-drift + 1 fingerprint-zero + 5 smuggled-read + 7 presence-strip + 2 verdict-logic (the ledger-absent and family-fragment fail-loud probes); two-sided family-core static check) + 11 vitest pins wired after `bl075-coordinate-search:check`; chain anchors by self-checked fingerprint (BL-075 `88838e22…`, BL-068 `b0d65bd6…`, BL-061/062 `e1b3f655…`); memo `plan/bl-076-bijection-probe-memo.md`. **Result `COVARIANT_CONFIRMED`; finding `probe-verified`.** The family-level permutation table (10 families × {T1, T2, ρ, ID}): the family-level involution **7-1↔7-35** (closure pair), **7-8↔7-34** (BL-068's contact-target pair), **7-Z37↔7-Z17** (interior swap), fixed **7-22, 7-15, 7-Z12, 7-33**; identical for T1/T2, trivial for {ID, ρ} — the Klein-4 acts on the families through its two-element quotient; zero family fragments, zero office fragments, zero ledger-absent images, 40/40 blocks whole, expectation exact. The office-level table (21 A-tier anchors × 4 maps; complete tables in-artifact): whole per-tier permutations, measured moved counts T1 56 / T2 52 / ρ 60 / ID 0 — **faithful**, strictly richer than the family action. Composition: family 160/160 + office 1120/1120 checks, zero mismatches. Interval structure: the pairing pairs the one IV-shared Z-partner pair (7-Z37↔7-Z17) within its class and IV-unique families with IV-unique families — the Z-pair prediction confirmed. Crossing: D7↔A0 and D6↔A1 both directions (plus the D3↔D4 swap). **Grounding corrections (bytes-class):** the A-tier carries tier-specific families (A0=7-35/A1=7-34/A2=7-33, not a uniform 7-35); the ledger's family census is 38 (not the briefed 66); the probe scope reframed to family level. Fences: **no claim event**; no record amendment (ENTRY 10/15/16 byte-untouched); no GOVERNS admission; no GOVERNS authority change; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no C2 endorsement; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; session prose is context, not evidence. `orrery:check` exit 0; suite 406 green (40 files); ledger-pins unchanged (13 pre-existing, zero added); prose-consistency unchanged (16, zero added); manifest/checksums regen. |
| v1.50 | **BL-077 registration** (the GSL-5/GSL-6 registration — fast-lane additive; the coordinate action's family- and office-level structures; a registration of the landed BL-076 finding, not new measurement): synthesis `plan/bl-067-governs-semantic-synthesis.md` §5 gains the coordinate-action block (GSL-5: the family-level involution 7-35↔7-1, 7-34↔7-8, 7-Z37↔7-Z17, fixing 7-33/7-22/7-15/7-Z12 — identical for T1/T2, trivial for {ID, ρ}; whole-block, zero fragments; the Z-pair structure confirmed; the fa/ti crossing present; GSL-6: faithful whole per-tier office permutations with **Mercury the sole fixed point in every map and tier** — the 4+1 signature measured); comprehension map §5.8 + §4 consumption row; scoping memo §4.11 accretion (evidence-for: the tier↔family correspondence is coordinate-covariant — the same canonically determined affine algebra carries it whole); backlog section above. Grounding correction (maintainer-prose class): the disposition's office reading "the four elemental governors permute among themselves" recorded as the measured six-office permutation around the fixed mediator (the brackets mix; e.g., T1: Jupiter→Moon, Sun→Mars). Fences: registration only — no claim event, no record amendment, no GOVERNS admission, no finding-row status change; D7 hypothesis-tier throughout; session prose is context, not evidence. `validate:manifest` PASS; manifest/checksums regen. |
| v1.51 | **GOV-525 claim event landed** (the sixth ceremony; the expansion of the admitted object with the tier↔family correspondence's derivability; planning-to-record: candidate record `SPEC-GOVERNS-DERIVABILITY-001` v0.2.0 — the v0.1.1 text preserved and the delta verified by mechanical reversal (reconstructed baseline digest `256f77…`) — + the expansion compliance receipt `qa/specs/gov-525-governs-derivability-expansion-admission.json` + ENTRY 17 (span 2968-3126; region digest `9fba63cc…`; ENTRY 10/15/16 regions byte-intact; prefix preserved) + the BL-059 scoping-memo accretion (§4.11 evidence + §4.12 admission record + §7 status update) + the comprehension-map §4 consumption row + the GOV-525 section above + refreshed inventories). **The expanded claim:** beyond the edge content (ENTRY 16), the **tier↔family correspondence** is derivable from pre-grant machinery — the coordinate algebra (the Klein-4 unit subgroup {1,5,7,11} of Aff(Z₁₂), canonically determined by `11u ≡ 7 (mod 12)`; BL-075) acts on the ten anchor families as the exact family-level involution **7-35↔7-1** (the closure pair), **7-34↔7-8** (the contact-target pair), **7-Z37↔7-Z17** (the interior swap), fixing **7-33/7-22/7-15/7-Z12** — identical for T1/T2, trivial for {ID, ρ}, whole-block, Z-pair-consistent, crossing the fa/ti pole (BL-076; branch `COVARIANT_CONFIRMED`, finding `probe-verified`) — up to one named bit and the anchoring remainder. **Scope precision (binding):** the correspondence's *derivability* is admitted; the families' identities remain read from the canonical ledger; the offices' semantic assignments remain framework-declared. Grounding correction carried (maintainer-prose class): the disposition's office reading recorded as the measured six-office permutation around the fixed mediator (Mercury the sole fixed point; GSL-6). The sixth claim event follows the five-precedent shape (candidate + receipt + ENTRY + consequence updates + refreshed inventories, one atomic landing); no GOVERNS admission (derivability, not authority); ENTRY 10/15/16 byte-untouched; D7 hypothesis-tier throughout; session prose is context, not evidence. Focused checks green (BL-075/BL-076 validators; `orrery:check` exit 0; suite 406); full validate observed first stop `validate:ledger-pins` (pre-existing 13, recorded not repaired; BL-058); `validate:manifest` PASS; manifest/checksums regen. |
| v1.52 | **BL-078 landed** (the D7 derivation re-test — office-purity route, region-scoped isolation; planning evidence; rulings OD-N0…OD-N3 executed): the BL-070 battery re-run against the re-verified 36-instance domain under enforced input isolation — the derivation path (domain + the eight mask-geometric candidate predicates) reads **zero granted-office bytes**; R-OFF and C-M7 are labelled comparison-region reads; the validator proves the scan is **region-scoped** (permissive probe passes; proof-strip probe rejected; 47 mutation probes rejected). **Calibration EXACT:** R-OFF `[office(s) = office(h)]` 14/0/0/22 on the verified domain (evaluated against the landed seat-contact relation, not its own definition). **The battery replicated exactly:** all nine candidates (C-M1…C-M9) side-by-side identical to the landed BL-070 confusions, verdicts, and distributions — cleanSplitCount 0; near-miss `|ΔpcSum| = 1` 12/0/2/22 missing exactly the terminal tritone contacts 127:253/4033:2017; the BL-068 zInterface axis matched (4/2/10/20); combination **C-TB-R1** 14/0/0/22 recorded **UNPROMOTED_DISCOVERY** (OD-N2); invariants and the orbital-rotation refinement re-verified. **Comparison verdict `REPLICATED`** — the original findings are robust under the stricter enforcement; the isolation did not change what the candidates could see. **Branch `PARTIAL_DERIVATION`; interpretation `R_NONE`:** the office field is the selection's ground and joins the anchoring remainder (OD-N3 framing; not wall-dissolution, not governs-admission; scoping memo §5.1 intact). BL-070's bytes frozen (`9db10a08…`); chain anchors BL-068 `b0d65bd6…`/BL-070 `9db10a08…` by self-checked fingerprint; artifact `orrery/src/generated/bl078-d7-retest.v1.json` (fingerprint `11644d40…`, raw-byte `e9c3acda…`); memo `plan/bl-078-d7-retest-memo.md`; backlog section above + this row. Fences: no D7 claim event, no record amendment, no derivation admission, no GOVERNS admission, no G1 movement, no INV-5 graduation, no M-walkability promotion, no BL-070 bytes changed; D7 hypothesis-tier throughout; session prose is context, not evidence. `orrery:check` exit 0; suite 41 files / 417 green; `validate:ledger-pins` unchanged (13 pre-existing, zero added); `validate:manifest` PASS; manifest/checksums regen. |
| v1.53 | **BL-079 landed** (the semantic registration sweep + the derivation design specification — the planning pass's two tracks). **Track A** registers BL-078's D7 replication-confirmation (`REPLICATED`; `PARTIAL_DERIVATION`/`R_NONE` — the office field is the selection's ground and joins the anchoring remainder) into the synthesis (`plan/bl-067-governs-semantic-synthesis.md`: §6 entry 6 + §7.3/§7.5/§7.6/§8 notes), the scoping memo (`plan/bl-059-governs-derivability-scoping-memo.md`: §5.1 accretion + §7 status update — obstruction-side, not evidence-for), and the comprehension map (`plan/harmonic-comprehension-map.md`: §4 consumption row + §5.9 + §5.5 receipts); no GSL-5/GSL-6 re-registration (BL-077 stands; the grounding pass's correction of the brief's stale assumption). **Track B** lands the GOVERNS derivation design specification (`plan/bl-079-governs-derivation-design-spec.md`): the per-stage derived-input mapping (S0–S5 equivalents of the frozen `scripts/d4-*.mjs` stack; granted input → derived replacement → verification status), the remaining-grant verification (**conditional green light** — the pipeline consumes the A0/A1 anchor sets + tier/role partition, the orientation bit, and presentation conventions; the derivation runs on derived inputs *plus* the named anchoring remainder), the pre-registered success criteria (set-equal 14-key D4 contact geometry vs `qa/d4-production-receipt.json`; route accounting vs the frozen pattern; **any deviation is a finding, not a failure**), the three-branch falsifiability structure (a: derived input wrong; b: hidden granted dependency; c: provenance-dependence — the deepest), and the output contract (implementation = Gate 2, execution = Gate 3, amendment = Gate 4; the derivation's execution a separate gate from its implementation). No derivation execution; no claim event; no record amendment (ENTRY 10/15/16/17 byte-untouched); no governs admission; no D7 movement; no anchoring-remainder resolution; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; the frame (§§2.6/2.7) is interpretation vocabulary; session prose is context, not evidence. `validate:manifest` PASS; manifest/checksums regen. |
| v1.54 | **BL-080 landed** (the GOVERNS derivation, Gate 2 — the implementation; planning evidence; rulings OD-80-1…OD-80-6 executed; **the pipeline run is Gate 3, separately authorized**): generator `scripts/build-bl080-governs-derivation.mjs` + artifact `orrery/src/generated/bl080-governs-derivation.v1.json` (fingerprint `63699437…`, raw-byte `50735819…`) + independent validator (60 mutation probes — 46 artifact-drift + 2 fingerprint + 10 smuggled-read/presence-strip/proof-strip rejected + 1 permissive probe passing; the region-scoping proof; two-sided static isolation) + 12 vitest pins wired after `bl078-d7-retest:check`, before `derived-path-graph:check`; chain anchors by self-checked fingerprint (BL-063 `6d33c67b…`, BL-064 `aa975820…`, BL-066 `94f0661f…`, BL-078 `11644d40…` isolation-pattern precedent, BL-055 `6d11fd93…` predicate source); memo `plan/bl-080-governs-derivation-memo.md`; backlog section above. **Findings:** (V-G2-1) the derived projection — assembled from κ (both orientations) + the seven constructor pairs + the 28-edge R structure + the labelled remainder (anchor identities, 42 edge ids) — is set-equal to the frozen projection field-for-field (anchors 14/14, R 28/28, E 14/14; missing [] / extra []; semantic and full-row) with `projectionDigests` equal to the frozen bindings: **the derived inputs are indistinguishable from the granted ones at the pipeline's interface** — the un-granting program's final validation; (V-G2-2) the derived predicate `P(s) = [forte(s) = '7-27']` selects exactly the observed 14-key contact set (confusion 14/0/0/14; exactly 2 per office); the office-flatness calibration records the fa-side reading (28/28 satellites share their parent's ledger office — the office rule is degenerate on D4); (V-G2-3) orientation: pair/edge/selection structures invariant, labels flip `c → 6-c` (14/14 label map; 28/28 cross-check vs BL-066's per-edge derived centers); (V-G2-4) isolation: region-scoped, `grantedBytesInDerivationPath: 0`, four labelled licensed reads; (V-G2-5) frozen `validateProjection` PASS + digests equal the frozen bindings. **S1'–S5' code paths landed and unexecuted** (the frozen pure modules imported verbatim; the re-specification confined to S0' assembly/selection). The conditional green light stated and mechanically enforced: the derivation runs on derived inputs **plus the named anchoring remainder** (the A0/A1 anchor sets + tier/role partition, the orientation bit, the presentation conventions) — not a full green light. Fences: no pipeline execution; no Gate 3 receipt; no claim event; no record amendment (ENTRY 10/15/16/17 byte-untouched); no GOVERNS admission; no anchoring-remainder resolution; D4 `derivable-via-R2` and D7 hypothesis-tier unchanged; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; frozen stack byte-untouched; the frame (§§2.6/2.7) is interpretation vocabulary; session prose is context, not evidence. `orrery:check` exit 0; suite 42 files / 429 green; `validate:ledger-pins` unchanged (13 pre-existing, zero added); `validate:manifest` PASS; manifest/checksums regen. |
| v1.55 | **BL-080 Gate 3 landed** (the GOVERNS derivation execution run — the corridor's capstone; the approved execution plan executed; **the branch classification determined by the run**): the single licensed run of `scripts/build-bl080-governs-derivation-execution.mjs` on the Gate 2 derived projection through the frozen pure modules imported verbatim, sealed under the frozen sealing context, compared once against the canonical observation surface, classified against the pre-registered baseline. Receipt `qa/bl080-governs-derivation-receipt.json` (raw-byte `b7f9bfbc…`; `executionFingerprint` `437de068…`; no timestamps — deterministic, byte-stable) + schema `schemas/bl080-governs-derivation-receipt.schema.json` + independent validator (59 mutation probes — 48 receipt-drift + 2 fingerprint + 4 smuggled-read/double-read + 3 presence-strip + 1 proof-strip rejected; 1 permissive region probe passing; the two-sided static isolation check) + 12 vitest pins wired after `bl080-governs-derivation:check`, before `derived-path-graph:check`; memo `plan/bl-080-governs-derivation-execution-memo.md`; backlog section above. **Findings: all five gates PASS.** G3-1 seal: `generationDigest` = the frozen `c4a7f48d…` (the frozen sealing context applied to the derived-input run). G3-2: exactly one licensed canonical observation read, asserted (the sha binding asserted at the read; the validator enforces the instrumentation statically). G3-3: the comparison block recomputes canonically; `--check` reproduces the receipt byte-for-byte. G3-4: the run's comparison block is canonically equal to the frozen receipt's comparison block field-for-field (9/9; full routeAccounting incl. T-A **20 R-missed** / 0 extra and T-B 28 = U; cells 0/10/4/0; tC `A0:1387:2741:0` + `A0:1451:2773:6` exact) with equal whole-block digests (`1f66764b…`); category `not_derived`. G3-5: no deviation. **Branch `DERIVED_FROM_DERIVED_INPUTS` — the capstone's success:** the derived-input pipeline produces the identical result; the pipeline's semantics are independent of the inputs' provenance (the receipt carries `inputProvenance: "derived"`). Two fingerprints recorded separately: `implementationDigest` `2d53cee4…` (the Gate 2 file-set + the execution builder) and `frozenClosureDigest` `7ab950fa…`. Controls ABSENT (documented; the frozen run's 18 pre-flight controls not re-run). Fences: no Gate 4 amendment (a separate, later ceremony — the corridor's one remaining ceremony); no record mutation (ENTRY 10/15/16/17 byte-untouched); no claim event; no GOVERNS admission; no anchoring-remainder resolution; D4 `derivable-via-R2` and D7 hypothesis-tier unchanged; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; frozen stack byte-untouched (imported verbatim); the frame (§§2.6/2.7) is interpretation vocabulary; session prose is context, not evidence. `orrery:check` exit 0; suite 43 files / 441 green (12 new pins); `validate:ledger-pins` unchanged (13 pre-existing, zero added; the six new immutable-baseline literal pins reviewed + allowlisted in `schemas/ledger-pin-allowlist.json`); `validate:prose-consistency` unchanged (16, zero added; generated output restored); `validate:manifest` PASS; manifest/checksums regen. |
| v1.56 | **BL-080 Gate 4 landed** (the D4 record amendment — the corridor's final gate and the seventh ceremony; the plan's "revision row v1.55" corrected to v1.56 at build time — v1.55 was consumed by Gate 3). ENTRY 18 (`provenance/DECISION_LEDGER.md`; span 3130-3330; region `9fb561f0…`/11950 line-join + `7ed4a45b…`/11951 keepends) appended as a **true end-append** — the D4 record amended **additively, a second time** toward `record_amended (derivable-from-derived-inputs)`; status transition `record_amended (derivable-via-R2) -> record_amended (derivable-from-derived-inputs)`. The historical `not_derived` record (ENTRY 10; `201efe81…`/3487 + `50b8b73f…`/3488) and the first amendment (ENTRY 15; `26c0cb43…`/9342) stand byte-intact; prefix preservation proved (first 202266 bytes = `701ff300…`, the current pre-amendment authority; first 174314 bytes = `8b7084bc…`); the three-SHA ledger lineage recorded (`8b7084bc…`/174314 -> `e551850c…`/183663 -> `701ff300…`/202266). **The amendment's distinguishing evidence — provenance-independence:** the record's original outcome was derived under granted inputs; the corridor's re-derivation ran under derived inputs (`grantedBytesInDerivationPath: 0`, mechanically enforced; 59 mutation probes rejected; one licensed observation read asserted) and produced the identical comparison block — field-for-field, digest-for-digest (`1f66764b…`; 9/9; seal `c4a7f48d…` matching the frozen receipt's seal) — the first amendment in project history with this property, completing the un-granting program's arc from granted architecture to derived architecture. Compliance receipt `qa/specs/bl-080-d4-record-amendment.json` (R1–R6 with the observed-vs-declared split; the corridor's complete chain cited — Gate 1 `6908e7b`/`ead2eec`; BL-057 Gate 2 `5528510b…`; Gate 2 `63699437…`; Gate 3 `b7f9bfbc…`/`437de068…`; the un-granting program `6d33c67b…`/`aa975820…`/`94f0661f…`; BL-075 `88838e22…`; BL-073 `811fa786…`; BL-055 `6d11fd93…`; the three legs; the frame) + the maintainer attestation (all six OD-80-4 rulings + the significance-sentence addition) + predeclared gates + the point-(c) obligation) + backlog section above + this row + refreshed inventories. The D4 corridor is complete (all four gates + this second amendment); the un-granting program's completion recorded; follow-on pointers only (BL-058; the D7 hypothesis-tier items; the anchoring remainder; the GOVERNS admission question; the directional-semantics gate). Fences: no governs admission; no wall dissolution; no D7 movement; no G1 movement; no INV-5 graduation; no M-walkability promotion; no anchoring-remainder resolution; no canonical/Court/schema/Neo4j writes beyond the ledger's own append; ENTRY 10/15 bytes immutable (the record is linked, not rewritten; any reading as reversal or erasure is rejected); the frame is interpretation vocabulary; session prose is context, not evidence. Focused checks green (Gate 2/Gate 3 validators; the BL-057 Gate 3 receipt check; pins/prose unchanged); full `npm run validate` observed first stop `validate:ledger-pins` (pre-existing 13, recorded not repaired; BL-058); `validate:manifest` PASS; manifest/checksums regen. |
| v1.57 | **BL-081 landed** (the evidence-binding infrastructure — the advisory validator + the BL-058 pin migration, one landing): `scripts/validate-evidence-bindings.mjs` (the convention's §3.2 follow-up; R1–R6 advisory-first over the bounded registry — convention chain + binding sidecars + 29 machine-emitted artifacts; the content-located session classifier resolving the cut at `6e3607b` by the ENTRY 12 marker; `--strict` enforcement; `--json`; 9 tests) + the migrated pin (the `DECISION_LEDGER_SHA256` literal deleted; its frozen value `8b7084bc…` and prefix endpoint 174314 preserved in the registered R2 sidecar `qa/d4-r2-execution-receipt-ledger-binding.json`, span `[147049, 174314)` over ENTRY 10–14, read by `scripts/build-d4-r2-execution-receipt.mjs`) + the 12 reviewed R1-class fingerprints registered in `schemas/ledger-pin-allowlist.json` + wiring (root `validate:evidence`; `orrery:package.json` `evidence-bindings:check` at the check/build tails) + memo `plan/bl-081-evidence-binding-validator-and-pin-migration.md` + backlog (BL-058 DONE + this section) + refreshed inventories. **13 → 0** (`validate:ledger-pins` PASS; inventory tests 8 passed; zero new violations); all five corridor outputs byte-identical to their pre-registered baselines (`48d460a2…`/`40a1d758…`/`5a1a787e…`/`8b269412…`/`7e14cbbc…`), `--check` exit 0; `orrery:check` exit 0; suite 43 files / 441 green; full `npm run validate` observed first stop `STALE_TWIN_HUB_CONVERGENCE` (predeclared; the chain now passes `validate:ledger-pins`); advisory validator first run: 34 checks, 5 PASS, 31 findings (25 enforced under `--strict`) — the expected advisory-first state; `validate:manifest` PASS (1,319 files). Recorded finding: the corridor generators' pins predate the convention's validator — a known enforcement gap (§3.3 advisory-first, §3.2 deferred); the convention's admission didn't include the enforcement machinery, and the corridor's artifacts were born during that gap. Fences: no twin-hub refresh (BL-051), no promotion refresh (BL-052), no green release (BL-053), no gate promotion; no claim event; no record amendment (ENTRY 10/15/16/17/18 byte-untouched); no canonical/Court/schema/Neo4j writes; frozen D4 stack byte-untouched; D4 `derivable-from-derived-inputs` and D7 hypothesis-tier unchanged; session prose is context, not evidence. |
| v1.58 | **BL-051 landed** (the twin-hub cascade refresh — the convention's first live test; the D4-preservation precondition met before the first shared-artifact refresh): P0 byte-identical preservation under `qa/halt-evidence/twin-hub-convergence-pre-refresh/` (candidate `3885bf83…`/`cf796971…`/`972394e5…`/12,396 B; report `35f88720…`, 30/0) with the preservation receipt pinning both raw-byte digests, pre-commit blob OIDs, the payload-projection recipe and the ENTRY 10 region under both labeled recipes (`201efe81…` line-join; `50b8b73f…` keepends; ledger at preservation `fb2b9b9e…`/214,223 B) — the pre-refresh bytes remain resolvable; nothing restored or synthesized. The four-artifact ledger-dependent cascade refreshed against the amended ledger (ENTRY 19) with payload projections byte-identical (provenance-only; the OD-2 geometry-drift halt pre-registered and not triggered): twin-hub `confirmed` 30/30 (`31c1bf00…`/report `c8f4cf5f…`), fifth-space census 24/24 (`2bfad475…`/`8bdcbd37…`), shadow-ladder 37/37 (`3aea3277…`/`1605ed23…`), pentatonic binding audit closure 11/11 (`ed2c98d1…`; decision-ledger binding re-issued). OD-4(a) enforcement vehicle: `CANONICAL_PLANNING_EVIDENCE` + `PROMOTION_EVIDENCE` registry lists in `scripts/validate-evidence-bindings.mjs`; R5 fields (generator/generatorDigest/invocation/generatedAt) emitted by the twin-hub generator (R5 PASS) and the promotion generator (landing BL-052); schema envelope additions only (the four declared properties each). The frozen-chain resolution update: the BL-080 execution validator resolves the frozen twinHubReceiptSha256 binding against the preserved pre-refresh copy (ENTRY 11: preservation, not rebinding; sealed receipt and frozen generation byte-untouched; `orrery:bl080-governs-derivation-execution:check` green). ENTRY 19 appended; ENTRY 10/15/16/17/18 byte-untouched (fence re-verified post-append). Verification: focused suites 22 passed; `validate:ledger-pins` PASS 0 violations; `validate:evidence` advisory run recorded (twin-hub R5/R6 PASS; promotion evidence remains the BL-052 target); `orrery:check` wiring unchanged; full `npm run validate` passes the twin-hub gate and stops at `validate:release`'s recorded 416/2 pre-existing authority-question state (frozen composite package payload identities; retained 1.8.1 full-database baseline — unchanged, no new unnamed regression). Receipt `qa/specs/bl-051-twin-hub-cascade-refresh.json`; memo `plan/bl-051-twin-hub-cascade-refresh-memo.md`; manifest/checksums regen. Fences: no claim event; no record amendment; no governs admission; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no G1 movement; D4 `derivable-from-derived-inputs` and D7 hypothesis-tier unchanged. |
| v1.59 | **BL-052 landed** (the promotion refresh — the convention's second live test; the sequence's second and final stale gate): GOV-517 re-registered under **GOV-526** with R1 (`recipe`/`digest`/`byteLength` over the exact currently committed bytes), R4 (the named `raw-bytes-sha256` recipe) and R5 (generator path/script-digest/invocation/timestamp) compliance — the ENTRY 11 census-binding incident resolved by binding the committed refreshed census digest `effa4389…` in place of the historical unmatched pin `ad857ab9…` (disclosed, never restored or synthesized). Full authorized re-execution bounded to G1–G5: preflight green (121 tests); the single licensed derivation run `derived`, T1/T2/T3 PASS, four-cell 14/0/0/0 `both`, the generation block identical, the reference digest `02fd68db…` reproduced, the seal delta `7bb41ba1…` → `170fd50b…` explained by the corrected census binding; INV-1/INV-2/INV-4 re-asserted; INV-3b/INV-5 gated. Promotion evidence refreshed (`verdict PASS`, 10+11 groups, R5 fields, `--check` reproduces; `STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE` cleared; registry R5/R6 clean). Cascade re-refreshed against ENTRY 20 (append-first): twin-hub `6e020a5d…`/`09dcdba7…`, census `6918526a…`/`eecc3e6f…`, shadow-ladder `9b645463…`/`93b605e0…`, closure `a0ed21f1…`; projections unchanged. ENTRY 20 appended; ENTRY 10/15/16/17/18/19 byte-untouched. Verification: 35 focused tests; `validate:ledger-pins` PASS; `validate:evidence` PASS (35/35 registered); `validate:fivefold-engine-promotion-evidence` PASS; `orrery:check` exit 0; full `npm run validate` 416/2 (the two pre-existing authority questions only, no new unnamed regression); `validate:manifest` PASS; both stale gates cleared — BL-053 unblocked. Receipt `qa/specs/bl-052-promotion-refresh.json`; memo `plan/bl-052-promotion-refresh-memo.md`; manifest/checksums regen. Fences: no claim event; no record amendment; no governs admission; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no G1 movement; D4 `derivable-from-derived-inputs` and D7 hypothesis-tier unchanged. |
| v1.60 | **BL-083/BL-053 landed** (the green release — the project's first full `npm run validate` fixed point at 418/0; the two freeze-era authority questions resolved): grounding receipt `qa/specs/bl-083-416-2-grounding.json`. Q1 frozen composite payload identities — spec drift at `67dcd14` (exclusion-rule change without re-canonicalization; `.pyc`-only delta; zero tracked payload change), resolved as housekeeping at `1b19d2f` (`3bf5f181…`/`a2ca5141…` → `1f5b656e…`/`3d4f3b65…`; walker-verified tracked-only). Q2 retained 1.8.1 baseline — dev-cycle receipt overwrite + release-stamped retained baseline (no dev cycle can verify against it), resolved as the release-state re-baseline under OD-083-1 (GOV-501 precedent): version flip `1.9.0` (`validated_admitted`), fresh native receipt 6/0 and disposable-local deployment receipt 3/0 (snapshot `5d26a803…`; 148-path evidence list both; credentials excluded), baseline re-stamp (`current_release_baseline`, retained release id = own release id; 1.8.1 lineage `fd089ea9…` cited per OD-083-2). Six projected payload namespaces byte-identical to the 1.8.1 baseline; counts 3061/10506; only `provenance` changed (release identity). Cascade refreshed against ENTRY 21 (append-first): twin-hub `5d0c5eef…`/`96b18d4b…` 30/30, census `3234257c…`/`e38330ac…` 24/24, shadow-ladder `9e92362d…`/`8f1e5558…` 37/37, promotion evidence `5ae56d69…` PASS, pentatonic closure `74e3f555…` 11/11, downstream field-derivation/taxonomy/D-tier projections regenerated (payload projections unchanged). Prose/state: `docs/RELEASE_NOTES.md` 1.9.0, `provenance/SOURCE_AUTHORITY.md`, `provenance/NEXT_STEPS.md` (ORR-524 decisions resolved), `docs/VALIDATION_CENSUS.md` transition row, `docs/ARCHITECTURE_MAP.md` §7 maintenance addendum, comprehension-map §4 row, this section + this row; the 20 pre-existing `validate:prose-consistency` violations resolved (19 scrum fingerprint literals re-bound by context; 1 docs claim historical-qualified) — 0 violations. Verification: 35 focused tests; `orrery:check` exit 0; full `npm run validate` green (integrated receipt 418/0); `validate:manifest` PASS; `validate:ledger-pins` PASS; `validate:evidence` advisory run. Receipt `qa/specs/bl-053-green-release.json`; memo `plan/bl-053-green-release-memo.md`; ENTRY 21. Fences: no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20 byte-untouched); no governs admission; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no G1 movement; no semantic registration beyond the release's own housekeeping; the higher-theorem question ships stated, not answered; D4 `derivable-from-derived-inputs` and D7 hypothesis-tier unchanged. |
| v1.61 | **BL-072 landed** (the composite's mechanism — the verdict set; planning evidence; rulings OD-72-1…OD-72-6 executed; the four hypotheses pre-registered non-exclusive): artifact `orrery/src/generated/bl072-composite-mechanism.v1.json` (fingerprint `45d0afd1…`, raw-byte `8a06eaee…`) + generator `scripts/build-bl072-composite-mechanism.mjs` + independent validator (64 mutation probes — 50 artifact-drift + 6 smuggled-read + 7 presence-strip + 1 proof-strip rejected; 1 permissive probe passing; the two-sided static region check) + 11 vitest pins wired after `bl078-d7-retest:check`; chain anchors by self-checked fingerprint (BL-068 `b0d65bd6…`, BL-070 `9db10a08…` frozen, BL-071 `8b2a1f6c…`, BL-055 `6d11fd93…`); memo `plan/bl-072-composite-mechanism-memo.md`; backlog section above. **Findings.** Grounding: 36-instance domain set-equal the landed BL-070 domain; the 14 contacts; the composite 14/0/0/22 and the near-miss bytes matched fail-loud. **Per-term:** Term-A 12/0/2/22 + Term-B 2/0/12/22 = joint 14/0/0/22, disjoint (12 + 2 = 14), exact residual, whole-pair respect. **The geometric finding — H-Geometric SUPPORTED (production NOT ESTABLISHED):** the D7 orbit induces a consecutive-window ladder on the satellite reach census (sizes 1/2/3; per-anchor 4/5/6/6/6/5/4 = the window-overlap counts); the size-1 terminals are exactly the reach-singletons `127:253`/`4033:2017` (an inversion pair at the orbit's poles; displacement 6 = the closure interval; closure edge `4033→127` the unique `^6`); the interior carries the 12 semitone contacts — the composite is the **interior regime ∨ the terminal regime**; the ladder is inversion-symmetric (`k → 6−k`; anchors paired at index sum 6) and the orbit's ledger offices step `+2 mod 7`. **The permutation — H-Artifact REFUTED (OD-72-2):** 0/1000 fixed-margin shuffles reproduce the separation (TP max 9; central 95% [3, 8]; observed 14 outside); exact supplementary 1/C(36,14); the **selection-effect disclosure verbatim**. **The cross-domain read — H-Informational SUPPORTED (attribution INDETERMINATE; OD-72-1):** Term-A on the class-mixed fa table (BL-055) is **12/12/2/2**, selecting both classes 12 + 12; Term-B `NOT_APPLICABLE` (never constructed); no cross-domain survival. **The minimality enumeration — H-Primitive SUPPORTED (language-relative; OD-72-4):** nine singles clean 0; 36 pairs — exactly two clean (`P3+P9`, `P5+P9`; one class under P3 ≡ P5); the composite the unique minimal description up to degeneracy. **GSL treatment (OD-72-6):** GSL-4 annotated refinement (inline, unapplied); the **GSL-7 candidate draft (un-promoted)**; registration none performed. Fences: no new measurement; no mechanism (causal) claim beyond the verdict set; no C-TB-1 promotion (`UNPROMOTED_DISCOVERY` unchanged); no claim event; no record amendment; no GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; session prose is context, not evidence. `orrery:check` exit 0; suite green (11 new pins); `validate:ledger-pins` PASS; `validate:prose-consistency` PASS; `validate:manifest` PASS; manifest/checksums regen. |
| v1.62 | **BL-072 post-landing dispositions** (maintainer disposition 2026-10-13): the GSL treatment ruled — the **GSL-4 annotated refinement** (the terminal face; the displacement-closure connection; the window-ladder structure) is the governs semantic layer's next entry, **inline, unapplied**, cited to the BL-072 artifact (no status change, no new GSL number); **no new GSL entry** — the GSL-7 candidate stands recorded, un-promoted (minimality alone carries no admission weight per OD-72-6; the geometric/informational basis is supported but the mechanism is un-established); the **verdict-set decode recognized** (geometric + informational + not-artifact + minimal, non-exclusive — the mechanism characterized; the domain-conditional interaction — the terms transfer, the separation doesn't — is the open thread); capture **BL-084** (the window-ladder structure — unique to the D₇ orbit or general to other cycles?). No artifact bytes changed (`45d0afd1…` unchanged; no re-pin, no validator change, no pins change), no record amendment, no claim event, no GOVERNS admission; D7 hypothesis-tier throughout; push held per "push when batching". Manifest/checksums regen. |
| v1.63 | **BL-084 landed** (the window-ladder generalization — the D₇ orbit's consecutive-window geometry tested across the topology; planning evidence; rulings OD-84-1…OD-84-5 executed — the full sweep A+B+C+D; OD-84-5: the calibration-as-reference-implementation discipline, one window-detection code path for the calibration and every generalization test): generator `scripts/build-bl084-window-ladder.mjs` + artifact `orrery/src/generated/bl084-window-ladder.v1.json` (fingerprint `6865b076…`, raw-byte `88c1a92f…`) + independent validator (50 artifact-drift mutation probes + 20 static/presence-strip rejections + 1 region-scoping proof-strip rejection; 1 permissive probe passing; the two-sided static region check) + 12 vitest pins wired after `bl072-composite-mechanism:check`, before `bl080-governs-derivation:check`; chain anchors by self-checked fingerprint (BL-072 `45d0afd1…` frozen — the calibration target, BL-073 `811fa786…`, BL-055 `6d11fd93…`, BL-066 `94f0661f…`, d-tier operator probe `068f9007…`, derived-path-graph `4c7abcb1…`); memo `plan/bl-084-window-ladder-memo.md`; backlog section above. **The calibration gate — EXACT:** the D₇ orbit × D6 layer re-derived through the shared window machinery matches BL-072's `geometricMapping` field-for-field (14 windows, sizes `{1:2, 2:2, 3:10}`, per-anchor `4/5/6/6/6/5/4` = overlap counts, terminals `253`/`2017`, singleton keys `127:253`/`4033:2017`, mirroring, closure `4033→127` `^6`). **Scope A (the A₀ ring × the full 28 A1 satellites; OD-84-3):** `PARTIAL` / `SLIDING_ONE_REGIME` — 12 satellites each reached by exactly one ring edge (12 consecutive size-2 windows; per-anchor `2/4/4/4/4/4/2`; mirror true; no terminals, no size-3); overlay (comparison-only): the reached set is sound (0/14 unobserved) and set-equal to the **BL-055 cornerstone near-miss selection** (12 keys; the two missed observed keys `2395`/`2899` — the zero-seam pair). **Scope B (the D-tier cycles; B1 all-ledger reach uniform 30/anchor for all ten M-cycles — the BL-070 calibration analogue; B2 the layer found empirically — ties all-tested):** D7 **FULL** (D6 layer); D1/D3/D4/D5/D6 **PARTIAL** (singleton partitions — trivially consecutive, no overlap structure); **D2 ABSENT** at the top layers (A2/D2 non-consecutive; a lower A0 layer is a singleton partition). The D₇ orbit is the only D-tier cycle with a sliding layer. Supplementary A-tier census: the A0 ring's own-tier layer is **FULL** (`{1:28, 2:10}`), its A1 layer the Scope A sliding variant; the A1 cycle top-layer ABSENT; the A2 cycle all-ABSENT; exactly **two of ten** M-cycles slide — the **dual-closure pair** (D7, A0) — and they are the only two-interval orders (`^11`/`^7` uniform path + distinguished `^6` closure). **Scope C (the composed graph's operator layer — all simple directed cycles over the 60 catalog edges; all edges Hamming-2, inverse-paired; no length-7 cycles exist):** 476 directed / 238 unordered cycles, lengths `{4:20, 6:24, 8:48, 10:88, 12:120, 14:108, 16:56, 18:12}`; **14 directed (14 unordered) slide**, lengths 4/10/12, each in exactly one orientation (the reverse non-consecutive); 462 non-consecutive. **Scope D:** (a) length-7 **REFUTED** (neither necessary nor sufficient); (b) satellite:anchor ratio **REFUTED** (same-ratio layers carry different verdicts); (c) uniform all-ledger reach **SUPPORTED (property), non-discriminating**; (d) Hamming-2 generality **REFUTED as stated** (necessary in the data, not sufficient). **Synthesis: `BOUNDARY_LAYER_CONDITIONAL`** — not universal (462/476 ABSENT; six of seven D-tier cycles no sliding layer), not D₇-specific (the A0 ring and 14 unordered operator cycles carry it); the principle is **reach-order alignment**; the D₇ orbit's special property is its dense class-pure D6 layer (BL-068) turning its two-interval order into the FULL two-regime ladder with tritone terminals; the A0 context (coordinate image; same geometry in different layers) completes the boundary pair's characterization. GSL treatment: the **GSL-4 generalization refinement inline, unapplied**; no new GSL entry; no registration. Fences: no new measurement beyond masks-only Hamming-2 reach arithmetic over landed bytes (BL-070 precedent); no mechanism (causal) claim; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no higher-theorem answer; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier throughout; the frame is interpretation vocabulary; session prose is context, not evidence. `orrery:check` exit 0; suite 45 files / 464 green (12 new pins); `validate:ledger-pins` PASS; `validate:prose-consistency` PASS; `validate:manifest` PASS; manifest/checksums regen. |
| v1.64 | **BL-085 Phase 1 landed** (the BL-084 registration sweep — fast-lane additive; rulings OD-P2-1…OD-P2-6): synthesis `plan/bl-067-governs-semantic-synthesis.md` §5 gains the window-ladder geography block (the boundary-layer-conditional verdict; the reach-order alignment principle with the descriptive-not-production qualification carried verbatim; the dual-closure pair; the D₇ special property — the dense class-pure D6 layer; the 14/238 unordered operator rarity) + §7.3/§7.5/§7.6/§8 registration notes; scoping memo `plan/bl-059-governs-derivability-scoping-memo.md` §4.13 accretion (evidence-for: the boundary geography's reach structure is alignment-conditional, not universal) + §7 status update 2026-10-14 + §8 accretion note; comprehension map `plan/harmonic-comprehension-map.md` §5.10 + §4 consumption row (OD-P2-3, the BL-077 precedent); the BL-084 memo G-9 prose-correction note (the artifact's `gslTreatment` one-liner "7 of 238" vs the authoritative `scopeC.aggregate.slidingUnorderedCount` = 14 — OD-P2-5, artifact bytes unchanged). Every added claim cites `orrery/src/generated/bl084-window-ladder.v1.json` (fingerprint `6865b076…`) + memo. Registration only: no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no finding-row status change; no G1 movement; D7 hypothesis-tier throughout; session prose is context, not evidence. `validate:manifest` PASS; manifest/checksums regen. |
| v1.65 | **BL-085 Phase 2 landed** (the alignment principle's first prediction — memo-only per OD-P2-4; the pre-registration fixed before any computation; no artifact — the escalation was not triggered): memo `plan/bl-085-alignment-prediction-memo.md`. The prediction (stated before computation): Term-B's inapplicability on the fa domain is a consequence of the reach-order alignment principle, not a confound; the pre-registered table = the core 7 (fa postdiction, D1/D3/D4/D5/D6 predictions, D7 control) + Tier-4 appendix, with four mechanically-checkable refutation conditions and the scoring method (the OD-84-4 rule re-deriving every domain's alignment verdict from the landed census fields; the applicability rule ruled OD-P2-6 — FULL-with-terminals the sole trigger). **Results — the core 7 holds, 7/7:** 546 stored layer verdicts re-derived with 0 mismatches; the fa census (12 windows, all size 2, zero size-1) shows the predicate selecting 0/12 — the recorded NOT-APPLICABLE structurally explained; the five D-tier PARTIAL domains land the predicted NOT-APPLICABLE (whole-layer restatement); the D7 control's 2/14 proper-subset selection is the realized D7 role. **No refutation condition fires.** The BL-072 attribution refines from INDETERMINATE to **alignment-conditional** (the reach-geometry side suffices; the production direction stays open). Appendix: 3 consistent rows (D2/A1/A2, with the pre-registered sensitivity note), 1 live unobserved prediction (the A0 own-tier layer), 1 alignment-half row (the operator sliders). The G1 scoping sketch maps the alignment vocabulary onto BL-024 as questions only (the central observation: on the 330 side the reach measure and the edge rule are the same choice viewed twice). **The alignment principle's status: descriptive characterization → predictive within the tested topology** (the causal/production question remains open). Fences: no new measurement; Term-B never constructed where NOT-APPLICABLE; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no new GSL number; no C-TB-1 promotion; no G1 movement; D7 hypothesis-tier throughout; session prose is context, not evidence. `validate:manifest` PASS; `validate:prose-consistency` PASS; `validate:ledger-pins` PASS; manifest/checksums regen. |
| v1.66 | **BL-086 landed** (the A₀ own-tier Term-B test — the alignment principle's live prediction CONFIRMED; the A1-top-A2 discriminating experiment classified Branch L; planning evidence; rulings OD-1…OD-4 executed; memo-only per OD-2 — Branch L is prose-grade, no artifact): memo `plan/bl-086-term-b-own-tier-memo.md`. Pre-registered before computation (frozen prefix 16,830 bytes, sha256 `9021f925…`; prefix byte-unchanged). **Gate 1 PASS** — the census landed in BL-084's artifact (fp `6865b076…`, raw-byte `88c1a92f…`); the `{1:28, 2:10}` histogram verified field-for-field. **Re-derivation EXACT** (both layers, BL-084 code path — OD-84-5 discipline). **The predicate (BL-072 Term-B verbatim) selects 28/38 on the A₀ own-tier layer** — the 28 singletons, a proper subset; terminal correspondence holds: pole windows occupied (1383 via `1387`; 2517 via `2773`), one-step windows interior, singleton census `6/4/3/2/3/4/6` with unique endpoint maxima, mirror-symmetric — **CONFIRMED (full)**; modes (i)/(ii)/(iii) not fired. **A1-top-A2: Branch L (ladder-tracking)** — the mechanical firing is 28/38 on both layers (histogram-forced component, recorded under every branch), but A1's two endpoint-spanning windows `[0,6]` break contiguity (no ladder, no selection); the principle predicts the ladder — "FULL-with-terminals" means the regime structure, not the count. The principle's predictive range extends to a genuinely new case (the A₀ own-tier row: LIVE/unobserved → CONFIRMED — not a retrodiction); no live-unobserved applicability instance remains; the production/mechanism question stays open. `validate:manifest` PASS; `validate:prose-consistency` PASS; `validate:ledger-pins` PASS; BL-084 `--check` fresh; manifest/checksums regen. |
