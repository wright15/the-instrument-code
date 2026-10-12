# BL-076 — The coordinate-covariant bijection probe: the family-level permutation tables and the probe-verified covariance

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. The probe is **measurement**; the finding is the probe's computed verdict; neither is a claim event, neither amends records, neither touches the GOVERNS relation's formal status. D7 remains hypothesis-tier throughout (no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim, `provenance/DECISION_LEDGER.md:2703-2712`). No GOVERNS admission; no GOVERNS authority change; no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no canonical/Court/schema/Neo4j writes. **No claim event fires in the probe build**; per OD-76-4 the finding tier and the expanded claim event's scope are conditionally pre-authorized and ruled separately. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) is interpretation vocabulary, never design input; session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl076-bijection-probe.v1.json` — status `planning_evidence` (raw-byte SHA-256 `74bcd025259b89783f404c18286a8189d296fa2949057473634fd6d2dcf8a4f5`; `investigationFingerprint` `81e6cf7211a94888c2adedeebc44674a6e4a78e5e8b3fc09bb7a8fd671569d1e`). Generator `scripts/build-bl076-bijection-probe.mjs` (raw-byte SHA-256 `996e2dba55e5373b582b6b3e47a4b05c900e1a4b1833d81fa19ee703bb5dca28`); independent validator `orrery/scripts/validate-bl076-bijection-probe.mjs` (raw-byte SHA-256 `8a2bf58a84ad4e2d1a17cc5cd862cabc2bed820618f301149631e65eb5c1f3b4`; **81 mutation probes** — 66 artifact-drift + 1 fingerprint-zero + 5 smuggled-read + 7 presence-strip + 2 verdict-logic (the ledger-absent and family-fragment fail-loud probes) — each rejected; two-sided family-core static check: expectation-token absence AND masks-only token presence); pins `orrery/src/bl076-bijection-probe.test.ts` (raw-byte SHA-256 `ada1c8a5c14269c8d6a20104b7ce89e72e4ec7121b7c2542dd1d0890b62fe676`; 11 tests). Wired `orrery:bl076-bijection-probe:check` (after `bl075-coordinate-search:check`, before `derived-path-graph:check`); full `orrery:check` exit 0 (`tsc --noEmit` clean); suite 406 green (40 files). `validate:ledger-pins` unchanged (pre-existing 13-violation BL-058 inventory, zero added; the new generator scanned as a ledger consumer, clean); `validate:prose-consistency` unchanged (16 pre-existing, zero added, none in the touched files); manifest/checksums regen.

**Chain anchors (self-checked by fingerprint; no literals in the generator):** BL-075 `88838e225276432427f2a7c765d8e1f9105c5c6bd87d4db04ef5e1bb2e93704e`; BL-068 `b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849`; BL-061/062 `e1b3f655b7d79c67e2002ef2bf6da5db298bcd846306db6878896b3f24c4cd8a`.

## 1. Grounding receipt (every row cites landed bytes)

| # | Claim | Verdict | Landed evidence |
|---|---|---|---|
| G-1 | The Klein-4 coordinate algebra (BL-075, `7fe5d44`) | **VERIFIED** | `bl075-coordinate-search.v1.json` (`88838e22…`): units `[1,5,7,11]`, carriers T1 = `x→5x` (directed), T2 = `x→7x` (reversed), the pc-reflection `ρ = x→11x`; group closure Klein-4. |
| G-2 | The coordinate-covariant hypothesis (session-level, not artifact-backed) | **VERIFIED as hypothesis-tier** | BL-075 memo §7 (disposition register, `scrum/plan/bl-075-coordinate-search-memo.md:103`): the session check's quotient involution — identical for T1/T2, trivial for `{id,ρ}`; D₇↔A₀, D₆↔A₁, D₃↔D₄; A₂/D₁/D₂/D₅ fixed; whole blocks; explicitly "session-level, not artifact-backed … confirmation would be a separate probe." Commit `6bf8a17`. |
| G-3 | The tier↔family bijection (BL-061/062, measured) | **VERIFIED** | Re-derived this pass from `canonical/universal-heptatonic-ledger.csv`: `role=anchor` → 70 anchors (10 tiers × 7); D-tier families D1=7-22, D2=7-15, D3=7-Z37, D4=7-Z17, D5=7-Z12, D6=7-8, D7=7-1, each 7/7 family-pure; key-for-key equal to BL-061/062's `dTierTiers` (in-artifact cross-check). |
| G-4 | A-tier structure | **VERIFIED with a correction to the brief** | The landed bytes carry **21 A-tier anchors (A0/A1/A2 × 7), each tier family-pure but tier-specific: A0=7-35, A1=7-34, A2=7-33** (`canonical/topology-identity-definitions.json:27-40`; ledger anchors). The brief's "seven A-tier anchors, all 7-35, office the only variable" understated the structure; per OD-76-1 the probe tests **both labels** per image. |
| G-5 | The ledger family census | **VERIFIED (grounding correction, bytes-class)** | The 462-record universe carries **38 families** (28 × 14-state + 10 × 7-state; `462 = 28·14 + 10·7`), all 462 masks present as 7-subsets containing pc 0 (`C(11,6) = 462`); the brief's "66 Tn-class families" was session prose — bytes rule; every load-bearing claim here cites the ledger's 38. |
| G-6 | The fa/ti pole vocabulary | **VERIFIED** | BL-068 GSL-3 (`b0d65bd6…`; memo `scrum/plan/bl-068-d7-asymmetry-memo.md:52-54`): the fa-pole's contact-target tier is A1, the ti-pole's contact tier is D6 — so **D₆↔A₁ is the cross-pole pair** (family-level: 7-8↔7-34), and D₇↔A₀ is the closure pair. |

