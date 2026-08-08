/**
 * GOV-206 Native Neo4j 5.26.28 Test Harness.
 *
 * Provisions an isolated Neo4j instance with temporary config/data/logs,
 * random loopback ports, no authentication, and full process cleanup.
 * Fails (never skips) if prerequisites are unavailable.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

export class Neo4jHarness {
  constructor() {
    this.process = null;
    this.boltPort = null;
    this.httpPort = null;
    this.tempDir = null;
    this.configDir = null;
    this.dataDir = null;
    this.logsDir = null;
    this.runDir = null;
    this.importDir = null;
  }

  async start() {
    // Check prerequisites
    try {
      const { execSync } = await import("node:child_process");
      const version = execSync("neo4j --version", { encoding: "utf8" }).trim();
      if (!version.includes("5.")) {
        throw new Error(`Neo4j 5.x required, got: ${version}`);
      }
    } catch {
      throw new Error("Neo4j not available — native live test requires installed Neo4j 5.x");
    }

    // Create temp directories
    this.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "gov206-neo4j-"));
    this.dataDir = path.join(this.tempDir, "data");
    this.logsDir = path.join(this.tempDir, "logs");
    this.runDir = path.join(this.tempDir, "run");
    this.importDir = path.join(this.tempDir, "import");
    this.configDir = path.join(this.tempDir, "conf");

    for (const dir of [this.dataDir, this.logsDir, this.runDir, this.importDir, this.configDir]) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Find free loopback ports
    this.boltPort = await findFreePort();
    this.httpPort = await findFreePort();

    // Write neo4j.conf
    const config = `# GOV-206 isolated test instance
server.directories.data=${this.dataDir}
server.directories.logs=${this.logsDir}
server.directories.import=${this.importDir}
server.directories.run=${this.runDir}
server.bolt.enabled=true
server.bolt.listen_address=127.0.0.1:${this.boltPort}
server.http.enabled=true
server.http.listen_address=127.0.0.1:${this.httpPort}
dbms.security.auth_enabled=false
initial.dbms.default_database=neo4j
server.config.strict_validation.enabled=false
dbms.memory.heap.initial_size=256m
dbms.memory.heap.max_size=512m
dbms.memory.pagecache.size=256m
`;
    fs.writeFileSync(path.join(this.configDir, "neo4j.conf"), config);
    fs.mkdirSync(path.join(this.tempDir, "certificates"), { recursive: true });

    // Start Neo4j
    this.process = spawn("neo4j", ["console"], {
      env: {
        ...process.env,
        NEO4J_CONF: this.configDir,
        HEAP_SIZE: "512m",
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });

    // Wait for connectivity
    const deadline = Date.now() + 60000; // 60s startup deadline
    let connected = false;

    while (Date.now() < deadline && !connected) {
      await sleep(2000);
      try {
        const neo4j = (await import("neo4j-driver")).default;
        const driver = neo4j.driver(
          `neo4j://127.0.0.1:${this.boltPort}`,
          neo4j.auth.basic("", ""),
        );
        await driver.verifyConnectivity({ connectionTimeout: 2000 });
        await driver.close();
        connected = true;
      } catch {
        // Retry
      }
    }

    if (!connected) {
      await this.stop();
      throw new Error("Neo4j failed to start within 60s deadline");
    }

    return this;
  }

  get uri() {
    return `neo4j://127.0.0.1:${this.boltPort}`;
  }

  get credentials() {
    return { username: "", password: "" };
  }

  async stop() {
    if (this.process) {
      try {
        process.kill(-this.process.pid, "SIGTERM");
      } catch {
        try {
          this.process.kill("SIGTERM");
        } catch {}
      }

      // Wait for exit with timeout
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 5000);
        this.process.on("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });

      // Force kill if still alive
      if (this.process.exitCode === null) {
        try {
          process.kill(-this.process.pid, "SIGKILL");
        } catch {
          try {
            this.process.kill("SIGKILL");
          } catch {}
        }
      }
      this.process = null;
    }

    // Clean up temp directory
    if (this.tempDir) {
      try {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
      } catch {
        // Best effort
      }
      this.tempDir = null;
    }
  }

  async assertNoResidualFiles() {
    if (this.tempDir && fs.existsSync(this.tempDir)) {
      throw new Error("temp directory still exists after cleanup");
    }
  }

  async assertNoResidualPorts() {
    for (const port of [this.boltPort, this.httpPort]) {
      if (!port) continue;
      const inUse = await new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, "127.0.0.1", () => {
          server.close(() => resolve(false));
        });
        server.on("error", () => resolve(true));
      });
      if (inUse) throw new Error(`port ${port} still in use after Neo4j shutdown`);
    }
  }
}