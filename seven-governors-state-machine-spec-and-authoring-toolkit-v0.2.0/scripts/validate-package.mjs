import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { validateSyntax } from "@neo4j-cypher/language-support";
import {
  GOVERNORS_PATH,
  OFFICE_ORDER,
  PACKAGE_ROOT,
  loadBase,
  readYaml,
  sha256,
  validateDraft,
  validateRegistryCandidate,
  writeJson,
} from "./lib.mjs";

const checks = [];
const errors = [];
const warnings = [];

function check(id, condition, detail) {
  checks.push({ id, passed: Boolean(condition), detail });
  if (!condition) errors.push(`${id}: ${detail}`);
}

function loadJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, relativePath), "utf8"));
}

function validateJsonSchema(schemaPath, dataPath, data) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const schema = loadJson(schemaPath);
  const valid = ajv.validate(schema, data);
  check(
    `schema:${dataPath}`,
    valid,
    valid ? "passed" : JSON.stringify(ajv.errors),
  );
}

function splitCypherStatements(text) {
  const withoutComments = text
    .split(/\r?\n/)
    .map((line) => (line.trimStart().startsWith("//") ? "" : line))
    .join("\n");
  const statements = [];
  let current = "";
  let quote = null;
  let escaped = false;
  for (const character of withoutComments) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === "\\") {
      current += character;
      escaped = true;
    } else if (quote) {
      current += character;
      if (character === quote) quote = null;
    } else if (character === "'" || character === '"') {
      current += character;
      quote = character;
    } else if (character === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

const governorsBase = loadBase();
const governors = governorsBase.document.governors;
const expectedKeys = OFFICE_ORDER.map((office) => office.toLowerCase());
check(
  "governors:seven",
  Object.keys(governors).length === 7 &&
    expectedKeys.every((key) => governors[key]),
  "source/governors.yaml must contain exactly the seven expected offices.",
);

const phenomenaDoc = readYaml(
  path.join(PACKAGE_ROOT, "schemas", "physical_phenomena.yaml"),
);
const phenomena = phenomenaDoc.physical_phenomena.governor_registry;
validateJsonSchema(
  "schemas/physical-phenomena.schema.json",
  "schemas/physical_phenomena.yaml",
  phenomenaDoc,
);
check(
  "phenomena:admission-proposed",
  phenomenaDoc.physical_phenomena.admission === "proposed",
  "Phenomena material must remain explicitly proposed.",
);
check(
  "phenomena:seven",
  Object.keys(phenomena).length === 7 &&
    expectedKeys.every((key) => phenomena[key]),
  "Phenomena registry must contain exactly one record for every office key.",
);
const phenomenonIds = Object.values(phenomena).map((item) => item.phenomenon_id);
check(
  "phenomena:unique",
  new Set(phenomenonIds).size === 7,
  "Primary phenomenon IDs must be unique.",
);
for (const office of OFFICE_ORDER) {
  const key = office.toLowerCase();
  const model = phenomena[key];
  check(
    `phenomena:${key}:office`,
    model.governor_office === office,
    `${key} model must assign ${office}.`,
  );
  check(
    `phenomena:${key}:policy`,
    model.assignment_type === "exclusive_primary_descriptive_model" &&
      model.exclusivity_scope === "seven_governors_framework" &&
      model.epistemic_class === "authored_descriptive_model",
    `${office} model must preserve scoped authored assignment policy.`,
  );
  const expectedRef =
    `schemas/physical_phenomena.yaml#physical_phenomena.governor_registry.${key}`;
  check(
    `governors:${key}:phenomenon-ref`,
    governors[key].physical_extension?.physical_phenomena_ref === expectedRef,
    `${office} governors.yaml phenomenon reference must resolve to ${expectedRef}.`,
  );
}
const rayleighAssignees = Object.values(phenomena)
  .filter((item) => item.phenomenon_id === "phenomenon:rayleigh_scattering")
  .map((item) => item.governor_office);
check(
  "phenomena:rayleigh-exclusive-jupiter",
  rayleighAssignees.length === 1 && rayleighAssignees[0] === "Jupiter",
  "Rayleigh scattering must have Jupiter as its only primary assignee.",
);

const processDoc = readYaml(
  path.join(PACKAGE_ROOT, "schemas", "thermodynamic_processes.yaml"),
);
validateJsonSchema(
  "schemas/thermodynamic-processes.schema.json",
  "schemas/thermodynamic_processes.yaml",
  processDoc,
);
check(
  "process:admission-proposed",
  processDoc.thermodynamic_processes.admission === "proposed",
  "Thermodynamic-process ontology must remain explicitly proposed.",
);
const processOrder = processDoc.thermodynamic_processes.canonical_order;
check(
  "process:office-order",
  JSON.stringify(processOrder.map((item) => item.office)) ===
    JSON.stringify(OFFICE_ORDER),
  "Thermodynamic process offices must follow canonical order.",
);
for (const item of processOrder) {
  const actual =
    governors[item.office.toLowerCase()].canonical_expression
      ?.thermodynamic_function;
  check(
    `process:${item.office.toLowerCase()}:source-alignment`,
    actual === item.process,
    `${item.office} process ${item.process} must match governors.yaml (${actual}).`,
  );
}

const fivefoldDoc = readYaml(
  path.join(PACKAGE_ROOT, "schemas", "fivefold_engine.yaml"),
);
validateJsonSchema(
  "schemas/fivefold-engine.schema.json",
  "schemas/fivefold_engine.yaml",
  fivefoldDoc,
);
const fivefold = fivefoldDoc.fivefold_engine;
check(
  "court:admission-proposed",
  fivefold.admission === "proposed",
  "Fivefold material must remain explicitly proposed.",
);
const expectedVectors = ["0000", "1000", "1100", "1110", "1111"];
const expectedKappas = [0, 0.25, 0.5, 0.75, 1];
const expectedPoles = ["Mars", "Jupiter", "Venus", "Saturn"];
check(
  "court:vectors",
  JSON.stringify(fivefold.canonical_states.map((item) => item.vector)) ===
    JSON.stringify(expectedVectors),
  "Canonical Court vectors must match C0-C4.",
);
check(
  "court:kappa",
  JSON.stringify(fivefold.canonical_states.map((item) => item.kappa_court)) ===
    JSON.stringify(expectedKappas),
  "Court kappa values must be i/4.",
);
check(
  "court:pole-order",
  JSON.stringify(fivefold.pole_order.map((item) => item.governor)) ===
    JSON.stringify(expectedPoles),
  "Court pole order must be Mars, Jupiter, Venus, Saturn.",
);
for (const [index, transition] of fivefold.canonical_transitions.entries()) {
  const from = fivefold.canonical_states.find(
    (item) => item.state_id === transition.from,
  );
  const to = fivefold.canonical_states.find((item) => item.state_id === transition.to);
  const hamming = [...from.vector].filter(
    (bit, bitIndex) => bit !== to.vector[bitIndex],
  ).length;
  check(
    `court:transition:${transition.from}:${transition.to}`,
    hamming === 1 && transition.pole === expectedPoles[index],
    "Each canonical transition must change one pole in canonical order.",
  );
}
check(
  "court:mercury-controller",
  fivefold.controller.governor === "Mercury" &&
    fivefold.controller.is_binary_court_pole === false,
  "Mercury must be controller and not a binary Court pole.",
);

const algebra = readYaml(path.join(PACKAGE_ROOT, "catalog", "algebra.yaml")).algebra;
const operators = algebra.operator_families;
check("algebra:operator-count", operators.length === 15, "Expected 15 operators.");
check(
  "algebra:operator-ids",
  new Set(operators.map((operator) => operator.operator_id)).size === 15,
  "Operator IDs must be unique.",
);
const operatorIds = new Set(operators.map((operator) => operator.operator_id));
for (const operator of operators.filter((item) => item.operator_id !== "M")) {
  check(
    `algebra:${operator.operator_id}:inverse`,
    operatorIds.has(operator.inverse),
    `${operator.operator_id} inverse ${operator.inverse} must exist.`,
  );
}
for (const operator of operators.filter((item) => item.operator_id !== "M")) {
  check(
    `algebra:${operator.operator_id}:conjugate`,
    operatorIds.has(operator.conjugate),
    `${operator.operator_id} conjugate ${operator.conjugate} must exist.`,
  );
}
check(
  "algebra:audit-counts-bound",
  operators.every(
    (operator) =>
      Number.isInteger(operator.application_count) &&
      operator.application_count > 0 &&
      Number.isInteger(operator.domain_size) &&
      operator.domain_size > 0 &&
      Number.isInteger(operator.image_size) &&
      operator.image_size > 0,
  ),
  "Every operator must carry audit application, domain, and image counts.",
);
check(
  "algebra:projection-gaps-recorded",
  operators.every(
    (operator) =>
      operator.projection_gap !== null &&
      Number.isInteger(operator.projection_gap.unprojected_applications),
  ),
  "Every operator must record its unprojected application count.",
);
check(
  "algebra:commutation-classification",
  algebra.laws?.local_commutation?.classifications?.weak_common_domain_commutation ===
    21 &&
    algebra.laws?.local_commutation?.classifications?.strong_partial_commutation ===
      70 &&
    algebra.laws?.local_commutation?.pairs_tested === 91,
  "The audit commutation classification must be preserved.",
);
check(
  "algebra:modal-cycle-counts",
  algebra.laws?.modal_order_seven?.modal_cycles === 66 &&
    algebra.laws?.modal_order_seven?.anchor_cycles === 10 &&
    algebra.laws?.modal_order_seven?.satellite_cycles === 34 &&
    algebra.laws?.modal_order_seven?.boundary_cycles === 22,
  "Modal orbit partition counts must be preserved.",
);

const invariantDoc = readYaml(
  path.join(PACKAGE_ROOT, "catalog", "invariants.yaml"),
).invariant_catalog;
check(
  "invariants:unique",
  invariantDoc.invariants.length ===
    new Set(invariantDoc.invariants.map((item) => item.invariant_id)).size,
  "Invariant IDs must be unique.",
);
check(
  "invariants:admission-status",
  invariantDoc.invariants.every((item) =>
    ["admitted", "proposed"].includes(item.admission),
  ),
  "Every invariant must declare an admission status.",
);

const catalogCheck = spawnSync(
  process.execPath,
  [path.join(PACKAGE_ROOT, "scripts", "build-catalogs.mjs")],
  { cwd: PACKAGE_ROOT, encoding: "utf8" },
);
check(
  "catalogs:fresh-from-authoritative-sources",
  catalogCheck.status === 0,
  catalogCheck.stdout || catalogCheck.stderr,
);

const expectedHashes = {
  "AGENTS.md": "6109987102ce576874ee5a113d9a0fc556537a2c8ac29e1bc109bd6b2c2e0e24",
  "CANONICAL_FEATURE_PROFILES_AND_MUTATION_ALGEBRA.md":
    "5ba49b157aa6fd8ac672610f88df8ac01464fd71387f3c0e21b042e912636960",
  "NATURAL_ORGANIZATION_THESIS.md":
    "898626127fbc7d7538bb954326f230db4bf97f084f35122c6e42b68dcdd37af9",
  "TOPOLOGICAL_ANCHORING.md":
    "a3aa1dea0ac4ec08fb4d526b860ed40fd146c52e4e6e579a0f75b23816f4691c",
};
for (const [name, expected] of Object.entries(expectedHashes)) {
  const body = fs.readFileSync(path.join(PACKAGE_ROOT, "source", "canon", name));
  check(`canon:${name}:hash`, sha256(body) === expected, `${name} must be byte-preserved.`);
}
check(
  "governors:hash",
  governorsBase.sha256 ===
    "841fc52f1874de28d98a79e1635cbdd8ece134792a2a1f48ccb7e11a7a534ad2",
  "governors.yaml baseline must match registry 0.1.1.",
);

const exampleDraft = readYaml(
  path.join(PACKAGE_ROOT, "examples", "jupiter-change.draft.yaml"),
);
const draftValidation = validateDraft(exampleDraft);
check(
  "authoring:example-draft",
  draftValidation.valid,
  draftValidation.valid ? "passed" : draftValidation.errors.join("; "),
);
validateJsonSchema(
  "schemas/governor-change-proposal.schema.json",
  "examples/jupiter-change.draft.yaml",
  exampleDraft,
);

const markdownFiles = [];
function walk(directory) {
  for (const name of fs.readdirSync(directory)) {
    if (name === "node_modules") continue;
    const absolute = path.join(directory, name);
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) walk(absolute);
    else if (name.endsWith(".md")) markdownFiles.push(absolute);
  }
}
walk(PACKAGE_ROOT);
for (const file of markdownFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (
      target === "" ||
      /^(https?:|mailto:|sandbox:)/.test(target) ||
      target.startsWith("#")
    ) {
      continue;
    }
    const resolved = path.resolve(path.dirname(file), target);
    check(
      `link:${path.relative(PACKAGE_ROOT, file)}:${target}`,
      fs.existsSync(resolved),
      `Broken local Markdown link ${target}.`,
    );
  }
}

