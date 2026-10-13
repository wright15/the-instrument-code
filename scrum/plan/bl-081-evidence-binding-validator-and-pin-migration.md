# BL-081 — Evidence-binding infrastructure: the advisory validator (CONV-EVIDENCE-BINDING-001 §3.2) + the BL-058 pin migration (13 → 0)

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. No claim events; no record amendments (ENTRY 10/15/16/17/18 byte-untouched); the frozen D4 stack (`scripts/d4-*.mjs`) byte-untouched; no canonical/Court/schema/Neo4j writes beyond the landing's own files. D4's `derivable-from-derived-inputs` (ENTRY 18) and D7's hypothesis-tier are unchanged; no G1 movement; no GOVERNS admission; no INV-5 graduation; no M-walkability promotion. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence; every load-bearing claim cites landed artifacts.

**One landing, two halves.** The advisory evidence-binding validator (the convention's named follow-up at `provenance/EVIDENCE_BINDING_CONVENTION.md` §3.2, `:342-355`) and the BL-058 pin migration (`scrum/BACKLOG.md:687-699`) land together so the migrated pins are **born under their own enforcement**: the migrated binding is the validator's first live R2 consumer, and the 12 registered fingerprints remain enforced by their generators' runtime self-checks wired into `orrery:check`.

## 1. What landed

| Deliverable | Artifact |
|---|---|
| The advisory validator | `scripts/validate-evidence-bindings.mjs` (`validate:evidence`; advisory-first; `--strict`; `--json`) |
| Validator tests | `scripts/validate-evidence-bindings.test.mjs` (9 tests: selector/classifier units + advisory CLI smoke) |
| The migrated pin's registered home | `qa/d4-r2-execution-receipt-ledger-binding.json` (R2 entry-scoped span binding; the `DECISION_LEDGER_SHA256` literal deleted from code) |
| The migrated generator | `scripts/build-d4-r2-execution-receipt.mjs` — `readLedgerFence()` reads the sidecar; the pinned value and prefix endpoint unchanged |
| The 12 registered fingerprints | `schemas/ledger-pin-allowlist.json` — 12 reviewed R1-class entries added |
| Wiring | root `validate:evidence`; `orrery/package.json` `evidence-bindings:check` appended after `golden-path-catalog:check` in both `check` and `build` chains |

## 2. Grounding corrections (ratified at planning)

1. **The 12-vs-1 split.** Only `DECISION_LEDGER_SHA256` is a ledger-named pin. The other 12 violations are derived-artifact fingerprint chain-anchors (R1-class committed-bytes bindings) that were correct in what they verified but never registered. The migration splits accordingly: **registration (allowlist-12) vs design (R2-1)**.
2. **The ledger pin is already prefix-scoped.** `sha256(ledgerBytes.subarray(0, 174314))` + the ENTRY 10 span checks (`scripts/build-d4-r2-execution-receipt.mjs` pre-migration `:929-945`). The R2 migration is a **re-expression into the convention's declarative format and a literal deletion — zero new logic**; the pinned value (`8b7084bc…`) and endpoint (174314) are unchanged.
3. **The enforcement asymmetry.** The corridor generators' landings postdate the convention's admission commit (`6e3607b`, 2026-09-20) while the validator did not exist; the classifier records per-file first-appearance honestly (§5).

## 3. The pin migration (13 → 0)

**Pre-migration inventory** (`scripts/validate-ledger-pins.py`, run at `ef218a2`): FAIL, 13 violations — 12 `unreviewed_literal_pin` + 1 `literal_ledger_pin`.

**Per-pin disposition (all 13):**

| # | Generator | Constant | Disposition |
|---|---|---|---|
| 1 | `build-phase-c-probe.mjs` | `PHASE_A_FINGERPRINT` | allowlisted — fingerprint of `phase-a-probe.v1.json:probeFingerprint` |
| 2–3 | `build-d4-selection-review.mjs` | `PHASE_A_FINGERPRINT`, `PHASE_C_FINGERPRINT` | allowlisted — consumed-artifact fingerprints |
| 4–5 | `build-d4-r2-route-review.mjs` | `SELECTION_REVIEW_FINGERPRINT`, `PHASE_C_FINGERPRINT` | allowlisted — consumed-artifact fingerprints |
| 6–7 | `build-d4-r2-contract.mjs` | `SELECTION_REVIEW_FINGERPRINT`, `PHASE_C_FINGERPRINT` | allowlisted — consumed-artifact fingerprints |
| 8–10 | `build-d4-r2-execution-receipt.mjs` | `CONTRACT_FINGERPRINT`, `SELECTION_REVIEW_FINGERPRINT`, `PHASE_C_FINGERPRINT` | allowlisted — consumed-artifact fingerprints |
| 11 | `build-d4-r2-execution-receipt.mjs` | `FROZEN_IMPLEMENTATION_DIGEST` | allowlisted — the immutable D4 nine-file closure digest recorded in `qa/d4-production-receipt.json:bindings.implementationDigest` |
| 12 | `build-d4-r2-execution-receipt.mjs` | `ENTRY10_SHA256` | allowlisted — R2-class entry-scoped content pin of the ledger's ENTRY 10 region (lines 2195-2252) |
| 13 | `build-d4-r2-execution-receipt.mjs` | `DECISION_LEDGER_SHA256` | **migrated** — literal deleted; R2 sidecar binding (below) |

**The R2 binding** (`qa/d4-r2-execution-receipt-ledger-binding.json`): `artifactPath` `provenance/DECISION_LEDGER.md`; `entryIds` ENTRY 10–14; `spanByteOffset` 147049 (the ENTRY 10 heading's raw-byte start); `spanByteLength` 27265; `spanPrefixSha256` `8b7084bc…` = SHA-256 over raw bytes `[0, 174314)` — byte-identical to the pre-migration check. Verified at landing: `sha256(bytes[0:174314]) = 8b7084bc…` and `sha256(ENTRY 10 lines 2195-2252) = 201efe81…` both reproduce. The generator's fence reads the sidecar; a span-bounds guard fails loud on a malformed sidecar. `ENTRY10_SHA256`/`ENTRY10_SPAN` and the ENTRY 10 line slice remain in code (the allowlisted entry pin + span parameters); `FROZEN_LEDGER_BYTE_LENGTH` is deleted (its value lives in `spanByteLength`).

**Migration result:** `validate:ledger-pins` PASS, **0 violations** (24 literal pins remain, all allowlisted with reasoned entries); `tests/test_ledger_pin_inventory.py` 8 passed. Zero new violations — the migration's halt-condition never fired. The out-of-scanner-scope literal copies in `orrery/scripts/validate-d4-r2-execution-receipt.mjs` and `orrery/scripts/validate-bl080-governs-derivation-execution.mjs` are untouched per scope (their independent copies remain; they are not scanner-visible violations and are recorded as future candidates, §8).

## 4. The validator

**`scripts/validate-evidence-bindings.mjs`** — advisory-first per §3.2; no validator code existed before this landing.

**Registry (explicit and bounded):** the convention chain (3: convention text, recipe registry, admission receipt) + the ledger-binding sidecars (1) + the machine-emitted evidence set (`orrery/src/generated/*.json`, 28, + `qa/d4-r2-execution-receipt.json`) — 33 artifacts. Root inventory envelopes retain their schemas and are consumed, not checked.

**R1–R6 coverage:**

| Rule | Implementation |
|---|---|
| R1 | For each declared binding on the admission receipt (`convention`, `registry`): resolves committed bytes (`git rev-parse HEAD:path` → `git cat-file blob`), compares recorded `blobOid` to the HEAD blob, recomputes the named recipe (`raw-bytes-sha256` over exact bytes), checks `byteLength` and recipe registration. |
| R2 | For each `evidenceBindings` entry in a registered sidecar: source path, entry identities, nonnegative/positive integer bounds against the live ledger bytes, prefix digest over `[0, offset+length)`, and each `entryId` heading present **within** the span. |
| R3 | For each sidecar `payloadReference`: recomputes the payload's fingerprint over its canonical core (the same `canonicalText` the generators use) and compares; fails on drift. |
| R4 | For each recipe: implementation reference resolves (`git cat-file -t` = blob), range resolvable within the pinned blob, pinned blob found at the declared path in committed history (`git log --find-object`). |
| R5 | For each machine-emitted artifact: generator path/digest/invocation-arguments/timestamp record presence; the recorded generator path must resolve; missing elements are findings. |
| R6 | For each registry artifact: registered in `MANIFEST.json` **and** `CHECKSUMS.sha256` with matching bytes/digests. |

**The session classifier.** The cut line is resolved by content per §3.3: the first commit adding the ENTRY 12 marker to `provenance/DECISION_LEDGER.md` (`git log --reverse -S '<marker>'`), which resolves to `6e3607b` — no commit ID is embedded in code. Each artifact's first-appearance commit (`git log --follow --diff-filter=A`) is compared against the cut: pre-cut → advisory; at-cut and post-cut → enforced; missing/ambiguous history → unresolved (never an automatic grandfathering pass).

**Policy.** Default: findings reported, exit 0 (advisory). `--strict`: exit 1 iff any finding is enforced (at-cut, post-cut, or unresolved). `--json`: deterministic machine-readable report. Internal errors exit 2. The first advisory run at this landing: **34 checks, 5 PASS, 31 findings; advisory exit 0; strict exit 1 (25 enforced)** — the strict failure is the expected advisory-first state before the landing commit, not a regression.

## 5. The advisory/strict boundary — the session-classifier table

Cut line `6e3607b` (2026-09-20); the convention's own admission-session artifacts classify at-cut (enforced) per §0.3's self-application.

| Classification | Artifacts |
|---|---|
| **at-cut** (enforced) | `provenance/EVIDENCE_BINDING_CONVENTION.md`; `provenance/digest-recipes.json`; `qa/conventions/evidence-binding-001-admission.json` |
| **pre-cut** (advisory-only) | `orrery/src/generated/`: `evidence-bundle.v1.json`, `field-derivation-bundle.v1.json`, `photonic-overlay.v1.json`, `taxonomy-read-model.v1.json`, `d-tier-taxonomy-dataset.v1.json`, `legal-moves.v2.json` (6) |
| **post-cut** (enforced) | the remaining 22 `orrery/src/generated/*.json` (the BL-063→BL-080 corridor and Phase A/C lineage, each verified by first-appearance) + `qa/d4-r2-execution-receipt.json` |
| **unresolved** (pre-commit; enforced) | `qa/d4-r2-execution-receipt-ledger-binding.json` (new file; classified post-cut by the landing commit's first-appearance after this landing) |

The finding inventory at landing: R5 — 23 enforced findings (post-cut machine-emitted artifacts carry a generator path but no script digest / invocation arguments / timestamp; `qa/d4-r2-execution-receipt.json` carries no generator record at all) + 6 advisory findings (pre-cut artifacts, no record); R6 — 0 findings after manifest regen; R1/R2/R3/R4 — all PASS.

## 6. Zero-regression verification

**Pre-registered byte-identity baselines** (captured before any edit; `--check` green ×5 pre-migration):

| Artifact | SHA-256 (pre = post) |
|---|---|
| `orrery/src/generated/phase-c-probe.v1.json` | `48d460a2f001e54dc53d34cedde2a03c5d354b0ba0991b8dd941afa28b141d0c` |
| `orrery/src/generated/d4-selection-review.v1.json` | `40a1d7586c8643bac351a1b70c09fce35a977ce200888d08a40d2cc0022649d8` |
| `orrery/src/generated/d4-r2-route-review.v1.json` | `5a1a787eb47a939d8f1ba727689a9cc2db0adb21fe716d5e1600d7a19406c4b3` |
| `orrery/src/generated/d4-r2-contract.v1.json` | `8b269412c222e0d6a1f26db1d6c491cca6f7a03c52e7b200137ab09c9fbf3cf0` |
| `qa/d4-r2-execution-receipt.json` | `7e14cbbc680d4827a0d82eb04f3c8c25c187b73d9435fdbade143f014a406fe2` |

All five post-migration artifacts are **byte-identical** to the baselines; all five `--check` runs exit 0 (the generator's check mode rebuilds in memory and compares byte-for-byte against the landed artifact). The migrated check semantics are provably identical: `spanByteOffset + spanByteLength` = 174314 = the pre-migration `FROZEN_LEDGER_BYTE_LENGTH`; the same first-failure messages are retained.

**The chain anchors are preserved** — the migration changed the pin *format*, not the pinned *values*: the 12 fingerprints still verify their consumed artifacts (checked individually at landing and by the generators' runtime self-checks), and the ledger prefix endpoint/value is unchanged.

**Gates run at the landing:** `validate:ledger-pins` PASS 0 violations (8 inventory tests passed); `validate:evidence` PASS (validator advisory exit 0 + 9 tests); `orrery:check` exit 0 (validator wired at the chain tail); `orrery:test` 43 files / 441 tests passed; full `npm run validate` observed first stop `STALE_TWIN_HUB_CONVERGENCE` — the **predeclared, ledger-recorded stale gate** (`qa/conventions/evidence-binding-001-admission.json:120-129`); no other failure; the stop moved **past** `validate:ledger-pins`, which now passes (previously the chain's first stop). `validate:manifest` PASS after the landing's inventory regen (1,319 files). No green integrated release is claimed; no stale control is disabled; no shared artifact is regenerated; twin-hub/promotion refreshes remain BL-051/052.

## 7. The enforcement-gap finding

The corridor generators' pins predate the convention's validator — a known enforcement gap (§3.3 advisory-first, §3.2 deferred); the convention's admission didn't include the enforcement machinery, and the corridor's artifacts were born during that gap.

The classifier's table (§5) is the honest record: 23 post-convention machine-emitted artifacts carry incomplete R5 provenance — findings the validator now reports and `--strict` would enforce. Migrating those artifacts' provenance records is future work under their own ceremonies; this landing supplies the instrument, not the retrofit.

## 8. Bounded non-accomplishments

- **No twin-hub refresh (BL-051), no promotion refresh (BL-052), no green release (BL-053), no gate promotion.** Advisory-first throughout; `--strict` is available for a future promotion after the first live tests.
- **No consumer-schema migration.** The twin-hub validator still requires the old whole-ledger binding fields (`scripts/validate-twin-hub-convergence.py:280-292`); the convention's span model is not yet accepted by that consumer. Untouched.
- **No retrofit of R5 provenance records** onto the post-cut artifacts (§7).
- **No migration of the out-of-scope literal copies** in `orrery/scripts/validate-d4-r2-execution-receipt.mjs` and `orrery/scripts/validate-bl080-governs-derivation-execution.mjs` (not scanner-visible; recorded as future candidates).
- **No binding-collection migration** beyond the one pin: the session classifier is implemented, but no other artifact's bindings were rewritten.
- **No claim event, no record amendment, no canonical/Court/schema/Neo4j writes** beyond the landing's own files.

## 9. Verification log (exact commands)

- Pre/post generator checks: `node scripts/build-{phase-c-probe,d4-selection-review,d4-r2-route-review,d4-r2-contract,d4-r2-execution-receipt}.mjs --check` — exit 0 ×5 pre and post.
- Pin verification: all 12 literals reproduced their consumed artifacts' fingerprint fields; ledger forensics reproduced `8b7084bc…` (prefix 174314) and `201efe81…` (ENTRY 10 lines 2195-2252).
- `python3 scripts/validate-ledger-pins.py` — FAIL/13 → PASS/0; `python3 -m pytest tests/test_ledger_pin_inventory.py` — 8 passed.
- `node scripts/validate-evidence-bindings.mjs` — advisory exit 0; `--strict` exit 1 (25 enforced pre-commit); `--json` report parsed.
- `node --test scripts/validate-evidence-bindings.test.mjs` — 9 passed.
- `npm run orrery:check` — exit 0; `npm run orrery:test` — 43 files / 441 tests passed.
- `npm run validate` — exit 1 at `STALE_TWIN_HUB_CONVERGENCE` (predeclared); ledger-pins now passes; no tracked-file side effects.
- `npm run package:manifest` + `npm run validate:manifest` — PASS (1,319 files).

Execution logs retained locally under `/tmp/opencode/bl0xx-*.log`.
