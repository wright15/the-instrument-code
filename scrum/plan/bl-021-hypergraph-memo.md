# BL-021 Prerequisite Sprint Memo: Bipartite Containment Matrix

**Status:** sprint artifact (findings memo). No ledger entry, no evidence obligations.
Spec: `scrum/plan/bipartite-inclusion-spec-v1.4.md`.

**Landed:** generator `scripts/generate_hypergraph_matrix.py`; artifact
`derived/hypergraph/bipartite-inclusion-v1.json` (`status: planning_evidence`, 320,972
bytes, sha256 `903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41`);
test suite `tests/test_bipartite_inclusion.py` (12 tests, green). Manifest regenerated;
`derived/` is picked up by `scripts/build-manifest.mjs` with no exclusion change.

## The census (the number we came for)

**`bridgeCensus.totalBridgeSubnodes = 70`** — of 330 anchored pentatonic subnodes:

| Class | Bridges | Reading |
|---|---|---|
| 5-23 | 10 | admitted bridge vocabulary |
| 5-27 | 10 | admitted bridge vocabulary |
| 5-20 | 10 | multi-family (diatonic + non-diatonic parents) |
| 5-24 | 10 | multi-family |
| 5-25 | 10 | multi-family |
| 5-29 | 10 | multi-family |
| 5-34 | 5 | multi-family |
| 5-Z12 | 5 | multi-family |

Definition: `isBridge` = not 5-35, with at least one anchored 7-35 parent **and** at least
one anchored non-7-35 parent (a junction across the diatonic boundary). This is the
meaningful reading of §4.3's "multiple 7-note parents (7-35 and 7-32)".

Additional census numbers:

- **Literal orbit-span total: 330.** Every anchored pentatonic has exactly 21 anchored
  heptatonic parents (any 7-superset of a set containing pc 0 also contains pc 0), so the
  literal "parents span more than one Tn orbit" test flags every subnode. The artifact
  records this as `metadata.orbitSpanParentageTotal`; the `isBridge` flag uses the
  family-crossing definition above so the switchboard is discriminating. This is a spec
  refinement discovered at build time, recorded rather than smoothed.
- **Diatonic ↔ harmonic-minor shared subnodes: 55** (`5-20` 10, `5-23` 10, `5-25` 10,
  `5-27` 10, `5-29` 10, `5-Z12` 5). These are the subnodes usable for the specific
  7-35 ↔ 7-32 seam class; the admitted vocabulary (5-23, 5-27) is a 20-node subset of it.

Architecture read: the switchboard is neither empty nor universal. About 21% of anchored
subnodes cross the diatonic boundary; 20 of them are the admitted vocabulary. The
Andalusian-class seam has 55 candidate mediators. BL-031's path probes can now start from
a measured graph instead of the sampled corner.

## Anchor facts verified (all four, machine-checked in-generator and re-pinned in tests)

1. `7-35:0` (C Ionian, `[0,2,4,5,7,9,11]`): 2 rooted 5-35 subnodes (`{0,2,4,7,9}`,
   `{0,2,5,7,9}`), 3 including the unrooted `{2,4,7,9,11}`.
2. `7-32:9` (A harmonic minor, `[9,11,0,2,4,5,8]`): 0 cornerstones, rooted or unrooted;
   holds for all 14 anchored 7-32 nodes.
3. `5-23:9` `{9,11,0,2,4}` and `5-27:9` `{0,2,4,5,9}` both list `7-35:0` and `7-32:9`
   in `parentsRooted` (21 parents each).
4. Global distributions exact: 5-side-to-7-35 `{0:255, 1:50, 2:20, 3:5}`; 7-side
   anchored-kernel `{0:381, 1:60, 2:18, 3:3}`; Ionian modal window `[1,2,3,3,3,2,1]`
   (distribution `{1:2, 2:2, 3:3}`).

## Destination correction and the abandoned reading

The route destination is `7-32:9` (A harmonic minor), not `7-32:4` (E harmonic minor):
E major is the cadence's dominant arrival, and G♯ is A's leading tone. Both sets prime to
`(0,1,3,4,6,8,9)`, so the correction is musical routing, not set theory.

Recorded finding from the corrected-routing comparison: the abandoned `7-32:4` reading
shares exactly one 5-note voicing with `7-35:0` — `{0,4,7,9,11}` (`5-27:4`), class 5-27 —
and no 5-23 voicing. The corrected `7-32:9` route shares two admitted-class voicings
(`5-23:9`, `5-27:9`). The seam vocabulary is robust across interpretations; the corrected
destination is strictly better connected (2 bridges vs 1).

## Tonic vs. root

The distinction has now bitten three times (the E-harmonic-minor brainstorm reading, the
v1.1 node IDs, and the v1.3 destination). The generator header carries the warning, the
root convention is emitted in `metadata.rootConvention`, and a dedicated regression test
(`test_tonic_vs_root_destination_pin`) fails if the route ever re-derives `7-32:4`.

## Spec-gap resolutions recorded

- **Orientation suffix.** `{forteTnI}:{root}` cannot be unique for chiral TnI classes:
  the two Tn orbits' anchored-root sets always intersect (two 7-subsets of Z12 cannot be
  disjoint), so orientation-B nodes append `B` (e.g., `7-32:5B`). A/single nodes keep the
  spec's ID shape; all pinned IDs (`7-35:0`, `7-32:9`, `5-23:9`, `5-27:9`) are unaffected.
- **Subnode list length.** `heptatonicNodes[H].subnodes` lists the 15 anchored pentatonic
  nodes concretely contained in `H`. The other 6 of the 21 literal subsets contain no
  pc 0 and therefore have no anchored node; they are counted by `cornerstoneCountRooted`
  (contains pc 0) and `cornerstoneCountUnrooted` (all 5-35 subsets).
- **Tn vs TnI.** Forte labels are TnI (38/side, from the registry and ledger); the 66 Tn
  classes are transposition orbits and are the identity used for counting. A Z-pair test
  (`{0,1,2,5,8}` vs `{0,1,4,5,7}`) pins the distinction that a prime-form-only
  implementation would flatten.

## Exit / next

BL-021's seam query is now a lookup: `intersection(parentsRooted(7-35:0),
parentsRooted(7-32:9))` = `{5-23: {9,11,0,2,4}, 5-27: {0,2,4,5,9}}`. Golden-path
registration can name the bridge voicings in the trace. BL-031 gets a measured
switchboard (55 diatonic↔harmonic-minor mediators; 70 diatonic-boundary junctions).
This sprint does not complete BL-021 (maintainer listening verdict and golden-path
catalog registration remain).
