# Tiered Photonic Constants Theorem — GOV-2XX

## Status and authority

| Field | Value |
|---|---|
| Candidate ID | `CH_TIERED_v1` |
| Coordinate ID | `photonic.tiered_v1` |
| Scope | `role=anchor` and `tier in {A1,A2}` — 14 derived anchors |
| Record count | 28 (14 anchors × 2 variants) |
| Source bindings | 6 — ledger, network-data (constructionEdges), governors.yaml, photonic-records.json, C_H guard, this theorem |
| Variants | A sum_mixing (K-sum in ν̂, extended vacuum-UV) and B geometric_mean (K-mean in ln λ, hull-preserving) |
| Scoped admission | Informational sidecar only — `tiered_photonic_constants_only` |
| Aggregate namespace | `harmonic.C_H` remains `unresolved` with `value=null` |
| Global status | Untested outside A1/A2 anchors; no Neo4j, runtime, or topology write |

This document is part of the project as a scoped theorem admitted by GOV-2XX. The machine-readable disposition is the root-owned sidecar at `canonical/tiered-photonic-candidates/tiered-photonic-v1.json`; this document does not modify a Governor office, `photonic-records.json` A0 constants, or the global `harmonic.C_H` namespace. The 7 A0 wavelengths are source bindings, not derived records.

The distinction is intentional:

- the 14 anchor derivations are forced by office geometry and construction provenance;
- `K` is authored office-ring adjacency, not a physical law;
- both variants are zero-free-parameter (no β);
- numeric bands are canonical; spectral labels are Layer-4 prose.

## 1. Source binding and selection rule

The theorem was reproduced against:

```text
canonical/universal-heptatonic-ledger.json  (authoritative state identity)
canonical/universal-network-data.json       (28 constructionEdges, K kernel)
schemas/governors.yaml                      (7 A0 λ_nm: Sun 700, Moon 610, Mars 580, Mercury 530, Jupiter 470, Venus 430, Saturn 400)
seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/photonic-records.json (c, h, eV, C_P convention)
seven-governors-harmonic-invariants-v0.1.0/canonical/compression-namespace-guard.json (C_H guard)
```

The generator parses these bindings directly: it derives the A0 wavelengths,
A1/A2 anchor identities, and `constructs:*` provenance, checks the shared
physical constants and C_H guard, and rejects a missing or incorrectly
identified theorem.

Selection predicate for derivation:

```text
role = anchor
tier in {A1, A2}
variant in {sum_mixing, geometric_mean}
```

Both tier clauses required. A0 values are inputs; D1-D7, satellites, boundaries are out of scope for v1. Each record carries **edge-faithful provenance** (`parentStateIds` + `constructionEdgeIds`) while the derivation reads only **office wavenumbers** (channel-blind). This split is forced by normalization: `NF` strips route history from destination identity; channel (`single_degree` vs `root_phase`) is route metadata, and `root_phase` edges carry no photonic information that could be encoded. `channelIndependence:true` is validated by the construction-edge audit.

## 2. Construction kernel — office-space convolution

Let `Z7 = {0,…,6}` index `OFFICE_ORDER = [Sun,Moon,Mars,Mercury,Jupiter,Venus,Saturn]` and `e_k` the unit at office `k`. The construction provenance from the 28 `constructs:*` edges is uniformly:

```math
K = \delta_{-1} + \delta_{+1} \quad \text{— adjacency of the office heptagon } C_7
```

Each A1/A2 anchor at office `k` has unique parents `k-1` and `k+1` (mod 7) at the tier below; each tier has 5 interior pairs (10 total across A1/A2) that are `dH4` midpoints (`endpointHamming 4`), while 4 seams are `dH10` phase-seams (`endpointHamming 0`) but share the same `k±1` provenance. Hence `K` is **exhaustive**, not merely consistent — every same-family `dH4` pair is an interior construction, and every anchor's `{k-1,k+1}` pair realizes as midpoint or seam.

Powers are Pascal over `Z7`:

```math
K^2 = \delta_{-2} + 2\delta_0 + \delta_{+2},\quad K^3 = \delta_{-3}+3\delta_{-1}+3\delta_{+1}+\delta_{+3}
```

Spectrum over `R` is `2cos(2πj/7)` (`j=0..6`); the line `K^7=2δ0` holds **in characteristic 7** as the office-ring formal signature (same family as `M^7=id` for the `+2` permutation), never as a real identity.

A2 is therefore `K^2` of A0: binomial coefficients `[1,2,1]` — the construction exhaustive characterization is the substrate for both photonic variants.

## 3. Two variants — sum vs mean

Let `λ0[k]` be the A0 wavelength at office `k` and `ν̂0[k]=1/λ0[k]` the wavenumber (`nm^{-1}`).

**Variant A — sum_mixing (K-sum in ν̂):**

