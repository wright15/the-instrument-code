#!/usr/bin/env python3
"""MVP-2a dispute analysis: count, cluster, band-classify, name targets.

Bands (documented heuristic, per the MVP-2 directive §7):
  none       zero disputes logged
  sparse     disputes present but too few or too unpatterned for a finding
  clustered  two or more disputes sharing a cluster key (reason + context);
             named as candidate policy-refinement targets
  global     at least four disputes, no repeated cluster key, and either a
             dispute rate >= 25% of vetoes or >= 4 distinct context clusters

Cluster key: (primary reason, current governing root or candidate role,
choice kind prefix). A dispute is calibration data, never an appeal.
"""
import argparse
import json
import sys
from collections import Counter, defaultdict

SCRATCH = "/home/erick/workspace/governed-loop"


def analyze(paths):
    lines = []
    for p in paths:
        for raw in open(p):
            raw = raw.strip()
            if raw:
                lines.append((p, json.loads(raw)))
    total = len(lines)
    vetoes = [l for _, l in lines if l["verdict"] == "REJECT"]
    disputes = [(p, l) for p, l in lines if l.get("dispute")]
    accepts = total - len(vetoes)
    reasons = Counter()
    for l in vetoes:
        for r in l.get("reasons", []):
            reasons[r] += 1

    clusters = defaultdict(list)
    for p, l in disputes:
        aud = l["checks"].get("candidate_audit", {})
        root = l["checks"].get("current_governing_root")
        choice_kind = (l.get("choice") or "mixed-random").split(":")[0]
        key = (
            l["reasons"][0] if l.get("reasons") else "none",
            f"root={root}" if root is not None else f"candidateRole={aud.get('role')}",
            choice_kind,
        )
        clusters[key].append({"file": p, "seq": l["seq"], "candidate": l["candidate"],
                              "mask": l["candidate"][0], "reason": l["reasons"][0] if l.get("reasons") else None})

    dispute_rate_of_vetoes = len(disputes) / len(vetoes) if vetoes else 0.0
    if not disputes:
        band = "none"
    elif max(len(v) for v in clusters.values()) >= 2:
        band = "clustered"
    elif len(disputes) >= 4 and (dispute_rate_of_vetoes >= 0.25 or len(clusters) >= 4):
        band = "global"
    else:
        band = "sparse"

    targets = []
    if band == "clustered":
        for key, items in sorted(clusters.items(), key=lambda kv: -len(kv[1])):
            if len(items) >= 2:
                targets.append({
                    "cluster": {"reason": key[0], "context": key[1], "choiceKind": key[2]},
                    "count": len(items),
                    "candidates": [i["mask"] for i in items],
                    "note": "candidate policy-refinement target (successor entry scope; no disposition claimed)",
                })

    return {
        "files": paths,
        "totalLines": total,
        "accepts": accepts,
        "vetoes": len(vetoes),
        "disputes": len(disputes),
        "disputeRateOfVetoes": round(dispute_rate_of_vetoes, 4),
        "vetoReasons": dict(sorted(reasons.items())),
        "clusters": {
            f"{k[0]} | {k[1]} | {k[2]}": len(v) for k, v in sorted(clusters.items(), key=lambda kv: -len(kv[1]))
        },
        "band": band,
        "refinementTargets": targets,
        "disputeLines": [
            {"seq": l["seq"], "candidate": l["candidate"], "reason": l["reasons"][0] if l.get("reasons") else None,
             "choice": l.get("choice")}
            for _, l in disputes
        ],
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("logs", nargs="+")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    report = analyze(args.logs)
    text = json.dumps(report, indent=2, sort_keys=True)
    print(text)
    if args.out:
        with open(args.out, "w") as f:
            f.write(text + "\n")


if __name__ == "__main__":
    main()
