# SPEC-FIVEFOLD-CONSTRUCTS-001: R1 Forensic Findings

| Field | Value |
|---|---|
| Memo ID | SPEC-FIVEFOLD-CONSTRUCTS-001-R1 |
| Version | 1.0 |
| Inspection Date | 2026-09-17 UTC |
| Repository | `/home/erick/projects/integrated-release` |
| HEAD | `e537f2b0c703aa0825fd38adda8d7ed8651f9ea1` |
| Object Format | SHA-1; repository is not shallow |
| Scope | Read-only census forensics and twin-hub freshness scoping |
| Disposition | R1 complete; R2 branch proposed, not authorized or executed |
| Artifact Lifecycle | Temporary evidence. Promote this memo and supporting annexes into the release inventory in R2 before any decision-ledger entry cites them. |

## 1. Findings and Proposed Branch

1. The GOV-517 census pin is not reproducible from the available local object database. All 16 census-history blobs were checked, then all 1,985 available blob contents, regardless of size. None has SHA-256 `ad857ab957c54773f35047fb7618e8c8d9977991c0450efc56b0b81cd653a1d0`.
2. At registration commit `ab86a90`, both release inventories and the new registration recorded that pin, but the committed census blob actually hashed to `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4`. This is a historical committed-snapshot inconsistency, not merely later drift.
3. Nine normalization/serialization probes did not reproduce the pin. The committed registration-era census contains no LF, CR, or UTF-8 BOM, so removing those features is a no-op. The normalization explanation is not supported by the tested variants.
4. The two post-registration census changes are provenance-only: ledger SHA fields and the resulting candidate fingerprint changed. The remaining parsed payload is identical. This is NOT formatting-only drift, but neither is it demonstrated change to census geometry or witness data. The original material-versus-formatting branch table needs this distinction.
5. The post-registration changes at `c530e41` and `67dcd14` have a ceremony trail and are classified **sanctioned**. Earlier changes have mixed documentation strength; they are listed individually below. No finding establishes an unauthorized canonical writer.
6. Twin-hub has exactly two divergent carried source bindings: the decision and observation ledgers. Its canonical ledger and network bindings still match. The generator and inspected helper/source closure have no Git diff since `67dcd14`. ENTRY 10 explicitly deferred the ledger-dependent cascade to preserve D4's bound twin-hub receipt.
7. The twin-hub gate is a true positive for whole-file source freshness, not evidence that its geometric conclusion is false. Calling it a "false positive by design" is defensible only relative to a narrower, geometry-only freshness requirement that the current contract does not implement.

**Proposed branch:** forward amendment plus a separately authorized GOV-517 registration/re-execution, accompanied by a historical registration/packaging-hygiene incident record. Do not restore the unavailable pin, overwrite historical registrations, or interpret provenance-only drift as proof of changed derivation results. Preserve D4-bound historical twin-hub evidence before changing any live artifact that shares its path. The maintainer must select and authorize R2; this memo does not do so.

**Suggested decision records:** one record for the historical snapshot inconsistency and recovery limits, and a separate forward-authorization record defining reconciled inputs, immutable snapshots, the new execution boundary, and the permitted freshness cascade. If preservation of D4-bound evidence requires an independent authority decision, separate that decision rather than hiding it in a refresh command.

## 2. Method and Limits

R1 used read-only Git operations, file inspection, SHA-256 hashing, and shell utilities. JSON was parsed/sorted with `jq`; exact stream-only normalization used Perl. Neither utility imported repository code. No project generator, validator, test, `npm` command, or project script was executed, including `--check` modes. Writes were confined to `/tmp/opencode/`. No checkout, restore, rebind, ledger edit, manifest generation, commit, fetch, or push was performed.

Git object IDs here are SHA-1; the registered pin is SHA-256 of file content. Searches for the pin string in manifest history locate registrations, not matching object IDs. In particular, `2830c17a...` is a content SHA-256, NOT the Git blob ID. Its blob ID is `93d3079264f0780001b0dd45977d7abe59e80608`.

