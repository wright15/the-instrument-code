#!/usr/bin/env node
/**
 * Advisory evidence-binding validator for CONV-EVIDENCE-BINDING-001 section 3.2.
 *
 * Enforcement is advisory-first: findings are reported and the process exits 0
 * by default. `--strict` enforces the convention's content-located boundary:
 * artifacts born at or after the admission cut line (the commit that first adds
 * the ENTRY 12 marker to provenance/DECISION_LEDGER.md, located by content)
 * fail the run; pre-cut artifacts remain advisory; unresolved history is never
 * an automatic grandfathering pass. `--json` emits a deterministic report.
 *
 * Checked at this version:
 *   R1 committed-bytes bindings declared on admission receipts (recipe
 *      reproduction, byte length, recorded subject OID) over committed bytes.
 *   R2 entry-scoped ledger span bindings declared in registered binding
 *      sidecars (source, entry identity, bounds, prefix selection, digest).
 *   R3 payload identity for sidecar payload references (fingerprint
 *      recomputation over the payload's canonical core).
 *   R4 named digest recipes: implementation reference resolves to the pinned
 *      blob and range in committed history.
 *   R5 generator provenance records on machine-emitted evidence artifacts.
 *   R6 inventory registration of every registered evidence artifact in
 *      MANIFEST.json and CHECKSUMS.sha256.
 *
 * The registry is explicit and bounded: the convention's own chain, the
 * registered ledger-binding sidecars, the machine-emitted corridor artifacts
 * under orrery/src/generated, the refreshed canonical planning evidence and
 * the refreshed promotion evidence (BL-051/BL-052 refreshes, born under this
 * validator per OD-4(a)), and the Gate 3 execution receipt. Root inventory
 * envelopes retain their own schema and are consumed, not checked, here.
 */
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalText } from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const CONVENTION_ID = "CONV-EVIDENCE-BINDING-001";
export const CUT_MARKER = "## ENTRY 12 - CONV-EVIDENCE-BINDING-001 convention admission under GOV-521";
export const CUT_LEDGER_PATH = "provenance/DECISION_LEDGER.md";
export const CONVENTION_PATH = "provenance/EVIDENCE_BINDING_CONVENTION.md";
export const RECIPE_REGISTRY_PATH = "provenance/digest-recipes.json";
export const ADMISSION_RECEIPT_PATH = "qa/conventions/evidence-binding-001-admission.json";
export const LEDGER_BINDING_SIDECARS = ["qa/d4-r2-execution-receipt-ledger-binding.json"];
export const MACHINE_EMITTED_DIR = "orrery/src/generated";
export const MACHINE_EMITTED_EXTRA = ["qa/d4-r2-execution-receipt.json"];
export const CANONICAL_PLANNING_EVIDENCE = ["canonical/fivefold-incubator/twin-hub-convergence-v0.json"];
export const PROMOTION_EVIDENCE = ["qa/fivefold-engine-promotion-evidence.json"];
export const CONVENTION_CHAIN = [CONVENTION_PATH, RECIPE_REGISTRY_PATH, ADMISSION_RECEIPT_PATH];
export const GENERATOR_PATH_FIELDS = ["generator", "generatorPath"];
export const GENERATOR_DIGEST_FIELDS = ["generatorDigest", "generatorSha256"];
export const GENERATOR_ARGV_FIELDS = ["invocation", "invocationArgs", "argv"];
export const GENERATOR_TIME_FIELDS = ["generatedAt", "emitTimestamp", "timestamp", "executionTimestamp"];

