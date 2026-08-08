import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const GOVERNORS_PATH = path.join(PACKAGE_ROOT, "source", "governors.yaml");
export const PROTECTED_SOURCE_ROOT = path.join(PACKAGE_ROOT, "source");

const SIBLING_REGISTRY = path.resolve(
  PACKAGE_ROOT,
  "..",
  "seven-governors-canonical-feature-profile-registry-v0.1.1",
);
const SIBLING_AUDIT = path.resolve(
  PACKAGE_ROOT,
  "..",
  "seven-governors-mutation-algebra-audit",
);
const RELEASE_ROOT = path.resolve(PACKAGE_ROOT, "..");

export const REGISTRY_PACKAGE_DIR = SIBLING_REGISTRY;
export const PROTECTED_CANONICAL_ROOTS = [
  PROTECTED_SOURCE_ROOT,
  path.join(SIBLING_REGISTRY, "source"),
  path.join(SIBLING_REGISTRY, "canonical"),
  path.join(SIBLING_REGISTRY, "schemas"),
  path.join(SIBLING_AUDIT, "source"),
  path.join(RELEASE_ROOT, "canonical"),
].map((root) => path.resolve(root));
export const OFFICE_ORDER = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
];

const AUTHORABLE_EXACT = new Set([
  "reference_library.landforms",
  "reference_library.architecture",
  "reference_library.botany",
  "reference_library.material",
  "reference_library.color_associations",
  "reference_library.symbolic_references",
  "archetype.mythology_layer.narratives",
  "archetype.mythology_layer.incarnational_layer",
  "archetype.mythology_layer.canonical_phrases",
]);
const GUARDED_EXACT = new Set([
  "archetype.directionality",
  "canonical_expression.thermodynamic_function",
  "canonical_expression.optical_function",
]);

export function sha256(value) {
  const body = Buffer.isBuffer(value)
    ? value
    : Buffer.from(typeof value === "string" ? value : JSON.stringify(value));
  return crypto.createHash("sha256").update(body).digest("hex");
}

export function readYaml(absolutePath) {
  return YAML.parse(fs.readFileSync(absolutePath, "utf8"));
}

export function writeYaml(absolutePath, value, { force = false } = {}) {
  ensureNewOutput(absolutePath, force);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(
    absolutePath,
    YAML.stringify(value, { lineWidth: 100, minContentWidth: 20 }),
  );
}

export function writeJson(absolutePath, value, { force = false } = {}) {
  ensureNewOutput(absolutePath, force);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function ensureNewOutput(absolutePath, force = false) {
  assertSafeOutputPath(absolutePath);
  if (fs.existsSync(absolutePath) && !force) {
    throw new Error(`Output already exists: ${absolutePath}. Add --force to replace it.`);
  }
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

function resolveSymlinkTarget(input, seen = new Set()) {
  const absolute = path.resolve(input);
  if (seen.has(absolute)) {
    throw new Error(`Cannot safely resolve output path due to a symlink cycle: ${input}`);
  }
  seen.add(absolute);

  let cursor = absolute;
  const missing = [];
  while (true) {
    try {
      return path.resolve(fs.realpathSync.native(cursor), ...missing.reverse());
    } catch (error) {
      if (!["ENOENT", "ENOTDIR", "ELOOP"].includes(error.code)) throw error;
    }

    try {
      if (fs.lstatSync(cursor).isSymbolicLink()) {
        const target = path.resolve(
          path.dirname(cursor),
          fs.readlinkSync(cursor),
          ...missing.reverse(),
        );
        return resolveSymlinkTarget(target, seen);
      }
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
    }

    const parent = path.dirname(cursor);
    if (parent === cursor) return absolute;
    missing.push(path.basename(cursor));
    cursor = parent;
  }
}

function aliasesProtectedFile(candidate) {
  let candidateStat;
  try {
    candidateStat = fs.statSync(candidate);
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes(error.code)) return false;
    throw error;
  }
  if (!candidateStat.isFile()) return false;

  const pending = [PROTECTED_SOURCE_ROOT];
  while (pending.length > 0) {
    const directory = pending.pop();
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolute);
        continue;
      }
      const protectedStat = fs.statSync(absolute);
      if (
        protectedStat.isFile() &&
        protectedStat.dev === candidateStat.dev &&
        protectedStat.ino === candidateStat.ino
      ) {
        return true;
      }
    }
  }
  return false;
}

