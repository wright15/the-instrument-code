# BL-064 — Cycle-ground derivation via κ: findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. Sandbox/analysis only. D4's amended `derivable-via-R2` (ENTRY 15) and ENTRY 10's immutable `not_derived` are unchanged; D7 remains hypothesis-tier and is fenced out (no D7 computation). No governs admission, no G1 movement, no directional-semantics assignment, no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) was not used as design input. The higher-theorem question (BL-059) is not answered; this sprint is the un-granting roadmap's second recovered link.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl064-cycle-ground.mjs` | deterministic builder; intrinsic region statically fenced from the grant, the phase-1 constructor table and the canonical ledger |
| Artifact | `orrery/src/generated/bl064-cycle-ground.v1.json` | `status: planning_evidence` (raw-byte SHA-256 `9432aa764a57823a06a4d36db3209507ed85af0f7675d3708ef388e369da6f24`; `derivationFingerprint` `aa975820136658dd2fb3c84d98b34bf7a1901d39edd6548a300f458858305918`) |
| Validator | `orrery/scripts/validate-bl064-cycle-ground.mjs` | independent re-derivation from the three pinned sources; static grant-isolation check; **10 mutation probes** (flipped K-int pair member, swapped boundary twin, inverted orientation, coverage drift, D-mid count drift, class mislabel, unified child swap, reflection label drift, smuggled `officeIndex` read, smuggled ledger read) each rejected |
| Pins | `orrery/src/bl064-cycle-ground.test.ts` | 10 vitest pins (header/chain, κ, child-side, coordinate-side, unified+equivalence, coverage, reflection, direction, gates/synthesis, fences) |
| Wiring | root `package.json` `orrery:bl064-cycle-ground:check`; `orrery/package.json` `check`/`build` | runs after `bl063-office-reconstruction:check`, before `derived-path-graph:check` |

**Chain anchor (OD-P2-4).** BL-063 is consumed by its self-checked `reconstructionFingerprint` `6d33c67b…` (the literal pin lives in the validator and pins, per the house ledger-pin discipline; the generator verifies self-consistency). Verification: `npm run orrery:bl064-cycle-ground:check` PASS; 10 pins pass; full `orrery:check` exit 0; orrery suite **327 green (33 files)**; `tsc --noEmit` clean; landing-time packaging (manifest regen, 1257 files) included; `validate:ledger-pins` unchanged at the BL-058 13-violation inventory — **zero added**; backlog registration remains a separate step.

**Build-phase self-catch (fail-loud discipline).** The first draft of the generator carried the BL-063 fingerprint as a literal constant for a pin-drift assertion; the ledger-pin inventory rose to 14. The literal was removed from the generator (the artifact self-check remains literal-free; the pin lives in the validator and pins, exactly as BL-063's generator does with its own chain anchor), restoring the inventory to 13 — zero added. The artifact bytes and fingerprint are unchanged.

## 2. Pre-registration discipline (executed as ruled)

The five rulings and the C-4 refinement were executed exactly as approved:

1. **OD-P2-1 (dual formulation, pre-registered equivalence).** Both rule families implemented; both equivalences hold (`kIntEqualsSInt: true`, `kBdyEqualsTBdy: true`). The coordinate-side proof is the un-granting content; the child-side rules are the operational generation.
2. **OD-P2-2 (masks-only primary; canonical-computation secondary).** Three tiers reported; the D-mid test is the masks-only primary, the class asymmetry the labelled canonical-computation secondary, and the IC-count candidate carried as an observation (open decision below), never silently promoted.
3. **OD-P2-3 (reflection).** Pair sets invariant under both orientations, labels flip `c → 6−c`, the bit is carried to **BL-065** — not resolved.
4. **OD-P2-4 (standalone artifact).** New standalone JSON importing BL-063 by fingerprint; BL-063 untouched.
5. **OD-P2-5 (both orientations).** The derivation runs under κ₀ and κ₁; reflection-invariance of the pair content is a verification, not a remark.
6. **C-4 refinement (internal direction as the headline).** D-mid resolves 5/5 internal triples; the child is the envelope-middle by mask geometry, not by the grant's direction field.

**Planning-pass correction carried into the rules (C-5 class).** The briefed candidate rule "(b) parents are the masks at ±1 mask-rotation from the anchor" was falsified for internal pairs in the planning pass — internal parents are T±2/κ-interval pairs, not T±1. The executed rule set states the split: K-int = κ-interval (internal), K-bdy = T±1 rotation (boundary/seam).

## 3. The dual rules (W1)

**Child-side (masks only).** `S-int`: each A1 mask with exactly two Hamming-2 A0 neighbours takes those neighbours as constructors (sandwich holds) — 5 anchors. `T-bdy`: each A1 mask with exactly one Hamming-2 A0 neighbour is closed by its unique T±1 rotation twin — 2 anchors (`1371←{1387,2741}`, `2901←{1451,2773}`). Census 5+2, fail-loud on any other count.

**Coordinate-side (κ + masks/rotation).** `K-int`: for each internal position `c = 1..5`, the unordered pair `{κ⁻¹(c−1), κ⁻¹(c+1)}` — κ alone. `K-bdy`: the two unordered A0 pairs in T±1 relation — masks + rotation.

**Unified cyclic statement.** The seven pairs are exactly the seven cyclic distance-2 pairs in κ: `{κ⁻¹(c−1), κ⁻¹(c+1) mod 7}`, `c = 0..6`; the five internal centers (1..5) are the linear P₇ distance-2 pairs, the two boundary centers (0, 6) the wrap/seam pairs.

**Midpoint consistency (the link to the frozen T-C law).** `midZ7(c−1, c+1) = (4·(2c)) mod 7 = c` — verified for all seven centers. The coordinate rule and the frozen midpoint law are one relation read in opposite directions; the two boundary centers realize BL-056's two observation-exact T1 seam relations, the five internal centers its five confirmation-marked T2 predictions. Under κ₁ the derived centers reproduce the granted child offices 7/7 (consistent with BL-063's M1; comparison only).

