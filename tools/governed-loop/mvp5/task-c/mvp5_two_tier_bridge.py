#!/usr/bin/env python3
"""MVP5 two-tier Orrery bridge: payload builder, Playwright probe writer,
and read-only bridge/Vite session driver."""
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.dont_write_bytecode = True

SCRATCH = Path(os.environ.get("MVP5_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp5"))
REPO = Path(os.environ.get("GOVERNED_LOOP_REPO", "/home/erick/projects/integrated-release"))
TASK_DIR = SCRATCH / "task-c"
BRIDGE = REPO / "tools" / "governed-loop" / "orrery_nav_bridge.py"
RUNNER = REPO / "tools" / "governed-loop" / "orrery_nav_run.sh"
OVERLAY = REPO / "tools" / "governed-loop" / "orrery_nav_overlay.js"
SCHEDULER = TASK_DIR / "mvp5_two_tier_scheduler.js"
BRIDGE_PORT = int(os.environ.get("MVP5_BRIDGE_PORT", "8771"))
VITE_PORT = int(os.environ.get("MVP5_VITE_PORT", "4211"))

PROBE_TEMPLATE = r'''async (page) => {
  const REPLAYS = __REPLAYS__;
  const SCHEDULER_SOURCE = __SCHEDULER_SOURCE__;
  const log = {
    consoleErrors: [], pageErrors: [], failures: [], inspect: null,
    replays: [], bridge: "__BRIDGE__", allPass: false,
  };
  page.on("console", (message) => {
    if (message.type() === "error") log.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => log.pageErrors.push(String(error.message)));
  const check = (condition, label) => { if (!condition) log.failures.push(label); };
  try {
    await page.waitForFunction(
      () => document.querySelector("#inspector-heading")?.textContent === "Saturn A0",
    );
    await page.waitForFunction(
      () => document.querySelector("#audio-enable")?.disabled === false,
    );
    await page.locator("#audio-enable").focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => document.querySelector("#audio-pause")?.textContent === "Pause sound",
    );
    await page.evaluate((url) => { window.__ORRERY_NAV_BRIDGE__ = url; }, "__BRIDGE__");
    await page.addScriptTag({ path: "__OVERLAY__" });
    await page.waitForFunction(
      () => window.__orreryNav && window.__orreryNav.ready === true, null, { timeout: 30000 },
    );
    const inspect = await page.evaluate(() => window.__orreryNav.inspect());
    log.inspect = inspect;
    check(inspect.cells === 84, "84 cells");
    check(inspect.boundaryChips === 12, "12 boundary chips");
    check(inspect.nodes === 5544, "5544 nodes");
    check(inspect.seamCatalog === 5130, "5130 seam moves");
    check(inspect.boundaryRows === 256, "256 boundary rows");
    check(inspect.displayAnchorButtons === 21, "21 display anchors");
    await page.addScriptTag({ content: SCHEDULER_SOURCE });
    await page.waitForFunction(() => Boolean(window.__orreryTwoTierReplay));
    for (const payload of REPLAYS) {
      const replayed = await page.evaluate(
        (data) => window.__orreryTwoTierReplay.replay(data), payload,
      );
      log.replays.push(replayed);
    }
    check(log.consoleErrors.length === 0, "console clean");
    check(log.pageErrors.length === 0, "page clean");
    log.allPass = log.failures.length === 0;
  } catch (error) {
    log.failures.push(String(error && error.message ? error.message : error));
    log.allPass = false;
  }
  await page.evaluate((payload) => { window.__orreryNavLog = JSON.stringify(payload); }, log);
  return "mvp5-two-tier-complete";
}
'''


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_trace_module():
    sys.path.insert(0, str(SCRATCH / "task-b"))
    from mvp5_audio_renderer import load_trace
    return load_trace


