# ARCHITECTURAL POST-MVP REPORT: PENTATONIC Q-INITIATION, CONNECTOR TRANSFERS, AND THE ROADMAP TO TEMPORAL GOVERNANCE

- **Baseline Fixed Point:** `L28` (`HEAD 7117d24297c49507d66fbc927ce12efdba768884`, `origin/main`)
- **Decision Ledger (`provenance/DECISION_LEDGER.md`):** SHA-256 `f1446e8181140d6b695280bf2d34fc44832cba9e4ca0b4b27a2105bf49648ed7` (`417,658 B` / `4,436 lines`)
- **Release Manifest (`MANIFEST.json`):** SHA-256 `b5f0029c6e3d83423d5a8653ad49656a6b4a7e24c97b1ff65a27317c734e283c` (`1,893 files` / `299,601,159 B`)
- **Checksums (`CHECKSUMS.sha256`):** SHA-256 `95dd3d6c02bddaa9c1ce28f2f85c534c8281652953578332b0d6b599b6abc6d3` (`225,218 B`)
- **Landing Receipt (`qa/mvp8_1b_landing_receipt.json`):** SHA-256 `ebea2cf3dc67fdcde66f640e26d8d760303f37dcc1a307ada8635bd78d78c8a8`
- **Closure & Fences:** Release validation `418/0 PASS` · Prose consistency `PASS` (`0` violations) · `globalCHNull: true` · `causationClaim: false` · `physicalQuantityClaim: false` · `tierClassifier: false` · `gov517_correspondence_claimed: false` · `bipartiteEvidenceStatus: planning_evidence`

---

## 1. Executive Summary & Baseline State (`L28` / Commit `7117d24`)

With the landing of **`L28`** (`7117d24`), the governed-loop architecture has closed its pitch-space and voice-leading loop: **macro harmonic containers, inter-family connector transfers, and micro pentatonic focal initiation are mathematically locked, phase-equivariant, and verified under fail-closed governance.**

### 1.1 Summary of the `L28` Landing
- **Payload & Scope (Lean Archival Mode):** `55` non-audio payload files (`36.3 MB`) and `3` directive specifications landed byte-identically across `tools/governed-loop/mvp8/`, `tools/governed-loop/mvp8_1/`, `tools/governed-loop/mvp8_1b/`, `qa/`, and `scrum/plan/`. `48` intermediate audio files (`148.5 MB` of mix and stem WAV/MIDI renders) were excluded from git history as reproducible artifacts whose SHA-256 digests remain pinned in the landed receipts.
- **Bipartite Inclusion Lookup (`tools/governed-loop/mvp8/task-a/mvp8_pentatonic_lookup_v1.json`):** Compiled deterministically from `derived/hypergraph/bipartite-inclusion-v1.json` (`903eebf0...`, status `planning_evidence`, `admissionEffect: none`, `graphScope: detached_audit_only`). Indexes all `5,544` lifted nodes (`462` heptatonic masks × `12` phases) against `6,930` phase-0 anchored subnode rows (`83,160` across all phases) and `9,702` total phase-0 5-note subset rows (`116,424` across all phases).
- **Three-Stage Governance Sequence (`MVP8` -> `MVP8.1` -> `MVP8.1b`):**
  1. **`MVP8-DIR-1` (rev 2) -> `DEFER`:** Passed all discrete topological, focal-uplift, equivariance, and connector bets (`B1`, `B2`, `B3`, `C1`, `C2`, `C3a`, `C3b`, `Task D` `6/6`), but halted automatically on `Bet B4` because the full-mix log-spectral lens (`log2(f/440)`) was masked by 8-voice pad energy (`r_lead = 0.200836 < r_container = 0.673879`).
  2. **`MVP8.1-DIR-1` (rev 1) -> `DEFER` (Instrument Proxy):** Isolated the lead and pad stems (`24` WAVs via `render_stems`). Primary stem Law-3 (`B4'b`) passed (`+0.145169` governed margin vs. `+0.031118` ungoverned control), but the `B4'a` sanity check failed (`3/12`) because it correlated against coarse bar `pcSum` and included single-office/two-bar probes where office deconfounding has zero residual variance.
  3. **`MVP8.1b-DIR-1` (rev 1) -> `ADOPT_RUNTIME_READING`:** Locked a pre-execution metric correction scoring `B4'a'` against **mean emitted pitch class** on multi-office stems (`>= 2` offices and `>= 3` bars). All `5/5` scored stems passed (`0.985864` to `0.995975` vs. threshold `0.90`), with human ear sign-off (`SIGNED_HUMAN`, Erick) recorded in `tools/governed-loop/mvp8/task-d/mvp8_ear_manifest.json`.

