# DIRECTIVE MVP8-DIR-1 (rev 2) — Pentatonic-Aware Q Initiation and Connector Transfers

- **Title:** Pentatonic-Aware Q Initiation and Connector Transfers
- **Directive ID:** `MVP8-DIR-1` (rev 2; supersedes rev 1 and the `PENTATONIC-Q-DIR-1` rev 0 skeleton)
- **Revision:** rev 2 = rev 1 plus two pre-execution input-verification corrections, verified read-only against `L27` on 2026-11-07: (1) the B2 baseline is corrected from the non-reproducible `128/192` figure to `144/192 = 0.7500` full-table; (2) the C3 bet is split into C3a (dwell-pillar continuity) and C3b (satellite-transit continuity) to match the verified path topology. No other content changed.
- **Authority:** Planning Seat (Erick), locked 2026-11-07
- **Status:** AUTHORIZED FOR SCRATCH EXECUTION (Tasks 0–E). Repository remains strictly read-only until a separate `L28` landing authorization.
- **Execution Realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_pentatonic_q/`
- **Granularity Rule:** Any repository landing under this directive is **`L28`**, executed as a single dedicated git commit (carrying forward the §1.3 granularity rule of `MVP7-INTENTION-DIR-1`). No tag, no push.

---

## §0. Architectural Rationale & Adjudicated Decisions (Q1–Q5)

### §0.1 Why the Bipartite Hypergraph Enters the Q Layer
The `Q` projection (`project()`, `SPEC-FIVEFOLD-CONSTRUCTS-001` §1.3) currently answers two of the three questions posed by a governed lead line:
1. **Which pitch classes are legal?** Answered by the 7-note container mask (100% gate and mask compliance).
2. **In what order are they traversed?** Answered by the fifth stack (`TRAVERSAL_CYCLE = (0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5)`), whose first five stations (`GENERATIVE_WINDOW`, positions 0–4) generate an anhemitonic pentatonic (`5-35`) while modal color degrees sit in the tail (positions 5–11).
3. **Which pitch classes are *focal* (home) inside the current node?** Previously unanswered. Without focality, carried `Q` states can initiate phrases mid-tail on modal color degrees as if they were structural roots.

Rather than authoring per-node degree heuristics (which hold in Ionian and collapse in bridge or non-diatonic contexts), focality is read directly from the derived bipartite hypergraph (`derived/hypergraph/bipartite-inclusion-v1.json`, 462 heptatonic masks × 330 anchored pentatonic subnodes, status `planning_evidence`). Shared pentatonic subnodes (including the 70 field-wide multi-family bridge subnodes) simultaneously provide a formal connector semantics for macro transitions: a melody holding a shared subnode crosses between distinct 7-note families with zero out-of-key emissions and zero focal breaks.

### §0.2 Adjudication of Predeclared Decision Points (OPEN Q1–Q5)

| Open Question | Adjudicated Decision (Locked for `MVP8-DIR-1` rev 1) |
|---|---|
| **Q1 — Sprint Numbering** | Designated **`MVP8-DIR-1` (rev 1)**. The meter/duration law (lock-pack clause 6) is explicitly deferred to MVP-9 and remains out of scope. |
| **Q2 — Zero-`5-35` Node Behavior** | **Hybrid Transit/Dwell Rule:** **(c) Borrowed Focus via Connector** is the default on transit bars (keep the preceding node's focal set when it is a valid shared subnode of the current container, or else select a shared bridge connector subnode); **(b) Native-Class Initiation** applies when a piece *dwells* on a zero-`5-35` node (select the node's own canonical rooted pentatonic subnode, e.g. `5-27:0` `{0,3,5,7,8}` on `2477@0`). Option **(a) Naked Fifth Stack** runs as a labelled contrast arm in Task D. |
| **Q3 — Deterministic Focal Selection & Tie-Breaks** | Total 3-tier deterministic priority over a node's candidate subnodes: **(1) Phase-Root Alignment:** prefer a `5-35` subnode (or native-class subnode under Q2b) whose canonical root equals the active phase pitch class (`root_pc == phase`); **(2) Traversal-Head Containment:** prefer a subnode containing the carried `Q` pitch class (`fifth_stack_pc(q_in, phase)`); **(3) Canonical Index:** select the lexicographically smallest subnode ID (`{forteTnI}:{root}`). |
| **Q4 — Governance Strength** | **Initiation & Structural-Window Governance (Cohesion Precedent) with Labelled Contrast Arms:** Phrase initiation (`sub == 0`) and structural generative-window positions (`orbit_index` in `0..4`) are governed to the active focal set (snapping non-focal emissions to the nearest in-focal pitch class by fifth-stack order), while tail positions (`orbit_index` in `5..11`) permit in-mask modal color tones (preserving Lydian `#4`, Ionian `4`, Harmonic Minor `#7` identity). Strict all-step snap (`snap_all`) and `hold_on_unsafe` run as labelled diagnostic arms in Task B/D, never as silent replacements. |
| **Q5 — `SPEC-001` Admission Posture** | `derived/hypergraph/bipartite-inclusion-v1.json` and `qa/pentatonic-binding-audit-closure.json` remain strictly `planning_evidence` (`admissionEffect: none`, `graphScope: detached_audit_only`) throughout scratch execution. Nothing in this directive amends `SPEC-FIVEFOLD-CONSTRUCTS-001`. If Tasks A–D pass their locks, Task E *proposes* a `SPEC-001` §1.3 amendment for separate governance action. |

