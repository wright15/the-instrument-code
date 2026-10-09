#!/usr/bin/env node
/**
 * Validate the generated BL-055 D4 selection-mechanism review against its sources.
 *
 * Independent of the builder: re-reads the frozen receipt, the frozen
 * generation projection, the canonical heptatonic ledger, the network data,
 * the bipartite containment mesh, the operator-application audit, the Phase C
 * probe and the Phase A probe; re-extracts U/O/R/E; re-derives the 28-key
 * table, the nine axis confusion matrices, the T-B definitional proof, the T-A
 * under-coverage geometry, the closed A0 transposition cycle, the OD-3
 * per-phase diagnostic and the synthesis counters; and re-checks the
 * fingerprint. Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/d4-selection-review.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.d4-selection-review.v1";
const REVIEW_ID = "BL055_D4_SELECTION_REVIEW_v1";
const FROZEN_RECEIPT_PATH = "qa/d4-production-receipt.json";
const FROZEN_GENERATION_PATH = "qa/d4-production-generation.json";
const HEPTATONIC_LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const HEPTATONIC_NETWORK_PATH = "canonical/universal-network-data.json";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const APPLICATIONS_PATH = "seven-governors-mutation-algebra-audit/audit/operator-applications.csv";
const PHASE_C_PROBE_PATH = "orrery/src/generated/phase-c-probe.v1.json";
const PHASE_A_PROBE_PATH = "orrery/src/generated/phase-a-probe.v1.json";
const PATCH = [11, 0, 1];

function fail(message) {
  throw new Error(`INVALID_D4_SELECTION_REVIEW: ${message}`);
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
    if (!Number.isInteger(value)) fail("non-integer number in review payload");
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
const maskOf = (pitches) => pitches.reduce((mask, pitch) => mask | (1 << pitch), 0);
const rotate = (mask) => ((mask << 1) & 4095) | (mask >> 11);
const pitchList = (text) => text.replace(/[{}]/g, "").split(",").map(Number).sort((a, b) => a - b);
const setKey = (pitches, phase) => [...pitches.map((pitch) => (pitch + phase) % 12)].sort((a, b) => a - b).join(",");

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

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const receipt = readJson(FROZEN_RECEIPT_PATH);
  const frozenGeneration = readJson(FROZEN_GENERATION_PATH);
  const ledger = parseCsv(read(HEPTATONIC_LEDGER_PATH));
  const network = readJson(HEPTATONIC_NETWORK_PATH);
  const bipartite = readJson(BIPARTITE_PATH);
  const applications = parseCsv(read(APPLICATIONS_PATH));
  const phaseC = readJson(PHASE_C_PROBE_PATH);
  const phaseA = readJson(PHASE_A_PROBE_PATH);

  // ---- header, status, fingerprint ----------------------------------------
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.reviewId !== REVIEW_ID ||
      artifact.status !== "planning_evidence") fail("header drift");
  const { reviewFingerprint, ...core } = artifact;
  if (typeof reviewFingerprint !== "string" || !/^[0-9a-f]{64}$/.test(reviewFingerprint) ||
      sha256(canonicalText(core)) !== reviewFingerprint) fail("fingerprint drift");
  for (const binding of artifact.sourceBindings) {
    if (sha256(fs.readFileSync(path.join(root, binding.artifact))) !== binding.sha256) {
      fail(`source binding drift: ${binding.artifact}`);
    }
  }
  if (ledger.length !== 462) fail("ledger census drift");
  if (applications.length !== 3402) fail("application census drift");
  if (receipt.category !== "not_derived") fail("frozen category drift");
  if (phaseC.probeFingerprint !== "5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49") {
    fail("Phase C fingerprint drift");
  }
  if (phaseA.p1PhaseCoordinate.covering.multiplicitySeven !== 7 ||
      phaseA.p1PhaseCoordinate.counts.phases !== 12) fail("Phase A covering drift");

  // ---- re-extraction from canonical sources -------------------------------
  const ledgerById = new Map(ledger.map((row) => [row.id, row]));
  const identity = (id) => {
    const row = ledgerById.get(id);
    if (!row) fail(`ledger identity missing for ${id}`);
    return row;
  };
  const R = [];
  const E = [];
  for (const edge of network.structuralEdges) {
    const parent = ledgerById.get(String(edge.source));
    const child = ledgerById.get(String(edge.target));
    if (!parent || !child) continue;
    if (edge.type === "GOVERNS" && parent.tier === "A1" && parent.role === "anchor" &&
        child.tier === "A1" && child.role === "satellite") {
      R.push({ id: edge.id, source: String(edge.source), target: String(edge.target), parentOffice: String(parent.officeIndex) });
    }
    if (edge.type === "CONSTRUCTS" && parent.tier === "A0" && parent.role === "anchor" &&
        child.tier === "A1" && child.role === "anchor") {
      E.push({ id: edge.id, source: String(edge.source), target: String(edge.target) });
    }
  }
  if (R.length !== 28 || E.length !== 14) fail("projection re-extraction census drift");
  const comparison = receipt.comparison;
  const uKeys = unique(comparison.uKeys);
  const observedKeys = unique(comparison.rows.map((row) => keyOf(String(row.parentOffice), String(row.s))));
  const observedSet = new Set(observedKeys);
  if (uKeys.length !== 28 || observedKeys.length !== 14) fail("domain census drift");
  if (canonicalText(uKeys) !== canonicalText(artifact.domain.uKeys) ||
      canonicalText(observedKeys) !== canonicalText(artifact.domain.observedKeys)) fail("domain artifact drift");
  if (canonicalText(unique(phaseC.e2Retry.domain.uKeys)) !== canonicalText(uKeys) ||
      canonicalText(unique(phaseC.e2Retry.domain.observedKeys)) !== canonicalText(observedKeys)) {
    fail("Phase C domain disagreement");
  }
  const cells = comparison.fourCellCounts;
  const artifactCells = artifact.domain.fourCellCounts;
  if (cells.aOnly !== "0" || cells.bOnly !== "10" || cells.both !== "4" || cells.neither !== "0" ||
      canonicalText(artifactCells) !== canonicalText({ aOnly: cells.aOnly, bOnly: cells.bOnly, both: cells.both, neither: cells.neither })) {
    fail("four-cell drift");
  }
  const perOffice = unique(uKeys.map((key) => key.split(":")[0]));
  if (perOffice.length !== 7 || perOffice.some((office) =>
    uKeys.filter((key) => key.startsWith(`${office}:`)).length !== 4 ||
    observedKeys.filter((key) => key.startsWith(`${office}:`)).length !== 2)) fail("per-office structure drift");

  // ---- table28 re-derivation ----------------------------------------------
  const rByKey = new Map(R.map((row) => [keyOf(row.parentOffice, row.target), row]));
  const eParentsOf = new Map();
  for (const edge of E) eParentsOf.set(edge.target, [...(eParentsOf.get(edge.target) ?? []), edge.source]);
  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  const pentatonicById = bipartite.pentatonicSubnodes;
  const routeAKeys = new Set(comparison.routes.A.generatedKeys);
  const routeBKeys = new Set(comparison.routes.B.generatedKeys);
  const membershipByKey = new Map(comparison.rows.map((row) => [keyOf(String(row.parentOffice), String(row.s)), row.membership]));
  const seamTouch = new Map();
  for (const application of applications) {
    if (application.operator_id !== "R1" && application.operator_id !== "L1") continue;
    for (const endpoint of [application.source_id, application.target_id]) {
      seamTouch.set(endpoint, (seamTouch.get(endpoint) ?? 0) + 1);
    }
  }
  const nodeOf = (satellite) => {
    const node = heptNodeByMask.get(satellite);
    if (!node) fail(`bipartite node missing for ${satellite}`);
    return node;
  };
  const subCount = (satellite, field) => nodeOf(satellite).subnodes.filter((id) => pentatonicById[id]?.[field] === true).length;
  const expectedTable = uKeys.map((key) => {
    const [office, satellite] = key.split(":");
    const row = identity(satellite);
    const r = rByKey.get(key);
    if (!r) fail(`R row missing for ${key}`);
    const observed = observedSet.has(key);
    return {
      key, office, satellite, parentH: r.source, observed,
      routeA: routeAKeys.has(key), routeB: routeBKeys.has(key),
      cell: observed ? membershipByKey.get(key) : "not-a-contact",
      forte: row.forte, intervalVector: row.intervalVector, satelliteOffice: row.officeIndex,
      admittedSubnodes: nodeOf(satellite).subnodes.length,
      bridgeSubnodes: subCount(satellite, "isBridge"),
      cornerstoneSubnodes: subCount(satellite, "isCornerstone"),
      seamIncidence: seamTouch.get(satellite) ?? 0,
      eParents: unique(eParentsOf.get(r.source) ?? []),
    };
  });
  const artifactTable = artifact.table28;
  if (artifactTable.length !== 28) fail("table28 census drift");
  for (let index = 0; index < expectedTable.length; index += 1) {
    const expected = expectedTable[index];
    const actual = artifactTable[index];
    for (const field of ["key", "office", "satellite", "parentH", "observed", "routeA", "routeB", "cell", "forte",
      "intervalVector", "satelliteOffice", "admittedSubnodes", "bridgeSubnodes", "cornerstoneSubnodes", "seamIncidence", "eParents"]) {
      if (canonicalText(actual[field]) !== canonicalText(expected[field])) fail(`table28 drift at ${expected.key}: ${field}`);
    }
  }
  if (expectedTable.some((row) => row.admittedSubnodes !== 15)) fail("containment uniformity drift");

  // ---- axis hunt re-derivation --------------------------------------------
  const valueOfMap = {
    setClassFamily: (key) => identity(key.split(":")[1]).forte,
    containmentDegree: (key) => nodeOf(key.split(":")[1]).subnodes.length,
    bridgeSubnodes: (key) => subCount(key.split(":")[1], "isBridge"),
    cornerstoneContainment: (key) => subCount(key.split(":")[1], "isCornerstone"),
    seamIncidence: (key) => seamTouch.get(key.split(":")[1]) ?? 0,
  };
  const predicates = {
    setClassFamily: (key) => identity(key.split(":")[1]).forte === "7-27",
    containmentDegree: () => true,
    bridgeSubnodes: (key) => subCount(key.split(":")[1], "isBridge") >= 4,
    cornerstoneContainment: (key) => subCount(key.split(":")[1], "isCornerstone") >= 1,
    kernelWindowMembership: () => false,
    officeElementPairing: () => true,
    phaseContextMultiplicity: () => true,
    seamIncidence: (key) => (seamTouch.get(key.split(":")[1]) ?? 0) >= 4,
  };
  for (const [axis, predicate] of Object.entries(predicates)) {
    const entry = artifact.axes.find((row) => row.axis === axis);
    if (!entry) fail(`axis missing: ${axis}`);
    const matrix = confusion(uKeys, observedSet, predicate);
    const hit = matrix.tp + matrix.tn;
    const split = matrix.tp === 14 && matrix.tn === 14 && matrix.fp === 0 && matrix.fn === 0;
    const nearMiss = !split && hit >= 26;
    if (canonicalText(matrix) !== canonicalText(entry.confusion) || hit !== entry.hit ||
        split !== entry.split || nearMiss !== entry.nearMiss) fail(`axis confusion drift: ${axis}`);
    if (valueOfMap[axis]) {
      const values = { observed: {}, unobserved: {} };
      for (const key of uKeys) {
        const value = String(valueOfMap[axis](key));
        const group = observedSet.has(key) ? "observed" : "unobserved";
        values[group][value] = (values[group][value] ?? 0) + 1;
      }
      if (canonicalText(values) !== canonicalText(entry.values)) fail(`axis histogram drift: ${axis}`);
    }
  }
  const forteSplit = artifact.axes.find((row) => row.axis === "setClassFamily");
  if (forteSplit.verdict !== "CLEAN_SPLIT_14_14" || !forteSplit.split) fail("forte split drift");
  const allValues = ledger.filter((row) => row.forte === "7-27" || row.forte === "7-31");
  if (allValues.length !== 28 || allValues.some((row) => row.tier !== "A1" || row.role !== "satellite")) {
    fail("global set-class partition drift");
  }
  for (const row of allValues.filter((entry) => entry.forte === "7-27")) {
    const key = uKeys.find((candidate) => candidate.split(":")[1] === row.id);
    if (!key || !observedSet.has(key)) fail("7-27 observational partition drift");
  }
  const nearMissAxes = artifact.axes.filter((row) => row.nearMiss).map((row) => row.axis);
  if (canonicalText(nearMissAxes) !== canonicalText(["cornerstoneContainment"])) fail("near-miss inventory drift");
  if (canonicalText(artifact.axisSummary.cleanSplits) !== canonicalText(["setClassFamily"]) ||
      artifact.axisSummary.tested !== 9) fail("axis summary drift");

  // ---- T-B definitional proof ---------------------------------------------
  const a1Anchors = unique([...eParentsOf.keys()]);
  if (a1Anchors.length !== 7) fail("A1 anchor census drift");
  let tbWitnesses = 0;
  const tbGenerated = [];
  for (const h of a1Anchors) {
    const parents = unique(eParentsOf.get(h));
    if (parents.length !== 2) fail(`T-B parent distinctness drift at ${h}`);
    const satellites = R.filter((row) => row.source === h).map((row) => row.target);
    if (satellites.length !== 4) fail(`T-B satellite census drift at ${h}`);
    tbWitnesses += parents.length * (parents.length - 1) * satellites.length;
    tbGenerated.push(...R.filter((row) => row.source === h).map((row) => keyOf(row.parentOffice, row.target)));
  }
  if (tbWitnesses !== 56 || canonicalText(unique(tbGenerated)) !== canonicalText(uKeys)) fail("T-B proof drift");
  if (artifact.tbProof.totalWitnesses !== 56 || !artifact.tbProof.definitional ||
      canonicalText(artifact.tbProof.generatedKeys) !== canonicalText(uKeys)) fail("T-B artifact drift");

  // ---- T-A geometry re-derivation -----------------------------------------
  const a0Keys = unique(ledger.filter((row) => row.tier === "A0" && row.role === "anchor").map((row) => row.id));
  if (a0Keys.length !== 7) fail("A0 ledger census drift");
  const a0Anchors = a0Keys.map((id) => ({ id, office: String(identity(id).officeIndex) })).sort((a, b) => cmp(a.id, b.id));
  const a0ById = new Map(a0Anchors.map((anchor) => [anchor.id, anchor]));
  const frozenPairs = [];
  for (const anchor of a0Anchors) {
    const image = String(rotate(Number(anchor.id)));
    const target = a0ById.get(image);
    if (!target) continue;
    const delta = ((Number(anchor.office) - Number(target.office)) + 7) % 7;
    if (delta !== 2) continue;
    frozenPairs.push({ a: anchor.id, b: image, k: String((Number(anchor.office) + 6) % 7) });
  }
  if (frozenPairs.length !== 2) fail("T-A pair census drift");
  const taGenerated = unique(frozenPairs.flatMap((pair) => R.filter((row) => row.parentOffice === pair.k)
    .map((row) => keyOf(row.parentOffice, row.target))));
  if (taGenerated.length !== 8 || canonicalText(taGenerated) !== canonicalText(unique(comparison.routes.A.generatedKeys))) {
    fail("T-A generated drift");
  }
  if (canonicalText(artifact.taGeometry.generatedKeys) !== canonicalText(taGenerated) ||
      artifact.taGeometry.frozenPairs.length !== 2) fail("T-A artifact drift");

  // ---- seam edges, cycle, OD-3 --------------------------------------------
  const seamPairs = phaseC.e2Retry.routeASeam.seamPairs;
  if (seamPairs.length !== 9) fail("seam pair census drift");
  const seamEdges = seamPairs.map((pair) => {
    const aPitches = pitchList(identity(pair.a).pitchSet);
    const cPitches = pitchList(identity(pair.c).pitchSet);
    if (setKey(aPitches, Number(pair.aPhase)) !== pair.geometry ||
        setKey(cPitches, Number(pair.cPhase)) !== pair.geometry) fail(`seam geometry drift at office ${pair.office}`);
    return { office: String(pair.office), a: String(pair.a), c: String(pair.c),
      aPhase: String(pair.aPhase), cPhase: String(pair.cPhase),
      interval: ((Number(pair.aPhase) - Number(pair.cPhase)) + 12) % 12 };
  });
  const cycleEdges = unique(seamEdges.map((edge) => edge.office)).map((office) => {
    const row = seamEdges.find((edge) => edge.office === office);
    return { office, a: row.a, c: row.c, aPhase: row.aPhase, cPhase: row.cPhase, interval: row.interval };
  });
  const fromMap = new Map(cycleEdges.map((edge) => [edge.a, edge]));
  let current = cycleEdges[0].a;
  let intervalSum = 0;
  for (let step = 0; step < 7; step += 1) {
    const edge = fromMap.get(current);
    if (!edge) fail(`cycle walk dead-ends at ${current}`);
    intervalSum += edge.interval;
    current = edge.c;
  }
  if (current !== cycleEdges[0].a || intervalSum !== 12) fail("cycle closure drift");
  const t1 = cycleEdges.filter((edge) => edge.interval === 1).map((edge) => edge.office).sort(cmp);
  if (canonicalText(t1) !== canonicalText(["0", "6"])) fail("T1 edge drift");
  if (canonicalText(artifact.taGeometry.cycle.t1Edges) !== canonicalText(t1) ||
      artifact.taGeometry.cycle.intervalSum !== 12) fail("cycle artifact drift");
  const strictOffices = unique(phaseC.e2Retry.routeASeam.strictDegreeControl.qualifyingOffices);
  if (canonicalText(strictOffices) !== canonicalText(t1)) fail("strict control drift");
  const perPhase = PATCH.map((phase) => {
    const p = String(phase);
    return {
      phase: p,
      touchingOffices: unique(seamEdges.filter((edge) => edge.aPhase === p || edge.cPhase === p).map((edge) => edge.office)),
      aSideOffices: unique(seamEdges.filter((edge) => edge.aPhase === p).map((edge) => edge.office)),
      cSideOffices: unique(seamEdges.filter((edge) => edge.cPhase === p).map((edge) => edge.office)),
      touchingKeys: unique(seamEdges.filter((edge) => edge.aPhase === p || edge.cPhase === p).map((edge) => edge.office)).length * 4,
    };
  });
  if (canonicalText(perPhase) !== canonicalText(artifact.od3Diagnostic.perPhase)) fail("OD-3 diagnostic drift");

  // ---- synthesis re-derivation --------------------------------------------
  const predicateKeys = uKeys.filter((key) => identity(key.split(":")[1]).forte === "7-27");
  const synthesis = artifact.synthesis;
  if (synthesis.predicate.definition !== "P(s) = [forte(s) = 7-27]") fail("predicate definition drift");
  if (synthesis.predicate.confusion.tp !== 14 || synthesis.predicate.confusion.fp !== 0 ||
      synthesis.predicate.confusion.fn !== 0 || synthesis.predicate.confusion.tn !== 14 ||
      predicateKeys.length !== 14) fail("predicate confusion drift");
  const predicateOn = (keys) => keys.filter((key) => identity(key.split(":")[1]).forte === "7-27");
  if (synthesis.underKeyings.frozenTA.generated !== 8 || synthesis.underKeyings.frozenTA.predicateIntersection !== 4 ||
      synthesis.underKeyings.seamTA.predicateIntersection !== 14 || !synthesis.underKeyings.seamTA.equalsObserved ||
      !synthesis.underKeyings.tb.definitional || synthesis.underKeyings.tc.generated !== 7 ||
      synthesis.underKeyings.tc.observed !== 2 || synthesis.underKeyings.tc.midpointExactStrict !== false) {
    fail("synthesis counters drift");
  }
  if (predicateOn(taGenerated).length !== 4) fail("frozen predicate intersection drift");
  if (predicateOn(phaseC.e2Retry.routeASeam.generatedKeys).length !== 14) fail("seam predicate intersection drift");
  if (synthesis.blockers.length !== 3) fail("blocker inventory drift");
  if (!synthesis.designItem.hardConstraint.includes("cycle-edge")) fail("design item constraint drift");
  if (synthesis.noPredicateBranch.fired !== false) fail("no-predicate branch drift");
  if (!synthesis.observationROE.includes("observation only, not evidence")) fail("ROE observation label drift");

  // ---- step0 and fences ----------------------------------------------------
  if (artifact.step0.s0_1.finding !== "PATCH_ONLY" ||
      canonicalText(artifact.step0.s0_1.evidence.calibrationPerPhase) !== canonicalText("11, 0, 1")) {
    fail("step0 scope drift");
  }
  const keying = phaseC.e2Retry.keying;
  if (canonicalText(keying.patchPhases) !== canonicalText(["11", "0", "1"])) fail("patch phase drift");
  if (artifact.fences.recordAmendment.includes("claim event") === false ||
      artifact.fences.g1Intra330 !== "untouched" ||
      artifact.fences.direction.includes("unassigned") === false ||
      artifact.fences.membrane.includes("never design input") === false) fail("fence drift");
  if (artifact.notAccomplished.length !== 6) fail("notAccomplished inventory drift");

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    fingerprint: reviewFingerprint,
    cleanAxes: artifact.axisSummary.cleanSplits,
    nearMissAxes: artifact.axisSummary.nearMisses,
    tbDefinitional: artifact.tbProof.definitional,
    taGenerated: artifact.taGeometry.generatedKeys.length,
    cycleIntervalSum: artifact.taGeometry.cycle.intervalSum,
    blockers: artifact.synthesis.blockers.length,
  }, null, 2));
}

validate();
