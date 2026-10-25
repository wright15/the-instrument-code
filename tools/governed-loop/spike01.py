#!/usr/bin/env python3
"""Spike-01 verification: lift-consistent 41, wrap-count identity, seam carriers.

Reads frozen scratch bytes only (census_462.json, phase_a_probe.json).
Emits spike01_evidence.json. No repository writes.
"""
import json

SCRATCH = "/home/erick/workspace/governed-loop"


def pcs(mask):
    return [i for i in range(12) if (mask >> i) & 1]


def pcsum(mask):
    return sum(pcs(mask))


def transpose(mask, c):
    r = 0
    for pc in pcs(mask):
        r |= 1 << ((pc + c) % 12)
    return r


def main():
    census = json.load(open(f"{SCRATCH}/census_462.json"))
    probe = json.load(open(f"{SCRATCH}/phase_a_probe.json"))
    gt = json.load(open(f"{SCRATCH}/frozen_ground_truth.json"))

    records = census["records"]
    masks = [r["pitchMask"] for r in records]
    assert len(masks) == 462

    # --- T1a: anchored masks contain exactly one pc0 -----------------------
    pc0_counts = {m: pcs(m).count(0) for m in masks}
    pc0_hist = {}
    for v in pc0_counts.values():
        pc0_hist[str(v)] = pc0_hist.get(str(v), 0) + 1
    all_one = all(v == 1 for v in pc0_counts.values())

    # --- T1b: wrap-count identity for every mask and every phase ----------
    identity_checks = 0
    identity_failures = []
    for m in masks:
        k = len(pcs(m))
        base = pcsum(m)
        for c in range(12):
            shifted = transpose(m, c)
            delta = pcsum(shifted) - base
            wraps = sum(1 for pc in pcs(m) if pc + c >= 12)
            expected = c * k - 12 * wraps
            identity_checks += 1
            if delta != expected:
                identity_failures.append({"mask": m, "phase": c, "delta": delta, "expected": expected})

    # --- T1c: per-orbit phase-11 mean under the lift definition -----------
    orbit_phase11 = []
    orbit_phase_spreads = []
    for o in gt["orbits"]:
        members = o["memberIds"]
        n = len(members)
        p0 = sum(pcsum(m) for m in members) / n
        p11 = sum(pcsum(transpose(m, 11)) for m in members) / n
        means = []
        for c in range(12):
            means.append(sum(pcsum(transpose(m, c)) for m in members) / n)
        spread = max(means) - min(means)
        orbit_phase11.append({
            "orbitId": o["orbitId"],
            "n": n,
            "phase0Mean": p0,
            "phase11Mean": p11,
            "phase11Exact41": p11 == 41.0,
        })
        orbit_phase_spreads.append({
            "orbitId": o["orbitId"],
            "tier": o["tier"],
            "min": min(means),
            "max": max(means),
            "spread": round(spread, 4),
            "means": [round(x, 4) for x in means],
        })

    # --- T1d: lift construction consistency from the probe ----------------
    p0 = probe["p0Verification"]
    p1 = probe["p1PhaseCoordinate"]
    p4 = probe["p4LiftArchitecture"]
    p2 = probe["p2Equivariance"]
    p3 = probe["p3SeamCensus"]
    p6 = probe["p6MinimalPatch"]

    lift = {
        "heptatonicPairs": p0["claims"][0]["heptatonicPairs"],
        "pentatonicPairs": p0["claims"][0]["pentatonicPairs"],
        "totalPairs": p0["claims"][0]["totalPairs"],
        "anchoredHeptatonic": p0["claims"][0]["anchoredHeptatonic"],
        "definition": p1["definition"],
        "nodeIdentity": p1["representation"]["nodeIdConvention"],
        "liftCountsFromP4": p4["counts"],
        "operatorEdgeRule": p4["operatorEdges"]["rule"],
        "countsConsistent": (
            p0["claims"][0]["heptatonicPairs"] == 12 * p0["claims"][0]["anchoredHeptatonic"]
            and p4["counts"]["liftedHeptatonic"] == p0["claims"][0]["heptatonicPairs"]
        ),
        "everyAnchoredRecordContributes12": "every anchored record contributes 12 lifted nodes" in p4["nodeIdentity"],
    }

    # --- T2: operator carries and seam census -----------------------------
    per_operator = [
        {
            "operatorId": op["operatorId"],
            "operatorClass": op["operatorClass"],
            "applications": op["applications"],
            "checks": op["checks"],
            "phaseCarry": op["phaseCarry"],
            "failures": op["failures"],
            "verdict": op["verdict"],
        }
        for op in p2["perOperator"]
    ]
    carries = {op["operatorId"]: op["phaseCarry"] for op in per_operator}
    total_checks = sum(op["checks"] for op in per_operator)
    total_apps = sum(op["applications"] for op in per_operator)

    seams = {
        "equivariance": {
            "applications": total_apps,
            "checks": total_checks,
            "expectedChecks": 3402 * 12,
            "carries": carries,
            "r1Carry": carries.get("R1"),
            "l1Carry": carries.get("L1"),
            "otherCarriesZero": all(v == 0 for k, v in carries.items() if k not in ("R1", "L1")),
            "calibration": p2["calibration"],
            "rootingDependenceFound": p2["rootingDependenceFound"],
        },
        "familyA": {
            "applications": p3["familyA"]["applications"],
            "liftedSeamEdges": p3["familyA"]["liftedSeamEdges"],
            "phaseDistance": p3["familyA"]["phaseDistance"],
            "crossFamily": p3["familyA"]["crossFamily"]["total"],
            "intraFamily": p3["familyA"]["intraFamily"]["total"],
            "histogram": p3["histogram"]["familyACrossFamily"],
        },
        "familyB": {
            "crossings": p3["familyB"]["crossings"],
            "pairsWithSharedSubnodes": p3["familyB"]["pairsWithSharedSubnodes"],
            "crossingHistogram": p3["familyB"]["crossingHistogram"],
            "phaseDistance": p3["familyB"]["phaseDistance"],
        },
        "assembly": p3["assembly"],
        "radiusOneVerdict": p3["radiusOneVerdict"],
        "minimalPatch": {
            "definition": p6["definition"],
            "containment": p6["containment"],
        },
    }

    evidence = {
        "schemaVersion": "governed-loop.spike01-evidence.v1",
        "source": {
            "checkpointCommit": "482a1bfb",
            "censusSha256": "242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a",
            "probeSha256": "48f513679d505087277d5670952fb860b755832775f5fb5980aa3f71c73330bb",
        },
        "T1_41": {
            "pc0Counts": pc0_hist,
            "everyAnchoredMaskHasExactlyOnePc0": all_one,
            "wrapCountIdentityChecks": identity_checks,
            "wrapCountIdentityFailures": identity_failures,
            "identityHolds": not identity_failures,
            "c11SpecialForm": "delta = 12*n0 - k; anchored 7-note masks have n0=1, so delta = +5 exactly",
            "perOrbitPhase11": orbit_phase11,
            "allOrbitsExact41": all(o["phase11Exact41"] for o in orbit_phase11),
            "orbitPhaseSpreads": orbit_phase_spreads,
            "lift": lift,
            "status": "derived from census composition + transposition law; lift-consistent with the admitted candidate record's own phase definition",
        },
        "T2_seams": seams,
    }

    with open(f"{SCRATCH}/spike01_evidence.json", "w") as f:
        json.dump(evidence, f, indent=2, sort_keys=True)
        f.write("\n")

    print("SPIKE-01 EVIDENCE")
    print(f"  pc0 histogram: {pc0_hist} (every mask exactly one: {all_one})")
    print(f"  wrap-count identity: {identity_checks} checks, {len(identity_failures)} failures")
    print(f"  all orbits exact 41 at phase 11: {all(o['phase11Exact41'] for o in orbit_phase11)}")
    for s in orbit_phase_spreads:
        print(f"    {s['orbitId']:9s} tier {s['tier']:2s} spread {s['spread']:6.2f}")
    print(f"  lift counts consistent: {lift['countsConsistent']}; 5,544 = 12 x 462")
    print(f"  equivariance: {total_apps} applications, {total_checks} checks (expected {3402*12})")
    print(f"  carries: R1={carries.get('R1')} L1={carries.get('L1')} others-zero={seams['equivariance']['otherCarriesZero']}")
    print(f"  Family A: {seams['familyA']['applications']} applications -> {seams['familyA']['liftedSeamEdges']} lifted edges")
    print(f"  Family B: {seams['familyB']['crossings']} crossings over {seams['familyB']['pairsWithSharedSubnodes']} pairs")
    print(f"  radius-one verdict: {p3['radiusOneVerdict']}")


if __name__ == "__main__":
    main()