---

## §1. Opening Fixed Point, Pins, and Scope

### §1.1 Opening Fixed Point (`L27`)
- **HEAD:** `d1b2286a5b6f3783af24094eb78e40ab511bb8e5` (working tree clean)
- **Decision Ledger (`provenance/DECISION_LEDGER.md`):** SHA-256 `da9c79410cf2f3429509ca07f4a82effe49932d061ca96a4d36d28a401668149` (`407,293 B` / `4,383 lines`)
- **Release Manifest (`MANIFEST.json`):** SHA-256 `6632ab6a3141e58519fe5846794eb9befd76d1cd3479f9d65934a2a30ce0bc27` (`1,834 files` / `263,181,122 B`)
- **Checksums (`CHECKSUMS.sha256`):** SHA-256 `8ee97d4ea46a3034ff4a34818f6df22d7438b5357d2aca66f6cdc54a918b4451` (`218,401 B`)
- **Completion Validation (`qa/completion-validation-report.json`):** SHA-256 `6b8cbf29d67f8d728f69bccdf84c4ead2689ff2c11a45bbe8f1b16a4a5dff20d` (`4,998 B`, `passed: true`, release closure `418/0`, prose violations `0`)
- **Prior Landing Receipt (`qa/mvp7_intention_landing_receipt.json`):** SHA-256 `d0d7aaec2c5cee05f71074df36d3606b7194a99390f916f266809ad99feba0a6` (`55,400 B`)
- **Architecture Map (`docs/ARCHITECTURE_MAP.md`):** SHA-256 `865ab785164f85c0426d849cb3314c8c41efe81155ce14bd7fe6392ca5d0c381` (`34,880 B`)

### §1.2 Primary Input Pins (28 Pinned Artifacts)
All 26 pins from `MVP7-INTENTION-DIR-1` Task 0 (`tools/governed-loop/mvp2.py`, `census_462.json`, `frozen_ground_truth.json`, `frozen_seam_substrate_v3.json`, `seam_legal_moves_v3.json`, `src/fivefold/quintessence.py`, `orrery/src/audio.ts`, `orbit_spectral_catalog.json`, `ORBIT_SPECTRAL_CATALOG.md`, and the frozen MVP-4 through MVP-6.3 modules and control WAVs) carry forward unchanged, plus 2 newly pinned pentatonic evidence inputs:
1. `derived/hypergraph/bipartite-inclusion-v1.json`: SHA-256 `903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41` (`320,972 B`, `status: "planning_evidence"`)
2. `qa/pentatonic-binding-audit-closure.json`: SHA-256 `ea61c0f055d1cfb0caca657ebb05eb0638c0efc2be4336e3755bb07ed690457b` (`4,552 B`, `status: "planning_evidence"`, `admissionEffect: "none"`, `graphScope: "detached_audit_only"`)

