#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  canonicalJsonBytes,
  compareCodePoint,
  sha256Bytes,
} from "../graph/runtime/canonical.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE_ROOT = path.join(ROOT, "skills", "court");
const BUNDLE_ID = "seven-governors-crt-307";
const BUNDLE_VERSION = "1.0.0";
const MANIFEST_SCHEMA_VERSION = "crt-307.install-manifest.v1";
const MANIFEST_PATH = ".seven-governors-crt-307-manifest.json";
const CREATED_FILE_MODE = 0o644;
const SCHEMA_FILES = [
  "adapter.schema.json",
  "capabilities.schema.json",
  "common.schema.json",
  "inspect-court-state.schema.json",
  "install-manifest.schema.json",
  "list-legal-court-moves.schema.json",
  "project-through-court.schema.json",
  "registry.schema.json",
  "validate-execute-court-transition.schema.json",
  "verify-court-postcondition.schema.json",
];

class InstallError extends Error {
  constructor(reason, detail) {
    super(detail);
    this.reason = reason;
  }
}

function reject(reason, detail) {
  throw new InstallError(reason, String(detail));
}

function optionValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) reject("argument_value_required", option);
  return value;
}

function parseArgs(argv) {
  const args = {target: null, adapter: null, createTarget: false, updateOwned: false, overwriteExisting: []};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--target") {
      args.target = optionValue(argv, index, arg);
      index += 1;
    } else if (arg === "--adapter") {
      args.adapter = optionValue(argv, index, arg);
      index += 1;
    } else if (arg === "--create-target") {
      args.createTarget = true;
    } else if (arg === "--update-owned") {
      args.updateOwned = true;
    } else if (arg === "--overwrite-existing") {
      args.overwriteExisting.push(optionValue(argv, index, arg));
      index += 1;
    } else {
      reject("unknown_argument", arg);
    }
  }
  if (!args.target) reject("target_required", "pass --target <explicit-path>");
  if (!args.adapter) reject("adapter_required", "pass --adapter hermes|generic-json");
  if (!new Set(["hermes", "generic-json"]).has(args.adapter)) {
    reject("adapter_not_registered", args.adapter);
  }
  return args;
}

function readJson(absolutePath) {
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    reject("json_invalid", `${absolutePath}: ${error.message}`);
  }
}

function safeRelative(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\\")) {
    reject("path_traversal_rejected", value);
  }
  const normalized = path.posix.normalize(value);
  if (
    normalized !== value
    || normalized === "."
    || normalized === ".."
    || normalized.startsWith("../")
    || path.posix.isAbsolute(value)
    || value.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    reject("path_traversal_rejected", value);
  }
  return value;
}

function destination(targetRoot, relative) {
  const safe = safeRelative(relative);
  const absolute = path.resolve(targetRoot, ...safe.split("/"));
  if (absolute !== targetRoot && !absolute.startsWith(`${targetRoot}${path.sep}`)) {
    reject("path_escape_rejected", relative);
  }
  return absolute;
}

