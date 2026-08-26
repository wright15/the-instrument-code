import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const defaultOutput = path.join(root, "orrery", "src", "generated", "legal-moves.v2.json");

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

function buildCatalog() {
  const candidatePath = "canonical/harmonic-compression-candidates/CH_A012_q_v1.json";
  const operatorRegistryPath = "seven-governors-mutation-algebra-audit/audit/operator-registry.csv";
  const applicationsPath = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";
  const candidate = JSON.parse(read(candidatePath));
  const operators = parseCsv(read(operatorRegistryPath));
  const applications = parseCsv(read(applicationsPath));
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

  // --- R/L parallel-mode operators (fixed_degree_shift, degrees 2..7) ---
  const parallelOperators = operators.filter((op) => op.operator_class === "fixed_degree_shift");
  if (parallelOperators.length !== 12) {
    fail(`expected 12 fixed_degree_shift operators, got ${parallelOperators.length}`);
  }
  // Validate each parallel operator matches registry
  for (const op of parallelOperators) {
    const degree = Number(op.degree);
    if (!Number.isInteger(degree) || degree < 2 || degree > 7) {
      fail(`parallel operator ${op.operator_id} has invalid degree`);
    }
    if (op.partial !== "true" || op.status !== "structurally_validated") {
      fail(`parallel operator ${op.operator_id} is not structurally validated`);
    }
    if (!["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus"].includes(op.degree_governor)) {
      fail(`parallel operator ${op.operator_id} has invalid degree_governor`);
    }
    if (!["raise", "lower"].includes(op.direction)) {
      fail(`parallel operator ${op.operator_id} has invalid direction`);
    }
  }
  parallelOperators.sort((a, b) => a.operator_id.localeCompare(b.operator_id));

  const scope = new Set(scopeIds);
  const anchorById = new Map(scopeAnchors.map((item) => [item.stateId, item]));
  const operatorById = new Map(parallelOperators.map((op) => [op.operator_id, op]));

  // Select all audited fixed_degree_shift applications where both endpoints are in the 21-anchor scope.
  // For fixed_degree_shift the field evidence is the authoritative hamming-2 edge (AUDITED_HAMMING2),
  // while structural CONSTRUCTS is present for a subset. We accept any formal_substrate_observed
  // edge that keeps the root fixed (field_evidence true in practice for all 60).
  const selectedApplications = applications.filter(
    (app) =>
      app.operator_class === "fixed_degree_shift" &&
      operatorById.has(app.operator_id) &&
      scope.has(Number(app.source_id)) &&
      scope.has(Number(app.target_id)) &&
      app.application_status === "formal_substrate_observed",
  );

  if (selectedApplications.length !== 60) {
    fail(`expected exactly 60 parallel R/L moves in the A0-A2 scope, got ${selectedApplications.length}`);
  }

  // Build moves — keep source-backed provenance. Structural edge ids may be empty for many
  // fixed edges; field edge ids carry the audit trail (audit:fixed:*).
  const moves = selectedApplications
    .map((app) => {
      const source = anchorById.get(Number(app.source_id));
      const target = anchorById.get(Number(app.target_id));
      if (!source || !target) {
        fail(`application ${app.application_id} is outside the scoped anchor identity`);
      }
      if (app.source_role !== "anchor" || app.target_role !== "anchor") {
        fail(`application ${app.application_id} is not anchor->anchor`);
      }
      // Root is fixed for parallel operators, but tier/forte may change — do not enforce equality.
      // At least verify the operator's degree-governor matches the registry.
      const registry = operatorById.get(app.operator_id);
      if (!registry || String(registry.degree) !== app.degree || registry.degree_governor !== app.degree_governor) {
        fail(`application ${app.application_id} mismatches registry degree/governor`);
      }
      // Determine provenance edge ids: prefer structural if present, otherwise field.
      const structuralIds = app.structural_edge_ids ? app.structural_edge_ids.split(";").filter(Boolean) : [];
      const fieldIds = app.field_edge_ids ? app.field_edge_ids.split(";").filter(Boolean) : [];
      const provenanceIds = structuralIds.length > 0 ? structuralIds : fieldIds;
      const edgeType = structuralIds.length > 0 ? app.structural_edge_types : app.field_edge_types;
      if (provenanceIds.length === 0) {
        fail(`application ${app.application_id} has no provenance edge ids`);
      }
      return {
        id: app.application_id,
        sourceId: Number(app.source_id),
        targetId: Number(app.target_id),
        operatorId: app.operator_id,
        availability: "available",
        provenance: {
          applicationId: app.application_id,
          projectionStatus: "audited_parallel_edge_projected",
          structuralEvidence: app.structural_evidence === "true",
          fieldEvidence: app.field_evidence === "true",
          structuralEdgeTypes: structuralIds.length > 0 ? app.structural_edge_types : null,
          fieldEdgeTypes: app.field_edge_types || null,
          provenanceEdgeTypes: edgeType,
          provenanceEdgeIds: provenanceIds,
          // legacy fields for backwards compat with schema that expects structuralEdgeTypes/Ids
          structuralEdgeTypes: edgeType,
          structuralEdgeIds: provenanceIds,
        },
      };
    })
    .sort((left, right) => left.sourceId - right.sourceId || left.targetId - right.targetId || left.operatorId.localeCompare(right.operatorId));

  if (new Set(moves.map((m) => m.id)).size !== moves.length) {
    fail("parallel catalog moves must have unique ids");
  }
  // Ensure every anchor appears as source at least once and as target at least once (parallel graph is connected)
  const sources = new Set(moves.map((m) => m.sourceId));
  const targets = new Set(moves.map((m) => m.targetId));
  if (sources.size !== 21 || targets.size !== 21) {
    fail("parallel catalog must cover all 21 anchors as source and target");
  }
  for (const anchorId of scopeIds) {
    if (!sources.has(anchorId) || !targets.has(anchorId)) {
      fail(`anchor ${anchorId} missing from parallel move coverage`);
    }
  }

  // Build operators array for catalog — preserve full registry metadata
  const catalogOperators = parallelOperators.map((op) => ({
    operatorId: op.operator_id,
    notation: op.notation,
    name: op.name,
    operatorClass: op.operator_class,
    degree: Number(op.degree),
    degreeGovernor: op.degree_governor,
    direction: op.direction,
    inverseOperatorId: op.inverse_operator_id,
    partial: true,
    status: op.status,
  }));

  const fingerprintInput = {
    schemaVersion: "harmonic-orrery.legal-moves.v2",
    catalogId: "harmonic-orrery.parallel-anchor-edges.v1",
    scope: {
      nodesSchemaVersion: "harmonic-orrery.nodes.v2",
      harmonicDescriptorReleaseId: candidate.releaseId,
      harmonicDescriptorFingerprint: candidate.candidateFingerprint,
      anchorIds: scopeIds,
      anchors: scopeAnchors,
    },
    sources: [
      sourceArtifact(candidatePath, "A0-A2 anchor scope"),
      sourceArtifact(operatorRegistryPath, "parallel operator metadata (fixed_degree_shift)"),
      sourceArtifact(applicationsPath, "source-backed parallel applications (R/L)"),
    ],
    operators: catalogOperators,
    moves: moves.map((m) => ({
      id: m.id,
      sourceId: m.sourceId,
      targetId: m.targetId,
      operatorId: m.operatorId,
      availability: m.availability,
      provenance: {
        applicationId: m.provenance.applicationId,
        projectionStatus: m.provenance.projectionStatus,
        structuralEvidence: m.provenance.structuralEvidence,
        fieldEvidence: m.provenance.fieldEvidence,
        provenanceEdgeTypes: m.provenance.provenanceEdgeTypes,
        provenanceEdgeIds: m.provenance.provenanceEdgeIds,
        structuralEdgeTypes: m.provenance.structuralEdgeTypes,
        structuralEdgeIds: m.provenance.structuralEdgeIds,
      },
    })),
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
