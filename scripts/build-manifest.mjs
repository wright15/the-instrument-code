import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { recordFile, walkFiles } from "./manifest-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const arguments_ = process.argv.slice(2);
if (arguments_.some((argument) => argument !== "--check")) {
  throw new Error(`UNKNOWN_MANIFEST_ARGUMENT:${arguments_.join(",")}`);
}
const check = arguments_.includes("--check");
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
const release = JSON.parse(
  await fs.readFile(path.join(packageRoot, "provenance", "release.json"), "utf8"),
);
const manifest = {
  package: packageJson.name,
  version: packageJson.version,
  // Bind the envelope to the release rather than the wall clock so checks are reproducible.
  generatedAt: `${release.releaseDate}T00:00:00.000Z`,
  fileCount: records.length,
  totalBytes: records.reduce((total, record) => total + record.bytes, 0),
  files: records,
};

const manifestPayload = `${JSON.stringify(manifest, null, 2)}\n`;
const checksumsPayload = `${records.map((record) => `${record.sha256}  ${record.path}`).join("\n")}\n`;
const manifestPath = path.join(packageRoot, "MANIFEST.json");
const checksumsPath = path.join(packageRoot, "CHECKSUMS.sha256");

if (check) {
  const [committedManifest, committedChecksums] = await Promise.all([
    fs.readFile(manifestPath, "utf8").catch(() => null),
    fs.readFile(checksumsPath, "utf8").catch(() => null),
  ]);
  if (committedManifest !== manifestPayload || committedChecksums !== checksumsPayload) {
    throw new Error("STALE_PACKAGE_MANIFEST");
  }
} else {
  await Promise.all([
    fs.writeFile(manifestPath, manifestPayload),
    fs.writeFile(checksumsPath, checksumsPayload),
  ]);
}
console.log(
  JSON.stringify(
    {
      check,
      fileCount: manifest.fileCount,
      totalBytes: manifest.totalBytes,
    },
    null,
    2,
  ),
);
