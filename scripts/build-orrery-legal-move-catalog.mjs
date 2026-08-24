import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const auditRoot = path.join(root, "seven-governors-mutation-algebra-audit");
const defaultOutput = path.join(root, "orrery", "src", "generated", "legal-moves.v1.json");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

function fail(message) {
  throw new Error(`INVALID_ORRERY_LEGAL_MOVE_CATALOG: ${message}`);
}

function sourceArtifact(relativePath, role) {
  const bytes = fs.readFileSync(path.join(root, relativePath));
  return { artifact: relativePath, sha256: sha256(bytes), role };
}

function anchor(record) {
  const stateId = Number(record.stateId);
  if (
    !Number.isSafeInteger(stateId) ||
    !["A0", "A1", "A2"].includes(record.tier) ||
    !["7-35", "7-34", "7-33"].includes(record.forte) ||
    !["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"].includes(record.stateGovernor) ||
    record.role !== "anchor"
  ) {
    fail(`candidate anchor ${record.stateId} is not a supported A0-A2 identity`);
  }

  return { stateId, tier: record.tier, forteFamily: record.forte, office: record.stateGovernor };
}

function assertVerifiedCycles(moves, cycles, scope) {
  const targetBySource = new Map(moves.map((move) => [move.sourceId, move.targetId]));
  const cycleMembers = new Set();

  for (const cycle of cycles) {
    const members = cycle.member_ids.split(";").map(Number);
    if (new Set(members).size !== 7 || members.some((memberId) => !scope.has(memberId))) {
      fail(`cycle ${cycle.cycle_id} does not contain seven distinct scoped anchors`);
    }
    for (let index = 0; index < members.length; index += 1) {
      const sourceId = members[index];
      const targetId = members[(index + 1) % members.length];
      if (targetBySource.get(sourceId) !== targetId) {
        fail(`cycle ${cycle.cycle_id} does not match the audited modal successor ordering`);
      }
      cycleMembers.add(sourceId);
    }
  }

  if (cycleMembers.size !== 21 || [...scope].some((anchorId) => !cycleMembers.has(anchorId))) {
    fail("cycle identities do not cover the complete A0-A2 scope");
  }
}

