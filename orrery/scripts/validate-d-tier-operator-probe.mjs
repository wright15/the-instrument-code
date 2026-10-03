#!/usr/bin/env node
/**
 * Validate the generated BL-029 D-tier operator-coverage probe against its
 * sources.
 *
 * Independent of the builder: re-reads the two harmonic-compression sidecars,
 * the mutation-algebra registry and application audit, the committed
 * legal-move catalog, and the canonical heptatonic ledger, then re-derives the
 * scope, fixed-degree and modal censuses, the A-control calibration, the
 * pre-registered discriminant verdicts, the satellite-mediation counts, and
 * the fingerprint. Fail-loud; no inference beyond the enumerated sources.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.d-tier-operator-probe.v1";
const PROBE_ID = "D_TIER_OPERATOR_PROBE_v1";
const D_CANDIDATE_PATH = "canonical/harmonic-compression-candidates/CH_D17_q_v2.json";
const A_CANDIDATE_PATH = "canonical/harmonic-compression-candidates/CH_A012_q_v1.json";
const REGISTRY_PATH = "seven-governors-mutation-algebra-audit/audit/operator-registry.csv";
const APPLICATIONS_PATH = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";
const LEGAL_MOVES_PATH = "orrery/src/generated/legal-moves.v2.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";

function fail(message) {
  throw new Error(`INVALID_D_TIER_OPERATOR_PROBE: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
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
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

const qMultiset = (record) => [...record.triadicCompressionSignature].sort((left, right) => left - right).join(",");

function cyclesOf(stateIds, successorOf) {
  const remaining = new Set(stateIds);
  const cycles = [];
  while (remaining.size > 0) {
    const start = [...remaining].sort((left, right) => left - right)[0];
    const cycle = [];
    let current = start;
    while (remaining.has(current)) {
      remaining.delete(current);
      cycle.push(current);
      current = successorOf.get(current);
      if (current === undefined) fail("broken modal cycle in source data");
    }
    if (successorOf.get(cycle[cycle.length - 1]) !== cycle[0]) {
      fail(`modal walk leaves the anchor set at ${cycle[cycle.length - 1]}`);
    }
    cycles.push(cycle);
  }
  return cycles.sort((left, right) => left[0] - right[0]);
}

function main() {
  const artifactPath = path.join(root, ARTIFACT_PATH);
  if (!fs.existsSync(artifactPath)) {
    fail(`missing artifact ${ARTIFACT_PATH}`);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.probeId !== PROBE_ID || artifact.status !== "planning_evidence") {
    fail(`artifact envelope is ${artifact.schemaVersion} / ${artifact.probeId} / ${artifact.status}`);
  }
  const { probeFingerprint, ...core } = artifact;
  if (sha256(canonicalText(core)) !== probeFingerprint) {
    fail("probeFingerprint does not match the payload");
  }

  const sourcePaths = {
    [D_CANDIDATE_PATH]: "D-anchor scope and rooted-Q records",
    [A_CANDIDATE_PATH]: "A-anchor control scope",
    [REGISTRY_PATH]: "operator canon and degree addresses",
    [APPLICATIONS_PATH]: "admitted application universe",
    [LEGAL_MOVES_PATH]: "row-2 catalog A-control",
    [LEDGER_PATH]: "anchor census cross-check",
  };
  const bindings = new Map(artifact.sourceBindings.map((binding) => [binding.artifact, binding.sha256]));
  if (bindings.size !== Object.keys(sourcePaths).length) {
    fail(`source binding census is ${bindings.size}`);
  }
  for (const [relativePath, role] of Object.entries(sourcePaths)) {
    if (bindings.get(relativePath) !== sha256(fs.readFileSync(path.join(root, relativePath)))) {
      fail(`source binding drift for ${relativePath} (${role})`);
    }
  }

  const dCandidate = readJson(D_CANDIDATE_PATH);
  const aCandidate = readJson(A_CANDIDATE_PATH);
  const registry = parseCsv(read(REGISTRY_PATH));
  const applications = parseCsv(read(APPLICATIONS_PATH));
  const legalMoves = readJson(LEGAL_MOVES_PATH);
  const ledger = parseCsv(read(LEDGER_PATH));

  const dById = new Map(dCandidate.records.map((record) => [record.stateId, record]));
  const aById = new Map(aCandidate.records.map((record) => [record.stateId, record]));
  const dIds = [...dById.keys()].sort((left, right) => left - right);
  const aIds = [...aById.keys()].sort((left, right) => left - right);
  if (dIds.length !== 49 || aIds.length !== 21) fail(`scope is ${dIds.length} D / ${aIds.length} A`);
  if (dIds.some((id) => aById.has(id)) || artifact.scope.overlap !== 0) fail("D/A anchor overlap");
  if (JSON.stringify(artifact.scope.dAnchors.stateIds) !== JSON.stringify(dIds) || artifact.scope.dAnchors.count !== 49) {
    fail("artifact D scope disagrees with CH_D17_q_v2");
  }
  if (JSON.stringify(artifact.scope.aControlAnchors.stateIds) !== JSON.stringify(aIds) || artifact.scope.aControlAnchors.count !== 21) {
    fail("artifact A-control scope disagrees with CH_A012_q_v1");
  }

  const ledgerById = new Map(ledger.map((record) => [Number(record.id), record]));
  if (ledgerById.size !== 462) fail(`ledger census is ${ledgerById.size}`);
  for (const [id, record] of [...dById, ...aById]) {
    const ledgerRecord = ledgerById.get(id);
    if (!ledgerRecord || ledgerRecord.role !== "anchor" || ledgerRecord.tier !== record.tier || ledgerRecord.forte !== record.forte) {
      fail(`ledger cross-check failed for anchor ${id}`);
    }
  }

  const registryById = new Map(registry.map((record) => [record.operator_id, record]));
  const fixedDegreeOperators = [...registryById.values()]
    .filter((record) => record.operator_class === "fixed_degree_shift")
    .map((record) => record.operator_id)
    .sort();
  if (JSON.stringify(artifact.scope.canonOperators) !== JSON.stringify(fixedDegreeOperators)) {
    fail("artifact canonOperators disagree with the registry");
  }

  for (const application of applications) {
    const registryRecord = registryById.get(application.operator_id);
    if (!registryRecord
      || application.application_status !== "formal_substrate_observed"
      || application.degree !== registryRecord.degree
      || application.degree_governor !== registryRecord.degree_governor
      || application.direction !== registryRecord.direction) {
      fail(`application ${application.application_id} is not registry-consistent`);
    }
  }
  const applicationKeys = new Set(applications.map((application) => `${application.operator_id}|${application.source_id}|${application.target_id}`));
  const inversePairsMissing = applications.filter((application) => {
    if (application.operator_class !== "fixed_degree_shift") return false;
    const inverse = registryById.get(application.operator_id).inverse_operator_id;
    return !applicationKeys.has(`${inverse}|${application.target_id}|${application.source_id}`);
  }).length;
  if (inversePairsMissing !== 0 || artifact.universe.inversePairsMissing !== 0) {
    fail("fixed-degree inverse pairs are not closed");
  }
  if (artifact.universe.applications !== applications.length) fail("application universe count drift");

  const isD = (id) => dById.has(id);
  const isA = (id) => aById.has(id);
  const fixedDegree = applications.filter((application) => application.operator_class === "fixed_degree_shift");
  const modal = applications.filter((application) => application.operator_id === "M");
  const dToD = fixedDegree.filter((application) => isD(Number(application.source_id)) && isD(Number(application.target_id)));
  const dToA = fixedDegree.filter((application) => isD(Number(application.source_id)) && isA(Number(application.target_id)));
  const aToD = fixedDegree.filter((application) => isA(Number(application.source_id)) && isD(Number(application.target_id)));
  const aToA = fixedDegree.filter((application) => isA(Number(application.source_id)) && isA(Number(application.target_id)));
  const dOut = fixedDegree.filter((application) => isD(Number(application.source_id)));
  const dIn = fixedDegree.filter((application) => isD(Number(application.target_id)));
  const aOut = fixedDegree.filter((application) => isA(Number(application.source_id)));
  const aIn = fixedDegree.filter((application) => isA(Number(application.target_id)));
  const dToDAllClasses = applications.filter((application) => isD(Number(application.source_id)) && isD(Number(application.target_id)));

  if (artifact.fixedDegreeShift.dToD.total !== dToD.length) fail("D-D fixed-degree census drift");
  for (const entry of artifact.fixedDegreeShift.dToD.byOperator) {
    if (entry.count !== dToD.filter((application) => application.operator_id === entry.name).length) {
      fail(`D-D operator census drift for ${entry.name}`);
    }
  }
  if (artifact.fixedDegreeShift.dToA.total !== dToA.length || artifact.fixedDegreeShift.aToD.total !== aToD.length) {
    fail("direct boundary application census drift");
  }

  const aControlKeys = aToA.map((application) => application.application_id).sort();
  const catalogKeys = legalMoves.moves.map((move) => move.id).sort();
  if (aControlKeys.length !== artifact.fixedDegreeShift.aControl.total
    || JSON.stringify(aControlKeys) !== JSON.stringify(catalogKeys)
    || artifact.fixedDegreeShift.aControl.catalogMatch !== true) {
    fail("A-control does not reproduce the committed legal-move catalog");
  }
  const aControlOperators = new Set(aToA.map((application) => application.operator_id));
  const aControlSources = new Set(aToA.map((application) => Number(application.source_id)));
  const aControlTargets = new Set(aToA.map((application) => Number(application.target_id)));
  if (aControlKeys.length !== 60
    || aControlOperators.size !== 12
    || aControlSources.size !== 21
    || aControlTargets.size !== 21
    || artifact.fixedDegreeShift.aControl.total !== 60
    || artifact.fixedDegreeShift.aControl.operatorCount !== 12
    || artifact.fixedDegreeShift.aControl.sourceCoverage !== 21
    || artifact.fixedDegreeShift.aControl.targetCoverage !== 21) {
    fail("A-control calibration is not exact (60/12/21/21)");
  }
  for (const entry of artifact.fixedDegreeShift.aControl.byOperator) {
    if (entry.count !== aToA.filter((application) => application.operator_id === entry.name).length) {
      fail(`A-control operator census drift for ${entry.name}`);
    }
  }

  const modalSuccessor = new Map(modal.map((application) => [Number(application.source_id), Number(application.target_id)]));
  const modalDToD = modal.filter((application) => isD(Number(application.source_id)) && isD(Number(application.target_id)));
  const modalAToA = modal.filter((application) => isA(Number(application.source_id)) && isA(Number(application.target_id)));
  const modalDCycles = cyclesOf(dIds, modalSuccessor);
  const modalACycles = cyclesOf(aIds, modalSuccessor);
  if (artifact.modalClosure.dToD.total !== modalDToD.length
    || artifact.modalClosure.dToD.cycleCount !== modalDCycles.length
    || artifact.modalClosure.aToA.total !== modalAToA.length
    || artifact.modalClosure.aToA.cycleCount !== modalACycles.length) {
    fail("modal closure census drift");
  }
  const cycleSummary = (cycles, records) => cycles.map((stateIds) => `${records.get(stateIds[0]).tier}:${stateIds.length}:${stateIds.join(",")}`).sort();
  if (JSON.stringify(cycleSummary(modalDCycles, dById)) !== JSON.stringify(artifact.modalClosure.dToD.cycles.map((cycle) => `${cycle.tier}:${cycle.length}:${cycle.stateIds.join(",")}`).sort())) {
    fail("D modal cycle membership drift");
  }
  if (JSON.stringify(cycleSummary(modalACycles, aById)) !== JSON.stringify(artifact.modalClosure.aToA.cycles.map((cycle) => `${cycle.tier}:${cycle.length}:${cycle.stateIds.join(",")}`).sort())) {
    fail("A modal cycle membership drift");
  }

  const tierFailure = dToDAllClasses.filter((application) => dById.get(Number(application.source_id)).tier !== dById.get(Number(application.target_id)).tier);
  const forteFailure = dToDAllClasses.filter((application) => dById.get(Number(application.source_id)).forte !== dById.get(Number(application.target_id)).forte);
  const twinFailure = dToDAllClasses.filter((application) => {
    const tiers = [dById.get(Number(application.source_id)).tier, dById.get(Number(application.target_id)).tier].sort();
    return tiers[0] === "D2" && tiers[1] === "D5";
  });
  const partnerFailure = dToDAllClasses.filter((application) => {
    const tiers = [dById.get(Number(application.source_id)).tier, dById.get(Number(application.target_id)).tier].sort();
    return tiers[0] === "D3" && tiers[1] === "D4";
  });
  const qFailure = dToDAllClasses.filter((application) => qMultiset(dById.get(Number(application.source_id))) !== qMultiset(dById.get(Number(application.target_id))));
  const derivedAssertions = {
    "tier-preservation": tierFailure.length,
    "family-preservation": forteFailure.length,
    "twin-separation": twinFailure.length,
    "zpartner-separation": partnerFailure.length,
    "q-multiset-preservation": qFailure.length,
  };
  if (artifact.discriminantCheck.evaluatedEdges !== dToDAllClasses.length) {
    fail("discriminant edge-set census drift");
  }
  for (const entry of artifact.discriminantCheck.assertions) {
    const expected = derivedAssertions[entry.id];
    if (expected === undefined || entry.failures.length !== expected || entry.verdict !== (expected === 0 ? "PASS" : "FAIL")) {
      fail(`discriminant assertion drift for ${entry.id}`);
    }
  }
  const derivedVerdict = Object.values(derivedAssertions).every((count) => count === 0) ? "PASS" : "FAIL";
  if (artifact.discriminantCheck.verdict !== derivedVerdict) fail("discriminant verdict drift");

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
    return pairs.size;
  };
  const mediation = artifact.boundaryMediation;
  const mediationChecks = [
    ["dToSatelliteToD", mediate(isD, isD)],
    ["dToSatelliteToA", mediate(isD, isA)],
    ["aToSatelliteToD", mediate(isA, isD)],
  ];
  for (const [key, pairCount] of mediationChecks) {
    if (mediation[key].pairCount !== pairCount || mediation[key].pairs.length !== pairCount) {
      fail(`${key} mediation census drift`);
    }
  }

  const perAnchorOut = artifact.perAnchor.reduce((total, record) => total + record.fixedDegreeOut, 0);
  const perAnchorIn = artifact.perAnchor.reduce((total, record) => total + record.fixedDegreeIn, 0);
  if (artifact.perAnchor.length !== 49
    || perAnchorOut !== dOut.length
    || perAnchorIn !== dIn.length
    || artifact.perAnchor.some((record) => record.fixedDegreeOutToAnchor !== 0 || record.fixedDegreeInFromAnchor !== 0
      || record.modalSuccessorOut !== 1 || record.modalSuccessorIn !== 1)) {
    fail("per-anchor census drift");
  }

  if (artifact.phaseEntanglement.detected !== false || artifact.phaseEntanglement.topologyMotivation !== null) {
    fail("phase-entanglement field is not the recorded single-phase verdict");
  }

  const touches = artifact.fixedDegreeShift.dTouches;
  if (touches.outTotal !== dOut.length
    || touches.inTotal !== dIn.length
    || touches.outToAnchor !== dToD.length
    || touches.outToSatellite !== dOut.filter((application) => application.target_role === "satellite").length
    || touches.outToBoundary !== dOut.filter((application) => application.target_role === "boundary").length
    || touches.inFromSatellite !== dIn.filter((application) => application.source_role === "satellite").length) {
    fail("D-anchor fixed-degree touch census drift");
  }
  const aTouches = artifact.fixedDegreeShift.aTouches;
  if (aTouches.outTotal !== aOut.length
    || aTouches.inTotal !== aIn.length
    || aTouches.outToAnchor !== aToA.length
    || aTouches.outToSatellite !== aOut.filter((application) => application.target_role === "satellite").length) {
    fail("A-anchor fixed-degree touch census drift");
  }

  console.log(
    JSON.stringify({
      verdict: "PASS",
      schemaVersion: artifact.schemaVersion,
      dAnchors: dIds.length,
      dToD: dToD.length,
      aControl: aControlKeys.length,
      modalCycles: { d: modalDCycles.length, a: modalACycles.length },
      discriminant: derivedVerdict,
      mediation: { dToSatelliteToD: mediate(isD, isD), dToSatelliteToA: mediate(isD, isA), aToSatelliteToD: mediate(isA, isD) },
      probeFingerprint,
    }),
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
