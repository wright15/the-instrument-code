# BL-089 — The anchoring remainder's interaction structure: office field × anchor sets × tier partition — findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts of record, no admission of any kind. **No new measurement** — the census and every OP computation are analysis over landed bytes (masks-only reach arithmetic, the BL-070/BL-086 descriptive-read class) through one pattern machinery run over both the predicted and the landed field; any mismatch with a landed artifact was a halt — none occurred (the sanity gate is EXACT field-for-field). **No mechanism (causal) claim beyond the verdict:** the interaction is characterized, not causally explained; production questions stay open. D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim). No GOVERNS admission; **no new GSL number** (the GSL-9 candidate draft is inline, unapplied, un-promoted); no registration. No G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched). The D7 derivation route may not cite this probe's results until it lands (no-leaning). The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input. Session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json` — status `planning_evidence` (raw-byte SHA-256 `26a4b196…`; `investigationFingerprint` `eb1526be…`). Generator `scripts/build-bl089-anchoring-remainder-interaction.mjs` (raw-byte `713ec7da…`); independent validator `orrery/scripts/validate-bl089-anchoring-remainder-interaction.mjs` (raw-byte `5d6988bc…`; **42 mutation probes rejected** — 30 artifact-drift + 5 smuggled-read + 6 presence-strip + 1 region-scoping-proof-strip, plus the permissive region probe passing; the two-sided static region check); pins `orrery/src/bl089-anchoring-remainder-interaction.test.ts` (raw-byte `5c0d2c7d…`; 14 tests). Wired `orrery:bl089-anchoring-remainder-interaction:check` (after `bl088-co-parenting-probe:check`, before `bl080-governs-derivation:check` in both `build` and `check` chains). `orrery:check` exit 0; suite 48 files / 501 tests green (14 new BL-089 pins); `validate:ledger-pins` PASS (0 violations); `validate:prose-consistency` PASS; `validate:manifest` PASS; manifest/checksums regen.

**Chain anchors (self-checked by fingerprint; no literals in the generator):** BL-063 `6d33c67b…` (κ; the imported masks-only P7/kappa/pi/midpoint functions); BL-068 `b0d65bd6…`; BL-070 `9db10a08…`; BL-078 `11644d40…` (the sanity-gate target); BL-076 `81e6cf72…` (the family involution table); the d-tier operator probe `068f9007…` (the cycle ground); BL-073 `811fa786…` (the A0 order); the bipartite containment graph sha `903eebf0…` (carried, not consumed).

**Rulings executed (OD-89-1…OD-89-5, the approved directive and execution plan, 2026-10-14):** **OD-89-1** scope — the landed domain generalizes to the office-carrying anchor-satellite Hamming-2 census (1128 instances, 57 tier blocks); no new measurement; the D7×D6 block is the sanity gate. **OD-89-2** artifact shape — machine-checkable artifact + generator + independent validator + pins (the BL-088 precedent). **OD-89-3** exactness predicate — binary (EXACT = 100% agreement per block); NEAR_EXACT (rate ≥ 5/6) a finding sub-category, never a relaxed pass. **OD-89-4** tolerance — OP-AR-4 compares field-for-field at zero mismatches. **OD-89-5** verdict classes — `INTERACTION_DERIVED` / `INTERACTION_REMAINDER` / `INTERACTION_MIXED` (the mixed partition stated).