### §1.3 Scope & Proposer Posture
- **Zero LLM calls (`llmCalls: 0`):** The mechanism is 100% deterministic; no LLM proposer or curator is invoked anywhere in this sprint.
- **Meter/Duration Law Untouched:** `K_TRANSIT = 5`, `K_DWELL = 12`, `MICRO_STEP_MS = 300` remain frozen; the meter/duration law is untouched.
- **Subsystems Untouched:** No byte changes to `mvp2.py`, `src/fivefold/quintessence.py`, `orrery/src/audio.ts`, frozen substrates, or landed MVP-4..7 modules.

---

## §2. Guard Block & Prose Fences (Mandatory on Every Receipt)

Every JSON receipt and trace emitted under this directive must carry:
```json
{
  "layer": "SPEC-001 §1.3 overlay dynamics",
  "causationClaim": false,
  "physicalQuantityClaim": false,
  "tierClassifier": false,
  "globalCHNull": true,
  "gov517_correspondence_claimed": false,
  "still_set_label": "still_set",
  "bipartiteEvidenceStatus": "planning_evidence",
  "bipartiteAdmissionEffect": "none",
  "bipartiteGraphScope": "detached_audit_only"
}
```
- **§2.1 Prose Guardrails:** Carried from MVP-7 §2.1: never assert linear `ANCHOR_FLAT`, never claim a B2 proof, never infer acoustic octave motion from D7 container `pcSum` alone, never formulate `C_H` or entropy, and never call the `still_set` `{12,13,14,15}` a "kernel" (canonical "kernel" means the `5-35` Court-family cornerstone).
- **§2.2 Bipartite Evidence Citation Rule:** Every receipt or report that reads `derived/hypergraph/bipartite-inclusion-v1.json` or `qa/pentatonic-binding-audit-closure.json` must record their status as `planning_evidence`; no artifact may describe the pentatonic binding as admitted into canonical runtime or Neo4j topology.

---

## §3. Task Breakdown & Predeclared Bets

### Task 0 — Anchors, $S_{000}$ Reachability Audit & Predeclaration Lock (`task-0/mvp8_task_0.py`)
1. **T0.1 Fixed-Point & Pin Audit:** Verify §1.1 fixed point, all 28 file pins (SHA-256 + byte count), and all 11 line anchors in `tools/governed-loop/mvp2.py` (`:150-154`, `:169`, `:171-172`, `:183-184`, `:733`). Re-verify the seed `1387@0` strong core (`3,204` reachable / `2,928` in $S_{000}$ / `276` one-way / `2,388` governed $S_{000}$ / `540` boundary $S_{000}$).
2. **T0.2 Reachability Audit of Predeclared Test Nodes in Governed $S_{000}$:**
   Verify membership, role, office, and forward/backward distance from seed `1387@0` for all test nodes:
   - `1453@0` (`7-35:3`, Aeolian, anchor, Jupiter): confirmed in governed $S_{000}$ ($d_{\text{out}}=2, d_{\text{in}}=2$).
   - `2477@0` (`7-32:0`, Harmonic Minor, satellite, Jupiter): confirmed in governed $S_{000}$ ($d_{\text{out}}=3, d_{\text{in}}=3$).
   - Major-mode triangle `2741@0` (`7-35:0`, Moon), `1717@0` (`7-35:5`, Mars), `2773@0` (`7-35:7`, Sun): all three confirmed in governed $S_{000}$ ($d_{\text{out}} \in \{2,3\}, d_{\text{in}} \in \{2,3\}$).
   - **Predeclared Fallback Rule:** Any test node found outside governed $S_{000}$ is replaced by the nearest in-$S_{000}$ governed node of the same Forte set class (breaking ties by `(d_out + d_in, mask, phase)`), named explicitly in `mvp8_task_0_receipt.json`; zero silent substitutions. (Since all 5 primary test nodes sit in governed $S_{000}$, `substitutionsRequired` must equal `0`.)
