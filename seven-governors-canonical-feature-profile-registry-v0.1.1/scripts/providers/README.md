# Registry Provider Contract

`loadCompilationContext({stateId, domain, structuralOperatorIds})` returns the
resolved state, active canonical profile, photonic record, domain projection,
and semantic operator shells required by the deterministic compiler.

- `FileRegistryProvider` is the reproducible release/test adapter.
- `Neo4jRegistryProvider` is the integrated runtime adapter and accepts an open
  `neo4j-driver` Session supplied by the host project.
- `SnapshotRegistryProvider` supports deterministic conformance tests and
  application-owned snapshots.

The compiler core does not decide which representation is authoritative. The
host chooses a provider, and every conforming provider must produce the same
intrinsic packet for the same release and state.

## Integrated Neo4j example

```js
import neo4j from "neo4j-driver";
import { compileProfileWithProvider } from "../compiler.mjs";
import { Neo4jRegistryProvider } from "./neo4j-registry-provider.mjs";

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME,
    process.env.NEO4J_PASSWORD,
  ),
);
const session = driver.session({ database: process.env.NEO4J_DATABASE });

try {
  const provider = new Neo4jRegistryProvider({ session });
  const packet = await compileProfileWithProvider({
    provider,
    stateId: 1749,
    domain: "landforms",
    route: {
      sourceId: 2773,
      operatorId: "L7",
      routeId: "route:project:lydian-to-acoustic",
    },
  });
  console.log(packet);
} finally {
  await session.close();
  await driver.close();
}
```

The provider accepts an optional
`releaseId: "canonical-profile-registry:0.1.1"`. With no release ID, it resolves
the graph’s active registry release.

The host project owns connection configuration and the driver lifecycle. This
package declares `neo4j-driver` as an optional peer dependency so the frozen
file compiler can still validate without a database.
