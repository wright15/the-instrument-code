#!/usr/bin/env python3
"""MVP5.5-DIR-1 Task B: photonic E = h nu multiplicative frequency-domain bet.

Modality 2 (boundary_conditioned_contact). All continuous values are external
boundary-conditioned measurements; the four registered guard flags are carried
verbatim. Exact pitch-class moments stay in fractions.Fraction.
"""
import hashlib
import json
import math
import sys
from fractions import Fraction
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp5_5")
TASKB = SCRATCH / "task-b"
PREDECL = SCRATCH / "task-0" / "mvp5_5_predeclared_bets.json"
RECEIPT = TASKB / "mvp5_5_task_b_receipt.json"

TIERED = REPO / "canonical/tiered-photonic-candidates/tiered-photonic-v1.json"
TIERED_SHA = "00ce6e315a66346fa9673ab5a64460a788702cc097fac4069444901af6930f4e"
AUDIO_A4_HZ = 440.0
AUDIO_ROOT_MIDI_NOTE = 60
F0_HZ = AUDIO_A4_HZ * 2.0 ** ((AUDIO_ROOT_MIDI_NOTE - 69) / 12.0)
TOL_HZ = 1e-9
TOL_RATIO = 1e-9

ALL_ORBIT_IDS = [
    "ORBIT-A0", "ORBIT-A1", "ORBIT-A2", "ORBIT-D1", "ORBIT-D2",
    "ORBIT-D3", "ORBIT-D4", "ORBIT-D5", "ORBIT-D6", "ORBIT-D7",
]

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


def pc_list(mask):
    return [i for i in range(12) if (mask >> i) & 1]


def transpose(mask, c):
    result = 0
    for pc in pc_list(mask):
        result |= 1 << ((pc + c) % 12)
    return result


def frequency(pc):
    return F0_HZ * 2.0 ** (pc / 12.0)


def container_sum(mask, phase):
    return sum(frequency(pc) for pc in pc_list(transpose(mask, phase)))


def verify_lock():
    locked = json.loads(PREDECL.read_text(encoding="utf-8"))
    body = {k: v for k, v in locked.items() if k != "predeclarationHash"}
    actual = hashlib.sha256(canonical(body).encode("utf-8")).hexdigest()
    if actual != locked["predeclarationHash"]:
        stop("S-2", "predeclaration hash mismatch at Task B")
    return {
        "path": "task-0/mvp5_5_predeclared_bets.json",
        "sha256": sha256_file(PREDECL),
        "predeclarationHash": locked["predeclarationHash"],
        "status": "verified-before-evaluation",
    }


def pearson(xs, ys):
    count = len(xs)
    mean_x = sum(xs) / count
    mean_y = sum(ys) / count
    covariance = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    variance_x = sum((x - mean_x) ** 2 for x in xs)
    variance_y = sum((y - mean_y) ** 2 for y in ys)
    return covariance / math.sqrt(variance_x * variance_y)