---

## 2. Mathematical Substrate: Micro $Q$ & Hypergraph Integration

### 2.1 The 16-State $Q$-Engine Substrate (`SPEC-001` §1.3)
The Quintessence operator $Q : \mathbb{Z}_{12} \to (S_{16} \to S_{16})$ with action law $Q_z = Q_1^z$ (`src/fivefold/quintessence.py`, SHA-256 `eefd7e1e...`, untouched) partitions the 4-bit elemental engagement space $S_{16} = \{0,\dots,15\}$ into:
- **12-State Traversal Cycle (`TRAVERSAL_CYCLE`):**
  $$(0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5)$$
  where orbit station $k \in \{0,\dots,11\}$ maps to pitch class $t_k = (7k + p) \bmod 12$ at phase $p$.
- **5-Station Generative Window (`GENERATIVE_WINDOW`):** Stations $0\dots 4$ $(0, 7, 2, 9, 4)$, which natively generate an anhemitonic pentatonic collection (`5-35`) before visiting modal color degrees in the tail (stations $5\dots 11$).
- **4-State Still Set (`STILL_SET`):** States $\{12, 13, 14, 15\}$, which hold the phase root $p \bmod 12$ (`still_set_hold`) with zero leaks across `243,936` evaluations.

### 2.2 Decoupling Macro Containers from Micro Focal Attractors
Prior to `L28`, `project(q_state, z_step, mask, phase)` enforced container legality (100% gate compliance) and fifth-stack ordering, but carried no representation of which notes inside the 7-note container were harmonically *focal* ("home").

`PentatonicEngine` (`tools/governed-loop/mvp8/task-b/mvp8_pentatonic_q_engine.py`, SHA-256 `e9ec9804...`) introduces a projection-layer `focalContext` reader derived from the bipartite hypergraph:

$$\text{Heptatonic Container } M@p \;\text{(7 pcs)} \;\supset\; \text{Pentatonic Focal Set } F \;\text{(5 pcs)} \;\subset\; \text{Fifth-Stack Traversal } Q_1^z$$

- **5-35 Census Across the 462 Masks:**
  - **Unrooted `5-35` subsets (out of $\binom{7}{5}=21$ subsets per mask):** `357` masks have `0`; `70` have `1`; `28` have `2`; `7` have `3` (including seed mask `1387`, `7-35:1`).
  - **Rooted `5-35` subnodes (out of $\binom{6}{4}=15$ pc-0-anchored subnodes per mask):** `381` have `0`; `60` have `1`; `18` have `2`; `3` have `3`.
- **Hybrid Zero-`5-35` Resolution (Locked Q2 Rule):**
  - **Transit (`borrowed_connector`):** When stepping across a zero-`5-35` node, retain the preceding node's focal set if it is a subset of the current container; otherwise select a shared bridge subnode.
  - **Dwell (`native_class_dwell`):** When dwelling on a zero-`5-35` node (e.g., Harmonic Minor `2477@0`, `7-32:0`), initiate on the node's canonical native pentatonic class (`5-27:0` $\{0,3,5,7,8\}$).
