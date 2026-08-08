import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

export const PACKAGE_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

export function readJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(PACKAGE_ROOT, relativePath), "utf8"),
  );
}

export function readYaml(relativePath) {
  return YAML.parse(
    fs.readFileSync(path.join(PACKAGE_ROOT, relativePath), "utf8"),
  );
}

export function writeJson(relativePath, value) {
  const target = path.join(PACKAGE_ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

export function sha256(value) {
  const body =
    typeof value === "string" || Buffer.isBuffer(value)
      ? value
      : stableStringify(value);
  return crypto.createHash("sha256").update(body).digest("hex");
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const [header, ...records] = rows.filter((candidate) =>
    candidate.some((cell) => cell !== ""),
  );
  return records.map((record) =>
    Object.fromEntries(header.map((key, index) => [key, record[index] ?? ""])),
  );
}

function csvCell(value) {
  if (value == null) return "";
  const normalized =
    typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}

export function writeCsv(relativePath, columns, rows) {
  const target = path.join(PACKAGE_ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const body = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\n");
  fs.writeFileSync(target, `${body}\n`);
}

export function readText(relativePath) {
  return fs.readFileSync(path.join(PACKAGE_ROOT, relativePath), "utf8");
}

export function writeText(relativePath, value) {
  const target = path.join(PACKAGE_ROOT, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}
