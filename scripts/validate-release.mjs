import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { recordFile, walkFiles } from "./manifest-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const checks = [];

function record(name, passed, diagnostic) {
  checks.push({
    name,
    status: passed ? "PASS" : "FAIL",
    diagnostic,
  });
}

async function read(relativePath) {
  return fs.readFile(path.join(packageRoot, relativePath));
}

async function hash(relativePath) {
  const bytes = await read(relativePath);
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

async function rowCount(relativePath) {
  const text = (await read(relativePath)).toString("utf8").trim();
  return text ? text.split(/\r?\n/).length - 1 : 0;
}

function runIn(relativeDirectory, command, args) {
  return spawnSync(command, args, {
    cwd: path.join(packageRoot, relativeDirectory),
    encoding: "utf8",
  });
}

function runNpmScript(relativeDirectory, script) {
  const result = runIn(relativeDirectory, "npm", ["run", script, "--silent"]);
  const tail =
    (result.stdout ?? "").trim().split(/\r?\n/).slice(-5).join("\n") ||
    (result.stderr ?? "").trim().split(/\r?\n/).slice(-5).join("\n");
  return { passed: result.status === 0, tail };
}

// ---------------------------------------------------------------------------
// 1. Topology release facts (existing core checks)
// ---------------------------------------------------------------------------

const release = JSON.parse((await read("provenance/release.json")).toString());
record(
  "release id",
  release.releaseId === "seven-governors-integrated-1.2.0" &&
    release.version === "1.2.0",
  { releaseId: release.releaseId, version: release.version },
);
for (const source of release.frameworkSources) {
  const actual = await hash(source.path);
  record(
    `framework source hash: ${source.documentId}`,
    actual === source.sha256,
    { expected: source.sha256, actual, path: source.path },
  );
}

const canonical = JSON.parse(
  (await read("canonical/universal-network-data.json")).toString(),
);
const roleCounts = canonical.nodes.reduce((counts, node) => {
  counts[node.role] = (counts[node.role] ?? 0) + 1;
  return counts;
}, {});
record("canonical rooted states", canonical.nodes.length === 462, canonical.nodes.length);
record("canonical anchors", roleCounts.anchor === 70, roleCounts.anchor);
record("canonical satellites", roleCounts.satellite === 238, roleCounts.satellite);
record("canonical boundaries", roleCounts.boundary === 154, roleCounts.boundary);
record(
  "office-bearing states",
  canonical.nodes.filter((node) => node.office != null).length === 308,
  canonical.nodes.filter((node) => node.office != null).length,
);
record(
  "boundary office withheld",
  canonical.nodes
    .filter((node) => node.role === "boundary")
    .every((node) => node.office == null),
  "all boundary offices must be null",
);
record(
  "unique rooted state ids",
  new Set(canonical.nodes.map((node) => node.id)).size === 462,
  new Set(canonical.nodes.map((node) => node.id)).size,
);
record(
  "canonical relationship total",
  canonical.summary.graphEdges === 2594,
  canonical.summary.graphEdges,
);
record(
  "universal rendered relationship total",
  canonical.views.universal.edgeIds.length === 1824,
  canonical.views.universal.edgeIds.length,
);
record(
  "family registry",
  canonical.familyRegistry.length === 38,
  canonical.familyRegistry.length,
);

const csvExpectations = {
  "neo4j/csv/scale-states.csv": 462,
  "neo4j/csv/scale-families.csv": 38,
  "neo4j/csv/governor-offices.csv": 7,
  "neo4j/csv/governs.csv": 238,
  "neo4j/csv/constructs.csv": 28,
  "neo4j/csv/seat-contact.csv": 140,
  "neo4j/csv/modal-successor.csv": 182,
  "neo4j/csv/audited-hamming2.csv": 585,
  "neo4j/csv/phase-shift.csv": 175,
  "neo4j/csv/convergence-contact.csv": 210,
  "neo4j/csv/junction-contact.csv": 252,
  "neo4j/csv/leaf-contact.csv": 14,
  "neo4j/csv/belongs-to-family.csv": 462,
  "neo4j/csv/occupies-office.csv": 308,
  "neo4j/csv/relational-office-evidence.csv": 224,
  "neo4j/csv/relationships.csv": 2818
};
for (const [relativePath, expected] of Object.entries(csvExpectations)) {
  const actual = await rowCount(relativePath);
  record(`CSV rows: ${path.basename(relativePath)}`, actual === expected, {
    expected,
    actual,
  });
}

// ---------------------------------------------------------------------------
// 2. Mutation algebra audit
// ---------------------------------------------------------------------------

const auditRows = {
  "seven-governors-mutation-algebra-audit/audit/operator-registry.csv": 15,
  "seven-governors-mutation-algebra-audit/audit/operator-applications.csv": 3402,
  "seven-governors-mutation-algebra-audit/audit/cycle-identities.csv": 66,
  "seven-governors-mutation-algebra-audit/audit/commutation-summary.csv": 91,
  "seven-governors-mutation-algebra-audit/audit/inverse-witnesses.csv": 3402,
};
for (const [relativePath, expected] of Object.entries(auditRows)) {
  const actual = await rowCount(relativePath);
  record(`audit rows: ${path.basename(relativePath)}`, actual === expected, {
    expected,
    actual,
  });
}
const auditReport = JSON.parse(
  (
    await read(
      "seven-governors-mutation-algebra-audit/qa/mutation-algebra-validation.json",
    )
  ).toString(),
);
record(
  "audit validation report",
  auditReport.allPass === true,
  {
    allPass: auditReport.allPass,
    assertions: auditReport.assertions?.length ?? null,
    counts: auditReport.counts ?? null,
  },
);
const auditSchemaCheck = runNpmScript(
  "seven-governors-mutation-algebra-audit",
  "validate:schema",
);
record(
  "audit operator-registry schema",
  auditSchemaCheck.passed,
  auditSchemaCheck.passed ? "passed" : auditSchemaCheck.tail,
);
const auditCypherCheck = runNpmScript(
  "seven-governors-mutation-algebra-audit",
  "validate:cypher",
);
record(
  "audit cypher syntax",
  auditCypherCheck.passed,
  auditCypherCheck.passed ? "passed" : auditCypherCheck.tail,
);

// ---------------------------------------------------------------------------
// 3. Canonical feature profile registry (semantic registry)
// ---------------------------------------------------------------------------

const registryValidate = runNpmScript(
  "seven-governors-canonical-feature-profile-registry-v0.1.1",
  "validate",
);
record(
  "profile registry full validation",
  registryValidate.passed,
  registryValidate.passed ? "passed" : registryValidate.tail,
);
const registryReport = JSON.parse(
  (
    await read(
      "seven-governors-canonical-feature-profile-registry-v0.1.1/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "profile registry report",
  registryReport.status === "passed" && registryReport.failedCount === 0,
  {
    status: registryReport.status,
    failedCount: registryReport.failedCount,
  },
);

// ---------------------------------------------------------------------------
// 4. Governor runtime policy contracts (post-1.2.0 candidate package)
// ---------------------------------------------------------------------------

const governorRuntimeValidate = runNpmScript(
  "seven-governors-governor-runtime-v0.1.0",
  "validate",
);
record(
  "governor runtime validation",
  governorRuntimeValidate.passed,
  governorRuntimeValidate.passed ? "passed" : governorRuntimeValidate.tail,
);
const governorRuntimeReport = JSON.parse(
  (
    await read(
      "seven-governors-governor-runtime-v0.1.0/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "governor runtime report",
  governorRuntimeReport.status === "passed" &&
    governorRuntimeReport.summary?.failed === 0 &&
    governorRuntimeReport.packageVersion === "0.1.0" &&
    governorRuntimeReport.releaseId === "governor-runtime:0.1.0",
  {
    status: governorRuntimeReport.status,
    failed: governorRuntimeReport.summary?.failed,
    packageVersion: governorRuntimeReport.packageVersion,
    releaseId: governorRuntimeReport.releaseId,
    policyFingerprint: governorRuntimeReport.policyFingerprint,
  },
);
const governorRuntimeDeterminism = JSON.parse(
  (
    await read(
      "seven-governors-governor-runtime-v0.1.0/qa/determinism-report.json",
    )
  ).toString(),
);
record(
  "governor runtime determinism",
  governorRuntimeDeterminism.status === "passed" &&
    governorRuntimeDeterminism.summary?.failed === 0 &&
    governorRuntimeDeterminism.summary?.checks === 4,
  {
    status: governorRuntimeDeterminism.status,
    failed: governorRuntimeDeterminism.summary?.failed,
    checks: governorRuntimeDeterminism.summary?.checks,
  },
);

// ---------------------------------------------------------------------------
// 5. Optional context registries (companion/candidate package)
// ---------------------------------------------------------------------------

const toolkitValidate = runNpmScript(
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0",
  "validate",
);
record(
  "companion toolkit validation",
  toolkitValidate.passed,
  toolkitValidate.passed ? "passed" : toolkitValidate.tail,
);
const toolkitReport = JSON.parse(
  (
    await read(
      "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/qa/validation-report.json",
    )
  ).toString(),
);
record(
  "companion toolkit report",
  toolkitReport.status === "passed" &&
    toolkitReport.summary?.failed === 0,
  {
    status: toolkitReport.status,
    failed: toolkitReport.summary?.failed,
  },
);

// ---------------------------------------------------------------------------
// 6. API contract (static)
// ---------------------------------------------------------------------------

for (const relativePath of [
  "server.mjs",
  "scripts/validate-release.mjs",
  "scripts/build-manifest.mjs",
  "scripts/validate-cypher-syntax.mjs",
]) {
  const syntaxCheck = spawnSync(
    process.execPath,
    ["--check", path.join(packageRoot, relativePath)],
    { encoding: "utf8" },
  );
  record(
    `syntax: ${relativePath}`,
    syntaxCheck.status === 0,
    syntaxCheck.stderr || "ok",
  );
}

const serverSource = (await read("server.mjs")).toString("utf8");
record(
  "server release id binding",
  serverSource.includes('"canonical-profile-registry:0.1.1"'),
  "server must target registry release 0.1.1",
);
record(
  "server expected topology counts",
  serverSource.includes("ScaleState: 462") &&
    serverSource.includes("ScaleFamily: 38") &&
    serverSource.includes("GovernorOffice: 7"),
  "server parity expectations must match canonical counts",
);
record(
  "server expected mutation counts",
  serverSource.includes("MutationOperator: 15") &&
    serverSource.includes("MODAL_MUTATES_TO: 462") &&
    serverSource.includes("LOCAL_MUTATES_TO: 2940"),
  "server parity expectations must match audit counts",
);
record(
  "server expected semantic counts",
  serverSource.includes("canonicalProfiles: 7") &&
    serverSource.includes("compiledProfiles: 4") &&
    serverSource.includes("landformReferences: 40") &&
    serverSource.includes("unresolvedScopeBindings: 60"),
  "server parity expectations must match registry 0.1.1",
);
record(
  "creation packet schema bound",
  serverSource.includes(
    "seven-governors-canonical-feature-profile-registry-v0.1.1/scripts/compiler.mjs",
  ) &&
    serverSource.includes("compileProfileWithProvider") &&
    serverSource.includes("Neo4jRegistryProvider") &&
    serverSource.includes("stateId") &&
    serverSource.includes("domain"),
  "server must compile packets through the registry compiler",
);

const compiledSchema = JSON.parse(
  (
    await read(
      "seven-governors-canonical-feature-profile-registry-v0.1.1/schemas/compiled-profile.schema.json",
    )
  ).toString(),
);
const expectedPacketFields = [
  "schemaVersion",
  "compilerVersion",
  "releaseId",
  "normalFormId",
  "state",
  "resolution",
  "canonicalProfile",
  "photonic",
  "harmonic",
  "semantic",
  "domainProjection",
  "creationConstraints",
  "provenance",
  "intrinsicFingerprint",
  "fingerprintInputCanonicalJson",
  "routeContext",
];
record(
  "compiled-profile.schema.json contract",
  expectedPacketFields.every((field) =>
    compiledSchema.required?.includes(field),
  ),
  expectedPacketFields.filter(
    (field) => !compiledSchema.required?.includes(field),
  ),
);

// ---------------------------------------------------------------------------
// 6. Explorer
// ---------------------------------------------------------------------------

const graphHtml = (await read("graph/index.html")).toString("utf8");
record(
  "standalone graph document",
  /^<!doctype html>/i.test(graphHtml) &&
    graphHtml.includes("</html>") &&
    graphHtml.includes('"registeredStates":462'),
  { bytes: Buffer.byteLength(graphHtml) },
);
record(
  "standalone graph offline closure",
  !/\b(?:src|href)=["']https?:/i.test(graphHtml),
  "no remote runtime assets",
);
for (const explorerPath of ["graph/explore.html"]) {
  try {
    const exploreHtml = (await read(explorerPath)).toString("utf8");
    record(
      `explorer: ${explorerPath}`,
      /^<!doctype html>/i.test(exploreHtml) &&
        exploreHtml.includes('src="vendor/') &&
        !/\b(?:src|href)=["']https?:/i.test(exploreHtml),
      { bytes: Buffer.byteLength(exploreHtml) },
    );
  } catch {
    record(`explorer: ${explorerPath}`, false, "missing");
  }
}
for (const vendorPath of [
  "graph/vendor/vis-network.min.js",
  "graph/vendor/3d-force-graph.min.js",
]) {
  try {
    const stat = await fs.stat(path.join(packageRoot, vendorPath));
    record(`explorer vendor: ${vendorPath}`, stat.isFile(), stat.size);
  } catch {
    record(`explorer vendor: ${vendorPath}`, false, "missing");
  }
}

// ---------------------------------------------------------------------------
// 8. Cross-package fingerprints
// ---------------------------------------------------------------------------

const fingerprintGroups = {
  "universal-network-data.json": [
    "canonical/universal-network-data.json",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/universal-network-data.json",
    "seven-governors-mutation-algebra-audit/source/universal-network-data.json",
  ],
  "topology-identity-definitions.json": [
    "canonical/topology-identity-definitions.json",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/topology-identity-definitions.json",
    "seven-governors-mutation-algebra-audit/source/topology-identity-definitions.json",
  ],
  "governors.yaml": [
    "schemas/governors.yaml",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/governors.yaml",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/governors.yaml",
  ],
  "framework/AGENTS.md": [
    "framework/AGENTS.md",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/framework/AGENTS.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/canon/AGENTS.md",
  ],
  "framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md": [
    "framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/canon/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
  ],
  "framework/NATURAL_ORGANIZATION_THESIS.md": [
    "framework/NATURAL_ORGANIZATION_THESIS.md",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/framework/NATURAL_ORGANIZATION_THESIS.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/canon/NATURAL_ORGANIZATION_THESIS.md",
  ],
  "framework/TOPOLOGICAL_ANCHORING.md": [
    "framework/TOPOLOGICAL_ANCHORING.md",
    "seven-governors-canonical-feature-profile-registry-v0.1.1/source/framework/TOPOLOGICAL_ANCHORING.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/source/canon/TOPOLOGICAL_ANCHORING.md",
  ],
  "docs/START_HERE.md": [
    "docs/START_HERE.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/START_HERE.md",
  ],
  "docs/GRAPH_AND_COMPILER_API.md": [
    "docs/GRAPH_AND_COMPILER_API.md",
    "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/GRAPH_AND_COMPILER_API.md",
  ],
};
for (const [label, paths] of Object.entries(fingerprintGroups)) {
  const digests = [];
  for (const relativePath of paths) {
    try {
      digests.push(await hash(relativePath));
    } catch {
      digests.push(null);
    }
  }
  record(
    `cross-package fingerprint: ${label}`,
    digests.every((digest) => digest !== null && digest === digests[0]),
    { paths, digests },
  );
}

// ---------------------------------------------------------------------------
// 9. Manifest and checksums freshness
// ---------------------------------------------------------------------------

const manifest = JSON.parse((await read("MANIFEST.json")).toString());
const checksumsText = (await read("CHECKSUMS.sha256")).toString("utf8").trim();
const computedRecords = [];
for (const absolutePath of await walkFiles(packageRoot, {
  excluded: new Set([
    "CHECKSUMS.sha256",
    "MANIFEST.json",
    ".env",
    "qa/integrated-release-validation.json",
    "qa/bestiary-validation.json",
    "qa/neo4j-cypher-syntax-report.json",
    ".git",
    ".pytest_cache",
    "__pycache__",
    "bestiary/dist",
    ".astro",
    ".vite",
  ]),
})) {
  computedRecords.push(await recordFile(absolutePath, packageRoot));
}
const computedPaths = new Set(computedRecords.map((item) => item.path));
const manifestByPath = new Map(manifest.files.map((item) => [item.path, item]));
const missingFromManifest = [...computedPaths].filter(
  (item) => !manifestByPath.has(item),
);
const missingFromDisk = manifest.files
  .map((item) => item.path)
  .filter((item) => !computedPaths.has(item));
const mismatchedHashes = computedRecords.filter(
  (item) =>
    manifestByPath.has(item.path) &&
    manifestByPath.get(item.path).sha256 !== item.sha256,
);
record(
  "manifest completeness",
    manifest.version === "1.2.0" &&
    missingFromManifest.length === 0 &&
    missingFromDisk.length === 0,
  {
    version: manifest.version,
    missingFromManifest,
    missingFromDisk,
  },
);
record("manifest hash parity", mismatchedHashes.length === 0, {
  mismatched: mismatchedHashes.map((item) => item.path),
});
const checksumLines = checksumsText
  .split(/\r?\n/)
  .filter((line) => line.trim() !== "");
const checksumParity = checksumLines.every((line) => {
  const match = line.match(/^([0-9a-f]{64})\s{2}(.+)$/);
  if (!match) return false;
  const [, digest, relativePath] = match;
  const record = manifestByPath.get(relativePath);
  return record?.sha256 === digest;
});
record(
  "checksums sha256 parity",
  checksumLines.length === manifest.files.length && checksumParity,
  {
    checksumLines: checksumLines.length,
    manifestFiles: manifest.files.length,
  },
);

// ---------------------------------------------------------------------------
// 9. Bestiary of Archetypes
// ---------------------------------------------------------------------------

const bestiaryChecks = [];
function bestiaryRecord(name, passed, diagnostic) {
  bestiaryChecks.push({ name, status: passed ? "PASS" : "FAIL", diagnostic });
  record(name, passed, diagnostic);
}

const bestiarySchema = JSON.parse(
  (await read("bestiary/data/bestiary-data.schema.json")).toString(),
);
const bestiary = JSON.parse(
  (await read("bestiary/data/bestiary-data.json")).toString(),
);
const createRequire = (await import("node:module")).createRequire;
const rootRequire = createRequire(path.join(packageRoot, "package.json"));
const Ajv2020 = rootRequire("ajv/dist/2020");
const ajv = new Ajv2020({ strict: false });
const bestiaryValidate = ajv.compile(bestiarySchema);
bestiaryRecord(
  "bestiary:schema-valid",
  bestiaryValidate(bestiary) === true,
  bestiaryValidate(bestiary) ? "valid" : bestiaryValidate.errors,
);

const bestiaryFreshRun = runIn(".", "node", [
  "scripts/build-bestiary.mjs",
]);
bestiaryRecord(
  "bestiary:fresh",
  bestiaryFreshRun.status === 0,
  (bestiaryFreshRun.stdout ?? bestiaryFreshRun.stderr ?? "").trim().slice(-200),
);

const bestiaryStateIds = new Set(
  bestiary.archetypes
    .filter((archetype) => archetype.kind === "scaleState")
    .map((archetype) => archetype.nodeId),
);
const bestiaryOperatorIds = new Set(
  bestiary.archetypes
    .filter((archetype) => archetype.kind === "mutationOperator")
    .map((archetype) => archetype.operatorId),
);
const bestiaryGapIds = new Set(
  bestiary.projectionGaps.map((gap) => gap.operatorId),
);
const bestiaryRefViolations = [];
for (const archetype of bestiary.archetypes) {
  if (archetype.kind === "scaleState") {
    for (const parent of archetype.parents) {
      if (!bestiaryStateIds.has(parent)) {
        bestiaryRefViolations.push(`state ${archetype.nodeId} parent ${parent}`);
      }
    }
  }
  if (archetype.kind === "scaleFamily") {
    for (const memberId of archetype.memberStateIds) {
      if (!bestiaryStateIds.has(memberId)) {
        bestiaryRefViolations.push(`family ${archetype.forte} member ${memberId}`);
      }
    }
  }
  if (archetype.kind === "modalCycle") {
    for (const memberId of archetype.memberStateIds) {
      if (!bestiaryStateIds.has(memberId)) {
        bestiaryRefViolations.push(`cycle ${archetype.cycleId} member ${memberId}`);
      }
    }
  }
  if (archetype.kind === "mutationOperator") {
    if (
      !bestiaryOperatorIds.has(archetype.inverseOperatorId) &&
      archetype.inverseOperatorId !== "M^6"
    ) {
      bestiaryRefViolations.push(`operator ${archetype.operatorId} inverse`);
    }
    if (!bestiaryOperatorIds.has(archetype.conjugateOperatorId)) {
      bestiaryRefViolations.push(`operator ${archetype.operatorId} conjugate`);
    }
    if (!bestiaryGapIds.has(archetype.projectionGapId)) {
      bestiaryRefViolations.push(`operator ${archetype.operatorId} gap`);
    }
  }
}
for (const edge of bestiary.relationships) {
  if (!bestiaryStateIds.has(edge.source) || !bestiaryStateIds.has(edge.target)) {
    bestiaryRefViolations.push(`relationship ${edge.id}`);
  }
}
bestiaryRecord(
  "bestiary:refs-closed",
  bestiaryRefViolations.length === 0,
  { violations: bestiaryRefViolations },
);

const canonicalNetwork = JSON.parse(
  (await read("canonical/universal-network-data.json")).toString(),
);
const bestiaryByKind = {};
for (const archetype of bestiary.archetypes) {
  bestiaryByKind[archetype.kind] = (bestiaryByKind[archetype.kind] ?? 0) + 1;
}
const expectedBestiaryCounts = {
  scaleState: 462,
  scaleFamily: 38,
  governorOffice: 7,
  canonicalProfile: 7,
  mutationOperator: 15,
  modalCycle: 66,
};
const bestiaryCountViolations = [];
for (const [kind, expected] of Object.entries(expectedBestiaryCounts)) {
  if (bestiaryByKind[kind] !== expected) {
    bestiaryCountViolations.push(`${kind}: expected ${expected}, got ${bestiaryByKind[kind]}`);
  }
}
const bestiaryEdgeCount =
  canonicalNetwork.structuralEdges.length + canonicalNetwork.fieldEdges.length;
if (bestiary.relationships.length !== bestiaryEdgeCount) {
  bestiaryCountViolations.push(
    `relationships: expected ${bestiaryEdgeCount}, got ${bestiary.relationships.length}`,
  );
}
if (bestiary.commutationPairs.length !== 91) {
  bestiaryCountViolations.push(`commutationPairs: expected 91, got ${bestiary.commutationPairs.length}`);
}
if (bestiary.projectionGaps.length !== 15) {
  bestiaryCountViolations.push(`projectionGaps: expected 15, got ${bestiary.projectionGaps.length}`);
}
if (bestiary.summary.archetypeCount !== bestiary.archetypes.length) {
  bestiaryCountViolations.push("summary.archetypeCount mismatch");
}
bestiaryRecord(
  "bestiary:counts",
  bestiaryCountViolations.length === 0,
  { violations: bestiaryCountViolations },
);

const narrativePinViolations = [];
let narrativePinDetail = "missing bestiary/data/pinned-narratives.json";
try {
  const pinned = JSON.parse(
    (await read("bestiary/data/pinned-narratives.json")).toString(),
  );
  const pinById = new Map(
    pinned.narratives.map((entry) => [entry.id, entry.text]),
  );
  if (!pinned.model || typeof pinned.model !== "string") {
    narrativePinViolations.push("pin file: model missing or not a string");
  }
  if (pinned.narratives.length !== 22) {
    narrativePinViolations.push(
      `pin file: expected 22 narratives, got ${pinned.narratives.length}`,
    );
  }
  const dataIds = new Set(bestiary.archetypes.map((archetype) => archetype.id));
  for (const entry of pinned.narratives) {
    if (!dataIds.has(entry.id)) {
      narrativePinViolations.push(`pin id not in data: ${entry.id}`);
    }
    if (typeof entry.text !== "string" || entry.text.length === 0) {
      narrativePinViolations.push(`pin entry empty text: ${entry.id}`);
    } else if (entry.text.length > 2048) {
      narrativePinViolations.push(
        `pin entry over 2048 chars: ${entry.id} (${entry.text.length})`,
      );
    }
  }
  const aiGenerated = bestiary.archetypes.filter(
    (archetype) => archetype.summary.narrativeKind === "ai_generated",
  );
  if (aiGenerated.length !== 22) {
    narrativePinViolations.push(
      `data: expected 22 ai_generated summaries, got ${aiGenerated.length}`,
    );
  }
  for (const archetype of aiGenerated) {
    const { summary } = archetype;
    if (summary.model !== pinned.model) {
      narrativePinViolations.push(
        `model mismatch: ${archetype.id} (${summary.model} != ${pinned.model})`,
      );
    }
    if (summary.text !== pinById.get(archetype.id)) {
      narrativePinViolations.push(
        `text not verbatim from pin: ${archetype.id}`,
      );
    }
    if (
      typeof summary.sha256 !== "string" ||
      summary.sha256 !==
        crypto.createHash("sha256").update(summary.text, "utf8").digest("hex")
    ) {
      narrativePinViolations.push(`sha256 not bound to text: ${archetype.id}`);
    }
  }
  for (const archetype of bestiary.archetypes) {
    if (archetype.summary.narrativeKind === "deterministic_template") {
      if (archetype.summary.model !== null || archetype.summary.sha256 !== null) {
        narrativePinViolations.push(
          `template narrative has model/sha256 set: ${archetype.id}`,
        );
      }
    } else if (!pinById.has(archetype.id)) {
      narrativePinViolations.push(
        `ai_generated id absent from pin file: ${archetype.id}`,
      );
    }
  }
  narrativePinDetail =
    narrativePinViolations.length === 0
      ? `${aiGenerated.length} pinned narratives, sha256 bound, template narratives clean`
      : narrativePinViolations.join("; ");
} catch (error) {
  narrativePinDetail = String(error.message ?? error);
}
bestiaryRecord(
  "bestiary:narrative-pins",
  narrativePinViolations.length === 0,
  { violations: narrativePinViolations, detail: narrativePinDetail },
);

await fs.writeFile(
  path.join(packageRoot, "qa/bestiary-validation.json"),
  `${JSON.stringify(
    {
      verdict: bestiaryChecks.some((item) => item.status === "FAIL")
        ? "FAIL"
        : "PASS",
      releaseId: release.releaseId,
      checksPassed: bestiaryChecks.filter((item) => item.status === "PASS").length,
      checksFailed: bestiaryChecks.filter((item) => item.status === "FAIL").length,
      checks: bestiaryChecks,
    },
    null,
    2,
  )}\n`,
);

const siteDistIndex = path.join(packageRoot, "bestiary/dist/index.html");
let siteBuiltDiagnostic = "missing bestiary/dist/index.html";
let siteBuilt = false;
try {
  const distStat = await fs.stat(siteDistIndex);
  const sourceStats = [];
  for (const sourcePath of await walkFiles(
    path.join(packageRoot, "bestiary/site/src"),
    { excluded: new Set() },
  )) {
    sourceStats.push((await fs.stat(sourcePath)).mtimeMs);
  }
  const staticDir = path.join(packageRoot, "bestiary/site/static");
  try {
    for (const staticPath of await walkFiles(staticDir, { excluded: new Set() })) {
      sourceStats.push((await fs.stat(staticPath)).mtimeMs);
    }
  } catch {
    // static/ is optional
  }
  const newestSource = Math.max(0, ...sourceStats);
  siteBuilt = distStat.isFile() && distStat.mtimeMs >= newestSource;
  siteBuiltDiagnostic = siteBuilt
    ? `index.html ${distStat.mtimeMs} >= newest source ${newestSource}`
    : `stale: index.html ${distStat.mtimeMs} < newest source ${newestSource}`;
} catch (error) {
  siteBuiltDiagnostic = String(error.message ?? error);
}
record("bestiary:site-built", siteBuilt, siteBuiltDiagnostic);

const offlineViolations = [];
let siteDistFiles = [];
try {
  siteDistFiles = await walkFiles(path.join(packageRoot, "bestiary/dist"), {
    excluded: new Set(),
  });
} catch {
  siteDistFiles = [];
}
for (const absolutePath of siteDistFiles) {
  const relativeDistPath = path.relative(packageRoot, absolutePath);
  const content = (await read(relativeDistPath)).toString();
  const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, "");
  const patterns = [
    /src\s*=\s*["']https?:\/\//g,
    /href\s*=\s*["']https?:\/\//g,
    /url\(\s*["']?https?:\/\//g,
    /@import\s+["']https?:\/\//g,
  ];
  for (const pattern of patterns) {
    const matches = withoutComments.match(pattern);
    if (matches) {
      for (const match of matches) {
        offlineViolations.push(
          `${path.relative(packageRoot, absolutePath)}: ${match}`,
        );
      }
    }
  }
}
record(
  "bestiary:offline-closure",
  offlineViolations.length === 0,
  { violations: offlineViolations, files: siteDistFiles.length },
);

let detailRouteCount = 0;
let detailRouteDiagnostic = "missing bestiary/dist/archetypes";
try {
  const archetypesDir = path.join(packageRoot, "bestiary/dist/archetypes");
  const entries = await fs.readdir(archetypesDir, { withFileTypes: true });
  detailRouteCount = entries.filter((entry) => entry.isDirectory()).length;
  detailRouteDiagnostic = `${detailRouteCount} detail routes (expected 598)`;
} catch (error) {
  detailRouteDiagnostic = String(error.message ?? error);
}
record("bestiary:detail-routes", detailRouteCount === 598, detailRouteDiagnostic);

let compareRouteDiagnostic = "missing bestiary/dist/compare/index.html";
let compareRoute = false;
try {
  const compareHtml = (
    await read("bestiary/dist/compare/index.html")
  ).toString();
  const hasSelects =
    compareHtml.includes('id="compare-a"') && compareHtml.includes('id="compare-b"');
  const hasSections =
    compareHtml.includes('id="compare-differential"') &&
    compareHtml.includes('id="compare-overlap"') &&
    compareHtml.includes('id="compare-path"');
  compareRoute = hasSelects && hasSections;
  compareRouteDiagnostic = `compare page: selects=${hasSelects}, sections=${hasSections}`;
} catch (error) {
  compareRouteDiagnostic = String(error.message ?? error);
}
record("bestiary:compare-route", compareRoute, compareRouteDiagnostic);

let aliasRouteDiagnostic = "missing bestiary/dist/operators or profiles";
let aliasRoutes = false;
try {
  const operators = await fs.readdir(
    path.join(packageRoot, "bestiary/dist/operators"),
    { withFileTypes: true },
  );
  const profiles = await fs.readdir(
    path.join(packageRoot, "bestiary/dist/profiles"),
    { withFileTypes: true },
  );
  const operatorDirs = operators.filter((entry) => entry.isDirectory());
  const profileDirs = profiles.filter((entry) => entry.isDirectory());
  let allRedirect = true;
  let checked = 0;
  for (const [baseDir, entries] of [
    ["bestiary/dist/operators", operatorDirs],
    ["bestiary/dist/profiles", profileDirs],
  ]) {
    for (const entry of entries) {
      const html = (
        await read(`${baseDir}/${entry.name}/index.html`)
      ).toString();
      if (
        !html.includes('http-equiv="refresh"') ||
        !html.includes("/archetypes/")
      ) {
        allRedirect = false;
      }
      checked += 1;
    }
  }
  aliasRoutes = operatorDirs.length === 15 && profileDirs.length === 7 && allRedirect;
  aliasRouteDiagnostic = `operator aliases=${operatorDirs.length} (expected 15), profile aliases=${profileDirs.length} (expected 7), redirects=${checked}${allRedirect ? "" : " (broken)"}`;
} catch (error) {
  aliasRouteDiagnostic = String(error.message ?? error);
}
record("bestiary:alias-routes", aliasRoutes, aliasRouteDiagnostic);

// ---------------------------------------------------------------------------
// 11. Required files
// ---------------------------------------------------------------------------

for (const requiredPath of [
  "framework/AGENTS.md",
  "framework/TOPOLOGICAL_ANCHORING.md",
  "framework/CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md",
  "framework/NATURAL_ORGANIZATION_THESIS.md",
  "schemas/governors.yaml",
  "docs/TOPOLOGY_IDENTITY_AND_INVARIANTS.md",
  "docs/FOUR_LAYER_FORMALIZATION.md",
  "docs/START_HERE.md",
  "docs/GRAPH_AND_COMPILER_API.md",
  "neo4j/schema.cypher",
  "neo4j/import.cypher",
  "neo4j/validation.cypher",
  "neo4j/provenance.cypher",
  "neo4j/provenance-validation.cypher",
  "seven-governors-mutation-algebra-audit/audit/operator-registry.csv",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/schemas/compiled-profile.schema.json",
  "seven-governors-governor-runtime-v0.1.0/package.json",
  "seven-governors-governor-runtime-v0.1.0/PACKAGE_MANIFEST.json",
  "seven-governors-governor-runtime-v0.1.0/canonical/policy-release.json",
  "seven-governors-governor-runtime-v0.1.0/canonical/feature-typed-aspect-crosswalk.json",
  "seven-governors-governor-runtime-v0.1.0/canonical/canonical-bridge-examples.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/typed-aspect.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/quantity.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/bridge-rule.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/classification-request.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/classification-result.schema.json",
  "seven-governors-governor-runtime-v0.1.0/schemas/policy-release.schema.json",
  "seven-governors-governor-runtime-v0.1.0/fixtures/negative-cases.json",
  "seven-governors-governor-runtime-v0.1.0/qa/validation-report.json",
  "seven-governors-governor-runtime-v0.1.0/qa/determinism-report.json",
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/START_HERE.md",
  "bestiary/ARCH-SPEC.md",
  "bestiary/data/bestiary-data.json",
  "bestiary/data/bestiary-data.schema.json",
  "bestiary/data/pinned-narratives.json",
  "bestiary/site/astro.config.mjs",
  "bestiary/site/package.json",
  "bestiary/site/src/lib/bestiary.ts",
  "bestiary/site/src/pages/index.astro",
  "bestiary/site/src/pages/archetypes/[id].astro",
  "bestiary/site/src/layouts/ArchetypeLayout.astro",
  "bestiary/site/src/components/StatComparisonMatrix.astro",
  "bestiary/site/src/components/ArchetypeNarrative.astro",
  "bestiary/site/src/components/Scatterplot.astro",
  "bestiary/site/src/components/TopologyNodeGraph.astro",
  "bestiary/site/src/components/PitchSetDialMini.astro",
  "bestiary/site/src/lib/dialGeometry.ts",
  "bestiary/site/src/lib/dialClient.ts",
  "bestiary/site/src/lib/networkLayout.ts",
  "bestiary/site/src/lib/nodeShapes.ts",
  "bestiary/site/src/pages/compare.astro",
  "scripts/build-bestiary.mjs",
]) {
  try {
    const stat = await fs.stat(path.join(packageRoot, requiredPath));
    record(`required file: ${requiredPath}`, stat.isFile(), stat.size);
  } catch {
    record(`required file: ${requiredPath}`, false, "missing");
  }
}

const failed = checks.filter((item) => item.status === "FAIL");
const report = {
  verdict: failed.length ? "FAIL" : "PASS",
  releaseId: release.releaseId,
  checksPassed: checks.length - failed.length,
  checksFailed: failed.length,
  checks,
};
await fs.writeFile(
  path.join(packageRoot, "qa/integrated-release-validation.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
