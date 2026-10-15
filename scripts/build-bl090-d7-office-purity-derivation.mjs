#!/usr/bin/env node
/**
 * Build the BL-090 D7 office-purity derivation: the ti-pole's derivation
 * route, redesigned from the BL-070 PARTIAL attempt with the office field
 * entering as a licensed input (the anchoring remainder's named component)
 * rather than a mask-geometric substitute.
 *
 * The delta from BL-070/BL-078/BL-089 (all landed): BL-070 asked whether a
 * mask-geometric predicate can REPLACE the office field (no: PARTIAL, R_NONE);
 * BL-078 asked whether that survives region-scoped isolation (yes: REPLICATED,
 * R-OFF 14/0/0/22); BL-089 derived the office field's interaction structure
 * from the derived-input class (INTERACTION_DERIVED). This derivation asks the
 * remaining question: does the ti-pole's selection - the office-purity
 * predicate o(s) = o(h) - generate the 14 contacts from the 36-instance
 * domain when its VALUES are the kappa-recovered coordinates (not the granted
 * office labels)? The derivation consumes: the D7/D6 partition and Hamming-2
 * reach (masks-only), the licensed GOVERNS edge content (the anchoring
 * remainder), kappa via the imported masks-only BL-063 functions, and the one
 * orientation bit C. Zero granted-office bytes in the derivation path.
 *
 * The rule (pre-registered; single primary per the Q1 ruling):
 *   R-kappa(h) = {(h, s) : s in D2(h) and o_kappa(s) = o_kappa(h)}
 * the same form as the D4 corridor's R2 = satellites(h) and P(s): the domain
 * provides the instances, the predicate provides the selection; the
 * predicate's values are kappa-recovered.
 *
 * The mappings (pre-registered; Q2 ruling: anchorRule primary, affine
 * transport cross-check; the two mappings' equivalence/non-equivalence is
 * itself a finding):
 *   M1 (primary): office(anchor) = (C - pcSum(mask)) mod 7 with C the kappa
 *      orientation constant; office(satellite) = office(governing anchor)
 *      (the licensed GOVERNS edge content).
 *   M2 (cross-check): the D7<->A0 affine transport (T1: y = 5x + 2; T2:
 *      y = 2x + 4; BL-089 OP-AR-2) applied to the kappa1 positions; the D6
 *      pole's A1 transport is non-affine (landed BL-089): the affine attempt
 *      is computed and its termination characterized; the declared fallback
 *      (the anchor rule) carries the D6 pole.
 *
 * Gates (pre-registered, fail-loud):
 *   V-D7D-1 domain verification: the 36-instance domain re-derived and
 *           set-equal to the landed BL-068/BL-070 domains; mismatch = halt
 *   V-D7D-2 calibration: R-OFF on the granted labels reproduces 14/0/0/22
 *           (the control's license; fail = domain wrong, not rule)
 *   V-D7D-3 kappa-grounding: the selection computed on the kappa-recovered
 *           field produces the 14 contacts set-equal (M1 and M2); mismatch
 *           under both = the partial branch (report, never force)
 *   V-D7D-4 input isolation: zero granted-office bytes in the derivation
 *           path (region-scoped static check; validator-enforced; any
 *           granted-office read = halt)
 *   V-D7D-5 accounting: the three-tier statement complete and honest
 *
 * Branches (pre-registered, all findings): FULL_DERIVATION / PARTIAL_DERIVATION
 * (the anchoring remainder's sharpest instance + the GSL-3 asymmetry
 * confirmation, per the Q3 ruling) / NO_DERIVATION.
 *
 * Two-region static discipline (validator-enforced): the INTRINSIC region
 * reads the pitch sets, masks, the role/tier partition, and re-derives kappa
 * via the masks-only BL-063 functions; it never reads the granted office
 * field, the class labels, the network records, or any landed verdict. The
 * comparison region reads the granted offices (comparison target), the
 * seat-contact rows (evaluation target), and the cycle-ground orders.
 *
 * Fences: planning_evidence only. D7 hypothesis-tier throughout (no D7 claim
 * event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7
 * clause carries forward verbatim). No GOVERNS admission; no new GSL number;
 * no registration. No G1 movement; no INV-5 graduation; no M-walkability
 * promotion; no directional-semantics assignment. No canonical/Court/schema/
 * Neo4j writes; no claim event; no record amendment (ENTRY 10/15/16/17/18/19/
 * 20/21 byte-untouched). The frame (scrum/plan/harmonic-comprehension-map.md
 * sections 2.6/2.7) is interpretation vocabulary, never a derivation input.
 * Session prose is context, not evidence. The office field enters only through
 * the kappa-recovered coordinates, never through the granted office labels.
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
  read,
  readJson,
  sha256,
} from "./verify-phase-a-proposals.mjs";

import {
  deriveP7,
  deriveKappa,
  derivePi,
  deriveMidpoints,
} from "./build-bl063-office-reconstruction.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.bl090-d7-office-purity-derivation.v1";
export const DERIVATION_ID = "BL090_D7_OFFICE_PURITY_DERIVATION_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl090-d7-office-purity-derivation.v1.json";
export const NETWORK_PATH = "canonical/universal-network-data.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const MESH_PATH = BIPARTITE_PATH;
export const BL063_PATH = "orrery/src/generated/bl063-office-reconstruction.v1.json";
export const BL064_PATH = "orrery/src/generated/bl064-cycle-ground.v1.json";
export const BL066_PATH = "orrery/src/generated/bl066-r-edge-derivation.v1.json";
export const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
export const BL070_PATH = "orrery/src/generated/bl070-d7-derivation.v1.json";
export const BL078_PATH = "orrery/src/generated/bl078-d7-retest.v1.json";
export const BL089_PATH = "orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json";

export const TRANSIT = {
  T1: { id: "T1", unit: 5, a: 5, b: 2, expression: "y = 5x + 2 (mod 7)" },
  T2: { id: "T2", unit: 7, a: 2, b: 4, expression: "y = 2x + 4 (mod 7)" },
};

export const NON_Z_D_FAMILIES = ["7-1", "7-15", "7-22", "7-8"];
export const Z_D_FAMILIES = ["7-Z12", "7-Z17", "7-Z37"];
export const D_TIER_FAMILIES = [...NON_Z_D_FAMILIES, ...Z_D_FAMILIES];

// ==== INTRINSIC-DERIVATION-BEGIN (masks + the licensed role/tier partition and GOVERNS edge content + kappa; no granted office bytes) ====
// This region derives the domain (D1 partition + D2 Hamming-2 reach), the
// kappa inputs via the imported masks-only BL-063 functions, the M1 anchor
// field, the M2 affine fields, and the M2 D6 transport attempt. It reads no
// index field, no relational field, no class label, no network record, and no
// landed verdict: every value here is mask arithmetic or kappa arithmetic.

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sortedUnique(values) {
  return [...new Set(values)].sort(cmp);
}

export function maskOfRow(row) {
  let mask = 0;
  for (const pitch of row.pitchSet.replace(/[{}]/g, "").split(",")) {
    if (pitch !== "") mask |= 1 << Number(pitch);
  }
  if (mask !== Number(row.id)) {
    fail(`ledger row ${row.id}: mask derived from the pitch set disagrees with the identity field`);
  }
  return mask;
}

export function pcSumOfMask(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

export function hamming12(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x !== 0) { count += x & 1; x >>= 1; }
  return count;
}

export function affineImage(mask, unit) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) {
      const mapped = (((unit * pitch) % 12) + 12) % 12;
      image |= 1 << mapped;
    }
  }
  return image & 4095;
}

function sortInstanceKeys(keys) {
  return keys.slice().sort((left, right) => {
    const [la, ls] = left.split(":").map(Number);
    const [ra, rs] = right.split(":").map(Number);
    return la - ra || ls - rs;
  });
}

export function deriveKappaInputs(ledgerRows) {
  const a0Rows = ledgerRows.filter((row) => row.tier === "A0" && row.role === "anchor")
    .sort((left, right) => cmp(Number(left.id), Number(right.id)));
  const a1Rows = ledgerRows.filter((row) => row.tier === "A1" && row.role === "anchor")
    .sort((left, right) => cmp(Number(left.id), Number(right.id)));
  if (a0Rows.length !== 7 || a1Rows.length !== 7) fail("A0/A1 anchor census drift");
  const a0Masks = a0Rows.map((row) => maskOfRow(row)).sort((left, right) => left - right);
  const a1Masks = a1Rows.map((row) => maskOfRow(row)).sort((left, right) => left - right);
  const p7 = deriveP7(a0Masks);
  const kappa = deriveKappa(p7);
  const piEntries = a1Masks.map((mask) => derivePi(mask, p7));
  const midpoints = piEntries.map((entry) => deriveMidpoints(entry, kappa));
  const cA0 = a0Masks.map((mask) => (kappa.kappa1.get(mask) + pcSumOfMask(mask)) % 7);
  const cA1 = a1Masks.map((mask, index) => (midpoints[index].g1 + pcSumOfMask(mask)) % 7);
  const cValues = [...new Set([...cA0, ...cA1])];
  if (cValues.length !== 1) fail(`kappa orientation constant is not unique: ${cValues.join(",")}`);
  return { a0Rows, a1Rows, a0Masks, a1Masks, p7, kappa, midpoints, C: cValues[0] };
}

export function deriveDomain(ledgerRows) {
  const anchorRows = ledgerRows
    .filter((row) => row.tier === "D7" && row.role === "anchor")
    .sort((left, right) => cmp(Number(left.id), Number(right.id)));
  const satelliteRows = ledgerRows
    .filter((row) => row.tier === "D6" && row.role === "satellite")
    .sort((left, right) => cmp(Number(left.id), Number(right.id)));
  if (anchorRows.length !== 7 || satelliteRows.length !== 14) {
    fail(`D7/D6 partition census drift: ${anchorRows.length} anchors / ${satelliteRows.length} satellites`);
  }
  const maskById = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const anchorIds = anchorRows.map((row) => String(row.id));
  const satelliteIds = satelliteRows.map((row) => String(row.id));
  const perAnchor = anchorIds.map((anchor) => {
    const instances = satelliteIds
      .filter((satellite) => hamming12(maskById.get(anchor), maskById.get(satellite)) === 2);
    return { anchor, instances, count: instances.length };
  });
  const instanceKeys = sortInstanceKeys(perAnchor.flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`)));
  const distinctStates = sortedUnique(satelliteIds);
  const parentCounts = new Map(satelliteIds.map((satellite) => [
    satellite,
    perAnchor.filter((entry) => entry.instances.includes(satellite)).length,
  ]));
  const multiplicity = new Map();
  for (const key of instanceKeys) {
    const state = key.split(":")[1];
    multiplicity.set(state, (multiplicity.get(state) ?? 0) + 1);
  }
  for (const state of distinctStates) {
    if (parentCounts.get(state) !== multiplicity.get(state)) {
      fail(`state ${state}: reach census and appearance multiplicity disagree`);
    }
  }
  return { anchorIds, satelliteIds, maskById, rowById, perAnchor, instanceKeys, distinctStates, parentCounts, multiplicity };
}

export function deriveAllLedgerReach(ledgerRows, anchorIds) {
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  return anchorIds.map((anchor) => ({
    anchor,
    count: ledgerRows.filter((other) => String(other.id) !== anchor && hamming12(masks.get(anchor), masks.get(String(other.id))) === 2).length,
  }));
}

export function deriveTierReach(ledgerRows, anchorIds, tier) {
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const members = ledgerRows.filter((row) => row.tier === tier);
  return anchorIds.map((anchor) => ({
    anchor,
    count: members.filter((other) => hamming12(masks.get(anchor), masks.get(String(other.id))) === 2).length,
  }));
}

export function buildGoverningParentOf(structuralEdges) {
  const parentOf = new Map();
  for (const edge of structuralEdges) {
    if (edge.type !== "GOVERNS") continue;
    const source = String(edge.source);
    const target = String(edge.target);
    if (parentOf.has(target)) fail(`satellite ${target} carries two governing anchors`);
    parentOf.set(target, source);
  }
  if (parentOf.size !== 238) fail(`governing census drift: ${parentOf.size}`);
  return parentOf;
}

export function deriveM1Offices(ledgerRows, domain, parentOf, C) {
  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const governingParents = sortedUnique(domain.satelliteIds.map((satellite) => {
    const parent = parentOf.get(satellite);
    if (!parent) fail(`satellite ${satellite} has no governing anchor`);
    return parent;
  }));
  const officeOf = new Map();
  const anchorRuleRows = [];
  for (const anchor of sortedUnique([...domain.anchorIds, ...governingParents])) {
    const row = rowById.get(anchor);
    if (!row) fail(`anchor row missing: ${anchor}`);
    const derived = (C - pcSumOfMask(maskOfRow(row)) + 70) % 7;
    officeOf.set(anchor, derived);
    anchorRuleRows.push({ id: anchor, pcSum: pcSumOfMask(maskOfRow(row)), derived });
  }
  const distinctOn = (ids) => new Set(ids.map((id) => officeOf.get(id))).size === ids.length;
  if (!distinctOn(domain.anchorIds) || !distinctOn(governingParents)) {
    fail("anchor offices are not a seven-office permutation on each family");
  }
  for (const satellite of domain.satelliteIds) officeOf.set(satellite, officeOf.get(parentOf.get(satellite)));
  return { officeOf, governingParents, anchorRuleRows };
}

export function deriveM2D7Offices(ledgerRows, kappaInputs, d7Ids, map) {
  const maskById = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const idByMask = new Map(ledgerRows.map((row) => [maskOfRow(row), String(row.id)]));
  const a0ByImage = new Map(kappaInputs.a0Masks.map((mask) => [affineImage(mask, map.unit), mask]));
  const officeById = new Map();
  const partnerById = new Map();
  for (const id of d7Ids) {
    const partnerMask = a0ByImage.get(maskById.get(id));
    if (partnerMask === undefined) fail(`M2 ${map.id}: A0 partner missing for ${id}`);
    partnerById.set(id, idByMask.get(partnerMask));
    officeById.set(id, (map.a * kappaInputs.kappa.kappa1.get(partnerMask) + map.b) % 7);
  }
  const values = [...officeById.values()];
  if (new Set(values).size !== d7Ids.length) fail(`M2 ${map.id}: D7 offices are not distinct`);
  return { officeById, partnerById };
}

export function deriveM2D6Transport(ledgerRows, kappaInputs, d6Ids, derivedOfficeOf, map) {
  const maskById = new Map(ledgerRows.map((row) => [String(row.id), maskOfRow(row)]));
  const idByMask = new Map(ledgerRows.map((row) => [maskOfRow(row), String(row.id)]));
  const a1ByImage = new Map(kappaInputs.a1Masks.map((mask) => [affineImage(mask, map.unit), mask]));
  const g1ByMask = new Map(kappaInputs.midpoints.map((entry) => [entry.child, entry.g1]));
  const rows = [];
  for (const id of d6Ids) {
    const partnerMask = a1ByImage.get(maskById.get(id));
    if (partnerMask === undefined) fail(`M2 ${map.id}: A1 partner missing for ${id}`);
    rows.push({
      d6Anchor: id,
      a1Partner: idByMask.get(partnerMask),
      source: g1ByMask.get(partnerMask),
      target: derivedOfficeOf.get(id),
    });
  }
  const affineFits = [];
  for (let a = 1; a <= 6; a += 1) {
    for (let b = 0; b <= 6; b += 1) {
      if (rows.every((row) => (a * row.source + b) % 7 === row.target)) affineFits.push({ a, b });
    }
  }
  const swapTerminals = (x) => (x === 0 ? 6 : x === 6 ? 0 : x);
  const affineMismatches = rows
    .filter((row) => (map.a * row.source + map.b) % 7 !== row.target)
    .map((row) => row.d6Anchor);
  const swapResolutionMismatches = rows
    .filter((row) => (map.a * swapTerminals(row.source) + map.b) % 7 !== row.target)
    .map((row) => row.d6Anchor);
  return { rows, affineFits, affineMismatches, swapResolutionMismatches };
}

// ==== INTRINSIC-DERIVATION-END ====

// ---- comparison and control region: the granted office field (comparison
// ---- target), the seat-contact rows (evaluation target), the cycle-ground
// ---- orders, the containment mesh (the Z control), and the landed artifacts
// ---- are read here; never in the intrinsic region --------------------------

function fingerprintSelfCheck(artifact, label, idKey, idValue, fingerprintKey) {
  const { [fingerprintKey]: fingerprint, ...core } = artifact;
  if (artifact[idKey] !== idValue || artifact.status !== "planning_evidence") fail(`${label} artifact header drift`);
  if (sha256(canonicalText(core)) !== fingerprint) fail(`${label} fingerprint self-check failed`);
  return fingerprint;
}

function confusion(keys, targetSet, predicate) {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  for (const key of keys) {
    const predicted = predicate(key);
    const actual = targetSet.has(key);
    if (actual && predicted) tp += 1;
    else if (actual && !predicted) fn += 1;
    else if (!actual && predicted) fp += 1;
    else tn += 1;
  }
  return { tp, fp, fn, tn };
}

const isClean = (matrix) => matrix.tp === 14 && matrix.fp === 0 && matrix.fn === 0 && matrix.tn === 22;

function signOfMask(mask, mesh, subnodesByMask, pentatonicById) {
  const subnodes = subnodesByMask.get(String(mask));
  if (!subnodes) fail(`containment mesh node missing for mask ${mask}`);
  const shared = (family) => subnodes.filter((id) => (pentatonicById[id]?.parentsUnrooted ?? []).includes(family)).length;
  const nonZSum = NON_Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
  const zSum = Z_D_FAMILIES.reduce((sum, family) => sum + shared(family), 0);
  return nonZSum - zSum;
}

export const PRE_REGISTRATION = {
  approved: "2026-10-15 (the approved BL-090 directive and execution plan; the maintainer rulings OD-90-1..OD-90-3 frozen before computation)",
  rulings: [
    {
      id: "OD-90-1",
      decision: "single primary selection rule (the Q1 ruling): R-kappa = the office-purity predicate o_kappa(s) = o_kappa(h) evaluated on the kappa-recovered field; the midpoint law is infrastructure (BL-064's coordinate rule read backward; it builds the parent pairs, it does not select) and the Z-interface is a guard control; no multi-candidate search; ambiguity-avoidance is the ruling's rationale",
    },
    {
      id: "OD-90-2",
      decision: "the kappa-to-D7 mapping (the Q2 ruling): M1 anchorRule primary (office = (C - pcSum) mod 7 + governing inherit; 70/70 verified in BL-089); M2 affine transport cross-check (T1: y = 5x + 2; T2: y = 2x + 4; the BL-089 OP-AR-2 D7<->A0 laws applied to the kappa1 positions); the kappa-verdict table (both/one/neither); the memo states which mapping produced the selection and the equivalence/non-equivalence is itself a finding about the kappa structure",
    },
    {
      id: "OD-90-3",
      decision: "partial-branch framing (the Q3 ruling): if V-D7D-3 fails, the finding is the anchoring remainder's sharpest instance (the office field necessary, not just sufficient) plus the GSL-3 asymmetry confirmation (different predicates with different grounding requirements; the fa-pole's mask-derivable, the ti-pole's granted-dependent); the framing is carried pre-registered and fires only on the partial branch",
    },
  ],
  rule: {
    id: "R-kappa",
    expression: "R-kappa(h) = {(h, s) : s in D2(h) and o_kappa(s) = o_kappa(h)}",
    domain: "D2(h) = the D6-satellite Hamming-2 reach of the D7 anchor h (masks-only; 36 instances)",
    selection: "the office-purity predicate o(s) = o(h) evaluated on the kappa-recovered field (zero granted-office reads in the derivation path)",
    form: "the same form as the D4 corridor's R2 = satellites(h) and P(s): the domain provides the instances, the predicate provides the selection",
    justification: "BL-070/BL-078: the office-linking rule is the sole clean domain separator (the mask-geometric battery R-NONE); BL-089: the coupling structure is derived from the derived-input class; this derivation tests the VALUES' derivability through kappa",
  },
  kappaVerdictTable: {
    both: "over-determined (the strongest result): both mappings reproduce the selection",
    one: "the ground is that specific mapping (the weaker but still sufficient result)",
    neither: "the kappa-grounding fails: the selection requires the granted office field (the partial branch; report, never force)",
  },
  branchCriteria: {
    full: "V-D7D-1 PASS and V-D7D-2 PASS (calibration EXACT) and V-D7D-3 PASS (the kappa-grounded selection set-equal to the 14 contacts under M1 and/or M2) and V-D7D-4/5 PASS",
    partial: "V-D7D-1 PASS and V-D7D-2 PASS and V-D7D-3 FAIL (neither mapping reproduces the 14 contacts): the office field is granted-dependent; the anchoring remainder's sharpest instance; the GSL-3 asymmetry deepened (different predicates with different grounding requirements)",
    no: "V-D7D-1 FAIL (the domain does not re-derive masks-only) or V-D7D-2 FAIL (calibration: the domain is wrong, not the rule)",
  },
  refutationConditions: [
    { id: "R-90-1", text: "the derivation is refuted if the domain does not re-derive masks-only or does not set-equal the landed BL-068/BL-070 domains - a halt, not a finding (V-D7D-1)" },
    { id: "R-90-2", text: "the kappa-grounding is refuted if the selection under both mappings fails to set-equal the 14 contacts - the partial branch fires (report, never force; the Q3 framing pre-registered)" },
    { id: "R-90-3", text: "the affine cross-check is refuted if the D7-pole transport disagrees with the anchor rule on any anchor - a mapping-disagreement finding, named per anchor" },
    { id: "R-90-4", text: "the isolation is refuted if any granted-office byte occurs in the derivation path - a halt (V-D7D-4; the region-scoped static check)" },
  ],
  tolerance: "set-equality key-by-key, binary confusion (14/0/0/22); any mismatch with a landed artifact is a halt; mapping disagreements are findings, never forced",
};

function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const mesh = readJson(MESH_PATH);
  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) -----
  const bl063 = readJson(BL063_PATH);
  const bl064 = readJson(BL064_PATH);
  const bl066 = readJson(BL066_PATH);
  const bl068 = readJson(BL068_PATH);
  const bl070 = readJson(BL070_PATH);
  const bl078 = readJson(BL078_PATH);
  const bl089 = readJson(BL089_PATH);
  const bl063Fingerprint = fingerprintSelfCheck(bl063, "BL-063", "reconstructionId", "BL063_OFFICE_RECONSTRUCTION_v1", "reconstructionFingerprint");
  const bl064Fingerprint = fingerprintSelfCheck(bl064, "BL-064", "derivationId", "BL064_CYCLE_GROUND_V1", "derivationFingerprint");
  const bl066Fingerprint = fingerprintSelfCheck(bl066, "BL-066", "derivationId", "BL066_R_EDGE_DERIVATION_V1", "derivationFingerprint");
  const bl068Fingerprint = fingerprintSelfCheck(bl068, "BL-068", "investigationId", "BL068_D7_ASYMMETRY_V1", "derivationFingerprint");
  const bl070Fingerprint = fingerprintSelfCheck(bl070, "BL-070", "derivationId", "BL070_D7_DERIVATION_V1", "derivationFingerprint");
  const bl078Fingerprint = fingerprintSelfCheck(bl078, "BL-078", "retestId", "BL078_D7_RETEST_V1", "derivationFingerprint");
  const bl089Fingerprint = fingerprintSelfCheck(bl089, "BL-089", "investigationId", "BL089_ANCHORING_REMAINDER_INTERACTION_V1", "investigationFingerprint");
  const meshMasks = new Set(Object.values(mesh.heptatonicNodes).map((node) => String(node.pitchMask)));
  if (meshMasks.size !== 462) fail(`containment mesh census drift: ${meshMasks.size}`);

  // ---- the licensed edge content (GOVERNS; the anchoring remainder's named component) ----
  const parentOf = buildGoverningParentOf(network.structuralEdges);
  const constructCount = network.structuralEdges.filter((edge) => edge.type === "CONSTRUCTS").length;
  if (constructCount !== 28) fail(`construct edge census drift: ${constructCount}`);

  // ---- intrinsic derivation ------------------------------------------------
  const domain = deriveDomain(ledgerRows);
  const kappaInputs = deriveKappaInputs(ledgerRows);
  const m1 = deriveM1Offices(ledgerRows, domain, parentOf, kappaInputs.C);
  if (m1.governingParents.length !== 7) fail(`governing parent census drift: ${m1.governingParents.length}`);
  const d6ParentCensus = m1.governingParents.map((parent) => ({
    parent,
    satellites: domain.satelliteIds.filter((satellite) => parentOf.get(satellite) === parent),
  }));
  if (d6ParentCensus.some((entry) => entry.satellites.length !== 2)) fail("D6 governing arity drift (expected 2 per parent)");

  const m1SelectionKeys = domain.instanceKeys.filter((key) => {
    const [anchor, satellite] = key.split(":");
    return m1.officeOf.get(anchor) === m1.officeOf.get(satellite);
  });

  const m2T1 = deriveM2D7Offices(ledgerRows, kappaInputs, domain.anchorIds, TRANSIT.T1);
  const m2T2 = deriveM2D7Offices(ledgerRows, kappaInputs, domain.anchorIds, TRANSIT.T2);
  const m2T1D6 = deriveM2D6Transport(ledgerRows, kappaInputs, m1.governingParents, m1.officeOf, TRANSIT.T1);
  const m2T2D6 = deriveM2D6Transport(ledgerRows, kappaInputs, m1.governingParents, m1.officeOf, TRANSIT.T2);

  const m2Field = (d7Offices) => {
    const officeOf = new Map();
    for (const anchor of domain.anchorIds) officeOf.set(anchor, d7Offices.officeById.get(anchor));
    for (const satellite of domain.satelliteIds) officeOf.set(satellite, m1.officeOf.get(parentOf.get(satellite)));
    return officeOf;
  };
  const m2T1OfficeOf = m2Field(m2T1);
  const m2T2OfficeOf = m2Field(m2T2);
  const selectionOf = (officeOf) => domain.instanceKeys.filter((key) => {
    const [anchor, satellite] = key.split(":");
    return officeOf.get(anchor) === officeOf.get(satellite);
  });
  const m2T1SelectionKeys = selectionOf(m2T1OfficeOf);
  const m2T2SelectionKeys = selectionOf(m2T2OfficeOf);

  // ---- comparison-region reads (the evaluation target and the control) -----
  const grantedOfficeIndexById = new Map(ledgerRows.map((row) => [String(row.id), Number(row.officeIndex)]));
  const idByMask = new Map(ledgerRows.map((row) => [maskOfRow(row), String(row.id)]));
  const contactKeys = network.d7SeatContactRows
    .map((row) => `${String(row.target)}:${String(row.source)}`)
    .sort((left, right) => {
      const [la, ls] = left.split(":").map(Number);
      const [ra, rs] = right.split(":").map(Number);
      return la - ra || ls - rs;
    });
  if (contactKeys.length !== 14) fail(`contact census drift: ${contactKeys.length}`);
  const contactSet = new Set(contactKeys);

  // ---- V-D7D-1: domain verification (set-equality against landed domains) --
  const bl068Keys = bl068.census.availabilityDomain.perAnchor
    .flatMap((entry) => entry.instances.map((instance) => instance.key))
    .sort((left, right) => {
      const [la, ls] = left.split(":").map(Number);
      const [ra, rs] = right.split(":").map(Number);
      return la - ra || ls - rs;
    });
  const bl070Keys = bl070.domainDerivation.perAnchor
    .flatMap((entry) => entry.instances.map((satellite) => `${entry.anchor}:${satellite}`))
    .sort((left, right) => {
      const [la, ls] = left.split(":").map(Number);
      const [ra, rs] = right.split(":").map(Number);
      return la - ra || ls - rs;
    });
  const bl068SetEqual = canonicalText(bl068Keys) === canonicalText(domain.instanceKeys);
  const bl070SetEqual = canonicalText(bl070Keys) === canonicalText(domain.instanceKeys);
  if (!bl068SetEqual) fail("derived domain is not set-equal to the BL-068 availability domain");
  if (!bl070SetEqual) fail("derived domain is not set-equal to the BL-070 derived domain");
  const perAnchorCounts = domain.perAnchor.map((entry) => entry.count);
  if (canonicalText(perAnchorCounts) !== canonicalText([4, 5, 6, 6, 6, 5, 4])) fail("per-anchor reach structure drift");
  const allLedgerReach = deriveAllLedgerReach(ledgerRows, domain.anchorIds);
  if (allLedgerReach.some((entry) => entry.count !== 30)) fail("all-ledger reach is not uniform at 30");
  const d6TierReach = deriveTierReach(ledgerRows, domain.anchorIds, "D6");
  const multiplicityBuckets = {};
  for (const state of domain.distinctStates) {
    const bucket = String(domain.multiplicity.get(state));
    multiplicityBuckets[bucket] = (multiplicityBuckets[bucket] ?? 0) + 1;
  }
  if (canonicalText(multiplicityBuckets) !== canonicalText({ "1": 2, "2": 2, "3": 10 })) fail("multiplicity structure drift");

  const domainVerification = {
    definition: "D1: the D7 anchor / D6 satellite partition from the ledger role/tier fields (licensed, labelled); D2: the Hamming-2 reach (masks-only). The granted office field is not read here",
    partition: {
      anchors: domain.anchorIds,
      satellites: domain.satelliteIds,
      anchorCount: domain.anchorIds.length,
      satelliteCount: domain.satelliteIds.length,
      governingCensus: d6ParentCensus,
      governingNote: "the licensed GOVERNS edge content: each D6 satellite has exactly one governing D6 anchor; each D6 governing anchor carries exactly two satellites (14 = 7 x 2)",
    },
    perAnchor: domain.perAnchor.map((entry) => ({ anchor: entry.anchor, instances: entry.instances, count: entry.count })),
    domainSize: domain.instanceKeys.length,
    distinctStates: domain.distinctStates.length,
    multiplicity: multiplicityBuckets,
    calibration: {
      allLedgerReachPerAnchor: allLedgerReach,
      allLedgerReachUniform: allLedgerReach.every((entry) => entry.count === 30),
      d6TierReachPerAnchor: d6TierReach,
      note: "the all-ledger Hamming-2 reach is uniform (30 per anchor); the per-anchor 4/5/6/6/6/5/4 asymmetry is the D6-satellite projection of that uniform reach - the asymmetry is emergent, never an input",
    },
    setEquality: {
      bl068SetEqual,
      bl068DomainSize: bl068.census.availabilityDomain.domainSize,
      bl070SetEqual,
      bl070DomainSize: bl070.domainDerivation.domainSize,
      contactsSubsetOfDerivedDomain: contactKeys.every((key) => domain.instanceKeys.includes(key)),
    },
    nonCircularity: "the domain block reads no office value, no class label, no network record: the partition is role/tier only; set-equality with the landed domains is verified against the fingerprint-self-checked artifacts",
  };

  // ---- V-D7D-2: calibration (R-OFF, granted labels; the control's license) --
  const rOffPredicate = (key) => {
    const [anchor, satellite] = key.split(":");
    return grantedOfficeIndexById.get(anchor) === grantedOfficeIndexById.get(satellite);
  };
  const calibrationConfusion = confusion(domain.instanceKeys, contactSet, rOffPredicate);
  if (!isClean(calibrationConfusion)) {
    fail("calibration failed: the granted office-field rule does not reproduce the 14 contacts on the verified domain - the domain is wrong, not the rule");
  }
  const calibrationKeys = domain.instanceKeys.filter(rOffPredicate);
  if (canonicalText(calibrationKeys) !== canonicalText(contactKeys)) {
    fail("calibration: the office-equality subset is not set-equal to the seat-contact rows");
  }
  const calibration = {
    gate: "V-D7D-2",
    rule: {
      id: "R-OFF",
      expression: "[office(s) = office(h)] on the granted labels",
      region: "comparison (labelled): the granted office field is the calibration target, never a derivation input",
      role: "the control: the rule the kappa-recovered selection must reproduce without granted-office reads",
    },
    actualRelation: {
      source: "canonical/universal-network-data.json d7SeatContactRows (the landed relation; evaluation target)",
      count: contactSet.size,
    },
    confusion: calibrationConfusion,
    verdict: "CLEAN_SPLIT",
    exact: true,
    setEquality: "the office-equality subset of the derived domain is set-equal to the landed seat-contact rows (checked key-by-key)",
    licence: "if R-OFF failed on the verified domain, the domain would be wrong, not the rule",
  };

  // ---- V-D7D-3: the kappa-grounding ----------------------------------------
  const a0Recovered = kappaInputs.a0Rows.map((row) => {
    const id = String(row.id);
    const kappa1 = kappaInputs.kappa.kappa1.get(maskOfRow(row));
    return { id, kappa1, canonical: grantedOfficeIndexById.get(id), match: kappa1 === grantedOfficeIndexById.get(id) };
  });
  const a1Recovered = kappaInputs.midpoints.map((entry) => {
    const id = idByMask.get(entry.child);
    return { id, g1: entry.g1, canonical: grantedOfficeIndexById.get(id), match: entry.g1 === grantedOfficeIndexById.get(id) };
  });
  const a0Matches = a0Recovered.filter((entry) => entry.match).length;
  const a1Matches = a1Recovered.filter((entry) => entry.match).length;
  if (a0Matches !== 7 || a1Matches !== 7) fail("kappa recovery drift against the canonical offices");

  const blockNodeIds = sortedUnique([...domain.anchorIds, ...m1.governingParents, ...domain.satelliteIds]);
  const blockFieldChecks = blockNodeIds.map((id) => ({
    id,
    derived: m1.officeOf.get(id),
    canonical: grantedOfficeIndexById.get(id),
    match: m1.officeOf.get(id) === grantedOfficeIndexById.get(id),
  }));
  const blockFieldMatches = blockFieldChecks.filter((entry) => entry.match).length;
  if (blockFieldMatches !== blockNodeIds.length) fail("M1 derived field disagrees with the canonical offices on the block");

  const d7PoleCheck = (d7Offices) => ({
    agreements: domain.anchorIds.map((id) => ({
      id,
      m1: m1.officeOf.get(id),
      transported: d7Offices.officeById.get(id),
      partner: d7Offices.partnerById.get(id),
      match: d7Offices.officeById.get(id) === m1.officeOf.get(id),
    })),
    agreementCount: domain.anchorIds.filter((id) => d7Offices.officeById.get(id) === m1.officeOf.get(id)).length,
  });
  const m2T1D7Check = d7PoleCheck(m2T1);
  const m2T2D7Check = d7PoleCheck(m2T2);
  if (m2T1D7Check.agreementCount !== 7 || m2T2D7Check.agreementCount !== 7) {
    fail("M2 D7-pole transport disagrees with the anchor rule (mapping-disagreement finding; check R-90-3)");
  }
  const m2T1SelectionConfusion = confusion(domain.instanceKeys, contactSet, (key) => {
    const [anchor, satellite] = key.split(":");
    return m2T1OfficeOf.get(anchor) === m2T1OfficeOf.get(satellite);
  });
  const m2T2SelectionConfusion = confusion(domain.instanceKeys, contactSet, (key) => {
    const [anchor, satellite] = key.split(":");
    return m2T2OfficeOf.get(anchor) === m2T2OfficeOf.get(satellite);
  });
  const m1Confusion = confusion(domain.instanceKeys, contactSet, (key) => {
    const [anchor, satellite] = key.split(":");
    return m1.officeOf.get(anchor) === m1.officeOf.get(satellite);
  });
  const m1SetEqual = canonicalText(m1SelectionKeys) === canonicalText(contactKeys);
  const m2T1SetEqual = canonicalText(m2T1SelectionKeys) === canonicalText(contactKeys);
  const m2T2SetEqual = canonicalText(m2T2SelectionKeys) === canonicalText(contactKeys);
  if (!m1SetEqual) fail("M1 selection is not set-equal to the 14 contacts (kappa-grounding failure; partial branch; report, never force)");
  if (!m2T1SetEqual || !m2T2SetEqual) fail("M2 selection is not set-equal to the 14 contacts (kappa-grounding failure; partial branch; report, never force)");

  const perAnchorContacts = domain.perAnchor.map((entry) => ({
    anchor: entry.anchor,
    contacts: entry.instances.filter((satellite) => contactSet.has(`${entry.anchor}:${satellite}`)),
  }));
  if (perAnchorContacts.some((entry) => entry.contacts.length !== 2)) fail("per-anchor contact census drift");

  const transportBlock = (transportCheck, d7Check, map) => ({
    map: { id: map.id, unit: map.unit, affine: map.expression },
    d7Pole: {
      law: `office(D7 anchor) = ${map.expression} applied to the kappa1(A0 partner)`,
      agreements: d7Check.agreements,
      agreementCount: d7Check.agreementCount,
      statement: `the ${map.id} affine transport reproduces the anchor rule on all seven D7 anchors (7/7) from the kappa1 positions`,
    },
    d6Pole: {
      attempt: `office(D6 governing anchor) = ${map.expression} applied to the g1(A1 partner) (the A1 kappa offices)`,
      rows: transportCheck.rows,
      affineFits: transportCheck.affineFits,
      affineMismatches: transportCheck.affineMismatches,
      swapResolutionMismatches: transportCheck.swapResolutionMismatches,
      statement: transportCheck.affineFits.length === 0
        ? `the A1<->D6 office transport is non-affine (no single y = ax + b fits the seven pairs - the landed BL-089 OP-AR-2 finding, reproduced from the kappa-derived values); the exact defect: the actual transport equals ${map.expression} composed with the source swap of the terminal offices {0, 6} (${transportCheck.swapResolutionMismatches.length === 0 ? "zero residual mismatches" : "residual mismatches remain"}); the affine route terminates at the D6 pole`
        : "the A1<->D6 office transport is affine",
      fallback: "the declared residue: the D6 pole's offices under M2 are the anchor rule values (office = (C - pcSum) mod 7 + governing inherit), identical to M1 on that pole; the M1-vs-M2 difference is exactly the D7-pole derivation",
    },
  });

  const kappaGrounding = {
    gate: "V-D7D-3",
    rule: PRE_REGISTRATION.rule,
    kappaRecovery: {
      p7Endpoints: kappaInputs.p7.endpoints,
      kappa1MatchesCanonical: a0Matches,
      midpointMatchesCanonical: a1Matches,
      orientationConstant: {
        C: kappaInputs.C,
        derivation: "C = (kappa1(mask) + pcSum(mask)) mod 7, constant across all 14 kappa-known anchors; the single orientation constant (BL-063's one named bit)",
      },
      a0Recovered,
      a1Recovered,
      statement: "kappa1 reproduces all seven canonical A0 offices (7/7); the midpoint law reproduces all seven A1 offices (7/7), re-derived masks-only via the imported BL-063 functions; the comparison against the canonical labels is a comparison-region read",
    },
    blockField: {
      nodes: blockNodeIds.length,
      matches: blockFieldMatches,
      checks: blockFieldChecks,
      statement: "the M1-derived office field matches the canonical offices node-by-node on the whole block (7 D7 anchors + 7 D6 governing anchors + 14 D6 satellites); the granted values are read as the comparison target only",
    },
    mappings: {
      M1: {
        id: "M1-anchorRule",
        role: "primary (the Q2 ruling)",
        anchorRule: "office(anchor) = (C - pcSum(mask)) mod 7",
        satelliteRule: "office(satellite) = office(governing anchor) (the licensed GOVERNS edge content)",
        orientationConstant: kappaInputs.C,
        anchorRuleRows: m1.anchorRuleRows,
        selection: { keys: m1SelectionKeys, confusion: m1Confusion, setEqual: m1SetEqual },
      },
      M2: {
        id: "M2-affineTransport",
        role: "cross-check (the Q2 ruling)",
        source: "the BL-089 OP-AR-2 D7<->A0 affine laws applied to the kappa1 positions",
        T1: transportBlock(m2T1D6, m2T1D7Check, TRANSIT.T1),
        T2: transportBlock(m2T2D6, m2T2D7Check, TRANSIT.T2),
        selection: {
          T1: { keys: m2T1SelectionKeys, confusion: m2T1SelectionConfusion, setEqual: m2T1SetEqual },
          T2: { keys: m2T2SelectionKeys, confusion: m2T2SelectionConfusion, setEqual: m2T2SetEqual },
        },
      },
    },
    verdict: "BOTH",
    verdictStatement: "both mappings reproduce the 14 contacts set-equal (14/0/0/22): the kappa-grounding is over-determined on the D7 pole (the anchor rule and the T1/T2 affine transports agree 7/7 there); the one structural non-equivalence in the kappa-coordinate system is the D6 pole's A1 transport (non-affine; the exact defect characterized: the route-affine law composed with the terminal-office source swap {0, 6}); the D6 pole is carried by the anchor rule under both mappings (the declared residue), so the selection derivation is a function of masks + the licensed partition/edge content + kappa alone",
    perAnchorContacts,
  };

  // ---- controls (midpoint infrastructure; the Z-interface guard; Q1 ruling) --
  const subnodesByMask = new Map(Object.values(mesh.heptatonicNodes).map((node) => [String(node.pitchMask), node.subnodes]));
  const pentatonicById = mesh.pentatonicSubnodes;
  const satelliteSigns = new Map(domain.satelliteIds.map((state) => [state, signOfMask(domain.maskById.get(state), mesh, subnodesByMask, pentatonicById)]));
  const zConfusion = confusion(domain.instanceKeys, contactSet, (key) => satelliteSigns.get(key.split(":")[1]) < 0);
  const bl068ZAxis = bl068.axes.find((axis) => axis.axis === "zInterface");
  if (canonicalText(zConfusion) !== canonicalText(bl068ZAxis.confusion)) fail("Z-interface control disagrees with the landed BL-068 axis");
  const zMajorityStates = domain.satelliteIds.filter((state) => satelliteSigns.get(state) < 0);
  const controls = {
    midpoint: {
      role: "infrastructure (context), never a candidate (the Q1 ruling)",
      statement: "the midpoint law midZ7(c - 1, c + 1) = c (BL-064's coordinate rule read backward) builds the A1 parent pairs; the kappa recovery re-verifies the A1 midpoints 7/7 against the canonical offices; it does not select",
    },
    zInterface: {
      id: "R-Z",
      expression: "[the satellite's Z-majority sign is negative] (recomputed from the containment mesh with the BL-060/061 method)",
      region: "control (labelled): the mesh is read here, never in the derivation path",
      confusion: zConfusion,
      verdict: "NON_SEPARATING",
      landedMatch: "field-for-field against the landed BL-068 zInterface axis",
      zMajorityStates,
      statement: "the Z-interface guard confirms the landed NON_SEPARATING reading on the verified domain (4/2/10/20; only 4/14 contact states are Z-majority); it documents the rejected route and is never promoted on any outcome",
    },
  };

  // ---- discovery (un-promoted; branch-effect none) --------------------------
  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const d7Orbit = [];
  let cursor = domain.anchorIds[0];
  for (let step = 0; step < 7; step += 1) {
    d7Orbit.push(cursor);
    const next = successor.get(cursor);
    if (!next) fail(`modal orbit dead-end at ${cursor}`);
    cursor = next;
  }
  if (cursor !== domain.anchorIds[0]) fail("modal orbit does not close");
  const d6AnchorOrbit = network.sevenEightOrbit.map(String);
  if (d6AnchorOrbit.length !== 7) fail(`D6 anchor orbit census drift: ${d6AnchorOrbit.length}`);
  if (canonicalText(sortedUnique(d6AnchorOrbit)) !== canonicalText(sortedUnique(m1.governingParents))) {
    fail("D6 governing-parent set is not set-equal to the landed D6 anchor orbit");
  }
  const orbitStepHolds = (order, officeOf) => order.every((id, index) => {
    const next = order[(index + 1) % order.length];
    return ((officeOf.get(next) - officeOf.get(id)) + 14) % 7 === 2;
  });
  const d7OrbitStep = orbitStepHolds(d7Orbit, m1.officeOf);
  const d6OrbitStep = orbitStepHolds(d6AnchorOrbit, m1.officeOf);
  const orbitAlignedEquality = d7Orbit.every((id, index) => m1.officeOf.get(id) === m1.officeOf.get(d6AnchorOrbit[index]));
  const orbitIndex = new Map();
  d7Orbit.forEach((id, index) => orbitIndex.set(id, index));
  d6AnchorOrbit.forEach((id, index) => orbitIndex.set(id, index + 100));
  const orbitPredicate = (key) => {
    const [anchor, satellite] = key.split(":");
    return orbitIndex.get(anchor) === orbitIndex.get(parentOf.get(satellite)) - 100;
  };
  const orbitConfusion = confusion(domain.instanceKeys, contactSet, orbitPredicate);
  const discovery = {
    id: "D-90-1",
    status: "UNPROMOTED_DISCOVERY",
    branchEffect: "none - the branch classification uses the pre-registered gates only; a promotion would be a new decision (the OD-66-2 / OD-70-5 mechanism bar)",
    orbitAlignment: {
      d7Orbit,
      d6AnchorOrbit,
      pairing: "position-wise (index k <-> index k), from the cycle ground's landed orders",
      d7Offices: d7Orbit.map((id) => m1.officeOf.get(id)),
      d6AnchorOffices: d6AnchorOrbit.map((id) => m1.officeOf.get(id)),
      officeSequencesEqual: orbitAlignedEquality,
      d7OrbitStepHolds: d7OrbitStep,
      d6OrbitStepHolds: d6OrbitStep,
      orbitPredicateConfusion: orbitConfusion,
      statement: "the D7 orbit and the D6 governing-anchor orbit, paired position-wise from the cycle ground, carry identical +2 office cycles; the contact relation admits the orbit-position restatement (contact iff the D7 anchor and the satellite's governing anchor sit at the same orbit position; 14/0/0/22, equivalent to the office-purity predicate on the block); recorded un-promoted",
    },
  };

  // ---- V-D7D-4: isolation (the region-scoped enforcement block) ------------
  const isolation = {
    regime: "region-scoped",
    intrinsicRegion: "the marked INTRINSIC-DERIVATION region: the D1 partition (role/tier fields), the pitch sets, the masks, the licensed GOVERNS edge content, and the kappa functions (imported verbatim, masks-only); the M1/M2 machinery is defined here",
    comparisonRegion: "the labelled region after the intrinsic markers: the granted office values (comparison target and R-OFF control), the seat-contact rows (evaluation target), the cycle-ground orders (discovery), the containment mesh (the Z control), and the landed artifact reads",
    officeBytesInDerivationPath: 0,
    officeReads: [
      "the granted office values (comparison target; node-by-node and selection comparisons)",
      "the R-OFF calibration predicate (comparison-region control)",
      "the kappa recovery comparisons against the canonical offices (comparison)",
      "the Z control (the mesh, not the office field)",
      "the chain-artifact reads (fingerprint self-checked)",
    ],
    statements: [
      "the derivation path (domain construction + kappa + the M1/M2 offices + the selection) reads zero granted-office bytes: no office index, no office field, no relational office in the intrinsic region",
      "R-OFF is the calibration control, never the primary derivation: it reproduces the 14 contacts by definition and is licensed only as the regression the kappa-grounded selection must match",
      "the region-scoping proof: the validator's static check requires the forbidden office tokens to be absent from the intrinsic region and present in the comparison region - a file-scoped scan is rejected by construction",
    ],
    validatorDiscipline: "two-sided: smuggled office/class/network reads injected into the intrinsic region are rejected; a permissive probe injected into the comparison region is not rejected; a strip of the comparison-region office read is rejected (the region-scoping proof fails)",
  };

  // ---- gates ----------------------------------------------------------------
  const domainGatePass = domain.instanceKeys.length === 36 && bl068SetEqual && bl070SetEqual;
  const selectionGatePass = m1SetEqual && m2T1SetEqual && m2T2SetEqual;
  const gates = {
    "V-D7D-1": {
      result: domainGatePass ? "PASS" : "FAIL",
      statement: "domain verification: the D1 role/tier partition + the D2 Hamming-2 reach re-derive the 36-instance domain (per-anchor 4/5/6/6/6/5/4, 14 distinct states, multiplicities 2/2/10); set-equal to the landed BL-068 availability domain and the landed BL-070 derived domain key-by-key; the calibration control: the all-ledger reach is uniform at 30 per anchor",
    },
    "V-D7D-2": {
      result: "PASS",
      statement: "calibration: R-OFF on the granted labels reproduces the 14 landed contacts exactly on the verified domain (14/0/0/22; the office-equality subset set-equal to the seat-contact rows); the control's license holds - a calibration failure would mean the domain is wrong, not the rule",
    },
    "V-D7D-3": {
      result: selectionGatePass ? "PASS" : "FAIL",
      statement: selectionGatePass
        ? "kappa-grounding: the selection computed on the kappa-recovered field produces the 14 contacts set-equal (14/0/0/22) under M1 (anchorRule) and M2 (affine transport, T1 and T2 routes); zero granted-office bytes in the derivation path; the kappa-verdict is BOTH (over-determined on the D7 pole); the D6 pole's affine termination is characterized and the declared residue (the anchor rule) carries it"
        : "kappa-grounding FAILED: neither mapping reproduces the 14 contacts; the partial branch fires (report, never force)",
    },
    "V-D7D-4": {
      result: "PASS",
      statement: "input isolation: region-scoped enforcement - zero granted-office bytes in the derivation path; the M1/M2 machinery is defined inside the statically checked intrinsic region; smuggled-read probes rejected; the comparison-region permissive probe passes and the region-scoping proof holds; the granted office field is read only as the comparison target and the R-OFF control",
    },
    "V-D7D-5": {
      result: "PASS",
      statement: "accounting: the three tiers (masks-only / canonical-computation labelled / remaining granted) are complete and honest; the office field appears only as the comparison target, the calibration control, and the remaining-granted tier",
    },
  };

  // ---- branch classification (pre-registered labels) ------------------------
  const branchLabel = !domainGatePass ? "NO_DERIVATION" : selectionGatePass ? "FULL_DERIVATION" : "PARTIAL_DERIVATION";
  const branch = {
    preRegisteredLabels: ["FULL_DERIVATION", "PARTIAL_DERIVATION", "NO_DERIVATION"],
    criteria: PRE_REGISTRATION.branchCriteria,
    gateResults: {
      "V-D7D-1": gates["V-D7D-1"].result,
      "V-D7D-2": gates["V-D7D-2"].result,
      "V-D7D-3": gates["V-D7D-3"].result,
      "V-D7D-4": gates["V-D7D-4"].result,
      "V-D7D-5": gates["V-D7D-5"].result,
    },
    label: branchLabel,
    statement: branchLabel === "FULL_DERIVATION"
      ? "FULL_DERIVATION: the ti-pole's contact relation derives on the verified 36-instance domain from masks + the licensed tier/role partition and GOVERNS edge content + the kappa-recovered office field: the selection is set-equal to the 14 landed contacts (14/0/0/22) under the anchor rule (M1) and under the affine-transport cross-check (M2, T1 and T2 routes); the granted office labels never enter the derivation path. The D7 amendment question is noted as open (no amendment in this sprint; D7 hypothesis-tier preserved)"
      : branchLabel === "PARTIAL_DERIVATION"
        ? "PARTIAL_DERIVATION: the domain derives masks-only; the selection does not derive from kappa under either mapping: the office field is granted-dependent; the anchoring remainder's sharpest instance; the GSL-3 asymmetry deepened (different predicates with different grounding requirements)"
        : "NO_DERIVATION: the domain itself does not re-derive masks-only, or the calibration failed",
    classificationDiscipline: "the label is a classification against the pre-registered gate list; the rule set was frozen before computation; no unregistered hunting on failure",
  };

  const interpretation = {
    branches: [
      { label: "FULL_DERIVATION", fired: branchLabel === "FULL_DERIVATION", statement: "the ti-pole's selection is derivable through the recovered coordinates: the asymmetry is fully explained at hypothesis-tier (different predicates over different domain multiplicities, both derivable through their native geometries - the fa-pole's class predicate via the D4 corridor's R2, the ti-pole's office-purity predicate via the kappa-recovered field); the D7 amendment question opens (no amendment in this sprint)" },
      { label: "PARTIAL_DERIVATION", fired: branchLabel === "PARTIAL_DERIVATION", statement: "the ti-pole's selection is office-field-dependent, confirmed by a kappa-grounded attempt: the anchoring remainder's sharpest instance (the office field necessary, not just sufficient) plus the GSL-3 asymmetry confirmation (different predicates with different grounding requirements) - the OD-90-3 framing, carried pre-registered" },
      { label: "NO_DERIVATION", fired: branchLabel === "NO_DERIVATION", statement: "the D7 contact relation is the framework's most granted-dependent structure; the anchoring remainder irreducible at the D7 layer; the un-granting program's boundary drawn here" },
    ],
    fired: branchLabel,
    partialFramingCarried: "OD-90-3 (the Q3 ruling): the partial framing (the remainder's sharpest instance + the GSL-3 asymmetry confirmation) is pre-registered and fires only on the partial branch; it did not fire",
    statement: branchLabel === "FULL_DERIVATION"
      ? "the fired branch is FULL_DERIVATION: the selection generates from the masks + the licensed remainder + kappa; the granted office field is a comparison target only. The result completes the fa/ti derivation-status pair at hypothesis-tier: both poles' selections are derived through their native geometries; the ti-pole's native predicate (office-purity) is grounded in the recovered coordinates"
      : branchLabel === "PARTIAL_DERIVATION"
        ? "the fired branch is PARTIAL_DERIVATION: the anchoring remainder's sharpest instance + the GSL-3 asymmetry confirmation (carried pre-registered, OD-90-3)"
        : "the fired branch is NO_DERIVATION: the remainder is irreducible at the D7 layer",
  };

  // ---- accounting -----------------------------------------------------------
  const accounting = {
    masksOnly: [
      "domain construction D1+D2: the role/tier partition's Hamming-2 reach - 36 instances, per-anchor 4/5/6/6/6/5/4 (emergent), 14 distinct states, multiplicities 2/2/10; set-equal to the landed BL-068 and BL-070 domains",
      "the calibration reach census (all-ledger uniform 30; the D6-tier projection)",
      "kappa via the imported masks-only BL-063 functions (P7, positions, constructors, midpoints) and the orientation constant C from the masks",
      "the M1 anchor rule arithmetic ((C - pcSum) mod 7) and the governing inheritance (over the licensed edge content)",
      "the M2 affine transport arithmetic (the T1/T2 D7-pole laws from the kappa1 positions) and the D6-transport attempt arithmetic",
      "the selection predicates, the confusion arithmetic, and the orbit (-step) verification",
    ],
    canonicalComputation: [
      "the D1 partition itself: the ledger's role/tier fields (canonical-read, labelled)",
      "the GOVERNS edge content (the licensed remainder edge content; labelled; GOV-524/525's derived-up-to-remainder class)",
      "the granted office values: read as the comparison target (node-by-node, selection-level) and as the R-OFF calibration control, never in the derivation path",
      "the seat-contact rows: the evaluation target only",
      "the cycle-ground orders (the modal orbits): the discovery-block restatement only",
      "the containment mesh: the Z control only; the chain artifacts: fingerprint self-checked",
    ],
    remainingGranted: [
      "the tier/role partition and the GOVERNS edge content (the anchoring remainder itself; GOV-524/525)",
      `the one orientation constant C = ${kappaInputs.C} (kappa's named bit; BL-063/BL-065; resolved by the M1 comparison)`,
      "presentation conventions; the frame vocabulary (never a design input)",
    ],
    statement: branchLabel === "FULL_DERIVATION"
      ? "the selection derives from the masks + the licensed partition/edge content + kappa: the kappa-recovered field reproduces the 14 contacts set-equal under both mappings; the granted office field's role is exactly comparison target + control. The derivation's content beyond this class is zero within the sprint's scope; the remaining granted content is the partition/edge remainder, the orientation bit, and presentation conventions"
      : "the selection does not fully derive; the mismatches name the remainder content",
    officePathFence: "the derivation path reads zero granted office bytes: the field is built from masks, the licensed GOVERNS edge content, and kappa; the granted office field enters only as the comparison target and the R-OFF control (validator-enforced two-region static check)",
  };

  // ---- grounding receipt ----------------------------------------------------
  const grounding = {
    receipt: [
      { claim: "the canonical ledger: 462 records; the tier/role partition 70 anchors + 238 satellites + 154 boundary; the pitch sets derive the identity masks (byte-stable)", source: `${LEDGER_PATH} (sha256 ${fileSha(LEDGER_PATH)})`, verdict: "GROUNDED (EXACT)" },
      { claim: "the network: GOVERNS 238 edges (14 for the D7/D6 block), CONSTRUCTS 28; d7SeatContactRows 14 (the evaluation target); d7ModalRows 7 and sevenEightOrbit 7 (the cycle ground)", source: `${NETWORK_PATH} (sha256 ${fileSha(NETWORK_PATH)})`, verdict: "GROUNDED (EXACT)" },
      { claim: "BL-063: CONSTRAINED_TO_REFLECTION; kappa1 reproduces the 7 canonical A0 offices; the midpoint law reproduces the A1 offices; the P7 line and the one orientation bit", source: `${BL063_PATH} (fingerprint ${bl063Fingerprint}) + masks-only re-derivation via the imported functions`, verdict: "GROUNDED (EXACT)" },
      { claim: "BL-064: CYCLE_GROUND_DERIVED; the 14 directed CONSTRUCTS edges derived masks-only, set-equal the granted projection", source: `${BL064_PATH} (fingerprint ${bl064Fingerprint})`, verdict: "GROUNDED (EXACT; fingerprint)" },
      { claim: "BL-066: R_EDGES_DERIVED; the 28 directed R edges derived masks-only, set-equal; office alignment 28/28 under kappa1", source: `${BL066_PATH} (fingerprint ${bl066Fingerprint})`, verdict: "GROUNDED (EXACT; fingerprint)" },
      { claim: "BL-068: DIFFERENT_PREDICATES (GSL-3); the ti-pole availability domain 36 = 14 + 22; the office-linking axis CLEAN_SPLIT 14/0/0/22; the Z-interface NON_SEPARATING 4/2/10/20; the class predicate RESTATEMENT 14/22/0/0; INVARIANTS_OBEYED (pole-universal)", source: `${BL068_PATH} (fingerprint ${bl068Fingerprint})`, verdict: "GROUNDED (EXACT; fingerprint; the Z axis re-verified field-for-field here)" },
      { claim: "BL-070: PARTIAL_DERIVATION; V-D7-1 PASS / V-D7-2 FAIL; the nine mask-geometric selectors R-NONE; the near-miss 12/0/2/22; the recorded obstructions (the modal orbit closes modally M(4033) = 127; the domain-class restatement 14/14 = U; the per-anchor non-uniformity as the projection of the uniform 30-reach)", source: `${BL070_PATH} (fingerprint ${bl070Fingerprint})`, verdict: "GROUNDED (EXACT; fingerprint)" },
      { claim: "BL-078: the re-test REPLICATED; R-NONE confirmed under region-scoped isolation; R-OFF 14/0/0/22 on the re-verified 36-instance domain", source: `${BL078_PATH} (fingerprint ${bl078Fingerprint})`, verdict: "GROUNDED (EXACT; fingerprint)" },
      { claim: "BL-089: INTERACTION_DERIVED; the anchor rule 70/70; the satellite rule 238/238; the D7<->A0 transports affine (T1 y = 5x + 2; T2 y = 2x + 4); the D6<->A1 transports non-affine; the +2 orbit step 10/10; the remainder shrinks to the partition/edge content + the orientation bit + conventions", source: `${BL089_PATH} (fingerprint ${bl089Fingerprint})`, verdict: "GROUNDED (EXACT; fingerprint)" },
      { claim: "the 36-instance domain: re-derived here (D1+D2, masks-only) and set-equal to the BL-068 availability domain and the BL-070 derived domain key-by-key", source: "this artifact's domainVerification (V-D7D-1)", verdict: "GROUNDED (EXACT; halt-checked)" },
      { claim: "the 14 contacts' subset status: the seat-contact rows are a subset of the derived domain; the granted-office-equality subset is set-equal to them (14/0/0/22)", source: `${NETWORK_PATH} d7SeatContactRows + the granted office field (comparison); this artifact's calibration (V-D7D-2)`, verdict: "GROUNDED (EXACT)" },
      { claim: "the kappa-recovered coordinates reproduce the canonical offices on the block (7/7 A0 positions; 7/7 A1 midpoints; 28/28 block nodes)", source: "this artifact's kappaGrounding (comparison reads against the granted labels)", verdict: "GROUNDED (EXACT)" },
      { claim: "the pole-universal invariants: inversion pairing (7 whole pairs, sums 6) and the cross-office structure on the ti-pole domain (BL-068/BL-078 replicated)", source: `${BL068_PATH} + ${BL078_PATH} (fingerprints above)`, verdict: "GROUNDED (EXACT; the domain re-verified here)" },
    ],
    calibration: {
      domain: "EXACT (V-D7D-1; set-equal BL-068 + BL-070)",
      calibration: `R-OFF ${calibrationConfusion.tp}/${calibrationConfusion.fp}/${calibrationConfusion.fn}/${calibrationConfusion.tn}`,
      kappaRecovery: "kappa1 7/7; A1 midpoints 7/7; C = " + kappaInputs.C,
      m1: `selection set-equal; ${m1Confusion.tp}/${m1Confusion.fp}/${m1Confusion.fn}/${m1Confusion.tn}`,
      m2: `T1 and T2 selections set-equal; D7-pole agreements 7/7 each; D6 transport non-affine (defect characterized)`,
      controls: `zInterface NON_SEPARATING ${zConfusion.tp}/${zConfusion.fp}/${zConfusion.fn}/${zConfusion.tn} (BL-068 match)`,
      discovery: "orbit alignment recorded un-promoted (D-90-1)",
    },
  };

  // ---- synthesis ------------------------------------------------------------
  const synthesis = {
    verdict: branchLabel,
    kappaGroundingVerdict: kappaGrounding.verdict,
    result: branchLabel === "FULL_DERIVATION"
      ? "the ti-pole's contact relation derives on the verified 36-instance domain from masks + the licensed tier/role partition and GOVERNS edge content + the kappa-recovered office field: the selection is set-equal to the 14 landed contacts (14/0/0/22) under the anchor rule (M1) and under the affine-transport cross-check (M2, T1 and T2 routes); zero granted-office bytes in the derivation path"
      : branchLabel === "PARTIAL_DERIVATION"
        ? "the domain derives masks-only; the selection requires the office field: the partial branch fired (the anchoring remainder's sharpest instance + the GSL-3 asymmetry confirmation)"
        : "neither the domain nor the selection derives: the anchoring remainder is irreducible at the D7 layer",
    findings: [
      `the kappa-recovered field reproduces the canonical offices on the block (28/28): the selection's values are the recovered coordinates, not the granted labels`,
      `the selection (office-purity on the kappa-recovered field) generates the 14 contacts from the 36-instance domain: set-equal under M1 and M2 (14/0/0/22); the BL-070 R-NONE attempt's office-field-dependency is resolved at the values level: the field's content is kappa-derivable on the block`,
      "the kappa-verdict is BOTH: over-determined on the D7 pole (the anchor rule and the T1/T2 affine transports agree 7/7); the D6 pole's A1 transport is non-affine (the defect: the route-affine law composed with the terminal-office source swap {0, 6}) and the D6 pole is carried by the anchor rule (the declared residue)",
      `the fa/ti derivation-status pair (hypothesis-tier): the fa-pole's selection is carried by its class predicate (the D4 corridor's R2, ENTRY 15) and the ti-pole's by the office-purity predicate grounded in the recovered coordinates; the asymmetry's mechanism (different predicates over different domain multiplicities, GSL-3) now carries both predicates' derivability status - no granted-label dependency remains at the selection level within this sprint's scope`,
      "the calibration control R-OFF and the Z guard re-verified the landed readings on the verified domain (14/0/0/22; 4/2/10/20)",
    ],
    significance: "the un-granting program's D7 capstone at hypothesis-tier: Phase 1 recovered the coordinates, Phase 2 the cycle ground, Phase 3 the R-edges, BL-089 the interaction structure - this derivation lands the last piece: the ti-pole's selection generates from the recovered coordinates and the licensed remainder, with the granted office field demoted to comparison target and control. The D7 amendment question is noted as open (no amendment in this sprint); no claim event",
    d7Tier: "D7 remains hypothesis-tier: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim",
  };

  // ---- fences and bounded non-accomplishments ------------------------------
  const fences = {
    d7HypothesisTier: "D7 hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
    noGovernsAdmission: "no GOVERNS admission; no new GSL number; no registration; the characterization is planning evidence",
    noClaimEvent: "no claim event; no record amendment (ENTRY 10/15/16/17/18/19/20/21 byte-untouched)",
    noMechanism: "no mechanism (causal) claim beyond the branch verdict: the selection's derivability is characterized, not causally explained; production questions stay open",
    noLeaning: "no leaning: no claim, admission, or corridor movement may cite this derivation; the D7 amendment question is noted as open, never opened here",
    noG1: "no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment",
    noWrites: "no canonical/Court/schema/Neo4j writes; all sources read-only",
    membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary, never a derivation input",
    sessionProse: "session prose is context, not evidence",
    officeFieldDiscipline: "the office field enters only through the kappa-recovered coordinates, never through the granted office labels; any granted-office read in the derivation path is a halt (V-D7D-4, region-scoped)",
    failLoud: "any mismatch with a landed artifact was a halt, not a finding (V-D7D-1/V-D7D-2 field-for-field; the Z control field-for-field against BL-068); the kappa-grounding failure path (partial) was pre-registered and did not fire",
  };

  const contractCitations = [
    "provenance/DECISION_LEDGER.md:2665-2810 (ENTRY 15: the D4 record amendment, status record_amended (derivable-via-R2))",
    "provenance/DECISION_LEDGER.md:2703-2712 (ENTRY 15 D7 clause: 0/14, 14/14 = U = O, cycle-twin 0/7; D7 hypothesis-tier preserved)",
    "provenance/DECISION_LEDGER.md:3130-3230 (ENTRY 18: the D4 record amendment, derivable-from-derived-inputs)",
    "scrum/BACKLOG.md:685-690 (the ENTRY 15 landing record; derivable-via-R2)",
    "orrery/src/generated/bl063-office-reconstruction.v1.json (kappa; the P7 line; the midpoint law; the one orientation bit; fingerprint self-checked)",
    "orrery/src/generated/bl064-cycle-ground.v1.json (the cycle ground; fingerprint self-checked)",
    "orrery/src/generated/bl066-r-edge-derivation.v1.json (the R-edges derived masks-only; fingerprint self-checked)",
    "orrery/src/generated/bl068-d7-asymmetry.v1.json (GSL-3; the ti-pole domain 36 = 14 + 22; the office-linking axis; the Z axis; the invariants; fingerprint self-checked)",
    "orrery/src/generated/bl070-d7-derivation.v1.json (PARTIAL_DERIVATION; the nine mask-geometric selectors R-NONE; the near-miss; the recorded obstructions; fingerprint self-checked)",
    "orrery/src/generated/bl078-d7-retest.v1.json (R-OFF 14/0/0/22; REPLICATED; the region-scoped isolation precedent; fingerprint self-checked)",
    "orrery/src/generated/bl089-anchoring-remainder-interaction.v1.json (INTERACTION_DERIVED; the anchor/satellite rules; the affine transports; the licensed-input class; fingerprint self-checked)",
    "scrum/plan/bl-068-d7-asymmetry-memo.md (GSL-3; the office-linking clean split; the modal remainder)",
    "scrum/plan/bl-070-d7-derivation-memo.md (the attempt's findings; the tie-break disclosure; OD-70-5/OD-70-6)",
    "scrum/plan/bl-089-anchoring-remainder-interaction-memo.md (the interaction's derivation; the remainder's named residual)",
    "canonical/universal-heptatonic-ledger.csv (masks, tier/role partition; the granted office field as comparison target)",
    "canonical/universal-network-data.json (GOVERNS edge content; seat contacts as evaluation target; the cycle-ground orders)",
    "derived/hypergraph/bipartite-inclusion-v1.json (the containment mesh; the Z control only)",
  ];

  const notAccomplished = [
    "no D7 claim event; no D7 record amendment; no D7 derivation admission (hypothesis-tier preserved, ENTRY 15's clause unchanged); the D7 amendment question is noted as open, never opened",
    "no GOVERNS admission; no new GSL number; no registration; no derivation admission of any kind",
    "no G1 movement; no INV-5 graduation; no M-walkability promotion; no directional-semantics assignment",
    "no canonical/Court/schema/Neo4j writes; no ledger writes; no claim event of any kind",
    "no new measurement: masks-only arithmetic and re-derivation over landed bytes (the descriptive-read class); the allowed reads are the licensed partition/edge content and the comparison targets",
    "no mechanism (causal) claim beyond the branch verdict; the discovery block is recorded un-promoted (D-90-1; branch-effect none)",
    "no lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence",
  ];

  // ---- assembly --------------------------------------------------------------
  const core = {
    schemaVersion: SCHEMA_VERSION,
    derivationId: DERIVATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl090-d7-office-purity-derivation.mjs",
    role: "the D7 office-purity derivation: the ti-pole's selection (office-purity) grounded in the kappa-recovered coordinates - the derivation consumes the recovered kappa and the licensed remainder and generates the 14 contacts from the 36-instance domain; planning evidence, D7 hypothesis-tier",
    preRegistration: PRE_REGISTRATION,
    method: {
      domain: "D1: the D7 anchor / D6 satellite partition from the ledger role/tier fields (licensed, labelled); D2: the Hamming-2 reach (masks-only): 36 instances",
      rule: "R-kappa(h) = {(h, s) : s in D2(h) and o_kappa(s) = o_kappa(h)}; the same form as the D4 corridor's R2 = satellites(h) and P(s)",
      mappings: "M1 (primary): anchorRule + governing inherit; M2 (cross-check): the T1/T2 affine transports from the kappa1 positions; the D6 pole's affine termination characterized and the declared residue (the anchor rule) carries it",
      codeReuse: "kappa functions imported verbatim from scripts/build-bl063-office-reconstruction.mjs (the masks-only P7/kappa/pi/midpoint functions); the chain artifacts are consumed by fingerprint self-check (no literals)",
      descriptiveRead: "analysis over landed bytes (masks-only reach arithmetic + the licensed partition/edge content); no new universe, no new witness discovery; the BL-070/BL-086 descriptive-read class",
    },
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record universe: the tier/role partition, pitch sets, masks; the granted office field as comparison target" },
      { artifact: NETWORK_PATH, sha256: fileSha(NETWORK_PATH), role: "GOVERNS edge content (licensed remainder); seat contacts (evaluation target); the cycle-ground orders (discovery)" },
      { artifact: MESH_PATH, sha256: fileSha(MESH_PATH), role: "the containment mesh (the Z control only)" },
      { artifact: BL063_PATH, sha256: fileSha(BL063_PATH), role: "chain anchor: kappa (the imported masks-only functions; the orientation constant); fingerprint self-check" },
      { artifact: BL064_PATH, sha256: fileSha(BL064_PATH), role: "chain anchor: the cycle ground (program context); fingerprint self-check" },
      { artifact: BL066_PATH, sha256: fileSha(BL066_PATH), role: "chain anchor: the R-edges (program context); fingerprint self-check" },
      { artifact: BL068_PATH, sha256: fileSha(BL068_PATH), role: "chain anchor: the ti-pole domain and axes (the Z control target); fingerprint self-check" },
      { artifact: BL070_PATH, sha256: fileSha(BL070_PATH), role: "chain anchor: the PARTIAL context and the recorded obstructions; fingerprint self-check" },
      { artifact: BL078_PATH, sha256: fileSha(BL078_PATH), role: "chain anchor: R-OFF 14/0/0/22 (the calibration precedent); fingerprint self-check" },
      { artifact: BL089_PATH, sha256: fileSha(BL089_PATH), role: "chain anchor: the interaction structure and the affine transports (the license); fingerprint self-check" },
    ],
    base: {
      chainFingerprints: {
        bl063: bl063Fingerprint,
        bl064: bl064Fingerprint,
        bl066: bl066Fingerprint,
        bl068: bl068Fingerprint,
        bl070: bl070Fingerprint,
        bl078: bl078Fingerprint,
        bl089: bl089Fingerprint,
      },
      importPolicy: "the chain artifacts are consumed by fingerprint self-check (no literals in this generator); the kappa functions are imported verbatim from the BL-063 generator (masks-only); no landed artifact is rewritten",
    },
    grounding,
    domainVerification,
    calibration,
    kappaGrounding,
    controls,
    discovery,
    isolation,
    gates,
    branch,
    interpretation,
    accounting,
    synthesis,
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
    domain: `${investigation.domainVerification.domainSize} instances, per-anchor ${investigation.domainVerification.perAnchor.map((entry) => entry.count).join("/")}, distinct ${investigation.domainVerification.distinctStates}; set-equal BL-068 + BL-070`,
    calibration: `R-OFF ${investigation.calibration.confusion.tp}/${investigation.calibration.confusion.fp}/${investigation.calibration.confusion.fn}/${investigation.calibration.confusion.tn} (${investigation.calibration.verdict})`,
    M1: `${investigation.kappaGrounding.mappings.M1.selection.confusion.tp}/${investigation.kappaGrounding.mappings.M1.selection.confusion.fp}/${investigation.kappaGrounding.mappings.M1.selection.confusion.fn}/${investigation.kappaGrounding.mappings.M1.selection.confusion.tn} set-equal ${investigation.kappaGrounding.mappings.M1.selection.setEqual}`,
    M2: `T1 set-equal ${investigation.kappaGrounding.mappings.M2.selection.T1.setEqual}; T2 set-equal ${investigation.kappaGrounding.mappings.M2.selection.T2.setEqual}`,
    kappaVerdict: investigation.kappaGrounding.verdict,
    d7PoleAgreements: `T1 ${investigation.kappaGrounding.mappings.M2.T1.d7Pole.agreementCount}/7; T2 ${investigation.kappaGrounding.mappings.M2.T2.d7Pole.agreementCount}/7`,
    d6Transport: `affine fits ${investigation.kappaGrounding.mappings.M2.T1.d6Pole.affineFits.length}; swap06 resolution ${investigation.kappaGrounding.mappings.M2.T1.d6Pole.swapResolutionMismatches.length === 0 ? "exact" : "residual"}`,
    controls: `zInterface ${investigation.controls.zInterface.confusion.tp}/${investigation.controls.zInterface.confusion.fp}/${investigation.controls.zInterface.confusion.fn}/${investigation.controls.zInterface.confusion.tn}`,
    discovery: `${investigation.discovery.id} ${investigation.discovery.status}`,
    branch: investigation.branch.label,
    gates: investigation.branch.gateResults,
    derivationFingerprint: investigation.derivationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL090_D7_OFFICE_PURITY_DERIVATION");
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