export function assertSafeOutputPath(outputPath) {
  const absolute = path.resolve(outputPath);
  const resolved = resolveSymlinkTarget(absolute);
  for (const protectedRoot of PROTECTED_CANONICAL_ROOTS) {
    const resolvedProtectedRoot = fs.realpathSync.native(protectedRoot);
    if (
      isWithin(protectedRoot, absolute) ||
      isWithin(resolvedProtectedRoot, resolved) ||
      aliasesProtectedRoot(protectedRoot, absolute)
    ) {
      throw new Error(
        `Refusing to write protected canonical source path: ${outputPath}`,
      );
    }
  }
  if (aliasesProtectedFile(absolute)) {
    throw new Error(
      `Refusing to write protected canonical source path: ${outputPath}`,
    );
  }
}

function aliasesProtectedRoot(protectedRoot, candidate) {
  let candidateStat;
  try {
    candidateStat = fs.statSync(candidate);
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes(error.code)) return false;
    throw error;
  }
  if (!candidateStat.isFile()) return false;

  const pending = [protectedRoot];
  while (pending.length > 0) {
    const directory = pending.pop();
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch (error) {
      if (["ENOENT", "ENOTDIR"].includes(error.code)) continue;
      throw error;
    }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolute);
        continue;
      }
      let protectedStat;
      try {
        protectedStat = fs.statSync(absolute);
      } catch {
        continue;
      }
      if (
        protectedStat.isFile() &&
        protectedStat.dev === candidateStat.dev &&
        protectedStat.ino === candidateStat.ino
      ) {
        return true;
      }
    }
  }
  return false;
}

export function parseArgs(argv) {
  const options = {};
  const positionals = [];
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return { options, positionals };
}

export function requireOption(options, name) {
  const value = options[name];
  if (value === undefined || value === true || value === "") {
    throw new Error(`Missing required option --${name}.`);
  }
  return value;
}

export function resolveOffice(input, governors) {
  if (!input) throw new Error("An office is required.");
  const office = OFFICE_ORDER.find(
    (name) => name.toLowerCase() === String(input).toLowerCase(),
  );
  if (!office) {
    throw new Error(`Unknown office ${input}. Expected ${OFFICE_ORDER.join(", ")}.`);
  }
  const key = office.toLowerCase();
  if (!governors[key]) throw new Error(`Base YAML does not contain governors.${key}.`);
  return { office, key };
}

export function fieldRisk(field) {
  if (AUTHORABLE_EXACT.has(field)) return "authorable";
  if (
    field === "canonical_expression.visual_recipes" ||
    field.startsWith("canonical_expression.visual_recipes.")
  ) {
    return "authorable";
  }
  if (GUARDED_EXACT.has(field)) return "guarded";
  return "locked_or_unsupported";
}

export function getAtPath(value, dottedPath) {
  return dottedPath.split(".").reduce(
    (current, key) => (current == null ? undefined : current[key]),
    value,
  );
}

export function setAtPath(value, dottedPath, replacement) {
  const parts = dottedPath.split(".");
  let current = value;
  for (const part of parts.slice(0, -1)) {
    if (
      current[part] === undefined ||
      current[part] === null ||
      typeof current[part] !== "object" ||
      Array.isArray(current[part])
    ) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts.at(-1)] = replacement;
}

export function parseCliValue(text) {
  return YAML.parse(String(text));
}

export function validateFieldValue(field, value) {
  const errors = [];
  const listFields = [
    "reference_library.",
    "archetype.mythology_layer.narratives",
    "archetype.mythology_layer.incarnational_layer",
    "archetype.mythology_layer.canonical_phrases",
  ];
  if (listFields.some((prefix) => field.startsWith(prefix))) {
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== "string" || item.trim() === "")
    ) {
      errors.push(`${field} must be an array of non-empty strings.`);
    }
  }
  if (field === "archetype.directionality") {
    const allowed = ["outward_projective", "inward_centripetal", "hinge_mediator"];
    if (!allowed.includes(value)) {
      errors.push(`${field} must be one of ${allowed.join(", ")}.`);
    }
  }
  if (
    field === "canonical_expression.thermodynamic_function" ||
    field === "canonical_expression.optical_function"
  ) {
    if (typeof value !== "string" || value.trim() === "") {
      errors.push(`${field} must be a non-empty string.`);
    }
  }
  return errors;
}

