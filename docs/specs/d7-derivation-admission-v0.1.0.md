# D7 First-Derivation Admission — Candidate Record

| Field | Value |
|---|---|
| Artifact ID | `SPEC-D7-DERIVATION-001` `[DEFINED]` |
| Version | 0.1.0 `[DEFINED]` |
| Status | Admitted; the authority for that status is the admission ledger entry (ENTRY 22) and the compliance receipt (`qa/specs/bl-091-d7-derivation-admission.json`), not this header. `[DEFINED]` |
| Claim Class | Canonical admission, TIERING claim-catalog class 2 (`docs/TIERING.md:18-20`) `[DERIVED - docs/TIERING.md:11-24]` |
| Work Item | `BL-091` (verified next-free at execution). Artifact ID `SPEC-D7-DERIVATION-001` is distinct from the ticket ID. `[DEFINED]` |
| Authority | None by this text; authority flows from the admission ledger entry (ENTRY 22) and the compliance receipt (`qa/specs/bl-091-d7-derivation-admission.json`). `[DEFINED]` |
| Release Status | No gate is cleared and no green integrated release is claimed. `[DEFINED]` |
| Provenance | The D7 corridor: BL-068 (the asymmetry investigation; GSL-3) → BL-070 (the derivation attempt; PARTIAL_DERIVATION) → BL-078 (the re-test under isolation; REPLICATED) → BL-089 (the anchoring-remainder interaction; INTERACTION_DERIVED) → BL-090 (the office-purity derivation; FULL_DERIVATION). The coordinate chain: BL-063/BL-064/BL-066 (the un-granting program); BL-075/BL-076 (the coordinate algebra). The D4 corridor (BL-055 → BL-057; ENTRY 15/18) is sibling context, not input. `[DERIVED - cited sprint records]` |
| Charter | TIERING claim-catalog class 2 (`docs/TIERING.md:11-24`); the D7 amendment question, noted as open at BL-078/BL-090, answered here. This record does not amend SPEC-001, SPEC-GOVERNS-DERIVABILITY-001, ENTRY 10, ENTRY 15, ENTRY 16, ENTRY 17, or ENTRY 18. `[DERIVED - cited records]` |
| Fencing Class | Candidate record only. No GOVERNS authority, runtime, topology-effect, Court-runtime, graph, policy, or promotion authority. `[DEFINED]` |
| Content Digest | External-only; no in-document self-hash. `[DEFINED]` |

## Revision History

`[DEFINED]` Version labels identify candidate text, not an assertion of completed admission.

| Version | Change |
|---|---|
| 0.1.0 | Initial candidate for maintainer §6 review. Any admission-time correction bumps the version with a row; the reviewed-baseline digest and the authorized delta are recorded in the receipt (ENTRY 12 precedent). |

## 0. Scope, Fencing, and Evidence Discipline

### 0.1 Claim boundary

`[DEFINED]` This record proposes the admission of one bounded object: the
**derivability of the D7 contact geometry via the office-purity route**, per the BL-090
execution's `FULL_DERIVATION` result. It does not restate, amend, or re-derive the D7
GOVERNS relation's semantics, its authority, or its role; it does not amend the D4
record (`derivable-from-derived-inputs`; ENTRY 18) or any other record. The D7
hypothesis-tier finding's evidence (BL-068/BL-070/BL-078; GSL-3) remains cited; the
resolution is additive.

### 0.2 Evidence-class tags

`[DEFINED]` The convention tags apply: `[DERIVED - citation]` for facts supported at the
cited record's scope, `[DEFINED]` for constructs and rules with no prior admission, and
`[GATED - condition]` for the unresolved admission itself. An untagged claim is void.

### 0.3 Non-effects

`[DEFINED]` Admission of this claim would not change runtime behavior, canonical
topology, schemas, Court runtime, Neo4j projection, graph, or policy. It would not change
the D7 GOVERNS relation's formal status in the machinery (the claim is about
derivability — how the relation can be constructed — not about what the relation means
or what authority it carries; the GOV-524/525 distinction), would not amend D4's
`derivable-from-derived-inputs`, would not dissolve the boundary wall (the derivation
operates within the modal-orbit structure, not through the wall), would not move G1,
would not graduate INV-5, would not move section 6(4), would not promote M-walkability,
would not assign directional semantics, and would not resolve the anchoring remainder
(the office field is consumed as a licensed input — through the recovered coordinates,
never through the granted labels). It would not amend SPEC-001, clear a release gate, or
refresh any shared artifact beyond the landing's own inventories.

