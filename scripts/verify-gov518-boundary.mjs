// GOV-519 redesigned checker — static input_reach_boundary gate for the
// GOV-518 execution path (CR-1–CR-8). Replaces the pre-redesign true-value
// rule table entirely (recorded finding: the staged table embedded observed
// values). All detectors are fail-closed: any detector red = pre-flight red.
//
// Detectors:
//   (a) import-closure: enumerator closure is a single file with zero project
//       imports; hard-fail on dynamic import(), require, and any
//       fs/path/child_process construct.
//   (b) input_reach_boundary reachability guard: no reachable path from the
//       enumerator entry into tests/gov_518/ (or the canonical comparison
//       surface, which is suite-scoped per CR-6).
//   (c) AST integer-literal allowlist scan: every integer literal in
//       enumerator source must appear in the committed structural allowlist
//       (tests/gov_518/structural-allowlist.json), each with a one-line
//       structural justification. Unlisted literal fails. The allowlist is
//       structure-derived only, never enumerator-derived.
//   (d) decoy literal scanner: driven by the committed decoy corpus
//       (tests/gov_518/decoy-*.json) and the registered transform families
//       (complement, per-tier difference, reversal, reordering). Flags any
//       occurrence of a decoy value or decoy-transform image in any in-scope
//       source file. Never encodes true values.
//   (e) argv allowlist: enumerator accepted arguments are pathless,
//       allowlisted tokens only.
//   (f) --adversarial-self-test: plants a temp copy of the enumerator
//       containing a decoy literal (never a true value), asserts rejection,
//       deletes, never commits. Unconditional in every pre-flight.
//
// Identifier-class needles retained per CR-5 with justification: input-surface
// path needles (tests/gov_518, canonical comparison path) name the boundary's
// own input surface, not observed content. No observed numeric literal, run
// word, mask, class label, or ledger id is embedded in this file.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

const PRODUCTION_FILES = ["scripts/run-gov518-enumeration.mjs"];
const ALLOWLIST_RELATIVE = "tests/gov_518/structural-allowlist.json";
const DECOY_GLOB_DIRECTORY = "tests/gov_518";

// Pathless argv tokens the enumerator may accept. Any other --token (in
// particular any path-taking option) is a violation.
const ARGV_ALLOWLIST = ["--enumerate", "--preflight-only", "--help", "-h"];

// Reachability needles (CR-5 identifier class: the boundary's own input
// surface vocabulary). A match in enumerator source is a boundary violation.
const REACHABILITY_NEEDLES = [
  "tests/gov_518",
  "tests\\gov_518",
  "gov_518",
  "qa/fixtures/gov-518",
  "fixtures/gov-518",
  "canonical/fivefold-incubator",
  "canonical/",
];

// Default reorder permutation for the reordering family when a decoy file
// does not pin its own (rotate-by-3 on the 7-cycle).
const DEFAULT_REORDER_PERMUTATION = [3, 4, 5, 6, 0, 1, 2];
const DEFAULT_COMPLEMENT_MODULUS = 20000;

