import fs from "node:fs";
import path from "node:path";
import { PACKAGE_ROOT, sha256, writeJson } from "./lib.mjs";

const exclusions = new Set([
  "node_modules",
  "PACKAGE_MANIFEST.json",
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0.zip",
]);

function walk(directory, relative = "") {
  const files = [];
  for (const name of fs.readdirSync(directory).sort()) {
    if (exclusions.has(name)) continue;
    const absolute = path.join(directory, name);
    const child = path.posix.join(relative, name);
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) files.push(...walk(absolute, child));
    else if (stat.isFile()) {
      const body = fs.readFileSync(absolute);
      files.push({ path: child, bytes: body.byteLength, sha256: sha256(body) });
    }
  }
  return files;
}

const files = walk(PACKAGE_ROOT);
const categoryCounts = {};
for (const file of files) {
  const category = file.path.includes("/") ? file.path.split("/")[0] : "root";
  categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
}

writeJson(
  path.join(PACKAGE_ROOT, "PACKAGE_MANIFEST.json"),
  {
    schemaVersion: "1.0.0",
    packageName: "seven-governors-state-machine-spec-and-authoring-toolkit",
    packageVersion: "0.2.0",
    releaseId: "state-machine-spec:0.2.0",
    generatedAt: "2026-07-30",
    baseline: {
      canonicalProfileRegistry: "canonical-profile-registry:0.1.1",
      topologySchema: "4.0.0-universal-heptatonic",
    },
    manifestPolicy:
      "All package files except node_modules, the archive, and this self-referential manifest.",
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    categoryCounts,
    aggregateFingerprint: sha256(
      JSON.stringify(files.map((file) => [file.path, file.sha256])),
    ),
    files,
  },
  { force: true },
);
console.log(`Manifested ${files.length} files.`);
