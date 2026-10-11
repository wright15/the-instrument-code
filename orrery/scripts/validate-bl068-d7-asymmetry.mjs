#!/usr/bin/env node
/**
 * Validate the generated BL-068 D7-asymmetry investigation against its sources.
 *
 * Independent of the generator: re-reads the network, the 462-record ledger,
 * the containment mesh, the frozen D4 domain, the Gate 3 receipt and the
 * Phase C probe; re-derives the D7 census, the recorded layer, the
 * availability domain (Hamming-2 reach of the 7-2 class), the D4 comparison
 * side, the four axis tests, the invariant pairs and the control census; and
 * re-checks the investigation fingerprint. Also statically verifies that the
 * generator reads no D4 grant projection, no analogue-R field and no route
 * review (the availability domain is ledger masks + anchor masks only), and
 * runs mutation probes (census drift, contact-class swap, orbit rewire,
 * containment drop, availability drift, misclassification, delta drift, axis
 * confusion drift, inversion-sum drift, status-sharing flip, verdict drift,
 * smuggled reads). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
const GENERATOR_PATH = "scripts/build-bl068-d7-asymmetry.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl068-d7-asymmetry.v1";
const INVESTIGATION_ID = "BL068_D7_ASYMMETRY_V1";
const NETWORK_PATH = "canonical/universal-network-data.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const D4_HUNT_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
const ZRESIDUAL_PATH = "orrery/src/generated/d4-zresidual-hunt.v1.json";
const PHASE_C_PATH = "orrery/src/generated/phase-c-probe.v1.json";
const RECEIPT_PATH = "qa/d4-production-receipt.json";
const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

const D4_HUNT_FINGERPRINT = "8a1295ca9639fab7e16b980576954a1f12824d839e6743abebe176e3df23cac9";
const ZRESIDUAL_FINGERPRINT = "e1b3f655b7d79c67e2002ef2bf6da5db298bcd846306db6878896b3f24c4cd8a";
const PHASE_C_FINGERPRINT = "5085e27404de2e591b146d38f289da660c6bc49041a54f073acafcbfe10f2f49";

const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];

function fail(message) {
  throw new Error(`INVALID_BL068_D7_ASYMMETRY: ${message}`);
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

function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
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

function parseCsv(text) {
  const lines = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const ch = text[index];
    if (inQuotes) {
      current += ch;
      if (ch === '"') {
        if (text[index + 1] === '"') { current += '"'; index += 1; }
        else inQuotes = false;
      }
    } else if (ch === '"') { inQuotes = true; current += ch; }
    else if (ch === "\n") { lines.push(current); current = ""; }
    else if (ch === "\r") { /* skip */ }
    else current += ch;
  }
  if (current.length > 0) lines.push(current);
  const rows = [];
  const header = lines[0].split(",");
  for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
    if (lines[lineIndex] === "") continue;
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < lines[lineIndex].length; index += 1) {
      const ch = lines[lineIndex][index];
      if (quoted) {
        if (ch === '"') {
          if (lines[lineIndex][index + 1] === '"') { cell += '"'; index += 1; }
          else quoted = false;
        } else cell += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { cells.push(cell); cell = ""; }
      else cell += ch;
    }
    cells.push(cell);
    const row = {};
    header.forEach((name, columnIndex) => { row[name] = cells[columnIndex] ?? ""; });
    rows.push(row);
  }
  return rows;
}

function parsePitchSet(text) {
  return text.replace(/[{}]/g, "").split(",").filter((value) => value !== "").map(Number);
}

const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const sortedUnique = (values) => [...new Set(values)].sort(cmp);

function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += x & 1; x >>= 1; }
  return count;
}

function invertMask12(mask) {
  let result = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) result |= 1 << ((12 - pitch) % 12);
  }
  return result;
}

function maskOfPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
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