Negative results cover objects available to `git cat-file --batch-all-objects` at inspection time, including available unreachable objects and alternate object stores. They do not prove permanent global loss: pruned objects, other clones, backups, and uncommitted historical worktrees are outside this recovery result. Likewise, finite normalization tests do not exclude every conceivable serialization convention.

The registration is preserved as a historical assertion of consumed bytes. Because those bytes were not recovered, R1 cannot independently prove what the original process actually consumed or determine why the asserted snapshot was not committed. A generated but uncommitted census followed by incomplete staging is a plausible explanation, not an established event.

R1 does not revoke the recorded GOV-517 verdict or certify a new run. Admission-attempt-2's INV-1 through INV-4 checks remain checks against its historical sealed report, not fresh execution against current inputs. No v0.2.1 spec file has been created, so there are no landed v0.2.1 file bytes to claim are frozen or unchanged.

## 3. Pin Versus Current Bytes

Target: `canonical/fivefold-incubator/fifth-space-census-v0.json`.

| Evidence | SHA-256 | Interpretation |
|---|---|---|
| `qa/gov-517-input-boundary-registration.json:23-29` | `ad857ab957c54773f35047fb7618e8c8d9977991c0450efc56b0b81cd653a1d0` | Historical registered census input |
| `qa/gov-517-canonical-derivation-report.json:11-28` | `ad857ab957c54773f35047fb7618e8c8d9977991c0450efc56b0b81cd653a1d0` | Historical receipt carries the same pin |
| `ab86a90:MANIFEST.json` and `ab86a90:CHECKSUMS.sha256` | `ad857ab957c54773f35047fb7618e8c8d9977991c0450efc56b0b81cd653a1d0` | Both inventories assert the pin; 194,194 bytes |
| Actual blob at `ab86a90` and `9d768fb` | `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4` | Same committed blob as `3e24615`; 194,194 bytes |
| Actual blob and both inventories at `c530e41` | `b538105d0d1d0cb119a2777d4c5573895e9bd792b6f308142382987f799ed8c0` | Consistent post-verdict census |
| Actual blob and both inventories at `67dcd14` and HEAD | `c537bf547ceab5c4d4c49f85da92848cbd3bbbf342c8ffc43c354abc9af47e00` | Consistent current census; 194,194 bytes |

The pin-bearing registration landed at `ab86a9063f8fad64c77b477b9734345464837238`, 2026-09-12 23:04:25 -04:00. Its commit adds the registration and preflight evidence and updates inventories, but does not update the census blob. The live report lands at `9d768fbea3705639ded94284b5a6305b0b909a53`, 23:05:07 -04:00; the same blob/inventory mismatch persists. `c530e41`, 23:41:52 -04:00, lands the verdict and a manifest-consistent regenerated census.

This distinguishes two questions: the current raw bytes are correctly registered in today's inventories, but that does not make them the historical GOV-517 input. A current inventory PASS cannot repair a historical input assertion.

## 4. Full Census Blob Table

All 16 `git log --follow` change commits are included, newest first. Every listed blob is 194,194 bytes. Full commit IDs and raw output are in `r1-census-history.txt`; the short commit IDs below are unambiguous within the inspected repository.

