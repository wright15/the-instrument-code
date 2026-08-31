import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { walkFiles } from "./manifest-utils.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDirectory, "..");

const RECEIPT_PATH = "qa/integrated-release-validation.json";
const OUTPUT_PATH = "qa/validation-prose-consistency.json";
const SCHEMA_VERSION = "seven-governors.validation-prose-consistency.v1";

const SCOPE_LABEL = ["docs/**/*.md", "orrery/*.md", "README.md"];

const WATCHED_LITERALS = [440, 441];

const COUNT_UNIT_PATTERNS = [
  {
    unit: "checks",
    patterns: [
      /(\d{2,})\s*(?:\/\s*\d{2,})?\s*checks?\b/gi,
      /(\d{2,})\s+passing\s+checks?\b/gi,
      /\bpass(?:es|ed)?\s+(\d{2,})\s+checks?\b/gi,
      /\bchecks?\s*(?:passed|passing|total|count)?\s*(?:of|:|=)?\s+(\d{2,})\b/gi,
    ],
  },
  {
    unit: "validations",
    patterns: [/(\d{2,})\s+validations?\b/gi],
  },
  {
    unit: "tests",
    patterns: [
      /(\d{2,})\s+tests?\b/gi,
      /\btests?\s*(?:passed|passing|total|count)?\s*(?:of|:|=)?\s+(\d{2,})\b/gi,
    ],
  },
];

const AUDIO_MARKERS = /\b(?:Hz|A4|A440|MIDI|12-TET)\b/i;
const LINE_REFERENCE = /[A-Za-z0-9_.\-/]+\.[A-Za-z0-9]+:\d+/;
const REGISTRY_MARKERS =
  /\b(?:entr(?:y|ies)|records?|items?|anchors?|states?|operators?|famil(?:y|ies)|classes?|nodes?|edges?|files?|rows?)\b/i;
const HISTORICAL_MARKERS =
  /\b(?:historical|planning[ -]?(?:prose|evidence)?|sign[ -]?off|prior release|earlier|previously|planning baseline)\b/i;
const SCOPED_MARKERS =
  /\b(?:GOV-\d+|CRT-\d+|ORR-\d+|NET-\d+|EPIC-\d+|qa\/[^\s|]+\.json|validator|sub-validator)\b/i;
const VERSION_TOKEN = /\b\d+\.\d+(?:\.\d+)?(?:-dev)?\b/g;

function readText(relativePath) {
  return fs.readFile(path.join(packageRoot, relativePath), "utf8");
}

function normalizeVersion(value) {
  return String(value).toLowerCase().replace(/^v/, "").replace(/-dev$/, "");
}

function versionTokens(text) {
  return [...text.matchAll(VERSION_TOKEN)].map((match) => match[0]);
}

function isCurrentVersion(token, currentVersion) {
  return normalizeVersion(token) === normalizeVersion(currentVersion);
}

function hasHistoricalQualifier(context, currentVersion) {
  if (HISTORICAL_MARKERS.test(context)) return true;
  return versionTokens(context).some((token) => !isCurrentVersion(token, currentVersion));
}

function exemptionReason(line) {
  if (AUDIO_MARKERS.test(line)) return "audio_tuning";
  if (LINE_REFERENCE.test(line)) return "line_reference";
  if (REGISTRY_MARKERS.test(line)) return "registry_cardinality";
  return null;
}

async function collectScopeFiles() {
  const files = [];
  for (const absolutePath of await walkFiles(path.join(packageRoot, "docs"), {
    excluded: new Set(),
  })) {
    if (absolutePath.endsWith(".md")) files.push(absolutePath);
  }
  const orreryDir = path.join(packageRoot, "orrery");
  for (const entry of await fs.readdir(orreryDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.join(orreryDir, entry.name));
    }
  }
  files.push(path.join(packageRoot, "README.md"));
  return files.sort();
}

