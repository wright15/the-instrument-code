import crypto from "node:crypto";
import fs from "node:fs/promises";

export async function walkFiles(packageRoot, { excluded = new Set() } = {}) {
  const files = [];
  const stack = [packageRoot];
  while (stack.length > 0) {
    const directory = stack.pop();
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules") continue;
      const absolutePath = `${directory}/${entry.name}`;
      const relativePath = absolutePath.slice(packageRoot.length + 1);
      if (excluded.has(entry.name) || excluded.has(relativePath)) continue;
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }
  return files.sort();
}

export async function recordFile(absolutePath, packageRoot) {
  const bytes = await fs.readFile(absolutePath);
  return {
    path: absolutePath.slice(packageRoot.length + 1).split("/").join("/"),
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
  };
}
