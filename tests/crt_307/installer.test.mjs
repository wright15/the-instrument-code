import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { canonicalJsonBytes, sha256Bytes } from "../../graph/runtime/canonical.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const installer = path.join(root, "scripts", "install-court-skills.mjs");
const manifestName = ".seven-governors-crt-307-manifest.json";

function temporary(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function install(target, adapter, extra = [], env = {}) {
  return spawnSync(process.execPath, [installer, "--target", target, "--adapter", adapter, ...extra], {cwd: root, encoding: "utf8", env: {...process.env, ...env}});
}

function requireSuccess(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function requireFailure(result, reason) {
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, new RegExp(`FAIL ${reason}:`));
}

function treeFingerprint(directory) {
  const entries = [];
  function visit(current, relative = "") {
    for (const name of fs.readdirSync(current).sort()) {
      const absolute = path.join(current, name);
      const child = relative ? `${relative}/${name}` : name;
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute, child);
      else entries.push([child, stat.mode & 0o7777, sha256Bytes(fs.readFileSync(absolute))]);
    }
  }
  visit(directory);
  return crypto.createHash("sha256").update(canonicalJsonBytes(entries)).digest("hex");
}

function verifyManifest(target, adapter) {
  const manifest = JSON.parse(fs.readFileSync(path.join(target, manifestName), "utf8"));
  assert.equal(manifest.schemaVersion, "crt-307.install-manifest.v1");
  assert.equal(manifest.bundleId, "seven-governors-crt-307");
  assert.equal(manifest.adapterId, adapter);
  assert.equal(manifest.files.length, 20);
  for (const file of manifest.files) {
    const bytes = fs.readFileSync(path.join(target, ...file.path.split("/")));
    assert.equal(bytes.length, file.bytes, file.path);
    assert.equal(sha256Bytes(bytes), file.sha256, file.path);
    assert.equal(path.isAbsolute(file.path), false);
  }
  assert.equal(manifest.sourceFingerprint, sha256Bytes(canonicalJsonBytes(manifest.files.map((file) => [file.path, file.sha256]))));
  assert.equal(manifest.aggregateFingerprint, sha256Bytes(canonicalJsonBytes(manifest.files.map((file) => [file.path, file.bytes, file.sha256]))));
  const text = JSON.stringify(manifest);
  assert.doesNotMatch(text, /(?:timestamp|generatedAt|createdAt|processId|\bpid\b|modelIdentity|homeDirectory)/i);
  assert.doesNotMatch(text, /\d{4}-\d{2}-\d{2}T\d{2}:/);
  return manifest;
}

for (const adapter of ["hermes", "generic-json"]) {
  test(`clean ${adapter} install contains every asset and repeat is byte-identical`, () => {
    const target = temporary(`crt-307-${adapter}-`);
    const first = requireSuccess(install(target, adapter));
    assert.equal(first.filesPlanned, 21);
    assert.equal(first.filesWritten, 21);
    verifyManifest(target, adapter);
    const before = treeFingerprint(target);
    const second = requireSuccess(install(target, adapter));
    assert.equal(second.filesWritten, 0);
    assert.equal(treeFingerprint(target), before);
    const metadataRoot = adapter === "hermes" ? "seven-governors-court" : "court";
    for (const relative of ["README.md", "registry.json", "capabilities.json", "schemas/common.schema.json", "schemas/adapter.schema.json", "adapters/hermes.json", "adapters/generic-json.json"]) {
      assert.ok(fs.existsSync(path.join(target, metadataRoot, relative)));
    }
  });
}

test("install coexists with Governor files and never edits host configuration", () => {
  const target = temporary("crt-307-coexist-");
  const governorFile = path.join(target, "skills", "governor", "existing.bin");
  const hostConfig = path.join(target, "host-config.json");
  fs.mkdirSync(path.dirname(governorFile), {recursive: true});
  fs.writeFileSync(governorFile, Buffer.from([0, 1, 2, 255]));
  fs.writeFileSync(hostConfig, "{\"ownedBy\":\"host\"}\n");
  const beforeGov = fs.readFileSync(governorFile);
  const beforeConfig = fs.readFileSync(hostConfig);
  requireSuccess(install(target, "hermes"));
  assert.deepEqual(fs.readFileSync(governorFile), beforeGov);
  assert.deepEqual(fs.readFileSync(hostConfig), beforeConfig);
});

