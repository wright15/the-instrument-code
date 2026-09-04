# Sprint 3 Closeout Plan — Five-Item Ordered Close

> The point you *leave* a state at is the state the next context inherits. Sprint 3 closes at a fixed point, with receipts, with the board telling the truth, and with the next act's opening move already written.

**Status:** Approved for execution · **Sprint:** Sprint 3 → EPIC-520 · **Release:** `1.9.0-dev` (`scrum/EPIC-520-unified-operator.md:3` Backlog-zero-children, not `1.9.0` — `provenance/DECISION_LEDGER.md:35`)
**Depends on:** `5d27bea Sprint 3: GOV-512 close + ORR-512/513/514` (13 modified + 16 new files) · **Blocks:** EPIC-520 Sprint 4 intake

---

## Stance
No new mathematics in this close — infrastructure load-bearing interlude. All assertions reviewable via `git status`, `git log --oneline -5`, `npm run validate --silent`, and `scrum/*.md:3` header lines. Report tables derived from `git diff`, never composed.

### 1. Land the working tree (commit + fixed point survived)
**Goal:** No EPIC-520 work starts on a dirty tree.

**What exists:** Sprint 3 build staged 13 modified + 16 new files and was committed as `5d27bea Sprint 3: GOV-512 close + ORR-512/513/514` atop `ff7d7a2`. `MANIFEST.json`/`CHECKSUMS.sha256`/`qa/integrated-release-validation.json` regenerated (fileCount 975).

**Decision:** Commit this closeout record under `scrum/plan/` before board sync. It is a process receipt; keeping the board-sync commit single-purpose keeps its derived diff table legible.

**Verification (read-only):**
```bash
git status --short          # expect clean
git log --oneline -5
npm run validate --silent   # expect exit 0, no tracked change on clean tree
node scripts/build-manifest.mjs --check  # expect {check:true}
```

**Guard:** The terminal fixed-point loop is deliberately deferred until all closeout writes (items 2–5) are complete.

### 2. Board sync final pass — receipts over board, whole board
**Goal:** Fresh context's first impression is a truthful board. Board drift at Sprint 3 open (closed stories reading `Backlog`) is now a known failure mode; final pass is cheap.

**Rows to verify `scrum/*.md:3` Status == receipt:**
- `scrum/GOV-501-neo4j-baseline-parity.md:3` / `GOV-502-documentation-validation-census.md:3` — Done (Sprint 1, retained baseline).
- `scrum/GOV-510-twin-hub-contact-convergence-audit.md:6` / `scrum/GOV-511-d-tier-fifth-space-census.md:6` — Done with dual-citation gate-time `38dc4131…/570679df…` + live `3f3fab27…/556d3f65…` (binding-refreshed).
- `scrum/GOV-512-research-gate-3.md:6` — Done, receipt `provenance/DECISION_LEDGER.md:35` + `provenance/DECISION_LEDGER.md:58` activation guard.
- `scrum/ORR-511-evidence-inspector-bundle.md:3` / `ORR-512-provenance-explain-surface.md:3` / `ORR-513-field-derivation-surface.md:3` / `ORR-514-tiered-photonic-overlay.md:3` — Done with QA receipts `5f241d51…` / `0530b295…` (`qa/orrery-field-derivation-bundle-validation.json:1`, `qa/orrery-photonic-overlay-validation.json:1`).
- Epics: `scrum/EPIC-500-state-honesty-and-baseline-parity.md:3` / `EPIC-510-full-field-derivation.md:3` / `EPIC-511-orrery-evidence-surfaces.md:3` — closed; `scrum/EPIC-512-taxonomy-explorer.md:3` — active Sprint 4 (`ORR-521/522/523/524`); `scrum/EPIC-520-unified-operator.md:3` — `Backlog` zero children (verify against ledger, no state change — framing fix from Sprint 3 plan).

**Verification:** Sequential `Read` of each header; any stale `Backlog` where receipt says `Done` is synced `ledger → scrum` with citation. Full scope includes ORR-512/513/514 plus their closed EPIC-510/511 parents. Verify ORR-521/522/523/524 exist before setting EPIC-512 active for Sprint 4; otherwise retain `Backlog` with a note. No new decisions.

### 3a. Fold two hygiene riders to durable locations
**Current home:** Sprint 3 recommendations list (conversation territory, not durable). Already copied into EPIC-520 handoff as Sprint 4 intake riders — will be found, but one is stale *now*.

- **Fix now (lightweight):** `provenance/NEXT_STEPS.md:9` stale shadow-ladder receipt `0e859f97…/8bd53883…/47aae971…` superseded by post-GOV-512 regeneration `2f2d59db…/7a3d3236…/1fcdc4bc…` (`canonical/fivefold-incubator/shadow-ladder-v0.json:1`, `qa/shadow-ladder-validation.json:1` 37/37 `adabef8d…`). One-line correction keeps the file whose job is pointing auditors at current bindings truthful.
- **Defer to Sprint 4:** Extend `scripts/validate-validation-prose-consistency.mjs` to scrum fingerprint literals — validator + release-gate wiring belongs to `EPIC-512`/`ORR-524`, not a one-line doc fix.

