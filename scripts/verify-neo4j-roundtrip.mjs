#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import neo4j from "neo4j-driver";

import {
  exportNormalizedNeo4jSnapshot,
  verifyNormalizedNeo4jSnapshot,
} from "../graph/runtime/neo4j-roundtrip.mjs";
import {
  buildReleaseDatabaseInputs,
  releaseRoundtripVerificationInputs,
  releaseSourceBindings,
} from "./bootstrap-neo4j.mjs";


function argument(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function main() {
  const uri = argument("--uri", process.env.NEO4J_URI);
  const username = argument("--username", process.env.NEO4J_USERNAME ?? "neo4j");
  const password = argument("--password", process.env.NEO4J_PASSWORD);
  const database = argument("--database", process.env.NEO4J_DATABASE ?? "neo4j");
  const output = argument("--output");
  if (!uri || password === undefined) {
    throw new Error("usage: verify-neo4j-roundtrip.mjs --uri URI --password PASSWORD [--username USER] [--database NAME] [--output PATH]");
  }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "seven-governors-roundtrip-"));
  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  try {
    await driver.verifyConnectivity();
    const inputs = buildReleaseDatabaseInputs(temp);
    const session = driver.session({ database, defaultAccessMode: neo4j.session.READ });
    try {
      const snapshot = await exportNormalizedNeo4jSnapshot(session, {
        releaseId: inputs.release.releaseId,
        sourceBindings: releaseSourceBindings(),
      });
      const valid = verifyNormalizedNeo4jSnapshot(
        snapshot,
        releaseRoundtripVerificationInputs(inputs),
      );
      if (output) fs.writeFileSync(path.resolve(output), `${JSON.stringify(snapshot, null, 2)}\n`);
      process.stdout.write(`${JSON.stringify({
        schemaVersion: "seven-governors.neo4j-roundtrip-validation.v1",
        releaseId: inputs.release.releaseId,
        verdict: valid ? "PASS" : "FAIL",
        counts: snapshot.counts,
        snapshotFingerprint: snapshot.snapshotFingerprint,
      }, null, 2)}\n`);
      if (!valid) process.exitCode = 1;
    } finally {
      await session.close();
    }
  } finally {
    await driver.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
