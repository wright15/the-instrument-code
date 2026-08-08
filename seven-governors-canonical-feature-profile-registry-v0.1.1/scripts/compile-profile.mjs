#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { compileProfile } from "./compiler.mjs";

function argument(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const stateId = argument("--state-id");
if (!stateId) {
  throw new Error(
    "Usage: node scripts/compile-profile.mjs --state-id <id> [--domain landforms] [--operator R7 --source-id 1453] [--output file.json]",
  );
}
const operatorId = argument("--operator");
const sourceId = argument("--source-id");
const packet = await compileProfile({
  stateId: Number(stateId),
  domain: argument("--domain", "landforms"),
  route:
    operatorId && sourceId
      ? {
          operatorId,
          sourceId: Number(sourceId),
          routeId: argument("--route-id"),
        }
      : null,
});
const output = argument("--output");
if (output) {
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  fs.writeFileSync(path.resolve(output), `${JSON.stringify(packet, null, 2)}\n`);
  console.log(`Wrote ${output}`);
} else {
  process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
}
