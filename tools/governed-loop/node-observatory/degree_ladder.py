#!/usr/bin/env python3
"""MVP8.3-DEGREE-LADDER-DIR-1 pure degree-ladder functions (scratch).

Container degrees are indexed 1..7 (L1). Every stack is a subset of the
container by construction. Shapes are integer interval vectors read from the
active stack root; no tonal names are produced here.
"""

TEMPLATES = ["full", "bare", "shell", "triad", "triad_9", "seventh",
             "ninth_drop5", "rootless_13th"]

TEMPLATE_DEGREES = {
    "full": [1, 2, 3, 4, 5, 6, 7],
    "bare": [1, 5],
    "shell": [1, 3, 7],
    "triad": [1, 3, 5],
    "triad_9": [1, 2, 3, 5],
    "seventh": [1, 3, 5, 7],
    "ninth_drop5": [1, 2, 3, 7],
    "rootless_13th": [2, 3, 6, 7],
}

ORBIT_CODES = {
    3: ["s1_k3", "s2_k3", "s3_k3", "s2_k4_drop_j2", "s2_k4_drop_j1"],
    4: ["s1_k4", "s2_k4", "s3_k4", "s2_k5_drop_j3", "s2_k5_drop_j1"],
}

ORBIT_SPECS = {
    "s1_k3": {"stride": 1, "depth": 3, "drop": None},
    "s2_k3": {"stride": 2, "depth": 3, "drop": None},
    "s3_k3": {"stride": 3, "depth": 3, "drop": None},
    "s2_k4_drop_j2": {"stride": 2, "depth": 4, "drop": 2},
    "s2_k4_drop_j1": {"stride": 2, "depth": 4, "drop": 1},
    "s1_k4": {"stride": 1, "depth": 4, "drop": None},
    "s2_k4": {"stride": 2, "depth": 4, "drop": None},
    "s3_k4": {"stride": 3, "depth": 4, "drop": None},
    "s2_k5_drop_j3": {"stride": 2, "depth": 5, "drop": 3},
    "s2_k5_drop_j1": {"stride": 2, "depth": 5, "drop": 1},
}


def container_from_row(row):
    """Phase-ordered container (c_1..c_7); index 0 is degree 1."""
    pcs = sorted(int(pc) for pc in row["pitchClasses"])
    if len(pcs) != 7:
        raise ValueError(f"container is not heptatonic: {pcs}")
    phase = int(row["phase"])
    start = pcs.index(phase)
    return tuple(pcs[(start + k) % 7] for k in range(7))


def container_from_node(engine, node):
    return container_from_row(engine.nodes[node])


def degree_indices(d, s, k):
    if not 1 <= int(d) <= 7:
        raise ValueError(f"degree outside 1..7: {d}")
    if int(s) not in (1, 2, 3, 4):
        raise ValueError(f"stride outside 1..4: {s}")
    if not 2 <= int(k) <= 7:
        raise ValueError(f"depth outside 2..7: {k}")
    return [((int(d) - 1 + int(s) * j) % 7) + 1 for j in range(int(k))]


def valid_rotations(k):
    return list(range(int(k)))


def _stack_from_indices(container, indices, rotation, **extra):
    k = len(indices)
    m = int(rotation) % k
    r_idx = indices[m]
    root_pc = container[r_idx - 1]
    ordered_pcs = [container[i - 1] for i in indices]
    pcs = sorted(set(ordered_pcs))
    if len(pcs) != k:
        raise ValueError(f"stack collapsed: {ordered_pcs}")
    shape = sorted((pc - root_pc) % 12 for pc in pcs)
    result = {
        "degreeIndices": list(indices),
        "rotation": m,
        "rootDegree": int(r_idx),
        "rootPc": int(root_pc),
        "orderedPcs": [int(pc) for pc in ordered_pcs],
        "pitchClasses": [int(pc) for pc in pcs],
        "shape": [int(x) for x in shape],
    }
    result.update(extra)
    return result


def degree_stack(container, d, s=2, k=4, m=0):
    indices = degree_indices(d, s, k)
    return _stack_from_indices(container, indices, m, degree=int(d),
                               stride=int(s), depth=int(k),
                               orbitCode=None, kind="contiguous")


def orbit_stack(container, orbit_code, d, m=0):
    spec = ORBIT_SPECS[orbit_code]
    indices = degree_indices(d, spec["stride"], spec["depth"])
    drop = spec["drop"]
    if drop is not None:
        indices = indices[:drop] + indices[drop + 1:]
    return _stack_from_indices(container, indices, m,
                               degree=int(d), stride=int(spec["stride"]),
                               depth=int(spec["depth"]), orbitCode=orbit_code,
                               kind="orbit", drop=drop)


def template_pcs(container, template):
    degrees = TEMPLATE_DEGREES[template]
    return sorted({int(container[i - 1]) for i in degrees})


def _all_degree_sets(container):
    """Every subset of the 7 container degrees, keyed by sorted pc tuple."""
    from itertools import combinations
    return {tuple(sorted(container[i] for i in combo))
            for size in range(1, 8)
            for combo in combinations(range(7), size)}


