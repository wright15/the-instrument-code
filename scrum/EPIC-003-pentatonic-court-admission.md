# EPIC-003 — Pentatonic Court admission and harmonic-invariant runtime

**Status:** Done · **Priority:** High · **Owner:** pentatonic court workstream
**Epic ID:** EPIC-003 · **Target:** post-EPIC-002 admission, version TBD
**Stories:** [CRT-301](CRT-301-court-admission-contract.md),
[CRT-302](CRT-302-pentatonic-substrate-registry.md),
[CRT-303](CRT-303-harmonic-invariant-library.md),
[CRT-304](CRT-304-court-filter-algebra.md),
[CRT-305](CRT-305-court-runtime-ledger.md),
[CRT-306](CRT-306-court-graph-projection.md),
[CRT-307](CRT-307-court-agent-skills.md),
[CRT-308](CRT-308-court-vault-context.md),
[CRT-309](CRT-309-court-admission-release-closure.md)

## Problem statement

The framework documents (`framework/AGENTS.md`,
`framework/TOPOLOGICAL_ANCHORING.md`, and the companion toolkit's
`fivefold_engine.yaml`) describe a complete Fivefold Engine, Pentatonic
Court, and harmonic-compression coordinate. The release artifacts currently
treat that material as `admission: proposed` per `DECISION_LEDGER.md`
(1.1.0 entry) and `provenance/NEXT_STEPS.md` §5. No executable procedure
exists for proving the Court's harmonic invariants, evaluating its
filter algebra, enforcing its adjacent-only transition guard, or admitting
the Court subsystem without violating the namespace contract that EPIC-002
establishes.

Three concepts are also at risk of being collapsed unless the Court
admission contract separates them explicitly:

1. The **canonical Court states** $C_0$–$C_4$ as rooted modes of Forte 5–35
   (a harmonic structure).
2. The **Court pole register** as an operational runtime coordinate
   (the four-bit Mars/Jupiter/Venus/Saturn Internal/External field).
3. The **$\kappa_{\text{court}}$ compression coordinate** as a fourth
   namespace distinct from $C_P$, $C_H$, $C_S$, temperature, and entropy.

That collapse would violate existing machine data and the GOV-201 namespace
contract. In particular, Court pole transitions must not write
`ScaleState.office`, `OCCUPIES_OFFICE`, or Degree-Governor metadata, and
$\kappa_{\text{court}}$ must never silently equal any other compression
coordinate or a physical quantity.

## Goal

Admit a bounded Pentatonic Court subsystem — the five canonical rooted
positions of Forte 5–35 ($C_0$–$C_4$), the bridge set classes Forte 5–23
and Forte 5–27, plus any other pentatonic set classes required to mediate
the canonical Aeolian → Harmonic Minor (7–35 → 7–32) example — into a
versioned, machine-verified runtime. The runtime proves the Court's
harmonic invariants (Gram matrix $G_{\text{Court}}=2I_4$, Hamming
$d_H(C_i,C_j)=2|i-j|$, Carey $\mathrm{CQ}(5\text{–}{35})=1$,
$\mathrm{SQ}(5\text{–}{35})=\tfrac12$, disjoint XOR supports), enforces its
adjacent-only transition guard, and exposes the Court-filter operator
$P_c=\operatorname{diag}(c)$ with declared commutation rules against the
EPIC-002 mutation operator registry. Neo4j remains a rebuildable read
projection of the Court substrate; an optional Obsidian vault supplies
transparent Court pedagogy as evidence only and never becomes execution
authority.

The formal classification boundary extends EPIC-002's by a single
namespace:

```text
courtState:      ScaleState's runtime Court coordinate (C0..C4) — not node identity
courtTransition: CourtState -> CourtState, adjacent-only, evidence-gated
kappaCourt:      number in {0, 0.25, 0.5, 0.75, 1} — fourth compression coordinate
courtFilter:     P_c = diag(c), linear diagonal projector over a declared mask
```

