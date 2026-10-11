# BL-066 — The 28 R-edge derivation (un-granting Phase 3, the capstone): findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. Sandbox/analysis only. D4's amended `derivable-via-R2` (ENTRY 15) and ENTRY 10's immutable `not_derived` are unchanged; D7 remains hypothesis-tier and is fenced out (no D7 computation). No GOVERNS admission (this is a derivation *finding*, not an admission; any GOVERNS-status change is a separate ceremony); no G1 movement; no directional-semantics assignment; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) was not used as design input. The higher-theorem question (BL-059) gains its first direct attempt — a bounded affirmative finding, not a conclusion.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl066-r-edge-derivation.mjs` | deterministic builder; intrinsic region statically fenced TWO-SIDED (forbidden grant/office/class/observation tokens absent; required canonical inputs present) |
| Artifact | `orrery/src/generated/bl066-r-edge-derivation.v1.json` | `status: planning_evidence` (raw-byte SHA-256 `ac2db3d92df89f9ae2e5f19dfc7c0489a56f55dfa8bd154a22ad74c875e7a8ab`; `derivationFingerprint` `94f0661ff6e76b0dea69fbe9f09ead24da7901393fb735495f3a25c3d9a1a886`) |
| Validator | `orrery/scripts/validate-bl066-r-edge-derivation.mjs` | independent re-derivation from the five pinned sources; two-sided static input-isolation check; **25 mutation probes** (17 artifact-drift probes + 3 smuggled-read probes + 5 presence probes) each rejected |
| Pins | `orrery/src/bl066-r-edge-derivation.test.ts` | 13 vitest pins (header/chain, domain, reach, robustness, closure law, battery/officeSum, emergent/direction, mechanism/GSL, coverage, reflection, gates/synthesis, bit inventory, fences) |
| Wiring | root `package.json` `orrery:bl066-r-edge-derivation:check`; `orrery/package.json` `check`/`build` | runs after `bl064-cycle-ground:check`, before `derived-path-graph:check` |

**Chain anchor (the phase chain).** BL-064 is consumed by its self-checked `derivationFingerprint` `aa975820…` (the literal pin lives in the validator and pins, per the house ledger-pin discipline; the generator verifies self-consistency and carries **no** 64-hex literal — `validate:ledger-pins` unchanged at the BL-058 13-violation inventory, **zero added**). BL-063 is consumed transitively (`6d33c67b…`, re-checked by the validator). Verification: `npm run orrery:bl066-r-edge-derivation:check` PASS; 13 pins pass; full orrery suite **340 green (34 files)**; `tsc --noEmit` clean; landing-time packaging (manifest regen) included.

## 2. Pre-registration discipline (executed as ruled)

The seven rulings (OD-P3-0…OD-P3-6) and the two additions (the presence-require pair; the bit-inventory framing) were executed as approved:

1. **OD-P3-0.** `BL-066` + `bl066-r-edge-derivation.v1.json`; the phase sequence stays clean (Ph2 = BL-064, Ph3 = BL-066).
2. **OD-P3-3.** V-P3-2 is **two-sided**: forbidden in the derivation region (`projection.R`, `projection.E`, `generation.projection`, `officeIndex`, `parentOffice`, `.office`, `relationalOffice`, `forte`, `intervalVector`, `setClass`, `observed`, `coverage`) **and required present** (`ledgerRows`, `pitchSet`, `hamming12`, `rotateMask12`, `maskOfRow`, `deriveDomain`) — a derivation region that reads *nothing* cannot pass. `forte` stays forbidden in the derivation because P is the D4 predicate, not the R-layer's (importing it would smuggle the corridor's finding into the GOVERNS derivation).
3. **OD-P3-2.** Closure (A) inversion-completion primary, (B) class-balance fallback. The officeSum-6 flag is worded **induced-with-verification**: induced from the 12 placed pairs, tested out-of-sample on the 2 unplaced pairs (corroboration of consistency, never the justification).
4. **OD-P3-5.** Count-4 is an **emergent check only**, never input — and it passed in its strongest form (below).
5. **OD-P3-4.** Direction dual-report + the IC-extension attempt (un-promoted observation, OD-64-1 discipline).
6. **OD-P3-1.** Reach pre-registration + the containment control recorded as a **named robustness finding** (below).
7. **OD-P3-6.** The four branches; the swap bit carried only if no masks-only resolution fires.

