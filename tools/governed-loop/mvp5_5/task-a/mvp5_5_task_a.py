#!/usr/bin/env python3
"""MVP5.5-DIR-1 Task A: reflection pairing involution proof, orbit
tomography, and achromatic boundary. Exact integer / Fraction only.

Verifies the Task 0 predeclaration lock before any evaluation.
"""
import hashlib
import json
import sys
from fractions import Fraction
from pathlib import Path

REPO = Path("/home/erick/projects/integrated-release")
SCRATCH = Path("/home/erick/workspace/scratch-governed-loop-run/mvp5_5")
TASKA = SCRATCH / "task-a"
PREDECL = SCRATCH / "task-0" / "mvp5_5_predeclared_bets.json"
RECEIPT = TASKA / "mvp5_5_task_a_receipt.json"

ALL_ORBIT_IDS = [
    "ORBIT-A0", "ORBIT-A1", "ORBIT-A2", "ORBIT-D1", "ORBIT-D2",
    "ORBIT-D3", "ORBIT-D4", "ORBIT-D5", "ORBIT-D6", "ORBIT-D7",
]

DIRECTIVE_WRAPS = {
    "ORBIT-A0": [20, 27, 28, 27, 32, 26, 32, 27, 28, 27, 20, 49],
    "ORBIT-D2": [22, 16, 13, 18, 22, 26, 22, 18, 13, 16, 22, 35],
    "ORBIT-D5": [22, 18, 20, 17, 18, 20, 18, 17, 20, 18, 22, 35],
    "ORBIT-D6": [14, 15, 12, 10, 8, 8, 8, 10, 12, 15, 14, 21],
    "ORBIT-D7": [6, 5, 4, 3, 2, 2, 2, 3, 4, 5, 6, 7],
}

