# Sprint Memo — Fivefold Engine & Hypergraph Mesh SPEC v3 (corrected)

**Status:** sprint memo (planning evidence). No ledger entry, no evidence obligations.
Corrects the unverified brainstorm spec v2.2.0 after the read-only adjudication pass
(`scrum/plan/fivefold-mesh-adjudication.md`). Not registered, not cited as authority;
nothing here amends SPEC-001, the Court registry, or the Q freeze. Evidence-class tags
follow the comprehension-map convention (`scrum/plan/harmonic-comprehension-map.md:6-13`):
`[ADMITTED]` with repo citation, `[HYPOTHESIS]`, `[PROPOSAL]`, `[OPEN]`. SPEC-001 §0
fences are in force; the Court-correspondence claim awaits its own ceremony (BL-011);
SPEC-001 §6(4) remains separately open.

## §1 Engine core substrate

`[ADMITTED]` 16-state substrate (4-bit) with overlay dynamics; authored object is Q1 plus
the action law `Q_z = Q_1^z`; the 12 x 16 table is generated, never transcribed
(`src/fivefold/quintessence.py:31-114`; `tests/test_fivefold_q_table.py`). Q1 is the
fifth-stack 12-cycle `t_k = 7k mod 12 -> (0,7,2,9,4,11,6,1,8,3,10,5)`; traversal
`{0000..1011}`, still set `{1100..1111}` (`quintessence.py:37-45`). Composition is
4 states + 1 law, Mercury-as-dynamics `[ADMITTED]` (freeze memo §1,
`scrum/plan/bl-010-q-table-freeze-memo.md`); the §6(4) bridge use of that composition is
`[HYPOTHESIS]` (freeze memo §4). INV-5 closure is tested-green but gated: a deferred
decision point, not a claim (freeze memo §5).

`[ADMITTED]` Bit order MSB-first: b3 Mars/Fire, b2 Jupiter/Air, b1 Venus/Water,
b0 Saturn/Earth (`quintessence.py:47-55`; `framework/TOPOLOGICAL_ANCHORING.md:90-96`;
`framework/AGENTS.md:279-283`).

### §1.1 Bit polarity and elemental assignment

`[ADMITTED]` 0 = External (dispersion/fluid), 1 = Internal (cohesion/fixed anchor). The
Court registry pairs ascending engagement with the ascending positions: C0 `0000`
(all External) with `{0,2,4,7,9}`, through C4 `1111` (all Internal) with `{0,3,5,8,10}`
(`seven-governors-court-substrate-v0.1.0/canonical/court-rooted-positions.json:11-192`;
`framework/AGENTS.md:279-283`). Field-for-field certified in
`scrum/plan/bl-044-court-voicing-audit.md:15-21`.

### §1.2 Partition 16 = 12 + 4

`[ADMITTED]` Traversal set `{0000..1011}` (12 states) and still set `{1100..1111}`
(4 states) are disjoint and total (`quintessence.py:37-45,58`;
`tests/test_fivefold_q_table.py::test_partition_disjoint_and_total`).

### §1.3 Keep-or-sharpen chain (rebuilt per the A1 verdict)

`[ADMITTED]` External keeps the stack degree; Internal sharpens it to the semitone-raised
neighbor. Each Court step flips one register and replaces one pitch, with disjoint XOR
supports `{4,5}`, `{9,10}`, `{2,3}`, `{7,8}` (`framework/AGENTS.md:285-302`;
`framework/TOPOLOGICAL_ANCHORING.md:162-184`; registry `xorSupportFromPrevious`).

| State | Mask | Name (display, proposed) | Engagement | Color gloss (proposed emblem, not claim) |
|---|---|---|---|---|
| 0000 | {0,2,4,7,9} | Major Pentatonic | all-external seed | outward activation, brightest |
| 1000 | {0,2,5,7,9} | Scottish Pentatonic | Mars internal | suspended horizon |
| 1100 | {0,2,5,7,10} | Qing Yu | Mars + Jupiter internal | engine hinge |
| 1110 | {0,3,5,7,10} | Minor Pentatonic | + Venus internal | inward cohesion |
| 1111 | {0,3,5,8,10} | Man Gong | all-internal, fully realized | magnetic retention, darkest |

Sources: registry lines above; display names and `semantic_fit` glosses from the
**proposed** map `schemas/elemental_pentatonic_scale_map_v1.0.0.yaml:95-100,220-223`
(CRT-350 proposed; `physical_quantity_claim: false`); `kappa_court` ascends 0 -> 1 over
C0 -> C4 (registry `kappaCourt` fields); the proposed `brightness` ordinal runs 22 -> 26
(`:95-218`) and is cited as an unconfirmed monotonic ordinal only — its field semantics
are `[OPEN]`.

