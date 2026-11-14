#!/usr/bin/env python3
"""Pattern query for the Seven Governors cadence stride algebra (scratch).

Generalizes shape-query from single chords to progressions: degree walks,
stride sequences, shape sequences, bass-step patterns, seam filters, and cover
numbers, over all 5,544 lifted nodes (462 phase-0 masks).

Degrees are indexed 1..7. Shapes are integer interval vectors read from the
stack anchor root. No Roman numerals and no tonal quality names are emitted.

Read-only against the repository. Loads the admitted degree ladder and the
landed pentatonic engine by path; writes nothing.

Usage:
    python3 pattern_query.py --shape 0,4,7,10
    python3 pattern_query.py --shape 0,3,7 --stride 2 --depth 3
    python3 pattern_query.py --chords "0,3,7;10,2,5;8,0,3;7,8,11"
    python3 pattern_query.py --verify
    python3 pattern_query.py --census
"""
import argparse
import importlib.util
import json
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path

sys.dont_write_bytecode = True


def discover_repo():
    env = os.environ.get("SEVEN_GOVERNORS_REPO")
    if env:
        candidate = Path(env).resolve()
        if (candidate / "provenance/DECISION_LEDGER.md").is_file():
            return candidate
        raise RuntimeError(f"SEVEN_GOVERNORS_REPO does not resolve: {candidate}")
    anchors = [Path(__file__).resolve(), *Path(__file__).resolve().parents,
               Path.cwd().resolve(), *Path.cwd().resolve().parents]
    for parent in anchors:
        if (parent / "provenance/DECISION_LEDGER.md").is_file():
            return parent
    raise RuntimeError("repository root not found")


REPO = discover_repo()


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, str(path))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def load_ladder():
    return load_module(
        "pattern_query_degree_ladder",
        REPO / "tools/governed-loop/node-observatory/degree_ladder.py")


def load_engine():
    tb = str(REPO / "tools/governed-loop/mvp8/task-b")
    if tb not in sys.path:
        sys.path.insert(0, tb)
    from mvp8_pentatonic_q_engine import PentatonicEngine
    return PentatonicEngine()


def load_registry():
    path = REPO / "canonical/universal-heptatonic-ledger.json"
    return {row["id"]: row for row in json.loads(path.read_text(encoding="utf-8"))}


def parse_shape(text):
    return tuple(sorted(int(part) for part in text.replace(" ", "").split(",") if part))


def parse_chords(text):
    return [parse_shape(piece) for piece in text.split(";") if piece.strip()]


