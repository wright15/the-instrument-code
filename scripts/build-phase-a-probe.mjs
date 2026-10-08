#!/usr/bin/env node
/**
 * Build the BL-031 Phase A probe: phase-extended state machinery as scoped
 * probes over the landed single-phase topology.
 *
 * Sections:
 *   p0Verification  - the P0 gate receipt (M1 arithmetic, M2 freeness, P1
 *                     rooting; M3/M4 completed by the P3 census)
 *   p1PhaseCoordinate - phase coordinate spec and anchor counts
 *   p2Equivariance  - calibration against all 3,402 admitted applications,
 *                     then the 3,402 x 12 lifted-application sweep with the
 *                     concrete cut-relative operator implementation; strata:
 *                     cornerstone / boundary-adjacent / interior
 *   p3SeamCensus    - two edge families (operator-realized intra-family seams;
 *                     bridge-mediated cross-family seams) with phase-distance
 *                     histograms and the pre-registered mirror relation
 *   p4LiftArchitecture, p5BoundaryLayer, p6MinimalPatch - design specs
 *
 * Read-only against the landed sources. Defines no canonical operators, emits
 * no graph edges, assumes no intra-330 adjacency, admits nothing. Planning
 * evidence, byte-stable, independently validated. G1 untouched.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BIPARTITE_PATH,
  HEPTATONIC_LEDGER_PATH,
  HEPTATONIC_NETWORK_PATH,
  buildPhaseAVerification,
  canonicalText,
  fail,
  fileSha,
  loadAnchoredUniverse,
  parseCsv,
  read,
  sha256,
  sortedKey,
  translateSet,
} from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.phase-a-probe.v1";
export const PROBE_ID = "BL031_PHASE_A_PROBE_v1";
export const REGISTRY_PATH = "seven-governors-mutation-algebra-audit/audit/operator-registry.csv";
export const APPLICATIONS_PATH = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";
export const OUTPUT_PATH = "orrery/src/generated/phase-a-probe.v1.json";

const EXPECTED_APPLICATIONS = 3402;
const EXPECTED_MODAL_APPLICATIONS = 462;
const EXPECTED_PHASES = 12;
const LYDIAN_PATTERN = [0, 2, 4, 6, 7, 9, 11];
const LOCRIAN_PATTERN = [0, 1, 3, 5, 6, 8, 10];
const ADMITTED_BRIDGE_CLASSES = ["5-23", "5-27"];
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// ---------------------------------------------------------------------------
// Anchored (audit-faithful) operator implementations. These reproduce the
// fifteen admitted generators exactly as the mutation-algebra audit defines
// them (seven-governors-mutation-algebra-audit/scripts/run-mutation-algebra-audit.mjs).
// ---------------------------------------------------------------------------

function pcsOf(mask) {
  const result = [];
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask & (1 << pitch)) !== 0) result.push(pitch);
  }
  return result;
}

function maskFromPitches(pitches) {
  return pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
}

function rotateToRoot(mask, rootPc) {
  return maskFromPitches(pcsOf(mask).map((pitch) => (pitch - rootPc + 12) % 12));
}

function modalSuccessor(mask) {
  const pitches = pcsOf(mask);
  if (pitches.length !== 7 || pitches[0] !== 0) return null;
  return rotateToRoot(mask, pitches[1]);
}

function phaseRaise(mask) {
  const pitches = pcsOf(mask);
  if (pitches.includes(1)) return null;
  const absolute = pitches.filter((pitch) => pitch !== 0).concat(1);
  return maskFromPitches(absolute.map((pitch) => (pitch + 11) % 12));
}

function phaseLower(mask) {
  const pitches = pcsOf(mask);
  if (pitches.includes(11)) return null;
  const absolute = pitches.filter((pitch) => pitch !== 0).concat(11);
  return maskFromPitches(absolute.map((pitch) => (pitch + 1) % 12));
}

function fixedDegreeShift(mask, degree, direction) {
  const pitches = pcsOf(mask);
  const sourcePitch = pitches[degree - 1];
  const targetPitch = sourcePitch + direction;
  if (targetPitch <= 0 || targetPitch >= 12 || pitches.includes(targetPitch)) return null;
  return maskFromPitches(pitches.map((pitch, index) => (index === degree - 1 ? targetPitch : pitch)));
}

function parseLocalOperator(operatorId) {
  const match = /^([RL])([1-7])$/.exec(operatorId);
  if (!match) return null;
  return { direction: match[1] === "R" ? 1 : -1, degree: Number(match[2]) };
}

function applyAnchored(operatorId, mask) {
  if (operatorId === "M") return modalSuccessor(mask);
  const parsed = parseLocalOperator(operatorId);
  if (!parsed) fail(`unknown operator ${operatorId}`);
  if (parsed.degree === 1) {
    return parsed.direction === 1 ? phaseRaise(mask) : phaseLower(mask);
  }
  return fixedDegreeShift(mask, parsed.degree, parsed.direction);
}

// ---------------------------------------------------------------------------
// Concrete cut-relative operator implementations for the lifted sweep. These
// read the configuration in absolute coordinates: degrees are counted from the
// configuration's cut, collision/boundary conditions are relative to the cut,
// and R1/L1 move the cut itself. This is a genuinely separate implementation
// from the anchored rules above; calibration binds the two on the anchored
// slice, and the phase sweep tests the generalization.
// ---------------------------------------------------------------------------

function concreteApply(operatorId, concretePitches, cut) {
  const set = [...new Set(concretePitches)].sort((left, right) => left - right);
  const unrolled = set.map((pitch) => (pitch - cut + 12) % 12).sort((left, right) => left - right);
  if (unrolled[0] !== 0) fail(`cut ${cut} is not a member of ${JSON.stringify(set)}`);

  if (operatorId === "M") {
    const next = unrolled[1];
    const output = set.map((pitch) => (pitch - next + 12) % 12).sort((left, right) => left - right);
    return { pitchClasses: output, cut };
  }
  if (operatorId === "R1") {
    if (set.includes((cut + 1) % 12)) return null;
    const output = set.filter((pitch) => pitch !== cut).concat((cut + 1) % 12).sort((left, right) => left - right);
    return { pitchClasses: output, cut: (cut + 1) % 12 };
  }
  if (operatorId === "L1") {
    if (set.includes((cut + 11) % 12)) return null;
    const output = set.filter((pitch) => pitch !== cut).concat((cut + 11) % 12).sort((left, right) => left - right);
    return { pitchClasses: output, cut: (cut + 11) % 12 };
  }

  const parsed = parseLocalOperator(operatorId);
  if (!parsed || parsed.degree < 2) fail(`unsupported concrete operator ${operatorId}`);
  const target = unrolled[parsed.degree - 1] + parsed.direction;
  if (target <= 0 || target >= 12 || unrolled.includes(target)) return null;
  const output = unrolled
    .map((value, index) => (index === parsed.degree - 1 ? target : value))
    .map((value) => (value + cut) % 12)
    .sort((left, right) => left - right);
  return { pitchClasses: output, cut };
}

function phaseCarry(operatorId) {
  if (operatorId === "R1") return 1;
  if (operatorId === "L1") return -1;
  return 0;
}

// ---------------------------------------------------------------------------

function findModeTonic(pitches, pattern) {
  const set = new Set(pitches);
  const tonics = [];
  for (let tonic = 0; tonic < 12; tonic += 1) {
    if (pattern.every((interval) => set.has((tonic + interval) % 12))) tonics.push(tonic);
  }
  if (tonics.length > 1) fail(`mode pattern is not unique on ${sortedKey(pitches)}`);
  return tonics.length === 1 ? tonics[0] : null;
}

function signedPhaseDistance(from, to) {
  const distance = (to - from + 12) % 12;
  return distance > 6 ? distance - 12 : distance;
}

function modalCycles(stateIds, successorOf) {
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
      if (current === undefined) fail(`broken modal cycle at ${cycle[cycle.length - 1]}`);
    }
    if (successorOf.get(cycle[cycle.length - 1]) !== cycle[0]) {
      fail(`modal walk leaves the set at ${cycle[cycle.length - 1]}`);
    }
    cycles.push(cycle);
  }
  return cycles.sort((left, right) => left[0] - right[0]);
}

export function buildProbe() {
  const verification = buildPhaseAVerification();
  const { heptatonic, pentatonic, bipartite } = loadAnchoredUniverse();
  const registry = parseCsv(read(REGISTRY_PATH));
  const applications = parseCsv(read(APPLICATIONS_PATH));

  if (registry.length !== 15) fail(`operator registry census is ${registry.length}`);
  if (applications.length !== EXPECTED_APPLICATIONS) fail(`application universe is ${applications.length}`);
  const registryById = new Map(registry.map((record) => [record.operator_id, record]));
  const operatorIds = [...registryById.keys()].sort();

  const maskById = new Map(heptatonic.map((record) => [record.id, maskFromPitches(record.pitchClasses)]));

  // ---- calibration: the anchored reimplementation reproduces all 3,402 ----
  const applicationKeys = new Set();
  let calibrationFailures = 0;
  const calibrationWitnesses = [];
  for (const application of applications) {
    const sourceId = Number(application.source_id);
    const targetId = Number(application.target_id);
    const sourceMask = maskById.get(sourceId);
    const targetMask = maskById.get(targetId);
    if (sourceMask === undefined || targetMask === undefined) {
      fail(`application ${application.application_id} has an unknown endpoint`);
    }
    const recomputed = applyAnchored(application.operator_id, sourceMask);
    if (recomputed !== targetMask) {
      calibrationFailures += 1;
      if (calibrationWitnesses.length < 5) {
        calibrationWitnesses.push({
          applicationId: application.application_id,
          operatorId: application.operator_id,
          recomputed: recomputed === null ? null : pcsOf(recomputed),
        });
      }
    }
    applicationKeys.add(`${application.operator_id}|${application.source_id}|${application.target_id}`);
  }

  // independently enumerate the operator universe from the 462 anchored masks
  const operatorSourceKeys = new Set(
    applications.map((application) => `${application.operator_id}|${application.source_id}`),
  );
  let enumerated = 0;
  let enumeratedMissing = 0;
  for (const record of heptatonic) {
    const mask = maskFromPitches(record.pitchClasses);
    for (const operatorId of operatorIds) {
      const result = applyAnchored(operatorId, mask);
      if (result === null) continue;
      enumerated += 1;
      if (!operatorSourceKeys.has(`${operatorId}|${record.id}`)) enumeratedMissing += 1;
    }
  }
  if (enumerated !== EXPECTED_APPLICATIONS || enumeratedMissing !== 0) {
    fail(`operator enumeration is ${enumerated} with ${enumeratedMissing} missing admitted rows`);
  }
  if (calibrationFailures !== 0) {
    fail(`anchored calibration fails on ${calibrationFailures} applications: ${JSON.stringify(calibrationWitnesses)}`);
  }

  // ---- strata -------------------------------------------------------------
  const cornerstoneParentNumeric = new Set();
  const admittedBridgeParentNumeric = new Set();
  for (const [nodeId, node] of Object.entries(bipartite.pentatonicSubnodes)) {
    const isCornerstone = node.isCornerstone === true;
    const isAdmittedBridge = ADMITTED_BRIDGE_CLASSES.includes(node.setClassId);
    for (const parent of node.parentsRooted) {
      const parentNode = bipartite.heptatonicNodes[parent];
      if (!parentNode) fail(`pentatonic ${nodeId} lists unknown parent ${parent}`);
      const parentRecord = heptatonic.find((record) => sortedKey(record.pitchClasses) === sortedKey(parentNode.pitchClasses));
      if (!parentRecord) fail(`parent ${parent} has no ledger record`);
      if (isCornerstone) cornerstoneParentNumeric.add(parentRecord.id);
      if (isAdmittedBridge) admittedBridgeParentNumeric.add(parentRecord.id);
    }
  }
  const dAnchorIds = new Set(
    heptatonic.filter((record) => record.role === "anchor" && /^D[1-7]$/.test(record.tier)).map((record) => record.id),
  );
  const boundaryRoleIds = new Set(heptatonic.filter((record) => record.role === "boundary").map((record) => record.id));
  if (dAnchorIds.size !== 49) fail(`D anchor census is ${dAnchorIds.size}`);
  if (boundaryRoleIds.size !== 154) fail(`boundary state census is ${boundaryRoleIds.size}`);

  const stratumOf = (sourceId, targetId) => {
    if (cornerstoneParentNumeric.has(sourceId) || cornerstoneParentNumeric.has(targetId)) return "cornerstone";
    if (
      dAnchorIds.has(sourceId) ||
      dAnchorIds.has(targetId) ||
      boundaryRoleIds.has(sourceId) ||
      boundaryRoleIds.has(targetId) ||
      admittedBridgeParentNumeric.has(sourceId) ||
      admittedBridgeParentNumeric.has(targetId)
    ) {
      return "boundary-adjacent";
    }
    return "interior";
  };

  // ---- P2: equivariance sweep --------------------------------------------
  const perOperator = new Map(
    operatorIds.map((operatorId) => [
      operatorId,
      {
        operatorId,
        operatorClass: registryById.get(operatorId).operator_class,
        applications: 0,
        checks: 0,
        failures: 0,
        phaseCarry: phaseCarry(operatorId),
        expected: "equivariant",
        witnesses: [],
      },
    ]),
  );
  const stratumStats = new Map(["cornerstone", "boundary-adjacent", "interior"].map((name) => [name, {
    stratum: name,
    applications: 0,
    checks: 0,
    failures: 0,
  }]));

  let totalChecks = 0;
  let totalFailures = 0;
  for (const application of applications) {
    const sourceId = Number(application.source_id);
    const targetId = Number(application.target_id);
    const sourceMask = maskById.get(sourceId);
    const targetMask = maskById.get(targetId);
    const operatorId = application.operator_id;
    const carry = phaseCarry(operatorId);
    const operatorStats = perOperator.get(operatorId);
    const stratum = stratumOf(sourceId, targetId);
    const stratumStat = stratumStats.get(stratum);

    operatorStats.applications += 1;
    stratumStat.applications += 1;

    for (let phase = 0; phase < EXPECTED_PHASES; phase += 1) {
      totalChecks += 1;
      operatorStats.checks += 1;
      stratumStat.checks += 1;
      const concreteSource = pcsOf(sourceMask).map((pitch) => (pitch + phase) % 12);
      const actual = concreteApply(operatorId, concreteSource, phase);
      const expectedPhase = (phase + carry + 12) % 12;
      const expectedTarget = pcsOf(targetMask).map((pitch) => (pitch + expectedPhase) % 12);
      const matches =
        actual !== null &&
        actual.cut === expectedPhase &&
        sortedKey(actual.pitchClasses) === sortedKey(expectedTarget);
      if (!matches) {
        totalFailures += 1;
        operatorStats.failures += 1;
        stratumStat.failures += 1;
        if (operatorStats.witnesses.length < 5) {
          operatorStats.witnesses.push({
            applicationId: application.application_id,
            phase,
            concreteSource,
            expectedPhase,
            expectedTarget: [...expectedTarget].sort((left, right) => left - right),
            actual: actual === null ? null : { pitchClasses: actual.pitchClasses, cut: actual.cut },
          });
        }
      }
    }
  }
  const perOperatorRows = [...perOperator.values()].map((row) => ({
    operatorId: row.operatorId,
    operatorClass: row.operatorClass,
    applications: row.applications,
    checks: row.checks,
    failures: row.failures,
    phaseCarry: row.phaseCarry,
    expected: row.expected,
    verdict: row.failures === 0 ? "PASS" : "FAIL",
    witnesses: row.witnesses,
  }));
  const equivarianceVerdict = perOperatorRows.every((row) => row.verdict === "PASS") ? "PASS" : "FAIL";

  const p2 = {
    probe: "equivariance",
    statement: "every admitted mutation operator, applied to a phase-shifted input, yields the phase-shifted output: Op(T_p(x)) = T_p(Op(x)) with the R1/L1 seam carry p +/- 1",
    preRegistration: {
      source: "Phase A planning pass, approved in maintainer disposition (2026-10-08)",
      expectations: [
        "R2-R7 / L2-L7 fixed-degree shifts: equivariant, phase-preserving (mask-local)",
        "M modal successor: equivariant, phase-preserving (re-rooting commutes with translation)",
        "R1 root-phase raise: equivariant, phase carry +1 (moves the seam)",
        "L1 root-phase lower: equivariant, phase carry -1",
        "a commutation failure is a finding (rooting-dependent operator), recorded with witness, not a crash",
      ],
    },
    calibration: {
      method: "anchored reimplementation of the fifteen admitted generators applied to all admitted applications",
      checked: applications.length,
      matched: applications.length - calibrationFailures,
      failures: calibrationFailures,
      verdict: calibrationFailures === 0 ? "EXACT" : "FAIL",
    },
    sweep: {
      applicationUniverse: {
        total: applications.length,
        modal: applications.filter((application) => application.operator_id === "M").length,
        local: applications.filter((application) => application.operator_id !== "M").length,
      },
      phases: EXPECTED_PHASES,
      liftedApplications: totalChecks,
      checks: totalChecks,
      failures: totalFailures,
      operators: perOperatorRows.length,
      verdict: equivarianceVerdict,
    },
    strata: [...stratumStats.values()],
    rootingDependenceFound: totalFailures > 0,
    perOperator: perOperatorRows,
    boundaryCase: {
      method: "the same sweep restricted to applications whose source or target is a D1-D7 anchor, a boundary state, or an admitted-bridge (5-23/5-27) parent",
      dAnchorTouchingApplications: applications.filter((application) => {
        const sourceId = Number(application.source_id);
        const targetId = Number(application.target_id);
        return dAnchorIds.has(sourceId) || dAnchorIds.has(targetId);
      }).length,
      admittedBridgeParentUnion: admittedBridgeParentNumeric.size,
      cornerstoneParentUnion: cornerstoneParentNumeric.size,
    },
  };

  // ---- P3: seam census ----------------------------------------------------
  // Family A: operator-realized root-phase seams (R1/L1).
  const r1Rows = applications.filter((application) => application.operator_id === "R1");
  const l1Rows = applications.filter((application) => application.operator_id === "L1");
  const intra735 = applications.filter(
    (application) =>
      ["R1", "L1"].includes(application.operator_id) &&
      application.source_forte === "7-35" &&
      application.target_forte === "7-35",
  );
  const intra735R1 = intra735.filter((application) => application.operator_id === "R1");
  const intra735L1 = intra735.filter((application) => application.operator_id === "L1");
  if (r1Rows.length !== 210 || l1Rows.length !== 210) fail(`R1/L1 census is ${r1Rows.length}/${l1Rows.length}`);
  if (intra735.length !== 2) fail(`intra-7-35 R1/L1 census is ${intra735.length}`);
  const canonicalOperatorEdge = intra735R1[0];
  const canonicalOperatorInverse = intra735L1[0];

  // Modal seam census over lifted 7-35 nodes.
  const states735 = heptatonic.filter((record) => record.forte === "7-35");
  if (states735.length !== 7) fail(`anchored 7-35 census is ${states735.length}`);
  const lifted735 = [];
  for (const record of states735) {
    for (let phase = 0; phase < EXPECTED_PHASES; phase += 1) {
      const concrete = translateSet(record.pitchClasses, phase).sort((left, right) => left - right);
      lifted735.push({
        anchoredId: record.bipartiteId,
        anchoredNumericId: record.id,
        phase,
        set: sortedKey(concrete),
        lydianTonic: findModeTonic(concrete, LYDIAN_PATTERN),
        locrianTonic: findModeTonic(concrete, LOCRIAN_PATTERN),
      });
    }
  }
  const liftedBySet = new Map();
  for (const node of lifted735) {
    if (!liftedBySet.has(node.set)) liftedBySet.set(node.set, []);
    liftedBySet.get(node.set).push(node);
  }
  const concreteCollections = [...liftedBySet.keys()];
  if (concreteCollections.length !== 12) fail(`distinct diatonic collections are ${concreteCollections.length}`);
  for (const [set, nodes] of liftedBySet) {
    if (nodes.length !== 7) fail(`diatonic collection ${set} has ${nodes.length} representatives`);
    void set;
  }

  const modalReadings = [];
  let adjacencyPairs = 0;
  for (let left = 0; left < concreteCollections.length; left += 1) {
    for (let right = left + 1; right < concreteCollections.length; right += 1) {
      const setA = concreteCollections[left].split(",").map(Number);
      const setB = concreteCollections[right].split(",").map(Number);
      const common = setA.filter((pitch) => setB.includes(pitch));
      if (common.length !== 6) continue;
      adjacencyPairs += 1;
      const ordered = [
        { a: concreteCollections[left], b: concreteCollections[right] },
        { a: concreteCollections[right], b: concreteCollections[left] },
      ];
      for (const { a, b } of ordered) {
        const lydian = liftedBySet.get(a)[0].lydianTonic;
        const locrian = liftedBySet.get(b)[0].locrianTonic;
        if (lydian === null || locrian === null) {
          fail(`missing modal tonic on diatonic pair ${a} / ${b}`);
        }
        const distance = (locrian - lydian + 12) % 12;
        if (distance !== 1 && distance !== 11) {
          fail(`unexpected modal reading distance ${distance} on ${a} / ${b}`);
        }
        const kind = distance === 1 ? "canonical" : "mirror";
        const setAPitches = a.split(",").map(Number);
        const setBPitches = b.split(",").map(Number);
        const symmetricDifference = [
          ...setAPitches.filter((pitch) => !setBPitches.includes(pitch)),
          ...setBPitches.filter((pitch) => !setAPitches.includes(pitch)),
        ].sort((left, right) => left - right);

        // structural signature checks
        if (kind === "canonical") {
          const expectedExchange = [lydian, locrian].sort((left, right) => left - right);
          if (sortedKey(symmetricDifference) !== sortedKey(expectedExchange)) {
            fail(`canonical tonic-exchange signature fails on ${a} / ${b}`);
          }
        } else {
          const tritonePair = [(lydian + 6) % 12, (locrian + 6) % 12].sort((left, right) => left - right);
          if (sortedKey(symmetricDifference) !== sortedKey(tritonePair)) {
            fail(`mirror tritone-trade signature fails on ${a} / ${b}`);
          }
          if (!setBPitches.includes(lydian) || !setAPitches.includes(locrian)) {
            fail(`mirror tonics are not common tones on ${a} / ${b}`);
          }
        }

        // representative pair at the mode tonics + minimum over all 49 pairs
        const lydianRep = liftedBySet.get(a).find((node) => node.phase === lydian);
        const locrianRep = liftedBySet.get(b).find((node) => node.phase === locrian);

        let minimum = 99;
        let maximumAbs = 0;
        for (const nodeA of liftedBySet.get(a)) {
          for (const nodeB of liftedBySet.get(b)) {
            const delta = signedPhaseDistance(nodeA.phase, nodeB.phase);
            if (Math.abs(delta) < Math.abs(minimum)) minimum = delta;
            if (Math.abs(delta) > maximumAbs) maximumAbs = Math.abs(delta);
          }
        }
        if (minimum !== 0) fail(`no same-phase representative pair for ${a} / ${b}`);

        const realizations = [];
        for (const application of applications) {
          const carryDistance = ((phaseCarry(application.operator_id) % 12) + 12) % 12;
          for (const nodeA of liftedBySet.get(a)) {
            for (const nodeB of liftedBySet.get(b)) {
              if (
                nodeA.anchoredNumericId === Number(application.source_id) &&
                nodeB.anchoredNumericId === Number(application.target_id) &&
                ((nodeB.phase - nodeA.phase + 12) % 12) === carryDistance
              ) {
                realizations.push({
                  applicationId: application.application_id,
                  operatorId: application.operator_id,
                  phaseDistance: carryDistance === 11 ? -1 : carryDistance,
                });
              }
            }
          }
        }
        const uniqueRealizations = [
          ...new Map(
            realizations.map((entry) => [`${entry.applicationId}|${entry.phaseDistance}`, entry]),
          ).values(),
        ].sort((leftEntry, rightEntry) => (leftEntry.applicationId < rightEntry.applicationId ? -1 : 1));
        if (kind === "canonical") {
          const direct = uniqueRealizations.find(
            (entry) =>
              entry.applicationId === canonicalOperatorEdge.application_id &&
              entry.operatorId === "R1" &&
              entry.phaseDistance === 1,
          );
          if (!direct) fail(`canonical reading ${a} / ${b} lacks the R1 realization`);
        } else if (!uniqueRealizations.some((entry) => entry.phaseDistance === 0)) {
          fail(`mirror reading ${a} / ${b} lacks a same-phase realization`);
        }

        modalReadings.push({
          kind,
          lydianTonic: lydian,
          locrianTonic: locrian,
          lydianCollection: a,
          locrianCollection: b,
          commonTones: common.length,
          exchangedPitches: symmetricDifference,
          modeTonicPhaseDistance: distance === 11 ? -1 : 1,
          modeTonicRepresentatives: {
            lydian: { anchoredId: lydianRep.anchoredId, phase: lydianRep.phase },
            locrian: { anchoredId: locrianRep.anchoredId, phase: locrianRep.phase },
          },
          representativePhaseDistance: signedPhaseDistance(lydianRep.phase, locrianRep.phase),
          minimumRepresentativePhaseDistance: minimum,
          maximumAbsRepresentativePhaseDistance: maximumAbs,
          realizations: uniqueRealizations,
        });
      }
    }
  }
  const canonicalReadings = modalReadings.filter((reading) => reading.kind === "canonical");
  const mirrorReadings = modalReadings.filter((reading) => reading.kind === "mirror");
  if (adjacencyPairs !== 12) fail(`diatonic adjacency pair census is ${adjacencyPairs}`);
  if (canonicalReadings.length !== 12) fail(`canonical reading census is ${canonicalReadings.length}`);
  const mirrorPrediction = mirrorReadings.length === 12 ? "confirmed" : "absent-finding";
  if (canonicalReadings.some((reading) => reading.minimumRepresentativePhaseDistance !== 0)) {
    fail("a canonical reading lacks a same-phase representative pair");
  }
  if (mirrorReadings.some((reading) => reading.minimumRepresentativePhaseDistance !== 0)) {
    fail("a mirror reading lacks a same-phase representative pair");
  }
  const canonicalRealizationInventory = new Set(
    canonicalReadings.flatMap((reading) => reading.realizations.map((entry) => entry.applicationId)),
  );
  const mirrorSamePhaseInventory = new Set(
    mirrorReadings.flatMap((reading) =>
      reading.realizations.filter((entry) => entry.phaseDistance === 0).map((entry) => entry.applicationId),
    ),
  );
  if (!canonicalRealizationInventory.has(canonicalOperatorEdge.application_id)) {
    fail("canonical realization inventory is missing the anchored R1 seam edge");
  }
  if (mirrorSamePhaseInventory.size === 0) fail("mirror same-phase realization inventory is empty");

  // Family B: bridge-mediated cross-family seams (containment, fiberwise).
  const sharedSubnodes = (leftId, rightId) => {
    const left = bipartite.heptatonicNodes[leftId];
    const right = bipartite.heptatonicNodes[rightId];
    if (!left || !right) fail(`unknown heptatonic containment endpoint ${leftId} / ${rightId}`);
    const rightSet = new Set(right.subnodes);
    return left.subnodes.filter((subnode) => rightSet.has(subnode));
  };
  const s735 = heptatonic.filter((record) => record.forte === "7-35").map((record) => record.bipartiteId);
  const s732 = heptatonic.filter((record) => record.forte === "7-32").map((record) => record.bipartiteId);
  let familyBPairs = 0;
  let familyBCrossings = 0;
  const familyBCrossingHistogram = {};
  for (const left of s735) {
    for (const right of s732) {
      const shared = sharedSubnodes(left, right);
      if (shared.length === 0) continue;
      familyBPairs += 1;
      familyBCrossings += shared.length;
      familyBCrossingHistogram[shared.length] = (familyBCrossingHistogram[shared.length] ?? 0) + 1;
    }
  }
  const andalusianShared = sharedSubnodes("7-35:3", "7-32:0");
  const admittedShared = andalusianShared.filter((nodeId) =>
    ADMITTED_BRIDGE_CLASSES.includes(bipartite.pentatonicSubnodes[nodeId].setClassId),
  );
  if (andalusianShared.length !== 5) fail(`Andalusian shared-subnode census is ${andalusianShared.length}`);
  if (admittedShared.length !== 2) fail(`Andalusian admitted-bridge census is ${admittedShared.length}`);

  const seamHistogram = {
    familyAIntraFamily: {
      R1: { count: intra735R1.length, phaseCarry: 1 },
      L1: { count: intra735L1.length, phaseCarry: -1 },
    },
    familyACrossFamily: {
      R1: { count: r1Rows.length - intra735R1.length, phaseCarry: 1 },
      L1: { count: l1Rows.length - intra735L1.length, phaseCarry: -1 },
    },
    familyALifted: {
      raised: { count: r1Rows.length * EXPECTED_PHASES, phaseDistance: 1 },
      lowered: { count: l1Rows.length * EXPECTED_PHASES, phaseDistance: -1 },
    },
    familyB: {
      crossings: familyBCrossings,
      phaseDistance: 0,
      method: "containment is fiberwise: (H, p) superset-of (P, p), so bridge-mediated crossings preserve phase",
    },
    modalReadings: {
      canonical: canonicalReadings.map((reading) => reading.modeTonicPhaseDistance).reduce((counts, distance) => {
        counts[distance] = (counts[distance] ?? 0) + 1;
        return counts;
      }, {}),
      mirror: mirrorReadings.map((reading) => reading.modeTonicPhaseDistance).reduce((counts, distance) => {
        counts[distance] = (counts[distance] ?? 0) + 1;
        return counts;
      }, {}),
    },
  };

  const allRadiusOne =
    canonicalReadings.every((reading) => Math.abs(reading.modeTonicPhaseDistance) === 1) &&
    mirrorReadings.every((reading) => Math.abs(reading.modeTonicPhaseDistance) === 1);

  const p3 = {
    probe: "seam-census",
    statement: "enumerate every seam connection and measure the phase distance across it; decide whether radius-1 patches generalize",
    preRegistration: {
      source: "Phase A planning pass, approved in maintainer disposition (2026-10-08)",
      expectations: [
        "family A intra-family seams are R1/L1-realized (operator edges) and carry phase +/-1",
        "family B cross-family seams are bridge-mediated (5-23/5-27 containment) and preserve phase (distance 0)",
        "canonical modal relation Lydian(p) <-> Locrian(p+1) appears in every adjacency direction",
        "mirror modal relation Lydian(p) <-> Locrian(p-1) appears; absence is a symmetry finding, not a probe bug",
      ],
    },
    familyA: {
      definition: "operator-realized root-phase seams: every admitted R1/L1 application, lifted at all 12 phases",
      applications: r1Rows.length + l1Rows.length,
      intraFamily: { total: intra735.length, r1: intra735R1.length, l1: intra735L1.length },
      crossFamily: { total: r1Rows.length + l1Rows.length - intra735.length },
      anchoredCanonicalEdge: {
        application: canonicalOperatorEdge.application_id,
        source: canonicalOperatorEdge.source_name,
        target: canonicalOperatorEdge.target_name,
        sourcePitchSet: canonicalOperatorEdge.source_pitch_set,
        targetPitchSet: canonicalOperatorEdge.target_pitch_set,
        inverse: canonicalOperatorInverse.application_id,
      },
      liftedSeamEdges: (r1Rows.length + l1Rows.length) * EXPECTED_PHASES,
      phaseDistance: "R1 +1, L1 -1 (the seam operator moves the cut that carries the phase)",
    },
    familyB: {
      definition: "bridge-mediated cross-family seams: shared pentatonic subnodes between 7-35 and 7-32 heptatonic nodes",
      pairsWithSharedSubnodes: familyBPairs,
      crossings: familyBCrossings,
      crossingHistogram: familyBCrossingHistogram,
      phaseDistance: 0,
      andalusianGroundTruth: {
        route: "7-35:3 -> bridge -> 7-32:0",
        sharedSubnodes: andalusianShared,
        admittedBridges: admittedShared,
        match: "reproduces the BL-028 / Phase 2 transport-probe ground truth exactly",
      },
    },
    modalSeamCensus: {
      distinctDiatonicCollections: concreteCollections.length,
      representativesPerCollection: 7,
      adjacencyPairs,
      canonicalReadings: canonicalReadings.length,
      mirrorReadings: mirrorReadings.length,
      mirrorPrediction,
      canonicalRealizationInventory: [...canonicalRealizationInventory],
      mirrorSamePhaseRealizationInventory: [...mirrorSamePhaseInventory],
      realizationStructure: {
        canonical: "R1 (+1) plus R2-R7 (0): the seven-address raise ring over the 7-35 anchored states; the root-phase R1 edge is the phase-advancing canonical seam",
        mirror: "L1 (-1) plus L2-L7 (0): the seven-address lower ring; the root-phase L1 edge is the phase-retreating mirror seam",
      },
      readings: modalReadings,
      readingRefinement: "each directed modal reading is realized by the anchored seven-operator ring over the 7-35 anchors: canonical by R1..R7, mirror by L1..L7; the root-phase edge carries the phase (canonical +1, mirror -1) and connects the mode-tonic representatives, while the six fixed-degree edges preserve phase and connect same-phase representatives (the two collections share 6 tones); no seam requires a phase excursion beyond 1",
    },
    histogram: seamHistogram,
    radiusOneVerdict: allRadiusOne ? "PASS" : "FAIL",
    assembly: {
      familyAAssembled: (r1Rows.length + l1Rows.length) * EXPECTED_PHASES,
      familyBAssembled: familyBCrossings,
      totalAssembledSeams: (r1Rows.length + l1Rows.length) * EXPECTED_PHASES + familyBCrossings,
    },
  };

  // ---- P0 receipt completion ---------------------------------------------
  const completedClaims = verification.claims.map((claim) => {
    if (claim.id === "M3-seam-relation") {
      return {
        ...claim,
        status: "PASS",
        canonical: "12 canonical readings (Lydian(p) <-> Locrian(p+1), tonic exchange, 6/7 common tones) verified; realized by the R1 root-phase seam edge (+1) plus the R2-R7 same-phase ring",
        mirror: "12 mirror readings (Lydian(p) <-> Locrian(p-1), tritone-degree trade, tonics as common tones) verified; realized by the L1 edge (-1) plus the L2-L7 same-phase ring",
        mirrorPrediction,
        verifiedBy: "p3SeamCensus",
      };
    }
    if (claim.id === "M4-minimal-patch") {
      return {
        ...claim,
        status: allRadiusOne ? "PASS" : "FAIL",
        coverage: `all seam readings carry phase distance +/-1 or 0; radius-1 patch covers`,
        verifiedBy: "p3SeamCensus",
      };
    }
    return claim;
  });
  const completedVerification = {
    ...verification,
    claims: completedClaims,
    overall: completedClaims.every((claim) => claim.status === "PASS") ? "PASS" : "FAIL",
  };

  // ---- P1 phase coordinate ------------------------------------------------
  const p1 = {
    probe: "phase-coordinate",
    definition:
      "phase p in Z12 is the transposition offset applied to an anchored record: the lifted node (record, p) denotes the concrete configuration (T_p(pitchClasses), T_p(root)); the anchored cut (pc 0 of the record) sits at absolute pc p",
    representation: {
      nodeIdConvention: "{anchoredId}@{phase}",
      example: "7-35:0@3",
      phaseField: "uint4, 0..11",
      orientationHandling: "orientation suffix preserved inside anchoredId (e.g. 7-10:0B@11)",
    },
    counts: {
      heptatonicAnchored: heptatonic.length,
      pentatonicAnchored: pentatonic.length,
      phases: EXPECTED_PHASES,
      liftedHeptatonic: heptatonic.length * EXPECTED_PHASES,
      liftedPentatonic: pentatonic.length * EXPECTED_PHASES,
      liftedTotal: (heptatonic.length + pentatonic.length) * EXPECTED_PHASES,
    },
    covering: {
      distinctConcreteSevenSets: 792,
      distinctConcreteFiveSets: 792,
      multiplicitySeven: 7,
      multiplicityFive: 5,
      statement:
        "the lift is 7-fold redundant in concrete pc-set terms and exactly non-redundant in (anchored-form, phase) terms; the redundancy is the phase information",
    },
    rooting: {
      convention: verification.claims.find((claim) => claim.id === "P1-rooting-check").rootingConvention,
      ambiguity: false,
      check: "P1-rooting-check",
    },
    whatPhaseIsNot: ["not a pitch class of the set", "not an office", "not a Court position", "not a Q-engine state"],
  };

  // ---- P4 lift architecture ----------------------------------------------
  const p4 = {
    probe: "lift-architecture",
    contingentOn: "p2Equivariance.verdict and p3SeamCensus.radiusOneVerdict",
    p2Verdict: equivarianceVerdict,
    p3Verdict: p3.radiusOneVerdict,
    nodeIdentity: "{anchoredId}@{phase}; every anchored record contributes 12 lifted nodes",
    counts: {
      liftedHeptatonic: 5544,
      liftedPentatonic: 3960,
      liftedTotal: 9504,
    },
    containment: {
      rule: "fiberwise and same-phase only: (H, p) contains (P, p) iff H contains P in the anchored artifact; no cross-phase containment edge is emitted",
      anchoredPairsPerDirection: 6930,
      liftedPairsPerDirection: 6930 * EXPECTED_PHASES,
      g1: "no intra-330 adjacency is assumed, emitted, or consumed; G1 remains BL-024's decision",
    },
    operatorEdges: {
      rule: "operator edges lift by equivariance; R1/L1 carry phase p+1 / p-1, all other operators preserve p",
      verdict: equivarianceVerdict,
    },
    storage: {
      status: "planning_evidence",
      byteStable: true,
      selfValidating: "independent validator re-derives every census from the landed sources and re-checks the fingerprint",
      anchorBytesUnchanged: true,
    },
  };

  // ---- P5 boundary layer ---------------------------------------------------
  const modalSuccessorMap = new Map();
  for (const application of applications) {
    if (application.operator_id === "M") {
      modalSuccessorMap.set(Number(application.source_id), Number(application.target_id));
    }
  }
  const anchoredModalCycles = modalCycles(heptatonic.map((record) => record.id), modalSuccessorMap);
  if (anchoredModalCycles.length !== 66) fail(`anchored modal cycle census is ${anchoredModalCycles.length}`);
  const dToDFixedDegree = applications.filter(
    (application) =>
      application.operator_class === "fixed_degree_shift" &&
      dAnchorIds.has(Number(application.source_id)) &&
      dAnchorIds.has(Number(application.target_id)),
  );
  const dToDModal = applications.filter(
    (application) =>
      application.operator_id === "M" &&
      dAnchorIds.has(Number(application.source_id)) &&
      dAnchorIds.has(Number(application.target_id)),
  );
  if (dToDFixedDegree.length !== 0) fail(`D-D fixed-degree census is ${dToDFixedDegree.length}`);
  if (dToDModal.length !== 49) fail(`D-D modal census is ${dToDModal.length}`);
  const dTierCycles = modalCycles([...dAnchorIds].sort((left, right) => left - right), modalSuccessorMap);
  if (dTierCycles.length !== 7) fail(`D-tier cycle census is ${dTierCycles.length}`);

  const p5 = {
    probe: "boundary-layer-integration",
    statement: "the phase machinery reproduces the boundary layer per phase; the BL-029 wall stands; wall dissolution is not a Phase A question",
    modalClosure: {
      anchoredCycles: anchoredModalCycles.length,
      liftedCycleFamilies: anchoredModalCycles.length,
      cycleLength: 7,
      statement: "each anchored modal cycle lifts to a phase-indexed cycle family; M-closure holds at every phase",
    },
    dTier: {
      anchors: dAnchorIds.size,
      fixedDegreeAnchorToAnchor: dToDFixedDegree.length,
      modalAnchorToAnchor: dToDModal.length,
      dAnchorCycles: dTierCycles.length,
      liftedDAnchorCycles: dTierCycles.length * EXPECTED_PHASES,
      fixedDegreeIsolationPersists: true,
      statement: "D-D fixed-degree isolation persists at every phase; the 49 modal edges lift fiberwise; the phase machinery does not dissolve the wall",
    },
    samplingPaths: "BL-030 d-cycle:D1-D7 exhibit routes remain the boundary layer's canonical sampling paths, re-indexed by phase",
    dissolutionDisposition: "not attempted; Phase C's governs question",
  };

  // ---- P6 minimal patch ----------------------------------------------------
  const patchPhases = [11, 0, 1];
  const cFlankReadings = modalReadings.filter((reading) => reading.lydianTonic === 0 || reading.lydianTonic === 11);
  const p6 = {
    probe: "minimal-patch",
    definition: "the B/C/C# three-phase patch: all lifted nodes with phase in {11, 0, 1}; covers both flanks of the C cut",
    phases: patchPhases,
    nodeCounts: {
      heptatonic: heptatonic.length * patchPhases.length,
      pentatonic: pentatonic.length * patchPhases.length,
      both: (heptatonic.length + pentatonic.length) * patchPhases.length,
    },
    containment: "the same-phase fiberwise rule restricted to the patch phases",
    operatorEdges: "R1/L1 cross the patch boundary at phases 11 and 1, so the patch is closed under root-phase seam traversal",
    sufficiency: {
      criterion: "every enumerated seam has a representative pair at phase distance within +/-1 (indeed within 0/+/-1)",
      familyA: "all R1/L1 seams carry +/-1",
      familyB: "all bridge-mediated crossings carry 0",
      modalReadings: "all 24 readings have a mode-tonic representative pair at +/-1 and a same-phase representative pair at 0",
      verdict: allRadiusOne ? "PASS" : "FAIL",
      noFourthPhaseNeeded: allRadiusOne,
    },
    fixtures: cFlankReadings.map((reading) => ({
      kind: reading.kind,
      relation: `${NOTE_NAMES[reading.lydianTonic]} Lydian <-> ${NOTE_NAMES[reading.locrianTonic]} Locrian`,
      lydianTonic: reading.lydianTonic,
      locrianTonic: reading.locrianTonic,
      commonTones: reading.commonTones,
      modeTonicPhaseDistance: reading.modeTonicPhaseDistance,
      minimumRepresentativePhaseDistance: reading.minimumRepresentativePhaseDistance,
      realizations: reading.realizations,
    })),
  };

  const core = {
    schemaVersion: SCHEMA_VERSION,
    probeId: PROBE_ID,
    status: "planning_evidence",
    generator: "scripts/build-phase-a-probe.mjs",
    sourceBindings: [
      { artifact: HEPTATONIC_NETWORK_PATH, sha256: fileSha(HEPTATONIC_NETWORK_PATH), role: "anchored heptatonic universe" },
      { artifact: HEPTATONIC_LEDGER_PATH, sha256: fileSha(HEPTATONIC_LEDGER_PATH), role: "462-record roles, tiers, pitch sets" },
      { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "pentatonic universe, roots, containment, bridges, cornerstones" },
      { artifact: REGISTRY_PATH, sha256: fileSha(REGISTRY_PATH), role: "operator canon and classes" },
      { artifact: APPLICATIONS_PATH, sha256: fileSha(APPLICATIONS_PATH), role: "admitted application universe" },
    ],
    p0Verification: completedVerification,
    p1PhaseCoordinate: p1,
    p2Equivariance: p2,
    p3SeamCensus: p3,
    p4LiftArchitecture: p4,
    p5BoundaryLayer: p5,
    p6MinimalPatch: p6,
    fences: {
      governsClaims: "none; D4/D7 retry is Phase C, gated on Phase B admission",
      g1Intra330: "untouched: no intra-330 edge is assumed, emitted, or consumed",
      topologyMutation: "none: anchored universe, canonical records, Court runtime, Neo4j projection, and schema contracts untouched",
      admission: "none: this artifact is planning evidence; Phase B is the separate claim event",
      membrane: "the being/becoming frame (map 2.6) and polarity synthesis (map 2.7) are interpretation vocabulary, never design input",
      sessionDerivedMath: "grounded by this build's P0 gate and P3 census; nothing is cited unverified",
    },
    notAccomplished: [
      "no governs verdicts (D4/D7 retry is Phase C)",
      "no topology admission (Phase B claim event)",
      "no G1 movement (no intra-330 edges)",
      "no boundary-layer traversal claims (the BL-029 wall stands until Phase C tests whether it falls)",
      "no directional-semantics assignment (BL-035 negative result carried)",
    ],
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
  const summary = {
    output: OUTPUT_PATH,
    check,
    p0: probe.p0Verification.overall,
    p2: probe.p2Equivariance.sweep.verdict,
    p2Checks: probe.p2Equivariance.sweep.checks,
    p3: probe.p3SeamCensus.radiusOneVerdict,
    canonicalReadings: probe.p3SeamCensus.modalSeamCensus.canonicalReadings,
    mirrorReadings: probe.p3SeamCensus.modalSeamCensus.mirrorReadings,
    mirrorPrediction: probe.p3SeamCensus.modalSeamCensus.mirrorPrediction,
    probeFingerprint: probe.probeFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_PHASE_A_PROBE");
    console.log(JSON.stringify({ ...summary, stale: false }, null, 2));
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(JSON.stringify({ ...summary, sha256: sha256(serialized) }, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