const cypherFiles = fs
  .readdirSync(path.join(PACKAGE_ROOT, "neo4j"))
  .filter((name) => name.endsWith(".cypher"))
  .sort();
for (const file of cypherFiles) {
  const body = fs.readFileSync(path.join(PACKAGE_ROOT, "neo4j", file), "utf8");
  const statements = splitCypherStatements(body);
  const diagnostics = statements.flatMap((statement, index) =>
    validateSyntax(statement, {}).map((diagnostic) => ({
      statement: index + 1,
      ...diagnostic,
    })),
  );
  const syntaxErrors = diagnostics.filter((item) => item.severity === 1);
  check(
    `cypher:${file}`,
    syntaxErrors.length === 0,
    syntaxErrors.length === 0 ? `${statements.length} statements` : JSON.stringify(syntaxErrors),
  );
}

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "seven-governors-authoring-"));
try {
  const cli = path.join(PACKAGE_ROOT, "scripts", "governor-author.mjs");
  const runCli = (args) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: PACKAGE_ROOT,
      encoding: "utf8",
    });
  const draft = path.join(temp, "draft.yaml");
  const proposal = path.join(temp, "proposal.json");
  const candidate = path.join(temp, "candidate.yaml");
  const beforeHash = sha256(fs.readFileSync(GOVERNORS_PATH));
  const commands = [
    ["draft", "--office", "Jupiter", "--out", draft],
    [
      "set",
      "--file",
      draft,
      "--field",
      "reference_library.landforms",
      "--value",
      '["audit ridge"]',
    ],
    ["validate", "--file", draft],
    ["proposal", "--file", draft, "--out", proposal],
    ["materialize", "--file", draft, "--out", candidate],
  ];
  let workflowPassed = true;
  let materializeEvent = null;
  const commandErrors = [];
  for (const args of commands) {
    const result = runCli(args);
    if (result.status !== 0) {
      workflowPassed = false;
      commandErrors.push(`${args[0]}: ${result.stderr || result.stdout}`);
    } else if (args[0] === "materialize") {
      try {
        materializeEvent = JSON.parse(result.stdout);
      } catch (error) {
        workflowPassed = false;
        commandErrors.push(`materialize report: ${error.message}`);
      }
    }
  }
  const afterHash = sha256(fs.readFileSync(GOVERNORS_PATH));
  const candidateDoc = fs.existsSync(candidate) ? readYaml(candidate) : null;
  workflowPassed =
    workflowPassed &&
    beforeHash === afterHash &&
    candidateDoc?.governors?.jupiter?.reference_library?.landforms?.[0] ===
      "audit ridge";
  check(
    "authoring:workflow",
    workflowPassed,
    workflowPassed
      ? "Draft, set, validate, proposal, and candidate passed without source mutation."
      : commandErrors.join("; ") || "Candidate mismatch or source mutation.",
  );

  const compatibility = materializeEvent?.registryCompatibility;
  check(
    "authoring:materialize-registry-compatibility",
    materializeEvent?.event === "governor_candidate_materialized" &&
      compatibility?.valid === true &&
      compatibility?.status === "passed" &&
      compatibility?.checks?.every((item) => item.passed),
    compatibility ?? "Materialize did not emit a registry compatibility report.",
  );
  check(
    "authoring:promotion-validation-boundary",
    compatibility?.promotionReady === false &&
      compatibility?.builderCompilerValidation?.executed === true &&
      compatibility?.builderCompilerValidation?.status === "passed" &&
      compatibility?.builderCompilerValidation?.limitationCode ===
        "CANONICAL_REGISTRY_TOOLCHAIN_EMBEDDED" &&
      compatibility?.builderCompilerValidation?.steps?.every(
        (step) => step.status === "passed",
      ),
    compatibility?.builderCompilerValidation ??
      "Missing real builder/compiler validation evidence.",
  );

  const incompatibleCandidate = candidateDoc
    ? structuredClone(candidateDoc)
    : loadBase().document;
  incompatibleCandidate.governors.jupiter.reference_library.landforms = [""];
  const incompatibleReport = validateRegistryCandidate(incompatibleCandidate);
  check(
    "authoring:registry-compatibility-rejects-invalid-candidate",
    incompatibleReport.valid === false &&
      incompatibleReport.status === "failed" &&
      incompatibleReport.errors.some(
        (item) => item.code === "REGISTRY_BUILDER_INPUT_CONTRACT",
      ),
    incompatibleReport,
  );

  const otherCanonicalSource = path.join(
    PACKAGE_ROOT,
    "source",
    "canon",
    "AGENTS.md",
  );
  const siblingGovernors = path.join(
    PACKAGE_ROOT,
    "..",
    "seven-governors-canonical-feature-profile-registry-v0.1.1",
    "source",
    "governors.yaml",
  );
  const siblingCanonical = path.join(
    PACKAGE_ROOT,
    "..",
    "seven-governors-canonical-feature-profile-registry-v0.1.1",
    "canonical",
    "canonical-governor-profiles.json",
  );
  const rootCanonical = path.join(
    PACKAGE_ROOT,
    "..",
    "canonical",
    "universal-network-data.json",
  );
  const auditSource = path.join(
    PACKAGE_ROOT,
    "..",
    "seven-governors-mutation-algebra-audit",
    "source",
    "universal-network-data.json",
  );
  const governorSymlink = path.join(temp, "governors-output-link.yaml");
  const sourceDirectorySymlink = path.join(temp, "canonical-source-link");
  fs.symlinkSync(GOVERNORS_PATH, governorSymlink);
  fs.symlinkSync(
    path.join(PACKAGE_ROOT, "source"),
    sourceDirectorySymlink,
    "dir",
  );
  const protectedContents = new Map(
    [
      GOVERNORS_PATH,
      otherCanonicalSource,
      siblingGovernors,
      siblingCanonical,
      rootCanonical,
      auditSource,
    ].map((file) => [file, fs.readFileSync(file)]),
  );
  const protectedTargets = [
    { name: "direct-governors", output: GOVERNORS_PATH },
    {
      name: "resolved-governors-alias",
      output: `${PACKAGE_ROOT}${path.sep}scripts${path.sep}..${path.sep}source${path.sep}governors.yaml`,
    },
    { name: "governors-file-symlink", output: governorSymlink },
    {
      name: "source-directory-symlink",
      output: path.join(sourceDirectorySymlink, "canon", "AGENTS.md"),
    },
    { name: "other-canonical-source", output: otherCanonicalSource },
    { name: "sibling-registry-governors", output: siblingGovernors },
    { name: "sibling-registry-canonical", output: siblingCanonical },
    { name: "root-canonical", output: rootCanonical },
    { name: "audit-source", output: auditSource },
  ];
  const protectedCommandArgs = {
    draft: (output) => [
      "draft",
      "--office",
      "Jupiter",
      "--out",
      output,
      "--force",
    ],
    set: (output) => [
      "set",
      "--file",
      output,
      "--field",
      "reference_library.landforms",
      "--value",
      '["blocked"]',
    ],
    proposal: (output) => [
      "proposal",
      "--file",
      draft,
      "--out",
      output,
      "--force",
    ],
    materialize: (output) => [
      "materialize",
      "--file",
      draft,
      "--out",
      output,
      "--force",
    ],
  };
  for (const [protectedCommand, argsFor] of Object.entries(
    protectedCommandArgs,
  )) {
    const attempts = [];
    for (const target of protectedTargets) {
      const result = runCli(argsFor(target.output));
      const unchanged = [...protectedContents].every(([file, content]) =>
        fs.readFileSync(file).equals(content),
      );
      attempts.push({
        target: target.name,
        blocked:
          result.status !== 0 &&
          result.stderr.includes(
            "Refusing to write protected canonical source path:",
          ),
        canonicalSourcesUnchanged: unchanged,
      });
      if (!unchanged) {
        for (const [file, content] of protectedContents) {
          fs.writeFileSync(file, content);
        }
      }
    }
    check(
      `authoring:protected-output:${protectedCommand}`,
      attempts.every(
        (attempt) => attempt.blocked && attempt.canonicalSourcesUnchanged,
      ),
      attempts,
    );
  }
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

const report = {
  schemaVersion: "1.0.0",
  packageVersion: "0.2.0",
  generatedAt: "2026-07-30",
  status: errors.length === 0 ? "passed" : "failed",
  summary: {
    checks: checks.length,
    passed: checks.filter((item) => item.passed).length,
    failed: errors.length,
    warnings: warnings.length,
  },
  errors,
  warnings,
  checks,
};
writeJson(path.join(PACKAGE_ROOT, "qa", "validation-report.json"), report, {
  force: true,
});
console.log(JSON.stringify(report.summary, null, 2));
if (errors.length > 0) process.exitCode = 1;
