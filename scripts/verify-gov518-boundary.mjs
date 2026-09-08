// GOV-519 Phase 1 — static input_reach_boundary check for the GOV-518
// execution path. Fails closed if the production enumerator statically
// reaches R7-excluded material; confirms every tamper fixture would be
// rejected if injected into the enumeration input path.
//
// Production surface under test: scripts/run-gov518-enumeration.mjs only.
// This verifier (and the blindness harness) are test entry points and may
// read the quarantined corpus in qa/fixtures/gov-518 in order to assert
// rejection. The production file itself must not.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

const PRODUCTION_FILES = ["scripts/run-gov518-enumeration.mjs"];
const FIXTURE_DIRECTORY = "qa/fixtures/gov-518";

// Each rule names one R7-excluded surface. A match inside a production file
// is a boundary violation; a match inside a tamper fixture is the expected
// reject signal for that fixture.
const RULES = [
  { id: "qa-read-surface", pattern: /qa\//, note: "production must not reach the quarantined corpus" },
  { id: "comparison-artifact-path", pattern: /canonical\//, note: "comparison artifacts are a separate entry point" },
  { id: "derived-shadow-artifact", pattern: /d-shadow/, note: "derived shadow artifacts are excluded inputs" },
  { id: "run-space-fields", pattern: /runSpace|dRunSequence|tierSummaries/, note: "run-space frame fields are comparison side only" },
  { id: "contact-graph-relations", pattern: /SEAT_CONTACT|GOVERNS|CONSTRUCTS/, note: "contact and construction relations are excluded" },
  { id: "court-position-literals", pattern: /\b661\b|\b677\b|\b1189\b|\b1193\b|\b1321\b/, note: "observed position literals are excluded" },
  { id: "intersection-literals", pattern: /\b2383\b|\b3667\b/, note: "observed intersection literals are excluded" },
  { id: "declared-class-literals", pattern: /5-35|7-35|7-34|7-33/, note: "declared class literals are excluded" },
  { id: "observation-ledger-ids", pattern: /OBS-014|OBS-018|OBS-019|OBS-020/, note: "observation-side records are excluded (OBS-008 remains the K source)" },
  { id: "scalar-input-ids", pattern: /GOV-514|GOV-516/, note: "scalar and receipt inputs are excluded" },
  { id: "complement-form", pattern: /complement/, note: "complement re-encodings are excluded" },
  { id: "observed-run-word", pattern: /maxrun/i, note: "observed run vocabulary is excluded from the input path" },
  { id: "quarantine-path", pattern: /fixtures\//, note: "production must not name the quarantine path" },
  { id: "mask-vocabulary", pattern: /mask/i, note: "mask vocabulary is excluded from the input path" },
  { id: "office-result-word", pattern: /office/i, note: "office results are excluded inputs" },
  { id: "declared-signature-word", pattern: /signature/i, note: "declared-contact signatures are excluded" },
];

function scanText(relativePath, text) {
  const lines = text.split(/\r?\n/);
  const hits = [];
  for (const rule of RULES) {
    const flagged = [];
    for (let index = 0; index < lines.length; index += 1) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(lines[index])) {
        flagged.push({ line: index + 1, excerpt: lines[index].slice(0, 160) });
      }
    }
    if (flagged.length > 0) {
      hits.push({ rule: rule.id, note: rule.note, matches: flagged });
    }
  }
  return hits;
}

const failures = [];
const productionReport = [];

for (const relativePath of PRODUCTION_FILES) {
  const absolutePath = path.join(root, relativePath);
  let text;
  try {
    text = fs.readFileSync(absolutePath, "utf8");
  } catch (error) {
    failures.push({ check: "production-file-present", file: relativePath, error: String(error?.message ?? error) });
    continue;
  }
  const hits = scanText(relativePath, text);
  productionReport.push({ file: relativePath, violations: hits.length, hits });
  for (const hit of hits) {
    failures.push({ check: "input-reach-boundary", file: relativePath, rule: hit.rule, matches: hit.matches });
  }
}

const fixtureReport = [];
let fixtureDirectory;
try {
  fixtureDirectory = fs.readdirSync(path.join(root, FIXTURE_DIRECTORY));
} catch (error) {
  failures.push({ check: "fixture-directory-present", directory: FIXTURE_DIRECTORY, error: String(error?.message ?? error) });
  fixtureDirectory = [];
}

const tamperFiles = fixtureDirectory.filter((name) => name.startsWith("tamper-") && name.endsWith(".json")).sort();
if (tamperFiles.length === 0) {
  failures.push({ check: "tamper-corpus-present", directory: FIXTURE_DIRECTORY, error: "no tamper-*.json fixtures" });
}

for (const name of tamperFiles) {
  const relativePath = `${FIXTURE_DIRECTORY}/${name}`;
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch (error) {
    failures.push({ check: "tamper-fixture-schema", file: relativePath, error: String(error?.message ?? error) });
    continue;
  }
  if (parsed?.expectedVerdict !== "reject") {
    failures.push({ check: "tamper-fixture-schema", file: relativePath, error: "expectedVerdict must be reject" });
    continue;
  }
  const hits = scanText(relativePath, JSON.stringify(parsed));
  const matchedRules = hits.map((hit) => hit.rule);
  fixtureReport.push({ file: relativePath, wouldReject: matchedRules.length > 0, matchedRules });
  if (matchedRules.length === 0) {
    failures.push({ check: "tamper-fixture-proves-rejection", file: relativePath, error: "fixture carries no excludable marker" });
  }
}

const report = {
  verdict: failures.length === 0 ? "PASS" : "FAIL",
  boundary: "GOV-518 R7",
  production: productionReport,
  fixtures: fixtureReport,
  failures,
};

fs.writeFileSync(1, `${JSON.stringify(report, null, 2)}\n`);
process.exitCode = failures.length > 0 ? 1 : 0;