Raw Court input may return `adjacent_violation`, `off_chain`, or
`unresolved`. Completeness and exclusivity apply to the admitted canonical
Court positions, not to every pentatonic set class in the 38-class field.

## Authority flow

```text
EPIC-002 GOV-201 namespace contract
                    |
                    v
       CRT-301 court admission contract
                    |
                    v
   CRT-302 substrate registry -- CRT-303 harmonic invariants
                    |                  |
                    |                  v
                    |          CRT-304 Court-filter algebra
                    |                  |
                    v                  v
       CRT-305 court runtime ledger ----+
                    |                  |
                    v                  v
       CRT-306 court graph projection |
                    |                  |
                    v                  v
       CRT-307 court agent skills <---+
                    |
                    v
       CRT-308 optional vault context
                    |
                    v
       CRT-309 admission + release closure
```

For a fixed Court policy fingerprint, normalized request, prior Court
state hash, and context fingerprint, intrinsic outputs must be byte-identical.
Wall-clock time, provider identity, Neo4j availability, and filesystem
enumeration order must not affect intrinsic identity. This inherits
EPIC-002's determinism contract exactly.

## Scope

**In:**

- A namespace and authority crosswalk among Court State, Court pole
  register, $\kappa_{\text{court}}$, Court filter, and the existing
  Governor-domain, State Governor, and Degree Governor namespaces from
  EPIC-002.
- Strict Court substrate, invariant, filter-operator, transition,
  evidence, ledger-extension, and budget contracts.
- Admitted pentatonic set classes: 5 canonical rooted positions $C_0$–$C_4$
  of Forte 5–35, plus Forte 5–23 and Forte 5–27 (and any other set classes
  minimally required to mediate the Aeolian → Harmonic Minor bridge
  example). Remaining pentatonic set classes stay `admission: proposed`.
- Carey CQ/SQ evaluation for the canonical 5–35 seed only; other admitted
  set classes registered with masks but no Carey computation.
- $P_c=\operatorname{diag}(c)$ as the sole admitted linear Court-filter
  operator with declared domain, image, inverse, and commutation rules
  against the EPIC-002 mutation operator registry.
- Adjacent-only Court transitions, the Master's-Flip-as-neighbor rule,
  Topological-Translocation records for off-chain jumps, $\kappa_{\text{court}}$
  as a fourth explicitly-distinct coordinate, and the guard
  "$\kappa_{\text{court}}$ is not $C_P$, $C_H$, $C_S$, temperature, entropy,
  enthalpy, or free energy".
- Bounded named Neo4j queries over Court substrate, invariants, transitions,
  and filter applications.
- First-party Court-aware agent skills that extend the GOV-207 bundle
  without granting the model authority to invent a Court.
- Optional read-only Court context in Obsidian bundles.
- QA, provenance, admission review, decision-ledger amendment, and release
  closure.

**Out:**

- Admitting the remaining pentatonic set classes beyond the C0–C4 + 5–23 +
  5–27 + required-bridge subset (reserved for a follow-on admission story).
- Computing Carey CQ/SQ for any set class other than the canonical 5–35
  seed.
- Admitting Fourier, graph-spectral, or semantic-scoped Court-filter
  operators (stay `proposed`).
- Admitting the natural-phenomena or thermodynamic-mapping packages
  `physical_phenomena.yaml` and `thermodynamic_processes.yaml`
  (reserved for EPIC-004).
- Treating representative Governor wavelengths as empirical observations
  or as physical effects caused by musical states (already enforced by
  GOV-202/203; CRT-303 reinforces via the separate-$C_H$ guard).
- Allowing an LLM, Obsidian vault, Neo4j, or Court runtime to authoritatively
  mutate canonical office occupancy, Degree-Governor metadata, or the
  7-heptatonic topology.
- Unrestricted model-generated Cypher, shell execution, ledger writes, or
  vault writes.
- Claiming that $\kappa_{\text{court}}$ is thermodynamic entropy or any
  physical quantity.

## Success criteria

