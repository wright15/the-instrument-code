# GOV-207 — Implementation Plan

**Target ticket:** [GOV-207](GOV-207-local-agent-skills.md) · **Epic:** [EPIC-002](EPIC-002-governor-domain-agent-runtime.md)
**Depends on:** GOV-203, GOV-204, GOV-205, GOV-206 · **Blocks:** GOV-208, GOV-209

## Story Analysis

GOV-207 is an authority-neutral integration layer over GOV-203 through GOV-206. The five skills may select, sequence, and explain runtime operations, but they must never calculate classifications, infer graph facts, create validation tokens, execute arbitrary commands, edit ledgers, or decide whether an outcome succeeded.

Key constraints:

- **Runtime authority:** State, legal moves, tokens, transitions, evidence, and success remain owned by the deterministic runtime.
- **Dynamic menus:** The host must expose only skills, named queries, and moves valid for the replayed state and effective capability intersection.
- **Machine stops:** `REPLAN`, `STOPPED`, stale-token, retry, and no-progress reasons are runtime outputs. The model must consume them, not independently detect or override them.
- **Verification:** Existing `execute_validated_move()` executes and verifies atomically. `verify_outcome` must inspect recorded evidence and replay history, never rerun a side effect.
- **Graph safety:** GOV-206 named queries provide context only. Graph output cannot authorize moves or change runtime state.
- **Installation:** An explicit target is mandatory. Installation must be preflighted, non-destructive, content-addressed, and byte-identical across runs.
- **Host portability:** Hermes and generic JSON adapters must share one semantic API. Host-specific formatting cannot alter result codes or authority.

**Current dependency gaps:**

- GOV-203 has no callable classifier, so `classify_governor` cannot satisfy its acceptance trace yet.
- Runtime operation, executor, and verifier registries currently exist only in tests.
- `StateStore` persists state and its ledger anchor, but no production event store persists the complete ledger.
- No read-only historical outcome API exists.
- Legal moves do not currently expose complete parameter/postcondition metadata.
- GOV-206 needs small parity fixes around `maxDepth`, `limit`, rule `active`, and live runtime projection data.

These should be Gate 0. Do not replace them with skill-side logic.

## 1. Directory Layout

```text
skills/governor/
├── registry.json
├── capabilities.json
├── workflows/
│   ├── inspect_context/SKILL.md
│   ├── classify_governor/SKILL.md
│   ├── list_legal_moves/SKILL.md
│   ├── validate_and_execute_move/SKILL.md
│   └── verify_outcome/SKILL.md
├── schemas/
│   ├── common.schema.json
│   ├── inspect-context.schema.json
│   ├── classify-governor.schema.json
│   ├── list-legal-moves.schema.json
│   ├── validate-execute.schema.json
│   ├── verify-outcome.schema.json
│   ├── registry.schema.json
│   ├── capabilities.schema.json
│   ├── install-manifest.schema.json
│   └── upstream/
│       ├── classification-request.schema.json
│       └── classification-result.schema.json
└── adapters/
    ├── generic-json.json
    └── hermes.json

src/governor/
├── agent_api.py
├── dynamic_menu.py
├── operation_catalog.py
├── outcome_reader.py
└── runtime_store.py

scripts/
├── install-governor-skills.mjs
└── validate-governor-skills.mjs

tests/
├── test_gov_207_agent_api.py
├── test_gov_207_dynamic_menu.py
├── test_gov_207_outcomes.py
└── gov_207/
    ├── schemas.test.mjs
    ├── installer.test.mjs
    ├── adapters.test.mjs
    └── traces/
        ├── classification.json
        ├── graph-retrieval.json
        ├── legal-mutation.json
        ├── site-launch.json
        ├── invalid-move.json
        └── loop-stop.json
```

Responsibilities:

