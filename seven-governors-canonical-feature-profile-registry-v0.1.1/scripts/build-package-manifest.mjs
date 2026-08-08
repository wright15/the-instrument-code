import fs from "node:fs";
import path from "node:path";
import { PACKAGE_ROOT, sha256, writeJson } from "./lib.mjs";

const exclusions = new Set([
  "node_modules",
  "PACKAGE_MANIFEST.json",
  "seven-governors-canonical-feature-profile-registry-v0.1.1.zip",
]);

function walk(directory, relative = "") {
  const entries = [];
  for (const name of fs.readdirSync(directory).sort()) {
    if (exclusions.has(name)) continue;
    const absolute = path.join(directory, name);
    const childRelative = path.posix.join(relative, name);
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) {
      entries.push(...walk(absolute, childRelative));
    } else if (stat.isFile()) {
      const body = fs.readFileSync(absolute);
      entries.push({
        path: childRelative,
        bytes: body.byteLength,
        sha256: sha256(body),
      });
    }
  }
  return entries;
}

const files = walk(PACKAGE_ROOT);
const categoryCounts = {};
for (const file of files) {
  const category = file.path.includes("/")
    ? file.path.split("/")[0]
    : "root";
  categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
}

writeJson("PACKAGE_MANIFEST.json", {
  schemaVersion: "1.0.0",
  packageName: "seven-governors-canonical-feature-profile-registry",
  packageVersion: "0.1.1",
  releaseId: "canonical-profile-registry:0.1.1",
  generatedAt: "2026-07-30",
  manifestPolicy:
    "All package files except node_modules, the archive, and this self-referential manifest.",
  fileCount: files.length,
  totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  categoryCounts,
  aggregateFingerprint: sha256(
    files.map(({ path: filePath, sha256: hash }) => [filePath, hash]),
  ),
  files,
});

console.log(`Manifested ${files.length} files.`);