## 1. The Claim

### 1.1 Claim statement

`[DEFINED — admission proposed]` (admitted per ENTRY 22) The claim, verbatim:

> **Claimed:** the D7 contact geometry — 14 same-office contact keys, 7 D₇ anchors × 2
> D6 satellites each, within the 36-instance anchor-satellite domain (per-anchor
> 4/5/6/6/6/5/4) — is **derivable via the office-purity route**: the selection predicate
> `o(s) = o(h)` (same-office), grounded in the recovered coordinates κ (BL-063's office
> reconstruction, κ₁ 7/7), consuming the derived cycle-ground (BL-064's sandwich +
> twin-closure construction) and the derived R-edges (BL-066's H2-reach + H8-census
> closure), per the BL-090 execution's FULL_DERIVATION result (all pre-registered gates
> V-D7D-1 through V-D7D-5 PASS; calibration EXACT; the 14-key contact set set-equal O;
> the 36-instance domain re-derived set-equal BL-068 + BL-070).

### 1.2 Scope precision — what is claimed, what is not

`[DEFINED]` **Claimed:** the D7 contact geometry is derivable via the office-purity
route, per the BL-090 execution — the derivation consumes the recovered coordinates κ,
the derived cycle-ground, and the D6-satellite domain, and generates exactly the 14
same-office contacts. The 14-key contact set is set-equal to the landed seat-contact
rows (`O`) under the anchor rule and under the affine-transport cross-check; the granted
office labels never enter the derivation path.

**NOT claimed (binding):** the D7 GOVERNS relation's *semantics* (what the relation means
in the framework); the D7 relation's *authority* (the formal status in the machinery is
unchanged); any *wall dissolution* (the D-tier boundary wall stands; the D7 derivation
operates within the modal-orbit structure, not through the wall); any *D4 implication*
(D4's `derivable-from-derived-inputs` and D7's derivation are independent results); any
*INV-5 / section 6(4) / M-walkability* movement; any *anchoring-remainder resolution*
(the office field is consumed as a licensed input, not derived — the anchoring
remainder stands).

## 2. Exclusions (binding)

`[DEFINED]` This record claims exactly the D7 contact geometry's derivability via the
office-purity route, per the BL-090 execution — no more. Excluded:

- No GOVERNS admission; no D7 GOVERNS semantics, authority, or role — derivability is
  admitted, not the relation's runtime/canonical/semantic status.
- No wall dissolution (the wall holds; the derivation operates within the modal-orbit
  structure).
- No D4 implication: the D4 corridor's results (`derivable-via-R2`, ENTRY 15;
  `derivable-from-derived-inputs`, ENTRY 18) are independent, unchanged, and standing;
  neither corridor supersedes the other.
- No G1 movement; no INV-5 graduation; no section 6(4) movement; no M-walkability
  promotion; no directional-semantics assignment.
- No anchoring-remainder resolution: the tier/role partition and the GOVERNS edge
  content remain licensed inputs; the one orientation constant (`C = 4`, κ's named bit)
  and the presentation conventions remain carried; the office field is consumed through
  the recovered coordinates, never through the granted labels.
- No hypothesis-tier erasure: D7's hypothesis-tier status is superseded **additively**
  by the derivation status; the hypothesis-tier finding's evidence (BL-068, BL-070 —
  co-cited as historical context and obstruction record, not superseded science — and
  BL-078; GSL-3) remains cited.
- No canonical/Court/schema/Neo4j writes beyond the landing's own; no release promotion
  or green-release claim.
- The frame (`scrum/plan/harmonic-comprehension-map.md` sections 2.6–2.7) is
  interpretation vocabulary; session prose is context, not evidence.

## 3. Evidence

### 3.1 The execution (BL-090)

`[DERIVED - qa/bl090 execution receipt; corridor chain]` The load-bearing evidence is
the BL-090 derivation artifact: `orrery/src/generated/bl090-d7-office-purity-derivation.v1.json`
(`derivationFingerprint` `656aa20a…`; raw-byte SHA-256 `145077a5…`), with its generator
(`scripts/build-bl090-d7-office-purity-derivation.mjs`), its independent validator
(`orrery/scripts/validate-bl090-d7-office-purity-derivation.mjs`; 49 mutation probes
rejected; the two-sided static region check), its pins
(`orrery/src/bl090-d7-office-purity-derivation.test.ts`; 13 tests), and its memo
(`scrum/plan/bl-090-d7-office-purity-derivation-memo.md`). The result:

- **V-D7D-1 PASS (domain):** the 36-instance domain re-derived (per-anchor 4/5/6/6/6/5/4,
  14 distinct states, multiplicities 2/2/10), set-equal BL-068 + BL-070 key-by-key.
- **V-D7D-2 PASS (calibration):** R-OFF `[office(s) = office(h)]` on the granted labels
  reproduces the 14 landed contacts exactly (14/0/0/22; set-equal to the seat-contact
  rows).
- **V-D7D-3 PASS (κ-grounding):** the selection `o_κ(s) = o_κ(h)` on the κ-recovered
  field emits the 14 contacts, set-equal at 14/0/0/22 under M1 (the anchor rule
  `office = (C − pcSum) mod 7` with `C = 4` + governing inherit; recovered field 28/28;
  κ₁ 7/7; midpoints 7/7) and under M2 (the affine transports T1 `y = 5x + 2` and
  T2 `y = 2x + 4` from the κ₁ positions; D7-pole offices 7/7 + 7/7) — the κ-verdict
  **BOTH**, over-determined on the D7 pole. The one structural non-equivalence is the
  D6 pole's A1↔D6 office transport (non-affine; the exact defect is the route-affine
  law composed with the terminal-office source swap {0, 6}, zero residual); the declared
  residue — the anchor rule — carries that pole.
- **V-D7D-4 PASS (isolation):** zero granted-office bytes in the derivation path
  (region-scoped, validator-enforced; the comparison region carries the office reads —
  the region-scoping proof).
- **V-D7D-5 PASS (accounting):** the three tiers complete and honest (masks-only;
  canonical-computation labelled; remaining granted — the tier/role partition, the
  GOVERNS edge content, `C = 4`).
- **Controls:** the Z-interface guard NON_SEPARATING 4/2/10/20, field-for-field equal to
  BL-068 (Z-majority states 191, 253, 2017, 4001); no promotion on any outcome. The
  orbit-alignment restatement (discovery D-90-1) recorded un-promoted (separation ≠
  derivation; OD-70-5/OD-N2 class), branch-effect none.

### 3.2 The corridor chain

`[DERIVED - cited sprint records]` Each link verified at its landing; fingerprints as
recorded in the artifacts and the BL-090 chain self-checks:

| Link | Artifact | Fingerprint |
|---|---|---|
| The asymmetry investigation (BL-068; GSL-3) | `orrery/src/generated/bl068-d7-asymmetry.v1.json` | `b0d65bd6…` |
| The derivation attempt (BL-070; PARTIAL_DERIVATION) | `orrery/src/generated/bl070-d7-derivation.v1.json` | `9db10a08…` |
| The re-test under isolation (BL-078; REPLICATED, R_NONE) | `orrery/src/generated/bl078-d7-retest.v1.json` | `11644d40…` |
| The anchoring-remainder interaction (BL-089; the license) | `orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json` | `eb1526be…` |
| κ — the office reconstruction (BL-063; Phase 1) | `orrery/src/generated/bl063-office-reconstruction.v1.json` | `6d33c67b…` |
| The cycle-ground (BL-064; Phase 2) | `orrery/src/generated/bl064-cycle-ground.v1.json` | `aa975820…` |
| The R-edges (BL-066; Phase 3) | `orrery/src/generated/bl066-r-edge-derivation.v1.json` | `94f0661f…` |
| The coordinate algebra (BL-075; Klein-4) | `orrery/src/generated/bl075-coordinate-search.v1.json` | `88838e22…` |
| The family-level involution (BL-076) | `orrery/src/generated/bl076-bijection-probe.v1.json` | `81e6cf72…` |

### 3.3 The D7 domain's characterization

`[DERIVED - cited sprint records]` The 36-instance anchor-satellite domain: 7 D₇
anchors × the Hamming-2 reach of the 7-2 class; per-anchor 4/5/6/6/6/5/4 (emergent from
the uniform 30-per-anchor all-ledger reach); 14 distinct states, multiplicities 2/2/10;
14 recorded same-office contacts + 22 unrecorded modal-neighbour instances (every
unrecorded instance at office delta ±2 mod 7, 11+11). The Z-interface axis is
NON_SEPARATING (4/2/10/20); the class predicate restates over the domain (36/36); the
office condition is the sole clean separator (14/0/0/22). The domain re-derives
set-equal in BL-090 (V-D7D-1). The D4 corridor's sibling facts are context, not input:
D4's 28-key granted domain, class predicate `[forte = '7-27']`, clean 14/14.

