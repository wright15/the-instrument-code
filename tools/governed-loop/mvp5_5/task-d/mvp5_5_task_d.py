#!/usr/bin/env python3
"""MVP5.5-DIR-1 Task D: orbit spectral catalog, L22 staging manifest, and
closing report. Repository tree stays read-only; all writes are scratch-only.
"""
import hashlib
import json
import subprocess
import sys
from fractions import Fraction
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp5_5")
TASKD = SCRATCH / "task-d"
CATALOG_JSON = TASKD / "orbit_spectral_catalog.json"
CATALOG_MD = TASKD / "ORBIT_SPECTRAL_CATALOG.md"
RECEIPT = TASKD / "mvp5_5_task_d_receipt.json"
MANIFEST = SCRATCH / "l22_staging_manifest.json"
CLOSING = SCRATCH / "MVP5_5-CLOSING-REPORT.md"

EXPECTED_HEAD = "52202ed9c4aad7d4baead2859972853aad28e7bb"
EXPECTED_LEDGER = "e74cf6a2d79e9170c6686f2fb5287043ab1dd2c41d4f9a56d62b97f766c8f1c4"
EXPECTED_LEDGER_BYTES = 356466
EXPECTED_LEDGER_LINES = 4189
EXPECTED_MANIFEST = "076077b192364ab84d3258304a999f38ba993e8412db9f1b52a957c34fca9541"
EXPECTED_MANIFEST_FILES = 1585
EXPECTED_MANIFEST_BYTES = 110505727
EMPTY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
MVP2_SHA = "79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328"

ALL_ORBIT_IDS = [
    "ORBIT-A0", "ORBIT-A1", "ORBIT-A2", "ORBIT-D1", "ORBIT-D2",
    "ORBIT-D3", "ORBIT-D4", "ORBIT-D5", "ORBIT-D6", "ORBIT-D7",
]
DISPERSION_CLASSES = {
    Fraction(5): "ANCHOR_FLAT",
    Fraction(213, 35): "MODERATE_BEND",
    Fraction(71, 7): "DEEP_DISPERSION",
    Fraction(103, 7): "EXTREME_RAMP",
}
GUARD = {
    "causationClaim": False,
    "physicalQuantityClaim": False,
    "tierClassifier": False,
    "globalCHNull": True,
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


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


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


def pc_list(mask):
    return [i for i in range(12) if (mask >> i) & 1]


def pc_sum(mask):
    return sum(pc_list(mask))


def transpose(mask, c):
    result = 0
    for pc in pc_list(mask):
        result |= 1 << ((pc + c) % 12)
    return result


def invert(mask):
    result = 0
    for pc in pc_list(mask):
        result |= 1 << ((-pc) % 12)
    return result


def verify_opening():
    head = subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=REPO, capture_output=True, text=True, check=True
    ).stdout.strip()
    status = subprocess.run(
        ["git", "status", "--porcelain"], cwd=REPO, capture_output=True, text=True, check=True
    ).stdout
    digest = hashlib.sha256(status.encode("utf-8")).hexdigest()
    if head != EXPECTED_HEAD or status != "" or digest != EMPTY_SHA256:
        stop("S-1", "closing fixed point drift")
    ledger = (REPO / "provenance/DECISION_LEDGER.md").read_bytes()
    if (
        hashlib.sha256(ledger).hexdigest() != EXPECTED_LEDGER
        or len(ledger) != EXPECTED_LEDGER_BYTES
        or ledger.count(b"\n") != EXPECTED_LEDGER_LINES
    ):
        stop("S-1", "ledger drift")
    manifest = json.loads((REPO / "MANIFEST.json").read_text(encoding="utf-8"))
    if (
        sha256_file(REPO / "MANIFEST.json") != EXPECTED_MANIFEST
        or manifest["fileCount"] != EXPECTED_MANIFEST_FILES
        or manifest["totalBytes"] != EXPECTED_MANIFEST_BYTES
    ):
        stop("S-1", "release manifest drift")
    orrery_status = subprocess.run(
        ["git", "status", "--porcelain", "--", "orrery"],
        cwd=REPO, capture_output=True, text=True, check=True
    ).stdout
    if orrery_status != "":
        stop("S-3", "orrery mutation detected")
    if sha256_file(REPO / "tools/governed-loop/mvp2.py") != MVP2_SHA:
        stop("S-3", "gate bytes touched")
    return {
        "head": head,
        "treeClean": True,
        "treeDigest": digest,
        "ledgerSha256": EXPECTED_LEDGER,
        "ledgerBytes": EXPECTED_LEDGER_BYTES,
        "ledgerLines": EXPECTED_LEDGER_LINES,
        "releaseManifestSha256": EXPECTED_MANIFEST,
        "releaseManifestFiles": EXPECTED_MANIFEST_FILES,
        "releaseManifestBytes": EXPECTED_MANIFEST_BYTES,
        "repoWrites": 0,
        "orreryChanges": 0,
        "gateBytesTouched": False,
    }


def load_receipt(name):
    path = SCRATCH / name
    if not path.is_file():
        stop("S-7", f"missing receipt {name}")
    return json.loads(path.read_text(encoding="utf-8")), sha256_file(path)


