// GOV-520 deferred suite: exhaustive-completion (R6/D8).
// Validates the enumeration certificate structure from a single rehearsal
// run: N, N_orbit, visited == orbit bound, Burnside identity, class list
// length == classCount, registered order, and admissibility of every listed
// representative under exactly the three registered predicates. Runs the
// enumerator via subprocess pipe only; persists nothing; verdict-ineligible
// (rehearsal output discarded after digest capture per single-pass rule).

import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");
const RUNNER = "scripts/run-gov518-enumeration.mjs";

const N = 823543;
const N_ORBIT = 60028;
const MODULUS = 7;
const DIMENSION = 7;

function shaHex(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function lex(a, b) {
  for (let i = 0; i < DIMENSION; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

const failures = [];
const child = spawnSync("node", [RUNNER], {
  encoding: "utf8",
  maxBuffer: 256 * 1024 * 1024,
  cwd: root,
});
const digest = shaHex(child.stdout ?? "");
if (child.status !== 0) {
  failures.push({ check: "enumerator-exit", status: child.status, stderr: (child.stderr ?? "").slice(0, 300) });
}
let cert = null;
try {
  cert = JSON.parse(child.stdout ?? "");
} catch (error) {
  failures.push({ check: "certificate-parse", error: String(error?.message ?? error) });
}

if (cert) {
  if (cert.boundaryId !== "GOV-518") failures.push({ check: "boundary-id", got: cert.boundaryId });
  if (cert.N !== N) failures.push({ check: "N", got: cert.N });
  if (cert.N_orbit !== N_ORBIT) failures.push({ check: "N-orbit", got: cert.N_orbit });
  if (cert.visited !== N_ORBIT) failures.push({ check: "visited-bound", got: cert.visited });
  const burnside = (N + 6 * MODULUS + DIMENSION * 2401) / 14;
  if (burnside !== N_ORBIT) failures.push({ check: "burnside-identity", got: burnside });
  if (!Array.isArray(cert.classes)) {
    failures.push({ check: "classes-array" });
  } else {
    if (cert.classCount !== cert.classes.length) {
      failures.push({ check: "classCount-length", classCount: cert.classCount, length: cert.classes.length });
    }
    for (let i = 0; i + 1 < cert.classes.length; i += 1) {
      const a = cert.classes[i];
      const b = cert.classes[i + 1];
      const c = lex(a.representative, b.representative);
      if (c > 0 || (c === 0 && lex(a.statistic, b.statistic) > 0)) {
        failures.push({ check: "registered-order", index: i });
        break;
      }
    }
    for (let k = 0; k < cert.classes.length; k += 1) {
      const x = cert.classes[k].representative;
      let adj = true;
      let step2 = true;
      for (let i = 0; i < DIMENSION; i += 1) {
        if (x[i] === x[(i + 1) % DIMENSION]) adj = false;
        if (x[(i + DIMENSION - 1) % DIMENSION] === x[(i + 1) % DIMENSION]) step2 = false;
      }
      let total = 0;
      for (let i = 0; i < DIMENSION; i += 1) total += x[i];
      const close = total % MODULUS === 0;
      if (!(adj && step2 && close)) {
        failures.push({ check: "admissibility", index: k });
        break;
      }
    }
  }
}

const report = {
  verdict: failures.length === 0 ? "PASS" : "FAIL",
  suite: "exhaustive-completion",
  conformanceMap: "R6/D8",
  certificate: cert ? {
    boundaryId: cert.boundaryId,
    N: cert.N,
    N_orbit: cert.N_orbit,
    visited: cert.visited,
    classCount: cert.classCount,
    classesLength: Array.isArray(cert.classes) ? cert.classes.length : null,
    burnside: (N + 6 * MODULUS + DIMENSION * 2401) / 14,
  } : null,
  outputDigest: digest,
  outputBytes: Buffer.byteLength(child.stdout ?? "", "utf8"),
  persistedFiles: [],
  failures,
};
console.log(JSON.stringify(report, null, 2));
process.exitCode = failures.length > 0 ? 1 : 0;
