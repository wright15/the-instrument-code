# BL-080 — The GOVERNS derivation, Gate 2 (implementation): the re-specified stack — the derived projection assembles exactly, the predicate selects exactly — findings memo

**Status:** sprint artifact. Planning evidence only (the artifact's status: `planning_evidence`). **Gate 2 of the BL-079 design specification executed; the pipeline run is Gate 3, separately authorized.** No pipeline execution beyond the deterministic S0' assembly and the predicate-selection mechanism proofs; no Gate 3 receipt; no record amendment; no claim event; no GOVERNS admission; no anchoring-remainder resolution. D4's `derivable-via-R2` (ENTRY 15) and D7's hypothesis-tier are unchanged; ENTRY 10/15/16/17 byte-untouched; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; the frozen stack (`scripts/d4-*.mjs`) is byte-untouched (the pure modules are imported verbatim, never modified); the frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input; session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl080-governs-derivation.v1.json` (raw-byte SHA-256 `50735819917ae36d59e49ef352d2867af377bff9a8186f720b28494e8010b398`; `derivationFingerprint` `63699437ed2a38713ea947edd3a9978cdc54a02cac5ebee38b286bb7370ed8af`). Generator `scripts/build-bl080-governs-derivation.mjs` (raw-byte SHA-256 `df596df13223df9cd834280aea36ef6f9f79d256be712af9f313d524214bfee8`); independent validator `orrery/scripts/validate-bl080-governs-derivation.mjs` (raw-byte SHA-256 `67889d35956d03648e6024ea2e81b379ffb94c3ed52b0e82888de3da9a8634c4`; **60 mutation probes** — 46 artifact-drift + 2 fingerprint probes + 10 smuggled-read/presence-strip/proof-strip + 1 permissive probe passing + region-scoping proof); pins `orrery/src/bl080-governs-derivation.test.ts` (raw-byte SHA-256 `43da7c5a5d76f9c512c11efe21a16c4b6654e23e0942d2a0d3b08ea6d7cdf774`; 12 tests). Wired `orrery:bl080-governs-derivation:check` (after `bl078-d7-retest:check`, before `derived-path-graph:check`); full `orrery:check` exit 0 (tsc clean); suite 42 files / 429 tests green (12 new BL-080 pins).

**Chain anchors (self-checked by fingerprint):** BL-063 `6d33c67b…` (kappa), BL-064 `aa975820…` (cycle ground), BL-066 `94f0661f…` (R-edge structure), BL-078 `11644d40…` (isolation-pattern precedent), BL-055 `6d11fd93…` (predicate source). Frozen bindings: `qa/d4-production-generation.json`, `qa/d4-production-receipt.json`, `canonical/universal-heptatonic-ledger.json`.

## 1. What was built and the rulings executed

**Rulings executed (OD-80-1…OD-80-6, approved 2026-10-12).** OD-80-1: ticket BL-080 (Gate 3 under the same workItem, the BL-057 precedent). OD-80-2: Gate 2 executes the S0' assembly **and** the predicate-selection proof; S1'–S5' code lands unexecuted. OD-80-3: chain anchors to BL-063/064/066/078 + BL-055, all self-checked. OD-80-4: remainder reads licensed and labelled; granted office/edge/contact bytes forbidden in the derivation path; the isolation checker enforces `grantedBytesInDerivationPath: 0`. OD-80-5: this memo. OD-80-6: κ₁ default, κ₀ invariance proven.

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl080-governs-derivation.mjs` | the re-specified stack: S0' derived-projection assembly + predicate selection (deterministic); the fenced intrinsic region; S1'–S5' paths landed via the frozen pure modules (unexecuted) |
| Artifact | `orrery/src/generated/bl080-governs-derivation.v1.json` | the derivation: consumed inputs, the derived projection, S0' set-equality, selection, orientation, pipeline landing, pre-registration, baseline, isolation, gates, readiness, accounting, fences |
| Validator | `orrery/scripts/validate-bl080-governs-derivation.mjs` | independent re-derivation (kappa, masks-only pairs, H2 reach + H8 census closure, offices, selection, assembly, digests, baseline); two-sided static isolation check with the region-scoping proof; 60 mutation probes |
| Pins | `orrery/src/bl080-governs-derivation.test.ts` | 12 vitest pins |
| Wiring | root `package.json` `orrery:bl080-governs-derivation:check`; `orrery/package.json` `check`/`build` | runs after `bl078-d7-retest:check`, before `derived-path-graph:check` |

## 2. Grounding receipt (per-claim verification at build)

| # | Claim | Verification | Verdict |
|---|---|---|---|
| G-1 | Chain anchors: BL-063/064/066/078 + BL-055 | fingerprints recomputed from the landed cores and compared at build; literals re-checked independently in the validator | **GROUNDED** |
| G-2 | κ validation (both orientations) | bijection, `kappa1 = 6 - kappa0`, the P7 line property, terminal endpoints — re-derived independently | **GROUNDED** |
| G-3 | Pairs: masks-only re-derivation | the child-side sandwich/twin-closure rule reproduces the consumed pair content and child attachment (7/7) | **GROUNDED** |
| G-4 | R structure: masks-only | independent H2 reach (24 unique-hub) + H8 census closure (4 unplaced, strict-min reach) reproduces BL-066's per-parent sets exactly | **GROUNDED** |
| G-5 | Derived offices | A0 from κ₁, A1 from pair centers; κ₀ = 6 − κ₁; cross-checked against BL-066's per-edge derived centers (28/28) | **GROUNDED** |
| G-6 | S0' set-equality | derived anchors/R/E semantic **and** full-row set-equal to the frozen projection; `missing []` / `extra []`; `projectionDigests` equal the frozen bindings' digests | **GROUNDED** |
| G-7 | Predicate selection | `P(s) = [forte(s) = '7-27']` over the derived 28-key domain selects exactly the observed 14-key set (confusion 14/0/0/14) | **GROUNDED** |
| G-8 | Office-flatness calibration | all 28 satellites share their parent's ledger office (the office rule is degenerate on D4 — the GSL-3 fa-side reading's measured form) | **GROUNDED** |
| G-9 | Isolation | zero granted bytes in the derivation path; forbidden tokens absent from the head and intrinsic region; the comparison region carries the granted reads (region-scoping proof); smuggled reads rejected | **GROUNDED** |

