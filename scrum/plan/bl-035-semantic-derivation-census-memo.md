# BL-035 Sprint Memo: Semantic-Derivation Census

**Status:** sprint artifact (two-mechanism read-only census + findings). No ledger entry, no
evidence obligations. Related: `plan/bl-034-orrery-provenance-fix-memo.md`,
`plan/bl-029-d-tier-operator-probe-memo.md`, `plan/bl-021a-signature-analysis-memo.md`,
`scrum/BACKLOG.md` BL-031.

**Landed:**

| Artifact | Role |
|---|---|
| `scripts/build-semantic-derivation-census.mjs` | Deterministic census: claimant classification, strata, conflict inventory, heptatonic baseline, canonical serialization + fingerprint |
| `orrery/src/generated/semantic-derivation-census.v1.json` | Generated artifact (`status: planning_evidence`) |
| `orrery/scripts/validate-semantic-derivation-census.mjs` | Independent validator: re-derives every census from the six sources |
| `orrery/src/semantic-derivation-census.test.ts` | 7 vitest pins: scope, four-way totals, conflicts, strata, pools, direction, fingerprint |
| Wiring | `semantic-derivation-census:check` in `orrery:check` / `orrery:build`; root `orrery:semantic-derivation-census:check` |

Read-only against admitted sources. No topology claims, no G1 movement, no governs
implications, no M-walkability promotion, no legal-move/audio bytes.

## 1. The question and the two mechanisms

The founding design reads the pentatonic layer as **teleological** (kernel meaning carried by
the seed landform pools) and the heptatonic layer as **ontological** (meaning inherited by
office/structural position). The census measures each mechanism with its own instrument:
pentatonic four-way landform-claimant classification via the seven A0 seeds among each node's
21 containment parents; heptatonic office-following baseline from the canonical ledger.

Claimant key is the **seed/office pair**; landforms are the named payload annotations, not the
comparison key. Direction fields (kernel window, seed court content) are recorded; no
Earth-ward/Fire-ward value is assigned (§5).

## 2. Pentatonic census (330)

| Class | Count |
|---|---:|
| single-claimant | 50 |
| multi-claimant-agreeing | **0** |
| multi-claimant-conflicting | 25 |
| zero-claimant | 255 |

Claimant histogram: 0→255, 1→50, 2→20, 3→5 (105 claims over 75 nodes). The pre-registered
distribution is confirmed. **Multi-agreeing is structurally empty**: distinct seeds are distinct
offices, hence distinct pools; the zero was computed by pool comparison, not assumed.

**Conflicts (25):** all are distinct-pool collisions (no shared landform strings anywhere); the
office-pair inventory spans 11 pairs. The five 3-claimant conflicts are exactly the five 5-35
cornerstone positions (`5-35:0/3/5/8/10`) — and those are also exactly the only kernel-window
(non-null) nodes. Deep conflict and windowed structure coincide at the kernel's cornerstone.

## 3. Stratification

| Stratum | Result |
|---|---|
| Census bridges (70) | **all claimed**: 50 single + 20 conflicting |
| Interior (260) | 255 zero-claimant + 5 cornerstone conflicts |
| Windowed (5) | all conflicting (the cornerstone five) |

Boundary-proximity reads cleanly: the bridge layer is universally claimed and carries most
conflicts; the interior is an unclaimed field except where the five cornerstones sit. (The
originally proposed bridge-parent stratum was degenerate — `bridgeParents` is the non-7-35
parent set, ≥18 for every node; the census uses the node's own census-bridge flag instead.)

## 4. Heptatonic baseline (455)

301 office-bearing + 154 boundary (no office). Mechanism: office-following canonical profile
resolution, admitted (`projection:landforms:v0.1.1`, `canonical_reference_projection`;
`compiler.mjs` pool construction; `REFERENCES_LANDFORM`). Each office-bearing node resolves to
exactly one office, so the ontological layer shows **no semantic collisions at the office
level** — single inheritance by construction.

**Comparative finding:** the teleological derivation is collision-prone exactly where the
kernel's shared structure concentrates (bridges and cornerstones), while the ontological
derivation is structurally unambiguous. The two mechanisms behave differently, which is the
founding design's distinction measured rather than asserted.

## 5. Direction: recorded fields, unassigned value

The bipolar (Earth-ward/Fire-ward) reading was investigated and **not derivable from admitted
records**: `kernelWindows` is null for 90 of 105 entries (non-null only at the five
cornerstones, one per claimant); seed court content is a contiguous C-range per seed (Saturn
{C4} … Sun {C0}), not a direction; `modeContext` carries modal readings only; brightness and
κ are proposed/unadmitted. The artifact records `directionAssigned: false` with the admitted
directional fields carried per claim. This is a **third finding row-class**: the cornerstone
layer's directional semantics are unrecorded. Any future direction rule needs a canon source or
ships probe-derived with its own justification.

## 6. Findings inventory

1. **Multi-agreeing empty** (structural, pre-registered).
2. **Conflicts concentrate at the shared structure**: 20 of 25 at bridges, 5 at cornerstones.
3. **The 255-node zero-claimant gap** — the derivation gap any multi-hop transport must address;
   the coverage map is the artifact's `zero-claimant` records.
4. **Heptatonic inheritance is collision-free at office level** (single-office resolution).
5. **Directional semantics unrecorded** (third finding row-class; negative derivability result).

## 7. Feeds and governance

Feeds BL-031 multi-hop transport design (gap map + collision inventory + the BL-034 surface
fix as the trustworthy recording layer) and gives the teleology/ontology design its first
measured comparison. Planning evidence only; validator re-derives every number from the six
admitted sources; fingerprint pinned by its gate.
