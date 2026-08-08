import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const indexPath = path.join(packageRoot, "index.html");
const html = await fs.readFile(indexPath, "utf8");

const checks = [];
function check(name, condition, diagnostic) {
  checks.push({
    name,
    status: condition ? "PASS" : "FAIL",
    diagnostic,
  });
}

check(
  "complete HTML document",
  /^<!doctype html>/i.test(html) &&
    html.includes("<html") &&
    html.includes("</html>"),
  "The double-click artifact must be a complete document, not a host fragment.",
);
check(
  "offline asset closure",
  !/\b(?:src|href)=["']https?:/i.test(html),
  "No remote script, stylesheet, image, or font is required.",
);
check(
  "graph root",
  html.includes('id="seven-governors-universal-boundary-network-v9"'),
  "Universal graph root is present.",
);
check(
  "primary controls",
  ["sg-view", "sg-relations", "sg-state"].every((id) =>
    html.includes(`id="${id}"`),
  ),
  "View, relationship, and state controls are present.",
);
check(
  "universal node count",
  html.includes('"registeredStates":462'),
  "Embedded canonical snapshot declares 462 rooted states.",
);
check(
  "boundary count",
  html.includes('"boundaryStates":154'),
  "Embedded canonical snapshot declares 154 typed boundary states.",
);
check(
  "office network count",
  html.includes('"officeNetworkStates":308'),
  "Embedded canonical snapshot declares 308 seated states.",
);
check(
  "universal relation count",
  html.includes('"universalEdges":1824'),
  "Renderer declares 1,824 visible universal relationships.",
);

const scriptPattern = /<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
const scripts = Array.from(html.matchAll(scriptPattern), (match) => match[1]);
const syntaxErrors = [];
scripts.forEach((source, index) => {
  try {
    new vm.Script(source, { filename: `inline-script-${index + 1}.js` });
  } catch (error) {
    syntaxErrors.push(String(error.message ?? error));
  }
});
check(
  "JavaScript syntax",
  scripts.length > 0 && syntaxErrors.length === 0,
  syntaxErrors.length ? syntaxErrors.join("; ") : `${scripts.length} inline script passed.`,
);

const failed = checks.filter((item) => item.status === "FAIL");
const report = {
  verdict: failed.length ? "FAIL" : "PASS",
  file: indexPath,
  bytes: Buffer.byteLength(html),
  checks,
};

await fs.mkdir(path.join(packageRoot, "qa"), { recursive: true });
await fs.writeFile(
  path.join(packageRoot, "qa/standalone-validation-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (failed.length) process.exitCode = 1;