| File | Responsibility |
|---|---|
| `agent_api.py` | Strict JSON parsing, dispatch, result serialization, fingerprints |
| `dynamic_menu.py` | State-derived skill/query/move exposure |
| `operation_catalog.py` | Public parameter, capability, postcondition, and victory metadata |
| `outcome_reader.py` | Replay and read one exact historical attempt without side effects |
| `runtime_store.py` | Atomically persist state and complete append-only ledger |
| `registry.json` | Five skills, schemas, triggers, adapter mappings |
| `capabilities.json` | Closed skill-to-operation/query/capability grants |
| `SKILL.md` files | Trigger, procedure, allowed tools, stops, and failure rules |
| Installer | Explicit-target rendering, preflight, manifest, overwrite policy |

Existing versioned `seven-governors-*` packages remain frozen.

## 2. Draft JSON Schemas

All schemas use JSON Schema 2020-12 and enforce:

```json
{
  "additionalProperties": false,
  "identifierPattern": "^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$",
  "sha256Pattern": "^[0-9a-f]{64}$"
}
```

Shared `$defs` should include:

- `stateRef`
- `toolReceipt`
- `directive`
- `dynamicMenu`
- `evidenceRecord`
- `recoveryMove`

### `inspect_context`

**Input**

```json
{
  "$id": "gov-207.inspect-context.input.v1",
  "type": "object",
  "additionalProperties": false,
  "required": ["schemaVersion", "requestId", "taskId"],
  "properties": {
    "schemaVersion": {"const": "gov-207.inspect-context.input.v1"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "taskId": {"$ref": "common.schema.json#/$defs/identifier"},
    "expectedStateSha256": {"$ref": "common.schema.json#/$defs/sha256"},
    "includePriorVerifiedOutcomes": {"type": "boolean", "default": false},
    "priorOutcomeLimit": {"type": "integer", "minimum": 1, "maximum": 25}
  }
}
```

**Output**

```json
{
  "$id": "gov-207.inspect-context.output.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "skillId", "requestId", "status",
    "context", "menu", "toolReceipts", "directive", "resultFingerprint"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.inspect-context.output.v1"},
    "skillId": {"const": "inspect_context"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "status": {"enum": ["ok", "unavailable", "failed", "stopped"]},
    "context": {
      "type": "object",
      "additionalProperties": false,
      "required": ["state", "ledger", "graph", "pendingAttemptId"],
      "properties": {
        "state": {
          "oneOf": [
            {"$ref": "common.schema.json#/$defs/stateRef"},
            {"type": "null"}
          ]
        },
        "ledger": {"$ref": "common.schema.json#/$defs/ledgerStatus"},
        "graph": {"$ref": "common.schema.json#/$defs/graphStatus"},
        "pendingAttemptId": {
          "oneOf": [
            {"$ref": "common.schema.json#/$defs/identifier"},
            {"type": "null"}
          ]
        }
      }
    },
    "priorVerifiedOutcomes": {
      "type": "array",
      "maxItems": 25,
      "items": {"$ref": "common.schema.json#/$defs/stateRef"}
    },
    "menu": {"$ref": "common.schema.json#/$defs/dynamicMenu"},
    "toolReceipts": {
      "type": "array",
      "items": {"$ref": "common.schema.json#/$defs/toolReceipt"}
    },
    "directive": {"$ref": "common.schema.json#/$defs/directive"},
    "resultFingerprint": {"$ref": "common.schema.json#/$defs/sha256"}
  }
}
```

Do not emit raw private `AgentState.data`.

### `classify_governor`

**Input**

```json
{
  "$id": "gov-207.classify-governor.input.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "requestId", "taskId",
    "expectedStateSha256", "expectedPolicyFingerprint",
    "classificationRequest"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.classify-governor.input.v1"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "taskId": {"$ref": "common.schema.json#/$defs/identifier"},
    "expectedStateSha256": {"$ref": "common.schema.json#/$defs/sha256"},
    "expectedPolicyFingerprint": {"$ref": "common.schema.json#/$defs/sha256"},
    "classificationRequest": {
      "$ref": "upstream/classification-request.schema.json"
    },
    "includeExplanations": {"type": "boolean", "default": true}
  }
}
```

**Output**