test("foreign collisions and modified owned files fail closed", () => {
  const collision = temporary("crt-307-collision-");
  fs.mkdirSync(path.join(collision, "court"), {recursive: true});
  fs.writeFileSync(path.join(collision, "court", "registry.json"), "foreign\n");
  requireFailure(install(collision, "generic-json"), "foreign_file_collision");
  assert.equal(fs.existsSync(path.join(collision, manifestName)), false);

  const modified = temporary("crt-307-modified-");
  requireSuccess(install(modified, "generic-json"));
  fs.appendFileSync(path.join(modified, "court", "registry.json"), "modified\n");
  requireFailure(install(modified, "generic-json"), "owned_file_user_modified");
  requireFailure(install(modified, "generic-json", ["--update-owned"]), "owned_file_user_modified");
});

test("target, destination, manifest, and parent symlinks are rejected", () => {
  const actual = temporary("crt-307-real-");
  const linkParent = temporary("crt-307-link-");
  const targetLink = path.join(linkParent, "target");
  fs.symlinkSync(actual, targetLink, "dir");
  requireFailure(install(targetLink, "hermes"), "target_symlink_rejected");

  const destination = temporary("crt-307-destination-");
  const external = path.join(destination, "external");
  fs.writeFileSync(external, "external\n");
  fs.mkdirSync(path.join(destination, "seven-governors-inspect-court-state"), {recursive: true});
  fs.symlinkSync(external, path.join(destination, "seven-governors-inspect-court-state", "SKILL.md"));
  requireFailure(install(destination, "hermes"), "destination_symlink_rejected");

  const parent = temporary("crt-307-parent-");
  const externalDir = temporary("crt-307-external-");
  fs.symlinkSync(externalDir, path.join(parent, "court"), "dir");
  requireFailure(install(parent, "generic-json"), "parent_symlink_rejected");

  const manifestTarget = temporary("crt-307-manifest-link-");
  const manifestExternal = path.join(manifestTarget, "external-manifest");
  fs.writeFileSync(manifestExternal, "{}\n");
  fs.symlinkSync(manifestExternal, path.join(manifestTarget, manifestName));
  requireFailure(install(manifestTarget, "hermes"), "manifest_symlink_rejected");
});

test("traversal and foreign manifests are rejected before asset writes", () => {
  const traversal = temporary("crt-307-traversal-");
  requireFailure(install(traversal, "hermes", ["--overwrite-existing", "../escape"]), "path_traversal_rejected");
  assert.deepEqual(fs.readdirSync(traversal), []);

  const foreign = temporary("crt-307-foreign-manifest-");
  fs.writeFileSync(path.join(foreign, manifestName), JSON.stringify({schemaVersion: "other.v1", bundleId: "foreign"}) + "\n");
  requireFailure(install(foreign, "hermes"), "foreign_manifest_rejected");
  assert.deepEqual(fs.readdirSync(foreign), [manifestName]);
});

test("update-owned updates intact prior bytes and exact overwrite repairs an authorized modified path", () => {
  const target = temporary("crt-307-update-");
  requireSuccess(install(target, "generic-json"));
  const relative = "court/registry.json";
  const absolute = path.join(target, "court", "registry.json");
  const oldBytes = Buffer.from("old-owned-registry\n");
  fs.writeFileSync(absolute, oldBytes);
  const manifestPath = path.join(target, manifestName);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entry = manifest.files.find((file) => file.path === relative);
  entry.bytes = oldBytes.length;
  entry.sha256 = sha256Bytes(oldBytes);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  requireFailure(install(target, "generic-json"), "owned_update_requires_flag");
  requireSuccess(install(target, "generic-json", ["--update-owned"]));
  assert.doesNotMatch(fs.readFileSync(absolute, "utf8"), /old-owned/);

  fs.appendFileSync(absolute, "operator-modification\n");
  requireSuccess(install(target, "generic-json", ["--overwrite-existing", relative]));
  assert.doesNotMatch(fs.readFileSync(absolute, "utf8"), /operator-modification/);
  assert.equal(requireSuccess(install(target, "generic-json")).filesWritten, 0);
});

