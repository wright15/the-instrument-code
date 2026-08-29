import fs from "node:fs";
import path from "node:path";


const staticPaths = Object.freeze([
  "scripts/bootstrap-neo4j.mjs",
  "scripts/verify-neo4j-roundtrip.mjs",
  "scripts/validate-full-database.mjs",
  "scripts/validate-neo4j-deployment-roundtrip.mjs",
  "scripts/generate-court-graph.py",
  "scripts/generate-availability-housing.py",
  "package.json",
  "package-lock.json",
  "court-mathematics/pyproject.toml",
  "schemas/court-runtime-policy.json",
  "schemas/court-admission-contract.json",
  "schemas/gov-210/skill-eligibility-policy.json",
  "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-operator-registry.json",
  "seven-governors-court-filter-algebra-v0.1.0/canonical/filter-algebra-release.json",
  "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json",
  "seven-governors-harmonic-invariants-v0.1.0/canonical/harmonic-invariant-registry.json",
  "skills/court/registry.json",
  "skills/governor/registry.json",
  "schemas/neo4j-normalized-snapshot.schema.json",
  "schemas/neo4j-full-database-validation.schema.json",
  "schemas/neo4j-deployment-roundtrip-validation.schema.json",
  "provenance/neo4j-full-database-baseline.json",
  "provenance/neo4j-ingestion-template-baseline.json",
  "neo4j/schema.cypher",
  "neo4j/import.cypher",
  "neo4j/validation.cypher",
  "neo4j/provenance.cypher",
  "neo4j/provenance-validation.cypher",
  "neo4j/governor-runtime/schema.cypher",
  "neo4j/court-mathematics/schema.cypher",
  "neo4j/court-mathematics/validation.cypher",
  "neo4j/gov-210/schema.cypher",
  "neo4j/gov-210/validation.cypher",
  "seven-governors-mutation-algebra-audit/MANIFEST.json",
  "seven-governors-mutation-algebra-audit/neo4j/algebra-schema.cypher",
  "seven-governors-mutation-algebra-audit/neo4j/algebra-import.cypher",
  "seven-governors-mutation-algebra-audit/neo4j/algebra-validation.cypher",
  "seven-governors-mutation-algebra-audit/audit/operator-registry.csv",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/PACKAGE_MANIFEST.json",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/01_semantic_schema.cypher",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/02_semantic_import.cypher",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/03_semantic_validation.cypher",
  "tests/neo4j/full-database-live.test.mjs",
]);

function filesUnder(packageRoot, relativeDirectory, extension) {
  const root = path.join(packageRoot, relativeDirectory);
  const pending = [root];
  const result = [];
  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(absolutePath);
      else if (entry.isFile() && entry.name.endsWith(extension)) {
        result.push(path.relative(packageRoot, absolutePath).split(path.sep).join("/"));
      }
    }
  }
  return result;
}

export function fullDatabaseEvidencePaths(packageRoot, sourceBindings) {
  const paths = new Set([
    ...staticPaths,
    ...sourceBindings.map((binding) => binding.path),
    ...filesUnder(packageRoot, "graph/runtime", ".mjs"),
    ...filesUnder(packageRoot, "neo4j/csv", ".csv"),
    ...filesUnder(
      packageRoot,
      "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/csv",
      ".csv",
    ),
    ...filesUnder(packageRoot, "src/governor", ".py"),
    ...filesUnder(packageRoot, "court-mathematics/src", ".py"),
  ]);
  return [...paths].sort();
}
