# BL-029 Sprint Memo: D-Tier Operator Coverage Probe

**Status:** sprint artifact (read-only investigation + classification). No ledger entry, no
evidence obligations. Related: `plan/bl-028-path-finder-memo.md`,
`scrum/GOV-227-d-tier-harmonic-compression-audit.md`,
`docs/D_TIER_TRIADIC_COMPRESSION_THEOREM.md`, `docs/ARCHITECTURE_MAP.md` §1 Layer 1 / §4.

**Landed:**

| Artifact | Role |
|---|---|
| `scripts/build-d-tier-operator-probe.mjs` | Deterministic probe: canon-motivated censuses over the admitted application universe, A-control calibration, pre-registered discriminant assertions, canonical serialization + fingerprint |
| `orrery/src/generated/d-tier-operator-probe.v1.json` | Generated artifact (`status: planning_evidence`) |
| `orrery/scripts/validate-d-tier-operator-probe.mjs` | Independent validator: re-derives every census from the six sources and re-checks the fingerprint |
| `orrery/src/d-tier-operator-probe.test.ts` | Vitest pins: scope, A-control, D–D zero census, modal closure, discriminant verdicts, mediation, fingerprint |
| Wiring | `d-tier-operator-probe:check` added to `orrery:check` / `orrery:build`; root `orrery:d-tier-operator-probe:check` |

Read-only against admitted sources. No bytes changed in `legal-moves.v2.json`, its validators,
`OFFICE_PALETTES`, the `audio.v1` guard, golden-path fixtures, canonical, Court, schemas, or
Neo4j; no edges emitted anywhere; no intra-330 anything; M remains non-walkable.

## 1. Corrected framing

The original capture implied the operators had never touched D-tier. They have: row 1's algebra
is domain-mask-local, not tier-gated. The probe enumerates the **already-admitted** applications
(`operator-applications.csv`: 3,402 rows, 2,520 fixed-degree, 462 modal; zero missing inverses)
and tests whether the canon-motivated subset closes on the 49 D-anchors the way row 2's 60-move
catalog closes on the 21 A-anchors. It re-derives nothing and defines no operators.

## 2. Method

Candidate relations come only from the operator canon: the R2–R7/L2–L7 fixed-degree class that
row 2 projects, and `M` (modal successor), reported separately because row 2 excludes it for
every tier. The A-control runs the identical pipeline over the 21 A-anchors; a D finding is
stated relative to that demonstrated bar. Classification criteria were pre-registered before
execution (memo plan §5): (1) D-analogue, (2) projection-layer, (3) no-structure.

## 3. Report contract

**(a) D–D census.** Fixed-degree applications with both endpoints in the 49 D-anchors: **zero** —
per operator (all twelve at 0), per tier-pair (none), per anchor (all 49 at 0 in, 0 out).
D→A and A→D fixed-degree applications: zero each. This is the full admitted universe, not the
catalog's scope filter: even a hypothetical row-2 scope extension over the 49 D-anchors has no
admitted edges to project.

**(b) A-control calibration: exact.** The same pipeline over the 21 A-anchors reproduces the
committed catalog byte-for-byte by move id: 60 moves, 12 operators, 5 per operator, all 21
anchors as both source and target. Calibration verdict `EXACT`.

**(c) Discriminant check: PASS (boolean).** Over the 49-edge D–D edge set (all operator classes;
the set is exactly the 49 modal applications): every edge preserves tier; every edge preserves
the Forte family; no edge connects the D2/D5 q_v2-multiset twins; no edge connects the D3/D4
Z-partners; every edge preserves the sorted rooted-Q multiset. The one D–D edge class that
exists respects every distinction GOV-227 established.

**(d) D-anchor fixed-degree touches.** 228 out and 228 in, fully inverse-paired and
registry-consistent (degree address, governor, direction), symmetrically distributed: 19 per
operator across all twelve, 38 per governor across degrees 2–7. **Every one terminates in or
originates from a satellite state** (none anchor, none boundary); targets span 15 heptatonic
families, none of them the A families. The A-anchors, for contrast: 180 out (60 anchor + 120
satellite) and 180 in (60 + 120).