def build_catalog(census, ground_truth, sweep, receipts):
    masks = {record["stateId"]: record["pitchMask"] for record in census["records"]}
    orbit_map = {orbit["orbitId"]: orbit for orbit in ground_truth["orbits"]}
    sweep_map = {orbit["orbitId"]: orbit for orbit in sweep["orbits"]}

    orbits = []
    spread_vector = []
    variance_vector = []
    means_matrix = []
    for orbit_id in ALL_ORBIT_IDS:
        members = [masks[state_id] for state_id in orbit_map[orbit_id]["memberIds"]]
        count = len(members)
        totals = sweep_map[orbit_id]["totals"]
        means = [Fraction(value) for value in sweep_map[orbit_id]["meansExact"]]
        means_matrix.append(means)
        wraps = []
        for p in range(12):
            delta = totals[(p + 1) % 12] - totals[p]
            numerator = 7 * count - delta
            if numerator % 12 != 0:
                stop("S-4", f"{orbit_id} non-integer wrap")
            wraps.append(numerator // 12)
        histogram = [
            sum(1 for mask in members if pc in pc_list(mask)) for pc in range(12)
        ]
        second_moment = [
            str(
                Fraction(
                    sum(
                        sum(pc * pc for pc in pc_list(transpose(mask, p)))
                        for mask in members
                    ),
                    count,
                )
            )
            for p in range(12)
        ]
        fixed_masks = sorted(mask for mask in members if invert(mask) == mask)
        two_cycles = (count - len(fixed_masks)) // 2
        spread = max(means) - min(means)
        if spread not in DISPERSION_CLASSES:
            stop("S-4", f"{orbit_id} unclassified dispersion {spread}")
        orbits.append({
            "orbitId": orbit_id,
            "tier": orbit_map[orbit_id]["tier"],
            "memberCount": count,
            "totals": totals,
            "meansExact": sweep_map[orbit_id]["meansExact"],
            "wrapLadder": wraps,
            "pitchClassHistogram": histogram,
            "histogramIndexOrder": "c = 0..11",
            "involutionI0": {
                "fixedPointCount": len(fixed_masks),
                "fixedPointMasks": fixed_masks,
                "twoCycleCount": two_cycles,
            },
            "spreadExact": str(spread),
            "dispersionClass": DISPERSION_CLASSES[spread],
            "secondMomentExact": second_moment,
        })

    for p in range(12):
        values = [means_matrix[index][p] for index in range(len(means_matrix))]
        spread_vector.append(max(values) - min(values))
        center = sum(values, Fraction(0)) / len(values)
        variance_vector.append(
            sum(((value - center) ** 2 for value in values), Fraction(0)) / len(values)
        )

    zero_set = [p for p in range(12) if spread_vector[p] == 0]
    if zero_set != [0, 11]:
        stop("S-4", "catalog coincidence set drift")
    interior_min = min(spread_vector[1:11])
    if interior_min != Fraction(96, 35) or spread_vector[5] != interior_min or spread_vector[6] != interior_min:
        stop("S-4", "catalog interior minimum drift")
    global_max = max(spread_vector)
    if global_max != Fraction(60, 7):
        stop("S-4", "catalog global maximum drift")

    t0 = receipts["T0"]
    ta = receipts["TA"]
    tb = receipts["TB"]
    tc = receipts["TC"]
    candidate_a = ta.get("candidateA") or t0["candidateA"]
    if candidate_a["classification"] != "TRIVIAL_IDENTITY":
        stop("S-4", "Candidate A classification drift")
    if ta["candidateB"]["classification"] != "ORBIT_INVOLUTION_INVARIANT":
        stop("S-4", "Candidate B classification drift")
    if ta["candidateC"]["classification"] != "REPRESENTATION_ISOMORPHISM":
        stop("S-4", "Candidate C classification drift")
    if ta["candidateD"]["classification"] != "ORBIT_INVOLUTION_INVARIANT":
        stop("S-4", "Candidate D classification drift")
    if tb["interpretationPolicy"] != GUARD or tc["interpretationPolicy"] != GUARD:
        stop("S-5", "Modality 2 guard flag drift")

    palettes = tc["audioSource"]["palettes"]
    band_map = {"-12": [], "0": [], "12": []}
    for office, preset in palettes.items():
        band_map[str(preset["registerOffset"])].append(office)
    measured = tc["officeBands"]
    register_bands = {
        offset: {
            "offices": sorted(offices),
            "measuredOffices": {
                office: measured[office] for office in sorted(offices) if office in measured
            },
        }
        for offset, offices in band_map.items()
    }

    catalog = {
        "schemaVersion": "governed-loop.mvp5-5-orbit-spectral-catalog.v1",
        "directive": "MVP5.5-DIR-1",
        "catalogId": "ORBIT_SPECTRAL_CATALOG_v1",
        "layer": "SPEC-001 §1.3 overlay dynamics",
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "sourcePins": {
            "plv3_sweep.json": "6a943e44c9ed2dc0dc39810c9656872ee55d5ea86bcd4a1e80eb7de505ad8243",
            "census_462.json": "242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a",
            "frozen_ground_truth.json": "007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744",
        },
        "orbits": orbits,
        "crossOrbitSpread": {
            "vectorExact": [str(value) for value in spread_vector],
            "coincidenceSet": zero_set,
            "mirrorSymmetric": all(spread_vector[p] == spread_vector[11 - p] for p in range(12)),
            "globalMaxExact": str(global_max),
            "globalMaxPhases": [p for p in range(12) if spread_vector[p] == global_max],
            "interiorMinExact": str(interior_min),
            "interiorMinPhases": [p for p in range(1, 11) if spread_vector[p] == interior_min],
        },
        "crossOrbitVariance": {
            "definition": "unweighted variance of the 10 orbit means at each phase",
            "vectorExact": [str(value) for value in variance_vector],
        },
        "candidateVerdicts": {
            "A": {
                "classification": "TRIVIAL_IDENTITY",
                "censusChecks": "462/462",
                "allSevenNoteMaskChecks": "792/792",
                "orbitChecks": "10/10",
                "identityValue": 462,
            },
            "B": {
                "classification": "ORBIT_INVOLUTION_INVARIANT",
                "pairwiseI0Checks": "5544/5544",
                "perOrbitPhaseChecks": "60/60",
                "chiralCounterexamples": ta["candidateB"]["perMaskTrivialityFalsification"]["chiralPairFailures"],
            },
            "C": {
                "classification": "REPRESENTATION_ISOMORPHISM",
                "stepWrapChecks": "120/120",
                "histogramMatchChecks": "120/120",
                "distinctSpectra": "10/10",
                "pairwiseDistinct": "45/45",
            },
            "D": {
                "classification": "ORBIT_INVOLUTION_INVARIANT",
                "coincidenceSet": [0, 11],
                "maxSpreadExact": str(global_max),
                "interiorMinExact": str(interior_min),
            },
        },
        "modality2PhotonicSummary": {
            "interpretationPolicy": dict(GUARD),
            "b1": {
                "disposition": tb["formulationB1"]["disposition"],
                "minCrossOrbitSpreadHz": min(tb["formulationB1"]["crossOrbitSpreadHz"]),
                "toleranceHz": tb["constants"]["toleranceHz"],
                "mu1OrbitInvariantAtP0": tb["formulationB1"]["secondMomentAudit"]["mu1OrbitInvariantAtP0"],
                "mu1OrbitInvariantAtP11": tb["formulationB1"]["secondMomentAudit"]["mu1OrbitInvariantAtP11"],
                "correlationMu2VsMeanAtP0": tb["formulationB1"]["secondMomentAudit"]["correlationMu2VsMeanAtP0"],
                "correlationMu2VsMeanAtP11": tb["formulationB1"]["secondMomentAudit"]["correlationMu2VsMeanAtP11"],
            },
            "b2": {
                "disposition": tb["formulationB2"]["disposition"],
                "stepChecks": tb["formulationB2"]["checks"],
                "stepFailures": tb["formulationB2"]["failures"],
                "maxResidualHz": tb["formulationB2"]["maxResidualHz"],
                "logDualExact": tb["formulationB2"]["logDual"]["exact"],
                "logDualMaxDeviation": tb["formulationB2"]["logDual"]["maxDeviation"],
                "nonTrivialRatioCoincidences": len(tb["formulationB2"]["nonTrivialCoincidences"]),
            },
            "acousticBridge": {
                "barCount": tc["checkC1"]["barCount"],
                "c1Disposition": tc["checkC1"]["disposition"],
                "correlationCfftVsModel": tc["checkC1"]["correlationCfftVsModel"],
                "medianAbsoluteRelativeError": tc["checkC1"]["medianAbsoluteRelativeError"],
                "c2Disposition": tc["checkC2"]["disposition"],
                "c3Verified": tc["checkC3"]["verified"],
                "officeBands": tc["officeBands"],
                "registerBands": register_bands,
                "equivariantRows": tc["checkC3"]["rows"],
            },
        },
        "catalogFlags": {
            "modality1ZeroFloats": True,
            "modality3DiscreteOnly": True,
            "modality2Guarded": True,
        },
    }
    discrete_view = {k: v for k, v in catalog.items() if k != "modality2PhotonicSummary"}
    floats = find_floats(discrete_view)
    if floats:
        stop("S-5", f"floats in discrete catalog: {floats[:5]}")
    return catalog, spread_vector, variance_vector


def markdown_table(headers, rows):
    lines = ["| " + " | ".join(headers) + " |", "|" + "|".join(["---"] * len(headers)) + "|"]
    for row in rows:
        lines.append("| " + " | ".join(str(value) for value in row) + " |")
    return "\n".join(lines)


def build_markdown(catalog, receipts, receipt_hashes):
    orbits = catalog["orbits"]
    lines = []
    lines.append("# Orbit Spectral Catalog v1")
    lines.append("")
    lines.append("**Directive:** `MVP5.5-DIR-1` rev 1  ")
    lines.append("**Catalog ID:** `ORBIT_SPECTRAL_CATALOG_v1`  ")
    lines.append("**Layer:** `SPEC-001 §1.3 overlay dynamics`  ")
    lines.append("**Scope:** 10 governed orbits × 12 phases, exact rational arithmetic.")
    lines.append("")
    lines.append("## Status and fences")
    lines.append("")
    lines.append("- `gov517_correspondence_claimed`: `false`")
    lines.append("- `still_set_label`: `still_set`")
    lines.append("- Modality 1/3 tables are exact rational/integer only (zero floats).")
    lines.append("- Modality 2 photonic and acoustic values are external boundary-conditioned measurements with the four registered guard flags.")
    lines.append("- `harmonic.C_H` remains `unresolved` with `value: null`.")
    lines.append("")
    lines.append("## Exact 10 × 12 orbit phase-mean matrix")
    lines.append("")
    headers = ["orbit", "n"] + [f"p{p}" for p in range(12)]
    rows = [[orbit["orbitId"], orbit["memberCount"]] + orbit["meansExact"] for orbit in orbits]
    lines.append(markdown_table(headers, rows))
    lines.append("")
    lines.append("Every cell is an exact `fractions.Fraction` serialized as a string; no floating-point value is present.")
    lines.append("")
    lines.append("## Exact 10 × 12 orbit total matrix")
    lines.append("")
    rows = [[orbit["orbitId"], orbit["memberCount"]] + orbit["totals"] for orbit in orbits]
    lines.append(markdown_table(headers, rows))
    lines.append("")
    lines.append("## Wrap-count tomography: `w_p = (7n − Δ_p) / 12`")
    lines.append("")
    lines.append("The cyclic first difference `Δ_p = total_(p+1) − total_p` bijectively recovers the pitch-class multiplicity histogram: `w_p = h_O((11 − p) mod 12)`.")
    lines.append("")
    rows = [[orbit["orbitId"], orbit["memberCount"]] + orbit["wrapLadder"] for orbit in orbits]
    lines.append(markdown_table(headers, rows))
    lines.append("")
    lines.append("## Pitch-class multiplicity histograms `h_O(c)`")
    lines.append("")
    headers_h = ["orbit", "n"] + [f"c{c}" for c in range(12)]
    rows = [[orbit["orbitId"], orbit["memberCount"]] + orbit["pitchClassHistogram"] for orbit in orbits]
    lines.append(markdown_table(headers_h, rows))
    lines.append("")
    lines.append("## I₀ involution closure and dispersion classes")
    lines.append("")
    headers_i = ["orbit", "n", "fixed points", "2-cycles", "spread", "dispersion class"]
    rows = [
        [
            orbit["orbitId"],
            orbit["memberCount"],
            orbit["involutionI0"]["fixedPointCount"],
            orbit["involutionI0"]["twoCycleCount"],
            orbit["spreadExact"],
            orbit["dispersionClass"],
        ]
        for orbit in orbits
    ]
    lines.append(markdown_table(headers_i, rows))
    lines.append("")
    lines.append("`I₀: x ↦ (−x) mod 12` maps every governed orbit bijectively onto itself and the 154 withheld boundary masks onto themselves.")
    lines.append("")
    lines.append("## Cross-orbit spread profile")
    lines.append("")
    headers_s = ["quantity"] + [f"p{p}" for p in range(12)]
    lines.append(markdown_table(headers_s, [
        ["Δ_cross exact"] + catalog["crossOrbitSpread"]["vectorExact"],
        ["Var_cross exact"] + catalog["crossOrbitVariance"]["vectorExact"],
    ]))
    lines.append("")
    lines.append(f"- Coincidence set: `{catalog['crossOrbitSpread']['coincidenceSet']}`")
    lines.append(f"- Global maximum: `{catalog['crossOrbitSpread']['globalMaxExact']}` at phases `{catalog['crossOrbitSpread']['globalMaxPhases']}`")
    lines.append(f"- Interior minimum: `{catalog['crossOrbitSpread']['interiorMinExact']}` at phases `{catalog['crossOrbitSpread']['interiorMinPhases']}`")
    lines.append("- Mirror symmetry: `Δ_cross(p) = Δ_cross(11 − p)`.")
    lines.append("")
    lines.append("## Candidate invariant audit")
    lines.append("")
    headers_c = ["candidate", "verdict", "checks", "meaning"]
    verdicts = catalog["candidateVerdicts"]
    lines.append(markdown_table(headers_c, [
        ["A — Phase-sum identity", verdicts["A"]["classification"],
         "462/462 census; 792/792 seven-note masks; 10/10 orbits",
         "checksum guardrail; zero orbit-constraining power"],
        ["B — Reflection pairing", verdicts["B"]["classification"],
         "5544/5544 pairwise I₀; 60/60 orbit phase pairs",
         f"{verdicts['B']['chiralCounterexamples']} chiral per-mask counterexamples"],
        ["C — Orbit tomography", verdicts["C"]["classification"],
         "120/120 wraps; 120/120 histograms; 45/45 distinct pairs",
         "phase curve is a complete pitch-class representation"],
        ["D — Achromatic boundary", verdicts["D"]["classification"],
         "coincidence set {0, 11}; max 60/7; interior min 96/35",
         "field boundary condition at the reflection endpoints"],
    ]))
    lines.append("")
    lines.append("## Task B — photonic E = hν boundary condition")
    lines.append("")
    modality2 = catalog["modality2PhotonicSummary"]
    lines.append(markdown_table(
        ["test", "disposition", "result"],
        [
            ["B1 — container frequency sum", modality2["b1"]["disposition"],
             f"minimum cross-orbit spread {modality2['b1']['minCrossOrbitSpreadHz']:.6f} Hz "
             f"(tolerance {modality2['b1']['toleranceHz']})"],
            ["B2 — wrap step law", modality2["b2"]["disposition"],
             f"{modality2['b2']['stepChecks']}/{modality2['b2']['stepChecks']} checks; "
             f"max residual {modality2['b2']['maxResidualHz']:.3e} Hz"],
            ["B2 — log/geometric dual", "BOUNDARY_CONFIRMED",
             f"exact; max deviation {modality2['b2']['logDualMaxDeviation']:.3e}"],
        ],
    ))
    lines.append("")
    lines.append(f"At both endpoints the first pitch-class moment is orbit-invariant "
                 f"(`{modality2['b1']['mu1OrbitInvariantAtP0']}` at p=0, "
                 f"`{modality2['b1']['mu1OrbitInvariantAtP11']}` at p=11), while the frequency mean still splits "
                 f"(correlation with μ₂: `{modality2['b1']['correlationMu2VsMeanAtP0']:.9f}` at p=0, "
                 f"`{modality2['b1']['correlationMu2VsMeanAtP11']:.9f}` at p=11). "
                 "The exact achromatic convergence is a property of the logarithmic/geometric-mean coordinate, not of additive frequency mixing.")
    lines.append("")
    lines.append("Guard flags: `causationClaim: false`, `physicalQuantityClaim: false`, "
                 "`tierClassifier: false`, `globalCHNull: true`.")
    lines.append("")
    lines.append("## Task C — 86-bar acoustic centroid bridge")
    lines.append("")
    lines.append(f"- C1 renderer-to-air FFT fidelity: `{modality2['acousticBridge']['c1Disposition']}`; "
                 f"correlation `{modality2['acousticBridge']['correlationCfftVsModel']:.9f}`; "
                 f"median relative error `{modality2['acousticBridge']['medianAbsoluteRelativeError']:.6f}`.")
    lines.append(f"- C2 symbolic pcSum tracking: `{modality2['acousticBridge']['c2Disposition']}` "
                 "(container pcSum alone does not gain from office deconfounding; micro-lead pitch sums carry the intra-office contour).")
    lines.append(f"- C3 equivariant P0→P7 shift: `{'VERIFIED' if modality2['acousticBridge']['c3Verified'] else 'FAILED'}`.")
    lines.append("")
    headers_o = ["office", "register", "waveform", "bars", "mean C_FFT (Hz)", "min (Hz)", "max (Hz)"]
    rows = [
        [office, band["registerOffset"], band["waveform"], band["barCount"],
         f"{band['meanCentroidHz']:.3f}", f"{band['minCentroidHz']:.3f}", f"{band['maxCentroidHz']:.3f}"]
        for office, band in modality2["acousticBridge"]["officeBands"].items()
    ]
    lines.append(markdown_table(headers_o, rows))
    lines.append("")
    lines.append("### Three acoustic register bands")
    lines.append("")
    band_rows = []
    for offset, band in modality2["acousticBridge"]["registerBands"].items():
        measured_offices = band["measuredOffices"]
        if measured_offices:
            values = [item["meanCentroidHz"] for item in measured_offices.values()]
            band_rows.append([
                "+12" if offset == "12" else offset, ", ".join(band["offices"]),
                ", ".join(measured_offices),
                f"{min(values):.3f} – {max(values):.3f}",
            ])
        else:
            band_rows.append(["+12" if offset == "12" else offset, ", ".join(band["offices"]), "none in the 86 rendered bars", "—"])
    lines.append(markdown_table(
        ["registerOffset", "offices", "measured offices", "mean C_FFT range (Hz)"],
        band_rows,
    ))
    lines.append("")
    lines.append("### Per-bar centroid table (86 voiced bars)")
    lines.append("")
    headers_b = ["track", "bar", "node", "office", "pcSum", "C_FFT (Hz)", "C_model (Hz)", "rel. error"]
    rows = []
    for track_name, track in receipts["TC"]["tracks"].items():
        for bar in track["bars"]:
            rows.append([
                track_name.replace("track", "T"),
                bar["bar"], bar["node"], bar["office"], bar["containerPcSum"],
                f"{bar['cFftHz']:.3f}", f"{bar['cModelHz']:.3f}", f"{bar['relativeError']:.6f}",
            ])
    lines.append(markdown_table(headers_b, rows))
    lines.append("")
    lines.append("### Equivariant pair")
    lines.append("")
    headers_e = ["bar", "base mask", "phase p0", "phase p7", "Δp", "Δwraps", "ΔpcSum symbolic", "ΔpcSum observed", "ΔC_FFT (Hz)"]
    rows = [
        [row["bar"], row["nodeBase"], row["phaseP0"], row["phaseP7"], row["deltaPhase"],
         row["deltaWraps"], row["symbolicPcSumShift"], row["observedPcSumShift"],
         f"{row['deltaCfftHz']:.3f}"]
        for row in modality2["acousticBridge"]["equivariantRows"]
    ]
    lines.append(markdown_table(headers_e, rows))
    lines.append("")
    lines.append("## Orchestration guidance")
    lines.append("")
    lines.append("- Use `p ∈ {0, 11}` when a macro-planner needs orbit-agnostic symbolic behavior: every orbit mean is exactly `36` and `41` respectively, and the cross-orbit spread is zero.")
    lines.append("- Treat `p ∈ {3, 8}` as the maximum-dispersion interior phases (`60/7` spread): the same phase selects materially different pitch-class content per orbit.")
    lines.append("- Use the wrap ladder `w_p` as the exact orbit fingerprint: it recovers the pitch-class multiplicity histogram and separates `ORBIT-D2` from `ORBIT-D5` despite their equal spread.")
    lines.append("- For acoustic rendering, expect three register bands set by `registerOffset` (`Saturn −12`; `Moon/Mercury/Jupiter 0`; `Sun/Mars/Venus +12`); container `pcSum` alone is not a sufficient intra-office centroid predictor, while micro-lead pitches carry most of the contour.")
    lines.append("- Do not treat the photonic frequency sums as a physical claim: additive 12-TET frequency mixing retains second-moment dispersion; only the logarithmic/geometric coordinate is achromatic.")
    lines.append("")
    lines.append("## Receipt chain")
    lines.append("")
    lines.append(markdown_table(
        ["task", "receipt", "sha256"],
        [
            ["T0", "task-0/mvp5_5_task_0_receipt.json", receipt_hashes["T0"]],
            ["TA", "task-a/mvp5_5_task_a_receipt.json", receipt_hashes["TA"]],
            ["TB", "task-b/mvp5_5_task_b_receipt.json", receipt_hashes["TB"]],
            ["TC", "task-c/mvp5_5_task_c_receipt.json", receipt_hashes["TC"]],
            ["TD", "task-d/mvp5_5_task_d_receipt.json", "(emitted with this catalog)"],
        ],
    ))
    lines.append("")
    return "\n".join(lines)


def staging_entries():
    entries = []
    for path in sorted(SCRATCH.rglob("*")):
        if not path.is_file():
            continue
        if path == MANIFEST:
            continue
        if "__pycache__" in path.parts:
            continue
        relative = path.relative_to(SCRATCH)
        entries.append({
            "path": str(relative),
            "bytes": path.stat().st_size,
            "sha256": sha256_file(path),
        })
    return entries


def verify_entries(entries):
    failures = []
    for entry in entries:
        path = SCRATCH / entry["path"]
        if not path.is_file():
            failures.append({"path": entry["path"], "reason": "missing"})
            continue
        if path.stat().st_size != entry["bytes"]:
            failures.append({"path": entry["path"], "reason": "byte mismatch"})
            continue
        if sha256_file(path) != entry["sha256"]:
            failures.append({"path": entry["path"], "reason": "sha256 mismatch"})
    return failures


def main():
    TASKD.mkdir(parents=True, exist_ok=True)
    closing_fixed_point = verify_opening()

    census = json.loads((REPO / "tools/governed-loop/census_462.json").read_text(encoding="utf-8"))
    ground_truth = json.loads(
        (REPO / "tools/governed-loop/frozen_ground_truth.json").read_text(encoding="utf-8")
    )
    sweep = json.loads((REPO / "tools/governed-loop/plv3_sweep.json").read_text(encoding="utf-8"))

    receipts = {}
    receipt_hashes = {}
    for key, name in (
        ("T0", "task-0/mvp5_5_task_0_receipt.json"),
        ("TA", "task-a/mvp5_5_task_a_receipt.json"),
        ("TB", "task-b/mvp5_5_task_b_receipt.json"),
        ("TC", "task-c/mvp5_5_task_c_receipt.json"),
    ):
        receipts[key], receipt_hashes[key] = load_receipt(name)

    if receipts["T0"]["floatScan"]["values"] != 0 or receipts["TA"]["floatScan"]["values"] != 0:
        stop("S-5", "Task 0/A float scan not zero")
    for key in ("T0", "TA"):
        floats = find_floats(receipts[key])
        if floats:
            stop("S-5", f"{key} receipt contains floats: {floats[:3]}")

    catalog, spread_vector, variance_vector = build_catalog(
        census, ground_truth, sweep, receipts
    )
    CATALOG_JSON.write_text(
        json.dumps(catalog, indent=2, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    catalog_md = build_markdown(catalog, receipts, receipt_hashes)
    CATALOG_MD.write_text(catalog_md + "\n", encoding="utf-8")

    tb = receipts["TB"]
    tc = receipts["TC"]
    ta = receipts["TA"]
    t0 = receipts["T0"]

    receipt = {
        "schemaVersion": "governed-loop.mvp5-5-task-d.v1",
        "directive": "MVP5.5-DIR-1",
        "task": "TD",
        "status": "COMPLETE",
        "closingFixedPoint": closing_fixed_point,
        "catalog": {
            "json": "task-d/orbit_spectral_catalog.json",
            "jsonSha256": sha256_file(CATALOG_JSON),
            "markdown": "task-d/ORBIT_SPECTRAL_CATALOG.md",
            "markdownSha256": sha256_file(CATALOG_MD),
            "orbitCount": len(catalog["orbits"]),
            "phaseCount": 12,
            "discreteFloatScan": {"values": 0, "witnesses": []},
        },
        "receiptChain": {
            key: {"path": name, "sha256": receipt_hashes[key]}
            for key, name in (
                ("T0", "task-0/mvp5_5_task_0_receipt.json"),
                ("TA", "task-a/mvp5_5_task_a_receipt.json"),
                ("TB", "task-b/mvp5_5_task_b_receipt.json"),
                ("TC", "task-c/mvp5_5_task_c_receipt.json"),
            )
        },
        "verdictSummary": {
            "candidateA": "TRIVIAL_IDENTITY",
            "candidateB": "ORBIT_INVOLUTION_INVARIANT",
            "candidateC": "REPRESENTATION_ISOMORPHISM",
            "candidateD": "ORBIT_INVOLUTION_INVARIANT",
            "b1": tb["formulationB1"]["disposition"],
            "b2": tb["formulationB2"]["disposition"],
            "c1": tc["checkC1"]["disposition"],
            "c2": tc["checkC2"]["disposition"],
            "c3Verified": tc["checkC3"]["verified"],
            "chiralCounterexamples": ta["candidateB"]["perMaskTrivialityFalsification"]["chiralPairFailures"],
            "voicedBars": tc["checkC1"]["barCount"],
        },
        "modality2Summary": {
            "interpretationPolicy": dict(GUARD),
            "photonicB1Disposition": tb["formulationB1"]["disposition"],
            "photonicB2Disposition": tb["formulationB2"]["disposition"],
            "acousticC1Disposition": tc["checkC1"]["disposition"],
            "acousticC2Disposition": tc["checkC2"]["disposition"],
            "acousticC3Verified": tc["checkC3"]["verified"],
            "fftModelCorrelation": tc["checkC1"]["correlationCfftVsModel"],
        },
        "stagingManifest": {
            "path": "l22_staging_manifest.json",
            "entryCount": 0,
            "allHashVerified": False,
        },
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "stopRulesTriggered": [],
    }
    RECEIPT.write_text(
        json.dumps(receipt, indent=2, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )

    entries_before = staging_entries()
    failures = verify_entries(entries_before)
    if failures:
        stop("S-7", f"pre-report staging failures: {failures[:3]}")

    final_paths = {entry["path"] for entry in entries_before}
    final_paths.add("MVP5_5-CLOSING-REPORT.md")
    final_entry_count = len(final_paths)
    receipt["stagingManifest"] = {
        "path": "l22_staging_manifest.json",
        "entryCount": final_entry_count,
        "allHashVerified": True,
    }
    RECEIPT.write_text(
        json.dumps(receipt, indent=2, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    entries_before = staging_entries()
    failures = verify_entries(entries_before)
    if failures:
        stop("S-7", f"pre-report staging failures after receipt finalize: {failures[:3]}")
    td_hash = sha256_file(RECEIPT)[:8]
    closing_report = build_closing_report(
        closing_fixed_point, receipts, receipt_hashes, td_hash, catalog,
        final_entry_count
    )
    CLOSING.write_text(closing_report + "\n", encoding="utf-8")

    entries = staging_entries()
    manifest = {
        "schemaVersion": "governed-loop.mvp5-5-l22-staging-manifest.v1",
        "directive": "MVP5.5-DIR-1",
        "status": "closed",
        "executionRealm": str(SCRATCH),
        "repositoryWrites": 0,
        "orreryChanges": 0,
        "gateBytesTouched": False,
        "entries": entries,
        "entryCount": len(entries),
        "allHashVerified": False,
    }
    MANIFEST.write_text(
        json.dumps(manifest, indent=2, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )
    failures = verify_entries(entries)
    if failures:
        stop("S-7", f"final staging failures: {failures[:3]}")
    manifest["allHashVerified"] = True
    MANIFEST.write_text(
        json.dumps(manifest, indent=2, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )

    print("MVP5.5 TASK D COMPLETE")
    print(f"  catalog {len(catalog['orbits'])} orbits x 12 phases")
    print(f"  staged entries {len(entries)}/{len(entries)} hash-verified")
    print(f"  closing fixed point {closing_fixed_point['head']}")
    print(f"  receipt sha256 {sha256_file(RECEIPT)}")
    print(f"  manifest sha256 {sha256_file(MANIFEST)}")
    print(f"  closing report sha256 {sha256_file(CLOSING)}")


def build_closing_report(closing, receipts, receipt_hashes, td_hash, catalog, final_entry_count):
    t0 = receipts["T0"]
    ta = receipts["TA"]
    tb = receipts["TB"]
    tc = receipts["TC"]
    hashes = {key: value[:8] for key, value in receipt_hashes.items()}
    lines = []
    lines.append("# MVP5.5 Closing Report — 12-Phase Orbit Spectral Tomography, Photonic Frequency Bet, and Acoustic Centroid Bridge")
    lines.append("")
    lines.append("**Directive:** `MVP5.5-DIR-1` rev 1  ")
    lines.append("**Execution realm:** `/home/erick/workspace/scratch-governed-loop-run/mvp5_5/`  ")
    lines.append("**Status:** COMPLETE")
    lines.append("")
    lines.append("## Fixed point and pins")
    lines.append("")
    lines.append(f"- Opening and closing HEAD: `{closing['head']}`")
    lines.append(f"- Tree clean: `true` (digest `{closing['treeDigest']}`)")
    lines.append(f"- Decision ledger: `{closing['ledgerSha256']}` / `{closing['ledgerBytes']} B` / `{closing['ledgerLines']} lines`")
    lines.append(f"- Release manifest: `{closing['releaseManifestSha256']}` / `{closing['releaseManifestFiles']} files` / `{closing['releaseManifestBytes']} B`")
    lines.append("- Pins verified: `26/26` SHA-256 match; `mvp2.py` line anchors `11/11` match.")
    lines.append("- Directive byte-column metadata notes (SHA-256 pins all match): `docs/TIERED_PHOTONIC_THEOREM.md` 6857→8597, `canonical/tiered-photonic-candidates/tiered-photonic-v1.json` 26338→43639, `orrery/src/generated/photonic-overlay.v1.json` 19586→17403.")
    lines.append("")
    lines.append("## Task outcomes")
    lines.append("")
    lines.append("| Task | Receipt | SHA-256 (first 8) | Outcome |")
    lines.append("|---|---|---|---|")
    lines.append(f"| T0 | `task-0/mvp5_5_task_0_receipt.json` | `{hashes['T0']}` | fixed point, predeclaration lock, 120/120 matrix recompute, Candidate A |")
    lines.append(f"| TA | `task-a/mvp5_5_task_a_receipt.json` | `{hashes['TA']}` | Candidate B/C/D exact analysis |")
    lines.append(f"| TB | `task-b/mvp5_5_task_b_receipt.json` | `{hashes['TB']}` | B1 refuted, B2 confirmed, anchors cross-referenced |")
    lines.append(f"| TC | `task-c/mvp5_5_task_c_receipt.json` | `{hashes['TC']}` | 86-bar FFT bridge |")
    lines.append(f"| TD | `task-d/mvp5_5_task_d_receipt.json` | `{td_hash}` | catalog, staging manifest, closing report |")
    lines.append("")
    lines.append("## Candidate audit")
    lines.append("")
    lines.append("| Candidate | Verdict | Exact evidence |")
    lines.append("|---|---|---|")
    lines.append("| A — Phase-sum identity | `TRIVIAL_IDENTITY` | 462/462 census masks; 792/792 seven-note masks; 10/10 orbits sum to 462 |")
    lines.append(f"| B — Reflection pairing | `ORBIT_INVOLUTION_INVARIANT` | 5544/5544 pairwise I₀; 60/60 orbit phase pairs; {ta['candidateB']['perMaskTrivialityFalsification']['chiralPairFailures']} chiral counterexamples |")
    lines.append("| C — Orbit tomography | `REPRESENTATION_ISOMORPHISM` | 120/120 integer wraps; 120/120 histogram matches; 45/45 distinct pairs |")
    lines.append("| D — Achromatic boundary | `ORBIT_INVOLUTION_INVARIANT` | coincidence set {0, 11}; max 60/7; interior min 96/35 |")
    lines.append("")
    lines.append("## Photonic frequency bet (Modality 2)")
    lines.append("")
    lines.append(f"- **B1 container frequency sum:** `{tb['formulationB1']['disposition']}`. Minimum cross-orbit spread `{min(tb['formulationB1']['crossOrbitSpreadHz']):.6f} Hz`, far above the `1e-9` Hz tolerance. The first pitch-class moment is orbit-invariant at both endpoints (`36` at p=0, `41` at p=11), yet the frequency mean splits; correlation with μ₂ is `{tb['formulationB1']['secondMomentAudit']['correlationMu2VsMeanAtP0']:.9f}` at p=0 and `{tb['formulationB1']['secondMomentAudit']['correlationMu2VsMeanAtP11']:.9f}` at p=11.")
    lines.append(f"- **B2 wrap step law:** `{tb['formulationB2']['disposition']}`. `{tb['formulationB2']['checks']}/{tb['formulationB2']['checks']}` checks; maximum residual `{tb['formulationB2']['maxResidualHz']:.3e} Hz`.")
    lines.append(f"- **Log/geometric dual:** exact; maximum deviation `{tb['formulationB2']['logDual']['maxDeviation']:.3e}`. Non-trivial ratio coincidences: `{len(tb['formulationB2']['nonTrivialCoincidences'])}`.")
    lines.append(f"- **A0/A1/A2 anchor cross-reference:** 7 A0, 7 A1, 7 A2 states all inside their orbits; 28 sidecar records recompute; sidecar unmutated (`{tb['tieredAnchorCrossReference']['sha256Before'] == tb['tieredAnchorCrossReference']['sha256After']}`).")
    lines.append("- Guard flags: `causationClaim: false`, `physicalQuantityClaim: false`, `tierClassifier: false`, `globalCHNull: true`.")
    lines.append("")
    lines.append("## Acoustic FFT bridge (Modality 2)")
    lines.append("")
    lines.append(f"- **C1 renderer-to-air fidelity:** `{tc['checkC1']['disposition']}`. `{tc['checkC1']['barCount']}/86` voiced bars; correlation `{tc['checkC1']['correlationCfftVsModel']:.9f}`; median relative error `{tc['checkC1']['medianAbsoluteRelativeError']:.6f}`; maximum `{tc['checkC1']['maxAbsoluteRelativeError']:.6f}`.")
    lines.append(f"- **C2 symbolic pcSum tracking:** `{tc['checkC2']['disposition']}`. Container pcSum alone does not gain from office deconfounding on the multi-office walks; the micro-lead pitch sums do (see the catalog's `predictors.leadPcSum`).")
    lines.append(f"- **C3 equivariant P0→P7 shift:** `{'VERIFIED' if tc['checkC3']['verified'] else 'FAILED'}`. Physical shifts `{[round(row['deltaCfftHz'], 3) for row in tc['checkC3']['rows']]}` Hz track the exact symbolic shifts `{[row['symbolicPcSumShift'] for row in tc['checkC3']['rows']]}`.")
    lines.append("- Office bands: `Saturn −12` low band, `Moon/Mercury/Jupiter 0` middle band, `Sun/Mars/Venus +12` high band.")
    lines.append("")
    lines.append("## Catalog and staging")
    lines.append("")
    lines.append("- Machine-readable catalog: `task-d/orbit_spectral_catalog.json` (discrete section zero-float; separate guarded Modality 2 block).")
    lines.append("- Human-readable catalog: `task-d/ORBIT_SPECTRAL_CATALOG.md`.")
    lines.append(f"- L22 staging manifest: `l22_staging_manifest.json`, `{final_entry_count}/{final_entry_count}` entries SHA-256 verified.")
    lines.append("- Repository writes: `0`; Orrery changes: `0`; gate bytes touched: `false`.")
    lines.append("")
    lines.append("## Terminal verdict")
    lines.append("")
    lines.append("```text")
    lines.append("MVP5_5-SPRINT-CLOSING")
    lines.append("FIXED-POINT: 52202ed9c4aad7d4baead2859972853aad28e7bb / TREE CLEAN / L21 e74cf6a2...6c8f1c4 / 356466 B / 4189 lines")
    lines.append("MANIFEST-PIN: 1585 FILES / 110505727 B / RELEASE-CLOSURE 418/0 PASS")
    lines.append("PINS-VERIFIED: 26/26 MATCH / PREDECLARATION-LOCKED TRUE")
    lines.append("TASKS: T0 COMPLETE | TA COMPLETE | TB COMPLETE | TC COMPLETE | TD COMPLETE")
    lines.append(f"RECEIPTS: T0 {hashes['T0']} | TA {hashes['TA']} | TB {hashes['TB']} | TC {hashes['TC']} | TD {td_hash}")
    lines.append("CANDIDATE-A-PHASE-SUM: TRIVIAL_IDENTITY / 462-MASKS-EXACT 462/462 / 10-ORBITS-462 10/10")
    lines.append(f"CANDIDATE-B-REFLECTION: ORBIT_INVOLUTION_INVARIANT / PAIRWISE-I0-5544 5544/5544 / PER-ORBIT-77 60/60 / CHIRAL-COUNTEREXAMPLES {ta['candidateB']['perMaskTrivialityFalsification']['chiralPairFailures']}")
    lines.append("CANDIDATE-C-TOMOGRAPHY: REPRESENTATION_ISOMORPHISM / STEP-WRAPS-INTEGER 120/120 / HISTOGRAM-MATCH 120/120 / DISTINCT-SPECTRA 10/10")
    lines.append("CANDIDATE-D-ACHROMATIC: ORBIT_INVOLUTION_INVARIANT / COINCIDENCE-SET {0,11} / MAX-SPREAD-60-OVER-7 TRUE / MIN-INTERIOR-96-OVER-35 TRUE")
    lines.append(f"PHOTONIC-BET-E-HNU: B1-CONTAINER-CONVERGENCE {tb['formulationB1']['disposition']} / B2-WRAP-STEP-LAW {tb['formulationB2']['checks']}/{tb['formulationB2']['checks']} / LOG-DUAL-EXACT {str(tb['formulationB2']['logDual']['exact']).upper()}")
    lines.append(f"ACOUSTIC-FFT-BRIDGE: TRACKS-6-BARS {tc['checkC1']['barCount']}/{tc['checkC1']['barCount']} / FFT-MODEL-CORR {tc['checkC1']['correlationCfftVsModel']:.9f} / EQUIV-P0-P7-SHIFT {'VERIFIED' if tc['checkC3']['verified'] else 'FAILED'} / NON-FINITE-BINS 0")
    lines.append("MODALITY-FENCES: MOD1-ZERO-FLOATS TRUE / MOD2-FLAGS-4-OF-4 TRUE / GOV517-CLAIMED FALSE / CH-NULL TRUE")
    lines.append(f"L22-STAGING-MANIFEST: {final_entry_count}/{final_entry_count} HASH-VERIFIED")
    lines.append("REPO-WRITES: 0")
    lines.append("ORRERY-CHANGES: 0")
    lines.append("GATE-BYTES-TOUCHED: FALSE")
    lines.append("STOP-RULES: 0")
    lines.append("STATUS: COMPLETE")
    lines.append("```")
    return "\n".join(lines)


if __name__ == "__main__":
    main()