**Build-phase disclosure (fail-loud discipline).** The planning pass recorded the within-pair swap as *distance-invisible* (P3-E) and pre-registered a tie-break battery. The build's closure probe found the resolution the planning pass had not tested: **the H8 reach-census ordering** — each unplaced satellite attaches to its H8-parent with the smaller H2-reach count, equivalently the completion is the **unique H8 matching that equalizes the reach census** (enumeration of the 16 matchings yields exactly one; it is the granted assignment). The battery was then run as ruled and **corroborates** (pcSum and mask-numeric agree; κ is orientation-relative; containment is the inapplicable control). The pre-registered "carry the bit only if nothing fires" condition is therefore not met: **the swap-bit candidate dissolved**; the planning-pass distance-invisibility observation stands as a bounded record of the axes it actually tested (proximity/rotation/Tn/inversion — not census ordering). This disclosure is carried in the artifact (`closure.law.statement`, `synthesis.bitInventory`).

## 3. Grounding receipt

- **P3-A…P3-G confirmed at build against bytes.** R's satellite set = the ledger A1 satellite set (28/28); R's partition = the ledger office partition (4 per office); H2 reach 24/28 zero extras with unplaced `{695, 3497, 731, 2921}`; containment max-overlap agreement 24/24 + tie 4/4 (the 4 ties excluding the assigned parent); the 4 form 2 anchored inversion pairs; the pools split 2×7-27 / 2×7-31.
- **Maintainer-prose correction (applied before capture).** The ruling's OD-P3-4 parenthetical described the parent IC as `[2,5,4,3,6,1]` "as A1 anchors" — grounding check: that vector is BL-064's **A0**-anchor parent IC; the **A1**-anchor IC computed from the masks is `[2,5,4,4,4,2]`. The artifact carries the correction (`direction.icAxis.correction`).
- **Ledger representation note.** The ledger's `bit` field is the bit-reversed mask string; the mask is derived from the canonical `pitchSet` (and cross-checked against `id` and `bitReverse`) — recorded in the generator's `maskOfRow`.
- **Independent validator** re-derives every block from the five sources (no generator import), re-checks the chain fingerprints, and rejects all 25 probes including a **lobotomized region** (each required token stripped individually must fail the presence check).

## 4. Findings

**4.1 Reach (D2, masks-only).** `reach(h) = {s : hamming12(h, s) = 2}`: 24 placed, 4 unplaced, **zero extras**, unique hubs (no satellite reachable from two parents). The reach structure is **robust across its two natural definitions**: containment max-overlap selects the unique H2 parent for all 24 placed and ties (excluding the assigned parent) for all 4 unplaced — the same partition, not an independent second mode (named robustness finding, OD-P3-1).

**4.2 The closure law (D3, masks-only).** The H8 relation forms the single path `1371–695–1389–731–1461–2921–1749–3497–2901`. The reach census has deficits `{1389: 1, 1461: 2, 1749: 1}`; the closure law (H8 + reach-minimum; equivalently the unique equalizing matching) assigns `695→1389`, `731→1461`, `2921→1461`, `3497→1749` — **the granted edges exactly**. No rotation relation participates (0/44 shifts).

**4.3 The battery (corroboration) and the officeSum-6 prediction.**

| Member | Result |
|---|---|
| pcSum (min \|Δ pcSum\| over the pair-level candidates) | fires the grant |
| mask-numeric (min \|Δ mask\|) | fires the grant |
| κ | undecided — orientation-relative (the label being tested is the BL-065 bit) |
| containment | control-inapplicable — fails the internal pair; over the cross-pair candidates it selects the opposite within-pair orientation |

Over the **full** H8 sets, proximity metrics alone select the full-reach parents (1371/2901) and fail — the operative signal is the reach-census ordering, not generic proximity (recorded). officeSum-6: all 12 placed inversion pairs sum to 6; the prediction holds on both unplaced pairs (corroboration only).

**4.4 The emergent count (OD-P3-5, strongest form).** After the completion every parent holds exactly **4** satellites — the 4-per-parent structure, previously the grant's own shape, **emerges from the machinery** without 4 ever entering the derivation. No circularity: the equalization target is "all equal"; the common value is an output.

**4.5 Direction (D4).** Structural: source = the domain's parent-partition member (canonical read, labelled). Unique-hub masks-only: 24/24. IC-extension: the A1-anchor IC vector is uniform `[2,5,4,4,4,2]`; the satellite IC classes are `[3,4,4,4,5,1]` and `[3,3,6,3,3,3]` (14 each); no derived edge is IC-symmetric (28/28 distinguishable) — **candidate** masks-only discriminator, un-promoted (OD-64-1 discipline). Canonical class secondary (7-34 vs 7-27/7-31, labelled).

