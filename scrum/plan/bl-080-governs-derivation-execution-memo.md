# BL-080 — The GOVERNS derivation, Gate 3 (execution): the derived-input run reproduces the frozen result exactly — `DERIVED_FROM_DERIVED_INPUTS` — findings memo

**Status:** sprint artifact. Execution evidence (the receipt's status: `execution_verified`). **Gate 3 of the BL-079 design specification executed** — the single licensed run of the re-specified pipeline on the Gate 2 derived projection; the branch classification was determined by the run. **Gate 4 (the record amendment) is a separate, later ceremony and is not performed here.** No record amendment; no claim event; no GOVERNS admission; no anchoring-remainder resolution. D4's `derivable-via-R2` (ENTRY 15) and D7's hypothesis-tier are unchanged; ENTRY 10/15/16/17 byte-untouched; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; the frozen stack (`scripts/d4-*.mjs`) is byte-untouched (imported verbatim, never modified, never re-executed under its old freeze — the new stack executes it via derived inputs); the frozen production run's 18 pre-flight controls are not re-run (documented absent); the frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input; session prose is context, not evidence.

**Artifact:** `qa/bl080-governs-derivation-receipt.json` (raw-byte SHA-256 `b7f9bfbcc13c14f02e75f686c820a7ff02ad4c0e5057e5ef512a0e6acc464f6a`; `executionFingerprint` `437de068456cc7280e14015f442c720ebebbe4150f3abdf4ff221e774f7a82e3`; no timestamps — deterministic, byte-stable). Schema `schemas/bl080-governs-derivation-receipt.schema.json` (raw-byte SHA-256 `408a660423c5a578d8d798db499b42bfa5efd32dd6b9ce66b531ac8631462b9a`). Generator `scripts/build-bl080-governs-derivation-execution.mjs` (raw-byte SHA-256 `4fbe26e6be5ed03bc7231feed2fe029590169322a79cff8cacb47eddbfa62c7d`); independent validator `orrery/scripts/validate-bl080-governs-derivation-execution.mjs` (raw-byte SHA-256 `4e283f45262dab4fde68ddfa8ad9e303b85ab84fd9f7913a2b0fc4b83f061556`; **59 mutation probes** — 48 receipt-drift + 2 fingerprint + 4 smuggled-read/double-read + 3 presence-strip + 1 proof-strip rejected; 1 permissive region probe passing; two-sided static isolation); pins `orrery/src/bl080-governs-derivation-execution.test.ts` (raw-byte SHA-256 `1b7e284b053da18d49f735d0ed4811e8377c91c339e136e055d939a0546fa266`; 12 tests). Wired `orrery:bl080-governs-derivation-execution:check` after `bl080-governs-derivation:check`, before `derived-path-graph:check`.

**The two sha-256 identities (recorded, never conflated):** `bindings.implementationDigest` `2d53cee4b5f92f22cafadf2fd654351e0688b49f1b8861094fb2c52de9a6642a` (the Gate 2 file-set: the execution builder + the Gate 2 builder/validator/pins/artifact); `bindings.frozenClosureDigest` `7ab950fac561016afc816e8b6947f7ce0b5f25573f1472321054ddbc9c1e097f` (the frozen sealing context, recorded separately).

## 1. The run (9 steps, as approved)

Pin + self-check (Gate 2 fingerprint `63699437…` recomputed; chain anchors BL-063 `6d33c67b…`, BL-064 `aa975820…`, BL-066 `94f0661f…`, BL-078 `11644d40…`, BL-055 `6d11fd93…` self-checked; frozen receipt `2057a757…` / generation `f9ab736e…` byte-pinned) → S0′ reload (the Gate 2 `projection.{anchors,R,E}` verbatim; frozen `validateProjection`; `projectionDigests` equal to the frozen bindings) → S1′–S3′ `runDerivedPipeline` (the frozen `generate()`: kernel-twin / construction-join / midpoint; no re-derivation) → S4′ `sealGeneration` under the **frozen sealing context** → S5′ `compareSealed` with **exactly one licensed canonical observation read** (instrumented; asserted) → `buildReceipt` (the frozen wire assembly and its `compareSynthetic` recomputation) → `selectCategory` → the full-field baseline comparison → the branch classification → serialization (`canonicalText + "\n"`; `--check` byte-compares).

**Single-read design (stated):** the canonical ledger and network bytes are read **exactly once**, inside the comparison stage's `readReference`; the sha binding (`digestBytes(reference) === bindings`) is asserted at that read — the stronger form of the pin (no separate pre-read; no double-read). The validator enforces the instrumentation statically (one increment, one assertion, one read each of the two canonical records).

## 2. Grounding receipt (per-claim verification at build)

| # | Claim | Verification | Verdict |
|---|---|---|---|
| G-1 | Gate 2 artifact intact | fingerprint recomputed from the landed core (`63699437…`); raw-byte pin `50735819…` | **GROUNDED** |
| G-2 | Chain anchors intact | five fingerprints recomputed and self-checked at the run (fail-loud on drift) | **GROUNDED** |
| G-3 | S0′ interface | frozen `validateProjection` passes; derived `projectionDigests` equal the frozen bindings' (`d2d74533…`/`e17bf1f2…`/`6f3100d8…`) | **GROUNDED** |
| G-4 | The run seals | `sealGeneration` under the frozen sealing context; `generationDigest` = **`c4a7f48dd982c6d96f594ca8c03e045092b9a00b9615e05ef2d14648f04f83d7`** = the frozen baseline; `complete: true`; `verifySeal` passes | **GROUNDED** |
| G-5 | One observation read | read counter asserted `=== 1` at execution; validator statically re-checks the instrumentation | **GROUNDED** |
| G-6 | Comparison reproducible | frozen `buildReceipt` recomputes the comparison (`compareSynthetic` over the run's own rows/seams) and asserts equality before the outcome selection | **GROUNDED** |
| G-7 | Baseline match, all fields | 9/9 canonical field equality (rows; routes; routes.A; routes.B; observedKeyCount; fourCellCounts; uKeys; tC; category) with whole-block digest equality (`1f66764b…` both sides) — including the **full routeAccounting objects**: T-A `8 generated / 4 matched / 4 in-R-but-unmatched / 10 missed / 20 R-missed / 0 extra / restatement false`; T-B `28 = U / 14 matched / 14 in-R-but-unmatched / 0 missed / 0 R-missed / 0 extra / restatement true`; cells `0/10/4/0`; tC `A0:1387:2741:0`, `A0:1451:2773:6` exact | **GROUNDED** |
| G-8 | Independent re-derivation | the validator re-runs the frozen stack from the Gate 2 projection against freshly read canonical bytes; regenerates the comparison and the category; recomputes the baseline, the branch, the seal and the digests; 59 probes rejected (artifact drift, baseline drift, seal drift, comparison drift, smuggled reads, presence strips, proof strip, double read) | **GROUNDED** |
| G-9 | Isolation | `grantedBytesInDerivationPath: 0`; forbidden tokens (`frozenReceipt.comparison`/`.category`, `frozenGeneration.projection`, `baselineComparison`, `gate3Baseline`) absent from the execution path; the comparison region carries the granted-read proof tokens; permissive region probe passes | **GROUNDED** |

## 3. The findings

**V-G3-1 — seal (PASS).** The derived-input generation seals under the frozen sealing context and its `generationDigest` equals the frozen `c4a7f48d…` — the seal is a pure function of {boundary, spec, bindings, generation}, and the derived-input generation is the frozen generation.

**V-G3-2 — single observation read (PASS).** Exactly one canonical observation read, asserted. No double-read, no selective read.

**V-G3-3 — comparison reproducibility (PASS).** The comparison block recomputes canonically through the frozen `compareSynthetic`; `--check` re-runs the whole execution and reproduces the receipt byte-for-byte (`stale: false`).

**V-G3-4 — baseline match (PASS).** The run's comparison block is **canonically equal** to the frozen receipt's comparison block field-for-field (9/9), with equal whole-block digests (`1f66764b…`). Every `routeAccounting` field is compared — including `R_missed_count` (T-A **20** = U 28 − in-R 8; the work order's shorthand "8/4/4/10" is completed by the full object) and `extra_beyond_R_count` (0/0). The four cells are `0/10/4/0`; the observed count is 14; tC matches both seams exactly; the category is `not_derived`.

**V-G3-5 — deviation classification (PASS, not fired).** No deviation: `branchClassification.deviation` is `null`; the classifier's stage/field/deviation table machinery exists and is tested (a spurious-deviation probe is rejected), but the run produced no entries.

**The branch: `DERIVED_FROM_DERIVED_INPUTS`.** The derived-input pipeline produces the identical result — the interface-identity claim (Gate 2's S0′ set-equality) is confirmed at execution: the pipeline's semantics are independent of the inputs' provenance. The receipt carries `inputProvenance: "derived"` beside the frozen context; the capstone's proof in one value. **The un-granting program's proof is complete at the registered bounds** (derived inputs plus the named anchoring remainder).

**Controls (recorded).** ABSENT: the 18 pre-flight controls belong to the frozen production run and are not re-run; no control evidence is claimed as this run's own.

## 4. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl080-governs-derivation-execution:check` | PASS (builder `--check` fresh, `stale: false`; validator PASS; 59 probes; region-scoping proof confirmed) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | suite green (12 new BL-080 Gate 3 pins) |
| `validate:ledger-pins` | unchanged at the BL-058 13-violation inventory — zero added (the six new immutable-baseline literal pins in the execution builder are reviewed and allowlisted in `schemas/ledger-pin-allowlist.json`; the pre-existing 13 remain recorded, not repaired) |
| `validate:prose-consistency` | unchanged (16, zero added; generated output restored) |
| Manifest | regen (`npm run package:manifest`); `validate:manifest` PASS |

## 5. Bounded non-accomplishments

No Gate 4 amendment (this receipt records the run; the amendment is a separate, later ceremony). No record mutation (ENTRY 10/15/16/17 byte-untouched; the validator re-checks the decision ledger's frozen prefix and the ENTRY 10 region). No GOVERNS admission; no claim event; no higher-theorem answer. No anchoring-remainder resolution (partition, orientation bit, presentation conventions carried). No G1 movement; no INV-5 graduation; no M-walkability promotion. No canonical/Court/schema/Neo4j writes. The pipeline's semantics are not re-litigated: the run tests reproducibility from derived inputs, not the derivation's mathematical validity (the phases' proven result). The 18 frozen pre-flight controls were not re-run.

## 6. Result in one paragraph

The re-specified GOVERNS derivation executed once on the Gate 2 derived projection — κ, the cycle ground, the 28-edge R structure, the derived predicate, plus the named anchoring remainder — through the frozen pure modules imported verbatim, sealed under the frozen sealing context, compared once against the canonical observation surface, and read against the pre-registered baseline. The result is the capstone: **`DERIVED_FROM_DERIVED_INPUTS`** — the run's comparison block is canonically equal to the frozen receipt's block field-for-field (9/9) with equal digests, the seal reproduces `c4a7f48d…`, the category is `not_derived`, and the single observation read is asserted. The derived-input pipeline produces the identical result: the pipeline's semantics are independent of the inputs' provenance. **Gate 4 — the record amendment, with the original failure preserved and the corridor's chain cited — is the one remaining ceremony.**

## 7. Gate 4 readiness

Open, pending its own authorization: the amendment (a DECISION_LEDGER event, additive, preserving the original `not_derived` record and the frozen pattern) would cite this receipt (`b7f9bfbc…`; `executionFingerprint 437de068…`), the Gate 2 artifact (`63699437…`), the design spec, and the un-granting program's chain (BL-063/064/066). Nothing in this receipt amends the record; nothing here is a claim event; the GOVERNS admission question remains untouched.
