# BL-079 — The GOVERNS derivation design specification (the un-granting program mapped onto the frozen D4 pipeline)

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. Sandbox/analysis only. **No derivation execution**: the implementation is Gate 2, separately authorized; the execution is Gate 3; any amendment is Gate 4. D4's `derivable-via-R2` (ENTRY 15) and D7's hypothesis-tier are unchanged; the anchoring remainder is unchanged; no G1 movement; no governs admission; no INV-5 graduation; no M-walkability promotion; the frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input; session prose is context, not evidence; every load-bearing claim cites landed artifacts. **This spec designs; it does not derive or amend.**

**Companion:** the Track A registration (BL-078's D7 replication-confirmation: `REPLICATED`, `R_NONE`) lands in the same pass (`scrum/BACKLOG.md`, BL-079 section; synthesis `scrum/plan/bl-067-governs-semantic-synthesis.md` §6 entry 6; scoping memo §5.1 accretion; map §5.9).

## 1. Purpose and scope

The un-granting program (Phases 1–3) derived replacements for the frozen D4 pipeline's **granted** inputs: the office coordinates κ (BL-063), the cycle ground / CONSTRUCTS pairs (BL-064), the A1 GOVERNS R-edges (BL-066), and the intrinsic selection predicate (BL-055; the geography refined as GSL-1/1R, BL-060/061). This specification maps those replacements onto the frozen pipeline's stages, verifies what remains granted, and pre-registers the derivation's success criteria and falsifiability structure. It is the gate-opener for the derivation's implementation (Gate 2), which is **separately authorized** — nothing here executes the derivation, admits a claim, or moves the record.

The design question, stated once: *does the frozen pipeline, re-specified to consume the derived replacements (plus the named anchoring remainder), reproduce the D4 contact geometry and route pattern — or does the reproduction fail, and how?* Both outcomes are findings; the criteria below are pre-registered so that the outcome is read against them, not after them.

## 2. The frozen stack (read-only reference)

The frozen stack is the nine-file closure around `scripts/d4-*.mjs` (closure digest `7ab950fa…`, re-verified at the BL-057 Gate 3 run: `qa/d4-r2-execution-receipt.json` `fences.frozenStack`). It consumed **granted** inputs and remains the semantic reference; it is never executed by this program's design (the BL-057 precedent: the corridor's Gate 3 operationalized the stage structure under its own contract — `scrum/plan/bl-057-gate3-execution-memo.md:20-26`).

| File | Role |
|---|---|
| `scripts/d4-production.mjs` | orchestration: the 8 production stages (binding verification, complete structural extraction, generation, durable materialization, durable seal, fresh comparison process, accounting verification, frozen outcome selection); byte pins; fresh comparison process via `fork`; exactly one licensed canonical observation read |
| `scripts/d4-inputs.mjs` | S0: the sole granter — bound extraction + projection validation (anchors, R, E; tier/role partition; `validateProjection` completeness) |
| `scripts/d4-derivation-engine.mjs` | S1–S3: pure routes (T-A kernel-twin `rotateMaskZ12`; T-B construction-join; T-C midpoint `midZ7`); no source or observation reads |
| `scripts/d4-generation.mjs` | S1–S3 wiring: witness ordering, completion counts, generation digest, `sealGeneration` |
| `scripts/d4-downstream-comparison.mjs` | S4–S5: observation extraction (contacts/seams), route accounting (G/U/O), category selection, seal verification, receipt assembly |
| `scripts/d4-wire.mjs` | wire primitives (canonicalJSON, digests, enums, 18 controls); consumes nothing |

**S0–S5 provenance (house form, carried verbatim in substance):** S0–S5 refers to the frozen derivation's stage structure (`scripts/d4-production.mjs` stages, above), operationalized here as: **S0** = binding verification + complete structural extraction; **S1** = generation (T-A kernel-twin); **S2** = generation (T-B construction-join); **S3** = generation (T-C relations) + durable materialization + durable seal; **S4** = fresh comparison process; **S5** = accounting verification + frozen outcome selection. The frozen stack remains the semantic reference, never executed.

