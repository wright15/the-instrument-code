#!/usr/bin/env python3
"""MVP7-INTENTION-DIR-1 Task C: intention translator, fail-closed compiler, and
the free-proposal vs verified-menu negotiation arms.

The LLM never emits notes, pitch classes as sound events, or executable node
transitions. It emits a constrained intention object (C1) or selects indices
from a compiler-verified menu (C2). The compiler is the only path to a route.

Read-only against the repository; writes only under the MVP-7 scratch realm.
"""
import hashlib
import importlib.util
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp7_intention")
TASK_C = SCRATCH / "task-c"
TRANSCRIPTS = TASK_C / "transcripts"
TRACES = TASK_C / "traces"
LLM_WORK = TASK_C / "llm_work"
PREDECL = SCRATCH / "task-0" / "mvp7_predeclared_bets_and_schema.json"
RECEIPT = TASK_C / "mvp7_task_c_receipt.json"

GUARD = {
    "causationClaim": False, "physicalQuantityClaim": False,
    "tierClassifier": False, "globalCHNull": True,
    "gov517_correspondence_claimed": False, "still_set_label": "still_set",
    "layer": "SPEC-001 \u00a71.3 overlay dynamics",
}
BAND = {"Saturn": -12, "Moon": 0, "Mercury": 0, "Jupiter": 0,
        "Sun": 12, "Mars": 12, "Venus": 12}
ALLOWED_ROLES = {"dwell", "transit", "mirror_gesture", "shore_rest", "cadential_arrival"}
FORBIDDEN_KEYS = {"notes", "midi", "midiNotes", "velocity", "noteEvents", "transitions"}
CADENCE_PCS = {
    "andalusian": [
        {"id": "i", "requiredPcs": [0, 3, 7], "band": None, "role": "dwell"},
        {"id": "VII", "requiredPcs": [10, 2, 5], "band": None, "role": "transit"},
        {"id": "VI", "requiredPcs": [8, 0, 3], "band": None, "role": "transit"},
        {"id": "V", "requiredPcs": [7, 8, 11], "band": 12, "role": "dwell"},
        {"id": "i_resolution", "requiredPcs": [0, 3, 7], "band": None, "role": "cadential_arrival"},
    ],
    "borrowed_minor": [
        {"id": "I6", "requiredPcs": [0, 4, 7, 9], "band": None, "role": "dwell"},
        {"id": "iv", "requiredPcs": [0, 5, 8], "band": None, "role": "dwell"},
        {"id": "I", "requiredPcs": [0, 4, 7], "band": None, "role": "cadential_arrival"},
    ],
}
OPEN_ARC_ROLES = [
    {"id": "home_mirror", "role": "dwell"},
    {"id": "departure", "role": "transit"},
    {"id": "first_dwell", "role": "dwell"},
    {"id": "climax", "role": "dwell"},
    {"id": "shore", "role": "shore_rest"},
    {"id": "return", "role": "transit"},
    {"id": "homecoming", "role": "cadential_arrival"},
]


def stop(rule, detail):
    print(f"STOP: {rule} {detail}")
    sys.exit(2)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def find_floats(value, path="$"):
    found = []
    if isinstance(value, float):
        found.append(path)
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def jaccard_distance(left, right):
    left, right = set(left), set(right)
    if not left and not right:
        return 0.0
    return 1.0 - len(left & right) / len(left | right)


def context():
    tb = load_module("mvp7_tb", SCRATCH / "task-b/mvp7_task_b.py")
    form_engine_module, engine, planner, seed, governed = tb.build_context()
    catalog = json.loads((REPO / "docs/analysis/orbit_spectral_catalog.json").read_text(encoding="utf-8"))
    orbit_class = {row["orbitId"]: row["dispersionClass"] for row in catalog["orbits"]}
    core = set(governed)
    form_spec = json.loads((REPO / "tools/governed-loop/mvp6/task-0/mvp6_form_spec.json").read_text(encoding="utf-8"))
    return {
        "tb": tb, "form_engine_module": form_engine_module, "engine": engine,
        "planner": planner, "seed": seed, "governed": governed, "core": core,
        "orbit_class": orbit_class, "form_spec": form_spec,
    }


def node_info(ctx, node):
    planner = ctx["planner"]
    mask, phase = int(node.split("@")[0]), int(node.split("@")[1])
    orbit = planner.orbit_of.get(mask)
    office = planner.office.get(mask)
    return {
        "node": node, "mask": mask, "phase": phase,
        "orbit": orbit, "dispersionClass": ctx["orbit_class"].get(orbit),
        "office": office, "registerBand": BAND.get(office, 0),
        "pitchClasses": planner.pitch_classes(mask, phase),
        "role": planner.role.get(mask),
    }