function histogram(keys, observedSet, valueOf) {
  const result = { observed: {}, unobserved: {} };
  for (const key of keys) {
    const value = String(valueOf(key));
    const group = observedSet.has(key) ? "observed" : "unobserved";
    result[group][value] = (result[group][value] ?? 0) + 1;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { network, ledgerRows, bipartite, d4Hunt, zresidual, phaseC, receipt, gate3 } = sources;

  const infoById = new Map(ledgerRows.map((row) => [String(row.id), {
    id: String(row.id),
    mask: maskOfPitches(parsePitchSet(row.pitchSet)),
    forte: row.forte,
    tier: row.tier,
    role: row.role,
    office: row.office,
    officeIndex: String(row.officeIndex),
    orientation: row.orientation,
    intervalVector: row.intervalVector,
  }]));
  const ledgerInfo = (id) => {
    const info = infoById.get(String(id));
    if (!info) fail(`ledger record ${id} missing`);
    return info;
  };

  const anchorRows = network.d7AnchorRows.map((row) => ({
    anchor: String(row.scaleId),
    office: row.office,
    officeIndex: String(row.officeIndex),
    forte: row.forte,
  }));
  const contactRows = network.d7SeatContactRows.map((row) => ({
    id: row.id,
    satellite: String(row.source),
    anchor: String(row.target),
    phaseDelta: String(row.phaseDelta),
  })).sort((left, right) => cmp(left.id, right.id));
  const modalEdges = network.d7ModalRows.map((row) => ({
    id: row.id,
    source: String(row.source),
    target: String(row.target),
  }));

  const successor = new Map(modalEdges.map((edge) => [edge.source, edge.target]));
  const orbit = [];
  let current = "127";
  for (let step = 0; step < 7; step += 1) {
    const next = successor.get(current);
    if (!next) fail(`orbit dead-end at ${current}`);
    orbit.push({ a: current, b: next });
    current = next;
  }
  const orbitStrings = orbit.map((edge) => `${edge.a}->${edge.b}`);

  const contactStates = sortedUnique(contactRows.map((contact) => contact.satellite));
  const contactSet = new Set(contactStates);
  const class72 = ledgerRows.filter((row) => row.forte === "7-2");
  const class72Set = new Set(class72.map((row) => String(row.id)));

  const contactsByAnchor = new Map(anchorRows.map((anchor) => [anchor.anchor, []]));
  for (const contact of contactRows) contactsByAnchor.get(contact.anchor).push(contact.satellite);
  for (const [, list] of contactsByAnchor) list.sort(cmp);

  const availabilityPerAnchor = anchorRows.map((anchor) => {
    const anchorMask = ledgerInfo(anchor.anchor).mask;
    const officeIndex = Number(anchor.officeIndex);
    const instances = ledgerRows
      .filter((row) => class72Set.has(String(row.id)) && hamming12(anchorMask, ledgerInfo(row.id).mask) === 2)
      .map((row) => ledgerInfo(row.id))
      .sort((left, right) => cmp(Number(left.id), Number(right.id)))
      .map((info) => ({
        satellite: info.id,
        satelliteOffice: info.office,
        orientation: info.orientation.endsWith(" A") ? "A" : "B",
        officeDelta: String(((Number(info.officeIndex) - officeIndex) + 7) % 7),
        status: info.office === anchor.office ? "recorded" : "unrecorded",
        key: `${anchor.anchor}:${info.id}`,
      }));
    return {
      anchor: anchor.anchor,
      office: anchor.office,
      instances,
      recordedCount: instances.filter((instance) => instance.status === "recorded").length,
      unrecordedCount: instances.filter((instance) => instance.status === "unrecorded").length,
      totalInstances: instances.length,
    };
  });
  const availabilityInstances = availabilityPerAnchor.flatMap((entry) => entry.instances);
  const availabilityKeys = sortedUnique(availabilityInstances.map((instance) => instance.key));
  const observedKeys = new Set(
    availabilityInstances.filter((instance) => instance.status === "recorded").map((instance) => instance.key),
  );
  const instanceByKey = new Map(availabilityInstances.map((instance) => [instance.key, instance]));

  const heptNodeByMask = new Map(Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]));
  const pentatonicById = bipartite.pentatonicSubnodes;
  const signOfState = (state) => {
    const node = heptNodeByMask.get(String(ledgerInfo(state).mask));
    if (!node) fail(`bipartite node missing for ${state}`);
    const shared = (family) => node.subnodes
      .filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
    const nonZSum = NON_Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
    const zSum = Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
    return nonZSum - zSum;
  };

  const axis1Confusion = confusion(availabilityKeys, observedKeys, (key) => ledgerInfo(instanceByKey.get(key).satellite).forte === "7-2");
  const axis2Confusion = confusion(availabilityKeys, observedKeys, (key) => instanceByKey.get(key).officeDelta === "0");
  const axis3Confusion = confusion(availabilityKeys, observedKeys, (key) => signOfState(instanceByKey.get(key).satellite) < 0);
  const zCensus = contactStates.map((state) => ({
    state,
    office: ledgerInfo(state).office,
    nonZSum: Z_D_FAMILIES.reduce((sum, family) => sum + 0, 0) + (() => {
      const node = heptNodeByMask.get(String(ledgerInfo(state).mask));
      const shared = (f) => node.subnodes.filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(f)).length;
      return NON_Z_D_FAMILIES.reduce((sum, f) => sum + shared(f), 0);
    })(),
    zSum: (() => {
      const node = heptNodeByMask.get(String(ledgerInfo(state).mask));
      const shared = (f) => node.subnodes.filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(f)).length;
      return Z_D_FAMILIES.reduce((sum, f) => sum + shared(f), 0);
    })(),
  })).map((entry) => ({ ...entry, sign: entry.nonZSum - entry.zSum }));

  const invariantPairs = [];
  {
    const seen = new Set();
    for (const state of contactStates) {
      const info = ledgerInfo(state);
      const image = invertMask12(info.mask);
      const partner = ledgerRows.find((row) => maskOfPitches(parsePitchSet(row.pitchSet)) === image);
      const pairKey = [state, String(partner.id)].sort(cmp).join("|");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      const partnerInfo = ledgerInfo(partner.id);
      invariantPairs.push({
        a: state,
        b: String(partner.id),
        aOffice: info.office,
        bOffice: partnerInfo.office,
        inClass: partnerInfo.forte === "7-2",
        officeSum: String((Number(info.officeIndex) + Number(partnerInfo.officeIndex)) % 7),
        statusShared: contactSet.has(String(partner.id)),
        orientations: sortedUnique([info.orientation.endsWith(" A") ? "A" : "B", partnerInfo.orientation.endsWith(" A") ? "A" : "B"]),
      });
    }
  }

  const a1Satellites = ledgerRows.filter((row) => row.tier === "A1" && row.role === "satellite");
  const d6Satellites = ledgerRows.filter((row) => row.tier === "D6" && row.role === "satellite");

  const uKeys = sortedUnique(receipt.comparison.uKeys);
  const receiptObserved = sortedUnique(receipt.comparison.rows.map((row) => `${row.parentOffice}:${row.s}`));

  const d4Anchors = network.d4AnchorRows.map((row) => ({
    anchor: String(row.scaleId),
    unassigned: row.unassignedRelations.map((relation) => String(relation.candidateId)),
  }));
  const d4Reach = d4Anchors.map((anchor) => {
    const anchorMask = ledgerInfo(anchor.anchor).mask;
    return {
      reach27: ledgerRows.filter((row) => row.forte === "7-27" && hamming12(anchorMask, ledgerInfo(row.id).mask) === 2).map((row) => String(row.id)).sort(cmp),
      reach31: ledgerRows.filter((row) => row.forte === "7-31" && hamming12(anchorMask, ledgerInfo(row.id).mask) === 2).map((row) => String(row.id)).sort(cmp),
    };
  });

  return {
    infoById, ledgerInfo, anchorRows, contactRows, orbitStrings, contactStates, class72,
    contactsByAnchor, availabilityPerAnchor, availabilityKeys, observedKeys, instanceByKey,
    axis1Confusion, axis2Confusion, axis3Confusion, zCensus, signOfState, invariantPairs,
    a1Satellites, d6Satellites, uKeys, receiptObserved, d4Anchors, d4Reach,
    sources: { network, d4Hunt, zresidual, phaseC, receipt, gate3 },
  };
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  const {
    anchorRows, contactRows, orbitStrings, contactStates, class72, contactsByAnchor,
    availabilityPerAnchor, availabilityKeys, observedKeys, instanceByKey,
    axis1Confusion, axis2Confusion, axis3Confusion, zCensus, invariantPairs,
    a1Satellites, d6Satellites, uKeys, receiptObserved, d4Anchors, d4Reach,
    sources,
  } = derived;

  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.investigationId !== INVESTIGATION_ID) fail("artifact header drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== "scripts/build-bl068-d7-asymmetry.mjs") fail("generator path drift");

  // source bindings
  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText(sortedUnique(bindingPaths)) !== canonicalText(sortedUnique([
    NETWORK_PATH, LEDGER_PATH, BIPARTITE_PATH, D4_HUNT_PATH, ZRESIDUAL_PATH, PHASE_C_PATH, RECEIPT_PATH, GATE3_PATH,
  ]))) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }
  if (artifact.base.d4Hunt.artifact !== D4_HUNT_PATH || artifact.base.zresidual.artifact !== ZRESIDUAL_PATH) fail("base artifact drift");

  // census
  if (canonicalText(artifact.census.anchors) !== canonicalText(anchorRows)) fail("anchor census drift");
  if (canonicalText(artifact.census.orbit.edges) !== canonicalText(orbitStrings)) fail("orbit drift");
  const artifactContacts = artifact.census.contacts.map((contact) => ({ id: contact.id, satellite: contact.satellite, anchor: contact.anchor, phaseDelta: contact.phaseDelta }))
    .sort((left, right) => cmp(left.id, right.id));
  if (canonicalText(artifactContacts) !== canonicalText(contactRows)) fail("contact census drift");
  if (canonicalText(artifact.census.class72Census.d6GovernedTargets) !== canonicalText(sortedUnique(derived.sources.network.d6SatelliteRows.map((row) => String(row.scaleId))))) {
    fail("D6 governed target drift");
  }
  if (artifact.census.class72Census.count !== class72.length) fail("7-2 census drift");

  // recorded layer
  const recordedLayer = artifact.census.recordedLayer;
  if (recordedLayer.total !== 14 || recordedLayer.recorded !== 14 || recordedLayer.unrecorded !== 0) fail("recorded layer totals drift");
  const expectedRecorded = anchorRows.map((anchor) => ({
    anchor: anchor.anchor,
    office: anchor.office,
    recorded: contactsByAnchor.get(anchor.anchor).map(String),
    recordedCount: contactsByAnchor.get(anchor.anchor).length,
    unrecordedCount: 0,
  }));
  if (canonicalText(recordedLayer.perAnchor) !== canonicalText(expectedRecorded)) fail("recorded layer per-anchor drift");

  // availability domain
  const availability = artifact.census.availabilityDomain;
  if (canonicalText(availability.perAnchor) !== canonicalText(availabilityPerAnchor)) fail("availability per-anchor drift");
  if (availability.domainSize !== availabilityKeys.length) fail("availability size drift");
  if (availability.domainSize !== 36 || availability.recordedCount !== 14 || availability.unrecordedCount !== 22) fail("availability totals drift");
  if (availability.distinctStates !== 14) fail("availability distinct-states drift");
  const expectedDeltas = { "2": 11, "5": 11 };
  if (canonicalText(availability.deltaCounts) !== canonicalText(expectedDeltas)) fail("availability delta drift");
  if (canonicalText(availability.multiplicity) !== canonicalText({ "1": 2, "2": 2, "3": 10 })) fail("availability multiplicity drift");
  if (availability.perAnchorRange !== "4..6") fail("availability range drift");

  // gate-0
  const gate0 = artifact.census.gate0;
  if (gate0.contactsEqualToRecordedRelations !== true || gate0.contactsSubsetOfAvailability !== true) fail("gate-0 flags drift");
  if (gate0.domainSize !== 36 || gate0.unrecordedCount !== 22) fail("gate-0 counts drift");

  // d4 comparison
  const comparison = artifact.d4Comparison;
  if (comparison.grantLayer.uKeyCount !== uKeys.length || comparison.grantLayer.observedKeyCount !== receiptObserved.length ||
      comparison.grantLayer.unobservedKeyCount !== 14) fail("D4 grant layer drift");
  if (comparison.targetTiers.d4TargetTier.population !== a1Satellites.length ||
      comparison.targetTiers.d4TargetTier.classMultiplicity !== 2 ||
      comparison.targetTiers.d7TargetTier.population !== d6Satellites.length ||
      comparison.targetTiers.d7TargetTier.classMultiplicity !== 1) fail("target tier comparison drift");
  if (comparison.anchorResiduals.d4ResidualPerAnchor.some((entry) => entry.unassigned !== 4) ||
      comparison.anchorResiduals.d7ResidualPerAnchor.some((entry) => entry.unassigned !== 0)) fail("anchor residual drift");
  const reach = comparison.availabilityMirror.d4Reach;
  if (canonicalText(reach.map((entry) => entry.reach27)) !== canonicalText(d4Reach.map((entry) => entry.reach27)) ||
      canonicalText(reach.map((entry) => entry.reach31)) !== canonicalText(d4Reach.map((entry) => entry.reach31))) fail("D4 reach mirror drift");
  if (comparison.availabilityMirror.d4Reach27Total !== d4Reach.reduce((sum, entry) => sum + entry.reach27.length, 0) ||
      comparison.availabilityMirror.d4Reach31Total !== 0) fail("D4 reach totals drift");
  const landed = sources.gate3.d7Analogue;
  if (landed.construction.selectionGap !== 0 || landed.literalPredicate.selectedKeyCount !== 0 ||
      landed.cycleTwinVerification.verified !== 0) fail("landed D7 measurement reference drift");

  // axes
  const axis1 = artifact.axes[0];
  if (axis1.verdict !== "RESTATEMENT_UNIFORM" || canonicalText(axis1.confusion) !== canonicalText(axis1Confusion)) fail("axis 1 drift");
  if (canonicalText(axis1.values) !== canonicalText(histogram(availabilityKeys, observedKeys, (key) => derived.ledgerInfo(instanceByKey.get(key).satellite).forte))) fail("axis 1 values drift");
  if (canonicalText(axis1.intervalVectorSet) !== canonicalText(sortedUnique(contactStates.map((state) => derived.ledgerInfo(state).intervalVector)))) fail("axis 1 IV set drift");
  const axis2 = artifact.axes[1];
  if (axis2.verdict !== "CLEAN_SPLIT" || canonicalText(axis2.confusion) !== canonicalText(axis2Confusion)) fail("axis 2 drift");
  if (canonicalText(axis2.values) !== canonicalText(histogram(availabilityKeys, observedKeys, (key) => instanceByKey.get(key).officeDelta))) fail("axis 2 values drift");
  if (canonicalText(axis2.remainder.deltaCounts) !== canonicalText({ "2": 11, "5": 11 })) fail("axis 2 remainder drift");
  const axis3 = artifact.axes[2];
  if (axis3.verdict !== "NON_SEPARATING" || canonicalText(axis3.confusion) !== canonicalText(axis3Confusion)) fail("axis 3 drift");
  const expectedZCensus = contactStates.map((state) => ({ state, office: derived.ledgerInfo(state).office, nonZSum: zCensus.find((entry) => entry.state === state).nonZSum, zSum: zCensus.find((entry) => entry.state === state).zSum, sign: zCensus.find((entry) => entry.state === state).sign }));
  if (canonicalText(axis3.stateCensus) !== canonicalText(expectedZCensus)) fail("axis 3 z-census drift");

  // invariants
  const inv = artifact.invariants;
  if (canonicalText(inv.pairs) !== canonicalText(sortedPairList(invariantPairs))) fail("invariant pair drift");
  if (inv.pairCount !== 7 || inv.allInClass !== true || inv.allSumsSix !== true || inv.allStatusShared !== true) fail("invariant flags drift");
  if (inv.verdict !== "INVARIANTS_OBEYED") fail("invariant verdict drift");

  // control
  if (artifact.control.ledgerCount !== 14) fail("control count drift");
  if (artifact.control.satellites.length !== 14) fail("control satellite list drift");

  // synthesis
  const synthesis = artifact.synthesis;
  if (synthesis.verdict !== "DIFFERENT_PREDICATES") fail("synthesis verdict drift");
  if (canonicalText(synthesis.preRegisteredVerdicts) !== canonicalText(["DIFFERENT_PREDICATES", "SCOPED_NULL", "DOMAIN_MISMATCH"])) fail("pre-registered verdict list drift");
  if (synthesis.gsl3.id !== "GSL-3" || !synthesis.gsl3.statement.includes("predicate-axis divergence")) fail("GSL-3 block drift");
  if (synthesis.gsl3.evidence.length < 5) fail("GSL-3 evidence inventory drift");

  // gates and fences
  for (const key of ["V-B68-1", "V-B68-2", "V-B68-3", "V-B68-4"]) {
    if (artifact.gates[key]?.result !== "PASS") fail(`gate ${key} not PASS`);
  }
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712") ||
      !artifact.fences.membrane.includes("never a probe input") ||
      !artifact.fences.domainLabel.includes("constructed-comparison")) fail("fence drift");
  if (artifact.notAccomplished.length !== 7) fail("notAccomplished inventory drift");
}