export function sha256(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function tryGit(args) {
  try {
    return git(args).trim();
  } catch {
    return null;
  }
}

function tryGitBytes(args) {
  try {
    return execFileSync("git", args, { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    return null;
  }
}

function repoRelative(candidate) {
  return typeof candidate === "string" && candidate.length > 0 &&
    !path.isAbsolute(candidate) && !candidate.split("/").includes("..");
}

export function classifyFirstAppearance(firstCommit, cutCommit, isAncestor) {
  if (!firstCommit || !cutCommit) return "unresolved";
  if (firstCommit === cutCommit) return "at-cut";
  if (isAncestor(firstCommit, cutCommit)) return "pre-cut";
  return "post-cut";
}

export function enforcementOf(classification) {
  return classification === "pre-cut" ? "advisory" : "enforced";
}

export function strictExitCode(findings) {
  return findings.some((finding) => finding.enforcement === "enforced") ? 1 : 0;
}

export function verifySpanBinding(binding, ledgerBytes) {
  const problems = [];
  if (!binding || typeof binding !== "object") return ["binding is not an object"];
  if (!repoRelative(binding.artifactPath)) problems.push("artifactPath is not a repository-relative path");
  if (!Array.isArray(binding.entryIds) || binding.entryIds.length === 0 ||
      binding.entryIds.some((entryId) => typeof entryId !== "string" || entryId.length === 0)) {
    problems.push("entryIds must be a non-empty array of entry identities");
  }
  const offset = binding.spanByteOffset;
  const length = binding.spanByteLength;
  if (!Number.isInteger(offset) || offset < 0) problems.push("spanByteOffset is not a nonnegative integer");
  if (!Number.isInteger(length) || length <= 0) problems.push("spanByteLength is not a positive integer");
  if (!/^[0-9a-f]{64}$/.test(String(binding.spanPrefixSha256))) {
    problems.push("spanPrefixSha256 is not lowercase 64-hex");
  }
  if (problems.length > 0) return problems;
  const spanEnd = offset + length;
  if (spanEnd > ledgerBytes.length) {
    problems.push(`span [${offset}, ${spanEnd}) exceeds the source's ${ledgerBytes.length} bytes`);
    return problems;
  }
  const prefixDigest = sha256(ledgerBytes.subarray(0, spanEnd));
  if (prefixDigest !== binding.spanPrefixSha256) {
    problems.push(`spanPrefixSha256 mismatch: expected ${binding.spanPrefixSha256}, computed ${prefixDigest}`);
  }
  const spanText = ledgerBytes.subarray(offset, spanEnd).toString("utf8");
  for (const entryId of binding.entryIds) {
    const heading = new RegExp(`(^|\\n)## ${entryId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`);
    if (!heading.test(spanText)) {
      problems.push(`entry identity ${JSON.stringify(entryId)} heading not found within the span`);
    }
  }
  return problems;
}

export function verifyPayloadReference(payloadReference, readJsonFn) {
  const problems = [];
  if (!payloadReference || typeof payloadReference !== "object") return ["payloadReference is not an object"];
  if (!repoRelative(payloadReference.path)) problems.push("payloadReference.path is not a repository-relative path");
  if (typeof payloadReference.fingerprintField !== "string" || payloadReference.fingerprintField.length === 0) {
    problems.push("payloadReference.fingerprintField is missing");
  }
  if (problems.length > 0) return problems;
  let payload;
  try {
    payload = readJsonFn(payloadReference.path);
  } catch (error) {
    return [`payload ${payloadReference.path} unreadable: ${error.message}`];
  }
  const field = payloadReference.fingerprintField;
  if (typeof payload[field] !== "string") {
    return [`payload field ${field} missing`];
  }
  const core = { ...payload };
  delete core[field];
  const recomputed = sha256(Buffer.from(canonicalText(core), "utf8"));
  if (recomputed !== payload[field]) {
    problems.push(`payload fingerprint drift: recorded ${payload[field]}, recomputed ${recomputed}`);
  }
  return problems;
}

export function verifyRecipe(recipeId, recipe, probe) {
  const problems = [];
  if (!recipe || typeof recipe !== "object") return [`recipe ${recipeId} is not an object`];
  for (const field of ["algorithm", "input", "outputEncoding"]) {
    if (typeof recipe[field] !== "string" || recipe[field].length === 0) problems.push(`recipe ${recipeId}: ${field} missing`);
  }
  const implementation = recipe.implementation;
  if (!implementation || typeof implementation !== "object") {
    problems.push(`recipe ${recipeId}: implementation reference missing`);
    return problems;
  }
  if (!repoRelative(implementation.path)) problems.push(`recipe ${recipeId}: implementation.path invalid`);
  const range = implementation.range;
  if (!range || !Number.isInteger(range.startLine) || !Number.isInteger(range.endLine) ||
      range.startLine < 1 || range.endLine < range.startLine) {
    problems.push(`recipe ${recipeId}: implementation.range invalid`);
  }
  if (!/^[0-9a-f]{40}$/.test(String(implementation.blobOid))) {
    problems.push(`recipe ${recipeId}: implementation.blobOid is not a 40-hex object id`);
    return problems;
  }
  if (probe) {
    const type = probe.git(["cat-file", "-t", implementation.blobOid]);
    if (type !== "blob") {
      problems.push(`recipe ${recipeId}: pinned blob ${implementation.blobOid} does not resolve as a blob`);
    } else {
      const blobBytes = probe.gitBytes(["cat-file", "blob", implementation.blobOid]);
      const blobLines = blobBytes ? blobBytes.toString("utf8").split("\n") : [];
      if (blobLines.length < range.endLine) {
        problems.push(`recipe ${recipeId}: pinned blob has ${blobLines.length} lines; range ${range.startLine}-${range.endLine} unresolvable`);
      }
      const occurrences = probe.git(["log", "--find-object=" + implementation.blobOid, "--format=%H", "--", implementation.path]);
      if (!occurrences) {
        problems.push(`recipe ${recipeId}: pinned blob not found at ${implementation.path} in committed history`);
      }
    }
  }
  return problems;
}

export function verifyGeneratorProvenance(artifact) {
  if (!artifact || typeof artifact !== "object") return ["artifact is not an object"];
  const problems = [];
  const pathValue = GENERATOR_PATH_FIELDS.map((field) => artifact[field]).find((value) => typeof value === "string" && value.length > 0);
  const hasDigest = GENERATOR_DIGEST_FIELDS.some((field) => typeof artifact[field] === "string" && artifact[field].length > 0);
  const hasArgv = GENERATOR_ARGV_FIELDS.some((field) => artifact[field] !== undefined && artifact[field] !== null);
  const hasTime = GENERATOR_TIME_FIELDS.some((field) => typeof artifact[field] === "string" && artifact[field].length > 0);
  if (!pathValue) {
    problems.push("no generator provenance record (expected generator path, script digest at emit time, invocation arguments, timestamp)");
    return problems;
  }
  const missing = [];
  if (!hasDigest) missing.push("script digest at emit time");
  if (!hasArgv) missing.push("invocation arguments");
  if (!hasTime) missing.push("timestamp");
  if (missing.length > 0) {
    problems.push(`generator provenance incomplete: missing ${missing.join(", ")} (generator path recorded: ${pathValue})`);
  }
  return problems;
}

export function discoverRegistry() {
  const generatedDir = path.join(root, MACHINE_EMITTED_DIR);
  const generated = fs.existsSync(generatedDir)
    ? fs.readdirSync(generatedDir).filter((name) => name.endsWith(".json")).sort()
        .map((name) => `${MACHINE_EMITTED_DIR}/${name}`)
    : [];
  const machineEmitted = [...generated, ...MACHINE_EMITTED_EXTRA, ...CANONICAL_PLANNING_EVIDENCE, ...PROMOTION_EVIDENCE].filter((value, index, all) => all.indexOf(value) === index).sort();
  const all = [...CONVENTION_CHAIN, ...LEDGER_BINDING_SIDECARS, ...machineEmitted].sort();
  return { conventionChain: [...CONVENTION_CHAIN], ledgerBindingSidecars: [...LEDGER_BINDING_SIDECARS], machineEmitted, canonicalPlanningEvidence: [...CANONICAL_PLANNING_EVIDENCE], promotionEvidence: [...PROMOTION_EVIDENCE], all };
}

export function resolveCutLine() {
  const output = tryGit(["log", "--reverse", "-S", CUT_MARKER, "--format=%H", "--", CUT_LEDGER_PATH]);
  if (!output) return null;
  const commits = output.split("\n").filter(Boolean);
  return commits.length > 0 ? commits[0] : null;
}

export function firstAppearance(relativePath) {
  const output = tryGit(["log", "--follow", "--diff-filter=A", "--format=%H", "--", relativePath]);
  if (!output) return null;
  const commits = output.split("\n").filter(Boolean);
  return commits.length > 0 ? commits[commits.length - 1] : null;
}

export function runValidation({ probeGitBytes = tryGitBytes } = {}) {
  const checks = [];
  const findings = [];
  const record = (rule, subject, problems, detail) => {
    if (problems.length === 0) {
      checks.push({ rule, subject, status: "PASS", detail });
    } else {
      for (const problem of problems) {
        findings.push({ rule, subject, detail: problem });
        checks.push({ rule, subject, status: "FINDING", detail: problem });
      }
    }
  };

  const registry = discoverRegistry();
  const cutCommit = resolveCutLine();

  const classification = {};
  for (const artifactPath of registry.all) {
    const first = firstAppearance(artifactPath);
    const classify = (ancestor) => {
      try {
        execFileSync("git", ["merge-base", "--is-ancestor", ancestor.ancestor, ancestor.descendant], { cwd: root, stdio: ["ignore", "ignore", "ignore"] });
        return true;
      } catch {
        return false;
      }
    };
    classification[artifactPath] = classifyFirstAppearance(first, cutCommit, (ancestor, descendant) => classify({ ancestor, descendant }));
  }

  const ledgerBytes = fs.readFileSync(path.join(root, CUT_LEDGER_PATH));

  const recipes = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, RECIPE_REGISTRY_PATH), "utf8")).recipes || {};
    } catch {
      return null;
    }
  })();

  if (!recipes) {
    findings.push({ rule: "R4", subject: RECIPE_REGISTRY_PATH, detail: "recipe registry unreadable" });
  } else {
    for (const [recipeId, recipe] of Object.entries(recipes).sort(([a], [b]) => (a < b ? -1 : 1))) {
      const problems = verifyRecipe(recipeId, recipe, { git: (args) => tryGit(args), gitBytes: (args) => probeGitBytes(args) });
      record("R4", recipeId, problems, `recipe ${recipeId} resolves its pinned implementation reference`);
    }
  }

  const receipt = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.join(root, ADMISSION_RECEIPT_PATH), "utf8"));
    } catch {
      return null;
    }
  })();

  if (!receipt) {
    findings.push({ rule: "R1", subject: ADMISSION_RECEIPT_PATH, detail: "admission receipt unreadable" });
  } else {
    for (const [label, binding] of [["convention", receipt.convention], ["registry", receipt.registry]]) {
      const problems = [];
      if (!binding || typeof binding !== "object") {
        problems.push("binding missing");
      } else {
        if (!repoRelative(binding.path)) problems.push("binding.path invalid");
        const declaredRecipes = Array.isArray(binding.recipes)
          ? binding.recipes
          : typeof binding.recipe === "string" ? [binding.recipe] : [];
        if (declaredRecipes.length === 0) problems.push("no digest recipe declared");
        for (const recipeId of declaredRecipes) {
          if (recipes && !(recipeId in recipes)) problems.push(`recipe ${recipeId} not registered`);
          if (recipeId !== "raw-bytes-sha256") problems.push(`recipe ${recipeId} unsupported by this validator version`);
        }
        if (problems.length === 0) {
          const oid = tryGit(["rev-parse", `HEAD:${binding.path}`]);
          const committed = oid ? probeGitBytes(["cat-file", "blob", oid]) : null;
          if (!oid || !committed) {
            problems.push(`committed bytes at ${binding.path} unresolved`);
          } else {
            if (binding.blobOid && oid !== binding.blobOid) {
              problems.push(`recorded blobOid ${binding.blobOid} does not match HEAD blob ${oid}`);
            }
            const digest = sha256(committed);
            if (digest !== binding.sha256) problems.push(`digest mismatch: recorded ${binding.sha256}, computed ${digest}`);
            if (binding.byteLength !== committed.length) {
              problems.push(`byteLength mismatch: recorded ${binding.byteLength}, computed ${committed.length}`);
            }
          }
        }
      }
      const recipeLabel = binding && (Array.isArray(binding.recipes) ? binding.recipes.join(", ") : binding.recipe);
      record("R1", binding && binding.path ? binding.path : label, problems,
        binding && binding.sha256 && recipeLabel
          ? `committed bytes reproduce ${binding.sha256} via ${recipeLabel}`
          : "binding declared");
    }
  }

  for (const sidecarPath of LEDGER_BINDING_SIDECARS) {
    let sidecar;
    try {
      sidecar = JSON.parse(fs.readFileSync(path.join(root, sidecarPath), "utf8"));
    } catch (error) {
      findings.push({ rule: "R2", subject: sidecarPath, detail: `sidecar unreadable: ${error.message}` });
      continue;
    }
    const bindings = sidecar.evidenceBindings && typeof sidecar.evidenceBindings === "object" ? sidecar.evidenceBindings : {};
    const bindingNames = Object.keys(bindings).sort();
    if (bindingNames.length === 0) {
      findings.push({ rule: "R2", subject: sidecarPath, detail: "no evidenceBindings declared" });
    }
    for (const name of bindingNames) {
      const binding = bindings[name];
      const subject = `${sidecarPath}#${name}`;
      let problems;
      if (!binding || binding.artifactPath !== CUT_LEDGER_PATH) {
        problems = ["binding does not target the decision ledger path consumed by this registry"];
      } else {
        problems = verifySpanBinding(binding, ledgerBytes);
      }
      const spanDetail = binding && Number.isInteger(binding.spanByteOffset) && Number.isInteger(binding.spanByteLength)
        ? `span [${binding.spanByteOffset}, ${binding.spanByteOffset + binding.spanByteLength}) over ${Array.isArray(binding.entryIds) ? binding.entryIds.join(", ") : "(no entryIds)"}`
        : "span binding declared";
      record("R2", subject, problems, spanDetail);
    }
    if (sidecar.payloadReference) {
      const problems = verifyPayloadReference(sidecar.payloadReference, (relativePath) =>
        JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")));
      record("R3", sidecar.payloadReference.path, problems,
        `payload identity ${sidecar.payloadReference.fingerprintField} reproduces`);
    }
  }

  for (const artifactPath of registry.machineEmitted) {
    let artifact;
    try {
      artifact = JSON.parse(fs.readFileSync(path.join(root, artifactPath), "utf8"));
    } catch (error) {
      findings.push({ rule: "R5", subject: artifactPath, detail: `artifact unreadable: ${error.message}` });
      continue;
    }
    const problems = verifyGeneratorProvenance(artifact);
    if (problems.length === 0) {
      const generatorPath = GENERATOR_PATH_FIELDS.map((field) => artifact[field]).find((value) => typeof value === "string");
      if (generatorPath && !fs.existsSync(path.join(root, generatorPath))) {
        problems.push(`recorded generator path ${generatorPath} does not resolve`);
      }
    }
    record("R5", artifactPath, problems, "generator provenance record present");
  }

  const manifestIndex = new Map();
  const checksumsIndex = new Map();
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, "MANIFEST.json"), "utf8"));
    for (const file of manifest.files || []) manifestIndex.set(file.path, file);
  } catch {
    findings.push({ rule: "R6", subject: "MANIFEST.json", detail: "manifest unreadable" });
  }
  try {
    const lines = fs.readFileSync(path.join(root, "CHECKSUMS.sha256"), "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([0-9a-f]{64}) {2}(.+)$/);
      if (match) checksumsIndex.set(match[2], match[1]);
    }
  } catch {
    findings.push({ rule: "R6", subject: "CHECKSUMS.sha256", detail: "checksums unreadable" });
  }

  const registrationProblems = [];
  for (const artifactPath of registry.all) {
    const problems = [];
    const worktreeBytes = fs.existsSync(path.join(root, artifactPath)) ? fs.readFileSync(path.join(root, artifactPath)) : null;
    if (!worktreeBytes) {
      problems.push("artifact missing on disk");
    }
    const manifestEntry = manifestIndex.get(artifactPath);
    if (!manifestEntry) problems.push("not registered in MANIFEST.json");
    const checksum = checksumsIndex.get(artifactPath);
    if (!checksum) problems.push("not registered in CHECKSUMS.sha256");
    if (worktreeBytes) {
      const digest = sha256(worktreeBytes);
      if (manifestEntry && manifestEntry.sha256 !== digest) problems.push("MANIFEST.json digest mismatch");
      if (manifestEntry && manifestEntry.bytes !== worktreeBytes.length) problems.push("MANIFEST.json byteLength mismatch");
      if (checksum && checksum !== digest) problems.push("CHECKSUMS.sha256 digest mismatch");
    }
    if (problems.length > 0) {
      registrationProblems.push({ artifactPath, problems });
      for (const problem of problems) findings.push({ rule: "R6", subject: artifactPath, detail: problem });
    }
  }

  const classificationCounts = { "pre-cut": 0, "at-cut": 0, "post-cut": 0, unresolved: 0 };
  for (const value of Object.values(classification)) classificationCounts[value] += 1;

  for (const finding of findings) {
    const direct = classification[finding.subject];
    const bySidecar = classification[String(finding.subject).split("#")[0]];
    const byRule = finding.rule === "R4" ? classification[RECIPE_REGISTRY_PATH]
      : finding.rule === "R1" ? classification[ADMISSION_RECEIPT_PATH]
      : undefined;
    finding.classification = direct || bySidecar || byRule || "unresolved";
    finding.enforcement = enforcementOf(finding.classification);
  }

  return {
    conventionId: CONVENTION_ID,
    cutLine: {
      resolved: Boolean(cutCommit),
      commit: cutCommit,
      ledgerPath: CUT_LEDGER_PATH,
      marker: CUT_MARKER,
      method: "first commit adding the ENTRY 12 marker to the decision ledger (content-located per section 3.3)",
    },
    registry,
    recipes: recipes ? Object.keys(recipes).sort() : [],
    checks,
    findings,
    classification,
    classificationCounts,
    registration: {
      registered: registry.all.length - registrationProblems.length,
      total: registry.all.length,
    },
  };
}