```json
{
  "$id": "gov-207.classify-governor.output.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "skillId", "requestId", "status", "state",
    "classificationResult", "outcomeSummary", "explanations",
    "toolReceipts", "nextMenu", "directive", "resultFingerprint"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.classify-governor.output.v1"},
    "skillId": {"const": "classify_governor"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "status": {"enum": ["ok", "rejected", "unavailable", "failed"]},
    "state": {"$ref": "common.schema.json#/$defs/stateRef"},
    "classificationResult": {
      "oneOf": [
        {"$ref": "upstream/classification-result.schema.json"},
        {"type": "null"}
      ]
    },
    "outcomeSummary": {
      "type": "object",
      "additionalProperties": false,
      "required": ["classified", "ambiguous", "unresolved", "invalid"],
      "properties": {
        "classified": {"type": "integer", "minimum": 0},
        "ambiguous": {"type": "integer", "minimum": 0},
        "unresolved": {"type": "integer", "minimum": 0},
        "invalid": {"type": "integer", "minimum": 0}
      }
    },
    "explanations": {"type": "array", "maxItems": 64},
    "toolReceipts": {
      "type": "array",
      "items": {"$ref": "common.schema.json#/$defs/toolReceipt"}
    },
    "nextMenu": {"$ref": "common.schema.json#/$defs/dynamicMenu"},
    "directive": {"$ref": "common.schema.json#/$defs/directive"},
    "resultFingerprint": {"$ref": "common.schema.json#/$defs/sha256"}
  }
}
```

Graph explanations cannot upgrade an `ambiguous` or `unresolved` classifier result.

### `list_legal_moves`

**Input**

```json
{
  "$id": "gov-207.list-legal-moves.input.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "requestId", "taskId",
    "expectedStateSha256", "expectedLedgerHeadSha256"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.list-legal-moves.input.v1"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "taskId": {"$ref": "common.schema.json#/$defs/identifier"},
    "expectedStateSha256": {"$ref": "common.schema.json#/$defs/sha256"},
    "expectedLedgerHeadSha256": {"$ref": "common.schema.json#/$defs/sha256"},
    "includeGraphContext": {"type": "boolean", "default": true}
  }
}
```

**Output**

```json
{
  "$id": "gov-207.list-legal-moves.output.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "skillId", "requestId", "status",
    "state", "moves", "toolReceipts", "nextMenu",
    "directive", "resultFingerprint"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.list-legal-moves.output.v1"},
    "skillId": {"const": "list_legal_moves"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "status": {"enum": ["ok", "reinspect", "failed", "stopped"]},
    "state": {"$ref": "common.schema.json#/$defs/stateRef"},
    "moves": {
      "type": "array",
      "maxItems": 64,
      "items": {"$ref": "common.schema.json#/$defs/legalMoveDescription"}
    },
    "toolReceipts": {
      "type": "array",
      "items": {"$ref": "common.schema.json#/$defs/toolReceipt"}
    },
    "nextMenu": {"$ref": "common.schema.json#/$defs/dynamicMenu"},
    "directive": {"$ref": "common.schema.json#/$defs/directive"},
    "resultFingerprint": {"$ref": "common.schema.json#/$defs/sha256"}
  }
}
```

`legalMoveDescription` must include:

- `operationId`
- `capability`
- `moveSha256`
- `priorStateSha256`
- `resultPhase`
- `effectClass`
- strict parameter schema
- defaults
- search dimensions
- required postconditions
- victory condition ID
- contextual graph fingerprint, if available

### `validate_and_execute_move`

**Input**

