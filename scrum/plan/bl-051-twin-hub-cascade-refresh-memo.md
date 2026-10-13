# BL-051 — Twin-hub cascade refresh (memo)

**Date:** 2026-10-13. **Status:** landed — D4-bound evidence preserved before the
first shared-artifact refresh; the ledger-dependent stale cascade refreshed under
the evidence-binding convention's enforcement vehicle. No claim event, no record
amendment.

**Authority:** the BL-082 planning pass, approved 2026-10-13 with rulings OD-1(a)
through OD-5(a). This memo records the BL-051 execution only; BL-052 is the
separate promotion-refresh landing (its own commit and ledger entry).

## 1. P0 — D4-preservation before any refresh (ENTRY 11 precondition)

Preserved byte-identically, before the first refresh step, under
`qa/halt-evidence/twin-hub-convergence-pre-refresh/`:

| Preserved | Source | sha256 | Blob OID | Fingerprint |
|---|---|---|---|---|
| `twin-hub-convergence-v0.json` | `canonical/fivefold-incubator/twin-hub-convergence-v0.json` | `972394e5…`, 12,396 B | `3b76f664…` | `3885bf83…` (projection `cf796971…`) |
| `twin-hub-convergence-validation.json` | `qa/twin-hub-convergence-validation.json` | `b7f924ca…`, 5,369 B | `051e7fdf…` | report `35f88720…`, 30/0 PASS |

`preservation-receipt.json` (same directory) records both raw-byte digests, the
pre-commit blob OIDs, the payload-projection recipe (`json.dumps(core, sort_keys,
separators)`, core = document minus `candidateFingerprint`/`evidenceBindings`;
raw-bytes-sha256), the ENTRY 10 region under both labeled recipes (line-join
`201efe81…`; keepends `50b8b73f…` — reproduced identically post-append), and the
ledger state at preservation (`fb2b9b9e…`, 214,223 bytes). The preserved
validation report carries the stale gate's provenance (which candidate it
validated; what its 30 checks covered). No historical byte was restored,
synthesized or overwritten.

## 2. Cascade refresh (against the amended ledger, ENTRY 19)

Stale scope was verified by execution: the predeclared `STALE_TWIN_HUB_CONVERGENCE`
plus the ledger-bound chain artifacts it gates — `STALE_FIFTH_SPACE_CENSUS`,
`STALE_SHADOW_LADDER`, and the pentatonic binding audit closure's decision-ledger
binding. All four were refreshed with the payload semantic content required
byte-identical (OD-2 geometry-drift halt pre-registered; not triggered — the
projection of each artifact is unchanged from the preserved/pre-refresh bytes).

| Artifact | Pre-refresh | Post-refresh | Validator |
|---|---|---|---|
| twin-hub convergence | `3885bf83…` (proj. `cf796971…`) | `31c1bf00…` (proj. `cf796971…`) | `confirmed`, 30/30, report `c8f4cf5f…` |
| fifth-space census | proj. `099528b8…` | `2bfad475…` (proj. `099528b8…`) | 24/24, report `8bdcbd37…` |
| shadow-ladder | proj. `25f7c68c…` | `3aea3277…` (proj. `25f7c68c…`) | 37/37, report `1605ed23…` |
| pentatonic closure | `reportFingerprint` re-issued | report `ed2c98d1…` | 11/11, ledger binding `fa0aa7b7…` |

The refreshed artifacts bind the amended ledger (`fa0aa7b7…`); the prior bytes
remain resolvable at the preserved paths (versioned, not destructive). The
downstream orrery projections (field-derivation bundle, taxonomy read model,
D-tier taxonomy dataset) were refreshed from the refreshed candidates; their
`--check` modes pass and the orrery chain (`orrery:check`) is green.

## 3. Convention enforcement vehicle (OD-4(a))

- `scripts/validate-evidence-bindings.mjs`: explicit `CANONICAL_PLANNING_EVIDENCE`
  and `PROMOTION_EVIDENCE` registry lists; the two refreshed artifacts are now
  R5/R6-checked members of the bounded registry.
