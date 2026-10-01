# BL-028 Sprint Memo: Derived-Path Finder (Composed-Graph Observation Instrument)

**Status:** sprint artifact (capability + validation memo). No ledger entry, no evidence
obligations. Related: `plan/bl-021-golden-path-memo.md`,
`plan/bl-022-parallel-minor-memo.md`, `plan/bipartite-inclusion-spec-v1.4.md`,
`docs/ARCHITECTURE_MAP.md` §1 Layer 2 / §4 G2.

**Landed:**

| Artifact | Role |
|---|---|
| `scripts/build-derived-path-graph.mjs` | Deterministic generator: composed graph = 60 catalog operator edges + 6,930 containment pairs (stored once, pentatonic→parents) + anchor/bridge classification; canonical serialization + fingerprint |
| `orrery/src/generated/derived-path-graph.v1.json` | 149 KB generated artifact (`status: planning_evidence`; 462 + 330 nodes, 60 + 6,930 edges) |
| `orrery/scripts/validate-derived-path-graph.mjs` | Independent validator: node census, mask subset symmetry, operator inventory vs. catalog, anchor classification, admitted-bridge vocabulary, fingerprint |
| `orrery/src/path-find.ts` | Pure BFS search: up to N minimal-hop paths, admitted-bridge filter, truncation flag, reachability helper |
| `orrery/src/path-replay.ts` | `planDerivedPathReplay` (renderer, re-asserts every hop) + `derivedPathRecord` (`golden-path.v1`-compatible export seam) |
| `orrery/index.html`, `orrery/src/main.ts` | From/to selectors over all 792 nodes, admitted-bridge filter, result-option select, endpoint-coverage labeling |
| Tests | `path-find.test.ts` (7), derived-replay additions in `path-replay.test.ts` (5); orrery suite **185 green**; `orrery:check` (incl. the new `derived-path-graph:check` gate) and `orrery:build` green |

No bytes changed in `legal-moves.v2.json`, the legal-move validator, `OFFICE_PALETTES`, the
`audio.v1` guard, or any golden-path fixture. No intra-330 adjacency is emitted, rendered,
or consumed (G1 stays closed).

## The finder

`findDerivedPaths(graph, origin, destination, { admittedBridgesOnly?, maxPaths })` returns up
to `maxPaths` (default 3, cap 25) **minimal-hop** paths over the union graph:
operator moves among the 21 A anchors (directed, catalog-resolved) + containment pairs
(bidirectional). The admitted-bridge filter restricts every pentatonic traversal to the
substrate registry's admitted-bridge vocabulary (set classes `5-23` / `5-27`, 20 rooted
nodes); under that filter a non-admitted pentatonic endpoint is reachable only as the origin.
Results are deterministic (sorted adjacency, sorted predecessors); the option select reports
when more than `maxPaths` minimal paths exist.

Replay re-asserts every hop: operator hops must carry a catalog move id
(`catalog-membership`); containment hops must satisfy the subset relation against every
heptatonic neighbor on the path — a pentatonic node with heptatonic neighbors on both sides
is a bridge crossing (`both-collections-containment`, the BL-021 class), otherwise a single
containment step (`containment-membership`). An audit M application whose compressed pair
appears as two consecutive operator hops is annotated on the first hop
(`M:2741:1709`, `M:1717:1453`; annotation only — never walked).

## Validation-as-audit (the golden-path ground truth)

This is the audit the original question asked for, executed by the capability itself:

1. **Seam crossing, `7-35:3 → 7-32:0`:** 2 hops, exactly **five** minimal crossings —
   `5-20:0B`, `5-23:0`, `5-25:0`, `5-27:0`, `5-29:0B` — every one contained in both
   endpoints. The registered golden path's bridge pick (`5-27:0`) is among them:
   **consistency**. With the admitted-bridge filter the answer narrows to `5-23:0` /
   `5-27:0`, still 2 hops.
2. **Mode axis, `7-35:0 → 7-35:3` (Ionian → Aeolian):** 3 hops, exactly **seven** minimal
   paths; the exact BL-022 L-chain `L7:2741:1717 → L3:1717:1709 → L6:1709:1453` is among
   them: **consistency**. The default 3-path cap reports truncation on this pair. The
   L-chain replays with both M compressions annotated.

**Optimality vs. character (recorded, not a failure):** the topology presents 5 seam
crossings and 7 mode-axis routes where the ear chose one each. The registered paths are
musical selections; the finder is the topology's answer. The divergence is count and
internals, never destination — exactly the data the instrument exists to expose.

## Reachability census

- The full composed graph is **connected: one component of 792 nodes** (every heptatonic
  and pentatonic node reachable from any other through permitted edges alone).
- Operator-only traversal from any of the seven 7-35 modes reaches **all seven mutually**
  (the BL-022 mode-axis claim generalized and pinned) and **all 21 A anchors**.
- D-anchors (49) and all non-anchor heptatonics are reachable via containment only; the UI
  states this per endpoint ("A-anchor — full operator coverage" vs "D-anchor — reachable-to
  via containment; no operator departure").

## The standing hardcode answer

Registered golden paths: endpoints, bridge pick, and triad layer are **manual musical
choices**; every hop's legality is machine-verified (artifact containment, catalog move
identity). Derived paths: endpoints and filters are the operator's choice; the route and
every hop are **machine-derived and re-asserted at plan time**. Neither path class renders
an unverifiable hop, and the finder's own output is validated against the registered paths.
BL-029 records the remaining asymmetry (D-tier operator coverage) as an open investigation.

## Export seam (BL-023)

`derivedPathRecord(plan)` emits `golden-path.v1`-compatible fields (`pathId`, `substrate`,
`origin`/`destination`, `hopCount`, `crossesBridge`, `mShortcuts`, `hops`), so the catalog
sprint can adopt finder output without inventing a new shape.

## Governance

Planning evidence only. The generated graph is byte-stable (fingerprint pinned by its gate)
and the validator re-derives every claim from the four sources. The finder is read-only; the
planner asserts, never executes; no canonical, Court, catalog, or audio-manifest mutation.
M hops remain audit demonstrations, never legal walks. G1 (the 330 edge rule) is untouched —
the memo's non-interference proof is the artifact itself: no pentatonic-to-pentatonic field
exists.