**The frozen pattern (baseline, re-read from the landed receipts at this spec's authoring; the implementation must re-read and fail loud on drift):**

- `qa/d4-production-receipt.json` — `comparison.observedKeyCount` **14** (`comparison.rows` 14); four-cell counts `aOnly 0 / bOnly 10 / both 4 / neither 0`; Route A (T-A) generated **8** (4 matched, 4 in-R-but-unmatched, 10 observed missed, 0 extra; `restatement_signature false`); Route B (T-B) generated **28 = U** (14 matched, 14 in-R-but-unmatched, 0 missed; `restatement_signature true`); T-C normalized A0 relation set equals both observed seam relations exactly (`A0:1387:2741:0`, `A0:1451:2773:6`; missing/extra empty; `midpoint_exact true`); generation T-A 8 witnesses / T-B 56 witnesses / T-C 4 relations; receipt `category not_derived`.
- `qa/d4-r2-execution-receipt.json` — the corridor's own execution: calibration `EXACT` (the identity-phase replay reproduces the frozen pattern exactly), R2 = O at 4 licensed contexts (`phase-11`, `phase-0`, `phase-1`, `seam-familyA`), branch `DERIVED@X`, gates G1–G5 green. Cited as the corridor precedent for the receipt shape and the isolation discipline — **not** as this derivation's execution.

## 3. Task 1 — the derived-input mapping

For each stage: what the frozen stack read (granted), the derived replacement (landed artifact), and the verification status. **Fail-loud rule:** any S0–S3 granted input without a derived replacement is flagged as a remaining grant and named in the Task 2 accounting — no silent gaps.

| Stage | Frozen stage(s) | Granted input read | Derived replacement (landed artifact) | Verification status |
|---|---|---|---|---|
| **S0** binding + extraction | binding verification; complete structural extraction | ledger bytes + network bytes; A0/A1 anchor identities (`id`, `tier`, `role`, `officeIndex`); R (A1-anchor→satellite, `GOVERNS`, `directed`); E (A0→A1, `CONSTRUCTS`, `directed`); tier/role partition; `directed` literals; projection validation (`|A0|=|A1|=7`, unique office per tier, R/E endpoint partitions) | κ office coordinates (BL-063, `bl063-office-reconstruction.v1.json`, `6d33c67b…`); cycle ground / E-pairs (BL-064, `bl064-cycle-ground.v1.json`, `aa975820…`); R-edges (BL-066, `bl066-r-edge-derivation.v1.json`, `94f0661f…`); selection predicate `P(s) = [forte(s) = 7-27]` (BL-055, `d4-selection-review.v1.json`, `6d11fd93…`; geography GSL-1/1R, BL-060/061, `8a1295ca…`/`e1b3f655…`) | office/E/R **verified** (Phases 1/2/3; set-equal with `missing: []`/`extra: []`; κ `CONSTRAINED_TO_REFLECTION`, E 14/14 directed, R 28/28 `R_EDGES_DERIVED FULL`); **anchor identities + partition + orientation bit + presentation remain granted** (Task 2) |
| **S1** T-A kernel-twin | generation | A0 (`id`, `officeIndex`); R (`source`, `target`, `parentOffice`); `rotateMaskZ12` on masks | κ + derived R | **verified** (Phase 1 + Phase 3; the route consumes no other granted field) |
| **S2** T-B construction-join | generation | E (`id`, `source`, `target`, `type`, tiers); R (`source`, `target`); satellite payload blind | derived E + derived R | **verified** (Phase 2 + Phase 3) |
| **S3** T-C + materialization/seal | generation; durable materialization; durable seal | all anchors (`tier`, `id`, `officeIndex`); counts `n0/n1/ne/nr`; digests | κ; counts recomputed from derived inputs | κ **verified** (Phase 1); anchor identities/partition **residual grant** (Task 2); the `midZ7` relation itself is grant-free |
| **S4** fresh comparison process | fresh comparison process | canonical observations (SEAT_CONTACT contacts; CONSTRUCTS seams + `provenance`); parents map from R; benign-contacts filter | the selection **decision** is replaced by the derived predicate (GSL-1); the observations are the **evaluation target** — no replacement exists or is claimed | evaluation side **by design**; the implementation must fence it (region-scoped, BL-078 pattern: zero granted-observation bytes in the derivation path; the comparison read is licensed and counted) |
| **S5** accounting + outcome selection | accounting verification; frozen outcome selection | aggregate counts; `selectCategory` predicate on aggregates; seal/receipt digests | predicate derived; counts recomputed from derived inputs | **verifiable at execution** (no raw re-read in the predicate; the frozen pattern's aggregate-only discipline carried) |

**Wire infra (`d4-wire.mjs`)** consumes nothing — no mapping needed. **No stage's granted input lacks a named derived replacement or a named residual grant** — the accounting is exhaustive at this granularity (Task 2).

## 4. Task 2 — the remaining-grant verification

**The un-granting program's claim:** *the architecture is derived up to one named bit and the anchoring remainder* (BL-066 memo `:77`; scoping memo §4.7; GOV-524/525 scope exclusions).

**The remaining-grant inventory** (the un-granting ledger's rows): (i) the A0/A1 anchor sets + tier/role partition (the anchoring remainder; requirement 1 not discharged); (ii) the orientation bit (BL-065; one bit, three registrations — brightness premise / κ₀ / φ-2; BL-073 §7); (iii) presentation/bookkeeping conventions (walk order, ids, tier tags, canonicalJSON); (iv) the D7-side remainder (the office field as the selection's ground, `R_NONE`, BL-078 `:95`; the D7/D6 partition; the modal orbit record) — named for completeness.

**Does the frozen pipeline consume anything from the inventory? YES — fail-loud, named:**

| Inventory row | Consumed where (frozen stack) | Reading |
|---|---|---|
| (i) anchor sets + tier/role partition | S0 (`d4-inputs.mjs`: anchor filter `tier ∈ {A0,A1} ∧ role == anchor`; `validateProjection` `|A0| == 7 ∧ |A1| == 7`, unique office per tier, R/E endpoint partitions `:91-122`); S3 (T-C per-tier pairing) | **residual grant dependency** — the partition binds extraction and completeness; no derived replacement exists |
| (ii) orientation bit | S0 (`directed == true` literals; the κ-label orientation — labels flip `c → 6−c`, the edge set is orientation-invariant: BL-064 V-P2-3, BL-066 V-P3-4) | consumed as **labels only**; outputs are orientation-relative, sets are invariant |
| (iii) presentation conventions | all stages (witness ordering `orderedWitnesses`, canonicalJSON, `office:decimal` key encoding, tier tags, digest serialization) | **consumed everywhere** — bookkeeping, not semantics; no derived replacement possible or claimed |
| (iv) D7-side remainder | **not consumed** by the D4 derivation (separate thread; BL-078 fenced) | named for completeness only |

**Verdict — the conditional green light.** The derivation **can run on derived inputs alone *plus* the named anchoring remainder**: every granted *semantic* input (offices, cycle ground, R-edges, selection predicate) has a landed derived replacement; what remains is the registered remainder — the partition, the orientation bit, and presentation. This is the honest reading of GOV-524/525's scope exclusions: derivability **up to one named bit and the anchoring remainder**. It is a *conditional* green light, not a full one — the residual grant dependency is stated plainly and limits the un-granting's completeness claim accordingly. No stage may consume a granted input outside this named inventory without a Task-1 finding.

## 5. Task 3 — the pre-registered success criteria

**Pre-registered before execution** (the criteria are fixed here; the run is read against them):

1. **Primary — set-equality of the contact geometry.** The re-specified pipeline, consuming derived inputs + the named remainder only, produces a D4 contact geometry **set-equal** to the original D4 contact set: **14 keys** (`qa/d4-production-receipt.json` `comparison.rows`; `observedKeyCount 14`), keyed `(parentOffice, s)` — exactly 2 per office. Set-equality is the criterion (missing and extra each reported explicitly, `missing: []`/`extra: []` the clean outcome).
2. **Secondary — route accounting vs the frozen pattern.** Route A (T-A) partial: 8 generated / 4 matched / 4 in-R-but-unmatched / 10 observed missed / `restatement_signature false`; Route B (T-B) construction-join restatement: 28 = U / 14 matched / `restatement_signature true`; four cells `0/10/4/0`; T-C normalized A0 relation set = both observed seam relations (`A0:1387:2741:0`, `A0:1451:2773:6`); receipt `category` per the frozen contract. **Or their derived equivalents, if the derived inputs change the accounting's shape** — see criterion 3.
3. **Pre-registered deviation reading.** **Any deviation from the frozen pattern is a finding, not a failure.** The derived inputs may produce a *different but valid* contact geometry; the difference — its shape, its keys, its accounting signature — is the finding, recorded with the same side-by-side discipline as BL-078's replication. The frozen pattern is the comparison baseline, not a pass/fail gate. Deviations are classified (missing/extra key sets; route accounting shape change; completion/count change) and reported before any interpretation.
4. **Integrity gates (hard, not deviation-tolerated).** (a) Zero granted-office/edge bytes in the derivation path (validator-proven region scoping, the BL-078 two-region pattern; smuggled-read and proof-strip probes rejected; permissive region probe passing). (b) Byte-stable artifacts + `derivationFingerprint`; chain anchors self-checked by fingerprint (BL-063 `6d33c67b…`, BL-064 `aa975820…`, BL-066 `94f0661f…`, BL-060 `8a1295ca…`; frozen receipts as spec bindings). (c) Exactly one licensed canonical observation read in the comparison stage (the frozen pattern's `canonicalComparisonReads: 1`). (d) Completion counts consistent per route (`expected == visited`, `outputs == len`).
5. **Baseline re-read discipline.** The frozen values above were re-read from `qa/d4-production-receipt.json` and `qa/d4-r2-execution-receipt.json` at this spec's authoring (2026-10-12). The implementation must re-read them at build time and fail loud on drift before any comparison.

## 6. Task 4 — the falsifiability structure

Pre-registered: what failure means. Three modes, **all legitimate findings, none preferred**:

- **(a) A derived input is wrong.** The un-granting program's verification missed something — the un-granting is incomplete. Corrective shape: re-run the affected phase (the phase artifacts' verification is the layer to repair); the design's mapping table gains the correction.
- **(b) The pipeline has a hidden granted dependency.** This scoping pass's remaining-grant verification missed something — the grant is deeper than recorded. Corrective shape: the inventory extends; the Task-1 table gains a row; the conditional green light narrows accordingly.
- **(c) The derivation is non-reproducible from derived inputs.** The pipeline's semantics depend on the granted inputs' *provenance*, not just their values — **the deepest finding, and the one that would reshape the framework's modeling**: provenance-dependence would become a named structural property of the organization layer, and the un-granting program's "derived up to…" statement would need its object re-described.

None is pre-judged; the run's outcome selects the mode. A clean reproduction selects none (the derivation holds at the registered bounds).

## 7. Task 5 — the output contract

**Gate 2 — implementation (separately authorized; not performed by this pass).** The re-specified derivation stack, per the established house pattern: generator (`scripts/build-<ticket>-governs-derivation.mjs`), independent validator (`orrery/scripts/validate-<ticket>-governs-derivation.mjs`; mutation probes; two-sided static isolation check), vitest pins wired into `orrery:check`/`orrery:build` after `bl078-d7-retest:check`; status `planning_evidence`; byte-stable; `derivationFingerprint`; chain anchors by self-checked fingerprint (BL-063 `6d33c67b…`, BL-064 `aa975820…`, BL-066 `94f0661f…`, BL-060 `8a1295ca…`); the two-region isolation pattern (intrinsic region: partition + masks + derived inputs + predicate definitions; comparison region: the observation reads, licensed and labelled); the frozen receipts bound as spec inputs (`qa/d4-production-receipt.json` `2057a757…`, `qa/d4-production-generation.json` `f9ab736e…`).

**Gate 3 — execution (a separate gate from implementation).** The run + the derivation's execution receipt (the `qa/d4-r2-derivation-receipt.json`-equivalent: comparison rows/route accounting/completion/fingerprints/controls; status determined by the run) + the findings memo (`scrum/plan/<ticket>-governs-derivation-run-memo.md`), including the criterion-3 deviation classification if any.

**Gate 4 — amendment.** None pre-authorized. Any record amendment requires its own authorization ceremony; GOV-524/525's admissions are unchanged by this pass, and a passing run does not amend the record by itself (no-collapse, the BL-057 precedent).

**Landing convention.** One atomic landing per gate; no claim event smuggled into implementation; every added claim cites its landing artifact.

## 8. Fences and bounded non-accomplishments

No derivation execution (implementation is Gate 2, separately gated; execution is Gate 3); no record amendment (Gate 4); no claim event; no governs admission; no anchoring-remainder resolution; D4's `derivable-via-R2` and D7's hypothesis-tier unchanged; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; the frame (§§2.6/2.7) is interpretation vocabulary, never design input; session prose is context, not evidence. This spec is planning evidence; it designs the derivation and pre-registers its reading — it does not derive, execute, admit, or amend.

## 9. Result in one paragraph

The un-granting program's derived replacements are mapped stage-by-stage onto the frozen D4 pipeline: κ (BL-063), the cycle ground (BL-064), the R-edges (BL-066), and the selection predicate (BL-055; GSL-1/1R geography) replace the granted offices, E-edges, R-edges, and the observed-contact decision — with every S0–S3 semantic input verified in Phases 1–3 and every remaining dependency named. The remaining-grant verification found the honest answer: **the pipeline consumes the A0/A1 anchor sets + tier/role partition, the orientation bit, and presentation conventions — so the derivation runs on derived inputs *plus* the named anchoring remainder (the conditional green light), never a full one.** The success criteria are pre-registered (set-equal 14-key contact geometry; route accounting vs the frozen pattern; any deviation a finding, not a failure; integrity gates hard), the falsifiability structure is three-branched (wrong derived input / hidden grant / provenance-dependence — the deepest), and the output contract is gate-separated (implementation → execution → amendment). The design is the gate-opener; the derivation itself is the next ceremony, and it is not performed here.