**Grounding corrections carried (maintainer-prose class; recorded in-artifact as GC-1…GC-4).**
- **GC-1:** OP-AR-1's "tier block" = the (anchor-tier × satellite-tier) block of the full office-carrying census; 57 nonempty blocks, 1128 instances.
- **GC-2:** OP-AR-2's "the state belongs to an anchor set" = the instance's anchor membership in the A0/A1 remainder anchor sets; the confusion = the agreement profile plus the κ reconstruction confusion.
- **GC-3:** OP-AR-3's "constant on the family involution pairs" = the transport-level block-constancy criterion (the office transport per family must be a well-defined function).
- **GC-4:** the OP-AR-4 input class includes the licensed GOVERNS/CONSTRUCTS edge content as partition content (the BL-080 Gate 2 class; GOV-524/525's derived-up-to-the-remainder result); office bytes and the recorded seat-contact relation are never prediction inputs.

## 1. Grounding receipt (verified at build; fail-loud, no mismatch halted)

| # | Claim (the load-bearing fact) | Verification | Verdict |
|---|---|---|---|
| G-1 | The containment graph: 330 pentatonic × 21 `parentsRooted`; 462 heptatonic × 15 `subnodes`; byte-stable | `derived/hypergraph/bipartite-inclusion-v1.json` (sha256 `903eebf0…`; recomputed live) | **GROUNDED (EXACT; carried, not consumed)** |
| G-2 | κ: the P7 line, the constructor pairs, the midpoint law; κ₁ reproduces the 7 canonical A0 offices; midZ7 reproduces the A1 offices | `bl063-office-reconstruction.v1.json` (fp `6d33c67b…`) + masks-only re-derivation via the imported BL-063 functions | **GROUNDED (EXACT)** |
| G-3 | BL-068: the ti-pole domain 36 = 14 + 22; the office-linking axis CLEAN_SPLIT 14/0/0/22; the Z-interface NON_SEPARATING 4/2/10/20 | `bl068-d7-asymmetry.v1.json` (fp `b0d65bd6…`) | **GROUNDED (EXACT; fingerprint)** |
| G-4 | BL-070: PARTIAL_DERIVATION; cleanSplitCount 0; the near-miss 12/0/2/22 | `bl070-d7-derivation.v1.json` (fp `9db10a08…`) | **GROUNDED (EXACT; fingerprint)** |
| G-5 | BL-078: the re-test REPLICATED; R-OFF 14/0/0/22 on the re-verified 36-instance domain | `bl078-d7-retest.v1.json` (fp `11644d40…`) | **GROUNDED (EXACT; the sanity-gate target)** |
| G-6 | The tier/role/family partition: 462 = 70 anchors + 238 satellites + 154 boundary; office support 308; GOVERNS 238, CONSTRUCTS 28 | ledger + network; recomputed live | **GROUNDED (EXACT)** |
| G-7 | BL-076: the family-level Klein-4 involution (7-35↔7-1, 7-34↔7-8, 7-Z37↔7-Z17; fixing 7-33/7-22/7-15/7-Z12) | `bl076-bijection-probe.v1.json` (fp `81e6cf72…`) + ledger re-derivation; **key-for-key cross-check 30/30** | **GROUNDED (EXACT)** |
| G-8 | GOV-524/525: the GOVERNS edge content + tier↔family correspondence derivable up to the remainder; the Klein-4 family involution is the derived coordinate structure | `scrum/BACKLOG.md` GOV-524/GOV-525 + BL-076's table | **GROUNDED (admission record; operational content re-verified)** |
| G-9 | BL-080 Gate 2: the derived-input class (κ, mask geometry, cycle ground, the licensed remainder) | `scrum/plan/bl-080-governs-derivation-memo.md` + the Gate 3 receipt (`inputProvenance: derived`) | **GROUNDED (EXACT; class definition)** |
| G-10 | The cycle ground: the ten M-cycle orbit orders; D7 = the network orbit; A0 set = BL-073's | probe (fp `068f9007…`) + `bl073-isometry-probe.v1.json` (fp `811fa786…`) + network | **GROUNDED (EXACT)** |

## 2. The pre-registration (frozen before computation; OD-89-1…OD-89-5)

**Operationalizations.** **OP-AR-1** tier-block uniformity (per-block rate; binary exactness predicate). **OP-AR-2** anchor-set dependence (per A0/A1: the κ reconstruction confusion + the agreement profile + the own-tier block). **OP-AR-3** family-block respect (per map per family: the image block + the transport; block-constancy = well-defined transport; the involution pairs and fixed families as the test population). **OP-AR-4** interaction derivability (two-stage predictor from the derived-input class; structural prediction, then the field prediction; zero office reads in the prediction path; field-for-field at zero tolerance).

**Refutation conditions (frozen).** R-AR-1: any tier block outside the binary predicate's clean degradation. R-AR-2: the profiles set-independent. R-AR-3: any anchor-family transport fragmented. R-AR-4: any landed pattern outside the zero-mismatch tolerance. **Decision rule:** EXACT = 100% agreement per block; block-constancy = zero transport fragments; verdict classes `INTERACTION_DERIVED / INTERACTION_REMAINDER / INTERACTION_MIXED`.

## 3. The sanity gate (V-AR-0): EXACT

The D7×D6 block re-derived from masks + the partition: **36 instances, 14 agreements**; the office-equality subset is **set-equal to the landed seat-contact rows**; the confusion is **14/0/0/22**, field-for-field equal to the landed BL-078 calibration (CLEAN_SPLIT, exact: true), whose comparison verdict is REPLICATED. No mismatch; no halt.

## 4. OP-AR-1 — tier-block uniformity: the partition stratifies the field completely

| aggregate | value |
|---|---|
| blocks (nonempty) | 57 |
| instances | 1128 |
| agreements | 340 |
| EXACT | 11 |
| DEGENERATE | 33 |
| NEAR_EXACT | 0 |
| PARTIAL | 13 |

**The exact blocks (11):** A1×A1 (24/24), D1×D1, D3×A2, D3×D2, D3×D3, D4×A1, D4×D4, D5×D5, D6×D3, D6×D5, D6×D6. **The degenerate blocks (33):** every block whose offices never coincide (e.g., A0×A1, A1×A0, D7×D4). **The partial blocks (13):** A0×A0 36/48, A0×D3 6/12, A1×A2 10/48, A2×A2 36/72, D2×A0 12/24, D2×D2 24/36, D3×D6 4/12, D5×A2 12/24, D5×D6 2/12, D6×A2 10/36, D7×D3 4/12, D7×D5 2/12, **D7×D6 14/36 (the landed BL-070/BL-078 domain)**. The near-exact sub-category is empty: the binary predicate is not too strict on this domain. **The exactness is a property of the tier pair:** the tier/role partition stratifies the field completely.

## 5. OP-AR-2 — anchor-set dependence: ANCHOR_SET_DEPENDENT

**Reconstruction (set-independent):** κ₁ (A0) 7/7; midZ7-of-constructors (A1) 7/7 — both exact; the reconstruction exactness does not depend on the set.

**The agreement field (set-dependent):**

| set | instances | agreements | own-tier block |
|---|---|---|---|
| A0 anchors | 96 | 42 (42/96) | A0×A0 36/48 **PARTIAL** |
| A1 anchors | 132 | 34 (34/132) | A1×A1 24/24 **EXACT** |

**Transport form (set-dependent):** under T1 the D7↔A0 office map is **affine** (`y = 5x + 2 (mod 7)` A0→D7; `y = 3x + 1` D7→A0); under T2 likewise (`y = 2x + 4`; `y = 4x + 5`). The D6↔A1 maps are **non-affine** (no single affine form fits the seven offices). **Verdict: the field's exactness depends on the anchor set** — through the own-tier classification, the net rates, and the transport form (not through the reconstruction).

## 6. OP-AR-3 — family-block respect: BLOCK_CONSTANT_ON_ANCHOR_FAMILIES

**The anchor families (the involution pairs and fixed families): 30/30 checks block-constant** — the office transport is a well-defined **whole permutation** on every anchor family under every map (T1, T2, ρ), fixing office 3 in every case. Under ρ the map is uniform across all ten tiers: `y = 6 − x`. The Klein-4 involution pairs (7-35↔7-1, 7-34↔7-8, 7-Z37↔7-Z17) and the fixed families (7-33/7-22/7-15/7-Z12) all pass. **No refutation fires.**

**The satellite-side extension (measured context):** under T1/T2, seven satellite families carry coarse **fragment loci** (T1 and T2 each on 7-11, 7-16, 7-20, 7-26, 7-28, 7-32, 7-6 — 14 loci): the *office-class* transport there is not a function of the office alone. Under ρ, zero fragments. The fragments are a property of the coarse office-class projection; the full-mask prediction still resolves every node (OP-AR-4).

## 7. OP-AR-4 — interaction derivability: INTERACTION_DERIVED

**Stage A (structural prediction) — checked first:** block inventory 57 / instances 1128 / support 308 + 154 / the family action — all exact by construction from masks + the partition; no block boundary outside the office-carrying domain (the tier-granularity halt condition did not fire).

**Stage B (field prediction) — then the rates:** the predictor emits specific predicted values (not profile claims):
1. **Anchors:** `office(anchor) = (C − pcSum(mask)) mod 7` with **C = 4** — the κ orientation constant (constant across all 14 κ-known anchors; the single named bit, BL-063's brightness/M1 alignment). **70/70 matches.**
2. **Satellites:** `office(satellite) = office(governing anchor)` — the licensed GOVERNS content. **238/238 matches.** The satellite–anchor pitch-sum delta histogram: `{−1: 102, +1: 102, −6: 17, +6: 17}`.
3. **Supporting laws (verified, both fields):** the **midpoint law extends to A2** — `office(A2 anchor) = midZ7(A1 constructors)` 7/7 (one tier beyond BL-063's landed scope); the **+2 governor-successor step** holds along all ten landed modal orbits (10/10).

**The field-for-field comparison (tolerance: zero mismatches):** office field **0/308 mismatches**; agreement field **0/1128 mismatches**; **57/57 blocks match** (content + class + rate), aggregate matches; OP-AR-2 profile match; OP-AR-3 transport match. **Verdict: `INTERACTION_DERIVED`.** The office field's interaction with the anchor sets and the tier/role partition is a function of the derived-input class alone: its values are mask arithmetic (pcSum) + the one orientation constant + the governing structure, and its coupling shape follows.

**The three-tier accounting (as landed).** *Masks-only:* the census and every aggregate/rate/class; the patterns (both fields through one machinery); the pcSum rule arithmetic and the κ re-derivation; the +2 orbit verification. *Canonical-computation (labelled):* the tier/role/family partition; the GOVERNS/CONSTRUCTS edge content (GOV-524/525's derived-up-to-remainder class); the office field read as comparison target only; the seat-contact relation as sanity target only; the orbit orders and the fingerprint self-checked chain reads. *Remaining granted:* the partition/edge remainder itself; **the one orientation constant C = 4**; presentation conventions and the frame vocabulary. The office-path fence is mechanical: the prediction path reads **zero office bytes** (validator-enforced two-region static check; the comparison region carries the office reads — the region-scoping proof).

## 8. The synthesis and the significance

**Verdict: `INTERACTION_DERIVED`.** Within this probe's scope the office field's content beyond the derived-input class is **exactly zero**: the remainder's effective size shrinks to its values' named residual — the tier/role partition and edge content, the one orientation bit, presentation conventions. Read together with BL-080 Gate 3's provenance-independence (the pipeline's output is independent of the inputs' provenance), the result completes the independence at the **relationships level**: not only the values but the coupling structure — where the field is exact, where it degrades, how it respects the tier blocks and the anchor sets — is derived from the same machinery. The un-granting program is characterized at its deepest available level, up to the named remainder. No GOVERNS admission, no claim event: the characterization is planning evidence.

## 9. GSL treatment

- **GSL-9 candidate draft (un-promoted, inline, unapplied):** the office-field interaction law — the field's support is exactly the non-boundary partition; the anchor field is `office = (C − pcSum) mod 7` with C the one orientation constant; every satellite carries its governing anchor's office; the tier blocks, the anchor-set profiles and the family transports (including the coarse fragment loci) are exact consequences of the law. No new GSL number; no status change; no registration.

## 10. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl089-anchoring-remainder-interaction:check` | PASS (generator `--check` fresh; validator PASS; **42 mutation probes rejected**; 11 static rejections; region-scoping proof: permissive pass + proof strip rejected) |
| Calibration | **EXACT**: sanity gate R-OFF 14/0/0/22 field-for-field vs BL-078; the family-table cross-check 30/30 vs BL-076; the anchor/satellite rules 70/70 + 238/238; the A2 midpoint 7/7; the orbit law 10/10 |
| `npm run orrery:check` | exit 0 (full chain incl. `tsc --noEmit`) |
| `npm run orrery:test` | suite green — 48 files / 501 tests (14 new BL-089 pins) |
| `validate:ledger-pins` / `validate:prose-consistency` / `validate:manifest` | PASS (0 violations; manifest/checksums regen) |
| Chain fingerprints | BL-063 `6d33c67b…`, BL-068 `b0d65bd6…`, BL-070 `9db10a08…`, BL-078 `11644d40…`, BL-076 `81e6cf72…`, probe `068f9007…`, BL-073 `811fa786…`, bipartite `903eebf0…` (all self-checked) |

## 11. Bounded non-accomplishments

No new measurement (masks-only arithmetic + re-derivation over landed bytes; the descriptive-read class); no mechanism (causal) claim beyond the verdict; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched); no GOVERNS admission; no new GSL number (the GSL-9 candidate draft is inline, unapplied, un-promoted); no registration; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes; no D7 movement (hypothesis-tier throughout); no leaning (the D7 derivation route may not cite this probe until it lands); the frame is interpretation vocabulary; session prose is context, not evidence.

## 12. Result in one paragraph

The anchoring remainder's interaction structure is **derived**. On the office-carrying anchor-satellite Hamming-2 census (1128 instances, 57 tier blocks), the office field is exact on 11 blocks, degenerate on 33, partial on 13 — a complete stratification by the tier pair; the exactness depends on the anchor set (A1's own-tier block exact 24/24, A0's partial 36/48; reconstruction exact on both; the D7↔A0 transports affine, the D6↔A1 non-affine); the office transport is block-constant on all thirty anchor-family checks (the Klein-4 involution pairs and the fixed families, every map — ρ uniform at `6 − x`), with fourteen coarse fragment loci on the satellite side. The two-stage predictor from the derived-input class — anchors via `office = (C − pcSum) mod 7` with **C = 4** the κ orientation constant (70/70), satellites via the governing anchor (238/238), the midpoint law extending to A2 (7/7), the +2 step along all ten orbits — matches the landed field **field-for-field at zero mismatch**: 0/308 office values, 0/1128 agreement instances, 57/57 blocks. The sanity gate reproduced BL-078's R-OFF 14/0/0/22 exactly. **Verdict `INTERACTION_DERIVED`**: the office field's coupling shape carries zero content beyond masks + the licensed partition/edge remainder + the one orientation bit; the remainder's effective size shrinks to its values' named residual. No claim, no amendment, no admission — the interaction structure characterized, is the deliverable.
