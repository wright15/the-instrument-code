#!/usr/bin/env node
/**
 * Build the BL-029 D-tier operator-coverage probe.
 *
 * Read-only census over the admitted mutation-algebra application universe:
 * which operator applications touch the 49 D1-D7 anchors (GOV-227 /
 * `CH_D17_q_v2`), and whether the canon-motivated subset closes on the
 * D-anchor set the way the 60-move row-2 catalog closes on the 21 A-anchors.
 *
 * Sources (all admitted, static): the two harmonic-compression sidecars, the
 * mutation-algebra operator registry and application audit, the committed
 * legal-move catalog (A-control), and the canonical heptatonic ledger.
 *
 * The probe enumerates admitted applications and tests canon-motivated
 * relations only. It defines no operators, admits nothing, emits no graph
 * edges, and writes no canonical/Court/Neo4j artifact. Planning evidence.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.d-tier-operator-probe.v1";
export const PROBE_ID = "D_TIER_OPERATOR_PROBE_v1";
export const D_CANDIDATE_PATH = "canonical/harmonic-compression-candidates/CH_D17_q_v2.json";
export const A_CANDIDATE_PATH = "canonical/harmonic-compression-candidates/CH_A012_q_v1.json";
export const REGISTRY_PATH = "seven-governors-mutation-algebra-audit/audit/operator-registry.csv";
export const APPLICATIONS_PATH = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";
export const LEGAL_MOVES_PATH = "orrery/src/generated/legal-moves.v2.json";
export const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
export const OUTPUT_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";

const EXPECTED_D_ANCHORS = 49;
const EXPECTED_A_ANCHORS = 21;
const EXPECTED_APPLICATIONS = 3402;
const EXPECTED_MODAL_APPLICATIONS = 462;

function fail(message) {
  throw new Error(`INVALID_D_TIER_OPERATOR_PROBE: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
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

function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in probe payload");
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalText).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

function countBy(values, key) {
  const counts = new Map();
  for (const value of values) {
    const bucket = key(value);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return counts;
}

function sortedCounts(values, key) {
  return [...countBy(values, key)]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
}

const qMultiset = (record) => [...record.triadicCompressionSignature].sort((a, b) => a - b).join(",");

function modalCycles(stateIds, successorOf) {
  const remaining = new Set(stateIds);
  const cycles = [];
  while (remaining.size > 0) {
    const start = [...remaining].sort((a, b) => a - b)[0];
    const cycle = [];
    let current = start;
    while (remaining.has(current)) {
      remaining.delete(current);
      cycle.push(current);
      current = successorOf.get(current);
      if (current === undefined) fail(`broken modal cycle at ${cycle[cycle.length - 1]}`);
    }
    if (successorOf.get(cycle[cycle.length - 1]) !== cycle[0]) {
      fail(`modal walk leaves the anchor set at ${cycle[cycle.length - 1]}`);
    }
    cycles.push(cycle);
  }
  return cycles.sort((left, right) => left[0] - right[0]);
}

export function buildProbe() {
  const dCandidate = readJson(D_CANDIDATE_PATH);
  const aCandidate = readJson(A_CANDIDATE_PATH);
  const registry = parseCsv(read(REGISTRY_PATH));
  const applications = parseCsv(read(APPLICATIONS_PATH));
  const legalMoves = readJson(LEGAL_MOVES_PATH);
  const ledger = parseCsv(read(LEDGER_PATH));

  if (dCandidate.status !== "admitted_scoped_D17" || dCandidate.candidateId !== "CH_D17_q_v2") {
    fail(`D candidate is ${dCandidate.status} / ${dCandidate.candidateId}`);
  }
  if (aCandidate.status !== "admitted_scoped_A012" || aCandidate.candidateId !== "CH_A012_q_v1") {
    fail(`A candidate is ${aCandidate.status} / ${aCandidate.candidateId}`);
  }
  if (dCandidate.records.length !== EXPECTED_D_ANCHORS || aCandidate.records.length !== EXPECTED_A_ANCHORS) {
    fail(`anchor census is ${dCandidate.records.length} D / ${aCandidate.records.length} A`);
  }
  if (dCandidate.records.some((record) => record.role !== "anchor" || !/^D[1-7]$/.test(record.tier))) {
    fail("D candidate contains a non-D-anchor record");
  }
  if (aCandidate.records.some((record) => record.role !== "anchor" || !/^A[0-2]$/.test(record.tier))) {
    fail("A candidate contains a non-A-anchor record");
  }

  const dById = new Map(dCandidate.records.map((record) => [record.stateId, record]));
  const aById = new Map(aCandidate.records.map((record) => [record.stateId, record]));
  const dIds = [...dById.keys()].sort((left, right) => left - right);
  const aIds = [...aById.keys()].sort((left, right) => left - right);
  const overlap = dIds.filter((id) => aById.has(id));
  if (overlap.length !== 0) fail(`D/A anchor overlap is ${overlap.length}`);

  const ledgerById = new Map(ledger.map((record) => [Number(record.id), record]));
  if (ledgerById.size !== 462) fail(`ledger census is ${ledgerById.size}`);
  for (const [id, record] of [...dById, ...aById]) {
    const ledgerRecord = ledgerById.get(id);
    if (!ledgerRecord || ledgerRecord.role !== "anchor" || ledgerRecord.tier !== record.tier || ledgerRecord.forte !== record.forte) {
      fail(`ledger cross-check failed for anchor ${id}`);
    }
  }

  const registryById = new Map(registry.map((record) => [record.operator_id, record]));
  if (registryById.size !== 15) fail(`operator registry census is ${registryById.size}`);
  const fixedDegreeOperators = [...registryById.values()]
    .filter((record) => record.operator_class === "fixed_degree_shift")
    .map((record) => record.operator_id)
    .sort();
  if (fixedDegreeOperators.length !== 12 || fixedDegreeOperators.join(",") !== "L2,L3,L4,L5,L6,L7,R2,R3,R4,R5,R6,R7") {
    fail(`fixed-degree operator inventory is ${fixedDegreeOperators.join(",")}`);
  }
  if (!registryById.has("M") || !registryById.has("R1") || !registryById.has("L1")) {
    fail("registry is missing M / R1 / L1");
  }

  if (applications.length !== EXPECTED_APPLICATIONS) {
    fail(`application universe is ${applications.length}`);
  }
  for (const application of applications) {
    if (application.application_status !== "formal_substrate_observed") {
      fail(`application ${application.application_id} status is ${application.application_status}`);
    }
    const registryRecord = registryById.get(application.operator_id);
    if (!registryRecord) fail(`application ${application.application_id} has an unknown operator`);
    if (
      application.degree !== registryRecord.degree ||
      application.degree_governor !== registryRecord.degree_governor ||
      application.direction !== registryRecord.direction
    ) {
      fail(`application ${application.application_id} disagrees with the operator registry`);
    }
  }

  const applicationKeys = new Set(applications.map((application) => `${application.operator_id}|${application.source_id}|${application.target_id}`));
  let inversePairsMissing = 0;
  for (const application of applications) {
    if (application.operator_class !== "fixed_degree_shift") continue;
    const inverse = registryById.get(application.operator_id).inverse_operator_id;
    if (!applicationKeys.has(`${inverse}|${application.target_id}|${application.source_id}`)) {
      inversePairsMissing += 1;
    }
  }
  if (inversePairsMissing !== 0) fail(`${inversePairsMissing} fixed-degree applications are missing their inverse`);

  const isD = (id) => dById.has(id);
  const isA = (id) => aById.has(id);
  const fixedDegree = applications.filter((application) => application.operator_class === "fixed_degree_shift");
  const modal = applications.filter((application) => application.operator_id === "M");
  if (modal.length !== EXPECTED_MODAL_APPLICATIONS) fail(`modal application census is ${modal.length}`);

  const dToD = fixedDegree.filter((application) => isD(Number(application.source_id)) && isD(Number(application.target_id)));
  const dToA = fixedDegree.filter((application) => isD(Number(application.source_id)) && isA(Number(application.target_id)));
  const aToD = fixedDegree.filter((application) => isA(Number(application.source_id)) && isD(Number(application.target_id)));
  const aToA = fixedDegree.filter((application) => isA(Number(application.source_id)) && isA(Number(application.target_id)));
  const dOut = fixedDegree.filter((application) => isD(Number(application.source_id)));
  const dIn = fixedDegree.filter((application) => isD(Number(application.target_id)));
  const aOut = fixedDegree.filter((application) => isA(Number(application.source_id)));
  const aIn = fixedDegree.filter((application) => isA(Number(application.target_id)));
  const dToDAllClasses = applications.filter((application) => isD(Number(application.source_id)) && isD(Number(application.target_id)));

  const aControlKeys = aToA.map((application) => application.application_id).sort();
  const catalogKeys = legalMoves.moves.map((move) => move.id).sort();
  if (aControlKeys.length !== 60 || JSON.stringify(aControlKeys) !== JSON.stringify(catalogKeys)) {
    fail("A-control does not reproduce the committed legal-move catalog");
  }
  const aControlOperators = new Set(aToA.map((application) => application.operator_id));
  const aControlSources = new Set(aToA.map((application) => Number(application.source_id)));
  const aControlTargets = new Set(aToA.map((application) => Number(application.target_id)));
  if (aControlOperators.size !== 12 || aControlSources.size !== 21 || aControlTargets.size !== 21) {
    fail("A-control coverage is not 12 operators / 21 sources / 21 targets");
  }

  const modalSuccessor = new Map(modal.map((application) => [Number(application.source_id), Number(application.target_id)]));
  const modalIntoDFromNonAnchor = modal.filter((application) => !isD(Number(application.source_id)) && isD(Number(application.target_id)));
  const modalDToD = modal.filter((application) => isD(Number(application.source_id)) && isD(Number(application.target_id)));
  const modalAToA = modal.filter((application) => isA(Number(application.source_id)) && isA(Number(application.target_id)));
  if (modalDToD.length !== 49 || modalAToA.length !== 21) {
    fail(`modal anchor closure is ${modalDToD.length} D / ${modalAToA.length} A`);
  }
  const modalDCycles = modalCycles(dIds, modalSuccessor);
  const modalACycles = modalCycles(aIds, modalSuccessor);
  const modalTierPreserved = modalDToD.every((application) => dById.get(Number(application.source_id)).tier === dById.get(Number(application.target_id)).tier);
  const modalFortePreserved = modalDToD.every((application) => dById.get(Number(application.source_id)).forte === dById.get(Number(application.target_id)).forte);
  const modalQPreserved = modalDToD.every((application) => qMultiset(dById.get(Number(application.source_id))) === qMultiset(dById.get(Number(application.target_id))));

  const edgeSet = dToDAllClasses;
  const assertion = (id, statement, failures) => ({
    id,
    statement,
    evaluatedEdges: edgeSet.length,
    failures,
    verdict: failures.length === 0 ? "PASS" : "FAIL",
  });
  const discriminantAssertions = [
    assertion(
      "tier-preservation",
      "every D-anchor-to-D-anchor application preserves tier",
      edgeSet.filter((application) => dById.get(Number(application.source_id)).tier !== dById.get(Number(application.target_id)).tier).map((application) => application.application_id),
    ),
    assertion(
      "family-preservation",
      "every D-anchor-to-D-anchor application preserves the Forte family",
      edgeSet.filter((application) => dById.get(Number(application.source_id)).forte !== dById.get(Number(application.target_id)).forte).map((application) => application.application_id),
    ),
    assertion(
      "twin-separation",
      "no D-anchor-to-D-anchor application connects the D2/D5 q_v2 multiset twins",
      edgeSet.filter((application) => {
        const tiers = [dById.get(Number(application.source_id)).tier, dById.get(Number(application.target_id)).tier].sort();
        return tiers[0] === "D2" && tiers[1] === "D5";
      }).map((application) => application.application_id),
    ),
    assertion(
      "zpartner-separation",
      "no D-anchor-to-D-anchor application connects the D3/D4 Z-partners",
      edgeSet.filter((application) => {
        const tiers = [dById.get(Number(application.source_id)).tier, dById.get(Number(application.target_id)).tier].sort();
        return tiers[0] === "D3" && tiers[1] === "D4";
      }).map((application) => application.application_id),
    ),
    assertion(
      "q-multiset-preservation",
      "every D-anchor-to-D-anchor application preserves the sorted rooted-Q multiset",
      edgeSet.filter((application) => qMultiset(dById.get(Number(application.source_id))) !== qMultiset(dById.get(Number(application.target_id)))).map((application) => application.application_id),
    ),
  ];
  const discriminantVerdict = discriminantAssertions.every((entry) => entry.verdict === "PASS") ? "PASS" : "FAIL";

  const successors = new Map();
  for (const application of fixedDegree) {
    const source = Number(application.source_id);
    if (!successors.has(source)) successors.set(source, []);
    successors.get(source).push(application);
  }
  const mediate = (fromSet, toSet) => {
    const pairs = new Set();
    for (const application of fixedDegree) {
      const source = Number(application.source_id);
      if (!fromSet(source) || application.target_role !== "satellite") continue;
      for (const next of successors.get(Number(application.target_id)) ?? []) {
        if (next.source_role !== "satellite") continue;
        const target = Number(next.target_id);
        if (toSet(target) && target !== source) pairs.add(`${source}:${target}`);
      }
    }
    const sorted = [...pairs]
      .map((pair) => pair.split(":").map(Number))
      .sort((left, right) => left[0] - right[0] || left[1] - right[1]);
    return { pairCount: sorted.length, pairs: sorted };
  };

  const perAnchor = dIds.map((id) => {
    const record = dById.get(id);
    return {
      stateId: id,
      tier: record.tier,
      forte: record.forte,
      fixedDegreeOut: dOut.filter((application) => Number(application.source_id) === id).length,
      fixedDegreeIn: dIn.filter((application) => Number(application.target_id) === id).length,
      fixedDegreeOutToAnchor: dToD.filter((application) => Number(application.source_id) === id).length,
      fixedDegreeInFromAnchor: dToD.filter((application) => Number(application.target_id) === id).length,
      modalSuccessorOut: modalDToD.filter((application) => Number(application.source_id) === id).length,
      modalSuccessorIn: modalDToD.filter((application) => Number(application.target_id) === id).length,
    };
  });

  const sourceBindings = [
    { artifact: D_CANDIDATE_PATH, sha256: fileSha(D_CANDIDATE_PATH), role: "D-anchor scope and rooted-Q records" },
    { artifact: A_CANDIDATE_PATH, sha256: fileSha(A_CANDIDATE_PATH), role: "A-anchor control scope" },
    { artifact: REGISTRY_PATH, sha256: fileSha(REGISTRY_PATH), role: "operator canon and degree addresses" },
    { artifact: APPLICATIONS_PATH, sha256: fileSha(APPLICATIONS_PATH), role: "admitted application universe" },
    { artifact: LEGAL_MOVES_PATH, sha256: fileSha(LEGAL_MOVES_PATH), role: "row-2 catalog A-control" },
    { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "anchor census cross-check" },
  ];

  const core = {
    schemaVersion: SCHEMA_VERSION,
    probeId: PROBE_ID,
    status: "planning_evidence",
    generator: "scripts/build-d-tier-operator-probe.mjs",
    sourceBindings,
    scope: {
      dAnchors: { count: dIds.length, stateIds: dIds },
      aControlAnchors: { count: aIds.length, stateIds: aIds },
      overlap: overlap.length,
      operatorClass: "fixed_degree_shift",
      canonOperators: fixedDegreeOperators,
      excludedByRow2Design: [
        { operatorId: "M", operatorClass: "modal_re_rooting", disposition: "excluded from the row-2 catalog for every tier; reported separately as modalClosure" },
        { operatorId: "R1", operatorClass: "root_phase", disposition: "changes tier membership; excluded from the parallel-mode catalog" },
        { operatorId: "L1", operatorClass: "root_phase", disposition: "changes tier membership; excluded from the parallel-mode catalog" },
      ],
    },
    universe: {
      applications: applications.length,
      fixedDegreeShift: fixedDegree.length,
      modalReRooting: modal.length,
      inversePairsMissing,
    },
    fixedDegreeShift: {
      dToD: {
        total: dToD.length,
        byOperator: fixedDegreeOperators.map((operatorId) => ({
          name: operatorId,
          count: dToD.filter((application) => application.operator_id === operatorId).length,
        })),
        byTierPair: sortedCounts(dToD, (application) => `${dById.get(Number(application.source_id)).tier}->${dById.get(Number(application.target_id)).tier}`),
      },
      dToA: { total: dToA.length },
      aToD: { total: aToD.length },
      aControl: {
        total: aToA.length,
        byOperator: sortedCounts(aToA, (application) => application.operator_id),
        sourceCoverage: aControlSources.size,
        targetCoverage: aControlTargets.size,
        operatorCount: aControlOperators.size,
        catalogMatch: true,
      },
      dTouches: {
        outTotal: dOut.length,
        inTotal: dIn.length,
        outToAnchor: dToD.length,
        outToSatellite: dOut.filter((application) => application.target_role === "satellite").length,
        outToBoundary: dOut.filter((application) => application.target_role === "boundary").length,
        inFromAnchor: dToD.length,
        inFromSatellite: dIn.filter((application) => application.source_role === "satellite").length,
        inFromBoundary: dIn.filter((application) => application.source_role === "boundary").length,
        byOperator: sortedCounts(dOut, (application) => application.operator_id),
        byGovernor: sortedCounts(dOut, (application) => application.degree_governor),
        outTargetSetClasses: sortedCounts(dOut, (application) => application.target_forte),
      },
      aTouches: {
        outTotal: aOut.length,
        inTotal: aIn.length,
        outToAnchor: aToA.length,
        outToSatellite: aOut.filter((application) => application.target_role === "satellite").length,
        outToBoundary: aOut.filter((application) => application.target_role === "boundary").length,
        inFromAnchor: aToA.length,
        inFromSatellite: aIn.filter((application) => application.source_role === "satellite").length,
        inFromBoundary: aIn.filter((application) => application.source_role === "boundary").length,
      },
    },
    modalClosure: {
      operatorId: "M",
      operatorClass: "modal_re_rooting",
      dToD: {
        total: modalDToD.length,
        cycleCount: modalDCycles.length,
        cycles: modalDCycles.map((stateIds) => ({
          length: stateIds.length,
          tier: dById.get(stateIds[0]).tier,
          forte: dById.get(stateIds[0]).forte,
          stateIds,
        })),
        tierPreserved: modalTierPreserved,
        fortePreserved: modalFortePreserved,
        qMultisetPreserved: modalQPreserved,
      },
      aToA: {
        total: modalAToA.length,
        cycleCount: modalACycles.length,
        cycles: modalACycles.map((stateIds) => ({
          length: stateIds.length,
          tier: aById.get(stateIds[0]).tier,
          forte: aById.get(stateIds[0]).forte,
          stateIds,
        })),
      },
      intoDAnchorsFromNonAnchors: modalIntoDFromNonAnchor.length,
    },
    discriminantCheck: {
      edgeSet: "all admitted applications with both endpoints in the 49 D-anchors",
      evaluatedEdges: edgeSet.length,
      assertions: discriminantAssertions,
      verdict: discriminantVerdict,
    },
    boundaryMediation: {
      method: "two admitted fixed-degree-shift applications with a satellite intermediate",
      dToSatelliteToD: mediate(isD, isD),
      dToSatelliteToA: mediate(isD, isA),
      aToSatelliteToD: mediate(isA, isD),
    },
    perAnchor,
    phaseEntanglement: {
      detected: false,
      basis: "no admitted application carries a phase coordinate; every census and candidate relation closes in the single-phase application universe",
      topologyMotivation: null,
    },
    classificationInputs: {
      row2Projection: {
        aControlEdges: aToA.length,
        dAnchorEdges: dToD.length,
        dAnchorProjectionAvailable: dToD.length > 0,
      },
      directBoundaryApplications: { dToA: dToA.length, aToD: aToD.length },
      anchorClosure: {
        fixedDegree: { d: dToD.length > 0, a: aToA.length > 0 },
        modal: { d: modalDToD.length > 0, a: modalAToA.length > 0 },
      },
    },
  };
  const probeFingerprint = sha256(canonicalText(core));
  return { ...core, probeFingerprint };
}

export function serializeProbe(probe) {
  return `${canonicalText(probe)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const probe = buildProbe();
  const serialized = serializeProbe(probe);
  const outputPath = path.join(root, OUTPUT_PATH);
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) {
      throw new Error("STALE_D_TIER_OPERATOR_PROBE");
    }
    console.log(
      JSON.stringify({
        output: OUTPUT_PATH,
        check: true,
        stale: false,
        counts: {
          dAnchors: probe.scope.dAnchors.count,
          dToD: probe.fixedDegreeShift.dToD.total,
          aControl: probe.fixedDegreeShift.aControl.total,
          discriminant: probe.discriminantCheck.verdict,
        },
        probeFingerprint: probe.probeFingerprint,
      }),
    );
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(
    JSON.stringify({
      output: OUTPUT_PATH,
      check: false,
      counts: {
        dAnchors: probe.scope.dAnchors.count,
        dToD: probe.fixedDegreeShift.dToD.total,
        aControl: probe.fixedDegreeShift.aControl.total,
        discriminant: probe.discriminantCheck.verdict,
      },
      probeFingerprint: probe.probeFingerprint,
      sha256: sha256(serialized),
    }),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