- **Deterministic 3-Tier Tie-Break (Locked Q3 Rule):**
  1. **Phase-Root Alignment:** Prefer a candidate subnode whose transposed canonical root equals active phase $p$ ($\text{rootPc} = p$).
  2. **Traversal-Head Containment:** Prefer a candidate subnode containing the incoming fifth-stack pitch class $t_{\text{orbit}(q_{\text{in}}), p}$.
  3. **Canonical Index:** Select the lexicographically smallest `baseSubnodeId`.

### 2.3 Structural-Window Governance Law (Locked Q4 Rule) & Equivariance Proof
Under `structural_window_snap`:
- **Phrase Initiation (`sub == 0`):** If $q_{\text{in}}$ would emit a non-focal pitch class, advance $q$ along `TRAVERSAL_CYCLE` to the nearest station whose emission lies in $F$ (`initiated_to_focal`).
- **Generative Window (`orbit_index` $\in \{0..4\}$):** If a `degree_modulo_7` container snap falls outside $F$, snap deterministically to the nearest pitch class in $F$ by forward fifth-stack distance (`snapped_to_focal`).
- **Modal Tail (`orbit_index` $\in \{5..11\}$):** Permit in-mask non-focal emissions un-snapped as modal color tones (`modal_color_pass`), preserving characteristic modal degrees (such as Lydian $\sharp 4$, Ionian $4$, or Harmonic Minor $\sharp 7$).
- **Verified Invariants:**
  - **Bet B1:** `0` out-of-mask pitches across `1,064,448` governed evaluations ($5,544 \times 16 \times 12$).
  - **Bet B2:** On Ionian `2741@0`, governed initiation lifts the 192-cell table from `144/192` (`0.7500`) to `192/192` (`1.0000`), holds `80/80` (`1.0000`) on the structural window, and passes `4` modal color tones per 12-step cycle.
  - **Bet B3 (Phase Equivariance):** Across all `12` phases on the 12-mask sample (`144` lifted nodes, `55,296` emission checks), focal selection and governed emission commute strictly with transposition $T_p$:
    $$\text{focal}(M, p) = T_p(\text{focal}(M, 0)) \quad \text{and} \quad \text{emitted}(q, z, M, p) \equiv (\text{emitted}(q, z, M, 0) + p) \pmod{12}.$$

---

## 3. Macro Pathfinding & Connector Transfer Semantics

### 3.1 Topology of Governed $S_{000}$ and the 70 Bridge Subnodes
From seed `1387@0`, the Policy-v3 legal move graph (`seam_legal_moves_v3.json`, `5,130` seam moves + live Tier-1 moves) reaches `3,204` lifted nodes, with a strongly connected core $S_{000}$ of `2,928` nodes (`2,388` governed interior nodes + `540` transit-only boundary nodes; `276` one-way nodes excluded).

Within the bipartite hypergraph, **bridge subnodes** (`isBridge: true`) are non-cornerstone pentatonics having at least one anchored diatonic (`7-35`) parent and at least one anchored non-`7-35` parent:
- **Field-Wide Bridge Census (`70` subnodes):** `5-Z12: 5`, `5-20: 10`, `5-23: 10`, `5-24: 10`, `5-25: 10`, `5-27: 10`, `5-29: 10`, `5-34: 5`.

### 3.2 Connector-Weighted Path Cost Formula
The connector planner (`tools/governed-loop/mvp8/task-c/mvp8_task_c.py`, SHA-256 `8ff0630a...`) augments macro pathfinding over governed $S_{000}$ with a pure-integer edge cost (locked weights $w_{\text{hop}} = 10$, $w_{\text{focal}} = 15$, $w_{\text{bridge}} = 30$; ties broken by `(total_cost, hop_count, lex(path))`):

$$\text{Cost}(u \to v \mid F) = w_{\text{hop}} + w_{\text{focal}} \cdot \mathbf{1}_{F \not\subseteq \text{container}(v)} + w_{\text{bridge}} \cdot \mathbf{1}_{\text{shared\_subnodes}(u, v) = \emptyset}$$

