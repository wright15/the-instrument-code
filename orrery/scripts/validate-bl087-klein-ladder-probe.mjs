#!/usr/bin/env node
/**
 * Validate the generated BL-087 Klein-4 <-> ladder probe against its sources.
 *
 * Independent of the generator: re-reads the 462-record ledger, the network,
 * and the landed BL-075/BL-076/BL-084/BL-073/BL-072/d-tier-probe artifacts;
 * re-derives the image orders, the position permutations, the window
 * censuses (through an independently written satellite-to-parent data flow),
 * the hypothesis verdicts, the relocation and cut-sensitivity diagnostics,
 * and the D2-trio arithmetic; re-checkes the artifact fingerprint; re-checks
 * the zero-Klein unlanded flag by re-reading the BL-086 memo; statically
 * verifies the generator's two-region isolation (forbidden reads absent from
 * the intrinsic region; the comparison region's labelled reads present - the
 * region-scoping proof); and runs mutation probes (artifact drift, smuggled
 * reads, presence-strip). Fail-loud.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..", "..");

const ARTIFACT_PATH = "orrery/src/generated/bl087-klein-ladder-probe.v1.json";
const GENERATOR_PATH = "scripts/build-bl087-klein-ladder-probe.mjs";
const SCHEMA_VERSION = "harmonic-orrery.bl087-klein-ladder-probe.v1";
const INVESTIGATION_ID = "BL087_KLEIN_LADDER_PROBE_V1";
const LEDGER_PATH = "canonical/universal-heptatonic-ledger.csv";
const NETWORK_PATH = "canonical/universal-network-data.json";
const BL075_PATH = "orrery/src/generated/bl075-coordinate-search.v1.json";
const BL076_PATH = "orrery/src/generated/bl076-bijection-probe.v1.json";
const BL084_PATH = "orrery/src/generated/bl084-window-ladder.v1.json";
const BL073_PATH = "orrery/src/generated/bl073-isometry-probe.v1.json";
const BL072_PATH = "orrery/src/generated/bl072-composite-mechanism.v1.json";
const PROBE_PATH = "orrery/src/generated/d-tier-operator-probe.v1.json";
const BL086_MEMO_PATH = "scrum/plan/bl-086-term-b-own-tier-memo.md";

const BL075_FINGERPRINT = "88838e225276432427f2a7c765d8e1f9105c5c6bd87d4db04ef5e1bb2e93704e";
const BL076_FINGERPRINT = "81e6cf7211a94888c2adedeebc44674a6e4a78e5e8b3fc09bb7a8fd671569d1e";
const BL084_FINGERPRINT = "6865b0760c398dff857e3234b46cd8845647411f53bca3b502c6fbceb36d1a53";
const BL073_FINGERPRINT = "811fa786f3a03b03b0c334fe797c85b9b4aeed93332a183be43f86fa1133a65c";
const BL072_FINGERPRINT = "45d0afd1f7e8a8af88c3357bc4c9a2b513e6fcb9ab597d4764047862ca4ddb85";
const PROBE_FINGERPRINT = "068f9007c7330f84b9654547da7d0be0593276053df98c3b9f7893426f03ab22";

const MAP_CATALOG = [
  { id: "T1", unit: 5 },
  { id: "T2", unit: 7 },
  { id: "RHO", unit: 11 },
  { id: "ID", unit: 1 },
];
const ANCHOR_TIERS = ["A0", "A1", "A2", "D1", "D2", "D3", "D4", "D5", "D6", "D7"];

function fail(message) {
  throw new Error(`INVALID_BL087_KLEIN_LADDER_PROBE: ${message}`);
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
  return text.replace(/[{}]/g, "").split(",").filter((value) => value.length > 0).map(Number);
}

const cmp = (left, right) => (left < right ? -1 : left > right ? 1 : 0);

function maskFromPitches(pitches) {
  let mask = 0;
  for (const pitch of pitches) mask |= 1 << pitch;
  return mask;
}

function affineApply(mask, unit) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) image |= 1 << ((unit * pitch) % 12);
  return image & 4095;
}

function translateApply(mask, offset) {
  let image = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) image |= 1 << ((pitch + offset) % 12);
  return image & 4095;
}

function hamming(left, right) {
  let value = left ^ right;
  let count = 0;
  while (value !== 0) { count += value & 1; value >>= 1; }
  return count;
}

function pcSum(mask) {
  let sum = 0;
  for (let pitch = 0; pitch < 12; pitch += 1) if ((mask >> pitch) & 1) sum += pitch;
  return sum;
}

// ---------------------------------------------------------------------------
// Independent re-derivation (satellite-to-parent data flow)
// ---------------------------------------------------------------------------

function independentCensus(order, layerIds, masks, allIds) {
  const reaches = [];
  for (const satellite of layerIds) {
    const parentIndices = [];
    order.forEach((anchor, index) => {
      if (hamming(masks.get(anchor), masks.get(satellite)) === 2) parentIndices.push(index);
    });
    if (parentIndices.length === 0) continue;
    reaches.push({ state: satellite, indices: parentIndices });
  }
  reaches.sort((left, right) => Math.min(...left.indices) - Math.min(...right.indices) || left.indices.length - right.indices.length || cmp(left.state, right.state));
  const windows = reaches.map((entry) => {
    const start = Math.min(...entry.indices);
    const end = Math.max(...entry.indices);
    return { state: entry.state, size: entry.indices.length, start, end, consecutive: end - start + 1 === entry.indices.length };
  });
  const perAnchorCounts = order.map((anchor, index) => reaches.filter((entry) => entry.indices.includes(index)).length);
  const allConsecutive = windows.every((window) => window.consecutive);
  const sizeHistogram = {};
  for (const window of windows) sizeHistogram[String(window.size)] = (sizeHistogram[String(window.size)] ?? 0) + 1;
  const hasTerminal = windows.some((window) => window.size === 1);
  const hasInterior = windows.some((window) => window.size >= 2);
  let mirror = null;
  if (order.length === 7) {
    const byReflection = new Map(allIds.map((state) => [affineApply(masks.get(state), 11), state]));
    mirror = windows.every((window) => {
      const partner = byReflection.get(masks.get(window.state));
      if (partner === undefined) return false;
      const partnerWindow = windows.find((entry) => entry.state === partner);
      return partnerWindow ? partnerWindow.start === 6 - window.end && partnerWindow.end === 6 - window.start : false;
    });
  }
  const shapeClass = !allConsecutive ? "NON_CONSECUTIVE"
    : hasTerminal && hasInterior ? "TWO_REGIME"
      : hasInterior ? "SLIDING_ONE_REGIME" : "SINGLETON_PARTITION";
  const verdict = shapeClass === "NON_CONSECUTIVE" ? "ABSENT" : shapeClass === "TWO_REGIME" && mirror === true ? "FULL" : "PARTIAL";
  const size = order.length;
  const allCyclicIntervals = reaches.every((entry) => {
    if (entry.indices.length === 1) return true;
    for (let start = 0; start < size; start += 1) {
      const run = new Set();
      for (let step = 0; step < entry.indices.length; step += 1) run.add((start + step) % size);
      if (run.size === entry.indices.length && entry.indices.every((index) => run.has(index))) return true;
    }
    return false;
  });
  return {
    allCyclicIntervals,
    windows,
    spanning: windows.filter((window) => !window.consecutive).map((window) => window.state).sort(cmp),
    perAnchorCounts,
    sizeHistogram,
    allConsecutive,
    mirror,
    shapeClass,
    verdict,
    reachedCount: windows.length,
  };
}

function expectedCensusFields(census) {
  return {
    allConsecutive: census.allConsecutive,
    sizeHistogram: census.sizeHistogram,
    perAnchorCounts: census.perAnchorCounts,
    mirror: census.mirror,
    shapeClass: census.shapeClass,
    verdict: census.verdict,
    reachedCount: census.reachedCount,
  };
}

function buildSources() {
  const ledgerRows = parseCsv(read(LEDGER_PATH));
  const network = readJson(NETWORK_PATH);
  const bl075 = readJson(BL075_PATH);
  const bl076 = readJson(BL076_PATH);
  const bl084 = readJson(BL084_PATH);
  const bl073 = readJson(BL073_PATH);
  const bl072 = readJson(BL072_PATH);
  const probe = readJson(PROBE_PATH);
  const masks = new Map(ledgerRows.map((row) => [String(row.id), maskFromPitches(parsePitchSet(row.pitchSet))]));
  const allIds = ledgerRows.map((row) => String(row.id));
  const rowByMask = new Map(ledgerRows.map((row) => [maskFromPitches(parsePitchSet(row.pitchSet)), row]));
  const rowById = new Map(ledgerRows.map((row) => [String(row.id), row]));
  const layerOf = (tier) => ledgerRows.filter((row) => row.tier === tier && row.role === "satellite").map((row) => String(row.id)).sort((left, right) => Number(left) - Number(right));

  const successor = new Map(network.d7ModalRows.map((row) => [String(row.source), String(row.target)]));
  const d7Order = [];
  let cursor = "127";
  for (let step = 0; step < 7; step += 1) { d7Order.push(cursor); cursor = successor.get(cursor); }
  if (cursor !== "127") fail("modal orbit does not close");
  const a0Order = bl073.cycles.A0.order.slice();
  const a1Order = probe.modalClosure.aToA.cycles.find((cycle) => cycle.tier === "A1").stateIds.map(String);

  const correspondingLayer = {
    A0: bl084.scopeB.supplementaryCycles.find((record) => record.tier === "A0").topLayers[0],
    A1: bl084.scopeB.supplementaryCycles.find((record) => record.tier === "A1").topLayers[0],
    D7: bl084.scopeB.cycles.find((record) => record.tier === "D7").topLayers[0],
    D6: bl084.scopeB.cycles.find((record) => record.tier === "D6").topLayers[0],
  };

  return { ledgerRows, network, bl075, bl076, bl084, bl073, bl072, probe, masks, allIds, rowByMask, rowById, layerOf, d7Order, a0Order, a1Order, correspondingLayer };
}

function reDerive(sources) {
  const { ledgerRows, masks, allIds, rowByMask, rowById, layerOf, d7Order, a0Order, a1Order, correspondingLayer } = sources;
  const imageOf = (order, unit) => order.map((state) => {
    const row = rowByMask.get(affineApply(masks.get(state), unit));
    if (row === undefined) fail(`independent re-derivation: ledger-absent image of ${state} under x${unit}`);
    return String(row.id);
  });
  const familyOf = (order) => [...new Set(order.map((state) => rowById.get(state).forte))];
  const tierOf = (order) => [...new Set(order.map((state) => rowById.get(state).tier))];

  const matrix = [];
  for (const orderId of ["A0", "D7", "A1"]) {
    const base = orderId === "A0" ? a0Order : orderId === "D7" ? d7Order : a1Order;
    for (const map of MAP_CATALOG) {
      const image = imageOf(base, map.unit);
      const families = familyOf(image);
      const tiers = tierOf(image);
      const layerTier = tiers.length === 1 ? correspondingLayer[tiers[0]] ?? null : null;
      const census = layerTier ? independentCensus(image, layerOf(layerTier), masks, allIds) : null;
      matrix.push({
        id: `${map.id}-on-${orderId}`,
        image,
        imageFamily: families.length === 1 ? families[0] : null,
        imageTier: tiers.length === 1 ? tiers[0] : null,
        correspondingLayer: layerTier,
        census,
      });
    }
  }
  const rowFor = (id) => matrix.find((row) => row.id === id);

  const relocation = (() => {
    const base = independentCensus(a1Order, layerOf("A2"), masks, allIds);
    const image = imageOf(a1Order, 11);
    const moved = independentCensus(image, layerOf("A2"), masks, allIds);
    return { baseSpanning: base.spanning, movedSpanning: moved.spanning, movedCensus: moved, baseCensus: base };
  })();

  const cyclicIntervals = {
    A0: independentCensus(a0Order, layerOf("A0"), masks, allIds).allCyclicIntervals,
    D7: independentCensus(d7Order, layerOf("D6"), masks, allIds).allCyclicIntervals,
    A1: independentCensus(a1Order, layerOf("A2"), masks, allIds).allCyclicIntervals,
  };

  const cutSensitivity = (order, layerTier) => {
    const cuts = [];
    for (let shift = 0; shift < 7; shift += 1) {
      const rotated = [...order.slice(shift), ...order.slice(0, shift)];
      const census = independentCensus(rotated, layerOf(layerTier), masks, allIds);
      cuts.push({ shift, allConsecutive: census.allConsecutive, verdict: census.verdict });
    }
    return cuts;
  };

  const d2Pairs = [["471", "1479"], ["2283", "2787"], ["3189", "3441"]].map(([left, right]) => {
    const rotation6 = translateApply(masks.get(left), 6) === masks.get(right) || translateApply(masks.get(right), 6) === masks.get(left);
    const displacement = Math.abs(pcSum(masks.get(left)) - pcSum(masks.get(right)));
    return { pair: [left, right], rotation6, displacement6: displacement === 6, dual: rotation6 && displacement === 6 };
  });

  return { matrix, rowFor, relocation, cutSensitivity, cyclicIntervals, d2Pairs, sources };
}

// ---------------------------------------------------------------------------
// Artifact comparison
// ---------------------------------------------------------------------------

function deepEqual(left, right) {
  return canonicalText(left) === canonicalText(right);
}

function checkAgainstArtifact(artifact, derived) {
  const { matrix, rowFor, relocation, cutSensitivity, cyclicIntervals, d2Pairs, sources } = derived;

  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");

  if (artifact.schemaVersion !== SCHEMA_VERSION) fail("schema version drift");
  if (artifact.investigationId !== INVESTIGATION_ID) fail("investigation id drift");
  if (artifact.status !== "planning_evidence") fail("status drift");
  if (artifact.generator !== GENERATOR_PATH) fail("generator path drift");

  // pre-registration presence
  if (artifact.preRegistration.rulings.map((ruling) => ruling.id).join(",") !== "H2-criterion,H1-H3-base,ledger-absent-images,landing-form") fail("pre-registration rulings drift");
  if (artifact.preRegistration.predictions.map((prediction) => prediction.id).join(",") !== "H1,H2,H3,H4") fail("pre-registration predictions drift");
  if (artifact.preRegistration.refutationConditions.map((condition) => condition.id).join(",") !== "a,b,c,partial") fail("pre-registration refutation conditions drift");
  if (!artifact.preRegistration.fenceNote.includes("no leaning")) fail("pre-registration fence note drift");
  if (!artifact.preRegistration.operationalizations.some((entry) => entry.id === "OP-1")) fail("OP-1 missing");
  if (!artifact.preRegistration.operationalizations.some((entry) => entry.id === "OP-1-sanity-gate")) fail("OP-1 sanity gate missing");

  // chain fingerprints
  if (artifact.base.bl075.investigationFingerprint !== BL075_FINGERPRINT) fail("BL-075 fingerprint drift");
  if (artifact.base.bl076.investigationFingerprint !== BL076_FINGERPRINT) fail("BL-076 fingerprint drift");
  if (artifact.base.bl084.investigationFingerprint !== BL084_FINGERPRINT) fail("BL-084 fingerprint drift");
  if (artifact.base.bl073.investigationFingerprint !== BL073_FINGERPRINT) fail("BL-073 fingerprint drift");
  if (artifact.base.bl072.investigationFingerprint !== BL072_FINGERPRINT) fail("BL-072 fingerprint drift");
  if (artifact.base.probe.probeFingerprint !== PROBE_FINGERPRINT) fail("probe fingerprint drift");

  // sanity gate
  if (artifact.sanityGate.verdict !== "PASS") fail("sanity gate verdict drift");
  if (artifact.sanityGate.checks.length !== 3) fail("sanity gate check census drift");
  if (!artifact.sanityGate.checks.every((check) => check.pass === true)) fail("sanity gate check drift");
  const t1OnD7 = sources.d7Order.map((state) => String(sources.rowByMask.get(affineApply(sources.masks.get(state), 5)).id));
  const t2OnD7 = sources.d7Order.map((state) => String(sources.rowByMask.get(affineApply(sources.masks.get(state), 7)).id));
  if (!deepEqual(t1OnD7, sources.a0Order)) fail("independent SG-1 re-derivation failed");
  if (!deepEqual(t2OnD7, [...sources.a0Order].reverse())) fail("independent SG-2 re-derivation failed");

  // matrix rows
  if (artifact.matrix.rows.length !== 12) fail("matrix row census drift");
  for (const row of artifact.matrix.rows) {
    const expected = rowFor(row.id);
    if (expected === undefined) fail(`matrix row ${row.id} unknown`);
    if (!deepEqual(row.imageOrder, expected.image)) fail(`matrix ${row.id}: image order drift`);
    if (row.imageFamily !== expected.imageFamily) fail(`matrix ${row.id}: family drift`);
    if (row.imageTier !== expected.imageTier) fail(`matrix ${row.id}: tier drift`);
    if (row.correspondingLayer !== expected.correspondingLayer) fail(`matrix ${row.id}: corresponding layer drift`);
    if (row.absent.length !== 0) fail(`matrix ${row.id}: absent images recorded (fail-loud fragment unexpected)`);
    if (expected.census !== null) {
      const compact = expectedCensusFields(expected.census);
      for (const [key, value] of Object.entries(compact)) {
        if (!deepEqual(row.windowReport.compact[key], value)) fail(`matrix ${row.id}: census ${key} drift`);
      }
      if (!deepEqual(row.windowReport.spanningWindows.map((window) => window.state).sort(cmp), expected.census.spanning)) {
        fail(`matrix ${row.id}: spanning states drift`);
      }
    }
  }

  // hypothesis verdicts
  if (artifact.hypotheses.H1.verdict !== "REFUTED") fail("H1 verdict drift");
  if (artifact.hypotheses.H1.observed.allConsecutive !== true) fail("H1 observed consecutiveness drift");
  if (artifact.hypotheses.H1.observed.spanningCount !== 0) fail("H1 observed spanning count drift");
  if (artifact.hypotheses.H1.observed.imageEqualsReversal !== true) fail("H1 image-equals-reversal drift");
  if (artifact.hypotheses.H1.observed.permutation.form !== "reflection" || artifact.hypotheses.H1.observed.permutation.inversions !== 21) fail("H1 permutation class drift");
  if (artifact.hypotheses.H1.refutationConditionFired !== "a") fail("H1 fired condition drift");

  if (artifact.hypotheses.H2.verdict !== "REFUTED") fail("H2 verdict drift");
  if (artifact.hypotheses.H2.candidates.some((candidate) => candidate.setEqual || candidate.dihedralMatch)) fail("H2 candidate match drift");
  if (artifact.hypotheses.H2.refutationConditionFired !== "b") fail("H2 fired condition drift");

  if (artifact.hypotheses.H3.verdict !== "CONFIRMED") fail("H3 verdict drift");
  if (!Object.values(artifact.hypotheses.H3.subChecks).every(Boolean)) fail("H3 sub-check drift");
  if (artifact.hypotheses.H3.observed.imageEqualsD7Order !== true) fail("H3 image-equals-D7 drift");

  if (artifact.hypotheses.H4.verdict !== "REFUTED") fail("H4 verdict drift");
  if (artifact.hypotheses.H4.observed.t2IdentityPin !== false) fail("H4 identity pin drift");
  if (artifact.hypotheses.H4.observed.t2Actual !== "the D7 reversed order") fail("H4 actual-image label drift");
  if (!deepEqual(artifact.hypotheses.H4.observed.t2Image, [...sources.d7Order].reverse())) fail("H4 actual image drift");
  if (artifact.hypotheses.H4.observed.t2Census.allConsecutive !== true || artifact.hypotheses.H4.observed.t2Census.verdict !== "FULL") fail("H4 census drift");
  if (artifact.hypotheses.H4.observed.id.imageEqualsBase !== true || artifact.hypotheses.H4.observed.id.censusEqualsLanded !== true) fail("H4 ID sanity drift");

  // diagnostics
  if (!deepEqual(artifact.diagnostics.rhoA1Relocation.baseSpanningWindows.map((window) => window.state), relocation.baseSpanning)) fail("relocation base spanning drift");
  if (!deepEqual(artifact.diagnostics.rhoA1Relocation.spanningWindows.map((window) => window.state), relocation.movedSpanning)) fail("relocation moved spanning drift");
  if (!deepEqual(artifact.diagnostics.rhoA1Relocation.permutation.sourcePositionSequence, [3, 2, 1, 0, 6, 5, 4])) fail("relocation permutation drift");
  if (artifact.diagnostics.rhoA1Relocation.permutation.wrapPairFixed !== false) fail("relocation wrap-fix drift");
  const relocationParents = artifact.diagnostics.rhoA1Relocation.spanningWindows.map((window) => window.parents.join(","));
  if (!relocationParents.every((parents) => parents === "2901,1749")) fail("relocation parent drift");

  const cutA0 = cutSensitivity(sources.a0Order, "A0");
  const cutD7 = cutSensitivity(sources.d7Order, "D6");
  const cutA1 = cutSensitivity(sources.a1Order, "A2");
  const compareCuts = (recorded, expected, label) => {
    if (recorded.length !== 7) fail(`${label}: cut census drift`);
    recorded.forEach((entry, index) => {
      if (entry.allConsecutive !== expected[index].allConsecutive || entry.verdict !== expected[index].verdict) fail(`${label}: cut ${index} drift`);
    });
  };
  compareCuts(artifact.diagnostics.cutSensitivity.A0, cutA0, "A0");
  compareCuts(artifact.diagnostics.cutSensitivity.D7, cutD7, "D7");
  compareCuts(artifact.diagnostics.cutSensitivity.A1, cutA1, "A1");
  if (!deepEqual(artifact.diagnostics.cutSensitivity.allWindowsCyclicIntervals, cyclicIntervals)) fail("cyclic-interval premise drift");
  if (!Object.values(cyclicIntervals).every(Boolean)) fail("a census carries a non-cyclic-interval window; the cut rule premise fails");
  if (cutA1[0].allConsecutive !== false) fail("A1 landed cut must be non-consecutive");
  if (cutA0[0].allConsecutive !== true) fail("A0 landed cut must be consecutive");

  if (!artifact.diagnostics.d2Trio.allDual) fail("D2 trio dual status drift");
  artifact.diagnostics.d2Trio.pairs.forEach((entry, index) => {
    if (!entry.dualPhenomenon || !d2Pairs[index].dual) fail(`D2 trio pair ${index} drift`);
    if (!deepEqual(entry.pair, d2Pairs[index].pair)) fail(`D2 trio pair ${index} identity drift`);
  });

  // the T1/T2 extension rows
  const extensionT1 = rowFor("T1-on-A1");
  const extensionT2 = rowFor("T2-on-A1");
  for (const [key, expected] of [["T1onA1", extensionT1], ["T2onA1", extensionT2]]) {
    const recorded = artifact.diagnostics.extensionRows[key];
    for (const [field, value] of Object.entries(expectedCensusFields(expected.census))) {
      if (!deepEqual(recorded.census[field], value)) fail(`extension ${key}: ${field} drift`);
    }
    if (recorded.spanningCount !== expected.census.spanning.length) fail(`extension ${key}: spanning count drift`);
  }

  // unlanded flag (re-read the memo now; fail-loud on drift)
  const memoText = read(BL086_MEMO_PATH);
  const kleinCount = (memoText.match(/Klein/g) ?? []).length;
  if (kleinCount !== 0) fail("the BL-086 memo gained Klein mentions; the zero-Klein grounding must be reconciled");
  if (artifact.grounding.unlandedFlag.kleinMentionCount !== 0) fail("unlanded flag drift");
  if (artifact.grounding.unlandedFlag.memoSha256 !== sha256(memoText)) fail("BL-086 memo sha drift");

  // correspondence table + synthesis
  if (!deepEqual(artifact.method.correspondenceTable, { A0: "A0", A1: "A2", D7: "D6", D6: "A2" })) fail("correspondence table drift");
  if (artifact.synthesis.verdict !== "INTERPRETATION_REFUTED_GEOMETRIC_FACT_STANDS") fail("synthesis verdict drift");
  if (!artifact.synthesis.fenceStatus.startsWith("MAINTAINED")) fail("fence status drift");
  if (!deepEqual(artifact.synthesis.refutationConditionsFired, { a: true, b: true, c: false })) fail("refutation condition record drift");

  // grounded orders recorded
  if (!deepEqual(artifact.grounding.landedOrders.A0.order, sources.a0Order)) fail("grounded A0 order drift");
  if (!deepEqual(artifact.grounding.landedOrders.A1.order, sources.a1Order)) fail("grounded A1 order drift");
  if (!deepEqual(artifact.grounding.landedOrders.D7, sources.d7Order)) fail("grounded D7 order drift");
  if (artifact.notAccomplished.length !== 7) fail("not-accomplished inventory drift");
  if (!artifact.notAccomplished.some((item) => item.includes("no leaning"))) fail("no-leaning non-accomplishment drift");
}

// ---------------------------------------------------------------------------
// Static generator checks (two-region)
// ---------------------------------------------------------------------------

function staticIntrinsicCheck(sourceText) {
  const begin = sourceText.indexOf("INTRINSIC-KLEIN-BEGIN");
  const end = sourceText.indexOf("INTRINSIC-KLEIN-END");
  if (begin < 0 || end < 0 || end <= begin) fail("generator intrinsic-region markers missing");
  const before = sourceText.slice(0, begin);
  const region = sourceText.slice(begin, end);
  const comparison = sourceText.slice(end);
  const forbidden = [
    /\breadJson\b/, /\bfileSha\b/, /\bread\(/, /canonical\/universal/,
    /BL075_PATH/, /BL076_PATH/, /BL084_PATH/, /BL073_PATH/, /BL072_PATH/, /PROBE_PATH/, /NETWORK_PATH/,
    /bl075/i, /bl076/i, /bl084/i, /bl073/i, /bl072/i, /d7ModalRows/, /d7SeatContactRows/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(region)) fail(`generator intrinsic region reads a forbidden input: ${pattern}`);
  }
  const forbiddenBefore = [/\bforte\b/, /\bobserved\b/, /officeIndex/, /table28/, /topLayers/];
  for (const pattern of forbiddenBefore) {
    if (pattern.test(before)) fail(`forbidden token before the intrinsic region: ${pattern}`);
  }
  // region-scoping proof: the comparison region must carry the labelled reads
  if (!/bl073\.cycles\.A0\.order/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the BL-073 A0 order");
  if (!/bl076\.probe\.familyPermutation/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the BL-076 family table");
  if (!/bl084\.scopeB/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the BL-084 top layers");
  if (!/d7ModalRows/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the network records");
  if (!/BL086_MEMO_PATH/.test(comparison)) fail("region-scoping proof failed: the comparison region does not read the BL-086 memo");
  const required = ["maskOfRow", "affineMapOfMask", "hamming12", "windowAnalysis", "shapeClassOf", "verdictOf", "compactAnalysis", "mapOrder", "permutationReport", "cutSensitivity"];
  for (const token of required) {
    if (!region.includes(token)) fail(`generator intrinsic region is missing a required masks-only token: ${token}`);
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate() {
  const artifact = readJson(ARTIFACT_PATH);
  const sources = buildSources();
  const derived = reDerive(sources);
  checkAgainstArtifact(artifact, derived);

  const { investigationFingerprint, ...artifactCore } = artifact;
  if (sha256(canonicalText(artifactCore)) !== investigationFingerprint) fail("artifact fingerprint self-check failed");

  const generatorSource = read(GENERATOR_PATH);
  staticIntrinsicCheck(generatorSource);

  const repin = (candidate) => {
    const { investigationFingerprint: ignored, ...core } = candidate;
    void ignored;
    return { ...core, investigationFingerprint: sha256(canonicalText(core)) };
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  let probeCount = 0;
  const expectRejection = (label, mutated) => {
    let rejected = false;
    try {
      checkAgainstArtifact(repin(mutated), derived);
    } catch {
      rejected = true;
    }
    if (!rejected) fail(`mutation probe not rejected: ${label}`);
    probeCount += 1;
  };

  const verdictFlip = clone(artifact);
  verdictFlip.hypotheses.H1.verdict = "CONFIRMED";
  expectRejection("H1 verdict flip", verdictFlip);
  const h1SpanFlip = clone(artifact);
  h1SpanFlip.hypotheses.H1.observed.spanningCount = 2;
  expectRejection("H1 spanning count flip", h1SpanFlip);
  const h1PermutationDrift = clone(artifact);
  h1PermutationDrift.hypotheses.H1.observed.permutation.inversions = 20;
  expectRejection("H1 permutation inversion drift", h1PermutationDrift);
  const h2MatchFlip = clone(artifact);
  h2MatchFlip.hypotheses.H2.candidates[0].dihedralMatch = true;
  expectRejection("H2 candidate match flip", h2MatchFlip);
  const h2VerdictFlip = clone(artifact);
  h2VerdictFlip.hypotheses.H2.verdict = "PARTIAL";
  expectRejection("H2 verdict flip", h2VerdictFlip);
  const h3SubCheckFlip = clone(artifact);
  h3SubCheckFlip.hypotheses.H3.subChecks.mirror = false;
  expectRejection("H3 mirror sub-check flip", h3SubCheckFlip);
  const h3ImageDrift = clone(artifact);
  h3ImageDrift.hypotheses.H3.observed.imageEqualsD7Order = false;
  expectRejection("H3 image-equals-D7 flip", h3ImageDrift);
  const h4PinFlip = clone(artifact);
  h4PinFlip.hypotheses.H4.observed.t2IdentityPin = true;
  expectRejection("H4 identity pin flip", h4PinFlip);
  const h4ActualDrift = clone(artifact);
  h4ActualDrift.hypotheses.H4.observed.t2Actual = "the A0 reversed order";
  expectRejection("H4 actual-image drift", h4ActualDrift);
  const h4CensusDrift = clone(artifact);
  h4CensusDrift.hypotheses.H4.observed.t2Census.allConsecutive = false;
  expectRejection("H4 census flip", h4CensusDrift);
  const sanityGateFlip = clone(artifact);
  sanityGateFlip.sanityGate.checks[2].pass = false;
  expectRejection("sanity gate check flip", sanityGateFlip);
  const sanityGateStrip = clone(artifact);
  sanityGateStrip.sanityGate.checks.pop();
  expectRejection("sanity gate presence strip", sanityGateStrip);
  const matrixImageDrift = clone(artifact);
  matrixImageDrift.matrix.rows[0].imageOrder = [...matrixImageDrift.matrix.rows[0].imageOrder].reverse();
  expectRejection("matrix image order drift", matrixImageDrift);
  const matrixCensusDrift = clone(artifact);
  matrixCensusDrift.matrix.rows[2].windowReport.compact.sizeHistogram = { "1": 27, "2": 11 };
  expectRejection("matrix census histogram drift", matrixCensusDrift);
  const matrixLayerDrift = clone(artifact);
  matrixLayerDrift.matrix.rows[0].correspondingLayer = "A0";
  expectRejection("matrix corresponding-layer drift", matrixLayerDrift);
  const matrixSpanningDrift = clone(artifact);
  matrixSpanningDrift.matrix.rows[10].windowReport.spanningWindows[0].state = "1359";
  expectRejection("matrix spanning state drift", matrixSpanningDrift);
  const matrixAbsentSmuggle = clone(artifact);
  matrixAbsentSmuggle.matrix.rows[5].absent = [{ state: "1451" }];
  expectRejection("matrix absent-image smuggle", matrixAbsentSmuggle);
  const matrixRowStrip = clone(artifact);
  matrixRowStrip.matrix.rows.pop();
  expectRejection("matrix row strip", matrixRowStrip);
  const relocationDrift = clone(artifact);
  relocationDrift.diagnostics.rhoA1Relocation.spanningWindows[0].state = "1359";
  expectRejection("relocation spanning drift", relocationDrift);
  const relocationParentDrift = clone(artifact);
  relocationParentDrift.diagnostics.rhoA1Relocation.spanningWindows[0].parents = ["1371", "1389"];
  expectRejection("relocation parent drift", relocationParentDrift);
  const relocationPermDrift = clone(artifact);
  relocationPermDrift.diagnostics.rhoA1Relocation.permutation.sourcePositionSequence = [6, 5, 4, 3, 2, 1, 0];
  expectRejection("relocation permutation drift", relocationPermDrift);
  const relocationWrapDrift = clone(artifact);
  relocationWrapDrift.diagnostics.rhoA1Relocation.permutation.wrapPairFixed = true;
  expectRejection("relocation wrap-fix drift", relocationWrapDrift);
  const cutA1Drift = clone(artifact);
  cutA1Drift.diagnostics.cutSensitivity.A1[1].allConsecutive = false;
  expectRejection("A1 cut-sensitivity drift", cutA1Drift);
  const cutA0Drift = clone(artifact);
  cutA0Drift.diagnostics.cutSensitivity.A0[0].verdict = "ABSENT";
  expectRejection("A0 cut-sensitivity drift", cutA0Drift);
  const cyclicPremiseDrift = clone(artifact);
  cyclicPremiseDrift.diagnostics.cutSensitivity.allWindowsCyclicIntervals = { A0: false, D7: true, A1: true };
  expectRejection("cyclic-interval premise drift", cyclicPremiseDrift);
  const d2TrioFlip = clone(artifact);
  d2TrioFlip.diagnostics.d2Trio.pairs[0].dualPhenomenon = false;
  expectRejection("D2 trio flip", d2TrioFlip);
  const extensionDrift = clone(artifact);
  extensionDrift.diagnostics.extensionRows.T1onA1.census.verdict = "ABSENT";
  expectRejection("extension T1-on-A1 census drift", extensionDrift);
  const kleinCountDrift = clone(artifact);
  kleinCountDrift.grounding.unlandedFlag.kleinMentionCount = 1;
  expectRejection("zero-Klein count drift", kleinCountDrift);
  const memoShaDrift = clone(artifact);
  memoShaDrift.grounding.unlandedFlag.memoSha256 = "0".repeat(64);
  expectRejection("BL-086 memo sha drift", memoShaDrift);
  const correspondenceDrift = clone(artifact);
  correspondenceDrift.method.correspondenceTable = { A0: "A0", A1: "A1", D7: "D6", D6: "A2" };
  expectRejection("correspondence table drift", correspondenceDrift);
  const synthesisFlip = clone(artifact);
  synthesisFlip.synthesis.verdict = "INTERPRETATION_CONFIRMED";
  expectRejection("synthesis verdict flip", synthesisFlip);
  const fenceFlip = clone(artifact);
  fenceFlip.synthesis.fenceStatus = "LIFTED: the D7 derivation route may cite the Klein-4 role";
  expectRejection("fence-status flip", fenceFlip);
  const conditionsFlip = clone(artifact);
  conditionsFlip.synthesis.refutationConditionsFired = { a: false, b: false, c: false };
  expectRejection("refutation-condition record flip", conditionsFlip);
  const chainDrift = clone(artifact);
  chainDrift.base.bl075.investigationFingerprint = "0".repeat(64);
  expectRejection("chain fingerprint drift", chainDrift);
  const preregStrip = clone(artifact);
  preregStrip.preRegistration.predictions.pop();
  expectRejection("pre-registration prediction strip", preregStrip);
  const notAccomplishedStrip = clone(artifact);
  notAccomplishedStrip.notAccomplished = ["no measurement"];
  expectRejection("not-accomplished inventory strip", notAccomplishedStrip);
  let fingerprintRejected = false;
  try {
    checkAgainstArtifact({ ...artifact, investigationFingerprint: "0".repeat(64) }, derived);
  } catch {
    fingerprintRejected = true;
  }
  if (!fingerprintRejected) fail("mutation probe not rejected: fingerprint zero");
  probeCount += 1;

  // static probes: smuggled read and presence-strip in the generator source
  const smuggled = generatorSource.replace(
    "// ==== INTRINSIC-KLEIN-BEGIN (ledger masks + affine order imaging + window machinery) ====",
    "// ==== INTRINSIC-KLEIN-BEGIN (ledger masks + affine order imaging + window machinery) ====\nconst leaked = readJson(BL075_PATH);",
  );
  let smuggledRejected = false;
  try { staticIntrinsicCheck(smuggled); } catch { smuggledRejected = true; }
  if (!smuggledRejected) fail("mutation probe not rejected: smuggled read");
  probeCount += 1;
  const presenceStrip = generatorSource.replace(/windowAnalysis/g, "wAnal");
  let strippedRejected = false;
  try { staticIntrinsicCheck(presenceStrip); } catch { strippedRejected = true; }
  if (!strippedRejected) fail("mutation probe not rejected: presence strip");
  probeCount += 1;

  const summary = {
    artifact: ARTIFACT_PATH,
    schemaVersion: artifact.schemaVersion,
    sanityGate: artifact.sanityGate.verdict,
    hypotheses: {
      H1: artifact.hypotheses.H1.verdict,
      H2: artifact.hypotheses.H2.verdict,
      H3: artifact.hypotheses.H3.verdict,
      H4: artifact.hypotheses.H4.verdict,
    },
    synthesis: artifact.synthesis.verdict,
    fenceStatus: artifact.synthesis.fenceStatus.startsWith("MAINTAINED") ? "MAINTAINED" : "UNEXPECTED",
    investigationFingerprint: artifact.investigationFingerprint,
    mutationProbesRejected: probeCount,
    staticCheck: "PASS",
  };
  console.log(JSON.stringify(summary, null, 2));
}

validate();