```json
{
  "$id": "gov-207.validate-execute.input.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "requestId", "taskId",
    "selectedMove", "parameters", "expected"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.validate-execute.input.v1"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "taskId": {"$ref": "common.schema.json#/$defs/identifier"},
    "selectedMove": {
      "type": "object",
      "additionalProperties": false,
      "required": ["operationId", "moveSha256"],
      "properties": {
        "operationId": {"$ref": "common.schema.json#/$defs/identifier"},
        "moveSha256": {"$ref": "common.schema.json#/$defs/sha256"}
      }
    },
    "parameters": {"type": "object"},
    "expected": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "revision", "stateSha256", "ledgerHeadSha256",
        "policyFingerprint", "contextFingerprint"
      ],
      "properties": {
        "revision": {"type": "integer", "minimum": 0},
        "stateSha256": {"$ref": "common.schema.json#/$defs/sha256"},
        "ledgerHeadSha256": {"$ref": "common.schema.json#/$defs/sha256"},
        "policyFingerprint": {"$ref": "common.schema.json#/$defs/sha256"},
        "contextFingerprint": {"$ref": "common.schema.json#/$defs/sha256"}
      }
    }
  }
}
```

The model cannot provide capability, token, executor, verifier, command, path, provider, or deadline.

**Output**

```json
{
  "$id": "gov-207.validate-execute.output.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "skillId", "requestId", "status",
    "stateBefore", "stateAfter", "validation", "execution",
    "verification", "cleanup", "ledgerDelta",
    "claimableSuccess", "toolReceipts", "nextMenu",
    "directive", "resultFingerprint"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.validate-execute.output.v1"},
    "skillId": {"const": "validate_and_execute_move"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "status": {
      "enum": ["verified", "rejected", "failed", "replan", "stopped"]
    },
    "stateBefore": {"$ref": "common.schema.json#/$defs/stateRef"},
    "stateAfter": {"$ref": "common.schema.json#/$defs/stateRef"},
    "validation": {"$ref": "common.schema.json#/$defs/validationResult"},
    "execution": {"$ref": "common.schema.json#/$defs/executionResult"},
    "verification": {"$ref": "common.schema.json#/$defs/verificationResult"},
    "cleanup": {"$ref": "common.schema.json#/$defs/cleanupResult"},
    "ledgerDelta": {"$ref": "common.schema.json#/$defs/ledgerDelta"},
    "claimableSuccess": {"type": "boolean"},
    "toolReceipts": {
      "type": "array",
      "items": {"$ref": "common.schema.json#/$defs/toolReceipt"}
    },
    "nextMenu": {"$ref": "common.schema.json#/$defs/dynamicMenu"},
    "directive": {"$ref": "common.schema.json#/$defs/directive"},
    "resultFingerprint": {"$ref": "common.schema.json#/$defs/sha256"}
  }
}
```

`claimableSuccess` is true only when replay is valid, phase is `VERIFIED`, all required evidence passed, and cleanup succeeded.

### `verify_outcome`

**Input**

```json
{
  "$id": "gov-207.verify-outcome.input.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "requestId", "taskId", "attemptId",
    "expectedStateSha256", "expectedLedgerHeadSha256"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.verify-outcome.input.v1"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "taskId": {"$ref": "common.schema.json#/$defs/identifier"},
    "attemptId": {"$ref": "common.schema.json#/$defs/identifier"},
    "expectedStateSha256": {"$ref": "common.schema.json#/$defs/sha256"},
    "expectedLedgerHeadSha256": {"$ref": "common.schema.json#/$defs/sha256"}
  }
}
```

**Output**

```json
{
  "$id": "gov-207.verify-outcome.output.v1",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion", "skillId", "requestId", "status",
    "state", "replay", "attempt", "decision", "evidence",
    "cleanup", "claim", "toolReceipts", "nextMenu",
    "directive", "resultFingerprint"
  ],
  "properties": {
    "schemaVersion": {"const": "gov-207.verify-outcome.output.v1"},
    "skillId": {"const": "verify_outcome"},
    "requestId": {"$ref": "common.schema.json#/$defs/identifier"},
    "status": {"enum": ["verified", "not_verified", "failed", "stopped"]},
    "state": {"$ref": "common.schema.json#/$defs/stateRef"},
    "replay": {"$ref": "common.schema.json#/$defs/replayResult"},
    "attempt": {"$ref": "common.schema.json#/$defs/attemptResult"},
    "decision": {"$ref": "common.schema.json#/$defs/verificationResult"},
    "evidence": {
      "type": "array",
      "items": {"$ref": "common.schema.json#/$defs/evidenceRecord"}
    },
    "cleanup": {"$ref": "common.schema.json#/$defs/cleanupResult"},
    "claim": {
      "type": "object",
      "additionalProperties": false,
      "required": ["mayDeclareSuccess", "claimCode"],
      "properties": {
        "mayDeclareSuccess": {"type": "boolean"},
        "claimCode": {
          "enum": [
            "verified_evidence",
            "failed_evidence",
            "missing_evidence",
            "invalid_ledger",
            "cleanup_failed"
          ]
        }
      }
    },
    "toolReceipts": {
      "type": "array",
      "items": {"$ref": "common.schema.json#/$defs/toolReceipt"}
    },
    "nextMenu": {"$ref": "common.schema.json#/$defs/dynamicMenu"},
    "directive": {"$ref": "common.schema.json#/$defs/directive"},
    "resultFingerprint": {"$ref": "common.schema.json#/$defs/sha256"}
  }
}
```

