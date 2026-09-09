// GOV-519 in-memory live-value suite (W5). Suite-scoped canonical read
// authority per CR-6: at test runtime, read the fingerprint-verified canonical
// artifacts, compute the true-value set and its registered transform-family
// images (complements, per-tier differences, reversals, reorderings) in
// memory only, and scan the enumerator/input surfaces for matches.
//
// This suite persists nothing: it writes no files (stdout report only, and
// the report carries counts and digests, never matched content). The
// enumerator itself never reads canonical artifacts (enforced by the closure
// check). True values below are derived at runtime from canonical bytes; no
// observed literal is embedded in this file.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const CANONICAL_RECORD = "canonical/fivefold-incubator/d-shadow-complement-span-v0.json";
const EXPECTED_CANDIDATE_FINGERPRINT = "8c2416b8f51f8ae8cdb0fc9f2490beeb9e3cc49f435be7d992f55f5f7c122cb8";

// Production/input surfaces scanned for true-value matches. The enumerator
// surface carries the strict zero-match policy. The comparison entry source
// is scanned under its own role-aware policy (see COMPARISON_SCOPE): it must
// derive the observed side at runtime, so identifier-class vocabulary for the
// registered record fields is expected by role; true integers and true
// sequences must still be zero.
const LIVE_SCOPE = ["scripts/run-gov518-enumeration.mjs"];
const COMPARISON_SCOPE = ["scripts/compare-gov518-outcome.mjs"];
const COMPARISON_ALLOWED_KINDS = ["observation-vocabulary"];

// Observation-side vocabulary needles (identifier class per CR-5: artifact
// fields, relation names, ledger/record ids that the boundary declares
// comparison-side only). Matched case-sensitively except where noted.
const STRING_NEEDLES = [
  "dRunSequence",
  "runSpace",
  "tierSummaries",
  "d5CourtRun",
  "twinOuterOfficeIntersection",
  "complementSpan",
  "maxRunLength",
  "SEAT_CONTACT",
  "GOVERNS",
  "CONSTRUCTS",
  "OBS-014",
  "OBS-018",
  "OBS-019",
  "OBS-020",
  "GOV-514",
  "GOV-516",
  "5-35",
  "7-35",
  "7-34",
  "7-33",
];
const CASELESS_NEEDLES = ["maxrun", "complement("];

function sha256Hex(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

// Fingerprint-verified canonical read. Verifies the embedded candidate
// fingerprint and the CHECKSUMS.sha256 byte binding before deriving anything.
function readVerifiedCanonical(failures) {
  let bytes;
  try {
    bytes = fs.readFileSync(path.join(root, CANONICAL_RECORD));
  } catch (error) {
    failures.push({ check: "canonical-present", file: CANONICAL_RECORD, error: String(error?.message ?? error) });
    return null;
  }
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    failures.push({ check: "canonical-schema", file: CANONICAL_RECORD, error: String(error?.message ?? error) });
    return null;
  }
  if (parsed?.candidateFingerprint !== EXPECTED_CANDIDATE_FINGERPRINT) {
    failures.push({ check: "canonical-fingerprint", file: CANONICAL_RECORD, error: "candidate fingerprint mismatch" });
    return null;
  }
  try {
    const checksums = fs.readFileSync(path.join(root, "CHECKSUMS.sha256"), "utf8");
    const line = checksums.split("\n").find((entry) => entry.endsWith(`  ${CANONICAL_RECORD}`));
    const expected = line?.slice(0, 64);
    if (expected !== sha256Hex(bytes)) {
      failures.push({ check: "canonical-binding", file: CANONICAL_RECORD, error: "CHECKSUMS byte binding mismatch" });
      return null;
    }
  } catch (error) {
    failures.push({ check: "canonical-binding", file: CANONICAL_RECORD, error: String(error?.message ?? error) });
    return null;
  }
  return parsed;
}