- **SC-1 · Namespace safety**: Court pole transitions cannot write
  `ScaleState.office`, `OCCUPIES_OFFICE`, Degree Governor metadata, or
  primary-Governor classifications; $\kappa_{\text{court}}$ cannot equal
  $C_P$, $C_H$, $C_S$, temperature, entropy, enthalpy, or free energy.
- **SC-2 · Substrate completeness**: every admitted pentatonic set class
  has a 12-bit mask, $T_5$ generator cycle position, complement map to
  the 7-heptatonic registry, and admission status; off-chain configurations
  that claim canonical status are rejected with machine-readable reasons.
- **SC-3 · Invariant integrity**: $G_{\text{Court}}=2I_4$,
  $d_H(C_i,C_j)=2|i-j|$, disjoint XOR supports, weight-5 invariant,
  $\mathrm{CQ}(5\text{–}{35})=1$, and $\mathrm{SQ}(5\text{–}{35})=\tfrac12$
  reproduce byte-identically across two clean builds and source-hash checks.
- **SC-4 · Filter Algebra determinism**: $P_c=\operatorname{diag}(c)$ has
  declared domain, image, idempotent-projection inverse, and commutation
  results against the EPIC-002 mutation operator registry; non-commuting
  pairs are recorded in the ledger with route semantics.
- **SC-5 · Transition authority**: no Court transition reaches `VERIFIED`
  without adjacency proof, registered verifier, recorded evidence, and
  prior-state hash; non-adjacent jumps without a Topological Translocation
  record fail closed.
- **SC-6 · Loop control**: repeated Court state/action/parameter tuples,
  bounded retries, and no-progress conditions produce explicit `REPLAN` or
  `STOPPED` outcomes (inherits GOV-205).
- **SC-7 · Projection safety**: deleting the Court graph projection does
  not change classifier, ledger replay, invariant computation, or intrinsic
  fingerprints; the projection rebuilds from verified canonical data.
- **SC-8 · Agent usability**: first-party skills expose Court inspect, list,
  validate, execute, project, and verify procedures without requiring the
  model to compute the algebra or invent a Court.
- **SC-9 · Context safety**: Court vault context is opt-in, bounded,
  read-only, and fingerprinted; raw private note content and live Court
  state stay outside the release manifest and graph projection.
- **SC-10 · Release integrity**: the `DECISION_LEDGER.md` entry that
  previously declared "scope: all 38 pentatonic set classes" is amended to
  record the narrower agreed scope; schemas, fixtures, provider parity,
  security boundaries, documentation, provenance, manifests, and the
  full root validator pass green twice before admission.

## Definition of done (epic)

All nine stories are Done with their story-specific evidence recorded. The
amended admission decision is in `provenance/DECISION_LEDGER.md`; the
admitted Court substrate, invariants, filter operator, transitions, skills,
and projections are published as new versioned artifacts without mutating
frozen packages; deterministic and tamper fixtures pass twice; the Court
graph projection is rebuildable; Court-aware agent skills and the optional
vault path pass safety tests; the Scrum board, documentation, manifest,
QA reports, and source-authority records are current; the release
admission is explicit rather than implied; the natural-phenomena and
thermodynamic-mapping packages remain `admission: proposed` for EPIC-004.

## Dependencies and sequencing

```text
GOV-201 (from EPIC-002)
    |
    v
CRT-301 -> CRT-302 -> CRT-303 -> CRT-304 -+
              |          |                |
              |          |---> CRT-305 --+---> CRT-306
              |                |          |
              |                v          v
              |             CRT-307 ---> CRT-308 ---> CRT-309
              |                                       ^
              +---------------------------------------+
```

EPIC-003 starts only after EPIC-002 closes. CRT-305 may proceed once
CRT-302 and GOV-204 land. CRT-306 proceeds in parallel with CRT-304/305
after CRT-302/303 and the GOV-206 contract are stable. CRT-307 needs
CRT-305, CRT-306, and GOV-207. CRT-308 follows CRT-307 and GOV-208.
CRT-309 closes everything and requires the full root validator green twice.
