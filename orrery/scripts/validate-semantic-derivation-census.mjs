#!/usr/bin/env node
/**
 * Validate the generated BL-035 semantic-derivation census against its sources.
 *
 * Independent of the builder: re-reads the bipartite containment matrix, the
 * parallel-signature strata, the heptatonic ledger, the A0 candidate scope, the
 * canonical office profiles, and the court substrate registry, then re-derives
 * the claimant classifications, the four-way totals, the conflict inventory,
 * the strata, the heptatonic baseline coverage, and the fingerprint.
 * Fail-loud; no inference beyond the enumerated sources.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/semantic-derivation-census.v1.json";
const SCHEMA_VERSION = "harmonic-orrery.semantic-derivation-census.v1";
const CENSUS_ID = "SEMANTIC_DERIVATION_CENSUS_v1";
const BIPARTITE_PATH = "derived/hypergraph/bipartite-inclusion-v1.json";
const SIGNATURES_PATH = "derived/hypergraph/parallel-signatures-v1.json";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const A_CANDIDATE_PATH = "canonical/harmonic-compression-candidates/CH_A012_q_v1.json";
const PROFILES_PATH = "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json";
const SUBSTRATE_PATH = "seven-governors-court-substrate-v0.1.0/canonical/substrate-registry-release.json";

const CLASS_OF = {
  zero: "zero-claimant",
  single: "single-claimant",
  agreeing: "multi-claimant-agreeing",
  conflicting: "multi-claimant-conflicting",
};

function fail(message) {
  throw new Error(`INVALID_SEMANTIC_DERIVATION_CENSUS: ${message}`);
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
    if (!Number.isInteger(value)) fail("non-integer number in census payload");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalText).join(",")}]`;
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

function main() {
  const artifactPath = path.join(root, ARTIFACT_PATH);
  if (!fs.existsSync(artifactPath)) {
    fail(`missing artifact ${ARTIFACT_PATH}`);
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  if (artifact.schemaVersion !== SCHEMA_VERSION || artifact.censusId !== CENSUS_ID || artifact.status !== "planning_evidence") {
    fail(`artifact envelope is ${artifact.schemaVersion} / ${artifact.censusId} / ${artifact.status}`);
  }
  const { censusFingerprint, ...core } = artifact;
  if (sha256(canonicalText(core)) !== censusFingerprint) {
    fail("censusFingerprint does not match the payload");
  }

  const sourcePaths = [
    BIPARTITE_PATH,
    SIGNATURES_PATH,
    LEDGER_PATH,
    A_CANDIDATE_PATH,
    PROFILES_PATH,
    SUBSTRATE_PATH,
  ];
  const bindings = new Map(artifact.sourceBindings.map((binding) => [binding.artifact, binding.sha256]));
  if (bindings.size !== sourcePaths.length) fail(`source binding census is ${bindings.size}`);
  for (const relativePath of sourcePaths) {
    if (bindings.get(relativePath) !== sha256(fs.readFileSync(path.join(root, relativePath)))) {
      fail(`source binding drift for ${relativePath}`);
    }
  }

  const bipartite = readJson(BIPARTITE_PATH);
  const signatures = readJson(SIGNATURES_PATH).pentatonicSignatures;
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const aCandidate = readJson(A_CANDIDATE_PATH);
  const profiles = readJson(PROFILES_PATH).profiles;
  const substrate = readJson(SUBSTRATE_PATH);

  const seedPools = profiles
    .map((profile) => ({
      office: profile.office,
      stateId: profile.canonicalIdentity.stateId,
      stateName: profile.canonicalIdentity.stateName,
      landforms: [...profile.domainReferences.landforms],
    }))
    .sort((left, right) => left.office.localeCompare(right.office));
  if (canonicalText(seedPools) !== canonicalText(artifact.seedPools)) {
    fail("seed pools disagree with the canonical profiles");
  }
  const seedStateIds = new Set(seedPools.map((seed) => seed.stateId));
  const seedByStateId = new Map(seedPools.map((seed) => [seed.stateId, seed]));
  const poolByOffice = new Map(seedPools.map((seed) => [seed.office, seed.landforms]));

  const courtPositions = substrate.courtRootedPositions
    .map((position) => ({ positionId: position.positionId, pitchClasses: [...position.pitchClasses].sort((a, b) => a - b) }))
    .sort((left, right) => left.positionId.localeCompare(right.positionId));
  if (canonicalText(courtPositions) !== canonicalText(artifact.scope.courtPositions)) {
    fail("court positions disagree with the substrate registry");
  }

  const aA0 = new Map(aCandidate.records.filter((record) => record.tier === "A0").map((record) => [record.stateId, record]));
  const courtContentBySeed = new Map();
  for (const seed of seedPools) {
    const record = aA0.get(seed.stateId);
    if (!record) fail(`A-candidate has no A0 record for seed ${seed.stateId}`);
    const seedPitchClasses = new Set(record.pitchClasses);
    courtContentBySeed.set(
      seed.stateId,
      courtPositions
        .filter((position) => position.pitchClasses.every((pitchClass) => seedPitchClasses.has(pitchClass)))
        .map((position) => position.positionId),
    );
  }

  const heptatonicByNodeId = bipartite.heptatonicNodes;
  const ledgerById = new Map(ledgerRows.map((record) => [Number(record.id), record]));
  const records = [];
  for (const [id, record] of Object.entries(bipartite.pentatonicSubnodes)) {
    const signature = signatures[id];
    if (!signature) fail(`pentatonic node ${id} has no signature record`);
    const windowsByParent = new Map((signature.kernelWindows ?? []).map((entry) => [entry.parent, entry.window ?? null]));
    const claimants = record.parentsRooted
      .filter((parentId) => seedStateIds.has(heptatonicByNodeId[parentId].pitchMask))
      .map((parentId) => {
        const seedStateId = heptatonicByNodeId[parentId].pitchMask;
        return {
          seedStateId,
          office: seedByStateId.get(seedStateId).office,
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

  const derivedTotals = [CLASS_OF.single, CLASS_OF.agreeing, CLASS_OF.conflicting, CLASS_OF.zero].map((classification) => ({
    classification,
    count: records.filter((record) => record.classification === classification).length,
  }));
  if (canonicalText(derivedTotals) !== canonicalText(artifact.pentatonicCensus.classTotals)) {
    fail("four-way class totals drift");
  }
  const derivedHistogram = sortedCounts(records, (record) => String(record.claimantCount)).map((entry) => ({ claimantCount: Number(entry.name), count: entry.count }));
  if (canonicalText(derivedHistogram) !== canonicalText(artifact.pentatonicCensus.claimantHistogram)) {
    fail("claimant histogram drift");
  }

  const compact = (record) => `${record.id}|${record.classification}|${record.claimants.map((claimant) => `${claimant.seedStateId}:${claimant.office}:${claimant.window}`).join(",")}`;
  if (JSON.stringify(records.map(compact)) !== JSON.stringify(artifact.pentatonicCensus.records.map(compact))) {
    fail("per-node claimant classification drift");
  }

  const derivedConflicts = records
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
  if (canonicalText(derivedConflicts) !== canonicalText(artifact.pentatonicCensus.conflictInventory)) {
    fail("conflict inventory drift");
  }

  const derivedStrata = {
    byClaimantCount: crossTab(records, (record) => record.classification, (record) => String(record.claimantCount)),
    byDiatonicParentCount: crossTab(records, (record) => record.classification, (record) => String(record.diatonicParentCount)),
    byCensusBridge: crossTab(records, (record) => record.classification, (record) => (record.isCensusBridge ? "bridge" : "interior")),
    byKernelWindow: crossTab(records, (record) => record.classification, (record) => (record.hasKernelWindow ? "windowed" : "unwindowed")),
  };
  if (canonicalText(derivedStrata) !== canonicalText(artifact.pentatonicCensus.strata)) {
    fail("strata cross-tabs drift");
  }

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
  const baselineCompact = (record) => `${record.nodeId}|${record.pitchMask}|${record.tier}|${record.role}|${record.office ?? ""}`;
  if (JSON.stringify(nonSeedHeptatonic.map(baselineCompact)) !== JSON.stringify(artifact.heptatonicBaseline.records.map(baselineCompact))) {
    fail("heptatonic baseline table drift");
  }
  const officeBearing = nonSeedHeptatonic.filter((record) => record.office !== null).length;
  const coverage = { withOffice: officeBearing, withoutOffice: nonSeedHeptatonic.length - officeBearing };
  if (canonicalText(coverage) !== canonicalText(artifact.heptatonicBaseline.officeCoverage)) {
    fail("office coverage drift");
  }
  if (canonicalText(sortedCounts(nonSeedHeptatonic, (record) => record.tier || "unassigned")) !== canonicalText(artifact.heptatonicBaseline.byTier)) {
    fail("baseline tier census drift");
  }

  if (artifact.directionFields.directionAssigned !== false
    || artifact.directionFields.kernelWindowRecorded !== true
    || artifact.directionFields.courtContentRecorded !== true) {
    fail("direction fields are not the recorded unassigned verdict");
  }

  console.log(
    JSON.stringify({
      verdict: "PASS",
      schemaVersion: artifact.schemaVersion,
      pentatonic: records.length,
      classTotals: derivedTotals,
      conflicts: derivedConflicts.length,
      baseline: { count: nonSeedHeptatonic.length, ...coverage },
      censusFingerprint,
    }),
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
