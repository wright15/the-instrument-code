# BL-068 — The D7 asymmetry investigation: the ti-pole's contact relation characterized (GSL-3, the governs semantic layer's first explanatory entry)

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. Sandbox/analysis only. **D7 remains hypothesis-tier throughout**: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim. D4's amended `derivable-via-R2` (ENTRY 15) and ENTRY 10's immutable `not_derived` are unchanged. No GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) was not used as design input; session prose is context, not evidence.

**Artifact:** `orrery/src/generated/bl068-d7-asymmetry.v1.json` — status `planning_evidence` (raw-byte SHA-256 `3de9269529fb9aaf5cba9c588bc3605d3b3a52d9122466c44a1334bbd5ed39d4`; `derivationFingerprint` `b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849`). Generator `scripts/build-bl068-d7-asymmetry.mjs`; independent validator `orrery/scripts/validate-bl068-d7-asymmetry.mjs` (16 mutation probes rejected; static generator-isolation checks); pins `orrery/src/bl068-d7-asymmetry.test.ts` (11 tests). Wired `orrery:bl068-d7-asymmetry:check`; full `orrery:check` exit 0; suite 351 green (35 files); `validate:ledger-pins` unchanged (pre-existing 13-violation BL-058 inventory, zero added); `validate:manifest` PASS; manifest regen.

**Chain anchors (self-checked by fingerprint):** D4 hunt `8a1295ca…` (BL-060); zresidual `e1b3f655…` (BL-061/062); Phase C probe `5085e274…` (BL-033). The Gate 3 receipt (`qa/d4-r2-execution-receipt.json`) and the frozen D4 receipt (`qa/d4-production-receipt.json`) are bound by raw sha256.

## 1. The premise (OD-68-0) and the domain correction (OD-68-1)

The investigation's starting condition, stated precisely: **the D4 hunt had a live discrimination domain (U = 28 granted keys, O = 14 contacts, gap 14 — the selection question was real); the D7 analogue has none (analogue-R U = O = 14 by construction — the construction consumed the domain before selection could operate).** The Gate 3 receipt's own language (`d7Analogue.construction.gapNote`, `scripts/build-d4-r2-execution-receipt.mjs:867`) already says this. The interpretation of the landed "no selection gap" finding is therefore not "unobserved keys resist selection" but **"the analogue's construction consumed the domain"**.

Per OD-68-1, the discrimination domain moves to the D7 anchors' own relations in the ledger/mesh, in two layers, each verified fail-loud:

1. **the recorded layer** — the D7 anchors' recorded satellite relations (the 14 seat-contact rows, 2 per anchor); and
2. **the constructed availability layer** — per D7 anchor, every 462-ledger record of class 7-2 at Hamming distance exactly 2 from the anchor (the class-mates within structural reach; ledger masks + anchor masks only, with the office field used solely for the recorded/unrecorded status label). The analogue-R is never the domain.

## 2. Gate-0 — the census (the opening findings)

**Census (fail-loud, all from landed records).** 7 D7 anchors (127/Jupiter, 2111/Saturn, 3103/Moon, 3599/Mercury, 3847/Venus, 3971/Sun, 4033/Mars); 14 seat contacts; the 7-edge modal orbit `127→2111→3103→3599→3847→3971→4033→127` (closure `M(4033) = 127`, modal, not rotational). The 7-2 class in the 462-record ledger carries **exactly 14 records** — all D6 satellites, all governed by D6 anchors (`network.d6SatelliteRows`), all set-equal to the D7 contacts. *Correction carried (BL-060 G-13 pattern): the planning brief's "59 7-2 states" figure was a raw string-occurrence count across `canonical/universal-network-data.json` sections; ledger bytes are the authority.*

**The recorded layer collapses.** Per anchor: 2 recorded, **0 unrecorded** (14/14/0). Unlike the D4 grant layer (28 = 14 observed + 14 unobserved), the D7 anchors' recorded satellite population is exactly the contacts — the ledger-side confirmation of the Gate 3 gapNote ("no residual children", ledger terminal note).

**The availability domain restores a 36/14/22 structure.** The Hamming-2 reach of the 7-2 class is **36 instances: 14 recorded (same-office) + 22 unrecorded (modal-neighbour offices)**; per-anchor counts 4/5/6/6/6/5/4; every unrecorded instance lies at office delta ±2 mod 7 (11 × +2, 11 × −2); distinct states 14, appearance multiplicities 1–3 (2/2/10). Gate-0 PASS: all 14 contacts contained in the domain; per-anchor own-office reach set-equal to the contacts; `contactsEqualToRecordedRelations: true`; `contactsSubsetOfAvailability: true`.