3. **T0.3 Predeclaration Lock (`task-0/mvp8_predeclared_bets.json`):**
   Write and SHA-256 lock all Q1–Q5 rules, connector cost weights, and Task A–D bet thresholds before any Task A–D code executes. Also initialize `task-0/mvp8_ear_scorecard.json` as `PENDING_HUMAN` (`signed: false`).
   - **Output:** `task-0/mvp8_predeclared_bets.json`, `task-0/mvp8_ear_scorecard.json`, `task-0/mvp8_task_0_receipt.json`.

---

### Task A — Deterministic Bipartite Table Compiler (`task-a/mvp8_table_generator.py`)
Compile `derived/hypergraph/bipartite-inclusion-v1.json` into a phase-extended, runtime-readable lookup artifact (`task-a/mvp8_pentatonic_lookup_v1.json`), mapping every lifted node `mask@phase` ($462 \times 12 = 5,544$ nodes) to its pentatonic subnodes by exact $T_p$ transposition equivariance.

- **Distinction of Rooted vs. Unrooted Subnode Sets (Explicitly Reconciled):**
  Each phase-0 heptatonic mask $M$ (7 pcs containing `0`) has:
  1. **15 anchored subnodes** (`subnodes` in `bipartite-inclusion-v1.json`, all containing pc `0`, i.e., $\binom{6}{4}=15$).
  2. **21 total 5-note subsets** ($\binom{7}{5}=21$, comprising the 15 anchored subnodes plus the $\binom{6}{5}=6$ unanchored 5-note subsets of $M$ that do not contain pc `0`, each of which is a $T_r$-transposed image of one of the 330 canonical pentatonic classes).
  Both the 15 anchored subnodes and the full 21 5-note subsets (transposed by $+p \pmod{12}$ at phase $p$) are indexed per `mask@phase` so both `cornerstoneCountRooted` and `cornerstoneCountUnrooted` are directly queryable.
- **Predeclared Verification Targets (Fail-Closed STOP back to T0 on any mismatch):**
  - **A1 (Anchored Incidence Count):** Exactly $462 \times 15 = 6,930$ anchored subnode rows at phase 0, and $462 \times 21 = 9,702$ total 5-note subset rows at phase 0 ($5,544 \times 15 = 83,160$ anchored / $5,544 \times 21 = 116,424$ total across all 12 phases).
  - **A2 (Bridge Census):** Phase-0 bridge subnode census reproduces `metadata.bridgeCensus.totalBridgeSubnodes == 70` and the exact class breakdown (`5-Z12: 5`, `5-20: 10`, `5-23: 10`, `5-24: 10`, `5-25: 10`, `5-27: 10`, `5-29: 10`, `5-34: 5`).
  - **A3 (`5-35` Census):**
    - Unrooted `5-35` subset distribution (`cornerstoneCountUnrooted`) across the 462 masks reproduces **`357` (0), `70` (1), `28` (2), `7` (3)** — with seed mask `1387` confirmed among the `7` masks having `3` unrooted `5-35` subsets.
    - Rooted `5-35` subnode distribution (`cornerstoneCountRooted`) across the 462 masks reproduces **`381` (0), `60` (1), `18` (2), `3` (3)**.
  - **Output:** `task-a/mvp8_pentatonic_lookup_v1.json`, `task-a/mvp8_task_a_receipt.json`.

---

### Task B — Pentatonic-Aware Initiation in the Q Layer (`task-b/mvp8_pentatonic_q_engine.py`)
Implement pentatonic-aware focal initiation as a projection-layer successor to `CoupledEngine.project()` / `DeloopFormEngine` in the scratch tree (never post-hoc trace editing or renderer mutation).