function renderText(report, strict) {
  const lines = [];
  lines.push(`evidence-binding validator - ${CONVENTION_ID} section 3.2 (${strict ? "strict" : "advisory"})`);
  if (report.cutLine.resolved) {
    lines.push(`cut line: ${report.cutLine.commit} (first addition of the ENTRY 12 marker in ${report.cutLine.ledgerPath})`);
  } else {
    lines.push("cut line: UNRESOLVED (history traversal failed; all classifications unresolved)");
  }
  lines.push(`registry: ${report.registry.all.length} artifacts (${report.registry.conventionChain.length} convention-chain, ${report.registry.ledgerBindingSidecars.length} ledger-binding sidecar, ${report.registry.machineEmitted.length} machine-emitted)`);
  lines.push(`recipes: ${report.recipes.join(", ") || "(none)"}`);
  lines.push("");
  const ruleTitles = {
    R1: "R1 committed-bytes bindings",
    R2: "R2 entry-scoped ledger bindings",
    R3: "R3 payload/provenance separation",
    R4: "R4 named digest recipes",
    R5: "R5 generator provenance",
    R6: "R6 receipts registered at birth",
  };
  for (const rule of ["R1", "R2", "R3", "R4", "R5", "R6"]) {
    const ruleChecks = report.checks.filter((check) => check.rule === rule);
    const ruleFindings = report.findings.filter((finding) => finding.rule === rule);
    if (rule === "R6") {
      lines.push(`${ruleTitles[rule]} (${report.registration.registered}/${report.registration.total} registered)`);
    } else {
      lines.push(`${ruleTitles[rule]} (${ruleChecks.length} checked, ${ruleFindings.length} findings)`);
    }
    for (const check of ruleChecks) {
      if (check.status === "PASS") {
        lines.push(`  PASS    ${check.subject}: ${check.detail}`);
      }
    }
    for (const finding of ruleFindings) {
      lines.push(`  ${finding.enforcement === "enforced" ? "ENFORCE" : "ADVISORY"} ${finding.subject}: ${finding.detail} [${finding.classification}]`);
    }
  }
  lines.push("");
  lines.push(`classification: pre-cut ${report.classificationCounts["pre-cut"]}, at-cut ${report.classificationCounts["at-cut"]}, post-cut ${report.classificationCounts["post-cut"]}, unresolved ${report.classificationCounts.unresolved}`);
  const enforced = report.findings.filter((finding) => finding.enforcement === "enforced").length;
  const passed = report.checks.filter((check) => check.status === "PASS").length;
  lines.push(`summary: ${report.checks.length} checks, ${passed} PASS, ${report.findings.length} findings (${enforced} enforced under --strict)`);
  return lines.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const strict = args.includes("--strict");
  const json = args.includes("--json");
  let report;
  try {
    report = runValidation();
  } catch (error) {
    console.error(`evidence-binding validator internal error: ${error.stack || error.message}`);
    process.exit(2);
  }
  const reportWithMode = { ...report, mode: strict ? "strict" : "advisory" };
  if (json) {
    console.log(JSON.stringify(reportWithMode, null, 2));
  } else {
    console.log(renderText(report, strict));
  }
  if (strict) {
    const code = strictExitCode(report.findings);
    process.exit(code);
  }
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