export function loadBase() {
  const bytes = fs.readFileSync(GOVERNORS_PATH);
  return {
    bytes,
    sha256: sha256(bytes),
    document: YAML.parse(bytes.toString("utf8")),
  };
}

export function validateDraft(draft, { checkBaseHash = true } = {}) {
  const errors = [];
  const warnings = [];
  const proposal = draft?.proposal;
  if (!proposal || typeof proposal !== "object") {
    return { valid: false, errors: ["Missing proposal object."], warnings };
  }
  if (proposal.schema_version !== "1.0.0") {
    errors.push("proposal.schema_version must be 1.0.0.");
  }
  if (proposal.status !== "draft") errors.push("proposal.status must be draft.");
  const base = loadBase();
  let officeRecord;
  try {
    const resolved = resolveOffice(proposal.office, base.document.governors);
    if (resolved.key !== proposal.office_key) {
      errors.push("proposal.office_key does not match proposal.office.");
    }
    officeRecord = base.document.governors[resolved.key];
  } catch (error) {
    errors.push(error.message);
  }
  if (proposal.base?.artifact !== "source/governors.yaml") {
    errors.push("proposal.base.artifact must be source/governors.yaml.");
  }
  if (checkBaseHash && proposal.base?.sha256 !== base.sha256) {
    errors.push("Draft base SHA-256 is stale; create a new draft from the current source.");
  }
  if (!Array.isArray(proposal.changes)) {
    errors.push("proposal.changes must be an array.");
  } else {
    const seen = new Set();
    for (const [index, change] of proposal.changes.entries()) {
      const prefix = `proposal.changes[${index}]`;
      if (!change || typeof change !== "object") {
        errors.push(`${prefix} must be an object.`);
        continue;
      }
      const risk = fieldRisk(change.field);
      if (risk === "locked_or_unsupported") {
        errors.push(`${prefix}.field is locked or unsupported: ${change.field}`);
      }
      if (change.risk_class !== risk) {
        errors.push(`${prefix}.risk_class must be ${risk}.`);
      }
      if (seen.has(change.field)) errors.push(`Duplicate field change: ${change.field}.`);
      seen.add(change.field);
      errors.push(...validateFieldValue(change.field, change.value));
      if (officeRecord && getAtPath(officeRecord, change.field) === undefined) {
        warnings.push(`${change.field} does not currently exist and will be created.`);
      }
    }
  }
  if ((proposal.changes ?? []).length === 0) {
    warnings.push("Draft contains no changes.");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    baseSha256: base.sha256,
    changeCount: proposal.changes?.length ?? 0,
  };
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function collectLockedChanges(base, candidate, prefix, changes) {
  if (Object.is(base, candidate)) return;
  if (prefix && fieldRisk(prefix) !== "locked_or_unsupported") return;
  if (isRecord(base) && isRecord(candidate)) {
    for (const key of new Set([...Object.keys(base), ...Object.keys(candidate)])) {
      collectLockedChanges(
        base[key],
        candidate[key],
        prefix ? `${prefix}.${key}` : key,
        changes,
      );
    }
    return;
  }
  if (Array.isArray(base) && Array.isArray(candidate)) {
    if (JSON.stringify(base) === JSON.stringify(candidate)) return;
  }
  changes.push(prefix || "<governor-record>");
}

export function validateRegistryCandidate(candidate) {
  const checks = [];
  const errors = [];
  const check = (id, passed, detail) => {
    checks.push({ id, passed: Boolean(passed), detail });
    if (!passed) errors.push({ code: id, detail });
  };
  let registryRelease;
  let sourceAuthority;
  try {
    registryRelease = JSON.parse(
      fs.readFileSync(
        path.join(PACKAGE_ROOT, "source", "registry-baseline", "registry-release.json"),
        "utf8",
      ),
    );
    sourceAuthority = JSON.parse(
      fs.readFileSync(
        path.join(
          PACKAGE_ROOT,
          "source",
          "registry-baseline",
          "source-authority-registry.json",
        ),
        "utf8",
      ),
    );
  } catch (error) {
    check("REGISTRY_BASELINE_READABLE", false, error.message);
  }

  const baseline = loadBase();
  const baselineGovernorSource = sourceAuthority?.consumedSources?.find(
    (source) => source.artifact === "source/governors.yaml",
  );
  check(
    "REGISTRY_BASELINE_CONTRACT",
    registryRelease?.releaseId === "canonical-profile-registry:0.1.1" &&
      registryRelease?.compatibility?.providerContract === "1.0.0" &&
      baselineGovernorSource?.sha256 === baseline.sha256,
    {
      releaseId: registryRelease?.releaseId ?? null,
      providerContract: registryRelease?.compatibility?.providerContract ?? null,
      governorSourceHashMatches: baselineGovernorSource?.sha256 === baseline.sha256,
    },
  );

  const expectedTopLevelKeys = Object.keys(baseline.document);
  const actualTopLevelKeys = isRecord(candidate) ? Object.keys(candidate) : [];
  check(
    "REGISTRY_SOURCE_DOCUMENT",
    isRecord(candidate) &&
      isRecord(candidate.metadata) &&
      isRecord(candidate.governors) &&
      actualTopLevelKeys.length === expectedTopLevelKeys.length &&
      expectedTopLevelKeys.every((key) => Object.hasOwn(candidate, key)),
    { expected: expectedTopLevelKeys, actual: actualTopLevelKeys },
  );

  const governors = isRecord(candidate?.governors) ? candidate.governors : {};
  const expectedKeys = OFFICE_ORDER.map((office) => office.toLowerCase());
  const actualKeys = Object.keys(governors);
  check(
    "REGISTRY_OFFICE_SET",
    actualKeys.length === expectedKeys.length &&
      expectedKeys.every((key) => Object.hasOwn(governors, key)),
    { expected: expectedKeys, actual: actualKeys },
  );

  const lockedChanges = [];
  for (const key of expectedTopLevelKeys.filter((key) => key !== "governors")) {
    if (JSON.stringify(candidate?.[key]) !== JSON.stringify(baseline.document[key])) {
      lockedChanges.push(key);
    }
  }
  for (const key of expectedKeys) {
    collectLockedChanges(
      baseline.document.governors[key],
      governors[key],
      "",
      lockedChanges,
    );
  }
  check(
    "REGISTRY_AUTHORIZED_CHANGE_SCOPE",
    lockedChanges.length === 0,
    lockedChanges.length === 0
      ? "Only declared authorable or guarded Governor fields differ from the baseline."
      : { lockedOrUnsupportedFields: [...new Set(lockedChanges)].sort() },
  );

  const contractErrors = [];
  const wavelengths = [];
  const requireString = (value, field) => {
    if (typeof value !== "string" || value.trim() === "") {
      contractErrors.push({ field, expected: "non-empty string" });
    }
  };
  const requireStringArray = (value, field) => {
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== "string" || item.trim() === "")
    ) {
      contractErrors.push({ field, expected: "array of non-empty strings" });
    }
  };

  for (const office of OFFICE_ORDER) {
    const key = office.toLowerCase();
    const governor = governors[key];
    if (!isRecord(governor)) {
      contractErrors.push({
        field: `governors.${key}`,
        expected: "Governor object",
      });
      continue;
    }
    requireString(governor.symbol, `governors.${key}.symbol`);
    requireString(governor.type, `governors.${key}.type`);
    if (governor.display_name !== office) {
      contractErrors.push({
        field: `governors.${key}.display_name`,
        expected: office,
      });
    }

    const archetype = governor.archetype;
    const canonical = governor.canonical_expression;
    const library = governor.reference_library;
    if (!isRecord(archetype)) {
      contractErrors.push({
        field: `governors.${key}.archetype`,
        expected: "object",
      });
    }
    if (!isRecord(canonical)) {
      contractErrors.push({
        field: `governors.${key}.canonical_expression`,
        expected: "object",
      });
      continue;
    }
    if (!isRecord(library)) {
      contractErrors.push({
        field: `governors.${key}.reference_library`,
        expected: "object",
      });
    }

    requireString(canonical.mode, `governors.${key}.canonical_expression.mode`);
    requireString(canonical.color, `governors.${key}.canonical_expression.color`);
    requireString(
      canonical.thermodynamic_function,
      `governors.${key}.canonical_expression.thermodynamic_function`,
    );
    requireString(
      canonical.optical_function,
      `governors.${key}.canonical_expression.optical_function`,
    );
    if (!Number.isFinite(canonical.wavelength_nm) || canonical.wavelength_nm <= 0) {
      contractErrors.push({
        field: `governors.${key}.canonical_expression.wavelength_nm`,
        expected: "positive finite number",
      });
    } else {
      wavelengths.push(canonical.wavelength_nm);
    }

    const binaryFields = [
      "binary_12bit",
      "binary_constructive",
      "binary_observational",
    ];
    for (const field of binaryFields) {
      if (!/^[01]{12}$/.test(canonical[field])) {
        contractErrors.push({
          field: `governors.${key}.canonical_expression.${field}`,
          expected: "12-character binary string",
        });
      }
    }
    if (canonical.binary_12bit !== canonical.binary_constructive) {
      contractErrors.push({
        field: `governors.${key}.canonical_expression.binary_12bit`,
        expected: "same value as binary_constructive",
      });
    }
    if (
      typeof canonical.binary_constructive === "string" &&
      canonical.binary_observational !==
        [...canonical.binary_constructive].reverse().join("")
    ) {
      contractErrors.push({
        field: `governors.${key}.canonical_expression.binary_observational`,
        expected: "reverse of binary_constructive",
      });
    }
    for (const orientation of ["constructive", "observational"]) {
      const binary = canonical[`binary_${orientation}`];
      const decimal = canonical[`decimal_${orientation}`];
      const hex = canonical[`hex_${orientation}`];
      if (!/^[01]{12}$/.test(binary) || decimal !== Number.parseInt(binary, 2)) {
        contractErrors.push({
          field: `governors.${key}.canonical_expression.decimal_${orientation}`,
          expected: `base-2 value of binary_${orientation}`,
        });
      }
      if (!/^0x[0-9a-f]+$/i.test(hex) || Number.parseInt(hex, 16) !== decimal) {
        contractErrors.push({
          field: `governors.${key}.canonical_expression.hex_${orientation}`,
          expected: `hex value of decimal_${orientation}`,
        });
      }
    }
    if (
      !/^[01]{12}$/.test(canonical.binary_12bit) ||
      canonical.bit_weight !==
        [...canonical.binary_12bit].filter((bit) => bit === "1").length
    ) {
      contractErrors.push({
        field: `governors.${key}.canonical_expression.bit_weight`,
        expected: "population count of binary_12bit",
      });
    }
    if (canonical.compression_derived !== true) {
      contractErrors.push({
        field: `governors.${key}.canonical_expression.compression_derived`,
        expected: true,
      });
    }
    if (!isRecord(canonical.visual_recipes)) {
      contractErrors.push({
        field: `governors.${key}.canonical_expression.visual_recipes`,
        expected: "object",
      });
    }

    const directionality = archetype?.directionality;
    if (
      !["outward_projective", "inward_centripetal", "hinge_mediator"].includes(
        directionality,
      )
    ) {
      contractErrors.push({
        field: `governors.${key}.archetype.directionality`,
        expected:
          "outward_projective, inward_centripetal, or hinge_mediator",
      });
    }
    for (const field of [
      "narratives",
      "incarnational_layer",
      "canonical_phrases",
    ]) {
      requireStringArray(
        archetype?.mythology_layer?.[field],
        `governors.${key}.archetype.mythology_layer.${field}`,
      );
    }
    for (const field of [
      "landforms",
      "architecture",
      "botany",
      "material",
      "color_associations",
      "symbolic_references",
    ]) {
      requireStringArray(
        library?.[field],
        `governors.${key}.reference_library.${field}`,
      );
    }
  }

  check(
    "REGISTRY_BUILDER_INPUT_CONTRACT",
    contractErrors.length === 0,
    contractErrors.length === 0
      ? "All seven records satisfy the registry builder's source-field contract."
      : contractErrors,
  );
  check(
    "REGISTRY_PHOTONIC_ORDER",
    wavelengths.length === OFFICE_ORDER.length &&
      wavelengths.every(
        (wavelength, index) => index === 0 || wavelength < wavelengths[index - 1],
      ),
    { officeOrder: OFFICE_ORDER, wavelengthsNm: wavelengths },
  );

  const builderCompilerValidation = runRegistryBuilderCompiler(candidate);
  return {
    schemaVersion: "1.0.0",
    reportType: "canonical_feature_profile_registry_source_compatibility",
    status: errors.length === 0 ? "passed" : "failed",
    valid: errors.length === 0,
    target: {
      releaseId: registryRelease?.releaseId ?? null,
      topologySchema: registryRelease?.compatibility?.topologySchema ?? null,
      providerContract: registryRelease?.compatibility?.providerContract ?? null,
    },
    builderCompilerValidation,
    promotionReady: false,
    checks,
    errors,
  };
}

