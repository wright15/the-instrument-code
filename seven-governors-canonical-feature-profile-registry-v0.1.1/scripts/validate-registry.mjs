import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import {
  PACKAGE_ROOT,
  readJson,
  sha256,
  writeJson,
} from "./lib.mjs";

const ajv = new Ajv2020({
  allErrors: true,
  strict: false,
  allowUnionTypes: true,
});

const schemaChecks = [
  [
    "canonical profiles",
    "schemas/canonical-profile.schema.json",
    "canonical/canonical-governor-profiles.json",
  ],
  [
    "feature definitions",
    "schemas/feature-definition.schema.json",
    "canonical/feature-registry.json",
  ],
  [
    "semantic operators",
    "schemas/semantic-operator.schema.json",
    "canonical/semantic-operator-registry.json",
  ],
  [
    "registry release",
    "schemas/registry-release.schema.json",
    "canonical/registry-release.json",
  ],
  [
    "source authority",
    "schemas/source-authority.schema.json",
    "canonical/source-authority-registry.json",
  ],
];

const checks = [];
let failed = false;

function record(name, passed, detail) {
  checks.push({ name, passed, detail });
  if (!passed) failed = true;
}

for (const [label, schemaPath, artifactPath] of schemaChecks) {
  const schema = readJson(schemaPath);
  const artifact = readJson(artifactPath);
  const validate = ajv.compile(schema);
  const passed = validate(artifact);
  record(
    `schema:${label}`,
    passed,
    passed ? "valid" : validate.errors,
  );
}

const compiledSchema = readJson("schemas/compiled-profile.schema.json");
const validateCompiled = ajv.compile(compiledSchema);
const packetDirectory = path.join(
  PACKAGE_ROOT,
  "examples/compiled-landform-packets",
);
const packetFiles = fs
  .readdirSync(packetDirectory)
  .filter((name) => name.endsWith(".json"))
  .sort();
const packets = packetFiles.map((name) => ({
  name,
  packet: JSON.parse(
    fs.readFileSync(path.join(packetDirectory, name), "utf8"),
  ),
}));
for (const { name, packet } of packets) {
  const passed = validateCompiled(packet);
  record(
    `schema:compiled:${name}`,
    passed,
    passed ? "valid" : validateCompiled.errors,
  );
  record(
    `fingerprint:${name}`,
    sha256(packet.fingerprintInputCanonicalJson) ===
      packet.intrinsicFingerprint,
    "fingerprint recomputed from canonical intrinsic JSON",
  );
  record(
    `route-separation:${name}`,
    packet.routeContext?.excludedFromIntrinsicFingerprint === true &&
      !packet.fingerprintInputCanonicalJson.includes(
        packet.routeContext.routeId,
      ),
    "route id absent from intrinsic fingerprint input",
  );
}

const network = readJson("source/universal-network-data.json");
const profiles = readJson(
  "canonical/canonical-governor-profiles.json",
).profiles;
const photonic = readJson("canonical/photonic-records.json").records;
const measures = readJson(
  "canonical/harmonic-measure-definitions.json",
);
const semantic = readJson(
  "canonical/semantic-operator-registry.json",
);
const features = readJson("canonical/feature-registry.json");
const projections = readJson(
  "canonical/domain-projection-registry.json",
);
const authority = readJson(
  "canonical/source-authority-registry.json",
);
const release = readJson("canonical/registry-release.json");
const fixtures = readJson("fixtures/reference-fixture-index.json");
const nodeById = new Map(network.nodes.map((node) => [node.id, node]));
const releaseBearingArtifacts = [
  { label: "profiles", value: readJson(
    "canonical/canonical-governor-profiles.json",
  ) },
  { label: "photonic", value: readJson(
    "canonical/photonic-records.json",
  ) },
  { label: "features", value: features },
  { label: "measures", value: measures },
  { label: "operators", value: semantic },
  { label: "projections", value: projections },
  { label: "authority", value: authority },
  { label: "fixtures", value: fixtures },
];

