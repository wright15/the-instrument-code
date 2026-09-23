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

### BL-011 — Overlay correspondence evidence (CONDITIONAL) [ACTIVE]

Only on explicit maintainer decision that the elemental overlay becomes reality: build the
§6 item 4 correspondence evidence (`:292`). Asymmetry verified (`:91-95`): I1 distance-2 pairs,
I2 A-tier CONSTRUCTS, **I3 empty**, I4 A-tier masks — the Water lane is free design.
Must not rewrite historical execution (`:165-168`). Sprint.

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
Suite 155 passed; tsc and all Orrery checks green; no catalog/manifest bytes changed.
Listening verdicts pending maintainer (recipe in memo). Pre-existing browser-harness
objective-id mismatch surfaced in memo, untouched.

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
and UI. Remaining for this item: maintainer listening verdict (memo) and golden-path
registration once BL-023's catalog format lands.

### BL-022 — Parallel minor modulation (mode-axis edge) [ACTIVE]

7-35 Ionian → 7-35 Aeolian on a shared tonic (C Ionian ↔ C Aeolian). Same set-class, different
root — closed mod-7 rotation coordinate (PROPOSAL language). Genuinely new: only existing
modulation objective is Lydian→Aeolian (`ORR-406:44-46`). Second golden path.
Exit: plays and verifies; trace shows rotation-axis move, zero set-class change.

### BL-023 — Golden-path catalog export [ACTIVE]

Machine-readable fixture catalog of verified paths (test data — sprint artifact, not evidence).
Binding constraint (`EPIC-511:24`, `ORR-511:23-24` forbid legal-move byte changes): layer
read-only views + local session overlays; reuse `legal-moves.v2` pin + `audio.v1` manifest guard;
fail closed (`orrery/README.md:61-67,155-157`). Consumers: transition-logic regression tests;
BL-031 seam-edge seed fixtures. Exit: format defined, both cadences exported, consumed by ≥1 suite.

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
