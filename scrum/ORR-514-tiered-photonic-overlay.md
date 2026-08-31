# ORR-514 - Photonic candidate overlay surface

**Status:** Backlog · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-511](EPIC-511-orrery-evidence-surfaces.md) · **Sprint:** Sprint 3
**Depends on:** ORR-511 · **Blocks:** ORR-524

## Story

As an Orrery user, I want a source-bound photonic candidate overlay so I can
inspect candidate evidence without changing canonical endpoints or legal moves.

## Scope

- Consume the pinned bundle from `canonical/tiered-photonic-candidates/tiered-photonic-v1.json`.
- Support all 14 A1/A2 anchors, both variants, provenance edge IDs, and spectral bands.
- Enforce channel discipline: Variant A uses luminance, grain, and pulse only; Variant B may use hue.
- `scene-composer.ts` must keep legacy representative wavelength visibly distinguished from GOV-2XX evidence.

## Acceptance criteria

1. Displays all 14 A1/A2 photonic candidates with explicit variant and band labels.
2. Variant A channels are restricted strictly to luminance, grain, and pulse modulation.
3. Legacy representative wavelengths in `scene-composer.ts` are rendered with distinct visual identity.
4. Contract tests prove zero mutation to `/nodes` endpoints or legal-move catalogs.
5. Photonic values are never derived or interpolated in the renderer; all displayed values come directly from the pinned bundle.

## Non-goals and guards

- Do not change `/nodes` endpoints or legal-move catalogs.
- Do not derive, interpolate, or promote photonic candidate values to canonical authority.

## Verification

- `npm run validate:tiered-photonic --silent`
- `npm run orrery:check`

## Definition of done

The overlay renders the pinned photonic values with the required channel
discipline and evidence distinction while preserving endpoint and legal-move
contracts.

## References

- `canonical/tiered-photonic-candidates/tiered-photonic-v1.json`
- `orrery/src/scene-composer.ts`
