# Three-Part Continuous Typology

**Status:** Registered governance document — registered by the decision-ledger entry "Three-Part Continuous Typology registration — docs/THREE_PART_CONTINUOUS_TYPOLOGY.md — 2026-09-07" (hash-pinned at registration). **Enforcement:** the semantics below are registered here and enforced nowhere yet; a validator hook for the claim flags is a successor's scope.

## Purpose and scope

This document governs all continuous-facing claims in the repository: any receipt, artifact, or prose that touches continuous mathematics — real constants, physical units, floating-point values, energy relations, wave mechanics — does so only through one of the three modalities below. It is binding on receipts via the claim-flag schema. It registers discipline only: it asserts no physics, endorses no candidate, admits nothing, assigns no GSL number, and contains no C_H value, formula, or derivation content.

Per-modality artifact counts are cited as-is (for example: the photonic overlay's record count; the universal census's 70/238/154 role decomposition; the BL-089 anchor and satellite populations). Cross-modality count reconciliation is outside this document's scope; wherever it is attempted it is a derivation claim, not a governance statement.

## Modality 1 — `domesticated_optimization` (exact rational execution)

Convex geometry — hyperplanes, convex hulls, Lagrange duality — is used as a question generator and solved exclusively by exact rational arithmetic over an explicitly stated coefficient ring (for example the rationals). Modular-characteristic phrasing is not used for rational arithmetic. Floating-point values may appear only in supporting roles and only with explicit rounding or tolerance bounds; a floating-point claim without stated bounds is prohibited, and a claim is not made uncheckable by being floating-point — it is checkable within its stated bounds.

Receipt binding: `docs/A_TIER_TRIADIC_COMPRESSION_THEOREM.md` (Theorem 3′: ε* = 3/407, dual weights summing to Σλ = 407/407 as recorded in the candidate artifact) with `canonical/harmonic-compression-candidates/CH_A012_q_v1.json` (certificate.epsilonStar, dualCertificate). Exact-rational receipts declare their coefficient ring explicitly and are checkable within stated bounds; a dedicated receipt flag for exact-rational execution, if desired later, is a successor schema concern — no such flag is registered here.

## Modality 2 — `boundary_conditioned_contact` (E = hν as boundary condition)

Real-world continuous constants — wavelength bounds, wavenumbers, Planck's relation — are admitted strictly as external boundary conditions, never as internal foundations. A numeric interval is a recorded boundary condition with a source artifact, not a claim about the physical gamut of its referent: the numerical A0 interval [400,700] nm (phrasing per the obs-draft corrections; values are the min/max of the A0 source list in `docs/TIERED_PHOTONIC_THEOREM.md` — Sun 700 … Saturn 400 at its source table and :101 list) is an executed boundary condition of that document's arithmetic. A relationship between a discrete scalar and a continuous relation (for example between a phase constant and E = hν) is recorded as a structural correspondence only — no causation, no physical-quantity claim.

**The registered interpretation flags**, as landed in the guard block of `docs/TIERED_PHOTONIC_THEOREM.md` (:119-124), are: `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true` (the guard preserves `harmonic.C_H = null` as a guard literal). The artifact `orrery/src/generated/photonic-overlay.v1.json` carries, in its interpretationPolicy, three of these four flags plus `channelDiscipline` (variant rendering discipline); `globalCHNull` lives in the theorem guards, not the artifact policy. All four are required-by-registration on future binding receipts under this modality. The overlay schema (`schemas/harmonic-orrery-photonic-overlay.schema.json`) currently permits any interpretationPolicy object (`additionalProperties: true`), so enforcement is convention and registration, not schema-validated — the flags are **enforced nowhere yet**, and a validator hook is a successor's scope.

Recorded non-example: the value 325.9 nm has appeared in working discussion without artifact backing; it is not a verified value and must not be carried into receipts. Fibonacci-derived ratios may appear only as scoped, non-causal observations with their source stated; they assert no generative mechanism.

## Modality 3 — `excluded_substrate` (discrete only)

The discrete substrate — pitch-class bitmasks, Q-engine state spaces, symmetry groups, pcSum arithmetic — is pure discrete mathematics; continuous mathematics is entirely excluded from it. Receipt bindings: the GOV-520 production lineage — `qa/gov-520-preflight-receipt.json` and `qa/gov-520-production-receipt.json` record the enumeration's byte-identical output digest across rehearsal and production executions (zero floating-point; deterministic). Citation here is by named binding, not by family: other discrete-substrate artifacts in the tree, including artifacts named GOV-517 from earlier cycles, are outside this document's citation scope. A scalar derived natively on this substrate (for example a pcSum-derived aggregate) is computed here before any Modality 2 mapping exists; a Modality 2 mapping for such a scalar is a structural-correspondence claim requiring the Modality 2 flags, never a physical assertion.

## Anchor-scoping forward pointer

The office rule — office = (C − pcSum) mod 7 with C = 4, applied directly to anchors and inherited from governing anchors for satellite-shaped objects — is registered content of the BL-089 planning evidence (`scrum/plan/bl-089-anchoring-remainder-interaction-memo.md`; artifact `orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json`). This document cites it; it does not restate, verify, or extend it.

## Governed open question (gates the aggregate program)

Open question (governs the aggregate inspection spec, answerable only by maintainer ledger registration): what question does a pcSum-derived aggregate over a registered census answer? The successor ticket may not open until this question is answered by ledger entry; the spec must derive from the registered question; any change to the question after spec work begins requires a new boundary.

## Non-claims

No physics. No candidate endorsement. No admission. No GSL number. No C_H value, formula, or derivation content. Session prose is context, not evidence.
