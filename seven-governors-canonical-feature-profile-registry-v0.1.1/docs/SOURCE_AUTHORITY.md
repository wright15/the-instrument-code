# Source Authority and Epistemic Boundaries

## Frozen inputs

The package embeds read-only copies of:

- `governors.yaml`;
- the universal network data;
- topology identity definitions;
- mutation operator candidates and applications;
- the four current framework documents.

Their SHA-256 hashes are recorded in `qa/validation-report.json`.
The same map and a release fingerprint are stored in
`canonical/registry-release.json`.

## Authority order

1. Framework documents define architecture, vocabulary, invariants, and
   prohibitions.
2. `governors.yaml` supplies the canonical seven office records and reference
   libraries.
3. Universal topology data supplies rooted state identity and office resolution.
4. Mutation-audit artifacts supply exact structural operator behavior.
5. Build scripts derive physical calculations, registry coordinate
   conventions, CSV, and deterministic fingerprints.
6. The Neo4j graph is the integrated runtime view of a named release; it does
   not silently become the authoring authority.

Generated output cannot silently override a higher-authority source.

## Claim classes

| Class | Example | Treatment |
|---|---|---|
| measured/physical calculation | `ν=c/λ`, `E=hν` | reproducible from declared wavelength |
| formally audited | Hamming-2 edge, modal successor | accepted within the declared 12-TET substrate |
| framework-declared | Sun ↔ Lydian, landform references | canonical authored correspondence |
| derived implementation | normalized `C_P`, non-metric `C_S` display ordinal, packet fingerprint | versioned and reproducible |
| semantic hypothesis | “R7 promotes containment” | unresolved until admitted |

`C_P` is a normalized inverse-wavelength coordinate derived from the seven
representative office wavelengths. Its Sun=0 and Saturn=1 endpoints are a
registry normalization convention. `C_H` is intentionally unresolved. `C_S`
records the authored Sun-to-Saturn process order. Its normalized ordinal is a
display convention, explicitly `metric=false`; neither equal spacing nor a
physical quantity is claimed.

## `governors.yaml` status

`source/governors.yaml` is preserved as a frozen authoring snapshot because it
contains semantic detail not reducible to the topology graph. It is not the
integrated runtime lookup mechanism. The file-backed build consumes it; a
running project should compile through the active Neo4j release.

The YAML names seven documents or schemas that are not included in this
companion package. They are listed in
`canonical/source-authority-registry.json` as
`legacy_or_external_reference_unresolved`, with `runtimeAuthority=false`.
Nothing in this release follows those dangling references or treats them as
present.

## Version 0.1 non-claims

This release does not claim:

- that color or wavelength is caused by a scale;
- that a Degree Governor determines the destination State Governor;
- that harmonic distance is semantic distance;
- that a semantic operator delta has already been discovered;
- that a structural or confluence fixture is semantic-effect evidence;
- that Carey `CQ` or `SQ` varies by mode within one family;
- that a boundary state has a latent office which may be guessed.
