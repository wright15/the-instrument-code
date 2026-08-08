import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const excludedNames = new Set(["MANIFEST.json", "CHECKSUMS.sha256"]);

function walk(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      if (entry.name === "node_modules" || entry.name === ".git") return [];
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return walk(absolute);
      if (excludedNames.has(entry.name)) return [];
      return [absolute];
    });
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

const payloadFiles = walk(packageRoot);
const entries = payloadFiles.map((absolute) => ({
  path: path.relative(packageRoot, absolute).split(path.sep).join("/"),
  bytes: fs.statSync(absolute).size,
  sha256: sha256(absolute),
}));
const qa = JSON.parse(
  fs.readFileSync(
    path.join(packageRoot, "qa", "mutation-algebra-validation.json"),
    "utf8",
  ),
);

const manifest = {
  package: "seven-governors-mutation-algebra-audit",
  version: "1.0.0",
  auditProtocol: qa.auditProtocol,
  source: qa.source,
  verdict: qa.allPass ? "PASS" : "FAIL",
  auditCounts: qa.counts,
  fileCount: entries.length,
  totalBytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
  files: entries,
};

const manifestPath = path.join(packageRoot, "MANIFEST.json");
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const checksumEntries = [
  ...entries,
  {
    path: "MANIFEST.json",
    sha256: sha256(manifestPath),
  },
].sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(
  path.join(packageRoot, "CHECKSUMS.sha256"),
  `${checksumEntries
    .map((entry) => `${entry.sha256}  ${entry.path}`)
    .join("\n")}\n`,
);

console.log(
  JSON.stringify(
    {
      verdict: manifest.verdict,
      fileCount: manifest.fileCount,
      totalBytes: manifest.totalBytes,
    },
    null,
    2,
  ),
);
