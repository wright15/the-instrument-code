#!/usr/bin/env python3
import collections
import importlib.util
import json
import os

SCRATCH = os.environ.get("GOVERNED_LOOP_SCRATCH", "/home/erick/workspace/scratch-governed-loop-run/mvp4")
NODE_PHASES = 12


def load_world():
    spec = importlib.util.spec_from_file_location("frozen_mvp2_task_b", os.path.join(SCRATCH, "mvp2.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.World()


def parse_node(node_id):
    text = str(node_id)
    if "@" not in text:
        raise ValueError(f"node must be mask@phase: {node_id!r}")
    mask_text, phase_text = text.split("@", 1)
    mask, phase = int(mask_text), int(phase_text)
    if not (0 <= phase < NODE_PHASES):
        raise ValueError(f"phase outside 0..11: {node_id!r}")
    return mask, phase


def node_id(mask, phase):
    return f"{mask}@{phase}"


class Planner:
    def __init__(self):
        self.world = load_world()
        self.gt = json.load(open(os.path.join(SCRATCH, "frozen_ground_truth.json"), encoding="utf-8"))
        self.sub3 = json.load(open(os.path.join(SCRATCH, "frozen_seam_substrate_v3.json"), encoding="utf-8"))
        self.catalog = json.load(open(os.path.join(SCRATCH, "seam_legal_moves_v3.json"), encoding="utf-8"))
        self.census_raw = json.load(open(os.path.join(SCRATCH, "census_462.json"), encoding="utf-8"))
        self.gov_root = {int(k): v for k, v in self.gt["governingRoot"].items()}
        self.families = {int(k): list(v) for k, v in self.gt["families"].items()}
        self.role = {int(k): v for k, v in self.gt["census"]["role"].items()}
        self.tier = {int(k): v for k, v in self.gt["census"]["tier"].items()}
        self.pcsum = {int(k): v for k, v in self.gt["census"]["pcSum"].items()}
        self.office = {int(k): v for k, v in self.gt["census"]["office"].items()}
        self.office_index = {int(k): v for k, v in self.gt["census"]["officeIndex"].items()}
        self.masks = {int(k): v for k, v in self.gt["census"]["masks"].items()}
        self.orbit_of = {}
        for orbit in self.gt["orbits"]:
            for member in orbit["memberIds"]:
                self.orbit_of[member] = orbit["orbitId"]
        self.carries = {k: int(v) for k, v in self.sub3["carries"].items()}
        self.rl = {int(k): [(op, int(tgt)) for op, tgt in v] for k, v in self.sub3["rlImages"].items()}
        self.pairs = self.sub3["familyBPairs"]
        self.office_names = sorted({self.office[m] for m in self.masks
                                    if self.gov_root.get(m) is not None and self.office.get(m)})
        self.nodes = [node_id(mask, phase) for mask in sorted(self.masks) for phase in range(NODE_PHASES)]
        self.node_set = set(self.nodes)
        self.boundary_masks = sorted(m for m in self.masks if self.gov_root.get(m) is None)
        self.exits_by_source = {src: sorted(images) for src, images in self.rl.items()
                                if self.role.get(src) == "boundary"}
        self.isolated_boundary = {m for m in self.boundary_masks if m not in self.exits_by_source}
        self.dual_exit = {m for m, images in self.exits_by_source.items() if len(images) == 2}
        self.single_exit = {m for m, images in self.exits_by_source.items() if len(images) == 1}
        self.adj = {node: [] for node in self.nodes}
        self.edge_map = {}
        self.raw_counts = collections.Counter()
        self.gate_verified = 0
        self.gate_failures = []
        self.build_graph()

    def add_edge(self, source, target, kind, operator=None):
        src = node_id(*source) if isinstance(source, tuple) else source
        dst = node_id(*target) if isinstance(target, tuple) else target
        if src == dst:
            return
        if src not in self.node_set or dst not in self.node_set:
            raise RuntimeError(f"edge outside node grid {src}->{dst}")
        verdict, reasons, checks, citation = self.world.gate(parse_node(src), parse_node(dst))
        self.gate_verified += 1
        if verdict != "ACCEPT":
            self.gate_failures.append({"source": src, "target": dst, "kind": kind,
                                       "verdict": verdict, "reasons": reasons})
            raise RuntimeError(f"unverified edge {src}->{dst} {kind}: {verdict} {reasons}")
        meta = {"kind": kind, "operator": operator, "citation": citation,
                "verdict": verdict, "reasons": list(reasons)}
        key = (src, dst)
        if key in self.edge_map:
            existing = self.edge_map[key]
            if any(row["kind"] == kind and row.get("operator") == operator for row in existing):
                return
            existing.append(meta)
        else:
            self.edge_map[key] = [meta]
            self.adj[src].append(dst)

    def build_graph(self):
        for mask in sorted(self.masks):
            root = self.gov_root.get(mask)
            if root is None:
                continue
            for phase in range(NODE_PHASES):
                for target in sorted(self.families[root]):
                    if target == mask:
                        continue
                    self.add_edge((mask, phase), (target, phase), "tier-1")
                    self.raw_counts["tier1"] += 1
        for edge in self.catalog["familyA"]["edges"]:
            operator, src, sp, tgt, tp, intra, boundary = edge
            src, sp, tgt, tp = int(src), int(sp), int(tgt), int(tp)
            self.raw_counts["familyA_catalog"] += 1
            if self.role.get(src) == "boundary":
                continue
            self.add_edge((src, sp), (tgt, tp), f"seamA:{operator}", operator)
            self.raw_counts["familyA_active"] += 1
        for pair in self.pairs:
            left, right = int(pair["leftMask"]), int(pair["rightMask"])
            for src, dst in ((left, right), (right, left)):
                if self.role.get(src) == "boundary":
                    continue
                for phase in range(NODE_PHASES):
                    self.add_edge((src, phase), (dst, phase), "seamB:bridge")
                    self.raw_counts["familyB_active"] += 1
        for mask in sorted(self.exits_by_source):
            images = self.exits_by_source[mask]
            for phase in range(NODE_PHASES):
                candidates = sorted((tgt, (phase + self.carries[op]) % NODE_PHASES, op)
                                    for op, tgt in images)
                target_mask, target_phase, operator = candidates[0]
                if target_mask == mask and target_phase == phase:
                    raise RuntimeError(f"boundary auto-transit self-loop at {mask}@{phase}")
                self.add_edge((mask, phase), (target_mask, target_phase),
                              "boundary-auto-transit", operator)
                self.raw_counts["boundary_auto"] += 1
        for src in self.adj:
            self.adj[src] = sorted(set(self.adj[src]),
                                   key=lambda dst: (parse_node(dst)[0], parse_node(dst)[1]))
        for key in self.edge_map:
            self.edge_map[key] = sorted(self.edge_map[key],
                                        key=lambda row: (row["kind"], row.get("operator") or ""))
        self.edge_count = sum(len(targets) for targets in self.adj.values())
        if self.gate_failures:
            raise RuntimeError(f"{len(self.gate_failures)} gate failures during graph build")

    def edge_meta(self, source, target):
        rows = self.edge_map.get((source, target))
        if not rows:
            raise KeyError(f"no edge {source}->{target}")
        return rows[0]

    def reverse_adjacency(self):
        reverse = {node: [] for node in self.nodes}
        for src, targets in self.adj.items():
            for dst in targets:
                reverse[dst].append(src)
        for node in reverse:
            reverse[node] = sorted(reverse[node], key=lambda x: (parse_node(x)[0], parse_node(x)[1]))
        return reverse

    def distances(self, source):
        if source not in self.node_set:
            raise KeyError(f"source not in graph: {source}")
        dist = {source: 0}
        queue = collections.deque([source])
        while queue:
            node = queue.popleft()
            for target in self.adj[node]:
                if target not in dist:
                    dist[target] = dist[node] + 1
                    queue.append(target)
        return dist

    def boundary_status(self, mask):
        if self.role.get(mask) != "boundary":
            return "governed"
        if mask in self.isolated_boundary:
            return "boundary-isolated"
        if mask in self.dual_exit:
            return "boundary-escapable-dual"
        if mask in self.single_exit:
            return "boundary-escapable-single"
        return "boundary-unclassified"

    def pitch_classes(self, mask, phase):
        return [(pc + phase) % NODE_PHASES for pc in range(NODE_PHASES) if (self.masks[mask] >> pc) & 1]

    def node_audit(self, node):
        mask, phase = parse_node(node)
        return {
            "id": node,
            "mask": mask,
            "phase": phase,
            "role": self.role.get(mask),
            "tier": self.tier.get(mask),
            "office": self.office.get(mask),
            "officeIndex": self.office_index.get(mask),
            "governingRoot": self.gov_root.get(mask),
            "orbit": self.orbit_of.get(mask),
            "pcSum": self.pcsum.get(mask),
            "pitchClasses": self.pitch_classes(mask, phase),
            "boundaryStatus": self.boundary_status(mask),
        }

    def neighbors(self, node):
        return list(self.adj.get(node, []))

    def neighborhood(self, node, card_state=None):
        audit = self.node_audit(node)
        menu = []
        for target in self.adj.get(node, []):
            meta = self.edge_meta(node, target)
            menu.append({
                "candidateId": target,
                "kind": meta["kind"],
                "operator": meta.get("operator"),
                "citation": meta.get("citation"),
                "candidateAudit": self.node_audit(target),
            })
        if isinstance(card_state, dict):
            order = card_state.get("order")
            scores = card_state.get("scores")
            if isinstance(order, list):
                index = {row: i for i, row in enumerate(order)}
                menu.sort(key=lambda row: (index.get(row["candidateId"], len(order)),
                                           parse_node(row["candidateId"])))
            elif isinstance(scores, dict):
                menu.sort(key=lambda row: (-int(scores.get(row["candidateId"], 0)),
                                           parse_node(row["candidateId"])))
        else:
            menu.sort(key=lambda row: parse_node(row["candidateId"]))
        return {"node": audit, "legalOutboundMenu": menu,
                "outboundCount": len(menu), "cardStateApplied": bool(card_state)}

    def resolve_targets(self, target_spec):
        text = str(target_spec)
        if "@" in text:
            mask, phase = parse_node(text)
            target = node_id(mask, phase)
            if target not in self.node_set:
                return [], "NOT_CENSUS_STATE"
            return [target], None
        if text in self.office_names:
            targets = [node_id(mask, phase) for mask in sorted(self.masks)
                       for phase in range(NODE_PHASES)
                       if self.gov_root.get(mask) is not None and self.office.get(mask) == text]
            return targets, None
        raise ValueError(f"unrecognized target spec {target_spec!r}")

    def shortest_paths(self, source, target_spec, max_paths=3):
        targets, error = self.resolve_targets(target_spec)
        if error:
            return {"reachable": False, "reason": error, "source": source,
                    "targetSpec": str(target_spec), "paths": []}
        missing = [target for target in targets if target not in self.node_set]
        if missing:
            return {"reachable": False, "reason": "NOT_CENSUS_STATE", "source": source,
                    "targetSpec": str(target_spec), "paths": []}
        dist = self.distances(source)
        reached = [target for target in targets if target in dist]
        if not reached:
            reason = "ISOLATED_BOUNDARY" if any(parse_node(target)[0] in self.isolated_boundary
                                                for target in targets) else "UNREACHABLE_COMPONENT"
            return {"reachable": False, "reason": reason, "source": source,
                    "targetSpec": str(target_spec), "paths": []}
        best = min(dist[target] for target in reached)
        frontier = sorted((target for target in reached if dist[target] == best),
                          key=lambda x: parse_node(x))
        reverse = self.reverse_adjacency()
        paths = []
        for target in frontier:
            stack = [(target, [target])]
            while stack and len(paths) < max_paths:
                node, suffix = stack.pop()
                if node == source:
                    path = list(reversed(suffix))
                    paths.append(path)
                    continue
                predecessors = [pred for pred in reverse[node] if dist.get(pred) == dist[node] - 1]
                for pred in sorted(predecessors, key=lambda x: parse_node(x), reverse=True):
                    stack.append((pred, suffix + [pred]))
        paths.sort(key=lambda path: (len(path), [parse_node(node) for node in path]))
        recorded = [self.path_record(path) for path in paths[:max_paths]]
        return {"reachable": True, "source": source, "targetSpec": str(target_spec),
                "target": recorded[0]["path"][-1] if recorded else None,
                "hopCount": recorded[0]["hopCount"] if recorded else None,
                "paths": recorded,
                "plannerVerifiedHops": sum(row["hopCount"] for row in recorded),
                "gateFailures": list(self.gate_failures)}

    def path_record(self, path):
        hops = []
        for source, target in zip(path, path[1:]):
            meta = self.edge_meta(source, target)
            hops.append({
                "from": source, "to": target, "kind": meta["kind"],
                "operator": meta.get("operator"), "citation": meta.get("citation"),
                "gate": {"verdict": meta["verdict"], "reasons": list(meta["reasons"]),
                         "citation": meta.get("citation")},
            })
        return {"path": list(path), "hopCount": len(path) - 1, "hops": hops}

    def weak_components(self):
        undirected = {node: set() for node in self.nodes}
        for src, targets in self.adj.items():
            for dst in targets:
                undirected[src].add(dst)
                undirected[dst].add(src)
        seen = set()
        components = []
        for start in sorted(self.nodes, key=lambda x: parse_node(x)):
            if start in seen:
                continue
            stack = [start]
            seen.add(start)
            members = []
            while stack:
                node = stack.pop()
                members.append(node)
                for neighbor in sorted(undirected[node], key=lambda x: parse_node(x), reverse=True):
                    if neighbor not in seen:
                        seen.add(neighbor)
                        stack.append(neighbor)
            components.append(sorted(members, key=lambda x: parse_node(x)))
        components.sort(key=lambda comp: (-len(comp), parse_node(comp[0])))
        return components

    def strong_components(self):
        seen = set()
        order = []
        for start in sorted(self.nodes, key=lambda x: parse_node(x)):
            if start in seen:
                continue
            stack = [(start, False)]
            while stack:
                node, processed = stack.pop()
                if processed:
                    order.append(node)
                    continue
                if node in seen:
                    continue
                seen.add(node)
                stack.append((node, True))
                for neighbor in sorted(self.adj[node], key=lambda x: parse_node(x), reverse=True):
                    if neighbor not in seen:
                        stack.append((neighbor, False))
        reverse = self.reverse_adjacency()
        assigned = set()
        components = []
        for node in reversed(order):
            if node in assigned:
                continue
            stack = [node]
            assigned.add(node)
            members = []
            while stack:
                current = stack.pop()
                members.append(current)
                for neighbor in sorted(reverse[current], key=lambda x: parse_node(x), reverse=True):
                    if neighbor not in assigned:
                        assigned.add(neighbor)
                        stack.append(neighbor)
            components.append(sorted(members, key=lambda x: parse_node(x)))
        components.sort(key=lambda comp: (-len(comp), parse_node(comp[0])))
        return components

    def component_summary(self, members):
        masks = sorted({parse_node(node)[0] for node in members})
        phases = sorted({parse_node(node)[1] for node in members})
        governed = sum(1 for node in members if self.gov_root.get(parse_node(node)[0]) is not None)
        boundary = len(members) - governed
        isolated = sum(1 for node in members if parse_node(node)[0] in self.isolated_boundary)
        return {
            "size": len(members), "masks": len(masks), "phases": phases,
            "governedNodes": governed, "boundaryNodes": boundary,
            "isolatedBoundaryNodes": isolated,
            "nodeSample": members[:8],
        }

    def census(self):
        weak = self.weak_components()
        strong = self.strong_components()
        weak_rows = []
        given_phase_sets = {}
        for index, members in enumerate(weak):
            summary = self.component_summary(members)
            summary["componentId"] = f"W{index:03d}"
            weak_rows.append(summary)
            per_mask = collections.defaultdict(set)
            for node in members:
                mask, phase = parse_node(node)
                per_mask[mask].add(phase)
            given_phase_sets[summary["componentId"]] = per_mask
        strong_rows = []
        for index, members in enumerate(strong):
            summary = self.component_summary(members)
            summary["componentId"] = f"S{index:03d}"
            strong_rows.append(summary)
        governed_phase_sets = {}
        for members in weak:
            for mask in sorted({parse_node(node)[0] for node in members}):
                if self.gov_root.get(mask) is not None:
                    governed_phase_sets[mask] = sorted({parse_node(node)[1] for node in members
                                                        if parse_node(node)[0] == mask})
        distribution = collections.Counter(len(v) for v in governed_phase_sets.values())
        below = {mask: phases for mask, phases in governed_phase_sets.items() if len(phases) < 12}
        seed = node_id(1387, 0)
        reachable = self.distances(seed) if seed in self.node_set else {}
        reachable_phases = collections.Counter(parse_node(node)[1] for node in reachable)
        reachable_offices = collections.Counter(self.office.get(parse_node(node)[0]) for node in reachable
                                                 if self.gov_root.get(parse_node(node)[0]) is not None)
        return {
            "schemaVersion": "mvp4.symbolic-planner-census.v1",
            "nodes": len(self.nodes),
            "edges": self.edge_count,
            "rawEdgeCounts": dict(self.raw_counts),
            "gateVerifiedEdges": self.gate_verified,
            "gateFailures": self.gate_failures,
            "isolatedBoundaryMasks": len(self.isolated_boundary),
            "isolatedBoundaryLiftedNodes": len(self.isolated_boundary) * NODE_PHASES,
            "escapableBoundaryMasks": len(self.exits_by_source),
            "singleExitMasks": len(self.single_exit),
            "dualExitMasks": len(self.dual_exit),
            "weakComponentCount": len(weak_rows),
            "strongComponentCount": len(strong_rows),
            "weakComponents": weak_rows,
            "strongComponents": strong_rows,
            "governedMaskPhaseReachability": {
                "governedMasks": len(governed_phase_sets),
                "phaseCountDistribution": {str(k): v for k, v in sorted(distribution.items())},
                "masksBelowTwelvePhases": len(below),
                "belowTwelveExamples": [{"mask": mask, "phases": phases}
                                         for mask, phases in list(sorted(below.items()))[:20]],
                "mask127Phases": governed_phase_sets.get(127),
                "perMaskPhaseSets": {str(mask): phases for mask, phases in sorted(governed_phase_sets.items())},
            },
            "seedReachability": {
                "source": seed,
                "reachableNodes": len(reachable),
                "reachablePhases": {str(k): v for k, v in sorted(reachable_phases.items())},
                "reachableOffices": {str(k): v for k, v in sorted(reachable_offices.items())},
            },
        }