## 3. The findings

**V-G2-1 — projection assembly set-equality (PASS).** The derived projection — assembled from κ (both orientations), the seven constructor pairs, the 28-edge R structure, the licensed remainder (anchor identities, edge ids) and the class map — is **set-equal to the frozen projection field-for-field**: anchors 14/14, R 28/28, E 14/14; `missing []` / `extra []`; semantic and full-row equality both true. **The derived artifacts assemble into exactly the projection the frozen pipeline consumed**, and `projectionDigests(derived)` equals `bindings.projectionDigests` of `qa/d4-production-generation.json`. This is the un-granting program's final validation: the conditional-green's condition is met at the pipeline's interface — **the derived inputs are indistinguishable from the granted ones** (semantically; the 42 edge ids are carried presentation, the one named remainder component at the interface).

**V-G2-2 — predicate selection set-equality (PASS).** The derived predicate `P(s) = [forte(s) = '7-27']` (canonical ledger single-hop, labelled) over the derived R's 28-key domain selects **exactly the observed 14-key contact set**: confusion `tp 14 / fp 0 / fn 0 / tn 14`; `missing []` / `extra []`; exactly 2 per office. The selection criterion is derived and exact.

**Calibration (recorded).** The office-equality rule `[office(s) = office(h)]` selects 28 = U on D4 — the domain is **office-flat** (all 28 satellites share their parent's ledger office). The D4 selection is carried by the class predicate alone; this is the BL-068 fa-side reading (class-selective, office-flat) in measured form.

**V-G2-3 — orientation invariance (PASS).** The pair/edge/selection structures are identical under κ₀ and κ₁ (mask functions); the office labels flip `c → 6-c` (14/14 label map); the cross-check against BL-066's per-edge derived centers holds 28/28. The orientation bit remains carried (BL-065), never resolved.

**V-G2-4 — isolation (PASS).** Region-scoped; `grantedBytesInDerivationPath: 0`; the four licensed reads (anchor identities, edge ids, class field, calibration office field) labelled; the granted office/edge/contact fields appear only in the comparison region. The validator's two-sided check proves the scoping: a file-scoped over-ban is rejected by construction (the comparison region must contain the granted reads); smuggled-read, presence-strip and proof-strip probes rejected; the permissive region read passes.

**V-G2-5 — frozen validation and digests (PASS).** The frozen `validateProjection` passes on the derived projection; the digests equal the frozen bindings.

**The conditional green light (stated, mechanically enforced).** The derivation runs on derived inputs **plus the named anchoring remainder** — the A0/A1 anchor sets and tier/role partition, the orientation bit, and presentation conventions (the 42 edge ids). Not a full green light; the remainder is the un-granting program's known, registered limit (GOV-524's scope exclusion).

## 4. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl080-governs-derivation:check` | PASS (generator `--check` fresh; validator PASS; 60 mutation probes; region-scoping proof confirmed) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | 42 files / 429 tests passed (12 new BL-080 pins) |
| `validate:ledger-pins` | unchanged at the BL-058 13-violation inventory — zero added |
| `validate:prose-consistency` | unchanged (16, zero added; generated output restored) |
| Manifest | regen (`npm run package:manifest`); `validate:manifest` PASS |

## 5. Bounded non-accomplishments

No pipeline execution (S1'–S5' landed and unexecuted; the run is Gate 3, separately authorized). No Gate 3 receipt written. No record amendment (ENTRY 10/15/16/17 byte-untouched; D4 `derivable-via-R2` and D7 hypothesis-tier unchanged). No GOVERNS admission; no claim event; no higher-theorem answer. No anchoring-remainder resolution (partition, orientation bit, presentation conventions carried). No G1 movement; no INV-5 graduation; no M-walkability promotion. No canonical/Court/schema/Neo4j writes. No frozen-stack modification (`scripts/d4-*.mjs` byte-untouched). No D7 movement (the BL-078 precedent consumed as an isolation pattern only). The frame is vocabulary, not input; session prose is context, not evidence.

## 6. Result in one paragraph

Gate 2 of the GOVERNS derivation is implemented and green: the re-specified stack assembles the derived projection from the un-granting program's landed replacements (κ, the cycle ground, the R-edge structure) plus the labelled anchoring remainder, and the derived projection is **set-equal to the frozen projection field-for-field** with matching digests — the derived inputs are indistinguishable from the granted ones at the pipeline's interface. The derived predicate selects exactly the observed 14-key contact set (14/0/0/14), and the office-flatness calibration records the fa-side reading. The isolation checker enforces zero granted bytes in the derivation path; the orientation bit is carried (labels flip `c → 6-c`). The S1'–S5' pipeline paths are landed and unexecuted — **the derivation's actual run, its receipt and the branch-table classification are Gate 3, one execution away**.
