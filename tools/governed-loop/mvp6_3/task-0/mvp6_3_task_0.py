#!/usr/bin/env python3
"""MVP6.3-DIR-1 Task 0: L25 fixed-point verification, end-cut evidence, seam
baseline, and the master-fade predeclaration lock.

The opening is the stacked L23+L24+L25 working-tree landing on HEAD 154db01.
All symbolic output is int / str / bool only; continuous measurements are
Modality 2 with the guard flags carried.
"""
import hashlib
import json
import math
import os
import struct
import subprocess
import sys
import wave
from collections import deque
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp6_3")
TASK0 = SCRATCH / "task-0"
RECEIPT = TASK0 / "mvp6_3_task_0_receipt.json"
PREDECL = TASK0 / "mvp6_3_predeclared_fade.json"

INPUT_REALM = REPO / "tools" / "governed-loop"
os.environ["GOVERNED_LOOP_SCRATCH"] = str(INPUT_REALM)
os.environ["GOVERNED_LOOP_REPO"] = str(REPO)

SR = 44100
FADE_SAMPLES = 2205
EXPECTED_HEAD = "154db019711570ade5558a78eb5abb0b63b3c884"
EXPECTED_LEDGER = "567157e8520e680c246a39cb1956ca595f391bbdb1c7c7308cb34ca56a042952"
EXPECTED_LEDGER_BYTES = 389529
EXPECTED_LEDGER_LINES = 4315
EXPECTED_MANIFEST = "76c33d822f68945bb87fa5177f9e15f259f4b1475a53b417c36e960d0f8764b5"
EXPECTED_MANIFEST_FILES = 1663
EXPECTED_MANIFEST_BYTES = 145020217
EXPECTED_CHECKSUMS = "736c46e36d98c824cc5599dbd230195f2cc64da411ea0e1159e6ea378383e119"
EXPECTED_VALIDATION = "23e74e0c918b9c82877341390214adc31df66239cde2e4686c7d806e076cd049"
EXPECTED_L25_LANDING = "ce8057b89985183357c7c1160f3d3800d174b8f07c563a6776f035c84764838f"
EXPECTED_TRACE = "38ab32e5ebd1af7854d3241ecdab5879d5240293c3d62f80c3c28ffc38ad9e1b"
EXPECTED_WAV = "defd27219fb292fb9e1071b4fa13020d4adc62e2f981bce88d9b936d6a3e9f50"
EXPECTED_MIDI = "8a8c545ffbff1740921355b8538c599a66ccd93a98daa9d67e76e845734225f6"
EXPECTED_ITINERARY = "d62a3c260c56bdf15304da0f7fd0978de2d6e91c517d4f8485e02a6e793eef44"
EXPECTED_PREDECL_L25 = "b5b824f4db4f43e553026515dce84759f02207e28f744ed000346b183e915d3c"
EXPECTED_LEGATO_RENDERER = "e91c6e749b1003da3ad4461b745ad0d35caf23cb394f369d92534d857f6e769c"
EXPECTED_T0_RECEIPT_L25 = "7886bfd3573c5b3f8574cd62e1efa45e76d179f281b881589734b3e420e0e81a"
EXPECTED_TD_RECEIPT_L25 = "870f55e7a4640276d0673e66178fa47ea90547b3cb2a9a689808198f3c032bf3"

