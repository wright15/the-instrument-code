# DIRECTIVE MVP8.3-DEGREE-LADDER-DIR-1 (rev 1 — T0-Locked, Executed as L30)

- **Title:** Native Degree-Ladder Voicing Geometry `S(C,d,s,k)`, Complete 5-Orbit Z7 Degree Menu, Template Expressibility Census, and Paired Auditions
- **Directive ID:** `MVP8.3-DEGREE-LADDER-DIR-1` rev 1 (supersedes the Muse draft rev 0.1 of 2026-11-08 and the architectural draft rev 0.2 of 2026-11-12)
- **Authority:** Planning Seat (Erick), T0 locks adjudicated 2026-11-08 and 2026-11-12; L30 landing authorized 2026-11-12
- **Status:** EXECUTED IN SCRATCH; landed as L30 on 2026-11-12. The Planning Seat explicitly overrode the no-push fence for L30 and authorized one normal `git push`. No tag.
- **Execution Realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp8_3_degree_ladder/`
- **Granularity Rule:** L30 is one dedicated git commit. Audio (`.wav`/`.mid`) is excluded per the lean-scope L4 rule; traces, session receipts, and session sheets land.

---

## §0. Locked T0 Decisions L1–L6

| Lock | Rule |
|---|---|
| **L1 — Degrees** | Container degrees are indexed `1..7` throughout definitions, code, receipts, and sheets. |
| **L2 — Bass** | On degree arms the bass follows the stack anchor root `c_r`: `bassMidi = base_pitch_class_to_midi(rootPc, offset) - 12`, where `r = ((d-1+s*m) mod 7)+1`. |
| **L3 — Degree walk** | Fixed `+1` degree step per bar, stride `2`, depth `4`, rotation `0`, 7 bars, locked for the measured D1/D2 arms. |
| **L4 — D3 Andalusian pillars (Option 2)** | Exact waypoint stack where one exists, native cadence-rooted tertian fallback on `379@0`: `375@11` `S^(1)(C,7,2,3) = {0,3,7}`; `1143@0` `S^(2)(C,3,2,3) = {2,5,10}`; `379@0` `S^(0)(C,7,2,3) = {1,4,8}`; `859@11` `S^(0)(C,6,1,3) = {7,8,11}`. |
| **L5 — Lead layer** | `governed_dyads_structural` in every arm of D1, D2, and D3, so the chord-voicing engine is the sole independent variable. |
| **L6 — Degree menu** | The measured arms use contiguous stride stacks; `degree_menu` enumerates all five rotational orbits of Z7 at depth 3 (35 triads) and depth 4 (35 tetrads), including the two interior-drop tertian orbits. |

---

## §1. Opening Fixed Point (L29)

- **HEAD:** `7e80d26e...` (tree clean)
- **Decision ledger:** `b800cc40...` (426,743 B / 4,472 lines)
- **Observation ledger:** `8e0be9f5...` (33,153 B / 561 lines)
- **MANIFEST:** `8ac3b6a1...` (1,960 files / 300,627,676 B)
- **CHECKSUMS:** `feffe20a...` (233,895 B / 1,960 lines)
- **Completion validation:** `6b8cbf29...` (418/0 PASS)
- **Prior landing receipt:** `90f96013...`
- **Architecture map:** `865ab785...`
- **Strong core (seeded `1387@0`):** 3,204 reachable / 2,928 S000 / 2,388 governed / 540 boundary / 276 one-way.
- **Pinned inputs (11):** the landed Node Observatory common/driver/engine, the MVP-8 common/lookup/Q-engine/connector, and the pinned MVP-5, MVP-6.2, MVP-6.3, and MVP-7 modules. No pinned byte changes under L30.

---

## §2. Definitions

- **Container** `C(node) = (c_1,...,c_7)`: the node's phase-ordered pitch classes, degrees `1..7`.
- **Degree stack** for `d in 1..7`, `s in {1,2,3}`, `k in {2..5}`, rotation `m in 0..k-1`:
  `S(C,d,s,k) = { c_(((d-1+s*j) mod 7)+1) : j = 0..k-1 }`.
  The anchor degree is `r = ((d-1+s*m) mod 7)+1`; the root pitch class is `c_r`.
- **Shape:** the sorted integer vector `(pc - c_r) mod 12` over the stack. Shapes are data; tonal names never enter machine receipts.
- **Expressibility:** `EXACT` if the template set equals a stack set; `ONE-EDIT` if it differs by one substitution, addition, or deletion; otherwise `OTHER`.
- **Five orbits of Z7:** the 35 triads and 35 tetrads of any container partition into five rotational orbits of seven: three uniform-stride orbits (`s=1,2,3`) and two interior-drop tertian orbits (`drop-1`, `drop-2`). The drop orbits are `S(C,d,2,4)` minus one interior element (triads) and `S(C,d,2,5)` minus one interior element (tetrads).

---

## §3. Predeclared Bets and Measurement

### Bet A — Template reduction (all 5,544 lifted nodes)
- Tertian space: `full`, `bare`, `triad`, `seventh` EXACT; `shell`, `triad_9`, `ninth_drop5`, `rootless_13th` ONE-EDIT on every node.
- All-stride promotion: `ninth_drop5 = S(C,7,1,4)` and `rootless_13th = S(C,7,3,4)` EXACT on every node.
- The landed delta-gated resolver is audited separately; every skip and missing pitch class is enumerated. No pass/fail.
- Threshold: per-template class matches prediction on at least 99% of nodes; every exception enumerated.

### Bet B — Diatonic reproduction (84/84 states)
- Every 7-35 mask at all 12 phases: stride-2 depth-3 shapes equal the textbook modal triad table; stride-2 depth-4 shapes equal the modal seventh table.
- Rooted permutations on Ionian `2741@0`: `sus2 [0,2,7]`, `sus4 [0,5,7]`, `add6 [0,4,7,9]`.
- Threshold: 84/84 exact.

### Bet C — Benchmark triads are degree stacks (4/4)
- `{0,3,7} = S(1453@0,1,2,3) = S^(1)(375@11,7,2,3)`.
- `{10,2,5} = S(1453@0,7,2,3) = S^(2)(1143@0,3,2,3)`.
- `{8,0,3} = S(1453@0,6,2,3)`; on `379@0` it is the Orbit-4 `s2_k4_drop_j2` stack at degree 1, rotation 2.
- `{7,8,11} = S(2477@0,5,1,3) = S^(0)(859@11,6,1,3)`.

### Measurement M1 — Native shape and orbit census
- Scopes: all 5,544 lifted nodes, 2,928 S000 nodes, 2,388 governed S000 nodes.
- Families: strides 1–3 at depths 3 and 4, all rotations, plus the five-orbit partition verification on every node.

### Bet D — Paired auditions
- Six sessions: D1 `2677@0` degree walk vs template cycle; D2 `1453@0` degree walk vs template cycle; D3 Andalusian pillars degree path (Option 2) vs template cycle.
- All arms use `governed_dyads_structural`; paired arms share the same node/bar sequence, so the lead layer is identical and the voicing engine is the sole variable.
- Technical invariants: 0 out-of-mask pad/lead notes, 0 unison dyads, score-true SMF-1 MIDI, deterministic two-pass renders, stack-root bass on degree arms.
- Ear gate: human-only. No agent-authored listener field. The signed verdict is recorded verbatim in the scorecard and ear manifest.

---

## §4. Tasks 0–E

- **Task 0:** fixed point, 11 pins, 11 `mvp2.py` anchors, strong core, test-node membership, predeclaration lock, ear scorecard initialized `PENDING_HUMAN`.
- **Task A:** `degree_ladder.py`; Bets A, B, C; delta-gate audit.
- **Task B:** shape and five-orbit census M1.
- **Task C:** successor driver `node_observatory_degree.py`; legality sweep over the 16 B1 masks, all 12 phases, 7 degrees, 3 strides, 2 depths.
- **Task D:** six paired renders; ear manifest `PENDING_HUMAN` until the human signs.
- **Task E:** adjudication, closing report, guarded L30 landing.

---

## §5. Guards and Fences

Every receipt carries the standard guard block: `layer: SPEC-001 §1.3 overlay dynamics + degree-ladder observatory`, `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`, `gov517_correspondence_claimed: false`, `still_set_label: still_set`, `bipartiteEvidenceStatus: planning_evidence`, `bipartiteAdmissionEffect: none`, `bipartiteGraphScope: detached_audit_only`, `observatoryArtifactClass: observation_only`, `llmCalls: 0`.

Fences: scratch execution only until L30; no pinned byte change; 0 LLM calls; deterministic renders; no tonal names in machine records; thresholds tighten only; `harmonic.C_H` null. L30 is additive: the landed 8-treatment catalog is deprecated by evidence, never deleted.

---

## §6. Verdict Grammar

- `ADOPT_DEGREE_PATH`: Bets A, B, C, and D technical invariants pass and the signed human ear prefers or ties the degree arms.
- `ADOPT_PENDING_EAR`: all technical bets pass and the ear remains unsigned; landing blocked.
- `MEASUREMENT_ONLY`: all technical bets pass and the human ear rejects the degree arms; the census and proofs stand and the template path remains the audition default.
- `DEFER`: any predeclared bet fails; measured values stand.

No retro-amendment of `MVP8.2`'s catalog or `L29` receipts under any outcome.