function sortedPairList(pairs) {
  return pairs.slice().sort((left, right) => cmp([left.a, left.b].sort(cmp).join("|"), [right.a, right.b].sort(cmp).join("|")));
}

// ---------------------------------------------------------------------------
// Static generator check
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const forbidden = ["d4-production-generation", "analogueR", "d4-r2-route-review", "gate2ContractFingerprint"];
  for (const token of forbidden) {
    if (sourceText.includes(token)) fail(`generator carries forbidden token: ${token}`);
  }
  const required = ["hamming12", "d7SeatContactRows", "class72Set", "availabilityDomain"];
  for (const token of required) {
    if (!sourceText.includes(token)) fail(`generator missing required token: ${token}`);
  }
}

// PLACEHOLDER-VALIDATOR-VERIFY

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    network: readJson(NETWORK_PATH),
    ledgerRows: parseCsv(read(LEDGER_PATH)),
    bipartite: readJson(BIPARTITE_PATH),
    d4Hunt: readJson(D4_HUNT_PATH),
    zresidual: readJson(ZRESIDUAL_PATH),
    phaseC: readJson(PHASE_C_PATH),
    receipt: readJson(RECEIPT_PATH),
    gate3: readJson(GATE3_PATH),
  };

  if (sources.ledgerRows.length !== 462) fail(`ledger census ${sources.ledgerRows.length}`);
  const { huntFingerprint: d4Fp, ...d4Core } = sources.d4Hunt;
  if (d4Fp !== D4_HUNT_FINGERPRINT || sha256(canonicalText(d4Core)) !== d4Fp) fail("D4 hunt chain fingerprint drift");
  const { huntFingerprint: zrFp, ...zrCore } = sources.zresidual;
  if (zrFp !== ZRESIDUAL_FINGERPRINT || sha256(canonicalText(zrCore)) !== zrFp) fail("zresidual chain fingerprint drift");
  const { probeFingerprint: pcFp, ...pcCore } = sources.phaseC;
  if (pcFp !== PHASE_C_FINGERPRINT || sha256(canonicalText(pcCore)) !== pcFp) fail("Phase C chain fingerprint drift");

  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived);

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  const repin = (candidate) => {
    const { derivationFingerprint, ...probeCore } = candidate;
    void derivationFingerprint;
    return { ...probeCore, derivationFingerprint: sha256(canonicalText(probeCore)) };
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const expectRejection = (label, mutated) => {
    let rejected = false;
    try {
      checkAgainstSources(repin(mutated), derived);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
  };

  const censusDrift = clone(artifact);
  censusDrift.census.anchors = censusDrift.census.anchors.slice(0, 6);
  expectRejection("census drift (anchor dropped)", censusDrift);
  const contactClassSwap = clone(artifact);
  contactClassSwap.census.contacts[0].satellite = "2395";
  expectRejection("contact-class swap", contactClassSwap);
  const orbitRewire = clone(artifact);
  orbitRewire.census.orbit.edges[0] = "127->4033";
  expectRejection("orbit rewire", orbitRewire);
  const containmentDrop = clone(artifact);
  containmentDrop.axes[2].stateCensus[0].sign = 0;
  expectRejection("containment census drop", containmentDrop);
  const availabilityDrift = clone(artifact);
  availabilityDrift.census.availabilityDomain.perAnchor[0].instances = availabilityDrift.census.availabilityDomain.perAnchor[0].instances.slice(0, 3);
  expectRejection("availability instance drift", availabilityDrift);
  const misclassification = clone(artifact);
  misclassification.census.availabilityDomain.perAnchor[0].instances[2].status = "recorded";
  expectRejection("own/cross misclassification", misclassification);
  const deltaDrift = clone(artifact);
  deltaDrift.census.availabilityDomain.deltaCounts = { "2": 12, "5": 10 };
  expectRejection("availability delta drift", deltaDrift);
  const axis1Drift = clone(artifact);
  axis1Drift.axes[0].confusion.tp = 13;
  expectRejection("axis 1 confusion drift", axis1Drift);
  const axis2Drift = clone(artifact);
  axis2Drift.axes[1].confusion.tn = 21;
  expectRejection("axis 2 confusion drift", axis2Drift);
  const inversionSumDrift = clone(artifact);
  inversionSumDrift.invariants.pairs[0].officeSum = "5";
  expectRejection("inversion office-sum drift", inversionSumDrift);
  const statusSharingFlip = clone(artifact);
  statusSharingFlip.invariants.pairs[0].statusShared = false;
  expectRejection("status-sharing flip", statusSharingFlip);
  const controlDrift = clone(artifact);
  controlDrift.control.ledgerCount = 59;
  expectRejection("control count drift (brief figure reinstated)", controlDrift);
  const verdictDrift = clone(artifact);
  verdictDrift.synthesis.verdict = "SCOPED_NULL";
  expectRejection("verdict drift", verdictDrift);
  const gslDrift = clone(artifact);
  gslDrift.synthesis.gsl3.id = "GSL-2";
  expectRejection("GSL id drift", gslDrift);

  let smuggleRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.replace(
      "export function buildInvestigation() {",
      "export function buildInvestigation() { const smuggled = \"d4-production-generation\"; void smuggled;",
    ));
  } catch {
    smuggleRejected = true;
  }
  if (!smuggleRejected) fail("mutation probe not rejected: smuggled grant-projection read");

  let routeSmuggleRejected = false;
  try {
    staticIntrinsicCheck(generatorSource.replace(
      "const anchors = network.d7AnchorRows.map((row) => ({",
      "const smuggledRoute = \"analogueR\"; void smuggledRoute;\n  const anchors = network.d7AnchorRows.map((row) => ({",
    ));
  } catch {
    routeSmuggleRejected = true;
  }
  if (!routeSmuggleRejected) fail("mutation probe not rejected: smuggled analogue-R read");

  const mutationProbes = [
    "census drift (anchor dropped)", "contact-class swap", "orbit rewire", "containment census drop",
    "availability instance drift", "own/cross misclassification", "availability delta drift",
    "axis 1 confusion drift", "axis 2 confusion drift", "inversion office-sum drift",
    "status-sharing flip", "control count drift (brief figure reinstated)", "verdict drift",
    "GSL id drift", "smuggled grant-projection read", "smuggled analogue-R read",
  ];
  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    derivationFingerprint: artifact.derivationFingerprint,
    chainFingerprints: { d4Hunt: d4Fp, zresidual: zrFp, phaseC: pcFp },
    census: {
      anchors: artifact.census.anchors.length,
      contacts: artifact.census.contacts.length,
      recordedLayer: `${artifact.census.recordedLayer.recorded}/${artifact.census.recordedLayer.unrecorded}`,
      availability: `${artifact.census.availabilityDomain.domainSize} = ${artifact.census.availabilityDomain.recordedCount} + ${artifact.census.availabilityDomain.unrecordedCount}`,
    },
    axes: artifact.axes.map((axis) => `${axis.axis}:${axis.verdict}`),
    invariants: `${artifact.invariants.pairCount} pairs / sums 6: ${artifact.invariants.allSumsSix}`,
    verdict: artifact.synthesis.verdict,
    gsl3: artifact.synthesis.gsl3.id,
    mutationProbes: mutationProbes.length,
  }, null, 2));
}

validate();