def main():
    TASKB.mkdir(parents=True, exist_ok=True)
    lock = verify_lock()
    tiered_before = sha256_file(TIERED)
    if tiered_before != TIERED_SHA:
        stop("S-1", f"tiered sidecar hash {tiered_before}")

    census = json.loads((REPO / "tools/governed-loop/census_462.json").read_text(encoding="utf-8"))
    ground_truth = json.loads(
        (REPO / "tools/governed-loop/frozen_ground_truth.json").read_text(encoding="utf-8")
    )
    sweep = json.loads((REPO / "tools/governed-loop/plv3_sweep.json").read_text(encoding="utf-8"))
    tiered = json.loads(TIERED.read_text(encoding="utf-8"))

    masks = {record["stateId"]: record["pitchMask"] for record in census["records"]}
    orbit_map = {orbit["orbitId"]: orbit for orbit in ground_truth["orbits"]}
    sweep_map = {orbit["orbitId"]: orbit for orbit in sweep["orbits"]}
    orbit_members = {
        orbit_id: [masks[state_id] for state_id in orbit_map[orbit_id]["memberIds"]]
        for orbit_id in ALL_ORBIT_IDS
    }

    means_f = {}
    moments = {}
    for orbit_id in ALL_ORBIT_IDS:
        members = orbit_members[orbit_id]
        n = len(members)
        means_f[orbit_id] = [
            sum(container_sum(mask, p) for mask in members) / n for p in range(12)
        ]
        moments[orbit_id] = {}
        for p in (0, 11):
            mu1 = Fraction(
                sum(sum(pc_list(transpose(mask, p))) for mask in members), n
            )
            mu2 = Fraction(
                sum(sum(pc * pc for pc in pc_list(transpose(mask, p))) for mask in members), n
            )
            mu3 = Fraction(
                sum(sum(pc ** 3 for pc in pc_list(transpose(mask, p))) for mask in members), n
            )
            moments[orbit_id][p] = {
                "mu1Exact": str(mu1),
                "mu2Exact": str(mu2),
                "mu3Exact": str(mu3),
                "muFHz": means_f[orbit_id][p],
                "jensenGapHz": means_f[orbit_id][p] - F0_HZ * 2.0 ** (float(mu1) / 12.0),
            }

    spread_f = []
    for p in range(12):
        values = [means_f[orbit_id][p] for orbit_id in ALL_ORBIT_IDS]
        spread_f.append(max(values) - min(values))
    convergence_phases = [p for p, value in enumerate(spread_f) if value < TOL_HZ]
    b1_disposition = "BOUNDARY_CONFIRMED" if convergence_phases else "BOUNDARY_REFUTED"
    if b1_disposition != "BOUNDARY_REFUTED":
        stop("S-4", f"unexpected B1 convergence at {convergence_phases}")

    correlation_p0 = pearson(
        [float(Fraction(moments[o][0]["mu2Exact"])) for o in ALL_ORBIT_IDS],
        [means_f[o][0] for o in ALL_ORBIT_IDS],
    )
    correlation_p11 = pearson(
        [float(Fraction(moments[o][11]["mu2Exact"])) for o in ALL_ORBIT_IDS],
        [means_f[o][11] for o in ALL_ORBIT_IDS],
    )
    mu1_p0 = {moments[o][0]["mu1Exact"] for o in ALL_ORBIT_IDS}
    mu1_p11 = {moments[o][11]["mu1Exact"] for o in ALL_ORBIT_IDS}
    if mu1_p0 != {"36"} or mu1_p11 != {"41"}:
        stop("S-4", "first-moment orbit invariance failed at endpoints")

    step_checks = 0
    step_failures = []
    max_residual = 0.0
    log_checks = 0
    max_log_deviation = 0.0
    for mask in masks.values():
        for p in range(12):
            current = container_sum(mask, p)
            following = container_sum(mask, (p + 1) % 12)
            wrapped = 1 if 11 in pc_list(transpose(mask, p)) else 0
            predicted = 2.0 ** (1.0 / 12.0) * current - F0_HZ * wrapped
            residual = abs(following - predicted)
            step_checks += 1
            max_residual = max(max_residual, residual)
            if residual > TOL_HZ:
                step_failures.append({
                    "mask": mask,
                    "phase": p,
                    "residualHz": residual,
                })
            log_sum = (12.0 / math.log(2.0)) * sum(
                math.log(frequency(pc) / F0_HZ)
                for pc in pc_list(transpose(mask, p))
            )
            deviation = abs(log_sum - sum(pc_list(transpose(mask, p))))
            log_checks += 1
            max_log_deviation = max(max_log_deviation, deviation)
    if step_checks != 5544 or step_failures:
        stop("S-4", f"B2 step-law failures: {len(step_failures)}")
    if log_checks != 5544 or max_log_deviation > TOL_HZ:
        stop("S-4", f"log dual deviation {max_log_deviation}")

    indicator_checks = 0
    indicator_failures = []
    for orbit_id in ALL_ORBIT_IDS:
        members = orbit_members[orbit_id]
        n = len(members)
        totals = sweep_map[orbit_id]["totals"]
        for p in range(12):
            count = sum(
                1 for mask in members if 11 in pc_list(transpose(mask, p))
            )
            wrap = (7 * n - (totals[(p + 1) % 12] - totals[p])) // 12
            indicator_checks += 1
            if count != wrap:
                indicator_failures.append({
                    "orbitId": orbit_id,
                    "phase": p,
                    "indicatorSum": count,
                    "wrapCount": wrap,
                })
    if indicator_checks != 120 or indicator_failures:
        stop("S-4", f"wrap-indicator failures: {len(indicator_failures)}")

    ratio = {
        orbit_id: [means_f[orbit_id][p] / means_f[orbit_id][0] for p in range(12)]
        for orbit_id in ALL_ORBIT_IDS
    }
    ratio_coincidences = []
    ratio_min_gap = {}
    for p in range(1, 12):
        values = [ratio[orbit_id][p] for orbit_id in ALL_ORBIT_IDS]
        gaps = []
        for i in range(len(values)):
            for j in range(i + 1, len(values)):
                gap = abs(values[i] - values[j])
                gaps.append(gap)
                if gap < TOL_RATIO:
                    ratio_coincidences.append({
                        "phase": p,
                        "first": ALL_ORBIT_IDS[i],
                        "second": ALL_ORBIT_IDS[j],
                        "gap": gap,
                    })
        ratio_min_gap[str(p)] = min(gaps)
    if ratio_coincidences:
        stop("S-4", f"non-trivial ratio coincidence: {ratio_coincidences[:3]}")

    records = tiered["records"]
    a1_records = [record for record in records if record["tier"] == "A1"]
    a2_records = [record for record in records if record["tier"] == "A2"]
    a0_state_ids = sorted({parent for record in a1_records for parent in record["parentStateIds"]})
    a1_state_ids = sorted({record["stateId"] for record in a1_records})
    a2_state_ids = sorted({record["stateId"] for record in a2_records})
    if len(a0_state_ids) != 7 or len(a1_state_ids) != 7 or len(a2_state_ids) != 7:
        stop("S-4", "tiered anchor cardinality drift")
    for state_id in a0_state_ids:
        if state_id not in orbit_map["ORBIT-A0"]["memberIds"]:
            stop("S-4", f"A0 anchor {state_id} outside ORBIT-A0")
    for state_id in a1_state_ids:
        if state_id not in orbit_map["ORBIT-A1"]["memberIds"]:
            stop("S-4", f"A1 anchor {state_id} outside ORBIT-A1")
    for state_id in a2_state_ids:
        if state_id not in orbit_map["ORBIT-A2"]["memberIds"]:
            stop("S-4", f"A2 anchor {state_id} outside ORBIT-A2")

    anchor_cross_reference = []
    for record in records:
        parents = record["parentWavelengthsNm"]
        if record["variant"] == "sum_mixing":
            recomputed = 1.0 / (1.0 / parents[0] + 1.0 / parents[1])
        else:
            recomputed = math.sqrt(parents[0] * parents[1])
        relative_error = abs(recomputed - record["derivedWavelengthNm"]) / record["derivedWavelengthNm"]
        if relative_error > 1e-12:
            stop("S-4", f"anchor wavelength drift {record['tier']}:{record['stateId']}")
        anchor_cross_reference.append({
            "tier": record["tier"],
            "stateId": record["stateId"],
            "office": record["office"],
            "variant": record["variant"],
            "derivedWavelengthNm": record["derivedWavelengthNm"],
            "recomputedWavelengthNm": recomputed,
            "relativeError": relative_error,
            "parentStateIds": record["parentStateIds"],
        })

    anchor_phase_curve = []
    for tier, orbit_id, state_ids in (
        ("A0", "ORBIT-A0", a0_state_ids),
        ("A1", "ORBIT-A1", a1_state_ids),
        ("A2", "ORBIT-A2", a2_state_ids),
    ):
        for state_id in state_ids:
            mask = masks[state_id]
            phase0 = sum(pc_list(mask))
            phase11 = sum(pc_list(transpose(mask, 11)))
            wraps = sum(1 for pc in pc_list(mask) if pc + 11 >= 12)
            anchor_phase_curve.append({
                "tier": tier,
                "orbitId": orbit_id,
                "stateId": state_id,
                "phase0PcSum": phase0,
                "phase11PcSum": phase11,
                "phase11MinusPhase0": phase11 - phase0,
                "wrapCount": wraps,
                "wrapLawHolds": phase11 - phase0 == 77 - 12 * wraps,
                "orbitPhase0Mean": sweep_map[orbit_id]["meansExact"][0],
                "orbitPhase11Mean": sweep_map[orbit_id]["meansExact"][11],
            })
    if not all(entry["wrapLawHolds"] for entry in anchor_phase_curve):
        stop("S-4", "anchor wrap law failure")

    tiered_after = sha256_file(TIERED)
    if tiered_after != tiered_before:
        stop("S-3", "tiered sidecar mutated during read")

    receipt = {
        "schemaVersion": "governed-loop.mvp5-5-task-b.v1",
        "directive": "MVP5.5-DIR-1",
        "task": "TB",
        "status": "COMPLETE",
        "modality": "boundary_conditioned_contact",
        "interpretationPolicy": dict(GUARD),
        "layer": "SPEC-001 §1.3 overlay dynamics",
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "predeclaration": lock,
        "constants": {
            "AUDIO_ROOT_MIDI_NOTE": AUDIO_ROOT_MIDI_NOTE,
            "AUDIO_A4_HZ": AUDIO_A4_HZ,
            "f0Hz": F0_HZ,
            "toleranceHz": TOL_HZ,
        },
        "formulationB1": {
            "name": "12-TET container frequency aggregate",
            "definition": "S_f(M,p) = sum over pc in T_p(M) of f0*2^(pc/12)",
            "orbitMeanHz": means_f,
            "crossOrbitSpreadHz": spread_f,
            "convergencePhasesBelowTolerance": convergence_phases,
            "disposition": b1_disposition,
            "secondMomentAudit": {
                "mu1OrbitInvariantAtP0": sorted(mu1_p0),
                "mu1OrbitInvariantAtP11": sorted(mu1_p11),
                "correlationMu2VsMeanAtP0": correlation_p0,
                "correlationMu2VsMeanAtP11": correlation_p11,
                "perOrbit": moments,
                "note": (
                    "first pitch-class moment is orbit-invariant at both endpoints "
                    "(36 at p=0, 41 at p=11), so the residual frequency split is "
                    "carried by second and higher moments under strict convexity of 2^(x/12)"
                ),
            },
        },
        "formulationB2": {
            "name": "multiplicative frequency-transport step law with octave-wrap defect",
            "stepLaw": "S_f(M,(p+1) mod 12) = 2^(1/12)*S_f(M,p) - f0*1_(11 in T_p(M))",
            "checks": step_checks,
            "failures": len(step_failures),
            "maxResidualHz": max_residual,
            "toleranceHz": TOL_HZ,
            "disposition": "BOUNDARY_CONFIRMED",
            "wrapIndicatorChecks": {
                "checks": indicator_checks,
                "failures": len(indicator_failures),
                "law": "sum over M in O of 1_(11 in T_p(M)) = w_p(O)",
            },
            "ratioMatrix": ratio,
            "minCrossOrbitRatioGap": ratio_min_gap,
            "nonTrivialCoincidences": ratio_coincidences,
            "logDual": {
                "identity": "(12/ln2)*sum ln(f(pc)/f0) = pcSum(T_p(M))",
                "checks": log_checks,
                "maxDeviation": max_log_deviation,
                "exact": True,
            },
        },
        "tieredAnchorCrossReference": {
            "sidecar": "canonical/tiered-photonic-candidates/tiered-photonic-v1.json",
            "sha256Before": tiered_before,
            "sha256After": tiered_after,
            "mutation": False,
            "a0AnchorCount": len(a0_state_ids),
            "a1AnchorCount": len(a1_state_ids),
            "a2AnchorCount": len(a2_state_ids),
            "derivedAnchorCount": len(a1_state_ids) + len(a2_state_ids),
            "recordCount": len(records),
            "records": anchor_cross_reference,
            "phaseCurve": anchor_phase_curve,
        },
        "stopRulesTriggered": [],
    }
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("MVP5.5 TASK B COMPLETE")
    print(f"  B1 {b1_disposition} | min cross-orbit spread "
          f"{min(spread_f):.6f} Hz (tolerance {TOL_HZ})")
    print(f"     endpoint mu1 orbit-invariant: p0 {sorted(mu1_p0)} p11 {sorted(mu1_p11)}")
    print(f"     corr(mu2, mean_f): p0 {correlation_p0:.9f} p11 {correlation_p11:.9f}")
    print(f"  B2 step law {step_checks - len(step_failures)}/{step_checks} | "
          f"max residual {max_residual:.3e} Hz")
    print(f"     log dual max deviation {max_log_deviation:.3e} | "
          f"ratio coincidences {len(ratio_coincidences)}")
    print(f"  anchors A0 {len(a0_state_ids)} | A1 {len(a1_state_ids)} | A2 {len(a2_state_ids)} | "
          f"sidecar unmutated {tiered_before == tiered_after}")
    print(f"  receipt sha256 {sha256_file(RECEIPT)}")


if __name__ == "__main__":
    main()