## 3. Dynamic Filtering and Installer

### Dynamic Menu

```text
1. Load state and complete ledger from operator-owned external storage.
2. Replay the ledger against its trusted anchor.
3. On replay failure:
   expose inspect_context and verify_outcome only;
   directive = stop;
   expose no executor.
4. Compute effective capabilities:
   state capabilities
   ∩ host grants
   ∩ skill manifest grants
   ∩ registered operation/executor/verifier closure.
5. Call authoritative list_legal_moves().
6. Remove moves missing parameter metadata, executor closure, verifier closure,
   capability grants, or host representation.
7. Apply lifecycle filtering.
8. Apply machine stop/replan filtering.
9. Add named queries only when trusted prior output supplied their identifiers.
10. Sort all skills, queries, and moves by stable logical ID.
11. Hash the resulting canonical menu as menuFingerprint.
```

Lifecycle exposure:

| Phase | Skills |
|---|---|
| `INSPECTED`, `PROPOSED` | inspect, classify if available, list moves |
| `VALIDATED` | inspect, list moves, exact selected execute workflow |
| `EXECUTED`, `EVIDENCE_RECORDED` | inspect and verify only |
| `FAILED` | inspect, verify, registered recovery moves |
| `REPLAN` | inspect and changed-dimension recovery moves |
| `VERIFIED` | inspect and verify unless another registered transition exists |
| `STOPPED` | inspect and verify only |

Machine reasons map directly:

| Reason | Directive |
|---|---|
| stale state, ledger, or token | `reinspect` |
| illegal operation | return to legal-move menu |
| malformed parameters | `replan` with exact schema |
| repetition or no progress | `replan` with changed dimensions only |
| retry or deadline exhausted | `stop`, no executor |
| denied capability or missing verifier | `stop`, operator action |
| failed evidence or cleanup | failed, success claim prohibited |
| malformed runtime/graph result | fail closed |

### Installer Manifest

```json
{
  "schemaVersion": "gov-207.install-manifest.v1",
  "bundleId": "seven-governors-gov-207",
  "bundleVersion": "1.0.0",
  "adapterId": "hermes",
  "adapterVersion": "1.0.0",
  "sourceFingerprint": "<sha256>",
  "registrySha256": "<sha256>",
  "files": [
    {
      "path": "seven-governors-inspect-context/SKILL.md",
      "bytes": 1234,
      "sha256": "<sha256>"
    }
  ],
  "aggregateFingerprint": "<sha256>"
}
```

Manifest rules:

- No timestamp, username, home path, absolute target, PID, or model identity.
- Normalize paths to `/`.
- Normalize text to UTF-8 with LF endings.
- Sort files by Unicode code point.
- Hash each exact emitted byte sequence.
- Hash canonical `[path, bytes, sha256]` tuples for `aggregateFingerprint`.
- Exclude the manifest from its own file list.

Installer behavior:

```text
--target <path>                  required
--adapter hermes|generic-json    required
--create-target                  explicit target creation
--update-owned                   update unchanged manifest-owned files
--overwrite-existing <path>      authorize one exact collision
```

Overwrite policy:

