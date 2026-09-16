# D4 Wire-Schema Addendum

**Status:** spec addendum for maintainer confirmation only. No engine, pre-flight, execution, verdict, or H-disposition is authorized. ENTRY 9 remains the sole freeze authority; this addendum inherits the frozen predicates and completed Outcome Contract verbatim and adds only wire mechanics.

**Scope:** fixes the concrete JSON shapes for §5 receipt/seal obligations and §7 control tuples, the five counts' encoding, ordering and reject-coercion rules, and the third-28s naming condition. Formal machine schema: `schemas/d4-derivation-wire.schema.json` (schema version `d4-derivation-wire.v1`).

## Third-28s Clause

Three distinct 28-element populations exist in this ecosystem and must never be conflated by a grep for the numeral alone:

1. `CONSTRUCTS` edges — 28 directed A-tier construction transitions; D5's granted substrate (ENTRY 7/8 lineage).
2. D4/D5 combined contact rows — 28 selected `SEAT_CONTACT` audit rows (14 D4 + 14 D5); downstream observation population from which the comparator selects the D4-only subset. Only the D4-only contacts define O; the combined population as a whole does not.
3. A1 `GOVERNS` slice R — 28 directed edges with stored direction source h (A1 parent anchor) to target s (A1 satellite); D4's granted substrate under ENTRY 9. "Satellite-to-parent" describes inheritance informally only; stored endpoint direction is authoritative.

Receipt prose and code identifiers must qualify every bare count with one of the three names above. The comparator's U is defined exclusively from population 3; O is defined exclusively from the D4-only subset of population 2; population 1 defines neither.

## Encoding, Ordering, Coercion

- All integer wire quantities (state IDs, office indices, masks as canonical integer identities, `mid` values, expected/visited/output counts, all five accounting counts) are canonical decimal strings matching `^(0|[1-9][0-9]*)$`, with office indices further restricted to `^[0-6]$`. JSON numbers, booleans, null, or non-canonical forms (leading zeros, whitespace, signs) are rejected; no coercion is performed.
- Key strings use the exact form `parentOffice:satelliteId`, e.g. `0:1371`, matching `^[0-6]:[0-9]+$`.
- SHA-256 fields match `^[0-9a-f]{64}$` lowercase.
- Witness/relation/key lists are sorted lexicographically by defined tuple encoding with uniqueness enforced: typed integers compare numerically where the schema fixes numeric meaning, edge/class/category strings compare by code-unit order, never locale. Deduplication applies only to identical full tuples; key projection must not erase witness provenance.
- Enum sets are closed: `category` is exactly one of `invalid`, `incomplete_or_anomalous`, `filter_plus_geometry`, `restatement_signature`, `overshoot`, `derived`, `not_derived`; route tags are `kernel_twin` and `construction_join`; contact cells are `A-only`, `B-only`, `both`, `neither`; control `state` is `ran` or `skipped` with a non-empty reason. `restatement_signature` is both the frozen category name and the per-route boolean flag; the two fields must not be conflated.

## Shape Summary (Normative Shapes In Schema)

- `bindings`: frozen boundary/spec/implementation digests plus `ledgerSha256`, `networkSha256`, `twinHubReceiptSha256`, and projection digests for R, E, anchors.
- `generation.routes.T-A.witnesses`: `(a,b,h,s,k)` objects tagged `kernel_twin`, ordered pair preserved.
- `generation.routes.T-B.witnesses`: `(e1source,e2source,h,s,parentOffice,e1id,e2id)` objects tagged `construction_join`.
- `generation.tC.relations`: `(tier,a,b,mid)` with tier `A0`/`A1`.
- `generation.completion`: per-route expected/visited/outputs/digests plus explicit status; `seal` binds outputs, completion, and input identities before any observed read.
- `comparison.rows`: every retained contact row with `(contactRowId,d,s,h,parentOffice)`, key `(parentOffice,s)`, and membership `A-only`/`B-only`/`both`/`neither`; rows and deduplicated keys counted separately.
- `comparison.routes.A/B`: the five frozen count fields with sorted `generatedKeys`, `matchedObservedKeys`, `missedObservedKeys`, and `restatement_signature`; count/list equality plus the conservation identities `|G| = |G intersect U| + |G minus U|` and `|U| = |G intersect U| + |U minus G|` are acceptance requirements.
- `comparison.tC`: matches/missing/extra lists, `midpoint_exact` boolean (nonempty complete-set equality only), and separately retained A1 output.
- `controls`: all 18 keys from §7 (`binding`, `isolation`, `route_isolation`, `kernel_perturbation`, `edge_deletion`, `production_E_completeness`, `anchor_input`, `edge_input`, `T-C`, `contact_join`, `seam_input`, `seal`, `completeness`, `R_bounds`, `accounting`, `outcome_precedence`, `determinism`, `nonvacuity`), each with `state`, `reason`, `observed_gate`, `evidence`, `cleanCounterpart`, `implementationDigest`.
- `category`: exactly one frozen category; all diagnostics retained regardless of precedence.