**4.6 Mechanism consistency + GSL cross-check.** 24 H2 + 4 closure = 28, no crossover; per-parent `{4,4,4,4,4,4,4}`; every parent's derived four is exactly `2×7-27 + 2×7-31` with the GSL-1R sign rule separating the halves (28/28 sign agreement, 7/7 office separation) — the derived grouping reproduces the corridor's boundary-geography signature.

## 5. The gates (V-P3-1…V-P3-5)

| Gate | Result | Reading |
|---|---|---|
| **V-P3-1 set-equality** | **PASS** | derived 28 directed edges set-equal the granted R edges; `missing: []`, `extra: []`; per-parent 7/7; office alignment 28/28 under κ₁ (labels relative; κ₀ matches only the reflection-fixed office-3 edges, 4/28) |
| **V-P3-2 input isolation** | **PASS** | two-sided static check (forbidden absence + required presence) + 8 generator probes rejected (smuggled `officeIndex`/R/`forte`; five presence-strip probes) |
| **V-P3-3 mechanism** | **PASS** | no crossover; count-4 emergent; GSL 2+2 per parent |
| **V-P3-4 reflection** | **PASS** | the laws are mask functions; the edge set is invariant under both κ orientations; labels flip `c → 6−c`; the bit is carried to **BL-065** |
| **V-P3-5 accounting** | **PASS** | three tiers recorded; the swap candidate dissolved, not carried |

## 6. The un-granting accounting and the capstone statement

**Discharged — masks-only.** The 28-edge R set: 24 by H2 reach (unique hubs, zero extras) + 4 by the H8 reach-census closure law; the per-parent 4-partition (emergent); the unique-hub direction (24/24) and IC-distinguishability (28/28, candidate).

