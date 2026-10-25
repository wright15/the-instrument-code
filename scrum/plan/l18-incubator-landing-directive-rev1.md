DIRECTIVE L18-INCUBATOR-LANDING — rev 1

Issued by: Planning Seat. Predecessor chain: PV3-DIR-1..5 -> ORRERY-NAV-1 (draft ->
rev 2 -> rev 2.1 -> build -> acceptance) -> L18-LANDING-RULING-1 -> L18-PHASE0
(COMPLETE, accepted).

SS0 — PURPOSE AND POSTURE
This is the first repo-writing session since L17. It lands the governed-loop
prototype (Policy-v3 engine + orrery navigation tooling + their evidence) into the
repository as a byte-identical ARCHIVAL incubator, derives L18, and discharges the
deferred ledger full-regen — the two-arc catch-up (Policy-v3 registration;
ORRERY-NAV-1 acceptance). MVP-3 does not start in this session. The sequencing lock
(no MVP-3 scratch mutation until L18 derives) lifts only when this session closes
PASS.

SS1 — ADOPTED DECISIONS
D-1 LANDING MODE: ARCHIVAL-FIRST. Byte-identical copies; the realm remains the
  runtime; the repo is the record. No path/context parameterization, no runnable
  variant, no new registration. The archived code's hardcoded realm path
  (SCRATCH = /home/erick/workspace/governed-loop) and repo-state pins (REPO_HEAD
  65c7247..., fileCount 1,402, ledger prefix 8901b4a3) remain TRUE of the
  verification session and land unmodified. Post-L18 consequence, recorded in the
  L18 entry: any realm harness that asserts repo state at runtime now faces the new
  fixed point; re-pinning is MVP-3's opening obligation, not L18's.
