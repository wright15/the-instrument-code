#!/usr/bin/env python3
"""PLV3-REG-1 post-landing: pre-declare, then run the 12-phase orbit sweep.

--predeclare  locks the 41-at-T11 expectation from spike01_evidence.json
--run         verifies the lock, runs the sweep, writes plv3_sweep.json

Fail-closed. Divergence is a STOP (exit 2), never an in-session correction.
"""
import argparse
import hashlib
import json
import sys
from fractions import Fraction

SCRATCH = "/home/erick/workspace/governed-loop"
EVIDENCE = "spike01_evidence.json"
EVIDENCE_SHA = "cb170c0d00cea3f2db2b69779dc339848befa60f5a78d257c8680f99f6e56fec"
PREDECL = "plv3_sweep_predeclared.json"
RECEIPT = "plv3_sweep.json"


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def fail(msg):
    print(f"FAIL-CLOSED: {msg}")
    sys.exit(1)


def pc_list(mask):
    return [i for i in range(12) if (mask >> i) & 1]


def pc_sum(mask):
    return sum(pc_list(mask))


def transpose(mask, c):
    r = 0
    for pc in pc_list(mask):
        r |= 1 << ((pc + c) % 12)
    return r


def load_evidence():
    actual = sha256_file(f"{SCRATCH}/{EVIDENCE}")
    if actual != EVIDENCE_SHA:
        fail(f"{EVIDENCE} hash {actual} != {EVIDENCE_SHA}")
    return json.load(open(f"{SCRATCH}/{EVIDENCE}"))


def predeclare():
    evidence = load_evidence()
    t1 = evidence["T1_41"]
    if t1["allOrbitsExact41"] is not True:
        fail("Spike-01 allOrbitsExact41 is not true")
    means = {
        spread["orbitId"]: spread["means"][11]
        for spread in t1["orbitPhaseSpreads"]
    }
    if len(means) != 10:
        fail(f"expected 10 orbit spreads, found {len(means)}")
    if any(value != 41.0 for value in means.values()):
        fail(f"Spike-01 T11 means are not all 41.0: {means}")
    body = {
        "schemaVersion": "governed-loop.plv3-sweep-predeclaration.v1",
        "status": "locked-before-sweep",
        "derivedFrom": {
            "path": EVIDENCE,
            "sha256": EVIDENCE_SHA,
            "fields": [
                "T1_41.allOrbitsExact41",
                "T1_41.orbitPhaseSpreads[].means[11]",
            ],
            "statement": ("the recorded 41-at-T11 prediction is derived from the realm's Spike-01 "
                          "artifacts, not from the directive"),
        },
        "derivation": ("T1_41.allOrbitsExact41 is true and every orbitPhaseSpreads[].means[11] "
                        "equals 41.0; the phase-11 result is 36 + 5 under the wrap-count identity."),
        "expectation": {
            "T11": {
                "allOrbitsExact41": True,
                "perOrbitMeans": means,
                "integerRule": "phase-11 pcSum total = 41 * memberCount for every orbit",
            }
        },
        "sweepDefinition": ("For each of the 10 orbits and each phase p in 0..11, compute the mean "
                            "pcSum of the orbit's lifted members T_p(mask); exact integer arithmetic. "
                            "The recorded prediction is the phase-11 mean."),
        "falsification": ("Any orbit whose phase-11 mean is not exactly 41 fires alpha's falsification "
                          "shape: STOP, report, escalate; no in-session correction."),
        "licenseContext": ("The sweep runs against the Policy-v3 licensed transition set: 5,040 "
                           "cross-phase lifted R1/L1 edges. Family B's 90 same-phase bridges are "
                           "outside it."),
    }
    body["predeclarationHash"] = hashlib.sha256(
        canonical(body).encode("utf-8")
    ).hexdigest()
    with open(f"{SCRATCH}/{PREDECL}", "w") as f:
        json.dump(body, f, indent=2, sort_keys=True)
        f.write("\n")
    print("SWEEP PRE-DECLARED")
    print(f"  evidence pin {EVIDENCE_SHA[:16]}...")
    for orbit_id, mean in sorted(means.items()):
        print(f"  {orbit_id}: T11 mean {mean}")
    print(f"  predeclaration hash {body['predeclarationHash'][:16]}...")