def constraint_tokens(section):
    return {
        "pcs": set(int(pc) for pc in section.get("requiredPitchClasses", [])),
        "phaseZone": tuple(section.get("phaseZone", [0, 11])),
        "band": section.get("registerBand"),
        "orbitFilter": set(section.get("targetOrbitFilter") or []),
        "dispersion": section.get("targetDispersionClass"),
    }


def matches(ctx, node, section, core_only):
    info = node_info(ctx, node)
    tokens = constraint_tokens(section)
    if core_only and node not in ctx["core"]:
        return False
    if info["role"] == "boundary" and core_only:
        return False
    if info["dispersionClass"] is None:
        return False
    if tokens["dispersion"] not in (None, "", "ANY", info["dispersionClass"]):
        return False
    if tokens["orbitFilter"] and info["orbit"] not in tokens["orbitFilter"]:
        return False
    low, high = tokens["phaseZone"]
    if not (0 <= low <= info["phase"] <= high <= 11):
        return False
    if tokens["band"] is not None and info["registerBand"] != int(tokens["band"]):
        return False
    if not tokens["pcs"] <= set(info["pitchClasses"]):
        return False
    return True


def candidates(ctx, section, core_only):
    nodes = ctx["governed"] if core_only else ctx["planner"].nodes
    rows = []
    for node in nodes:
        if matches(ctx, node, section, core_only):
            rows.append(node_info(ctx, node))
    rows.sort(key=lambda row: (row["phase"] not in (0, 11), row["mask"], row["phase"]))
    return rows


def resolve_sections(ctx, sections, mode, resolved_nodes=None):
    planner = ctx["planner"]
    chosen = []
    errors = []
    for index, section in enumerate(sections):
        if resolved_nodes is not None:
            node = resolved_nodes[index]
            if node not in ctx["planner"].node_set:
                errors.append({"section": section.get("section", index + 1),
                               "code": "OUTSIDE_STRONG_CORE", "node": node})
                continue
            if node not in ctx["core"]:
                info = node_info(ctx, node)
                code = "ISOLATED_BOUNDARY" if info["role"] == "boundary" else "OUTSIDE_STRONG_CORE"
                errors.append({"section": section.get("section", index + 1),
                               "code": code, "node": node})
                continue
            info = node_info(ctx, node)
            if info["role"] == "boundary":
                errors.append({"section": section.get("section", index + 1),
                               "code": "ISOLATED_BOUNDARY", "node": node})
                continue
            chosen.append(info)
            continue
        core_rows = candidates(ctx, section, core_only=True)
        if core_rows:
            chosen.append(core_rows[0])
            continue
        all_rows = candidates(ctx, section, core_only=False)
        if not all_rows:
            code = "EMPTY_CANDIDATE_INTERSECTION"
        elif all(row["role"] == "boundary" for row in all_rows):
            code = "ISOLATED_BOUNDARY"
        else:
            code = "OUTSIDE_STRONG_CORE"
        errors.append({"section": section.get("section", index + 1), "code": code})
    if errors:
        return None, {"code": errors[0]["code"], "errors": errors}
    return chosen, None


def build_bars(ctx, sections, chosen):
    bars = []
    legs = []
    current = ctx["seed"]
    for index, (section, info) in enumerate(zip(sections, chosen)):
        path = ctx["tb"].shortest_path(ctx["planner"], ctx["core"], current, info["node"])
        if path is None:
            return None, {"code": "DISCONNECTED_TRANSITION",
                          "from": current, "to": info["node"]}
        role = section.get("role", "dwell")
        k_steps = int(section.get("kSteps", 12 if role != "transit" else 5))
        dwell_bars = int(section.get("dwellBars", 2 if role != "transit" else 1))
        if k_steps not in (5, 12):
            return None, {"code": "SCHEMA_OR_FENCE_VIOLATION",
                          "detail": f"kSteps {k_steps}"}
        if role == "transit":
            k_steps, dwell_bars = 5, 1
        for node in path[1:-1]:
            bars.append({"node": node, "k": 5, "section": index + 1,
                         "sectionKey": section.get("name", f"section_{index + 1}"),
                         "role": "transit"})
        for _ in range(max(1, dwell_bars)):
            bars.append({"node": info["node"], "k": k_steps, "section": index + 1,
                         "sectionKey": section.get("name", f"section_{index + 1}"),
                         "role": role})
        legs.append({"section": index + 1, "target": info, "path": path,
                     "hops": len(path) - 1, "kSteps": k_steps,
                     "dwellBars": max(1, dwell_bars)})
        current = info["node"]
    if len(bars) > 80:
        return None, {"code": "SCHEMA_OR_FENCE_VIOLATION", "detail": f"bars {len(bars)}"}
    return {"bars": bars, "legs": legs}, None


