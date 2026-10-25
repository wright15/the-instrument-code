#!/usr/bin/env node
/**
 * Validate the generated BL-031 Phase A probe against its sources.
 *
 * Independent of the builder: re-reads the canonical ledger, the bipartite
 * containment artifact, the mutation-algebra operator registry and application
 * audit, re-derives the P0 arithmetic and freeness claims, re-implements the
 * fifteen admitted generators, re-runs the full 3,402 x 12 equivariance sweep,
 * re-derives the seam census (operator-realized and bridge-mediated families),
 * re-checks the radius-one verdict and the minimal-patch counts, and re-checks
 * the fingerprint. Fail-loud; no inference beyond the enumerated sources.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/phase-a-probe.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.phase-a-probe.v1";
const PROBE_ID = "BL031_PHASE_A_PROBE_v1";
const HEPTATONIC_NETWORK_PATH = "canonical/universal-network-data.json";
const HEPTATONIC_LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const REGISTRY_PATH = "seven-governors-mutation-algebra-audit/audit/operator-registry.csv";
const APPLICATIONS_PATH = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";

function fail(message) {
  throw new Error(`INVALID_PHASE_A_PROBE: ${message}`);
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

const sortedKey = (pitches) => [...pitches].sort((left, right) => left - right).join(",");
const parsePitchSet = (text) => text.replace(/[{}]/g, "").split(",").map((value) => Number(value));
const translate = (pitches, offset) => pitches.map((pitch) => (pitch + offset) % 12);

// fresh operator implementations (same admitted semantics, independently coded)
const pcsOf = (mask) => Array.from({ length: 12 }, (_, pitch) => pitch).filter((pitch) => (mask & (1 << pitch)) !== 0);
const maskFrom = (pitches) => pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
function successor(mask) {
  const pitches = pcsOf(mask);
  if (pitches.length !== 7 || pitches[0] !== 0) return null;
  return maskFrom(pitches.map((pitch) => (pitch - pitches[1] + 12) % 12));
}
function raisePhase(mask) {
  const pitches = pcsOf(mask);
  if (pitches.includes(1)) return null;
  const absolute = pitches.filter((pitch) => pitch !== 0).concat(1);
  return maskFrom(absolute.map((pitch) => (pitch + 11) % 12));
}
function lowerPhase(mask) {
  const pitches = pcsOf(mask);
  if (pitches.includes(11)) return null;
  const absolute = pitches.filter((pitch) => pitch !== 0).concat(11);
  return maskFrom(absolute.map((pitch) => (pitch + 1) % 12));
}
function degreeShift(mask, degree, direction) {
  const pitches = pcsOf(mask);
  const from = pitches[degree - 1];
  const to = from + direction;
  if (to <= 0 || to >= 12 || pitches.includes(to)) return null;
  return maskFrom(pitches.map((pitch, index) => (index === degree - 1 ? to : pitch)));
}
function apply(operatorId, mask) {
  if (operatorId === "M") return successor(mask);
  const match = /^([RL])([1-7])$/.exec(operatorId);
  if (!match) fail(`unknown operator ${operatorId}`);
  const direction = match[1] === "R" ? 1 : -1;
  const degree = Number(match[2]);
  if (degree === 1) return direction === 1 ? raisePhase(mask) : lowerPhase(mask);
  return degreeShift(mask, degree, direction);
}
const carryOf = (operatorId) => (operatorId === "R1" ? 1 : operatorId === "L1" ? -1 : 0);

function concreteApply(operatorId, pitches, cut) {
  const set = [...new Set(pitches)].sort((left, right) => left - right);
  const unrolled = set.map((pitch) => (pitch - cut + 12) % 12).sort((left, right) => left - right);
  if (unrolled[0] !== 0) fail(`cut ${cut} not in set`);
  if (operatorId === "M") {
    const next = unrolled[1];
    return { pitchClasses: set.map((pitch) => (pitch - next + 12) % 12).sort((left, right) => left - right), cut };
  }
  if (operatorId === "R1") {
    if (set.includes((cut + 1) % 12)) return null;
    return { pitchClasses: set.filter((pitch) => pitch !== cut).concat((cut + 1) % 12).sort((left, right) => left - right), cut: (cut + 1) % 12 };
  }
  if (operatorId === "L1") {
    if (set.includes((cut + 11) % 12)) return null;
    return { pitchClasses: set.filter((pitch) => pitch !== cut).concat((cut + 11) % 12).sort((left, right) => left - right), cut: (cut + 11) % 12 };
  }
  const direction = operatorId.startsWith("R") ? 1 : -1;
  const degree = Number(operatorId[1]);
  const to = unrolled[degree - 1] + direction;
  if (to <= 0 || to >= 12 || unrolled.includes(to)) return null;
  return {
    pitchClasses: unrolled.map((value, index) => (index === degree - 1 ? to : value)).map((value) => (value + cut) % 12).sort((left, right) => left - right),
    cut,
  };
}

function findModeTonic(pitches, pattern) {
  const set = new Set(pitches);
  for (let tonic = 0; tonic < 12; tonic += 1) {
    if (pattern.every((interval) => set.has((tonic + interval) % 12))) return tonic;
  }
  return null;
}

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  if (artifact.schemaVersion !== SCHEMA_VERSION) fail(`schemaVersion ${artifact.schemaVersion}`);
  if (artifact.probeId !== PROBE_ID) fail(`probeId ${artifact.probeId}`);
  if (artifact.status !== "planning_evidence") fail(`status ${artifact.status}`);
  const core = { ...artifact };
  delete core.probeFingerprint;
  if (sha256(canonicalText(core)) !== artifact.probeFingerprint) fail("probe fingerprint mismatch");
  for (const binding of artifact.sourceBindings) {
    if (sha256(read(binding.artifact)) !== binding.sha256) fail(`source binding drift: ${binding.artifact}`);
  }

  const ledger = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  if (ledger.length !== 462) fail(`ledger census ${ledger.length}`);
  const heptatonic = ledger.map((record) => ({
    id: Number(record.id),
    pitchClasses: parsePitchSet(record.pitchSet),
    tier: record.tier,
    role: record.role,
    forte: record.forte,
  }));
  if (heptatonic.some((record) => !record.pitchClasses.includes(0))) fail("ledger record without pc 0");

  const bipartite = readJson(BIPARTITE_PATH);
  const pentatonic = Object.values(bipartite.pentatonicSubnodes);
  if (Object.keys(bipartite.heptatonicNodes).length !== 462) fail("bipartite heptatonic census");
  if (pentatonic.length !== 330) fail("bipartite pentatonic census");
  for (const node of [...Object.values(bipartite.heptatonicNodes), ...pentatonic]) {
    if (!node.pitchClasses.includes(0)) fail(`anchored node without pc 0: ${node.id}`);
    if (!node.pitchClasses.includes(node.root)) fail(`root outside set: ${node.id}`);
  }

  const registry = parseCsv(read(REGISTRY_PATH));
  const applications = parseCsv(read(APPLICATIONS_PATH));
  if (registry.length !== 15) fail(`registry census ${registry.length}`);
  if (applications.length !== 3402) fail(`application census ${applications.length}`);

  // ---- M1 / M2 / P1 re-derivation ---------------------------------------
  const sevenMultiplicity = new Map();
  const fiveMultiplicity = new Map();
  for (const record of heptatonic) {
    for (let phase = 0; phase < 12; phase += 1) {
      const key = sortedKey(translate(record.pitchClasses, phase));
      sevenMultiplicity.set(key, (sevenMultiplicity.get(key) ?? 0) + 1);
    }
  }
  for (const node of pentatonic) {
    for (let phase = 0; phase < 12; phase += 1) {
      const key = sortedKey(translate(node.pitchClasses, phase));
      fiveMultiplicity.set(key, (fiveMultiplicity.get(key) ?? 0) + 1);
    }
  }
  if (heptatonic.length * 12 !== 5544 || pentatonic.length * 12 !== 3960) fail("pair arithmetic drift");
  if (sevenMultiplicity.size !== 792 || fiveMultiplicity.size !== 792) fail("covering size drift");
  if ([...sevenMultiplicity.values()].some((count) => count !== 7)) fail("heptatonic multiplicity drift");
  if ([...fiveMultiplicity.values()].some((count) => count !== 5)) fail("pentatonic multiplicity drift");

  let freenessFailures = 0;
  for (const pitches of [...heptatonic.map((record) => record.pitchClasses), ...pentatonic.map((node) => node.pitchClasses)]) {
    const key = sortedKey(pitches);
    for (let shift = 1; shift < 12; shift += 1) {
      if (sortedKey(translate(pitches, shift)) === key) freenessFailures += 1;
    }
  }
  if (freenessFailures !== 0) fail(`freeness failures ${freenessFailures}`);

  const m1 = artifact.p0Verification.claims.find((claim) => claim.id === "M1-lift-arithmetic");
  const m2 = artifact.p0Verification.claims.find((claim) => claim.id === "M2-freeness");
  const p1 = artifact.p0Verification.claims.find((claim) => claim.id === "P1-rooting-check");
  if (m1.status !== "PASS" || m1.totalPairs !== 9504 || m1.uniformMultiplicitySeven !== 7 || m1.uniformMultiplicityFive !== 5) {
    fail("M1 receipt drift");
  }
  if (m2.status !== "PASS" || m2.counterexamples !== 0) fail("M2 receipt drift");
  if (p1.status !== "PASS" || p1.rootingAmbiguity !== false) fail("P1 receipt drift");
  if (artifact.p0Verification.overall !== "PASS") fail("P0 overall drift");

  // ---- P2 re-derivation ---------------------------------------------------
  const maskById = new Map(heptatonic.map((record) => [record.id, maskFrom(record.pitchClasses)]));
  let calibrationFailures = 0;
  for (const application of applications) {
    const target = apply(application.operator_id, maskById.get(Number(application.source_id)));
    if (target !== maskById.get(Number(application.target_id))) calibrationFailures += 1;
  }
  if (calibrationFailures !== 0) fail(`independent calibration failures ${calibrationFailures}`);

  const perOperatorFailures = new Map();
  let sweepFailures = 0;
  for (const application of applications) {
    const operatorId = application.operator_id;
    const sourceMask = maskById.get(Number(application.source_id));
    const targetMask = maskById.get(Number(application.target_id));
    const carry = carryOf(operatorId);
    for (let phase = 0; phase < 12; phase += 1) {
      const concrete = pcsOf(sourceMask).map((pitch) => (pitch + phase) % 12);
      const actual = concreteApply(operatorId, concrete, phase);
      const expectedPhase = (phase + carry + 12) % 12;
      const expected = pcsOf(targetMask).map((pitch) => (pitch + expectedPhase) % 12);
      const matches = actual !== null && actual.cut === expectedPhase && sortedKey(actual.pitchClasses) === sortedKey(expected);
      if (!matches) {
        sweepFailures += 1;
        perOperatorFailures.set(operatorId, (perOperatorFailures.get(operatorId) ?? 0) + 1);
      }
    }
  }
  const p2 = artifact.p2Equivariance;
  if (p2.sweep.checks !== 40824 || p2.sweep.failures !== sweepFailures) fail("P2 sweep totals drift");
  if (p2.sweep.verdict !== (sweepFailures === 0 ? "PASS" : "FAIL")) fail("P2 verdict drift");
  if (p2.perOperator.length !== 15) fail("P2 operator census drift");
  for (const row of p2.perOperator) {
    const expectedFailures = perOperatorFailures.get(row.operatorId) ?? 0;
    if (row.failures !== expectedFailures || row.checks !== row.applications * 12) {
      fail(`P2 operator row drift: ${row.operatorId}`);
    }
  }

  // strata re-derivation
  const cornerParents = new Set();
  const admittedParents = new Set();
  for (const node of pentatonic) {
    for (const parent of node.parentsRooted) {
      const parentNode = bipartite.heptatonicNodes[parent];
      const record = heptatonic.find((entry) => sortedKey(entry.pitchClasses) === sortedKey(parentNode.pitchClasses));
      if (!record) fail(`containment parent without ledger record: ${parent}`);
      if (node.isCornerstone) cornerParents.add(record.id);
      if (node.setClassId === "5-23" || node.setClassId === "5-27") admittedParents.add(record.id);
    }
  }
  const dAnchors = new Set(heptatonic.filter((record) => record.role === "anchor" && /^D[1-7]$/.test(record.tier)).map((record) => record.id));
  const boundaryStates = new Set(heptatonic.filter((record) => record.role === "boundary").map((record) => record.id));
  const stratumCounts = { cornerstone: 0, "boundary-adjacent": 0, interior: 0 };
  for (const application of applications) {
    const source = Number(application.source_id);
    const target = Number(application.target_id);
    if (cornerParents.has(source) || cornerParents.has(target)) stratumCounts.cornerstone += 1;
    else if (
      dAnchors.has(source) || dAnchors.has(target) ||
      boundaryStates.has(source) || boundaryStates.has(target) ||
      admittedParents.has(source) || admittedParents.has(target)
    ) stratumCounts["boundary-adjacent"] += 1;
    else stratumCounts.interior += 1;
  }
  for (const row of p2.strata) {
    if (row.applications !== stratumCounts[row.stratum] || row.failures !== 0 || row.checks !== row.applications * 12) {
      fail(`P2 stratum drift: ${row.stratum}`);
    }
  }

  // ---- P3 re-derivation ---------------------------------------------------
  const p3 = artifact.p3SeamCensus;
  const r1 = applications.filter((application) => application.operator_id === "R1");
  const l1 = applications.filter((application) => application.operator_id === "L1");
  const intra = applications.filter(
    (application) =>
      ["R1", "L1"].includes(application.operator_id) &&
      application.source_forte === "7-35" &&
      application.target_forte === "7-35",
  );
  if (r1.length !== 210 || l1.length !== 210 || intra.length !== 2) fail("family A census drift");
  if (p3.familyA.applications !== 420 || p3.familyA.intraFamily.total !== 2 || p3.familyA.crossFamily.total !== 418) {
    fail("family A artifact drift");
  }
  if (p3.familyA.liftedSeamEdges !== 5040) fail("family A lifted drift");

  const shared = (leftId, rightId) => {
    const left = bipartite.heptatonicNodes[leftId];
    const right = bipartite.heptatonicNodes[rightId];
    const rightSet = new Set(right.subnodes);
    return left.subnodes.filter((subnode) => rightSet.has(subnode));
  };
  const bipartiteBySet = new Map(
    Object.entries(bipartite.heptatonicNodes).map(([nodeId, node]) => [sortedKey(node.pitchClasses), nodeId]),
  );
  const states735 = heptatonic
    .filter((record) => record.forte === "7-35")
    .map((record) => bipartiteBySet.get(sortedKey(record.pitchClasses)));
  const states732 = heptatonic
    .filter((record) => record.forte === "7-32")
    .map((record) => bipartiteBySet.get(sortedKey(record.pitchClasses)));
  let familyBPairs = 0;
  let familyBCrossings = 0;
  for (const left of states735) {
    for (const right of states732) {
      const common = shared(left, right);
      if (common.length > 0) {
        familyBPairs += 1;
        familyBCrossings += common.length;
      }
    }
  }
  const andalusian = shared("7-35:3", "7-32:0");
  if (familyBPairs !== p3.familyB.pairsWithSharedSubnodes || familyBCrossings !== p3.familyB.crossings) {
    fail("family B census drift");
  }
  if (andalusian.length !== 5 || p3.familyB.andalusianGroundTruth.sharedSubnodes.length !== 5) {
    fail("Andalusian ground truth drift");
  }

  // modal readings
  const LYDIAN = [0, 2, 4, 6, 7, 9, 11];
  const LOCRIAN = [0, 1, 3, 5, 6, 8, 10];
  const lifted = [];
  for (const record of heptatonic.filter((entry) => entry.forte === "7-35")) {
    for (let phase = 0; phase < 12; phase += 1) {
      const concrete = translate(record.pitchClasses, phase);
      lifted.push({
        numeric: record.id,
        phase,
        set: sortedKey(concrete),
        lyd: findModeTonic(concrete, LYDIAN),
        loc: findModeTonic(concrete, LOCRIAN),
      });
    }
  }
  const bySet = new Map();
  for (const node of lifted) {
    if (!bySet.has(node.set)) bySet.set(node.set, []);
    bySet.get(node.set).push(node);
  }
  const collections = [...bySet.keys()];
  if (collections.length !== 12) fail("diatonic collection census drift");
  let canonical = 0;
  let mirror = 0;
  for (let left = 0; left < collections.length; left += 1) {
    for (let right = left + 1; right < collections.length; right += 1) {
      const setA = collections[left].split(",").map(Number);
      const setB = collections[right].split(",").map(Number);
      if (setA.filter((pitch) => setB.includes(pitch)).length !== 6) continue;
      for (const [a, b] of [[collections[left], collections[right]], [collections[right], collections[left]]]) {
        const lyd = bySet.get(a)[0].lyd;
        const loc = bySet.get(b)[0].loc;
        const distance = (loc - lyd + 12) % 12;
        if (distance === 1) canonical += 1;
        else if (distance === 11) mirror += 1;
      }
    }
  }
  if (canonical !== 12 || mirror !== 12) fail(`modal reading census drift ${canonical}/${mirror}`);
  if (p3.modalSeamCensus.canonicalReadings !== 12 || p3.modalSeamCensus.mirrorReadings !== 12) fail("modal artifact drift");
  if (p3.modalSeamCensus.mirrorPrediction !== "confirmed") fail("mirror prediction drift");
  if (p3.radiusOneVerdict !== "PASS" || artifact.p0Verification.claims.find((claim) => claim.id === "M4-minimal-patch").status !== "PASS") {
    fail("radius-one verdict drift");
  }
  for (const reading of p3.modalSeamCensus.readings) {
    if (reading.kind === "canonical" && reading.modeTonicPhaseDistance !== 1) fail("canonical phase distance drift");
    if (reading.kind === "mirror" && reading.modeTonicPhaseDistance !== -1) fail("mirror phase distance drift");
    if (reading.minimumRepresentativePhaseDistance !== 0) fail("same-phase representative drift");
  }

  // ---- P4 / P5 / P6 checks ------------------------------------------------
  if (artifact.p4LiftArchitecture.counts.liftedTotal !== 9504) fail("P4 count drift");
  if (artifact.p4LiftArchitecture.containment.liftedPairsPerDirection !== 6930 * 12) fail("P4 containment drift");
  const dToDFixed = applications.filter(
    (application) =>
      application.operator_class === "fixed_degree_shift" &&
      dAnchors.has(Number(application.source_id)) &&
      dAnchors.has(Number(application.target_id)),
  );
  const dToDModal = applications.filter(
    (application) =>
      application.operator_id === "M" &&
      dAnchors.has(Number(application.source_id)) &&
      dAnchors.has(Number(application.target_id)),
  );
  if (dToDFixed.length !== 0 || dToDModal.length !== 49) fail("P5 D-tier census drift");
  if (artifact.p5BoundaryLayer.dTier.anchors !== 49 || artifact.p5BoundaryLayer.dTier.fixedDegreeIsolationPersists !== true) {
    fail("P5 artifact drift");
  }
  if (artifact.p6MinimalPatch.sufficiency.verdict !== "PASS" || artifact.p6MinimalPatch.sufficiency.noFourthPhaseNeeded !== true) {
    fail("P6 verdict drift");
  }
  if (artifact.p6MinimalPatch.nodeCounts.both !== 792 * 3) fail("P6 count drift");

  // ---- fences -------------------------------------------------------------
  const fences = artifact.fences;
  if (!String(fences.g1Intra330).includes("no intra-330")) fail("G1 fence missing");
  if (!String(fences.admission).includes("planning evidence")) fail("admission fence missing");
  if (artifact.notAccomplished.length !== 5) fail("notAccomplished inventory drift");

  console.log(
    JSON.stringify(
      {
        artifact: ARTIFACT_PATH,
        status: "PASS",
        fingerprint: artifact.probeFingerprint,
        p0: artifact.p0Verification.overall,
        p2: artifact.p2Equivariance.sweep.verdict,
        p2Checks: artifact.p2Equivariance.sweep.checks,
        p3: artifact.p3SeamCensus.radiusOneVerdict,
        canonicalReadings: canonical,
        mirrorReadings: mirror,
      },
      null,
      2,
    ),
  );
}

validate();