- **Projection Contract:**
  - On entering a bar at `node = mask@phase` with incoming state `q_in` and bar role (`dwell` vs `transit`), the Q layer resolves the active focal context via the locked **Q2 + Q3** rules:
    ```json
    "focalContext": {
      "subnodeId": "5-35:0@0",
      "baseSubnodeId": "5-35:0",
      "setClassId": "5-35",
      "rootPc": 0,
      "pitchClasses": [0, 2, 4, 7, 9],
      "selectionMode": "5-35_phase_root | 5-35_head_contained | 5-35_canonical | borrowed_connector | native_class_dwell | NONE",
      "isBridge": false,
      "isCornerstone": true
    }
    ```
  - Under the primary **Q4 (`structural_window_snap`)** governance law:
    - At phrase initiation (`sub == 0`), if `q_in` is in `TRAVERSAL_SET` and would emit a non-focal pitch class, `q_state` is initiated to the nearest traversal station (in forward fifth-stack order from `q_in`, or station `0` if `q_in == 0`) whose emitted pitch class lies in `focalContext.pitchClasses`.
    - For `orbit_index` in `0..4` (`GENERATIVE_WINDOW`), if `degree_modulo_7` fallback would land outside `focalContext.pitchClasses`, it snaps deterministically to the nearest in-focal pitch class in canonical fifth-stack order.
    - For `orbit_index` in `5..11` (tail positions), in-mask non-focal pitch classes are emitted un-snapped as modal color tones (`governanceAction: "modal_color_pass"`).
    - `STILL_SET` states (`12..15`) retain their frozen `still_set_hold` behavior (`phase % 12`).
  - Every micro-step record receipts `focalSubnodeId`, `focalSetClassId`, `focalRootPc`, `focalPitchClasses`, `focalHit` (`bool`), and `governanceAction` (`"direct_focal"`, `"initiated_to_focal"`, `"snapped_to_focal"`, `"modal_color_pass"`, or `"still_set_hold"`).
  - Diagnostic arms `snap_all` (all positions `0..11` snapped to focal) and `hold_on_unsafe` (hold previous in-focal pitch on unsafe steps) are implemented and run as labelled side-by-side diagnostics.

- **Predeclared Bets (Task B):**
  - **Bet B1 (Hard Invariant — Mask & Still-Set Fidelity):** `outOfMaskPitches == 0` across all 5,544 lifted nodes × 16 Q states × 12 $z$-steps ($1,064,448$ evaluations) and all piece traces (`100%` container compliance), and `still_set_check` passes with `0` leaks.
  - **Bet B2 (Focal-Hit Rate Uplift on `5-35` Dwell Nodes):**
    - Ungoverned baseline across the full 16 states × 12 $z$-steps (`192` evaluations) on Ionian `2741@0` for focal set `5-35:0` `{0,2,4,7,9}` is **`144/192 = 0.7500`** full-table (`96/144 = 0.6667` traversal-only; `48/48` still-set; `12/16` at every single `z`). The rev-1 `128/192` figure was not reproducible by either projector and is retired.
    - Under `structural_window_snap` governance across all 16 starting states on `2741@0`, structural-window (`sub` in `0..4`) focal-hit rate is **`1.000`** (`80/80`); full-table (`192`-cell) focal-hit rate reaches **`>= 0.8333` (`>= 160/192`)**, i.e. **`>= +16` focal hits over the `144/192` baseline**, while retaining `>= 2` modal color emissions per 12-step traversal cycle in tail positions `5..11`.
  - **Bet B3 (Phase Equivariance):** Focal selection and governed emission commute strictly with phase shift $T_p$ across all `12/12` phases on the predeclared 12-mask sample (`1387`, `1453`, `2477`, `2741`, `1717`, `2773`, `2869`, `2485`, `1715`, `2765`, `1749`, `671` — $12 \times 12 = 144$ lifted nodes):
    $$\text{focal}(M, p) = T_p(\text{focal}(M, 0)) \quad \text{and} \quad \text{emitted}(q, z, M, p) \equiv (\text{emitted}(q, z, M, 0) + p) \pmod{12}.$$
  - **Bet B4 (Law 3 Articulation Re-Test):** Evaluate office-deconfounded `r_lead` vs `r_container` (against the log-spectral centroid `log2(f/440)`) on the governed multi-section form control (*The Far Shore* itinerary under pentatonic-aware Q initiation) and on the MVP-7 cadential benchmarks (`B1_andalusian`, `B2_borrowed_minor`).
    - Pass rule: on the multi-section form itinerary (*The Far Shore*), `r_lead > r_container` holds (`PASS`), confirming Law 3 on arc forms; on the short waypoint-menu cadences (`B1`, `B2`), both `r_lead` and `r_container` are reported explicitly against the L27 baseline to test whether pentatonic focal initiation improves `r_lead - r_container` over the ungoverned L27 baseline.
  - **Output:** `task-b/mvp8_pentatonic_q_engine.py`, `task-b/mvp8_task_b_receipt.json`.

