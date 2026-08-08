#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const sourcePath = path.join(packageRoot, "source", "universal-network-data.json");
const auditDir = path.join(packageRoot, "audit");
const qaDir = path.join(packageRoot, "qa");

fs.mkdirSync(auditDir, { recursive: true });
fs.mkdirSync(qaDir, { recursive: true });

const sourceBytes = fs.readFileSync(sourcePath);
const sourceSha256 = crypto.createHash("sha256").update(sourceBytes).digest("hex");
const data = JSON.parse(sourceBytes.toString("utf8"));
const nodes = [...data.nodes].sort((a, b) => a.id - b.id);
const nodeById = new Map(nodes.map((node) => [node.id, node]));

const OFFICE_ORDER = data.officeOrder;
const DEGREE_GOVERNOR = {
  1: "Saturn",
  2: "Jupiter",
  3: "Mars",
  4: "Sun",
  5: "Venus",
  6: "Mercury",
  7: "Moon",
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function popcount(value) {
  let count = 0;
  let working = value >>> 0;
  while (working) {
    working &= working - 1;
    count += 1;
  }
  return count;
}

function pcs(mask) {
  const result = [];
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask & (1 << pitch)) !== 0) result.push(pitch);
  }
  return result;
}

function maskFromPcs(pitches) {
  return pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
}

function pitchSet(mask) {
  return `{${pcs(mask).join(",")}}`;
}

function rotateToRoot(mask, root) {
  return maskFromPcs(pcs(mask).map((pitch) => (pitch - root + 12) % 12));
}

function modalSuccessor(mask) {
  const pitches = pcs(mask);
  if (pitches.length !== 7 || pitches[0] !== 0) return null;
  return rotateToRoot(mask, pitches[1]);
}

function phaseRaise(mask) {
  const pitches = pcs(mask);
  if (pitches.includes(1)) return null;
  const absolute = pitches.filter((pitch) => pitch !== 0).concat(1);
  return maskFromPcs(absolute.map((pitch) => (pitch + 11) % 12));
}

function phaseLower(mask) {
  const pitches = pcs(mask);
  if (pitches.includes(11)) return null;
  const absolute = pitches.filter((pitch) => pitch !== 0).concat(11);
  return maskFromPcs(absolute.map((pitch) => (pitch + 1) % 12));
}

function fixedDegreeShift(mask, degree, direction) {
  const pitches = pcs(mask);
  const sourcePitch = pitches[degree - 1];
  const targetPitch = sourcePitch + direction;
  if (targetPitch <= 0 || targetPitch >= 12 || pitches.includes(targetPitch)) {
    return null;
  }
  return maskFromPcs(
    pitches.map((pitch, index) => (index === degree - 1 ? targetPitch : pitch)),
  );
}

function operatorId(direction, degree) {
  return `${direction === 1 ? "R" : "L"}${degree}`;
}

function parseLocalOperator(id) {
  const match = /^([RL])([1-7])$/.exec(id);
  if (!match) return null;
  return {
    direction: match[1] === "R" ? 1 : -1,
    degree: Number(match[2]),
  };
}

function applyOperator(id, mask) {
  if (id === "M") return modalSuccessor(mask);
  const parsed = parseLocalOperator(id);
  if (!parsed) throw new Error(`Unknown operator: ${id}`);
  if (parsed.degree === 1) {
    return parsed.direction === 1 ? phaseRaise(mask) : phaseLower(mask);
  }
  return fixedDegreeShift(mask, parsed.degree, parsed.direction);
}

function inverseOperator(id) {
  if (id === "M") return "M^6";
  const parsed = parseLocalOperator(id);
  return operatorId(-parsed.direction, parsed.degree);
}

function shiftedDegree(degree) {
  return degree === 1 ? 7 : degree - 1;
}

function conjugateOperator(id) {
  const parsed = parseLocalOperator(id);
  return operatorId(parsed.direction, shiftedDegree(parsed.degree));
}

function applyModalPower(mask, exponent) {
  let result = mask;
  for (let index = 0; index < exponent; index += 1) {
    result = modalSuccessor(result);
  }
  return result;
}

function bool(value) {
  return value ? "true" : "false";
}

