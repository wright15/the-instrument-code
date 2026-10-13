# BL-052 — Promotion refresh memo (GOV-517 re-registration under GOV-526 + promotion evidence refresh)

**Date:** 2026-10-13. **Status:** landed — both predeclared stale gates cleared;
the release sequence's remaining items are the two recorded pre-existing
authority questions (not gates). No claim event, no record amendment.

**Authority:** the BL-082 approved plan (OD-1(a)-OD-5(a) plus the GOV-517
correction), the ENTRY 11 mandate for the GOV-517 re-registration, and the ENTRY
12 convention section 4 live test 2. ENTRY 20 records this landing; BL-051 is
ENTRY 19. The re-registration executes under the next free GOV-52X ticket,
**GOV-526**, with the re-execution bounded to the G1-G5 stages as originally
scoped.

## 1. GOV-517 re-registration (GOV-526)

Emitter: `qa/gov-517-input-registration.mjs` — now records the convention's
binding model per the maintainer's correction:

- **R1:** each binding carries `recipe`, `digest` and `byteLength` over the
  exact raw bytes of the source (legacy field names retained for the historical
  consumers).
- **R4:** the named recipe is `raw-bytes-sha256` from
  `provenance/digest-recipes.json`.
- **R5:** top-level `generator`, `generatorDigest` (script digest at emit time),
  `invocation`, `generatedAt`.

Fresh registration: `qa/gov-517-input-boundary-registration.json`
(`GOV-526-GOV-517-re-registration`, status green; three bindings verified; the
21-anchor enumeration and mask load reproduce). The ENTRY 11 census-binding
incident is resolved by binding the currently committed bytes: the census
binding records the committed refreshed digest `effa4389…` in place of the
historical unmatched pin `ad857ab9…` — history is disclosed in the
registration's `re_registration` block, never restored or synthesized.

Full authorized re-execution (input registration → preflight → live derivation →
comparison):

- Preflight: `qa/gov-517-preflight-report.json` — green; controls green; 121
  tests passed (includes the updated registration test with the R1-field
  assertions).
- Live derivation: `qa/gov-517-canonical-derivation-report.json` — category
  `derived`; T1/T2/T3 PASS; four-cell 14/0/0/0 `both`; the report carries the
  R5 `emitter` block and the `registrationTicket: GOV-526`.
- Invariance: the generation block is **identical** to the historical run and
  the canonical reference digest `02fd68db…` is reproduced exactly. The seal
  digest changes `7bb41ba1…` → `170fd50b…` as expected — the seal covers the
  input bindings and the census digest moved from the unmatched pin to the
  committed refreshed bytes.
- INV-1, INV-2 and INV-4 re-asserted exactly on the fresh execution; INV-3b
  (strong form) and INV-5 remain gated and are not asserted.

## 2. Promotion evidence refresh

`scripts/build-fivefold-engine-promotion-evidence.py` re-emitted
`qa/fivefold-engine-promotion-evidence.json` against ENTRY 20's ledger:
admission status `admitted`; 10 item-evidence groups and 11 exclusion-evidence
groups, all PASS; verdict PASS; the contract unchanged; the R5 fields present
(`generatorDigest` computed over the generator's bytes at emit time). The
independent validator passes (13 focused tests green) and the builder's
`--check` reproduces the refreshed bytes — `STALE_FIVEFOLD_ENGINE_PROMOTION_EVIDENCE`
cleared. The refreshed evidence is a registry member of the advisory validator
(`PROMOTION_EVIDENCE`) and is R5/R6 clean.

## 3. Cascade re-refresh against ENTRY 20

The ledger-bound cascade refreshed by BL-051 was re-refreshed in this same
landing (append first, then regenerate — the established order): the twin-hub,
census and shadow-ladder candidates with their validation reports and the
pentatonic binding audit closure, plus the downstream orrery projections
(field-derivation bundle, taxonomy read model, D-tier taxonomy dataset). All
payload projections are unchanged; validators report 30/0, 24/0, 37/0 and 11/11;
post-ENTRY-20 fingerprints are recorded in the BL-052 receipt
(`qa/specs/bl-052-promotion-refresh.json`) and the refreshed reports.

## 4. Verification gates

- Focused suites: 35 passed; `validate:ledger-pins` PASS (0 violations).
- `validate:evidence` PASS (advisory validator + 11 tests; registry 35/35
  registered; both refreshed artifacts R5 PASS / R6 clean).
- `validate:fivefold-engine-promotion-evidence` PASS.
- `orrery:check` exit 0 (the BL-080 execution check passes through the
  preserved-binding resolution introduced in BL-051).
- Full `npm run validate` (venv `python3`): reaches `validate:release` with the
  integrated receipt **416/2** — the two pre-existing recorded authority
  questions only (frozen composite package payload identities; retained 1.8.1
  full-database baseline); no stale gate remains; no new unnamed regression.
- `validate:prose-consistency`: 20 pre-existing violations, zero added
  (generated output restored per BL-080 precedent).

## 5. Fences

No claim event; no record amendment (ENTRY 10/15/16/17/18/19 byte-untouched;
ENTRY 10 fence re-verified post-append); no governs admission; no INV-5
graduation; no M-walkability promotion; no directional-semantics assignment; no
G1 movement; D4 `derivable-from-derived-inputs` and D7 hypothesis-tier
unchanged; no canonical/Court/Neo4j writes beyond the refresh's own artifacts;
G1-G5 scope, no expansion; the frame is interpretation vocabulary; session prose
is context, not evidence.

## 6. Files

- Fresh: `qa/gov-517-input-boundary-registration.json` (R1/R4/R5),
  `qa/gov-517-preflight-report.json`, `qa/gov-517-canonical-derivation-report.json`
  (emitter block), `qa/fivefold-engine-promotion-evidence.json` (R5).
- Changed: the registration emitter + derivation emitter + registration test;
  the cascade artifacts, reports and orrery projections; the promotion evidence
  schema was already extended in BL-051; `qa/specs/bl-052-promotion-refresh.json`;
  ledger (ENTRY 20); backlog; inventories.