### 3.3 Verified Crossing & Triangle Benchmarks
- **Bet C1 — Aeolian `1453@0` (`7-35:3`) $\to$ Harmonic Minor `2477@0` (`7-32:0`):**
  Traverses the 1-hop `seamB:bridge` edge (`gate: ACCEPT`). Both containers share all `5` bridge subnodes (`5-20:0B` $\{0,2,3,7,8\}$, `5-23:0` $\{0,2,3,5,7\}$, `5-25:0` $\{0,2,3,5,8\}$, `5-27:0` $\{0,3,5,7,8\}$, `5-29:0B` $\{0,2,5,7,8\}$). Holding `5-27:0@0` crosses from diatonic Aeolian into non-diatonic Harmonic Minor with **`0` focal switches** and **`0` out-of-mask emissions**.
- **Bet C2 — Cross-Family Overhead Bound:** Across `10/10` predeclared cross-family pairs (`12` distinct governing roots), strict subnode-continuous paths achieve a maximum hop overhead of **`0` hops** ($\le +2$ bound).
- **Bets C3a & C3b — Major-Mode Triangle (`2741@0` $\to$ `1717@0` $\to$ `2773@0` $\to$ `2741@0`):**
  - **C3a (Dwell Pillars):** All three `7-35` dwell pillars hold `5-35:0` $\{0,2,4,7,9\}$ with **`0` dwell focal switches**.
  - **C3b (Satellite Transits):** Because distinct `7-35` families at phase 0 connect via `7-32` satellites (which have zero `5-35` subsets), each 2-hop leg steps through `2485@0` (`7-32:7B`) using bridge subnodes `5-23:0B` $\{0,2,4,5,7\}$ and `5-27:11B` $\{11,0,2,4,7\}$. The 4-tone common core $\{0,2,4,7\}$ is preserved across `7/7` bars with `[0, 1, 0]` bridge switches per leg and **`+0` hop overhead** (`6` hops total).

---

## 4. The Four-Tier Neurosymbolic Stack & the LLM Intention Layer

With `L28` landed, the neurosymbolic architecture operates as a four-tier stack where symbolic legality and harmonic focality are enforced deterministically below the proposer boundary:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: LLM INTENTION LAYER (Macro Narrative & Structural Schema)           │
│  - Schema: governed-loop.mvp7-intention-spec.v1                             │
│  - Emits typed section intentions (role, dispersion, orbit/phase/band/pcs)  │
│  - NEVER emits raw MIDI notes, raw output pitches, or executable edges      │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │ Waypoints & Verified Menus (C2)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: MACRO PATH PLANNER (Governed S000 Topology & Connector Transfers)   │
│  - Compiles routes inside the 2,388-node governed strong core (mvp2.py gate)│
│  - Minimizes Cost(u -> v | F) using the 70 multi-family bridge subnodes     │
│  - Fails closed: OUTSIDE_STRONG_CORE | ISOLATED_BOUNDARY |                  │
│    EMPTY_CANDIDATE_INTERSECTION | DISCONNECTED_TRANSITION                   │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │ Governed Node Itinerary (mask@phase)
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: MICRO Q-ENGINE (Pentatonic Focality & Modal Voice Leading)          │
│  - Reads phase-equivariant lookup (6,930 anchored / 9,702 total phase-0)    │
│  - Enforces structural_window_snap on sub 0 & stations 0..4; allows modal   │
│    color passes on tail stations 5..11; holds phase root on still_set       │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │ Pitch-Class & Focal-Receipt Stream
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ TIER 4: METER, DURATION & AUDIO ENGINE (Candidate MVP-9 + Pinned Renderer)  │
│  - Maps Q-stations to duration vectors d = (d_0, ..., d_11) & K-step meters │
│  - Synthesizes deterministic WAV/MIDI + isolated lead/pad stems             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why `L28` Makes the Tier-1 Guest Curator Viable
In `MVP-7` (`L27`), free LLM waypoint proposals (`Arm C1`) achieved only `0.333` first-pass legality (`0.500` compiled), whereas **verified-menu curation (`Arm C2`) achieved `1.000` legality** (`0.720` structural divergence from planner defaults), establishing `CONDITIONAL_OUTCOME_2_GUEST_CURATOR_MENU_BOUND_PENDING_EAR`. With Tier 2 connector transfers and Tier 3 pentatonic initiation now locked in `L28`:
1. **Menu-Bound Legality + Automatic Voice Leading:** When the Tier-1 curator selects section waypoints from pre-verified $S_{000}$ menus, Tier 2 automatically threads bridge subnodes across family seams and Tier 3 anchors phrase downbeats to pentatonic focal sets.
2. **Elimination of Harmonic Drift:** Even across high-dispersion modulations (`DEEP_DISPERSION`, `EXTREME_RAMP`), structural beats remain grounded in the active subnode while modal color degrees are confined to weak tail positions.