| Commit | Git Blob ID (SHA-1) | Blob Content SHA-256 |
|---|---|---|
| `67dcd14` | `fe3a689f2e9399d2220c778304f2a587a2128aa8` | `c537bf547ceab5c4d4c49f85da92848cbd3bbbf342c8ffc43c354abc9af47e00` |
| `c530e41` | `1b0b81ed7895ae5a1e57d2f224699f7e856529b3` | `b538105d0d1d0cb119a2777d4c5573895e9bd792b6f308142382987f799ed8c0` |
| `3e24615` | `93d3079264f0780001b0dd45977d7abe59e80608` | `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4` |
| `bb270ad` | `ec347a82bfda521cdc2e95c962c03c98b02b9862` | `27f279486dd3df0295c105b97d12623c792f616c26b4927bed21798fa4ee2074` |
| `d591ff5` | `9b2869b91b79d342187669329500cdb7f89b8a0b` | `1137a7ffa89a41350d525caa8895aa1ea48c4b681e7ab8c5f52b97bf732ebe14` |
| `cb955b9` | `0003bc5006518fc99818bc64f27ab1d1ac2e6def` | `9db7d04621e1b68b517f3893f3e8ad8a83b7b31bccc29a7a60adf18d703226a6` |
| `9a0764b` | `a387105dee5f285372509f518c1a702fa5b62590` | `f434c45382e454034f9763005ef061fdc069a4760aef19679ddce97123580188` |
| `6f13c5f` | `05c5b9e2d272efce5ed5929d4a067e8e468eeaa1` | `e6afd47a4e108c956011c614b427252a6f81b8e6153289a8595acf47038274c7` |
| `7f61d7c` | `701c3010c96b6b6aeae5662c61bb8d00f60c8c6a` | `ccb56eb5ba5c8904d8f9ab9ab4f9d69cc6df71c30eeaa738f4ec2db55fe1f232` |
| `d8210b0` | `2886a1d7e9ffbe41d06fff2cac3590bafdb8283c` | `21dc921d2e96a6f0d99960d386c0202aa1e094070d94ef937b190160bf3eb036` |
| `dc0016c` | `7ac66b3bf8028603d75728a5d750fa60b2b0f362` | `d437b390e1547ede9887c51c0ac5488e174e1666e8bc4d08759b4092bbb9935b` |
| `7e9be6d` | `f9ef13513deabf0643053f704d8a6de7e0bfbaf9` | `ffd47ea4d51a3b8a4e34b53b402c1a907d6a3dd52b759a51a83bf2f9f3db61cd` |
| `45d23d6` | `ee6bc38830b8e3a96b2d2b539ba6429e161362c7` | `6d35653292e97eca33a66898d172066aeaf29866715fcc70355392fdf3618a4b` |
| `26694a1` | `7c444d90bacf3626e07ac03cab63b97688a93073` | `62c60706d62649a85d7fa74c9120280d75e78fa41bf671ed30ee18d4232366be` |
| `0bd770c` | `763f857a903a34eab0b50815430bd38f22848e5e` | `8e4c34926d5027bfa32b1209bc735f74cb5fbcd9dd214e74e8bb9274b30b803f` |
| `4730764` | `b3432532f3138051b190b2bc3c325421e486ab6a` | `898f56a917ff2bc6138ff4807ce6d51f0832c0add758d19b625abe42df4ee80b` |

Per-commit inventory excerpts are in `r1-census-history-envelope-bindings.txt`. An additional historical packaging inconsistency was observed at `7e9be6d`: its inventories still name `6d356532...`, while its census blob hashes to `ffd47ea4...`. This is recorded as an additional process-gap observation, not a cause established for the later GOV-517 mismatch.

## 5. Object Database Sweep

The object inventory contained 1,985 blobs, 87 commits, and 723 trees. The requested 194,194-byte filter selected 16 blobs, exactly the census-history set above; zero matched the registered pin. R1 then removed the size filter and hashed all 1,985 available blob contents. Again: **zero matches**. The complete object-ID, size, and content-hash table is `r1-all-blob-sha256.txt`.

Reproduction, with shell `pipefail` enabled:

```bash
git cat-file --batch-all-objects \
  --batch-check='%(objectname) %(objecttype) %(objectsize)' |
awk '$2=="blob" {print $1, $3}' |
while read -r object size; do
  printf '%s %s ' "$object" "$size"
  git cat-file blob "$object" | shasum -a 256
done
```

The size-filtered sweep uses `awk '$2=="blob" && $3==194194 {print $1}'` instead. No content is guessed from a SHA-1 identifier. Recovery of the pinned census from this repository's available ODB failed, so restoration to that pin is not an executable remediation with the recovered evidence.