// Strip comments and string-literal contents so the integer scan approximates
// AST numeric literals (code positions only, never comment/string bytes).
function stripNonCode(text) {
  let out = "";
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    const d = text[i + 1] ?? "";
    if (c === "/" && d === "/") {
      while (i < n && text[i] !== "\n") {
        out += " ";
        i += 1;
      }
      continue;
    }
    if (c === "/" && d === "*") {
      out += "  ";
      i += 2;
      while (i < n && !(text[i] === "*" && text[i + 1] === "/")) {
        out += text[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      out += "  ";
      i += 2;
      continue;
    }
    if (c === "'" || c === '"') {
      out += " ";
      i += 1;
      while (i < n && text[i] !== c) {
        if (text[i] === "\\") {
          out += "  ";
          i += 2;
          continue;
        }
        out += text[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      out += " ";
      i += 1;
      continue;
    }
    if (c === "`") {
      out += " ";
      i += 1;
      let braceDepth = 0;
      let inExpression = false;
      while (i < n) {
        if (!inExpression && text[i] === "`") {
          out += " ";
          i += 1;
          break;
        }
        if (!inExpression && text[i] === "\\") {
          out += "  ";
          i += 2;
          continue;
        }
        if (!inExpression && text[i] === "$" && text[i + 1] === "{") {
          inExpression = true;
          braceDepth = 1;
          out += "   ";
          i += 2;
          continue;
        }
        if (inExpression) {
          if (text[i] === "{") braceDepth += 1;
          if (text[i] === "}") {
            braceDepth -= 1;
            if (braceDepth === 0) {
              inExpression = false;
              out += " ";
              i += 1;
              continue;
            }
          }
          out += text[i];
          i += 1;
          continue;
        }
        out += text[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      continue;
    }
    out += c;
    i += 1;
  }
  return out;
}

function extractIntegerLiterals(codeOnly) {
  const found = [];
  const decimal = /(?<![A-Za-z0-9_$])(0|[1-9][0-9]*)(?![A-Za-z0-9_$])/g;
  let m;
  while ((m = decimal.exec(codeOnly)) !== null) {
    found.push({ raw: m[1], value: Number.parseInt(m[1], 10), index: m.index });
  }
  const hex = /(?<![A-Za-z0-9_$])0[xX][0-9a-fA-F]+(?![A-Za-z0-9_$])/g;
  while ((m = hex.exec(codeOnly)) !== null) {
    found.push({ raw: m[0], value: Number.parseInt(m[0], 16), index: m.index });
  }
  return found.sort((a, b) => a.index - b.index);
}

function loadAllowlist(failures) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(root, ALLOWLIST_RELATIVE), "utf8"));
  } catch (error) {
    failures.push({
      check: "allowlist-present",
      file: ALLOWLIST_RELATIVE,
      error: String(error?.message ?? error),
    });
    return null;
  }
  const entries = parsed?.allowlist;
  if (!Array.isArray(entries) || entries.length === 0) {
    failures.push({ check: "allowlist-schema", file: ALLOWLIST_RELATIVE, error: "allowlist must be a non-empty array" });
    return null;
  }
  const allowed = new Map();
  for (const entry of entries) {
    if (typeof entry?.value !== "number" || !Number.isInteger(entry.value)) {
      failures.push({ check: "allowlist-schema", file: ALLOWLIST_RELATIVE, error: "every entry needs an integer value" });
      return null;
    }
    if (typeof entry?.justification !== "string" || entry.justification.trim().length === 0) {
      failures.push({ check: "allowlist-schema", file: ALLOWLIST_RELATIVE, error: `value ${entry.value} needs a one-line structural justification` });
      return null;
    }
    allowed.set(entry.value, entry.justification);
  }
  return allowed;
}

function loadDecoys(failures) {
  let names;
  try {
    names = fs.readdirSync(path.join(root, DECOY_GLOB_DIRECTORY))
      .filter((name) => name.startsWith("decoy-") && name.endsWith(".json"))
      .sort();
  } catch (error) {
    failures.push({ check: "decoy-corpus-present", directory: DECOY_GLOB_DIRECTORY, error: String(error?.message ?? error) });
    return null;
  }
  if (names.length < 4) {
    failures.push({ check: "decoy-corpus-present", directory: DECOY_GLOB_DIRECTORY, error: `need >=4 decoys, found ${names.length}` });
    return null;
  }
  const decoys = [];
  for (const name of names) {
    const relativePath = `${DECOY_GLOB_DIRECTORY}/${name}`;
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
    } catch (error) {
      failures.push({ check: "decoy-fixture-schema", file: relativePath, error: String(error?.message ?? error) });
      continue;
    }
    if (parsed?.expectedVerdict !== "reject" || parsed?.synthetic !== true || typeof parsed?.family !== "string") {
      failures.push({ check: "decoy-fixture-schema", file: relativePath, error: "decoy needs family + synthetic:true + expectedVerdict:reject" });
      continue;
    }
    if (!Array.isArray(parsed?.baseSequence) || parsed.baseSequence.length === 0) {
      failures.push({ check: "decoy-fixture-schema", file: relativePath, error: "decoy needs a non-empty baseSequence" });
      continue;
    }
    decoys.push({ file: relativePath, ...parsed });
  }
  return decoys;
}

