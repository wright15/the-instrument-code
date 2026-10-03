import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const orreryRoot = path.resolve(scriptDirectory, "..");
const root = path.resolve(orreryRoot, "..");
const fixturePath = path.join(orreryRoot, "test", "fixtures", "golden-paths.v1.json");
const schemaPath = path.join(root, "schemas", "harmonic-orrery-golden-path-catalog.schema.json");
const catalogPath = path.join(orreryRoot, "src", "generated", "legal-moves.v2.json");
const bipartitePath = path.join(root, "derived", "hypergraph", "bipartite-inclusion-v1.json");
const probePath = path.join(orreryRoot, "src", "generated", "d-tier-operator-probe.v1.json");
const applicationsPath = path.join(root, "seven-governors-mutation-algebra-audit", "audit", "operator-applications.csv");

function fail(message) {
  throw new Error(`INVALID_GOLDEN_PATH_CATALOG: ${message}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isSubset(childMask, parentMask) {
  return (childMask & parentMask) === childMask;
}

function maskOf(pitchClasses) {
  return pitchClasses.reduce((mask, pitchClass) => mask | (1 << pitchClass), 0);
}

const fixture = readJson(fixturePath);
const schema = readJson(schemaPath);
const catalog = readJson(catalogPath);
const bipartite = readJson(bipartitePath);
const probe = readJson(probePath);
const applicationsLines = fs.readFileSync(applicationsPath, "utf8").split(/\r?\n/);
const probeCyclesByTier = new Map(
  probe.modalClosure.dToD.cycles.map((cycle) => [cycle.tier, cycle.stateIds]),
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
if (!validate(fixture)) {
  fail(`schema: ${ajv.errorsText(validate.errors)}`);
}

const moveIds = new Set(catalog.moves.map((move) => move.id));
const heptatonicById = bipartite.heptatonicNodes;
const pentatonicById = bipartite.pentatonicSubnodes;
const heptatonicByMask = new Map(
  Object.entries(heptatonicById).map(([id, node]) => [node.pitchMask, id]),
);

function resolveMove(moveId, context) {
  if (!moveIds.has(moveId)) {
    fail(`${context}: move ${moveId} is not in the committed legal-move catalog`);
  }
  return moveId;
}

const pathIds = new Set();
for (const goldenPath of fixture.paths) {
  if (pathIds.has(goldenPath.pathId)) {
    fail(`duplicate pathId ${goldenPath.pathId}`);
  }
  pathIds.add(goldenPath.pathId);

  const { hops } = goldenPath;
  hops.forEach((hop, index) => {
    if (hop.index !== index) {
      fail(`${goldenPath.pathId}: hop indexes are not contiguous at ${index}`);
    }
  });
  if (hops[0].nodeId !== goldenPath.origin.nodeId) {
    fail(`${goldenPath.pathId}: origin ${goldenPath.origin.nodeId} does not match first hop ${hops[0].nodeId}`);
  }
  if (hops[hops.length - 1].nodeId !== goldenPath.destination.nodeId) {
    fail(
      `${goldenPath.pathId}: destination ${goldenPath.destination.nodeId} does not match last hop ${hops[hops.length - 1].nodeId}`,
    );
  }

  for (const [index, hop] of hops.entries()) {
    if (hop.kind === "collection" || hop.kind === "derived-node") {
      if (hop.moveId !== null) {
        resolveMove(hop.moveId, `${goldenPath.pathId} hop ${index}`);
        const move = catalog.moves.find((candidate) => candidate.id === hop.moveId);
        if (move && index > 0) {
          const previous = hops[index - 1];
          const previousMask = maskOf(previous.pitchClasses);
          const currentMask = maskOf(hop.pitchClasses);
          if (move.sourceId !== previousMask || move.targetId !== currentMask) {
            fail(
              `${goldenPath.pathId} hop ${index}: move ${hop.moveId} does not chain ${previous.nodeId} -> ${hop.nodeId}`,
            );
          }
        }
      } else if (hop.kind === "collection" && index > 0) {
        fail(`${goldenPath.pathId} hop ${index}: a walk hop after the origin must carry a moveId`);
      }
    }
    if (hop.legality === "both-collections-containment" && !hop.seamCrossing && hop.kind === "bridge") {
      fail(`${goldenPath.pathId} hop ${index}: bridge hop must flag seamCrossing`);
    }
  }

  if (goldenPath.substrate === "derived-path") {
    hops.forEach((hop, index) => {
      const heptatonic = heptatonicById[hop.nodeId];
      const pentatonic = pentatonicById[hop.nodeId];
      const node = heptatonic ?? pentatonic;
      if (!node) {
        fail(`${goldenPath.pathId}: derived hop ${index} node ${hop.nodeId} is not in the bipartite source`);
      }
      if (maskOf(hop.pitchClasses) !== node.pitchMask) {
        fail(`${goldenPath.pathId}: derived hop ${index} node ${hop.nodeId} pitch classes disagree with the source`);
      }
      if ((hop.nodeKind === "heptatonic") !== Boolean(heptatonic)) {
        fail(`${goldenPath.pathId}: derived hop ${index} nodeKind disagrees with the node universe`);
      }
      if (hop.arrivedBy === "origin") {
        if (index !== 0 || hop.legality !== null || hop.moveId !== null) {
          fail(`${goldenPath.pathId}: derived origin hop must be index 0 with no legality or move`);
        }
        return;
      }
      if (hop.arrivedBy === "operator") {
        if (hop.legality !== "catalog-membership" || hop.moveId === null) {
          fail(`${goldenPath.pathId}: derived hop ${index} operator arrival must be catalog-membership with a moveId`);
        }
        return;
      }
      const pentatonicIndex = hop.nodeKind === "pentatonic" ? index : index - 1;
      const pentatonicNode = pentatonicById[hops[pentatonicIndex]?.nodeId];
      if (!pentatonicNode) {
        fail(`${goldenPath.pathId}: derived hop ${index} containment arrival has no pentatonic node`);
      }
      const heptatonicNeighbors = [hops[pentatonicIndex - 1], hops[pentatonicIndex + 1]]
        .filter((neighbor) => neighbor && heptatonicById[neighbor.nodeId]);
      if (heptatonicNeighbors.length === 0) {
        fail(`${goldenPath.pathId}: derived hop ${index} containment arrival has no heptatonic endpoint`);
      }
      for (const neighbor of heptatonicNeighbors) {
        if (!isSubset(pentatonicNode.pitchMask, heptatonicById[neighbor.nodeId].pitchMask)) {
          fail(
            `${goldenPath.pathId}: derived hop ${index} ${pentatonicNode.id} is not contained in ${neighbor.nodeId}`,
          );
        }
      }
      const bridge = heptatonicNeighbors.length === 2;
      if (hop.bridge !== bridge) {
        fail(`${goldenPath.pathId}: derived hop ${index} bridge flag disagrees with the crossing topology`);
      }
      const expectedLegality = bridge ? "both-collections-containment" : "containment-membership";
      if (hop.legality !== expectedLegality) {
        fail(`${goldenPath.pathId}: derived hop ${index} legality must be ${expectedLegality}`);
      }
    });
    if (goldenPath.hopCount !== hops.length - 1) {
      fail(`${goldenPath.pathId}: derived hopCount disagrees with the hop list`);
    }
    if (goldenPath.crossesBridge !== hops.some((hop) => hop.bridge)) {
      fail(`${goldenPath.pathId}: derived crossesBridge disagrees with the hop list`);
    }
  }

  if (goldenPath.substrate === "boundary-demonstration") {
    if (hops.length !== 8) {
      fail(`${goldenPath.pathId}: boundary-demonstration routes carry one origin hop plus seven cycle edges`);
    }
    if (
      goldenPath.origin.nodeId !== goldenPath.destination.nodeId ||
      JSON.stringify(goldenPath.origin.pitchClasses) !== JSON.stringify(goldenPath.destination.pitchClasses)
    ) {
      fail(`${goldenPath.pathId}: boundary-demonstration routes are closed cycles (origin == destination)`);
    }
    const tier = goldenPath.pathId.startsWith("d-cycle:") ? goldenPath.pathId.slice("d-cycle:".length) : null;
    const cycle = tier ? probeCyclesByTier.get(tier) : null;
    if (!cycle) {
      fail(`${goldenPath.pathId}: no BL-029 probe cycle for this pathId`);
    }
    for (const [index, hop] of hops.entries()) {
      const node = heptatonicById[hop.nodeId];
      if (!node) {
        fail(`${goldenPath.pathId}: hop ${index} node ${hop.nodeId} is not a heptatonic node`);
      }
      if (hop.nodeKind !== "heptatonic" || maskOf(hop.pitchClasses) !== node.pitchMask) {
        fail(`${goldenPath.pathId}: hop ${index} node identity disagrees with the bipartite source`);
      }
      if (index === 0) {
        if (hop.arrivedBy !== "origin" || hop.moveId !== null || hop.legality !== null || hop.mShortcut !== null) {
          fail(`${goldenPath.pathId}: origin hop must carry no move, legality, or shortcut`);
        }
        continue;
      }
      if (hop.arrivedBy !== "operator" || hop.moveId !== null || hop.legality !== null || typeof hop.mShortcut !== "string") {
        fail(`${goldenPath.pathId}: hop ${index} must be a demonstration-typed M edge`);
      }
      const edge = /^M:(\d+):(\d+)$/.exec(hop.mShortcut);
      if (!edge) {
        fail(`${goldenPath.pathId}: hop ${index} mShortcut ${hop.mShortcut} is not an M application id`);
      }
      const previous = hops[index - 1];
      if (Number(edge[1]) !== maskOf(previous.pitchClasses) || Number(edge[2]) !== maskOf(hop.pitchClasses)) {
        fail(`${goldenPath.pathId}: hop ${index} mShortcut does not chain ${previous.nodeId} -> ${hop.nodeId}`);
      }
    }
    const hopMasks = hops.slice(0, 7).map((hop) => maskOf(hop.pitchClasses));
    if (JSON.stringify(hopMasks) !== JSON.stringify(cycle)) {
      fail(`${goldenPath.pathId}: hop sequence disagrees with the BL-029 probe cycle`);
    }
    if (maskOf(hops[7].pitchClasses) !== cycle[0]) {
      fail(`${goldenPath.pathId}: closing hop does not return to the cycle origin`);
    }
    const alternatives = goldenPath.alternatives ?? [];
    if (alternatives.length !== 1 || alternatives[0].kind !== "cycle-demonstration") {
      fail(`${goldenPath.pathId}: boundary-demonstration routes carry exactly one cycle-demonstration alternative`);
    }
    const variantMoves = alternatives[0].variants.flatMap((variant) => variant.moves);
    if (variantMoves.length !== 7) {
      fail(`${goldenPath.pathId}: cycle-demonstration variant must carry seven moves`);
    }
    const hopShortcuts = hops.slice(1).map((hop) => hop.mShortcut);
    if (JSON.stringify(variantMoves.map((move) => move.applicationId)) !== JSON.stringify(hopShortcuts)) {
      fail(`${goldenPath.pathId}: cycle-demonstration moves disagree with the hop shortcuts`);
    }
    for (const move of variantMoves) {
      const parts = /^M:(\d+):(\d+)$/.exec(move.applicationId);
      const lineMatch = /^seven-governors-mutation-algebra-audit\/audit\/operator-applications\.csv:(\d+)$/.exec(move.auditSource);
      if (!parts || !lineMatch || move.cycleEdge !== true) {
        fail(`${goldenPath.pathId}: cycle move ${move.applicationId} has a malformed identity or provenance`);
      }
      if (move.canonicalId !== `modal:${tier}:${parts[1]}:${parts[2]}`) {
        fail(`${goldenPath.pathId}: cycle move ${move.applicationId} canonicalId disagrees with its endpoints`);
      }
      const csvLine = applicationsLines[Number(lineMatch[1]) - 1];
      if (!csvLine || !csvLine.startsWith(`${move.applicationId},M,`)) {
        fail(`${goldenPath.pathId}: cycle move ${move.applicationId} does not resolve to its audit line`);
      }
    }
    const exhibitVerdicts = (goldenPath.verdicts ?? []).filter((verdict) => verdict.status === "exhibit");
    if (exhibitVerdicts.length === 0) {
      fail(`${goldenPath.pathId}: boundary-demonstration routes require an exhibit verdict`);
    }
    for (const verdict of exhibitVerdicts) {
      if (!/discriminant/i.test(verdict.statement) || !verdict.source.includes("bl-029-d-tier-operator-probe-memo.md")) {
        fail(`${goldenPath.pathId}: exhibit verdict must cite the discriminant check and the BL-029 memo`);
      }
    }
  }

  if (goldenPath.bridge) {
    const endpoints = [goldenPath.origin, goldenPath.destination];
    for (const voicing of [goldenPath.bridge.chosen, goldenPath.bridge.alternative]) {
      const node = pentatonicById[voicing.nodeId];
      if (!node) {
        fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} is not a pentatonic node`);
      }
      if (!node.isBridge) {
        fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} is not a census bridge`);
      }
      if (voicing.setClassId && voicing.setClassId !== node.setClassId) {
        fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} setClassId disagrees with the bipartite source`);
      }
      if (maskOf(voicing.pitchClasses) !== node.pitchMask) {
        fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} pitch classes disagree with the bipartite source`);
      }
      for (const endpoint of endpoints) {
        const endpointMask = maskOf(endpoint.pitchClasses);
        if (!isSubset(node.pitchMask, endpointMask)) {
          fail(`${goldenPath.pathId}: bridge voicing ${voicing.nodeId} is not contained in ${endpoint.nodeId}`);
        }
      }
    }
  }

  for (const kernel of goldenPath.interiorKernels ?? []) {
    const node = pentatonicById[kernel.nodeId];
    if (!node) {
      fail(`${goldenPath.pathId}: interior kernel ${kernel.nodeId} is not a pentatonic node`);
    }
    if (maskOf(kernel.pitchClasses) !== node.pitchMask) {
      fail(`${goldenPath.pathId}: interior kernel ${kernel.nodeId} pitch classes disagree with the bipartite source`);
    }
    if (!isSubset(node.pitchMask, maskOf(goldenPath.origin.pitchClasses))) {
      fail(`${goldenPath.pathId}: interior kernel ${kernel.nodeId} is not contained in the origin`);
    }
  }

  if (goldenPath.modeAxis) {
    const originMask = maskOf(goldenPath.origin.pitchClasses);
    const destinationMask = maskOf(goldenPath.destination.pitchClasses);
    const flattened = goldenPath.origin.pitchClasses.filter(
      (pitchClass) => !goldenPath.destination.pitchClasses.includes(pitchClass),
    );
    const sharpened = goldenPath.destination.pitchClasses.filter(
      (pitchClass) => !goldenPath.origin.pitchClasses.includes(pitchClass),
    );
    const common = goldenPath.origin.pitchClasses.filter((pitchClass) =>
      goldenPath.destination.pitchClasses.includes(pitchClass),
    );
    if (JSON.stringify(flattened) !== JSON.stringify(goldenPath.modeAxis.flattenedPitchClasses)) {
      fail(`${goldenPath.pathId}: modeAxis flattenedPitchClasses disagree with the endpoints`);
    }
    if (JSON.stringify(sharpened) !== JSON.stringify(goldenPath.modeAxis.sharpenedPitchClasses)) {
      fail(`${goldenPath.pathId}: modeAxis sharpenedPitchClasses disagree with the endpoints`);
    }
    if (common.length !== goldenPath.modeAxis.commonTones) {
      fail(`${goldenPath.pathId}: modeAxis commonTones disagree with the endpoints`);
    }
    if (originMask === destinationMask) {
      fail(`${goldenPath.pathId}: modeAxis endpoints must differ`);
    }
  }

  for (const move of goldenPath.chosen?.moves ?? []) {
    resolveMove(move, `${goldenPath.pathId} chosen`);
  }
  for (const alternative of goldenPath.alternatives ?? []) {
    if (alternative.kind === "cycle-demonstration") {
      for (const entry of alternative.variants.flatMap((variant) => variant.moves)) {
        if (!entry.applicationId || entry.cycleEdge !== true) {
          fail(`${goldenPath.pathId}: cycle demonstration entry must carry an applicationId and cycleEdge`);
        }
      }
      continue;
    }
    const entries =
      alternative.kind === "m-demonstration"
        ? alternative.variants.flatMap((variant) => variant.moves)
        : alternative.moves.map((moveId) => ({ moveId }));
    for (const entry of entries) {
      if (entry.moveId) {
        resolveMove(entry.moveId, `${goldenPath.pathId} alternative`);
      } else if (!entry.applicationId || !entry.compresses) {
        fail(`${goldenPath.pathId}: demonstration entry must carry an applicationId and compresses`);
      }
    }
  }

  const verdictIds = new Set();
  for (const verdict of goldenPath.verdicts ?? []) {
    if (verdictIds.has(verdict.verdictId)) {
      fail(`${goldenPath.pathId}: duplicate verdictId ${verdict.verdictId}`);
    }
    verdictIds.add(verdict.verdictId);
    if (verdict.status === "recorded" && (!verdict.statement || !verdict.date)) {
      fail(`${goldenPath.pathId}: recorded verdict ${verdict.verdictId} needs statement and date`);
    }
    if (verdict.status === "pending" && !verdict.recipe) {
      fail(`${goldenPath.pathId}: pending verdict ${verdict.verdictId} needs a recipe pointer`);
    }
  }
}

console.log(
  JSON.stringify({
    verdict: "PASS",
    schemaVersion: fixture.schemaVersion,
    pathCount: fixture.paths.length,
    pathIds: fixture.paths.map((goldenPath) => goldenPath.pathId),
    verdictCounts: fixture.paths.map((goldenPath) => ({
      pathId: goldenPath.pathId,
      recorded: (goldenPath.verdicts ?? []).filter((verdict) => verdict.status === "recorded").length,
      pending: (goldenPath.verdicts ?? []).filter((verdict) => verdict.status === "pending").length,
      exhibit: (goldenPath.verdicts ?? []).filter((verdict) => verdict.status === "exhibit").length,
    })),
  }),
);
