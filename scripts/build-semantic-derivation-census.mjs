#!/usr/bin/env node
/**
 * Build the BL-035 semantic-derivation census.
 *
 * Read-only, two-mechanism census over the semantic derivation layer:
 * - pentatonic side (330): four-way landform-claimant classification via the
 *   seven A0 seed anchors among each node's 21 containment parents
 *   (single / multi-agreeing / multi-conflicting / zero), stratified by
 *   diatonic-parent count and bridge-parent presence;
 * - heptatonic side (455 non-A0): office-following baseline table from the
 *   canonical ledger's resolved offices.
 *
 * Direction semantics are recorded honestly: kernel-window and seed
 * court-content fields are carried per claim; no Earth-ward/Fire-ward value is
 * assigned because no admitted source maps C-position or window to directional
 * meaning. Planning evidence only; no topology claims, no G1 movement.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");

export const SCHEMA_VERSION = "harmonic-orrery.semantic-derivation-census.v1";
export const CENSUS_ID = "SEMANTIC_DERIVATION_CENSUS_v1";
export const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
export const SIGNATURES_PATH = "derived/hypergraph/parallel-signatures-v1.json";
export const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
export const A_CANDIDATE_PATH = "canonical/harmonic-compression-candidates/CH_A012_q_v1.json";
export const PROFILES_PATH = "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json";
export const SUBSTRATE_PATH = "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json";
export const OUTPUT_PATH = "orrery/src/generated/semantic-derivation-census.v1.json";

const EXPECTED_PENTATONIC = 330;
const EXPECTED_HEPTATONIC = 462;
const EXPECTED_NON_A0_HEPTATONIC = 455;
const EXPECTED_SEEDS = 7;
const EXPECTED_OFFICE_BEARING = 301;
const EXPECTED_BOUNDARY = 154;

function fail(message) {
  throw new Error(`INVALID_SEMANTIC_DERIVATION_CENSUS: ${message}`);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function fileSha(relativePath) {
  return sha256(fs.readFileSync(path.join(root, relativePath)));
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
    if (!Number.isInteger(value)) fail("non-integer number in census payload");
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalText).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalText(value[key])}`).join(",")}}`;
  }
  fail(`unsupported JSON type: ${typeof value}`);
}

function sortedCounts(values, key) {
  const counts = new Map();
  for (const value of values) {
    const bucket = key(value);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
}

function crossTab(records, classOf, keyOf) {
  const counts = new Map();
  for (const record of records) {
    const bucket = `${keyOf(record)}|${classOf(record)}`;
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }
  return [...counts]
    .map(([bucket, count]) => {
      const [stratum, classification] = bucket.split("|");
      return { stratum, classification, count };
    })
    .sort((left, right) => (left.stratum < right.stratum ? -1 : left.stratum > right.stratum ? 1 : left.classification < right.classification ? -1 : 1));
}

const CLASS_OF = {
  zero: "zero-claimant",
  single: "single-claimant",
  agreeing: "multi-claimant-agreeing",
  conflicting: "multi-claimant-conflicting",
};

export function buildCensus() {
  const bipartite = readJson(BIPARTITE_PATH);
  const signatures = readJson(SIGNATURES_PATH).pentatonicSignatures;
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const aCandidate = readJson(A_CANDIDATE_PATH);
  const profiles = readJson(PROFILES_PATH).profiles;
  const substrate = readJson(SUBSTRATE_PATH);

  if (profiles.length !== EXPECTED_SEEDS) fail(`canonical profile census is ${profiles.length}`);
  const seedPools = profiles
    .map((profile) => {
      const identity = profile.canonicalIdentity;
      if (identity.anchorTier !== "A0" || identity.forteFamily !== "7-35") {
        fail(`profile ${profile.profileId} is not an A0 7-35 seed`);
      }
      return {
        office: profile.office,
        stateId: identity.stateId,
        stateName: identity.stateName,
        landforms: [...profile.domainReferences.landforms],
      };
    })
    .sort((left, right) => left.office.localeCompare(right.office));
  const seedByStateId = new Map(seedPools.map((seed) => [seed.stateId, seed]));
  const seedStateIds = new Set(seedByStateId.keys());
  if (seedStateIds.size !== EXPECTED_SEEDS) fail("seed state ids are not unique");

  const aA0 = aCandidate.records.filter((record) => record.tier === "A0");
  if (aA0.length !== EXPECTED_SEEDS) fail(`A-candidate A0 census is ${aA0.length}`);
  for (const record of aA0) {
    if (!seedStateIds.has(record.stateId)) fail(`A-candidate A0 ${record.stateId} is not a seed`);
  }

  const ledgerById = new Map(ledgerRows.map((record) => [Number(record.id), record]));
  if (ledgerById.size !== EXPECTED_HEPTATONIC) fail(`ledger census is ${ledgerById.size}`);
  for (const seed of seedPools) {
    const ledgerRecord = ledgerById.get(seed.stateId);
    if (!ledgerRecord || ledgerRecord.office !== seed.office || ledgerRecord.tier !== "A0" || ledgerRecord.forte !== "7-35") {
      fail(`ledger disagrees with seed ${seed.office} ${seed.stateId}`);
    }
  }

  const courtPositions = substrate.courtRootedPositions
    .map((position) => ({ positionId: position.positionId, pitchClasses: [...position.pitchClasses].sort((a, b) => a - b) }))
    .sort((left, right) => left.positionId.localeCompare(right.positionId));
  if (courtPositions.length !== 5) fail(`court position census is ${courtPositions.length}`);

  const courtContentBySeed = new Map();
  for (const seed of seedPools) {
    const record = aA0.find((candidate) => candidate.stateId === seed.stateId);
    const seedPitchClasses = new Set(record.pitchClasses);
    courtContentBySeed.set(
      seed.stateId,
      courtPositions
        .filter((position) => position.pitchClasses.every((pitchClass) => seedPitchClasses.has(pitchClass)))
        .map((position) => position.positionId),
    );
  }

  const heptatonicByNodeId = bipartite.heptatonicNodes;
  const maskToHeptatonicId = new Map(
    Object.entries(heptatonicByNodeId).map(([nodeId, record]) => [record.pitchMask, nodeId]),
  );

  const poolByOffice = new Map(seedPools.map((seed) => [seed.office, seed.landforms]));

  const records = [];
  for (const [id, record] of Object.entries(bipartite.pentatonicSubnodes)) {
    const signature = signatures[id];
    if (!signature) fail(`pentatonic node ${id} has no signature record`);
    const windowsByParent = new Map(
      (signature.kernelWindows ?? []).map((entry) => [entry.parent, entry.window ?? null]),
    );
    const claimants = record.parentsRooted
      .filter((parentId) => seedStateIds.has(heptatonicByNodeId[parentId].pitchMask))
      .map((parentId) => {
        const seedStateId = heptatonicByNodeId[parentId].pitchMask;
        const seed = seedByStateId.get(seedStateId);
        if (!windowsByParent.has(parentId)) fail(`node ${id} claimant ${parentId} has no kernel window entry`);
        return {
          seedStateId,
          office: seed.office,
          window: windowsByParent.get(parentId),
          courtContent: courtContentBySeed.get(seedStateId),
        };
      })
      .sort((left, right) => left.seedStateId - right.seedStateId);

    let classification;
    if (claimants.length === 0) {
      classification = CLASS_OF.zero;
    } else if (claimants.length === 1) {
      classification = CLASS_OF.single;
    } else {
      const keys = claimants.map((claimant) => [...poolByOffice.get(claimant.office)].sort().join("|"));
      classification = keys.every((key) => key === keys[0]) ? CLASS_OF.agreeing : CLASS_OF.conflicting;
    }

    records.push({
      id,
      setClassId: record.setClassId,
      claimantCount: claimants.length,
      classification,
      claimants,
      diatonicParentCount: signature.diatonicParentCount,
      nonDiatonicParentCount: (signature.bridgeParents ?? []).length,
      isCensusBridge: signature.isBridge === true,
      hasKernelWindow: (signature.kernelWindows ?? []).some((entry) => entry.window !== null),
      signatureFamilyCount: signature.distinctFamilies,
    });
  }
  records.sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
  if (records.length !== EXPECTED_PENTATONIC) fail(`pentatonic census is ${records.length}`);

  const classTotals = [CLASS_OF.single, CLASS_OF.agreeing, CLASS_OF.conflicting, CLASS_OF.zero].map((classification) => ({
    classification,
    count: records.filter((record) => record.classification === classification).length,
  }));
  const claimantHistogram = sortedCounts(records, (record) => String(record.claimantCount)).map((entry) => ({ claimantCount: Number(entry.name), count: entry.count }));
  const claimantTotal = records.reduce((total, record) => total + record.claimantCount, 0);
  const claimedNodes = records.filter((record) => record.claimantCount > 0).length;
  if (claimantTotal !== 105 || claimedNodes !== 75) {
    fail(`claimant total is ${claimantTotal} across ${claimedNodes} nodes, expected 105 across 75`);
  }

  const conflictInventory = records
    .filter((record) => record.classification === CLASS_OF.conflicting)
    .map((record) => {
      const offices = record.claimants.map((claimant) => claimant.office);
      const pools = offices.map((office) => poolByOffice.get(office));
      const shared = pools[0].filter((landform) => pools.every((pool) => pool.includes(landform))).sort();
      return {
        id: record.id,
        setClassId: record.setClassId,
        claimants: record.claimants.map((claimant) => ({ seedStateId: claimant.seedStateId, office: claimant.office, window: claimant.window })),
        sharedLandforms: shared,
        distinctLandforms: shared.length === 0,
      };
    })
    .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));

  const nonSeedHeptatonic = Object.entries(heptatonicByNodeId)
    .filter(([, record]) => !seedStateIds.has(record.pitchMask))
    .map(([nodeId, record]) => {
      const ledgerRecord = ledgerById.get(record.pitchMask);
      if (!ledgerRecord) fail(`heptatonic node ${nodeId} has no ledger record`);
      return {
        nodeId,
        pitchMask: record.pitchMask,
        setClassId: record.setClassId,
        tier: ledgerRecord.tier,
        role: ledgerRecord.role,
        office: ledgerRecord.office || null,
      };
    })
    .sort((left, right) => left.pitchMask - right.pitchMask);
  if (nonSeedHeptatonic.length !== EXPECTED_NON_A0_HEPTATONIC) {
    fail(`non-A0 heptatonic census is ${nonSeedHeptatonic.length}`);
  }
  const officeBearing = nonSeedHeptatonic.filter((record) => record.office !== null).length;
  const withoutOffice = nonSeedHeptatonic.length - officeBearing;
  if (officeBearing !== EXPECTED_OFFICE_BEARING || withoutOffice !== EXPECTED_BOUNDARY) {
    fail(`office coverage is ${officeBearing}/${withoutOffice}`);
  }

  const sourceBindings = [
    { artifact: BIPARTITE_PATH, sha256: fileSha(BIPARTITE_PATH), role: "pentatonic containment parents" },
    { artifact: SIGNATURES_PATH, sha256: fileSha(SIGNATURES_PATH), role: "diatonic/bridge strata and kernel windows" },
    { artifact: LEDGER_PATH, sha256: fileSha(LEDGER_PATH), role: "heptatonic office/role/tier baseline" },
    { artifact: A_CANDIDATE_PATH, sha256: fileSha(A_CANDIDATE_PATH), role: "A0 seed scope and pitch classes" },
    { artifact: PROFILES_PATH, sha256: fileSha(PROFILES_PATH), role: "office seed pools and canonical identities" },
    { artifact: SUBSTRATE_PATH, sha256: fileSha(SUBSTRATE_PATH), role: "court C0-C4 position masks" },
  ];

  const core = {
    schemaVersion: SCHEMA_VERSION,
    censusId: CENSUS_ID,
    status: "planning_evidence",
    generator: "scripts/build-semantic-derivation-census.mjs",
    sourceBindings,
    scope: {
      seeds: {
        count: seedPools.length,
        forte: "7-35",
        tier: "A0",
        stateIds: seedPools.map((seed) => seed.stateId).sort((a, b) => a - b),
      },
      pentatonic: { count: records.length, claimantRule: "A0 seed anchors among each node's 21 containment parents" },
      heptatonicBaseline: {
        count: nonSeedHeptatonic.length,
        mechanism: "office-following canonical profile resolution",
        officeBearing,
        withoutOffice,
      },
      courtPositions,
    },
    seedPools,
    pentatonicCensus: {
      classTotals,
      claimantHistogram,
      records,
      strata: {
        byClaimantCount: crossTab(records, (record) => record.classification, (record) => String(record.claimantCount)),
        byDiatonicParentCount: crossTab(records, (record) => record.classification, (record) => String(record.diatonicParentCount)),
        byCensusBridge: crossTab(records, (record) => record.classification, (record) => (record.isCensusBridge ? "bridge" : "interior")),
        byKernelWindow: crossTab(records, (record) => record.classification, (record) => (record.hasKernelWindow ? "windowed" : "unwindowed")),
      },
      conflictInventory,
    },
    heptatonicBaseline: {
      records: nonSeedHeptatonic,
      byTier: sortedCounts(nonSeedHeptatonic, (record) => record.tier || "unassigned"),
      byRole: sortedCounts(nonSeedHeptatonic, (record) => record.role),
      officeCoverage: { withOffice: officeBearing, withoutOffice },
    },
    directionFields: {
      kernelWindowRecorded: true,
      courtContentRecorded: true,
      directionAssigned: false,
      basis: "no admitted source maps court position or kernel window to Earth-ward/Fire-ward meaning; direction is recorded as unassigned, never inferred",
    },
  };
  const censusFingerprint = sha256(canonicalText(core));
  return { ...core, censusFingerprint };
}

export function serializeCensus(census) {
  return `${canonicalText(census)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  const census = buildCensus();
  const serialized = serializeCensus(census);
  const outputPath = path.join(root, OUTPUT_PATH);
  if (check) {
    const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
    if (existing !== serialized) {
      throw new Error("STALE_SEMANTIC_DERIVATION_CENSUS");
    }
    console.log(
      JSON.stringify({
        output: OUTPUT_PATH,
        check: true,
        stale: false,
        classTotals: census.pentatonicCensus.classTotals,
        conflicts: census.pentatonicCensus.conflictInventory.length,
        censusFingerprint: census.censusFingerprint,
      }),
    );
    return;
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized);
  console.log(
    JSON.stringify({
      output: OUTPUT_PATH,
      check: false,
      classTotals: census.pentatonicCensus.classTotals,
      conflicts: census.pentatonicCensus.conflictInventory.length,
      censusFingerprint: census.censusFingerprint,
      sha256: sha256(serialized),
    }),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