DISPERSION_CLASSES = {
    "ANCHOR_FLAT": Fraction(5),
    "MODERATE_BEND": Fraction(213, 35),
    "DEEP_DISPERSION": Fraction(71, 7),
    "EXTREME_RAMP": Fraction(103, 7),
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


def verify_lock():
    locked = json.loads(PREDECL.read_text(encoding="utf-8"))
    body = {k: v for k, v in locked.items() if k != "predeclarationHash"}
    actual = hashlib.sha256(canonical(body).encode("utf-8")).hexdigest()
    if actual != locked["predeclarationHash"]:
        stop("S-2", "predeclaration hash mismatch at Task A")
    return {
        "path": "task-0/mvp5_5_predeclared_bets.json",
        "sha256": sha256_file(PREDECL),
        "predeclarationHash": locked["predeclarationHash"],
        "status": "verified-before-evaluation",
    }


def candidate_b(census_masks, governed_masks, orbit_members, sweep_map, boundary_masks):
    per_mask_checks = 0
    per_mask_failures = []
    chiral_masks = 0
    chiral_pair_failures = 0
    for state_id, mask in sorted(census_masks.items()):
        if invert(mask) != mask:
            chiral_masks += 1
        for p in range(1, 6):
            lhs = pc_sum(transpose(mask, p)) + pc_sum(transpose(mask, 11 - p))
            per_mask_checks += 1
            if lhs != 77:
                per_mask_failures.append({
                    "stateId": state_id,
                    "mask": mask,
                    "phase": p,
                    "value": lhs,
                    "chiral": invert(mask) != mask,
                })
                if invert(mask) != mask:
                    chiral_pair_failures += 1
    if per_mask_checks != 462 * 5:
        stop("S-4", f"per-mask check coverage {per_mask_checks}")

    governed_checks = 0
    governed_failures = 0
    for mask in sorted(governed_masks):
        for p in range(1, 6):
            lhs = pc_sum(transpose(mask, p)) + pc_sum(transpose(mask, 11 - p))
            governed_checks += 1
            if lhs != 77:
                governed_failures += 1

    pairwise_checks = 0
    pairwise_failures = []
    for state_id, mask in sorted(census_masks.items()):
        inverted = invert(mask)
        for p in range(12):
            lhs = pc_sum(transpose(mask, p)) + pc_sum(transpose(inverted, 11 - p))
            pairwise_checks += 1
            if lhs != 77:
                pairwise_failures.append({
                    "stateId": state_id,
                    "mask": mask,
                    "phase": p,
                    "value": lhs,
                })
    if pairwise_checks != 5544:
        stop("S-4", f"pairwise coverage {pairwise_checks} != 5544")
    if pairwise_failures:
        stop("S-4", f"pairwise inversion identity failures: {len(pairwise_failures)}")

    orbit_closure = []
    for orbit_id in ALL_ORBIT_IDS:
        members = orbit_members[orbit_id]
        member_set = set(members)
        image = {invert(mask) for mask in members}
        fixed = sorted(mask for mask in member_set if invert(mask) == mask)
        cycles = []
        seen = set()
        for mask in sorted(member_set):
            if mask in seen:
                continue
            partner = invert(mask)
            if partner == mask:
                seen.add(mask)
                continue
            cycles.append([mask, partner])
            seen.add(mask)
            seen.add(partner)
        closed = image == member_set
        if not closed:
            stop("S-4", f"{orbit_id} not closed under I0")
        orbit_closure.append({
            "orbitId": orbit_id,
            "memberCount": len(members),
            "closed": closed,
            "fixedPointCount": len(fixed),
            "twoCycleCount": len(cycles),
            "fixedPointMasks": fixed,
        })

    boundary_set = set(boundary_masks)
    boundary_image = {invert(mask) for mask in boundary_set}
    boundary_closed = boundary_image == boundary_set
    if not boundary_closed:
        stop("S-4", "154 withheld boundary masks not closed under I0")

    orbit_reflection_checks = 0
    orbit_reflection_failures = []
    for orbit_id in ALL_ORBIT_IDS:
        n = len(orbit_members[orbit_id])
        totals = sweep_map[orbit_id]["totals"]
        means = [Fraction(value) for value in sweep_map[orbit_id]["meansExact"]]
        for p in range(6):
            orbit_reflection_checks += 1
            if totals[p] + totals[11 - p] != 77 * n:
                orbit_reflection_failures.append({
                    "orbitId": orbit_id,
                    "phase": p,
                    "kind": "total",
                    "value": totals[p] + totals[11 - p],
                    "expected": 77 * n,
                })
            if means[p] + means[11 - p] != 77:
                orbit_reflection_failures.append({
                    "orbitId": orbit_id,
                    "phase": p,
                    "kind": "mean",
                    "value": str(means[p] + means[11 - p]),
                })
    if orbit_reflection_checks != 60 or orbit_reflection_failures:
        stop("S-4", f"orbit reflection failures: {orbit_reflection_failures}")

    grand_total = sum(
        sweep_map[orbit_id]["totals"][p] for orbit_id in ALL_ORBIT_IDS
    )
    grand_checks = []
    for p in range(6):
        total_p = sum(sweep_map[o]["totals"][p] for o in ALL_ORBIT_IDS)
        total_q = sum(sweep_map[o]["totals"][11 - p] for o in ALL_ORBIT_IDS)
        grand_checks.append({
            "phase": p,
            "total": total_p + total_q,
            "expected": 77 * 308,
            "mean": str(Fraction(total_p + total_q, 308)),
            "match": total_p + total_q == 77 * 308,
        })
    if not all(check["match"] for check in grand_checks):
        stop("S-4", "grand-mean reflection failure")

    return {
        "classification": "ORBIT_INVOLUTION_INVARIANT",
        "perMaskTrivialityFalsification": {
            "censusChecks": per_mask_checks,
            "censusFailures": len(per_mask_failures),
            "chiralMasks": chiral_masks,
            "chiralPairFailures": chiral_pair_failures,
            "witnesses": per_mask_failures[:5],
            "governedChecks": governed_checks,
            "governedFailures": governed_failures,
            "identityFailsOnIndividualChiralMasks": len(per_mask_failures) > 0,
        },
        "pairwiseInversionIdentity": {
            "checks": pairwise_checks,
            "failures": len(pairwise_failures),
            "identity": "pcSum(T_p(M)) + pcSum(T_(11-p)(I0(M))) = 77",
            "value": 77,
        },
        "perOrbitInvolutionClosure": {
            "orbits": orbit_closure,
            "orbitCount": len(orbit_closure),
            "allClosed": True,
            "boundary": {
                "memberCount": len(boundary_set),
                "closed": boundary_closed,
                "fixedPointCount": sum(1 for m in boundary_set if invert(m) == m),
                "twoCycleCount": (len(boundary_set) - sum(1 for m in boundary_set if invert(m) == m)) // 2,
            },
        },
        "perOrbitReflection": {
            "checks": orbit_reflection_checks,
            "failures": len(orbit_reflection_failures),
            "phasePairsPerOrbit": 6,
        },
        "grandMeanReflection": {
            "memberCount": 308,
            "checks": grand_checks,
            "grandTotalAtPhase0": grand_total,
            "allMatch": True,
        },
    }


def candidate_c(orbit_members, sweep_map):
    step_checks = 0
    step_failures = []
    histogram_matches = 0
    histogram_failures = []
    symmetry_checks = 0
    symmetry_failures = []
    ladders = {}
    histograms = {}
    for orbit_id in ALL_ORBIT_IDS:
        members = orbit_members[orbit_id]
        n = len(members)
        totals = sweep_map[orbit_id]["totals"]
        w = []
        for p in range(12):
            delta = totals[(p + 1) % 12] - totals[p]
            numerator = 7 * n - delta
            if numerator % 12 != 0:
                stop("S-4", f"{orbit_id} non-integer wrap at p={p}")
            w.append(numerator // 12)
            step_checks += 1
        if sum(w) != 7 * n:
            stop("S-4", f"{orbit_id} wrap sum {sum(w)} != {7 * n}")
        histogram = {c: sum(1 for mask in members if c in pc_list(mask)) for c in range(12)}
        for p in range(12):
            expected = histogram[(11 - p) % 12]
            if w[p] == expected:
                histogram_matches += 1
            else:
                histogram_failures.append({
                    "orbitId": orbit_id,
                    "phase": p,
                    "wrap": w[p],
                    "histogram": expected,
                })
        for p in range(11):
            symmetry_checks += 1
            if w[p] != w[10 - p]:
                symmetry_failures.append({"orbitId": orbit_id, "phase": p})
        if w[11] != histogram[0] or histogram[0] != n:
            stop("S-4", f"{orbit_id} w_11 != h(0) != n")
        ladders[orbit_id] = w
        histograms[orbit_id] = histogram
    if step_checks != 120 or histogram_matches != 120:
        stop("S-4", f"tomography coverage {step_checks}/{histogram_matches}")
    if histogram_failures or symmetry_failures:
        stop("S-4", "histogram law failures")

    spectra = {
        orbit_id: tuple(sweep_map[orbit_id]["meansExact"]) for orbit_id in ALL_ORBIT_IDS
    }
    pair_checks = 0
    distinct_pairs = 0
    duplicate_pairs = []
    for i, first in enumerate(ALL_ORBIT_IDS):
        for second in ALL_ORBIT_IDS[i + 1:]:
            pair_checks += 1
            if spectra[first] != spectra[second]:
                distinct_pairs += 1
            else:
                duplicate_pairs.append([first, second])
    if pair_checks != 45 or duplicate_pairs:
        stop("S-4", f"spectra duplication: {duplicate_pairs}")

    trajectory = {}
    dispersion = {}
    for orbit_id in ALL_ORBIT_IDS:
        means = [Fraction(value) for value in sweep_map[orbit_id]["meansExact"]]
        spread = max(means) - min(means)
        label = None
        for name, value in DISPERSION_CLASSES.items():
            if spread == value:
                label = name
        if label is None:
            stop("S-4", f"{orbit_id} unclassified spread {spread}")
        trajectory[orbit_id] = {
            "memberCount": sweep_map[orbit_id]["memberCount"],
            "totals": sweep_map[orbit_id]["totals"],
            "meansExact": sweep_map[orbit_id]["meansExact"],
            "wrapLadder": ladders[orbit_id],
            "histogram": [histograms[orbit_id][c] for c in range(12)],
            "spreadExact": str(spread),
            "dispersionClass": label,
        }
        dispersion[orbit_id] = {
            "spreadExact": str(spread),
            "class": label,
        }

    d2 = spectra["ORBIT-D2"]
    d5 = spectra["ORBIT-D5"]
    d2_d5 = {
        "equalPhases": [p for p in range(12) if d2[p] == d5[p]],
        "differingPhases": [p for p in range(12) if d2[p] != d5[p]],
        "equalSpread": str(
            Fraction(max(Fraction(v) for v in d2) - min(Fraction(v) for v in d2))
        )
        == str(Fraction(max(Fraction(v) for v in d5) - min(Fraction(v) for v in d5))),
        "wrapLaddersDistinct": ladders["ORBIT-D2"] != ladders["ORBIT-D5"],
        "d2Wrap": ladders["ORBIT-D2"],
        "d5Wrap": ladders["ORBIT-D5"],
    }
    if not (d2_d5["equalSpread"] and d2_d5["wrapLaddersDistinct"]):
        stop("S-4", "D2/D5 separation failed")

    directive_cross_check = []
    for orbit_id, expected in DIRECTIVE_WRAPS.items():
        actual = ladders[orbit_id]
        if actual != expected:
            directive_cross_check.append({
                "orbitId": orbit_id,
                "directiveWrap": expected,
                "computedWrap": actual,
                "differingPhases": [
                    p for p in range(12) if actual[p] != expected[p]
                ],
                "disposition": (
                    "generator law (7n - delta)/12 governs; directive ladder cell "
                    "is a transcription note, sum(7n) must hold"
                ),
            })
    if directive_cross_check and any(
        item["orbitId"] != "ORBIT-D2" for item in directive_cross_check
    ):
        stop("S-4", "unexpected directive ladder divergence beyond D2 transcription")

    return {
        "classification": "REPRESENTATION_ISOMORPHISM",
        "stepWrapRecovery": {
            "checks": step_checks,
            "failures": len(step_failures),
            "integerWrapLaw": "w_p = (7n - (total_(p+1) - total_p)) / 12",
            "wrapSumLaw": "sum_p w_p = 7n",
        },
        "histogramMatch": {
            "checks": histogram_matches,
            "failures": len(histogram_failures),
            "law": "w_p = h_O((11 - p) mod 12)",
        },
        "histogramSymmetry": {
            "checks": symmetry_checks,
            "failures": len(symmetry_failures),
            "law": "w_p = w_(10-p); w_11 = h(0) = n",
        },
        "distinctSpectra": {
            "orbitCount": len(ALL_ORBIT_IDS),
            "pairChecks": pair_checks,
            "distinctPairs": distinct_pairs,
            "duplicatePairs": duplicate_pairs,
            "allDistinct": True,
        },
        "d2D5Separation": d2_d5,
        "directiveLadderCrossCheck": {
            "matches": len(DIRECTIVE_WRAPS) - len(directive_cross_check),
            "checks": len(DIRECTIVE_WRAPS),
            "notes": directive_cross_check,
        },
        "trajectories": trajectory,
        "dispersion": dispersion,
    }


def candidate_d(sweep_map):
    spreads = []
    variances = []
    means_by_phase = {}
    for p in range(12):
        means = [Fraction(sweep_map[o]["meansExact"][p]) for o in ALL_ORBIT_IDS]
        means_by_phase[p] = means
        spread = max(means) - min(means)
        spreads.append(spread)
        center = sum(means, Fraction(0)) / len(means)
        variance = sum(((value - center) ** 2 for value in means), Fraction(0)) / len(means)
        variances.append(variance)

    zero_set = [p for p in range(12) if spreads[p] == 0]
    if zero_set != [0, 11]:
        stop("S-4", f"coincidence set {zero_set} != [0, 11]")
    mirror_checks = []
    for p in range(12):
        mirror_checks.append({
            "phase": p,
            "mirrorPhase": 11 - p,
            "spreadExact": str(spreads[p]),
            "mirrorSpreadExact": str(spreads[11 - p]),
            "match": spreads[p] == spreads[11 - p],
        })
    if not all(check["match"] for check in mirror_checks):
        stop("S-4", "cross-orbit spread mirror asymmetry")

    interior = [(p, spreads[p]) for p in range(1, 11)]
    interior_min = min(value for _, value in interior)
    interior_min_phases = [p for p, value in interior if value == interior_min]
    global_max = max(spreads)
    global_max_phases = [p for p, value in enumerate(spreads) if value == global_max]
    if interior_min != Fraction(96, 35) or interior_min_phases != [5, 6]:
        stop("S-4", f"interior minimum {interior_min} at {interior_min_phases}")
    if global_max != Fraction(60, 7) or global_max_phases != [3, 8]:
        stop("S-4", f"global maximum {global_max} at {global_max_phases}")

    return {
        "classification": "ORBIT_INVOLUTION_INVARIANT",
        "crossOrbitSpread": {
            "phases": 12,
            "vectorExact": [str(value) for value in spreads],
            "coincidenceSet": zero_set,
            "mirrorSymmetric": True,
            "mirrorChecks": mirror_checks,
        },
        "crossOrbitVariance": {
            "definition": "unweighted variance of the 10 orbit means at each phase",
            "vectorExact": [str(value) for value in variances],
        },
        "extrema": {
            "globalMaxExact": str(global_max),
            "globalMaxPhases": global_max_phases,
            "interiorMinExact": str(interior_min),
            "interiorMinPhases": interior_min_phases,
        },
    }


def main():
    TASKA.mkdir(parents=True, exist_ok=True)
    lock = verify_lock()

    census = json.loads((REPO / "tools/governed-loop/census_462.json").read_text(encoding="utf-8"))
    ground_truth = json.loads(
        (REPO / "tools/governed-loop/frozen_ground_truth.json").read_text(encoding="utf-8")
    )
    sweep = json.loads((REPO / "tools/governed-loop/plv3_sweep.json").read_text(encoding="utf-8"))

    census_masks = {record["stateId"]: record["pitchMask"] for record in census["records"]}
    roles = {record["pitchMask"]: record["role"] for record in census["records"]}
    orbit_map = {orbit["orbitId"]: orbit for orbit in ground_truth["orbits"]}
    sweep_map = {orbit["orbitId"]: orbit for orbit in sweep["orbits"]}
    orbit_members = {
        orbit_id: [census_masks[state_id] for state_id in orbit_map[orbit_id]["memberIds"]]
        for orbit_id in ALL_ORBIT_IDS
    }
    governed_masks = {mask for members in orbit_members.values() for mask in members}
    if len(governed_masks) != 308:
        stop("S-4", f"governed mask count {len(governed_masks)} != 308")
    boundary_masks = [mask for mask, role in roles.items() if role == "boundary"]
    if len(boundary_masks) != 154:
        stop("S-4", f"boundary mask count {len(boundary_masks)} != 154")

    b = candidate_b(census_masks, governed_masks, orbit_members, sweep_map, boundary_masks)
    c = candidate_c(orbit_members, sweep_map)
    d = candidate_d(sweep_map)

    receipt = {
        "schemaVersion": "governed-loop.mvp5-5-task-a.v1",
        "directive": "MVP5.5-DIR-1",
        "task": "TA",
        "status": "COMPLETE",
        "predeclaration": lock,
        "candidateB": b,
        "candidateC": c,
        "candidateD": d,
        "modality": {
            "modality1ExactRational": True,
            "modality1ZeroFloats": True,
            "modality3DiscreteOnly": True,
        },
        "gov517_correspondence_claimed": False,
        "still_set_label": "still_set",
        "stopRulesTriggered": [],
    }
    floats = find_floats(receipt)
    if floats:
        stop("S-5", f"float values in Task A receipt: {floats[:5]}")
    receipt["floatScan"] = {"values": 0, "witnesses": []}
    RECEIPT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("MVP5.5 TASK A COMPLETE")
    print(f"  Candidate B {b['classification']}")
    print(f"    per-mask census failures {b['perMaskTrivialityFalsification']['censusFailures']}/"
          f"{b['perMaskTrivialityFalsification']['censusChecks']} "
          f"(chiral {b['perMaskTrivialityFalsification']['chiralPairFailures']})")
    print(f"    pairwise I0 {b['pairwiseInversionIdentity']['checks'] - b['pairwiseInversionIdentity']['failures']}"
          f"/{b['pairwiseInversionIdentity']['checks']}")
    print(f"    per-orbit reflection {b['perOrbitReflection']['checks'] - b['perOrbitReflection']['failures']}"
          f"/{b['perOrbitReflection']['checks']}")
    print(f"  Candidate C {c['classification']}")
    print(f"    wraps {c['stepWrapRecovery']['checks']}/{c['stepWrapRecovery']['checks']} "
          f"histogram {c['histogramMatch']['checks']}/{c['histogramMatch']['checks']} "
          f"distinct {c['distinctSpectra']['orbitCount']}/{c['distinctSpectra']['orbitCount']}")
    print(f"  Candidate D {d['classification']}")
    print(f"    spread {d['crossOrbitSpread']['vectorExact']}")
    print(f"  receipt sha256 {sha256_file(RECEIPT)}")


if __name__ == "__main__":
    main()