---

### Task C — Connector-Aware Path Planner (`task-c/mvp8_connector_planner.py`)
Extend the native BFS macro planner (`mvp4_symbolic_planner.py`) in scratch with a deterministic focal-continuity edge cost:
$$\text{Cost}(u \to v \mid F) = w_{\text{hop}} + w_{\text{focal}} \cdot \mathbf{1}_{F \not\subseteq \text{container}(v)} + w_{\text{bridge}} \cdot \mathbf{1}_{\text{no shared subnode}(u, v)}$$
with predeclared integer weights locked at T0: $w_{\text{hop}} = 10$, $w_{\text{focal}} = 15$, $w_{\text{bridge}} = 30$ (zero floats in the planner path; ties broken by `(total_cost, hop_count, lex(path))`).

- **Predeclared Crossing Tests & Bets:**
  - **Bet C1 (Aeolian `1453@0` $\to$ Harmonic Minor `2477@0` Connector Crossing):**
    - The planner identifies the legal `seamB:bridge` crossing `1453@0 -> 2477@0` (`1` hop, `ACCEPT`) and verifies that all **5 shared bridge subnodes** (`5-20:0B` `{0,2,3,7,8}`, `5-23:0` `{0,2,3,5,7}`, `5-25:0` `{0,2,3,5,8}`, `5-27:0` `{0,3,5,7,8}`, `5-29:0B` `{0,2,5,7,8}`) remain 100% valid across both containers.
    - Under connector transfer, the lead line holds its selected shared bridge subnode across `1453@0 -> 2477@0` with **`0` focal switches** and **`0` out-of-mask emissions**.
  - **Bet C2 (Hop-Overhead Bound):**
    - Across `1453@0 -> 2477@0` and a predeclared 10-pair cross-family benchmark in governed $S_{000}$, the hop overhead of the connector-continuous path vs. the unconstrained shortest path satisfies:
      $$\Delta_{\text{hops}} = \text{hops}_{\text{connector}} - \text{hops}_{\text{shortest}} \le +2.$$
      (For `1453@0 -> 2477@0`, $\Delta_{\text{hops}} = 1 - 1 = 0 \le 2$.)
  - **Bet C3a (Major-Mode Triangle — Dwell-Pillar Continuity):** Across the three major-mode dwell waypoints (`2741@0` Ionian, `1717@0` F-major/Mixolydian, `2773@0` G-major/Lydian), the primary anhemitonic focal set `5-35:0` `{0,2,4,7,9}` is preserved across all three dwell pillars with **`0` dwell focal switches**.
  - **Bet C3b (Major-Mode Triangle — Satellite-Transit Continuity):** Because every legal path between distinct `7-35` families at phase 0 traverses a `7-32` satellite node (which has zero `5-35` subsets), the connector planner selects 2-hop transit legs through `7-32` satellites (`2741@0 -> 2485@0 -> 1717@0` sharing bridge `5-23:0B` `{0,2,4,5,7}`; `1717@0 -> 2485@0 -> 2773@0` bridging `5-23:0B` to `5-27:11B` `{11,0,2,4,7}`; `2773@0 -> 2485@0 -> 2741@0` sharing `5-27:11B`). The 3-node common-subnode set on the `1717 -> 2485 -> 2773` leg is **empty**, so the predeclared claim is the 4-note core `{0,2,4,7}` on every bar (dwell + transit), with **`<= 1` labelled bridge-subnode switch per 2-hop leg** (0 on the two legs with a shared subnode, 1 on the `1717 -> 2485 -> 2773` leg), and $\Delta_{\text{hops}} = 0$ overhead against the unconstrained shortest path (6 hops total).
  - **Output:** `task-c/mvp8_connector_planner.py`, `task-c/mvp8_task_c_receipt.json`, plus rendered WAV/MIDI/JSONL traces for the Aeolian $\to$ Harmonic Minor crossing and the Major-Mode Triangle.