class SequenceIndex:
    """Chords and progressions over the 462 phase-0 containers."""

    def __init__(self, ladder=None, engine=None, registry=None):
        self.ladder = ladder or load_ladder()
        self.engine = engine or load_engine()
        self.registry = registry or load_registry()
        self.masks = sorted(self.registry)
        self.containers = {
            mask: self.ladder.container_from_row(self.engine.nodes[f"{mask}@0"])
            for mask in self.masks
        }
        self.pc_sets = {mask: set(self.containers[mask]) for mask in self.masks}
        self.subnodes = {
            mask: {sub["subnodeId"]
                   for sub in self.engine.nodes[f"{mask}@0"]["anchoredSubnodes"]}
            for mask in self.masks
        }
        self.index = defaultdict(list)
        self.family_shapes = defaultdict(set)
        self.family_occurrences = Counter()
        self._build()

    def _build(self):
        for mask in self.masks:
            container = self.containers[mask]
            for stride in (1, 2, 3):
                for depth in (3, 4):
                    for degree in range(1, 8):
                        for rotation in range(depth):
                            stack = self.ladder.degree_stack(
                                container, degree, stride, depth, rotation)
                            shape = tuple(stack["shape"])
                            self.index[shape].append({
                                "mask": mask,
                                "degree": degree,
                                "stride": stride,
                                "depth": depth,
                                "rotation": rotation,
                                "rootDegree": stack["rootDegree"],
                                "rootPc": stack["rootPc"],
                                "pitchClasses": tuple(stack["pitchClasses"]),
                            })
                            self.family_shapes[(stride, depth)].add(shape)
                            self.family_occurrences[(stride, depth)] += 1

    def occurrences(self, shape, stride=None, depth=None, rotation=None, mask=None):
        rows = self.index.get(tuple(shape), [])
        return [row for row in rows
                if (stride is None or row["stride"] == stride)
                and (depth is None or row["depth"] == depth)
                and (rotation is None or row["rotation"] == rotation)
                and (mask is None or row["mask"] == mask)]

    def chord_containers(self, chord):
        """Containers where the chord occurs as a depth-3 degree stack."""
        return {mask for mask in self.masks
                if frozenset(chord) in self._depth3_sets(mask)}

    _depth3_cache = None

    def _depth3_sets(self, mask):
        if self._depth3_cache is None:
            self._depth3_cache = {}
        if mask not in self._depth3_cache:
            sets = set()
            for stride in (1, 2, 3):
                for degree in range(1, 8):
                    for rotation in range(3):
                        stack = self.ladder.degree_stack(
                            self.containers[mask], degree, stride, 3, rotation)
                        sets.add(frozenset(stack["pitchClasses"]))
            self._depth3_cache[mask] = sets
        return self._depth3_cache[mask]

    def query_sequence(self, chords):
        """Minimal-switch path over containers where every chord is a stack."""
        per_chord = [self.chord_containers(chord) for chord in chords]
        common = set.intersection(*per_chord) if per_chord else set()
        states = {None: (0, 0, [])}
        for chord_index, (chord, masks) in enumerate(zip(chords, per_chord)):
            new = {}
            for mask in masks:
                for last, (switches, containers_seen, path) in states.items():
                    candidate_switches = switches + (0 if last in (None, mask) else 1)
                    seen = {row["mask"] for row in path} | {mask}
                    value = (candidate_switches, len(seen),
                             path + [{"chord": chord_index + 1, "mask": mask}])
                    key = mask
                    if key not in new or value[:2] < new[key][:2]:
                        new[key] = value
            states = new
        if not states:
            return {"singleContainer": [], "minimalPath": None}
        switches, containers_seen, path = min(states.values(),
                                              key=lambda row: (row[0], row[1]))
        return {
            "singleContainer": sorted(common),
            "minimalPath": {
                "switches": switches,
                "containers": containers_seen,
                "coverNumber": len({row["mask"] for row in path}),
                "chords": path,
            },
        }

    def cover_number(self, chords):
        """Minimum containers so every chord is a depth-3 stack on some one."""
        per_chord = [self.chord_containers(chord) for chord in chords]
        common = set.intersection(*per_chord) if per_chord else set()
        if common:
            return 1, sorted(common)
        for first in self.masks:
            remaining = [masks for masks in per_chord if first not in masks]
            if not remaining:
                return 1, [first]
            candidates = set.intersection(*remaining)
            candidates.discard(first)
            if candidates:
                return 2, sorted(candidates)
        return 3, []

    def containment_cover(self, chords):
        per_chord = [{mask for mask in self.masks if set(chord) <= self.pc_sets[mask]}
                     for chord in chords]
        common = set.intersection(*per_chord) if per_chord else set()
        if common:
            return 1, sorted(common)
        for first in self.masks:
            remaining = [masks for masks in per_chord if first not in masks]
            if not remaining:
                return 1, [first]
            candidates = set.intersection(*remaining)
            candidates.discard(first)
            if candidates:
                return 2, sorted(candidates)
        return 3, []


# ---- census functions ------------------------------------------------------

def verify_m1_census(ladder, engine, census, masks=None):
    """Rebuild the M1 shape census on all 5,544 lifted nodes and compare."""
    masks = masks or sorted({int(node.split("@")[0]) for node in engine.nodes})
    counts = defaultdict(Counter)
    for mask in masks:
        for phase in range(12):
            node = f"{mask}@{phase}"
            if node not in engine.nodes:
                continue
            container = ladder.container_from_row(engine.nodes[node])
            for stride in (1, 2, 3):
                for depth in (3, 4):
                    for degree in range(1, 8):
                        for rotation in range(depth):
                            stack = ladder.degree_stack(container, degree, stride, depth, rotation)
                            counts[(stride, depth)][tuple(stack["shape"])] += 1
    reference = census["scopes"]["all"]["contiguous"]
    rows = {}
    all_match = True
    for orbit, row in sorted(reference.items()):
        key = (row["depth"], row["depth"])
        family = (int(orbit[1]), row["depth"])
        shapes = counts.get(family, Counter())
        actual = {"distinctShapes": len(shapes),
                  "occurrences": sum(shapes.values())}
        match = (actual["distinctShapes"] == row["distinctShapes"]
                 and actual["occurrences"] == row["occurrences"])
        all_match = all_match and match
        rows[orbit] = {"expectedDistinctShapes": row["distinctShapes"],
                       "actualDistinctShapes": actual["distinctShapes"],
                       "expectedOccurrences": row["occurrences"],
                       "actualOccurrences": actual["occurrences"],
                       "match": match}
    return {"families": rows, "match": all_match}