record(
  "invariant:release-identity",
  release.releaseId === "canonical-profile-registry:0.1.1" &&
    release.registryVersion === "0.1.1" &&
    releaseBearingArtifacts.every(
      ({ value }) => value.releaseId === release.releaseId,
    ) &&
    packets.every(
      ({ packet }) => packet.releaseId === release.releaseId,
    ),
  releaseBearingArtifacts.map(({ label, value }) => ({
    artifact: label,
    releaseId: value.releaseId,
  })),
);

record(
  "invariant:office-order",
  JSON.stringify(profiles.map((profile) => profile.office)) ===
    JSON.stringify(network.officeOrder),
  profiles.map((profile) => profile.office),
);

record(
  "invariant:canonical-A0-alignment",
  profiles.every((profile) => {
    const node = nodeById.get(profile.canonicalIdentity.stateId);
    return (
      node?.office === profile.office &&
      node?.tier === "A0" &&
      node?.role === "anchor"
    );
  }),
  "all canonical profiles resolve to their audited A0 anchor",
);

record(
  "invariant:photonic-monotonicity",
  photonic.every(
    (record, index) =>
      index === 0 ||
      record.photonicCompression >
        photonic[index - 1].photonicCompression,
  ),
  photonic.map((record) => ({
    office: record.office,
    C_P: record.photonicCompression,
  })),
);

record(
  "invariant:photonic-noncausal",
  photonic.every(
    (record) =>
      record.interpretationPolicy.causationClaim === false &&
      record.interpretationPolicy.mutatedByMusicalOperator === false,
  ),
  "musical operators do not mutate physical quantities",
);

record(
  "invariant:C_S-nonmetric-order",
  profiles.every(
    (profile, index) =>
      profile.semantic.semanticCompression.metric === false &&
      profile.semantic.semanticCompression.physicalClaim === false &&
      profile.semantic.semanticCompression.orderedPosition === index + 1 &&
      profile.semantic.semanticCompression.normalizedOrdinal ===
        index / (profiles.length - 1),
  ),
  profiles.map((profile) => ({
    office: profile.office,
    orderedPosition:
      profile.semantic.semanticCompression.orderedPosition,
    normalizedOrdinal:
      profile.semantic.semanticCompression.normalizedOrdinal,
    metric: profile.semantic.semanticCompression.metric,
  })),
);

record(
  "invariant:C_H-unresolved",
  measures.aggregateHarmonicCompression.status === "unresolved" &&
    measures.aggregateHarmonicCompression.value === null &&
    profiles.every(
      (profile) =>
        profile.harmonic.harmonicCompression.status === "unresolved" &&
        profile.harmonic.harmonicCompression.value === null,
    ),
  "no aggregate harmonic compression formula was invented",
);

record(
  "invariant:Carey-family-tuning-scope",
  measures.measures
    .filter((measure) => ["carey_CQ", "carey_SQ"].includes(measure.measureId))
    .every((measure) => measure.scope === "ScaleFamily_under_tuning"),
  "CQ/SQ remain family-and-tuning properties",
);

const expectedOperatorIds = [
  "M",
  "R1",
  "L1",
  "R2",
  "L2",
  "R3",
  "L3",
  "R4",
  "L4",
  "R5",
  "L5",
  "R6",
  "L6",
  "R7",
  "L7",
];
record(
  "invariant:operator-completeness",
  JSON.stringify(
    semantic.operators.map((operator) => operator.structuralOperatorId),
  ) === JSON.stringify(expectedOperatorIds),
  "M plus R1–R7 and L1–L7",
);

record(
  "invariant:no-premature-semantic-effects",
  semantic.operators.every(
    (operator) =>
      ["preserves", "transforms", "promotes", "suppresses", "prohibits"].every(
        (effect) => operator.semanticEffects[effect].length === 0,
      ) &&
      operator.semanticEffects.unresolved.length === 4 &&
      operator.semanticEffectFixtureIds.length === 0,
  ),
  "all effect slots and semantic-effect fixtures remain empty; four research scopes remain unresolved",
);