### 3.4 GSL-3 and the coordinate structure

`[DERIVED - cited sprint records]` GSL-3 (BL-068; registered BL-069): the fa/ti
asymmetry's mechanism is predicate-axis divergence — different predicates over different
domain multiplicities: the fa-pole selects via set-class identity over a two-class
office-flat domain; the ti-pole's contact relation is class-exhaustive and office-pure
over the single-class D6 domain, the office condition the sole clean separator. With
this admission, **both predicates carry derivability status**: D4's via the admitted R2
route (ENTRY 15/18), D7's via the office-purity route grounded in the recovered
coordinates (BL-090; this record). The coordinate relationship (BL-075/BL-076):
canonically determined (the unique affine map `u = 5`); the family-level involution and
the office-level action carry the tier↔family correspondence whole — registered
evidence in the GOV-525 admission's orbit, cited here as structural context for the
mapping routes (M1/M2), not as part of the claimed sentence.

## 4. Rejected Alternatives

### 4.1 The D4-analogue route — rejected by the three obstructions

`[DERIVED - BL-070/BL-078]` The literal D4-predicate analogue `[forte = '7-27']`
selects 0/14: D7's contact satellites are set class 7-2 (input-level class asymmetry).
The domain-class predicate `[forte = '7-2']` selects 14/14 = U = O — a full-domain
restatement (the C2 guard), never a selective derivation. The cycle-twin verification is
0/7: every modal edge is an exact rotation (11×6 + 6×1) but does not transport to the
D4 verification set {1, 2} — an interval-transport failure, not a rotational absence
(BL-070's bounded refinement; OD-70-6; replicated at BL-078 under region-scoped
isolation). The three obstructions individually and jointly reject the analogue route.

### 4.2 The mask-geometric selection — rejected by the nine-candidate battery

`[DERIVED - BL-070/BL-078]` The nine pre-registered mask-geometric candidate
predicates (C-M1…C-M9) were evaluated on the 36-instance domain: `cleanSplitCount 0`;
the best candidates are near-misses (12/0/2/22) missing exactly the terminal tritone
contacts 127:253 and 4033:2017. The min-|Δ| + census composite (14/0/0/22, C-TB-1 /
C-TB-R1) is recorded **un-promoted** (separation ≠ derivation; OD-70-5/OD-N2). The
battery's verdict (`NO_PRE_REGISTERED_CLEAN_SPLIT`; interpretation `R_NONE`) is
replicated exactly at BL-078. The mask-geometric selection is thereby rejected as the
derivation's route; the office-purity route is the corridor's completed alternative.

## 5. Falsifiability (pre-registered)

`[DEFINED]` The admission is falsifiable; the standing refutation tests:

- **A contact outside the 14 that satisfies the office-purity predicate** → the
  derivation is incomplete (the selection rule is under-specified).
- **A recorded contact that violates the office-purity predicate** → the derivation is
  wrong (the selection rule is over-specified).
- **The D₇ orbit's geometry changing under new canonical data** → the derivation's
  ground shifts; re-derivation required.
- **The anchoring remainder expanding** (a new granted dependency discovered) → the
  conditional-green status is revised (the remaining-grant verification re-run).

## 6. Modeling Significance

`[DEFINED]` The ti-pole's selection is **office-pure**, confirmed by a κ-grounded
derivation: the D7 contact geometry follows from masks + the licensed tier/role
partition and GOVERNS edge content + the recovered coordinates — the granted office
labels demoted to comparison target and control. This is the **first derivation
admission for a pole-level contact relation**. With it, both poles' contact relations
carry derivation status on the record: D4 `derivable-from-derived-inputs` (ENTRY 18),
D7 `derivable-via-R2-office-purity` (ENTRY 22). The fa/ti asymmetry is fully
characterized at the derivation level — different predicates, different domain
multiplicities, both derivable; GSL-3's mechanism now carries both predicates'
derivability status, and the semantic difference between the poles' predicates remains
framework-declared, not derived. The D7 hypothesis-tier status is superseded additively
by the derivation status; nothing is erased.

## 7. Landing Form

`[DEFINED]` On admission, the ceremony lands atomically: this record (v0.1.0); the
compliance receipt `qa/specs/bl-091-d7-derivation-admission.json`; the ledger entry
(ENTRY 22); the BL-059 scoping-memo accretion (section 4.14) and the comprehension-map
and synthesis consumption rows; the backlog registration; and refreshed root
inventories. Any admission-time correction bumps this record's version with a revision
row (ENTRY 12 precedent).
