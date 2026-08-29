# GOV-501 - Neo4j baseline parity refresh

**Status:** Done · **Priority:** High · **Points:** TBD · **Epic:** [EPIC-500](EPIC-500-state-honesty-and-baseline-parity.md) · **Sprint:** Sprint 1
**Depends on:** GOV-212 · **Blocks:** GOV-502

## Story

As a release maintainer, I want the current Neo4j projection baseline proven by
separate reproducibility and deployment records so release provenance can state
parity without conflating an isolated test harness with a configured target.

## Scope

- Parameterize normalized-snapshot and full-database receipt identities by the
  declared integrated release.
- Capture a native clean-import reproducibility receipt and a separately
  configured bootstrap/roundtrip receipt for the same normalized snapshot.
- Repin the baseline only after the stated projection counts, readiness, source
  parity, and byte-identity conditions pass.
- Regenerate every ledger-bound planning-evidence artifact before closure.

## Acceptance criteria

1. `qa/neo4j-full-database-validation.json` records isolated clean-import
   reproducibility for `seven-governors-integrated-1.8.1` with 3,061 nodes,
   10,506 relationships, source parity, readiness, and normalized-byte identity.
2. `qa/neo4j-deployment-roundtrip-validation.json` separately records configured
   bootstrap and roundtrip evidence without persisting URI, credentials, or an
   import directory; its target class is explicit.
3. `provenance/neo4j-full-database-baseline.json` pins snapshot fingerprint
   `fd089ea9a0b91d1572b0efeeaa724a53e9d182e8bbc6f793111f52873a41c1a1` and
   the matching seven namespace fingerprints.
4. The release gate requires both receipts and binds the declared retained
   baseline rather than a hard-coded historical release identity.
5. No canonical topology, graph payload, admission, Court policy, runtime
   authority, or global `harmonic.C_H` value changes.

## Non-goals and guards

- The native harness and configured deployment receipt are distinct evidence;
  one cannot substitute for the other.
- Do not treat the disposable Neo4j target as canonical authority.
- Arithmetic output wins over planning assumptions. Any changed count requires a
  written derivation; no literal is silently adjusted.

## Verification

- `npm run test:neo4j:full`
- `npm run validate:neo4j:deployment`
- `npm run validate:shadow-ladder`
- `node scripts/build-pentatonic-binding-audit-closure.mjs --check`
- `npm run package:manifest --silent && npm run validate --silent`

## Definition of done

Completed by commit `21e0eec` (`GOV-501: Close 1.8.1 Neo4j baseline`) with the
two receipts, repinned baseline, and fixed-point validation recorded.

## References

- `provenance/release.json`
- `provenance/neo4j-full-database-baseline.json`
- `provenance/DECISION_LEDGER.md`
- `provenance/SOURCE_AUTHORITY.md`