D-2 DESTINATION: tools/governed-loop/ — flat, original filenames preserved (the
  pinned code's expected names must resolve). Prose records -> scrum/plan/.
  Staging receipt -> qa/l18-staging-receipt.json.
D-3 BINDING: first-class manifest bind of the ENTIRE landed set — no subset.
  Static instantiability check: all 24 bridge-EXPECTED entries resolve within the
  landed set with matching sha256; execution not required (archival mode).
D-4 LEDGER SHAPE: ONE combined L18 entry (no partially-expanded intermediate
  state), sections: (i) opening L-state derivation + append-position proof (R23,
  not numstat-blind); (ii) two-arc catch-up (Policy-v3 registration incl. a-d,
  E1-E10, 501 closure, 41-at-T11 sweep, receipt inventory; ORRERY-NAV-1 acceptance
  incl. D-3(a), F1-F4 dispositions, F3 erratum reference); (iii) the incubator
  landing (file table + pins, staging-receipt digest); (iv) adopted decisions
  D-1..D-8 and the Phase-0 findings relied upon. Ledger rules 7/8; non-claim form;
  append-first cascade (BL-092 model).
D-5 OPTIONAL LINEAGE: ALL IN — freeze.py, freeze_v2.py, spike01.py,
  analyze_disputes.py, seam_build_phase_a_probe.mjs, seam_validate_phase_a_probe.mjs,
  seam_rl_operator_math.md, spike-01-phase-policy.md. Consequently phase_a_probe.json
  is IN (byte-identical twin of seam_phase_a_probe.json; spike01.py expects the bare
  name). Rule: generators of landed evidence land with their evidence.
D-6 GROUND TRUTH: frozen_ground_truth.json (007b0ffe..., 91,360 B) lands
  load-bearing (mvp2.py GT_PATH; bridge Model input). qa/gov-528-production-
  aggregate.json remains the repo-side correspondence anchor (withheldBoundary =
  154). Hierarchy per F3.
D-7 EXCLUSIONS (per L18-PHASE0 section 7): v1 execution/validation receipts
  (census_exec.json, census_val.json, census_val_exec.json); network_data.json;
  realm gov528_aggregate.json (the repo qa original is the anchor); MVP-2b
  superseded bridge files (mvp2_bridge.sh, bridge_replay.js, bridge_replay_live.js);
  browser artifacts (orrery_nav_browser_log.json, orrery_nav_probe.js,
  orrery_nav_opening_probe.json); caches, logs, plans, heards, session notes, drafts.
D-8 INVENTORY AUTHORITY: the file tables in SS2 are EXPECTATIONS. Authorities at
  staging: (a) full sha256 re-derivation of every source; (b) plv3_receipts_manifest.json
  (461a16b0...) — every receipt it references lands (this settles
  plv3_receipt_beta_supersession.json and any similarly named sibling);
  (c) orrery_nav_bridge.py EXPECTED (24 entries) — every referenced file lands;
  (d) any file referenced by a landed artifact's pins that is absent from SS2 and
  not excluded by D-7 -> add it (pin derived at staging) or justify the exclusion
  in the closing report. Silent omission is forbidden.

SS2 — LANDED SET (expectations; pins re-derived at staging; ANY mismatch = STOP)

Realm files -> tools/governed-loop/ (51 expected; D-8 may add):

G1 — immutable data / ground truth (12):
  census_462.json 242bce74 | frozen_ground_truth.json 007b0ffe
  frozen_seam_substrate.json 8a5e82ac | frozen_seam_substrate_v3.json 9f9818ef
  seam_legal_moves_v3.json e6cf62a8 | seam_legal_moves_v2.json c017c3c6
  seam_operator_applications.csv 1f7b2abb | seam_operator_registry.csv e5a9e692
  seam_phase_a_probe.json 48f51367 | phase_a_probe.json 48f51367
  seam_bipartite_inclusion.json 903eebf0 | seam_census_head.json f7e56b2b

G2 — freeze / evidence / receipts (20):
  freeze_report.json 4e76c139 | freeze_report_v2.json da14de46
  freeze_report_v3.json 1c65a07c | plv3_receipts_manifest.json 461a16b0
  plv3_receipt_pcsum_23.json f9666daf | plv3_receipt_pcsum_24.json 0128748a
  plv3_receipt_pcsum_48.json 6bd2e4e7 | plv3_receipt_pcsum_49.json 8a06b211
  plv3_receipt_boundary_exits.json ea20bc95 | plv3_receipt_boundary_entries.json 12ca0625
  plv3_receipt_crossphase.json 806dfa06 | plv3_receipt_familyb.json cb2180bd
  plv3_receipt_beta.json 53a12654 | plv3_receipt_nonvacuity.json cb9fa9e6
  plv3_receipt_case501.json 0fab6bc4 | gate_log_mvp2_live_mac1.jsonl de90eb47
  dispute_analysis_mvp2c.json df90f405 | spike01_evidence.json cb170c0d
  degenerate_boundary.jsonl f728f8ee | degenerate_boundary_report.json 339dc893
  (Exact receipt filenames governed by plv3_receipts_manifest.json per D-8(b).)

G3 — code / harness (8):
  mvp2.py fb9db3cd | orrery_nav_bridge.py ae6502b9
  orrery_nav_overlay.js ad558dec | orrery_nav_run.sh 2678f719
  bridge_init.js aef2b742 | mvp2_orrery_nav_smoke.py fe81ee3a
  orrery_nav_opening.py 2461ac90 | orrery_nav_opening_probe.js 597563ec

G4 — reports / registration (3):
  orrery_nav_opening.json a29ba9a3 | orrery_nav_report.json 8c95483e
  policy-v3-registration.md 48290a2f

G5 — optional lineage, all IN per D-5 (8):
  freeze.py 78c939ea | freeze_v2.py 53ff56c3
  spike01.py 1e7bbbc3 | analyze_disputes.py 8328798a
  seam_build_phase_a_probe.mjs 59deb0e4 | seam_validate_phase_a_probe.mjs 8177b23d
  seam_rl_operator_math.md ab574635 | spike-01-phase-policy.md 015d0b43

Records -> scrum/plan/ (8, pin-at-first-use):
  orrery-nav-1-directive-rev2.1.md — the thread-pasted build-dispatch text, AS CUT
  orrery-nav-1-closing-report.md — the seated agent's closing report, AS ISSUED
  orrery-nav-1-acceptance-record.md — SS6.B verbatim
  orrery-nav-1-f3-erratum.md — SS6.A verbatim
  l18-landing-ruling.md — SS6.C verbatim
  l18-phase0-report.md — the seated agent's Phase-0 report, AS ISSUED
  l18-incubator-landing-directive-rev1.md — this directive, AS CUT
  l18-landing-closing-report.md — produced at close, written here
Fence: rev 2.1 lands AS CUT — the F3 erratum travels WITH it as a separate record;
never edit the directive text to satisfy a validator or a reader.

SS3 — OPENING PROTOCOL (first repo-writing session since L17)
1. Fixed point: HEAD 65c72478..., tree clean, ledger L17 8901b4a33fadf1f8...
   (307,304 B / 3,967 lines), MANIFEST fileCount 1,402 / totalBytes 90,516,292.
   Any drift = STOP.
2. Full L-state derivation (the deferred obligation discharges HERE, per
   L18-PHASE0 1e — ANY repo write voids the zero-write posture): derive L17 in
   full; prove the append position (prefix + tail-anchor, R23 — not numstat-blind);
   record the projected post-append L18 shape.
3. P0 preservation (BL-092 section 1 discipline): preserve the pre-refresh
   artifacts (17 files + receipt) before any append; the d-shadow complement-span
   verifies FRESH (OD-92-1) — never refreshed.
4. Realm is read-only this session: REALM-MUTATIONS: 0 (archival source). The
   staging receipt is repo-side.

SS4 — EXECUTION
Phase A — Staging. Compute full sha256 of all 51 realm sources (+ any D-8
  additions); compare to SS2 pins and the L18-PHASE0 sections 4/6/7 pins. ANY
  mismatch = STOP — no repair, no regeneration, no normalization, no "fix the pin
  to fit." Write qa/l18-staging-receipt.json (per file: source path, destination
  path, bytes, sha256, match status); pin it. Copy raw bytes (cp): no JSON
  re-serialization, no newline normalization; preserve executable bits on .sh/.py
  (mode is not covered by content pins); verify sha256 on BOTH sides post-copy;
  group order G1->G5.
