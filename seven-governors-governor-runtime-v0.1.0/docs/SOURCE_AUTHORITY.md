# Source Authority

## Policy

The package follows `../docs/GOVERNOR_DOMAIN_AUTHORITY.md` at the integrated
release root: authority is claim-specific, machine data controls accepted
runtime facts, and downstream classification cannot write topology, Degree
Governor metadata, profile canon, or admission state.

This package does not copy or edit frozen upstream packages. The deterministic
builder reads an explicit source list and records the SHA-256 of exact bytes in
`canonical/policy-release.json`. `--check` fails when any source changes without
a regenerated reviewed policy.

## Sources

| Source ID | Integrated-release path | Authority | Admission/runtime use |
|---|---|---|---|
| `source:governor-runtime-crosswalk:0.1.0` | `seven-governors-governor-runtime-v0.1.0/source/feature-crosswalk.json` | Runtime policy | Canonical package input |
| `source:governor-runtime-policy-input:0.1.0` | `seven-governors-governor-runtime-v0.1.0/source/policy-input.json` | Runtime policy | Canonical package input |
| `source:governor-domain-authority:1.0.0` | `docs/GOVERNOR_DOMAIN_AUTHORITY.md` | Runtime authority contract | Canonical namespace limits |
| `source:feature-registry:0.1.1` | `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/feature-registry.json` | Profile registry | Canonical 31-ID vocabulary |
| `source:photonic-records:0.1.1` | `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/photonic-records.json` | Profile registry | Canonical anchors and SI derivations |
| `source:canonical-governor-profiles:0.1.1` | `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json` | Profile registry | Canonical authored correspondences/reference pools |
| `source:profile-registry-release:0.1.1` | `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/registry-release.json` | Profile registry | Release ID/fingerprint binding |
| `source:domain-projection-registry:0.1.1` | `seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/domain-projection-registry.json` | Profile registry | Verifies landforms is the sole executable projection |
| `source:physical-phenomena:0.2.0` | `seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/physical_phenomena.yaml` | Candidate companion | Proposed evidence only; no runtime authority |

The candidate phenomenon source may supply a scoped physical formula and an
authored descriptive hypothesis. It cannot populate active aspect/rule lists,
authorize a causal claim, or become integrated canon through this package.

Neo4j, model output, optional vault notes, runtime task state, and renderer
state are not GOV-202 source authorities.