- `src/governor/twin_hub_convergence.py`: emits the convention's R5
  generator-provenance fields at emit time — `generator`, `generatorDigest`
  (script digest at emit time), `invocation`, `generatedAt` (declared emission
  date; execution timestamps live in the ceremony receipt, per the convention's
  sidecar guidance). Twin-hub R5: PASS.
- `scripts/build-fivefold-engine-promotion-evidence.py`: same four fields (the
  refreshed promotion evidence is BL-052).
- Schema envelopes gain only the four declared R5 property definitions
  (`schemas/fivefold-incubator/twin-hub-convergence-v0.schema.json`;
  `schemas/fivefold-engine-promotion-evidence.schema.json`).
- Test coverage: `scripts/validate-evidence-bindings.test.mjs` asserts the
  refreshed canonical planning evidence's registry membership, R5 PASS and R6
  cleanliness (10 tests green).

The span-binding migration for living payloads remains prospective follow-up
under the convention's section 4 — the refreshed artifacts keep their existing
whole-file provenance bindings inside the unchanged envelope (the first R2 span
binding exists since BL-058/BL-081 in the D4-R2 sidecar).

## 3b. Frozen-chain resolution (BL-080 execution validator)

The BL-080 Gate 3 execution validator
(`orrery/scripts/validate-bl080-governs-derivation-execution.mjs`) bound the
frozen `twinHubReceiptSha256` (the pre-refresh validation report sha
`b7f924ca…`) against the live report path. After the authorized refresh, the
frozen bytes live at the preserved path. The validator now resolves the frozen
binding against the preserved pre-refresh copy declared in the preservation
receipt (`qa/halt-evidence/twin-hub-convergence-pre-refresh/preservation-receipt.json`)
when the live report no longer carries the frozen bytes — ENTRY 11's historical
evidence preservation rather than production rebinding; the resolution fails
loud when the pinned bytes resolve at neither location. The sealed receipt
(`qa/bl080-governs-derivation-receipt.json`), the frozen generation
(`qa/d4-production-generation.json`) and the frozen `scripts/d4-*.mjs` stack are
byte-untouched; `orrery:bl080-governs-derivation-execution:check` passes
(G3-1…G3-5). This exercises the convention's R3 requirement that historical
bindings remain resolvable when a shared live artifact changes. The frozen D4
production launcher's (`scripts/d4-production.mjs`) live-tree packaging
precondition for the twin-hub row is historically superseded by the same
preservation (not rebinding); the frozen stack is not modified.

## 4. Verification gates

- Payload projections unchanged ×3; validators 30/0, 24/0, 37/0; closure
  `--check` PASS; focused suites 22 passed.
- `validate:ledger-pins` PASS (0 violations; inventory tests 8 passed).
- `validate:evidence` advisory run recorded (twin-hub R5 PASS, R6 clean; the
  promotion evidence's R5 finding remains the BL-052 target).
- Full `npm run validate` (venv `python3`): passes `validate:twin-hub`,
  `validate:fifth-space-census`, `validate:d-shadow` and `validate:gov514`, and
  stops at `validate:release`'s integrated receipt — 416/2, the same two
  pre-existing recorded authority questions as the freeze state (frozen composite
  package payload identities; retained 1.8.1 full-database baseline), with no new
  unnamed regression. `STALE_TWIN_HUB_CONVERGENCE` no longer appears.

## 5. Fences

No claim event; no record amendment (ENTRY 10/15/16/17/18 byte-untouched; fence
re-verified post-append); no governs admission; no INV-5 graduation; no
M-walkability promotion; no directional-semantics assignment; no G1 movement; D4
`derivable-from-derived-inputs` and D7 hypothesis-tier unchanged; no
canonical/Court/Neo4j writes beyond the refresh's own artifacts; the frame is
interpretation vocabulary; session prose is context, not evidence.

## 6. Files

- Preserved: `qa/halt-evidence/twin-hub-convergence-pre-refresh/` (3 files).
- Refreshed: the three incubator candidates + reports; pentatonic closure.
- Receipt: `qa/specs/bl-051-twin-hub-cascade-refresh.json`.
- Changed: validator + registry lists, twin-hub module + schema, promotion
  generator + schema, evidence-bindings tests, the BL-080 execution validator
  (frozen-chain resolution); the three downstream orrery projections; ledger
  (ENTRY 19); backlog; inventories.
