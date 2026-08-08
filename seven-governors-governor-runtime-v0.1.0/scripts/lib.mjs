import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const PACKAGE_ROOT = path.resolve(SCRIPT_DIRECTORY, "..");
export const INTEGRATED_ROOT = path.resolve(PACKAGE_ROOT, "..");

export function compareCodePoint(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort(compareCodePoint)
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function canonicalCompact(value) {
  return JSON.stringify(canonicalize(value));
}

export function canonicalJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function readJson(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

export function sortById(values, field) {
  return [...values].sort((left, right) =>
    compareCodePoint(left[field], right[field]),
  );
}

export function sortProvenance(values) {
  return [...values].sort((left, right) => {
    const sourceOrder = compareCodePoint(left.sourceId, right.sourceId);
    return sourceOrder || compareCodePoint(left.pointer ?? "", right.pointer ?? "");
  });
}

export function writeAtomic(absolutePath, text) {
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  const temporaryPath = `${absolutePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporaryPath, text);
  fs.renameSync(temporaryPath, absolutePath);
}

export function assert(condition, code, detail) {
  if (!condition) {
    const error = new Error(`${code}: ${detail}`);
    error.code = code;
    throw error;
  }
}
