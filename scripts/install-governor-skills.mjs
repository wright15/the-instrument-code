#!/usr/bin/env node
// GOV-207 deterministic explicit-target skill installer.
//
// Renders the first-party Governor skill bundle into an operator-specified
// target for one explicit host adapter. Installation is preflighted,
// non-destructive, content-addressed, and byte-identical across runs. It
// never edits host configuration, never discovers home directories, and
// never overwrites foreign or user-modified files without explicit
// per-path authorization.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  canonicalCompact,
  compareCodePoint,
  sha256,
} from "../graph/runtime/canonical.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const BUNDLE_ROOT = path.join(ROOT, "skills", "governor");
const BUNDLE_ID = "seven-governors-gov-207";
const BUNDLE_VERSION = "1.0.0";
const MANIFEST_SCHEMA_VERSION = "gov-207.install-manifest.v1";

function fail(reason, detail) {
  console.error(`FAIL ${reason}: ${detail}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = {
    target: null,
    adapter: null,
    createTarget: false,
    updateOwned: false,
    overwriteExisting: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--target") {
      args.target = argv[++index];
    } else if (arg === "--adapter") {
      args.adapter = argv[++index];
    } else if (arg === "--create-target") {
      args.createTarget = true;
    } else if (arg === "--update-owned") {
      args.updateOwned = true;
    } else if (arg === "--overwrite-existing") {
      args.overwriteExisting.push(argv[++index]);
    } else {
      fail("unknown_argument", arg);
    }
  }
  if (!args.target) fail("target_required", "pass --target <explicit-path>");
  if (!args.adapter) fail("adapter_required", "pass --adapter hermes|generic-json");
  return args;
}

function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function skillSlug(name) {
  return name.replace(/^seven-governors-/, "");
}

function planFiles(registry, adapter) {
  const planned = [];
  for (const skill of registry.skills) {
    const workflowAbsolute = path.join(BUNDLE_ROOT, skill.workflowPath);
    const bytes = fs.readFileSync(workflowAbsolute);
    const slug = skillSlug(skill.name);
    const relative = adapter.rendering.targetPattern.replace("{skill-slug}", slug);
    planned.push({ path: relative, bytes });
  }
  for (const relative of ["registry.json", "capabilities.json"]) {
    planned.push({
      path: relative,
      bytes: fs.readFileSync(path.join(BUNDLE_ROOT, relative)),
    });
  }
  planned.sort((left, right) => compareCodePoint(left.path, right.path));
  const seen = new Set();
  for (const file of planned) {
    if (seen.has(file.path)) fail("duplicate_planned_path", file.path);
    seen.add(file.path);
  }
  return planned;
}

function buildManifest(adapter, planned) {
  const files = planned.map((file) => ({
    path: file.path,
    bytes: file.bytes.length,
    sha256: sha256(file.bytes),
  }));
  const aggregateFingerprint = sha256(
    canonicalCompact(files.map((file) => [file.path, file.bytes, file.sha256])),
  );
  const sourceFingerprint = sha256(
    canonicalCompact(files.map((file) => [file.path, file.sha256])),
  );
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    bundleId: BUNDLE_ID,
    bundleVersion: BUNDLE_VERSION,
    adapterId: adapter.adapterId,
    adapterVersion: adapter.adapterVersion,
    sourceFingerprint,
    registrySha256: sha256(fs.readFileSync(path.join(BUNDLE_ROOT, "registry.json"))),
    files,
    aggregateFingerprint,
  };
}

function assertSafeTarget(targetRoot, createTarget) {
  if (fs.existsSync(targetRoot)) {
    const stat = fs.lstatSync(targetRoot);
    if (stat.isSymbolicLink()) fail("target_symlink_rejected", targetRoot);
    if (!stat.isDirectory()) fail("target_not_directory", targetRoot);
  } else if (createTarget) {
    fs.mkdirSync(targetRoot, { recursive: true });
  } else {
    fail("target_missing", `${targetRoot} (pass --create-target to create)`);
  }
  const resolved = path.resolve(targetRoot);
  const rootStat = fs.lstatSync(resolved);
  if (rootStat.isSymbolicLink()) fail("target_symlink_rejected", resolved);
  return resolved;
}

function assertSafeRelative(relative) {
  const normalized = path.posix.normalize(relative.split(path.sep).join("/"));
  if (
    normalized.startsWith("../") ||
    normalized === ".." ||
    path.isAbsolute(relative) ||
    normalized.includes("/../")
  ) {
    fail("path_traversal_rejected", relative);
  }
  return normalized;
}

function loadOwnedManifest(targetRoot, manifestPath) {
  const absolute = path.join(targetRoot, manifestPath);
  if (!fs.existsSync(absolute)) return null;
  if (fs.lstatSync(absolute).isSymbolicLink()) {
    fail("manifest_symlink_rejected", absolute);
  }
  const manifest = readJson(absolute);
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    fail("foreign_manifest_rejected", absolute);
  }
  if (manifest.bundleId !== BUNDLE_ID) {
    fail("foreign_manifest_rejected", absolute);
  }
  return manifest;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = readJson(path.join(BUNDLE_ROOT, "registry.json"));
  const adapterPath = path.join(BUNDLE_ROOT, "adapters", `${args.adapter}.json`);
  if (!fs.existsSync(adapterPath)) fail("adapter_not_registered", args.adapter);
  const adapter = readJson(adapterPath);
  if (adapter.adapterId !== args.adapter) {
    fail("adapter_id_mismatch", adapterPath);
  }

  const targetRoot = assertSafeTarget(args.target, args.createTarget);
  const manifestRelative = adapter.installation.manifestPath;
  const planned = planFiles(registry, adapter);
  const manifest = buildManifest(adapter, planned);
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const priorManifest = loadOwnedManifest(targetRoot, manifestRelative);
  const overwriteAuthorized = new Set(args.overwriteExisting.map(assertSafeRelative));

  const ownedByPath = new Map();
  if (priorManifest) {
    for (const file of priorManifest.files || []) {
      ownedByPath.set(file.path, file);
    }
    ownedByPath.set(manifestRelative, {
      path: manifestRelative,
      sha256: sha256(fs.readFileSync(path.join(targetRoot, manifestRelative))),
    });
  }

  // Preflight every write before touching the filesystem.
  const writes = [];
  for (const file of [...planned, { path: manifestRelative, bytes: manifestBytes }]) {
    const relative = assertSafeRelative(file.path);
    const absolute = path.join(targetRoot, relative);
    if (!absolute.startsWith(targetRoot + path.sep) && absolute !== path.join(targetRoot, relative)) {
      fail("path_escape_rejected", relative);
    }
    if (fs.existsSync(absolute) && fs.lstatSync(absolute).isSymbolicLink()) {
      fail("destination_symlink_rejected", relative);
    }
    if (!fs.existsSync(absolute)) {
      writes.push({ relative, absolute, bytes: file.bytes, action: "create" });
      continue;
    }
    const current = fs.readFileSync(absolute);
    if (sha256(current) === sha256(file.bytes)) {
      continue; // idempotent no-op
    }
    const owned = ownedByPath.get(relative);
    const ownedIntact =
      owned && relative !== manifestRelative && sha256(current) === owned.sha256;
    if (overwriteAuthorized.has(relative)) {
      writes.push({ relative, absolute, bytes: file.bytes, action: "overwrite-authorized" });
    } else if (args.updateOwned && owned && (ownedIntact || relative === manifestRelative)) {
      writes.push({ relative, absolute, bytes: file.bytes, action: "update-owned" });
    } else if (owned && !ownedIntact && relative !== manifestRelative) {
      fail("owned_file_user_modified", relative);
    } else {
      fail("foreign_file_collision", relative);
    }
  }

  const written = [];
  try {
    for (const write of writes) {
      fs.mkdirSync(path.dirname(write.absolute), { recursive: true });
      const temporary = `${write.absolute}.tmp-${process.pid}`;
      fs.writeFileSync(temporary, write.bytes);
      fs.renameSync(temporary, write.absolute);
      written.push(write);
    }
  } catch (error) {
    for (const write of written.reverse()) {
      try {
        if (write.action === "create") fs.unlinkSync(write.absolute);
      } catch {
        // best-effort rollback
      }
    }
    fail("install_commit_failed", error.message);
  }

  const summary = {
    status: "ok",
    adapterId: adapter.adapterId,
    target: targetRoot,
    filesPlanned: planned.length + 1,
    filesWritten: writes.length,
    manifestPath: manifestRelative,
    aggregateFingerprint: manifest.aggregateFingerprint,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();