function lstatIfPresent(absolutePath) {
  try {
    return fs.lstatSync(absolutePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function inspectExistingComponents(absolutePath, leafReason = "destination_symlink_rejected") {
  // Pathname APIs cannot eliminate adversarial OS-level TOCTOU, so every
  // detectable static or changed component is rechecked and rejected.
  const resolved = path.resolve(absolutePath);
  const parsed = path.parse(resolved);
  let current = parsed.root;
  const parts = resolved.slice(parsed.root.length).split(path.sep).filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    current = path.join(current, parts[index]);
    const stat = lstatIfPresent(current);
    if (!stat) return;
    if (stat.isSymbolicLink()) {
      reject(index === parts.length - 1 ? leafReason : "parent_symlink_rejected", current);
    }
    if (index < parts.length - 1 && !stat.isDirectory()) {
      reject("parent_not_directory", current);
    }
  }
}

function prepareTarget(targetArgument, createTarget) {
  const targetRoot = path.resolve(targetArgument);
  inspectExistingComponents(targetRoot, "target_symlink_rejected");
  if (fs.existsSync(targetRoot)) {
    if (!fs.lstatSync(targetRoot).isDirectory()) reject("target_not_directory", targetRoot);
  } else if (!createTarget) {
    reject("target_missing", `${targetRoot} (pass --create-target to create)`);
  }
  return {targetRoot, create: !fs.existsSync(targetRoot)};
}

function skillSlug(name) {
  return name.replace(/^seven-governors-/, "");
}

function planFiles(registry, adapter) {
  const planned = [];
  for (const skill of registry.skills) {
    const relative = safeRelative(skill.adapterMappings[adapter.adapterId].targetPath);
    planned.push({path: relative, bytes: fs.readFileSync(path.join(BUNDLE_ROOT, skill.workflowPath))});
    const rendered = adapter.rendering.targetPattern.replace("{skill-slug}", skillSlug(skill.name));
    if (rendered !== relative) reject("adapter_mapping_mismatch", `${skill.skillId}: ${relative}`);
  }
  const metadataSources = [
    "README.md",
    "registry.json",
    "capabilities.json",
    ...SCHEMA_FILES.map((name) => `schemas/${name}`),
    "adapters/generic-json.json",
    "adapters/hermes.json",
  ];
  for (const source of metadataSources) {
    planned.push({
      path: safeRelative(`${adapter.rendering.metadataRoot}/${source}`),
      bytes: fs.readFileSync(path.join(BUNDLE_ROOT, source)),
    });
  }
  planned.sort((left, right) => compareCodePoint(left.path, right.path));
  const seen = new Set();
  for (const file of planned) {
    if (seen.has(file.path)) reject("duplicate_planned_path", file.path);
    seen.add(file.path);
  }
  return planned;
}

function buildManifest(adapter, planned) {
  const files = planned.map((file) => ({
    path: file.path,
    bytes: file.bytes.length,
    sha256: sha256Bytes(file.bytes),
  }));
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    bundleId: BUNDLE_ID,
    bundleVersion: BUNDLE_VERSION,
    adapterId: adapter.adapterId,
    adapterVersion: adapter.adapterVersion,
    sourceFingerprint: sha256Bytes(canonicalJsonBytes(files.map((file) => [file.path, file.sha256]))),
    registrySha256: sha256Bytes(fs.readFileSync(path.join(BUNDLE_ROOT, "registry.json"))),
    files,
    aggregateFingerprint: sha256Bytes(canonicalJsonBytes(files.map((file) => [file.path, file.bytes, file.sha256]))),
  };
}

function loadManifest(targetRoot, adapterId) {
  const absolute = destination(targetRoot, MANIFEST_PATH);
  if (!fs.existsSync(absolute)) return null;
  inspectExistingComponents(absolute, "manifest_symlink_rejected");
  if (!fs.lstatSync(absolute).isFile()) reject("foreign_manifest_rejected", absolute);
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch (error) {
    reject("foreign_manifest_rejected", `${absolute}: ${error.message}`);
  }
  if (
    manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION
    || manifest.bundleId !== BUNDLE_ID
    || manifest.bundleVersion !== BUNDLE_VERSION
    || manifest.adapterId !== adapterId
  ) {
    reject("foreign_manifest_rejected", absolute);
  }
  if (!Array.isArray(manifest.files)) reject("foreign_manifest_rejected", absolute);
  return {manifest, absolute, bytes: fs.readFileSync(absolute)};
}

function ownedFiles(prior) {
  const owned = new Map();
  if (!prior) return owned;
  for (const file of prior.manifest.files) {
    if (
      !file || typeof file.bytes !== "number"
      || typeof file.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(file.sha256)
    ) {
      reject("foreign_manifest_rejected", prior.absolute);
    }
    const relative = safeRelative(file.path);
    if (owned.has(relative)) reject("foreign_manifest_rejected", `duplicate ${relative}`);
    owned.set(relative, file);
  }
  return owned;
}

function preflight(targetRoot, planned, manifestBytes, prior, args) {
  const authorized = new Set(args.overwriteExisting.map(safeRelative));
  if (authorized.size !== args.overwriteExisting.length) reject("duplicate_overwrite_path", "paths must be exact and unique");
  const plannedPaths = new Set(planned.map((file) => file.path));
  for (const relative of authorized) {
    if (!plannedPaths.has(relative)) reject("overwrite_path_not_planned", relative);
  }

  const owned = ownedFiles(prior);
  const writes = [];
  for (const file of planned) {
    const absolute = destination(targetRoot, file.path);
    inspectExistingComponents(absolute);
    const exists = fs.existsSync(absolute);
    if (exists && !fs.lstatSync(absolute).isFile()) reject("foreign_file_collision", file.path);
    const owner = owned.get(file.path);
    if (!exists) {
      if (owner && !authorized.has(file.path)) reject("owned_file_missing", file.path);
      if (authorized.has(file.path)) reject("overwrite_path_not_existing", file.path);
      writes.push({relative: file.path, absolute, bytes: file.bytes, action: "create"});
      continue;
    }
    if (!owner) reject("foreign_file_collision", file.path);
    const current = fs.readFileSync(absolute);
    const currentHash = sha256Bytes(current);
    const desiredHash = sha256Bytes(file.bytes);
    const intact = currentHash === owner.sha256 && current.length === owner.bytes;
    if (!intact && !authorized.has(file.path)) reject("owned_file_user_modified", file.path);
    if (currentHash === desiredHash && current.length === file.bytes.length && intact) continue;
    if (!authorized.has(file.path) && !args.updateOwned) reject("owned_update_requires_flag", file.path);
    writes.push({
      relative: file.path,
      absolute,
      bytes: file.bytes,
      action: "overwrite",
      priorBytes: current,
      priorMode: fs.statSync(absolute).mode & 0o7777,
    });
  }

  for (const relative of authorized) {
    if (!writes.some((write) => write.relative === relative)) {
      reject("overwrite_path_not_changed", relative);
    }
  }

  const manifestAbsolute = destination(targetRoot, MANIFEST_PATH);
  inspectExistingComponents(manifestAbsolute, "manifest_symlink_rejected");
  if (!prior && fs.existsSync(manifestAbsolute)) reject("foreign_manifest_rejected", manifestAbsolute);
  if (prior) {
    const normalizedPrior = Buffer.from(`${JSON.stringify(prior.manifest, null, 2)}\n`, "utf8");
    if (!prior.bytes.equals(normalizedPrior)) reject("owned_manifest_user_modified", MANIFEST_PATH);
    if (!prior.bytes.equals(manifestBytes)) {
      if (writes.length === 0 && !args.updateOwned) reject("owned_update_requires_flag", MANIFEST_PATH);
      writes.push({
        relative: MANIFEST_PATH,
        absolute: manifestAbsolute,
        bytes: manifestBytes,
        action: "overwrite",
        priorBytes: prior.bytes,
        priorMode: fs.statSync(manifestAbsolute).mode & 0o7777,
      });
    }
  } else {
    writes.push({relative: MANIFEST_PATH, absolute: manifestAbsolute, bytes: manifestBytes, action: "create"});
  }
  return writes;
}

function sameBytes(absolute, expected) {
  const stat = lstatIfPresent(absolute);
  return Boolean(stat?.isFile() && fs.readFileSync(absolute).equals(expected));
}

function verifyWritePrecondition(write) {
  inspectExistingComponents(write.absolute, write.relative === MANIFEST_PATH ? "manifest_symlink_rejected" : "destination_symlink_rejected");
  const stat = lstatIfPresent(write.absolute);
  if (write.action === "create") {
    if (stat) reject("destination_changed_at_commit", write.relative);
    return;
  }
  if (
    !stat?.isFile()
    || (stat.mode & 0o7777) !== write.priorMode
    || !fs.readFileSync(write.absolute).equals(write.priorBytes)
  ) {
    reject("destination_changed_at_commit", write.relative);
  }
}

function atomicWrite(absolute, bytes, mode, beforeRename, afterRename) {
  const temporary = `${absolute}.tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
  let descriptor;
  try {
    inspectExistingComponents(path.dirname(absolute));
    inspectExistingComponents(absolute);
    descriptor = fs.openSync(temporary, "wx", mode);
    fs.fchmodSync(descriptor, mode);
    fs.writeFileSync(descriptor, bytes);
    fs.closeSync(descriptor);
    descriptor = undefined;
    beforeRename();
    fs.renameSync(temporary, absolute);
    afterRename();
  } catch (error) {
    try {
      if (descriptor !== undefined) fs.closeSync(descriptor);
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    } catch {
      // Preserve the original commit error.
    }
    throw error;
  }
}

function ensureDirectories(absoluteDirectory, createdDirectories) {
  const resolved = path.resolve(absoluteDirectory);
  const parsed = path.parse(resolved);
  let current = parsed.root;
  for (const part of resolved.slice(parsed.root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    const stat = lstatIfPresent(current);
    if (stat) {
      if (stat.isSymbolicLink()) reject("parent_symlink_rejected", current);
      if (!stat.isDirectory()) reject("parent_not_directory", current);
      continue;
    }
    inspectExistingComponents(path.dirname(current));
    fs.mkdirSync(current);
    createdDirectories.push(current);
  }
}

function removeCreatedDirectories(createdDirectories) {
  for (const directory of [...createdDirectories].reverse()) {
    try {
      const stat = lstatIfPresent(directory);
      if (stat?.isDirectory() && !stat.isSymbolicLink()) fs.rmdirSync(directory);
    } catch (error) {
      if (!new Set(["ENOENT", "ENOTEMPTY", "EEXIST"]).has(error.code)) throw error;
    }
  }
}

function commit(writes, createdDirectories) {
  const completed = [];
  try {
    for (const write of writes) {
      inspectExistingComponents(path.dirname(write.absolute));
      ensureDirectories(path.dirname(write.absolute), createdDirectories);
      verifyWritePrecondition(write);
      write.replaced = false;
      completed.push(write);
      atomicWrite(
        write.absolute,
        write.bytes,
        write.action === "overwrite" ? write.priorMode : CREATED_FILE_MODE,
        () => verifyWritePrecondition(write),
        () => {
          write.replaced = true;
          if (process.env.CRT307_INSTALL_FAIL_AFTER_REPLACE === write.relative) {
            throw new Error(`injected failure after replacement: ${write.relative}`);
          }
        },
      );
    }
  } catch (commitError) {
    const rollbackErrors = [];
    for (const write of completed.reverse()) {
      if (!write.replaced) continue;
      try {
        inspectExistingComponents(write.absolute);
        if (!sameBytes(write.absolute, write.bytes)) {
          throw new Error("destination changed before rollback");
        }
        if (write.action === "create") {
          fs.unlinkSync(write.absolute);
        } else {
          atomicWrite(
            write.absolute,
            write.priorBytes,
            write.priorMode,
            () => {
              inspectExistingComponents(write.absolute);
              if (!sameBytes(write.absolute, write.bytes)) {
                throw new Error("destination changed during rollback");
              }
            },
            () => {},
          );
        }
      } catch (rollbackError) {
        rollbackErrors.push(`${write.relative}: ${rollbackError.message}`);
      }
    }
    reject("install_commit_failed", `${commitError.message}${rollbackErrors.length ? `; rollback: ${rollbackErrors.join(", ")}` : ""}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const registry = readJson(path.join(BUNDLE_ROOT, "registry.json"));
  const adapter = readJson(path.join(BUNDLE_ROOT, "adapters", `${args.adapter}.json`));
  if (adapter.adapterId !== args.adapter) reject("adapter_id_mismatch", args.adapter);
  if (adapter.installation.manifestPath !== MANIFEST_PATH) reject("manifest_path_mismatch", adapter.installation.manifestPath);

  const target = prepareTarget(args.target, args.createTarget);
  const planned = planFiles(registry, adapter);
  const manifest = buildManifest(adapter, planned);
  const manifestBytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const authorized = args.overwriteExisting.map(safeRelative);
  if (new Set(authorized).size !== authorized.length) reject("duplicate_overwrite_path", "paths must be exact and unique");
  const plannedPaths = new Set(planned.map((file) => file.path));
  for (const relative of authorized) {
    if (!plannedPaths.has(relative)) reject("overwrite_path_not_planned", relative);
    if (target.create) reject("overwrite_path_not_existing", relative);
  }

  const createdDirectories = [];
  let writes;
  try {
    inspectExistingComponents(target.targetRoot, "target_symlink_rejected");
    if (target.create) ensureDirectories(target.targetRoot, createdDirectories);
    inspectExistingComponents(target.targetRoot, "target_symlink_rejected");
    const prior = loadManifest(target.targetRoot, args.adapter);
    writes = preflight(target.targetRoot, planned, manifestBytes, prior, args);
    inspectExistingComponents(target.targetRoot, "target_symlink_rejected");
    commit(writes, createdDirectories);
  } catch (error) {
    removeCreatedDirectories(createdDirectories);
    throw error;
  }

  process.stdout.write(`${JSON.stringify({
    status: "ok",
    adapterId: adapter.adapterId,
    filesPlanned: planned.length + 1,
    filesWritten: writes.length,
    manifestPath: MANIFEST_PATH,
    aggregateFingerprint: manifest.aggregateFingerprint,
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  const reason = error instanceof InstallError ? error.reason : "unexpected_error";
  process.stderr.write(`FAIL ${reason}: ${error.message}\n`);
  process.exit(1);
}