Phase B — Records. Write the 8 scrum/plan records. The three thread texts
  (rev 2.1, closing report, Phase-0 report) come from the build agent's own thread
  copies, byte-faithful as issued; SS6 texts land verbatim; pin all at first use
  in the staging receipt.
Phase C — Ledger. Append the ONE combined L18 entry (D-4) — append-first, BEFORE
  the cascade. Then the append-first cascade (BL-092 model): re-bind the
  ledger-bound artifacts (twin-hub convergence, fifth-space census, shadow-ladder,
  pentatonic binding audit closure, fivefold engine promotion evidence) plus the
  downstream orrery projections.
Phase D — Release closure + packaging. Re-emit
  qa/integrated-release-validation.json (418/0, verdict invariant); rebind
  MANIFEST.json / CHECKSUMS.sha256 (one full hash pass; no size/count cap); run
  the focused verification set (BL-092: 40 pytest + 1 node + 35 mutation probes;
  validate-ledger-pins — scans scripts/ only, tools/ out of scope by design;
  evidence advisory; orrery:check; full npm run validate — NOTE: it WRITES:
  build:graph output, release receipt, prose receipt).
Phase E — Settling pass (standing rule 9): package:manifest -> --check ->
  validate; repeat until a pass makes no tracked change (expect 1-2 cycles; prior
  records cite zero or one). PROSE-CONSISTENCY FENCE: validate-prose-consistency
  scans scrum/**/*.md, so the landed records are in scope. The F3 erratum
  deliberately contradicts rev 2.1 section 4/A1 — that contradiction is SANCTIONED.
  If the validator flags it, resolve by annotation per repo convention; NEVER by
  editing the landed rev 2.1 text. Any prose finding NOT covered by this sanction
  = STOP.
Phase F — Closing report. Fixed point first (post-landing HEAD; ledger L18
  digest/bytes/lines; MANIFEST fileCount/totalBytes); staging-receipt summary;
  L18 entry digest; cascade/closure/settle results; static instantiability 24/24;
  file-table status; machine verdict block (SS7) terminal, no trailing prose.