def build_replay_payload(trace_path, palettes, office_lookup, name, mode="headless"):
    load_trace = load_trace_module()
    trace = load_trace(trace_path)
    bars = []
    for bar in trace["bars"]:
        mask = int(bar["node"].split("@")[0])
        office = office_lookup[mask]
        preset = palettes[office]
        offset = int(preset["registerOffset"])
        micro = []
        for step in bar["micro"]:
            midi = 60 + int(step["emittedPc"]) + max(0, offset) + 12
            if midi % 12 != int(step["emittedPc"]):
                raise RuntimeError(f"midi/pc mismatch at {bar['node']} sub {step['sub']}")
            micro.append({
                "sub": int(step["sub"]),
                "emittedPc": int(step["emittedPc"]),
                "projectionMode": step["projectionMode"],
                "midi": midi,
            })
        bars.append({
            "bar": int(bar["bar"]),
            "node": bar["node"],
            "office": office,
            "startMs": int(bar["startMs"]),
            "durationMs": int(bar["durationMs"]),
            "pitchClasses": [int(pc) for pc in bar["pitchClasses"]],
            "micro": micro,
        })
    steps = [{"type": "bar", **bars[0]}]
    bar_position = 1
    for event in trace["macroEvents"]:
        source_mask, source_phase = (int(part) for part in event["source"].split("@"))
        target_mask, target_phase = (int(part) for part in event["target"].split("@"))
        source_boundary = _is_boundary(source_mask)
        steps.append({
            "type": "hop",
            "source": event["source"],
            "target": event["target"],
            "kind": event.get("kind"),
            "verdict": event.get("gateVerdict", "ACCEPT"),
            "citation": event.get("citation"),
            "sourceBoundary": bool(source_boundary),
            "sourcePhase": source_phase,
            "targetBoundary": bool(_is_boundary(target_mask)),
            "targetPhase": target_phase,
        })
        if bar_position < len(bars) and bars[bar_position]["node"] == event["target"]:
            steps.append({"type": "bar", **bars[bar_position]})
            bar_position += 1
    while bar_position < len(bars):
        steps.append({"type": "bar", **bars[bar_position]})
        bar_position += 1
    return {
        "trace": name,
        "tracePath": str(trace_path),
        "traceSha256": trace["traceSha256"],
        "mode": mode,
        "palettes": palettes,
        "bars": bars,
        "steps": steps,
        "microStepMs": 300,
        "macroDwellMs": 1500,
        "transitRestMs": 300,
    }


_BOUNDARY_MASKS = None


def _is_boundary(mask):
    global _BOUNDARY_MASKS
    if _BOUNDARY_MASKS is None:
        census = json.loads((REPO / "tools" / "governed-loop" / "census_462.json").read_text(encoding="utf-8"))
        _BOUNDARY_MASKS = {int(record["stateId"]) for record in census["records"]
                           if record["role"] == "boundary"}
    return mask in _BOUNDARY_MASKS


def write_probe(path, replays):
    scheduler_source = SCHEDULER.read_text(encoding="utf-8")
    script = (PROBE_TEMPLATE
              .replace("__REPLAYS__", json.dumps(replays, sort_keys=True))
              .replace("__SCHEDULER_SOURCE__", json.dumps(scheduler_source))
              .replace("__BRIDGE__", f"http://127.0.0.1:{BRIDGE_PORT}")
              .replace("__OVERLAY__", str(OVERLAY)))
    Path(path).write_text(script, encoding="utf-8")
    return sha256_file(path)


def wait_for_bridge(timeout_seconds=60):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{BRIDGE_PORT}/api/nodes", timeout=2) as response:
                payload = json.load(response)
            return len(payload.get("nodes", []))
        except (urllib.error.URLError, ConnectionError, TimeoutError, json.JSONDecodeError):
            time.sleep(0.2)
    return None


CLI = REPO / "orrery" / "node_modules" / ".bin" / "playwright-cli"
VITE = REPO / "orrery" / "node_modules" / ".bin" / "vite"
FIXTURE = REPO / "orrery" / "test" / "fixtures" / "nodes-response.mjs"
TWIN_HUB = REPO / "canonical" / "fivefold-incubator" / "twin-hub-convergence-v0.json"
BRIDGE_INIT = REPO / "tools" / "governed-loop" / "bridge_init.js"


