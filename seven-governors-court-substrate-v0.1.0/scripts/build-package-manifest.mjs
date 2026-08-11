import fs from "node:fs";
import path from "node:path";
import {
  PACKAGE_ROOT,
  canonicalCompact,
  canonicalJson,
  compareCodePoint,
  sha256,
  writeAtomic,
} from "./lib.mjs";

const mode = process.argv[2];
if (!new Set(["--check", "--emit"]).has(mode) || process.argv.length !== 3) {
  throw new Error("Specify exactly one of --check or --emit");
}
const excluded = new Set(["node_modules", "PACKAGE_MANIFEST.json"]);

function walk(directory, relative = "") {
  const records = [];
  for (const name of fs.readdirSync(directory).sort(compareCodePoint)) {
    if (excluded.has(name)) continue;
    const absolute = path.join(directory, name);
    const childRelative = path.posix.join(relative, name);
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) records.push(...walk(absolute, childRelative));
    else if (stat.isFile()) {
      const bytes = fs.readFileSync(absolute);
      records.push({ path: childRelative, bytes: bytes.length, sha256: sha256(bytes) });
    }
  }
  return records;
}

const files = walk(PACKAGE_ROOT);
const manifest = {
  schemaVersion: "1.0.0",
  packageName: "seven-governors-court-substrate",
  packageVersion: "0.1.0",
  releaseId: "court-substrate:0.1.0",
  releaseDate: "2026-08-09",
  manifestPolicy: "All package payload files except node_modules and this self-referential manifest.",
  fileCount: files.length,
  totalBytes: files.reduce((sum, item) => sum + item.bytes, 0),
  aggregateFingerprint: sha256(
    canonicalCompact(files.map((item) => [item.path, item.sha256])),
  ),
  files,
};
const text = canonicalJson(manifest);
const target = path.join(PACKAGE_ROOT, "PACKAGE_MANIFEST.json");
if (mode === "--emit") {
  writeAtomic(target, text);
  console.log(JSON.stringify({ status: "emitted", fileCount: files.length }));
} else if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === text) {
  console.log(JSON.stringify({ status: "passed", fileCount: files.length }));
} else {
  console.error("STALE_PACKAGE_MANIFEST");
  process.exitCode = 1;
}