## Corrected v1 Changelog (Against Base SHA-256 `beb422487def16ca68c9c377a2acfa7d05c15acdfeccf1fde540a3b82d5d8c80`)

Schema version stays `d4-derivation-wire.v1` per the corrected-v1 registration
decision; this block is the audit trail of the in-place amendment. Frozen
boundary and implementation-spec predicates are unchanged by every item below.

1. **Explicit stage markers.** `generation`, `seal`, and `comparison` each accept
   their full executed schema or `{"status": "ABSENT", "reason": "<non-empty>"}`.
   Each of the 18 control slots accepts the full `controlResult` or the same
   absent marker. Root keys stay unconditionally required; absence is stated,
   never half-asserted (`seal.complete: false` remains rejected). New
   `definitions.absentMarker` carries the marker shape.
2. **First-class accounting evidence.** `routeAccounting` gains `inRKeys`,
   `extraBeyondRKeys`, `rMissedKeys`, and `inRButUnmatchedKeys` key lists;
   `comparison` gains `observedKeyCount`, `fourCellCounts`
   (`aOnly`/`bOnly`/`both`/`neither`), and the complete `uKeys` set.
3. **Typed control evidence.** `controlResult` gains required boolean `rejected`;
   `evidence` and `cleanCounterpart` are now structured `evidenceDetail`
   objects (`summary` required, `detail` optional) instead of free strings.
4. **Typed T-C operands.** `comparison.tC` gains `generatedRelations`,
   `observedRelations` (arrays of `tCRelation`: `tier`/`a`/`b`/`mid`), and
   `seamProvenance` (arrays of `seamGroup`: `targetH`/`parentA`/`parentB`/
   `parentOffice`/`edgeId1`/`edgeId2`). Entries of `matches`/`missing`/`extra`
   use the canonical relation key form `tier:a:b:mid` by documented convention,
   enforced by the engine's exact string comparison and pre-flight checks rather
   than by the schema's `minLength` rule.
5. **Strict key patterns.** All key-string items now require
   `^[0-6]:(0|[1-9][0-9]*)$`; the satellite component no longer accepts leading
   zeros. Scalar patterns are unchanged ECMA text; conforming validators apply
   ECMA end-anchor semantics, and the engine's exact full-string comparison is
   authoritative over schema-pattern filtering (see semantic rule below).
6. **O/R wording corrections.** O is defined exclusively from the D4-only subset
   of the combined contact population; stored R endpoint direction
   (source h parent, target s satellite) is authoritative over informal
   inheritance phrasing.
7. **Semantic rules (enforced by engine/mapper, schema-assisted).** Any ABSENT
   stage forces `category` into `invalid` or `incomplete_or_anomalous`; a
   mathematical category claimed alongside an ABSENT stage is `invalid` by
   precedence. Beyond-R output remains nonconformance, never discovery.
8. **Known open item.** Seal/spec/closure digest preimages (canonical
   serialization, framing, `specSha256` aggregation) remain to be ratified
   before byte-identity or tamper-guarantee code is written; the schema names
   the digest fields but does not fix their preimages.

## Confirmation Checklist For The Short Pass

1. Field names, types, ordering, and reject-coercion rules match §5/§7 as fixed above.
2. The five counts' decimal-string encoding and key-string form are exact.
3. All 18 control keys present with four-slot-plus-clean-counterpart shape.
4. Seven category strings verbatim; qualifier unchanged; no paraphrase or new H language.
5. Third-28s naming enforced; no bare-28 receipt prose permitted.
6. Whitespace clean; frozen boundary bytes untouched; no ledger/manifest/qa/engine writes in this addendum pass.

**HALT:** confirmation of this addendum completes the spec for implementation review. Implementation, pre-flight, and production remain separately gated.
