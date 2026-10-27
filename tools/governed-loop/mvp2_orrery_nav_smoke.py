#!/usr/bin/env python3
"""ORRERY-NAV-1 rev 2.1 smoke: conformance + read-only endpoints + overlay + audio emission.

Runs the frozen gate as a library (mvp2.py untouched), checks the two-leg catalog
conformance, starts the read-only bridge, drives the injected overlay through the
12-phase grid, and writes orrery_nav_report.json. Fail-closed; a disagreement is
a STOP, never a correction.
"""
import argparse
import hashlib
import importlib.util
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict, deque

SCRATCH = os.environ.get("GOVERNED_LOOP_SCRATCH", os.path.dirname(os.path.abspath(__file__)))
REPO = os.environ.get("GOVERNED_LOOP_REPO", os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
BRIDGE_PORT = int(os.environ.get("GOVERNED_LOOP_BRIDGE_PORT", "8765"))
VITE_PORT = int(os.environ.get("GOVERNED_LOOP_VITE_PORT", "4202"))
K_STEPS = 5
DWELL_MS = 0

OVERLAY = f"{SCRATCH}/orrery_nav_overlay.js"
BRIDGE = f"{SCRATCH}/orrery_nav_bridge.py"
RUNNER = f"{SCRATCH}/orrery_nav_run.sh"
OPENING = f"{SCRATCH}/orrery_nav_opening.json"
PROBE = f"{SCRATCH}/orrery_nav_probe.js"
BROWSER_LOG = f"{SCRATCH}/orrery_nav_browser_log.json"
REPORT = f"{SCRATCH}/orrery_nav_report.json"


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def write_json(path, obj):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, sort_keys=True)
        f.write("\n")


def import_bridge():
    spec = importlib.util.spec_from_file_location("orrery_nav_bridge", BRIDGE)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def http_json(url, timeout=45):
    started = time.time()
    with urllib.request.urlopen(url, timeout=timeout) as response:
        payload = json.load(response)
    return payload, round((time.time() - started) * 1000, 2)


def check_write_route(url):
    try:
        request = urllib.request.Request(url, data=b"{}", method="POST")
        urllib.request.urlopen(request, timeout=10)
        return False, "POST accepted"
    except urllib.error.HTTPError as error:
        return error.code == 405, f"HTTP {error.code}"
    except Exception as error:  # noqa: BLE001
        return False, str(error)


def phase_connectivity(model):
    edges = defaultdict(list)
    for source, images in model.sub3["rlImages"].items():
        src = int(source)
        for operator, target in images:
            edges[src].append((int(target), int(model.sub3["carries"][operator])))
    best = (0, None, [])
    for start in model.masks:
        seen = {(start, 0)}
        queue = deque([(start, 0)])
        while queue:
            mask, phase = queue.popleft()
            for target, carry in edges.get(mask, []):
                state = (target, (phase + carry) % 12)
                if state not in seen:
                    seen.add(state)
                    queue.append(state)
        phases = sorted({phase for _, phase in seen})
        if len(phases) > best[0]:
            best = (len(phases), start, phases)
    return {
        "maxPhasesInSingleSeamComponent": best[0],
        "witnessMask": best[1],
        "witnessPhases": best[2],
        "finding": ("no single R1/L1 seam walk spans all 12 phases; all 12 phases are "
                    "still exercised via overlay selection plus legal Tier-1 moves"),
    }


def build_plan(model):
    steps = []
    failures = []

    def add_select(node, group=None):
        steps.append({"kind": "select", "node": node, "group": group})

    def add_move(current, candidate, group):
        verdict, reasons, checks, citation = model.world.gate(current, candidate)
        step = {
            "kind": "move",
            "current": f"{current[0]}@{current[1]}",
            "candidate": f"{candidate[0]}@{candidate[1]}",
            "expectedState": f"{candidate[0]}@{candidate[1]}",
            "verdict": verdict,
            "reasons": reasons,
            "citation": citation,
            "group": group,
        }
        steps.append(step)
        if verdict != "ACCEPT":
            failures.append(step)

    add_select("1387@0", "initial")
    add_move((1387, 0), (2773, 11), "seam-audio")

    for phase in range(12):
        add_select(f"1387@{phase}", "phase")
        add_move((1387, phase), (875, phase), "phase")

    add_select("1387@0", "family")
    chain = [1387, 875, 1259, 1383, 1395, 1643]
    for current, candidate in zip(chain, chain[1:]):
        add_move((current, 0), (candidate, 0), "family")

    add_select("1001@0", "boundary")
    add_move((1001, 0), (501, 1), "boundary")

    add_select("1009@0", "seam")
    for current, candidate in zip([(1009, 0), (505, 1), (253, 2)],
                                  [(505, 1), (253, 2), (127, 3)]):
        add_move(current, candidate, "seam")

    return {"steps": steps, "failures": failures}


