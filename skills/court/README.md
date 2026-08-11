# CRT-307 Court Agent Skills

This candidate bundle adds five Court-specific workflows without changing the
closed GOV-207 bundle:

- `inspect_court_state`
- `list_legal_court_moves`
- `validate_and_execute_court_transition`
- `project_through_court`
- `verify_court_postcondition`

All workflows call only `governor.court_agent_api.invoke`. Python independently
replays the CRT-305 session before every operation. Validation tokens remain
internal to one transition invocation, graph queries are bounded optional
corroboration, and only a typed trusted verifier can authorize a commit.

## Validate

```bash
npm run validate:court-skills
```

This runs strict bundle/schema checks, 44 Python facade tests, and 17 Node
schema/adapter/installer tests.

## Install

An explicit target and adapter are mandatory:

```bash
npm run install:court-skills -- \
  --target /explicit/operator/target \
  --adapter hermes \
  --create-target
```

Use `--adapter generic-json` for the framework-neutral layout. Installation is
preflighted, content-addressed, idempotent, collision-safe, and separate from
GOV-207 files and host configuration. The installer rejects symlinks and path
escape and restores owned bytes if a commit fails.

## Local Observation

The optional observational runner targets a loopback OpenAI-compatible model:

```bash
CRT307_LOCAL_MODEL_ENDPOINT=http://localhost:5001 \
  npm run observe:court-skills:local -- \
  --output qa/crt-307-local-model-observation.json
```

Model observations are QA evidence only and are excluded from canonical
fingerprints. Executable runtime, schema, replay, and verifier results remain
authoritative.

The subsystem remains `proposed_pending_crt_309`. Facade-local repetition
history resets on process restart; the CRT-305 state and ledger never store or
derive authority from that safety guard.
