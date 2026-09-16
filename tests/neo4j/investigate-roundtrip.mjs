// Diagnostic only: no baseline capture, QA receipt, or external target support.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Neo4jHarness } from "../../graph/runtime/neo4j-harness.mjs";
import { canonicalJsonBytes, sha256 } from "../../graph/runtime/canonical.mjs";
import { verifyNormalizedNeo4jSnapshot } from "../../graph/runtime/neo4j-roundtrip.mjs";
import {
  buildReleaseDatabaseInputs, packageRoot, releaseRoundtripVerificationInputs,
} from "../../scripts/bootstrap-neo4j.mjs";

const baseline = JSON.parse(fs.readFileSync(path.join(
  packageRoot, "provenance/neo4j-full-database-baseline.json",
), "utf8"));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "neo4j-investigation-"));
const harness = new Neo4jHarness();
try {
  await harness.start();
  const inputs = buildReleaseDatabaseInputs(temp);
  const verification = releaseRoundtripVerificationInputs(inputs);
  const env = {
    ...process.env,
    NEO4J_URI: harness.uri,
    NEO4J_USERNAME: "",
    NEO4J_PASSWORD: "",
    NEO4J_DATABASE: "neo4j",
    NEO4J_IMPORT_DIR: harness.importDir,
    NEO4J_DEPLOYMENT_TARGET_CLASS: "disposable_local",
  };
  delete env.NEO4J_FULL_CAPTURE_BASELINE;
  delete env.NEO4J_FULL_SNAPSHOT_SUMMARY_OUTPUT;
  const snapshots = [];
  const executions = [];
  for (const [script, outputFlag] of [
    ["bootstrap-neo4j.mjs", "--roundtrip-output"],
    ["verify-neo4j-roundtrip.mjs", "--output"],
    ["bootstrap-neo4j.mjs", "--roundtrip-output"],
  ]) {
    const output = path.join(temp, `snapshot-${snapshots.length}.json`);
    const result = spawnSync(process.execPath, [
      path.join(packageRoot, "scripts", script), outputFlag, output,
    ], { cwd: packageRoot, env, encoding: "utf8", timeout: 180000 });
    assert.ifError(result.error);
    assert.ok(result.status === 0 || (script.startsWith("verify-") && result.status === 1),
      result.stderr);
    snapshots.push(JSON.parse(fs.readFileSync(output, "utf8")));
    executions.push({ script, exitStatus: result.status, payload: JSON.parse(result.stdout) });
  }
  const snapshot = snapshots[0];
  const observedFingerprints = Object.fromEntries(Object.entries(snapshot.namespaces)
    .map(([name, value]) => [name, value.namespaceFingerprint]));
  const report = {
    scope: "diagnostic_only_not_baseline_or_release_evidence",
    releaseId: snapshot.releaseId,
    retainedBaselineReleaseId: baseline.releaseId,
    counts: snapshot.counts,
    snapshotFingerprint: snapshot.snapshotFingerprint,
    executions,
    retainedBaselineAccepted: verifyNormalizedNeo4jSnapshot(snapshot, verification),
    // This isolates all other verifier checks; observed hashes are NOT authority.
    nonBaselineChecksWithObservedFingerprints: verifyNormalizedNeo4jSnapshot(snapshot, {
      ...verification, expectedNamespaceFingerprints: observedFingerprints,
    }),
    bootstrapExportEqualsConfiguredRead: canonicalJsonBytes(snapshot)
      .equals(canonicalJsonBytes(snapshots[1])),
    importTwiceByteIdentity: canonicalJsonBytes(snapshot)
      .equals(canonicalJsonBytes(snapshots[2])),
    namespaces: Object.entries(snapshot.namespaces).map(([namespace, value]) => ({
      namespace,
      expected: baseline.namespaceFingerprints[namespace],
      actual: value.namespaceFingerprint,
      matches: baseline.namespaceFingerprints[namespace] === value.namespaceFingerprint,
    })),
    sourceBindings: snapshot.sourceBindings.map((binding) => ({
      ...binding,
      retainedSha256: baseline.sourceBindings.find((item) => item.namespace === binding.namespace)?.sha256,
    })),
    currentReleaseCanonicalSha256: sha256(inputs.release),
    provenance: snapshot.namespaces.provenance,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  const harnessDirectory = harness.tempDir;
  await harness.stop();
  if (harnessDirectory) assert.equal(fs.existsSync(harnessDirectory), false);
  await harness.assertNoResidualPorts();
  fs.rmSync(temp, { recursive: true, force: true });
}