**Discharged — canonical-read (labelled).** The A1 domain partition (role/tier); the class-asymmetry direction secondary; the office labels (BL-063 coordinates, relative to BL-065's bit) used in comparison only.

**Remaining granted (the anchoring remainder).** The A1 anchor/satellite domain partition itself; the office-orientation bit (labels only — the edge set does not depend on it); presentation conventions (walk order, ids, tier tags).

**The bit inventory (capstone).**

- **Carried: ONE bit** — the office-orientation (reflection) identification, carried to BL-065, with two agreeing candidate sources (the brightness premise; one grant comparison). The reflection and brightness registrations are **one identification with two registrations** (BL-063 §6); the carried count is one, not two.
- **Dissolved: the swap-bit candidate** — pre-registered as a potential within-pair bit; resolved masks-only by the closure law at build; the battery corroborates; recorded as a finding, not carried.

**Branch verdict: `R_EDGES_DERIVED`** (against the pre-registered `R_EDGES_DERIVED / R_EDGES_PARTIAL / R_EDGES_FAILED`). The GOVERNS relation's edge content is **intrinsic to the satellite layer's reach geometry**: the architecture is derived up to the anchoring partition and one orientation bit. **The higher-theorem question (BL-059) gains its first direct attempt: affirmative and bounded** — a finding, not an admission; any GOVERNS-status change is a separate ceremony.

## 7. Open decisions for maintainer ruling

1. **OD-66-1 — the closure law's tier and its pre-registration status.** The H8 reach-census law (min-reach / unique equalizing matching) resolved the swap the planning pass had recorded as distance-invisible. Should the law be recorded as the closure's **primary** with the battery as corroboration (recommended — the artifact already reads this way), and should the planning-pass P3-E record be annotated in the next accretion cycle as "proximity axes only"?
2. **OD-66-2 — the IC-extension's tier.** The A1-anchor IC `[2,5,4,4,4,2]` vs the satellite classes separates all 28 edges. Promotion from candidate to masks-only direction evidence (with its own pin/mutation treatment), or hold at candidate pending a deeper argument (recommended: hold, OD-64-1 pattern)?
3. **OD-66-3 — the bit inventory's count.** With the swap dissolved, the programme's carried remainder is **one bit** (orientation; two registrations). Confirm the capstone statement "derived up to one named bit" (recommended), and confirm that BL-065's resolution question is unaffected by this sprint (the swap dissolution is orthogonal to the orientation bit).

## 8. Bounded non-accomplishments

No GOVERNS admission; the derivation is a finding, not an admission; any GOVERNS-status change is a separate ceremony. No record amendment (ENTRY 10 immutable, ENTRY 15 unchanged; D4 `derivable-via-R2` and D7 hypothesis-tier unchanged). No claim event; no evidence obligations. No orientation-bit resolution (carried to BL-065); the swap-bit candidate dissolved, not promoted. No IC-tier promotion. No G1 movement; no INV-5 graduation; no M-walkability promotion. No dual-pole unification (Phase 4 not attempted); no cycle-ground re-derivation. No canonical/Court/schema/Neo4j writes; no directional-semantics assignment. Frame not used as design input; session prose is context, not evidence.

## 9. Result in one paragraph

Read-only, the sprint executed the approved Phase 3 — the capstone. The 28-edge A1 GOVERNS relation is **derived** from the pre-grant machinery: 24 edges by masks-only H2 reach (unique hubs, zero extras) and 4 by the masks-only **H8 reach-census closure law** — each unplaced satellite attaches to its H8-parent with the smaller H2-reach count, equivalently the completion is the **unique H8 matching that equalizes the reach census** (16 matchings enumerated, exactly one equalizes; it is the granted assignment). The derived set is set-equal the granted R (V-P3-1), invariant under both κ orientations with labels flipping `c → 6−c` (V-P3-4), with the **count-4 structure emerging from the completion** (OD-P3-5's strongest form), the boundary-geography signature reproduced per parent (2×7-27 Z-majority + 2×7-31), and the direction dual-reported (structural + unique-hub 24/24 masks-only + IC-distinguishability 28/28 candidate). The pre-registered swap-bit candidate **dissolved** at build; the battery corroborates (pcSum and mask-numeric agree; κ orientation-relative; containment the inapplicable control). The programme's bit inventory therefore stands at **one carried bit** (the office-orientation identification, BL-065, two agreeing sources). The GOVERNS grant has shrunk to its **anchoring remainder**: the domain partition, the one orientation bit, and presentation conventions — the architecture is derived up to one named bit, and the higher-theorem question has its first direct, bounded, affirmative finding. The sprint derives the R edges; it does not conclude the governs program.

## 10. Post-landing register (additive; maintainer dispositions 2026-10-11)

The three open decisions (§7) are ruled and recorded here; the dispositions **ratify the landed reading** — no artifact bytes change (`derivationFingerprint` `94f0661f…` unchanged; no re-pin, no validator change), and no record amendment occurs (DECISION_LEDGER/Court/schema/Neo4j untouched).

- **OD-66-1 — ruled: closure law primary, battery corroboration; P3-E annotated "proximity axes only" at the next accretion cycle.** The H8 reach-census law is the **mechanism** (it resolved the swap from structure); the battery (pcSum, mask-numeric) is **corroboration** (independent methods agreeing). The artifact already reads this way; the ruling ratifies the landing rather than amending it. The P3-E annotation's precise wording (deferred to the next BL-059 accretion cycle): *no **proximity** discriminator exists; the **census-consistency** law was the discriminator* — the record must state what was searched, not only what was found. (The landed artifact and §2 of this memo already carry the corrected scope: "tested proximity axes, not the reach-census ordering".)
- **OD-66-2 — ruled: hold at candidate, per OD-64-1's pattern.** The IC-extension separates all 28 edges, but **separation is not derivation** — the same restatement-vs-explanation line the OD-60-2 guard drew. Promotion would need its own verification: *why* the IC structure discriminates the direction, not just *that* it does. Held at candidate, un-promoted.
- **OD-66-3 — ruled: one named bit confirmed; BL-065 unaffected.** The capstone statement stands: **derived up to one named bit** (office-orientation; one identification, two registrations — BL-063 §6). The orthogonality is stated precisely: the **swap dissolution** (the H8 law) resolved a **matching ambiguity** (which parent–satellite assignment within the closure); the **orientation bit** is a **labeling ambiguity** (which endpoint of the P₇ line is office 0). Different ambiguity classes, different resolution paths, **no interaction** — the swap dissolved into reach-census structure; the orientation bit awaits the brightness premise's resolution or a future discovery. BL-065's question is exactly as open as it was before this sprint.

**Programme state after the dispositions.** The un-granting program is complete: offices (Phase 1, up to the one bit), the cycle ground (Phase 2), the R-edges (Phase 3, `R_EDGES_DERIVED` FULL) — the grant ledger closed with one carried bit and the anchoring remainder. The formal claim event ("GOVERNS is derivable" as a claim) remains a separate ceremony, unperformed. The semantic synthesis (GSL-1R/GSL-2, the fa/ti asymmetry, the invariants) and the D7 thread remain open, both richer for the capstone; none decays.
