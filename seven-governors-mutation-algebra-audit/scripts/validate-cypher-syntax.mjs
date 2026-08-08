import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateSyntax } from "@neo4j-cypher/language-support";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const files = [
  "algebra-schema.cypher",
  "algebra-import.cypher",
  "algebra-validation.cypher",
];
const schema = {
  labels: [
    "ScaleState",
    "ScaleFamily",
    "GovernorOffice",
    "MutationOperator",
  ],
  relationshipTypes: [
    "GOVERNS",
    "CONSTRUCTS",
    "SEAT_CONTACT",
    "MODAL_SUCCESSOR",
    "AUDITED_HAMMING2",
    "PHASE_SHIFT",
    "LOCAL_MUTATES_TO",
    "MODAL_MUTATES_TO",
  ],
  propertyKeys: [],
};

const results = [];
for (const file of files) {
  const source = await fs.readFile(path.join(packageRoot, "neo4j", file), "utf8");
  const diagnostics = validateSyntax(source, schema);
  results.push({
    file,
    bytes: Buffer.byteLength(source),
    diagnostics: diagnostics.map((diagnostic) => ({
      message: diagnostic.message,
      severity: diagnostic.severity,
      offsets: diagnostic.offsets,
    })),
    pass: diagnostics.length === 0,
  });
}

const report = {
  verdict: results.every((entry) => entry.pass) ? "PASS" : "FAIL",
  validator: "@neo4j-cypher/language-support",
  files: results,
};
await fs.writeFile(
  path.join(packageRoot, "qa", "neo4j-cypher-syntax-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (report.verdict !== "PASS") process.exitCode = 1;
