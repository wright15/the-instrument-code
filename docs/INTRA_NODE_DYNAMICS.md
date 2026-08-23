# Intra-Node Dynamics

## Purpose

This contract defines how the renderer creates movement, dynamics, and variance
while remaining inside one resolved Forte `7-35` node. It is a post-tonal
execution layer: it uses Allen Forte set-class descriptors, degree-addressed
subsets, interval classes, modal perspective, and Court filtering. It does not
use Schenkerian analysis, functional harmony, tonal hierarchy, tonic, dominant,
or passing-tone roles.

Every pitch class in the parent set remains structurally equal. A subset root
degree is an addressing and rendering-emphasis coordinate only. It is not a
tonal root, an office assignment, or a claim that one pitch acquires intrinsic
priority over another.

The Execution Envelope is compiled only after the runtime has resolved the
node's intrinsic identity. It is sent to the LLM alongside the node's baseline
Nouns and Verbs as an overlay:

```text
Render(node, envelope) = BaselineNounsAndVerbs(node)
  + RouteOverlay
  + SetTheoreticElaborationOverlay
  + RenderParameters
```

The plus signs denote additive rendering context, not pitch-class arithmetic or
state mutation.

## Scope And Invariants

The contract applies to one resolved rooted `7-35` state at a time. The
compiler must verify the source node's Forte family before it emits an envelope;
the envelope intentionally does not carry a writable bitmask or Forte-family
field.

An intra-node envelope MUST NOT:

- traverse `MODAL_SUCCESSOR`, `MODAL_MUTATES_TO`, or any other graph edge;
- execute the structural modal operator `M`;
- change the node's 12-bit pitch mask, pitch-class inventory, or cardinality;
- overwrite its Governor office, role, tier, mode identity, or Degree-Governor
  map;
- create or move a Court state;
- derive, replace, or assign aggregate `harmonic.C_H`; or
- alter the intrinsic normal form or intrinsic fingerprint.

The current global `harmonic.C_H` field remains unresolved and `null`. Scoped
harmonic descriptors may be read as compiler inputs, but they do not become an
intra-node write surface.

## Chaldean Degree Weights

The active subset root is one of the seven fixed Chaldean degree addresses:

| Degree | Degree Governor | Weight |
|---:|---|---:|
| 1 | Saturn | `116/407` |
| 2 | Jupiter | `56/407` |
| 3 | Mars | `41/407` |
| 4 | Sun | `35/407` |
| 5 | Venus | `77/407` |
| 6 | Mercury | `44/407` |
| 7 | Moon | `38/407` |

The normalized witness has the fixed order:

```text
w1 > w5 > w2 > w6 > w3 > w7 > w4 > 0
```

It is the admitted `chaldean_order_witness_v1` for the scoped A-tier
`CH_A012_q_v1` descriptor. Every canonical `7-35` node is an A0 anchor, so the
compiler may use this witness for this contract. The witness remains a scoped
render-gravity input. It is not a global harmonic-compression formula, a
natural-law claim, a tension metric, or an office/tier classifier.

`active_subset_root_degree` is always interpreted against the parent node's
fixed degree addresses. `modal_rotation` never remaps the Chaldean weight map.
The compiler, not the LLM, resolves the matching `chaldean_weight` and rejects a
packet whose number does not match the selected degree.

## Post-Tonal Elaboration Vectors

### 1. Weighted Subset Partitioning

The runtime activates a dyad or trichord drawn from the parent node's immutable
`SubsetLattice`. The materialized lattice contains exactly 21 dyads and 35
trichords. The envelope's `active_subset_root_degree` is a degree-addressed
activation gate, not a unique subset identifier; the compiler selects an
eligible source subset from the lattice and the LLM may only render that
compiled selection.

Subset gravity follows the weight of the active root degree. Moving render
emphasis from a Degree 4 (Sun) subset to a Degree 1 (Saturn) subset raises the
declared structural gravity because `w1 > w4`. This is a rendering instruction,
not a claim that the parent pitches have changed function or that a scalar
harmonic tension has been computed.

#### Future Rank 4 Extension

Tetrachords are intentionally deferred. A seven-note Boolean lattice has 35
rank-4 subsets, but the current `SubsetLattice` implementation materializes
only rank-2 and rank-3 data. No tetrachord may be compiled into an Execution
Envelope until a versioned rank-4 implementation and validation evidence exist.

### 2. Interval Class Emphasis

`ic_emphasis` selects one interval class from `IC1` through `IC6` for
rendering salience. The parent `7-35` family retains its interval vector:

```text
(IC1, IC2, IC3, IC4, IC5, IC6) = (2, 5, 4, 3, 6, 1)
```

