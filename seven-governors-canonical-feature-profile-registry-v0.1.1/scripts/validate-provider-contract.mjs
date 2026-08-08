import { validateSyntax } from "@neo4j-cypher/language-support";
import { compileProfileWithProvider } from "./compiler.mjs";
import { readJson, writeJson } from "./lib.mjs";
import { FileRegistryProvider } from "./providers/file-registry-provider.mjs";
import {
  NEO4J_PROVIDER_QUERIES,
  Neo4jRegistryProvider,
} from "./providers/neo4j-registry-provider.mjs";
import { SnapshotRegistryProvider } from "./providers/snapshot-registry-provider.mjs";

const network = readJson("source/universal-network-data.json");
const profileRegistry = readJson(
  "canonical/canonical-governor-profiles.json",
);
const photonicRegistry = readJson("canonical/photonic-records.json");
const semanticRegistry = readJson(
  "canonical/semantic-operator-registry.json",
);
const projectionRegistry = readJson(
  "canonical/domain-projection-registry.json",
);

const snapshotProvider = new SnapshotRegistryProvider({
  network,
  profileRegistry,
  photonicRegistry,
  semanticRegistry,
  projectionRegistry,
  providerName: "snapshot",
});
const fileProvider = new FileRegistryProvider();

class MockRecord {
  constructor(values) {
    this.values = values;
  }

  get(key) {
    return this.values[key];
  }
}

function mockNode(properties) {
  return { properties };
}

function graphProfile(profile) {
  return {
    profile_id: profile.profileId,
    profile_version: profile.profileVersion,
    office: profile.office,
    office_index: profile.officeIndex,
    fingerprint: profile.intrinsicFingerprint,
    canonical_state_id: profile.canonicalIdentity.stateId,
    canonical_state_name: profile.canonicalIdentity.stateName,
    canonical_mode: profile.canonicalIdentity.mode,
    forte_family: profile.canonicalIdentity.forteFamily,
    pitch_mask: profile.canonicalIdentity.pitchMask,
    anchor_tier: profile.canonicalIdentity.anchorTier,
    thermodynamic_function: profile.semantic.thermodynamicFunction,
    optical_function: profile.semantic.opticalFunction,
    directionality: profile.semantic.directionality,
    archetypal_role: profile.semantic.archetypalRole,
    element: profile.semantic.element,
    semantic_coordinate_status:
      profile.semantic.semanticCompression.status,
    semantic_order:
      profile.semantic.semanticCompression.orderedPosition,
    semantic_normalized_ordinal:
      profile.semantic.semanticCompression.normalizedOrdinal,
    semantic_metric: profile.semantic.semanticCompression.metric,
    semantic_scale: profile.semantic.semanticCompression.scale,
  };
}

function graphPhotonic(record) {
  return {
    photonic_id: record.photonicId,
    office: record.office,
    wavelength_nm: record.representativeWavelengthNm,
    frequency_hz: record.vacuumFrequencyHz,
    photon_energy_j: record.photonEnergyJ,
    photon_energy_ev: record.photonEnergyEv,
    photonic_compression: record.photonicCompression,
  };
}

function graphSemanticOperator(operator) {
  return {
    semantic_operator_id: operator.semanticOperatorId,
    structural_operator_id: operator.structuralOperatorId,
    degree: operator.degree,
    degree_governor: operator.degreeGovernor,
    direction: operator.direction,
    semantic_status: operator.semanticStatus,
  };
}