**Equivalence (pre-registered).** K-int output set-equal S-int output; K-bdy output set-equal T-bdy output; unified = K-int ∪ K-bdy with seven distinct pairs. Both halves independently re-proven by the validator.

## 4. The gates (V-P2-1…V-P2-4)

| Gate | Result | Reading |
|---|---|---|
| **V-P2-1 coverage** | **PASS** | Derived 7 unordered / 14 directed edges set-equal the granted E pairs; `missing: []`, `extra: []`; per-child equality 7/7; fail-loud on any mismatch (the granted pairs are the verification target, never the source) |
| **V-P2-2 mechanism consistency** | **PASS** | S-int yields exactly the 5 internal pairs, T-bdy exactly the 2 boundary; K-int/K-bdy set-equal per mechanism; no crossover (unified mode matches the center class at all 7 centers) |
| **V-P2-3 reflection handling** | **PASS** | Pair sets identical under κ₀/κ₁; coordinate labels flip `c → 6−c`; orientation bit carried to BL-065; direction probes orientation-independent (mask functions) |
| **V-P2-4 grant accounting** | **PASS** | Three tiers recorded (below) |

## 5. Direction probes

- **D-mid (masks-only, primary).** Within each construction triple, the child is the member `m` with `sandwichHolds(other₁, other₂, m)`. Resolved **5/5 internal** triples — the child is uniquely the envelope-middle; `middleIsChild` holds wherever resolved. The two boundary triples resolve **0/2**: the sandwich fails on every choice. The internal direction is mask-derivable in the strongest sense — the child's identity follows from its envelope position, not from the grant's direction field.
- **Canonical class (canonical-computation, secondary; OD-P2-2).** Parents carry the A0 class `7-35`, children the A1 class `7-34` — split **7/7**, labelled **canonical-input-dependent** (field read from the canonical ledger).
- **IC-count candidate (observation).** Interval-class counts computed from the mask alone — parents `[2,5,4,3,6,1]`, children `[2,5,4,4,4,2]` — partition the triples identically to the class split (`matchesCanonicalClassSplit: true`). This is a candidate **mask-only** discriminator found by the probe hunt the OD-P2-2 ruling authorized. It is carried as an observation: whether the boundary/full direction is re-tiered masks-only is a maintainer ruling, not promoted here.

**The asymmetry (structural).** 5/7 internal direction derivable masks-only, 2/7 boundary requiring the class asymmetry — the boundary is where the envelope geometry runs out, consistent with the boundary layer's entire characterization arc (BL-033/055/060/061/062).

## 6. The un-granting accounting (V-P2-4)