function runRegistryBuilderCompiler(candidate) {
  const unavailable = (reason) => ({
    executed: false,
    status: "external_validation_required",
    limitationCode: "CANONICAL_REGISTRY_TOOLCHAIN_NOT_PACKAGED",
    reason,
    limitation:
      "The canonical feature profile registry builder/compiler is not available next to this toolkit; run the candidate through the installed registry pipeline before promotion.",
  });

  if (!fs.existsSync(path.join(REGISTRY_PACKAGE_DIR, "package.json"))) {
    return unavailable("registry package missing");
  }

  const temp = fs.mkdtempSync(
    path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "seven-governors-registry-")),
      "pipeline",
    ),
  );
  try {
    fs.cpSync(REGISTRY_PACKAGE_DIR, temp, {
      recursive: true,
      filter: (source) => {
        const relative = path.relative(REGISTRY_PACKAGE_DIR, source);
        return (
          relative !== "node_modules" &&
          !relative.startsWith(`node_modules${path.sep}`) &&
          relative !== "qa" &&
          !relative.startsWith(`qa${path.sep}`)
        );
      },
    });
    fs.symlinkSync(
      path.join(REGISTRY_PACKAGE_DIR, "node_modules"),
      path.join(temp, "node_modules"),
      "dir",
    );
    fs.writeFileSync(
      path.join(temp, "source", "governors.yaml"),
      YAML.stringify(candidate, { lineWidth: 100, minContentWidth: 20 }),
    );

    const steps = [];
    const runStep = (name, args) => {
      const result = spawnSync(process.execPath, args, {
        cwd: temp,
        encoding: "utf8",
      });
      steps.push({
        name,
        status: result.status === 0 ? "passed" : "failed",
        exitCode: result.status ?? null,
        stdoutTail:
          (result.stdout ?? "").trim().split(/\r?\n/).slice(-8).join("\n") || null,
        stderrTail:
          (result.stderr ?? "").trim().split(/\r?\n/).slice(-8).join("\n") || null,
      });
      return result.status === 0;
    };

    const buildPassed = runStep("build-registry", [
      path.join(temp, "scripts", "build-registry.mjs"),
    ]);
    const validatePassed = buildPassed
      ? runStep("validate-registry", [
          path.join(temp, "scripts", "validate-registry.mjs"),
        ])
      : false;

    let compilePassed = true;
    if (buildPassed && validatePassed) {
      const builtProfiles = JSON.parse(
        fs.readFileSync(
          path.join(temp, "canonical", "canonical-governor-profiles.json"),
          "utf8",
        ),
      ).profiles;
      const compileTargets = [
        ...builtProfiles.map((profile) => profile.canonicalIdentity.stateId),
        1749,
      ];
      for (const stateId of [...new Set(compileTargets)]) {
        const passed = runStep(`compile-profile:${stateId}`, [
          path.join(temp, "scripts", "compile-profile.mjs"),
          "--state-id",
          String(stateId),
        ]);
        compilePassed = compilePassed && passed;
      }
    }

    const passed = buildPassed && validatePassed && compilePassed;
    return {
      executed: true,
      status: passed ? "passed" : "failed",
      limitationCode: "CANONICAL_REGISTRY_TOOLCHAIN_EMBEDDED",
      limitation:
        "The candidate was rebuilt and revalidated through the installed canonical feature profile registry builder and compiler in an isolated temporary tree. Passing here proves buildability, not admission: promotion still requires an upstream release decision.",
      steps,
    };
  } catch (error) {
    return {
      executed: true,
      status: "failed",
      limitationCode: "CANONICAL_REGISTRY_TOOLCHAIN_ERROR",
      limitation: error.message,
    };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

export function relativeOrAbsolute(input) {
  return path.resolve(process.cwd(), input);
}
