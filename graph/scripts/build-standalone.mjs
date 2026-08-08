import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");
const fragmentPath = path.join(
  packageRoot,
  "src/seven-governors-network.fragment.html",
);
const baseCssPath = path.join(packageRoot, "src/standalone-base.css");
const outputPath = path.join(packageRoot, "index.html");

const [fragment, baseCss] = await Promise.all([
  fs.readFile(fragmentPath, "utf8"),
  fs.readFile(baseCssPath, "utf8"),
]);

if (!fragment.includes('id="seven-governors-universal-boundary-network-v9"')) {
  throw new Error("The expected graph root is missing from the fragment.");
}
if (fragment.includes("<!doctype") || fragment.includes("<html")) {
  throw new Error("The graph source must remain an embeddable HTML fragment.");
}

const standalone = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="no-referrer">
  <title>Seven Governors Universal Network</title>
  <style>
${baseCss}
  </style>
</head>
<body>
${fragment}
</body>
</html>
`;

await fs.writeFile(outputPath, standalone);
console.log(outputPath);