SS5 — STOP RULES
S-1 any sha256 mismatch at staging (source-vs-pin or destination-vs-source).
S-2 opening fixed-point drift.
S-3 append-position proof failure (R23).
S-4 a receipt-manifest or bridge-EXPECTED referenced file unresolvable in the realm.
S-5 cascade failure, or release-closure verdict not 418/0.
S-6 settling pass cannot reach a no-tracked-change fixed point within 3 cycles.
S-7 prose-consistency findings outside the sanctioned erratum annotation.
S-8 any requirement to edit a pinned/landed file in order to proceed.
All STOPs: full stop, no partial landing; report with machine verdict STATUS: STOP
and the fired rule id. No silent reconciliation, ever.

SS6 — EMBEDDED RECORD TEXTS (land verbatim)

SS6.A — F3 erratum (canonical text):
  ERRATUM F3 (ORRERY-NAV-1). Directive rev 2.1 section 4/A1 names "repo
  frozen_ground_truth.json" as the census correspondence anchor; that path does
  not resolve in-repo. Corrected hierarchy: realm-side frozen_ground_truth.json
  (sha256 007b0ffe..., 91,360 B) is the PRIMARY 462 ground-truth artifact —
  mvp2.py loads it as GT_PATH and orrery_nav_bridge.py loads it in Model; the
  repo-side correspondence anchor is qa/gov-528-production-aggregate.json
  (withheldBoundary = 154), which carries the 308 member records/orbits/partition
  but not the 462 masks, roles, pcSum, families, governing roots, or orbit
  membership. mvp2.py is realm-side; the repo carries the orrery. The 154 chain
  closes: registration 154 <-> withheld 154 <-> 1,848 = 154 x 12. Rev 2.1 stands
  as cut with this erratum attached; no re-cut. Non-fatal per the GAP-C evidence
  hierarchy (realm bytes primary; repo files correspondence-only). Issued by the
  Planning Seat at the ORRERY-NAV-1 closing adjudication; landed with the L18
  incubator landing.

SS6.B — Planning-Seat acceptance record (ORRERY-NAV-1):
  PLANNING-SEAT ACCEPTANCE RECORD — ORRERY-NAV-1 (rev 2.1 closing report). Issued
  at the closing adjudication (thread record ORRERY-NAV-1-CLOSING-ADJUDICATION).
  Fixed point (as reported, registered): repo HEAD 65c7247, tree clean, ledger
  L17 8901b4a3 (307,304 B / 3,967 lines), fileCount 1,402; zero repo writes; zero
  orrery changes; no tags; mvp2.py pinned fb9db3cd at open, identical at close.
  Verdict block 14/14 format-exact per SS8, terminal, no trailing prose; all
  PASS-side values present (5544 / 5130 / 18984 / 256 / 7-7 / TRUE / VERIFIED /
  0 / CLEAN / 0 / 0). Pins: directive prefixes 48290a2f / 9f9818ef / e6cf62a8 /
  1c65a07c / 461a16b0 match full digests; 24-pin opening inventory accepted as
  pin-at-first-use enrichment. Anchors quoted from bytes (150-154 self-transfer
  veto; 171-172 governed self-pairs ACCEPT; 183-184 boundary REJECT; 733
  DWELL_MS). Derived counts 5/5: 5,544 = 462 x 12; 5,130 = 5,040 + 90; 18,984 =
  12 x 1,582; 256 = 128 + 128 (196 distinct, enrichment); offices 7; GOVERNS 238.
  Endpoints 4/4 count MATCH with write-route negation (POST /api/nodes -> 405).
  Conformance: Family A 5,040/5,040 direct ACCEPT (R1/L1); Family B 1,008/1,008
  ACCEPT, citation split 720 bridge + 288 Tier-1-first; 90-crossing count verified
  from catalog + substrate bytes. Probes 7/7 (>= registered minimum). Overlay:
  84 cells + 12 boundary chips; 3,696 + 1,848 = 5,544; 1,848 = 154 x 12 grounds
  the 154 chain; bake CLEAN; console 0/0; audio 18 voiced + 4 rests (rests at
  boundary targets; dwell-0 is voicing mechanics). D-3 closed as (a) by unamended
  dispatch of rev 2.1. Findings: F1 phase connectivity RECORDED non-blocking
  (max 6 phases per seam component, witness mask 127; a single-connected walk, if
  ever wanted, needs its own directive — not owed); F2 citation split RECORDED;
  F3 anchor erratum REGISTERED (see the F3 erratum record); F4 harness corrections
  RECORDED (realm-side, pre-green, no surface touched). Disposition: ORRERY-NAV-1
  ACCEPTED; arc closed GREEN (draft -> decisions -> rev 2 -> rev 2.1 -> build ->
  acceptance); MVP-3 gate "Policy-v3 stable" satisfied; nothing owed to the repo.
  ACCEPTED | D-3: (a) | F1: DEFERRED-NONBLOCKING | F2: RECORDED |
  F3: ERRATUM-REGISTERED | F4: RECORDED

