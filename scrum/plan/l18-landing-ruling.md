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
