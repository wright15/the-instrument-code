import fs from "node:fs";
import path from "node:path";
import { PACKAGE_ROOT, assert, compareCodePoint, writeAtomic } from "./lib.mjs";
import { OUTPUT_NAMES, buildArtifacts } from "./substrate-builder.mjs";

const args = process.argv.slice(2);
const modes = args.filter((argument) => argument === "--check" || argument === "--emit");
assert(modes.length === 1, "CLI_MODE", "specify exactly one of --check or --emit");

let outputDirectory = path.join(PACKAGE_ROOT, "canonical");
const outputIndex = args.indexOf("--output-dir");
if (outputIndex !== -1) {
  assert(args[outputIndex + 1], "CLI_OUTPUT", "--output-dir requires a path");
  outputDirectory = path.resolve(args[outputIndex + 1]);
}
const allowed = new Set([
  "--check",
  "--emit",
  "--output-dir",
  "--test-reverse-input-order",
]);
for (let index = 0; index < args.length; index += 1) {
  if (args[index - 1] === "--output-dir") continue;
  assert(allowed.has(args[index]), "CLI_ARGUMENT", `unknown argument ${args[index]}`);
}

const artifacts = buildArtifacts({
  reverseInputOrder: args.includes("--test-reverse-input-order"),
});
const mismatches = [];
if (modes[0] === "--emit") fs.mkdirSync(outputDirectory, { recursive: true });
for (const [name, text] of artifacts) {
  const target = path.join(outputDirectory, name);
  if (modes[0] === "--emit") {
    writeAtomic(target, text);
  } else if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== text) {
    mismatches.push(name);
  }
}
if (fs.existsSync(outputDirectory)) {
  const unexpected = fs
    .readdirSync(outputDirectory)
    .filter((name) => !OUTPUT_NAMES.includes(name))
    .sort(compareCodePoint);
  mismatches.push(...unexpected.map((name) => `unexpected:${name}`));
}

if (mismatches.length) {
  console.error(`STALE_CANONICAL_OUTPUT: ${mismatches.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify({
      mode: modes[0].slice(2),
      outputs: [...artifacts.keys()],
      status: "passed",
    }),
  );
}