def _space_tertian(container):
    sets = set()
    for d in range(1, 8):
        for k in range(2, 6):
            sets.add(tuple(sorted(degree_stack(container, d, 2, k, 0)["pitchClasses"])))
    sets.add(tuple(sorted(degree_stack(container, 1, 1, 7, 0)["pitchClasses"])))
    sets.add(tuple(sorted(degree_stack(container, 1, 4, 2, 0)["pitchClasses"])))
    return sets


def _space_uniform(container):
    sets = set()
    for s in (1, 2, 3):
        for d in range(1, 8):
            for k in range(2, 6):
                sets.add(tuple(sorted(degree_stack(container, d, s, k, 0)["pitchClasses"])))
    sets.add(tuple(sorted(degree_stack(container, 1, 1, 7, 0)["pitchClasses"])))
    sets.add(tuple(sorted(degree_stack(container, 1, 4, 2, 0)["pitchClasses"])))
    return sets


def _space_five_orbit(container):
    sets = set()
    for size in (3, 4):
        for orbit_code in ORBIT_CODES[size]:
            for d in range(1, 8):
                sets.add(tuple(sorted(orbit_stack(container, orbit_code, d, 0)["pitchClasses"])))
    sets.add(tuple(sorted(degree_stack(container, 1, 1, 7, 0)["pitchClasses"])))
    sets.add(tuple(sorted(degree_stack(container, 1, 4, 2, 0)["pitchClasses"])))
    return sets


def classify(template_set, space_sets):
    key = tuple(sorted(template_set))
    if key in space_sets:
        return "EXACT"
    size = len(key)
    for candidate in space_sets:
        if len(candidate) == size:
            if len(set(candidate) ^ set(key)) == 2:
                return "ONE-EDIT"
        elif len(candidate) == size + 1:
            if set(key) < set(candidate):
                return "ONE-EDIT"
        elif len(candidate) == size - 1:
            if set(candidate) < set(key):
                return "ONE-EDIT"
    return "OTHER"


def space_sets(container, name):
    if name == "tertian":
        return _space_tertian(container)
    if name == "uniformStride":
        return _space_uniform(container)
    if name == "fiveOrbit":
        return _space_five_orbit(container)
    raise ValueError(f"unknown space {name}")


def classify_pcs(container, pcs, space):
    return classify(pcs, space_sets(container, space))


def expressibility(container):
    spaces = {
        "tertian": _space_tertian(container),
        "uniformStride": _space_uniform(container),
        "fiveOrbit": _space_five_orbit(container),
    }
    templates = {}
    for template in TEMPLATES:
        pcs = template_pcs(container, template)
        templates[template] = {
            "pcs": pcs,
            "tertian": classify(pcs, spaces["tertian"]),
            "uniformStride": classify(pcs, spaces["uniformStride"]),
            "fiveOrbit": classify(pcs, spaces["fiveOrbit"]),
        }
    return {
        "templates": templates,
        "spaceSizes": {name: len(sets) for name, sets in spaces.items()},
    }


def degree_menu(container):
    menu = {"triads": [], "tetrads": [], "contiguous": []}
    for size, bucket in ((3, "triads"), (4, "tetrads")):
        seen = set()
        for orbit_code in ORBIT_CODES[size]:
            for d in range(1, 8):
                row = orbit_stack(container, orbit_code, d, 0)
                key = tuple(row["pitchClasses"])
                if key in seen:
                    raise ValueError(f"orbit overlap {orbit_code} d={d}: {key}")
                seen.add(key)
                rotations = []
                for m in range(row["depth"]):
                    rotations.append(orbit_stack(container, orbit_code, d, m)["shape"])
                record = dict(row)
                record["rotationShapes"] = rotations
                menu[bucket].append(record)
        menu[f"{bucket}Distinct"] = len(seen)
        menu[f"{bucket}Complete"] = len(seen) == (35 if size == 3 else 35)
    for s in (1, 2, 3):
        for k in (3, 4):
            for d in range(1, 8):
                for m in range(k):
                    menu["contiguous"].append(
                        degree_stack(container, d, s, k, m))
    return menu


def coverage_check(container):
    """Verify the 5 orbits x 7 degrees cover every 3- and 4-subset exactly."""
    from itertools import combinations
    report = {}
    for size in (3, 4):
        expected = {tuple(sorted(container[i] for i in combo))
                    for combo in combinations(range(7), size)}
        generated = []
        for orbit_code in ORBIT_CODES[size]:
            for d in range(1, 8):
                generated.append((orbit_code, d,
                                  tuple(sorted(orbit_stack(container, orbit_code, d, 0)["pitchClasses"]))))
        keys = [row[2] for row in generated]
        unique = set(keys)
        duplicates = len(keys) - len(unique)
        missing = sorted(expected - unique)
        extra = sorted(unique - expected)
        report[str(size)] = {
            "expectedCount": len(expected),
            "generatedCount": len(keys),
            "distinctCount": len(unique),
            "duplicates": duplicates,
            "missing": [list(x) for x in missing],
            "extra": [list(x) for x in extra],
            "pass": duplicates == 0 and not missing and not extra and len(unique) == len(expected),
        }
    return report