**Mask arithmetic (probe input):** `id` integer = 12-bit mask; the coordinate maps applied as pc-level affine maps `x → u·x` (`u ∈ {1,5,7,11}`, translation 0 — the BL-075 canonically determined carriers). The probe consumes no artifact as computation input; chain artifacts are fingerprint-self-checked and compared key-for-key.

## 2. Pre-registration (rulings OD-76-1…4, approved 2026-10-12; the family-level reframing; the Z-pair addition)

- **OD-76-1** — A-tier scope: both family and office sub-tables; the A-tier families distinct (7-35/7-34/7-33); the D₆↔A₁ leg is a family claim (7-8↔7-34).
- **OD-76-2** — ledger-absent images: fail-loud fragment-class; an image mask outside the 462-record universe is a structural fact about the map, recorded explicitly, and the block verdict reflects it (the session check's ledger-presence presupposition is what the probe tests).
- **OD-76-3** — standalone artifact, chain-anchored by fingerprint; the claim event consumes the verdict and must not contain it.
- **OD-76-4** — finding tier and claim scope conditionally pre-authorized: `COVARIANT_CONFIRMED` → the correspondence upgrades to probe-verified and the expanded claim event may include its derivability sentence; `PARTIAL`/`REFUTED` → the hypothesis stays bounded, the claim event at edge-content level; no claim event fires in the probe build itself.
- **The reframing (family-level, not tier-to-tier).** The landed A-tier families are tier-specific, so the pre-registered expectation is a **family-level involution**: **7-1↔7-35** (the closure pair), **7-8↔7-34** (the contact-target pair), **7-Z37↔7-Z17** (the interior swap), with **7-22, 7-15, 7-Z12, 7-33 fixed**; the per-tier unanimity check is the verification that the family-level mapping holds **whole**, not the hypothesis itself.
- **The Z-structure prediction (added before the build).** The pairing's interval structure: 7-Z37↔7-Z17 is the **IV-shared Z-partner pair** (maps within its interval class); 7-1↔7-35 and 7-8↔7-34 are **IV-unique-to-IV-unique** pairings (cross-class). The probe confirms or refutes this pattern.
- Branch table: `COVARIANT_CONFIRMED` / `COVARIANT_PARTIAL` / `COVARIANT_REFUTED`; gates **V-BC-1** (D-tier family blocks whole, no fragments), **V-BC-2** (A-tier family + office blocks whole), **V-BC-3** (Klein-4 composition consistency at both table levels), **V-BC-4** (the fa/ti crossing, verified or absent, recorded either way).

## 3. The measurement (masks-only + the ledger's labels; all 70 anchors × 4 maps)

**The family-level permutation table (per map; 10 families):**

| Source (tier) | T1 = ×5 | T2 = ×7 | ρ = ×11 | ID |
|---|---|---|---|---|
| 7-35 (A0) | 7-1 (D7) | 7-1 (D7) | 7-35 (A0) | 7-35 (A0) |
| 7-34 (A1) | 7-8 (D6) | 7-8 (D6) | 7-34 (A1) | 7-34 (A1) |
| 7-33 (A2) | 7-33 (A2) | 7-33 (A2) | 7-33 (A2) | 7-33 (A2) |
| 7-22 (D1) | 7-22 (D1) | 7-22 (D1) | 7-22 (D1) | 7-22 (D1) |
| 7-15 (D2) | 7-15 (D2) | 7-15 (D2) | 7-15 (D2) | 7-15 (D2) |
| 7-Z37 (D3) | 7-Z17 (D4) | 7-Z17 (D4) | 7-Z37 (D3) | 7-Z37 (D3) |
| 7-Z17 (D4) | 7-Z37 (D3) | 7-Z37 (D3) | 7-Z17 (D4) | 7-Z17 (D4) |
| 7-Z12 (D5) | 7-Z12 (D5) | 7-Z12 (D5) | 7-Z12 (D5) | 7-Z12 (D5) |
| 7-8 (D6) | 7-34 (A1) | 7-34 (A1) | 7-8 (D6) | 7-8 (D6) |
| 7-1 (D7) | 7-35 (A0) | 7-35 (A0) | 7-1 (D7) | 7-1 (D7) |

The action is **identical for T1 and T2** and **trivial for {ID, ρ}** — the Klein-4 acts on the families through its two-element quotient; the family-level expectation is exact (`expectationCheck.exact: true`, zero mismatches). **Fragment audit: zero family fragments, zero office fragments, zero ledger-absent images; 40/40 family blocks and 40/40 office tiers whole.**

**The office-level permutation table (A-tier, per map; all 21 A-tier anchors):** every map's office action is a **whole permutation** of the seven offices per tier; the exact tables are in-artifact (`probe.officePermutation`), e.g. T1 on A0: Sun→Mars, Moon→Sun, Mars→Venus, Mercury→Mercury, Jupiter→Moon, Venus→Saturn, Saturn→Jupiter. Measured moved-office counts across the ten tiers: **T1 56, T2 52, ρ 60, ID 0** — the office action is **faithful** (every non-identity map moves at least one office in every tier), unlike the family action (kernel {ID, ρ}). This is a new measured refinement beyond the session hypothesis: the coordinate system's action on the organizational structure is strictly richer than its action on the family labels.

**The composition consistency (V-BC-3):** the induced family and office permutation tables compose consistently with the Klein-4 multiplication — family level 160/160 checks, office level 1120/1120 checks, zero mismatches; `T1∘T1 = T2∘T2 = ρ∘ρ = ID`, `T1∘T2 = ρ` at both table levels.

**The interval structure of the pairing (the Z-pair addition):** the ledger's IV-sharing classes are exactly three Z-pairs — (7-Z12, 7-Z36), (7-Z17, 7-Z37), (7-Z18, 7-Z38). The family involution pairs **7-Z37↔7-Z17 within its IV class** (the Z-partner pairing, IV `[4,3,4,5,4,1]`, the class complete and exclusive) and pairs **7-1↔7-35 and 7-8↔7-34 IV-unique to IV-unique** (IVs `[6,5,4,3,2,1]`/`[2,5,4,3,6,1]` and `[4,5,4,4,2,2]`/`[2,5,4,4,4,2]`, each unique across all 38 families) — **Z-partners map to Z-partners, IV-unique families to IV-unique families: confirmed**, including the pattern's framing that the family-level correspondence has an interval-content invariant riding along.

**The fa/ti crossing (V-BC-4):** both cross-pole pairs present in **both directions** — **D7↔A0** (7-1↔7-35, the closure pair) and **D6↔A1** (7-8↔7-34, the BL-068 contact-target pair); the interior **D3↔D4** swap recorded. The coordinate self-symmetry crosses the pole.

## 4. The verdict

> **Branch verdict: `COVARIANT_CONFIRMED`** (with `matchesPrediction: true`). **Finding tier: `probe-verified`** — per OD-76-4 the tier↔family correspondence upgrades from session-level to probe-verified, and the expanded claim event **may include its derivability sentence**; **no claim event fires in this probe build**, and the claim scope remains a maintainer decision.

The coordinate-covariant bijection is now the record's, not the session's: the coordinate maps permute the ten anchor families in **whole blocks** with the exact family-level involution (closure pair, contact-target pair, interior swap; four fixed families), identical for T1/T2, trivial for the identity and the pc-reflection; the office action is a faithful per-tier permutation; the composition is Klein-4-consistent; the Z-pair structure is confirmed; and the action crosses the fa/ti pole. The semantic binding (what this means for GOVERNS) remains separately gated (`bindingGate: SEPARATELY_GATED`).

## 5. Verification record (this landing)

| Check | Result |
|---|---|
| `npm run orrery:bl076-bijection-probe:check` | PASS (generator `--check` fresh; validator PASS; 81 mutation probes rejected; 12 static rejections) |
| `npm run orrery:check` | exit 0 (all gates; `tsc --noEmit` clean) |
| `npm run orrery:test` | suite green (406 tests, 40 files); 11 new BL-076 pins |
| Cross-checks | BL-075 unit group + carriers self-checked; BL-061/062 `dTierTiers` key-for-key (anchor sets and families); BL-068 header + invocation context |
| Static isolation | family-core region: expectation tokens absent (family literals, verdict vocabulary, disposition/session text) in region AND head; 11 required masks-only tokens present; 5 smuggled-read + 7 presence-strip probes rejected |
| Verdict-logic probes | a ledger-absent image and a family fragment each flip the computed verdict to `COVARIANT_PARTIAL` (fail-loud) |
| `validate:ledger-pins` | unchanged (13 pre-existing, zero added; new generator scanned clean) |
| `validate:prose-consistency` | unchanged (16 pre-existing, zero added, none in the touched files) |
| Manifest | regen; `validate:manifest` PASS |

## 6. Rulings applied

| # | Decision | Ruling applied |
|---|---|---|
| OD-76-1 | A-tier scope | Both family + office sub-tables; both labels per image; the A-tier families distinct (7-35/7-34/7-33) |
| OD-76-2 | Ledger-absent images | Fail-loud fragment-class; absent masks recorded explicitly; the verdict logic re-tested by an injected-absent probe |
| OD-76-3 | Artifact shape | Standalone `bl076-bijection-probe.v1.json`, chain-anchored by self-checked fingerprint |
| OD-76-4 | Finding tier + claim scope | Conditional pre-authorization executed: `COVARIANT_CONFIRMED` → probe-verified; claim scope recorded, not fired; no claim event in the probe build |

## 7. Findings inventory

1. **The coordinate-covariant bijection is probe-verified (family level):** whole-block involution 7-1↔7-35, 7-8↔7-34, 7-Z37↔7-Z17; fixed 7-22, 7-15, 7-Z12, 7-33; identical T1/T2; trivial {ID, ρ}; zero fragments, zero absent.
2. **The office action is a faithful whole permutation, richer than the family action** (moved counts T1 56 / T2 52 / ρ 60 / ID 0; per-tier permutations in-artifact) — the family action's kernel is {ID, ρ}; the office action's kernel is trivial.
3. **The composition is Klein-4-consistent** at both table levels (160 + 1120 checks, zero mismatches).
4. **The Z-pair structure is confirmed:** the pairing pairs the one IV-shared pair within its own interval class and IV-unique families with IV-unique families.
5. **The pole crossing is present, both directions:** D7↔A0 and D6↔A1 (the BL-068 contact-target pair at family level).
6. **Grounding corrections (bytes-class):** the A-tier carries tier-specific families (not a uniform 7-35); the ledger's family census is 38 (not 66); the probe's scope was reframed to family-level accordingly.
7. **Bounded:** the semantic binding, the claim event's scope, and any mechanism claim remain separate; the probe measures the action; it does not rule its meaning.

## 8. Bounded non-accomplishments

No claim event; no record amendment (ENTRY 10/15/16 byte-untouched; BL-061/062, BL-068, BL-075 as landed). No GOVERNS admission; no GOVERNS authority change; the binding interpretation stays separately gated. No G1 movement; no INV-5 graduation; no M-walkability promotion. No mechanism claim beyond the measured permutation tables; no directional-semantics assignment; no C2 endorsement; no orientation-bit resolution; no canonical/Court/schema/Neo4j writes. D7 hypothesis-tier throughout. The formal claim event's scope is set by the probe's verdict per OD-76-4 — a maintainer decision, not performed here.

## 9. Result in one paragraph

The session's prediction is now the record's. The coordinate maps of BL-075's Klein-4 were applied masks-only to all 70 anchor states with the image families and offices looked up in the 462-record ledger: the ten anchor families permute in **whole blocks** — the family-level involution **7-1↔7-35** (closure pair), **7-8↔7-34** (BL-068's contact-target pair), **7-Z37↔7-Z17** (interior swap), with **7-22, 7-15, 7-Z12, 7-33 fixed** — identical for T1 and T2, trivial for the identity and the pc-reflection: the Klein-4 acts on the families through its two-element quotient. The office action is a faithful whole permutation on top of it (every non-identity map moves offices in every tier). The composition is consistent with the Klein-4 multiplication at both table levels; the pairing pairs the one IV-shared Z-partner pair within its own interval class and IV-unique families with IV-unique families; and the action crosses the fa/ti pole in both directions at D7↔A0 and D6↔A1. Zero family fragments, zero office fragments, zero ledger-absent images; **branch `COVARIANT_CONFIRMED`; finding `probe-verified`**; per OD-76-4 the expanded claim event may include the tier↔family correspondence's derivability — and no claim event fires in this probe build. Measurement; the semantic binding remains separately gated.

## 10. Post-landing register

*(Reserved for the maintainer disposition; the build-time statuses above stand as landed history.)*