---

## 5. Specification of the Meter & Duration Law (Standing Candidate `MVP-9`)

With pitch-class selection and connector voice leading locked in `L28`, the remaining source of mechanical rigidity is **temporal uniformity**: every micro step currently occupies a flat `MICRO_STEP_MS = 300` ms tick, and bar lengths are fixed at $K_{\text{transit}} = 5$ (`1,500 ms`) and $K_{\text{dwell}} = 12$ (`3,600 ms`).

The **Meter and Duration Law (`MVP-9`)** introduces temporal governance as a pure overlay above `quintessence.py`, preserving the 16-state $Q_z = Q_1^z$ substrate byte-identically:

### 5.1 Station Duration Weighting ($\mathbf{d}$-Vectors)
Instead of a uniform $\Delta t = 300\text{ ms}$, each micro step receives an integer millisecond duration $d(s, \text{orbit\_index}, \text{action})$ determined by its structural role in the $Q$ cycle:
- **Focal Downbeats & Structural Window (`sub == 0` or `orbit_index` $\in \{0..4\}$):** Longer integer weights (e.g., $d_{\text{focal}} \in \{450, 600\}\text{ ms}$), giving agogic weight to pentatonic home tones.
- **Modal Color Tail Passes (`orbit_index` $\in \{5..11\}$, `governanceAction == "modal_color_pass"`):** Shorter passing weights (e.g., $d_{\text{color}} \in \{150, 200\}\text{ ms}$), allowing non-focal degrees ($\sharp 4$, $\sharp 7$, $\flat 6$) to resolve briskly into the next focal station.
- **Still-Set Holds (`nextQ` $\in \{12..15\}$):** Sustained cadential pedal weights.

### 5.2 Metric Groupings Derived from Subnode Geometry
Rather than imposing arbitrary external time signatures, metric groupings are derived from the active container/subnode pair:
- **Pentatonic Generative Meter ($5/4$ or $5/8$):** Directly reflects the 5-station `GENERATIVE_WINDOW` $(0, 7, 2, 9, 4)$ on transit and anhemitonic dwell bars.
- **Fifth-Stack Cycle Partitions ($3/4$, $4/4$, $6/8$, $12/8$):** Partitions the 12-station traversal cycle into $3 \times 4$, $4 \times 3$, or $2 \times 6$ accent grids aligned with `structural_window_snap`.

### 5.3 Elastic $K$-Step Phrase Dynamics
Bar length $K_{\text{bar}} \in \{5, 6, 8, 12, 16\}$ becomes a function of section role and dispersion class:
- **High-Tension / Satellite Transit:** Contracted $K \in \{5, 6\}$ for rapid harmonic rhythm across connector bridges.
- **Interior Dwell Pillars:** Standard $K \in \{8, 12\}$ for modal establishment.
- **Terminal & Cadential Resolution Pillars (Law 5):** Expanded $K \in \{12, 16\}$ with weighted focal downbeats and raised-cosine master fade (`2,205` samples / `50 ms`).