```math
\hat\nu_t[k] = \hat\nu_{t-1}[k-1] + \hat\nu_{t-1}[k+1],\quad \lambda_t[k]=1/\hat\nu_t[k]
```

Physical constants `c=299792458`, `h=6.62607015e-34`, `eV=1.602176634e-19` give `ν=c/λ`, `E=hν`. Bands are **numeric only** canonical: A1 `[216.09,317.19]`, A2 `[114.06,144.78]` nm (vacuum UV 100-200 / UV-C 100-280 / UV-B 280-315 / UV-A 315-400 per ISO 21348 — labels are Layer-4 prose, not stored canonically). Each office parents exactly two children, so

```math
\sum_k \hat\nu_t[k] = 2^t \sum_k \hat\nu_0[k] \quad (t=1: 0.013632→0.027264, t=2: 0.054528\ \text{nm}^{-1})
```

— the one-line octave proof: frequency/wavenumber doubling is the musical octave `2:1`, so tiers are photonic octaves `A0` visible → `A1` UV → `A2` vacuum UV. Rendering must use luminance/grain/pulse (already in `orrery/src/scene.ts`).

**Variant B — geometric_mean (K-mean in ln λ):**

```math
\lambda_t[k] = \sqrt{\lambda_{t-1}[k-1]\cdot\lambda_{t-1}[k+1]}\quad \Longleftrightarrow\quad \ln\lambda_t[k]=\tfrac12(\ln\lambda_{t-1}[k-1]+\ln\lambda_{t-1}[k+1])
```

Geometric mean is arithmetic mean in log-space, so by `AM≥GM` it stays in the convex hull of A0 lambdas: A1 `[433.59,637.18]`, A2 `[462.79,591.25]` nm — hull-preserving. The asymmetry `sum vs mean` is principled: sum gives octave doubling, mean gives hull preservation — stated explicitly, both retained like `Q` and `W`.

## 4. Tiered constants table

A0 source: `schemas/governors.yaml` and `photonic-records.json` (700/610/580/530/470/430/400). Derived 14 anchors (office-sorted, tier `A1|A2`):

| office | A1 sum λ (nm) | A1 geom λ | A2 sum λ | A2 geom λ |
|---|---|---|---|---|
| Sun `k0` | 241.58 | 493.96 | 144.78 | 591.25 |
| Moon `k1` | 317.19 | 637.18 | 130.45 | 529.97 |
| Mars `k2` | 283.60 | 568.59 | 142.77 | 576.78 |
| Mercury `k3` | 259.62 | 522.11 | 129.22 | 521.00 |
| Jupiter `k4` | 237.40 | 477.39 | 117.93 | 475.80 |
| Venus `k5` | 216.09 | 433.59 | 125.53 | 511.77 |
| Saturn `k6` | 266.37 | 548.63 | 114.06 | 462.79 |

Verification: variant A 7/7 A1 exact, 7/7 A2 exact; variant B 14/14 exact (recomputed from λ table in ring order Sun→Saturn neighbors). Bands as above.

Per-record `photonicCompression`: `null` + `bandMetadata` for variant A (extended gamut needs versioned successor to `photonicCompression∈[0,1]`); defined in `[0,1]` for variant B via `(1/λ−1/700)/(1/400−1/700)`.

## 5. Interpretation policy and guards

```text
causationClaim:false
physicalQuantityClaim:false    (on the binding, not the physics constants c/h)
tierClassifier:false           (not a tier classifier — topology remains authority)
globalCHNull:true              (harmonic.C_H = null guardLiteral preserved)
```

The sidecar is an authored informational coordinate. Any `C_P`/`C_H`/`C_S`/`kappa_court`/`thermo` equivalence requires a separate comparison artifact; `C_H` stays `unresolved` (`seven-governors-harmonic-invariants-v0.1.0/canonical/compression-namespace-guard.json`).

## 6. Scope and falsification

Applies only to 14 A1/A2 anchors, both variants. It does not establish:

- D1-D7, satellites, boundaries;
- global photonic law;
- perceptual color (metamerism breaks injectivity; renderer projection only);
- true FM/Bessel sidebands (variant C deferred — requires authored `β`).

Global extension fails if: any `{k-1,k+1}` pair ceases to match provenance, channel term is required, `λ` outside declared numeric band where hull predicted, or `C_H` guard violated.

## 7. Deferred work

`D1-D7` extension, `satellite/boundary` evaluation, `C_P/C_H/C_S` correspondence, true FM (`β`) Bessel structure.

## 8. GOV-2XX scoped admission

```text
candidateId: CH_TIERED_v1
coordinateId: photonic.tiered_v1
status: admitted_informational_sidecar
authority: root_owned_informational_sidecar
admissionEffect: tiered_photonic_constants_only
```

Evidence: 6 source bindings (including `photonic-records.json`), 28 records (14×2), both bands, channel-independence gate, 7/7 seam both-variant inclusion, 15-check validation, `C_H` null guard.
