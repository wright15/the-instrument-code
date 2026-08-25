import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recordFile, walkFiles } from "./manifest-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const excluded = new Set([
  "CHECKSUMS.sha256",
  "MANIFEST.json",
  ".env",
  "qa/integrated-release-validation.json",
  "qa/bestiary-validation.json",
  "qa/neo4j-cypher-syntax-report.json",
  "qa/crt-307-local-model-observation.json",
  "qa/server-startup.log",
  "graph/qa/server-startup.log",
  ".git",
  ".pytest_cache",
  "__pycache__",
  "bestiary/dist",
  ".astro",
  ".vite",
  ".venv",
  ".playwright-cli",
  "orrery/dist",
  "orrery/.vite",
]);

const files = await walkFiles(packageRoot, { excluded });
const records = [];
for (const absolutePath of files) {
  records.push(await recordFile(absolutePath, packageRoot));
}

const packageJson = JSON.parse(
  await fs.readFile(path.join(packageRoot, "package.json"), "utf8"),
);
const manifest = {
  package: packageJson.name,
  version: packageJson.version,
  generatedAt: new Date().toISOString(),
  fileCount: records.length,
  totalBytes: records.reduce((total, record) => total + record.bytes, 0),
  files: records,
};

await fs.writeFile(
  path.join(packageRoot, "MANIFEST.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await fs.writeFile(
  path.join(packageRoot, "CHECKSUMS.sha256"),
  `${records.map((record) => `${record.sha256}  ${record.path}`).join("\n")}\n`,
);
console.log(
  JSON.stringify(
    {
      fileCount: manifest.fileCount,
      totalBytes: manifest.totalBytes,
    },
    null,
    2,
  ),
);
