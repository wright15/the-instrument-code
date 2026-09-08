// GOV-519 Phase 1 — deterministic Z_7 execution skeleton for the GOV-518
// boundary. Implements the registered assignment space, projection map,
// predicates, D_7 canonicalization, and lexicographic order as pure compute.
//
// Target-blind by construction: this file takes no comparison input. The
// only gate before any search is the checker subprocess below, which must
// exit zero. Elapsed time drives the abort guard only and is never emitted,
// so output bytes are a pure function of the registered boundary.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const SELF_RELATIVE = "scripts/run-gov518-enumeration.mjs";
const CHECKER_RELATIVE = "scripts/verify-gov518-boundary.mjs";

const MODULUS = 7;
const DIMENSION = 7;
const ASSIGNMENT_COUNT = 823543; // 7^7
const ORBIT_BOUND = 60028; // (7^7 + 6*7 + 7*7^4) / 14
const TIMEOUT_SECONDS = 60;
const TIMEOUT_MS = TIMEOUT_SECONDS * 1000;

// Base-7 decode with x_0 most significant, so increasing n visits
// assignments in the registered lexicographic order.
export function decodeLexicographic(n) {
  const x = new Array(DIMENSION);
  let rest = n;
  for (let i = DIMENSION - 1; i >= 0; i -= 1) {
    x[i] = rest % MODULUS;
    rest = Math.floor(rest / MODULUS);
  }
  return x;
}

// K-neighbor projection: bit i is 1 exactly when the two distance-2
// neighbors differ. Run length at i counts forward consecutive ones,
// wrapping around the 7-cycle and capped at 7.
export function projectionBits(x) {
  const b = new Array(DIMENSION);
  for (let i = 0; i < DIMENSION; i += 1) {
    b[i] = x[(i + DIMENSION - 1) % DIMENSION] !== x[(i + 1) % DIMENSION] ? 1 : 0;
  }
  return b;
}

export function runStatistic(x) {
  const b = projectionBits(x);
  const s = new Array(DIMENSION);
  for (let i = 0; i < DIMENSION; i += 1) {
    if (b[i] === 0) {
      s[i] = 0;
      continue;
    }
    let length = 0;
    while (length < DIMENSION && b[(i + length) % DIMENSION] === 1) {
      length += 1;
    }
    s[i] = length;
  }
  return s;
}

// C_adj: adjacent positions on the 7-cycle differ (ring adjacency axiom).
export function holdsAdjacent(x) {
  for (let i = 0; i < DIMENSION; i += 1) {
    if (x[i] === x[(i + 1) % DIMENSION]) return false;
  }
  return true;
}

// C_step2: distance-2 neighbors differ (construction-step structure;
// K exhaustivity belongs to OBS-008).
export function holdsStepTwo(x) {
  for (let i = 0; i < DIMENSION; i += 1) {
    if (x[(i + DIMENSION - 1) % DIMENSION] === x[(i + 1) % DIMENSION]) return false;
  }
  return true;
}

// C_close: coordinates sum to zero on the 7-cycle (closure predicate).
export function holdsClosure(x) {
  let total = 0;
  for (const value of x) total += value;
  return total % MODULUS === 0;
}

export function holdsAll(x) {
  return holdsAdjacent(x) && holdsStepTwo(x) && holdsClosure(x);
}

export function compareLexicographic(a, b) {
  for (let i = 0; i < DIMENSION; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// All 14 dihedral images: rotations (sigma^r X)_i = x_{i-r} and the
// reflected coset (sigma^r tau X)_i = x_{r-i}.
export function dihedralImages(x) {
  const images = [];
  for (let r = 0; r < DIMENSION; r += 1) {
    const y = new Array(DIMENSION);
    for (let i = 0; i < DIMENSION; i += 1) y[i] = x[((i - r) % DIMENSION + DIMENSION) % DIMENSION];
    images.push(y);
  }
  for (let r = 0; r < DIMENSION; r += 1) {
    const y = new Array(DIMENSION);
    for (let i = 0; i < DIMENSION; i += 1) y[i] = x[((r - i) % DIMENSION + DIMENSION) % DIMENSION];
    images.push(y);
  }
  return images;
}

export function canonicalRepresentative(x) {
  let best = x.slice();
  for (const image of dihedralImages(x)) {
    if (compareLexicographic(image, best) < 0) best = image.slice();
  }
  return best;
}

function runnerDigest() {
  const bytes = fs.readFileSync(path.join(root, SELF_RELATIVE));
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function runPreflight() {
  const child = spawnSync("node", [CHECKER_RELATIVE], { encoding: "utf8" });
  const passed = child.status === 0;
  return { passed, output: (child.stdout ?? "").slice(0, 2000) };
}

export function enumerateOrbits() {
  const deadline = Date.now() + TIMEOUT_MS;
  const seen = new Map();
  for (let n = 0; n < ASSIGNMENT_COUNT; n += 1) {
    if ((n & 8191) === 0 && Date.now() > deadline) {
      return { timedOut: true, seen };
    }
    const x = decodeLexicographic(n);
    const representative = canonicalRepresentative(x);
    const key = representative.join(",");
    if (!seen.has(key)) {
      seen.set(key, representative);
    }
  }
  return { timedOut: false, seen };
}

function buildCertificate() {
  const { timedOut, seen } = enumerateOrbits();
  const classes = [];
  if (!timedOut) {
    for (const representative of seen.values()) {
      if (holdsAll(representative)) {
        classes.push({ representative, statistic: runStatistic(representative) });
      }
    }
    classes.sort((a, b) => compareLexicographic(a.representative, b.representative)
      || compareLexicographic(a.statistic, b.statistic));
  }
  return {
    boundary: "GOV-518",
    engine: { node: process.version, platform: process.platform, arch: process.arch },
    runnerDigest: runnerDigest(),
    assignmentCount: ASSIGNMENT_COUNT,
    orbitBound: ORBIT_BOUND,
    visitedOrbits: seen.size,
    admissibleOrbits: classes.length,
    timeoutSeconds: TIMEOUT_SECONDS,
    timedOut,
    classes,
  };
}

function printHelp() {
  console.log(`usage: node ${SELF_RELATIVE} [--preflight-only] [--enumerate] [--out <path>]`);
}

const arguments_ = process.argv.slice(2);
if (arguments_.includes("--help") || arguments_.includes("-h")) {
  printHelp();
  process.exit(0);
}

const wantEnumerate = arguments_.includes("--enumerate");
const outIndex = arguments_.indexOf("--out");
const outPath = outIndex >= 0 ? arguments_[outIndex + 1] : null;
if (outIndex >= 0 && !outPath) {
  console.error("missing value for --out");
  process.exit(1);
}

const preflight = runPreflight();
if (!preflight.passed) {
  console.error(JSON.stringify({ gate: "preflight", passed: false }));
  process.exit(1);
}

if (!wantEnumerate) {
  console.log(JSON.stringify({ gate: "preflight", passed: true }));
  process.exit(0);
}

const certificate = buildCertificate();
const payload = `${JSON.stringify(certificate, null, 2)}\n`;
if (outPath) {
  fs.writeFileSync(path.resolve(outPath), payload);
} else {
  fs.writeFileSync(1, payload);
}
process.exitCode = certificate.timedOut ? 2 : 0;
