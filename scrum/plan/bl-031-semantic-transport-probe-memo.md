# BL-031 Sprint Memo: Semantic Multi-Hop Transport Probe (Phase 2)

**Status:** sprint artifact (generated artifact + independent validator + findings). No ledger
entry, no evidence obligations, no claims admitted. Related:
`plan/bl-035-semantic-derivation-census-memo.md`, `plan/bl-034-orrery-provenance-fix-memo.md`,
`plan/bl-028-path-finder-memo.md`, `plan/bl-030-d-cycle-demonstration-routes-spec.md`,
`scrum/BACKLOG.md` BL-031.

**Landed:**

| Artifact | Role |
|---|---|
| `scripts/build-semantic-transport-probe.mjs` | Deterministic probe builder: reachability frame, 1,750-query transport population, route geometry, target consistency analysis, BL-028 ground-truth re-checks, boundary-layer records, canonical serialization + fingerprint |
| `orrery/src/generated/semantic-transport-probe.v1.json` | Generated artifact (`status: planning_evidence`; 1,750 queries, 330 targets; fingerprint `9138a7ab…`) |
| `orrery/scripts/validate-semantic-transport-probe.mjs` | Independent validator: re-derives every query, route, comparison, ground-truth check, and boundary record from the five sources |
| `orrery/src/semantic-transport-probe.test.ts` | 8 vitest pins: scope, reachability, coverage, overlap inventory, controls, ground truth, boundary layer, fingerprint |
| Wiring | `semantic-transport-probe:check` in `orrery:check` / `orrery:build`; root `orrery:semantic-transport-probe:check` |

Read-only against admitted/generated sources. No topology claims, no direction assignment, no
G1 movement, no governs implications, no M-walkability promotion, no catalog promotion, no
legal-move/audio/canonical byte changes.

## 1. What was built and the authority classes

The probe carries the seven A0 seed landform pools over the BL-028 composed graph (operator
edges among the 21 A anchors + 6,930 containment pairs; no intra-330 adjacency exists — G1
stays shut) into the 330-node pentatonic space at minimal-hop distances 2 and 3, and measures
arrival consistency across alternative routes and origins. Three operationalizations are kept
separate and authority-classed in the artifact:

- **(a) verbatim landform-pool carry** — origin admitted (`projection:landforms:v0.1.1`),
  arrival derived (probe-measured); the primary operationalization, extending BL-035's
  pool-comparison logic to k-hop;
- **(b) office identity** — canonical office resolution (ledger + profiles); element identity
  excluded (authored correspondence, partial: Sun/Moon null);
- **(c) structural geometry** — route signatures only (bridge profile, kernel-window touches,
  heptatonic family span); zero semantic authority.

**Decisions taken under the build authorization (the planning pass's recommended defaults):**
office-only for (b); (a)+(c) primary with (b) as comparison; collision nodes included and
reported separately; no catalog-schema additive def (transport records are not catalog paths);
scope note: this build is the semantic transport probe under BL-031, it does not touch the
Phase-A seam/equivariance program in `BACKLOG.md:343-395` (separately gated).

## 2. Reachability frame (pre-registered, fail-loud on deviation)

Every seed reaches 15 pentatonic nodes at distance 1 (its own subnodes), 30–40 at distance 2,
210–220 at distance 3, and 65 remain at distance ≥ 4. Aggregate:

| Frame | Result |
|---|---|
| Query population (seed, target) at distance 2–3 | **1,750** (250 per seed) |
| S1 gap penetration (zero-claimant targets) | 1,456 queries (80 at d2, 1,376 at d3) |
| S2 collision targets (multi-claimant) | 84 queries |
| S2b secondary arrivals (single-claimant targets) | 210 queries |
| Targets reachable within 3 hops | 330 / 330 |
| Targets receiving ≥ 2 distinct seed origins at d2–3 | **330 / 330** |

Origin-count distribution across the 330 targets: 2 origins → 12; 3 → 36; 4 → 50; 5 → 63;
6 → 80; 7 → 89. Every pentatonic node in the topology is a multi-origin node within three
hops — there is no semantically single-sourced target in the transport frame.

## 3. Findings

1. **The derivation gap is transport-covered but semantically contested.** All 255 zero-claimant
   nodes receive ≥ 2 offices' transport within 3 hops (zero-claimant combined-origin counts:
   3 → 18, 4 → 31, 5 → 47, 6 → 70, 7 → 89). Multi-hop transport does not fill the gap with one
   meaning; it arrives multiply.