**(e) Modal closure (reported separately).** The D-anchors are M-closed: exactly 49 modal
applications, one out and one in per anchor, partitioning into **seven 7-cycles, one per tier**,
tier-, family-, and rooted-Q-preserving; zero modal edges enter D-anchors from non-anchors. The
A-control modal substructure is three 7-cycles. This is L1-global behavior, not a D-tier theorem
implication, and row 2 excludes M for every tier.

**(f) Satellite mediation (descriptive).** Two fixed-degree hops through a satellite connect 40
distinct D→D anchor pairs, 40 D→A pairs, and 40 A→D pairs. Recorded for completeness; satellite
states are outside the row-2 anchor projection.

**(g) Phase entanglement: not detected.** No admitted application carries a phase coordinate;
every census and candidate relation closes in the single-phase application universe. No
topology-candidate motivation was generated.

**(h) Row-9 prior-art check.** Fixed-degree applications never touch degree 1 (R1/L1 are the
root-phase operators and are excluded from the catalog class), so D-anchor R/L applications
preserve the root pitch class — consistent with the substrate's `root_alignment_only` T5
semantics and adding no D-specific root structure
(`seven-governors-court-substrate-v0.1.0/canonical/bridge-rootings.json`).

## 4. Classification: outcome (3), refined

Against the pre-registered criteria:

- **(1) D-analogue — fails.** The D–D subgraph is non-trivial and inverse-closed, but it is
  **single-operator** (M only); the row-2 fixed-degree class contributes zero anchor-to-anchor
  applications. "Multi-operator" is a substantive criterion, not a formality.
- **(2) Projection-layer — fails.** No direct D↔A applications exist. The only cross-boundary
  adjacency is satellite-mediated (40 pairs each way), and satellites are not a projection of
  one anchor tier onto another; no mapping relation is present.
- **(3) No-structure — holds, refined.** The asymmetry is structural and permanent at the anchor
  level. The refinement matters and is itself the finding: the D-anchors are **not structureless** —
  they inherit L1's global M-closure exactly as the A-anchors do, and they participate in R/L
  richly (456 applications), always with satellites. What is absent is **fixed-degree
  anchor-to-anchor closure**, the exact structure row 2 projects. The D-tier compression theorem
  (GOV-227) implies no operator set; its sidecars are descriptive Q/W records with no transition
  fields, and the operators that do apply are L1-global.

**Consequence:** no D-tier row-2 extension is available (there is nothing to project), and the
"row 2 extension or new row" follow-up named in the capture is closed negative. The BL-028
asymmetry label is **confirmed**, with its cause now evidenced rather than defaulted.

## 5. Finder-label recommendation (not implemented here)

`orrery/src/main.ts` currently labels D-anchors "reachable-to via containment; no operator
departure (no catalog coverage)". The probe confirms the label and sharpens the cause for a
future surface change: the absence is not scope-filter incidental, and the departure story is
"none in the catalog; 228 admitted R/L departures land on satellite states outside the anchor
catalog". No UI bytes changed in this sprint; the recommendation is recorded for the next
finder-touch item.

## 6. Boundary-layer framing

This is the boundary layer's first structural interrogation: everything known about D-tier was
admission-level (GOV-227 exists, sidecars quantified); nothing had ever asked the anchors about
their own internal structure. The recorded data point for the governs program and the topology
candidate is a **constraint**: the D-anchor layer's admitted operator structure is single-phase
and M-only; any boundary-layer govern story must live at the satellite/emission level, not via
anchor-level R/L closure. That constrains what the D4/D7 governs can mean without testifying
about them. The topology program keeps its current priority; this probe neither gates nor
motivates it.

## 7. Governance

Planning evidence only. The artifact is byte-stable (fingerprint pinned by its gate and
re-derived by the independent validator), and every census is recomputed from the six admitted
sources. The probe defines no operators, admits nothing, and emits no graph edges; M hops remain
audit demonstrations, never legal walks; G1 is untouched.
