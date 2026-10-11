#!/usr/bin/env node
/**
 * Validate the generated BL-060 D4 14-vs-14 hunt against its sources.
 *
 * Independent of the builder: re-reads the canonical ledger, the bipartite
 * containment mesh, the complement map, the court admission release, the
 * canonical network (office order), the ENTRY 13 correspondence receipt, the
 * Phase C probe and the BL-055 artifact; re-derives the extended 28-key table,
 * the seven axis confusion matrices, the per-family D-tier breakdown, the
 * non-Z composite clean split, the office lemma, the bridge adjudication and
 * the synthesis counters; re-checks the BL-055 import fingerprint and the
 * hunt fingerprint. Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.d4-14v14-hunt.v1";
const HUNT_ID = "BL060_D4_14V14_HUNT_v1";
const BL055_PATH = "orrery/src/generated/d4-selection-review.v1.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const COMPLEMENT_MAP_PATH = "seven-governors-court-substrate-v0.1.0/canonical/complement-map.json";
const COURT_ADMISSION_PATH = "provenance/court-admission-release.json";
const NETWORK_PATH = "canonical/universal-network-data.json";
const CORRESPONDENCE_RECEIPT_PATH = "qa/specs/bl-011-correspondence-admission.json";
const PHASE_C_PROBE_PATH = "orrery/src/generated/phase-c-probe.v1.json";

const D_ANCHOR_FAMILIES = ["7-1", "7-15", "7-22", "7-8", "7-Z12", "7-Z17", "7-Z37"];
const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
const ADMITTED_BRIDGE_CLASSES = ["5-23", "5-27"];
const ELEMENT_BY_GOVERNOR = { Mars: "Fire", Jupiter: "Air", Venus: "Water", Saturn: "Earth" };
const ENTRY13_FATE_BY_GOVERNOR = { Mars: "4->5", Jupiter: "9->10", Venus: "2->3", Saturn: "7->8" };

function fail(message) {
  throw new Error(`INVALID_D4_14V14_HUNT: ${message}`);
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
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (field.length > 0 || row.length > 0) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

function canonicalText(value) {
  if (value === null) return "null";
  if (value === true) return "true";
  if (value === false) return "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) fail("non-integer number in payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const unique = (values) => [...new Set(values)].sort(cmp);
const keyOf = (office, satellite) => `${office}:${satellite}`;
const pitchList = (text) => text.replace(/[{}]/g, "").split(",").map(Number).sort((a, b) => a - b);
const setKeyAtPhase = (pitches, phase) => [...pitches.map((pitch) => (pitch + Number(phase)) % 12)].sort((a, b) => a - b).join(",");

function invertMask(mask) {
  let result = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) result |= 1 << ((12 - pitch) % 12);
  }
  return result;
}

function isInversionSymmetric(pitches) {
  const set = new Set(pitches);
  for (let shift = 0; shift < 12; shift += 1) {
    let holds = true;
    for (const pitch of pitches) {
      if (!set.has(((-pitch + shift) % 12 + 12) % 12)) { holds = false; break; }
    }
    if (holds) return true;
  }
  return false;
}

function histogram(keys, observedSet, valueOf) {
  const result = { observed: {}, unobserved: {} };
  for (const key of keys) {
    const value = String(valueOf(key));
    const group = observedSet.has(key) ? "observed" : "unobserved";
    result[group][value] = (result[group][value] ?? 0) + 1;
  }
  return result;
}

function confusion(keys, observedSet, predicate) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const key of keys) {
    const predicted = predicate(key);
    const actual = observedSet.has(key);
    if (actual && predicted) tp += 1;
    else if (actual && !predicted) fn += 1;
    else if (!actual && predicted) fp += 1;
    else tn += 1;
  }
  return { tp, fp, fn, tn };
}

function bestNumeric(keys, observedSet, valueOf, direction) {
  const values = unique(keys.map(valueOf));
  let best = null;
  for (const threshold of values) {
    const predicate = direction === "le"
      ? (key) => valueOf(key) <= threshold
      : (key) => valueOf(key) >= threshold;
    const matrix = confusion(keys, observedSet, predicate);
    const hit = matrix.tp + matrix.tn;
    if (!best || hit > best.hit) best = { threshold: String(threshold), confusion: matrix, hit };
  }
  return best;
}

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const bl055 = readJson(BL055_PATH);
  const ledger = parseCsv(read(LEDGER_PATH));
  const bipartite = readJson(BIPARTITE_PATH);
  const complementMap = readJson(COMPLEMENT_MAP_PATH);
  const courtAdmission = readJson(COURT_ADMISSION_PATH);
  const network = readJson(NETWORK_PATH);
  const correspondence = readJson(CORRESPONDENCE_RECEIPT_PATH);
  const phaseC = readJson(PHASE_C_PROBE_PATH);

  // ---- header, status, fingerprint ----------------------------------------
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.huntId !== HUNT_ID ||
      artifact.status !== "planning_evidence" ||
      artifact.generator !== "scripts/build-d4-14v14-hunt.mjs") fail("header drift");
  const { huntFingerprint, ...core } = artifact;
  if (typeof huntFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(huntFingerprint) ||
      sha256(canonicalText(core)) !== huntFingerprint) fail("hunt fingerprint drift");
  for (const binding of artifact.sourceBindings) {
    if (sha256(fs.readFileSync(path.join(root, binding.artifact))) !== binding.sha256) {
      fail(`source binding drift: ${binding.artifact}`);
    }
  }

  // ---- BL-055 import integrity --------------------------------------------
  const { reviewFingerprint: bl055Fingerprint, ...bl055Core } = bl055;
  if (sha256(canonicalText(bl055Core)) !== bl055Fingerprint) fail("BL-055 fingerprint drift");
  if (artifact.base.fingerprint !== bl055Fingerprint || artifact.base.artifact !== BL055_PATH ||
      artifact.base.domainKeys !== 28 || artifact.base.observedKeys !== 14 ||
      artifact.base.predicate !== "P(s) = [forte(s) = 7-27]") fail("BL-055 import drift");
  if (bl055.domain.uKeys.length !== 28 || bl055.domain.observedKeys.length !== 14) fail("BL-055 domain drift");
  const uKeys = unique(bl055.domain.uKeys);
  const observedKeys = unique(bl055.domain.observedKeys);
  const observedSet = new Set(observedKeys);
  if (canonicalText(uKeys) !== canonicalText(artifact.domain.uKeys) ||
      canonicalText(observedKeys) !== canonicalText(artifact.domain.observedKeys)) fail("domain disagreement");
  const bl055RowByKey = new Map(bl055.table28.map((row) => [row.key, row]));
  if (bl055RowByKey.size !== 28) fail("BL-055 key collisions");

  // ---- canonical re-extraction --------------------------------------------
  if (ledger.length !== 462) fail("ledger census drift");
  const ledgerById = new Map(ledger.map((row) => [row.id, row]));
  const identity = (id) => {
    const row = ledgerById.get(id);
    if (!row) fail(`ledger identity missing for ${id}`);
    return row;
  };
  const class27 = ledger.filter((row) => row.forte === "7-27");
  const class31 = ledger.filter((row) => row.forte === "7-31");
  if (class27.length !== 14 || class31.length !== 14 ||
      [...class27, ...class31].some((row) => row.tier !== "A1" || row.role !== "satellite")) {
    fail("global set-class census drift");
  }
  for (const row of observedSet) {
    const satellite = row.split(":")[1];
    if (identity(satellite).forte !== "7-27") fail(`observed key ${row} is not 7-27`);
  }
  for (const key of uKeys.filter((candidate) => !observedSet.has(candidate))) {
    if (identity(key.split(":")[1]).forte !== "7-31") fail(`unobserved key ${key} is not 7-31`);
  }
  const dAnchors = ledger.filter((row) => row.role === "anchor" && row.tier.startsWith("D"));
  if (dAnchors.length !== 49) fail("D-tier anchor census drift");
  const dFamilies = unique(dAnchors.map((row) => row.forte));
  if (canonicalText(dFamilies) !== canonicalText(D_ANCHOR_FAMILIES)) fail("D-tier family census drift");
  for (const family of D_ANCHOR_FAMILIES) {
    if (dAnchors.filter((row) => row.forte === family).length !== 7) fail(`D-tier family ${family} census drift`);
  }

  const officeOrder = network.officeOrder.map(String);
  if (officeOrder.length !== 7) fail("office order census drift");
  const ledgerOfficeByIndex = new Map();
  for (const row of ledger) {
    if (row.officeIndex !== "" && row.office !== "") ledgerOfficeByIndex.set(row.officeIndex, row.office);
  }
  for (const [index, office] of ledgerOfficeByIndex) {
    if (officeOrder[Number(index)] !== office) fail(`office order disagreement at ${index}`);
  }
  const perOffice = officeOrder.map((governor, index) => {
    const office = String(index);
    const keys = uKeys.filter((key) => key.startsWith(`${office}:`));
    const observed = keys.filter((key) => observedSet.has(key));
    if (keys.length !== 4 || observed.length !== 2) fail(`office ${office} block structure drift`);
    return { office, governor, keys, observed, observedCount: observed.length,
      observedClassCount: keys.filter((key) => identity(key.split(":")[1]).forte === "7-27").length,
      unobservedClassCount: keys.filter((key) => identity(key.split(":")[1]).forte === "7-31").length };
  });
  if (canonicalText(artifact.domain.perOffice) !== canonicalText(perOffice.map((block) => ({ office: block.office, governor: block.governor,
    keys: block.keys, observed: block.observed, observedCount: block.observedCount,
    observedClassCount: block.observedClassCount, unobservedClassCount: block.unobservedClassCount })))) {
    fail("per-office block drift");
  }

  // ---- cycle re-derivation ------------------------------------------------
  const seamPairs = phaseC.e2Retry.routeASeam.seamPairs;
  if (seamPairs.length !== 9) fail("seam pair census drift");
  const cycleEdgeByOffice = new Map();
  for (const pair of seamPairs) {
    if (setKeyAtPhase(pitchList(identity(pair.a).pitchSet), pair.aPhase) !== pair.geometry ||
        setKeyAtPhase(pitchList(identity(pair.c).pitchSet), pair.cPhase) !== pair.geometry) {
      fail(`seam geometry drift at office ${pair.office}`);
    }
    cycleEdgeByOffice.set(String(pair.office), {
      office: String(pair.office),
      interval: ((Number(pair.aPhase) - Number(pair.cPhase)) + 12) % 12,
    });
  }
  const cycleEdges = [...cycleEdgeByOffice.values()].sort((left, right) => cmp(left.office, right.office));
  const intervalSum = cycleEdges.reduce((sum, edge) => sum + edge.interval, 0);
  const t1Offices = cycleEdges.filter((edge) => edge.interval === 1).map((edge) => edge.office).sort(cmp);
  if (intervalSum !== 12 || canonicalText(t1Offices) !== canonicalText(["0", "6"])) fail("cycle drift");
  if (canonicalText(artifact.domain.cycle.edges) !== canonicalText(cycleEdges) ||
      artifact.domain.cycle.intervalSum !== 12 ||
      canonicalText(artifact.domain.cycle.t1Edges) !== canonicalText(t1Offices)) fail("cycle artifact drift");

  // ---- complement map and admission ---------------------------------------
  const complementByHeptatonic = new Map();
  for (const entry of complementMap.complementMaps) {
    complementByHeptatonic.set(entry.heptatonicFamilyId, {
      complementClass: String(entry.pentatonicSetClassId).replace(/^pentatonic:/, ""),
      rootedPairs: entry.rootedPairs.length,
      rootedRecord: entry.rootedPairs[0]?.rootedRecordId ?? null,
      representativeHeptatonicMask: String(entry.representativeHeptatonicMask),
    });
  }
  if (complementByHeptatonic.size !== 38) fail("complement map census drift");
  const observedComplement = complementByHeptatonic.get("7-27");
  const unobservedComplement = complementByHeptatonic.get("7-31");
  if (!observedComplement || !unobservedComplement ||
      observedComplement.complementClass !== "5-27" || unobservedComplement.complementClass !== "5-31") {
    fail("complement class drift");
  }
  const admittedBridges = courtAdmission.admittedScope.bridgeSetClasses.map(String);
  if (canonicalText(unique(admittedBridges)) !== canonicalText(ADMITTED_BRIDGE_CLASSES)) fail("admitted bridge drift");
  const proposedClasses = courtAdmission.proposedScope.pentatonicSetClasses.map(String);
  if (!proposedClasses.includes("5-31") || proposedClasses.includes("5-27") || proposedClasses.includes("5-23")) {
    fail("proposed scope drift");
  }
  const correspondenceText = canonicalText(correspondence);
  for (const fragment of ["Fire 4->5", "Air 9->10", "Water 2->3", "Earth 7->8"]) {
    if (!correspondenceText.includes(fragment)) fail(`correspondence receipt missing ${fragment}`);
  }

  // ---- bipartite helpers ---------------------------------------------------
  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  if (heptNodeByMask.size !== 462) fail("bipartite heptatonic census drift");
  const pentatonicById = bipartite.pentatonicSubnodes;
  const nodeOf = (key) => {
    const node = heptNodeByMask.get(key.split(":")[1]);
    if (!node) fail(`bipartite node missing for ${key}`);
    return node;
  };
  const sharedWithFamily = (key, family) => nodeOf(key).subnodes
    .filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
  const familyCountsOf = (key) => Object.fromEntries(D_ANCHOR_FAMILIES.map((family) => [family, sharedWithFamily(key, family)]));
  const nonZSumOf = (key) => NON_Z_D_FAMILIES.reduce((sum, family) => sum + sharedWithFamily(key, family), 0);
  const zSumOf = (key) => Z_D_FAMILIES.reduce((sum, family) => sum + sharedWithFamily(key, family), 0);

  // ---- extended table re-derivation ---------------------------------------
  const expectedTable = uKeys.map((key) => {
    const [office, satellite] = key.split(":");
    const ledgerRow = identity(satellite);
    const baseRow = bl055RowByKey.get(key);
    if (!baseRow) fail(`BL-055 row missing for ${key}`);
    if (baseRow.forte !== ledgerRow.forte || baseRow.intervalVector !== ledgerRow.intervalVector ||
        baseRow.observed !== observedSet.has(key)) fail(`BL-055 base disagreement at ${key}`);
    const complement = ledgerRow.forte === "7-27" ? observedComplement : unobservedComplement;
    const complementAdmitted = admittedBridges.includes(complement.complementClass);
    const representativeKey = uKeys.find((candidate) => candidate.split(":")[1] === complement.representativeHeptatonicMask) ?? null;
    const governor = officeOrder[Number(office)];
    const inversionSibling = String(invertMask(Number(satellite)));
    if (!heptNodeByMask.has(inversionSibling)) fail(`inversion image missing for ${key}`);
    return {
      key,
      office,
      satellite,
      parentH: baseRow.parentH,
      observed: observedSet.has(key),
      base: {
        forte: baseRow.forte,
        intervalVector: baseRow.intervalVector,
        cell: baseRow.cell,
        bridgeSubnodes: baseRow.bridgeSubnodes,
        cornerstoneSubnodes: baseRow.cornerstoneSubnodes,
        seamIncidence: baseRow.seamIncidence,
      },
      complement: {
        setClass: complement.complementClass,
        admitted: complementAdmitted,
        rootedPairs: complement.rootedPairs,
        rootedRecord: complement.rootedRecord,
        representativeMask: complement.representativeHeptatonicMask,
        representativeKey,
        representativeObserved: representativeKey !== null && observedSet.has(representativeKey),
      },
      symmetry: {
        chirality: ledgerRow.chirality,
        zPartner: ledgerRow.zPartner === "" ? null : ledgerRow.zPartner,
        inversionSymmetric: isInversionSymmetric(pitchList(ledgerRow.pitchSet)),
        inversionSibling,
      },
      dTier: { counts: familyCountsOf(key), nonZSum: nonZSumOf(key), zSum: zSumOf(key) },
      cycle: {
        edgeInterval: cycleEdgeByOffice.get(office).interval,
        edgeType: cycleEdgeByOffice.get(office).interval === 1 ? "T1" : "T2",
      },
      governor,
      element: ELEMENT_BY_GOVERNOR[governor] ?? null,
      entry13Fate: ENTRY13_FATE_BY_GOVERNOR[governor] ?? null,
    };
  });
  if (artifact.table28.length !== 28) fail("extended table census drift");
  for (let index = 0; index < expectedTable.length; index += 1) {
    if (canonicalText(artifact.table28[index]) !== canonicalText(expectedTable[index])) {
      fail(`extended table drift at ${expectedTable[index].key}`);
    }
  }

  // ---- ivDelta ------------------------------------------------------------
  const observedIv = unique(class27.map((row) => row.intervalVector));
  const unobservedIv = unique(class31.map((row) => row.intervalVector));
  if (observedIv.length !== 1 || unobservedIv.length !== 1) fail("interval-vector uniformity drift");
  const observedVector = observedIv[0].split(",").map(Number);
  const unobservedVector = unobservedIv[0].split(",").map(Number);
  const signed = observedVector.map((value, i) => value - unobservedVector[i]);
  if (artifact.ivDelta.observedVector !== observedVector.join(",") ||
      artifact.ivDelta.unobservedVector !== unobservedVector.join(",") ||
      canonicalText(artifact.ivDelta.signedObservedMinusUnobserved) !== canonicalText(signed) ||
      canonicalText(artifact.ivDelta.absolute) !== canonicalText(signed.map((value) => Math.abs(value))) ||
      canonicalText(artifact.ivDelta.equalICs) !== canonicalText(["IC1"]) ||
      artifact.ivDelta.briefStringDropped !== "<010120>") fail("ivDelta drift");

  // ---- axis re-derivation --------------------------------------------------
  const tableByKey = new Map(artifact.table28.map((row) => [row.key, row]));
  const rowOf = (key) => {
    const row = tableByKey.get(key);
    if (!row) fail(`table row missing for ${key}`);
    return row;
  };
  const axisDefinitions = {
    ivDelta: {
      values: (key) => identity(key.split(":")[1]).intervalVector,
      predicate: (key) => identity(key.split(":")[1]).intervalVector === "3,4,4,4,5,1",
    },
    complementSymmetry: {
      values: (key) => rowOf(key).complement.setClass,
      predicate: () => false,
    },
    dTierContainmentComposite: {
      values: (key) => nonZSumOf(key),
      predicate: (key) => nonZSumOf(key) <= 13,
    },
    cyclePosition: {
      values: (key) => rowOf(key).cycle.edgeType,
      predicate: (key) => rowOf(key).cycle.edgeType === "T1",
    },
    bridgeAdmissionLink: {
      values: (key) => String(rowOf(key).complement.admitted),
      predicate: (key) => rowOf(key).complement.admitted,
    },
    governorElement: {
      values: (key) => rowOf(key).element ?? "none",
      predicate: (key) => rowOf(key).element !== null,
    },
    entry13Interaction: {
      values: (key) => rowOf(key).entry13Fate ?? "none",
      predicate: (key) => rowOf(key).entry13Fate !== null,
    },
  };
  if (artifact.axes.length !== 7) fail("axis census drift");
  for (const [axis, definition] of Object.entries(axisDefinitions)) {
    const entry = artifact.axes.find((row) => row.axis === axis);
    if (!entry) fail(`axis missing: ${axis}`);
    const values = histogram(uKeys, observedSet, definition.values);
    const matrix = confusion(uKeys, observedSet, definition.predicate);
    const hit = matrix.tp + matrix.tn;
    const split = matrix.tp === 14 && matrix.tn === 14 && matrix.fp === 0 && matrix.fn === 0;
    const nearMiss = !split && hit >= 26;
    if (canonicalText(values) !== canonicalText(entry.values) ||
        canonicalText(matrix) !== canonicalText(entry.confusion) || hit !== entry.hit ||
        split !== entry.split || nearMiss !== entry.nearMiss) fail(`axis drift: ${axis}`);
    if (split && entry.axisClass !== "RESTATEMENT" && entry.axisClass !== "INDEPENDENT_STRUCTURAL_SIGNATURE") {
      fail(`clean split class drift: ${axis}`);
    }
    if (!split && entry.axisClass !== "NON_SEPARATING") fail(`non-split class drift: ${axis}`);
  }
  const composite = artifact.axes.find((row) => row.axis === "dTierContainmentComposite");
  if (composite.axisClass !== "INDEPENDENT_STRUCTURAL_SIGNATURE" ||
      composite.rule !== "nonZSum(s) <= 13") fail("composite class drift");
  const ivAxis = artifact.axes.find((row) => row.axis === "ivDelta");
  if (ivAxis.axisClass !== "RESTATEMENT") fail("ivDelta class drift");
  const bridgeAxis = artifact.axes.find((row) => row.axis === "bridgeAdmissionLink");
  if (bridgeAxis.axisClass !== "RESTATEMENT" || !bridgeAxis.subFinding.includes("OD-60-2")) fail("bridge axis adjudication drift");
  const symAxis = artifact.axes.find((row) => row.axis === "complementSymmetry");
  if (symAxis.axisClass !== "NON_SEPARATING" || !symAxis.subFinding.includes("zPartner is null")) fail("symmetry axis drift");
  for (const axis of ["governorElement", "entry13Interaction"]) {
    const entry = artifact.axes.find((row) => row.axis === axis);
    if (!entry.subFinding.includes("OD-60-3") || !entry.evidence.includes("no per-domain element semantics")) {
      fail(`${axis} fence drift`);
    }
  }

  // ---- dTier per-family and composites ------------------------------------
  if (artifact.dTier.perFamily.length !== 7) fail("per-family census drift");
  for (const family of D_ANCHOR_FAMILIES) {
    const entry = artifact.dTier.perFamily.find((row) => row.family === family);
    if (!entry) fail(`per-family entry missing: ${family}`);
    const valueOf = (key) => sharedWithFamily(key, family);
    const bestGe = bestNumeric(uKeys, observedSet, valueOf, "ge");
    const bestLe = bestNumeric(uKeys, observedSet, valueOf, "le");
    const best = bestLe.hit > bestGe.hit ? { ...bestLe, direction: "le" } : { ...bestGe, direction: "ge" };
    const nearMiss = best.hit >= 26;
    if (canonicalText(entry.values) !== canonicalText(histogram(uKeys, observedSet, valueOf)) ||
        canonicalText(entry.bestGe) !== canonicalText({ threshold: bestGe.threshold, confusion: bestGe.confusion, hit: bestGe.hit }) ||
        canonicalText(entry.bestLe) !== canonicalText({ threshold: bestLe.threshold, confusion: bestLe.confusion, hit: bestLe.hit }) ||
        canonicalText(entry.best) !== canonicalText({ direction: best.direction, threshold: best.threshold, confusion: best.confusion, hit: best.hit }) ||
        entry.nearMiss !== nearMiss) fail(`per-family drift: ${family}`);
    if (nearMiss !== entry.verdict.startsWith("NEAR_MISS")) fail(`per-family verdict drift: ${family}`);
  }
  const nonZConfusion = confusion(uKeys, observedSet, (key) => nonZSumOf(key) <= 13);
  const nonZValues = histogram(uKeys, observedSet, nonZSumOf);
  const maxObserved = Math.max(...uKeys.filter((key) => observedSet.has(key)).map(nonZSumOf));
  const minUnobserved = Math.min(...uKeys.filter((key) => !observedSet.has(key)).map(nonZSumOf));
  if (canonicalText(artifact.dTier.nonZComposite.confusion) !== canonicalText(nonZConfusion) ||
      canonicalText(artifact.dTier.nonZComposite.values) !== canonicalText(nonZValues) ||
      artifact.dTier.nonZComposite.boundaryGap.maxObserved !== maxObserved ||
      artifact.dTier.nonZComposite.boundaryGap.minUnobserved !== minUnobserved ||
      nonZConfusion.tp !== 14 || nonZConfusion.fp !== 0 || maxObserved !== 13 || minUnobserved !== 14) {
    fail("non-Z composite drift");
  }
  const zConfusion = confusion(uKeys, observedSet, (key) => zSumOf(key) >= 14);
  if (canonicalText(artifact.dTier.zComposite.confusion) !== canonicalText(zConfusion) ||
      zConfusion.tp !== 12 || zConfusion.fp !== 0) fail("Z composite drift");
  const nearMissFamilies = artifact.dTier.perFamily.filter((row) => row.nearMiss).map((row) => row.family);
  if (canonicalText(nearMissFamilies) !== canonicalText(["7-22", "7-8", "7-Z17", "7-Z37"])) fail("near-miss family inventory drift");

  // ---- office lemma --------------------------------------------------------
  const officeMatrices = {
    cyclePosition: confusion(uKeys, observedSet, (key) => rowOf(key).cycle.edgeType === "T1"),
    governorElement: confusion(uKeys, observedSet, (key) => rowOf(key).element !== null),
    entry13Interaction: confusion(uKeys, observedSet, (key) => rowOf(key).entry13Fate !== null),
  };
  for (const [axis, matrix] of Object.entries(officeMatrices)) {
    if (matrix.tp !== matrix.fp || matrix.fn !== matrix.tn || matrix.tp + matrix.tn !== 14) fail(`office lemma drift: ${axis}`);
    if (canonicalText(artifact.officeLemma.matrices[axis]) !== canonicalText(matrix)) fail(`office matrix drift: ${axis}`);
  }
  if (!artifact.officeLemma.statement.includes("office-transverse")) fail("office lemma statement drift");

  // ---- bridge adjudication -------------------------------------------------
  const adjudication = artifact.bridgeAdjudication;
  if (adjudication.classification !== "RESTATEMENT" || adjudication.guard !== "OD-60-2 (restatement-vs-explanation)" ||
      adjudication.observedComplementAdmitted !== true || adjudication.unobservedComplementAdmitted !== false) {
    fail("bridge adjudication drift");
  }
  if (adjudication.complementClasses.observed !== "5-27" || adjudication.complementClasses.unobserved !== "5-31") {
    fail("bridge complement class drift");
  }
  if (adjudication.canonAsymmetry.observedComplement.rootedPairs !== 1 ||
      adjudication.canonAsymmetry.unobservedComplement.rootedPairs !== 0 ||
      adjudication.canonAsymmetry.observedComplement.representativeMask !== "695" ||
      adjudication.canonAsymmetry.unobservedComplement.representativeMask !== "731") {
    fail("canon asymmetry drift");
  }
  const probeKeys = unique([observedComplement.representativeHeptatonicMask, unobservedComplement.representativeHeptatonicMask]
    .map((mask) => uKeys.find((key) => key.split(":")[1] === mask)).filter(Boolean));
  const probeConfusion = confusion(uKeys, observedSet, (key) => probeKeys.includes(key));
  if (canonicalText(adjudication.representativeProbe.keys) !== canonicalText(probeKeys) ||
      canonicalText(adjudication.representativeProbe.confusion) !== canonicalText(probeConfusion) ||
      adjudication.representativeProbe.hit !== probeConfusion.tp + probeConfusion.tn ||
      probeConfusion.tp + probeConfusion.tn !== 14) fail("representative probe drift");

  // ---- synthesis -----------------------------------------------------------
  const synthesis = artifact.synthesis;
  if (synthesis.verdict !== "DERIVED" || !synthesis.verdictStatement.includes("independent structural basis")) {
    fail("synthesis verdict drift");
  }
  if (synthesis.basis.axis !== "dTierContainmentComposite" || synthesis.basis.rule !== "nonZSum <= 13" ||
      canonicalText(synthesis.basis.confusion) !== canonicalText(nonZConfusion) ||
      canonicalText(synthesis.basis.boundaryGap) !== canonicalText(artifact.dTier.nonZComposite.boundaryGap) ||
      !synthesis.basis.inversionStability.includes("28/28")) fail("synthesis basis drift");
  const cleanClasses = synthesis.cleanSplits.map((row) => `${row.axis}:${row.class}`);
  if (canonicalText(cleanClasses) !== canonicalText([
    "ivDelta:RESTATEMENT", "dTierContainmentComposite:INDEPENDENT_STRUCTURAL_SIGNATURE", "bridgeAdmissionLink:RESTATEMENT",
  ])) fail("clean-split inventory drift");
  if (synthesis.nearMisses.length !== 4 || synthesis.primitiveAlternative.fired !== false) fail("synthesis branch drift");
  if (!synthesis.governsSemanticLayerEntry.statement.includes("boundary-geography-selective") ||
      !synthesis.scopingMemoConnection.includes("BL-059") ||
      synthesis.limits.length !== 3) fail("synthesis connection drift");
  if (canonicalText(artifact.axisSummary.cleanSplits) !== canonicalText(["ivDelta", "dTierContainmentComposite", "bridgeAdmissionLink"]) ||
      canonicalText(artifact.axisSummary.independentSignatures) !== canonicalText(["dTierContainmentComposite"]) ||
      canonicalText(artifact.axisSummary.restatements) !== canonicalText(["ivDelta", "bridgeAdmissionLink"]) ||
      artifact.axisSummary.tested !== 7) fail("axis summary drift");

  // ---- fences --------------------------------------------------------------
  if (!artifact.fences.d7Control.includes("OD-60-D7") ||
      !artifact.fences.higherTheorem.includes("remains open") ||
      artifact.fences.g1Intra330 !== "untouched" ||
      !artifact.fences.direction.includes("unassigned") ||
      !artifact.fences.membrane.includes("never design input") ||
      !artifact.fences.entry13.includes("OD-60-3")) fail("fence drift");
  if (artifact.notAccomplished.length !== 6) fail("notAccomplished inventory drift");

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    fingerprint: huntFingerprint,
    baseFingerprint: bl055Fingerprint,
    cleanSplits: artifact.axisSummary.cleanSplits,
    independentSignatures: artifact.axisSummary.independentSignatures,
    nonZBoundaryGap: artifact.dTier.nonZComposite.boundaryGap,
    verdict: synthesis.verdict,
  }, null, 2));
}

validate();