const mockSession = {
  async executeRead(work) {
    return work({
      async run(query, parameters) {
        if (query === NEO4J_PROVIDER_QUERIES.state) {
          const state = network.nodes.find(
            (candidate) => candidate.id === Number(parameters.stateId),
          );
          return {
            records: state
              ? [new MockRecord({ state: mockNode(state) })]
              : [],
          };
        }
        if (query === NEO4J_PROVIDER_QUERIES.profile) {
          const profile = profileRegistry.profiles.find(
            (candidate) => candidate.office === parameters.office,
          );
          const light = photonicRegistry.records.find(
            (candidate) => candidate.office === parameters.office,
          );
          return {
            records: profile
              ? [
                  new MockRecord({
                    canonical_profile: mockNode(graphProfile(profile)),
                    light: light ? mockNode(graphPhotonic(light)) : null,
                    release_id: profileRegistry.releaseId,
                    landforms: profile.domainReferences.landforms,
                  }),
                ]
              : [],
          };
        }
        if (query === NEO4J_PROVIDER_QUERIES.projection) {
          const projection = projectionRegistry.projections.find(
            (candidate) => candidate.domain === parameters.domain,
          );
          return {
            records: projection
              ? [
                  new MockRecord({
                    projection: mockNode({
                      projection_id: projection.projectionId,
                      domain: projection.domain,
                      status: projection.status,
                    }),
                    release_id: projectionRegistry.releaseId,
                  }),
                ]
              : [],
          };
        }
        if (query === NEO4J_PROVIDER_QUERIES.semanticOperator) {
          const operator = semanticRegistry.operators.find(
            (candidate) =>
              candidate.structuralOperatorId === parameters.operatorId,
          );
          return {
            records: operator
              ? [
                  new MockRecord({
                    operator: mockNode(graphSemanticOperator(operator)),
                    scopes: operator.semanticEffects.unresolved.map(
                      (scope) => `unresolved:${scope}`,
                    ),
                  }),
                ]
              : [],
          };
        }
        throw new Error("Unexpected Neo4j provider query in mock session.");
      },
    });
  },
};
const neo4jProvider = new Neo4jRegistryProvider({ session: mockSession });

const cases = [
  {
    label: "Acoustic via Lydian",
    stateId: 1749,
    route: { sourceId: 2773, operatorId: "L7" },
  },
  {
    label: "Harmonic Minor via Aeolian",
    stateId: 2477,
    route: { sourceId: 1453, operatorId: "R7" },
  },
  {
    label: "Boundary state",
    stateId: 223,
    route: null,
  },
];

const checks = [];
for (const testCase of cases) {
  const filePacket = await compileProfileWithProvider({
    provider: fileProvider,
    stateId: testCase.stateId,
    domain: "landforms",
    route: testCase.route,
  });
  const snapshotPacket = await compileProfileWithProvider({
    provider: snapshotProvider,
    stateId: testCase.stateId,
    domain: "landforms",
    route: testCase.route,
  });
  const neo4jPacket = await compileProfileWithProvider({
    provider: neo4jProvider,
    stateId: testCase.stateId,
    domain: "landforms",
    route: testCase.route,
  });
  checks.push({
    name: `provider-conformance:${testCase.label}`,
    passed:
      filePacket.intrinsicFingerprint ===
        snapshotPacket.intrinsicFingerprint &&
      filePacket.intrinsicFingerprint ===
        neo4jPacket.intrinsicFingerprint &&
      filePacket.fingerprintInputCanonicalJson ===
        snapshotPacket.fingerprintInputCanonicalJson &&
      filePacket.fingerprintInputCanonicalJson ===
        neo4jPacket.fingerprintInputCanonicalJson,
    detail: {
      stateId: testCase.stateId,
      fingerprints: {
        file: filePacket.intrinsicFingerprint,
        snapshot: snapshotPacket.intrinsicFingerprint,
        neo4j: neo4jPacket.intrinsicFingerprint,
      },
    },
  });
}

for (const [name, query] of Object.entries(NEO4J_PROVIDER_QUERIES)) {
  const diagnostics = validateSyntax(query, {});
  checks.push({
    name: `neo4j-provider-cypher:${name}`,
    passed: diagnostics.every((diagnostic) => diagnostic.severity !== 1),
    detail: diagnostics,
  });
}

let missingSessionRejected = false;
try {
  new Neo4jRegistryProvider({ session: null });
} catch {
  missingSessionRejected = true;
}
checks.push({
  name: "neo4j-provider:session-contract",
  passed: missingSessionRejected,
  detail: "Provider rejects construction without an open driver Session.",
});

const failed = checks.filter((check) => !check.passed);
writeJson("qa/provider-contract-report.json", {
  schemaVersion: "1.0.0",
  packageVersion: "0.1.1",
  generatedAt: "2026-07-30",
  status: failed.length ? "failed" : "passed",
  checkCount: checks.length,
  passedCount: checks.length - failed.length,
  failedCount: failed.length,
  liveNeo4jExecution:
    "not_run; execute the packaged integration query against the host project after import",
  checks,
});

if (failed.length) {
  console.error(JSON.stringify(failed, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    `Provider contract validation passed ${checks.length}/${checks.length}.`,
  );
}