def compile_intention(ctx, intent, mode, resolved_nodes=None):
    validation = validate_intention(intent)
    if not validation["ok"]:
        return None, {"code": "SCHEMA_OR_FENCE_VIOLATION", "errors": validation["errors"]}
    sections = validated_sections(intent, mode)
    chosen, error = resolve_sections(ctx, sections, mode, resolved_nodes)
    if error:
        return None, error
    built, error = build_bars(ctx, sections, chosen)
    if error:
        return None, error
    events = ctx["tb"].macro_events_for(ctx["planner"], built["bars"])
    if any(event["gateVerdict"] != "ACCEPT" for event in events):
        return None, {"code": "SCHEMA_OR_FENCE_VIOLATION", "detail": "gate reject"}
    trace = ctx["form_engine_module"].FormEngine.build_trace(
        ctx["engine"], f"mvp7_{mode}", built["bars"], [],
        f"MVP7 intention {mode}", events)
    summary = trace["summary"]
    if summary["outOfMaskPitches"] != 0 or summary["boundaryDwell"] != 0:
        return None, {"code": "SCHEMA_OR_FENCE_VIOLATION",
                      "detail": f"outOfMask {summary['outOfMaskPitches']} boundaryDwell {summary['boundaryDwell']}"}
    return {
        "intent": intent,
        "sections": sections,
        "chosen": chosen,
        "bars": built["bars"],
        "legs": built["legs"],
        "events": events,
        "trace": trace,
    }, None


def validate_intention(intent):
    errors = []
    if not isinstance(intent, dict):
        return {"ok": False, "errors": ["root is not an object"]}
    for key in ("pieceId", "destinationPhilosophy", "seedNode", "sectionIntentions"):
        if key not in intent:
            errors.append(f"missing {key}")
    if intent.get("seedNode") not in (None, "1387@0"):
        errors.append("seedNode must be 1387@0")
    if intent.get("destinationPhilosophy") not in (
            None, "far_shore_return", "interior_circuit", "modal_pivot_return"):
        errors.append("bad destinationPhilosophy")
    sections = intent.get("sectionIntentions")
    if not isinstance(sections, list) or not (3 <= len(sections) <= 9):
        errors.append("sectionIntentions must be a list of 3..9 sections")
        sections = []
    for index, section in enumerate(sections):
        if not isinstance(section, dict):
            errors.append(f"section {index} not an object")
            continue
        if section.get("role") not in ALLOWED_ROLES:
            errors.append(f"section {index} bad role")
        if not isinstance(section.get("name"), str) or not section.get("name"):
            errors.append(f"section {index} bad name")
        if section.get("targetDispersionClass") not in (
                None, "ANCHOR_FLAT", "MODERATE_BEND", "DEEP_DISPERSION", "EXTREME_RAMP"):
            errors.append(f"section {index} bad dispersion class")
        phase_zone = section.get("phaseZone")
        if (not isinstance(phase_zone, list) or len(phase_zone) != 2
                or not all(isinstance(v, int) and 0 <= v <= 11 for v in phase_zone)
                or phase_zone[0] > phase_zone[1]):
            errors.append(f"section {index} bad phaseZone")
        band = section.get("registerBand")
        if band is not None and band not in (-12, 0, 12):
            errors.append(f"section {index} bad registerBand")
        pcs = section.get("requiredPitchClasses", [])
        if not isinstance(pcs, list) or any(not isinstance(v, int) or not 0 <= v <= 11 for v in pcs):
            errors.append(f"section {index} bad requiredPitchClasses")
        if not isinstance(section.get("dwellBars", 1), int):
            errors.append(f"section {index} bad dwellBars")
        if section.get("kSteps") not in (None, 5, 12):
            errors.append(f"section {index} bad kSteps")
        filters = section.get("targetOrbitFilter") or []
        if not isinstance(filters, list):
            errors.append(f"section {index} bad targetOrbitFilter")
        for key in FORBIDDEN_KEYS:
            if key in section:
                errors.append(f"section {index} forbidden key {key}")
    if find_floats(intent):
        errors.append(f"float values present: {find_floats(intent)[:3]}")
    return {"ok": not errors, "errors": errors}


def validated_sections(intent, mode):
    rows = []
    for index, section in enumerate(intent["sectionIntentions"]):
        row = dict(section)
        row.setdefault("name", f"section_{index + 1}")
        row["section"] = index + 1
        row.setdefault("role", "dwell")
        row.setdefault("kSteps", 5 if row["role"] == "transit" else 12)
        row.setdefault("dwellBars", 1 if row["role"] == "transit" else 2)
        rows.append(row)
    return rows


# --------------------------------------------------------------------------
# LLM transport