test("commit failure rolls back overwritten bytes and mode", (context) => {
  if (typeof process.getuid === "function" && process.getuid() === 0) {
    context.skip("permission fault injection is ineffective as root");
    return;
  }
  const target = temporary("crt-307-rollback-");
  requireSuccess(install(target, "generic-json"));
  const firstRelative = "court/adapters/generic-json.json";
  const failingRelative = "court/schemas/adapter.schema.json";
  const firstAbsolute = path.join(target, ...firstRelative.split("/"));
  const failingAbsolute = path.join(target, ...failingRelative.split("/"));
  const oldFirst = Buffer.from("prior-adapter-bytes\n");
  const oldFailing = Buffer.from("prior-schema-bytes\n");
  fs.writeFileSync(firstAbsolute, oldFirst);
  fs.chmodSync(firstAbsolute, 0o600);
  fs.writeFileSync(failingAbsolute, oldFailing);

  const manifestPath = path.join(target, manifestName);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const [relative, bytes] of [[firstRelative, oldFirst], [failingRelative, oldFailing]]) {
    const entry = manifest.files.find((file) => file.path === relative);
    entry.bytes = bytes.length;
    entry.sha256 = sha256Bytes(bytes);
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const failingDirectory = path.dirname(failingAbsolute);
  fs.chmodSync(failingDirectory, 0o500);
  try {
    requireFailure(install(target, "generic-json", ["--update-owned"]), "install_commit_failed");
  } finally {
    fs.chmodSync(failingDirectory, 0o700);
  }
  assert.deepEqual(fs.readFileSync(firstAbsolute), oldFirst);
  assert.equal(fs.statSync(firstAbsolute).mode & 0o777, 0o600);
  assert.deepEqual(fs.readFileSync(failingAbsolute), oldFailing);
});

test("failure after replacement restores prior bytes and mode", () => {
  const target = temporary("crt-307-post-replace-");
  requireSuccess(install(target, "generic-json"));
  const relative = "court/adapters/generic-json.json";
  const absolute = path.join(target, ...relative.split("/"));
  const priorBytes = Buffer.from("prior-adapter-after-replace\n");
  fs.writeFileSync(absolute, priorBytes);
  fs.chmodSync(absolute, 0o600);
  const manifestPath = path.join(target, manifestName);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entry = manifest.files.find((file) => file.path === relative);
  entry.bytes = priorBytes.length;
  entry.sha256 = sha256Bytes(priorBytes);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  requireFailure(
    install(
      target,
      "generic-json",
      ["--update-owned"],
      {CRT307_INSTALL_FAIL_AFTER_REPLACE: relative},
    ),
    "install_commit_failed",
  );
  assert.deepEqual(fs.readFileSync(absolute), priorBytes);
  assert.equal(fs.statSync(absolute).mode & 0o777, 0o600);
});

test("failed new-target commit removes only empty installer-created directories", () => {
  const parent = temporary("crt-307-new-target-rollback-");
  const target = path.join(parent, "new", "target");
  requireFailure(
    install(
      target,
      "generic-json",
      ["--create-target"],
      {CRT307_INSTALL_FAIL_AFTER_REPLACE: "court/adapters/generic-json.json"},
    ),
    "install_commit_failed",
  );
  assert.equal(fs.existsSync(target), false);
  assert.equal(fs.existsSync(path.join(parent, "new")), false);
});

test("missing target requires explicit creation permission", () => {
  const parent = temporary("crt-307-create-");
  const target = path.join(parent, "new-target");
  requireFailure(install(target, "hermes"), "target_missing");
  requireSuccess(install(target, "hermes", ["--create-target"]));
  assert.ok(fs.existsSync(path.join(target, manifestName)));
});
