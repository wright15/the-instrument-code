#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
}

const sha = (value) => crypto.createHash("sha256").update(canonical(value)).digest("hex");
const fileSha = async (relativePath) => crypto.createHash("sha256").update(await fs.readFile(path.join(root, relativePath))).digest("hex");
const readJson = async (relativePath) => JSON.parse(await fs.readFile(path.join(root, relativePath), "utf8"));

const substratePath = "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json";
const invariantPath = "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json";
const filterPath = "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-algebra-release.json";
const runtimePath = "schemas/court-runtime-policy.json";
const substrate = await readJson(substratePath);
const invariants = await readJson(invariantPath);
const filters = await readJson(filterPath);
const runtime = await readJson(runtimePath);
const gov208 = await readJson("qa/gov-208-vault-context-validation.json");
const crt308 = await readJson("qa/crt-308-court-vault-context-validation.json");
const benchmark = await readJson("qa/court-admission-benchmark.json");

const proposedSetClasses = substrate.pentatonicSetClasses
  .filter((item) => item.admissionStatus === "proposed")
  .map((item) => item.setClassId.split(":", 2)[1])
  .sort();

const artifactSpecifications = [
  ["crt-301-contract", "schemas/court-admission-contract.json", null],
  ["crt-302-substrate", substratePath, substrate.substrateFingerprint],
  ["crt-303-invariants", invariantPath, invariants.invariantFingerprint],
  ["crt-304-filters", filterPath, filters.filterAlgebraFingerprint],
  ["crt-305-runtime", runtimePath, runtime.policyFingerprint],
  ["crt-306-projection", "src/governor/court_graph_projection.py", null],
  ["crt-306-query-catalog", "src/governor/court_graph_queries.py", null],
  ["crt-307-skill-registry", "skills/court/registry.json", null],
  ["gov-208-vault-provider", "src/governor/vault_context.py", null],
  ["crt-308-court-vault-provider", "src/governor/court_vault_context.py", null],
  ["crt-308-context-schema", "schemas/court-context/court-context-bundle.schema.json", null],
];
const artifactBindings = [];
for (const [artifactId, artifactPath, intrinsicFingerprint] of artifactSpecifications) {
  artifactBindings.push({artifactId, path: artifactPath, sha256: await fileSha(artifactPath), intrinsicFingerprint});
}

const core = {
  schemaVersion: "crt-309.court-admission-release.v1",
  admissionId: "court-admission:crt-309:1.0.0",
  integratedReleaseId: "seven-governors-integrated-1.3.0",
  status: "admitted",
  admissionGate: "CRT-309",
  historicalCandidateStatusesPreserved: true,
  admittedScope: {
    canonicalSetClass: "5-35",
    canonicalRootedPositions: ["C0", "C1", "C2", "C3", "C4"],
    bridgeSetClasses: ["5-23", "5-27"],
    minimalAdditionalBridgeSetClasses: [],
    careyEvaluationSetClasses: ["5-35"],
    linearDiagonalFilters: ["C0", "C1", "C2", "C3", "C4", "5-23", "5-27"],
    transitionPolicy: "adjacent-only-with-evidence-backed-topological-translocation",
    courtRuntimePolicyId: runtime.policyId,
    graphProjectionSchema: "crt-306.court-graph-projection.v2",
    agentSkillBundle: "seven-governors-crt-307",
    contextProviders: ["gov-208.read-only-obsidian", "crt-308.read-only-court-context"],
  },
  proposedScope: {
    pentatonicSetClasses: proposedSetClasses,
    pentatonicSetClassCount: proposedSetClasses.length,
    compressionCoordinates: ["harmonic.C_H"],
    filterFamilies: ["fourier", "graph-spectral", "semantic-scoped"],
    routeMeasures: ["route-cost", "spectral"],
    fivefoldClaims: ["macro_bracket", "controller", "runtime_cycle"],
    futurePackages: ["natural-phenomena", "thermodynamic-mapping"],
  },
  projectionRuling: {
    admittedSurface: "CRT-306 schema v2 replay-derived terminal state, snapshot, ordered events, translocations, and six bounded read-only queries",
    explicitlyNotClaimed: ["T5CycleEntry", "ComplementMap", "CourtInvariant", "canonical Forte-to-Court mapping"],
    neo4jAuthority: false,
  },
  artifactBindings,
  evidenceBindings: [
    {evidenceId: "gov-208-validation", path: "qa/gov-208-vault-context-validation.json", reportFingerprint: gov208.reportFingerprint},
    {evidenceId: "crt-308-validation", path: "qa/crt-308-court-vault-context-validation.json", reportFingerprint: crt308.reportFingerprint},
    {evidenceId: "crt-309-benchmark", path: "qa/court-admission-benchmark.json", reportFingerprint: benchmark.reportFingerprint},
  ],
};
const record = {...core, admissionFingerprint: sha(core)};
await fs.writeFile(path.join(root, "provenance/court-admission-release.json"), `${JSON.stringify(record, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({admissionFingerprint: record.admissionFingerprint, proposedSetClassCount: proposedSetClasses.length}, null, 2)}\n`);