## 6. Normalization Tests

Source is the actual registration-era Git blob `93d3079264f0780001b0dd45977d7abe59e80608`, extracted without alteration as `r1-census-registration-committed.json`. Byte inspection: 194,194 bytes, zero LF characters, zero CR characters, no UTF-8 BOM, last byte `0x7d` (`}`).

| Variant | Result SHA-256 | Pin Match |
|---|---|---|
| As-is | `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4` | No |
| Strip final LF if present | `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4` | No; no-op |
| Add one LF | `d9e01cbc749f05cf4471d038752be6791ad6743ba8454c5374a461528a221752` | No |
| CRLF to LF | `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4` | No; no-op |
| Strip UTF-8 BOM if present | `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4` | No; no-op |
| LF to CRLF | `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4` | No; no-op |
| Add UTF-8 BOM | `207aa95ff01eeb420a01c959382269f3fa0ce024b1bd6f0d188dcbb597f5fa7b` | No |
| `jq -cS .` (includes final LF) | `d9e01cbc749f05cf4471d038752be6791ad6743ba8454c5374a461528a221752` | No |
| `jq -S .` (pretty, includes final LF) | `cf5c86ba00e08d19c250b7d1d438b8c882eb79ee7959500e95320e8891268de8` | No |

Exact byte-preserving transforms used `perl -0777 -pe` with `s/\n\z//`, `s/\r\n/\n/g`, `s/\A\xEF\xBB\xBF//`, and `s/(?<!\r)\n/\r\n/g`. They streamed bytes to `shasum`; they did not edit source files. The exact results are in `r1-census-normalization-exact.txt`.

An initial line-oriented probe was superseded after inspection found no final LF: `awk` added one, while blindly dropping one byte removed `}`. Its scratch output `r1-census-normalization.txt` is NOT normalization evidence and must not be used for classification. The exact probes above correct that measurement artifact without changing repository data.

## 7. What Changed in the Census

Parsed, sorted JSON diffs were taken between committed snapshots, not between guessed pinned bytes and current bytes. We cannot diff against the actual pin because it was not recovered.

| Transition | Changed JSON Paths | Unchanged |
|---|---|---|
| `ab86a90` to `c530e41` | `candidateFingerprint`, `evidenceBindings.decisionLedgerSha256`, `evidenceBindings.observationLedgerSha256` | Every other parsed field |
| `c530e41` to `67dcd14` | `candidateFingerprint`, `evidenceBindings.decisionLedgerSha256` | Every other parsed field |
| `67dcd14` to HEAD/current | None | Census bytes unchanged |

Decision-ledger pins move from `ce87bff076eb12a3b5223ac7ed4826fa51a9c5ef50db0b8108cd74325060285f` to `baa5db55de37c72e6fe5c7e2430f82d2ed04c9ff50914ffee8ba67bf412f14da` to `ac50241b6c432394b55864e2ea79755d70ddca60529476edf470f2c39f509c74`.

Observation-ledger pins move from `d18f52e0c7b6b74561523c9fec822680e66c378ec3c9f37ebf05b85f3bf7a417` to `20793bdc3c509a84951a39578a40285ed8205f87033a12f494000fe712e8da52`, then remain unchanged in the census.

For `ab86a90`, `c530e41`, `67dcd14`, and HEAD, the stream
`jq -cS 'del(.candidateFingerprint, .evidenceBindings)'` has identical SHA-256:

```text
0e96c29537a5a1ff8b22dd052b257008a6fa3e09dafa9d3088910af17f068719
```

This is an explicitly labeled diagnostic projection hash, NOT a proposed replacement for any registered raw-byte digest. The full JSON diffs show that only the named metadata fields changed. The current census's full-byte digest remains meaningful and different.

## 8. Ceremony Verdicts

