#!/usr/bin/env python3
"""MVP3 Task 0 census: E-10 withheld boundary + E-11/E-13 candidate census + A-10 vocabulary.

Read-only over the scratch harness. Every value is derived at runtime from bytes.
"""
import importlib.util
import json
import sys

SCRATCH = "/home/erick/workspace/scratch-governed-loop-run"
NODE_PHASES = 12


def load_bridge():
    spec = importlib.util.spec_from_file_location(
        "orrery_nav_bridge_census", f"{SCRATCH}/orrery_nav_bridge.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    bridge = load_bridge()
    model = bridge.Model()
    world = model.world

    roles = {}
    for sid, role in model.role.items():
        roles[role] = roles.get(role, 0) + 1
    withheld = sorted(sid for sid in model.masks if model.gov_root[sid] is None)
    withheld_role_mismatch = [sid for sid in withheld if model.role[sid] != "boundary"]
    governed = sorted(sid for sid in model.masks if model.gov_root[sid] is not None)

    family_a = {}
    for edge in model.catalog["familyA"]["edges"]:
        operator, src, sp, tgt, tp, intra, boundary = edge
        expected_tp = (sp + int(model.sub3["carries"][operator])) % NODE_PHASES
        if tp != expected_tp:
            raise SystemExit(f"carry mismatch on {operator}:{src}@{sp}->{tgt}@{tp}")
        family_a.setdefault((int(src), int(sp)), []).append((int(tgt), int(tp)))
    family_b = {}
    for edge in model.catalog["familyB"]["edges"]:
        left, right = int(edge["leftMask"]), int(edge["rightMask"])
        if int(edge.get("phaseDistance", 0)) != 0:
            raise SystemExit(f"familyB phaseDistance != 0 on {edge['id']}")
        for phase in range(NODE_PHASES):
            family_b.setdefault((left, phase), set()).add((right, phase))
            family_b.setdefault((right, phase), set()).add((left, phase))

    def assemble(mask, phase):
        root = model.gov_root[mask]
        tier1 = [(int(t), phase) for t in sorted(model.families[root])]
        seam_a = family_a.get((mask, phase), [])
        seam_b = sorted(family_b.get((mask, phase), set()))
        merged = []
        seen = set()
        for cand in tier1 + seam_a + seam_b:
            if cand not in seen:
                seen.add(cand)
                merged.append(cand)
        return {
            "tier1": len(tier1),
            "familyA_seam": len(seam_a),
            "familyB_seam": len(seam_b),
            "merged": len(merged),
            "candidates": merged,
        }

    counts = []
    pairwise = set()
    verdict_counts = {}
    rejects = []
    gate_calls = 0

    for mask in governed:
        for phase in range(NODE_PHASES):
            asm = assemble(mask, phase)
            counts.append({
                "node": f"{mask}@{phase}",
                "tier1": asm["tier1"],
                "familyA_seam": asm["familyA_seam"],
                "familyB_seam": asm["familyB_seam"],
                "merged": asm["merged"],
            })
            for cand_mask, cand_phase in asm["candidates"]:
                verdict, reasons, checks, citation = world.gate(
                    (mask, phase), (cand_mask, cand_phase))
                gate_calls += 1
                key = (verdict, tuple(reasons))
                verdict_counts[key] = verdict_counts.get(key, 0) + 1
                if verdict != "ACCEPT":
                    rejects.append({
                        "from": f"{mask}@{phase}",
                        "to": f"{cand_mask}@{cand_phase}",
                        "verdict": verdict,
                        "reasons": reasons,
                        "citation": citation,
                    })
            for a in asm["candidates"]:
                for b in asm["candidates"]:
                    if a < b:
                        pairwise.add(((mask, phase), a, b))
            if len(asm["candidates"]) > len({c for c in asm["candidates"]}):
                raise SystemExit("internal dedupe failure")

    merged_values = [c["merged"] for c in counts]
    tier1_values = [c["tier1"] for c in counts]
    fa_values = [c["familyA_seam"] for c in counts]
    fb_values = [c["familyB_seam"] for c in counts]
    total = sum(merged_values)

    # Declared negative probes: exercise the pinned rejection vocabulary once.
    probe_nodes = [("not-census-state", None), ("ungoverned-transition", None),
                   ("unlicensed-transition", None)]
    non_census = next(m for m in range(4096) if m not in model.masks)
    boundary_mask = withheld[0]
    probe_results = []
    probes = [
        ("not-census-state", (governed[0], 0), (non_census, 0)),
        ("ungoverned-transition", (boundary_mask, 0), (boundary_mask, 0)),
    ]
    found_unlicensed = None
    for mask in governed:
        for phase in range(NODE_PHASES):
            for cand in sorted(model.masks):
                if cand == mask:
                    continue
                verdict, reasons, checks, citation = world.gate((mask, phase), (cand, phase))
                gate_calls += 1
                key = (verdict, tuple(reasons))
                verdict_counts[key] = verdict_counts.get(key, 0) + 1
                if verdict == "REJECT" and reasons == ["unlicensed-transition"]:
                    found_unlicensed = ((mask, phase), (cand, phase), reasons)
                    break
            if found_unlicensed:
                break
        if found_unlicensed:
            break
    if found_unlicensed:
        probes.append(("unlicensed-transition", found_unlicensed[0], found_unlicensed[1]))
    else:
        raise SystemExit("no unlicensed-transition witness found")
    for label, src, dst in probes:
        verdict, reasons, checks, citation = world.gate(src, dst)
        gate_calls += 1
        key = (verdict, tuple(reasons))
        verdict_counts[key] = verdict_counts.get(key, 0) + 1
        probe_results.append({
            "expected_reason": label,
            "source": f"{src[0]}@{src[1]}",
            "target": f"{dst[0]}@{dst[1]}",
            "verdict": verdict,
            "reasons": reasons,
        })

    observed_pairs = sorted(
        [[decision, (reasons[0] if reasons else None)] for decision, reasons in verdict_counts]
    )
    pinned_pairs = sorted([
        ["ACCEPT", None],
        ["REJECT", "not-census-state"],
        ["REJECT", "ungoverned-transition"],
        ["REJECT", "unlicensed-transition"],
    ])
    observed_subset = all(pair in pinned_pairs for pair in observed_pairs)

    result = {
        "generated_at_measurement": __import__("datetime").datetime.now(
            __import__("datetime").timezone.utc).isoformat(),
        "roles": roles,
        "withheld_boundary": {
            "count": len(withheld),
            "role_mismatch": withheld_role_mismatch,
            "semantics": "governingRoot is None; reachable/escapable only via seam; "
                         "withheld from governing and camping",
        },
        "census_population": {
            "definition": "all governed lifted states: census masks with governingRoot != None "
                          "(anchors + satellites) across all 12 phases",
            "governed_masks": len(governed),
            "covered_nodes": len(counts),
        },
        "candidate_census": {
            "min": min(merged_values),
            "max": max(merged_values),
            "mean": total / len(merged_values),
            "total": total,
            "nodes_measured": len(counts),
            "tier1_max": max(tier1_values),
            "familyA_max": max(fa_values),
            "familyB_max": max(fb_values),
            "fence_max": 15,
        },
        "gate_calls": gate_calls,
        "gate_vocabulary_observed": {
            "observed_pairs": observed_pairs,
            "observed_subset_of_pinned": observed_subset,
            "verdict_counts": [
                {"verdict": verdict, "reasons": list(reasons), "count": n}
                for (verdict, reasons), n in sorted(
                    verdict_counts.items(), key=lambda kv: (kv[0][0], kv[0][1]))
            ],
            "negative_probes": probe_results,
        },
        "violations": {
            "rejects_in_census": rejects,
            "min_below_one": min(merged_values) < 1,
            "max_above_fifteen": max(merged_values) > 15,
        },
    }
    out = f"{SCRATCH}/mvp3_census_measurements.json"
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(result, handle, indent=2, sort_keys=True)
        handle.write("\n")
    print(json.dumps({
        "withheld": len(withheld),
        "roles": roles,
        "covered_nodes": len(counts),
        "min": min(merged_values),
        "mean": round(total / len(merged_values), 6),
        "max": max(merged_values),
        "tier1_max": max(tier1_values),
        "familyA_max": max(fa_values),
        "familyB_max": max(fb_values),
        "gate_calls": gate_calls,
        "observed_pairs": observed_pairs,
        "subset": observed_subset,
        "rejects_in_census": len(rejects),
        "probes": probe_results,
    }, indent=2))
    if rejects or min(merged_values) < 1 or max(merged_values) > 15 or not observed_subset:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
