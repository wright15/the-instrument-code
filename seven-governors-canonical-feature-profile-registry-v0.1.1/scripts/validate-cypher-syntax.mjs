import fs from "node:fs";
import path from "node:path";
import { validateSyntax } from "@neo4j-cypher/language-support";
import { PACKAGE_ROOT, writeJson } from "./lib.mjs";

const directory = path.join(PACKAGE_ROOT, "neo4j");
const files = fs
  .readdirSync(directory)
  .filter((name) => name.endsWith(".cypher"))
  .sort();
const results = [];
let failureCount = 0;

function statements(text) {
  const withoutLineComments = text
    .split(/\r?\n/)
    .map((line) => (line.trimStart().startsWith("//") ? "" : line))
    .join("\n");
  const values = [];
  let current = "";
  let quote = null;
  let escaped = false;
  for (const character of withoutLineComments) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      current += character;
      escaped = true;
    } else if (quote) {
      current += character;
      if (character === quote) quote = null;
    } else if (character === "'" || character === '"') {
      current += character;
      quote = character;
    } else if (character === ";") {
      if (current.trim()) values.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) values.push(current.trim());
  return values;
}

for (const file of files) {
  const text = fs.readFileSync(path.join(directory, file), "utf8");
  const diagnostics = [];
  for (const [index, statement] of statements(text).entries()) {
    const statementDiagnostics = validateSyntax(statement, {});
    diagnostics.push(
      ...statementDiagnostics.map((diagnostic) => ({
        statement: index + 1,
        message: diagnostic.message,
        severity: diagnostic.severity,
        range: diagnostic.range,
      })),
    );
  }
  const errors = diagnostics.filter(
    (diagnostic) => diagnostic.severity === 1,
  );
  failureCount += errors.length;
  results.push({
    file,
    statementCount: statements(text).length,
    diagnosticCount: diagnostics.length,
    errorCount: errors.length,
    diagnostics,
  });
}

writeJson("qa/cypher-syntax-report.json", {
  schemaVersion: "1.0.0",
  generatedAt: "2026-07-30",
  validator: "@neo4j-cypher/language-support",
  status: failureCount === 0 ? "passed" : "failed",
  fileCount: files.length,
  errorCount: failureCount,
  results,
});

if (failureCount > 0) {
  console.error(
    JSON.stringify(
      results.filter((result) => result.errorCount > 0),
      null,
      2,
    ),
  );
  process.exitCode = 1;
} else {
  console.log(`Cypher syntax validation passed for ${files.length} files.`);
}
