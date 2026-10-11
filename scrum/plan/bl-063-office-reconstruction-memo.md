# BL-063 — Intrinsic office reconstruction via midZ7: findings memo

**Status:** sprint artifact. Planning evidence only. No ledger entry, no evidence obligations, no claims admitted, no verdicts, no admission of any kind. Sandbox/analysis only. D4's amended `derivable-via-R2` (ENTRY 15) and ENTRY 10's immutable `not_derived` are unchanged; D7 remains hypothesis-tier and is fenced out (no D7 computation). No governs admission, no G1 movement, no directional assignment, no canonical/Court/schema/Neo4j writes. The frame (`scrum/plan/harmonic-comprehension-map.md` §§2.6/2.7) was not used as design input; the brightness premise of O-A is carried as interpretation vocabulary, never design input. The higher-theorem question (BL-059) is not answered; this sprint is the un-granting roadmap's first recovered link.

## 1. What was built

| Artifact | Path | Role |
|---|---|---|
| Generator | `scripts/build-bl063-office-reconstruction.mjs` | deterministic builder; intrinsic region statically fenced from grant fields |
| Artifact | `orrery/src/generated/bl063-office-reconstruction.v1.json` | `status: planning_evidence` (raw-byte SHA-256 `57932f37d3acc867bf8c44d00d2ced44d4b2d8ccf39b871c2241e685b6e32b18`; `reconstructionFingerprint` `6d33c67be7b8f87b8ad2f964cd3560ebcbc1ec0dc6b2088ad1f223c35caff8c3`) |
| Validator | `orrery/scripts/validate-bl063-office-reconstruction.mjs` | independent re-derivation from the five pinned sources; static grant-isolation check; **five mutation probes** (flipped endpoint, scrambled constructor pair, inverted orientation, smuggled `officeIndex` read, corrupted midpoint constant) each rejected |
| Pins | `orrery/src/bl063-office-reconstruction.test.ts` | 9 vitest pins (header/chain, P7, κ alignment, π table, midZ7 M1, reflection, orientation, synthesis, fences) |
| Wiring | root `package.json` `orrery:bl063-office-reconstruction:check`; `orrery/package.json` `check`/`build` | runs after `d4-zresidual-hunt:check`, before `derived-path-graph:check` |

**Chain anchor (OD-63-1).** The BL-060 hunt is imported by its self-checked fingerprint `8a1295ca…` (the generator verifies self-consistency; the literal pin lives in the validator and pins, per the house ledger-pin discipline). Verification: `npm run orrery:bl063-office-reconstruction:check` PASS; 9 pins pass; full `orrery:check` exit 0; orrery suite **317 green (32 files)**; `tsc --noEmit` clean; `validate:ledger-pins` unchanged at the BL-058 13-violation inventory — **zero added**.

## 2. Pre-registration discipline (executed as approved)

Three items were pre-registered before the build ran, per the approved plan:

1. **Endpoint orientation (O-0 claim-free scaffold; O-A content premise; O-B existence-only; decision rule).** The scaffold κ₀ (BFS from the numerically smaller terminal) is arbitrary and claims nothing; κ₁ = 6 − κ₀. The decision rule: orientation is claimed as intrinsically resolved only if the H_A orientation coincides with the uniquely-matching orientation of the comparison.
2. **π(h) identification.** The constructor pair is the unique **Hamming-2-adjacent** A0 pair satisfying the containment sandwich (internal anchors); boundary anchors have exactly one Hamming-2 neighbor and construction is T±1 twin-closure with twin uniqueness (fail-loud otherwise).
3. **The midZ7 three-branch protocol** (M1 exactly one orientation matches all seven canonical offices / M2 neither / M3 both), no fourth outcome, per-anchor table recorded under both orientations regardless of outcome.

**Build-time self-catches recorded (fail-loud discipline).** (a) The P7 degree expectation was drafted in path order; the first build run failed and the comparison was corrected to the sorted form before landing. (b) **The unrestricted sandwich is non-unique**: scanning all 21 A0 pairs, multiple pairs satisfy `(P₁∩P₂) ⊂ m_C ⊂ (P₁∪P₂)` for internal anchors (counts 5/8/7/5/7), and for the boundary anchors the satisfying pair is `{1387, 2773}` — the line terminals — which is *not* the constructor pair. **The Hamming-2 adjacency restriction is the load-bearing identifying condition** (the approved R2 wording). This is recorded as a bounded observation in the artifact; a naive "the sandwich identifies the pair" reading would have failed.

## 3. Report item 1 — the P7 isomorphism (confirmed)

The seven A0 anchor masks (Forte 7-35, the diatonic modes) carry a Hamming-2 adjacency graph isomorphic to the path $P_7$:

`1387 — 1451 — 1453 — 1709 — 1717 — 2741 — 2773`

- 6 edges, connected, degree sequence (path order) `1,2,2,2,2,2,1`; terminals **1387** and **2773**.
- **pcSum ladder:** 33, 34, 35, 36, 37, 38, 39 monotonically along the line (unit steps) — the modes' brightness order is intrinsic. The ordering found by the probe is Locrian→…→Lydian from the numerically smaller terminal: every successive mask raises the pc-sum by exactly 1 (single-semitone voice-leading the entire way). This is a structural fact verifiable from masks alone.