SS6.C — L18 landing ruling (operative form):
  PLANNING-SEAT RULING L18-LANDING-RULING-1. Question: land the governed-loop
  prototype into the repo (Option A, in-tree incubator at L18) vs keep code
  scratch-only and land memos (Option B), before MVP-3. RULING: Option A, at the
  ORRERY-NAV-1/MVP-3 phase boundary, before MVP-3's first scratch mutation.
  Grounds: (1) oracle gap — the tree holds Policy-v3's specification but not its
  execution; the acceptance pins reference scratch-resident bytes the tree cannot
  resolve, and the ledger is the only persistent record; (2) last cheap window —
  the arc closed at a verified fixed point (HEAD 65c7247 clean; mvp2.py fb9db3cd
  byte-identical open/close; 24-pin inventory confirmed; all derived numbers
  matched); after MVP-3's first mutation the as-verified snapshot (bytes that
  passed 18,984 Tier-1 queries, 1,008 Family B checks, and the full overlay
  walkthrough) is uncapturable; (3) MVP-3 epistemics — a stochastic proposer
  requires an immutable, versioned reference surface; an untracked baseline under
  LLM-driven mutation cannot distinguish proposer-illegal from surface-drift;
  (4) the zero-write posture is paid out at a boundary landing, not breached — and
  the deferred full-regen is a carried obligation that ANY repo write triggers
  (confirmed at L18-PHASE0 1e). Option B survives only if the landing is heavy,
  scratch is durable, and MVP-3 is read-only — none hold. Conditions: scope =
  pinned load-bearing set + scrum/plan records, one cycle; byte-identity gate vs
  registered pins, mismatch = STOP; incubator path and manifest binding
  maintainer-declared; L18 carries the two-arc catch-up; two-masters guard — L18
  is the reference baseline, scratch the working copy, no auto-sync, reconciliation
  at L19 post-MVP-3. Sequencing lock: no MVP-3 scratch mutation until L18 derives.
  RULING: OPTION A | GATE: BYTE-IDENTITY, MISMATCH => STOP |
  SEQUENCING LOCK: NO MVP-3 SCRATCH MUTATION UNTIL L18 DERIVED

SS7 — VERDICT BLOCK (terminal, byte-exact, no trailing prose)

L18-INCUBATOR-LANDING
FILES-STAGED: <n>/<n> PIN-MATCH
BRIDGE-INSTANTIABLE-STATIC: 24/24
LEDGER: L17 8901b4a3 -> L18 <prefix> (<bytes> B / <lines> lines)
MANIFEST: fileCount <n>, totalBytes <n>
RELEASE-CLOSURE: 418/0
SETTLE-CYCLES: <n>
CASCADE: COMPLETE
PROSE-CONSISTENCY: PASS | SANCTIONED-ANNOTATIONS <n>
ORRERY-CHANGES: 0
REALM-MUTATIONS: 0
REPO-WRITES: <n> IN-DIRECTIVE-SCOPE
STATUS: PASS | STOP

SS8 — OUT OF SCOPE
MVP-3 in any form (proposer, harness evolution, harness re-pinning); runnable-mode
parameterization or any new registration of a code variant; edits to any
pinned/landed file; realm mutations; orrery app changes; new policy/traversal
rulings (F1 remains deferred); git tags (none, per house convention).

COST EXPECTATION (from L18-PHASE0, unmeasured)
~30-60 min agent work + maintainer review; 1-2 settle cycles (2-5 min each);
manifest hash pass in seconds; ~6.5 MB added across ~60 files (51 realm + 8
records + staging receipt; expected fileCount ~1,462). If measured reality
exceeds these by a wide margin: complete the current phase, then STOP with the
delta recorded — do not abandon mid-landing.