### 5.4 Predeclared Invariants for `MVP-9`
1. **Zero Symbolic Floats (Modality 1):** All duration vectors $\mathbf{d}$, meter ratios, and bar timelines must be represented as exact integers (milliseconds or integer tick subdivisions).
2. **Seam & Fade Integrity:** Legato pad overlap (`releaseSeconds`) and master fade must pass the existing `SeamMeter` (`medianDepthDb < 6.0`, `maxDepthDb < 12.0`) and terminal silence (`maxAbsLast32 < 10`) gates under variable bar durations.
3. **Stem-Isolated Law-3 Preservation (`B4'a'` & `B4'b'`):** Duration weighting must preserve `r(lead_stem_centroid, duration_weighted_mean_pc) >= 0.90` on multi-office pieces and maintain a positive governed lead-over-container margin.

---

## 6. System Invariants & Verification Matrix (`L28` Baseline)

| Layer / Invariant | Governing Artifact | Verified Metric at `L28` (`7117d24`) | Status |
|---|---|---|---|
| **Ontology Gate (`mvp2.py`)** | `tools/governed-loop/mvp2.py` (`79c0cf70...`) | `11/11` line anchors; `100%` hop `ACCEPT`; `0` gate byte changes | **FROZEN** |
| **Quintessence Substrate (`Q_z`)** | `src/fivefold/quintessence.py` (`eefd7e1e...`) | `192`-row table; `243,936` still-set checks (`0` leaks); `0` byte changes | **FROZEN** |
| **Bipartite Lookup (`Task A`)** | `mvp8_pentatonic_lookup_v1.json` (`7d4b0548...`) | `6,930` anchored / `9,702` total phase-0 rows; `70` bridges; `357/70/28/7` unrooted `5-35` | **PASS** |
| **Mask Fidelity (`Bet B1`)** | `qa/mvp8_task_b_receipt.json` (`1790682a...`) | `1,064,448` governed evaluations; `0` out-of-mask pitches | **PASS** |
| **Focal Uplift (`Bet B2`)** | `qa/mvp8_task_b_receipt.json` (`1790682a...`) | `144/192` -> `192/192` initiation; `80/80` structural; `4` modal passes | **PASS** |
| **Phase Equivariance (`Bet B3`)** | `qa/mvp8_task_b_receipt.json` (`1790682a...`) | `144` lifted nodes; `55,296` emission checks; `0` equivariance failures | **PASS** |
| **Connector Transfers (`C1–C3b`)** | `qa/mvp8_task_c_receipt.json` (`1b35263c...`) | `1453@0 -> 2477@0` (`1` hop, `5` bridges, `0` switches); `C2` max overhead `0`; `C3b` core `7/7` bars | **PASS** |
| **Zero-`5-35` Dwell Study (`Task D`)** | `qa/mvp8_task_d_receipt.json` (`f19aabb1...`) | `D1` `36/48`, `D2` `40/48`, `D3` `0/48` focal hits; `0` minor-second rubs; `6/6` deterministic | **PASS** |
| **Stem Sanity (`Bet B4'a'`)** | `qa/mvp8_1b_task_b_receipt.json` (`a91a4557...`) | `5/5` multi-office stems `>= 0.90` (`0.9859` to `0.9960` against mean emitted pc) | **PASS** |
| **Stem Law 3 (`Bet B4'b'`)** | `qa/mvp8_1b_task_b_receipt.json` (`a91a4557...`) | Governed margin `+0.145169` > ungoverned control `+0.031118` > `0` | **PASS** |
| **Human Ear Gate** | `mvp8_ear_manifest.json` (`63cb3155...`) | `SIGNED_HUMAN` (`signedBy: Erick`) | **SIGNED** |
| **Release & Prose Closure** | `qa/mvp8_1b_landing_receipt.json` (`ebea2cf3...`) | `418/0` release checks PASS; `0` prose violations; `0` symbolic floats | **COMPLETE** |