def wait_for_http(url, timeout_seconds=60):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                return response.status == 200
        except (urllib.error.URLError, ConnectionError, TimeoutError):
            time.sleep(0.2)
    return False


def cli_run(session, *args, timeout=900):
    return subprocess.run(
        [str(CLI), f"-s={session}", *args],
        capture_output=True, text=True, cwd=str(REPO), timeout=timeout,
    )


def run_session(probe_path, output_path, timeout_seconds=900, fake_audio=True, headed=False):
    bridge_proc = None
    vite_proc = None
    session = f"mvp5-{os.getpid()}-{int(time.time())}"
    output = None
    started = time.time()
    try:
        bridge_proc = subprocess.Popen(
            [sys.executable, str(BRIDGE), "--port", str(BRIDGE_PORT)],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=str(REPO),
        )
        node_count = wait_for_bridge()
        if node_count is None:
            raise RuntimeError("bridge did not become ready")
        vite_log = Path("/tmp/opencode/mvp5_task_c_vite.log")
        vite_log.parent.mkdir(parents=True, exist_ok=True)
        with open(vite_log, "wb") as handle:
            vite_proc = subprocess.Popen(
                [str(VITE), "--host", "127.0.0.1", "--port", str(VITE_PORT), "--strictPort"],
                cwd=str(REPO / "orrery"), stdout=handle, stderr=handle,
            )
        base_url = f"http://127.0.0.1:{VITE_PORT}"
        if not wait_for_http(f"{base_url}/", timeout_seconds=60):
            raise RuntimeError("Vite did not become ready")
        fixture_body = subprocess.run(
            ["node", str(FIXTURE)], capture_output=True, text=True, check=True, cwd=str(REPO),
        ).stdout
        twin_body = TWIN_HUB.read_text(encoding="utf-8")
        steps = [("open", "--headed") if headed else ("open",)]
        if fake_audio:
            steps.append(("run-code", "--filename", str(BRIDGE_INIT)))
        steps.extend([
            ("route", f"{base_url}/api/nodes", "--body", fixture_body, "--content-type", "application/json"),
            ("route", "**/@fs/**/twin-hub-convergence-v0.json", "--body", twin_body, "--content-type", "application/json"),
            ("goto", f"{base_url}/?anchor=1387"),
        ])
        cli_output = []
        for step in steps:
            result = cli_run(session, *step)
            cli_output.append({"step": step[0], "exitCode": result.returncode,
                               "stdout": result.stdout[-2000:], "stderr": result.stderr[-2000:]})
            if result.returncode != 0:
                raise RuntimeError(f"playwright step {step[0]} failed: {result.stderr[-1000:]}")
        probe_code = Path(probe_path).read_text(encoding="utf-8")
        probe_result = cli_run(session, "run-code", probe_code, timeout=timeout_seconds)
        cli_output.append({"step": "probe", "exitCode": probe_result.returncode,
                           "stdout": probe_result.stdout[-4000:], "stderr": probe_result.stderr[-4000:]})
        if probe_result.returncode != 0:
            raise RuntimeError(f"probe failed: {probe_result.stderr[-2000:]}")
        eval_result = cli_run(session, "--raw", "eval", "() => window.__orreryNavLog", timeout=120)
        Path(output_path).write_text(eval_result.stdout, encoding="utf-8")
        output = json.loads(eval_result.stdout)
        if isinstance(output, str):
            output = json.loads(output)
        return {
            "bridgeNodes": node_count,
            "runnerExitCode": probe_result.returncode,
            "stdout": probe_result.stdout[-4000:],
            "stderr": probe_result.stderr[-4000:],
            "cliSteps": cli_output,
            "log": output,
            "seconds": int(time.time() - started),
        }
    finally:
        try:
            cli_run(session, "close", timeout=60)
        except Exception:
            pass
        if vite_proc is not None:
            vite_proc.terminate()
            try:
                vite_proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                vite_proc.kill()
        if bridge_proc is not None:
            bridge_proc.terminate()
            try:
                bridge_proc.communicate(timeout=10)
            except subprocess.TimeoutExpired:
                bridge_proc.kill()
                bridge_proc.communicate()