def andalusian_census(index):
    """The locked pattern census (walk -1/-1/-1, strides 2,2,2,1, forcing)."""
    ladder = index.ladder
    st = {}
    for mask in index.masks:
        for degree in range(1, 8):
            st[(mask, degree, 2)] = ladder.degree_stack(
                index.containers[mask], degree, 2, 3, 0)
            st[(mask, degree, 1)] = ladder.degree_stack(
                index.containers[mask], degree, 1, 3, 0)
    planner = index.engine.planner
    registry = index.registry
    rows = []
    for a in index.masks:
        set_a = index.pc_sets[a]
        for b in index.masks:
            if a == b:
                continue
            symmetric = set_a ^ index.pc_sets[b]
            if len(symmetric) != 2:
                continue
            new_pc = (index.pc_sets[b] - set_a).pop()
            governed = f"{b}@0" in planner.adj.get(f"{a}@0", ())
            bridges = len(index.subnodes[a] & index.subnodes[b])
            for start in range(1, 8):
                degrees = [((start - i - 1) % 7) + 1 for i in range(4)]
                chords = [st[(a, degrees[0], 2)], st[(a, degrees[1], 2)],
                          st[(a, degrees[2], 2)], st[(b, degrees[3], 1)]]
                if new_pc not in chords[3]["pitchClasses"]:
                    continue
                roots = tuple(chord["rootPc"] for chord in chords)
                steps = tuple(-((roots[i] - roots[i + 1]) % 12) for i in range(3))
                shapes = tuple(tuple(chord["shape"]) for chord in chords)
                rows.append({
                    "a": a, "b": b, "startDegree": start,
                    "degrees": degrees, "roots": roots, "steps": steps,
                    "shapes": shapes,
                    "bassOk": all(step in (-1, -2, -3) for step in steps),
                    "governed": governed, "bridges": bridges,
                    "roleA": registry[a]["role"], "roleB": registry[b]["role"],
                    "officeA": registry[a]["office"], "officeB": registry[b]["office"],
                    "tierA": registry[a]["tier"], "tierB": registry[b]["tier"],
                })
    with_bass = [row for row in rows if row["bassOk"]]
    governed_rows = [row for row in with_bass if row["governed"]]
    governed_same_office = [row for row in governed_rows
                            if row["officeA"] == row["officeB"]]
    andalusian_shapes = ((0, 3, 7), (0, 4, 7), (0, 4, 7), (0, 1, 4))
    exact_shapes = [row for row in with_bass if row["shapes"] == andalusian_shapes]
    tight = [row for row in exact_shapes if row["steps"] == (-2, -2, -1)]
    exact_set = {(row["a"], row["b"], row["startDegree"]) for row in tight}
    near_miss = [
        row for row in exact_shapes
        if row["steps"] == (-2, -2, -2)
        and (row["a"], row["b"], row["startDegree"]) not in exact_set
    ]
    summary = {
        "noBassConstraint": {
            "instances": len(rows),
            "distinctShapeSequences": len({row["shapes"] for row in rows}),
            "distinctPairs": len({(row["a"], row["b"]) for row in rows}),
            "masksAsFirstContainer": len({row["a"] for row in rows}),
        },
        "descendingBass": {
            "instances": len(with_bass),
            "distinctShapeSequences": len({row["shapes"] for row in with_bass}),
            "distinctPairs": len({(row["a"], row["b"]) for row in with_bass}),
            "tierPreserving": sum(1 for row in with_bass
                                  if row["tierA"] == row["tierB"]),
        },
        "governed": {
            "instances": len(governed_rows),
            "allSameOffice": all(row["officeA"] == row["officeB"]
                                 for row in governed_rows),
            "sameOfficeInstances": len(governed_same_office),
            "shapeSequences": len({row["shapes"] for row in governed_same_office}),
            "anchorToSatellite": sum(
                1 for row in governed_same_office
                if row["roleA"] == "anchor" and row["roleB"] == "satellite"),
            "anchorToSatelliteJupiter": sum(
                1 for row in governed_same_office
                if row["roleA"] == "anchor" and row["roleB"] == "satellite"
                and row["officeA"] == "Jupiter"),
            "d1AnchorToSatellite": sum(
                1 for row in governed_same_office
                if row["startDegree"] == 1 and row["roleA"] == "anchor"
                and row["roleB"] == "satellite"),
        },
        "exactAndalusianShapeSequence": len(exact_shapes),
        "exactShapesAndBass": len(tight),
        "siblings": sorted(
            [{"a": row["a"], "b": row["b"], "startDegree": row["startDegree"],
              "roots": list(row["roots"]), "office": row["officeA"],
              "tierA": row["tierA"], "tierB": row["tierB"]}
             for row in tight], key=lambda row: row["a"]),
        "nearMiss": [{"a": row["a"], "b": row["b"],
                      "startDegree": row["startDegree"],
                      "roots": list(row["roots"]), "steps": list(row["steps"]),
                      "shapes": [list(shape) for shape in row["shapes"]],
                      "officeA": row["officeA"], "officeB": row["officeB"],
                      "tierA": row["tierA"], "tierB": row["tierB"]}
                     for row in near_miss],
        "bridgeCounts": dict(sorted(Counter(row["bridges"] for row in rows).items())),
    }
    return summary