2. **Multi-hop transport can only deepen one-hop collisions, never resolve or reproduce them.**
   Structural: transport origins are at distance ≥ 2, census claimants at distance 1; the sets
   are disjoint by construction. All 25 conflict targets are deepened (combined-origin counts
   4 → 4, 5 → 8, 6 → 8, 7 → 5). Resolution would require an admitted semantic rule and is
   pre-registered as unexpected; none occurred.
3. **All 50 single-claimant nodes acquire second origins.** Combined-origin counts: 3 → 6,
   4 → 10, 5 → 12, 6 → 12, 7 → 10. Under transport, BL-035's single-claimant class is a
   one-hop artifact.
4. **The five 5-35 cornerstones are the deepest collision nodes in the frame.** Combined-origin
   counts: `5-35:10` receives **all seven offices** (claimants Jupiter/Mars/Mercury + transport
   Moon/Saturn/Sun/Venus); `5-35:3` and `5-35:5` reach 6; `5-35:0` and `5-35:8` reach 5.
5. **Cross-office pool consistency holds exactly to the admitted overlap inventory.** 4,546
   pairwise comparisons: 3,926 disjoint, **620 overlapping**, 0 identical, 0 subset. The only
   intersecting pool pairs are `Jupiter–Sun` (`plains`), `Mars–Saturn` (`cliffs`),
   `Mercury–Moon` (`estuaries`) — one shared string each. 287 of 330 targets are touched by at
   least one overlapping pair. No deviation outside the inventory occurred (fail-loud check
   passed); verbatim carry is lossless.
6. **Route plurality is the norm, and routes diverge geometrically.** 4,770 delivered paths
   across 1,750 queries; 1,510 queries deliver divergent alternative routes; 460 queries have
   ≥ 26 minimal paths (capped at the 25-path budget). Minimal-path counts: 1 → 240,
   6 → 834, 7 → 96, 8 → 108, 10 → 12, capped → 460. Geometry: 3,786 delivered paths cross a
   bridge, 4,650 cross a heptatonic family boundary, 737 touch a kernel window. Same-origin
   multi-route payloads are identical by construction (control, never a finding).
7. **BL-028 ground truth reproduces through the transport machinery.** Seam `7-35:3 → 7-32:0`:
   exactly 5 minimal crossings (`5-20:0B`, `5-23:0`, `5-25:0`, `5-27:0`, `5-29:0B`); under the
   admitted-bridge filter exactly `5-23:0`/`5-27:0`. Mode axis `7-35:0 → 7-35:3`: exactly
   7 minimal paths including the L-chain, with the 3-path delivery cap flagged truncated.
8. **Boundary layer recorded as non-traversable geometry.** The seven `d-cycle:D1–D7` exhibit
   routes (BL-030) close over seven M edges each; M is audit-real but not in the committed
   legal-move catalog, so no alternative-route enumeration exists. Each route node carries its
   15 pentatonic subnodes' class histogram and bridge counts; D-tier transport semantics do not
   apply (no native pools, no office seating per BL-029).

## 4. Pre-registration and fail-loud discipline

Pre-registered before execution (artifact `preRegistration`): four-way pool comparison; the
source-derived overlap inventory; the disjoint-else-overlapping cross-office rule; the
same-origin control; the deepen-never-resolve collision rule; exact minimal-path counting
(capped means ≥ 26 under the 25 budget); direction unassigned. The builder fails loud on any
deviation; the validator re-derives every number from the five sources and independently
reproduces the query population, all delivered routes, all comparisons, the ground truth, and
the fingerprint.

## 5. Governance and scope

Planning evidence only. G1 untouched (no intra-330 field is emitted, rendered, or consumed).
Direction remains unassigned (BL-035's negative result carried, not revisited). No catalog
promotion: transport records are probe evidence, not `golden-path.v1` paths; any future
promotion runs the BL-023 ceremony (audition + recorded verdicts). No topology claims; the
phase-structure question stays a separate future candidate. D4/D7 untouched; INV-5 not
graduated; M-walkability not promoted; no legal-move, audio, or canonical bytes changed.

**What this build does NOT accomplish:** it does not assign directions; does not close G1 or
assume intra-330 edges; does not produce governs findings; does not land any semantic delta as
canonical (arrivals are derived, per the v0.1.1 mutation policy); does not promote routes into
the catalog; does not adjudicate `ARCHITECTURE_MAP.md` §2.5 meanings; does not resolve the
BACKLOG Phase-A lattice program.

**Open items for maintainer (from the planning pass, still open):** element identity inclusion
(currently excluded); whether any transport-derived record should ever enter the catalog via the
BL-023 ceremony; disposition of the `golden-path-catalog.schema.json` version-const anomaly
(content carries v1.1 defs; const still reads `golden-path.v1`).
