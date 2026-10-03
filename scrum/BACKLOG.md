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

### BL-032 — Phase B: claim event (ceremony — ONE session) [ACTIVE]

If and only if Phase A's memo supports it: admit the phase-extended topology as a candidate
record. Standard ceremony: candidate doc, compliance receipt per convention, ledger entry,
born-compliant R1–R6 evidence at birth. Claim: phase-extended topology resolves seam
connections; govern re-evaluation warranted. Does NOT amend SPEC-001 — cites fence #5 as charter.
Gate: maintainer decision on Phase A's memo. Exit: admitted topology record, or honest negative
memo (legitimate).

### BL-033 — Phase C: dependent govern probes (sprint until claim) [ACTIVE]

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
