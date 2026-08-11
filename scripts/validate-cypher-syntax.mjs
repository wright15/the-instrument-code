import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot =
  process.env.SEVEN_GOVERNORS_PACKAGE_ROOT ??
  path.resolve(scriptDir, "..");
const moduleReference =
  process.env.SEVEN_GOVERNORS_CYPHER_LANGUAGE_SUPPORT ??
  "@neo4j-cypher/language-support";
const moduleUrl = moduleReference.startsWith("/")
  ? pathToFileURL(moduleReference).href
  : moduleReference;
const { validateSyntax } = await import(moduleUrl);

const schema = {
  labels: [
    "ScaleState",
    "ScaleFamily",
    "GovernorOffice",
    "AuditRelease",
    "FrameworkDocument",
    "InvariantDefinition",
    "GovRuntimePolicyRelease",
    "GovTypedAspect",
    "GovBridgeRule",
    "GovClassificationEvidence",
    "GovLedgerSnapshot",
    "GovGovernorProfileView",
    "GovLegalMoveView",
    "GovProvenanceSource",
    "GovGovernorReference",
    "Triad",
    "CourtFilterApplication",
    "CourtFilterOperator",
    "PentatonicSetClass",
    "CourtCommutationRecord",
    "CourtState",
    "CourtRootedPosition",
    "PoleRegister",
    "CourtRuntimeSession",
    "CourtTransitionEvent",
    "CourtLedgerSnapshot",
    "TopologicalTranslocationRecord",
  ],
  relationshipTypes: [
    "GOVERNS",
    "CONSTRUCTS",
    "SEAT_CONTACT",
    "MODAL_SUCCESSOR",
    "AUDITED_HAMMING2",
    "PHASE_SHIFT",
    "CONVERGENCE_CONTACT",
    "JUNCTION_CONTACT",
    "LEAF_CONTACT",
    "BELONGS_TO_FAMILY",
    "OCCUPIES_OFFICE",
    "RELATIONAL_OFFICE_EVIDENCE",
    "INCLUDES_DOCUMENT",
    "DECLARES_INVARIANT",
    "DEFINED_BY",
    "GOV_DECLARES_ASPECT",
    "GOV_DECLARES_RULE",
    "GOV_RULE_OUTPUT",
    "GOV_SUPPORTED_BY",
    "GOV_DERIVED_FROM_SOURCE",
    "GOV_SNAPSHOT_HAS_MOVE",
    "GOV_REFERENCES_GOVERNOR",
    "HAS_TRIAD",
    "FILTERS",
    "USES_FILTER",
    "YIELDS_ADMITTED_SET",
    "HAS_COMMUTATION_RESULT",
    "HAS_POLE_REGISTER",
    "HAS_TRANSITION_EVENT",
    "HAS_LEDGER_SNAPSHOT",
    "SNAPSHOTS_STATE",
    "HAS_TRANSLOCATION",
    "USES_ROUTE_RECORD",
  ],
  propertyKeys: [],
};
const files = [
  "schema.cypher",
  "reset.cypher",
  "import.cypher",
  "validation.cypher",
  "example-queries.cypher",
  "integrated-example-queries.cypher",
  "provenance.cypher",
  "provenance-validation.cypher",
  "governor-runtime/schema.cypher",
  "governor-runtime/reset.cypher",
  "governor-runtime/validation.cypher",
  "court-mathematics/schema.cypher",
  "court-mathematics/reset.cypher",
  "court-mathematics/validation.cypher",
  "court-mathematics/named-queries.cypher",
];
const results = [];
for (const file of files) {
  const source = await fs.readFile(path.join(packageRoot, "neo4j", file), "utf8");
  const diagnostics = validateSyntax(source, schema);
  results.push({
    file,
    bytes: Buffer.byteLength(source),
    diagnostics: diagnostics.map((diagnostic) => ({
      message: diagnostic.message,
      severity: diagnostic.severity,
      offsets: diagnostic.offsets,
    })),
    pass: diagnostics.length === 0,
  });
}
const failures = results.filter((row) => !row.pass);
const report = {
  verdict: failures.length ? "FAIL" : "PASS",
  generatedAt: new Date().toISOString(),
  validator: "@neo4j-cypher/language-support",
  files: results,
};
await fs.writeFile(
  path.join(packageRoot, "qa/neo4j-cypher-syntax-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
