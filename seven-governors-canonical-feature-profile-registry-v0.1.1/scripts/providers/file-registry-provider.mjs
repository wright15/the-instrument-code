import { readJson } from "../lib.mjs";
import { SnapshotRegistryProvider } from "./snapshot-registry-provider.mjs";

export class FileRegistryProvider extends SnapshotRegistryProvider {
  constructor() {
    super({
      network: readJson("source/universal-network-data.json"),
      profileRegistry: readJson(
        "canonical/canonical-governor-profiles.json",
      ),
      photonicRegistry: readJson("canonical/photonic-records.json"),
      semanticRegistry: readJson(
        "canonical/semantic-operator-registry.json",
      ),
      projectionRegistry: readJson(
        "canonical/domain-projection-registry.json",
      ),
      providerName: "file",
    });
  }
}