function buildCatalog() {
  const candidatePath = "canonical/harmonic-compression-candidates/CH_A012_q_v1.json";
  const operatorRegistryPath = "seven-governors-mutation-algebra-audit/audit/operator-registry.csv";
  const applicationsPath = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";
  const completionLedgerPath = "seven-governors-mutation-algebra-audit/audit/modal-completion-ledger.csv";
  const cycleIdentitiesPath = "seven-governors-mutation-algebra-audit/audit/cycle-identities.csv";
  const candidate = JSON.parse(read(candidatePath));
  const operators = parseCsv(read(operatorRegistryPath));
  const applications = parseCsv(read(applicationsPath));
  const completionLedger = parseCsv(read(completionLedgerPath));
  const cycles = parseCsv(read(cycleIdentitiesPath));
  const scopeAnchors = candidate.records.map(anchor).sort((left, right) => left.stateId - right.stateId);
  const scopeIds = scopeAnchors.map((item) => item.stateId);

  if (candidate.releaseId !== "harmonic-compression-candidate:CH_A012_q_v1:1.0.0") {
    fail("unexpected harmonic descriptor release");
  }
  if (!/^[a-f0-9]{64}$/.test(candidate.candidateFingerprint ?? "")) {
    fail("harmonic descriptor fingerprint is invalid");
  }
  if (scopeIds.length !== 21 || new Set(scopeIds).size !== 21) {
    fail("harmonic descriptor scope must contain exactly 21 unique anchors");
  }
  if (["A0", "A1", "A2"].some((tier) => scopeAnchors.filter((item) => item.tier === tier).length !== 7)) {
    fail("harmonic descriptor scope must contain seven anchors in every A0-A2 tier");
  }

  const modalOperator = operators.find((operator) => operator.operator_id === "M");
  if (
    !modalOperator ||
    modalOperator.notation !== "M" ||
    modalOperator.name !== "Modal successor" ||
    modalOperator.operator_class !== "modal_re_rooting" ||
    modalOperator.inverse_operator_id !== "M^6" ||
    modalOperator.partial !== "false" ||
    modalOperator.status !== "structurally_validated"
  ) {
    fail("modal operator metadata does not match the audited registry");
  }

  const applicationById = new Map(applications.map((application) => [application.application_id, application]));
  const scope = new Set(scopeIds);
  const anchorById = new Map(scopeAnchors.map((item) => [item.stateId, item]));
  const selectedLedgerRows = completionLedger.filter(
    (row) =>
      row.canonical_modal_successor_projected === "true" &&
      scope.has(Number(row.source_id)) &&
      scope.has(Number(row.target_id)),
  );

  if (selectedLedgerRows.length !== 21) {
    fail("expected exactly 21 canonical modal moves in the A0-A2 scope");
  }

  const scopedCycles = cycles.filter((cycle) => {
    const members = cycle.member_ids.split(";").map(Number);
    return members.length === 7 && members.every((memberId) => scope.has(memberId));
  });
  if (
    scopedCycles.length !== 3 ||
    new Set(scopedCycles.map((cycle) => cycle.tier)).size !== 3 ||
    ["A0", "A1", "A2"].some((tier) => !scopedCycles.some((cycle) => cycle.tier === tier)) ||
    scopedCycles.some(
      (cycle) =>
        cycle.cycle_length !== "7" ||
        cycle.closes_at_source !== "true" ||
        cycle.minimal_period_seven !== "true" ||
        cycle.result !== "PASS" ||
        cycle.member_ids.split(";").some((memberId) => anchorById.get(Number(memberId))?.tier !== cycle.tier),
    )
  ) {
    fail("the scoped modal cycles are not the three verified seven-step cycles");
  }

  const moves = selectedLedgerRows
      .map((ledger) => {
        const application = applicationById.get(ledger.application_id);
        const source = anchorById.get(Number(ledger.source_id));
        const target = anchorById.get(Number(ledger.target_id));
        if (!application) {
          fail(`missing audited application ${ledger.application_id}`);
        }
        if (!source || !target) {
          fail(`application ${ledger.application_id} is outside the scoped anchor identity`);
        }
        if (
        application.operator_id !== "M" ||
        application.source_id !== ledger.source_id ||
        application.target_id !== ledger.target_id ||
        application.source_role !== "anchor" ||
        application.target_role !== "anchor" ||
          application.source_tier !== application.target_tier ||
          application.source_forte !== application.target_forte ||
          application.source_tier !== source.tier ||
          application.target_tier !== target.tier ||
          application.source_forte !== source.forteFamily ||
          application.target_forte !== target.forteFamily ||
          application.source_office !== source.office ||
          application.target_office !== target.office ||
        application.structural_evidence !== "true" ||
        application.structural_edge_types !== "MODAL_SUCCESSOR" ||
        application.structural_edge_ids.length === 0 ||
        application.application_status !== "formal_substrate_observed" ||
        ledger.projection_status !== "canonical_modal_edge_projected"
      ) {
        fail(`application ${ledger.application_id} is not a source-backed scoped modal move`);
      }

      return {
        id: application.application_id,
        sourceId: Number(application.source_id),
        targetId: Number(application.target_id),
        operatorId: "M",
        availability: "available",
        provenance: {
          applicationId: application.application_id,
          projectionStatus: ledger.projection_status,
          structuralEvidence: true,
          structuralEdgeTypes: application.structural_edge_types,
          structuralEdgeIds: application.structural_edge_ids.split(";").filter(Boolean),
        },
      };
    })
    .sort((left, right) => left.sourceId - right.sourceId || left.targetId - right.targetId);

  if (
    new Set(moves.map((move) => move.id)).size !== 21 ||
    new Set(moves.map((move) => move.sourceId)).size !== 21 ||
    new Set(moves.map((move) => move.targetId)).size !== 21 ||
    moves.some((move) => !scope.has(move.sourceId) || !scope.has(move.targetId))
  ) {
    fail("scoped catalog moves must form a one-to-one closed mapping over the 21 anchors");
  }

  assertVerifiedCycles(moves, scopedCycles, scope);

  const fingerprintInput = {
    schemaVersion: "harmonic-orrery.legal-moves.v1",
    catalogId: "harmonic-orrery.modal-anchor-cycles.v1",
    scope: {
      nodesSchemaVersion: "harmonic-orrery.nodes.v1",
        harmonicDescriptorReleaseId: candidate.releaseId,
        harmonicDescriptorFingerprint: candidate.candidateFingerprint,
        anchorIds: scopeIds,
        anchors: scopeAnchors,
      },
    sources: [
      sourceArtifact(candidatePath, "A0-A2 anchor scope"),
      sourceArtifact(operatorRegistryPath, "modal operator metadata"),
      sourceArtifact(applicationsPath, "source-backed structural applications"),
      sourceArtifact(completionLedgerPath, "canonical modal projection status"),
      sourceArtifact(cycleIdentitiesPath, "verified modal cycle closure"),
    ],
    operators: [
      {
        operatorId: "M",
        notation: modalOperator.notation,
        name: modalOperator.name,
        operatorClass: modalOperator.operator_class,
        degree: null,
        degreeGovernor: null,
        direction: modalOperator.direction,
        inverseOperatorId: modalOperator.inverse_operator_id,
        partial: false,
        status: modalOperator.status,
      },
    ],
    moves,
  };

  return {
    ...fingerprintInput,
    catalogFingerprint: sha256(JSON.stringify(fingerprintInput)),
  };
}

function parseArguments(argv) {
  let output = defaultOutput;
  let check = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      check = true;
    } else if (argument === "--output") {
      output = path.resolve(argv[index + 1] ?? "");
      index += 1;
    } else {
      fail(`unknown argument ${argument}`);
    }
  }
  return { output, check };
}

const { output, check } = parseArguments(process.argv.slice(2));
const payload = `${JSON.stringify(buildCatalog(), null, 2)}\n`;

if (check) {
  if (!fs.existsSync(output) || fs.readFileSync(output, "utf8") !== payload) {
    throw new Error("STALE_ORRERY_LEGAL_MOVE_CATALOG");
  }
} else {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, payload);
}

console.log(JSON.stringify({ output: path.relative(root, output), check, sha256: sha256(payload) }));
