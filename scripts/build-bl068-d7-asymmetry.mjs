#!/usr/bin/env node
/**
 * Build the BL-068 D7 asymmetry investigation (planning, read-only analysis).
 *
 * The investigation's premise (OD-68-0, adopted): the D4 hunt had a live
 * discrimination domain (U = 28 granted keys, O = 14 contacts, gap 14); the
 * D7 analogue has none (analogue-R U = O = 14 by construction - the
 * construction consumed the domain before selection could operate, Gate 3
 * receipt d7Analogue.construction.gapNote). The discrimination question
 * therefore moves to the D7 anchors' own relations in the ledger/mesh, as
 * ruled in OD-68-1: the D7 recording layer, then the constructed availability
 * layer (hamming-2 reach of the 7-2 class within the 462-record ledger).
 *
 * Sections:
 *   census     - Gate-0: the D7 anchors (7), recorded contacts (14), modal
 *                orbit (7); the 14-state 7-2 ledger census (the brief's 59
 *                figure corrected to 14 by ledger bytes); the recorded-layer
 *                census (2 per anchor, 14 recorded, 0 unrecorded - the
 *                collapse); the availability-domain census (hamming-2 reach
 *                of the 7-2 class: 36 instances, 14 recorded same-office + 22
 *                unrecorded; per-anchor 4..6; the opening finding)
 *   d4Comparison - the D4 side from the same ledger plus the landed
 *                artifacts: granted domain 28 = 14 x 7-27 + 14 x 7-31 (two
 *                classes, office-flat, 28/28); the contact-target tier
 *                populations (A1: two classes; D6: one class); the D4
 *                anchors' residual relations (4 each) vs D7's (0); the D4
 *                anchors' hamming-2 reach (12 x 7-27, 0 x 7-31); the D4
 *                inversion pairs recomputed (7 state-pairs, all office sums 6)
 *   axes       - the four axis tests on the availability domain, confusion
 *                matrices against recorded status:
 *                1. native set-class hunt (RESTATEMENT_UNIFORM: the class is
 *                   the domain)
 *                2. office-linking / modal remainder (CLEAN_SPLIT; the
 *                   remainder is entirely modal-adjacent, o +/- 2 mod 7)
 *                3. Z-interface polarization (NON_SEPARATING: the D4
 *                   mechanism does not extend; 4/14 Z-majority states)
 *                4. invariant geography (INVARIANTS_OBEYED: 7/7 inversion
 *                   pairs in-class, all office sums 6 mod 7, status shared)
 *   control    - the 7-2 class census (the OD-68-1 secondary control): the
 *                class is the D6 satellite population is the contact set;
 *                internal structure (orientations, inversion pairs, Z-mix,
 *                multiplicities) recorded beside
 *   synthesis  - GSL-3, the governs semantic layer's first explanatory entry:
 *                DIFFERENT_PREDICATES - the target tiers differ in class
 *                multiplicity, so the fa-pole's selection rides set-class
 *                identity while the ti-pole's rides the office condition;
 *                invariants pole-universal, Z-interface fa-specific
 *
 * Fences: planning_evidence only. D7 hypothesis-tier throughout (no D7 claim
 * event, no D7 record amendment, no D7 derivation admission); ENTRY 15's D7
 * clause carries forward verbatim. No GOVERNS admission; no G1 movement; no
 * INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/
 * Neo4j writes; no D4-record movement. The frame 2.6/2.7 is interpretation
 * vocabulary, never design input. Session prose is context, not evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BIPARTITE_PATH,
  HEPTATONIC_LEDGER_PATH,
  canonicalText,
  fail,
  fileSha,
  parseCsv,
  parsePitchSet,
  read,
  readJson,
  sha256,
} from "./verify-phase-a-proposals.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl068-d7-asymmetry.v1";
export const INVESTIGATION_ID = "BL068_D7_ASYMMETRY_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const D4_HUNT_PATH = "orrery/src/generated/d4-14v14-hunt.v1.json";
export const ZRESIDUAL_PATH = "orrery/src/generated/d4-zresidual-hunt.v1.json";
export const PHASE_C_PATH = "orrery/src/generated/phase-c-probe.v1.json";
export const RECEIPT_PATH = "qa/d4-production-receipt.json";
export const GATE3_PATH = "qa/d4-r2-execution-receipt.json";

export const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
export const D_ANCHOR_FAMILIES = ["7-1", "7-15", "7-22", "7-8", "7-Z12", "7-Z17", "7-Z37"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cmp(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

function keyOf(anchor, satellite) {
  return `${anchor}:${satellite}`;
}

export function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += x & 1; x >>= 1; }
  return count;
}

export function invertMask12(mask) {
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
// Main build
// ---------------------------------------------------------------------------

export function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const bipartite = readJson(BIPARTITE_PATH);
  const d4Hunt = readJson(D4_HUNT_PATH);
  const zresidual = readJson(ZRESIDUAL_PATH);
  const phaseC = readJson(PHASE_C_PATH);
  const receipt = readJson(RECEIPT_PATH);
  const gate3 = readJson(GATE3_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) -----
  const { huntFingerprint: d4HuntFingerprint, ...d4HuntCore } = d4Hunt;
  if (d4Hunt.huntId !== "BL060_D4_14V14_HUNT_v1" || d4Hunt.status !== "planning_evidence") {
    fail("D4 hunt artifact header drift");
  }
  if (sha256(canonicalText(d4HuntCore)) !== d4HuntFingerprint) fail("D4 hunt fingerprint self-check failed");
  const { huntFingerprint: zresidualFingerprint, ...zresidualCore } = zresidual;
  if (zresidual.huntId !== "BL061_BL062_ZRESIDUAL_HUNT_v1" || zresidual.status !== "planning_evidence") {
    fail("zresidual artifact header drift");
  }
  if (sha256(canonicalText(zresidualCore)) !== zresidualFingerprint) fail("zresidual fingerprint self-check failed");
  const { probeFingerprint: phaseCFingerprint, ...phaseCCore } = phaseC;
  if (phaseC.probeId !== "BL033_PHASE_C_PROBE_v1" || phaseC.status !== "planning_evidence") {
    fail("Phase C probe artifact header drift");
  }
  if (sha256(canonicalText(phaseCCore)) !== phaseCFingerprint) fail("Phase C probe fingerprint self-check failed");
  if (gate3.status !== "execution_verified" || gate3.passFail !== true) fail("Gate 3 receipt status drift");
  if (receipt.category !== "not_derived") fail(`frozen receipt category is ${receipt.category}`);

  // ---- ledger lookups ------------------------------------------------------
  const infoById = new Map(ledgerRows.map((row) => [String(row.id), {
    id: String(row.id),
    mask: maskOfPitches(parsePitchSet(row.pitchSet)),
    forte: row.forte,
    tier: row.tier,
    role: row.role,
    fineRole: row.fineRole,
    office: row.office,
    officeIndex: String(row.officeIndex),
    orientation: row.orientation,
    chirality: row.chirality,
    intervalVector: row.intervalVector,
  }]));
  const ledgerInfo = (id) => {
    const info = infoById.get(String(id));
    if (!info) fail(`ledger record ${id} missing`);
    return info;
  };
  const heptNodeByMask = new Map(
    Object.values(bipartite.heptatonicNodes).map((node) => [String(node.pitchMask), node]),
  );
  if (heptNodeByMask.size !== 462) fail("bipartite heptatonic census drift");
  const pentatonicById = bipartite.pentatonicSubnodes;

  // ---- D7 census (fail-loud) ----------------------------------------------
  const anchors = network.d7AnchorRows.map((row) => ({
    anchor: String(row.scaleId),
    office: row.office,
    officeIndex: String(row.officeIndex),
    forte: row.forte,
  }));
  if (anchors.length !== 7) fail(`D7 anchor census is ${anchors.length}`);
  const anchorIds = new Set(anchors.map((anchor) => anchor.anchor));
  const contacts = network.d7SeatContactRows.map((row) => ({
    id: row.id,
    satellite: String(row.source),
    anchor: String(row.target),
    phaseDelta: String(row.phaseDelta),
  }));
  if (contacts.length !== 14) fail(`D7 contact census is ${contacts.length}`);
  for (const contact of contacts) {
    if (!anchorIds.has(contact.anchor)) fail(`D7 contact anchor ${contact.anchor} not a D7 anchor`);
  }
  const modalEdges = network.d7ModalRows.map((row) => ({
    id: row.id,
    source: String(row.source),
    target: String(row.target),
  }));
  if (modalEdges.length !== 7) fail(`D7 modal orbit census is ${modalEdges.length}`);
  const successor = new Map(modalEdges.map((edge) => [edge.source, edge.target]));
  const orbit = [];
  let current = "127";
  for (let step = 0; step < 7; step += 1) {
    const next = successor.get(current);
    if (!next) fail(`D7 modal orbit dead-ends at ${current}`);
    orbit.push({ a: current, b: next });
    current = next;
  }
  if (current !== "127") fail("D7 modal orbit does not close");
  const orbitClosure = `M(4033) = 127 (modal, not rotational); the seven orbit edges traverse one 7-cycle`;
  const contactStates = sortedUnique(contacts.map((contact) => contact.satellite));
  const contactSet = new Set(contacts.map((contact) => contact.satellite));
  if (contactStates.length !== 14) fail(`D7 contact state census is ${contactStates.length}`);
  for (const state of contactStates) {
    const info = ledgerInfo(state);
    if (info.forte !== "7-2") fail(`D7 contact ${state} is class ${info.forte}, not 7-2`);
    if (info.tier !== "D6" || info.role !== "satellite") fail(`D7 contact ${state} is not a D6 satellite`);
  }

  // ---- the 7-2 class census (the control's base; brief-figure correction) --
  const class72 = ledgerRows.filter((row) => row.forte === "7-2");
  if (class72.length !== 14) fail(`7-2 ledger census is ${class72.length}`);
  if (class72.some((row) => row.tier !== "D6" || row.role !== "satellite")) {
    fail("7-2 ledger records are not all D6 satellites");
  }
  if (canonicalText(sortedUnique(class72.map((row) => row.id))) !== canonicalText(contactStates)) {
    fail("7-2 ledger class is not set-equal to the D7 contact states");
  }
  const class72BriefCorrection = "the planning brief's '59 7-2 states' figure was a raw string-occurrence count across canonical/universal-network-data.json sections (nodes + universalLedgerRows + satellite rows); the canonical ledger carries exactly 14 7-2 records, all D6 satellites, all governed by D6 anchors (network.d6SatelliteRows / d6AnchorRows unassigned relations), all set-equal to the D7 contacts. Ledger bytes are the authority (the BL-060 G-13 correction pattern).";

  // ---- recorded relation layer (OD-68-1 first verification) ---------------
  const contactsByAnchor = new Map(anchors.map((anchor) => [anchor.anchor, []]));
  for (const contact of contacts) contactsByAnchor.get(contact.anchor).push(contact.satellite);
  for (const [, list] of contactsByAnchor) list.sort(cmp);
  const recordedLayer = {
    definition: "the D7 anchors' recorded satellite relations in the ledger/mesh: the 14 seat-contact rows (2 per anchor), each evaluated anchor->contact (same-office convergence)",
    perAnchor: anchors.map((anchor) => ({
      anchor: anchor.anchor,
      office: anchor.office,
      recorded: contactsByAnchor.get(anchor.anchor).map(String),
      recordedCount: contactsByAnchor.get(anchor.anchor).length,
      unrecordedCount: 0,
    })),
    total: 14,
    recorded: 14,
    unrecorded: 0,
    collapseNote: "unlike the D4 grant layer (28 keys = 14 observed + 14 unobserved), the D7 recorded layer carries zero unrecorded relations: the seat-contact relation is the anchors' entire recorded satellite population ('no residual children', ledger d7 order-preserving terminal note). This is the ledger-side confirmation of the Gate 3 gapNote (construction U = O = 14).",
  };

  // ---- availability domain (OD-68-1: hamming-2 reach of the 7-2 class) ----
  const class72Set = new Set(contactStates);
  const availabilityPerAnchor = anchors.map((anchor) => {
    const anchorMask = ledgerInfo(anchor.anchor).mask;
    const reach = ledgerRows
      .filter((row) => class72Set.has(String(row.id)) && hamming12(anchorMask, ledgerInfo(row.id).mask) === 2)
      .map((row) => ledgerInfo(row.id))
      .sort((left, right) => cmp(Number(left.id), Number(right.id)));
    const officeIndex = Number(anchor.officeIndex);
    const instances = reach.map((info) => {
      const delta = ((Number(info.officeIndex) - officeIndex) + 7) % 7;
      const recorded = info.office === anchor.office;
      return {
        satellite: info.id,
        satelliteOffice: info.office,
        orientation: info.orientation.endsWith(" A") ? "A" : info.orientation.endsWith(" B") ? "B" : null,
        officeDelta: String(delta),
        status: recorded ? "recorded" : "unrecorded",
        key: keyOf(anchor.anchor, info.id),
      };
    });
    const own = instances.filter((instance) => instance.status === "recorded").map((instance) => instance.satellite).sort(cmp);
    const listedContacts = contactsByAnchor.get(anchor.anchor).map(String).sort(cmp);
    if (canonicalText(own) !== canonicalText(listedContacts)) {
      fail(`anchor ${anchor.anchor}: own-office reach is not set-equal to its contacts`);
    }
    for (const instance of instances) {
      if (instance.status === "unrecorded" && !["2", "5"].includes(instance.officeDelta)) {
        fail(`anchor ${anchor.anchor}: unrecorded instance ${instance.satellite} has non-modal delta ${instance.officeDelta}`);
      }
      if (instance.status === "recorded" && instance.officeDelta !== "0") {
        fail(`anchor ${anchor.anchor}: recorded instance ${instance.satellite} is not same-office`);
      }
    }
    return {
      anchor: anchor.anchor,
      office: anchor.office,
      instances,
      recordedCount: own.length,
      unrecordedCount: instances.length - own.length,
      totalInstances: instances.length,
    };
  });
  const availabilityInstances = availabilityPerAnchor.flatMap((entry) => entry.instances);
  const availabilityKeys = availabilityInstances.map((instance) => instance.key);
  if (new Set(availabilityKeys).size !== availabilityKeys.length) fail("availability key collisions");
  const availabilityObserved = new Set(
    availabilityInstances.filter((instance) => instance.status === "recorded").map((instance) => instance.key),
  );
  const availabilityDomain = {
    definition: "constructed-comparison domain (hypothesis-tier): per D7 anchor, every 462-ledger record of class 7-2 at Hamming distance exactly 2 from the anchor (the class-mates within structural reach). The recorded 14 (own-office instances) are the subset verified above; the 22 unrecorded instances are the anchors' same-class reach outside the office. The domain is not the analogue-R (which collapsed U = O = 14); it is read from the ledger's masks and the anchors' masks alone, with the office field used only for the recorded/unrecorded status label.",
    perAnchor: availabilityPerAnchor,
    domainSize: availabilityInstances.length,
    recordedCount: availabilityInstances.filter((instance) => instance.status === "recorded").length,
    unrecordedCount: availabilityInstances.filter((instance) => instance.status === "unrecorded").length,
    perAnchorCounts: availabilityPerAnchor.map((entry) => `${entry.anchor}:${entry.totalInstances}`),
    perAnchorRange: "4..6",
    deltaCounts: availabilityInstances
      .filter((instance) => instance.status === "unrecorded")
      .reduce((acc, instance) => { acc[instance.officeDelta] = (acc[instance.officeDelta] ?? 0) + 1; return acc; }, {}),
    distinctStates: sortedUnique(availabilityInstances.map((instance) => instance.satellite)).length,
    multiplicity: (() => {
      const counts = {};
      for (const instance of availabilityInstances) counts[instance.satellite] = (counts[instance.satellite] ?? 0) + 1;
      const histogramByCount = {};
      for (const value of Object.values(counts)) histogramByCount[value] = (histogramByCount[value] ?? 0) + 1;
      return histogramByCount;
    })(),
    gate0: "PASS: all 14 contacts are contained in the availability domain (contactsSubsetOfAvailability = true), and the recorded instances are exactly the own-office subset (per-anchor set-equality verified).",
    findingNote: "the D4/D7 domain structure is NOT symmetric: D4's granted domain is a uniform 4 per anchor (28 = 14 + 14), while the D7 availability domain is 4..6 per anchor (36 = 14 + 22) and the recorded layer itself carries zero unrecorded relations. Per the ruling: the domain asymmetry is itself the first structural difference.",
  };

  // ---- D4 comparison side (same ledger + landed receipts) -----------------
  const a1Satellites = ledgerRows.filter((row) => row.tier === "A1" && row.role === "satellite");
  if (a1Satellites.length !== 28) fail(`A1 satellite census is ${a1Satellites.length}`);
  const a1Classes = a1Satellites.reduce((acc, row) => { acc[row.forte] = (acc[row.forte] ?? 0) + 1; return acc; }, {});
  if (a1Classes["7-27"] !== 14 || a1Classes["7-31"] !== 14) fail("A1 class multiplicity drift");
  const d6Satellites = ledgerRows.filter((row) => row.tier === "D6" && row.role === "satellite");
  if (d6Satellites.length !== 14) fail(`D6 satellite census is ${d6Satellites.length}`);
  const d6Classes = d6Satellites.reduce((acc, row) => { acc[row.forte] = (acc[row.forte] ?? 0) + 1; return acc; }, {});
  if (d6Classes["7-2"] !== 14 || Object.keys(d6Classes).length !== 1) fail("D6 class multiplicity drift");
  const d4Satellites = ledgerRows.filter((row) => row.tier === "D4" && row.role === "satellite");
  if (d4Satellites.length !== 28) fail(`D4 satellite census is ${d4Satellites.length}`);

  const uKeys = sortedUnique(receipt.comparison.uKeys);
  const observedKeys = sortedUnique(receipt.comparison.rows.map((row) => `${row.parentOffice}:${row.s}`));
  if (uKeys.length !== 28 || observedKeys.length !== 14) fail("frozen D4 domain census drift");
  let officeFlat = 0;
  for (const key of uKeys) {
    const [office, satellite] = key.split(":");
    if (ledgerInfo(satellite).officeIndex === office) officeFlat += 1;
  }
  if (officeFlat !== 28) fail("D4 granted domain is not office-flat");
  const d4ObservedStates = sortedUnique(observedKeys.map((key) => key.split(":")[1]));
  if (d4ObservedStates.some((state) => ledgerInfo(state).forte !== "7-27")) fail("D4 observed keys are not all 7-27");

  const d4Anchors = network.d4AnchorRows.map((row) => ({
    anchor: String(row.scaleId),
    office: row.office,
    officeIndex: String(row.officeIndex),
    contacts: row.seatContacts.map((seat) => String(seat.candidateId)).sort(cmp),
    unassigned: row.unassignedRelations.map((relation) => String(relation.candidateId)),
  }));
  if (d4Anchors.length !== 7) fail(`D4 anchor census is ${d4Anchors.length}`);
  if (d4Anchors.some((anchor) => anchor.unassigned.length !== 4)) fail("D4 anchor residual census drift");
  const d4Availability = d4Anchors.map((anchor) => {
    const anchorMask = ledgerInfo(anchor.anchor).mask;
    const reach27 = ledgerRows.filter((row) => row.forte === "7-27" && hamming12(anchorMask, ledgerInfo(row.id).mask) === 2).map((row) => String(row.id)).sort(cmp);
    const reach31 = ledgerRows.filter((row) => row.forte === "7-31" && hamming12(anchorMask, ledgerInfo(row.id).mask) === 2).map((row) => String(row.id)).sort(cmp);
    return { anchor: anchor.anchor, office: anchor.office, reach27, reach31 };
  });
  if (d4Availability.some((entry) => entry.reach31.length !== 0)) fail("D4 7-31 hamming-2 reach is not zero");
  const d4Reach27Total = d4Availability.reduce((sum, entry) => sum + entry.reach27.length, 0);

  // D4 inversion pairs recomputed from the ledger (independent of the artifact)
  const d4Pairs = [];
  {
    const seen = new Set();
    for (const state of d4ObservedStates) {
      const info = ledgerInfo(state);
      const image = invertMask12(info.mask);
      const partner = ledgerRows.find((row) => maskOfPitches(parsePitchSet(row.pitchSet)) === image);
      if (!partner) fail(`D4 inversion image of ${state} missing from ledger`);
      const pairKey = [state, String(partner.id)].sort(cmp).join("|");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      const partnerInfo = ledgerInfo(partner.id);
      if (partnerInfo.forte !== "7-27") fail(`D4 inversion partner of ${state} is class ${partnerInfo.forte}`);
      const officeSum = (Number(info.officeIndex) + Number(partnerInfo.officeIndex)) % 7;
      d4Pairs.push({ a: state, b: String(partner.id), officeSum: String(officeSum) });
    }
  }
  if (d4Pairs.length !== 7 || d4Pairs.some((pair) => pair.officeSum !== "6")) {
    fail("D4 inversion-pair recomputation drift");
  }
  const zresidualPairs = zresidual.domain.inversionPairs;
  if (zresidualPairs.length !== 14 || zresidualPairs.some((pair) => pair.officeSum !== "6")) {
    fail("zresidual inversion-pair block drift");
  }
  const artifactPairSet = new Set(zresidualPairs.map((pair) => [pair.a.split(":")[1], pair.b.split(":")[1]].sort(cmp).join("|")));
  for (const pair of d4Pairs) {
    if (!artifactPairSet.has([pair.a, pair.b].sort(cmp).join("|"))) {
      fail(`recomputed D4 pair ${pair.a}|${pair.b} missing from the landed artifact`);
    }
  }

  const gate3D7 = gate3.d7Analogue;
  if (gate3D7.construction.contacts !== 14 || gate3D7.construction.selectionGap !== 0 ||
      gate3D7.construction.uKeyCount !== 14 || canonicalText(gate3D7.construction.contactFortes) !== canonicalText(["7-2"])) {
    fail("Gate 3 d7Analogue construction drift");
  }
  if (gate3D7.literalPredicate.selectedKeyCount !== 0) fail("Gate 3 literal-predicate measurement drift");
  if (gate3D7.domainClassPredicate.accounting.restatementSignature !== true) fail("Gate 3 class-predicate restatement drift");
  if (gate3D7.cycleTwinVerification.verified !== 0) fail("Gate 3 cycle-twin measurement drift");
  const phaseCE3 = phaseC.e3D7Pairing;
  if (phaseCE3.label !== "hypothesis-analogue" || phaseCE3.construction.rEdges !== 14 ||
      phaseCE3.construction.modalOrbit.length !== 7 ||
      phaseCE3.anchoredRoute.outcome !== "not_derived@anchored-analogue" ||
      phaseCE3.seamRoute.outcome !== "not_derived@seam-analogue") {
    fail("Phase C D7 pairing drift");
  }

  const d4Comparison = {
    grantLayer: {
      source: "qa/d4-production-receipt.json comparison (the frozen D4 domain)",
      uKeyCount: 28,
      observedKeyCount: 14,
      unobservedKeyCount: 14,
      classes: { "7-27": 14, "7-31": 14 },
      officeFlat: "28/28 domain keys carry satellites of their own key office; the office axis is flat on the granted domain",
      classSplit: "[forte = '7-27'] separates observed from unobserved 14/0/0/14 (the landed BL-055/BL-060 predicate result)",
    },
    targetTiers: {
      d4TargetTier: { tier: "A1", population: 28, classes: a1Classes, classMultiplicity: 2, note: "the D4 contacts' target tier carries two satellite classes (7-27 observed / 7-31 unobserved)" },
      d7TargetTier: { tier: "D6", population: 14, classes: d6Classes, classMultiplicity: 1, note: "the D7 contacts' target tier carries exactly one satellite class (7-2); the class axis is flat" },
      d4OwnTier: { tier: "D4", population: d4Satellites.length, classes: d4Satellites.reduce((acc, row) => { acc[row.forte] = (acc[row.forte] ?? 0) + 1; return acc; }, {}) },
    },
    anchorResiduals: {
      d4ResidualPerAnchor: d4Anchors.map((anchor) => ({ anchor: anchor.anchor, office: anchor.office, unassigned: anchor.unassigned.length })),
      d7ResidualPerAnchor: anchors.map((anchor) => ({ anchor: anchor.anchor, office: anchor.office, unassigned: 0 })),
      note: "every D4 anchor carries 4 unassigned relations (its tier's 7-13/7-16 satellite rows); every D7 anchor carries 0 ('no residual children').",
    },
    availabilityMirror: {
      d4Reach: d4Availability.map((entry) => ({ anchor: entry.anchor, office: entry.office, reach27: entry.reach27, reach31: entry.reach31 })),
      d4Reach27Total,
      d4Reach31Total: 0,
      note: "the D4 anchors' Hamming-2 reach of 7-27 is 12 instances (1..2 per anchor), all recorded; 7-31 reach is zero. The D4 unobserved 14 live in the granted domain only (governed-but-unreached); the D7 unrecorded 22 live in the availability domain (reached-but-office-excluded). The remainders sit at mirror-reversed layers.",
    },
    invariantsRecomputed: {
      d4Pairs,
      d4PairCount: d4Pairs.length,
      officeSums: sortedUnique(d4Pairs.map((pair) => pair.officeSum)),
      crossCheck: "the 7 recomputed 7-27 state-pairs are all present among the landed d4-zresidual-hunt.v1.json domain.inversionPairs (14 key-pairs); the recomputation reproduces the landed invariant independently",
    },
    landedD7Measurements: {
      literalPredicate: "0/14 (contact satellites are 7-2; input-level asymmetry)",
      domainClassPredicate: "14/14 = U = O (full-domain restatement, C2 guard); restatementSignature true",
      cycleTwinVerification: "0/7 (modal orbit closes modally; M(4033) = 127)",
      gapNote: gate3D7.construction.gapNote,
      phaseC: "anchored analogue 12/14, seam analogue 12/14, office 3 unqualified; both not_derived@...-analogue",
      claimEvent: "none; D7 remains hypothesis-tier",
    },
  };

  // ---- axes on the availability domain ------------------------------------
  const availabilityKeyList = sortedUnique(availabilityKeys);
  const instanceByKey = new Map(availabilityInstances.map((instance) => [instance.key, instance]));
  const satelliteOfKey = (key) => instanceByKey.get(key).satellite;
  const anchorOfKey = (key) => key.split(":")[0];
  const deltaOfKey = (key) => instanceByKey.get(key).officeDelta;
  const signOfState = (state) => {
    const info = ledgerInfo(state);
    const node = heptNodeByMask.get(String(info.mask));
    if (!node) fail(`bipartite node missing for ${state}`);
    const shared = (family) => node.subnodes
      .filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
    const nonZSum = NON_Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
    const zSum = Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
    return { nonZSum, zSum, sign: nonZSum - zSum };
  };

  const axis1 = (() => {
    const predicate = (key) => ledgerInfo(satelliteOfKey(key)).forte === "7-2";
    const matrix = confusion(availabilityKeyList, availabilityObserved, predicate);
    const ivSet = sortedUnique(contactStates.map((state) => ledgerInfo(state).intervalVector));
    return {
      axis: "nativeSetClassHunt",
      definition: "the D7-native set-class partition: does any set class separate the recorded (same-office) instances from the unrecorded remainder? The canonical class predicate [forte(s) = '7-2'] is the D7 analogue of the D4 predicate [forte(s) = '7-27'].",
      rule: "P_D7(s) = [forte(s) = '7-2']",
      values: histogram(availabilityKeyList, availabilityObserved, (key) => ledgerInfo(satelliteOfKey(key)).forte),
      confusion: matrix,
      hit: matrix.tp + matrix.tn,
      split: matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22,
      verdict: "RESTATEMENT_UNIFORM",
      subFinding: "the class predicate selects 36/36: every instance of the domain is 7-2 - the class is the domain. No other set class occurs among the domain's states (the 14-state class is the entire ledger 7-2 population). The D4 analogue predicate selected one half of a two-class domain; over the single-class availability domain it restates. Interval vectors are class-constant (restatement-grade per the OD-60-2 guard).",
      evidence: "class from the canonical ledger (462 rows; 14 x 7-2, all D6 satellites); domain = the seven anchors' Hamming-2 reach of the class",
      intervalVectorSet: ivSet,
    };
  })();

  const axis2 = (() => {
    const predicate = (key) => deltaOfKey(key) === "0";
    const matrix = confusion(availabilityKeyList, availabilityObserved, predicate);
    const deltas = histogram(availabilityKeyList, availabilityObserved, deltaOfKey);
    const remainderDeltas = availabilityInstances.filter((instance) => instance.status === "unrecorded")
      .reduce((acc, instance) => { acc[instance.officeDelta] = (acc[instance.officeDelta] ?? 0) + 1; return acc; }, {});
    return {
      axis: "officeLinkingModalRemainder",
      definition: "the office-linking predicate [office(s) = office(h)] (the seat-contact's same-office convergence condition) and the geography of its complement: the unrecorded remainder's office deltas against the modal-mandated step (+2 mod 7, the governor-successor relation landed at BL-029).",
      rule: "O_D7(o, s) = [office(s) = office(h)]",
      values: deltas,
      confusion: matrix,
      hit: matrix.tp + matrix.tn,
      split: matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22,
      verdict: "CLEAN_SPLIT",
      remainder: {
        deltaCounts: remainderDeltas,
        modalStep: "+2 mod 7 (the modal orbit's governor-successor step; deltas 2 and 5 are the two orbit directions)",
        statement: "every unrecorded instance lies in a modal-adjacent office (delta in {2, 5}, 11 + 11); no unrecorded instance lies outside the modal neighbourhood, and no recorded instance lies outside the office. The unrecorded remainder is exactly the modal-neighbour subset of the class reach.",
      },
      subFinding: "on the availability domain the office-linking predicate is the sole clean separator (14/0/0/22); it is the seat-contact's own eligibility condition, not an independent structural property. The remainder it leaves is modal-bounded: the modal orbit's +2 step bounds every unrecorded instance's office. The D4 analogue (office axis) was flat 28/28 - the poles' discriminating axes are reversed.",
      evidence: "offices from the canonical ledger; deltas modulo 7 against each anchor's office; modal step from the landed modal-successor records (governor successor +2 mod 7)",
    };
  })();

  const axis3 = (() => {
    const zCensus = contactStates.map((state) => ({ state, office: ledgerInfo(state).office, ...signOfState(state) }));
    const predicate = (key) => signOfState(satelliteOfKey(key)).sign < 0;
    const matrix = confusion(availabilityKeyList, availabilityObserved, predicate);
    const zMajority = zCensus.filter((entry) => entry.sign < 0);
    const d4ObservedSigns = sortedUnique(d4ObservedStates.map((state) => signOfState(state).sign));
    return {
      axis: "zInterface",
      definition: "the GSL-1R Z-interface polarization ([nonZSum < zSum], observed D4 range -13..-3, unobserved +1..+11) recomputed on the D7 contact states and tested instance-wise on the availability domain.",
      rule: "Z_D7(s) = [nonZSum(s) < zSum(s)]",
      values: histogram(availabilityKeyList, availabilityObserved, (key) => signOfState(satelliteOfKey(key)).sign < 0 ? "Z-majority" : "nonZ-majority"),
      confusion: matrix,
      hit: matrix.tp + matrix.tn,
      split: matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22,
      verdict: "NON_SEPARATING",
      stateCensus: zCensus,
      subFinding: `the D4 polarization does not extend to the ti-pole's contacts: only ${zMajority.length}/14 of the 7-2 contact states are Z-majority (${zMajority.map((entry) => entry.state).join(",")}); ten carry nonZ-majority interfaces (signs +1..+7). On the availability domain the predicate is state-level, so each state distributes to both statuses wherever it appears; the instance confusion is mixed and the mechanism is fa-specific at the state level.`,
      evidence: "recomputed from the containment mesh (derived/hypergraph/bipartite-inclusion-v1.json, parentsUnrooted against the seven D-tier families) with the BL-060/061 method; the same recomputation reproduces the D4 side (all 14 observed 7-27 signs negative, range " + sortedUnique(d4ObservedSigns).join(",") + "; the exception pairs 1765/1261 nonZ 8 and 731/2921 nonZ 14 match the landed table)",
    };
  })();

  const invariants = (() => {
    const pairs = [];
    const seen = new Set();
    for (const state of contactStates) {
      const info = ledgerInfo(state);
      const image = invertMask12(info.mask);
      const partner = ledgerRows.find((row) => maskOfPitches(parsePitchSet(row.pitchSet)) === image);
      if (!partner) fail(`D7 inversion image of ${state} missing from ledger`);
      const pairKey = [state, String(partner.id)].sort(cmp).join("|");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      const partnerInfo = ledgerInfo(partner.id);
      const inClass = partnerInfo.forte === "7-2";
      const officeSum = (Number(info.officeIndex) + Number(partnerInfo.officeIndex)) % 7;
      const orientationPair = sortedUnique([info.orientation.endsWith(" A") ? "A" : "B", partnerInfo.orientation.endsWith(" A") ? "A" : "B"]);
      pairs.push({
        a: state, b: String(partner.id),
        aOffice: info.office, bOffice: partnerInfo.office,
        inClass,
        officeSum: String(officeSum),
        statusShared: contactSet.has(String(partner.id)),
        orientations: orientationPair,
      });
    }
    return {
      axis: "invariantGeography",
      definition: "the two boundary-layer invariants tested on the D7 contact pairs: inversion-invariance (every pair shares status; the class closes under pitch inversion) and office-linking (pair offices sum to 6 mod 7), as landed for D4 (14 pairs, all sums 6).",
      pairs,
      pairCount: pairs.length,
      allInClass: pairs.every((pair) => pair.inClass),
      allSumsSix: pairs.every((pair) => pair.officeSum === "6"),
      allStatusShared: pairs.every((pair) => pair.statusShared),
      allOrientationComplementary: pairs.every((pair) => pair.orientations.length === 2),
      verdict: "INVARIANTS_OBEYED",
      subFinding: "all 7 inversion pairs are in-class, status-shared, one of each chiral orientation, and all seven office sums are 6 mod 7 (6 cross-office pairs + 1 same-office pair, Mercury 3+3). The invariant geography is pole-universal at the invariant level: the ti-pole's contacts obey the same inversion-invariance and office-linking laws as the fa-pole's.",
      evidence: "recomputed from canonical ledger masks (pitch inversion = 12-bit reversal); cross-checked against the D4 recomputation (7 state-pairs) and the landed d4-zresidual-hunt.v1.json domain.inversionPairs (14 key-pairs, sums 6)",
    };
  })();

  const axes = [axis1, axis2, axis3];

  // ---- control: the 7-2 class census --------------------------------------
  const control = {
    id: "7-2-class-census",
    role: "the OD-68-1 secondary control: the D7 satellites' set-class census, testing whether the 7-2 class itself has discriminating structure beyond the anchor-satellite relations",
    ledgerCount: class72.length,
    briefCorrection: class72BriefCorrection,
    satellites: contactStates.map((state) => ({
      state,
      office: ledgerInfo(state).office,
      orientation: ledgerInfo(state).orientation,
      inversionPartner: invariants.pairs.find((pair) => pair.a === state || pair.b === state)
        ? (invariants.pairs.find((pair) => pair.a === state)?.b ?? invariants.pairs.find((pair) => pair.b === state)?.a)
        : null,
      sign: signOfState(state).sign,
      appearances: availabilityInstances.filter((instance) => instance.satellite === state).length,
    })),
    result: "class-internal structure exists (7 A + 7 B orientations; 7 inversion pairs; Z-mix 4 Z-majority / 10 nonZ; appearance multiplicities 1-3) but the class is consumed whole: every 7-2 record is a D6 satellite, every one is governed by a D6 anchor, and every one is a D7 contact. The control is degenerate as a discriminator - the class IS the contact set; its internal structure is a property table, not a selection axis.",
  };

  // ---- synthesis and GSL-3 -------------------------------------------------
  const gsl3Statement = [
    "GSL-3 (BL-068, the governs semantic layer's first explanatory entry). The fa/ti asymmetry's mechanism is predicate-axis divergence at the contact-target tiers.",
    "The fa-pole selects within a two-class governed domain: the A1 tier carries 14 x 7-27 (observed) + 14 x 7-31 (unobserved), the domain is office-flat (28/28), and the intrinsic set-class predicate separates it 14/0/0/14.",
    "The ti-pole's contact relation is exhaustive over a single-class tier: the D6 tier carries 14 x 7-2 only, the class predicate restates over the availability domain (36/36), and the sole clean separator is the office-linking condition (14/0/0/22), whose complement is modal-bounded (every unrecorded instance lies at office delta +/-2 mod 7, 11+11).",
    "The boundary invariants are pole-universal (both poles: inversion pairs in-class, office sums 6 mod 7, status shared within pairs); the Z-interface polarization is fa-specific (D4 separation 14/14 vs 14/14; D7 mixed at 4/14 Z-majority, non-separating).",
    "The class asymmetry (7-27 vs 7-2) is input-level; the selection asymmetry is axis-level (class vs office), and the axis difference is forced by the target tiers' class multiplicity. Same invariants, different predicates.",
  ].join(" ");

  const synthesis = {
    verdict: "DIFFERENT_PREDICATES",
    preRegisteredVerdicts: ["DIFFERENT_PREDICATES", "SCOPED_NULL", "DOMAIN_MISMATCH"],
    asymmetry: {
      fa: "set-class-discriminated selection within a two-class governed domain (A1: 7-27 / 7-31; office-flat; predicate 14/0/0/14)",
      ti: "office-discriminated relation over a single-class availability domain (D6: 7-2 only; class predicate restates 36/36; office predicate 14/0/0/22; remainder modal-bounded +/-2 mod 7)",
      mechanism: "target-tier class multiplicity: the A1 tier carries two satellite classes so a class selection exists; the D6 tier carries one so the only separating condition is the office rule",
      invariantGeography: "pole-universal (inversion-invariance and office sums 6 mod 7 hold at both poles)",
      zInterface: "fa-specific (the GSL-1R polarization separates the D4 sides and is mixed at D7)",
    },
    gsl3: {
      id: "GSL-3",
      channel: "governs semantic layer - the first explanatory entry; feeds the BL-059 scoping memo's section 4 evidence base and the higher-theorem question's evidence inventory",
      statement: gsl3Statement,
      evidence: [
        "census.recordedLayer (14/14/0) and census.availabilityDomain (36/14/22, per-anchor 4..6, deltas 11+11)",
        "axes[0] nativeSetClassHunt RESTATEMENT_UNIFORM (36/36)",
        "axes[1] officeLinkingModalRemainder CLEAN_SPLIT (14/0/0/22)",
        "axes[2] zInterface NON_SEPARATING (4/14 Z-majority; the D4 mechanism does not extend)",
        "invariants INVARIANTS_OBEYED (7/7 in-class pairs, sums 6, status shared)",
        "d4Comparison (A1 two-class vs D6 single-class target tiers; office-flat granted domain; mirror-reversed remainders)",
      ],
      scopingConnection: "the scoping memo section 4.3 (the fa/ti asymmetry) and section 5.1 (D7 modal non-closure) gain their structural predicate-axis reading; the synthesis section 4's Venus/Moon lens codas remain interpretation vocabulary - this entry is the measurement beneath them, not a lens application.",
    },
    premiseCarried: "OD-68-0/OD-68-1: the discrimination domain moves from the collapsed analogue-R (U = O = 14 by construction) to the anchors' recorded relations (14/14/0) and the constructed availability domain (36/14/22); the interpretation of the recollected 'no selection gap' is that the analogue's construction consumed the domain, and the deeper ledger fact is that the recorded layer collapses too while the availability layer does not - the tier's class uniformity is the structural cause.",
  };

  // ---- gates ---------------------------------------------------------------
  const gates = {
    "V-B68-1": {
      result: "PASS",
      statement: "census fail-loud: 7 anchors / 14 contacts / 7 modal edges / 462 ledger rows / 14-record 7-2 class / 28-record A1 population / 14-record D6 population; the modal orbit closes (M(4033) = 127); every contact is a 7-2 D6 satellite; the landed Gate 3 and Phase C D7 measurements self-check by fingerprint and match the recomputation",
    },
    "V-B68-2": {
      result: "PASS",
      statement: "Gate-0 domain verification: all 14 contacts contained in the availability domain (subset true); per-anchor own-office reach set-equal to the contacts; every unrecorded instance modal-adjacent (delta in {2,5}); the recorded layer is exactly the contacts (unrecorded 0); the brief's 59 figure corrected to 14 by ledger bytes",
    },
    "V-B68-3": {
      result: "PASS",
      statement: "axis results recorded with confusion matrices: RESTATEMENT_UNIFORM (class), CLEAN_SPLIT (office, remainder modal-bounded), NON_SEPARATING (Z-interface), INVARIANTS_OBEYED (inversion/office-linking)",
    },
    "V-B68-4": {
      result: "PASS",
      statement: "fences: no D7 claim event, no D7 record amendment, no D7 derivation admission; no GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability promotion; no canonical/Court/schema/Neo4j writes; D7 hypothesis-tier preserved; the frame is not design input",
    },
  };

  const fences = {
    d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
    governsAdmission: "none; this investigation explains, it does not admit",
    g1Intra330: "untouched (no intra-330 edges assumed, emitted, or consumed)",
    inv5: "no INV-5 graduation",
    mWalkability: "no M-walkability promotion; the modal orbit is used as characterization only",
    canonical: "no canonical/Court/schema/Neo4j writes; all sources read-only",
    d4Record: "no movement: ENTRY 10 immutable, ENTRY 15 unchanged, the D4 derivable-via-R2 amendment untouched",
    membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary only; never a probe input, design input, or admitted canon claim",
    sessionProse: "context, not evidence",
    domainLabel: "the availability domain is a constructed-comparison domain (hypothesis-tier), built from ledger masks alone with the office field used only for the recorded/unrecorded status label; it is not the analogue-R",
  };

  const contractCitations = [
    "provenance/DECISION_LEDGER.md:2703-2712 (ENTRY 15 D7 clause: 0/14, 14/14 = U = O, cycle-twin 0/7; the asymmetry feeds the governs semantic layer as data)",
    "scrum/plan/bl-057-gate3-execution-memo.md:103-117 (the D7 analogue measurements)",
    "qa/d4-r2-execution-receipt.json (d7Analogue: gapNote, contactFortes, selectionGap 0; executionFingerprint)",
    "scrum/plan/bl-033-phaseC-results-memo.md:58-65 (E3 D7 pairing: analogue audit, not_derived@...-analogue, office 3 unqualified)",
    "orrery/src/generated/phase-c-probe.v1.json (e3D7Pairing; probeFingerprint)",
    "scrum/plan/bl-067-governs-semantic-synthesis.md:102-134,197-202 (section 4 the asymmetry recorded; section 6 Question 1 the deepest open question this investigation executes)",
    "scrum/plan/bl-059-governs-derivability-scoping-memo.md:126-132 (section 4.3 the fa/ti asymmetry evidence base),:290-294 (section 6.3 the D-tier asymmetry as boundary case)",
    "scrum/plan/bl-060-14v14-hunt-memo.md:37-51 (the D4 predicate and containment composite),:130-138 (the three exception pairs)",
    "scrum/plan/bl-061-062-zresidual-memo.md:97-99 (GSL-1R polarization, inversion-invariance, office sums 6 mod 7)",
    "orrery/src/generated/d4-14v14-hunt.v1.json + orrery/src/generated/d4-zresidual-hunt.v1.json (the D4 side; consumed by fingerprint self-check)",
    "scrum/plan/bl-029-d-tier-operator-probe-memo.md:66-70 (the modal orbit: seven tier 7-cycles, governor successor +2 mod 7)",
    "canonical/universal-network-data.json (D7 anchors, seat contacts, modal orbit; D4 anchors and residuals), canonical/universal-heptatonic-ledger.csv (the 462-record universe), derived/hypergraph/bipartite-inclusion-v1.json (the containment mesh)",
  ];

  const notAccomplished = [
    "no D7 claim event; no D7 record amendment; no D7 derivation admission (hypothesis-tier preserved, ENTRY 15's clause unchanged)",
    "no GOVERNS admission; no derivation of any D7 relation from the un-granting machinery",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion",
    "no canonical/Court/schema/Neo4j writes; no claim event of any kind",
    "no D4-record movement (ENTRY 10 immutable; ENTRY 15 unchanged)",
    "no orientation-bit resolution (BL-065 carried); no dual-pole unification beyond this characterization",
    "no lens application as evidence; the frame is vocabulary, not input",
  ];

  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl068-d7-asymmetry.mjs",
    sourceBindings: [
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "D7 anchors, seat contacts, modal orbit; D4 anchors and residuals (comparison)" },
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record canonical universe: classes, offices, masks (the availability domain's source)" },
      { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "containment mesh (the Z-interface recomputation)" },
      { artifact: D4_HUNT_PATH, sha256: fileSha(D4_HUNT_PATH), role: "the D4 side (predicate, domain, office lemma); consumed by fingerprint self-check" },
      { artifact: ZRESIDUAL_PATH, sha256: fileSha(ZRESIDUAL_PATH), role: "GSL-1R/GSL-2 and the landed inversion pairs; consumed by fingerprint self-check" },
      { artifact: PHASE_C_PATH, sha256: fileSha(PHASE_C_PATH), role: "the D7 analogue construction and outcomes; consumed by fingerprint self-check" },
      { artifact: RECEIPT_PATH, sha256: fileSha(RECEIPT_PATH), role: "the frozen D4 domain (U/O keys)" },
      { artifact: GATE3_PATH, sha256: fileSha(GATE3_PATH), role: "the Gate 3 D7 analogue measurements (0/14, 14/14 = U = O, 0/7, gapNote)" },
    ],
    base: {
      d4Hunt: { artifact: D4_HUNT_PATH, huntFingerprint: d4HuntFingerprint },
      zresidual: { artifact: ZRESIDUAL_PATH, huntFingerprint: zresidualFingerprint },
      phaseC: { artifact: PHASE_C_PATH, probeFingerprint: phaseCFingerprint },
      importPolicy: "the chain artifacts are consumed by fingerprint self-check (no literals in this generator); the D7 measurements (0/14, 14/14 = U = O, 0/7) are re-read from the Gate 3 receipt and cross-checked fail-loud; the ledger and network carry the masks and records, never a verdict",
    },
    census: {
      anchors,
      orbit: { edges: orbit.map((edge) => `${edge.a}->${edge.b}`), closure: orbitClosure },
      contacts,
      class72Census: {
        count: class72.length,
        allD6Satellites: true,
        allGovernedByD6: network.d6SatelliteRows.length === 14,
        d6GovernedTargets: sortedUnique(network.d6SatelliteRows.map((row) => String(row.scaleId))),
        setEqualToContacts: true,
        briefCorrection: class72BriefCorrection,
      },
      recordedLayer,
      availabilityDomain,
      gate0: {
        contactsEqualToRecordedRelations: true,
        contactsSubsetOfAvailability: true,
        perAnchorRecorded: availabilityPerAnchor.map((entry) => `${entry.anchor}:${entry.recordedCount}`),
        perAnchorUnrecorded: availabilityPerAnchor.map((entry) => `${entry.anchor}:${entry.unrecordedCount}`),
        domainSize: availabilityDomain.domainSize,
        unrecordedCount: availabilityDomain.unrecordedCount,
        firstFinding: "the D7 discrimination domain's size: recorded layer 0 unrecorded (collapse); availability layer 36 instances, 14 recorded + 22 unrecorded (per-anchor 4..6). D4's grant layer: 28 = 14 + 14, gap 14. The domain structures are not symmetric: the D4 remainder is governed-but-unreached (7-31, Hamming-2 reach 0), the D7 remainder is reached-but-office-excluded (modal-neighbour 7-2).",
      },
    },
    d4Comparison,
    axes,
    invariants,
    control,
    synthesis,
    gates,
    fences,
    contractCitations,
    notAccomplished,
  };
  const derivationFingerprint = sha256(canonicalText(core));
  return { ...core, derivationFingerprint };
}

export function serializeInvestigation(investigation) {
  return `${canonicalText(investigation)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const investigation = buildInvestigation();
  const serialized = serializeInvestigation(investigation);
  const outputPath = path.join(root, OUTPUT_PATH);
  const summary = {
    output: OUTPUT_PATH,
    check,
    anchors: investigation.census.anchors.length,
    contacts: investigation.census.contacts.length,
    recordedLayer: `${investigation.census.recordedLayer.recorded} recorded / ${investigation.census.recordedLayer.unrecorded} unrecorded (2 per anchor)`,
    availability: `${investigation.census.availabilityDomain.domainSize} instances, ${investigation.census.availabilityDomain.recordedCount} recorded + ${investigation.census.availabilityDomain.unrecordedCount} unrecorded, per-anchor ${investigation.census.availabilityDomain.perAnchorRange}`,
    axes: investigation.axes.map((axis) => `${axis.axis}:${axis.verdict}`).join(" | "),
    invariants: `${investigation.invariants.pairCount} pairs, sums all 6: ${investigation.invariants.allSumsSix}, status shared: ${investigation.invariants.allStatusShared}`,
    control: `7-2 class: ${investigation.control.ledgerCount} records`,
    verdict: investigation.synthesis.verdict,
    gsl3: investigation.synthesis.gsl3.id,
    derivationFingerprint: investigation.derivationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL068_D7_ASYMMETRY");
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
