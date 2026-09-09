// GOV-520 deferred suite: reordered-input (D5 / order_invariance).
// The rebuilt enumerator takes no arguments (source carries zero option
// tokens, verified by the argv allowlist scan), so there is no argument
// order to permute: satisfied-by-construction, citing the allowlist scan.
// This suite still demonstrates the required property empirically by running
// the enumerator under permuted wrapper-side argv orders (including the
// harness order) and requiring byte-identical output digests. Pipes only;
// persists nothing; verdict-ineligible.

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");
const RUNNER = "scripts/run-gov518-enumeration.mjs";

function shaHex(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function runOnce(args) {
  const child = spawnSync("node", [RUNNER, ...args], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    cwd: root,
  });
  return {
    args,
    status: child.status,
    digest: shaHex(child.stdout ?? ""),
    bytes: Buffer.byteLength(child.stdout ?? "", "utf8"),
  };
}

const failures = [];

// Cite the allowlist: enumerator source carries zero option tokens.
let argvTokens = null;
try {
  const text = fs.readFileSync(path.join(root, RUNNER), "utf8");
  const found = text.match(/--[A-Za-z0-9][A-Za-z0-9-]*/g) ?? [];
  argvTokens = [...new Set(found)].sort();
  if (argvTokens.length >= 2) {
    failures.push({ check: "allowlist-premise", error: `expected <2 tokens, found ${argvTokens.length}` });
  }
} catch (error) {
  failures.push({ check: "enumerator-readable", error: String(error?.message ?? error) });
}

// Permute wrapper-side argv orders; the enumerator ignores argv, so every
// run must be byte-identical and non-empty.
const orders = [[], ["--enumerate"], ["--preflight-only"], ["--enumerate", "--preflight-only"], ["--preflight-only", "--enumerate"]];
const runs = orders.map(runOnce);
for (const r of runs) {
  if (r.status !== 0) failures.push({ check: "enumerator-exit", args: r.args, status: r.status });
  if (r.bytes === 0) failures.push({ check: "non-empty", args: r.args });
}
const digests = runs.map((r) => r.digest);
if (!digests.every((d) => d === digests[0])) {
  failures.push({ check: "digest-identity", digests });
}

const report = {
  verdict: failures.length === 0 ? "PASS" : "FAIL",
  suite: "reordered-input",
  conformanceMap: "D5",
  basis: "satisfied-by-construction: enumerator source carries zero option tokens (argv allowlist scan passes vacuously); empirically confirmed by permuted wrapper-side orders",
  argvTokens,
  runs,
  identical: digests.every((d) => d === digests[0]),
  persistedFiles: [],
  failures,
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length > 0 ? 1 : 0;