PINS = {
    "tools/governed-loop/mvp2.py": ("79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328", 38997),
    "tools/governed-loop/census_462.json": ("242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a", 194194),
    "tools/governed-loop/frozen_ground_truth.json": ("007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744", 91360),
    "tools/governed-loop/frozen_seam_substrate.json": ("8a5e82ac5f3b596720db2b62f2ba82484bab5250d168035e4c84cf9870c90bac", 42668),
    "tools/governed-loop/frozen_seam_substrate_v3.json": ("9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f", 47207),
    "tools/governed-loop/seam_legal_moves_v3.json": ("e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274", 551287),
    "tools/governed-loop/plv3_sweep_predeclared.json": ("14117c9460a6b611f849747f4881f296a8f3ce2108bb23524fe8beecd354e87b", 1712),
    "tools/governed-loop/plv3_sweep.json": ("6a943e44c9ed2dc0dc39810c9656872ee55d5ea86bcd4a1e80eb7de505ad8243", 10181),
    "tools/governed-loop/plv3_sweep.py": ("22e6b1e5998c92f445fe3a631b2842231b2d5fdbea56ca760436f3a022ac5c15", 9318),
    "tools/governed-loop/mvp4/task-a/mvp4_dynamic_chaldean_card.json": ("6486599187687edb1e28481b2bbc79d9a11a06001e4a237505c5e44c1c1a1469", 1999),
    "tools/governed-loop/mvp4/task-b/mvp4_symbolic_planner.py": ("9ff511f14282cbe6ee48010d67092c70c25da0bf5fa6dbd1e50382afeb85f5c0", 21348),
    "tools/governed-loop/mvp4/task-b/mvp4_graph_census.json": ("165fb6b33a1ced983b45189738541bba3e206d5655a729c8deeff5cd72627d12", 580743),
    "tools/governed-loop/mvp4/task-c/mvp4_q_intra_node.py": ("8b39ffe4be4d1f801cf1065cd8928c681002249de8ebad1d5246f277e94f815f", 4721),
    "tools/governed-loop/mvp5/task-a/mvp5_coupled_engine.py": ("c07940ccc90a73e220102000905d5af8da13ee03604224e49c71ff4c4718dd0c", 20663),
    "tools/governed-loop/mvp5/task-b/mvp5_audio_renderer.py": ("0c917aab7a95851e90ce1c3244ea6b3af1ea35e362262cb0d7a0095ec40b9984", 24696),
    "docs/ARCHITECTURE_MAP.md": ("865ab785164f85c0426d849cb3314c8c41efe81155ce14bd7fe6392ca5d0c381", 34880),
    "docs/THREE_PART_CONTINUOUS_TYPOLOGY.md": ("11a7f70f71ccc061c115e1b0e2f38a9265d9872588b6b9e83be05e79e5568d6c", 6664),
    "docs/TIERED_PHOTONIC_THEOREM.md": ("c1d6fcb53ff947b9aa32991d8d3dfc999f127bba0cb48ddf807ecc37386867c3", 8597),
    "canonical/tiered-photonic-candidates/tiered-photonic-v1.json": ("00ce6e315a66346fa9673ab5a64460a788702cc097fac4069444901af6930f4e", 43639),
    "orrery/src/generated/photonic-overlay.v1.json": ("35e8958d6e6d2455ceb6442ef7dc50d07de80416bbed7bf78260c670cc10901e", 17403),
    "orrery/src/audio.ts": ("e863b845c8f2709a0fe0e6fe706dce603e795b760c6561d110d240ddb1dfca88", 37063),
    "src/fivefold/quintessence.py": ("eefd7e1e060189261c8063652d2ed73a09b16d3ffdcb9f259502a107ef9ceaa0", 5163),
    "tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl": (EXPECTED_TRACE, 294526),
    "tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav": (EXPECTED_WAV, 10822184),
    "tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.mid": (EXPECTED_MIDI, 10978),
    "tools/governed-loop/mvp6_2/task-a/mvp6_2_itinerary.json": (EXPECTED_ITINERARY, 29508),
    "tools/governed-loop/mvp6_2/task-0/mvp6_2_predeclared_legato.json": (EXPECTED_PREDECL_L25, 3493),
    "tools/governed-loop/mvp6_2/task-b/mvp6_2_legato_renderer.py": (EXPECTED_LEGATO_RENDERER, 8624),
    "qa/mvp6_2_landing_receipt.json": (EXPECTED_L25_LANDING, 18870),
    "qa/mvp6_2_task_0_receipt.json": (EXPECTED_T0_RECEIPT_L25, 5278),
    "qa/mvp6_2_task_d_receipt.json": (EXPECTED_TD_RECEIPT_L25, 28532),
}

ANCHORS = {
    150: "        if cm == nm and cp == np_:",
    151: "            if self.gov_root[cm] is None:",
    152: "                checks[\"boundary_endpoint\"] = True",
    153: "                checks[\"same_family\"] = False",
    154: "                return \"REJECT\", [\"ungoverned-transition\"], checks, None",
    169: "        same_root = cr is not None and nr is not None and cr == nr",
    171: "        if same_root and cp == np_:",
    172: "            return \"ACCEPT\", [], checks, None",
    183: "        if checks[\"boundary_endpoint\"]:",
    184: "            return \"REJECT\", [\"ungoverned-transition\"], checks, None",
    733: "        plan[\"dwellMs\"] = int(__import__(\"os\").environ.get(\"ORRERY_BRIDGE_DWELL_MS\", \"1500\"))",
}

GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def find_floats(obj, path="$"):
    found = []
    if isinstance(obj, float):
        found.append(path)
    elif isinstance(obj, dict):
        for key, value in obj.items():
            found.extend(find_floats(value, f"{path}.{key}"))
    elif isinstance(obj, (list, tuple)):
        for index, value in enumerate(obj):
            found.extend(find_floats(value, f"{path}[{index}]"))
    return found


def load_samples(path):
    with wave.open(str(path), "rb") as handle:
        if handle.getframerate() != SR or handle.getnchannels() != 1 or handle.getsampwidth() != 2:
            stop("S-1", f"WAV format drift {path}")
        frames = handle.readframes(handle.getnframes())
    return struct.unpack("<%dh" % (len(frames) // 2), frames)


def prefix_squares(samples):
    prefix = [0.0] * (len(samples) + 1)
    total = 0.0
    for index, value in enumerate(samples):
        total += value * value
        prefix[index + 1] = total
    return prefix


def rms(prefix, start, end):
    start = max(0, int(start)); end = min(len(prefix) - 1, int(end))
    if end <= start:
        return 0.0
    return math.sqrt((prefix[end] - prefix[start]) / (end - start))


def seam_measurements(samples, boundaries_ms):
    prefix = prefix_squares(samples)
    rows = []
    for boundary_ms in boundaries_ms:
        boundary = int(boundary_ms * SR / 1000)
        window = int(0.15 * SR); step = int(0.01 * SR)
        dips = []; position = boundary - window
        while position + step <= boundary + window:
            dips.append(rms(prefix, position, position + step)); position += step
        dip = min(dips) if dips else 0.0
        local = (rms(prefix, boundary - window - SR, boundary - window)
                 + rms(prefix, boundary + window, boundary + window + SR)) / 2.0
        depth = 20.0 * math.log10(local / dip) if dip > 0 and local > 0 else 0.0
        rows.append({"timeMs": boundary_ms, "depthDb": round(depth, 6)})
    depths = sorted(row["depthDb"] for row in rows)
    return {
        "boundaries": len(rows),
        "medianDepthDb": round(depths[len(depths) // 2], 6) if depths else 0.0,
        "maxDepthDb": round(max(depths), 6) if depths else 0.0,
        "rows": rows,
    }


def verify_opening():
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=REPO,
                          capture_output=True, text=True, check=True).stdout.strip()
    status = subprocess.run(["git", "status", "--porcelain"], cwd=REPO,
                            capture_output=True, text=True, check=True).stdout
    entries = [line for line in status.splitlines() if line.strip()]
    if head != EXPECTED_HEAD:
        stop("S-1", f"HEAD {head}")
    ledger = (REPO / "provenance/DECISION_LEDGER.md").read_bytes()
    manifest = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    files = manifest.get("files", [])
    checks = [
        ("ledger", hashlib.sha256(ledger).hexdigest(), EXPECTED_LEDGER),
        ("ledgerBytes", len(ledger), EXPECTED_LEDGER_BYTES),
        ("ledgerLines", ledger.count(b"\n"), EXPECTED_LEDGER_LINES),
        ("manifest", sha256_file(REPO / "MANIFEST.json"), EXPECTED_MANIFEST),
        ("manifestFiles", len(files), EXPECTED_MANIFEST_FILES),
        ("manifestBytes", sum(f.get("bytes", 0) for f in files), EXPECTED_MANIFEST_BYTES),
        ("checksums", sha256_file(REPO / "CHECKSUMS.sha256"), EXPECTED_CHECKSUMS),
        ("validation", sha256_file(REPO / "qa/integrated-release-validation.json"), EXPECTED_VALIDATION),
        ("l25Landing", sha256_file(REPO / "qa/mvp6_2_landing_receipt.json"), EXPECTED_L25_LANDING),
    ]
    for name, actual, expected in checks:
        if actual != expected:
            stop("S-1", f"{name} {actual} != {expected}")
    validation = json.loads((REPO / "qa/integrated-release-validation.json").read_text(encoding="utf-8"))
    if validation.get("checksPassed") != 418 or validation.get("checksFailed") != 0:
        stop("S-1", "release closure")
    if not entries:
        stop("S-1", "expected the stacked landings")
    return {
        "baseHead": head,
        "treeClean": False,
        "workingTreeState": "stacked L23+L24+L25 working-tree landing (uncommitted) on HEAD 154db01",
        "openingStatusEntries": len(entries),
        "ledgerBefore": {"sha256": hashlib.sha256(ledger).hexdigest(),
                         "bytes": len(ledger), "lines": ledger.count(b"\n")},
        "manifestBefore": {"sha256": sha256_file(REPO / "MANIFEST.json"),
                           "fileCount": len(files),
                           "totalBytes": sum(f.get("bytes", 0) for f in files)},
        "checksumsBefore": {"sha256": sha256_file(REPO / "CHECKSUMS.sha256")},
        "validationBefore": {"sha256": sha256_file(REPO / "qa/integrated-release-validation.json")},
        "l25LandingReceipt": {"sha256": EXPECTED_L25_LANDING},
    }


def verify_pins():
    rows = []
    for relative, (expected_sha, expected_bytes) in sorted(PINS.items()):
        path = REPO / relative
        if not path.exists():
            stop("S-1", f"missing pin {relative}")
        data = path.read_bytes()
        sha = hashlib.sha256(data).hexdigest()
        if sha != expected_sha or len(data) != expected_bytes:
            stop("S-1", f"pin drift {relative}: {sha} / {len(data)}")
        rows.append({"path": relative, "sha256": sha, "bytes": len(data), "verified": True})
    return rows


def verify_anchors():
    source = (REPO / "tools/governed-loop/mvp2.py").read_text(encoding="utf-8").splitlines()
    rows = []
    for line_number, expected in sorted(ANCHORS.items()):
        if source[line_number - 1] != expected:
            stop("S-1", f"anchor drift line {line_number}: {source[line_number - 1]!r}")
        rows.append({"line": line_number, "verified": True})
    return rows


def audit_strong_core():
    sys.path.insert(0, str(REPO / "tools/governed-loop/mvp4/task-b"))
    import mvp4_symbolic_planner as planner_module
    planner = planner_module.Planner()
    out_dist = planner.distances("1387@0")
    reverse = planner.reverse_adjacency()
    in_dist = {"1387@0": 0}
    queue = deque(["1387@0"])
    while queue:
        node = queue.popleft()
        for predecessor in reverse[node]:
            if predecessor not in in_dist:
                in_dist[predecessor] = in_dist[node] + 1
                queue.append(predecessor)
    strong = set(out_dist) & set(in_dist)
    one_way = set(out_dist) - strong
    if len(out_dist) != 3204 or len(strong) != 2928 or len(one_way) != 276:
        stop("S-3", "SCC census drift")
    return {"seed": "1387@0", "reachableNodes": len(out_dist),
            "strongCoreNodes": len(strong), "oneWayNodes": len(one_way),
            "shoreInStrongCore": "757@6" in strong}


def trace_boundaries():
    trace_path = REPO / "tools/governed-loop/mvp6_1/task-c/traces/piece_a_far_shore_delooped.jsonl"
    records = [json.loads(line) for line in trace_path.read_text(encoding="utf-8").splitlines()]
    bars = {}
    for record in records:
        if record.get("recordType") != "micro":
            continue
        bars.setdefault(record["bar"], {"startMs": record["barStartMs"],
                                        "node": record["node"]})
    ordered = [bars[key] for key in sorted(bars)]
    direct = []
    for index in range(1, len(ordered)):
        bar_number = index + 1
        if bar_number == 34:
            continue
        direct.append({"bar": bar_number, "timeMs": ordered[index]["startMs"],
                       "node": ordered[index]["node"]})
    return direct


def end_cut_evidence(samples):
    last32 = list(samples[-32:])
    return {
        "totalSamples": len(samples),
        "lastEight": last32[-8:],
        "maxAbsLast32": max(abs(v) for v in last32),
        "endsAtZero": all(v == 0 for v in samples[-32:]),
        "lastSecondRms": str(round(rms(prefix_squares(samples), len(samples) - SR, len(samples)), 6)),
    }


def build_predeclaration(opening, scc, baseline, direct, end_cut):
    return {
        "schemaVersion": "governed-loop.mvp6_3-predeclared-fade.v1",
        "directive": "MVP6.3-DIR-1",
        "revision": 1,
        "pieceId": "piece_a_far_shore_faded",
        "controlPieceId": "piece_a_far_shore_legato",
        "opening": opening,
        "strongCore": scc,
        "control": {"traceSha256": EXPECTED_TRACE, "wavSha256": EXPECTED_WAV,
                    "midiSha256": EXPECTED_MIDI, "itinerarySha256": EXPECTED_ITINERARY},
        "endCutEvidence": end_cut,
        "fadeRule": {
            "name": "master_raised_cosine_fade_out",
            "fadeSamples": FADE_SAMPLES,
            "fadeMilliseconds": "50",
            "window": "0.5 * (1 + cos(pi * i / (N - 1))) for i in 0..N-1",
            "lastSampleTarget": 0,
            "scope": "final mix only; trace, MIDI, duration, and sample count frozen",
        },
        "seamBaseline": {"method": "min 10 ms RMS in +/-150 ms vs local mean of 1 s before/after",
                         "directBoundaries": len(direct),
                         "medianDepthDb": str(baseline["medianDepthDb"]),
                         "maxDepthDb": str(baseline["maxDepthDb"])},
        "stemPrediction": {
            "padOnlyEndsAtZero": True,
            "padMaxAbsLast32Max": 10,
            "leadOnlyEndsNonzero": True,
            "leadMinAbsLast32": 100,
            "sumToleranceLsb": 2,
        },
        "expected": {
            "bars": 55, "microSteps": 408, "durationMs": 122700, "samples": 5411070,
            "directBoundaries": len(direct),
            "medianDipMaxDb": "6.0", "maxDipMaxDb": "12.0",
            "endOfFileMaxAbs": 10,
            "controlEndOfFileMaxAbs": str(end_cut["maxAbsLast32"]),
            "fadeSamples": FADE_SAMPLES,
            "midiSha256": EXPECTED_MIDI,
            "controlWavSha256": EXPECTED_WAV,
            "restRmsRatioMax": "0.25", "restTailRatioMax": "0.05",
            "fftCorrelationMin": "0.95", "fftMedianRelErrMax": "0.05",
        },
        "fences": {
            "guardFlags": GUARD,
            "noGateByteChange": True, "noSubstrateByteChange": True,
            "noQEngineByteChange": True, "pinnedRendererUntouched": True,
            "legatoRendererUntouched": True, "noOrrerySourceChange": True,
            "controlsFrozen": True,
        },
        "status": "locked-before-render",
    }


def main():
    TASK0.mkdir(parents=True, exist_ok=True)
    opening = verify_opening()
    pins = verify_pins()
    anchors = verify_anchors()
    scc = audit_strong_core()
    direct = trace_boundaries()

    control_samples = load_samples(REPO / "tools/governed-loop/mvp6_2/task-d/renders/piece_a_far_shore_legato.wav")
    baseline = seam_measurements(control_samples, [row["timeMs"] for row in direct])
    end_cut = end_cut_evidence(control_samples)
    print(f"baseline: {baseline['boundaries']} boundaries, median {baseline['medianDepthDb']} dB, "
          f"max {baseline['maxDepthDb']} dB")
    print(f"end cut: max|last32|={end_cut['maxAbsLast32']}, endsAtZero={end_cut['endsAtZero']}")
    if end_cut["maxAbsLast32"] < 100:
        stop("S-1", f"L25 end cut not reproduced: {end_cut['maxAbsLast32']}")

    predeclaration = build_predeclaration(opening, scc, baseline, direct, end_cut)
    floats = find_floats(predeclaration)
    if floats:
        stop("S-5", f"floats in predeclaration {floats[:5]}")
    PREDECL.write_text(json.dumps(predeclaration, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    receipt = {
        "schemaVersion": "governed-loop.mvp6_3-task-0.v1",
        "directive": "MVP6.3-DIR-1",
        "task": "MVP6_3-T0",
        "status": "COMPLETE",
        "opening": opening,
        "pinsVerified": len(pins),
        "anchorsVerified": len(anchors),
        "strongCore": scc,
        "seamBaseline": {k: v for k, v in baseline.items() if k != "rows"},
        "endCutEvidence": end_cut,
        "predeclaration": {"path": str(PREDECL), "sha256": sha256_file(PREDECL),
                           "bytes": PREDECL.stat().st_size},
        "guardFlags": GUARD,
        "llmCalls": 0,
        "floatValues": 0,
        "stopRules": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE", "head": opening["baseHead"],
        "pins": f"{len(pins)}/{len(pins)}", "anchors": f"{len(anchors)}/{len(anchors)}",
        "strongCore": scc["strongCoreNodes"],
        "seamMedianDb": baseline["medianDepthDb"], "seamMaxDb": baseline["maxDepthDb"],
        "endCutMaxAbs": end_cut["maxAbsLast32"],
        "predeclarationSha256": receipt["predeclaration"]["sha256"],
    }, indent=2))


if __name__ == "__main__":
    main()
