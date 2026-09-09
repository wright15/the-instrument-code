// GOV-520 comparison entry for the GOV-518 boundary.
// Separate role from enumeration: this file never runs the search.
// It reads two inputs only: the enumeration output location given as the
// single positional argument, and the registered observation record.
// It recomputes the record binding at runtime before any read, derives the
// observed peak set at runtime, evaluates membership per A3, and emits the
// per class result plus the category. Binding mismatch aborts with no verdict.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

const RECORD = "canonical/fivefold-incubator/d-shadow-complement-span-v0.json";
const EXPECTED_FINGERPRINT = "8c2416b8f51f8ae8cdb0fc9f2490beeb9e3cc49f435be7d992f55f5f7c122cb8";
const DIMENSION = 7;
const TOTAL = 823543;
const ORBIT_TOTAL = 60028;

function shaHex(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function fail(message) {
  process.exitCode = 1;
  console.error(JSON.stringify({ verdict: "abort", error: message }));
}

function loadBinding() {
  let checksums;
  try {
    checksums = fs.readFileSync(path.join(root, "CHECKSUMS.sha256"), "utf8");
  } catch {
    return null;
  }
  let wanted = null;
  for (const line of checksums.split("\n")) {
    if (line.endsWith("  " + RECORD)) {
      wanted = line.split(" ")[0];
      break;
    }
  }
  if (!wanted) {
    return null;
  }
  let manifestEntry = null;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "MANIFEST.json"), "utf8"));
    for (const entry of manifest.files) {
      if (entry.path === RECORD) {
        manifestEntry = entry.sha256;
        break;
      }
    }
  } catch {
    return null;
  }
  if (manifestEntry !== wanted) {
    return null;
  }
  return wanted;
}

function peakSet(seq) {
  let peak = seq[0];
  for (let i = 1; i < DIMENSION; i += 1) {
    if (seq[i] > peak) {
      peak = seq[i];
    }
  }
  const out = [];
  for (let i = 0; i < DIMENSION; i += 1) {
    if (seq[i] === peak) {
      out.push(i);
    }
  }
  return out;
}

function rotated(set, r) {
  return set.map((a) => (a + r) % DIMENSION).sort((a, b) => a - b);
}

function mirrored(set, r) {
  return set.map((a) => ((r - a) % DIMENSION + DIMENSION) % DIMENSION).sort((a, b) => a - b);
}

function orbitOf(set) {
  const seen = new Map();
  for (let r = 0; r < DIMENSION; r += 1) {
    seen.set(JSON.stringify(rotated(set, r)), true);
  }
  for (let r = 0; r < DIMENSION; r += 1) {
    seen.set(JSON.stringify(mirrored(set, r)), true);
  }
  return [...seen.keys()];
}

function sameSet(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function runOf(x) {
  const b = new Array(DIMENSION);
  for (let i = 0; i < DIMENSION; i += 1) {
    b[i] = x[(i + DIMENSION - 1) % DIMENSION] !== x[(i + 1) % DIMENSION] ? 1 : 0;
  }
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

const args = process.argv.slice(2);
if (args.length === 0) {
  fail("missing enumeration output location");
  process.exit(1);
}

const wanted = loadBinding();
if (!wanted) {
  fail("binding unavailable");
  process.exit(1);
}

let recordBytes;
try {
  recordBytes = fs.readFileSync(path.join(root, RECORD));
} catch {
  fail("record unreadable");
  process.exit(1);
}
if (shaHex(recordBytes) !== wanted) {
  fail("record binding mismatch");
  process.exit(1);
}

let record;
try {
  record = JSON.parse(recordBytes.toString("utf8"));
} catch {
  fail("record parse");
  process.exit(1);
}
if (record.candidateFingerprint !== EXPECTED_FINGERPRINT) {
  fail("record fingerprint mismatch");
  process.exit(1);
}

const seq = record.runSpace.dRunSequence;
if (!Array.isArray(seq) || seq.length !== DIMENSION) {
  fail("record sequence shape");
  process.exit(1);
}
const target = peakSet(seq.map(Number));

let outcome;
try {
  outcome = JSON.parse(fs.readFileSync(args[0], "utf8"));
} catch {
  fail("enumeration output unreadable");
  process.exit(1);
}
if (outcome.boundaryId !== "GOV-518" || outcome.N !== TOTAL || outcome.N_orbit !== ORBIT_TOTAL) {
  console.log(JSON.stringify({ verdict: "invalid", reason: "boundary binding" }));
  process.exit(0);
}
if (outcome.visited !== ORBIT_TOTAL || !Array.isArray(outcome.classes) || outcome.classCount !== outcome.classes.length) {
  console.log(JSON.stringify({ verdict: "invalid", reason: "completion" }));
  process.exit(0);
}

const targetOrbitKeys = new Set(orbitOf(target));
const results = [];
for (let k = 0; k < outcome.classes.length; k += 1) {
  const entry = outcome.classes[k];
  const stat = runOf(entry.representative);
  const arg = peakSet(stat);
  const keys = orbitOf(arg);
  let hit = false;
  for (const key of keys) {
    if (targetOrbitKeys.has(key)) {
      hit = true;
      break;
    }
  }
  results.push({ index: k, argmax: arg, orbitSize: keys.length, matches: hit });
}

let verdict = "underdetermined";
if (outcome.classes.length === 0) {
  verdict = "invalid";
} else if (outcome.classes.length === 1) {
  verdict = results[0].matches ? "forced" : "forced_nonmatching";
}

console.log(JSON.stringify({
  boundaryId: "GOV-518",
  comparisonTarget: target,
  canonicalBinding: wanted,
  classCount: outcome.classes.length,
  results: results,
  verdict: verdict
}));
