/**
 * FileProvider: loads a canonical graph snapshot from disk and delegates to SnapshotProvider.
 */

import fs from "node:fs";
import { SnapshotProvider } from "./snapshot-provider.mjs";

export class FileProvider {
  constructor(snapshotPath) {
    this.snapshotPath = snapshotPath;
    this.providerName = "file";
    this._snapshot = null;
    this._delegate = null;
  }

  _load() {
    if (this._delegate) return this._delegate;
    const text = fs.readFileSync(this.snapshotPath, "utf8");
    this._snapshot = JSON.parse(text);
    this._delegate = new SnapshotProvider(this._snapshot);
    return this._delegate;
  }

  async executeNamedQuery(queryId, parameters, options) {
    return this._load().executeNamedQuery(queryId, parameters, options);
  }

  get snapshot() {
    return this._load().snapshot;
  }
}