## 4. Report item 3 — π(h): 5 sandwich + 2 twin-closure

| Child (A1) | Mode | Hamming-2 neighbors | Constructors | Sandwich on constructors | Twin |
|---|---|---|---|---|---|
| 1389 | sandwich | 1387, 1453 | 1387, 1453 | holds | — |
| 1461 | sandwich | 1453, 1717 | 1453, 1717 | holds | — |
| 1707 | sandwich | 1451, 1709 | 1451, 1709 | holds | — |
| 1749 | sandwich | 1717, 2773 | 1717, 2773 | holds | — |
| 2733 | sandwich | 1709, 2741 | 1709, 2741 | holds | — |
| 1371 | twin-closure | 1387 | 1387, **2741** | **does not hold** | 2741 |
| 2901 | twin-closure | 2773 | **1451**, 2773 | **does not hold** | 1451 |

Every π(h) constructor set equals the granted E-parent pair (validation comparison). The boundary construction is **twin-closure**: the sole Hamming-2 neighbor plus its unique T±1 rotation partner (the same unordered pair as the corresponding T1 seam edge). The two construction mechanisms — interior sandwich, boundary twin-closure — are a discovered property of the A0→A1 construction geometry.

## 5. Report items 2 and 4 — κ and the midZ7 three-branch result

**κ derivation (item 2).** κ₀ and κ₁ are as recorded; **κ₁ reproduces all 7 canonical A0 offices; κ₀ reproduces exactly 1** (the reflection-fixed center, office 3). The office-recovery rule: *office(A0 anchor) = its position on the P7 line; office(A1 anchor) = midZ7 of its constructors' positions.*

**Reflection outcome.** The frozen midpoint form is **reflection-equivariant**:

> `midZ7(6−a, 6−b) = (6 − midZ7(a,b)) % 7`, verified on all **49** label pairs.

Consequences recorded in the artifact: the midpoint law holds identically in both orientations (g₀ + g₁ = 6 on every anchor — complementarity), so **the midpoint relation alone is reflection-blind**. The reflection cannot be resolved by it; resolution comes from the canonical comparison and/or the content premise.

**Three-branch result (item 4): outcome M1.**

| Child | canonical | g₀ (κ₀) | g₁ (κ₁) | match₀ | match₁ |
|---|---|---|---|---|---|
| 1371 | 0 | 6 | 0 | ✗ | ✓ |
| 1389 | 5 | 1 | 5 | ✗ | ✓ |
| 1461 | 3 | 3 | 3 | ✓ | ✓ |
| 1707 | 4 | 2 | 4 | ✗ | ✓ |
| 1749 | 1 | 5 | 1 | ✗ | ✓ |
| 2733 | 2 | 4 | 2 | ✗ | ✓ |
| 2901 | 6 | 0 | 6 | ✗ | ✓ |

M1: **exactly one orientation (κ₁) matches all seven canonical offices**; κ₀ matches only the reflection-fixed center. No fourth outcome occurred. Under the pre-registered protocol this validates the midpoint reconstruction and resolves the orientation against the canonical grant.

## 6. Report item 5 — orientation probes and the Requirement-2 verdict

**H_A (content premise) — corroborated, conditional, stated.** The terminal with the larger pc-sum is 2773 (39 vs 33); its κ₁ index is 0. H_A's orientation is κ₁, which **coincides with the unique canonical match**. The premise ("the brightness end — Lydian/Sun — is office 0"; the framework's 7-35 canonical mode order) is carried as interpretation vocabulary: corroborated by M1, **not derived**.

**H_B (structural asymmetry) — null.** Both terminals have identical D-tier containment profiles (nonZ 8 / z 12; per-family counts identical — see artifact `orientation.hB.profiles`). The terminals are **containment twins**; no asymmetry is available for orientation. One mask-only probe returning null is recorded; broader mask-only statistics are not exhausted.

**The Requirement-2 discharge verdict: `CONSTRAINED_TO_REFLECTION`.** Office structure is **intrinsically recoverable from mask geometry up to the Lydian/Locrian reflection**: the seven A0 offices are line positions; the seven A1 offices are the frozen midZ7 midpoints of their constructors' positions. The global reversal (which terminal is office 0) is **not** derivable from mask geometry by the midpoint relation (equivariance proof above), and no other mask-only orientation signal was found (H_B null). The reversal requires **exactly one bit**, supplied by either:

1. the interpretive brightness premise (O-A; interpretation vocabulary), or
2. one comparison against the granted office fields (M1 unique match, κ₁ 7/7).

Both routes **agree** on κ₁. Precisely: without the bit each A0 anchor's office is determined as the unordered pair {k, 6−k} (only the center, office 3, is reflection-fixed); one bit determines all seven values. The verdict stands against the pre-registered three-way list `FORMALLY_DISCHARGED / CONSTRAINED_TO_REFLECTION / FAILED`; the first and third branches did not fire.

