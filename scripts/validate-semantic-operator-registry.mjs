import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import YAML from "yaml";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const registryPath = path.join(
  root,
  "schemas",
  "semantic_operator_registry_v1.0.1.yaml",
);
const schemaPath = path.join(
  root,
  "schemas",
  "semantic-operator-v1.0.1.schema.json",
);
const auditRoot = path.join(root, "seven-governors-mutation-algebra-audit");
const releaseId = "mutation-algebra-audit:1.0.0";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
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
  return records.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index]])),
  );
}

const registry = YAML.parse(fs.readFileSync(registryPath, "utf8"));
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
const schemaValid = ajv.validate(schema, registry);
const failures = [];

if (!schemaValid) {
  failures.push({ check: "schema", errors: ajv.errors });
}

const auditPackage = JSON.parse(
  fs.readFileSync(path.join(auditRoot, "package.json"), "utf8"),
);
const release = JSON.parse(read("provenance/release.json"));
const dependency = release.compositePackages.find(
  (item) => item.packageId === "seven-governors-mutation-algebra-audit",
);
const declaredDependency = registry.dependencies.algebraic_release;

if (
  auditPackage.name !== declaredDependency.package ||
  auditPackage.version !== declaredDependency.version ||
  dependency?.releaseId !== declaredDependency.release_id ||
  declaredDependency.release_id !== releaseId
) {
  failures.push({
    check: "algebraic-release-binding",
    expected: {
      package: auditPackage.name,
      version: auditPackage.version,
      release_id: dependency?.releaseId,
    },
    actual: declaredDependency,
  });
}

const structuralOperators = parseCsv(
  fs.readFileSync(path.join(auditRoot, "audit/operator-registry.csv"), "utf8"),
);
const applications = parseCsv(
  fs.readFileSync(path.join(auditRoot, "audit/operator-applications.csv"), "utf8"),
);
const inverseWitnesses = parseCsv(
  fs.readFileSync(path.join(auditRoot, "audit/inverse-witnesses.csv"), "utf8"),
);
const structuralById = new Map(
  structuralOperators.map((operator) => [operator.operator_id, operator]),
);
const semanticIds = new Set();
const structuralIds = new Set();

for (const operator of registry.operators) {
  const semanticId = operator.operator_id;
  const reference = operator.algebraic_operator_ref;
  const structuralId = reference.operator_id;
  const structural = structuralById.get(structuralId);
  const expectedSemanticId = registry.operator_binding_map[structuralId];
  const expectedInverse = structuralId === "M"
    ? "M^6"
    : `${structuralId.startsWith("R") ? "L" : "R"}${structuralId.slice(1)}`;
  const expectedDomainRef =
    `seven-governors-mutation-algebra-audit/audit/operator-applications.csv#operator_id=${structuralId}`;
  const expectedInverseRef =
    `seven-governors-mutation-algebra-audit/audit/inverse-witnesses.csv#operator_id=${structuralId}&inverse_operator_id=${expectedInverse}`;

  if (semanticIds.has(semanticId)) {
    failures.push({ check: "duplicate-semantic-operator", semanticId });
  }
  if (structuralIds.has(structuralId)) {
    failures.push({ check: "duplicate-structural-binding", structuralId });
  }
  semanticIds.add(semanticId);
  structuralIds.add(structuralId);

  if (!structural || expectedSemanticId !== semanticId) {
    failures.push({
      check: "operator-binding",
      semanticId,
      structuralId,
      expectedSemanticId,
    });
    continue;
  }

  if (
    structural.degree_governor !== (operator.degree_governor ?? "") ||
    structural.degree !== (operator.degree_number?.toString() ?? "") ||
    structural.direction !== (operator.direction === "rotate" ? "successor" : operator.direction)
  ) {
    failures.push({ check: "operator-metadata", semanticId, structuralId });
  }

  if (reference.domain_ref !== expectedDomainRef) {
    failures.push({ check: "domain-reference", semanticId, structuralId });
  }
  if (!applications.some((item) => item.operator_id === structuralId)) {
    failures.push({ check: "domain-evidence", semanticId, structuralId });
  }
  if (reference.inverse_ref !== expectedInverseRef) {
    failures.push({ check: "inverse-reference", semanticId, structuralId });
  }
  if (!inverseWitnesses.some(
    (item) =>
      item.operator_id === structuralId &&
      item.inverse_operator_id === expectedInverse &&
      item.result === "PASS",
  )) {
    failures.push({ check: "inverse-evidence", semanticId, structuralId });
  }
}

const expectedStructuralIds = new Set(structuralById.keys());
if (
  expectedStructuralIds.size !== structuralIds.size ||
  [...expectedStructuralIds].some((operatorId) => !structuralIds.has(operatorId))
) {
  failures.push({
    check: "operator-coverage",
    expected: [...expectedStructuralIds].sort(),
    actual: [...structuralIds].sort(),
  });
}

const modal = registry.operators.find(
  (operator) => operator.algebraic_operator_ref.operator_id === "M",
);
const expectedModalLaws = [
  "seven-governors-mutation-algebra-audit/audit/cycle-identities.csv#minimal_period_seven=true&result=PASS",
  "seven-governors-mutation-algebra-audit/audit/modal-covariance-witnesses.csv#result=PASS",
  "seven-governors-mutation-algebra-audit/neo4j/algebra-validation.cypher#degree_governor_transport_plus_two",
];
if (
  modal?.algebraic_operator_ref.law_refs?.length !== expectedModalLaws.length ||
  expectedModalLaws.some(
    (law) => !modal.algebraic_operator_ref.law_refs.includes(law),
  )
) {
  failures.push({ check: "modal-law-references" });
}

const modalCycles = parseCsv(
  fs.readFileSync(path.join(auditRoot, "audit/cycle-identities.csv"), "utf8"),
);
if (
  modalCycles.length !== 66 ||
  modalCycles.some(
    (cycle) => cycle.minimal_period_seven !== "true" || cycle.result !== "PASS",
  )
) {
  failures.push({ check: "modal-cycle-evidence" });
}

const modalCovariance = parseCsv(
  fs.readFileSync(
    path.join(auditRoot, "audit/modal-covariance-witnesses.csv"),
    "utf8",
  ),
);
if (
  modalCovariance.length !== 6468 ||
  modalCovariance.some((witness) => witness.result !== "PASS")
) {
  failures.push({ check: "modal-covariance-evidence" });
}

const algebraValidation = fs.readFileSync(
  path.join(auditRoot, "neo4j/algebra-validation.cypher"),
  "utf8",
);
if (!algebraValidation.includes("degree_governor_transport_plus_two")) {
  failures.push({ check: "governor-label-transport-evidence" });
}

const report = {
  verdict: failures.length === 0 ? "PASS" : "FAIL",
  schema: path.relative(root, schemaPath),
  registry: path.relative(root, registryPath),
  status: registry.metadata.status,
  operatorCount: registry.operators.length,
  structuralBindingCount: structuralIds.size,
  failures,
};

console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exit(1);