def call_llm(prompt, label, model, timeout):
    started = time.time()
    try:
        proc = subprocess.run(
            ["opencode", "run", "--model", model, "--format", "json",
             "--pure", "--dir", str(LLM_WORK), prompt],
            capture_output=True, text=True, timeout=timeout)
        stdout, stderr, returncode = proc.stdout, proc.stderr, proc.returncode
    except subprocess.TimeoutExpired as exc:
        stdout = exc.stdout or ""
        stderr = (exc.stderr or "") + f"\nTIMEOUT after {timeout}s"
        returncode = -1
    elapsed = round(time.time() - started, 3)
    texts = []
    tokens = {"total": 0, "input": 0, "output": 0, "reasoning": 0,
              "cache_read": 0, "cache_write": 0}
    cost = 0.0
    for line in stdout.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if event.get("type") == "text":
            texts.append(event["part"].get("text", ""))
        elif event.get("type") == "step_finish":
            part = event.get("part", {})
            data = part.get("tokens", {})
            for key in ("total", "input", "output", "reasoning"):
                tokens[key] += data.get(key, 0)
            cache = data.get("cache", {})
            tokens["cache_read"] += cache.get("read", 0)
            tokens["cache_write"] += cache.get("write", 0)
            cost += part.get("cost", 0.0) or 0.0
    text = texts[-1] if texts else ""
    parsed = extract_json(text)
    transcript = {
        "label": label, "prompt": prompt, "model": model,
        "exitCode": returncode, "stderr": stderr[-4000:],
        "stdoutLines": len(stdout.splitlines()),
        "text": text, "parsed": parsed, "elapsedSeconds": elapsed,
        "tokens": tokens, "cost": cost,
    }
    TRANSCRIPTS.mkdir(parents=True, exist_ok=True)
    path = TRANSCRIPTS / f"{label}.json"
    path.write_text(json.dumps(transcript, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    transcript["path"] = f"task-c/transcripts/{label}.json"
    return parsed, transcript


def extract_json(text):
    decoder = json.JSONDecoder()
    candidates = []
    for index, char in enumerate(text or ""):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            candidates.append(value)
    if not candidates:
        return None
    for key in ("sectionIntentions", "sectionChoices"):
        for candidate in candidates:
            if key in candidate:
                return candidate
    return max(candidates, key=lambda candidate: len(json.dumps(candidate)))


# --------------------------------------------------------------------------
# Prompting


def catalog_brief(orbit_class):
    lines = ["ORBIT SPECTRAL CATALOG v1 (L22), read-only facts:"]
    classes = {}
    for orbit, klass in sorted(orbit_class.items()):
        classes.setdefault(klass, []).append(orbit)
    for klass, orbits in classes.items():
        lines.append(f"- {klass}: {', '.join(orbits)}")
    lines.extend([
        "- 12 phases per orbit; the strong core S000 has 2928 nodes; seed 1387@0.",
        "- Register bands: Saturn -12; Moon/Mercury/Jupiter 0; Sun/Mars/Venus +12.",
        "- ANCHOR_FLAT is not a linear ramp: interior phases hover near the phase average and only p0/p11 are achromatic bookends.",
        "- Bet B2 is the wrap step law; the log/geometric dual is a definitional implementation check.",
        "- ORBIT-D7 is a symbolic container coordinate; register is set by office bands and the lead line.",
        "- Fences: no entropy, no C_H formulation, no perception or biology claims.",
        "Five Laws: (1) planner composes, card steers, LLM waits; (2) form space is the strong core;",
        "(3) if it is not in the lead line it is not heard; (4) phase is terrain, not a dial;",
        "(5) arrival must be voiced.",
    ])
    return "\n".join(lines)


def schema_brief():
    return (
        "Return exactly one JSON object with this shape:\n"
        '{"pieceId":"string","destinationPhilosophy":"far_shore_return|interior_circuit|modal_pivot_return",'
        '"seedNode":"1387@0","sectionIntentions":[{"section":1,"name":"string",'
        '"role":"dwell|transit|mirror_gesture|shore_rest|cadential_arrival",'
        '"targetDispersionClass":"ANCHOR_FLAT|MODERATE_BEND|DEEP_DISPERSION|EXTREME_RAMP",'
        '"targetOrbitFilter":["ORBIT-A0"],"phaseZone":[0,11],'
        '"registerBand":-12,"requiredPitchClasses":[0,3,7],"dwellBars":2,"kSteps":12}]}\n'
        "Rules: 3 to 9 sections; phaseZone is [low,high] with 0<=low<=high<=11; "
        "registerBand is -12, 0, or 12; kSteps is 5 or 12; dwellBars is 1..4; "
        "requiredPitchClasses are integers 0..11. Do not emit floats, notes, MIDI, "
        "velocities, or executable node transitions. Return JSON only."
    )


def c1_prompt(prompt_name, prompt_text, orbit_class):
    return "\n\n".join([
        "You are a macro-form intention translator for a governed composition engine.",
        catalog_brief(orbit_class),
        schema_brief(),
        f"Task: {prompt_text}",
        "Reply with JSON only. Do not use tools.",
    ])


def menu_for(ctx, prompt_name):
    planner = ctx["planner"]
    if prompt_name == "andalusian":
        template = CADENCE_PCS["andalusian"]
    elif prompt_name == "borrowed_minor":
        template = CADENCE_PCS["borrowed_minor"]
    else:
        template = OPEN_ARC_ROLES
    menu = []
    for index, section in enumerate(template):
        entries = []
        seen = set()
        required = section.get("requiredPcs")
        if required:
            rows = ctx["tb"].find_candidates(
                planner, ctx["governed"], required, section.get("band"),
                tuple(section.get("excludePcs", ())))
        else:
            rows = []
        for row in rows[:8]:
            if row["node"] in seen:
                continue
            seen.add(row["node"])
            entries.append(row)
        # fill with diverse governed nodes
        diverse = []
        buckets = set()
        for node in ctx["governed"]:
            info = node_info(ctx, node)
            key = (info["dispersionClass"], info["registerBand"], info["phase"])
            if key in buckets:
                continue
            buckets.add(key)
            diverse.append(info)
            if len(entries) + len(diverse) >= 12:
                break
        for info in diverse:
            if info["node"] in seen:
                continue
            seen.add(info["node"])
            entries.append(info)
        entries = entries[:12]
        role = section["role"]
        k_steps = 5 if role == "transit" else 12
        dwell_bars = 1 if role == "transit" else 2
        menu.append({
            "section": index + 1,
            "name": section["id"],
            "role": role,
            "defaultKSteps": k_steps,
            "defaultDwellBars": dwell_bars,
            "options": [{
                "index": option_index,
                "node": row["node"],
                "orbit": row.get("orbit"),
                "dispersionClass": row.get("dispersionClass") or ctx["orbit_class"].get(row.get("orbit")),
                "phase": row["node"].split("@")[1],
                "registerBand": row.get("registerBand", BAND.get(row.get("office"), 0)),
                "pitchClasses": row.get("pitchClasses"),
                "kSteps": k_steps,
                "dwellBars": dwell_bars,
            } for option_index, row in enumerate(entries)],
        })
    return menu


def c2_prompt(prompt_name, prompt_text, menu):
    return "\n\n".join([
        "You are selecting from a compiler-verified feasibility menu for a governed composition engine.",
        "Every option below is a legal strong-core node. Pick exactly one option index per section.",
        "Return exactly one JSON object: {\"pieceId\":\"string\",\"sectionChoices\":[0,3,...]}.",
        "Do not emit floats, notes, MIDI, velocities, or node ids. Reply with JSON only. Do not use tools.",
        f"Task: {prompt_text}",
        "Menu JSON:\n" + json.dumps(menu, sort_keys=True),
    ])


# --------------------------------------------------------------------------
# Divergence and audits


def default_signature(ctx):
    spec = ctx["form_spec"]
    dwell_nodes = []
    dwell_phases = set()
    for section in spec["sections"]:
        for step in section["steps"]:
            if step.get("role") == "dwell":
                node = step.get("node")
                if node:
                    dwell_nodes.append(node)
                    dwell_phases.add(int(node.split("@")[1]))
    orbits = {ctx["planner"].orbit_of.get(int(node.split("@")[0])) for node in dwell_nodes}
    classes = {ctx["orbit_class"].get(orbit) for orbit in orbits if orbit}
    return {
        "destinationPhilosophy": spec["destinationPhilosophy"],
        "sectionCount": len(spec["sections"]),
        "dwellPhases": sorted(dwell_phases),
        "orbits": sorted(orbit for orbit in orbits if orbit),
        "dispersionClasses": sorted(klass for klass in classes if klass),
        "requiredPitchClasses": [],
    }


def plan_signature(ctx, compiled):
    chosen = compiled["chosen"]
    dwell = [row for row in chosen if row["role"] != "transit"]
    phases = {row["phase"] for row in dwell}
    orbits = {row["orbit"] for row in dwell if row["orbit"]}
    classes = {ctx["orbit_class"].get(row["orbit"]) for row in dwell if row["orbit"]}
    pcs = set()
    for section in compiled["sections"]:
        pcs.update(section.get("requiredPitchClasses", []))
    return {
        "destinationPhilosophy": compiled["intent"].get("destinationPhilosophy"),
        "sectionCount": len(compiled["sections"]),
        "dwellPhases": sorted(phases),
        "orbits": sorted(orbits),
        "dispersionClasses": sorted(klass for klass in classes if klass),
        "requiredPitchClasses": sorted(pcs),
    }


def divergence(ctx, compiled):
    default = default_signature(ctx)
    plan = plan_signature(ctx, compiled)
    d1 = 1.0 if plan["destinationPhilosophy"] != default["destinationPhilosophy"] else 0.0
    d2 = abs(plan["sectionCount"] - default["sectionCount"]) / default["sectionCount"]
    d3 = jaccard_distance(plan["dwellPhases"], default["dwellPhases"])
    d4 = jaccard_distance(plan["orbits"], default["orbits"])
    d5 = 1.0 if plan["requiredPitchClasses"] else 0.0
    d6 = jaccard_distance(plan["dispersionClasses"], default["dispersionClasses"])
    return {
        "default": default, "plan": plan,
        "dimensions": {
            "destination": d1, "sectionCount": d2, "dwellPhases": d3,
            "orbits": d4, "pitchClassConstraints": d5, "dispersionClasses": d6,
        },
        "score": (d1 + d2 + d3 + d4 + d5 + d6) / 6.0,
    }


BAD_PHRASES = [
    ("FM4", r"\blinear(?:ly)?\b.{0,80}\bANCHOR_FLAT\b|\bANCHOR_FLAT\b.{0,80}\blinear"),
    ("FM4", r"proves?\s+B2|B2\s+proof|proof\s+of\s+B2"),
    ("FM4", r"forces?\s+(?:the\s+)?(?:music|register|piece)\s+(?:up|down)|drives?\s+across\s+octaves"),
    ("FM4", r"\bentropy\b|\bC_H\b|information[- ]theoretic invariant"),
    ("FM4", r"cochlea|auditory cortex|perception model|strictly logarithmic hearing"),
]


def audit_text(text):
    hits = []
    for tag, pattern in BAD_PHRASES:
        for match in re.finditer(pattern, text or "", re.IGNORECASE):
            hits.append({"tag": tag, "match": match.group(0)[:120]})
    return hits


# --------------------------------------------------------------------------
# Main


def main():
    TASK_C.mkdir(parents=True, exist_ok=True)
    TRANSCRIPTS.mkdir(parents=True, exist_ok=True)
    TRACES.mkdir(parents=True, exist_ok=True)
    LLM_WORK.mkdir(parents=True, exist_ok=True)
    predecl = json.loads(PREDECL.read_text(encoding="utf-8"))
    if predecl.get("status") != "locked-before-evaluation":
        stop("S-10", "predeclaration not locked")
    llm = predecl["llm"]
    model = llm["model"]
    trials = int(llm["trialCount"])
    max_retries = int(llm["maxRetries"])
    timeout = int(llm["timeoutSeconds"])

    ctx = context()
    prompts = llm["prompts"]
    runs = []
    totals = {"calls": 0, "input": 0, "output": 0, "total": 0,
              "cost": 0.0, "latencySeconds": 0.0}

    for prompt_name in ("open_arc", "andalusian", "borrowed_minor"):
        prompt_text = prompts[prompt_name]
        menu = menu_for(ctx, prompt_name)
        for arm in ("C1", "C2"):
            for trial in range(1, trials + 1):
                label = f"{prompt_name}_{arm}_t{trial}"
                attempt_rows = []
                compiled = None
                first_pass = None
                error = None
                for attempt in range(1, max_retries + 1):
                    if arm == "C1":
                        if attempt == 1:
                            text_prompt = c1_prompt(prompt_name, prompt_text, ctx["orbit_class"])
                        else:
                            text_prompt = "\n\n".join([
                                c1_prompt(prompt_name, prompt_text, ctx["orbit_class"]),
                                f"Your previous answer failed with {json.dumps(error, sort_keys=True)}.",
                                "Correct it and return JSON only.",
                            ])
                        parsed, transcript = call_llm(
                            text_prompt, f"{label}_a{attempt}", model, timeout)
                        totals["calls"] += 1
                        totals["latencySeconds"] += transcript["elapsedSeconds"]
                        for key in ("input", "output", "total"):
                            totals[key] += transcript["tokens"][key]
                        totals["cost"] += transcript["cost"]
                        if parsed is None:
                            error = {"code": "SCHEMA_OR_FENCE_VIOLATION",
                                     "errors": ["no JSON object"]}
                            attempt_rows.append({"attempt": attempt, "error": error,
                                                 "transcript": transcript["path"]})
                            continue
                        compiled, error = compile_intention(ctx, parsed, "c1_free")
                    else:
                        text_prompt = c2_prompt(prompt_name, prompt_text, menu)
                        parsed, transcript = call_llm(
                            text_prompt, f"{label}_a{attempt}", model, timeout)
                        totals["calls"] += 1
                        totals["latencySeconds"] += transcript["elapsedSeconds"]
                        for key in ("input", "output", "total"):
                            totals[key] += transcript["tokens"][key]
                        totals["cost"] += transcript["cost"]
                        if (not isinstance(parsed, dict)
                                or not isinstance(parsed.get("sectionChoices"), list)
                                or len(parsed["sectionChoices"]) != len(menu)):
                            error = {"code": "SCHEMA_OR_FENCE_VIOLATION",
                                     "errors": ["bad sectionChoices"]}
                            attempt_rows.append({"attempt": attempt, "error": error,
                                                 "transcript": transcript["path"]})
                            continue
                        resolved = []
                        valid = True
                        for section_index, choice in enumerate(parsed["sectionChoices"]):
                            options = menu[section_index]["options"]
                            if not isinstance(choice, int) or not 0 <= choice < len(options):
                                valid = False
                                break
                            resolved.append(options[choice]["node"])
                        if not valid:
                            error = {"code": "SCHEMA_OR_FENCE_VIOLATION",
                                     "errors": ["choice index out of range"]}
                            attempt_rows.append({"attempt": attempt, "error": error,
                                                 "transcript": transcript["path"]})
                            continue
                        intent = {
                            "pieceId": parsed.get("pieceId", f"mvp7_{prompt_name}_{arm}"),
                            "destinationPhilosophy": "interior_circuit",
                            "seedNode": "1387@0",
                            "sectionIntentions": [{
                                "section": index + 1,
                                "name": row["name"],
                                "role": row["role"],
                                "targetDispersionClass": None,
                                "targetOrbitFilter": [],
                                "phaseZone": [0, 11],
                                "registerBand": None,
                                "requiredPitchClasses": [],
                                "dwellBars": row["defaultDwellBars"],
                                "kSteps": row["defaultKSteps"],
                            } for index, row in enumerate(menu)],
                        }
                        compiled, error = compile_intention(
                            ctx, intent, "c2_menu", resolved_nodes=resolved)
                    if first_pass is None:
                        first_pass = compiled is not None
                    attempt_rows.append({
                        "attempt": attempt,
                        "ok": compiled is not None,
                        "error": error,
                        "transcript": transcript["path"],
                        "tokens": transcript["tokens"],
                        "cost": transcript["cost"],
                        "elapsedSeconds": transcript["elapsedSeconds"],
                        "parsed": parsed,
                    })
                    if compiled is not None:
                        break
                row = {
                    "label": label, "prompt": prompt_name, "arm": arm,
                    "trial": trial, "attempts": attempt_rows,
                    "firstPass": first_pass,
                    "compiled": compiled is not None,
                    "finalError": error if compiled is None else None,
                }
                if compiled is not None:
                    trace = compiled["trace"]
                    trace_path = TRACES / f"{label}.jsonl"
                    trace_hash = ctx["form_engine_module"].FormEngine.write_trace(
                        ctx["engine"], trace_path, trace)
                    trace_json_path = TASK_C / f"{label}_trace.json"
                    trace_json_path.write_text(
                        json.dumps(trace, indent=2, sort_keys=True) + "\n",
                        encoding="utf-8")
                    plan_path = TASK_C / f"{label}_plan.json"
                    plan_path.write_text(json.dumps({
                        "label": label, "intent": compiled["intent"],
                        "chosen": compiled["chosen"], "legs": compiled["legs"],
                        "events": compiled["events"],
                        "tracePath": f"task-c/traces/{label}.jsonl",
                        "traceSha256": trace_hash,
                        "summary": trace["summary"],
                        "divergence": divergence(ctx, compiled),
                        "textAudit": {
                            attempt["attempt"]: audit_text(
                                json.loads(Path(SCRATCH / attempt["transcript"]).read_text(
                                    encoding="utf-8"))["text"])
                            for attempt in attempt_rows
                        },
                    }, indent=2, sort_keys=True) + "\n", encoding="utf-8")
                    row["tracePath"] = f"task-c/traces/{label}.jsonl"
                    row["traceSha256"] = trace_hash
                    row["planPath"] = f"task-c/{label}_plan.json"
                    row["divergence"] = divergence(ctx, compiled)
                    row["summary"] = trace["summary"]
                runs.append(row)

    # ---- legality and takeaway tables ----
    legality = []
    for row in runs:
        legality.append({
            "label": row["label"], "arm": row["arm"], "prompt": row["prompt"],
            "firstPass": row["firstPass"], "compiled": row["compiled"],
            "attempts": len(row["attempts"]),
            "finalError": row["finalError"],
        })
    first_pass_rate = {arm: (sum(1 for row in legality if row["arm"] == arm and row["firstPass"])
                             / max(1, sum(1 for row in legality if row["arm"] == arm)))
                       for arm in ("C1", "C2")}
    compile_rate = {arm: (sum(1 for row in legality if row["arm"] == arm and row["compiled"])
                          / max(1, sum(1 for row in legality if row["arm"] == arm)))
                    for arm in ("C1", "C2")}
    retry_recovery = {}
    for arm in ("C1", "C2"):
        failures = [row for row in legality if row["arm"] == arm and not row["firstPass"]]
        recovered = [row for row in failures if row["compiled"]]
        retry_recovery[arm] = len(recovered) / len(failures) if failures else None

    accepted = [row for row in runs if row["compiled"]]
    open_c1 = [row for row in accepted if row["prompt"] == "open_arc" and row["arm"] == "C1"]
    fm1 = bool(open_c1) and all(
        row["divergence"]["plan"]["sectionCount"] == 7 for row in open_c1)
    fm2 = bool(accepted) and all(
        any(section.get("targetDispersionClass") == "EXTREME_RAMP"
            and section.get("phaseZone", [0, 0])[0] <= 8 <= section.get("phaseZone", [0, 0])[1]
            for section in row["divergence"]["plan"].get("sections", []))
        for row in accepted)
    # FM2 must use the compiled sections, not the divergence plan
    fm2 = all(
        any(section.get("targetDispersionClass") == "EXTREME_RAMP"
            for section in json.loads((SCRATCH / row["planPath"]).read_text(
                encoding="utf-8"))["intent"]["sectionIntentions"])
        for row in (row for row in accepted if row["arm"] == "C1")
    ) if any(row["arm"] == "C1" for row in accepted) else None
    fm3 = bool(open_c1) and all(
        row["divergence"]["plan"]["destinationPhilosophy"] == "far_shore_return"
        for row in open_c1)
    fm4_hits = []
    for row in runs:
        for attempt in row["attempts"]:
            if attempt.get("transcript"):
                transcript = json.loads(
                    (SCRATCH / attempt["transcript"]).read_text(encoding="utf-8"))
                for hit in audit_text(transcript.get("text", "")):
                    fm4_hits.append({"label": row["label"], "attempt": attempt["attempt"],
                                     "hit": hit})
    failure_modes = {
        "FM1_GENERIC_ARC_BIAS": fm1,
        "FM2_CLIMAX_BY_DEFAULT": fm2,
        "FM3_HOME_ALWAYS": fm3,
        "FM4_VOCABULARY_DRIFT": len(fm4_hits) > 0,
        "FM4_hits": fm4_hits[:20],
        "note": "FM3 is only tested by the open-arc prompt, which leaves the destination open",
    }

    divergence_rows = [{
        "label": row["label"], "arm": row["arm"], "prompt": row["prompt"],
        "score": row["divergence"]["score"],
        "dimensions": row["divergence"]["dimensions"],
    } for row in accepted]
    divergence_mean = (sum(row["score"] for row in divergence_rows) / len(divergence_rows)
                       if divergence_rows else None)

    def dimension_map(dimension, prompts_filter=None):
        rows = [row for row in accepted
                if prompts_filter is None or row["prompt"] in prompts_filter]
        if not rows:
            return {"classification": "NO_DATA", "divergenceRate": None, "legality": None}
        diverged = sum(1 for row in rows
                       if row["divergence"]["dimensions"].get(dimension, 0) > 0.0)
        rate = diverged / len(rows)
        arm_rows = [row for row in rows if row["arm"] == "C1"]
        legality_rate = (sum(1 for row in arm_rows if row["firstPass"]) / len(arm_rows)
                         if arm_rows else None)
        if rate < 0.10:
            classification = "KEEP_PLANNER_DEFAULT"
        elif legality_rate is not None and legality_rate >= 0.90:
            classification = "DELEGATE_TO_LLM"
        else:
            classification = "REQUIRE_VERIFIED_MENU"
        return {"classification": classification, "divergenceRate": rate,
                "legality": legality_rate, "trials": len(rows)}

    judgment_map = {
        "destinationPhilosophy": dimension_map("destination"),
        "sectionCount": dimension_map("sectionCount"),
        "dwellPlacement": dimension_map("dwellPhases"),
        "orbitSelection": dimension_map("orbits"),
        "pitchClassConstraints": dimension_map("pitchClassConstraints"),
        "registerBands": dimension_map("dispersionClasses"),
    }

    receipt = {
        "schemaVersion": "governed-loop.mvp7-task-c.v1",
        "directive": "MVP7-INTENTION-DIR-1",
        "task": "MVP7-TC",
        "status": "COMPLETE",
        "guardFlags": GUARD,
        "model": model,
        "predeclarationSha256": sha256_file(PREDECL),
        "catalog": catalog_brief(ctx["orbit_class"]),
        "runs": runs,
        "legality": {
            "firstPassRate": first_pass_rate,
            "compileRate": compile_rate,
            "retryRecovery": retry_recovery,
            "rows": legality,
        },
        "divergence": {
            "meanScore": divergence_mean,
            "rows": divergence_rows,
        },
        "failureModes": failure_modes,
        "judgmentMap": judgment_map,
        "cost": totals,
        "earAB": {"status": "PENDING_HUMAN", "q9": None,
                  "note": "blind pairs are prepared from accepted traces; the verdict stays unsigned"},
        "llmCalls": totals["calls"],
        "stopRules": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "COMPLETE",
        "calls": totals["calls"],
        "cost": totals["cost"],
        "firstPassRate": first_pass_rate,
        "compileRate": compile_rate,
        "retryRecovery": retry_recovery,
        "divergenceMean": divergence_mean,
        "failureModes": {k: v for k, v in failure_modes.items() if k != "FM4_hits"},
        "judgmentMap": judgment_map,
        "accepted": len(accepted),
        "labels": [row["label"] for row in accepted],
    }, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