**Rejected alternative (recorded with reason).** `[HYPOTHESIS — REJECTED as registry
claim]` internal = keep the stack degree (1111 = pure stack = Major Pentatonic; 0000 =
sharpened minor pentatonic). Reason: it contradicts the admitted registry pairing and the
disjoint XOR supports, and it was already adjudicated as a layer confusion in BL-044 §5
(`scrum/plan/bl-044-court-voicing-audit.md:59-72`). It survives only as the Orrery bucket
overlay's counterfactual version — labeled, toggleable, unasserted
(`orrery/src/path-replay.ts:15-19`; `scrum/plan/bl-020-debugger-foundation-memo.md`).

## §1b Forced correspondence (admitted)

`[ADMITTED — SPEC-FIVEFOLD-COURT-CORRESPONDENCE-001 v0.1.1, ENTRY 13; TIERING claim-catalog
class 2 (docs/TIERING.md:18-20)]` Given the admitted identification
engagement-Cn = registry-position-Cn, the element-to-degree mapping is forced with zero
free choices: Fire <-> 4->5, Air <-> 9->10, Water <-> 2->3, Earth <-> 7->8 (canon
internalization order Mars -> Jupiter -> Venus -> Saturn with disjoint supports and Gram
matrix `2I_4`; `framework/AGENTS.md:285-302`). The identification is admitted at
configuration level; the derivation above is its declared content. Machine check:
`tests/test_court_engagement_correspondence.py`.

**Scope note (binding).** This is **not** a SPEC-001 §6(4) resolution. §6(4) gates the
overlay-to-GOV-517 **input-lane** correspondence (I1 distance-2 pairs, I2 A-tier CONSTRUCTS
transitions, I3 empty, I4 A-tier masks;
`docs/specs/fivefold_constructs_engine_spec.md:287-296`;
`qa/gov-517-input-boundary-registration.json:31-61`), which remains entirely unevidenced and
separately open. The present correspondence is overlay-to-**Court registry positions**:
admitted as `SPEC-FIVEFOLD-COURT-CORRESPONDENCE-001` v0.1.1 (ENTRY 13). Admission
evidence: the registry lines, the BL-044 certification, the bit-order test, the XOR
geometry, the machine-check test, and the adjudication report.

## §2 Scale universes (corrected)

`[ADMITTED]` Rooted counts `C(11,4) = 330` and `C(11,6) = 462`. Each universe spans all
**66 Tn-classes** (not one Forte family); rooted members per Tn-class are exactly 5 / 7;
zero nontrivial transpositional symmetry (orbit 12 = 792/66). Cornerstone families:
`[ADMITTED]` 5-35 has exactly 5 rooted members (C0-C4); 7-35 has exactly 7 rooted members
(Lydian, Ionian, Mixolydian, Dorian, Aeolian, Phrygian, Locrian). The v2.2.0 assertions
"462 = 7-35 family" and "330 = 5-35 family" are withdrawn.

## §3 Hypergraph mesh (corrected)

`[ADMITTED]` The true object is a bipartite containment graph between rooted 5-sets and
rooted 7-sets (edge = subset containing the root), with variable degrees; the uniform
"3-to-3 mesh over all 330/462" is withdrawn. Rooted degree distributions: 7-side
`{0: 381, 1: 60, 2: 18, 3: 3}`; 5-side to rooted 7-35 `{0: 255, 1: 50, 2: 20, 3: 5}`.
Planning-evidence incidence artifact:
`canonical/pentatonic-binding-candidates/pentatonic-7-35-parent-audit-v1.json`
(`status: planning_evidence`).

**Sliding-window theorem (diatonic<->anhemitonic subgraph).** `[ADMITTED]` Every rooted
diatonic contains exactly 3 unrooted 5-35 subsets; the rooted window is 1-2-3-3-3-2-1:
Lydian {C0}, Ionian {C0,C1}, Mixolydian {C0,C1,C2}, Dorian {C1,C2,C3}, Aeolian {C2,C3,C4},
Phrygian {C3,C4}, Locrian {C4}; 15 edges = 5 x 3; every rooted 5-35 sits in exactly 3
rooted diatonics. **Precision correction:** rooted C Ionian contains 2 rooted kernels
(`{0,2,4,7,9}`, `{0,2,5,7,9}`); the third (`{2,4,7,9,11}`) lacks pitch 0. Lydian and
Locrian each hold a single rooted kernel (structural fact).
Non-universality counterexample: `{0,1,4,5,7,8,11}` is heptatonic class `(0,1,2,5,6,8,9)`
and contains zero anhemitonic pentatonics. Evidence: adjudication report A3;
`docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md:236-266`.

### §3.2 Dual-axis invariance

