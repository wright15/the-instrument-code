#!/usr/bin/env python3
import importlib.util
import json
import os

from mvp4_symbolic_planner import Planner, parse_node, node_id

SCRATCH = os.environ.get("GOVERNED_LOOP_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp4")

TOOL_SCHEMAS = {
    "get_neighborhood": {
        "description": "Read-only node audit, boundary status, and legal outbound menu.",
        "args": {"node_id": "mask@phase", "card_state": "optional {order:[node_id,...]} or {scores:{node_id:int}}"},
    },
    "explain_veto": {
        "description": "Deterministic gate veto diagnostic with checks and canonical explanation.",
        "args": {"source_id": "mask@phase", "candidate_id": "mask@phase"},
    },
    "query_path": {
        "description": "Deterministic BFS shortest legal path(s) over the 5,544-node graph.",
        "args": {"source_id": "mask@phase", "target_spec": "mask@phase | office", "max_paths": "int <= 3"},
    },
    "step_intra_node_q": {
        "description": "Task C intra-node Q-engine overlay step inside a held macro node.",
        "args": {"node_id": "mask@phase", "q_state": "int 0..15", "z_step": "int", "still_behavior": "fixed"},
    },
}


def canonical_veto_explanation(verdict, reasons, checks, citation, source, candidate):
    current_root = checks.get("current_governing_root")
    candidate_root = checks.get("candidate_governing_root")
    phase_delta = checks.get("phaseDelta")
    hamming = checks.get("hamming")
    membership = checks.get("candidate_membership")
    if verdict == "ACCEPT":
        via = citation if citation else "Tier-1 same-family same-phase"
        return (f"ACCEPT: {source} -> {candidate} is legal via {via}; "
                f"governingRoot={current_root}, phaseDelta={phase_delta}, hamming={hamming}.")
    reason = reasons[0] if reasons else "unknown"
    if reason == "not-census-state":
        return (f"REJECT not-census-state: candidate {candidate} is not in the 462-mask census "
                f"(candidate_membership={str(membership).lower()}); no gate rule can apply.")
    if reason == "ungoverned-transition":
        return (f"REJECT ungoverned-transition: boundary endpoint present; "
                f"current governingRoot={current_root}, candidate governingRoot={candidate_root}. "
                f"Boundary states can be transited but cannot govern or be camped on.")
    return (f"REJECT unlicensed-transition: current governingRoot={current_root}, "
            f"candidate governingRoot={candidate_root}, phaseDelta={phase_delta}, hamming={hamming}; "
            f"no licensed Family A R1/L1 or Family B bridge seam matches.")


class SymbolicTools:
    def __init__(self, planner=None):
        self.planner = planner or Planner()
        self.calls = []

    def _record(self, name, args, result):
        self.calls.append({"tool": name, "args": args, "result": result})

    def get_neighborhood(self, node_id, card_state=None):
        result = self.planner.neighborhood(node_id, card_state=card_state)
        self._record("get_neighborhood", {"node_id": node_id, "card_state": card_state}, result)
        return result

    def explain_veto(self, source_id, candidate_id):
        source_mask, source_phase = parse_node(source_id)
        candidate_mask, candidate_phase = parse_node(candidate_id)
        verdict, reasons, checks, citation = self.planner.world.gate(
            (source_mask, source_phase), (candidate_mask, candidate_phase))
        checks = dict(checks)
        candidate_in_census = candidate_mask in self.planner.masks
        source_in_census = source_mask in self.planner.masks
        checks["candidate_membership"] = candidate_in_census
        checks["phaseDelta"] = (candidate_phase - source_phase) % 12
        if source_in_census:
            checks["hamming"] = bin(self.planner.masks[source_mask] ^ self.planner.masks[candidate_mask]).count("1") if candidate_in_census else None
            checks["current_audit"] = self.planner.node_audit(source_id)
        else:
            checks["hamming"] = None
            checks["current_audit"] = None
        checks["candidate_audit"] = self.planner.node_audit(candidate_id) if candidate_in_census else None
        checks["current_governing_root"] = self.planner.gov_root.get(source_mask) if source_in_census else None
        checks["candidate_governing_root"] = self.planner.gov_root.get(candidate_mask) if candidate_in_census else None
        checks["same_family"] = (checks["current_governing_root"] is not None
                                 and checks["current_governing_root"] == checks["candidate_governing_root"])
        checks["boundary_endpoint"] = (checks["current_governing_root"] is None
                                       or checks["candidate_governing_root"] is None)
        explanation = canonical_veto_explanation(verdict, reasons, checks, citation,
                                                 source_id, candidate_id)
        result = {
            "source": source_id, "candidate": candidate_id,
            "verdict": verdict, "reasons": list(reasons), "citation": citation,
            "checks": checks, "canonicalExplanation": explanation,
        }
        self._record("explain_veto", {"source_id": source_id, "candidate_id": candidate_id}, result)
        return result

    def query_path(self, source_id, target_spec, max_paths=3):
        max_paths = max(1, min(int(max_paths), 3))
        result = self.planner.shortest_paths(source_id, target_spec, max_paths=max_paths)
        self._record("query_path", {"source_id": source_id, "target_spec": target_spec,
                                    "max_paths": max_paths}, result)
        return result

    def step_intra_node_q(self, node_id, q_state, z_step=1, still_behavior="fixed"):
        module_path = os.path.join(SCRATCH, "task-c", "mvp4_q_intra_node.py")
        args = {"node_id": node_id, "q_state": int(q_state), "z_step": int(z_step),
                "still_behavior": still_behavior}
        if not os.path.exists(module_path):
            result = {
                "status": "OVERLAY_NOT_STAGED",
                "node_id": node_id,
                "q_state": int(q_state),
                "z_step": int(z_step),
                "still_behavior": still_behavior,
                "reason": "Task C module mvp4_q_intra_node.py is not staged yet; contract-only response.",
                "gateBytesTouched": False,
            }
            self._record("step_intra_node_q", args, result)
            return result
        spec = importlib.util.spec_from_file_location("mvp4_q_intra_node_task_b", module_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        if hasattr(module, "step_intra_node"):
            result = module.step_intra_node(node_id, int(q_state), int(z_step), still_behavior)
        elif hasattr(module, "step"):
            result = module.step(node_id, int(q_state), int(z_step), still_behavior)
        else:
            result = {"status": "OVERLAY_MODULE_CONTRACT_MISSING", "module": module_path}
        self._record("step_intra_node_q", args, result)
        return result
