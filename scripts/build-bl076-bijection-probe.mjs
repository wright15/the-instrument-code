#!/usr/bin/env node
/**
 * Build the BL-076 coordinate-covariant bijection probe: apply the Klein-4
 * coordinate maps (T1 = x -> 5x, T2 = x -> 7x, rho = x -> 11x; the identity
 * as control) to the ten anchor families' masks and measure the induced
 * family and office permutation tables; verify whole-block action,
 * ledger-absent handling, the composition consistency with the Klein-4
 * multiplication, the interval structure of the pairing, and the pole
 * crossing. Planning, read-only analysis.
 *
 * Pre-registered planning pass (rulings OD-76-1..OD-76-4, approved
 * 2026-10-12): the A-tier test reports both family and office sub-tables; a
 * ledger-absent image is a fail-loud block outcome; the artifact is
 * standalone, chain-anchored by fingerprint; the finding tier and the claim
 * scope are conditionally pre-authorized. The measurement is family-level
 * (the coordinate maps send D-tier families to A-tier or D-tier families);
 * the per-tier unanimity is the whole-mapping verification, not the
 * hypothesis itself.
 *
 * Structure:
 *   probe          - the map catalog, the anchor census, the family and
 *                    office permutation tables, the anchor images, the
 *                    fragment/absent audit, the composition consistency,
 *                    the interval structure of the pairing, the crossing
 *   finding        - the measured tier of the covariance result
 *   branch         - the computed verdict
 *   crossChecks    - fingerprint self-checks and key-for-key comparisons
 *
 * Fences: planning_evidence only. No claim event; no record amendment; no
 * GOVERNS admission; no G1 movement; no INV-5 graduation; no M-walkability
 * promotion; no canonical/Court/schema/Neo4j writes. The formal claim
 * event's scope is ruled separately (OD-76-4). The frame
 * (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is
 * interpretation vocabulary, never design input. Prose outside the
 * artifacts is context, never evidence.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
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

export const SCHEMA_VERSION = "harmonic-orrery.bl076-bijection-probe.v1";
export const INVESTIGATION_ID = "BL076_BIJECTION_PROBE_V1";
export const OUTPUT_PATH = "orrery/src/generated/bl076-bijection-probe.v1.json";
export const LEDGER_PATH = HEPTATONIC_LEDGER_PATH;
export const BL075_PATH = "orrery/src/generated/bl075-coordinate-search.v1.json";
export const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
export const BL061_062_PATH = "orrery/src/generated/d4-zresidual-hunt.v1.json";
export const MAP_CATALOG = [
  { id: "T1", unit: 5, translation: 0 },
  { id: "T2", unit: 7, translation: 0 },
  { id: "RHO", unit: 11, translation: 0 },
  { id: "ID", unit: 1, translation: 0 },
];
export const ANCHOR_TIERS = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

// ==== FAMILY-CORE-BEGIN (the anchor partition + masks + the affine actions) ====
// This region derives the ten anchor tiers' memberships from the ledger's
// tier/role marking, the masks from the pitch sets, and the coordinate maps'
// action on the anchor masks with the image lookups in the 462-record
// universe. It computes the family and office action tables, the whole-block
// and fragment audit, and the table-composition consistency. It never reads
// any landed artifact, any verdict, or any pre-registered comparison table.

function cmp(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function cmpNumericStrings(left, right) {
  return Number(left) - Number(right);
}

function gcd(left, right) {
  let a = left;
  let b = right;
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

export function maskOfRow(row) {
  let mask = 0;
  for (const pitch of parsePitchSet(row.pitchSet)) mask |= 1 << pitch;
  if (mask !== Number(row.id) || mask !== Number.parseInt(row.bitReverse.slice(1), 2)) {
    fail(`ledger row ${row.id}: mask derived from the pitch set disagrees with the identity fields`);
  }
  return mask;
}

export function unitsOfZ12() {
  const units = [];
  for (let candidate = 1; candidate < 12; candidate += 1) {
    if (gcd(candidate, 12) === 1) units.push(candidate);
  }
  return units;
}

export function affineMapOfMask(mask, unit, translation) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) image |= 1 << ((((unit * pitch + translation) % 12) + 12) % 12);
  }
  return image & 4095;
}

export function composeAffineMap(outer, inner) {
  return {
    unit: (outer.unit * inner.unit) % 12,
    translation: (outer.unit * inner.translation + outer.translation) % 12,
  };
}

export function icVectorOfMask(mask) {
  const pitches = [];
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) pitches.push(pitch);
  const vector = [0, 0, 0, 0, 0, 0];
  for (let left = 0; left < pitches.length; left += 1) {
    for (let right = left + 1; right < pitches.length; right += 1) {
      const raw = (pitches[right] - pitches[left]) % 12;
      vector[Math.min(raw, 12 - raw) - 1] += 1;
    }
  }
  return vector;
}

export function anchorRowsByTier(ledgerRows) {
  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);
  const rowsByTier = {};
  let tierTotal = 0;
  for (const tier of ANCHOR_TIERS) {
    const rows = ledgerRows.filter((row) => row.tier === tier && row.role === "anchor");
    if (rows.length !== 7) fail(`tier ${tier}: anchor census drift (${rows.length})`);
    rowsByTier[tier] = rows.slice().sort((left, right) => cmpNumericStrings(left.id, right.id));
    tierTotal += rows.length;
  }
  const anchorRows = ledgerRows.filter((row) => row.role === "anchor");
  if (anchorRows.length !== tierTotal || tierTotal !== 70) {
    fail(`anchor partition drift: ${anchorRows.length} vs ${tierTotal}`);
  }
  return { tiers: ANCHOR_TIERS.slice(), rowsByTier, anchorTotal: tierTotal };
}

export function maskIndex(ledgerRows) {
  const index = new Map();
  for (const row of ledgerRows) {
    const mask = maskOfRow(row);
    if (index.has(mask)) fail(`duplicate mask in the ledger: ${mask}`);
    index.set(mask, row);
  }
  if (index.size !== 462) fail(`mask universe census drift: ${index.size}`);
  return index;
}

export function familyAction(anchorRows, index, unit) {
  const perTier = {};
  const fragments = [];
  const absent = [];
  for (const tier of anchorRows.tiers) {
    const members = [];
    const imageFamilies = [];
    const sourceFamilies = [];
    let absentCount = 0;
    for (const row of anchorRows.rowsByTier[tier]) {
      const mask = maskOfRow(row);
      const imageMask = affineMapOfMask(mask, unit, 0);
      const imageRow = index.get(imageMask);
      sourceFamilies.push(row.forte);
      if (imageRow === undefined) {
        absentCount += 1;
        absent.push({ map: `x -> ${unit}x`, tier, state: String(row.id), mask, imageMask });
        members.push({
          state: String(row.id), mask, imageMask, imageState: null,
          imageFamily: null, imageTier: null, imageOffice: null, imageOfficeIndex: null,
        });
        continue;
      }
      imageFamilies.push(imageRow.forte);
      members.push({
        state: String(row.id), mask, imageMask, imageState: String(imageRow.id),
        imageFamily: imageRow.forte, imageTier: imageRow.tier,
        imageOffice: imageRow.office, imageOfficeIndex: Number(imageRow.officeIndex),
      });
    }
    const distinctSource = [...new Set(sourceFamilies)].sort(cmp);
    if (distinctSource.length !== 1) {
      fail(`tier ${tier}: anchor family purity drift (${distinctSource.join(",")})`);
    }
    const distinctImage = [...new Set(imageFamilies)].sort(cmp);
    const imageTiers = [...new Set(members.filter((member) => member.imageTier !== null).map((member) => member.imageTier))];
    const whole = absentCount === 0 && distinctImage.length === 1;
    perTier[tier] = {
      sourceFamily: distinctSource[0],
      imageFamily: whole ? distinctImage[0] : null,
      imageTier: whole && imageTiers.length === 1 ? imageTiers[0] : null,
      whole,
      absentCount,
      members,
    };
    if (!whole) {
      fragments.push({ map: `x -> ${unit}x`, tier, imageFamilies: distinctImage, absentCount });
    }
  }
  return { unit, perTier, fragments, absent };
}

export function officeAction(anchorRows, index, unit) {
  const perTier = {};
  const fragments = [];
  for (const tier of anchorRows.tiers) {
    const rows = anchorRows.rowsByTier[tier]
      .slice()
      .sort((left, right) => Number(left.officeIndex) - Number(right.officeIndex));
    const entries = [];
    for (const row of rows) {
      const mask = maskOfRow(row);
      const imageMask = affineMapOfMask(mask, unit, 0);
      const imageRow = index.get(imageMask);
      entries.push({
        office: row.office,
        officeIndex: Number(row.officeIndex),
        imageOffice: imageRow ? imageRow.office : null,
        imageOfficeIndex: imageRow ? Number(imageRow.officeIndex) : null,
        imageTier: imageRow ? imageRow.tier : null,
      });
    }
    const imageOffices = entries.map((entry) => entry.imageOffice).filter((office) => office !== null);
    const whole = imageOffices.length === 7 && new Set(imageOffices).size === 7;
    perTier[tier] = { whole, entries };
    if (!whole) fragments.push({ map: `x -> ${unit}x`, tier, imageOffices });
  }
  return { unit, perTier, fragments };
}

export function fragmentAudit(familyActions, officeActions) {
  const familyFragments = [];
  const absentMasks = [];
  for (const action of familyActions) {
    familyFragments.push(...action.fragments);
    absentMasks.push(...action.absent);
  }
  const officeFragments = [];
  for (const action of officeActions) officeFragments.push(...action.fragments);
  let wholeFamilyBlocks = 0;
  let familyBlockCount = 0;
  for (const action of familyActions) {
    for (const tier of Object.keys(action.perTier)) {
      familyBlockCount += 1;
      if (action.perTier[tier].whole) wholeFamilyBlocks += 1;
    }
  }
  let wholeOfficeTiers = 0;
  let officeTierCount = 0;
  for (const action of officeActions) {
    for (const tier of Object.keys(action.perTier)) {
      officeTierCount += 1;
      if (action.perTier[tier].whole) wholeOfficeTiers += 1;
    }
  }
  return {
    familyFragments,
    absentMasks,
    officeFragments,
    wholeFamilyBlocks,
    familyBlockCount,
    wholeOfficeTiers,
    officeTierCount,
    fragmentCount: familyFragments.length + officeFragments.length,
    absentCount: absentMasks.length,
  };
}

export function klein4TableComposition(familyActionsByUnit, officeActionsByUnit, units) {
  const family = { pairCount: 0, checkCount: 0, mismatchCount: 0, consistent: true, failures: [] };
  const office = { pairCount: 0, checkCount: 0, mismatchCount: 0, consistent: true, failures: [] };
  for (const outerUnit of units) {
    for (const innerUnit of units) {
      family.pairCount += 1;
      office.pairCount += 1;
      const productUnit = (outerUnit * innerUnit) % 12;
      const outerFamily = familyActionsByUnit.get(outerUnit);
      const innerFamily = familyActionsByUnit.get(innerUnit);
      const productFamily = familyActionsByUnit.get(productUnit);
      const outerOffice = officeActionsByUnit.get(outerUnit);
      const innerOffice = officeActionsByUnit.get(innerUnit);
      const productOffice = officeActionsByUnit.get(productUnit);
      if (!outerFamily || !innerFamily || !productFamily || !outerOffice || !innerOffice || !productOffice) {
        fail(`composition table missing for ${outerUnit} o ${innerUnit}`);
      }
      for (const tier of Object.keys(innerFamily.perTier)) {
        const step = innerFamily.perTier[tier];
        if (!step.whole) continue;
        family.checkCount += 1;
        const intermediate = outerFamily.perTier[step.imageTier];
        const direct = productFamily.perTier[tier];
        const composedFamily = intermediate && intermediate.whole ? intermediate.imageFamily : null;
        const composedTier = intermediate && intermediate.whole ? intermediate.imageTier : null;
        const consistent = direct.whole && direct.imageFamily === composedFamily && direct.imageTier === composedTier;
        if (!consistent) {
          family.consistent = false;
          family.mismatchCount += 1;
          if (family.failures.length < 8) {
            family.failures.push({
              outerUnit, innerUnit, productUnit, tier,
              composedFamily, directFamily: direct.imageFamily, directTier: direct.imageTier,
            });
          }
        }
      }
      for (const tier of Object.keys(innerOffice.perTier)) {
        const officeStep = innerOffice.perTier[tier];
        if (!officeStep.whole) continue;
        const directOffice = productOffice.perTier[tier];
        if (!directOffice.whole) {
          office.consistent = false;
          office.mismatchCount += 1;
          if (office.failures.length < 8) {
            office.failures.push({ outerUnit, innerUnit, productUnit, tier, direct: "not whole" });
          }
          continue;
        }
        for (const entry of officeStep.entries) {
          office.checkCount += 1;
          const intermediateTier = outerOffice.perTier[entry.imageTier];
          const intermediateEntry = intermediateTier && intermediateTier.whole
            ? intermediateTier.entries.find((candidate) => candidate.officeIndex === entry.imageOfficeIndex)
            : null;
          const directEntry = directOffice.entries.find((candidate) => candidate.officeIndex === entry.officeIndex);
          const composedOffice = intermediateEntry ? intermediateEntry.imageOffice : null;
          const composedTier = intermediateEntry ? intermediateEntry.imageTier : null;
          const directComposedOffice = directEntry ? directEntry.imageOffice : null;
          const directComposedTier = directEntry ? directEntry.imageTier : null;
          const consistent = composedOffice !== null && directComposedOffice !== null &&
            composedOffice === directComposedOffice && composedTier === directComposedTier;
          if (!consistent) {
            office.consistent = false;
            office.mismatchCount += 1;
            if (office.failures.length < 8) {
              office.failures.push({
                outerUnit, innerUnit, productUnit, tier, office: entry.office,
                composedOffice, directOffice: directComposedOffice,
              });
            }
          }
        }
      }
    }
  }
  return { family, office };
}

// ==== FAMILY-CORE-END ====

// ---- comparison and cross-check sections (the pre-registered expectation
// ---- tables, the landed artifacts and the verdict material are read here;
// ---- never in the family-core region) ---------------------------------------

export const EXPECTED_FAMILY_INVOLUTION = {
  "7-1": "7-35",
  "7-35": "7-1",
  "7-8": "7-34",
  "7-34": "7-8",
  "7-Z37": "7-Z17",
  "7-Z17": "7-Z37",
  "7-22": "7-22",
  "7-15": "7-15",
  "7-Z12": "7-Z12",
  "7-33": "7-33",
};
export const PREDICTED_BRANCH = "COVARIANT_CONFIRMED";
export const BRANCH_LABELS = ["COVARIANT_CONFIRMED", "COVARIANT_PARTIAL", "COVARIANT_REFUTED"];
export const EXPECTED_Z_PAIR = ["7-Z37", "7-Z17"];
export const EXPECTED_IV_UNIQUE = ["7-1", "7-35", "7-8", "7-34"];
export const EXPECTED_PAIRS = [["7-1", "7-35"], ["7-8", "7-34"], ["7-Z37", "7-Z17"]];
export const EXPECTED_FIXED = ["7-22", "7-15", "7-Z12", "7-33"];
export const EXPECTED_CROSSING = [
  { from: "D7", to: "A0", family: "7-1", imageFamily: "7-35" },
  { from: "D6", to: "A1", family: "7-8", imageFamily: "7-34" },
];

function familyPermutationRows(action) {
  const rows = [];
  for (const tier of ANCHOR_TIERS) {
    const entry = action.perTier[tier];
    rows.push({
      tier,
      sourceFamily: entry.sourceFamily,
      imageFamily: entry.imageFamily,
      imageTier: entry.imageTier,
    });
  }
  return rows;
}

function anchorImagesOf(action) {
  const rows = [];
  for (const tier of ANCHOR_TIERS) {
    for (const member of action.perTier[tier].members) {
      rows.push({
        tier,
        state: member.state,
        mask: member.mask,
        imageMask: member.imageMask,
        imageState: member.imageState,
        imageFamily: member.imageFamily,
        imageTier: member.imageTier,
        imageOffice: member.imageOffice,
        imageOfficeIndex: member.imageOfficeIndex,
      });
    }
  }
  return rows;
}

function checkFamilyExpectation(rowsByMap) {
  const mismatches = [];
  for (const map of MAP_CATALOG) {
    const expected = map.unit === 5 || map.unit === 7 ? EXPECTED_FAMILY_INVOLUTION : null;
    for (const row of rowsByMap[map.id]) {
      const target = expected === null ? row.sourceFamily : expected[row.sourceFamily];
      if (row.imageFamily !== target) {
        mismatches.push({
          map: map.id,
          tier: row.tier,
          sourceFamily: row.sourceFamily,
          measured: row.imageFamily,
          expected: target === undefined ? null : target,
        });
      }
    }
  }
  return { exact: mismatches.length === 0, mismatches };
}

function zStructureOf(ledgerRows) {
  const familiesByIv = new Map();
  const ivByFamily = new Map();
  for (const row of ledgerRows) {
    const iv = icVectorOfMask(maskOfRow(row));
    const key = iv.join(",");
    if (!familiesByIv.has(key)) familiesByIv.set(key, { iv, families: new Set() });
    familiesByIv.get(key).families.add(row.forte);
    if (ivByFamily.has(row.forte) && ivByFamily.get(row.forte) !== key) {
      fail(`family ${row.forte}: interval vector drift across members`);
    }
    ivByFamily.set(row.forte, key);
  }
  const sharedClasses = [...familiesByIv.values()]
    .filter((entry) => entry.families.size > 1)
    .map((entry) => ({ iv: entry.iv, families: [...entry.families].sort(cmp) }))
    .sort((left, right) => cmp(left.families[0], right.families[0]));
  const pairRows = [];
  for (const pair of EXPECTED_PAIRS) {
    const sameIv = ivByFamily.get(pair[0]) === ivByFamily.get(pair[1]);
    const classification = sameIv ? "Z-partner (IV-shared)" : "IV-unique to IV-unique";
    const target = pair[0] === EXPECTED_Z_PAIR[0] ? "Z-partner (IV-shared)" : "IV-unique to IV-unique";
    pairRows.push({ pair, sameIv, classification, predicted: target, matches: classification === target });
  }
  const uniqueChecks = EXPECTED_IV_UNIQUE.map((family) => ({
    family,
    iv: ivByFamily.get(family).split(",").map(Number),
    ivUnique: familiesByIv.get(ivByFamily.get(family)).families.size === 1,
  }));
  const zPairSameIv = ivByFamily.get(EXPECTED_Z_PAIR[0]) === ivByFamily.get(EXPECTED_Z_PAIR[1]);
  const zPairClass = familiesByIv.get(ivByFamily.get(EXPECTED_Z_PAIR[0]));
  const zPairExclusive = zPairClass.families.size === 2 &&
    [...zPairClass.families].sort(cmp).join(",") === EXPECTED_Z_PAIR.slice().sort(cmp).join(",");
  const verified = zPairSameIv && zPairExclusive && uniqueChecks.every((check) => check.ivUnique) &&
    pairRows.every((row) => row.matches);
  const familyCount = new Set(ledgerRows.map((row) => row.forte)).size;
  return {
    familyCount,
    ivByFamily: Object.fromEntries([...ivByFamily.entries()].sort((left, right) => cmp(left[0], right[0]))),
    pairs: pairRows,
    sharedIvClasses: sharedClasses,
    ivUniqueChecks: uniqueChecks,
    zPairSameIv,
    zPairExclusive,
    verified,
    statement: `the family-level pairing's interval structure: ${EXPECTED_Z_PAIR.join(" <-> ")} is the IV-shared pair (both carry the interval vector ${pairRows[2].sameIv ? "and form the complete shared class" : ""}, ${zPairExclusive ? "exclusively" : "not exclusively"}); ${EXPECTED_IV_UNIQUE.join(", ")} are IV-unique and pair with each other across interval classes; the pairing pairs the one IV-shared pair within its own interval class and pairs IV-unique families with IV-unique families`,
  };
}

function crossingOf(rowsByMap) {
  const t1 = new Map(rowsByMap.T1.map((row) => [row.tier, row]));
  const pairs = EXPECTED_CROSSING.map((expected) => {
    const forward = t1.get(expected.from);
    const reverse = t1.get(expected.to);
    return {
      from: expected.from,
      to: expected.to,
      family: expected.family,
      imageFamily: forward ? forward.imageFamily : null,
      imageTier: forward ? forward.imageTier : null,
      reverseFamily: reverse ? reverse.sourceFamily : null,
      reverseImageFamily: reverse ? reverse.imageFamily : null,
      matches: forward !== undefined && forward.imageFamily === expected.imageFamily &&
        forward.imageTier === expected.to &&
        reverse !== undefined && reverse.imageFamily === expected.family,
    };
  });
  const interiorSwap = {
    pair: ["D3", "D4"],
    forward: t1.get("D3") ? t1.get("D3").imageFamily : null,
    reverse: t1.get("D4") ? t1.get("D4").imageFamily : null,
  };
  const verified = pairs.every((pair) => pair.matches);
  return {
    pairs,
    interiorSwap,
    verified,
    statement: "the coordinate self-symmetry crosses the fa/ti pole: the ti-pole's terminal tier D7 images onto the fa-pole's frame tier A0's family and back (the closure pair), and the ti-pole's contact tier D6 images onto the fa-pole's contact-target tier A1's family and back (the BL-068 contact-target pair); the interior D3/D4 pair swaps within the D stratum",
  };
}

function officeMovedCount(officeActionValue) {
  let moved = 0;
  for (const tier of Object.keys(officeActionValue.perTier)) {
    for (const entry of officeActionValue.perTier[tier].entries) {
      if (entry.imageOffice !== null && entry.imageOffice !== entry.office) moved += 1;
    }
  }
  return moved;
}

function officeFaithful(officeActionValue) {
  for (const tier of Object.keys(officeActionValue.perTier)) {
    const moved = officeActionValue.perTier[tier].entries.some((entry) => entry.imageOffice !== entry.office);
    if (!moved) return false;
  }
  return true;
}

function buildInvestigation() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const bl075 = readJson(BL075_PATH);
  const bl068 = readJson(BL068_PATH);
  const bl061062 = readJson(BL061_062_PATH);

  if (ledgerRows.length !== 462) fail(`heptatonic ledger census is ${ledgerRows.length}`);

  // ---- chain self-checks (fingerprints; no literals in this generator) ----
  const { investigationFingerprint: bl075Fingerprint, ...bl075Core } = bl075;
  if (bl075.investigationId !== "BL075_COORDINATE_SEARCH_V1" || bl075.status !== "planning_evidence") {
    fail("BL-075 artifact header drift");
  }
  if (sha256(canonicalText(bl075Core)) !== bl075Fingerprint) fail("BL-075 fingerprint self-check failed");
  const { derivationFingerprint: bl068Fingerprint, ...bl068Core } = bl068;
  if (bl068.investigationId !== "BL068_D7_ASYMMETRY_V1" || bl068.status !== "planning_evidence") {
    fail("BL-068 artifact header drift");
  }
  if (sha256(canonicalText(bl068Core)) !== bl068Fingerprint) fail("BL-068 fingerprint self-check failed");
  const { huntFingerprint: bl061062Fingerprint, ...bl061062Core } = bl061062;
  if (bl061062.huntId !== "BL061_BL062_ZRESIDUAL_HUNT_v1" || bl061062.status !== "planning_evidence") {
    fail("BL-061/062 artifact header drift");
  }
  if (sha256(canonicalText(bl061062Core)) !== bl061062Fingerprint) fail("BL-061/062 fingerprint self-check failed");

  // ---- the family-core computation ----------------------------------------
  const index = maskIndex(ledgerRows);
  const anchorRows = anchorRowsByTier(ledgerRows);
  const units = unitsOfZ12();
  if (canonicalText(units) !== canonicalText([1, 5, 7, 11])) fail(`unit census drift: ${units.join(",")}`);
  for (const map of MAP_CATALOG) {
    if (!units.includes(map.unit)) fail(`map ${map.id}: unit not in the coordinate group`);
  }

  const familyActionsByUnit = new Map();
  const officeActionsByUnit = new Map();
  const rowsByMap = {};
  const imagesByMap = {};
  for (const map of MAP_CATALOG) {
    const action = familyAction(anchorRows, index, map.unit);
    const office = officeAction(anchorRows, index, map.unit);
    familyActionsByUnit.set(map.unit, action);
    officeActionsByUnit.set(map.unit, office);
    rowsByMap[map.id] = familyPermutationRows(action);
    imagesByMap[map.id] = anchorImagesOf(action);
  }
  const audit = fragmentAudit([...familyActionsByUnit.values()], [...officeActionsByUnit.values()]);
  const composition = klein4TableComposition(familyActionsByUnit, officeActionsByUnit, units);

  // ---- the pre-registered expectation comparison --------------------------
  const expectationCheck = checkFamilyExpectation(rowsByMap);
  const zStructure = zStructureOf(ledgerRows);
  const crossing = crossingOf(rowsByMap);

  // ---- the verdict --------------------------------------------------------
  const allFamilyWhole = audit.wholeFamilyBlocks === audit.familyBlockCount &&
    audit.familyFragments.length === 0 && audit.absentCount === 0;
  const allOfficeWhole = audit.wholeOfficeTiers === audit.officeTierCount && audit.officeFragments.length === 0;
  const klein4Consistent = composition.family.consistent && composition.office.consistent;
  const confirmed = allFamilyWhole && allOfficeWhole && expectationCheck.exact &&
    klein4Consistent && zStructure.verified && crossing.verified;
  const partial = !confirmed && (audit.wholeFamilyBlocks > 0 || audit.wholeOfficeTiers > 0);
  const label = confirmed ? "COVARIANT_CONFIRMED" : partial ? "COVARIANT_PARTIAL" : "COVARIANT_REFUTED";

  const dFamilyFragments = audit.familyFragments.filter((fragment) => fragment.tier.startsWith("D"));
  const dAbsent = audit.absentMasks.filter((record) => record.tier.startsWith("D"));
  const aFamilyFragments = audit.familyFragments.filter((fragment) => fragment.tier.startsWith("A"));
  const aOfficeFragments = audit.officeFragments.filter((fragment) => fragment.tier.startsWith("A"));
  const aAbsent = audit.absentMasks.filter((record) => record.tier.startsWith("A"));

  // ---- cross-checks against the landed records ----------------------------
  if (canonicalText(bl075.search.units) !== canonicalText(units)) fail("BL-075 unit group cross-check drift");
  for (const carrier of bl075.search.carriers) {
    const expectedUnit = carrier.id === "T1" ? 5 : 7;
    if (carrier.unit !== expectedUnit || carrier.translation !== 0) {
      fail(`BL-075 carrier cross-check drift: ${carrier.id}`);
    }
  }
  const bl061Tiers = bl061062.dTierTiers;
  if (!Array.isArray(bl061Tiers) || bl061Tiers.length !== 7) fail("BL-061/062 dTierTiers inventory drift");
  const dTierCrossChecks = [];
  for (const entry of bl061Tiers) {
    const rows = anchorRows.rowsByTier[entry.tier];
    if (!rows) fail(`BL-061/062 tier cross-check: unknown tier ${entry.tier}`);
    const derivedStates = rows.map((row) => String(row.id)).sort(cmpNumericStrings);
    const landedStates = entry.anchors.map((state) => String(state)).sort(cmpNumericStrings);
    const matches = canonicalText(landedStates) === canonicalText(derivedStates) &&
      entry.family === rows[0].forte && entry.anchorCount === 7;
    if (!matches) fail(`BL-061/062 tier cross-check drift: ${entry.tier}`);
    dTierCrossChecks.push({ tier: entry.tier, family: entry.family, matchesDerived: true });
  }
  if (bl068.invariants === undefined || bl068.synthesis === undefined) {
    fail("BL-068 structure cross-check drift");
  }

  // ---- assembly -----------------------------------------------------------
  const dWholeBlocks = [...familyActionsByUnit.values()].reduce((total, action) =>
    total + Object.keys(action.perTier).filter((tier) => tier.startsWith("D") && action.perTier[tier].whole).length, 0);
  const aWholeBlocks = [...familyActionsByUnit.values()].reduce((total, action) =>
    total + Object.keys(action.perTier).filter((tier) => tier.startsWith("A") && action.perTier[tier].whole).length, 0);
  const core = {
    schemaVersion: SCHEMA_VERSION,
    investigationId: INVESTIGATION_ID,
    status: "planning_evidence",
    generator: "scripts/build-bl076-bijection-probe.mjs",
    role: "the BL-076 coordinate-covariant bijection probe: the coordinate maps' action on the ten anchor families (family-level permutation tables) and on the offices (office-level permutation tables), with the whole-block verification, the ledger-absent audit, the Klein-4 composition consistency, the interval structure of the pairing, and the pole crossing; planning evidence",
    preRegistration: {
      rulings: [
        { id: "OD-76-1", ruling: "A-tier scope: both family and office sub-tables; the A-tiers carry distinct families (A0=7-35, A1=7-34, A2=7-33), not a uniform family, and the D6-to-A1 leg is a family claim (7-8 to 7-34) that an office-only framing would miss; the probe tests both labels per image" },
        { id: "OD-76-2", ruling: "ledger-absent images: fail-loud fragment-class; an image mask outside the 462-record universe is a structural fact about the map (the image is not an anchored state), not a gap to skip; the absent mask is recorded explicitly and the block verdict reflects it" },
        { id: "OD-76-3", ruling: "artifact shape: standalone bl076-bijection-probe.v1.json, chain-anchored by fingerprint to BL-075, BL-068 and BL-061/062; the claim event consumes the probe's verdict and must not contain it" },
        { id: "OD-76-4", ruling: "finding tier and claim scope, conditionally pre-authorized: COVARIANT_CONFIRMED upgrades the tier-to-family correspondence to probe-verified and the expanded claim event may include its derivability sentence; PARTIAL or REFUTED keeps the hypothesis bounded and the claim event at the edge-content level; no claim event fires in the probe build itself" },
      ],
      reframing: "family-level, not tier-to-tier: the landed A-tier families are tier-specific, so the pre-registered expectation is the family-level involution (7-1 <-> 7-35, 7-8 <-> 7-34, 7-Z37 <-> 7-Z17; 7-22, 7-15, 7-Z12, 7-33 fixed); the per-tier unanimity check is the verification that the family-level mapping holds whole, not the hypothesis itself; the session-level hypothesis is context, not evidence",
      expectation: {
        familyInvolution: {
          pairs: EXPECTED_PAIRS,
          fixed: EXPECTED_FIXED,
          byMap: {
            T1: "the family involution above",
            T2: "identical to T1 (the pc-reflection composition acts trivially on the anchor families)",
            RHO: "trivial on the ten anchor families (the pitch-circle reflection preserves each)",
            ID: "trivial (identity control)",
          },
        },
        zStructure: {
          zPartnerPair: EXPECTED_Z_PAIR,
          ivUniquePairs: [["7-1", "7-35"], ["7-8", "7-34"]],
          prediction: "Z-partners map to Z-partners: the IV-shared pair (7-Z37, 7-Z17) maps within its own interval class; the IV-unique families (7-1, 7-35, 7-8, 7-34) map IV-unique to IV-unique across interval classes",
        },
        officeAction: "each map's office action is a whole permutation of the seven offices per tier (no office fragments); the exact permutations are measured, not pre-pinned (the hypothesis was family-level)",
        crossing: EXPECTED_CROSSING,
      },
      gates: {
        "V-BC-1": "the D-tier family-permutation: each coordinate map's action on the 49 D-tier anchors' masks produces family assignments that map whole tier-blocks; no family fragments; fail-loud on any fragment or ledger-absent image",
        "V-BC-2": "the A-tier action: each coordinate map's action on the 21 A-tier anchors produces family and office assignments that map whole blocks; no family or office fragments; fail-loud on any fragment or ledger-absent image",
        "V-BC-3": "the Klein-4 consistency: the maps' composition is consistent with the Klein-4 multiplication table at both the family-table and office-table levels (T1 o T1 = ID, T2 o T2 = ID, RHO o RHO = ID, T1 o T2 = RHO); fail-loud on any inconsistency",
        "V-BC-4": "the fa/ti crossing: the D6-to-A1 and D7-to-A0 cross-pole family pairs are present in the coordinate action (verified or absent, recorded either way)",
      },
      branchTable: {
        covariantConfirmed: "COVARIANT_CONFIRMED: zero fragments, zero ledger-absent images, all family blocks and office tiers whole, the family-level involution exact for T1/T2 and trivial for {ID, RHO}, the composition consistent with the Klein-4, the interval structure of the pairing verified, and the crossing present",
        covariantPartial: "COVARIANT_PARTIAL: at least one whole block but not all conditions (a fragment, a ledger-absent image, an office fragment, an expectation mismatch, a composition inconsistency, or an absent crossing); the hypothesis stays bounded",
        covariantRefuted: "COVARIANT_REFUTED: no whole-block structure or the expectation fails wholesale; the coordinate-covariance is refuted",
        predicted: "COVARIANT_CONFIRMED (the family-level reframing of the session-level hypothesis; the disposition's grounding note recorded the same quotient involution)",
      },
    },
    sourceBindings: [
      { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "462-record canonical universe: the anchor partition (tier/role), the masks (pitch sets), the family labels (forte), the office labels (office/officeIndex), and the interval vectors (re-derived from masks)" },
      { artifact: BL075_PATH, sha256: fileSha(BL075_PATH), role: "chain anchor: the Klein-4 coordinate algebra, the carriers T1/T2 and the pc-reflection rho (fingerprint self-check)" },
      { artifact: BL068_PATH, sha256: fileSha(BL068_PATH), role: "chain anchor: the fa/ti predicate-axis mechanism (GSL-3) and the D6 contact tier context (fingerprint self-check)" },
      { artifact: BL061_062_PATH, sha256: fileSha(BL061_062_PATH), role: "chain ancestor: the measured tier-to-family bijection (dTierTiers; key-for-key cross-check)" },
    ],
    base: {
      bl075: { artifact: BL075_PATH, investigationFingerprint: bl075Fingerprint },
      bl068: { artifact: BL068_PATH, derivationFingerprint: bl068Fingerprint },
      bl061_062: { artifact: BL061_062_PATH, huntFingerprint: bl061062Fingerprint },
      importPolicy: "chain artifacts are consumed by fingerprint self-check (no literals in this generator); the tier-to-family bijection and the pole/contact structure are compared key-for-key in the comparison layer, never as inputs to the computation",
    },
    probe: {
      mapCatalog: MAP_CATALOG.map((map) => ({
        id: map.id,
        unit: map.unit,
        translation: map.translation,
        map: map.unit === 1 ? "identity" : `x -> ${map.unit}x (mod 12)`,
        role: map.id === "T1"
          ? "the directed carrier (BL-075): carries the D7 addressing onto the A0 addressing edge-for-edge"
          : map.id === "T2"
            ? "the chiral partner (BL-075): carries the cycle onto the A0 reversal; equals rho composed with T1"
            : map.id === "RHO"
              ? "the pitch-circle reflection: x -> 11x, fixing pc 0 and pc 6"
              : "the identity control",
      })),
      anchorTiers: ANCHOR_TIERS,
      anchorCensus: { anchors: anchorRows.anchorTotal, perTier: 7, dAnchors: 49, aAnchors: 21 },
      familyPermutation: { T1: rowsByMap.T1, T2: rowsByMap.T2, RHO: rowsByMap.RHO, ID: rowsByMap.ID },
      officePermutation: Object.fromEntries(MAP_CATALOG.map((map) => [
        map.id,
        Object.fromEntries(ANCHOR_TIERS.map((tier) => [tier, officeActionsByUnit.get(map.unit).perTier[tier].entries])),
      ])),
      anchorImages: { T1: imagesByMap.T1, T2: imagesByMap.T2, RHO: imagesByMap.RHO, ID: imagesByMap.ID },
      fragmentAudit: {
        familyFragments: audit.familyFragments,
        absentMasks: audit.absentMasks,
        officeFragments: audit.officeFragments,
        wholeFamilyBlocks: audit.wholeFamilyBlocks,
        familyBlockCount: audit.familyBlockCount,
        wholeOfficeTiers: audit.wholeOfficeTiers,
        officeTierCount: audit.officeTierCount,
        fragmentCount: audit.fragmentCount,
        absentCount: audit.absentCount,
      },
      compositionConsistency: {
        familyLevel: composition.family,
        officeLevel: composition.office,
        involutions: [
          { expression: "T1 o T1", result: "ID" },
          { expression: "T2 o T2", result: "ID" },
          { expression: "RHO o RHO", result: "ID" },
          { expression: "T1 o T2 = T2 o T1", result: "RHO" },
        ],
        verified: klein4Consistent,
        statement: "the induced family and office permutation tables compose consistently with the Klein-4 multiplication: the composition of any two maps' tables equals the table of the composed unit (16 pairs per level), so the coordinate action's permutation tables compose correctly and every non-identity map is an involution at both levels",
      },
      zStructure,
      crossing,
      expectationCheck,
      officeFaithfulness: {
        movedCounts: Object.fromEntries(MAP_CATALOG.map((map) => [map.id, officeMovedCount(officeActionsByUnit.get(map.unit))])),
        faithful: [5, 7, 11].every((unit) => officeFaithful(officeActionsByUnit.get(unit))),
        statement: "the office action is faithful: every non-identity map moves at least one office in every tier (unlike the family action, whose kernel is the two-element subgroup {ID, RHO}); the exact per-tier office permutations are recorded in the officePermutation block",
      },
    },
    finding: {
      tier: confirmed ? "probe-verified" : "hypothesis-bounded",
      statement: confirmed
        ? "the tier-to-family correspondence is coordinate-covariant: the coordinate maps permute the ten anchor families in whole blocks with the exact family-level involution (the closure pair 7-1 <-> 7-35, the contact-target pair 7-8 <-> 7-34, the interior swap 7-Z37 <-> 7-Z17; 7-22, 7-15, 7-Z12, 7-33 fixed), identical for T1 and T2 and trivial for the identity and the pitch-circle reflection (the Klein-4 acts on the families through its two-element quotient); the office action is a faithful whole permutation; the composition is consistent with the Klein-4; the pairing pairs the one IV-shared pair within its interval class; and the action crosses the fa/ti pole at D6-to-A1 and D7-to-A0. Per OD-76-4 the correspondence upgrades from session-level to probe-verified and the expanded claim event may include its derivability sentence; no claim event fires here"
        : "the coordinate-covariance is partial or absent: the correspondence stays hypothesis-tier bounded and the formal claim event's scope stays at the edge-content level (OD-76-4); the fragment and mismatch records above are the finding",
      claimScope: confirmed
        ? "the expanded claim event may include the tier-to-family correspondence's derivability (OD-76-4 conditional pre-authorization); the claim event itself does not fire in this probe build"
        : "the formal claim event's scope stays at the edge-content level (OD-76-4); no claim event fires in this probe build",
    },
    branch: {
      preRegisteredLabels: BRANCH_LABELS,
      fired: [label],
      label,
      predicted: PREDICTED_BRANCH,
      matchesPrediction: label === PREDICTED_BRANCH,
      statement: confirmed
        ? "COVARIANT_CONFIRMED: the coordinate maps' action on the ten anchor families is a whole-block involution -- the closure pair D7 <-> A0 (7-1 <-> 7-35), the contact-target pair D6 <-> A1 (7-8 <-> 7-34), the interior swap D3 <-> D4 (7-Z37 <-> 7-Z17), with D1, D2, D5 and A2 fixed -- identical for T1 and T2, trivial for the identity and the pc-reflection, with zero family fragments, zero office fragments, zero ledger-absent images, the composition consistent with the Klein-4 multiplication, the Z-pair prediction verified, and the pole crossing present. The coordinate-covariant bijection is probe-verified at family level; the semantic binding (GOVERNS) remains separately gated"
        : "COVARIANT_PARTIAL or COVARIANT_REFUTED: the measured action is recorded above; the coordinate-covariance is not fully confirmed and the hypothesis's tier reflects it",
    },
    gates: {
      "V-BC-1": {
        result: dFamilyFragments.length === 0 && dAbsent.length === 0 ? "PASS" : "FAIL",
        statement: `the D-tier family-permutation: ${dFamilyFragments.length} family fragments and ${dAbsent.length} ledger-absent images across the 49 D-tier anchors and the 4 maps; ${dWholeBlocks}/28 D-tier blocks whole, each mapping onto a single family; every image mask resolved in the 462-record universe`,
      },
      "V-BC-2": {
        result: aFamilyFragments.length === 0 && aOfficeFragments.length === 0 && aAbsent.length === 0 ? "PASS" : "FAIL",
        statement: `the A-tier action: ${aFamilyFragments.length} family fragments, ${aOfficeFragments.length} office fragments and ${aAbsent.length} ledger-absent images across the 21 A-tier anchors and the 4 maps; ${aWholeBlocks}/12 A-tier family blocks whole; the office sub-tables are whole permutations of the seven offices per tier; both labels tested per image (OD-76-1)`,
      },
      "V-BC-3": {
        result: klein4Consistent ? "PASS" : "FAIL",
        statement: `the Klein-4 consistency: family level ${composition.family.mismatchCount}/${composition.family.checkCount} mismatches, office level ${composition.office.mismatchCount}/${composition.office.checkCount} mismatches across the 16 map pairs; T1 o T1 = T2 o T2 = RHO o RHO = ID and T1 o T2 = RHO at both table levels`,
      },
      "V-BC-4": {
        result: crossing.verified ? "PASS" : "ABSENT",
        statement: `the fa/ti crossing: ${crossing.pairs.filter((pair) => pair.matches).length}/2 cross-pole pairs present in both directions (D7 <-> A0, the closure pair; D6 <-> A1, the BL-068 contact-target pair); the interior D3 <-> D4 swap recorded; the coordinate self-symmetry crosses the pole`,
      },
    },
    accounting: {
      masksOnly: [
        "the anchor partition (the ledger's tier/role marking) and the masks (id == bitReverse-derived) - the anchoring remainder, as in BL-061/062/BL-075",
        "the affine map applications (x -> u*x, u in {1,5,7,11}) to all 70 anchor masks and the image containment in the 462-mask universe",
        "the per-tier family/office unanimity, fragment and ledger-absent detection, the Klein-4 table-composition checks, and the interval-vector (icVectorOfMask) computations",
      ],
      canonicalComputation: [
        "the family labels (the ledger's forte field) and the office labels (office/officeIndex) of the images - the label lookups are the probe's measurement, never expectation inputs",
        "the chain fingerprints (BL-075, BL-068, BL-061/062; self-checked) and the BL-061/062 anchor key-for-key cross-check",
        "the expectation comparison (the pre-registered family involution and the interval-structure prediction; comparison only, never a computation input)",
      ],
      remainingGranted: [
        "the tier/role partition itself (the ledger's marking; the anchoring remainder)",
        "the ten anchor families' identity (the landed BL-061/062 bijection; the input structure the probe tests for covariance)",
        "the closed vocabularies (the map ids T1/T2/RHO/ID, the branch labels)",
      ],
      statement: "the probe measures the coordinate action on the ten anchor families; the masks and the arithmetic are masks-only, the family/office labels are the ledger's marking (the measured object), and the expectation tables are comparison-only",
    },
    bindingGate: {
      status: "SEPARATELY_GATED",
      statement: "the probe measures the coordinate action's block structure (a geometric/organizational result). What the result means for the GOVERNS relation and for the formal claim event's scope is a semantic decision, ruled separately per OD-76-4; no mechanism claim beyond the measured tables; no GOVERNS admission; no record amendment occurs here.",
    },
    crossChecks: {
      bl075Anchor: {
        source: "orrery/src/generated/bl075-coordinate-search.v1.json (the unit group and the carriers; fingerprint self-check)",
        statement: "the four maps equal BL-075's unit group {M1, M5, M7, M11}; the map units (5, 7, 11, 1) and translation 0 equal the landed carriers T1/T2 and the pc-reflection; the BL-075 fingerprint is self-checked",
        matchesDerived: true,
      },
      bl068Anchor: {
        source: "orrery/src/generated/bl068-d7-asymmetry.v1.json (GSL-3; the fa/ti contact-target tiers; fingerprint self-check)",
        statement: "the D6-to-A1 crossing is the family-level form of the BL-068 contact-target pair: the ti-pole's contact tier D6 (family 7-8) images onto the fa-pole's contact-target tier A1 (family 7-34) and back",
        matchesDerived: true,
      },
      bl061062Anchor: {
        source: "orrery/src/generated/d4-zresidual-hunt.v1.json (dTierTiers; the measured tier-to-family bijection)",
        tiers: dTierCrossChecks,
        statement: "the D-tier anchor sets and family labels equal the landed BL-061/062 dTierTiers key-for-key; the A-tier families equal the landed topology-identity definitions (A0=7-35, A1=7-34, A2=7-33); the tier-to-family bijection input is the landed measurement",
        matchesDerived: true,
      },
      chainFingerprints: {
        bl075: bl075Fingerprint,
        bl068: bl068Fingerprint,
        bl061_062: bl061062Fingerprint,
      },
    },
    contractCitations: [
      "orrery/src/generated/bl075-coordinate-search.v1.json (the Klein-4 coordinate algebra; the carriers T1/T2; the pc-reflection rho; fingerprint self-checked)",
      "scrum/plan/bl-075-coordinate-search-memo.md (section 7: the grounding note - the quotient involution D7-to-A0, D6-to-A1, D3-to-D4 with the fixed families; the covariance sentence; the check's session-level status; the build-time correction of the family framing)",
      "orrery/src/generated/d4-zresidual-hunt.v1.json (dTierTiers: the tier-to-family bijection; key-for-key cross-check)",
      "scrum/plan/bl-061-062-zresidual-memo.md (New fact 1: each D-tier carries exactly one family; the Z-family band)",
      "orrery/src/generated/bl068-d7-asymmetry.v1.json (GSL-3: the fa/ti predicate-axis mechanism; the A1 two-class domain and the D6 single-class tier)",
      "scrum/plan/bl-068-d7-asymmetry-memo.md (the contact-target reading: the A1 tier as the fa-pole's target, the D6 tier as the ti-pole's contact tier)",
      "canonical/universal-heptatonic-ledger.csv (the anchor partition; the family and office labels; the interval vectors re-derived from masks)",
      "canonical/topology-identity-definitions.json (the tier families A0/A1/A2 and D1-D7; the seven-mode orbit requirement)",
      "docs/ARCHITECTURE_MAP.md (Layer 1 boundary notes: the tier-to-family bijection registration)",
      "scrum/plan/harmonic-comprehension-map.md (sections 2.6/2.7: the membrane boundary; interpretation vocabulary only)",
      "provenance/DECISION_LEDGER.md (ENTRY 15's D7 clause, lines 2703-2712: the D7 hypothesis tier fence; ENTRY 16's GOV-524 scope)",
    ],
    fences: {
      d7HypothesisTier: "D7 remains hypothesis-tier throughout: no D7 claim event, no D7 record amendment, no D7 derivation admission; ENTRY 15's D7 clause carries forward verbatim (provenance/DECISION_LEDGER.md:2703-2712)",
      measurementOnly: "the bijection probe is measurement; the finding is the probe's verdict computed from bytes; neither is a claim event, neither amends records, neither touches the GOVERNS relation's formal status",
      governsAdmission: "none; the semantic binding (what the coordinate-covariant bijection means for GOVERNS) is separately gated per the bindingGate block",
      directionalSemantics: "no directional-semantics assignment; the directional-semantics gate remains open",
      g1Intra330: "untouched",
      inv5: "no INV-5 graduation",
      mWalkability: "no M-walkability promotion",
      canonical: "no canonical/Court/schema/Neo4j writes; all sources read-only",
      d4Record: "no movement: ENTRY 10 immutable, ENTRY 15 unchanged, ENTRY 16 unchanged",
      membrane: "the frame (scrum/plan/harmonic-comprehension-map.md sections 2.6/2.7) is interpretation vocabulary only; never a probe input, design input, or admitted canon claim",
      sessionProse: "context, not evidence",
      claimEvent: "no claim event fires in the probe build; the finding tier and the claim scope are conditionally pre-authorized per OD-76-4 and ruled separately",
    },
    notAccomplished: [
      "no claim event; no record amendment (ENTRY 10/15/16 byte-untouched; BL-061/062, BL-068, BL-075 as landed)",
      "no GOVERNS admission; no GOVERNS authority change; the binding interpretation of the covariance result stays separately gated",
      "no G1 movement (no intra-330 edges assumed, emitted, or consumed); no INV-5 graduation; no M-walkability promotion",
      "no mechanism claim beyond the measured permutation tables (the probe measures the action; the why of the correspondence remains open)",
      "no canonical/Court/schema/Neo4j writes; no ledger writes",
      "no directional-semantics assignment; no lens application as evidence; the frame is vocabulary, not input; session prose is context, not evidence",
      "no C2 endorsement; no orientation-bit resolution",
      "the probe tests the coordinate-covariance at family and office level; it does not fire the claim event or set its scope (OD-76-4)",
    ],
  };
  const investigationFingerprint = sha256(canonicalText(core));
  return { ...core, investigationFingerprint };
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
    maps: investigation.probe.mapCatalog.map((map) => map.unit === 1 ? `${map.id}: identity` : `${map.id}: x -> ${map.unit}x`),
    familyPermutation: Object.fromEntries(MAP_CATALOG.map((map) => [
      map.id,
      investigation.probe.familyPermutation[map.id].map((row) => `${row.sourceFamily}->${row.imageFamily}`).join(", "),
    ])),
    fragmentCount: investigation.probe.fragmentAudit.fragmentCount,
    absentCount: investigation.probe.fragmentAudit.absentCount,
    branch: investigation.branch.label,
    findingTier: investigation.finding.tier,
    investigationFingerprint: investigation.investigationFingerprint,
  };
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) throw new Error("STALE_BL076_BIJECTION_PROBE");
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