**Guard:** Report table of changes derived from `git diff`, prose-consistency literal rule (`provenance/DECISION_LEDGER.md:48` ledger→sidecar DAG).

### 4. Sprint retrospective — ½ page, not canonical
**Why:** Sprint 3 proved five patterns simultaneously; the context that earned them is about to be gone. The raw material the next "should we do X?" decision will consult.

**Content:**
- Verification-gate maiden voyage: per-suite `ran`/`skipped` receipts established the reporting format every future sprint's receipts depend on; its `orrery:browser:test` fresh-session modal timeout under 8 concurrent `software-GL` was documented as `skipped` with reason `ff7d7a2`, lesson: document concurrency flake, don't retry.
- At-birth guard promotion: channel lint `Variant A hue null` `orrery/src/photonic-overlay.test.ts:1` + `orrery/scripts/validate-photonic-overlay.mjs:1` now standing in `orrery:check` forever — cheapest guard cost.
- Fabrication-catch: EPIC-520 draft `99.36%` scalar mass — intercepted pre-contamination (first pre-contamination catch, prior incidents discovered post), cost one review cycle.
- Explicit framing: infrastructure interlude load-bearing — bounded-query contract `skills/governor/schemas/inspect-context.schema.json:5`, receipt-bound surfaces `orrery/src/generated/field-derivation-bundle.v1.json:1`/`photonic-overlay.v1.json:1`, reporting format — not “no mathematics advanced.”
- Meta-pattern: the closeout instruction itself was drift-checked against the tree before execution, catching implemented ORR stories and closed epics still marked `Backlog`.

**Location:** `docs/verification/SPRINT_3_RETROSPECTIVE.md` — filed before context loss. Non-canonical, no ledger binding required.

### 5. Phase-boundary ledger line — navigation, not ceremony
**Goal:** Future auditor landing mid-Sprint-4 understands register shift: Sprints 1–2 *derived structure* (theorems, 462-record census, confirmations `OBS-014/015/016`) → EPIC-520 *discriminating explanations* (three hypotheses, zero checks run, weakening verdicts).

**Text:** `Research mode transition: Sprints 1–2 derived structure; EPIC-520 opens hypothesis discrimination (three hypotheses, zero checks run). Evidence surfaces completed in Sprint 3 support this phase.` — add after the `provenance/OBSERVATION_LEDGER.md:1` preamble as `## Sprint 3 → EPIC-520 boundary — 2026-09-04`.

**Guard:** This is a navigation-only observation of the project's epistemic state, not a decision or act of authority. No topology/admission/operator authority implied; report status, not hypothesis likelihood.

### 3b. Terminal fixed-point loop — one regeneration cascade
**Why last:** The observation-ledger entry changes fingerprints pinned by shadow-ladder, twin-hub convergence, and fifth-space census. Writes first, then a single DAG-ordered regeneration cascade avoids a second fixed-point cycle.

```bash
npm run build:shadow-ladder --silent
npm run build:twin-hub --silent
npm run build:fifth-space-census --silent
npm run package:manifest --silent
node scripts/build-manifest.mjs --check
npm run validate --silent
git status --short
```

**Guard:** Expect refreshed bindings with unchanged verdicts. `docs/verification/FINGERPRINT_BLAST_RADIUS.md:13-15,19` defines this ledger → sidecar closure; do not omit the twin-hub or census regenerations.

---

## Explicit not-to-do
Do not encode Sprint 3 infrastructure delivery as failure in retrospective. It was scoped as infrastructure, delivered infrastructure, and the EPIC-520 handoff depends on exactly what it built — the bounded-query contract, the receipt-bound evidence surfaces, the reporting format. Interludes are load-bearing.

## Sequencing & effort
`1 → 2 → 3a (NEXT_STEPS fix) → 4 → 5 → 3b (terminal fixed-point loop)` · ~1h agent work + your review. Commit the plan before board sync; then commit board sync, prose writes, and the regeneration cascade separately. Launch EPIC-520 handoff only after `npm run validate` is stable, `git status` clean, and the board truthful.

## References
- `provenance/DECISION_LEDGER.md:35` Research Gate 3 dual confirmation
- `provenance/DECISION_LEDGER.md:48` ledger→sidecar DAG
- `provenance/DECISION_LEDGER.md:58` EPIC-520 activation guard
- `provenance/NEXT_STEPS.md:9` S2→S3 shadow-ladder receipt (stale)
- `qa/shadow-ladder-validation.json:1` 37/37 `adabef8d…`
- `skills/governor/schemas/inspect-context.schema.json:5` bounded-query contract
- `docs/verification/VERIFICATION_REPORT_GATE_STATUS.md:1` per-suite ran/skipped
- `docs/verification/FINGERPRINT_BLAST_RADIUS.md:13-15,19` observation-ledger regeneration closure