Vocabulary: **sanctioned** means a documentary trail covers the census emission/refresh; **undocumented** means the change plausibly follows a cascade but explicit scope was not established in the inspected records; **unsanctioned** would require a contrary authority finding, not inference from a missing record. These are forensic assessments of the inspected trail, not new grants or allegations of misconduct. Dates below are Git author dates in -04:00.

| Commit | Date | Verdict | Supporting Record and Limit |
|---|---|---|---|
| `67dcd14` | 2026-09-15 | sanctioned | Full `scrum/plan/d4-freeze-handoff.md`, especially 45-52, 60-88, explicitly records the freeze cascade including fifth-space census; `ledger-pin-migration.md:73-94` records subsequent terminal work. ENTRY 9 and inventories land in the same commit. This authorizes freshness work, not replacement of GOV-517 history. |
| `c530e41` | 2026-09-12 | sanctioned | Same commit lands ENTRY 7/8 and OBS-022, census and dependent receipts, and inventories. ENTRY 7's guard, now `DECISION_LEDGER.md:1664-1669`, expressly refers to the required cascade, manifest binding and validation fixed point. ENTRY 8 supplies the accepted D5 verdict. |
| `3e24615` | 2026-09-12 | undocumented | Commit explicitly records L6 regeneration; upstream `f44b3e9` adds OBS-021 and `2b216d2` records the publication boundary. These explain freshness changes, but a specific census-refresh authorization was not located. |
| `bb270ad` | 2026-09-09 | undocumented | Same-commit ENTRY 6 / GOV-520 production run record and closure; commit identifies L5 regeneration. Census scope is not explicit in that authority record. |
| `d591ff5` | 2026-09-09 | undocumented | Same-commit ENTRY 5-A authorizes B3 boundary rebinding and preflight; commit records L4 regeneration. An explicit census clause was not located. |
| `cb955b9` | 2026-09-09 | undocumented | Same-commit ENTRY 4 activates GOV-520 and closes GOV-519; census cascade is plausible but not expressly scoped. |
| `9a0764b` | 2026-09-09 | undocumented | Same-commit ticket-registration entry authorizes the GOV-519/GOV-520 split; L-double-prime regeneration is recorded, but that entry scopes tickets/scaffolding. |
| `6f13c5f` | 2026-09-07 | sanctioned | Same-commit GOV-518 boundary acceptance paragraph 2 requires post-entry regeneration; paragraph 7 names fifth-space freshness remediation. |
| `7f61d7c` | 2026-09-07 | undocumented | A1-A5 amendment and regeneration to L_work are recorded. The later `6f13c5f` early-fixed-point process record documents premature timing and does not backdate authority. This is not proof the census cascade itself was forbidden. |
| `d8210b0` | 2026-09-07 | undocumented | Commit identifies GOV-516 cascade residue; upstream `0460ec6` review correction and `63d313f` OBS-020 explain it. Later recognition of this baseline is not a specific contemporaneous census authorization. |
| `dc0016c` | 2026-09-06 | undocumented | Same-commit commit-scope record retains GOV-514/run-space terminal riders and clarifies observation bindings; census-specific scope is not established. |
| `7e9be6d` | 2026-09-06 | undocumented | Same-commit research receipts close GOV-513/514 and add OBS-017-019. This is a research trail, not an explicit census-refresh grant; this snapshot also has the inventory inconsistency noted above. |
| `45d23d6` | 2026-09-05 | undocumented | Standing rules record fixed-point discipline and out-of-directive restrictions. A general fixed-point rule alone does not demonstrate this change's specific scope. |
| `26694a1` | 2026-09-05 | undocumented | Sprint 4 shape and intake scope GOV-513/514 execution and GOV-515 definition; census regeneration is plausible but not explicitly included. |
| `0bd770c` | 2026-09-04 | sanctioned | Approved `94f33fc:scrum/plan/sprint-3-closeout.md` section 3b explicitly includes fifth-space census in the terminal cascade; same-commit NEXT_STEPS records refreshed bindings. |
| `4730764` | 2026-09-01 | sanctioned | Same-commit GOV-511 fifth-space census decision and Research Gate 3 document initial emission and post-entry binding refresh; GOV-511 ticket specifies ledger-before-emission sequencing. |

