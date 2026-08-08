# Governor Graph Read API

## Overview

The GOV-206 Governor Graph Read API provides bounded, parameterized, read-only
named graph queries over typed aspects, bridge rules, classification evidence,
verified ledger snapshots, and governor profiles. It replaces the unrestricted
raw `/api/query` endpoint with an allow-listed query catalog.

## Endpoint

### POST /api/governor-query

Execute a named query against the current graph projection.

**Request body:**

```json
{
  "schemaVersion": "gov-206.named-query-request.v1",
  "queryId": "aspect_context",
  "parameters": {
    "aspectId": "aspect:jupiter:declared-wavelength:v1"
  }
}
```

**Response:**

```json
{
  "schemaVersion": "gov-206.named-query-response.v1",
  "queryId": "aspect_context",
  "queryVersion": "1.0.0",
  "projectionFingerprint": "<sha256>",
  "requestFingerprint": "<sha256>",
  "resultFingerprint": "<sha256>",
  "data": {
    "mode": "scalar",
    "value": {
      "logicalId": "gov:aspect:aspect:jupiter:declared-wavelength:v1",
      "aspectId": "aspect:jupiter:declared-wavelength:v1",
      "primaryGovernor": "Jupiter",
      "admissionStatus": "canonical",
      "verificationStatus": "not_applicable",
      "ruleLogicalIds": ["gov:rule:rule:jupiter:declared-wavelength:v1"],
      "provenanceLogicalIds": [],
      "recordSha256": "<sha256>"
    }
  }
}
```

## Named Query Catalog

| Query | Parameters | Mode | Description |
|---|---|---|---|
| `aspect_context` | `aspectId` | scalar | Aspect, its Governor, rules, and provenance |
| `governor_profile` | `governor` | scalar | Governor profile with references |
| `rule_explanation` | `ruleId` | scalar | Rule antecedents, output, admission, provenance |
| `legal_move_context` | `snapshotId` | tabular | Contextual legal moves (no execution authority) |
| `provenance_path` | `logicalId`, `maxDepth?` | tabular | Provenance paths up to depth 3 |
| `prior_verified_outcomes` | `taskId`, `limit?` | tabular | Verified snapshots by task |

## Hard Limits

| Limit | Value |
|---|---:|
| Request body | 16 KiB |
| Response body | 256 KiB |
| Returned rows | 100 |
| Graph traversal depth | 3 |
| Neo4j transaction timeout | 1 second |
| String/identifier length | 256 characters |

## Negative Boundaries

- **No raw Cypher**: the `cypher` parameter is rejected at every level.
- **No provider selection**: the client cannot choose file vs. Neo4j.
- **No write operations**: no query can create, update, delete, or authorize.
- **No canonical office mutation**: `ScaleState.office`,
  `OCCUPIES_OFFICE`, and degree Governor fields are prohibited.
- **No execution authority**: legal moves are contextual-only metadata.

## Raw Query (Development Only)

The legacy `POST /api/query` endpoint returns 404 by default. To enable it for
local development only, set `GRAPH_ENABLE_RAW_QUERY=1` and ensure the server
binds to a loopback address. The server will refuse to start if raw mode is
enabled on a non-loopback bind.

## Providers

The API supports three interchangeable providers:

1. **SnapshotProvider**: queries an immutable in-memory snapshot.
2. **FileProvider**: loads a canonical graph snapshot from disk.
3. **Neo4jProvider**: executes catalog-owned parameterized Cypher via a READ
   session.

All providers produce byte-identical canonical responses for the same inputs.