// GOV-520 deferred suite: exhaustive-completion (R6/D8).
// Validates the enumeration certificate structure from a single rehearsal
// run: N, N_orbit, visited == orbit bound, Burnside identity, class list
// length == classCount, registered order, and admissibility of every listed
// representative under exactly the two amended predicates (C_adj ∧ C_close).
// Amended boundary per 'GOV-518 degeneracy ruling and boundary amendment — 2026-09-07' (B3 bee5f2a1…cba382): C_step2 removed; mirrors the repaired enumerator's holdsAdjacent/holdsClose logic. Refreshed under S-F3 to the current boundary; supersedes the stale three-predicate revision.
// Runs the enumerator via subprocess pipe only; persists nothing; verdict-ineligible
// (rehearsal output discarded after digest capture per single-pass rule).
// Standing D6 statistic-level check: witness class (0,1,2,3,4,5,6)/(7,…,7) present and ≥2 distinct statistics among classes.

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
let witnessPresent = null;
let distinctStatistics = null;
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
      // Amended two-predicate admissibility: C_adj ∧ C_close, mirroring the
      // repaired enumerator's holdsAdjacent/holdsClose logic.
      let adj = true;
      for (let i = 0; i < DIMENSION; i += 1) {
        if (x[i] === x[(i + 1) % DIMENSION]) adj = false;
      }
      let total = 0;
      for (let i = 0; i < DIMENSION; i += 1) total += x[i];
      const close = total % MODULUS === 0;
      if (!(adj && close)) {
        failures.push({ check: "admissibility", index: k });
        break;
      }
    }
    // Two-level non-vacuity assertion (standing D6 statistic-level proof):
    // witness class (0,1,2,3,4,5,6)/(7,…,7) present, and ≥2 distinct
    // statistics among classes.
    const WITNESS_REP = [0, 1, 2, 3, 4, 5, 6];
    const WITNESS_STAT = [7, 7, 7, 7, 7, 7, 7];
    witnessPresent = false;
    const statisticKeys = new Set();
    for (let k = 0; k < cert.classes.length; k += 1) {
      const entry = cert.classes[k];
      if (Array.isArray(entry.statistic)) statisticKeys.add(entry.statistic.join(","));
      if (
        Array.isArray(entry.representative) &&
        Array.isArray(entry.statistic) &&
        entry.representative.length === DIMENSION &&
        entry.statistic.length === DIMENSION &&
        entry.representative.every((v, i) => v === WITNESS_REP[i]) &&
        entry.statistic.every((v, i) => v === WITNESS_STAT[i])
      ) {
        witnessPresent = true;
      }
    }
    if (!witnessPresent) {
      failures.push({ check: "non-vacuity-witness", expected: { representative: WITNESS_REP, statistic: WITNESS_STAT } });
    }
    if (statisticKeys.size < 2) {
      failures.push({ check: "non-vacuity-distinct-statistics", distinctStatistics: statisticKeys.size });
    }
    distinctStatistics = statisticKeys.size;
  }
}

const report = {
  verdict: failures.length === 0 ? "PASS" : "FAIL",
  suite: "exhaustive-completion",
  conformanceMap: "R6/D8",
  admissibility: "two-predicate (C_adj ∧ C_close) per amended boundary; C_step2 removed",
  nonVacuity: {
    witness: { representative: [0, 1, 2, 3, 4, 5, 6], statistic: [7, 7, 7, 7, 7, 7, 7] },
    witnessPresent,
    distinctStatistics,
    distinctStatisticsGate: ">=2",
  },
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