def bridge_census(index):
    """Shared anchored-subnode count as a function of substitution size."""
    planner = index.engine.planner
    sizes = {}
    for size in range(1, 7):
        distribution = Counter()
        governed = Counter()
        pairs = 0
        for a in index.masks:
            for b in index.masks:
                if a == b:
                    continue
                removed = index.pc_sets[a] - index.pc_sets[b]
                added = index.pc_sets[b] - index.pc_sets[a]
                if len(removed) != size or len(added) != size:
                    continue
                pairs += 1
                count = len(index.subnodes[a] & index.subnodes[b])
                distribution[count] += 1
                if f"{b}@0" in planner.adj.get(f"{a}@0", ()):
                    governed[count] += 1
        sizes[str(size)] = {
            "pairs": pairs,
            "distribution": dict(sorted(distribution.items())),
            "governedDistribution": dict(sorted(governed.items())),
            "predictedShared": ((6 - size) * (5 - size) * (4 - size) * (3 - size)) // 24
            if size <= 2 else 0,
        }
    return sizes


def cadence_census(index, cadences):
    rows = {}
    for name, chords in sorted(cadences.items()):
        cover, witnesses = index.cover_number(chords)
        containment_cover, containment_witnesses = index.containment_cover(chords)
        sequence = index.query_sequence(chords)
        rows[name] = {
            "chords": [sorted(chord) for chord in chords],
            "coverNumber": cover,
            "singleContainerReadings": sorted(sequence["singleContainer"]),
            "singleContainerCount": len(sequence["singleContainer"]),
            "coverWitnesses": witnesses,
            "containmentCoverNumber": containment_cover,
            "containmentWitnesses": containment_witnesses,
            "minimalPath": sequence["minimalPath"],
        }
    return rows


# ---- CLI -------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Cadence stride-algebra pattern query")
    parser.add_argument("--shape", default=None, help="comma-separated interval shape")
    parser.add_argument("--stride", type=int, default=None)
    parser.add_argument("--depth", type=int, default=None)
    parser.add_argument("--rotation", type=int, default=None)
    parser.add_argument("--mask", type=int, default=None)
    parser.add_argument("--chords", default=None, help="semicolon-separated pc sets")
    parser.add_argument("--verify", action="store_true", help="verify against the landed M1 census")
    parser.add_argument("--census", action="store_true", help="run the Andalusian pattern census")
    parser.add_argument("--bridges", action="store_true", help="run the bridge census")
    args = parser.parse_args()

    index = SequenceIndex()
    if args.verify:
        census = json.loads((REPO / "tools/governed-loop/node-observatory/"
                             "mvp8_3_shape_census.json").read_text(encoding="utf-8"))
        result = verify_m1_census(index.ladder, index.engine, census)
        print(json.dumps(result, indent=2))
        raise SystemExit(0 if result["match"] else 1)
    if args.census:
        print(json.dumps(andalusian_census(index), indent=2))
        raise SystemExit(0)
    if args.bridges:
        print(json.dumps(bridge_census(index), indent=2))
        raise SystemExit(0)
    if args.chords:
        chords = parse_chords(args.chords)
        print(json.dumps({
            "chords": [list(chord) for chord in chords],
            "query": index.query_sequence(chords),
            "cover": index.cover_number(chords)[0],
        }, indent=2))
        raise SystemExit(0)
    if args.shape:
        shape = parse_shape(args.shape)
        hits = index.occurrences(shape, args.stride, args.depth,
                                 args.rotation, args.mask)
        print(json.dumps({"shape": list(shape), "occurrences": len(hits),
                          "hits": hits[:200]}, indent=2))
        raise SystemExit(0)
    parser.print_help()


if __name__ == "__main__":
    main()
