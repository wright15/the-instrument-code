# BL-033 Phase C — lifted keying spec (W1)

**Status:** sprint artifact. Pre-registered before execution. Sandbox-only, planning evidence. No verdicts. This spec fixes the mechanical definitions used by `scripts/build-phase-c-probe.mjs`; it is derived from the approved Phase C plan (OD-1 ruling (A): minimal re-key `(o(h@p), s@p)` same-phase + seam variant via Family-A carry, both reported; cross-phase containment join forbidden) and may not be adjusted after results are known.

## 1. Scope

The retry of the D4 subdominant govern derivation (fa-pole) inside the admitted phase-extended topology sandbox (`SPEC-PHASE-EXTENDED-TOPOLOGY-001` v0.1.1, ENTRY 14 / GOV-523; probe `orrery/src/generated/phase-a-probe.v1.json`, fingerprint `c8271c20…`). D7 is the paired prediction, hypothesis-tier preserved. The original failure's recorded requirements (`provenance/DECISION_LEDGER.md:2104-2130`, `:2246-2266`; mechanics `provenance/OBSERVATION_LEDGER.md:485-532`) are the retry's specification.

## 2. Lifted addressing

1. **Nodes.** Every anchored heptatonic record `x` (462-record ledger) lifts to `{id}@{phase}` for phase `p ∈ Z12` (`p` = transposition offset; the anchored cut sits at absolute pc `p`). Phase A P1/p4 licensed this addressing.
2. **Set-level identity.** The derivation's predicates are set-level (`rotateMaskZ12` on masks). Under the lift, the predicate is posed on concrete pitch-class sets: `x@q` and `y@r` denote the same geometry iff `T_q(x.pitchClasses) = T_r(y.pitchClasses)` as sets. Roots/cuts are carried by the anchored records and are not part of the identity predicate (faithful to the mask-level original).
3. **Patch.** E2 runs in the licensed patch `{11, 0, 1}` (P6 sufficiency; phases flanking the C cut). E4 runs all 12 phases.
4. **Structural edges.** R (`GOVERNS` A1-anchor→A1-satellite), E (`CONSTRUCTS` A0→A1), and observed `SEAT_CONTACT` edges lift fiberwise same-phase. **No cross-phase containment join is admitted** (P4: containment is fiberwise/same-phase; the wall stands at every phase).
5. **Seam.** The Family-A carry is the R1/L1 seam structure (probe `p3SeamCensus.familyA`): carry `+1` (R1) / `−1` (L1), patch closed at phases 11/1. The seam is the only licensed cross-phase traversal structure.

## 3. Lifted keys

The original contract key is `(parentOffice, satellite)` — `(o(h), s)`, compared against the granted domain `U = {(o(h), s) : R}` and the observed contacts `O` (14 rows). Under the lift:

- `U@p = {(o(h)@p, s@p)}`, `O@p = {(o(h)@p, s@p)}` (same-phase;
  observation phase deltas are recorded as diagnostics, never applied to re-key the grant).
- **A-same (calibration):** anchored kernel-twin witnesses lifted uniformly at each patch phase: `G_A(p) = {(k@p, s@p)}`. Required to reproduce OBS-023 exactly at every `p` — the calibration gate; a failure means the keying is wrong, not the derivation.
- **A-seam (experiment):** the kernel-twin relation re-expressed as set-identity with seam-carried phase contexts:
  for every pair of A0 anchors `(a, c)` and every `q_a, q_c ∈ {11,0,1}` with
  `T_{q_a}(a.pcs) = T_{q_c}(c.pcs)` (same geometry, non-trivial) and office straddle
  `a.office = (k+1) mod 7`, `c.office = (k−1) mod 7`, office `k` qualifies;
  `G_A@seam = ⋃_{k qualifies} {(k, s) : R.parentOffice = k}` (anchored projection, the contract's own units), with phase provenance recorded per witness. This is the "minimal re-key": the same rotation identity, posed in the new addressing; the flank pairs at contexts (1,11) are the patch representatives of the same concrete geometry.
- **B routes:** same-phase construction join over `E@p` (`G_B = U`, the T-B restatement), plus a carried check for seam-realized E endpoints (reported; expected absent).
- **T-C:** per-phase anchored relation set (calibration) plus the seam keying's generated A0 relation inventory vs the observed seam groups. `C_strict = midpoint_exact` under strict set equality at the seam keying; `C_realization` reports whether each observed seam group is patch-realizable (diagnostic).

## 4. Contract application

The frozen Outcome Contract (`provenance/DECISION_LEDGER.md:2104-2117`) applies unchanged, first-applicable row wins, on the anchored projections `(G_A@seam, G_B, U, O, C_strict)`. C2 no-restatement guard: any route with `G = U` is classified `restatement_signature`/`filter_plus_geometry` by precedence and can never be `derived`. Success criteria C1–C4 and the interpretation branch table are locked in the Phase C plan (PM-approved v1.1).

## 5. E3 analogue rules (D7)

`analogue-R` is constructed, audited, and labeled `hypothesis-analogue`: parent `h = d` for each D7 seat-contact row `(s, d)` (the only D7 anchor→satellite structure; no D7 grant exists), modal orbit recorded as the D7 constructing structure. Parity-with-D4-grant claims are forbidden. The same route machinery runs; the D4 contract's seam-domain clause is reported as inapplicable where D7 has no `CONSTRUCTS` seam provenance (contract `:2112`: an empty expected seam domain cannot pass vacuously).

## 6. E4 wall census

Per-phase D–D fixed-degree census over all 12 phases (pre-registered null: zero at every phase). Family-A (R1/L1) incidence touching D anchors is reported **separately** and is never called wall dissolution (OD-4). Any non-zero fixed-degree or new traversal structure is a fail-loud finding that halts interpretation.

## 7. Fences

Sandbox-only: no canonical/Court/schema/Neo4j/shared-sidecar writes (SPEC-001 §4.3), no MANIFEST/CHECKSUMS edits (packaging is a landing-time step). D4 `not_derived` untouchable except via its own claim event. D7 stays hypothesis-tier. Frame (§§2.6/2.7, polarity synthesis) is interpretation vocabulary only, never design input, and is never designed toward. All outputs `planning_evidence` (generator + independent validator + pins, byte-stable, fingerprint). Session prose is context, not evidence.