`[OPEN]` The mesh carries two coordinates: engagement state (registry vector) and
pitch-color/compression (`kappa_court`, proposed brightness ordinal). The adjudication
fixes the engagement-to-mask pairing and records the monotone compression axis, but the
v2.2.0 "dual-axis invariance" claim was not among A1-A5 and is carried here as
`[OPEN]`, to be defined and probed rather than assumed. Any invariance across the two axes
is testable via per-node engine instances plus mesh transport (see §3b).

## §3b Kernel universality vs. windowed teleology; mesh hops as re-grounding events; semantic transport with a path-dependence gate

- **Universal Q instances `[PROPOSAL]`**: every mesh node runs its own (transposed) Q
  instance; the z=0..4 window and its teleology marker fire only for 5-35 windowed kernels
  (the 12 fifth-stack five-windows, of which exactly C0-C4 are rooted). Other rooted 5-sets
  are scattered kernels: the engine runs, the marker does not fire.
- **Re-grounding at seams `[PROPOSAL]`, repo-consistent**: a mesh hop does not transfer the
  departure node's Q state. The arrival node instantiates its own engine. No admitted
  record asserts cross-hop state handoff. Worked seam: Andalusian Aeolian -> harmonic minor
  is Hamming 2 (10 -> 11), source holds 3 rooted 5-35 kernels, target holds 0; the crossing
  goes through the admitted bridge kernels 5-23 (`{0,2,3,5,7}`) and 5-27 (`{0,3,5,7,8}`),
  each with 2 rooted 7-35 parents (`docs/MATHEMATICAL_REALIZATION_SPECIFICATION.md:661-665`;
  `docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md:261-266`). 5-32 is scattered with zero 7-35
  parents and does not mediate.
- **Semantic transport `[OPEN]`**: cornerstone meanings may be transported to all nodes
  via mesh paths, but transport consistency is a testable property, not an assumption.
- **Path-dependence gate `[PROPOSAL]`**: do different mesh paths between the same two nodes
  deliver the same transported semantics? To be probed by the lattice program's existing
  path-enumeration machinery (BL-031; `scrum/BACKLOG.md:158,167`), not asserted.

## §4 Actor parallel with concurrency properties

`[PROPOSAL — vision, not repo work]` The actor-mesh reading (five actors as the five Court
positions, with concurrency semantics) is carried only as post-BL-031 vision. No
concurrency property is established, and per-node transposed Q instances presuppose the
multi-phase lift (SPEC-001 §0 fence 5), which is a separate future candidate. The
architecture and the lattice program are the same investigation from two directions.

## §5 Subsystem routing (corrected layering)

Layering is preserved: CONSTRUCTS/GOVERNS split, no unified operator coverage, no topology
mutation, no multi-phase material (SPEC-001 §0 fences; `docs/specs/fivefold_constructs_engine_spec.md:33-40`).
Downstream targets reclassified:

- **Harmonic Debugger = active.** Cursor mapping admitted; bucket overlay hypothesis behind
  a labeled toggle; Andalusian seam replay with membership checks (BL-020-023;
  `orrery/src/path-replay.ts:182-334`; `scrum/plan/bl-020-debugger-foundation-memo.md`).
- **Actor mesh / game audio / MIDI = post-BL-031 vision.** Hidden dependency recorded:
  per-node transposed Q instances presuppose the multi-phase lift (fence 5).
- **SLM orchestration = vision-park, not repo work.**
- **Dynamic pivot modulation `[PROPOSAL]`**: re-grounding language replaces state handoff;
  no cross-node state transfer is assumed.

## Revision history

| Version | Change |
|---|---|
| v2.2.0 | Brainstorm draft. Unverified against the repository; never written, registered, or cited. |
| v3.0.0 | Adjudicated corrections. A1 polarity: registry orientation retained; session opposite recorded as rejected alternative with reason. A2 forced correspondence retained but retagged: new Tier-2 canonical admission (BL-011), not a SPEC-001 §6(4) resolution. A3(c): rooted/unrooted kernel precision corrected. §2: 66-class universes, 5/7 rooted cornerstone members. §3: variable-degree bipartite graph, sliding-window theorem, Lydian/Locrian single-kernel fact. §3b: kernel universality vs. windowed teleology, re-grounding, semantic transport, path-dependence gate. §4: actor mesh demoted to post-BL-031 vision. §5: downstream reclassification, multi-phase dependency disclosed. Brightness hedged as unconfirmed ordinal `[OPEN]`. |

v2.2.0 unverified assertions and dispositions: (1) polarity "pinned strictly to canon"
kept, but sourced to the registry pairing plus proposed emblem glosses rather than the
session reading; (2) 330/462 family identities withdrawn; (3) uniform 3-to-3 mesh
withdrawn; (4) "Q window in every node" restricted to windowed 5-35 kernels; (5) seam
mediation by 5-35/5-32 withdrawn in favor of 5-23/5-27 bridges and re-grounding; (6)
downstream targets re-tiered with the multi-phase dependency disclosed.