def run():
    evidence = load_evidence()
    pre = json.load(open(f"{SCRATCH}/{PREDECL}"))
    body = {k: v for k, v in pre.items() if k != "predeclarationHash"}
    actual_hash = hashlib.sha256(canonical(body).encode("utf-8")).hexdigest()
    if actual_hash != pre["predeclarationHash"]:
        fail("pre-declaration hash mismatch; the lock was altered")
    if pre["derivedFrom"]["sha256"] != EVIDENCE_SHA:
        fail("pre-declaration evidence pin mismatch")
    if evidence["T1_41"]["allOrbitsExact41"] is not True:
        fail("Spike-01 allOrbitsExact41 is not true")

    gt = json.load(open(f"{SCRATCH}/frozen_ground_truth.json"))
    census = json.load(open(f"{SCRATCH}/census_462.json"))
    masks = {r["stateId"]: r["pitchMask"] for r in census["records"]}
    if len(masks) != 462:
        fail(f"census cardinality {len(masks)} != 462")

    # Wrap-count identity: independent arithmetic re-run.
    wrap_checks = 0
    wrap_failures = []
    for mask in masks.values():
        k = len(pc_list(mask))
        base = pc_sum(mask)
        for c in range(12):
            delta = pc_sum(transpose(mask, c)) - base
            wraps = sum(1 for pc in pc_list(mask) if pc + c >= 12)
            expected = c * k - 12 * wraps
            wrap_checks += 1
            if delta != expected:
                wrap_failures.append({"mask": mask, "phase": c, "delta": delta, "expected": expected})

    # 12-phase orbit sweep.
    results = []
    all_exact = True
    for orbit in gt["orbits"]:
        members = orbit["memberIds"]
        n = len(members)
        totals = []
        means = []
        for p in range(12):
            total = sum(pc_sum(transpose(masks[m], p)) for m in members)
            totals.append(total)
            means.append(Fraction(total, n))
        phase11_total = totals[11]
        phase11_exact = (phase11_total == 41 * n)
        if not phase11_exact:
            all_exact = False
        results.append({
            "orbitId": orbit["orbitId"],
            "tier": orbit["tier"],
            "memberCount": n,
            "phase0Mean": str(means[0]),
            "phase11Mean": str(means[11]),
            "phase11Total": phase11_total,
            "phase11ExpectedTotal": 41 * n,
            "phase11Exact41": phase11_exact,
            "totals": totals,
            "meansExact": [str(value) for value in means],
            "meansDecimal": [round(float(value), 4) for value in means],
            "spread": round(float(max(means) - min(means)), 4),
        })

    catalog = json.load(open(f"{SCRATCH}/seam_legal_moves_v3.json"))
    substrate = json.load(open(f"{SCRATCH}/frozen_seam_substrate_v3.json"))
    receipt = {
        "schemaVersion": "governed-loop.plv3-sweep.v1",
        "receiptId": "alpha-sweep-receipt",
        "decision": "alpha",
        "scope": "12-phase orbit sweep against the Policy-v3 licensed transition set",
        "predeclaration": {
            "path": PREDECL,
            "sha256": sha256_file(f"{SCRATCH}/{PREDECL}"),
            "predeclarationHash": pre["predeclarationHash"],
            "status": "verified-before-run",
        },
        "licensedSet": {
            "edgeCount": substrate["crossPhaseTransitionSet"]["edgeCount"],
            "raised": substrate["crossPhaseTransitionSet"]["raised"],
            "lowered": substrate["crossPhaseTransitionSet"]["lowered"],
            "edgeSetDigest": substrate["crossPhaseTransitionSet"]["edgeSetDigest"],
            "carries": substrate["crossPhaseTransitionSet"]["carries"],
            "familyBOutside": substrate["familyBClassification"]["classification"],
            "catalogFingerprint": catalog["catalogFingerprint"],
        },
        "wrapCountIdentity": {
            "checks": wrap_checks,
            "failures": len(wrap_failures),
            "failureWitnesses": wrap_failures[:5],
            "identityHolds": len(wrap_failures) == 0,
        },
        "orbits": results,
        "allOrbitsExact41": all_exact,
        "verdict": "PASS" if all_exact and not wrap_failures else "FAIL",
        "alphaReceiptLevelCheck": "confirmed" if all_exact else "falsified",
    }
    with open(f"{SCRATCH}/{RECEIPT}", "w") as f:
        json.dump(receipt, f, indent=2, sort_keys=True)
        f.write("\n")

    print("SWEEP")
    print(f"  wrap-count identity: {wrap_checks} checks, {len(wrap_failures)} failures")
    for r in results:
        print(f"  {r['orbitId']:9s} n={r['memberCount']:2d} T11 {r['phase11Total']:4d} "
              f"(expected {r['phase11ExpectedTotal']:4d}) exact={r['phase11Exact41']}")
    print(f"  verdict: {receipt['verdict']} | alpha receipt-level check: {receipt['alphaReceiptLevelCheck']}")
    if not (all_exact and not wrap_failures):
        print("STOP: alpha falsification fired; escalate to the Planning Seat. No in-session correction.")
        sys.exit(2)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--predeclare", action="store_true")
    parser.add_argument("--run", action="store_true")
    args = parser.parse_args()
    if args.predeclare == args.run:
        fail("choose exactly one of --predeclare or --run")
    predeclare() if args.predeclare else run()