record(
  "invariant:no-physical-operator-effect",
  semantic.operators.every(
    (operator) =>
      operator.physicalPolicy.mutatesPhysicalQuantities === false,
  ),
  "all 15 operator shells prohibit musical-to-optical causation",
);

record(
  "fixture-suite:all-passed",
  fixtures.fixtureCount === 4 &&
    fixtures.fixtures.every(
      (fixture) =>
        fixture.status === "passed" &&
        fixture.fixtureClass === "structural_normalization" &&
        fixture.semanticEffectEvidence === false,
    ),
  fixtures.fixtures.map((fixture) => ({
    fixtureId: fixture.fixtureId,
    status: fixture.status,
    fixtureClass: fixture.fixtureClass,
    semanticEffectEvidence: fixture.semanticEffectEvidence,
  })),
);

record(
  "invariant:reference-pools-are-not-requirements",
  packets.every(({ packet }) => {
    const required = packet.creationConstraints.required ?? [];
    const pools = packet.creationConstraints.referencePool ?? [];
    return (
      !required.some(
        (item) =>
          item.featureId === "domain.landforms" ||
          Array.isArray(item.value),
      ) &&
      (packet.resolution.officeBearing === false ||
        pools.every(
          (pool) =>
            pool.selectionRule ===
            "select_zero_or_more_without_implying_exhaustiveness",
        ))
    );
  }),
  "landform entries are candidate reference pools; canonical process and direction remain hard constraints",
);

record(
  "invariant:legacy-source-references-quarantined",
  authority.legacyReferences.length === 7 &&
    authority.legacyReferences.every(
      (reference) =>
        reference.packaged === false &&
        reference.runtimeAuthority === false &&
        reference.status ===
          "legacy_or_external_reference_unresolved",
    ),
  authority.legacyReferences,
);

for (const fixture of fixtures.fixtures) {
  const targetPackets = packets
    .map(({ packet }) => packet)
    .filter((packet) =>
      fixture.routes.some(
        (route) => route.routeId === packet.routeContext?.routeId,
      ),
    );
  record(
    `confluence:${fixture.fixtureId}`,
    targetPackets.length === fixture.routes.length &&
      new Set(
        targetPackets.map((packet) => packet.intrinsicFingerprint),
      ).size === 1 &&
      targetPackets[0]?.intrinsicFingerprint ===
        fixture.normalFormFingerprint,
    `${targetPackets.length} route packet(s) converge on ${fixture.normalFormFingerprint}`,
  );
}

const sourceHashes = {};
for (const relativePath of [
  "source/governors.yaml",
  "source/universal-network-data.json",
  "source/topology-identity-definitions.json",
  "source/operator-candidates.json",
  "source/operator-applications.csv",
  "source/framework/AGENTS.md",
  "source/framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
  "source/framework/TOPOLOGICAL_ANCHORING.md",
  "source/framework/NATURAL_ORGANIZATION_THESIS.md",
]) {
  sourceHashes[relativePath] = sha256(
    fs.readFileSync(path.join(PACKAGE_ROOT, relativePath)),
  );
}

record(
  "invariant:release-source-hashes",
  JSON.stringify(sourceHashes) === JSON.stringify(release.sourceHashes),
  "registry release fingerprint is bound to the frozen source snapshot",
);

const report = {
  schemaVersion: "1.0.0",
  packageVersion: "0.1.1",
  releaseId: release.releaseId,
  releaseFingerprint: release.releaseFingerprint,
  generatedAt: "2026-07-30",
  status: failed ? "failed" : "passed",
  checkCount: checks.length,
  passedCount: checks.filter((check) => check.passed).length,
  failedCount: checks.filter((check) => !check.passed).length,
  sourceHashes,
  checks,
};
writeJson("qa/validation-report.json", report);

if (failed) {
  console.error(
    JSON.stringify(
      checks.filter((check) => !check.passed),
      null,
      2,
    ),
  );
  process.exitCode = 1;
} else {
  console.log(`Registry validation passed ${checks.length}/${checks.length}.`);
}