Total: 5 sanctioned, 11 undocumented, 0 proven unsanctioned. The older documentation gaps do not establish that either of the two post-registration changes was unauthorized, and do not justify selecting an arbitrary rollback state.

`ab86a90` is not a census-change commit. Its separate registration/packaging inconsistency is the incident finding: the inventories and registration cite unavailable bytes while the committed census remains the earlier blob. No inspected record explains that mismatch; its originating worktree/staging sequence remains unknown.

## 9. Twin-Hub Divergence and Cause

Artifact: `canonical/fivefold-incubator/twin-hub-convergence-v0.json`.
Receipt: `qa/twin-hub-convergence-validation.json`.

| Binding | Artifact's Carried SHA-256 | Current Source SHA-256 | Result |
|---|---|---|---|
| `canonicalLedgerSha256` | `e6570972260fdae5c4ca878272dc89a9ff353d48762eefbe019707d229cd242d` | `e6570972260fdae5c4ca878272dc89a9ff353d48762eefbe019707d229cd242d` | Match |
| `networkFingerprint` | `21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc` | `21e2a632837ecf40fe9229e9eb4ec0a5cceb9e2043fe89cb8e1d320518d7bdbc` | Match |
| `decisionLedgerSha256` | `ac50241b6c432394b55864e2ea79755d70ddca60529476edf470f2c39f509c74` | `54b4e825f6d12e3fea570b25a4eeea6915d89616778ea601705268cca6308c0e` | Mismatch |
| `observationLedgerSha256` | `20793bdc3c509a84951a39578a40285ed8205f87033a12f494000fe712e8da52` | `8e0be9f5bcee0af1aeb87b8ee71fa18121376c1e2b8e23416439c8834e17787f` | Mismatch |

Both carried ledger hashes reproduce exactly from `67dcd14`. The only subsequent ledger-changing commit is `e537f2b`, dated 2026-09-16 22:38:10 -04:00. Its diff adds ENTRY 10 to the decision ledger (103 lines) and OBS-023 plus its index row to the observation ledger (52 lines). The inspected twin-hub generator, validator, `src/governor/twin_hub_convergence.py`, `shadow_ladder.py`, `hashing.py`, canonical ledger, and network have no diff between those commits.

Static source explains the failure without executing it: `src/governor/twin_hub_convergence.py:35-58` hashes all four sources; lines 541-599 derive geometry from the canonical ledger/network and attach the source hashes; lines 603-684 include those hashes in the fingerprint and serialized candidate. `scripts/generate-twin-hub-convergence.py:14-16` rejects any byte difference with `STALE_TWIN_HUB_CONVERGENCE`. The changed ledger bindings alone guarantee freshness failure. This is not a newly executed validator verdict.

The omission of the later cascade is explicitly documented, not mysterious: `provenance/DECISION_LEDGER.md:2283-2290` and `qa/d4-production-landing.json:67-77` preserve the bound twin-hub receipt and defer freshness reconciliation. The latter warns that refreshing it requires explicit historical evidence preservation rather than production rebinding.

Historical artifact SHA-256: `972394e5c319c4497c4df6b64c7ba6e9a0639cdd3ea1f5a28844f2e6cfddb40d`.
Historical candidate fingerprint: `3885bf831dde42f1b1075f81fdce765e5e202411d7a3fd8f49d6c6e55a226d32`.
Receipt SHA-256: `b7f924ca53859b832334200245f690196433e8c8eb213e2ce26afa5e62e230d2`.
Receipt fingerprint: `35f887201947dd5348db0fae6184486710072cfad45b387e6f62e052df1fe988`.
Recorded receipt result: PASS, 30 checks passed, 0 failed. It is historical, not recertified here.