**The first structural difference (the ruling's branch).** The domain structures are **not** symmetric: D4's grant layer is a uniform 4 per anchor (28 = 14 + 14); the D7 recorded layer carries zero unrecorded relations, and the D7 availability layer is 4–6 per anchor (36 = 14 + 22). The remainders sit at mirror-reversed layers: the D4 remainder (14 × 7-31) is **governed-but-unreached** (Hamming-2 reach 0), the D7 remainder (22) is **reached-but-office-excluded** (modal-neighbour 7-2). *First finding: the D7 discrimination domain's size is 0 at the recorded layer and 22 at the availability layer — the analogue of D4's gap-14 exists only in the constructed layer, and it is modal-bounded.*

**Summary row — the 7-2 control (full table in the appendix).** The class is degenerate as a discriminator: every 7-2 record is a D6 satellite, every one is governed by a D6 anchor, every one is a D7 contact — **the class IS the contact set**. Its internal structure (7 A + 7 B orientations; 7 inversion pairs; Z-mix 4 Z-majority / 10 nonZ) is a property table, not a selection axis.

## 3. The axes (confusion tp/fp/fn/tn against recorded status; 36-instance domain)

| Axis | Rule | Confusion | Verdict |
|---|---|---|---|
| 1. Native set-class hunt | `P_D7(s) = [forte(s) = '7-2']` | 14/22/0/0 (36/36 selected) | **RESTATEMENT_UNIFORM** |
| 2. Office-linking / modal remainder | `O_D7 = [office(s) = office(h)]` | **14/0/0/22** | **CLEAN_SPLIT** |
| 3. Z-interface polarization | `Z_D7(s) = [nonZSum < zSum]` | 4/2/10/20 | **NON_SEPARATING** |
| 4. Invariant geography | inversion pairs + office sums | 7/7 pairs, all sums 6 | **INVARIANTS_OBEYED** |
| Control | 7-2 class census | — | degenerate (class = contact set) |

**1 — Native set-class hunt (design-space item 1): no D7-native class partition exists.** The class predicate selects the whole domain (36/36): the D7 analogue of the 7-27 predicate restates because the availability domain is single-class — every instance is 7-2, and the 14-state class is the entire ledger population. Interval vectors are class-constant (`5,5,4,3,3,1`; restatement-grade per the OD-60-2 guard). There is no "different set class" to split on.

**2 — Office-linking / modal remainder (design-space items 2 and 4): the sole clean separator, and the remainder is modal-bounded.** The office predicate separates 14/0/0/22 — but it is the seat-contact's own same-office eligibility condition, not an independent structural property. Its complement is exactly the modal neighbourhood: every unrecorded instance lies at delta ±2 mod 7 (the governor-successor step landed at BL-029), 11 + 11, balanced. The modal orbit does not *select* the contacts; it *bounds* the available remainder.

**3 — Z-interface (design-space item 3): the D4 mechanism does not extend.** Only 4/14 contact states are Z-majority (191, 253, 2017, 4001; signs −6, −1, −1, −6); ten carry nonZ-majority interfaces (signs +1..+7). On the availability domain the predicate is state-level and mixed (hit 24/36). **The GSL-1R polarization is fa-specific** — recomputed with the BL-060/061 method, which reproduces the D4 side exactly (all 14 observed 7-27 signs negative; the exception pairs 1765/1261 nonZ 8 and 731/2921 nonZ 14 match the landed table).

**4 — Invariant geography (design-space item 4): pole-universal.** All 7 inversion pairs are in-class, status-shared, one of each chiral orientation, and **all seven office sums are 6 mod 7** (6 cross-office + 1 same-office Mercury pair 3+3). The ti-pole's contacts obey the same inversion-invariance and office-linking laws as the fa-pole's. The D4 side was independently recomputed (7 state-pairs, all sums 6) and cross-checked against the landed `d4-zresidual-hunt.v1.json` `domain.inversionPairs` (14 key-pairs).

## 4. GSL-3 — the asymmetry's mechanism (the governs semantic layer's first explanatory entry)

**Verdict: `DIFFERENT_PREDICATES`** (pre-registered alternatives `SCOPED_NULL`, `DOMAIN_MISMATCH` did not fire).

> GSL-3 (BL-068, the governs semantic layer's first explanatory entry). The fa/ti asymmetry's mechanism is **predicate-axis divergence at the contact-target tiers**. The fa-pole selects within a two-class governed domain: the A1 tier carries 14 × 7-27 (observed) + 14 × 7-31 (unobserved), the domain is office-flat (28/28), and the intrinsic set-class predicate separates it 14/0/0/14. The ti-pole's contact relation is exhaustive over a single-class tier: the D6 tier carries 14 × 7-2 only, the class predicate restates over the availability domain (36/36), and the sole clean separator is the office-linking condition (14/0/0/22), whose complement is modal-bounded (every unrecorded instance lies at office delta ±2 mod 7, 11+11). The boundary invariants are pole-universal (both poles: inversion pairs in-class, office sums 6 mod 7, status shared within pairs); the Z-interface polarization is fa-specific (D4 separation 14/14 vs 14/14; D7 mixed at 4/14 Z-majority, non-separating). The class asymmetry (7-27 vs 7-2) is input-level; the selection asymmetry is axis-level (class vs office), and the axis difference is forced by the target tiers' class multiplicity. **Same invariants, different predicates.**

**The mechanism in one line:** the A1 tier's satellite population carries two classes so a class selection exists; the D6 tier's carries one so the only separating condition is the office rule. The fa-pole's selection rides set-class identity; the ti-pole's rides the office condition alone. The ti-pole's contact relation is **class-exhaustive and office-pure** — not a selection from a richer domain, but the whole of its target class under the office rule.

**What this explains (the synthesis §6 Question 1).** *Why do the poles obstruct differently?* Because their contact-target tiers differ in class multiplicity, and the poles' discriminating conditions live on orthogonal axes — class at fa (office-flat domain), office at ti (class-flat domain). The investigation thus explains the asymmetry's *shape* (the three landed measurements: literal 0/14 = input-class mismatch; class 14/14 = single-class restatement; cycle-twin 0/7 = orbit regime) as one structural fact with three projections. D7 remains hypothesis-tier; no D7 claim, no derivation, no amendment — the explanation is planning evidence, feeding the scoping memo's §4 evidence base and the higher-theorem question's inventory.

## 5. Connection to the synthesis §4 and the scoping memo

The synthesis §4 recorded the asymmetry and explicitly did not interpret it (the explanation is §6 Question 1). This investigation executes that question and supplies the measurement beneath the §4 lens coda: the Venus/Moon reading (over-generation vs non-closure) remains interpretation vocabulary — the registered lens colors, the measurements ground; the codas stay non-load-bearing. Scoping-memo connections: §4.3 (the fa/ti asymmetry evidence base) and §6.3 (the D-tier asymmetry as boundary case) gain the predicate-axis reading; §5.1 (D7 modal non-closure) gains the modal-remainder characterization (the orbit bounds the availability remainder at ±2 mod 7). No higher-theorem movement: this is evidence, not an answer.

## 6. Appendix — the 7-2 control (OD-68-5)

The 7-2 class census: 14 records, all D6 satellites, all governed by D6 anchors (`d6SatelliteRows`), all contacted by D7 anchors. Per-state property table (artifact `control.satellites`): office, orientation (7 A + 7 B), inversion partner (7 pairs), containment sign (4 Z-majority / 10 nonZ), appearance multiplicity (1–3). The control's result: the class is degenerate as a discriminator — the class IS the contact set; its internal structure is recorded but no sub-class selection exists. The brief's "59" figure is corrected to 14 by ledger bytes.

## 7. Fences and bounded non-accomplishments

No D7 claim event; no D7 record amendment; no D7 derivation admission (hypothesis-tier preserved; ENTRY 15's clause unchanged). No GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; no claim event of any kind; no D4-record movement; no orientation-bit resolution (BL-065 carried); no lens application as evidence; the frame is vocabulary, not input. The availability domain is labeled a constructed-comparison domain throughout.

**Verification:** `npm run orrery:bl068-d7-asymmetry:check` PASS (freshness + 16 mutation probes); 11 pins; `orrery:check` exit 0; suite 351 green (35 files); `validate:ledger-pins` unchanged (13 pre-existing, zero added); `validate:manifest` PASS; manifest regen.

## 8. Result in one paragraph

The deepest open question in the boundary layer's record now has its first explanatory answer — as planning evidence, D7 hypothesis-tier throughout. The investigation established the true starting condition (OD-68-0: the analogue collapsed its own domain; the recorded layer collapses too: 14/14/0) and constructed the availability domain from ledger bytes (36 = 14 recorded + 22 unrecorded, per-anchor 4–6, every unrecorded instance modal-bounded at ±2 mod 7). On that domain the four axes resolve: no set-class partition exists (the class is the domain); the office-linking predicate is the sole clean separator (14/0/0/22); the Z-interface polarization does not extend (4/14 Z-majority — fa-specific); the invariant geography does (7/7 inversion pairs in-class, all office sums 6 mod 7 — pole-universal). GSL-3, the governs semantic layer's first explanatory entry, records the mechanism: the contact-target tiers differ in class multiplicity (A1 two classes, D6 one), so the fa-pole's selection rides set-class identity while the ti-pole's rides the office condition alone — same invariants, different predicates. The ti-pole's contact relation is class-exhaustive and office-pure; the asymmetry between the poles is the axis difference, and the axis difference is structural. No claim, no amendment, no admission — the explanation is the deliverable.
