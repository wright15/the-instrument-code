import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");
const schema = JSON.parse(
  fs.readFileSync(
    path.join(packageRoot, "schemas", "operator-registry.schema.json"),
    "utf8",
  ),
);
const registry = JSON.parse(
  fs.readFileSync(
    path.join(packageRoot, "audit", "operator-candidates.json"),
    "utf8",
  ),
);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);
const valid = validate(registry);
const report = {
  verdict: valid ? "PASS" : "FAIL",
  schema: "schemas/operator-registry.schema.json",
  instance: "audit/operator-candidates.json",
  errors: validate.errors ?? [],
};

fs.writeFileSync(
  path.join(packageRoot, "qa", "operator-registry-schema-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (!valid) process.exitCode = 1;