**Discharged — masks-only tier.** The **CONSTRUCTS pair structure**: 7/7 unordered pairs (K rules) and the child attachment (S/T rules), from masks plus the consumed κ alone. The **internal direction**: 5/7 via D-mid. This is the grant's core content: which pairs exist, and for the internal triples which end is the child.

**Discharged — canonical-computation tier.** The **full direction** 7/7 via the class asymmetry (A0 class vs A1 class; canonical ledger field) — legitimate but labelled canonical-input-dependent.

**Remaining granted.** The A0/A1 anchor set and its tier membership (projection anchors; the pair content is discharged, the anchor partition is not this phase's target); the E edge bookkeeping (IDs, tier tags); the R2 walk direction (presentation convention per the BL-059 statement; not claimed); the satellite layer and the GOVERNS relation (Phase 3+ scope).

**Statement.** Phase 2 discharges the CONSTRUCTS pair-structure grant and, at two tiers, the direction; nothing beyond the CONSTRUCTS pairs is discharged. The grant has shrunk: the cycle ground R2 traverses is now derived from the recovered coordinates, with the boundary remainder honestly accounted.

## 7. Open decision for maintainer ruling

**OD-64-1 — the IC-count candidate's tier.** The interval-class counts (mask intrinsic) reproduce the class split exactly. Should the boundary/full direction's tier be upgraded from canonical-computation to masks-only on this basis (with its own pin/mutation treatment), or held at canonical-computation pending a deeper mask-geometric argument? Recommendation: hold the pre-registered tier (the counts are a new intrinsic function class, not in BL-063's vocabulary; the upgrade deserves its own ruling and possibly its own probe). The artifact and memo report the find without promoting it.

## 8. Dependency-chain forward hooks (program framing)

- **Phase 1 (BL-063, landed)** recovered the coordinates κ up to one named bit.
- **Phase 2 (this sprint) consumes κ and recovers the cycle ground** — BL-059 §3 requirement 4. The pairs exist because κ exists; κ exists because the masks' Hamming geometry exists; the grant is reachable from the geometry in two provably-equivalent formulations.
- **Phase 3 (next)** derives the 28 R-edges (the GOVERNS relation) using Phase 1's coordinates and Phase 2's ground. The derived pairs are Phase 3's input; the grant shrinks again.
- **Phase 4** unifies the poles — D7's structural asymmetry (`M(4033) = 127`) as constraint, not restatement.

Each phase remains necessary-not-sufficient; the chain is only as strong as its recovered links. The orientation bit remains the shared dependency (BL-065), carried, never smuggled.

## 9. Bounded non-accomplishments

No R-edge derivation (Phase 3 not attempted); no GOVERNS admission; no higher-theorem answer; no record amendment (ENTRY 10 immutable, ENTRY 15 unchanged; `derivable-via-R2` and D7 hypothesis-tier unchanged); no orientation-bit resolution (carried to BL-065); no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment; no D7 computation; no dual-pole unification (Phase 4 not attempted); no claim event, no admission, no verdicts; no canonical/Court/schema/Neo4j writes. Frame not used as design input; session prose is context, not evidence. Backlog registration is a separate step; the `validate:ledger-pins` inventory remains at its pre-existing BL-058 13-violation state (zero added).

## 10. Result in one paragraph

Read-only, the sprint executed the approved Phase 2: the seven A0→A1 CONSTRUCTS pairs — the cycle ground R2 traverses — are now **derived** from the recovered coordinates κ rather than read from the granted E edges. The coordinate-side rule generates the seven pairs as the cyclic distance-2 pairs of κ; the child-side rule attaches each child by the Hamming-2 sandwich (5 internal) or the T±1 twin-closure (2 boundary); the two formulations are proven set-equal, set-equal to the granted 14 directed edges (V-P2-1), with no mechanism crossover (V-P2-2), invariant in pair content across both κ orientations with the one-bit labelling carried to BL-065 (V-P2-3), and the midpoint law `midZ7(c−1, c+1) = c` recovered as the same relation read backward. The direction is discharged masks-only for the five internal triples — the child is uniquely the envelope-middle, a mask-geometric definition of "child" — and at the canonical-computation tier for the full seven via the class asymmetry, with the IC-count candidate carried as an un-promoted observation (OD-64-1). The CONSTRUCTS grant has shrunk to its anchoring remainder: the pair structure is discharged, the boundary remainder is named, and the un-granting program's second link is on record. The sprint derives the cycle ground; it does not conclude the governs program.
