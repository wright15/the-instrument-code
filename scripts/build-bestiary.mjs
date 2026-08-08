import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const emit = process.argv.includes("--emit");
const TOOL_VERSION = "1.0.0";

const TARGET = "bestiary/data/bestiary-data.json";
const SCHEMA = "bestiary/data/bestiary-data.schema.json";

const toolkitDirectory = path.join(
  packageRoot,
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0",
);
const toolkitRequire = createRequire(path.join(toolkitDirectory, "package.json"));
const rootRequire = createRequire(path.join(packageRoot, "package.json"));

function loadAjv() {
  try {
    return rootRequire("ajv/dist/2020");
  } catch {
    return toolkitRequire("ajv/dist/2020");
  }
}

async function readJson(relativePath) {
  return JSON.parse(
    await readFile(path.join(packageRoot, relativePath), "utf8"),
  );
}

async function readText(relativePath) {
  return (await readFile(path.join(packageRoot, relativePath), "utf8")).trim();
}

async function hashFile(relativePath) {
  return createHash("sha256")
    .update(await readFile(path.join(packageRoot, relativePath)))
    .digest("hex");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function csvRows(relativePath) {
  const rows = parseCsv(await readText(relativePath));
  const header = rows[0];
  return rows.slice(1).map((row) => {
    const record = {};
    header.forEach((column, index) => {
      record[column] = row[index] ?? "";
    });
    return record;
  });
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function seedHash(text) {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function jitter(seed, amount = 0.04) {
  const s = seedHash(seed);
  const unit = (Math.sin(s) * 10000) % 1;
  const positive = unit >= 0 ? unit : unit + 1;
  return positive * 2 * amount - amount;
}

function numberOrNull(value) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function intOrNull(value) {
  const parsed = numberOrNull(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function textOrNull(value) {
  return value === "" ? null : value;
}

function plural(n) {
  return n === 1 ? "" : "s";
}

function ratio(value) {
  return Math.round(Number(value) * 1e6) / 1e6;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const release = await readJson("provenance/release.json");
const network = await readJson("canonical/universal-network-data.json");
const profiles = (
  await readJson(
    "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json",
  )
).profiles;
const semanticOperators = (
  await readJson(
    "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/semantic-operator-registry.json",
  )
).operators;
const operators = await csvRows(
  "seven-governors-mutation-algebra-audit/audit/operator-registry.csv",
);
const coverage = await csvRows(
  "seven-governors-mutation-algebra-audit/audit/projection-coverage.csv",
);
const commutation = await csvRows(
  "seven-governors-mutation-algebra-audit/audit/commutation-summary.csv",
);
const cycles = await csvRows(
  "seven-governors-mutation-algebra-audit/audit/cycle-identities.csv",
);
const compiled = await csvRows(
  "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/csv/compiled-profiles.csv",
);

const stateById = new Map(network.nodes.map((node) => [node.id, node]));
const profileByStateId = new Map(
  profiles.map((profile) => [profile.canonicalIdentity.stateId, profile]),
);
const compiledByStateId = new Map(
  compiled.map((row) => [
    Number(row["state_id:int"]),
    row["normal_form_id:ID(CompiledFeatureProfile)"],
  ]),
);
const semanticByStructuralId = new Map(
  semanticOperators.map((operator) => [
    operator.structuralOperatorId,
    operator.semanticOperatorId,
  ]),
);
const operatorById = new Map(operators.map((operator) => [operator.operator_id, operator]));
const coverageByOperatorId = new Map(
  coverage.map((row) => [row.operator_id, row]),
);

const tierOrder = [
  ...network.directAnchorPrecedence,
  ...network.secondOrderAnchors,
].map((entry) => entry.split(" / ")[0]);
const tierRank = new Map(tierOrder.map((tier, index) => [tier, index]));
const tierRankOf = (tier) => (tier === null ? 10 : tierRank.get(tier) ?? 10);

function assertCount(actual, expected, label) {
  if (actual !== expected) {
    fail(`bestiary count violation: ${label}: expected ${expected}, got ${actual}`);
  }
}

const scaleStates = [];
for (const node of network.nodes) {
  const pcs = [...node.pitchSet.match(/\d+/g)].map(Number);
  const mask = pcs.reduce((acc, pc) => acc | (1 << pc), 0);
  if (mask !== node.id) {
    fail(
      `bestiary pitch-set invariant violation: node ${node.id} mask ${mask} != id`,
    );
  }
  const bitMask = [...node.bit.slice(1)].reduce(
    (acc, ch, index) => acc | (ch === "1" ? 1 << index : 0),
    0,
  );
  if (bitMask !== mask) {
    fail(
      `bestiary bit-label invariant violation: node ${node.id} bit ${node.bit} does not match pcs ${node.pitchSet}`,
    );
  }
  const pcsSorted = [...pcs].sort((a, b) => a - b);
  const archetypeId = `state:${node.id}`;
  scaleStates.push({
    kind: "scaleState",
    id: archetypeId,
    name: node.name,
    admission: "admitted",
    summary: {
      narrativeKind: "deterministic_template",
      text: composeStateNarrative(node),
      model: null,
      sha256: null,
    },
    sourcePath: "canonical/universal-network-data.json",
    scatterX: scatterStateX(node, pcsSorted.length),
    scatterY: scatterStateY(node),
    nodeId: node.id,
    forte: textOrNull(node.forte),
    pitchSetMask: mask,
    pitchSetPcs: pcsSorted,
    bitLabel: node.bit,
    bitReverseLabel: node.bitReverse,
    role: node.role,
    fineRole: textOrNull(node.fineRole),
    tier: textOrNull(node.tier),
    office: textOrNull(node.office),
    officeIndex: intOrNull(node.officeIndex),
    officeBearing: node.office !== null,
    chirality: textOrNull(node.chirality),
    orientation: textOrNull(node.orientation),
    assignmentStatus: node.assignmentStatus,
    resolutionClass: textOrNull(node.resolutionClass),
    parents: (node.parents ?? []).map((parent) => parent.parentId ?? parent),
    incomingCount: 0,
    outgoingCount: 0,
    canonicalProfileId: profileByStateId.has(node.id)
      ? profileByStateId.get(node.id).profileId
      : null,
    compiledProfileId: compiledByStateId.get(node.id) ?? null,
  });
}

function composeStateNarrative(node) {
  const pcs = [...node.pitchSet.match(/\d+/g)].map(Number).sort((a, b) => a - b);
  const pcsList = pcs.join("·");
  let text;
  if (node.role === "anchor") {
    text = `Anchor of the ${node.forte} family at tier ${node.tier}. It defines its tier seat through ${node.resolutionClass ?? "canonical identity"} and bears the ${node.office} office (index ${node.officeIndex}).`;
  } else if (node.role === "satellite") {
    const parentCount = (node.parents ?? []).length;
    text = `A ${node.tier} satellite of the ${node.forte} family governed by ${node.office}. It inherits its categorical office after bridge and precedence checks, sustained by ${parentCount} selected governing parent contact${plural(parentCount)}.`;
  } else {
    text = `A boundary state of the ${node.forte} family. No declared rule authorizes a categorical office; it is categorically withheld from office bearing while remaining a registered network member.`;
  }
  text += ` Pitch set ${node.pitchSet} (mask ${pcsList}).`;
  if (node.chirality === "chiral") {
    text += ` It is chiral (${node.orientation}).`;
  } else if (node.chirality === "achiral") {
    text += " It is achiral.";
  }
  if (node.fineRole) text += ` Role: ${node.fineRole}.`;
  return text;
}

function scatterStateX(node, pcsCount) {
  const officeBase = node.officeIndex === null ? -0.5 : node.officeIndex;
  return Math.round((officeBase + (7 - pcsCount) * 0.05 + jitter(`x:${node.id}`)) * 1e4) / 1e4;
}

function scatterStateY(node) {
  return tierRankOf(textOrNull(node.tier)) + jitter(`y:${node.id}`);
}

const structuralIncoming = new Map();
const structuralOutgoing = new Map();
const fieldTouching = new Map();
for (const edge of network.structuralEdges) {
  structuralIncoming.set(edge.target, (structuralIncoming.get(edge.target) ?? 0) + 1);
  structuralOutgoing.set(edge.source, (structuralOutgoing.get(edge.source) ?? 0) + 1);
}
for (const edge of network.fieldEdges) {
  fieldTouching.set(edge.source, (fieldTouching.get(edge.source) ?? 0) + 1);
  fieldTouching.set(edge.target, (fieldTouching.get(edge.target) ?? 0) + 1);
}
for (const archetype of scaleStates) {
  archetype.incomingCount =
    (structuralIncoming.get(archetype.nodeId) ?? 0) +
    (fieldTouching.get(archetype.nodeId) ?? 0);
  archetype.outgoingCount = structuralOutgoing.get(archetype.nodeId) ?? 0;
}

const familyEntries = Object.values(network.familyRegistry);
const scaleFamilies = familyEntries.map((family) => {
  const archetypeId = `family:${family.forte}`;
  return {
    kind: "scaleFamily",
    id: archetypeId,
    name: `Forte ${family.forte} set class`,
    admission: "admitted",
    summary: {
      narrativeKind: "deterministic_template",
      text: composeFamilyNarrative(family),
      model: null,
      sha256: null,
    },
    sourcePath: "canonical/universal-network-data.json",
    scatterX:
      Math.round(
        ((7 - family.stateCount) * 0.2 + jitter(`x:${family.forte}`)) * 1e4,
      ) / 1e4,
    scatterY:
      Math.round(
        (family.modalOrientationCount + jitter(`y:${family.forte}`)) * 1e4,
      ) / 1e4,
    forte: family.forte,
    stateCount: family.stateCount,
    modalOrientationCount: family.modalOrientationCount,
    chirality: textOrNull(family.chirality),
    registeredBeforeCompletion: family.registeredBeforeCompletion ?? 0,
    missingBeforeCompletion: family.missingBeforeCompletion ?? 0,
    zPartner: textOrNull(family.zPartner),
    memberStateIds: network.nodes
      .filter((node) => node.forte === family.forte)
      .map((node) => node.id)
      .sort((a, b) => a - b),
  };
});

function composeFamilyNarrative(family) {
  let text = `The ${family.forte} set class spans ${family.stateCount} registered state${plural(family.stateCount)} across ${family.modalOrientationCount} modal orientation${plural(family.modalOrientationCount)}.`;
  if (family.chirality === "chiral") text += " It is chiral.";
  if (family.chirality === "achiral") text += " It is achiral.";
  if (family.zPartner) text += ` It forms a Z-partner relationship with ${family.zPartner}.`;
  if (family.missingBeforeCompletion > 0) {
    text += ` Its completion required the universal closure pass (${family.missingBeforeCompletion} states).`;
  }
  return text;
}

const stateCountByOffice = new Map();
for (const node of network.nodes) {
  if (node.office !== null) {
    stateCountByOffice.set(
      node.office,
      (stateCountByOffice.get(node.office) ?? 0) + 1,
    );
  }
}

const governorOffices = network.officeOrder.map((office, index) => {
  const profile = profiles.find((candidate) => candidate.office === office);
  const archetypeId = `office:${office.toLowerCase()}`;
  return {
    kind: "governorOffice",
    id: archetypeId,
    name: `${office} office`,
    admission: "admitted",
    summary: {
      narrativeKind: "deterministic_template",
      text: composeOfficeNarrative(office, index, profile),
      model: null,
      sha256: null,
    },
    sourcePath: "canonical/universal-network-data.json",
    scatterX: index,
    scatterY: Math.round((1 + jitter(`y:${office}`)) * 1e4) / 1e4,
    office,
    officeIndex: index,
    color: profile?.physical?.color ?? null,
    profileId: profile?.profileId ?? null,
    stateCount: stateCountByOffice.get(office) ?? 0,
    symbol: profile?.symbol ?? null,
  };
});

function composeOfficeNarrative(office, index, profile) {
  const stateCount = stateCountByOffice.get(office) ?? 0;
  let text = `The ${office} office (index ${index}) governs ${stateCount} states.`;
  if (profile) {
    text += ` It is represented by the canonical profile ${profile.profileId}`;
    if (profile.physical?.color) text += ` (photonic color ${profile.physical.color})`;
    text += ".";
  } else {
    text += " No canonical profile is yet registered for it.";
  }
  if (profile?.symbol) text += ` Symbol: ${profile.symbol}.`;
  return text;
}

const canonicalProfiles = profiles.map((profile) => {
  const state = stateById.get(profile.canonicalIdentity.stateId);
  if (!state) {
    fail(
      `bestiary dangling profile root: ${profile.profileId} references missing state ${profile.canonicalIdentity.stateId}`,
    );
  }
  const archetypeId = profile.profileId;
  const landformCount = profile.domainReferences?.landforms?.length ?? 0;
  const photonic = profile.physical
    ? {
        photonicId: profile.physical.photonicId,
        wavelengthNm: profile.physical.wavelengthNm,
        color: profile.physical.color,
      }
    : null;
  return {
    kind: "canonicalProfile",
    id: archetypeId,
    name: `${profile.office} canonical profile`,
    admission: "admitted",
    summary: {
      narrativeKind: "deterministic_template",
      text: composeProfileNarrative(profile, photonic, landformCount),
      model: null,
      sha256: null,
    },
    sourcePath:
      "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json",
    scatterX: profile.officeIndex,
    scatterY: Math.round((0.5 + jitter(`y:${archetypeId}`)) * 1e4) / 1e4,
    profileId: profile.profileId,
    profileVersion: profile.profileVersion,
    office: profile.office,
    officeIndex: profile.officeIndex,
    type: profile.type,
    canonicalIdentity: profile.canonicalIdentity,
    photonic,
    intrinsicFingerprint: profile.intrinsicFingerprint,
    landformReferences: landformCount,
    unresolvedScopeBindings: 0,
  };
});

function composeProfileNarrative(profile, photonic, landformCount) {
  let text = `Canonical profile of ${profile.office} (${profile.type}), rooted on state ${profile.canonicalIdentity.stateId} (${profile.canonicalIdentity.mode}, ${profile.canonicalIdentity.forteFamily}).`;
  if (photonic) {
    text += ` It carries the photonic record ${photonic.photonicId} at ${photonic.wavelengthNm} nm (${photonic.color}).`;
  } else {
    text += " It carries no photonic record.";
  }
  text += ` It references ${landformCount} landform pool${plural(landformCount)}.`;
  return text;
}

const projectionGaps = coverage.map((row) => ({
  operatorId: row.operator_id,
  formalApplications: Number(row.formal_applications),
  structuralProjection: Number(row.structural_projection),
  fieldProjection: Number(row.field_projection),
  unionProjection: Number(row.union_projection),
  unprojectedApplications: Number(row.unprojected_applications),
  unionCoverageRate: ratio(row.union_coverage_rate),
  interpretation: row.interpretation,
}));
const projectionGapByOperatorId = new Map(
  projectionGaps.map((gap) => [gap.operatorId, gap]),
);

const mutationOperators = operators.map((operator) => {
  const archetypeId = `operator:${operator.operator_id}`;
  const gap = coverageByOperatorId.get(operator.operator_id);
  if (!gap) {
    fail(`bestiary missing projection coverage for ${operator.operator_id}`);
  }
  return {
    kind: "mutationOperator",
    id: archetypeId,
    name: operator.name,
    admission: "admitted",
    summary: {
      narrativeKind: "deterministic_template",
      text: composeOperatorNarrative(operator, gap),
      model: null,
      sha256: null,
    },
    sourcePath:
      "seven-governors-mutation-algebra-audit/audit/operator-registry.csv",
    scatterX:
      Math.round(
        ((intOrNull(operator.degree) ?? -0.5) + jitter(`x:${operator.operator_id}`)) * 1e4,
      ) / 1e4,
    scatterY:
      Math.round(
        ((operator.partial === "true" ? 0.35 : 0.7) + jitter(`y:${operator.operator_id}`)) * 1e4,
      ) / 1e4,
    operatorId: operator.operator_id,
    notation: operator.notation,
    operatorClass: operator.operator_class,
    degree: intOrNull(operator.degree),
    degreeGovernor: textOrNull(operator.degree_governor),
    direction: operator.direction,
    deltaSemitones: intOrNull(operator.delta_semitones),
    domainRule: operator.domain_rule,
    action: operator.action,
    inverseOperatorId: operator.inverse_operator_id,
    conjugateOperatorId: operator.conjugate_operator_id,
    partial: operator.partial === "true",
    status: operator.status,
    applicationCount: Number(operator.application_count),
    domainSize: Number(operator.domain_size),
    imageSize: Number(operator.image_size),
    structuralSupportCount: Number(operator.structural_support_count),
    fieldSupportCount: Number(operator.field_support_count),
    projectionGapId: operator.operator_id,
    semanticOperatorId: semanticByStructuralId.get(operator.operator_id) ?? null,
  };
});

function composeOperatorNarrative(operator, gap) {
  const verb =
    operator.direction === "successor"
      ? "advances the root by re-rooting the unchanged pitch-class set at its next ascending scale tone"
      : operator.direction === "raise"
        ? `raises the pitch at degree ${operator.degree} by ${Math.abs(operator.deltaSemitones)} semitone${plural(Math.abs(operator.deltaSemitones))}`
        : `lowers the pitch at degree ${operator.degree} by ${Math.abs(operator.deltaSemitones)} semitone${plural(Math.abs(operator.deltaSemitones))}`;
  const scope = operator.partial === "true" ? "partial" : "total";
  const rate = (ratio(gap.union_coverage_rate) * 100).toFixed(1);
  return `Operator ${operator.notation} (${operator.operator_class}) ${verb} within its ${scope} domain. It applies to ${operator.application_count} states. Its inverse is ${operator.inverse_operator_id}; its conjugate is ${operator.conjugate_operator_id}. Structural support: ${operator.structural_support_count}; field support: ${operator.field_support_count}. The projection gap leaves ${gap.unprojected_applications} of ${gap.formal_applications} applications unprojected (union coverage ${rate}%).`;
}

const modalCycles = cycles.map((cycle) => {
  const memberIds = cycle.member_ids.split(";").map(Number);
  const archetypeId = cycle.cycle_id;
  const officeSequence = cycle.office_sequence
    ? cycle.office_sequence.split(";")
    : null;
  const officeDeltaSequence = cycle.office_delta_sequence
    ? cycle.office_delta_sequence.split(";").map(Number)
    : null;
  return {
    kind: "modalCycle",
    id: archetypeId,
    name: `${cycle.forte} ${cycle.role} modal cycle`,
    admission: "admitted",
    summary: {
      narrativeKind: "deterministic_template",
      text: composeCycleNarrative(cycle, memberIds, officeSequence),
      model: null,
      sha256: null,
    },
    sourcePath:
      "seven-governors-mutation-algebra-audit/audit/cycle-identities.csv",
    scatterX: tierRankOf(textOrNull(cycle.tier)) + jitter(`x:${archetypeId}`),
    scatterY: Math.round((cycle.office_bearing === "true" ? 0.7 : 0.3) + jitter(`y:${archetypeId}`) * 1e4) / 1e4,
    cycleId: cycle.cycle_id,
    representativeStateId: Number(cycle.representative_id),
    cycleLength: Number(cycle.cycle_length),
    forte: cycle.forte,
    role: cycle.role,
    fineRole: cycle.fine_role,
    tier: cycle.tier,
    orientation: textOrNull(cycle.orientation),
    chirality: textOrNull(cycle.chirality),
    officeBearing: cycle.office_bearing === "true",
    officeSequence,
    officeDeltaSequence,
    memberStateIds: memberIds,
  };
});

function composeCycleNarrative(cycle, memberIds, officeSequence) {
  let text = `A ${cycle.cycle_length}-member modal cycle of the ${cycle.forte} family, seeded at state ${cycle.representative_id}. It is a ${cycle.role} (${cycle.fine_role}) at tier ${cycle.tier}.`;
  if (cycle.office_bearing === "true" && officeSequence) {
    text += ` Its members trace the office sequence ${officeSequence.join(" → ")}.`;
  } else {
    text += " It carries no office sequence.";
  }
  if (cycle.chirality === "achiral") text += " It is achiral.";
  else if (cycle.chirality) text += ` It is ${cycle.chirality}.`;
  return text;
}

const candidateFiles = [
  {
    file: "schemas/fivefold_engine.yaml",
    category: "court",
    name: "Fivefold Engine",
  },
  {
    file: "schemas/physical_phenomena.yaml",
    category: "phenomena",
    name: "Physical Phenomena",
  },
  {
    file: "schemas/thermodynamic_processes.yaml",
    category: "thermodynamic",
    name: "Thermodynamic Processes",
  },
];

const catalogText = await readText(
  path.join(
    toolkitDirectory,
    "docs",
    "INVARIANT_CATALOG.md",
  ).slice(packageRoot.length + 1),
);

function proposedInvariantIds(category) {
  const prefix =
    category === "court" ? "COURT" : category === "phenomena" ? "PHEN" : "THERM[A-Z]*";
  const pattern = new RegExp(`INV-${prefix}-[0-9]{3}`, "g");
  return [...new Set(catalogText.match(pattern) ?? [])].sort();
}

function deepFind(obj, wantedKeys) {
  if (Array.isArray(obj)) {
    for (const entry of obj) {
      const found = deepFind(entry, wantedKeys);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (obj !== null && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (wantedKeys.includes(key)) return obj[key];
      const found = deepFind(obj[key], wantedKeys);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

const yaml = toolkitRequire("yaml");
const candidateExtensions = [];
for (const candidate of candidateFiles) {
  const relativePath = path.join(
    toolkitDirectory,
    candidate.file,
  ).slice(packageRoot.length + 1);
  const document = yaml.parse(await readText(relativePath));
  const registryId = deepFind(document, ["engine_id", "registry_id"]);
  const admission = deepFind(document, ["admission"]);
  if (admission !== "proposed") {
    fail(`bestiary candidate admission violation: ${relativePath} is not proposed`);
  }
  candidateExtensions.push({
    kind: "candidateExtension",
    id: `extension:${candidate.category}`,
    name: candidate.name,
    admission: "proposed",
    summary: {
      narrativeKind: "deterministic_template",
      text: `Proposed candidate extension ${registryId ?? `extension:${candidate.category}`} (${candidate.category}). It is not admitted to the active system; its proposed invariants ${proposedInvariantIds(candidate.category).join(", ") || "are not yet catalogued"} and remain under review. See the companion roadmap.`,
      model: null,
      sha256: null,
    },
    sourcePath: relativePath,
    scatterX: ["court", "phenomena", "thermodynamic"].indexOf(candidate.category) + jitter(`x:${candidate.category}`),
    scatterY: Math.round((-1 + jitter(`y:${candidate.category}`)) * 1e4) / 1e4,
    extensionId: registryId ?? `extension:${candidate.category}`,
    category: candidate.category,
    roadmapRef:
      "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/CAPABILITY_MATRIX_AND_ROADMAP.md",
    proposedInvariants: proposedInvariantIds(candidate.category),
  });
}

function mapEdge(edge) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    governing: edge.governing,
    directed: edge.directed,
    mode: edge.mode,
    mutation: textOrNull(edge.mutation),
    degree: intOrNull(edge.degree),
    hamming: Number(edge.hamming),
    selected: edge.selected,
    eligible: edge.eligible,
    provenance: edge.provenance,
  };
}

const relationships = [...network.structuralEdges, ...network.fieldEdges]
  .map(mapEdge)
  .sort((a, b) => {
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return a.source - b.source;
  });

const commutationPairs = commutation.map((row) => ({
  operatorA: row.operator_a,
  operatorB: row.operator_b,
  sourceStatesTested: Number(row.source_states_tested),
  aThenBDefined: Number(row.a_then_b_defined),
  bThenADefined: Number(row.b_then_a_defined),
  bothDefined: Number(row.both_defined),
  equalWhenBothDefined: Number(row.equal_when_both_defined),
  unequalWhenBothDefined: Number(row.unequal_when_both_defined),
  domainAsymmetry: Number(row.domain_asymmetry),
  neitherDefined: Number(row.neither_defined),
  classification: row.classification,
})).sort((a, b) => {
  const key = (pair) => `${pair.operatorA}:${pair.operatorB}`;
  const ka = key(a);
  const kb = key(b);
  return ka < kb ? -1 : ka > kb ? 1 : 0;
});

const archetypes = [
  ...scaleStates,
  ...scaleFamilies,
  ...governorOffices,
  ...canonicalProfiles,
  ...mutationOperators,
  ...modalCycles,
  ...candidateExtensions,
].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

assertCount(scaleStates.length, 462, "scaleStates");
assertCount(scaleFamilies.length, 38, "scaleFamilies");
assertCount(governorOffices.length, 7, "governorOffices");
assertCount(canonicalProfiles.length, 7, "canonicalProfiles");
assertCount(mutationOperators.length, 15, "mutationOperators");
assertCount(modalCycles.length, 66, "modalCycles");
assertCount(commutationPairs.length, 91, "commutationPairs");
assertCount(projectionGaps.length, 15, "projectionGaps");
assertCount(
  relationships.length,
  network.structuralEdges.length + network.fieldEdges.length,
  "relationships",
);

const archetypeById = new Map(archetypes.map((archetype) => [archetype.id, archetype]));
const operatorIds = new Set(mutationOperators.map((operator) => operator.operator_id));
const resolvableOperatorIds = new Set([
  ...operatorIds,
  ...mutationOperators.map((operator) => operator.inverseOperatorId),
  ...mutationOperators.map((operator) => operator.conjugateOperatorId),
]);
for (const archetype of scaleStates) {
  for (const parent of archetype.parents) {
    if (!stateById.has(parent)) {
      fail(`bestiary dangling parent ref: state ${archetype.nodeId} -> ${parent}`);
    }
  }
}
for (const archetype of scaleFamilies) {
  for (const memberId of archetype.memberStateIds) {
    const member = stateById.get(memberId);
    if (!member) fail(`bestiary dangling family member: ${archetype.forte} -> ${memberId}`);
    if (member.forte !== archetype.forte) {
      fail(`bestiary family membership violation: ${memberId} is ${member.forte}, not ${archetype.forte}`);
    }
  }
}
for (const archetype of modalCycles) {
  for (const memberId of archetype.memberStateIds) {
    if (!stateById.has(memberId)) {
      fail(`bestiary dangling cycle member: ${archetype.cycleId} -> ${memberId}`);
    }
  }
}
for (const edge of relationships) {
  if (!stateById.has(edge.source) || !stateById.has(edge.target)) {
    fail(`bestiary dangling relationship endpoint: ${edge.id}`);
  }
}
for (const archetype of mutationOperators) {
  if (
    !resolvableOperatorIds.has(archetype.inverseOperatorId) ||
    !resolvableOperatorIds.has(archetype.conjugateOperatorId)
  ) {
    fail(`bestiary dangling operator inverse/conjugate: ${archetype.operatorId}`);
  }
  if (!projectionGapByOperatorId.has(archetype.operatorId)) {
    fail(`bestiary dangling projection gap ref: ${archetype.operatorId}`);
  }
  if (archetype.semanticOperatorId !== null && !semanticByStructuralId.has(archetype.operatorId)) {
    fail(`bestiary dangling semantic operator ref: ${archetype.operatorId}`);
  }
}
for (const archetype of scaleStates) {
  if (
    archetype.compiledProfileId !== null &&
    !compiledByStateId.has(archetype.nodeId)
  ) {
    fail(`bestiary dangling compiled profile ref: ${archetype.id}`);
  }
}

const byCategory = {};
for (const archetype of archetypes) {
  byCategory[archetype.kind] = (byCategory[archetype.kind] ?? 0) + 1;
}

const consumedSources = [
  "provenance/release.json",
  "canonical/universal-network-data.json",
  "seven-governors-mutation-algebra-audit/audit/operator-registry.csv",
  "seven-governors-mutation-algebra-audit/audit/projection-coverage.csv",
  "seven-governors-mutation-algebra-audit/audit/commutation-summary.csv",
  "seven-governors-mutation-algebra-audit/audit/cycle-identities.csv",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/canonical-governor-profiles.json",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/canonical/semantic-operator-registry.json",
  "seven-governors-canonical-feature-profile-registry-v0.1.1/neo4j/csv/compiled-profiles.csv",
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/fivefold_engine.yaml",
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/physical_phenomena.yaml",
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/schemas/thermodynamic_processes.yaml",
  "seven-governors-state-machine-spec-and-authoring-toolkit-v0.2.0/docs/INVARIANT_CATALOG.md",
];
const sources = [];
for (const sourcePath of consumedSources) {
  sources.push({ path: sourcePath, sha256: await hashFile(sourcePath) });
}

const bestiary = {
  schemaVersion: "1.0.0",
  releaseId: release.releaseId,
  build: {
    tool: "build-bestiary.mjs",
    toolVersion: TOOL_VERSION,
  },
  sources: sources.sort((a, b) => (a.path < b.path ? -1 : 1)),
  summary: {
    archetypeCount: archetypes.length,
    byCategory,
  },
  archetypes,
  relationships,
  commutationPairs,
  projectionGaps,
};

const PINNED_NARRATIVES = "bestiary/data/pinned-narratives.json";

async function applyPinnedNarratives(bestiaryData) {
  const pinned = await readJson(PINNED_NARRATIVES);
  const byId = new Map(
    pinned.narratives.map((entry) => [entry.id, entry.text]),
  );
  const orphaned = pinned.narratives
    .map((entry) => entry.id)
    .filter((id) => !bestiaryData.archetypes.some((a) => a.id === id));
  if (orphaned.length > 0) {
    fail(`bestiary pinned narrative refs no archetype: ${orphaned.join(", ")}`);
  }
  const applied = [];
  for (const archetype of bestiaryData.archetypes) {
    const text = byId.get(archetype.id);
    if (text === undefined) continue;
    archetype.summary = {
      narrativeKind: "ai_generated",
      text,
      model: pinned.model,
      sha256: createHash("sha256").update(text, "utf8").digest("hex"),
    };
    applied.push(archetype.id);
  }
  return applied;
}

const appliedPins = await applyPinnedNarratives(bestiary);

const Ajv = loadAjv();
const ajv = new Ajv({ strict: false });
const validate = ajv.compile(await readJson(SCHEMA));
if (!validate(bestiary)) {
  fail(
    `bestiary self-validation failed: ${JSON.stringify(validate.errors ?? [], null, 2).slice(0, 2000)}`,
  );
}

const serialized = `${stableStringify(bestiary)}\n`;
const targetPath = path.join(packageRoot, TARGET);

if (emit) {
  await writeFile(targetPath, serialized);
  console.log(
    JSON.stringify(
      {
        emitted: TARGET,
        bytes: Buffer.byteLength(serialized),
        archetypes: archetypes.length,
        byCategory,
        relationships: relationships.length,
        commutationPairs: commutationPairs.length,
        projectionGaps: projectionGaps.length,
        pinnedNarratives: appliedPins.length,
      },
      null,
      2,
    ),
  );
} else {
  let existing = null;
  try {
    existing = await readFile(targetPath, "utf8");
  } catch {
    existing = null;
  }
  if (existing === serialized) {
    console.log(JSON.stringify({ verdict: "PASS", target: TARGET, bytes: Buffer.byteLength(serialized) }, null, 2));
    process.exit(0);
  }
  console.log(
    JSON.stringify(
      {
        verdict: "FAIL",
        target: TARGET,
        diagnostic:
          existing === null
            ? "missing"
            : "stale: run `npm run build:bestiary`",
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
