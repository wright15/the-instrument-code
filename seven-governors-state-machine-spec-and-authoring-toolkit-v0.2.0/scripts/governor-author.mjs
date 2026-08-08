import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  OFFICE_ORDER,
  PACKAGE_ROOT,
  assertSafeOutputPath,
  fieldRisk,
  getAtPath,
  loadBase,
  parseArgs,
  parseCliValue,
  readYaml,
  relativeOrAbsolute,
  requireOption,
  resolveOffice,
  setAtPath,
  validateDraft,
  validateFieldValue,
  validateRegistryCandidate,
  writeJson,
  writeYaml,
} from "./lib.mjs";

const [command, ...rawArgs] = process.argv.slice(2);
const { options } = parseArgs(rawArgs);

function usage() {
  console.log(`Seven Governors safe authoring CLI

Commands:
  list
  show        --office <name>
  draft       --office <name> --out <file> [--force]
  set         --file <draft> --field <path> --value <yaml-or-json> [--ack-guarded]
  validate    --file <draft>
  proposal    --file <draft> --out <file> [--force]
  materialize --file <draft> --out <file> [--force]

The CLI never overwrites protected canonical sources under source/.`);
}

function loadDraft(file) {
  return readYaml(relativeOrAbsolute(file));
}

function commandList() {
  const base = loadBase().document;
  const rows = OFFICE_ORDER.map((office) => {
    const record = base.governors[office.toLowerCase()];
    return {
      office,
      mode: record.canonical_expression?.mode,
      process: record.canonical_expression?.thermodynamic_function,
      wavelengthNm: record.canonical_expression?.wavelength_nm,
    };
  });
  console.table(rows);
}

function commandShow() {
  const base = loadBase().document;
  const { office, key } = resolveOffice(requireOption(options, "office"), base.governors);
  const phenomena = readYaml(
    path.join(PACKAGE_ROOT, "schemas", "physical_phenomena.yaml"),
  ).physical_phenomena.governor_registry[key];
  console.log(
    YAML.stringify(
      {
        office,
        governor: base.governors[key],
        primary_phenomenon: phenomena,
      },
      { lineWidth: 100 },
    ),
  );
}

function commandDraft() {
  const base = loadBase();
  const { office, key } = resolveOffice(
    requireOption(options, "office"),
    base.document.governors,
  );
  const timestamp = new Date().toISOString();
  const draft = {
    proposal: {
      schema_version: "1.0.0",
      proposal_id: `governor-change:${key}:${timestamp}`,
      status: "draft",
      created_at: timestamp,
      office,
      office_key: key,
      base: {
        artifact: "source/governors.yaml",
        sha256: base.sha256,
      },
      changes: [],
    },
  };
  const output = relativeOrAbsolute(requireOption(options, "out"));
  writeYaml(output, draft, { force: options.force === true });
  console.log(`Created ${output}`);
}

function commandSet() {
  const file = relativeOrAbsolute(requireOption(options, "file"));
  assertSafeOutputPath(file);
  const field = requireOption(options, "field");
  const value = parseCliValue(requireOption(options, "value"));
  const draft = readYaml(file);
  const before = validateDraft(draft);
  if (!before.valid) {
    throw new Error(`Draft is not valid:\n${before.errors.join("\n")}`);
  }
  const risk = fieldRisk(field);
  if (risk === "locked_or_unsupported") {
    throw new Error(`Field is locked or unsupported: ${field}`);
  }
  if (risk === "guarded" && options["ack-guarded"] !== true) {
    throw new Error(
      `${field} is guarded. Re-run with --ack-guarded after reviewing version impact.`,
    );
  }
  const valueErrors = validateFieldValue(field, value);
  if (valueErrors.length > 0) throw new Error(valueErrors.join("\n"));
  const changes = draft.proposal.changes;
  const replacement = { field, risk_class: risk, value };
  const existing = changes.findIndex((change) => change.field === field);
  if (existing >= 0) changes[existing] = replacement;
  else changes.push(replacement);
  fs.writeFileSync(file, YAML.stringify(draft, { lineWidth: 100 }));
  console.log(`Updated ${file}: ${field} (${risk})`);
}

function commandValidate() {
  const file = relativeOrAbsolute(requireOption(options, "file"));
  const report = validateDraft(readYaml(file));
  console.log(JSON.stringify({ file, ...report }, null, 2));
  if (!report.valid) process.exitCode = 1;
}

function reviewPacket(draft) {
  const base = loadBase();
  const proposal = draft.proposal;
  const officeRecord = base.document.governors[proposal.office_key];
  const changes = proposal.changes.map((change) => ({
    field: change.field,
    riskClass: change.risk_class,
    previousValue: getAtPath(officeRecord, change.field) ?? null,
    proposedValue: change.value,
    changesIntrinsicFingerprint: true,
    requiresNewRegistryVersion: true,
  }));
  return {
    schemaVersion: "1.0.0",
    reviewPacketId: `review:${proposal.proposal_id}`,
    status: "review_required",
    office: proposal.office,
    baseArtifact: proposal.base.artifact,
    baseSha256: proposal.base.sha256,
    changes,
    impact: {
      requiresNewRegistryVersion: changes.length > 0,
      requiresTopologyReaudit: false,
      requiresCanonicalProfileRebuild: changes.length > 0,
      requiresNeo4jSemanticReimport: changes.length > 0,
      requiresCreationPacketRegression: changes.length > 0,
      topologyIdentityFieldsTouched: false,
      physicalAnchorFieldsTouched: false,
    },
    promotionPolicy:
      "Review externally, version the host registry, rebuild downstream artifacts, and never patch Neo4j as canon.",
  };
}

function commandProposal() {
  const draft = loadDraft(requireOption(options, "file"));
  const report = validateDraft(draft);
  if (!report.valid) throw new Error(report.errors.join("\n"));
  const output = relativeOrAbsolute(requireOption(options, "out"));
  writeJson(output, reviewPacket(draft), { force: options.force === true });
  console.log(`Created ${output}`);
}

function commandMaterialize() {
  const draft = loadDraft(requireOption(options, "file"));
  const report = validateDraft(draft);
  if (!report.valid) throw new Error(report.errors.join("\n"));
  const output = relativeOrAbsolute(requireOption(options, "out"));
  const base = loadBase().document;
  const officeRecord = base.governors[draft.proposal.office_key];
  for (const change of draft.proposal.changes) {
    setAtPath(officeRecord, change.field, change.value);
  }
  const compatibility = validateRegistryCandidate(base);
  if (!compatibility.valid) {
    throw new Error(
      JSON.stringify(
        {
          event: "governor_candidate_rejected",
          output,
          registryCompatibility: compatibility,
        },
        null,
        2,
      ),
    );
  }
  writeYaml(output, base, { force: options.force === true });
  console.log(
    JSON.stringify(
      {
        event: "governor_candidate_materialized",
        output,
        registryCompatibility: compatibility,
      },
      null,
      2,
    ),
  );
}

try {
  switch (command) {
    case "list":
      commandList();
      break;
    case "show":
      commandShow();
      break;
    case "draft":
      commandDraft();
      break;
    case "set":
      commandSet();
      break;
    case "validate":
      commandValidate();
      break;
    case "proposal":
      commandProposal();
      break;
    case "materialize":
      commandMaterialize();
      break;
    case "help":
    case "--help":
    case "-h":
    case undefined:
      usage();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
