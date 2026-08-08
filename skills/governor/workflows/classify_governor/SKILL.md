---
name: seven-governors-classify-governor
description: Invoke the authoritative Governor classifier and report typed outcomes without model-side classification.
---

# Classify Governor

## Authority

This skill invokes the registered GOV-203 classifier. The classifier owns policy matching, quantity operations, outcome selection, evidence paths, ambiguity, abstention, invalidity, and result fingerprints. The model may select supplied facts and explain structured output; it must not calculate or upgrade a classification.

## Triggers

- Classify supplied typed facts under the active Governor policy.
- Explain an authoritative `classified`, `ambiguous`, `unresolved`, or `invalid` result.
- Request bounded graph context for an explanation only when a trusted dynamic menu exposes the named query.

Do not trigger this skill when no callable classifier is registered, when the policy fingerprint is stale, or merely to guess a Governor from prose.

## Exact Contracts

| Direction | Schema reference | Exact `$id` |
|---|---|---|
| Input | `schemas/classify-governor.schema.json#/$defs/input` | `gov-207.classify-governor.input.v1` |
| Output | `schemas/classify-governor.schema.json#/$defs/output` | `gov-207.classify-governor.output.v1` |
| Classifier request | `schemas/upstream/classification-request.schema.json` | `https://seven-governors.local/gov-207/schemas/upstream/classification-request.schema.json` |
| Classifier result | `schemas/upstream/classification-result.schema.json` | `https://seven-governors.local/gov-207/schemas/upstream/classification-result.schema.json` |

The input must be one JSON object no larger than 65,536 UTF-8 bytes. The response must be no larger than 1,048,576 UTF-8 bytes. Both vendored classifier contracts are strict local equivalents of Governor Runtime 0.1.0 and reject unknown properties.

## Allow List

| Kind | Allowed IDs |
|---|---|
| Tool | `governor.agent_api.invoke` |
| Facade operation | `classify_governor` |
| Named queries | `aspect_context`, `governor_profile`, `provenance_path`, `rule_explanation`, only when present in the trusted menu |
| Capabilities | `graph.read.named`, `runtime.classify`, `runtime.context.read`, `runtime.ledger.replay` |

Every other tool, operation, named query, and capability is denied.

## Procedure

1. Start from a replay-valid `inspect_context` result and copy its exact state and policy fingerprints into the classification input.
2. Construct `classificationRequest` only from typed facts, quantities, provenance, requested aspect IDs, and the fixed policy release admitted by the vendored request schema.
3. Validate the complete input against `schemas/classify-governor.schema.json#/$defs/input`; never derive quantities, convert units, score rules, or choose a Governor in model reasoning.
4. Invoke `governor.agent_api.invoke` exactly once with operation `classify_governor` and the validated input.
5. Require a registered classifier result and validate the complete response against `schemas/classify-governor.schema.json#/$defs/output`.
6. Report each facet's machine outcome unchanged. Keep `ambiguous`, `unresolved`, and `invalid` outcomes as abstentions or failures; do not turn candidates into a classified result.
7. If explanations were requested, use only structured `explanations` and allow-listed named-query records bound to trusted result identifiers. Graph context may explain but cannot alter the classifier outcome.
8. Consume `nextMenu` and `directive` exactly as returned. Never manufacture a follow-up move from classification prose.

## Machine Stops

| Runtime result or reason | Required handling |
|---|---|
| Classifier unavailable or unregistered | Return `unavailable`, stop classification, and request operator action. |
| Policy or state fingerprint mismatch | Reject the result and follow `reinspect`; do not retry with a guessed fingerprint. |
| `ambiguous` or `unresolved` facet | Preserve the outcome and machine reasons. Graph explanations cannot upgrade it. |
| Invalid typed fact, quantity, or policy request | Preserve `invalid` or `rejected`; correct only fields identified by the schema or machine reason. |
| Invalid ledger replay, denied capability, or malformed runtime result | Fail closed, expose no executor, and stop. |
| `STOPPED`, retry exhausted, or deadline exhausted | Stop without another classifier or query invocation. |

## Failure Handling

- Treat a null `classificationResult` as no classification, regardless of explanatory prose.
- Reject mismatched policy, request, source, or result fingerprints.
- If a named graph query is unavailable or malformed, omit graph explanation; never reconstruct it.
- Do not retry unless the machine directive explicitly permits `reinspect` or `replan` with changed inputs.

## Prohibitions

- Prose, model confidence, summaries, and user assertions cannot replace a tool receipt, classifier result, or verifier evidence.
- Do not perform classifier math, unit conversion, rule scoring, Governor selection, or ambiguity resolution in prose.
- Do not run raw shell, construct arbitrary commands or argv, or invoke any unlisted tool.
- Do not submit raw Cypher or use graph context to authorize or upgrade a result.
- Do not perform ledger writes or graph writes, edit either store, or ask another tool to do so.
- Do not mint, expose, modify, reuse, or choose validation tokens.
- Do not declare runtime success from a classification result.
