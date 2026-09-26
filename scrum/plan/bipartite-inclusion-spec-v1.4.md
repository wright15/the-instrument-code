# Architectural Specification: Bipartite Containment Graph & Subnode Routing Generator (v1.4)

**Status:** Sprint Memo / Technical Specification (v1.4, supersedes v1.3)

**Target Artifact:** `derived/hypergraph/bipartite-inclusion-v1.json` (`status: planning_evidence`)

**Generator Script:** `scripts/generate_hypergraph_matrix.py`

**Test Suite:** `tests/test_bipartite_inclusion.py`

**Downstream Epics:** BL-021 (Andalusian Golden Path), BL-022, BL-023, BL-031 (Transport Consistency)

## Revision history

| Version | Change |
|---|---|
| v1.3 | Baseline: corrected §2.1 rooted/unrooted labels, Ionian = 2 rooted kernels, node IDs, governance posture. |
| v1.4 | Destination correction `7-32:4` → `7-32:9` (A harmonic minor) throughout; `parentsRooted` redefined as concrete pc-set containment (the "same-root" comment removed); `parentsUnrooted` clarified as containing heptatonic **class IDs**; bridge semantics pinned to the diatonic-boundary definition because the literal "parents span >1 Tn orbit" reading marks all 330 anchored subnodes; orientation-B node IDs documented; testing section expanded. The v1.4 target does not exist as a landed file for v1.3, so this is the shape to stage. |

## 1. System Context & Strategic Objective

To model harmonic movement across scale spaces, the system relies on a bipartite containment graph where heptatonic parent collections ($H \in Z_{12}, |H| = 7$) and pentatonic subnode collections ($P \in Z_{12}, |P| = 5$) are linked by set inclusion ($P \subset H$). ("Hypergraph" is used in the structural sense of one-to-many containment edges, not strict hyperedges.)

While the $Q$-engine governs dynamic register transitions on individual 5-note nodes, it requires a pre-computed topological map to navigate between 7-note parent collections. This specification defines the requirements for generating the **Bipartite Inclusion Matrix**, providing an $O(1)$ routing lookup table for cross-seam navigation and multi-family scale hops.

## 2. Structural Topology: Uniform Meshes vs. Scattered Bridge Subgraphs

The containment graph exhibits two distinct topological behaviors depending on whether the parent scale belongs to the diatonic family ($7\text{-}35$) or an altered heptatonic family (e.g., $7\text{-}32$ Harmonic Minor).

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │ UNIFORM DIATONIC MESH (7-35 <───> 5-35)                                │
 │ • Sliding-Window Theorem: Unrooted per-diatonic = 3 kernels;          │
 │   rooted per-diatonic = 1-2-3-3-3-2-1 window; rooted per-kernel = 3.   │
 │ • Homogeneous, cyclic fifth-space alignment (t_k = 7k mod 12).         │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                             (Bridge Subnodes)
                             5-23 / 5-27 Kernels
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ ASYMMETRICAL / SCATTERED SUBGRAPH (e.g., 7-32 Harmonic Minor)          │
 │ • Zero 5-35 Kernels: 7-32 contains 0 anhemitonic pentatonics.          │
 │ • Heterogeneous Subnodes: 21 subsets fragment into 5-21, 5-23,         │
 │   5-27, 5-32, etc.                                                     │
 │ • Multi-family parentage acts as a switchboard crossing scale seams.   │
 └────────────────────────────────────────────────────────────────────────┘