// Derive the true-value needle set in memory: distinctive integer literals
// (>=100 to avoid structural-constant collisions), observation vocabulary,
// and full-sequence encodings of the true sequences plus every registered
// transform-family image (complement, per-tier difference, reversal,
// reordering). Nothing is written anywhere.
function deriveNeedles(canonical) {
  const intValues = new Set();
  const collect = (value) => {
    if (typeof value === "number" && Number.isInteger(value) && value >= 100) intValues.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object") Object.values(value).forEach(collect);
  };
  collect(canonical?.runSpace);
  collect(canonical?.records);

  const sequences = [];
  const runSpace = canonical?.runSpace;
  if (Array.isArray(runSpace?.dRunSequence)) sequences.push(runSpace.dRunSequence.map(Number));
  if (Array.isArray(runSpace?.tierSummaries)) {
    sequences.push(runSpace.tierSummaries.map((row) => Number(row.maxRunLength)));
  }
  const masks = [];
  const pushMasks = (value) => {
    if (typeof value === "number" && Number.isInteger(value) && value >= 100) masks.push(value);
  };
  for (const record of canonical?.records ?? []) {
    pushMasks(record?.anchorMask);
    pushMasks(record?.complementMask);
    pushMasks(record?.stateId);
  }
  if (masks.length > 0) sequences.push(masks);

  const sequenceNeedles = [];
  const encodeAll = (sequence) => [JSON.stringify(sequence), sequence.join(","), sequence.join(", "), sequence.join(" ")];
  for (const sequence of sequences) {
    const n = sequence.length;
    if (n === 0) continue;
    const images = {
      base: sequence,
      complement11: sequence.map((v) => 11 - v),
      complement4095: sequence.map((v) => 4095 ^ v),
      difference: sequence.map((_, i) => sequence[(i + 1) % n] - sequence[i]),
      reversal: [...sequence].reverse(),
      reordering: [3, 4, 5, 6, 0, 1, 2].slice(0, n).map((p) => sequence[p % n]),
    };
    for (const [kind, image] of Object.entries(images)) {
      for (const encoding of encodeAll(image)) {
        if (encoding.length > 0) sequenceNeedles.push({ kind, encoding });
      }
    }
  }
  return { intValues: [...intValues].sort((a, b) => a - b), sequenceNeedles };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Scan one text surface. Returns match descriptors without matched content.
export function scanSurface(text, needles) {
  const matches = [];
  for (const needle of STRING_NEEDLES) {
    if (text.includes(needle)) matches.push({ kind: "observation-vocabulary" });
  }
  for (const needle of CASELESS_NEEDLES) {
    if (text.toLowerCase().includes(needle)) matches.push({ kind: "observation-vocabulary-folded" });
  }
  for (const value of needles.intValues) {
    const pattern = new RegExp(`(?<![A-Za-z0-9_$])${escapeRegExp(String(value))}(?![A-Za-z0-9_$])`);
    if (pattern.test(text)) matches.push({ kind: "true-integer" });
  }
  for (const { kind, encoding } of needles.sequenceNeedles) {
    if (text.includes(encoding)) matches.push({ kind: `true-sequence-${kind}` });
  }
  return matches;
}

// Importable entry point for harness/matrix drivers: verified read + in-memory
// derivation, throwing on verification failure. Never writes.
export function loadLiveNeedles() {
  const failures = [];
  const canonical = readVerifiedCanonical(failures);
  if (!canonical) {
    throw new Error(`canonical verification failed: ${JSON.stringify(failures)}`);
  }
  return { canonical, needles: deriveNeedles(canonical) };
}

const isMain = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (!isMain) {
  // Imported for in-memory scanning only; the CLI below does not run.
} else {
const arguments_ = process.argv.slice(2);
const failures = [];
const canonical = readVerifiedCanonical(failures);
if (!canonical) {
  fs.writeFileSync(1, `${JSON.stringify({ verdict: "FAIL", mode: "live", failures }, null, 2)}\n`);
  process.exit(1);
}
const needles = deriveNeedles(canonical);
const scopeReport = [];
for (const relativePath of LIVE_SCOPE) {
  let text;
  try {
    text = fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push({ check: "scope-present", file: relativePath, error: String(error?.message ?? error) });
    continue;
  }
  const matches = scanSurface(text, needles);
  const kinds = [...new Set(matches.map((m) => m.kind))].sort();
  scopeReport.push({ file: relativePath, matches: matches.length, kinds, policy: "strict-zero" });
  if (matches.length > 0) {
    failures.push({ check: "live-true-value", file: relativePath, kinds });
  }
}
for (const relativePath of COMPARISON_SCOPE) {
  let text;
  try {
    text = fs.readFileSync(path.join(root, relativePath), "utf8");
  } catch (error) {
    failures.push({ check: "scope-present", file: relativePath, error: String(error?.message ?? error) });
    continue;
  }
  const matches = scanSurface(text, needles);
  const kinds = [...new Set(matches.map((m) => m.kind))].sort();
  const forbidden = matches.filter((m) => !COMPARISON_ALLOWED_KINDS.includes(m.kind));
  const forbiddenKinds = [...new Set(forbidden.map((m) => m.kind))].sort();
  scopeReport.push({ file: relativePath, matches: matches.length, kinds, policy: "comparison-role", allowedKinds: COMPARISON_ALLOWED_KINDS, forbiddenMatches: forbidden.length, forbiddenKinds });
  if (forbidden.length > 0) {
    failures.push({ check: "live-true-value", file: relativePath, kinds: forbiddenKinds });
  }
}

// Decoy-synthecity proof (in memory): no decoy numeric or needle value may
// intersect the true set. Decoys are synthetic stand-ins, never observations.
let decoyNames = [];
try {
  decoyNames = fs.readdirSync(path.join(root, "tests/gov_518"))
    .filter((name) => name.startsWith("decoy-") && name.endsWith(".json"))
    .sort();
} catch (error) {
  failures.push({ check: "decoy-corpus-present", error: String(error?.message ?? error) });
}
const trueInts = new Set(needles.intValues);
let decoyTrueHits = 0;
for (const name of decoyNames) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(root, "tests/gov_518", name), "utf8"));
  } catch (error) {
    failures.push({ check: "decoy-readable", file: name, error: String(error?.message ?? error) });
    continue;
  }
  const numbers = [...(parsed.baseSequence ?? []), ...(parsed.numericNeedles ?? [])].map(Number);
  for (const value of numbers) {
    if (trueInts.has(value)) decoyTrueHits += 1;
  }
  const text = JSON.stringify(parsed);
  for (const needle of STRING_NEEDLES) {
    if (needle.startsWith("OBS-") || needle.startsWith("GOV-")) {
      if (text.includes(needle)) decoyTrueHits += 1;
    }
  }
}
scopeReport.push({ file: "tests/gov_518/decoy-*.json", matches: decoyTrueHits, kinds: decoyTrueHits > 0 ? ["decoy-carries-true-value"] : [] });
if (decoyTrueHits > 0) {
  failures.push({ check: "decoy-synthecity", error: "a decoy intersects the true set" });
}

const report = {
  verdict: failures.length === 0 ? "PASS" : "FAIL",
  mode: "live",
  canonical: { record: CANONICAL_RECORD, fingerprint: EXPECTED_CANDIDATE_FINGERPRINT, binding: "CHECKSUMS.sha256" },
  needleStats: {
    trueIntegers: needles.intValues.length,
    sequenceNeedles: needles.sequenceNeedles.length,
    stringNeedles: STRING_NEEDLES.length + CASELESS_NEEDLES.length,
  },
  scope: scopeReport,
  persistedFiles: [],
  failures,
};

if (!arguments_.includes("--quiet")) {
  fs.writeFileSync(1, `${JSON.stringify(report, null, 2)}\n`);
}
process.exitCode = failures.length > 0 ? 1 : 0;
} // end isMain