PROBE_TEMPLATE = r'''async (page) => {
  const PLAN = __PLAN__;
  const log = {
    consoleErrors: [], pageErrors: [], failures: [], steps: [],
    phasesVisited: [], familyWalk: [], seamDemo: [], boundaryReplay: null,
    expressibility0: null, expressibilityByNode: {}, audio: null, allPass: false,
  };
  page.on("console", (message) => {
    if (message.type() === "error") log.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => log.pageErrors.push(String(error.message)));
  const check = (condition, label) => {
    if (!condition) log.failures.push(label);
  };
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
    const pre = await page.evaluate(() => window.__orreryNav.inspect());
    log.expressibility0 = pre;
    check(pre.cells === 84, "84 cells");
    check(pre.boundaryChips === 12, "12 boundary chips");
    check(pre.nodes === 5544, "5544 nodes");
    check(pre.seamCatalog === 5130, "5130 seam moves");
    check(pre.boundaryRows === 256, "256 boundary rows");
    check(pre.gridCount === 3696, "grid count 3696");
    check(pre.boundaryCount === 1848, "boundary count 1848");
    check(pre.total === 5544, "total 5544");
    check(pre.displayAnchorButtons === 21, "21 display anchors");
    await page.evaluate(() => { window.__orreryAudioEvents.frequencies.length = 0; });

    for (const step of PLAN.steps) {
      if (step.kind === "select") {
        const result = await page.evaluate((id) => window.__orreryNav.select(id), step.node);
        const current = await page.evaluate(() => window.__orreryNav.state());
        check(current.node === step.node, `select ${step.node}`);
        log.steps.push({ kind: "select", node: step.node, group: step.group, counts: result.counts });
        if (["1387@0", "1001@0", "1009@0"].includes(step.node)) {
          const inspect = await page.evaluate(() => window.__orreryNav.inspect());
          log.expressibilityByNode[step.node] = inspect;
        }
      } else {
        const before = await page.evaluate(() => window.__orreryNav.state());
        if (before.node !== step.current) {
          await page.evaluate((id) => window.__orreryNav.select(id), step.current);
        }
        const result = await page.evaluate(
          (payload) => window.__orreryNav.applyMove(
            payload.candidate, payload.verdict, payload.citation,
          ),
          step,
        );
        await page.waitForTimeout(40);
        const current = await page.evaluate(() => window.__orreryNav.state());
        check(current.node === step.expectedState,
              `move ${step.current}->${step.candidate}: ${current.node}`);
        check(result.verdict === step.verdict, `verdict ${step.candidate}`);
        log.steps.push({
          kind: "move", group: step.group, current: step.current,
          candidate: step.candidate, verdict: result.verdict,
          citation: result.citation, expectedState: step.expectedState,
          actualState: current.node, emission: result.emission,
        });
        if (step.group === "phase") log.phasesVisited.push(current.phase);
        if (step.group === "family") log.familyWalk.push(current.node);
        if (step.group === "seam") log.seamDemo.push(current.node);
        if (step.group === "boundary") {
          log.boundaryReplay = {
            state: current.node, verdict: result.verdict,
            citation: result.citation, emission: result.emission,
          };
        }
      }
    }

    const navLog = await page.evaluate(() => window.__orreryNav.log());
    const events = await page.evaluate(
      () => JSON.parse(JSON.stringify(window.__orreryAudioEvents)),
    );
    const voiced = navLog.emissions.filter((entry) => entry.type === "voiced").length;
    const rests = navLog.emissions.filter((entry) => entry.type === "rest").length;
    log.audio = {
      frequencies: events.frequencies.length,
      contexts: events.contexts,
      voiced,
      rests,
      emissions: navLog.emissions,
    };
    log.phasesVisited = [...new Set(log.phasesVisited)].sort((a, b) => a - b);
    check(log.phasesVisited.length === 12, "12 phases visited");
    check(log.familyWalk.length === 5, "family walk 5");
    check(Boolean(log.boundaryReplay) && log.boundaryReplay.verdict === "ACCEPT",
          "boundary replay ACCEPT");
    check(log.seamDemo.length === 3, "seam demo 3");
    check(voiced >= 1, "voiced move emission");
    check(events.frequencies.length >= 1, "audio frequencies fired");
    check(events.contexts >= 1, "audio context created");
    check(log.consoleErrors.length === 0, "console clean");
    check(log.pageErrors.length === 0, "page clean");

    const union = new Set(
      Object.values(log.expressibilityByNode).flatMap((inspect) => inspect.classes),
    );
    check(union.size === 3, "three highlight classes across nodes");
    log.allPass = log.failures.length === 0;
  } catch (error) {
    log.failures.push(String(error && error.message ? error.message : error));
    log.allPass = false;
    try {
      const navLog = await page.evaluate(() => window.__orreryNav?.log?.());
      if (navLog) log.audio = navLog;
    } catch (_) {}
  }
  await page.evaluate((payload) => { window.__orreryNavLog = JSON.stringify(payload); }, log);
  return "orrery-nav-probe-complete";
}
'''