1. Missing destination: install.
2. Identical destination: no-op.
3. Different foreign file: reject before writing.
4. Owned but user-modified file: reject.
5. `--update-owned`: replace only unchanged files from the old manifest.
6. Explicit overwrite: replace only the named relative path.
7. Reject symlinks, traversal, foreign manifests, and out-of-target paths.
8. Never edit host configuration or delete unrelated files.
9. Stage all bytes and complete preflight before atomic renames.
10. Roll back owned-file updates if any commit step fails.

Hermes and generic adapters must call the same JSON facade and return identical semantic records and fingerprints.

## 4. Implementation Checklist

1. **Close dependency gaps**
   - Deliver or bind the GOV-203 classifier.
   - Create production operation/executor/verifier registries.
   - Add complete runtime event persistence.
   - Add read-only attempt outcome reconstruction.
   - Expose strict operation parameter and postcondition metadata.
   - Correct GOV-206 depth, limit, active-rule, and runtime-projection parity.

2. **Build JSON contracts**
   - Add shared schema definitions.
   - Add all five input/output schemas.
   - Vendor hash-bound classifier request/result schemas.
   - Reject unknown properties recursively.
   - Add request/response byte limits and canonical fingerprint rules.

3. **Build the runtime facade**
   - Implement fixed five-operation dispatch in `agent_api.py`.
   - Load state and ledger only from operator configuration.
   - Validate expected state, ledger, policy, and context fingerprints.
   - Return structured machine reasons without translating them into prose success.
   - Keep tokens and private state fields out of responses.

4. **Build production catalogs**
   - Register admitted operations and effect classes.
   - Publish parameter schemas, defaults, search dimensions, postconditions, and victory conditions.
   - Reject incomplete executor/verifier closure.
   - Add no raw shell, arbitrary argv, raw Cypher, or direct ledger operation.

5. **Implement dynamic menus**
   - Replay before discovery.
   - Intersect capabilities.
   - Filter by lifecycle and machine stop.
   - Suppress repeated attempt keys during `REPLAN`.
   - Bind graph query parameters from trusted outputs.
   - Emit stable ordering and `menuFingerprint`.

6. **Implement the five skill workflows**
   - Add trigger and bounded input.
   - Add exact schema IDs.
   - Add allow-listed tools and capabilities.
   - Add deterministic procedure.
   - Add stop and failure tables.
   - State explicitly that prose cannot replace a tool receipt or evidence.

7. **Implement adapters**
   - Add generic JSON/JSONL discovery and invocation.
   - Add Hermes `SKILL.md` layout and bridge metadata.
   - Keep operation IDs, reason codes, evidence, directives, and fingerprints identical.
   - Do not edit Hermes configuration automatically.

8. **Implement deterministic installation**
   - Require target and adapter.
   - Reject symlinks and path escape.
   - Render all output in memory.
   - Preflight every collision.
   - Emit deterministic manifest.
   - Support idempotent reinstall and explicit owned updates.

9. **Add six evaluation traces**
   - Classification.
   - Graph retrieval.
   - Legal mutation.
   - Site launch verification.
   - Invalid move.
   - Loop stop.
   - Include malformed outputs, denied capabilities, stale tokens, and repeated actions.

10. **Add acceptance tests**
    - Validate every skill request and response.
    - Test all lifecycle menus.
    - Test capability denial and incomplete registry closure.
    - Install twice into isolated Hermes and generic targets and compare bytes.
    - Test foreign collisions, user-modified owned files, symlinks, and traversal.
    - Run every trace through both adapters.
    - Assert invalid launch, graph write, invalid move, and loop stop can never produce success.
    - Run scripted mock-model traces deterministically.
    - Run representative local-model traces as observational reports, excluded from canonical fingerprints.

11. **Final gates**
    - Run GOV-204/205 Python regressions under two hash seeds/time zones.
    - Run GOV-206 query/provider parity.
    - Run GOV-207 schema, installer, adapter, and trace suites.
    - Run full root validation.
    - Refresh release manifest, checksums, QA, and Scrum status only during GOV-209 closure.
