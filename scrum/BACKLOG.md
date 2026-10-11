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

Full `npm run validate` stops at the recorded 416/2 + `STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE`
state. The D4-freeze state is deliberately preserved pending the later promotion refresh
(BL-051/052); these stops are the recorded release state (`scrum/plan/d4-freeze-handoff.md`),
not defects of this landing. Recorded-vs-repairable per the binding convention.

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

### BL-051 — Twin-hub cascade refresh (parked) [ACTIVE]

Live test 1 (Convention §4 item 1): D4-bound evidence preserved first per ENTRY 11 mandate,
then first R2/R3 span bindings born (`qa/conventions/evidence-binding-001-admission.json:100`
confirms none born yet); payload/provenance separation exercised. Required before green release.

### BL-052 — Promotion refresh (parked) [ACTIVE]

Live test 2 (Convention §4 item 2; SPEC-001 §4.2): GOV-517 re-registration under R1/R4/R5;
INV-1–4 re-assertion on fresh execution (INV-3b/5 only if gates resolved); clears
`STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE`. Consumes BL-010 outcome. Required before green release.

### BL-053 — Green release (parked) [ACTIVE]

Blocked by BL-051 + BL-052. All gates clear, full validate green.
(Freeze-handoff 416/2 state is explicitly not this.)

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

### BL-058 [CAPTURED] — Ledger-pin inventory repair (ledger-named literal class)

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