---

### Task D — Zero-`5-35` Dwell Evidence Study (`task-d/mvp8_zero_pentatonic_study.py`)
Execute a controlled 3-arm comparative study on Harmonic Minor `2477@0` (`7-32:0`, pcs `{0,2,3,5,7,8,11}`, zero `5-35` subsets) embedded in an Aeolian `1453@0` $\to$ Harmonic Minor `2477@0` $\to$ Aeolian `1453@0` dwell-and-return study piece (and a pure `2477@0` multi-bar dwell probe), rendered under the frozen `mvp6_3_fade_renderer` law (legato + 50 ms terminal fade):

- **Arm D1 (`borrowed_connector` — Q2c default for transit / shared context):** Maintains the shared connector subnode (`5-23:0` `{0,2,3,5,7}` or `5-27:0` `{0,3,5,7,8}`) carried from `1453@0`.
- **Arm D2 (`native_class_dwell` — Q2b locked rule for zero-`5-35` dwell):** Initiates on `2477@0`'s canonical rooted pentatonic subnode (`5-27:0` `{0,3,5,7,8}` under `structural_window_snap`, permitting the leading tone `11` and supertonic `2` in tail positions `5..11`).
- **Arm D3 (`naked_fifth_stack` — Q2a ungoverned baseline):** Standard MVP-6.1/6.3 projection with no pentatonic focal context (`focalContext: NONE`).

- **Measured Outputs (Recorded in `task-d/mvp8_task_d_receipt.json`):**
  1. **Symbolic Counts:** Focal hit rate, structural-beat (`sub` in `0..4`) focal hit rate, snap/initiation counts, modal-color pass counts (specifically tracking `pc 8` and `pc 11`, the characteristic `b6` and `#7` of `7-32:0`), and semitone "rub" census against the sounding pad.
  2. **Acoustic Log-Spectral Metrics (`mvp7_log_spectral_lens.py`):** Per-bar and piece-wide $\mu_{\log_2(f/440)}$, $\sigma_{\log_2(f/440)}$, seam continuity, terminal fade check, and two-pass byte determinism (`100%`).
  3. **Blind / Labelled A/B Listening Package (`task-d/mvp8_ear_manifest.json`):** WAV renders for Arms D1, D2, D3 plus the Task C triangle and crossing renders. Any listening verdict is strictly Erick's (`PENDING_HUMAN`, unsigned by design); no automated check may author or infer an ear verdict.

---

### Task E — Adjudication, `SPEC-001` Amendment Draft & `L28` Landing Preparation (`task-e/mvp8_task_e.py`)
Evaluate Tasks A–D against the locked predeclaration in `task-0/mvp8_predeclared_bets.json` and select exactly one standing deterministic outcome:

1. **`ADOPT_RUNTIME_READING` (or `CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR` while the ear scorecard is unsigned):**
   - **Condition:** All Task A verification targets (A1–A3) and all Task B–C deterministic bets (B1–B4, C1–C2, C3a–C3b) plus Task D render integrity checks pass.
   - **Action:**
     - Emit a self-contained **Proposed Amendment Memo** (`task-e/PROPOSED_AMENDMENT_SPEC_001_S1_3_PENTATONIC_CONTEXT.md`) specifying the optional `focal_context` reader contract for `SPEC-FIVEFOLD-CONSTRUCTS-001` §1.3 while preserving `src/fivefold/quintessence.py` (the 16-state $Q_z = Q_1^z$ substrate) untouched and keeping admission itself gated on maintainer governance sign-off.
     - Emit the closing report (`MVP8-PENTATONIC-Q-CLOSING-REPORT.md`) and the `L28` landing script (`task-e/mvp8_land.py`) ready to execute upon landing authorization.
2. **`KEEP_EVIDENCE_ONLY`:**
   - **Condition:** Hard invariant **B1** (0 out-of-mask pitches / 0 still-set leaks) or **B3** (12/12 phase equivariance) fails.
   - **Action:** Pentatonic initiation remains out of the runtime projection layer; findings land as a scratch/analysis note only.