The earlier scoping concern about "28/28" versus "30/30" is not by itself a discrepancy: the former counts contact chains (`twin_hub_convergence.py:581,653-655`), while the latter counts validator checks. They measure different things.

### Existing Refresh Mechanism

A refresh procedure already exists; no new generator needs to be authored to clear this class of twin-hub freshness failure. `package.json:82-84` provides `build:twin-hub` and `validate:twin-hub`; the latter checks generated bytes, runs the validator, and runs tests. R1 ran none of them.

The recorded terminal cascade is shadow-ladder -> twin-hub -> fifth-space census -> pentatonic binding closure -> field-derivation bundle -> taxonomy/D-tier projections -> Orrery checks -> inventories -> release validation. See the entire `scrum/plan/d4-freeze-handoff.md`, especially 60-88, `scrum/plan/ledger-pin-migration.md:73-94`, and `docs/verification/FINGERPRINT_BLAST_RADIUS.md:29-36`. Field-derivation carries downstream twin-hub artifact/receipt pins. Refreshing twin-hub alone is not a promise of a complete green release.

R2 must explicitly reconcile this cascade with D4's preserved provenance bindings. Rewriting a shared live path can break historical evidence even if no `qa/d4-*` file is edited. Versioned/archived source receipts and explicit current-versus-historical binding rules require an authorized design, not a blind builder invocation.

## 10. Systemic Finding

Whole-file SHA pins of append-only ledgers necessarily invalidate current freshness artifacts after every ledger append, even if all geometric inputs and outputs are unchanged. The risk applies to twin-hub, census, shadow-ladder, promotion evidence, and dependent bundles, as documented in the fingerprint map. R1 confirms this mechanism here.

Under the current contract, this is a correct freshness rejection. It becomes a false positive only if consumers mistakenly interpret it as a geometry regression or a revoked historical result. The durable issue is the collision between immutable historical evidence and mutable current-state artifacts sharing paths and freshness expectations.

Two policy options remain for a later decision:

1. Formalize a scheduled, bounded ledger-to-sidecar refresh ceremony, keeping separately resolvable immutable execution snapshots. Existing scripts and handoffs already provide much of the mechanism; ENTRY 10 shows why preservation must precede execution.
2. Adopt scoped ledger bindings: stable entry IDs plus exact content/range digests and an explicit supersession/revocation policy. Bare entry IDs or line ranges are not integrity checks; ranges can shift, and later entries can change authority. Such a migration requires its own reviewed contract and must not silently rehash historical evidence.

R1 selects neither policy. Do not bypass freshness checks or claim that a restored old ledger pin is equivalent to current authority.

## 11. R2 Recommendation and Decision Boundary

The best-supported branch is **forward amendment + separately authorized replay + historical snapshot-hygiene incident**, refined to provenance-only living-output changes rather than an unproven material-data change.

1. Promote this memo and its raw annexes into `qa/specs/`, verify exact bytes, and register them before a decision-ledger entry cites the memo. The ledger must cite a repository path, never `/tmp`.
2. Record the historical mismatch without editing `qa/gov-517-input-boundary-registration.json`, the sealed report, preflight receipts, or prior ledger entries. Record that the asserted `ad857...` bytes are unavailable locally; do not substitute `2830...` while calling it the original input.
3. Authorize a new input-binding record and immutable snapshot strategy. Preserve D4's original twin-hub artifact/receipt dependencies before any sanctioned live-path refresh. Resolve the full permitted cascade scope and source-binding policy explicitly.
4. Treat the GOV-517 replay as a new authorized boundary/ticket, not permission inferred from freshness work. ENTRY 7's guard at `DECISION_LEDGER.md:1668-1669` requires a new boundary registration and ticket for revision/re-test. Seal generation before downstream comparison and fail loudly on INV-1 through INV-4 discrepancies.
5. Execute the authorized reconciliation and full cascade, with actual results and fresh receipts. Do not assume twin-hub is the last release failure; R1 deliberately did not run validators.
6. Resume admission attempt 3 only after its required gates and scope are satisfied. The Q authoring-or-extraction debt and proposed T3 matrix remain separate deferred design claims; they do not repair this binding incident.