async function main() {
  let receipt;
  try {
    receipt = JSON.parse(await readText(RECEIPT_PATH));
  } catch (error) {
    const report = {
      schemaVersion: SCHEMA_VERSION,
      verdict: "FAIL",
      releaseId: null,
      authoritativeChecksPassed: null,
      error: `unable to read ${RECEIPT_PATH}: ${String(error.message ?? error)}`,
    };
    await fs.writeFile(
      path.join(packageRoot, OUTPUT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.error(report.error);
    process.exitCode = 1;
    return;
  }

  const authoritativeTotal = receipt.checksPassed;
  if (typeof authoritativeTotal !== "number") {
    const report = {
      schemaVersion: SCHEMA_VERSION,
      verdict: "FAIL",
      releaseId: receipt.releaseId ?? null,
      authoritativeChecksPassed: null,
      error: `${RECEIPT_PATH} has no numeric checksPassed`,
    };
    await fs.writeFile(
      path.join(packageRoot, OUTPUT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.error(report.error);
    process.exitCode = 1;
    return;
  }

  const releaseId = receipt.releaseId ?? "unknown";
  const currentVersion = releaseId.replace(/^seven-governors-integrated-/, "");

  const claims = [];
  const exemptions = [];
  const watchedViolations = [];

  const files = await collectScopeFiles();

  for (const absolutePath of files) {
    const relativePath = absolutePath.slice(packageRoot.length + 1);
    const text = await fs.readFile(absolutePath, "utf8");
    const lines = text.split(/\r?\n/);

    const headings = [];
    let documentTitle = relativePath;
    for (let index = 0; index < lines.length; index += 1) {
      const headingMatch = lines[index].match(/^#{1,6}\s+(.*)$/);
      if (headingMatch) {
        const title = headingMatch[1].trim();
        headings.push({ index, title });
        if (documentTitle === relativePath && /^#\s/.test(lines[index])) {
          documentTitle = title;
        }
      }
    }
    const headingFor = (lineIndex) => {
      let nearest = "";
      for (const heading of headings) {
        if (heading.index <= lineIndex) nearest = heading.title;
        else break;
      }
      return nearest;
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const heading = headingFor(lineIndex);
      const context = [line, heading, documentTitle, relativePath].join("\n");

      for (const { unit, patterns } of COUNT_UNIT_PATTERNS) {
        for (const pattern of patterns) {
          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(line)) !== null) {
            const number = Number.parseInt(match[1], 10);
            const claim = {
              file: relativePath,
              line: lineIndex + 1,
              number,
              unit,
              classification: null,
              qualifier: null,
            };
            if (number === authoritativeTotal) {
              claim.classification = "matches_current";
            } else if (hasHistoricalQualifier(context, currentVersion)) {
              claim.classification = "release_qualified";
              claim.qualifier =
                versionTokens(context).find((token) => !isCurrentVersion(token, currentVersion)) ??
                "historical";
            } else if (SCOPED_MARKERS.test(line)) {
              claim.classification = "scoped";
            } else {
              claim.classification = "violation";
            }
            claims.push(claim);
          }
        }
      }

      for (const literal of WATCHED_LITERALS) {
        const literalPattern = new RegExp(`\\b${literal}\\b`, "g");
        let match;
        while ((match = literalPattern.exec(line)) !== null) {
          const reason =
            exemptionReason(line) ??
            (hasHistoricalQualifier(context, currentVersion) ? "release_qualified" : null);
          exemptions.push({
            file: relativePath,
            line: lineIndex + 1,
            literal,
            reason: reason ?? "unclassified",
          });
          if (reason === null) {
            watchedViolations.push({
              file: relativePath,
              line: lineIndex + 1,
              number: literal,
              unit: "watched_literal",
              classification: "violation",
              qualifier: null,
            });
          }
        }
      }
    }
  }

  const claimKey = (item) => `${item.file}:${item.line}:${item.number}:${item.unit}`;
  const dedupedClaims = [...new Map(claims.map((item) => [claimKey(item), item])).values()];

  const violations = [
    ...dedupedClaims.filter((item) => item.classification === "violation"),
    ...watchedViolations,
  ];

  const sortKey = (item) =>
    `${item.file}:${String(item.line).padStart(6, "0")}:${item.number ?? item.literal}`;
  dedupedClaims.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  exemptions.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
  violations.sort((a, b) => sortKey(a).localeCompare(sortKey(b)));

  const verdict = violations.length === 0 ? "PASS" : "FAIL";

  const report = {
    schemaVersion: SCHEMA_VERSION,
    verdict,
    releaseId,
    authoritativeChecksPassed: authoritativeTotal,
    scope: SCOPE_LABEL,
    statistics: {
      filesScanned: files.length,
      claims: dedupedClaims.length,
      claimsMatchingCurrent: dedupedClaims.filter(
        (item) => item.classification === "matches_current",
      ).length,
      claimsReleaseQualified: dedupedClaims.filter(
        (item) => item.classification === "release_qualified",
      ).length,
      claimsScoped: dedupedClaims.filter((item) => item.classification === "scoped").length,
      exemptions: exemptions.length,
      violations: violations.length,
    },
    claims: dedupedClaims,
    exemptions,
    violations,
  };

  await fs.writeFile(
    path.join(packageRoot, OUTPUT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify({ verdict, authoritativeChecksPassed: authoritativeTotal, violations: violations.length }, null, 2));
  if (violations.length) process.exitCode = 1;
}

await main();