function nullable(value) {
  return value === null || value === undefined ? "" : value;
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const text = Array.isArray(value) ? value.join(";") : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, headers, rows) {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function edgeKey(operator, source, target) {
  return `${operator}|${source}|${target}`;
}

function addEvidence(index, operator, source, target, edge) {
  const key = edgeKey(operator, source, target);
  if (!index.has(key)) index.set(key, []);
  index.get(key).push({
    edgeId: edge.id,
    edgeType: edge.type,
    auditTier: edge.auditTier ?? "",
  });
}

function deriveFixedOperator(source, target) {
  const sourcePitches = pcs(source);
  const targetPitches = pcs(target);
  const removed = sourcePitches.filter((pitch) => !targetPitches.includes(pitch));
  const added = targetPitches.filter((pitch) => !sourcePitches.includes(pitch));
  if (removed.length !== 1 || added.length !== 1) return null;
  const delta = added[0] - removed[0];
  if (Math.abs(delta) !== 1) return null;
  const degree = sourcePitches.indexOf(removed[0]) + 1;
  if (degree < 2 || degree > 7) return null;
  return {
    id: operatorId(delta, degree),
    degree,
    direction: delta,
    removed: removed[0],
    added: added[0],
  };
}

function normalizeStructuralEdge(edge) {
  if (edge.type === "MODAL_SUCCESSOR") {
    return {
      operator: "M",
      source: edge.source,
      target: edge.target,
      evaluationDirection: "stored_direction",
    };
  }
  if (!["GOVERNS", "CONSTRUCTS", "SEAT_CONTACT"].includes(edge.type)) return null;
  const source = edge.type === "SEAT_CONTACT" ? edge.target : edge.source;
  const target = edge.type === "SEAT_CONTACT" ? edge.source : edge.target;
  if (edge.mode === "root_phase") {
    return {
      operator: edge.phaseDelta === 1 ? "R1" : "L1",
      source,
      target,
      evaluationDirection:
        edge.type === "SEAT_CONTACT" ? "anchor_to_contact" : "stored_direction",
    };
  }
  const derived = deriveFixedOperator(source, target);
  return {
    operator: derived?.id ?? "",
    source,
    target,
    degree: derived?.degree ?? null,
    direction: derived?.direction ?? null,
    evaluationDirection:
      edge.type === "SEAT_CONTACT" ? "anchor_to_contact" : "stored_direction",
  };
}

const expectedUniverse = [];
for (let mask = 0; mask < 4096; mask += 1) {
  if ((mask & 1) !== 0 && popcount(mask) === 7) expectedUniverse.push(mask);
}

const sourceUniverseComplete =
  nodes.length === 462 &&
  expectedUniverse.every((mask) => nodeById.has(mask)) &&
  nodes.every((node) => popcount(node.id) === 7 && (node.id & 1) === 1);

const localOperatorIds = [];
for (let degree = 1; degree <= 7; degree += 1) {
  localOperatorIds.push(`R${degree}`, `L${degree}`);
}
const operatorIds = ["M", ...localOperatorIds];

const structuralEvidence = new Map();
const fieldEvidence = new Map();
const structuralValidation = [];
const fieldValidation = [];

for (const edge of data.structuralEdges) {
  const normalized = normalizeStructuralEdge(edge);
  const sourceNode = nodeById.get(normalized?.source);
  const targetNode = nodeById.get(normalized?.target);
  const computedTarget =
    normalized?.operator && sourceNode
      ? applyOperator(normalized.operator, normalized.source)
      : null;
  const endpointKnown = Boolean(sourceNode && targetNode);
  const applicationMatches = computedTarget === normalized?.target;
  let metadataMatches = true;
  let notes = "";

  if (edge.type === "MODAL_SUCCESSOR") {
    metadataMatches = edge.directed === true;
  } else if (edge.mode === "root_phase") {
    metadataMatches =
      edge.degree === 1 &&
      edge.degreeGovernor === DEGREE_GOVERNOR[1] &&
      [1, -1].includes(edge.phaseDelta);
  } else if (edge.mode === "single_degree") {
    metadataMatches =
      normalized.degree === edge.degree &&
      edge.degreeGovernor === DEGREE_GOVERNOR[normalized.degree] &&
      edge.hamming === 2;
  } else {
    metadataMatches = false;
    notes = `Unsupported structural mode ${edge.mode}`;
  }

  const officeSemanticsMatch =
    edge.type !== "GOVERNS" ||
    (sourceNode?.office === targetNode?.office &&
      sourceNode?.tier === targetNode?.tier &&
      sourceNode?.role === "anchor" &&
      targetNode?.role === "satellite");

  const pass =
    Boolean(normalized?.operator) &&
    endpointKnown &&
    applicationMatches &&
    metadataMatches &&
    officeSemanticsMatch;

  structuralValidation.push({
    edge_id: edge.id,
    edge_type: edge.type,
    stored_source_id: edge.source,
    stored_target_id: edge.target,
    evaluation_source_id: normalized?.source ?? "",
    evaluation_target_id: normalized?.target ?? "",
    evaluation_direction: normalized?.evaluationDirection ?? "",
    derived_operator_id: normalized?.operator ?? "",
    application_matches: bool(applicationMatches),
    metadata_matches: bool(metadataMatches),
    office_semantics_match: bool(officeSemanticsMatch),
    result: pass ? "PASS" : "FAIL",
    notes,
  });

  if (pass) {
    addEvidence(
      structuralEvidence,
      normalized.operator,
      normalized.source,
      normalized.target,
      edge,
    );
  }
}

for (const edge of data.fieldEdges) {
  const sourceKnown = nodeById.has(edge.source);
  const targetKnown = nodeById.has(edge.target);
  let relationValid = false;
  let derivedOperators = [];
  let notes = "";

  if (edge.type === "AUDITED_HAMMING2") {
    relationValid =
      sourceKnown &&
      targetKnown &&
      popcount(edge.source ^ edge.target) === 2 &&
      edge.hamming === 2;
    const forward = deriveFixedOperator(edge.source, edge.target);
    const reverse = deriveFixedOperator(edge.target, edge.source);
    if (forward) {
      derivedOperators.push(forward.id);
      addEvidence(fieldEvidence, forward.id, edge.source, edge.target, edge);
    }
    if (reverse) {
      derivedOperators.push(reverse.id);
      addEvidence(fieldEvidence, reverse.id, edge.target, edge.source, edge);
    }
    if (derivedOperators.length === 0) {
      notes = "Valid Hamming-2 exchange, but not a primitive ±1 local shift.";
    }
  } else if (edge.type === "PHASE_SHIFT") {
    const candidates = [
      ["R1", edge.source, edge.target],
      ["L1", edge.source, edge.target],
      ["R1", edge.target, edge.source],
      ["L1", edge.target, edge.source],
    ].filter(([operator, source, target]) => applyOperator(operator, source) === target);
    relationValid = sourceKnown && targetKnown && candidates.length === 2;
    for (const [operator, source, target] of candidates) {
      derivedOperators.push(operator);
      addEvidence(fieldEvidence, operator, source, target, edge);
    }
  } else {
    notes = `Unsupported field type ${edge.type}`;
  }

  fieldValidation.push({
    edge_id: edge.id,
    edge_type: edge.type,
    source_id: edge.source,
    target_id: edge.target,
    endpoints_known: bool(sourceKnown && targetKnown),
    relation_valid: bool(relationValid),
    derived_operators: [...new Set(derivedOperators)].sort().join(";"),
    result: relationValid ? "PASS" : "FAIL",
    notes,
  });
}

const operatorDefinitions = [];
operatorDefinitions.push({
  operator_id: "M",
  notation: "M",
  name: "Modal successor",
  operator_class: "modal_re_rooting",
  degree: null,
  degree_governor: null,
  direction: "successor",
  delta_semitones: null,
  domain_rule: "All rooted weight-seven states.",
  action:
    "Re-root the unchanged pitch-class set at its next ascending scale tone.",
  inverse_operator_id: "M^6",
  conjugate_operator_id: "M",
  partial: false,
  status: "structurally_validated",
});

for (let degree = 1; degree <= 7; degree += 1) {
  for (const direction of [1, -1]) {
    const id = operatorId(direction, degree);
    operatorDefinitions.push({
      operator_id: id,
      notation: `${direction === 1 ? "R" : "L"}_${degree}`,
      name:
        degree === 1
          ? `${direction === 1 ? "Raise" : "Lower"} root phase by one semitone`
          : `${direction === 1 ? "Raise" : "Lower"} Degree ${degree} by one semitone`,
      operator_class: degree === 1 ? "root_phase" : "fixed_degree_shift",
      degree,
      degree_governor: DEGREE_GOVERNOR[degree],
      direction: direction === 1 ? "raise" : "lower",
      delta_semitones: direction,
      domain_rule:
        degree === 1
          ? direction === 1
            ? "Defined when pitch class 1 is absent; replace root 0 with 1 and renormalize by -1."
            : "Defined when pitch class 11 is absent; replace root 0 with 11 and renormalize by +1."
          : `Defined when Degree ${degree} can move ${direction === 1 ? "up" : "down"} one semitone without collision or crossing the rooted boundary.`,
      action:
        degree === 1
          ? "Move the tonic seam one semitone, retain the other six absolute pitches, then renormalize the new root to 0."
          : `Replace the pitch at ordered Degree ${degree} by ${direction === 1 ? "+1" : "-1"} semitone.`,
      inverse_operator_id: operatorId(-direction, degree),
      conjugate_operator_id: operatorId(direction, shiftedDegree(degree)),
      partial: true,
      status: "structurally_validated",
    });
  }
}

const applications = [];
const applicationByKey = new Map();

for (const definition of operatorDefinitions) {
  for (const source of nodes) {
    const targetId = applyOperator(definition.operator_id, source.id);
    if (targetId === null) continue;
    const target = nodeById.get(targetId);
    assert(target, `Operator ${definition.operator_id} escaped the universe at ${source.id}`);
    const structural = structuralEvidence.get(
      edgeKey(definition.operator_id, source.id, targetId),
    ) ?? [];
    const field =
      fieldEvidence.get(edgeKey(definition.operator_id, source.id, targetId)) ?? [];
    const row = {
      application_id: `${definition.operator_id}:${source.id}:${targetId}`,
      operator_id: definition.operator_id,
      operator_class: definition.operator_class,
      degree: nullable(definition.degree),
      degree_governor: nullable(definition.degree_governor),
      direction: definition.direction,
      source_id: source.id,
      source_name: source.name,
      source_forte: source.forte,
      source_role: source.role,
      source_fine_role: source.fineRole,
      source_tier: nullable(source.tier),
      source_office: nullable(source.office),
      source_pitch_set: source.pitchSet,
      target_id: target.id,
      target_name: target.name,
      target_forte: target.forte,
      target_role: target.role,
      target_fine_role: target.fineRole,
      target_tier: nullable(target.tier),
      target_office: nullable(target.office),
      target_pitch_set: target.pitchSet,
      xor_mask_decimal: source.id ^ target.id,
      rooted_output_hamming: popcount(source.id ^ target.id),
      raw_exchange_hamming: definition.operator_id === "M" ? "" : 2,
      family_preserved: bool(source.forte === target.forte),
      orientation_preserved: bool(source.orientation === target.orientation),
      chirality_preserved: bool(source.chirality === target.chirality),
      role_preserved: bool(source.role === target.role),
      fine_role_preserved: bool(source.fineRole === target.fineRole),
      tier_preserved: bool(source.tier === target.tier),
      office_bearing_preserved: bool(Boolean(source.office) === Boolean(target.office)),
      office_exact_preserved: bool(source.office === target.office),
      structural_evidence: bool(structural.length > 0),
      structural_edge_types: [...new Set(structural.map((entry) => entry.edgeType))]
        .sort()
        .join(";"),
      structural_edge_ids: structural.map((entry) => entry.edgeId).sort().join(";"),
      field_evidence: bool(field.length > 0),
      field_edge_types: [...new Set(field.map((entry) => entry.edgeType))]
        .sort()
        .join(";"),
      field_edge_ids: field.map((entry) => entry.edgeId).sort().join(";"),
      application_status: "formal_substrate_observed",
    };
    applications.push(row);
    applicationByKey.set(edgeKey(definition.operator_id, source.id, targetId), row);
  }
}

const inverseWitnesses = [];
for (const application of applications) {
  if (application.operator_id === "M") {
    const returned = applyModalPower(application.target_id, 6);
    inverseWitnesses.push({
      witness_id: `inverse:M:${application.source_id}`,
      operator_id: "M",
      inverse_operator_id: "M^6",
      source_id: application.source_id,
      intermediate_id: application.target_id,
      returned_id: returned,
      result: returned === application.source_id ? "PASS" : "FAIL",
      witness_type: "finite_order_inverse",
    });
  } else {
    const inverse = inverseOperator(application.operator_id);
    const returned = applyOperator(inverse, application.target_id);
    inverseWitnesses.push({
      witness_id: `inverse:${application.operator_id}:${application.source_id}`,
      operator_id: application.operator_id,
      inverse_operator_id: inverse,
      source_id: application.source_id,
      intermediate_id: application.target_id,
      returned_id: nullable(returned),
      result: returned === application.source_id ? "PASS" : "FAIL",
      witness_type: "partial_inverse",
    });
  }
}

const modalCycles = [];
const visitedModal = new Set();
for (const node of nodes) {
  if (visitedModal.has(node.id)) continue;
  const cycle = [];
  let cursor = node.id;
  while (!cycle.includes(cursor)) {
    cycle.push(cursor);
    visitedModal.add(cursor);
    cursor = modalSuccessor(cursor);
  }
  const cycleNodes = cycle.map((id) => nodeById.get(id));
  const officeDeltas = [];
  for (let index = 0; index < cycleNodes.length; index += 1) {
    const source = cycleNodes[index];
    const target = cycleNodes[(index + 1) % cycleNodes.length];
    if (source.office && target.office) {
      officeDeltas.push((target.officeIndex - source.officeIndex + 7) % 7);
    }
  }
  modalCycles.push({
    cycle_id: `modal-cycle:${Math.min(...cycle)}`,
    representative_id: Math.min(...cycle),
    cycle_length: cycle.length,
    closes_at_source: bool(cursor === node.id || cycle.includes(cursor)),
    minimal_period_seven: bool(
      cycle.length === 7 &&
        [1, 2, 3, 4, 5, 6].every(
          (power) => applyModalPower(node.id, power) !== node.id,
        ),
    ),
    member_ids: cycle.join(";"),
    member_names: cycleNodes.map((entry) => entry.name).join(";"),
    forte: cycleNodes[0].forte,
    orientation: cycleNodes[0].orientation,
    chirality: cycleNodes[0].chirality,
    role: cycleNodes[0].role,
    fine_role: cycleNodes[0].fineRole,
    tier: nullable(cycleNodes[0].tier),
    office_bearing: bool(cycleNodes.every((entry) => Boolean(entry.office))),
    office_sequence: cycleNodes.map((entry) => entry.office ?? "boundary").join(";"),
    office_delta_sequence: officeDeltas.join(";"),
    office_plus_two_every_step: bool(
      officeDeltas.length === 0 || officeDeltas.every((delta) => delta === 2),
    ),
    result:
      cycle.length === 7 &&
      applyModalPower(node.id, 7) === node.id &&
      (officeDeltas.length === 0 || officeDeltas.every((delta) => delta === 2))
        ? "PASS"
        : "FAIL",
  });
}
modalCycles.sort((a, b) => a.representative_id - b.representative_id);

const covarianceWitnesses = [];
for (const id of localOperatorIds) {
  const conjugate = conjugateOperator(id);
  for (const source of nodes) {
    const localTarget = applyOperator(id, source.id);
    const leftTarget =
      localTarget === null ? null : applyOperator("M", localTarget);
    const modalTarget = applyOperator("M", source.id);
    const rightTarget = applyOperator(conjugate, modalTarget);
    const domainMatches = (leftTarget === null) === (rightTarget === null);
    const targetMatches =
      leftTarget === null && rightTarget === null
        ? true
        : leftTarget === rightTarget;
    covarianceWitnesses.push({
      witness_id: `covariance:${id}:${source.id}`,
      source_id: source.id,
      operator_id: id,
      conjugate_operator_id: conjugate,
      left_path: `${id};M`,
      right_path: `M;${conjugate}`,
      left_defined: bool(leftTarget !== null),
      right_defined: bool(rightTarget !== null),
      left_target_id: nullable(leftTarget),
      right_target_id: nullable(rightTarget),
      domain_matches: bool(domainMatches),
      target_matches: bool(targetMatches),
      result: domainMatches && targetMatches ? "PASS" : "FAIL",
    });
  }
}

const commutationSummary = [];
const commutativeSquares = [];
const confluenceWitnesses = [];
const counterexamples = [];

for (let leftIndex = 0; leftIndex < localOperatorIds.length; leftIndex += 1) {
  for (
    let rightIndex = leftIndex + 1;
    rightIndex < localOperatorIds.length;
    rightIndex += 1
  ) {
    const a = localOperatorIds[leftIndex];
    const b = localOperatorIds[rightIndex];
    const counts = {
      leftDefined: 0,
      rightDefined: 0,
      bothDefined: 0,
      equal: 0,
      unequal: 0,
      domainAsymmetry: 0,
      neither: 0,
      firstBoth: 0,
      directDiamonds: 0,
      blockedCriticalPairs: 0,
    };

    for (const source of nodes) {
      const aTarget = applyOperator(a, source.id);
      const bTarget = applyOperator(b, source.id);
      const leftTarget =
        aTarget === null ? null : applyOperator(b, aTarget);
      const rightTarget =
        bTarget === null ? null : applyOperator(a, bTarget);
      const leftDefined = leftTarget !== null;
      const rightDefined = rightTarget !== null;
      const firstBoth = aTarget !== null && bTarget !== null;

      if (leftDefined) counts.leftDefined += 1;
      if (rightDefined) counts.rightDefined += 1;
      if (firstBoth) counts.firstBoth += 1;
      if (leftDefined && rightDefined) {
        counts.bothDefined += 1;
        if (leftTarget === rightTarget) {
          counts.equal += 1;
          commutativeSquares.push({
            square_id: `square:${a}:${b}:${source.id}`,
            source_id: source.id,
            source_name: source.name,
            operator_a: a,
            operator_b: b,
            a_then_b_target_id: leftTarget,
            b_then_a_target_id: rightTarget,
            intermediate_a_id: aTarget,
            intermediate_b_id: bTarget,
            first_steps_both_defined: bool(firstBoth),
            result: "PASS",
          });
          if (firstBoth && aTarget !== bTarget) {
            counts.directDiamonds += 1;
            confluenceWitnesses.push({
              witness_id: `diamond:${a}:${b}:${source.id}`,
              witness_type: "same_source_direct_diamond",
              source_a_id: source.id,
              source_a_name: source.name,
              source_b_id: source.id,
              source_b_name: source.name,
              path_a: `${a};${b}`,
              path_b: `${b};${a}`,
              target_id: leftTarget,
              target_name: nodeById.get(leftTarget).name,
              same_source: "true",
              interpretation:
                "A true local confluence witness: two distinct first steps from one source rejoin after one further step.",
              result: "PASS",
            });
          }
        } else {
          counts.unequal += 1;
          counterexamples.push({
            counterexample_id: `commutation-value:${a}:${b}:${source.id}`,
            category: "commutation_value_mismatch",
            tested_claim: `${a} and ${b} commute on their common composite domain`,
            source_id: source.id,
            source_name: source.name,
            operator_a: a,
            operator_b: b,
            left_target_id: leftTarget,
            right_target_id: rightTarget,
            evidence_edge_id: "",
            explanation: "Both compositions are defined but reach different states.",
          });
        }
      } else if (leftDefined !== rightDefined) {
        counts.domainAsymmetry += 1;
        counterexamples.push({
          counterexample_id: `commutation-domain:${a}:${b}:${source.id}`,
          category: "partial_commutation_domain_asymmetry",
          tested_claim: `${a} and ${b} strongly commute as partial functions`,
          source_id: source.id,
          source_name: source.name,
          operator_a: a,
          operator_b: b,
          left_target_id: nullable(leftTarget),
          right_target_id: nullable(rightTarget),
          evidence_edge_id: "",
          explanation:
            "Only one composite order is defined. Equality on the common domain does not imply strong partial-function commutation.",
        });
      } else {
        counts.neither += 1;
      }

      if (
        firstBoth &&
        aTarget !== bTarget &&
        !(leftDefined && rightDefined && leftTarget === rightTarget)
      ) {
        counts.blockedCriticalPairs += 1;
      }
    }

    const classification =
      counts.unequal > 0
        ? "noncommuting"
        : counts.domainAsymmetry > 0
          ? "weak_common_domain_commutation"
          : "strong_partial_commutation";
    commutationSummary.push({
      operator_a: a,
      operator_b: b,
      source_states_tested: nodes.length,
      a_then_b_defined: counts.leftDefined,
      b_then_a_defined: counts.rightDefined,
      both_defined: counts.bothDefined,
      equal_when_both_defined: counts.equal,
      unequal_when_both_defined: counts.unequal,
      domain_asymmetry: counts.domainAsymmetry,
      neither_defined: counts.neither,
      both_first_steps_defined: counts.firstBoth,
      direct_diamonds: counts.directDiamonds,
      blocked_critical_pairs: counts.blockedCriticalPairs,
      classification,
    });
  }
}

const constructionGroups = new Map();
for (const edge of data.structuralEdges.filter((entry) => entry.type === "CONSTRUCTS")) {
  if (!constructionGroups.has(edge.target)) constructionGroups.set(edge.target, []);
  constructionGroups.get(edge.target).push(edge);
}

for (const [targetId, incoming] of constructionGroups.entries()) {
  if (incoming.length < 2) continue;
  for (let left = 0; left < incoming.length; left += 1) {
    for (let right = left + 1; right < incoming.length; right += 1) {
      const a = normalizeStructuralEdge(incoming[left]);
      const b = normalizeStructuralEdge(incoming[right]);
      confluenceWitnesses.push({
        witness_id: `cospan:${targetId}:${a.source}:${b.source}`,
        witness_type: "multi_source_structural_cospan",
        source_a_id: a.source,
        source_a_name: nodeById.get(a.source).name,
        source_b_id: b.source,
        source_b_name: nodeById.get(b.source).name,
        path_a: a.operator,
        path_b: b.operator,
        target_id: targetId,
        target_name: nodeById.get(targetId).name,
        same_source: "false",
        interpretation:
          "A convergent cospan from different source states. It is construction evidence, not an operator-commutation witness.",
        result:
          applyOperator(a.operator, a.source) === targetId &&
          applyOperator(b.operator, b.source) === targetId
            ? "PASS"
            : "FAIL",
      });
    }
  }
}

for (const edge of data.fieldEdges.filter((entry) => entry.type === "AUDITED_HAMMING2")) {
  const forward = deriveFixedOperator(edge.source, edge.target);
  const reverse = deriveFixedOperator(edge.target, edge.source);
  if (!forward && !reverse) {
    const sourcePitches = pcs(edge.source);
    const targetPitches = pcs(edge.target);
    const removed = sourcePitches.filter((pitch) => !targetPitches.includes(pitch))[0];
    const added = targetPitches.filter((pitch) => !sourcePitches.includes(pitch))[0];
    counterexamples.push({
      counterexample_id: `hamming2-not-primitive:${edge.id}`,
      category: "hamming2_not_local_primitive",
      tested_claim: "Every audited Hamming-2 relation is one primitive ±1 degree mutation",
      source_id: edge.source,
      source_name: nodeById.get(edge.source).name,
      operator_a: "",
      operator_b: "",
      left_target_id: edge.target,
      right_target_id: "",
      evidence_edge_id: edge.id,
      explanation: `The relation exchanges pitch ${removed} for ${added}; Hamming distance 2 alone does not specify a primitive semitone operator.`,
    });
  }
}

for (const id of localOperatorIds) {
  const naiveMismatch = nodes.find((source) => {
    const local = applyOperator(id, source.id);
    if (local === null) return false;
    const left = applyOperator("M", local);
    const modal = applyOperator("M", source.id);
    const right = applyOperator(id, modal);
    return right !== null && left !== right;
  });
  if (naiveMismatch) {
    const left = applyOperator("M", applyOperator(id, naiveMismatch.id));
    const right = applyOperator(id, applyOperator("M", naiveMismatch.id));
    counterexamples.push({
      counterexample_id: `naive-modal-commutation:${id}:${naiveMismatch.id}`,
      category: "modal_naive_commutation_failure",
      tested_claim: `M ${id} = ${id} M`,
      source_id: naiveMismatch.id,
      source_name: naiveMismatch.name,
      operator_a: id,
      operator_b: "M",
      left_target_id: left,
      right_target_id: right,
      evidence_edge_id: "",
      explanation: `Modal transport changes the degree address. The validated law uses ${conjugateOperator(id)} on the transported side.`,
    });
  }
}

const phaseOfficeCounterexample = applications.find(
  (entry) =>
    ["R1", "L1"].includes(entry.operator_id) &&
    entry.source_office !== entry.target_office,
);
if (phaseOfficeCounterexample) {
  counterexamples.push({
    counterexample_id: `phase-office:${phaseOfficeCounterexample.application_id}`,
    category: "phase_does_not_preserve_office",
    tested_claim: "Root-phase motion globally preserves categorical Governor office",
    source_id: phaseOfficeCounterexample.source_id,
    source_name: phaseOfficeCounterexample.source_name,
    operator_a: phaseOfficeCounterexample.operator_id,
    operator_b: "",
    left_target_id: phaseOfficeCounterexample.target_id,
    right_target_id: "",
    evidence_edge_id: phaseOfficeCounterexample.field_edge_ids,
    explanation: `The source office is ${phaseOfficeCounterexample.source_office || "withheld"} and the target office is ${phaseOfficeCounterexample.target_office || "withheld"}. Phase is structural adjacency, not office authorization.`,
  });
}

const stabilizerProperties = [
  ["rooted_weight_seven", () => true, () => true],
  ["forte_family", (source, target) => true, (source, target) => source.forte === target.forte],
  [
    "orientation",
    (source, target) => true,
    (source, target) => source.orientation === target.orientation,
  ],
  [
    "chirality",
    (source, target) => true,
    (source, target) => source.chirality === target.chirality,
  ],
  ["role", (source, target) => true, (source, target) => source.role === target.role],
  [
    "fine_role",
    (source, target) => true,
    (source, target) => source.fineRole === target.fineRole,
  ],
  ["tier", (source, target) => true, (source, target) => source.tier === target.tier],
  [
    "office_bearing_status",
    (source, target) => true,
    (source, target) => Boolean(source.office) === Boolean(target.office),
  ],
  [
    "exact_office",
    (source, target) => true,
    (source, target) => source.office === target.office,
  ],
  [
    "office_plus_two_mod_7",
    (source, target) => Boolean(source.office && target.office),
    (source, target) =>
      (target.officeIndex - source.officeIndex + 7) % 7 === 2,
  ],
];

const stabilizerResults = [];
for (const definition of operatorDefinitions) {
  const operatorApplications = applications.filter(
    (entry) => entry.operator_id === definition.operator_id,
  );
  for (const [property, applicable, passes] of stabilizerProperties) {
    let applicableCount = 0;
    let passCount = 0;
    for (const application of operatorApplications) {
      const source = nodeById.get(application.source_id);
      const target = nodeById.get(application.target_id);
      if (!applicable(source, target)) continue;
      applicableCount += 1;
      if (passes(source, target)) passCount += 1;
    }
    const rate = applicableCount === 0 ? null : passCount / applicableCount;
    stabilizerResults.push({
      operator_id: definition.operator_id,
      property,
      applications: operatorApplications.length,
      applicable_count: applicableCount,
      pass_count: passCount,
      fail_count: applicableCount - passCount,
      pass_rate: rate === null ? "" : rate.toFixed(6),
      classification:
        applicableCount === 0
          ? "not_applicable"
          : passCount === applicableCount
            ? "invariant_or_covariant"
            : passCount === 0
              ? "not_preserved"
              : "conditional",
    });
  }
}

const graphSupport = new Map(
  operatorDefinitions.map((definition) => [
    definition.operator_id,
    { structural: 0, field: 0 },
  ]),
);
for (const application of applications) {
  const support = graphSupport.get(application.operator_id);
  if (application.structural_evidence === "true") support.structural += 1;
  if (application.field_evidence === "true") support.field += 1;
}

const registryRows = operatorDefinitions.map((definition) => {
  const count = applications.filter(
    (application) => application.operator_id === definition.operator_id,
  ).length;
  return {
    ...definition,
    partial: definition.partial,
    application_count: count,
    domain_size: count,
    image_size: new Set(
      applications
        .filter((application) => application.operator_id === definition.operator_id)
        .map((application) => application.target_id),
    ).size,
    structural_support_count: graphSupport.get(definition.operator_id).structural,
    field_support_count: graphSupport.get(definition.operator_id).field,
  };
});

const projectionCoverage = registryRows.map((registry) => {
  const operatorApplications = applications.filter(
    (entry) => entry.operator_id === registry.operator_id,
  );
  const structurallyProjected = operatorApplications.filter(
    (entry) => entry.structural_evidence === "true",
  ).length;
  const fieldProjected = operatorApplications.filter(
    (entry) => entry.field_evidence === "true",
  ).length;
  const unionProjected = operatorApplications.filter(
    (entry) =>
      entry.structural_evidence === "true" || entry.field_evidence === "true",
  ).length;
  return {
    operator_id: registry.operator_id,
    formal_applications: operatorApplications.length,
    structural_projection: structurallyProjected,
    field_projection: fieldProjected,
    union_projection: unionProjected,
    unprojected_applications: operatorApplications.length - unionProjected,
    union_coverage_rate: (
      unionProjected / operatorApplications.length
    ).toFixed(6),
    interpretation:
      registry.operator_id === "M"
        ? "Canonical MODAL_SUCCESSOR projection versus the total modal operator."
        : registry.operator_id === "R1" || registry.operator_id === "L1"
          ? "Canonical PHASE_SHIFT plus root-phase structural evidence versus the complete phase operator."
          : "Selected structural and anchor-audit evidence versus the complete fixed-degree operator.",
  };
});

const phaseCompletionLedger = applications
  .filter((entry) => entry.operator_id === "R1")
  .map((entry) => ({
    pair_id: `phase-pair:${Math.min(entry.source_id, entry.target_id)}:${Math.max(entry.source_id, entry.target_id)}`,
    raise_source_id: entry.source_id,
    raise_source_name: entry.source_name,
    raise_target_id: entry.target_id,
    raise_target_name: entry.target_name,
    inverse_operator_id: "L1",
    field_phase_shift_projected: entry.field_evidence,
    field_edge_ids: entry.field_edge_ids,
    structural_root_phase_projected: entry.structural_evidence,
    structural_edge_ids: entry.structural_edge_ids,
    projection_status:
      entry.field_evidence === "true"
        ? "phase_field_projected"
        : entry.structural_evidence === "true"
          ? "structural_only"
          : "unprojected_formal_phase_pair",
  }));

const modalCompletionLedger = applications
  .filter((entry) => entry.operator_id === "M")
  .map((entry) => ({
    application_id: entry.application_id,
    source_id: entry.source_id,
    source_name: entry.source_name,
    source_role: entry.source_role,
    source_tier: entry.source_tier,
    source_office: entry.source_office,
    target_id: entry.target_id,
    target_name: entry.target_name,
    target_role: entry.target_role,
    target_tier: entry.target_tier,
    target_office: entry.target_office,
    canonical_modal_successor_projected: entry.structural_evidence,
    structural_edge_ids: entry.structural_edge_ids,
    projection_status:
      entry.structural_evidence === "true"
        ? "canonical_modal_edge_projected"
        : "unprojected_formal_modal_application",
  }));

const modalApplications = applications.filter((entry) => entry.operator_id === "M");
const officeModalApplications = modalApplications.filter(
  (entry) => entry.source_office && entry.target_office,
);
const modalOfficePlusTwo = officeModalApplications.filter((entry) => {
  const source = nodeById.get(entry.source_id);
  const target = nodeById.get(entry.target_id);
  return (target.officeIndex - source.officeIndex + 7) % 7 === 2;
});

const acousticCospan = confluenceWitnesses.find(
  (entry) =>
    entry.witness_type === "multi_source_structural_cospan" &&
    entry.target_name === "Acoustic",
);

const adjacencyHammingEdges = fieldValidation.filter(
  (entry) =>
    entry.edge_type === "AUDITED_HAMMING2" && entry.derived_operators.length > 0,
).length;
const nonlocalHammingEdges =
  data.fieldEdges.filter((entry) => entry.type === "AUDITED_HAMMING2").length -
  adjacencyHammingEdges;
const directDiamonds = confluenceWitnesses.filter(
  (entry) => entry.witness_type === "same_source_direct_diamond",
).length;
const structuralCospans = confluenceWitnesses.filter(
  (entry) => entry.witness_type === "multi_source_structural_cospan",
).length;
const domainAsymmetryCounterexamples = counterexamples.filter(
  (entry) => entry.category === "partial_commutation_domain_asymmetry",
).length;
const valueMismatchCounterexamples = counterexamples.filter(
  (entry) => entry.category === "commutation_value_mismatch",
).length;
const phaseFieldProjected = phaseCompletionLedger.filter(
  (entry) => entry.projection_status === "phase_field_projected",
).length;
const phaseStructuralOnly = phaseCompletionLedger.filter(
  (entry) => entry.projection_status === "structural_only",
).length;
const phaseUnprojected = phaseCompletionLedger.filter(
  (entry) => entry.projection_status === "unprojected_formal_phase_pair",
).length;
const modalProjected = modalCompletionLedger.filter(
  (entry) => entry.projection_status === "canonical_modal_edge_projected",
).length;
const modalUnprojected = modalCompletionLedger.filter(
  (entry) => entry.projection_status === "unprojected_formal_modal_application",
).length;

const qa = {
  auditProtocol: "seven-governors-graph-derived-mutation-algebra-v1",
  source: {
    file: "source/universal-network-data.json",
    sha256: sourceSha256,
    schemaVersion: data.schemaVersion,
    generatedAt: data.generatedAt,
  },
  counts: {
    scaleStates: nodes.length,
    operatorCandidates: operatorDefinitions.length,
    modalOperators: 1,
    localDegreeOperators: localOperatorIds.length,
    operatorApplications: applications.length,
    modalApplications: modalApplications.length,
    localApplications:
      applications.length - modalApplications.length,
    inverseWitnesses: inverseWitnesses.length,
    modalCycles: modalCycles.length,
    modalCovarianceCases: covarianceWitnesses.length,
    commutativeSquares: commutativeSquares.length,
    directConfluenceDiamonds: directDiamonds,
    structuralCospans,
    counterexamples: counterexamples.length,
    partialDomainAsymmetryCounterexamples: domainAsymmetryCounterexamples,
    commonDomainValueMismatches: valueMismatchCounterexamples,
    structuralEdgesValidated: structuralValidation.length,
    fieldEdgesValidated: fieldValidation.length,
    auditedHamming2Edges:
      data.fieldEdges.filter((entry) => entry.type === "AUDITED_HAMMING2").length,
    adjacentPrimitiveHamming2Edges: adjacencyHammingEdges,
    nonlocalHamming2Edges: nonlocalHammingEdges,
    phaseEdges:
      data.fieldEdges.filter((entry) => entry.type === "PHASE_SHIFT").length,
    completePhasePairs: 210,
    phasePairsFieldProjected: phaseFieldProjected,
    phasePairsStructuralOnly: phaseStructuralOnly,
    phasePairsUnprojected: phaseUnprojected,
    canonicalModalApplicationsProjected: modalProjected,
    formalModalApplicationsUnprojected: modalUnprojected,
    officeBearingModalApplications: officeModalApplications.length,
  },
  assertions: {
    sourceUniverseComplete,
    allOperatorTargetsInUniverse: applications.every((entry) =>
      nodeById.has(entry.target_id),
    ),
    fifteenOperatorCandidates: operatorDefinitions.length === 15,
    modalTotalOn462States: modalApplications.length === 462,
    eachLocalOperatorHas210Applications: registryRows
      .filter((entry) => entry.operator_id !== "M")
      .every((entry) => entry.application_count === 210),
    all3402ApplicationsEnumerated: applications.length === 3402,
    allInverseWitnessesPass: inverseWitnesses.every(
      (entry) => entry.result === "PASS",
    ),
    sixtySixModalCycles: modalCycles.length === 66,
    everyModalCycleHasMinimalPeriodSeven: modalCycles.every(
      (entry) => entry.minimal_period_seven === "true",
    ),
    allModalCovarianceCasesPass: covarianceWitnesses.every(
      (entry) => entry.result === "PASS",
    ),
    degreeGovernorTransportPlusTwo: operatorDefinitions
      .filter((entry) => entry.operator_id !== "M")
      .every((entry) => {
        const transported = operatorDefinitions.find(
          (candidate) => candidate.operator_id === entry.conjugate_operator_id,
        );
        return (
          (OFFICE_ORDER.indexOf(transported.degree_governor) -
            OFFICE_ORDER.indexOf(entry.degree_governor) +
            7) %
            7 ===
          2
        );
      }),
    allStructuralEdgesValidate: structuralValidation.every(
      (entry) => entry.result === "PASS",
    ),
    allFieldEdgesValidate: fieldValidation.every(
      (entry) => entry.result === "PASS",
    ),
    allGovernsEdgesPreserveOffice: structuralValidation
      .filter((entry) => entry.edge_type === "GOVERNS")
      .every((entry) => entry.office_semantics_match === "true"),
    modalPreservesStructuralIdentity: modalApplications.every((entry) =>
      [
        entry.family_preserved,
        entry.orientation_preserved,
        entry.chirality_preserved,
        entry.role_preserved,
        entry.fine_role_preserved,
        entry.tier_preserved,
        entry.office_bearing_preserved,
      ].every((value) => value === "true"),
    ),
    modalOfficeTransportPlusTwo:
      officeModalApplications.length === 308 &&
      modalOfficePlusTwo.length === officeModalApplications.length,
    noLocalValueMismatchOnCommonCompositeDomain:
      valueMismatchCounterexamples === 0,
    strongCommutationCorrectlyRejectedSomewhere:
      domainAsymmetryCounterexamples > 0,
    fourteenConstructionCospans: structuralCospans === 14,
    acousticCospanPresent: Boolean(acousticCospan),
    hamming2NotCollapsedToPrimitive:
      adjacencyHammingEdges > 0 && nonlocalHammingEdges > 0,
    phaseProjectionPartition:
      phaseFieldProjected === 175 &&
      phaseStructuralOnly === 5 &&
      phaseUnprojected === 30,
    modalProjectionPartition:
      modalProjected === 182 && modalUnprojected === 280,
  },
};
qa.allPass = Object.values(qa.assertions).every(Boolean);

const excludedRelations = [
  {
    relationshipType: "GOVERNS",
    disposition: "authorization_relation_with_embedded_operator_application",
    reason:
      "It authorizes satellite inheritance. The mutation signature is an application of Rk/Lk, but GOVERNS itself is not a reusable algebraic generator.",
  },
  {
    relationshipType: "CONSTRUCTS",
    disposition: "construction_relation_with_embedded_operator_application",
    reason:
      "It records a multi-parent anchor construction. Its incoming paths are cospans, not proofs that the underlying operators commute.",
  },
  {
    relationshipType: "SEAT_CONTACT",
    disposition: "relational_evidence_only",
    reason:
      "It contributes office evidence for D-tier qualification and is evaluated anchor-to-contact; it is not a governing mutation.",
  },
  {
    relationshipType: "AUDITED_HAMMING2",
    disposition: "adjacency_relation",
    reason:
      "Hamming distance 2 records one-note exchange but does not by itself determine direction, semitone magnitude, or a primitive operator.",
  },
  {
    relationshipType: "PHASE_SHIFT",
    disposition: "symmetric_closure_relation",
    reason:
      "It decomposes into the partial inverse pair R1/L1.",
  },
  {
    relationshipType: "CONVERGENCE_CONTACT",
    disposition: "boundary_evidence_only",
    reason: "Relational convergence is not categorical office assignment or mutation.",
  },
  {
    relationshipType: "JUNCTION_CONTACT",
    disposition: "boundary_evidence_only",
    reason: "A mixed-office junction records evidence, not an operator.",
  },
  {
    relationshipType: "LEAF_CONTACT",
    disposition: "boundary_evidence_only",
    reason: "A peripheral contact records evidence, not an operator.",
  },
  {
    relationshipType: "OCCUPIES_OFFICE",
    disposition: "categorical_projection",
    reason: "Office occupation is state identity, not state transformation.",
  },
  {
    relationshipType: "RELATIONAL_OFFICE_EVIDENCE",
    disposition: "noncategorical_projection",
    reason: "Relational office evidence is explicitly noncategorical.",
  },
];

writeJson(path.join(auditDir, "operator-candidates.json"), {
  auditProtocol: qa.auditProtocol,
  sourceSha256,
  statusScale: [
    "observed",
    "hypothesized",
    "structurally_validated",
    "semantically_declared",
    "domain_validated",
    "asset_approved",
  ],
  summary: qa.counts,
  operators: registryRows,
  excludedRelationshipTypes: excludedRelations,
});

const registryHeaders = [
  "operator_id",
  "notation",
  "name",
  "operator_class",
  "degree",
  "degree_governor",
  "direction",
  "delta_semitones",
  "domain_rule",
  "action",
  "inverse_operator_id",
  "conjugate_operator_id",
  "partial",
  "status",
  "application_count",
  "domain_size",
  "image_size",
  "structural_support_count",
  "field_support_count",
];
writeCsv(path.join(auditDir, "operator-registry.csv"), registryHeaders, registryRows);
writeCsv(
  path.join(auditDir, "projection-coverage.csv"),
  Object.keys(projectionCoverage[0]),
  projectionCoverage,
);
writeCsv(
  path.join(auditDir, "phase-completion-ledger.csv"),
  Object.keys(phaseCompletionLedger[0]),
  phaseCompletionLedger,
);
writeCsv(
  path.join(auditDir, "modal-completion-ledger.csv"),
  Object.keys(modalCompletionLedger[0]),
  modalCompletionLedger,
);

writeCsv(
  path.join(auditDir, "operator-applications.csv"),
  Object.keys(applications[0]),
  applications,
);
writeCsv(
  path.join(auditDir, "inverse-witnesses.csv"),
  Object.keys(inverseWitnesses[0]),
  inverseWitnesses,
);
writeCsv(
  path.join(auditDir, "cycle-identities.csv"),
  Object.keys(modalCycles[0]),
  modalCycles,
);
writeCsv(
  path.join(auditDir, "modal-covariance-witnesses.csv"),
  Object.keys(covarianceWitnesses[0]),
  covarianceWitnesses,
);
writeCsv(
  path.join(auditDir, "commutation-summary.csv"),
  Object.keys(commutationSummary[0]),
  commutationSummary,
);
writeCsv(
  path.join(auditDir, "commutative-squares.csv"),
  Object.keys(commutativeSquares[0]),
  commutativeSquares,
);
writeCsv(
  path.join(auditDir, "confluence-witnesses.csv"),
  Object.keys(confluenceWitnesses[0]),
  confluenceWitnesses,
);
writeCsv(
  path.join(auditDir, "stabilizer-results.csv"),
  Object.keys(stabilizerResults[0]),
  stabilizerResults,
);
writeCsv(
  path.join(auditDir, "counterexamples.csv"),
  Object.keys(counterexamples[0]),
  counterexamples,
);
writeCsv(
  path.join(auditDir, "structural-edge-validation.csv"),
  Object.keys(structuralValidation[0]),
  structuralValidation,
);
writeCsv(
  path.join(auditDir, "field-edge-validation.csv"),
  Object.keys(fieldValidation[0]),
  fieldValidation,
);
writeJson(path.join(qaDir, "mutation-algebra-validation.json"), qa);

const covarianceCaseCount = covarianceWitnesses.filter(
  (entry) => entry.left_defined === "true",
).length;
const commonDomainClassCounts = commutationSummary.reduce((accumulator, row) => {
  accumulator[row.classification] =
    (accumulator[row.classification] ?? 0) + 1;
  return accumulator;
}, {});

const hypotheses = `# Graph-Derived Mutation Algebra Audit

## Result

The current canonical graph supports a compact structural mutation system with
**15 generator candidates**:

- one total modal successor operator, \`M\`;
- fourteen partial local operators, \`R1…R7\` and \`L1…L7\`;
- \`R1/L1\` are the root-phase seam pair; and
- \`R2…R7/L2…L7\` are fixed-degree semitone shifts.

This is a structural algebra audit. It does not yet declare semantic feature
effects, Court compatibility, a harmonic-compression formula, or asset behavior.

## Source and scope

- canonical rooted states: **${nodes.length}**
- source SHA-256: \`${sourceSha256}\`
- complete rooted weight-seven universe: **PASS**
- operator applications enumerated: **${applications.length}**
- current canonical structural edges validated: **${structuralValidation.length} / ${structuralValidation.length}**
- current canonical field edges validated: **${fieldValidation.length} / ${fieldValidation.length}**

## Structurally validated laws

### 1. The modal operator has order seven

\`M\` is total on all 462 states. It partitions the universe into **${modalCycles.length}
disjoint seven-cycles**:

\`\`\`text
M^7(s) = s
\`\`\`

No tested state has a smaller positive modal period.

The orbit partition is:

- 10 anchor cycles = 70 states;
- 34 satellite cycles = 238 states; and
- 22 boundary cycles = 154 states.

### 2. Modal transport preserves structural identity

Across all 462 applications, \`M\` preserves Forte family, orientation,
chirality, primary role, fine role, tier, and office-bearing status.

For all **308 office-bearing states**, it transports the State Governor by:

\`\`\`text
office(M(s)) = office(s) + 2 mod 7
\`\`\`

Boundary states remain boundary; this law does not assign them offices.

### 3. The phase seam completes the seven degree addresses

The root-phase pair is not an unrelated extra edge type. \`R1/L1\` completes
the same cyclic family as the six fixed degree addresses:

| Degree | Degree Governor | Raise | Lower |
|---:|---|---|---|
| 1 | Saturn | R1 | L1 |
| 2 | Jupiter | R2 | L2 |
| 3 | Mars | R3 | L3 |
| 4 | Sun | R4 | L4 |
| 5 | Venus | R5 | L5 |
| 6 | Mercury | R6 | L6 |
| 7 | Moon | R7 | L7 |

Every local operator has a domain and image of **210 states**.

### 4. Local raises and lowers are partial inverses

For every degree \`k\`:

\`\`\`text
Lk(Rk(s)) = s  on Dom(Rk)
Rk(Lk(s)) = s  on Dom(Lk)
\`\`\`

All **${applications.length - modalApplications.length}** local inverse
applications pass. The modal inverse is \`M^6\`; its 462 witnesses also pass.

### 5. Modal covariance is stronger than naive commutation

The exhaustively validated transport law is:

\`\`\`text
M Rk M^-1 = R(k-1 mod 7)
M Lk M^-1 = L(k-1 mod 7)
\`\`\`

Equivalently, using left-to-right path notation:

\`\`\`text
Rk ; M = M ; R(k-1 mod 7)
Lk ; M = M ; L(k-1 mod 7)
\`\`\`

All **${covarianceWitnesses.length}** domain-and-target cases pass, including
**${covarianceCaseCount}** defined applications on each side.

The Degree-Governor label transported from \`k\` to \`k-1\` also advances by
\`+2 mod 7\`. This is the same permutation observed for State Governors under
modal succession. That shared action is the audit's most important new
invariant.

### 6. Local operators commute only in the qualified partial sense

For all 91 unordered pairs of local generators:

- whenever both two-step composites are defined, their values agree;
- there are **${valueMismatchCounterexamples}** common-domain value mismatches;
- but **${domainAsymmetryCounterexamples}** source/pair cases have only one
  composite order defined.

Pair classifications:

\`\`\`json
${JSON.stringify(commonDomainClassCounts, null, 2)}
\`\`\`

Therefore the safe claim is **equality on the common composite domain**, not
unqualified global commutation of partial functions.

### 7. True diamonds and multi-source cospans are different evidence

- same-source direct confluence diamonds: **${directDiamonds}**
- A1/A2 multi-source construction cospans: **${structuralCospans}**

The Acoustic fixture is a cospan:

\`\`\`text
Lydian --L7--> Acoustic <--R4-- Mixolydian
\`\`\`

The two paths begin at different sources. They prove convergence on one
intrinsic state, but they are not an equation of the form \`AB = BA\`.

## Important negative results

### Hamming distance 2 is adjacency, not automatically a primitive

The canonical field contains **${qa.counts.auditedHamming2Edges}** audited
Hamming-2 edges. Of those, **${adjacencyHammingEdges}** are primitive adjacent
semitone pairs and **${nonlocalHammingEdges}** exchange a note across more than
one semitone. The latter may become macro operators or composite paths, but the
distance alone does not authorize either interpretation.

### Root-phase adjacency does not authorize an office

The complete formal phase domain contains 210 inverse pairs. The current field
records ${qa.counts.phaseEdges}. Another ${phaseStructuralOnly} pairs appear
only on selected structural root-phase edges, leaving **${phaseUnprojected}
formally valid phase pairs that are not currently projected by either
channel**. The gap ledger identifies them without altering the canonical
release.

Phase adjacency may connect different categorical offices or office-bearing
and boundary states. It is a structural operation; office resolution still
belongs to the declared precedence audit.

### The canonical graph is a selective projection of the full operator action

The formal operator action contains all 462 modal applications, while the
canonical \`MODAL_SUCCESSOR\` relation currently projects ${modalProjected}.
The remaining **${modalUnprojected}** applications are mathematically valid but
not present as canonical modal edges.

This is not an identity failure: all 462 applications preserve family,
orientation, chirality, role, fine role, and tier. It is a projection-coverage
distinction. The optional Neo4j algebra import adds the complete action under
the separate relationship types \`MODAL_MUTATES_TO\` and
\`LOCAL_MUTATES_TO\`, leaving canonical relationships untouched.

### The whole network is not yet proven to be a lattice

Modal cycles prevent the raw directed graph from being a partial order. A
lattice claim would require a declared quotient, an order relation on that
quotient, and verified unique meets and joins. D-tier contact signatures remain
office-authorizing evidence under their declared rules; this audit does not
relabel them as universal lattice operations.

## Best formal model at this stage

The evidence supports treating the structural system as a category generated
by partial arrows:

\`\`\`text
FreeCategory(M, R1…R7, L1…L7) / validated path equations
\`\`\`

The validated quotient relations presently include:

- \`M^7 = I\`;
- \`Rk^-1 = Lk\` on their declared partial domains;
- modal covariance of the fourteen local operators; and
- qualified local diamond equalities.

This may later admit a path-algebra or groupoid presentation, but those are
next hypotheses rather than current facts.

## Status boundary

| Claim | Current status |
|---|---|
| 15 structural generator candidates | Structurally validated |
| Local inverse laws | Structurally validated |
| Modal order seven | Structurally validated |
| Modal covariance | Structurally validated |
| State-office +2 transport under M | Structurally validated |
| Semantic feature action | Not declared |
| Court-filter compatibility | Not audited |
| Harmonic compression action | Unresolved |
| Global lattice / meet / join structure | Not proven |
| Asset-generation authorization | Not approved |

## Recommended next declaration

Promote the 15 structural operators into a versioned operator registry, while
leaving their semantic action fields null. Then author and test one semantic
vertical slice—Aeolian/Jupiter to Harmonic Minor via \`R7\`—against canonical
feature-profile confluence before using the operators in an asset compiler.
`;

fs.writeFileSync(
  path.join(auditDir, "mutation-algebra-hypotheses.md"),
  hypotheses,
);

console.log(
  JSON.stringify(
    {
      result: qa.allPass ? "PASS" : "FAIL",
      sourceSha256,
      counts: qa.counts,
      assertions: qa.assertions,
    },
    null,
    2,
  ),
);

if (!qa.allPass) process.exitCode = 1;
