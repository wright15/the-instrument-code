# BL-021a Sprint Memo: Parallel-Signature Analysis

**Status:** sprint artifact (findings memo). No ledger entry, no evidence obligations.
Read-only analysis over the landed bipartite containment matrix
(`scrum/plan/bl-021-hypergraph-memo.md`, `scrum/plan/bipartite-inclusion-spec-v1.4.md`).

**Landed:** generator `scripts/analyze_parallel_signatures.py` (625 lines); artifact
`derived/hypergraph/parallel-signatures-v1.json` (`status: planning_evidence`, 220,611
bytes, sha256
`bec45d0a4324530e0976daedfe2b9e1dd0ea63e3097eb75778aea0eccaec4128`); test suite
`tests/test_parallel_signatures.py` (12 tests, green). Manifest regenerated (1,163
files). The artifact is discovered by `scripts/build-manifest.mjs` like any tracked
file.

## What this measures

For each of the 330 anchored pentatonic nodes, the 21 concrete `parentsRooted` edges of
`derived/hypergraph/bipartite-inclusion-v1.json` are re-expressed as a per-voicing
profile:

- `signature` — parent set-class multiplicities, Σ = 21;
- `distinctFamilies` / `maxFamilyMultiplicity` — scalar concentration summaries;
- `diatonicParents` / `diatonicParentCount` — the anchored 7-35 parents;
- `bridgeParents` — the non-7-35 parents;
- `kernelWindows` — for each diatonic parent, the registered court position (C0–C4)
  equal to the node's concrete pc-set, or `null`;
- `modeContext` — the three modal readings below, one entry per diatonic parent.

No containment is recomputed; parent classes are read from `heptatonicNodes`, never
parsed from node IDs, so orientation-B IDs are safe.

## The C-major named case: `5-35:0` (`{0,2,4,7,9}`)

Signature (from the artifact):

```text
{7-20:2, 7-23:4, 7-24:2, 7-25:2, 7-27:4, 7-29:2, 7-34:1, 7-35:3, 7-Z12:1}  Σ=21
distinctFamilies=9, maxFamilyMultiplicity=4
```

The three diatonic parents and the added pairs that complete them:

| Parent | Collection | Added | Mode at root C | Reading |
|---|---|---|---|---|
| `7-35:0` | `[0,2,4,5,7,9,11]` | `{5,11}` | Ionian | parallel parent C-rooted |
| `7-35:5` | `[5,7,9,10,0,2,4]` | `{5,10}` | Mixolydian | parallel parent C-rooted |
| `7-35:7` | `[7,9,11,0,2,4,6]` | `{6,11}` | Lydian | parallel parent C-rooted |

All three `kernelWindows` entries are `C0`: the node is the registered court position
C0 (`court-rooted-positions.json`), contained concretely in each diatonic parent.

## The three modal readings, separated

One underspecified sentence once conflated three different relations. The artifact
carries each separately per diatonic parent; they are never combined:

| Field | Reading | Test for `5-35:0` / `7-35:0` | Result |
|---|---|---|---|
| `parallelModes` | **C** — the parent collection named at the node's root | mode of `7-35:0/5/7` at tonic 0 | Ionian, Mixolydian, Lydian |
| `kernelTonicModes` | **B** — the parent's modes at its three 5-35 kernel tonics | kernel tonics `{0,5,7} ⊂ 7-35:0` | Ionian, Lydian, Mixolydian |
| `relativeModesInP` | **A** — the parent's modes at the node's five pcs | tonics `{0,2,4,7,9} = P` | five: Ionian, Dorian, Phrygian, Mixolydian, Aeolian |

Hard ban, enforced in-generator and re-pinned in tests: `5 ∉ {0,2,4,7,9}`. The kernel
tonics of `7-35:0` are members of the *parent* (`{0,5,7} ⊂ 7-35:0`), not of the
pentatonic node; Reading A yields five modes and is never the source of the triple.
Readings B and C produce the same three names by different routes — both reduce to the
sliding-window structure — which is why they were easy to conflate and why they are
emitted as separate fields.