3. **`DEFER`:**
   - **Condition:** B1 and B3 pass, but one or more of B2, B4, C1, C2, C3a, or C3b misses its predeclared threshold.
   - **Action:** Name the exact failing bet and measured value in the closing report; bank the passing components without proposing `SPEC-001` amendment.

---

## §4. Stop Rules (In Force Across Tasks 0–E)

Execution halts immediately (`sys.exit(2)`) and emits a `STOP` diagnostic if any of the following occur:
- **`S-1` (Fixed-Point Drift):** `HEAD`, working tree status, `DECISION_LEDGER.md`, `MANIFEST.json`, `CHECKSUMS.sha256`, `completion-validation-report.json`, or `mvp7_intention_landing_receipt.json` disagrees with §1.1.
- **`S-2` (Pin Mismatch):** Any of the 28 pinned files in §1.2 fails SHA-256 or byte-length verification.
- **`S-3` (Gate Anchor Drift):** Any of the 11 `mvp2.py` line anchors shifts, or any byte of `mvp2.py` or `src/fivefold/quintessence.py` is modified.
- **`S-4` (Table Census Mismatch):** Task A fails to reproduce `6,930` anchored subnode rows (`9,702` total 5-note subsets), `70` bridge subnodes, `357/70/28/7` unrooted `5-35` distribution, or `381/60/18/3` rooted `5-35` distribution.
- **`S-5` (Container or Gate Violation):** Any micro step emits an out-of-mask pitch class, any macro hop is rejected by `mvp2.py`, or any boundary node is dwelled upon.
- **`S-6` (Fence or Ear-Gate Violation):** Any float enters a symbolic receipt field (outside guarded Modality 2 acoustic lens blocks), any LLM call is made (`llmCalls != 0`), any repository write occurs during scratch execution (Tasks 0–E), or any listener field in `mvp8_ear_scorecard.json` is authored by the agent.

---

## §5. Deliverables & Terminal Verdict Format

Upon scratch completion of Tasks 0–E, the closing report (`MVP8-PENTATONIC-Q-CLOSING-REPORT.md`) ends with the machine-readable verdict block:

```text
MVP8-PENTATONIC-Q-SPRINT-CLOSING
FIXED-POINT: d1b2286... / TREE CLEAN / L27 da9c7941... / 407293 B / 4383 lines
MANIFEST-PIN: 1834 FILES / 263181122 B / RELEASE-CLOSURE 418/0 PASS
PINS-VERIFIED: 28/28 MATCH / ANCHORS 11/11 MATCH / PREDECLARATION-LOCKED TRUE
REACHABILITY-S000: 1453@0 IN | 2477@0 IN | 2741@0 IN | 1717@0 IN | 2773@0 IN | FALLBACKS 0
TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE | TE COMPLETE
TABLE-CENSUS: 6930 ANCHORED / 9702 TOTAL / BRIDGES 70 / UNROOTED-5-35 357-70-28-7 / ROOTED-5-35 381-60-18-3
BETS-B: B1 PASS (0 OUT-OF-MASK) | B2 <PASS/FAIL> | B3 PASS (144/144 EQUIVARIANT) | B4 <PASS/FAIL>
BETS-C: C1 <PASS/FAIL> (1453@0->2477@0, 5 BRIDGES, 0 SWITCHES) | C2 <PASS/FAIL> (MAX OVERHEAD <= +2) | C3a <PASS/FAIL> (0 DWELL SWITCHES) | C3b <PASS/FAIL> (CORE {0,2,4,7}, <=1 BRIDGE SWITCH/LEG, +0 HOPS)
STUDY-D: D1-BORROWED RENDERED | D2-NATIVE RENDERED | D3-NAKED RENDERED | TWO-PASS DETERMINISTIC TRUE
EAR-GATE: PENDING_HUMAN / OUTCOME <OUTCOME_LABEL>
FENCES: GATE-UNTOUCHED / Q-SUBSTRATE-UNTOUCHED / C-H-NULL / BIPARTITE-PLANNING-EVIDENCE / LLM-CALLS 0 / REPO-WRITES 0
STATUS: COMPLETE
```
