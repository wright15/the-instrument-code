import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(fixtureDirectory, "../../..");
const candidate = JSON.parse(
  fs.readFileSync(
    path.join(root, "canonical/harmonic-compression-candidates/CH_A012_q_v1.json"),
    "utf8",
  ),
);

const nodes = candidate.records.map((record) => ({
  state: {
    stateId: record.stateId,
    nodeId: `scale:${record.stateId}`,
    name: record.name,
    forteFamily: record.forte,
    tier: record.tier,
    role: "anchor",
  },
  resolution: { office: record.stateGovernor, officeBearing: true },
  photonic: {
    photonicId: `photonic:${record.stateGovernor.toLowerCase()}`,
    office: record.stateGovernor,
    representativeWavelengthNm: 500,
    photonicCompression: 1,
  },
  canonicalProfile: {
    profileId: `profile:${record.stateGovernor.toLowerCase()}`,
    profileVersion: "0.1.1",
    office: record.stateGovernor,
    domainReferences: { landforms: ["ridge", "basin"] },
  },
  scopedHarmonicDescriptor: {
    coordinateId: candidate.coordinateId,
    status: candidate.status,
    stateGovernor: record.stateGovernor,
    weightedProjection: record.weightedProjection,
  },
}));

process.stdout.write(
  JSON.stringify({
    schemaVersion: "harmonic-orrery.nodes.v1",
    profileRegistryReleaseId: "canonical-feature-profile-registry:0.1.1",
    harmonicDescriptor: {
      candidateId: candidate.candidateId,
      coordinateId: candidate.coordinateId,
      releaseId: candidate.releaseId,
      status: candidate.status,
      candidateFingerprint: candidate.candidateFingerprint,
    },
    nodeCount: 21,
    nodes,
  }),
);
