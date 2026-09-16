import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { frozenPayloadExcluded, recordFile, walkFiles } from "./manifest-utils.mjs";

for (const directory of [
  "seven-governors-harmonic-invariants-v0.1.0",
  "seven-governors-court-filter-algebra-v0.1.0",
]) {
  test(`${directory}: live payload equals every frozen manifest record`, async () => {
    const root = path.resolve(import.meta.dirname, "..", directory);
    const manifest = JSON.parse(await fs.readFile(path.join(root, "PACKAGE_MANIFEST.json")));
    const records = await Promise.all((await walkFiles(root, {
      excluded: frozenPayloadExcluded,
    })).map((file) => recordFile(file, root)));
    assert.equal(records.length, manifest.fileCount);
    assert.deepEqual(records, manifest.files);
  });
}

test("frozen payload ignores execution caches, not added or changed payload", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "frozen-payload-"));
  const records = async () => Promise.all((await walkFiles(root, {
    excluded: frozenPayloadExcluded,
  })).map((file) => recordFile(file, root)));
  try {
    await fs.mkdir(path.join(root, "src"));
    await fs.writeFile(path.join(root, "src/module.py"), "original");
    const original = await records();
    for (const directory of ["src/__pycache__", ".pytest_cache"]) {
      await fs.mkdir(path.join(root, directory));
      await fs.writeFile(path.join(root, directory, "cache"), "execution residue");
    }
    assert.deepEqual(await records(), original);
    await fs.writeFile(path.join(root, "src/module.py"), "tampered");
    assert.notDeepEqual(await records(), original);
    await fs.writeFile(path.join(root, "src/extra.py"), "extra payload");
    assert.equal((await records()).length, 2);
    await fs.unlink(path.join(root, "src/module.py"));
    assert.notDeepEqual(await records(), original);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