function transformImages(decoy) {
  const base = decoy.baseSequence.map(Number);
  const n = base.length;
  const modulus = Number(decoy.complementModulus ?? DEFAULT_COMPLEMENT_MODULUS);
  const permutation = Array.isArray(decoy.reorderPermutation) ? decoy.reorderPermutation : DEFAULT_REORDER_PERMUTATION;
  const complement = base.map((v) => modulus - v);
  const difference = base.map((_, i) => base[(i + 1) % n] - base[i]);
  const reversal = [...base].reverse();
  const reordering = permutation.slice(0, n).map((p) => base[p]);
  return { complement, difference, reversal, reordering };
}

function buildDecoyNeedles(decoys) {
  const stringNeedles = [];
  const numericNeedles = [];
  const sequenceNeedles = [];
  for (const decoy of decoys) {
    for (const needle of decoy.needles ?? []) {
      if (typeof needle === "string" && needle.length > 0) {
        stringNeedles.push({ needle, family: decoy.family, fixture: decoy.file });
      }
    }
    for (const value of decoy.numericNeedles ?? []) {
      numericNeedles.push({ value: Number(value), family: decoy.family, fixture: decoy.file });
    }
    // The base sequence itself is forbidden in any standard encoding.
    const base = decoy.baseSequence.map(Number);
    for (const encoding of [JSON.stringify(base), base.join(","), base.join(" ")]) {
      sequenceNeedles.push({ encoding, family: decoy.family, fixture: decoy.file, kind: "base" });
    }
    const images = transformImages(decoy);
    for (const [kind, sequence] of Object.entries(images)) {
      for (const encoding of [JSON.stringify(sequence), sequence.join(","), sequence.join(" ")]) {
        sequenceNeedles.push({ encoding, family: decoy.family, fixture: decoy.file, kind });
      }
    }
  }
  return { stringNeedles, numericNeedles, sequenceNeedles };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function checkImportClosure(text) {
  const hits = [];
  const rules = [
    { id: "dynamic-import", pattern: /\bimport\s*\(/, note: "dynamic import() is forbidden" },
    { id: "require-call", pattern: /\brequire\s*\(/, note: "require() is forbidden" },
    { id: "project-import", pattern: /\bfrom\s+["']\.[^"']*["']/, note: "zero project imports: relative import" },
    { id: "project-import-call", pattern: /\bimport\s*\(\s*["']\.[^"']*["']/, note: "zero project imports: relative dynamic import" },
    { id: "fs-module", pattern: /\bfrom\s+["'](node:)?fs["']/, note: "fs module construct" },
    { id: "path-module", pattern: /\bfrom\s+["'](node:)?path["']/, note: "path module construct" },
    { id: "child-process-module", pattern: /child_process/, note: "child_process construct" },
    { id: "fs-use", pattern: /\bfs\s*\./, note: "fs use construct" },
    { id: "path-use", pattern: /\bpath\s*\./, note: "path use construct" },
    { id: "spawn-use", pattern: /\bspawnSync\b/, note: "child_process spawn construct" },
    { id: "exec-use", pattern: /\bexec(File)?Sync\b/, note: "child_process exec construct" },
    { id: "sync-io", pattern: /\b(readFileSync|writeFileSync|createReadStream|createWriteStream|mkdtempSync|rmSync|existsSync)\b/, note: "filesystem IO construct" },
  ];
  const lines = text.split(/\r?\n/);
  for (const rule of rules) {
    for (let index = 0; index < lines.length; index += 1) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(lines[index])) {
        hits.push({ rule: rule.id, note: rule.note, line: index + 1, excerpt: lines[index].slice(0, 160) });
        break;
      }
    }
  }
  return hits;
}

function checkReachability(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (const needle of REACHABILITY_NEEDLES) {
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].includes(needle)) {
        hits.push({ needle, line: index + 1, excerpt: lines[index].slice(0, 160) });
        break;
      }
    }
  }
  return hits;
}

function checkAllowlist(text, allowed) {
  const codeOnly = stripNonCode(text);
  const literals = extractIntegerLiterals(codeOnly);
  const unlisted = new Map();
  for (const literal of literals) {
    if (!allowed.has(literal.value)) {
      if (!unlisted.has(literal.value)) unlisted.set(literal.value, []);
      unlisted.get(literal.value).push(literal.index);
    }
  }
  return { literals: literals.length, unlisted: [...unlisted.keys()].sort((a, b) => a - b) };
}

function checkDecoys(text, needles) {
  const hits = [];
  for (const { needle, family, fixture } of needles.stringNeedles) {
    if (text.includes(needle)) {
      hits.push({ kind: "string-needle", family, fixture, marker: `needle:${family}` });
    }
  }
  for (const { value, family, fixture } of needles.numericNeedles) {
    const pattern = new RegExp(`(?<![A-Za-z0-9_$])${escapeRegExp(String(value))}(?![A-Za-z0-9_$])`);
    if (pattern.test(text)) {
      hits.push({ kind: "numeric-needle", family, fixture, marker: `numeric:${family}` });
    }
  }
  for (const { encoding, family, fixture, kind } of needles.sequenceNeedles) {
    if (encoding.length > 0 && text.includes(encoding)) {
      hits.push({ kind: `sequence-${kind}`, family, fixture, marker: `sequence:${family}:${kind}` });
    }
  }
  return hits;
}

function checkArgv(text) {
  const hits = [];
  const tokenPattern = /--[A-Za-z0-9][A-Za-z0-9-]*/g;
  const seen = new Set();
  let m;
  while ((m = tokenPattern.exec(text)) !== null) {
    seen.add(m[0]);
  }
  for (const token of [...seen].sort()) {
    if (!ARGV_ALLOWLIST.includes(token)) {
      hits.push({ token, note: token === "--out" ? "path-taking option is forbidden (pathless tokens only)" : "token is not on the argv allowlist" });
    }
  }
  // A path-taking --out value flowing into a filesystem sink is independently forbidden.
  if (/\boutPath\b/.test(text) && /\b(path\s*\.|writeFileSync|readFileSync)\b/.test(text)) {
    hits.push({ token: "--out", note: "path value reaches the filesystem surface" });
  }
  return hits;
}

// Adversarial self-test: plant a temp copy of the enumerator containing a
// decoy literal (never a true value), assert the decoy scanner rejects it,
// delete the copy, never commit it. Returns {passed, ...}.
function runSelfTest(baseText, needles) {
  const plant = needles.stringNeedles[0] ?? null;
  const numericPlant = needles.numericNeedles[0] ?? null;
  if (!plant || !numericPlant) {
    return { passed: false, error: "decoy corpus supplies no plantable needle" };
  }
  const tempPath = path.join(os.tmpdir(), `gov519-selftest-${process.pid}.mjs`);
  const planted = `${baseText}\n// adversarial self-test plant ${plant.needle}\nconst __gov519SelfTestPlant = ${numericPlant.value};\n`;
  let rejectionHits = [];
  try {
    fs.writeFileSync(tempPath, planted, "utf8");
    const staged = fs.readFileSync(tempPath, "utf8");
    rejectionHits = checkDecoys(staged, needles);
  } finally {
    try {
      fs.rmSync(tempPath, { force: true });
    } catch {
      // fall through to existence assertion below
    }
  }
  let deleted = true;
  try {
    fs.accessSync(tempPath);
    deleted = false;
  } catch {
    deleted = true;
  }
  const rejected = rejectionHits.length > 0;
  return {
    passed: rejected && deleted,
    plantedFamily: plant.family,
    rejectionHits: rejectionHits.length,
    deleted,
    committed: false,
    trueValueUsed: false,
  };
}

function resolveTarget(relativeOrAbsolute) {
  return path.isAbsolute(relativeOrAbsolute)
    ? relativeOrAbsolute
    : path.join(root, relativeOrAbsolute);
}

function scanTarget(relativePath, text, allowed, needles) {
  const closureHits = checkImportClosure(text);
  const reachHits = checkReachability(text);
  const allowlistResult = allowed ? checkAllowlist(text, allowed) : { literals: 0, unlisted: [] };
  const decoyHits = needles ? checkDecoys(text, needles) : [];
  const argvHits = checkArgv(text);
  return { closureHits, reachHits, allowlistResult, decoyHits, argvHits };
}

const arguments_ = process.argv.slice(2);
const selfTestOnly = arguments_.includes("--adversarial-self-test");
const targetIndex = arguments_.indexOf("--target");
const targetOverride = targetIndex >= 0 ? arguments_[targetIndex + 1] : null;
if (targetIndex >= 0 && !targetOverride) {
  fs.writeFileSync(1, `${JSON.stringify({ verdict: "FAIL", error: "missing value for --target" }, null, 2)}\n`);
  process.exit(1);
}

const failures = [];
const allowed = loadAllowlist(failures);
const decoys = loadDecoys(failures);
const needles = decoys ? buildDecoyNeedles(decoys) : null;
if (!allowed || !decoys || !needles) {
  fs.writeFileSync(1, `${JSON.stringify({ verdict: "FAIL", boundary: "GOV-518 R7", failures }, null, 2)}\n`);
  process.exit(1);
}

if (selfTestOnly) {
  const baseText = fs.readFileSync(path.join(root, PRODUCTION_FILES[0]), "utf8");
  const selfTest = runSelfTest(baseText, needles);
  const report = {
    verdict: selfTest.passed ? "PASS" : "FAIL",
    boundary: "GOV-518 R7",
    mode: "adversarial-self-test",
    selfTest,
    failures: selfTest.passed ? [] : [{ check: "adversarial-self-test", error: "planted decoy copy was not rejected" }],
  };
  fs.writeFileSync(1, `${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = selfTest.passed ? 0 : 1;
} else {
  const scanFiles = targetOverride ? [targetOverride] : PRODUCTION_FILES;
  const productionReport = [];
  for (const relativePath of scanFiles) {
    let text;
    try {
      text = fs.readFileSync(resolveTarget(relativePath), "utf8");
    } catch (error) {
      failures.push({ check: "production-file-present", file: relativePath, error: String(error?.message ?? error) });
      continue;
    }
    const result = scanTarget(relativePath, text, allowed, needles);
    // The self-test is unconditional in every pre-flight: it runs against
    // the production base text and must demonstrate rejection + deletion.
    let baseText = text;
    try {
      baseText = fs.readFileSync(path.join(root, PRODUCTION_FILES[0]), "utf8");
    } catch {
      baseText = text;
    }
    const selfTest = runSelfTest(baseText, needles);
    const entry = { file: relativePath, ...result, selfTest };
    productionReport.push(entry);
    for (const hit of result.closureHits) {
      failures.push({ check: "import-closure", file: relativePath, rule: hit.rule, line: hit.line });
    }
    for (const hit of result.reachHits) {
      failures.push({ check: "input-reach-boundary", file: relativePath, needle: "input-surface-path", line: hit.line });
    }
    if (result.allowlistResult.unlisted.length > 0) {
      failures.push({ check: "integer-allowlist", file: relativePath, unlisted: result.allowlistResult.unlisted });
    }
    for (const hit of result.decoyHits) {
      failures.push({ check: "decoy-literal", file: relativePath, marker: hit.marker });
    }
    for (const hit of result.argvHits) {
      failures.push({ check: "argv-allowlist", file: relativePath, token: hit.token, note: hit.note });
    }
    if (!selfTest.passed) {
      failures.push({ check: "adversarial-self-test", file: relativePath, error: "planted decoy copy was not rejected or not deleted" });
    }
  }
  const report = {
    verdict: failures.length === 0 ? "PASS" : "FAIL",
    boundary: "GOV-518 R7",
    mode: "preflight",
    allowlistEntries: allowed.size,
    decoyFixtures: decoys.length,
    decoyFamilies: [...new Set(decoys.map((d) => d.family))].sort(),
    production: productionReport.map((entry) => ({
      file: entry.file,
      closureViolations: entry.closureHits.length,
      reachabilityViolations: entry.reachHits.length,
      integerLiterals: entry.allowlistResult.literals,
      unlistedIntegers: entry.allowlistResult.unlisted,
      decoyHits: entry.decoyHits.map((hit) => hit.marker),
      argvViolations: entry.argvHits,
      selfTest: entry.selfTest.passed ? "PASS" : "FAIL",
    })),
    failures,
  };
  fs.writeFileSync(1, `${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = failures.length > 0 ? 1 : 0;
}