Cornerstone signature invariance: all five anchored 5-35 nodes (`5-35:0/5/10/3/8`, the
registered C0–C4 positions) share the same abstract signature
(`{7-20:2, 7-23:4, 7-24:2, 7-25:2, 7-27:4, 7-29:2, 7-34:1, 7-35:3, 7-Z12:1}`) and each
has exactly 3 diatonic parents.

## Bridge span census (H2)

Of the 70 `isBridge` nodes: **55** span both 7-35 and 7-32; **15** span 7-35 without
7-32. Span is an inclusion test over the families touched, not an exact-pair test.
Per class (family counts computed from the artifact):

| Class | Nodes | Families spanned | Includes 7-32 |
|---|---|---|---|
| 5-20 | 10 | 16 | yes |
| 5-23 | 10 | 15 | yes |
| 5-24 | 10 | 18 | no |
| 5-25 | 10 | 16 | yes |
| 5-27 | 10 | 16 | yes |
| 5-29 | 10 | 17 | yes |
| 5-34 | 5 | 12 | no |
| 5-Z12 | 5 | 12 | yes |

The two non-7-32 bridge classes are `5-24` (18 families, the widest span in the
census) and `5-34` (12 families). The admitted vocabulary (`5-23`, `5-27`) both carry a
7-32 parent, consistent with the Andalusian seam.

## Distributions

- Distinct-family histogram over all 330 nodes:
  `{7:10, 9:10, 10:5, 11:5, 12:40, 13:10, 15:50, 16:90, 17:50, 18:60}` (Σ = 330).
- Diatonic-parent-count distribution: `{0:255, 1:50, 2:20, 3:5}` — reproduces
  `EXPECTED_5_TO_7_35_DISTRIBUTION` in `scripts/generate_hypergraph_matrix.py`.
- Class-level Tn-diversity distribution over the 66 pentatonic Tn orbits:
  `{13:2, 15:2, 16:1, 17:4, 18:5, 19:4, 20:39, 21:9}` — matches the anchored hand
  script's `{21:9, 20:39, 19:4, 18:5, 17:4, 16:1, 15:2, 13:2}` exactly. Every orbit
  has 5 anchored members.

## H1 verdict: spread and concentration are coupled

Correlations across the 66 Tn orbits (`metadata.concentrationCorrelations`):

| Pair | Pearson | Spearman |
|---|---|---|
| tn-diversity vs distinct families | +0.788320 | +0.696308 |
| tn-diversity vs max family multiplicity | −0.639013 | −0.727789 |
| distinct families vs max family multiplicity | −0.428625 | −0.598682 |

Verdict: supported. Classes whose parent clouds touch more Tn orbits are flatter
(more families, lower per-family multiplicity), and concentrated classes touch fewer.
The cornerstone (`5-35`, tn-diversity 15, 9 families, max multiplicity 4) sits at the
concentrated end; the most spread classes are at tn-diversity 21. The correlation is
a coupling, not a theorem; the memo records it as such.

## H3 verdict

The five 5-35 nodes each have exactly 3 anchored diatonic parents (the sliding-window
rooted count), and the per-node counts aggregate to `{0:255, 1:50, 2:20, 3:5}`. For
non-cornerstone classes the count varies and is pinned only by the aggregate
distribution.

## Serving BL-021 and BL-031

- **BL-021:** the golden path's origin `5-35:0` now has a route-pricing row: 3 diatonic
  parents (`7-35:0/5/7`), the two admitted-class junctions in its signature
  (`5-23`, `5-27`), and the C0 window label in each parent.
- **BL-031:** the per-node `signature` table is the transport probe's pricing map —
  paths through high-multiplicity families versus rare ones are the interesting
  consistency cases.

## Scope and governance

- Pentatonic side only (330 nodes). The heptatonic mirror (`subnodeFamilyProfile`) is
  deferred; it is derivable by bipartite inversion from the same edges — a small
  extension if BL-031's probe needs parent-side signatures directly.
- `status: planning_evidence`; canonical JSON (sorted keys, compact separators,
  trailing newline), no timestamps; `sourceBindings` record the sha256 of the
  bipartite artifact and the court-positions registry.
- `_self_validate` fails loud on any histogram/diversity/census drift; a first-run
  mismatch would be treated as a finding (artifact or expectation wrong), not
  smoothed.