```

### 2.1 The $7\text{-}35 \leftrightarrow 5\text{-}35$ Cornerstone Subgraph

* **Sliding-Window Symmetry:**
  * Every unrooted $7\text{-}35$ collection contains exactly 3 unrooted $5\text{-}35$ kernels. For C Ionian (`7-35:0`), these three kernels are:
    1. **C Major Pentatonic** (`{0,2,4,7,9}`) — **Rooted** (contains pc 0)
    2. **F Major Pentatonic** (`{0,2,5,7,9}`) — **Rooted** (contains pc 0)
    3. **G Major Pentatonic** (`{2,4,7,9,11}`) — **Unrooted** (lacks pc 0)
  * Rooted $7\text{-}35$ collections exhibit the **1-2-3-3-3-2-1** sliding window distribution across modes (Ionian = 2 rooted kernels).
  * Every rooted $5\text{-}35$ kernel sits inside exactly 3 rooted $7\text{-}35$ diatonics.
* **Role:** High-consonance intra-family movement.

### 2.2 Asymmetrical Heptatonic Subgraphs (e.g., $7\text{-}32$ Harmonic Minor)

* **Fragmentation:** A 7-note collection contains $\binom{7}{5} = 21$ literal 5-note subsets. In non-$7\text{-}35$ parents like $7\text{-}32$, these 21 subsets fragment across non-$5\text{-}35$ set classes.
* **Zero $5\text{-}35$ Inclusion:** Every rooted $7\text{-}32$ contains **zero** $5\text{-}35$ kernels (rooted or unrooted).
* **Bridge Subnodes:** Instead, $7\text{-}32$'s subsets map to altered set classes such as **$5\text{-}23$** (`{0,2,3,5,7}`) and **$5\text{-}27$** (`{0,3,5,7,8}`).
* **Multi-Parent Mediation:** Subnodes $5\text{-}23$ and $5\text{-}27$ possess multiple 7-note parents ($7\text{-}35$ and $7\text{-}32$). They serve as the admitted **bridge vocabulary** for seam crossings between scale families.

### 2.3 Exemplar: Operationalizing the Andalusian Cadence Route

The hypergraph routes the Andalusian cadence ($7\text{-}35$ Aeolian $\longrightarrow$ $7\text{-}32$ Harmonic Minor) as the **first operational deployment of the sliding-window theorem**:

* **Collection Coordinates:** Origin is **`7-35:0`** (A Aeolian = C Major pitch collection, tonic pc=9 carried as mode context). Destination is **`7-32:9`** (A Harmonic Minor collection, tonic pc=9 carried as mode context). The destination is A harmonic minor, not E harmonic minor: the E major arrival is the cadence's dominant, and G♯ enters as A's leading tone. Both `7-32:4` (E) and `7-32:9` (A) prime to the same class `(0,1,3,4,6,8,9)`, so the correction is musical routing, not set theory.
* **Step 1 (Interior Traversal):** Traverse Court states ($C2 \to C3 \to C4$) inside `7-35:0`.
* **Step 2 (Pivot):** Step onto a shared bridge voicing. Under concrete containment, exactly two admitted-class voicings sit in `parentsRooted` of both `7-35:0` and `7-32:9`:
  1. **$5\text{-}23$ `{9,11,0,2,4}`** (`5-23:9`)
  2. **$5\text{-}27$ `{0,2,4,5,9}`** (`5-27:9`)
* **Step 3 (Seam Crossing):** Step from the bridge subnode into `7-32:9` Harmonic Minor.

Finding recorded with the correction: the abandoned E-harmonic-minor reading (`7-32:4`) shares exactly one 5-note voicing with `7-35:0` — `{0,4,7,9,11}` (`5-27:4`), class $5\text{-}27$. Even the wrong destination had exactly one bridge voicing, of the same admitted class the corrected route uses; the seam vocabulary is robust across interpretations.

### 2.4 Concrete-Containment Semantics (v1.4)

`parentsRooted(P)` is every anchored heptatonic node whose concrete pc-set contains P's concrete pc-set. Both sides are drawn from the root-anchored universe: the 330 pentatonic and 462 heptatonic pc-sets that contain pc 0. The v1.3 "same-root parent" comment was wrong as written and is deleted. `parentsUnrooted` lists the distinct containing heptatonic **class IDs** (e.g., `"7-35"`, `"7-32"`), not node IDs.

Consequence recorded at build time: every anchored pentatonic has exactly 21 anchored heptatonic parents, so a literal "parents span more than one Tn orbit" test marks all 330 subnodes. The emitted `isBridge` flag therefore uses the multi-family (diatonic-boundary) definition in §4.3, and the literal total is recorded as `metadata.orbitSpanParentageTotal`.

## 3. $Q$-Engine Execution Regimes by Pentatonic Subnode Class

The generator script classifies each 5-note subnode into one of three execution regimes:

| Subnode Regime | Set Classes | Teleology Marker | $Q$-Engine Execution Paradigm |
| --- | --- | --- | --- |
| **Windowed** | $5\text{-}35$ Family | **Fires ($C0 \to C4$)** | **Teleological Court Mode:** Sequential 4-bit register flips ($0000 \to 1111$) correspond to linear fifth-stack window expansion ($t_k = 7k \bmod 12$) and elemental internalization. |
| **Scattered (Anchored)** | Non-$5\text{-}35$ classes (non-bridging) | **Suppressed** | **Non-Windowed Anchored Execution:** Engine register flips operate as local pitch-class transformations. Holds active root-circuit color without court-expansion markers. |
| **Scattered (Bridging)** | $5\text{-}23$, $5\text{-}27$, multi-family parent classes | **Suppressed** | **Non-Windowed Bridging Execution:** Operates as a colored state in its own right, additionally taking on **mesh-routing duty** across scale family seams. |

### 3.1 Cross-Seam Re-Grounding Protocol

Traversing a seam edge (`7-35:0` $\to 5\text{-}23 \to$ `7-32:9`) triggers a **Re-Grounding Event**:

1. Origin $Q$-engine unwinds local engagement.
2. Bridge node is traversed under non-windowed bridging execution.
3. Arrival at `7-32:9` instantiates a **brand-new local $Q$-engine** indexed to `7-32:9`'s pitch-class coordinate system.

## 4. Functional Requirements for `generate_hypergraph_matrix.py`

1. **Universe Enumeration:**
   * Enumerate the 330 anchored pentatonic pc-sets (cardinality 5, containing pc 0) spanning 66 Tn classes.
   * Enumerate the 462 anchored heptatonic pc-sets (cardinality 7, containing pc 0) spanning 66 Tn classes.
   * Forte labels are TnI labels (38 per side), read from the admitted pentatonic registry and the canonical heptatonic ledger; Tn orbits are the identity used for counting and bridging.
2. **Subset Evaluation & Inclusion Mapping:**
   * For every anchored heptatonic $H$, extract its 21 5-note subsets.
   * Determine concrete set inclusion across all 330 anchored pentatonics; every anchored pentatonic has 21 anchored parents.
3. **Subnode Classification & Bridge Census Metadata:**
   * Canonicalize each subset $P$ to its Prime Form / TnI set-class ID ($5\text{-}35$, $5\text{-}23$, $5\text{-}27$, etc.).
   * Flag `isCornerstone` (`true` for $5\text{-}35$, `false` otherwise).
   * Flag `isBridge` = not cornerstone **and** at least one anchored `7-35` parent **and** at least one anchored non-`7-35` parent (multi-family junction). This is the definition the census uses; the literal orbit-span count is emitted separately.
   * Emit `bridgeCensus` inside `metadata` containing the total count of `isBridge` nodes and a per-set-class breakdown.
4. **Self-Validation Post-Write:**
   * Script asserts internal invariants during generation (330 pentatonics, 462 heptatonics, 66 Tn classes per side, 38 TnI classes per side, `bridgeCensus.totalBridgeSubnodes > 0`, $5\text{-}23$ and $5\text{-}27$ present in the bridge set, the §6 anchor facts, and the distribution anchors).
5. **Deterministic Reproducibility:**
   * Omit volatile fields like `generatedAt` timestamps; canonical JSON (sorted keys, compact separators, trailing newline) so identical inputs produce byte-stable outputs for R1 compliance.
6. **Export Artifact:**
   * Output JSON data to `derived/hypergraph/bipartite-inclusion-v1.json` with top-level `status: "planning_evidence"`.

## 5. Output Data Schema

```typescript
interface HypergraphInclusionRegistry {
  status: "planning_evidence";
  schemaVersion: "bipartite-inclusion.v1";
  generator: "scripts/generate_hypergraph_matrix.py";
  sourceBindings: { path: string; sha256: string }[];
  metadata: {
    totalRootedPentatonics: 330;
    totalRootedHeptatonics: 462;
    totalTnClasses: 66;
    totalTnIClassesPerSide: 38;
    universeDefinition: string;
    rootConvention: string;
    bridgeDefinition: string;
    orbitSpanParentageTotal: 330;   // literal ">1 parent Tn orbit" reading
    bridgeCensus: {
      totalBridgeSubnodes: number;
      bySetClass: { [setClassId: string]: number };
    };
  };
  pentatonicSubnodes: {
    [pentatonicId: string]: {     // e.g., "5-35:0", "5-23:9"
      id: string;
      setClassId: string;         // e.g., "5-35", "5-23"
      orientation: "A" | "B" | "single";
      root: number;               // canonical scale root
      pitchClasses: number[];     // rooted order from root
      pitchMask: number;
      isCornerstone: boolean;     // true only for 5-35
      isBridge: boolean;          // multi-family parentage, see bridgeDefinition
      parentsRooted: string[];    // 21 concrete-containing heptatonic node IDs
      parentsUnrooted: string[];  // distinct containing heptatonic class IDs
    };
  };
  heptatonicNodes: {
    [heptatonicId: string]: {     // e.g., "7-35:0", "7-32:9"
      id: string;
      setClassId: string;         // e.g., "7-32"
      orientation: "A" | "B" | "single";
      root: number;
      pitchClasses: number[];     // rooted order from root
      pitchMask: number;
      subnodes: string[];         // 15 anchored pentatonic node IDs
      cornerstoneCountRooted: number;   // e.g., 0 for 7-32:9, 2 for 7-35:0
      cornerstoneCountUnrooted: number; // all 5-35 subsets; 0 for 7-32, 3 for 7-35
    };
  };
}
```

Two schema notes recorded at build: (a) `subnodes` has 15 entries — the anchored pentatonic nodes concretely contained in $H$; the other 6 of the 21 literal subsets do not contain pc 0 and are counted only by the `cornerstoneCount*` fields; (b) orientation-B nodes of chiral TnI classes append `B` to the ID (e.g., `7-32:5B`), since `{forteTnI}:{root}` alone cannot be unique across the two orbits of a chiral class.

## 6. Integration & Verification Plan

* **BL-021 (Andalusian Golden Path):** The debugger replayer queries `derived/hypergraph/bipartite-inclusion-v1.json` to extract `intersection(parentsRooted(7-35:0), parentsRooted(7-32:9))` (or via bridge-first query on $5\text{-}23$/$5\text{-}27$), retrieving `{5-23: {9,11,0,2,4}, 5-27: {0,2,4,5,9}}` as valid seam transition nodes.
* **BL-031 (Path-Dependence Probe):** Queries `metadata.bridgeCensus` for $O(1)$ switchboard inspection and paths testing.
* **Unit Testing (`tests/test_bipartite_inclusion.py`, 12 tests):**
  * §6 anchor facts: `7-35:0` contains 2 rooted $5\text{-}35$ subnodes and 3 total; all `7-32` nodes (including `7-32:9` and the abandoned `7-32:4`) contain 0; `5-23:9` and `5-27:9` list both `7-35:0` and `7-32:9` in `parentsRooted`.
  * Tonic-vs-root regression pin: the route resolves through `7-32:9`, and the abandoned `7-32:4` reading shares exactly one bridge voicing (`5-27:4`, `{0,4,7,9,11}`) with `7-35:0` and no $5\text{-}23$ voicing.
  * Tn/TnI regression pin: 66 Tn orbits versus 38 TnI classes per side, plus a Z-relation pair sharing an interval vector while splitting prime forms and orbits.
  * Census sanity plus exact census: 70 bridge subnodes across the 8 multi-family classes; literal orbit-span total 330.
  * Global distribution anchors: 5-side-to-`7-35` `{0:255, 1:50, 2:20, 3:5}`; 7-side anchored-kernel `{0:381, 1:60, 2:18, 3:3}`; Ionian modal window `[1,2,3,3,3,2,1]`.
  * Byte-stability, environment independence, and bipartite containment symmetry.

## 7. Non-Effects

`[DEFINED]` Planning evidence only. No ledger entry, no compliance receipt, no runtime, schema, canonical topology, Court runtime, graph, policy, or promotion effect. The artifact is discovered by the package manifest like any other tracked file.