The renderer may foreground repetitions, registral spacing, articulation, or
temporal placement associated with the selected interval class while retaining
the full parent pitch inventory. For example, a renderer may author IC6 as
friction and IC5 as stability. Those labels are authored render affordances;
the interval vector itself assigns no tonal function, dissonance ranking, or
structural hierarchy.

### 3. Modal Perspective Rotation

`modal_rotation` is an integer in `0..6` that labels a read-only modal
perspective indexed like `M^r`. It does not invoke `M`, traverse a modal edge,
or change the rooted node.

For a rotation `r`, the current perspective treats parent degree `r + 1` as
its local first degree. For an original degree `d`, its local address is:

```text
local_degree(d, r) = 1 + ((d - r - 1) mod 7)
```

Thus `modal_rotation = 0` preserves the baseline perspective and
`modal_rotation = 3` views the same node from its fourth degree. The parent
mask, Forte family, State Governor, and fixed Chaldean degree addresses remain
unchanged.

### 4. Court Complement Filter Mapping

`court_projection_id` selects either `null` or one named 5-35 Court filter:
`C0`, `C1`, `C2`, `C3`, or `C4`. It creates a tactical safe-state rendering
view before the renderer returns to the full 7-35 complexity. It does not
change the active node into a 5-35 node.

Forte 5-35 is complementary to Forte 7-35 as a set class, but exact complement
and filter projection are distinct operations. The compiler uses the declared
Court filter associated with the selected ID:

```text
F_c(H) = m(H) AND c
```

It MUST validate that the selected Court filter is admissible for the active
parent and produces the declared support. If it is not admissible, compilation
fails rather than replacing the parent mask, inferring a Court position, or
traversing a Court transition. `court_projection_id = null` disables this
vector.

## Execution Envelope Contract

The machine-readable contract is
[`schemas/execution_envelope.schema.json`](../schemas/execution_envelope.schema.json).
It contains four required sections:

| Section | Purpose |
|---|---|
| `node_identity` | Read-only Governor, mode, and tier labels from the resolved node. |
| `navigation_context` | Read-only provenance from the most recent navigation operation and zero or one active route-overlay token. |
| `elaboration_state` | Chaldean subset emphasis, interval-class focus, modal perspective, and selected Court filter. |
| `render_parameters` | Normalized amplitude, tempo, and density controls. |

`route_overlay` preserves the existing single-active-overlay policy. Historical
routes belong in provenance or a ledger; they are not accumulated into the
active render packet. `last_navigation_operator` is descriptive context only
and cannot cause a new traversal.

The schema prohibits unknown fields at every level. In particular, it accepts
neither a bitmask nor the retired `court_projection_active` boolean. This
prevents an LLM-facing packet from presenting a topology write as a rendering
parameter.

## Compiler And Renderer Responsibilities

The runtime compiles an envelope in this order:

1. Resolve the canonical rooted node and verify that it belongs to Forte `7-35`.
2. Read the node's intrinsic baseline, including its existing Nouns and Verbs.
3. Resolve the fixed Chaldean degree weight for
   `active_subset_root_degree`.
4. Select only existing dyad/trichord source material from `SubsetLattice`.
5. Apply interval-class and modal-perspective emphasis without applying a graph
   operator.
6. Validate any non-null Court filter against the parent node.
7. Emit the strict envelope and let the LLM shade the baseline rendering.

The LLM may vary expression within the compiled amplitude, tempo, density, and
elaboration constraints. It MUST treat every identity-bearing value as
read-only. A render request that attempts to mutate the node or infer a new
office, mask, tier, `C_H` value, or graph route is invalid.

## Example

```json
{
  "node_identity": {
    "governor": "Moon",
    "mode": "Ionian",
    "tier": "A0"
  },
  "navigation_context": {
    "last_navigation_operator": "M",
    "route_overlay": []
  },
  "elaboration_state": {
    "active_subset_root_degree": 1,
    "chaldean_weight": 0.28501228501228504,
    "ic_emphasis": 6,
    "modal_rotation": 3,
    "court_projection_id": "C0"
  },
  "render_parameters": {
    "amplitude": 0.8,
    "tempo": 0.6,
    "density": 0.7
  }
}
```

The historical `M` value in `last_navigation_operator` records provenance. The
`modal_rotation` field in the same packet is still a read-only perspective and
does not execute `M`.

## Sources

- `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md`
- `court-mathematics/docs/01_COURT_LEXICON.md`
- `schemas/semantic_operator_registry_v1.0.1.yaml`
- `docs/PENTATONIC_GRAPH_BINDING_AUDIT_SPEC.md`
- `docs/GRAPH_AND_COMPILER_API.md`