No R2 action above is executed or authorized by this recommendation. A governance decision is still required.

## 12. Evidence Annexes and Integrity

All annexes currently live beside this memo in `/tmp/opencode/`. Names below are intended to remain relative if the bundle is promoted together. Raw diff headers contain local comparison timestamps; their digests bind the captured output, not a promise that rerunning `diff` reproduces its header bytes.

| Annex | Raw-byte SHA-256 |
|---|---|
| `r1-census-history.txt` | `f5c882df6037c79c37c703ffff8f88272dbc5e7006fe491a053560e616e77235` |
| `r1-census-odb.txt` | `2d13e90bb3185015f6866981c3c00f9486646b21b9d9dde57a2296e02c973a6a` |
| `r1-all-blob-sha256.txt` | `1565550764f65c904c4391444b7ab6fcceb20647e0dde4639087f1ae3f21fb9b` |
| `r1-census-normalization-exact.txt` | `6f378039c77b88721e9b61cc5270c3ebee1b826c9117a1a5b104a08c9ebd675b` |
| `r1-registration-binding-history.txt` | `c781f42d336d90c850739398f8565e59e11e0f52bd518db12967ea631b7b86d1` |
| `r1-census-history-envelope-bindings.txt` | `f9eae5ae7a44730259c2dafa892791f9b44e17fccc9fd005c84f3dcece3b8226` |
| `r1-census-ab86a90-c530e41.diff` | `5c6f57c580c67af495ce3015963a164a650aba8655226f7d0f409cf45713d542` |
| `r1-census-c530e41-67dcd14.diff` | `799800c9980808c14564ea593ad2c9b2c092c38f9646109b6900290fce480d47` |
| `r1-census-payload-comparison.txt` | `d5c6e589ac34e9a0d4c8a0299d3fc69c106aaa2014bceca08d74232f3c2f670b` |
| `r1-pin-history.txt` | `0506fcd53efc73b94fcc7c95e10c27f7a641be37bdd0b3e41364105ff76645a9` |
| `r1-census-registration-committed.json` | `2830c17a0e1b98ea84a4cf4ba3c88754d56f607cfa9ae761aa18424f1e4372f4` |

This memo contains no digest of itself. Its raw-byte digest is recorded externally after final verification.

### Repository Preservation Baseline

The worktree was already dirty from admission attempt 2. Its only tracked changes were `MANIFEST.json` and `CHECKSUMS.sha256`; its only untracked files were the two `qa/specs/` admission-attempt receipts. They were neither reverted nor modified during R1.

| Baseline Item | SHA-256 |
|---|---|
| `git diff --binary` output | `a99536ffedec52a14b108de59863d89ca23a4a704d99717c99cdb323b4a76413` |
| `MANIFEST.json` | `d718f739f9d6e15b16ecec8bb77f05ac14e8c2eb873589e3e05ef392e46f2c09` |
| `CHECKSUMS.sha256` | `5af9bc53176ce31299af6589374d055013e389e497ad7598e135fb0ed5106510` |
| Attempt-1 receipt | `3a535ad8de05301f879a9ac565b32b3e2883ee4dd652e7e1dd477cdf21092f43` |
| Attempt-2 receipt | `be356c710760b1168503aa78bb753fd3424b0269742d0bed4815fe09c774aa43` |

Final preservation verification: **PASS**. HEAD, the full tracked binary diff digest, the two release-inventory digests, both untracked receipt digests, the census digest, and both ledger digests match the R1 starting state. `git status --short --untracked-files=all` reports exactly the four pre-existing changed/new files, with no additional repository changes. All eleven annex digests were rechecked and match the table above. No release, admission, promotion, or remediation claim follows from this forensic memo.