def write_probe(plan):
    script = (
        PROBE_TEMPLATE
        .replace("__PLAN__", json.dumps(plan, sort_keys=True))
        .replace("__BRIDGE__", f"http://127.0.0.1:{BRIDGE_PORT}")
        .replace("__OVERLAY__", OVERLAY)
    )
    with open(PROBE, "w", encoding="utf-8") as f:
        f.write(script)


def browser_run():
    env = dict(os.environ)
    env["ORRERY_NAV_VITE_PORT"] = str(VITE_PORT)
    started = time.time()
    result = subprocess.run(
        ["bash", RUNNER, PROBE, BROWSER_LOG],
        capture_output=True, text=True, env=env, timeout=300,
    )
    elapsed = round(time.time() - started, 2)
    log = None
    if os.path.exists(BROWSER_LOG):
        try:
            log = load_json(BROWSER_LOG)
            if isinstance(log, str):
                log = json.loads(log)
        except Exception as error:  # noqa: BLE001
            log = {"parseError": str(error)}
    return {
        "returncode": result.returncode,
        "stdout": result.stdout[-4000:],
        "stderr": result.stderr[-4000:],
        "seconds": elapsed,
        "log": log,
    }


def main():
    model = import_bridge().Model()
    opening = load_json(OPENING)
    repo_open = model.repo
    mvp2_open = sha256_file(f"{SCRATCH}/mvp2.py")

    conformance = {
        "familyA": model.check_seam_conformance(),
        "familyB": model.check_familyb_conformance(),
        "probes": model.check_probes(),
        "tier1": {
            "derived": model.tier1_count,
            "expected": 18984,
            "familySizeSquares": model.family_size_squares,
            "product": 12 * model.family_size_squares,
        },
        "boundary": {
            "count": model.boundary["count"],
            "expected": 256,
            "exits": len(model.boundary["exits"]),
            "entries": len(model.boundary["entries"]),
            "distinctRows": model.boundary["distinctRows"],
        },
        "seamCatalog": {
            "count": len(model.seam_moves),
            "expected": 5130,
            "familyA": len(model.catalog["familyA"]["edges"]),
            "familyB": len(model.catalog["familyB"]["edges"]),
        },
    }
    plan = build_plan(model)
    connectivity = phase_connectivity(model)

    bridge_proc = None
    endpoints = {}
    bridge_summary = None
    browser = None
    stop = None

    def conformance_failure():
        if conformance["familyA"]["firstFailure"]:
            return f"FamilyA:{conformance['familyA']['firstFailure']['move']}"
        if conformance["familyB"]["firstFailure"]:
            failure = conformance["familyB"]["firstFailure"]
            return f"FamilyB:{failure['left']}->{failure['right']}@{failure['phase']}"
        if conformance["probes"]["firstFailure"]:
            return f"probe:{conformance['probes']['firstFailure']}"
        return None

    if conformance_failure():
        stop = "conformance"
    elif plan["failures"]:
        stop = "plan-gate"
    else:
        bridge_proc = subprocess.Popen(
            [sys.executable, BRIDGE, "--port", str(BRIDGE_PORT)],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        )
        try:
            ready = False
            for _ in range(200):
                try:
                    http_json(f"http://127.0.0.1:{BRIDGE_PORT}/api/nodes", timeout=5)
                    ready = True
                    break
                except Exception:
                    if bridge_proc.poll() is not None:
                        break
                    time.sleep(0.1)
            if not ready:
                stop = "bridge-start"
            else:
                nodes_payload, nodes_ms = http_json(
                    f"http://127.0.0.1:{BRIDGE_PORT}/api/nodes")
                moves_payload, moves_ms = http_json(
                    f"http://127.0.0.1:{BRIDGE_PORT}/api/legal-moves")
                tier1_payload, tier1_ms = http_json(
                    f"http://127.0.0.1:{BRIDGE_PORT}/api/tier1-moves")
                boundary_payload, boundary_ms = http_json(
                    f"http://127.0.0.1:{BRIDGE_PORT}/api/boundary-transit")
                write_ok, write_detail = check_write_route(
                    f"http://127.0.0.1:{BRIDGE_PORT}/api/nodes")
                endpoints = {
                    "nodes": {
                        "count": nodes_payload["count"],
                        "length": len(nodes_payload["nodes"]),
                        "expected": 5544,
                        "latencyMs": nodes_ms,
                    },
                    "seamCatalog": {
                        "count": moves_payload["count"],
                        "length": len(moves_payload["moves"]),
                        "familyA": sum(1 for m in moves_payload["moves"] if m["kind"] == "familyA"),
                        "familyB": sum(1 for m in moves_payload["moves"] if m["kind"] == "familyB"),
                        "expected": 5130,
                        "latencyMs": moves_ms,
                    },
                    "tier1": {
                        "count": tier1_payload["count"],
                        "length": len(tier1_payload["moves"]),
                        "expected": 18984,
                        "latencyMs": tier1_ms,
                    },
                    "boundaryTransit": {
                        "count": boundary_payload["count"],
                        "length": len(boundary_payload["rows"]),
                        "exits": sum(1 for r in boundary_payload["rows"] if r["side"] == "exit"),
                        "entries": sum(1 for r in boundary_payload["rows"] if r["side"] == "entry"),
                        "expected": 256,
                        "latencyMs": boundary_ms,
                    },
                    "writeRoute": {"rejected": write_ok, "detail": write_detail},
                }
                if not (
                    endpoints["nodes"]["count"] == endpoints["nodes"]["length"] == 5544
                    and endpoints["seamCatalog"]["count"] == endpoints["seamCatalog"]["length"] == 5130
                    and endpoints["seamCatalog"]["familyA"] == 5040
                    and endpoints["seamCatalog"]["familyB"] == 90
                    and endpoints["tier1"]["count"] == endpoints["tier1"]["length"] == 18984
                    and endpoints["boundaryTransit"]["count"] == endpoints["boundaryTransit"]["length"] == 256
                    and endpoints["boundaryTransit"]["exits"] == 128
                    and endpoints["boundaryTransit"]["entries"] == 128
                    and write_ok
                ):
                    stop = "endpoint-count"
                else:
                    write_probe(plan)
                    browser = browser_run()
                    log = browser.get("log") or {}
                    if not log.get("allPass"):
                        stop = "overlay-or-browser"
        finally:
            if bridge_proc is not None:
                bridge_proc.terminate()
                try:
                    out, err = bridge_proc.communicate(timeout=10)
                    bridge_summary = {"stdout": out[-4000:], "stderr": err[-2000:]}
                except subprocess.TimeoutExpired:
                    bridge_proc.kill()
                    bridge_summary = {"stdout": "", "stderr": "killed after timeout"}

    # Closing checks even on STOP.
    mvp2_close = sha256_file(f"{SCRATCH}/mvp2.py")
    status = subprocess.run(
        ["git", "-C", REPO, "status", "--porcelain"], capture_output=True, text=True,
    ).stdout
    orrery_status = subprocess.run(
        ["git", "-C", REPO, "status", "--porcelain", "orrery"], capture_output=True, text=True,
    ).stdout
    landing_paths = tuple(p for p in os.environ.get("GOVERNED_LOOP_LANDING_PATHS", "").split(",") if p)
    def _unexpected(line):
        path = line[3:] if len(line) > 3 else line
        return not any(path.startswith(prefix) for prefix in landing_paths)
    repo_writes = 0 if not status.strip() else len([line for line in status.splitlines() if _unexpected(line)])
    orrery_changes = 0 if not orrery_status.strip() else len(orrery_status.strip().splitlines())
    mvp2_identical = mvp2_open == mvp2_close

    overlay_src = open(OVERLAY, encoding="utf-8").read()
    bake_ok = (
        all(path in overlay_src for path in
            ["/api/nodes", "/api/legal-moves", "/api/tier1-moves", "/api/boundary-transit"])
        and "1387" not in overlay_src
        and "5544" not in overlay_src
        and "5130" not in overlay_src
        and len(overlay_src) < 40000
    )

    browser_log = (browser or {}).get("log") or {}
    console_errors = len(browser_log.get("consoleErrors", []))
    page_errors = len(browser_log.get("pageErrors", []))
    classes_union = sorted({
        name
        for inspect in browser_log.get("expressibilityByNode", {}).values()
        for name in inspect.get("classes", [])
    })
    expressibility_ok = (
        browser_log.get("expressibility0", {}).get("cells") == 84
        and browser_log.get("expressibility0", {}).get("boundaryChips") == 12
        and len(classes_union) == 3
    )

    if stop is None:
        if not mvp2_identical:
            stop = "mvp2-byte-identical"
        elif not bake_ok:
            stop = "bake-check"
        elif console_errors or page_errors:
            stop = "console-errors"
        elif not expressibility_ok:
            stop = "overlay-expressibility"
        elif repo_writes or orrery_changes:
            stop = "repo-write"

    catalog_conformance_ok = (
        conformance["familyA"]["passed"] == 5040
        and conformance["familyB"]["passed"] == 1008
    )
    conformance_ok = (
        catalog_conformance_ok
        and conformance["probes"]["passed"] == conformance["probes"]["checked"]
        and conformance["tier1"]["derived"] == 18984
    )
    nodes_match = endpoints.get("nodes", {}).get("count") == 5544
    seam_match = endpoints.get("seamCatalog", {}).get("count") == 5130
    tier1_line_match = conformance["tier1"]["derived"] == 18984
    tier1_endpoint_match = endpoints.get("tier1", {}).get("count") == 18984
    boundary_match = endpoints.get("boundaryTransit", {}).get("count") == 256

    overall = (
        stop is None
        and conformance_ok
        and nodes_match and seam_match and tier1_line_match and tier1_endpoint_match
        and boundary_match
        and bool(browser_log.get("allPass"))
        and expressibility_ok
        and console_errors == 0 and page_errors == 0
        and bake_ok and mvp2_identical and repo_writes == 0 and orrery_changes == 0
    )
    if overall:
        stop = None

    first_failure = conformance_failure()
    verdicts = {
        "ORRERY-NAV-1-VERDICT": "PASS" if overall else "STOP",
        "STOP-RULE-FIRED": stop or "none",
        "NODES": f"{endpoints.get('nodes', {}).get('count', 0)}/5544 "
                 f"{'MATCH' if nodes_match else 'MISMATCH'}",
        "SEAM-CATALOG": f"{endpoints.get('seamCatalog', {}).get('count', 0)}/5130 "
                        f"{'MATCH' if seam_match else 'MISMATCH'}",
        "TIER1-DERIVED": f"{conformance['tier1']['derived']} EXPECTATION 18984 "
                         f"{'MATCH' if tier1_line_match else 'MISMATCH'}",
        "BOUNDARY-TRANSIT": f"{endpoints.get('boundaryTransit', {}).get('count', 0)} "
                            f"EXPECTATION 256 {'MATCH' if boundary_match else 'MISMATCH'}",
        "CONFORMANCE-5130": ("EXHAUSTIVE-ACCEPT" if catalog_conformance_ok
                             else f"FALSIFIED-AT {first_failure or 'unknown'}"),
        "PROBES": f"{conformance['probes']['passed']}/{conformance['probes']['checked']} MATCH",
        "MVP2-BYTE-IDENTICAL": "TRUE" if mvp2_identical else "FALSE",
        "OVERLAY-EXPRESSIBILITY": "VERIFIED" if expressibility_ok else "CONVENTION-GAP",
        "CONSOLE-ERRORS": str(console_errors),
        "BAKE-CHECK": "CLEAN" if bake_ok else "VIOLATED",
        "REPO-WRITES": str(repo_writes),
        "ORRERY-CHANGES": str(orrery_changes),
    }

    report = {
        "schemaVersion": "governed-loop.orrery-nav-report.v1",
        "directive": "ORRERY-NAV-1 rev 2.1",
        "runParameters": {
            "bridgePort": BRIDGE_PORT,
            "vitePort": VITE_PORT,
            "K": K_STEPS,
            "dwellMs": DWELL_MS,
            "bridge": BRIDGE,
            "overlay": OVERLAY,
            "runner": RUNNER,
            "probe": PROBE,
        },
        "fixedPoint": {
            "repo": repo_open,
            "opening": {
                "path": "orrery_nav_opening.json",
                "sha256": sha256_file(OPENING),
                "pins": opening["pins"],
                "anchors": opening["anchors"],
                "derivedCounts": opening["derivedCounts"],
                "expressibility": opening["expressibility"],
            },
            "mvp2ShaOpen": mvp2_open,
            "mvp2ShaClose": mvp2_close,
        },
        "endpoints": endpoints,
        "conformance": conformance,
        "phaseConnectivity": connectivity,
        "plan": {
            "stepCount": len(plan["steps"]),
            "moveCount": sum(1 for s in plan["steps"] if s["kind"] == "move"),
            "gateFailures": plan["failures"],
        },
        "browser": browser_log,
        "browserRun": browser,
        "bridge": bridge_summary,
        "overlay": {
            "path": OVERLAY,
            "sha256": sha256_file(OVERLAY),
            "bakeCheck": bake_ok,
            "classesUnion": classes_union,
        },
        "repoClose": {
            "status": status.strip(),
            "orreryStatus": orrery_status.strip(),
            "repoWrites": repo_writes,
            "orreryChanges": orrery_changes,
        },
        "verdicts": verdicts,
        "notes": {
            "anchorNamingDiscrepancy": (
                "The rev 2.1 section 4 label 'repo frozen_ground_truth.json' does not resolve "
                "in the repository (no such file exists there). The realm "
                "frozen_ground_truth.json is the primary 462 ground-truth artifact and is "
                "pinned in the opening fixed point; the repo-side correspondence anchor used "
                "is qa/gov-528-production-aggregate.json (partitionCheck.withheldBoundary = 154). "
                "The gate source 'mvp2.py' is realm-side; the repository carries the orrery, "
                "not the gate. Recorded as a naming discrepancy; all derivations use realm "
                "bytes primary, repo correspondence only."
            ),
            "phaseConnectivity": connectivity["finding"],
            "familyBCitationSplit": (
                "All 1,008 Family B pair queries ACCEPT. 720 carry the FamilyB:bridge citation; "
                "288 are accepted by Tier 1 first because the 7-32 partner is in the anchor's "
                "governed family (same root, same phase), which is the gate's rule ordering."
            ),
        },
    }
    write_json(REPORT, report)

    print("ORRERY-NAV-1 SMOKE")
    print(f"  nodes {verdicts['NODES']} | seam {verdicts['SEAM-CATALOG']}")
    print(f"  tier1 {verdicts['TIER1-DERIVED']} | boundary {verdicts['BOUNDARY-TRANSIT']}")
    print(f"  conformance {verdicts['CONFORMANCE-5130']} | probes {verdicts['PROBES']}")
    print(f"  overlay {verdicts['OVERLAY-EXPRESSIBILITY']} | console {verdicts['CONSOLE-ERRORS']}")
    print(f"  phases visited {browser_log.get('phasesVisited')}")
    print(f"  family walk {len(browser_log.get('familyWalk', []))} | "
          f"seam demo {len(browser_log.get('seamDemo', []))} | "
          f"boundary {browser_log.get('boundaryReplay', {}).get('verdict') if browser_log.get('boundaryReplay') else None}")
    print(f"  audio voiced {browser_log.get('audio', {}).get('voiced')} | "
          f"frequencies {browser_log.get('audio', {}).get('frequencies')} | "
          f"contexts {browser_log.get('audio', {}).get('contexts')}")
    print(f"  phase connectivity: {connectivity['maxPhasesInSingleSeamComponent']}/12 "
          f"in a single seam component (witness {connectivity['witnessMask']})")
    print(f"  mvp2 identical {mvp2_identical} | repo writes {repo_writes} | "
          f"orrery changes {orrery_changes}")
    print(f"  report {REPORT}")
    print()
    for key, value in verdicts.items():
        print(f"{key}: {value}")
    return 0 if overall else 1


if __name__ == "__main__":
    sys.exit(main())
