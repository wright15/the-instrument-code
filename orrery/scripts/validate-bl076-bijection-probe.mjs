#!/usr/bin/env node
/**
 * Validate the generated BL-076 bijection probe against its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger and the chain
 * artifacts (BL-075, BL-068, BL-061/062); re-derives the anchor partition and
 * the masks; re-applies the four coordinate maps to all 70 anchor masks with
 * image lookups in the ledger; re-derives the family and office permutation
 * tables, the fragment/absent audit, the table composition, the interval
 * structure of the pairing, the crossing and the verdict; re-checks the
 * landed cross-checks; re-checks the artifact fingerprint; statically
 * verifies the generator's family-core region (forbidden expectation reads
 * absent, required masks-only tokens present); and runs mutation probes
 * (artifact drift, smuggled reads, presence-strip, and the verdict-logic
 * probes for a ledger-absent image and a family fragment). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl076-bijection-probe.v1.json";
const GENERATOR_PATH = "scripts/build-bl076-bijection-probe.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl076-bijection-probe.v1";
const INVESTIGATION_ID = "BL076_BIJECTION_PROBE_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const BL075_PATH = "orrery/src/generated/bl075-coordinate-search.v1.json";
const BL068_PATH = "orrery/src/generated/bl068-d7-asymmetry.v1.json";
const BL061_062_PATH = "orrery/src/generated/d4-zresidual-hunt.v1.json";

const BL075_FINGERPRINT = "88838e225276432427f2a7c765d8e1f9105c5c6bd87d4db04ef5e1bb2e93704e";
const BL068_FINGERPRINT = "b0d65bd6149978de4f5ef3f1a0b281d0f6324a81114e8aa9da07eda8ef5ef849";
const BL061_062_FINGERPRINT = "e1b3f655b7d79c67e2002ef2bf6da5db298bcd846306db6878896b3f24c4cd8a";

const MAPS = [
  { id: "T1", unit: 5 },
  { id: "T2", unit: 7 },
  { id: "RHO", unit: 11 },
  { id: "ID", unit: 1 },
];
const TIERS = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];
const UNITS = [1, 5, 7, 11];
const EXPECTED_FAMILY_INVOLUTION = {
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
const EXPECTED_Z_PAIR = ["7-Z37", "7-Z17"];
const EXPECTED_IV_UNIQUE = ["7-1", "7-35", "7-8", "7-34"];
const EXPECTED_PAIRS = [["7-1", "7-35"], ["7-8", "7-34"], ["7-Z37", "7-Z17"]];
const EXPECTED_CROSSING = [
  { from: "D7", to: "A0", family: "7-1", imageFamily: "7-35" },
  { from: "D6", to: "A1", family: "7-8", imageFamily: "7-34" },
];
const BRANCH_LABELS = ["COVARIANT_CONFIRMED", "COVARIANT_PARTIAL", "COVARIANT_REFUTED"];

function fail(message) {
  throw new Error(`INVALID_BL076_BIJECTION_PROBE: ${message}`);
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

function parsePitchSet(text) {
  const trimmed = text.replace(/[{}]/g, "");
  if (trimmed.length === 0) return [];
  return trimmed.split(",").map((value) => Number(value));
}

const cmp = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const cmpNumericStrings = (left, right) => Number(left) - Number(right);

function maskOfPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
}

function affineMask(mask, unit) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) {
    if ((mask >> pitch) & 1) image |= 1 << ((unit * pitch) % 12);
  }
  return image & 4095;
}

function icVector(mask) {
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

// ---------------------------------------------------------------------------
// Independent re-derivation
// ---------------------------------------------------------------------------

function reDerive(sources) {
  const { ledgerRows, bl075, bl068, bl061062 } = sources;
  if (ledgerRows.length !== 462) fail(`ledger census ${ledgerRows.length}`);

  const masks = new Map();
  const index = new Map();
  for (const row of ledgerRows) {
    const mask = maskOfPitches(parsePitchSet(row.pitchSet));
    if (mask !== Number(row.id)) fail(`ledger mask/id disagreement at ${row.id}`);
    masks.set(String(row.id), mask);
    if (index.has(mask)) fail(`duplicate mask ${mask}`);
    index.set(mask, row);
  }
  if (index.size !== 462) fail(`mask universe census ${index.size}`);

  const anchorRowsByTier = {};
  let anchorTotal = 0;
  for (const tier of TIERS) {
    const rows = ledgerRows
      .filter((row) => row.tier === tier && row.role === "anchor")
      .sort((left, right) => cmpNumericStrings(left.id, right.id));
    if (rows.length !== 7) fail(`tier ${tier} anchor census ${rows.length}`);
    anchorRowsByTier[tier] = rows;
    anchorTotal += rows.length;
  }
  if (anchorTotal !== 70) fail(`anchor total ${anchorTotal}`);
  const anchorIds = new Set(ledgerRows.filter((row) => row.role === "anchor").map((row) => String(row.id)));
  if (anchorIds.size !== 70) fail(`anchor identity census ${anchorIds.size}`);

  const familyTables = {};
  const officeTables = {};
  const imagesByMap = {};
  for (const map of MAPS) {
    familyTables[map.id] = {};
    officeTables[map.id] = {};
    const images = [];
    for (const tier of TIERS) {
      const rows = anchorRowsByTier[tier];
      const members = [];
      const imageFamilies = [];
      let absentCount = 0;
      for (const row of rows) {
        const mask = masks.get(String(row.id));
        const imageMask = affineMask(mask, map.unit);
        const imageRow = index.get(imageMask);
        if (imageRow === undefined) {
          absentCount += 1;
          members.push({ tier, state: String(row.id), mask, imageMask, imageState: null, imageFamily: null, imageTier: null, imageOffice: null, imageOfficeIndex: null });
          continue;
        }
        imageFamilies.push(imageRow.forte);
        members.push({ tier, state: String(row.id), mask, imageMask, imageState: String(imageRow.id), imageFamily: imageRow.forte, imageTier: imageRow.tier, imageOffice: imageRow.office, imageOfficeIndex: Number(imageRow.officeIndex) });
      }
      const distinct = [...new Set(imageFamilies)].sort(cmp);
      const whole = absentCount === 0 && distinct.length === 1;
      familyTables[map.id][tier] = {
        tier,
        sourceFamily: rows[0].forte,
        imageFamily: whole ? distinct[0] : null,
        imageTier: whole ? members.find((member) => member.imageTier !== null).imageTier : null,
        whole,
        absentCount,
      };
      if (whole && new Set(members.filter((member) => member.imageTier !== null).map((member) => member.imageTier)).size !== 1) {
        fail(`tier ${tier} map ${map.id}: image tiers not unanimous`);
      }
      const officeEntries = rows
        .slice()
        .sort((left, right) => Number(left.officeIndex) - Number(right.officeIndex))
        .map((row) => {
          const mask = masks.get(String(row.id));
          const imageMask = affineMask(mask, map.unit);
          const imageRow = index.get(imageMask);
          return {
            office: row.office,
            officeIndex: Number(row.officeIndex),
            imageOffice: imageRow ? imageRow.office : null,
            imageOfficeIndex: imageRow ? Number(imageRow.officeIndex) : null,
            imageTier: imageRow ? imageRow.tier : null,
          };
        });
      const imageOffices = officeEntries.map((entry) => entry.imageOffice).filter((office) => office !== null);
      officeTables[map.id][tier] = {
        whole: imageOffices.length === 7 && new Set(imageOffices).size === 7,
        entries: officeEntries,
      };
      images.push(...members.map((member) => ({
        tier, state: member.state, mask: member.mask, imageMask: member.imageMask,
        imageState: member.imageState, imageFamily: member.imageFamily, imageTier: member.imageTier,
        imageOffice: member.imageOffice, imageOfficeIndex: member.imageOfficeIndex,
      })));
    }
    imagesByMap[map.id] = images;
  }

  // ---- the audit (fragments and ledger-absent images) ----------------------
  const familyFragments = [];
  const absentMasks = [];
  for (const map of MAPS) {
    for (const tier of TIERS) {
      const table = familyTables[map.id][tier];
      if (!table.whole) {
        familyFragments.push({
          map: `x -> ${map.unit}x`,
          tier,
          imageFamilies: [...new Set(imagesByMap[map.id].filter((member) => member.tier === tier && member.imageFamily !== null).map((member) => member.imageFamily))].sort(cmp),
          absentCount: table.absentCount,
        });
      }
      for (const member of imagesByMap[map.id]) {
        if (member.tier === tier && member.imageState === null) {
          absentMasks.push({ map: `x -> ${map.unit}x`, tier, state: member.state, mask: member.mask, imageMask: member.imageMask });
        }
      }
    }
  }
  const officeFragments = [];
  for (const map of MAPS) {
    for (const tier of TIERS) {
      const table = officeTables[map.id][tier];
      if (!table.whole) {
        officeFragments.push({
          map: `x -> ${map.unit}x`,
          tier,
          imageOffices: table.entries.map((entry) => entry.imageOffice).filter((office) => office !== null),
        });
      }
    }
  }
  let wholeFamilyBlocks = 0;
  let familyBlockCount = 0;
  for (const map of MAPS) {
    for (const tier of TIERS) {
      familyBlockCount += 1;
      if (familyTables[map.id][tier].whole) wholeFamilyBlocks += 1;
    }
  }
  let wholeOfficeTiers = 0;
  let officeTierCount = 0;
  for (const map of MAPS) {
    for (const tier of TIERS) {
      officeTierCount += 1;
      if (officeTables[map.id][tier].whole) wholeOfficeTiers += 1;
    }
  }
  const audit = {
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

  // ---- the table composition (plain-table implementation) ------------------
  function composePlain() {
    const family = { pairCount: 0, checkCount: 0, mismatchCount: 0, consistent: true, failures: [] };
    const office = { pairCount: 0, checkCount: 0, mismatchCount: 0, consistent: true, failures: [] };
    for (const outerUnit of UNITS) {
      for (const innerUnit of UNITS) {
        family.pairCount += 1;
        office.pairCount += 1;
        const productUnit = (outerUnit * innerUnit) % 12;
        for (const tier of TIERS) {
          const step = familyTables[mapIdOfUnit(innerUnit)][tier];
          if (!step.whole) continue;
          family.checkCount += 1;
          const intermediate = familyTables[mapIdOfUnit(outerUnit)][step.imageTier];
          const direct = familyTables[mapIdOfUnit(productUnit)][tier];
          const consistent = intermediate !== undefined && intermediate.whole && direct.whole &&
            direct.imageFamily === intermediate.imageFamily && direct.imageTier === intermediate.imageTier;
          if (!consistent) {
            family.consistent = false;
            family.mismatchCount += 1;
            if (family.failures.length < 8) {
              family.failures.push({
                outerUnit, innerUnit, productUnit, tier,
                composedFamily: intermediate && intermediate.whole ? intermediate.imageFamily : null,
                directFamily: direct.imageFamily,
                directTier: direct.imageTier,
              });
            }
          }
        }
        for (const tier of TIERS) {
          const table = officeTables[mapIdOfUnit(innerUnit)][tier];
          if (!table.whole) continue;
          const directTier = officeTables[mapIdOfUnit(productUnit)][tier];
          if (!directTier.whole) {
            office.consistent = false;
            office.mismatchCount += 1;
            if (office.failures.length < 8) office.failures.push({ outerUnit, innerUnit, productUnit, tier, direct: "not whole" });
            continue;
          }
          for (const entry of table.entries) {
            office.checkCount += 1;
            const intermediateTier = officeTables[mapIdOfUnit(outerUnit)][entry.imageTier];
            const intermediateEntry = intermediateTier !== undefined && intermediateTier.whole
              ? intermediateTier.entries.find((candidate) => candidate.officeIndex === entry.imageOfficeIndex)
              : null;
            const directEntry = directTier.entries.find((candidate) => candidate.officeIndex === entry.officeIndex);
            const consistent = intermediateEntry !== null && intermediateEntry !== undefined && directEntry !== undefined &&
              intermediateEntry.imageOffice === directEntry.imageOffice && intermediateEntry.imageTier === directEntry.imageTier;
            if (!consistent) {
              office.consistent = false;
              office.mismatchCount += 1;
              if (office.failures.length < 8) {
                office.failures.push({
                  outerUnit, innerUnit, productUnit, tier, office: entry.office,
                  composedOffice: intermediateEntry ? intermediateEntry.imageOffice : null,
                  directOffice: directEntry ? directEntry.imageOffice : null,
                });
              }
            }
          }
        }
      }
    }
    return { family, office };
  }
  const composition = composePlain();
  const compositionConsistent = composition.family.consistent && composition.office.consistent;

  // ---- the expectation comparison -----------------------------------------
  const mismatches = [];
  for (const map of MAPS) {
    const involutive = map.unit === 5 || map.unit === 7;
    for (const tier of TIERS) {
      const row = familyTables[map.id][tier];
      const target = involutive ? EXPECTED_FAMILY_INVOLUTION[row.sourceFamily] : row.sourceFamily;
      if (row.imageFamily !== target) {
        mismatches.push({
          map: map.id,
          tier,
          sourceFamily: row.sourceFamily,
          measured: row.imageFamily,
          expected: target === undefined ? null : target,
        });
      }
    }
  }
  const expectation = { exact: mismatches.length === 0, mismatches };

  // --- the interval structure of the pairing --------------------------------
  const familiesByIv = new Map();
  const ivByFamily = new Map();
  for (const row of ledgerRows) {
    const iv = icVector(masks.get(String(row.id)));
    const key = iv.join(",");
    if (!familiesByIv.has(key)) familiesByIv.set(key, { iv, families: new Set() });
    familiesByIv.get(key).families.add(row.forte);
    if (ivByFamily.has(row.forte) && ivByFamily.get(row.forte) !== key) fail(`family ${row.forte}: interval vector drift`);
    ivByFamily.set(row.forte, key);
  }
  const sharedIvClasses = [...familiesByIv.values()]
    .filter((entry) => entry.families.size > 1)
    .map((entry) => ({ iv: entry.iv, families: [...entry.families].sort(cmp) }))
    .sort((left, right) => cmp(left.families[0], right.families[0]));
  const pairRows = EXPECTED_PAIRS.map((pair) => {
    const sameIv = ivByFamily.get(pair[0]) === ivByFamily.get(pair[1]);
    const classification = sameIv ? "Z-partner (IV-shared)" : "IV-unique to IV-unique";
    const target = pair[0] === EXPECTED_Z_PAIR[0] ? "Z-partner (IV-shared)" : "IV-unique to IV-unique";
    return { pair, sameIv, classification, predicted: target, matches: classification === target };
  });
  const ivUniqueChecks = EXPECTED_IV_UNIQUE.map((family) => ({
    family,
    iv: ivByFamily.get(family).split(",").map(Number),
    ivUnique: familiesByIv.get(ivByFamily.get(family)).families.size === 1,
  }));
  const zPairSameIv = ivByFamily.get(EXPECTED_Z_PAIR[0]) === ivByFamily.get(EXPECTED_Z_PAIR[1]);
  const zPairClass = familiesByIv.get(ivByFamily.get(EXPECTED_Z_PAIR[0]));
  const zPairExclusive = zPairClass.families.size === 2 &&
    [...zPairClass.families].sort(cmp).join(",") === EXPECTED_Z_PAIR.slice().sort(cmp).join(",");
  const zVerified = zPairSameIv && zPairExclusive && ivUniqueChecks.every((check) => check.ivUnique) &&
    pairRows.every((row) => row.matches);
  const zStructure = {
    familyCount: new Set(ledgerRows.map((row) => row.forte)).size,
    ivByFamily: Object.fromEntries([...ivByFamily.entries()].sort((left, right) => cmp(left[0], right[0]))),
    pairs: pairRows,
    sharedIvClasses,
    ivUniqueChecks,
    zPairSameIv,
    zPairExclusive,
    verified: zVerified,
  };

  // ---- the crossing --------------------------------------------------------
  const t1 = new Map(TIERS.map((tier) => [tier, familyTables.T1[tier]]));
  const crossingPairs = EXPECTED_CROSSING.map((expected) => {
    const forward = t1.get(expected.from);
    const reverse = t1.get(expected.to);
    return {
      from: expected.from,
      to: expected.to,
      family: expected.family,
      imageFamily: forward.imageFamily,
      imageTier: forward.imageTier,
      reverseFamily: reverse.sourceFamily,
      reverseImageFamily: reverse.imageFamily,
      matches: forward.imageFamily === expected.imageFamily && forward.imageTier === expected.to &&
        reverse.imageFamily === expected.family,
    };
  });
  const crossing = {
    pairs: crossingPairs,
    interiorSwap: { pair: ["D3", "D4"], forward: t1.get("D3").imageFamily, reverse: t1.get("D4").imageFamily },
    verified: crossingPairs.every((pair) => pair.matches),
  };

  // ---- office faithfulness -------------------------------------------------
  const movedCounts = {};
  const faithfulFlags = {};
  for (const map of MAPS) {
    let moved = 0;
    let allTiersMove = true;
    for (const tier of TIERS) {
      let tierMoves = 0;
      for (const entry of officeTables[map.id][tier].entries) {
        if (entry.imageOffice !== null && entry.imageOffice !== entry.office) { moved += 1; tierMoves += 1; }
      }
      if (tierMoves === 0) allTiersMove = false;
    }
    movedCounts[map.id] = moved;
    faithfulFlags[map.id] = allTiersMove;
  }
  const officeFaithfulness = {
    movedCounts,
    faithful: [5, 7, 11].every((unit) => faithfulFlags[MAPS.find((map) => map.unit === unit).id]),
  };

  // ---- the verdict (factored for the logic probes) -------------------------
  const branch = {
    label: computeBranchFrom(expectation.exact, audit, compositionConsistent, zVerified, crossing.verified),
  };

  return {
    sources,
    masks,
    index,
    anchorRowsByTier,
    units: UNITS,
    familyTables,
    officeTables,
    imagesByMap,
    audit,
    composition,
    expectation,
    zStructure,
    crossing,
    officeFaithfulness,
    branch,
  };
}

function mapIdOfUnit(unit) {
  const map = MAPS.find((candidate) => candidate.unit === unit);
  if (!map) fail(`unknown unit ${unit}`);
  return map.id;
}

function computeBranchFrom(expectationExact, audit, compositionConsistent, zVerified, crossingVerified) {
  const allFamilyWhole = audit.wholeFamilyBlocks === audit.familyBlockCount &&
    audit.familyFragments.length === 0 && audit.absentCount === 0;
  const allOfficeWhole = audit.wholeOfficeTiers === audit.officeTierCount && audit.officeFragments.length === 0;
  const confirmed = allFamilyWhole && allOfficeWhole && expectationExact &&
    compositionConsistent && zVerified && crossingVerified;
  const partial = !confirmed && (audit.wholeFamilyBlocks > 0 || audit.wholeOfficeTiers > 0);
  return confirmed ? "COVARIANT_CONFIRMED" : partial ? "COVARIANT_PARTIAL" : "COVARIANT_REFUTED";
}

// ---------------------------------------------------------------------------
// Artifact checks
// ---------------------------------------------------------------------------

function checkAgainstSources(artifact, derived) {
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.investigationId !== INVESTIGATION_ID) {
    fail("artifact header drift");
  }
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== GENERATOR_PATH) fail("generator path drift");

  const bindingPaths = artifact.sourceBindings.map((binding) => binding.artifact);
  if (canonicalText([...bindingPaths].sort()) !== canonicalText([
    BL075_PATH, BL068_PATH, BL061_062_PATH, LEDGER_PATH,
  ].sort())) fail("source binding set drift");
  for (const binding of artifact.sourceBindings) {
    if (binding.sha256 !== fileSha(binding.artifact)) fail(`source binding sha drift: ${binding.artifact}`);
  }
  if (artifact.base.bl075.investigationFingerprint !== BL075_FINGERPRINT) fail("BL-075 chain literal drift");
  if (artifact.base.bl068.derivationFingerprint !== BL068_FINGERPRINT) fail("BL-068 chain literal drift");
  if (artifact.base.bl061_062.huntFingerprint !== BL061_062_FINGERPRINT) fail("BL-061/062 chain literal drift");
  const { investigationFingerprint: bl075Fingerprint, ...bl075Core } = derived.sources.bl075;
  if (sha256(canonicalText(bl075Core)) !== bl075Fingerprint || bl075Fingerprint !== BL075_FINGERPRINT) {
    fail("BL-075 fingerprint self-check drift");
  }
  const { derivationFingerprint: bl068Fingerprint, ...bl068Core } = derived.sources.bl068;
  if (sha256(canonicalText(bl068Core)) !== bl068Fingerprint || bl068Fingerprint !== BL068_FINGERPRINT) {
    fail("BL-068 fingerprint self-check drift");
  }
  const { huntFingerprint: bl061062Fingerprint, ...bl061062Core } = derived.sources.bl061062;
  if (sha256(canonicalText(bl061062Core)) !== bl061062Fingerprint || bl061062Fingerprint !== BL061_062_FINGERPRINT) {
    fail("BL-061/062 fingerprint self-check drift");
  }

  // pre-registration
  const pre = artifact.preRegistration;
  if (canonicalText(pre.rulings.map((ruling) => ruling.id)) !== canonicalText(["OD-76-1", "OD-76-2", "OD-76-3", "OD-76-4"])) {
    fail("ruling inventory drift");
  }
  if (!pre.reframing.includes("family-level")) fail("reframing drift");
  if (canonicalText(pre.expectation.familyInvolution.pairs) !== canonicalText(EXPECTED_PAIRS)) fail("expectation pair drift");
  if (canonicalText(pre.expectation.familyInvolution.fixed) !== canonicalText(["7-22", "7-15", "7-Z12", "7-33"])) {
    fail("expectation fixed drift");
  }
  if (canonicalText(pre.expectation.crossing) !== canonicalText(EXPECTED_CROSSING)) fail("expectation crossing drift");
  if (!pre.expectation.zStructure.prediction.includes("Z-partners map to Z-partners")) fail("z prediction drift");
  if (canonicalText(Object.keys(pre.gates).sort()) !== canonicalText(["V-BC-1", "V-BC-2", "V-BC-3", "V-BC-4"])) {
    fail("pre-registered gate inventory drift");
  }
  if (canonicalText(Object.keys(pre.branchTable).sort()) !== canonicalText([
    "covariantConfirmed", "covariantPartial", "covariantRefuted", "predicted",
  ])) fail("branch table inventory drift");
  if (!pre.branchTable.predicted.startsWith("COVARIANT_CONFIRMED")) fail("predicted branch drift");

  // probe catalog and census
  const probe = artifact.probe;
  if (probe.mapCatalog.length !== 4) fail("map catalog inventory drift");
  for (const map of MAPS) {
    const entry = probe.mapCatalog.find((candidate) => candidate.id === map.id);
    if (!entry) fail(`map catalog missing ${map.id}`);
    if (entry.unit !== map.unit || entry.translation !== 0) fail(`map catalog identity drift ${map.id}`);
    if (typeof entry.role !== "string" || entry.role.length === 0) fail(`map catalog role drift ${map.id}`);
  }
  if (canonicalText(probe.anchorTiers) !== canonicalText(TIERS)) fail("anchor tiers drift");
  if (canonicalText(probe.anchorCensus) !== canonicalText({ anchors: 70, perTier: 7, dAnchors: 49, aAnchors: 21 })) {
    fail("anchor census drift");
  }

  // the permutation tables
  for (const map of MAPS) {
    const expectedRows = TIERS.map((tier) => {
      const table = derived.familyTables[map.id][tier];
      return { tier, sourceFamily: table.sourceFamily, imageFamily: table.imageFamily, imageTier: table.imageTier };
    });
    if (canonicalText(probe.familyPermutation[map.id]) !== canonicalText(expectedRows)) {
      fail(`family permutation drift: ${map.id}`);
    }
    for (const tier of TIERS) {
      if (canonicalText(probe.officePermutation[map.id][tier]) !== canonicalText(derived.officeTables[map.id][tier].entries)) {
        fail(`office permutation drift: ${map.id}/${tier}`);
      }
    }
    if (canonicalText(probe.anchorImages[map.id]) !== canonicalText(derived.imagesByMap[map.id])) {
      fail(`anchor images drift: ${map.id}`);
    }
  }

  // the audit
  if (canonicalText(probe.fragmentAudit) !== canonicalText(derived.audit)) fail("fragment audit drift");

  // the composition consistency
  if (canonicalText(probe.compositionConsistency.familyLevel) !== canonicalText(derived.composition.family)) {
    fail("family composition drift");
  }
  if (canonicalText(probe.compositionConsistency.officeLevel) !== canonicalText(derived.composition.office)) {
    fail("office composition drift");
  }
  if (canonicalText(probe.compositionConsistency.involutions) !== canonicalText([
    { expression: "T1 o T1", result: "ID" },
    { expression: "T2 o T2", result: "ID" },
    { expression: "RHO o RHO", result: "ID" },
    { expression: "T1 o T2 = T2 o T1", result: "RHO" },
  ])) fail("involution inventory drift");
  const compositionConsistent = derived.composition.family.consistent && derived.composition.office.consistent;
  if (probe.compositionConsistency.verified !== compositionConsistent) fail("composition verified flag drift");

  // the interval structure
  const zSubset = {
    familyCount: probe.zStructure.familyCount,
    ivByFamily: probe.zStructure.ivByFamily,
    pairs: probe.zStructure.pairs,
    sharedIvClasses: probe.zStructure.sharedIvClasses,
    ivUniqueChecks: probe.zStructure.ivUniqueChecks,
    zPairSameIv: probe.zStructure.zPairSameIv,
    zPairExclusive: probe.zStructure.zPairExclusive,
    verified: probe.zStructure.verified,
  };
  if (canonicalText(zSubset) !== canonicalText(derived.zStructure)) fail("interval structure drift");
  if (!probe.zStructure.statement.includes("IV-shared")) fail("interval structure statement drift");

  // the crossing
  const crossingSubset = {
    pairs: probe.crossing.pairs,
    interiorSwap: probe.crossing.interiorSwap,
    verified: probe.crossing.verified,
  };
  if (canonicalText(crossingSubset) !== canonicalText(derived.crossing)) fail("crossing drift");
  if (!probe.crossing.statement.includes("fa/ti")) fail("crossing statement drift");

  // the expectation comparison
  if (canonicalText(probe.expectationCheck) !== canonicalText(derived.expectation)) fail("expectation comparison drift");

  // office faithfulness
  if (canonicalText(probe.officeFaithfulness.movedCounts) !== canonicalText(derived.officeFaithfulness.movedCounts)) {
    fail("office moved counts drift");
  }
  if (probe.officeFaithfulness.faithful !== derived.officeFaithfulness.faithful) fail("office faithful flag drift");

  // the verdict
  if (canonicalText(artifact.branch.preRegisteredLabels) !== canonicalText(BRANCH_LABELS)) fail("branch label inventory drift");
  if (canonicalText(artifact.branch.fired) !== canonicalText([derived.branch.label])) fail("fired branch drift");
  if (artifact.branch.label !== derived.branch.label) fail("branch label drift");
  if (artifact.branch.predicted !== "COVARIANT_CONFIRMED") fail("branch predicted drift");
  if (artifact.branch.matchesPrediction !== (derived.branch.label === "COVARIANT_CONFIRMED")) fail("branch prediction flag drift");
  if (!artifact.branch.statement.includes(derived.branch.label)) fail("branch statement drift");
  const expectedFindingTier = derived.branch.label === "COVARIANT_CONFIRMED" ? "probe-verified" : "hypothesis-bounded";
  if (artifact.finding.tier !== expectedFindingTier) fail("finding tier drift");
  if (!artifact.finding.statement.includes("OD-76-4")) fail("finding statement drift");
  if (!artifact.finding.claimScope.includes("edge-content level") && !artifact.finding.claimScope.includes("may include")) {
    fail("finding claim scope drift");
  }

  // the gates (computed)
  const dFamilyFragments = derived.audit.familyFragments.filter((fragment) => fragment.tier.startsWith("D"));
  const dAbsent = derived.audit.absentMasks.filter((record) => record.tier.startsWith("D"));
  const aFamilyFragments = derived.audit.familyFragments.filter((fragment) => fragment.tier.startsWith("A"));
  const aOfficeFragments = derived.audit.officeFragments.filter((fragment) => fragment.tier.startsWith("A"));
  const aAbsent = derived.audit.absentMasks.filter((record) => record.tier.startsWith("A"));
  const expectedGateResults = {
    "V-BC-1": dFamilyFragments.length === 0 && dAbsent.length === 0 ? "PASS" : "FAIL",
    "V-BC-2": aFamilyFragments.length === 0 && aOfficeFragments.length === 0 && aAbsent.length === 0 ? "PASS" : "FAIL",
    "V-BC-3": compositionConsistent ? "PASS" : "FAIL",
    "V-BC-4": derived.crossing.verified ? "PASS" : "ABSENT",
  };
  for (const gate of ["V-BC-1", "V-BC-2", "V-BC-3", "V-BC-4"]) {
    if (artifact.gates[gate].result !== expectedGateResults[gate]) fail(`gate drift: ${gate}`);
  }
  if (!artifact.gates["V-BC-1"].statement.includes("49 D-tier anchors")) fail("V-BC-1 statement drift");
  if (!artifact.gates["V-BC-2"].statement.includes("21 A-tier anchors")) fail("V-BC-2 statement drift");
  if (!artifact.gates["V-BC-3"].statement.includes("16 map pairs")) fail("V-BC-3 statement drift");
  if (!artifact.gates["V-BC-4"].statement.includes("both directions")) fail("V-BC-4 statement drift");

  // accounting, gates of record, fences
  if (artifact.bindingGate.status !== "SEPARATELY_GATED") fail("binding gate status drift");
  if (!artifact.bindingGate.statement.includes("OD-76-4")) fail("binding gate fence drift");
  if (artifact.accounting.masksOnly.length < 3 || artifact.accounting.canonicalComputation.length < 3 ||
      artifact.accounting.remainingGranted.length < 3) fail("accounting tier inventory drift");
  if (!artifact.fences.d7HypothesisTier.includes("2703-2712")) fail("D7 fence drift");
  if (!artifact.fences.measurementOnly.includes("bijection probe is measurement")) fail("measurement fence drift");
  if (!artifact.fences.governsAdmission.includes("separately gated")) fail("governs fence drift");
  if (!artifact.fences.membrane.includes("never a probe input")) fail("membrane fence drift");
  if (!artifact.fences.claimEvent.includes("conditionally pre-authorized")) fail("claim fence drift");

  // cross-checks and chain key-for-key
  const cross = artifact.crossChecks;
  if (cross.bl075Anchor.matchesDerived !== true || cross.bl068Anchor.matchesDerived !== true ||
      cross.bl061062Anchor.matchesDerived !== true) fail("cross-check flags drift");
  if (cross.chainFingerprints.bl075 !== BL075_FINGERPRINT || cross.chainFingerprints.bl068 !== BL068_FINGERPRINT ||
      cross.chainFingerprints.bl061_062 !== BL061_062_FINGERPRINT) fail("cross-check fingerprint drift");
  if (!cross.bl075Anchor.statement.includes("unit group")) fail("BL-075 anchor statement drift");
  if (!cross.bl068Anchor.statement.includes("contact-target")) fail("BL-068 anchor statement drift");
  if (cross.bl061062Anchor.tiers.length !== 7) fail("BL-061/062 tier cross-check inventory drift");
  for (const entry of cross.bl061062Anchor.tiers) {
    const rows = derived.anchorRowsByTier[entry.tier];
    if (!rows || entry.family !== rows[0].forte || entry.matchesDerived !== true) {
      fail(`BL-061/062 tier cross-check drift: ${entry.tier}`);
    }
    const landed = derived.sources.bl061062.dTierTiers.find((candidate) => candidate.tier === entry.tier);
    if (!landed || canonicalText(landed.anchors.map(String).sort(cmpNumericStrings)) !==
        canonicalText(rows.map((row) => String(row.id)).sort(cmpNumericStrings))) {
      fail(`BL-061/062 landed anchor drift: ${entry.tier}`);
    }
  }
  if (artifact.contractCitations.length < 10) fail("contract citation inventory drift");
  if (artifact.notAccomplished.length < 6) fail("notAccomplished inventory drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no claim event"))) fail("notAccomplished claim item drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no GOVERNS admission"))) fail("notAccomplished admission item drift");
  if (!artifact.notAccomplished.some((item) => item.includes("OD-76-4"))) fail("notAccomplished scope item drift");
}

// ---------------------------------------------------------------------------
// Static generator checks
// ---------------------------------------------------------------------------

function staticFamilyCoreCheck(sourceText) {
  const begin = sourceText.indexOf("FAMILY-CORE-BEGIN");
  const end = sourceText.indexOf("FAMILY-CORE-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator family-core markers missing");
  const head = sourceText.slice(0, end);
  const region = sourceText.slice(begin, end);
  const headForbidden = [
    /\b7-[0-9]+\b/, /7-Z[0-9]+/,
    /COVARIANT/, /confirm/i, /refut/i,
    /observed/, /coverage/, /\bnearMiss\b/, /\bphiWitnesses\b/, /uKeys/,
    /d7ModalRows/, /d7SeatContactRows/, /d6SatelliteRows/, /d7AnchorRows/,
    /zPartner/, /disposition/i, /session/i, /expect/i, /predict/i,
  ];
  const regionForbidden = [...headForbidden, /readJson/, /fileSha/];
  for (const pattern of headForbidden) {
    if (pattern.test(head)) fail(`forbidden token before the family-core end: ${pattern}`);
  }
  for (const pattern of regionForbidden) {
    if (pattern.test(region)) fail(`generator family-core reads a forbidden input: ${pattern}`);
  }
  const required = [
    "maskOfRow", "unitsOfZ12", "affineMapOfMask", "composeAffineMap", "icVectorOfMask",
    "anchorRowsByTier", "maskIndex", "familyAction", "officeAction", "fragmentAudit",
    "klein4TableComposition",
  ];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator family-core is missing a required masks-only token: ${token}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = {
    ledgerRows: parseCsv(read(LEDGER_PATH)),
    bl075: readJson(BL075_PATH),
    bl068: readJson(BL068_PATH),
    bl061062: readJson(BL061_062_PATH),
  };

  const derived = reDerive(sources);
  checkAgainstSources(artifact, derived);

  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");

  const generatorSource = read(GENERATOR_PATH);
  staticFamilyCoreCheck(generatorSource);

  const repin = (candidate) => {
    const { investigationFingerprint: ignored, ...probeCore } = candidate;
    void ignored;
    return { ...probeCore, investigationFingerprint: sha256(canonicalText(probeCore)) };
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

  const rowOf = (table, sourceFamily) => table.find((row) => row.sourceFamily === sourceFamily);
  const driftProbes = [
    ["map catalog unit flip", (candidate) => { candidate.probe.mapCatalog[0].unit = 7; }],
    ["map catalog translation flip", (candidate) => { candidate.probe.mapCatalog[0].translation = 1; }],
    ["map catalog entry strip", (candidate) => { candidate.probe.mapCatalog.pop(); }],
    ["anchor tier order flip", (candidate) => { candidate.probe.anchorTiers.reverse(); }],
    ["anchor census per-tier flip", (candidate) => { candidate.probe.anchorCensus.perTier = 8; }],
    ["T1 family pair swap", (candidate) => { rowOf(candidate.probe.familyPermutation.T1, "7-1").imageFamily = "7-22"; }],
    ["T1 fixed family flip", (candidate) => { rowOf(candidate.probe.familyPermutation.T1, "7-22").imageFamily = "7-35"; }],
    ["T2 family divergence", (candidate) => { rowOf(candidate.probe.familyPermutation.T2, "7-35").imageFamily = "7-22"; }],
    ["RHO family non-trivial", (candidate) => { rowOf(candidate.probe.familyPermutation.RHO, "7-1").imageFamily = "7-35"; }],
    ["ID family non-trivial", (candidate) => { rowOf(candidate.probe.familyPermutation.ID, "7-8").imageFamily = "7-34"; }],
    ["family source label drift", (candidate) => { candidate.probe.familyPermutation.T1[0].sourceFamily = "7-99"; }],
    ["family image tier drift", (candidate) => { rowOf(candidate.probe.familyPermutation.T1, "7-1").imageTier = "D6"; }],
    ["office T1 A0 entry flip", (candidate) => { candidate.probe.officePermutation.T1.A0[0].imageOffice = "Moon"; }],
    ["office T1 A1 entry flip", (candidate) => { candidate.probe.officePermutation.T1.A1[1].imageOffice = "Saturn"; }],
    ["office T2 A2 entry flip", (candidate) => { candidate.probe.officePermutation.T2.A2[3].imageOffice = "Jupiter"; }],
    ["office RHO A0 entry flip", (candidate) => { candidate.probe.officePermutation.RHO.A0[3].imageOffice = "Mars"; }],
    ["office ID entry flip", (candidate) => { candidate.probe.officePermutation.ID.D5[0].imageOffice = "Mars"; }],
    ["office image tier drift", (candidate) => { candidate.probe.officePermutation.T1.D7[0].imageTier = "D6"; }],
    ["office entry strip", (candidate) => { candidate.probe.officePermutation.T1.D3.pop(); }],
    ["anchor images mask drift", (candidate) => { candidate.probe.anchorImages.T1[0].imageMask = 1; }],
    ["anchor images family drift", (candidate) => { candidate.probe.anchorImages.T1[0].imageFamily = "7-22"; }],
    ["anchor images state strip", (candidate) => { candidate.probe.anchorImages.ID.pop(); }],
    ["fragment count flip", (candidate) => { candidate.probe.fragmentAudit.fragmentCount = 1; }],
    ["absent count flip", (candidate) => { candidate.probe.fragmentAudit.absentCount = 1; }],
    ["whole family blocks flip", (candidate) => { candidate.probe.fragmentAudit.wholeFamilyBlocks = 39; }],
    ["whole office tiers flip", (candidate) => { candidate.probe.fragmentAudit.wholeOfficeTiers = 39; }],
    ["injected family fragment", (candidate) => {
      candidate.probe.fragmentAudit.familyFragments.push({ map: "x -> 5x", tier: "D7", imageFamilies: ["7-1", "7-35"], absentCount: 0 });
    }],
    ["injected absent mask", (candidate) => {
      candidate.probe.fragmentAudit.absentMasks.push({ map: "x -> 5x", tier: "D7", state: "127", mask: 127, imageMask: 4095 });
    }],
    ["injected office fragment", (candidate) => {
      candidate.probe.fragmentAudit.officeFragments.push({ map: "x -> 5x", tier: "A0", imageOffices: ["Sun"] });
    }],
    ["composition family consistent flip", (candidate) => { candidate.probe.compositionConsistency.familyLevel.consistent = false; }],
    ["composition family mismatch flip", (candidate) => { candidate.probe.compositionConsistency.familyLevel.mismatchCount = 1; }],
    ["composition office consistent flip", (candidate) => { candidate.probe.compositionConsistency.officeLevel.consistent = false; }],
    ["composition checkcount flip", (candidate) => { candidate.probe.compositionConsistency.officeLevel.checkCount = 0; }],
    ["composition involutions strip", (candidate) => { candidate.probe.compositionConsistency.involutions.pop(); }],
    ["composition verified flip", (candidate) => { candidate.probe.compositionConsistency.verified = false; }],
    ["z verified flip", (candidate) => { candidate.probe.zStructure.verified = false; }],
    ["z pair classification flip", (candidate) => { candidate.probe.zStructure.pairs[2].classification = "IV-unique to IV-unique"; }],
    ["z shared classes strip", (candidate) => { candidate.probe.zStructure.sharedIvClasses.pop(); }],
    ["z pair exclusive flip", (candidate) => { candidate.probe.zStructure.zPairExclusive = false; }],
    ["z iv unique flip", (candidate) => { candidate.probe.zStructure.ivUniqueChecks[0].ivUnique = false; }],
    ["crossing verified flip", (candidate) => { candidate.probe.crossing.verified = false; }],
    ["crossing image family drift", (candidate) => { candidate.probe.crossing.pairs[0].imageFamily = "7-34"; }],
    ["crossing pair strip", (candidate) => { candidate.probe.crossing.pairs.pop(); }],
    ["crossing interior swap drift", (candidate) => { candidate.probe.crossing.interiorSwap.forward = "7-Z12"; }],
    ["expectation exact flip", (candidate) => { candidate.probe.expectationCheck.exact = false; }],
    ["expectation mismatch inject", (candidate) => {
      candidate.probe.expectationCheck.mismatches.push({ map: "T1", tier: "D7", sourceFamily: "7-1", measured: "7-35", expected: "7-22" });
    }],
    ["office moved counts drift", (candidate) => { candidate.probe.officeFaithfulness.movedCounts.T1 = 0; }],
    ["office faithful flip", (candidate) => { candidate.probe.officeFaithfulness.faithful = false; }],
    ["branch label flip", (candidate) => { candidate.branch.label = "COVARIANT_PARTIAL"; }],
    ["branch fired strip", (candidate) => { candidate.branch.fired = []; }],
    ["branch prediction flip", (candidate) => { candidate.branch.matchesPrediction = false; }],
    ["finding tier flip", (candidate) => { candidate.finding.tier = "hypothesis-bounded"; }],
    ["gate V-BC-1 flip", (candidate) => { candidate.gates["V-BC-1"].result = "FAIL"; }],
    ["gate V-BC-2 flip", (candidate) => { candidate.gates["V-BC-2"].result = "FAIL"; }],
    ["gate V-BC-3 flip", (candidate) => { candidate.gates["V-BC-3"].result = "FAIL"; }],
    ["gate V-BC-4 flip", (candidate) => { candidate.gates["V-BC-4"].result = "ABSENT"; }],
    ["chain fingerprint zero bl075", (candidate) => { candidate.base.bl075.investigationFingerprint = "0".repeat(64); }],
    ["chain fingerprint zero bl068", (candidate) => { candidate.base.bl068.derivationFingerprint = "0".repeat(64); }],
    ["chain fingerprint zero bl061", (candidate) => { candidate.base.bl061_062.huntFingerprint = "0".repeat(64); }],
    ["cross-check tier strip", (candidate) => { candidate.crossChecks.bl061062Anchor.tiers.pop(); }],
    ["ruling inventory strip", (candidate) => { candidate.preRegistration.rulings.pop(); }],
    ["source binding sha tamper", (candidate) => { candidate.sourceBindings[0].sha256 = "0".repeat(64); }],
    ["accounting strip", (candidate) => { candidate.accounting.masksOnly = []; }],
    ["fence strip", (candidate) => { candidate.fences.claimEvent = "none"; }],
    ["notAccomplished strip", (candidate) => { candidate.notAccomplished = []; }],
    ["binding gate flip", (candidate) => { candidate.bindingGate.status = "BOUND"; }],
  ];
  for (const [label, mutate] of driftProbes) {
    const candidate = clone(artifact);
    mutate(candidate);
    expectRejection(label, candidate);
  }
  {
    const mutatedFingerprint = clone(artifact);
    mutatedFingerprint.investigationFingerprint = "0".repeat(64);
    const { investigationFingerprint: ignoredFingerprint, ...mutatedCore } = mutatedFingerprint;
    void ignoredFingerprint;
    if (sha256(canonicalText(mutatedCore)) === mutatedFingerprint.investigationFingerprint) {
      fail("fingerprint probe not rejected: zeroed fingerprint");
    }
  }

  const staticProbes = [
    ["smuggled family-literal read", "const drawn = \"7-35\"; void drawn;"],
    ["smuggled artifact read", "const drawn = readJson(BL075_PATH); void drawn;"],
    ["smuggled z-partner read", "const drawn = ledgerRows[0].zPartner; void drawn;"],
    ["smuggled recorded-status read", "const drawn = ledgerRows[0].observedStatus; void drawn;"],
    ["smuggled verdict token", "const drawn = \"COVARIANT_CONFIRMED\"; void drawn;"],
  ];
  let staticRejections = 0;
  for (const [label, smuggled] of staticProbes) {
    let rejected = false;
    try {
      staticFamilyCoreCheck(generatorSource.replace(
        "export function maskOfRow(row) {",
        `export function maskOfRow(row) { ${smuggled}`,
      ));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    staticRejections += 1;
  }

  const stripProbes = [
    "maskOfRow", "affineMapOfMask", "unitsOfZ12", "icVectorOfMask",
    "anchorRowsByTier", "familyAction", "klein4TableComposition",
  ];
  for (const token of stripProbes) {
    let rejected = false;
    try {
      staticFamilyCoreCheck(generatorSource.split(token).join("STRIPPED"));
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`presence-strip probe not rejected: ${token}`);
    staticRejections += 1;
  }

  // verdict-logic probes: a ledger-absent image and a family fragment must
  // both flip the computed verdict away from full confirmation (fail-loud).
  {
    const absentAudit = clone(derived.audit);
    absentAudit.absentCount = 1;
    absentAudit.absentMasks = [{ map: "x -> 5x", tier: "D7", state: "127", mask: 127, imageMask: 4095 }];
    absentAudit.wholeFamilyBlocks = 39;
    const absentLabel = computeBranchFrom(derived.expectation.exact, absentAudit, true, true, true);
    if (absentLabel !== "COVARIANT_PARTIAL") fail("ledger-absent logic probe not rejected");
  }
  {
    const fragmentAudit = clone(derived.audit);
    fragmentAudit.familyFragments = [{ map: "x -> 5x", tier: "D7", imageFamilies: ["7-1", "7-35"], absentCount: 0 }];
    fragmentAudit.fragmentCount = 1;
    fragmentAudit.wholeFamilyBlocks = 39;
    const fragmentLabel = computeBranchFrom(derived.expectation.exact, fragmentAudit, true, true, true);
    if (fragmentLabel !== "COVARIANT_PARTIAL") fail("family-fragment logic probe not rejected");
  }

  console.log(JSON.stringify({
    artifact: ARTIFACT_PATH,
    status: "PASS",
    investigationFingerprint: artifact.investigationFingerprint,
    chainFingerprints: {
      bl075: BL075_FINGERPRINT,
      bl068: BL068_FINGERPRINT,
      bl061_062: BL061_062_FINGERPRINT,
    },
    familyPermutation: Object.fromEntries(MAPS.map((map) => [
      map.id,
      TIERS.map((tier) => `${derived.familyTables[map.id][tier].sourceFamily}->${derived.familyTables[map.id][tier].imageFamily}`).join(", "),
    ])),
    fragmentCount: derived.audit.fragmentCount,
    absentCount: derived.audit.absentCount,
    branch: derived.branch.label,
    mutationProbes: driftProbes.length + 1 + staticProbes.length + stripProbes.length + 2,
    probeStaticRejections: staticRejections,
  }, null, 2));
}

validate();