**Convergence record (grounded; the shared dependency).** The residual bit is not a new assumption introduced by this sprint: it is the **office-assignment side** of the comprehension map's §3 `[OPEN CANON QUESTION]` Sun/Moon pole assignment — `Lydian is the Sun office` (`framework/AGENTS.md:103`, `framework/TOPOLOGICAL_ANCHORING.md:359`) versus the pitch-governance reading (`framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md:83-84`; `framework/NATURAL_ORGANIZATION_THESIS.md:593-594,600-601`). §3 states the question is left unresolved and must be resolved **from framework docs, never from the map**, naming the governs semantic layer among the expected resolvers — the layer this reconstruction sits in. The shareable framing is recorded as **one unresolved identification, two framework registrations**: the heptatonic brightness geometry's endpoint (this sprint) and the map's open Sun/Moon pole question (geometry and canon sides of the same bit). *Grounding correction (maintainer-prose class, applied before capture):* the proposed framing attributed a one-bit registration to §2.7's amendment; grounding check — §2.7 (both entries) carries no brightness premise. The nearest registered brightness-ordinal material is §2.3's Court-compression ordinal 22→26 (`schemas/elemental_pentatonic_scale_map_v1.0.0.yaml:95-218`, field semantics `[OPEN]`) — a pentatonic/Court ordinal, adjacent to but distinct from this sprint's heptatonic pcSum ladder 33→39. The corrected convergence feeds **BL-065**.

## 7. Dependency-chain forward hooks (program framing)

The un-granting roadmap is a **dependency chain, each phase necessary-not-sufficient**:

- **Phase 1 (this sprint) recovers the coordinates** — κ up to one named bit. It does **not** derive the CONSTRUCTS edges; it derives the coordinate frame those edges live in.
- **Phase 2 (next) consumes κ** to attempt the cycle-ground derivation (BL-059 §3 requirement 4 — the granted A0→A1 CONSTRUCTS pairs as R2's cycle ground). The cycle edges' midpoint law is exactly a κ-relation; Phase 2 starts from this artifact's `midComparison` provision by design.
- **Phase 3** targets the 28 GOVERNS edge rows (requirements 1 and 3) using Phase 1's coordinates and Phase 2's ground.
- **Phase 4** unifies the rotational (D4) and modal (D7) poles under a membrane statement — with D7's structural asymmetry (orbit non-closure, `M(4033)=127`) as the constraint, not a restatement.

The chain is only as strong as its first recovered link; this link is recovered **up to one named, agreed bit**. The scoping memo (BL-059 §4) accretes by its own mutation discipline and is not edited here; the accretion item is carried: *office recovery via the P7/midZ7 route, conditional on one orientation bit* — evidence that the organization's coordinate layer falls out of its own geometry. Follow-ons captured (backlog registration): **BL-064** — Phase 2, the cycle-ground derivation consuming κ; **BL-065** — the shared one-bit dependency (the grounded §3 convergence recorded in §6 above).

## 8. Bounded non-accomplishments

No GOVERNS derivation; requirement 2 only, and only up to the named reflection bit. No cycle-ground derivation (Phase 2 not attempted); no 28-edge generator theorem (Phase 3 not attempted); no dual-pole unification (Phase 4 not attempted). No claim event, no record amendment, no admission, no verdicts. No D7 computation; no G1 movement; no directional-semantics assignment; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes. Frame not used as design input. Session prose is context, not evidence. Landing-time packaging (manifest regen) is included in this landing (`MANIFEST.json`/`CHECKSUMS.sha256` restored to green; 1252 files); backlog registration remains a separate step; the `validate:ledger-pins` repo-inventory pytest assertion remains in its pre-existing BL-058 failing state (13 violations, zero added by this sprint); `validate:prose-consistency` is byte-identical to its pre-existing failing state (416 passed checks, unchanged violations).

## 9. Result in one paragraph

Read-only, the sprint ran the approved Phase-1 audit: the seven 7-35 A0 masks carry the Hamming-2 line graph $P_7$ (endpoints 1387/2773, pc-sum ladder 33→39); the seven 7-34 A1 anchors' constructors are identified from masks alone (5 interior sandwich pairs + 2 boundary twin-closure pairs, each equal to the granted E-parent pair), and the frozen midZ7 midpoint law reproduces **all seven** canonical offices under exactly one orientation (κ₁; κ₀ matches only the reflection-fixed center) — outcome **M1**, with the law proven reflection-equivariant (49/49) so the midpoint relation itself cannot break the Lydian/Locrian symmetry. The orientation probes: H_A (brightness premise) coincides with κ₁ — corroborated, conditional, stated; H_B (D-tier containment) returns the containment-twin null. The Requirement-2 verdict is **CONSTRAINED_TO_REFLECTION**: the office structure is intrinsically recoverable up to one named bit, supplied by the interpretive premise or by one grant comparison — both agreeing — and the framework's organization has taken its first measurable step toward derivability from its own geometry. The sprint characterizes and anchors; it does not conclude the governs program.
