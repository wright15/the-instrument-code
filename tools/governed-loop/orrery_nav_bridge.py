#!/usr/bin/env python3
"""ORRERY-NAV-1 rev 2.1 — read-only bridge over the Policy-v3 legal surface.

Serves exactly four GET endpoints:
  /api/nodes               462 census masks x 12 phases (derived)
  /api/legal-moves         the 5,130-move seam catalog (exact)
  /api/tier1-moves         Tier-1 per node, or the full catalog when no node
  /api/boundary-transit    the 256 gamma boundary side-rows

The frozen gate (mvp2.py) is imported as a library; mvp2.py is never modified.
No write route exists. No repository writes. Port is a run parameter.
"""
import argparse
import hashlib
import importlib.util
import json
import subprocess
import sys
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

SCRATCH = __import__("os").environ.get("GOVERNED_LOOP_SCRATCH", __import__("os").path.dirname(__import__("os").path.abspath(__file__)))
REPO = __import__("os").environ.get("GOVERNED_LOOP_REPO", subprocess.run(["git", "-C", __import__("os").path.dirname(__import__("os").path.abspath(__file__)), "rev-parse", "--show-toplevel"], capture_output=True, text=True).stdout.strip() or __import__("os").path.abspath(__import__("os").path.join(__import__("os").path.dirname(__file__), "..", "..")))
# REPO context is computed at runtime (D1); optional pins via GOVERNED_LOOP_REPO_HEAD / GOVERNED_LOOP_MANIFEST_COUNT / GOVERNED_LOOP_LEDGER_PREFIX.

EXPECTED = {
    "mvp2.py": "79c0cf706fffc23745cab6e87ffbc46d34d70ad94a93291135725e388dc17328",
    "policy-v3-registration.md": "48290a2fa89dcaf4e77d91dc134af69db252dc625f2ccb0bd6e97973de4a2357",
    "frozen_seam_substrate_v3.json": "9f9818effa5d11e4ef2634122c9f484faf6790323cabae130561c1c75e8a295f",
    "seam_legal_moves_v3.json": "e6cf62a8eefa0924da9286f2e664c1914d9d620ed2d299929f684fd48225c274",
    "freeze_report_v3.json": "1c65a07c37740797b2a16048ddac4c17c9877465e7c03498d783291a4a433683",
    "plv3_receipts_manifest.json": "461a16b060e9ffc7c81e3cd8ea4d7f14e1d3e11022984dcb2eae9b36a67a8307",
    "census_462.json": "242bce7423bc2eb0ae61ee431c27901d6a87401b8b3ffd6725a04d0e1ed0685a",
    "frozen_ground_truth.json": "007b0ffe65015bd2c5f1a6fe0df8969961ce8cfb3d499677b143d971e1fc5744",
    "frozen_seam_substrate.json": "8a5e82ac5f3b596720db2b62f2ba82484bab5250d168035e4c84cf9870c90bac",
    "seam_phase_a_probe.json": "48f513679d505087277d5670952fb860b755832775f5fb5980aa3f71c73330bb",
    "seam_operator_applications.csv": "1f7b2abb047132fa957f761a73e7c76038766f617bed9c916f971a8c0072f53e",
    "seam_operator_registry.csv": "e5a9e6929fca048078e0db6ff044facc7137a6ef61e994d74f1d526e27b6482e",
    "seam_bipartite_inclusion.json": "903eebf0e1122d8ba81971abcd7efc8ac934d3bfd7885b98b49e58ab0bbe3e41",
    "seam_census_head.json": "f7e56b2b180c456fd4abc96069796d6737f77d13ba66c751604fe95cd19e6d5a",
    "seam_legal_moves_v2.json": "c017c3c66e10b803eccb82342d030575c8069434063657fb89b5d56169db4d4b",
    "freeze_report.json": "4e76c1396cf7be8e45619b38bce7b051f75f2c3e9adebd142b07fa9f2de5c7d0",
    "freeze_report_v2.json": "da14de46d36aa8f183655bbc56605d7d785dd531f898a25e99805666cbbaefeb",
    "gate_log_mvp2_live_mac1.jsonl": "de90eb47d05cfe28646929123f3a01efe1cc156b413676473894c541f1620c29",
    "dispute_analysis_mvp2c.json": "df90f405e653e7d148f4bd60c405e47d87a7c7e8c2c893f3ecbbefa43d303d50",
    "spike01_evidence.json": "cb170c0d00cea3f2db2b69779dc339848befa60f5a78d257c8680f99f6e56fec",
    "degenerate_boundary.jsonl": "f728f8eedec6606a39f95fa41188126aec4447bc1907375fb3eb51395e1d48e1",
    "degenerate_boundary_report.json": "339dc8934bb0e5a1f3ec8438c9b2d0f9dd0efabc42bb732322ec3e60093e74d6",
    "plv3_receipt_nonvacuity.json": "cb9fa9e65b0ad5425d7c3f40b82d05a9d8b08f1b02f20812549cf4e306c12aae",
    "plv3_receipt_case501.json": "0fab6bc4b2710dabe02105d98fc16f4e546e367ac7f4773a44ab284c23fc38d7",
}

PREFIXES = {
    "policy-v3-registration.md": "48290a2f",
    "frozen_seam_substrate_v3.json": "9f9818ef",
    "seam_legal_moves_v3.json": "e6cf62a8",
    "freeze_report_v3.json": "1c65a07c",
    "plv3_receipts_manifest.json": "461a16b0",
}

NODE_PHASES = 12
BOUNDARY_SEMANTICS = [
    "reachable-via-seam",
    "escapable-only-via-seam",
    "can-never-govern",
    "cannot-be-camped-on",
]


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def fail(msg):
    print(f"FAIL-CLOSED: {msg}")
    sys.exit(1)


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def import_frozen_gate():
    spec = importlib.util.spec_from_file_location("frozen_mvp2", f"{SCRATCH}/mvp2.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def verify_repo_context():
    status = subprocess.run(
        ["git", "-C", REPO, "status", "--porcelain"],
        capture_output=True, text=True, check=True,
    ).stdout
    if status.strip() and __import__("os").environ.get("GOVERNED_LOOP_REQUIRE_CLEAN", "1") == "1":
        fail("repository tree is not clean at bridge start")
    head = subprocess.run(
        ["git", "-C", REPO, "rev-parse", "HEAD"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    head_pin = __import__("os").environ.get("GOVERNED_LOOP_REPO_HEAD")
    if head_pin and head != head_pin:
        fail(f"repository HEAD {head} != {head_pin}")
    manifest = load_json(f"{REPO}/MANIFEST.json")
    count_pin = __import__("os").environ.get("GOVERNED_LOOP_MANIFEST_COUNT")
    if count_pin and manifest["fileCount"] != int(count_pin):
        fail(f"MANIFEST fileCount {manifest['fileCount']} != {count_pin}")
    ledger = f"{REPO}/provenance/DECISION_LEDGER.md"
    digest = sha256_file(ledger)
    prefix_pin = __import__("os").environ.get("GOVERNED_LOOP_LEDGER_PREFIX")
    if prefix_pin and not digest.startswith(prefix_pin):
        fail(f"ledger prefix {digest[:8]} != {prefix_pin}")
    return {
        "head": head,
        "treeClean": status.strip() == "",
        "ledgerPrefix": digest[:8],
        "ledgerBytes": __import__("os").path.getsize(ledger),
        "ledgerLines": sum(1 for _ in open(ledger, "rb")),
        "fileCount": manifest["fileCount"],
    }


def verify_pins():
    for name, expected in EXPECTED.items():
        path = f"{SCRATCH}/{name}"
        actual = sha256_file(path)
        if actual != expected:
            fail(f"{name} hash {actual} != {expected}")
        if name in PREFIXES and not actual.startswith(PREFIXES[name]):
            fail(f"{name} prefix mismatch")

    lines = open(f"{SCRATCH}/mvp2.py", encoding="utf-8").read().splitlines()
    anchors = {
        "150": "        if cm == nm and cp == np_:",
        "151": "            if self.gov_root[cm] is None:",
        "152": '                checks["boundary_endpoint"] = True',
        "153": '                checks["same_family"] = False',
        "154": '                return "REJECT", ["ungoverned-transition"], checks, None',
        "169": "        same_root = cr is not None and nr is not None and cr == nr",
        "171": "        if same_root and cp == np_:",
        "172": '            return "ACCEPT", [], checks, None',
        "183": "        if checks[\"boundary_endpoint\"]:",
        "184": '            return "REJECT", ["ungoverned-transition"], checks, None',
    }
    for line, expected in anchors.items():
        actual = lines[int(line) - 1]
        if actual != expected:
            fail(f"mvp2.py:{line} anchor moved: {actual!r}")
    if "ORRERY_BRIDGE_DWELL_MS" not in lines[732]:
        fail("mvp2.py:733 dwell anchor moved")


class Model:
    def __init__(self):
        self.repo = verify_repo_context()
        verify_pins()
        self.gt = load_json(f"{SCRATCH}/frozen_ground_truth.json")
        self.census = load_json(f"{SCRATCH}/census_462.json")
        self.sub3 = load_json(f"{SCRATCH}/frozen_seam_substrate_v3.json")
        self.sub2 = load_json(f"{SCRATCH}/frozen_seam_substrate.json")
        self.catalog = load_json(f"{SCRATCH}/seam_legal_moves_v3.json")
        self.manifest = load_json(f"{SCRATCH}/plv3_receipts_manifest.json")
        self.mvp2 = import_frozen_gate()
        self.world = self.mvp2.World()

        if self.sub3["rlImages"] != self.sub2["rlImages"]:
            fail("v3 substrate rlImages != frozen gate input")
        if self.sub3["familyBPairs"] != self.sub2["familyBPairs"]:
            fail("v3 substrate familyBPairs != frozen gate input")
        if self.sub3["carries"] != self.sub2["carries"]:
            fail("v3 substrate carries != frozen gate input")

        self.records = self.census["records"]
        if len(self.records) != 462:
            fail("census cardinality != 462")
        self.masks = {r["stateId"]: r["pitchMask"] for r in self.records}
        self.role = {r["stateId"]: r["role"] for r in self.records}
        self.tier = {r["stateId"]: r.get("tier") for r in self.records}
        self.office = {r["stateId"]: r.get("office") for r in self.records}
        self.office_index = {r["stateId"]: r.get("officeIndex") for r in self.records}
        self.forte = {r["stateId"]: r.get("forte") for r in self.records}
        self.pcsum = {int(k): v for k, v in self.gt["census"]["pcSum"].items()}
        self.gov_root = {int(k): v for k, v in self.gt["governingRoot"].items()}
        self.parent = {int(k): v for k, v in self.gt["governs"]["parent"].items()}
        self.families = {int(k): v for k, v in self.gt["families"].items()}
        self.orbit_of = {}
        self.orbit_tier = {}
        for orbit in self.gt["orbits"]:
            for sid in orbit["memberIds"]:
                self.orbit_of[sid] = orbit["orbitId"]
                self.orbit_tier[sid] = orbit["tier"]

        self.office_names = [
            name for _, name in sorted(
                {(self.office_index[s], self.office[s])
                 for s in self.masks if self.role[s] != "boundary"}
            )
        ]
        if len(self.office_names) != 7:
            fail(f"derived office count {len(self.office_names)} != 7")
        self.governs_edges = len(self.parent)

        self.nodes = self._build_nodes()
        self.node_by_id = {node["id"]: node for node in self.nodes}
        if len(self.nodes) != 462 * NODE_PHASES:
            fail("node grid cardinality mismatch")
        self.boundary = self._build_boundary()
        self.seam_moves = self._build_seam_moves()
        if len(self.seam_moves) != 5130:
            fail(f"seam catalog {len(self.seam_moves)} != 5130")
        self.tier1_count = self._derive_tier1_count()
        self.family_size_squares = sum(len(v) ** 2 for v in self.families.values())
        if self.tier1_count != 12 * self.family_size_squares:
            fail("Tier-1 derived count != 12 x familySizeSquares")

    def _build_nodes(self):
        nodes = []
        for sid in sorted(self.masks):
            mask = self.masks[sid]
            for phase in range(NODE_PHASES):
                pcs = [(pc + phase) % 12 for pc in range(12) if (mask >> pc) & 1]
                nodes.append({
                    "id": f"{mask}@{phase}",
                    "mask": mask,
                    "phase": phase,
                    "role": self.role[sid],
                    "tier": self.tier[sid],
                    "office": self.office[sid],
                    "officeIndex": self.office_index[sid],
                    "governingRoot": self.gov_root[sid],
                    "familyRoot": self.gov_root[sid],
                    "orbit": self.orbit_of.get(sid),
                    "orbitTier": self.orbit_tier.get(sid),
                    "pcSum": sum(pcs),
                    "pitchClasses": pcs,
                    "boundary": self.role[sid] == "boundary",
                })
        return nodes

    def _build_boundary(self):
        exits = []
        entries = []
        rl = self.sub3["rlImages"]
        for source, images in rl.items():
            src = int(source)
            for operator, target in images:
                tgt = int(target)
                row = {
                    "applicationId": f"{operator}:{src}:{tgt}",
                    "operatorId": operator,
                    "sourceId": src,
                    "targetId": tgt,
                    "sourceMask": self.masks[src],
                    "targetMask": self.masks[tgt],
                    "sourceRole": self.role[src],
                    "targetRole": self.role[tgt],
                    "sourcePcSum": self.pcsum[src],
                    "targetPcSum": self.pcsum[tgt],
                    "phaseCarry": int(self.sub3["carries"][operator]),
                    "licensedAtAllPhases": True,
                    "liftedImages": NODE_PHASES,
                    "semantics": list(BOUNDARY_SEMANTICS),
                }
                if self.role[src] == "boundary":
                    exits.append({**row, "id": f"exit:{operator}:{src}:{tgt}", "side": "exit"})
                if self.role[tgt] == "boundary":
                    entries.append({**row, "id": f"entry:{operator}:{src}:{tgt}", "side": "entry"})
        rows = exits + entries
        distinct = {row["applicationId"] for row in rows}
        if len(exits) != 128 or len(entries) != 128 or len(rows) != 256:
            fail(f"boundary rows {len(exits)}/{len(entries)} != 128/128")
        return {
            "exits": exits,
            "entries": entries,
            "rows": rows,
            "count": len(rows),
            "distinctRows": len(distinct),
        }

    def _build_seam_moves(self):
        moves = []
        for edge in self.catalog["familyA"]["edges"]:
            operator, src, sp, tgt, tp, intra, boundary = edge
            moves.append({
                "id": f"{operator}:{src}@{sp}->{tgt}@{tp}",
                "kind": "familyA",
                "operatorId": operator,
                "sourceId": src,
                "sourcePhase": sp,
                "targetId": tgt,
                "targetPhase": tp,
                "phaseCarry": int(self.sub3["carries"][operator]),
                "intra735": bool(intra),
                "boundaryEndpoint": bool(boundary),
            })
        for edge in self.catalog["familyB"]["edges"]:
            moves.append({
                "id": edge["id"],
                "kind": "familyB",
                "leftMask": edge["leftMask"],
                "rightMask": edge["rightMask"],
                "leftId": edge["leftId"],
                "rightId": edge["rightId"],
                "sharedSubnode": edge["sharedSubnode"],
                "admitted": edge["admitted"],
                "phaseDistance": 0,
                "boundaryEndpoint": False,
            })
        return moves

    def tier1_for(self, mask, phase):
        if mask not in self.masks:
            raise KeyError(f"mask {mask} not in census")
        if not (0 <= phase < NODE_PHASES):
            raise KeyError(f"phase {phase} outside 0..11")
        root = self.gov_root[mask]
        if root is None:
            return []
        moves = []
        for target in sorted(self.families[root]):
            verdict, reasons, checks, citation = self.world.gate((mask, phase), (target, phase))
            if verdict != "ACCEPT":
                fail(f"Tier-1 gate disagreement {mask}@{phase}->{target}@{phase}")
            moves.append({
                "class": "tier-1",
                "currentId": f"{mask}@{phase}",
                "current": [mask, phase],
                "candidateId": f"{target}@{phase}",
                "candidate": [target, phase],
                "mask": target,
                "phase": phase,
                "self": target == mask,
                "verdict": "ACCEPT",
                "reasons": reasons,
                "citation": citation,
            })
        return moves

    def _derive_tier1_count(self):
        total = 0
        for node in self.nodes:
            if node["governingRoot"] is None:
                continue
            total += len(self.families[node["governingRoot"]])
        return total

    def tier1_catalog(self):
        moves = []
        for node in self.nodes:
            moves.extend(self.tier1_for(node["mask"], node["phase"]))
        if len(moves) != self.tier1_count:
            fail("Tier-1 catalog count mismatch")
        return moves

    def check_seam_conformance(self):
        first_failure = None
        checked = 0
        for move in self.seam_moves:
            if move["kind"] != "familyA":
                continue
            verdict, reasons, checks, citation = self.world.gate(
                (move["sourceId"], move["sourcePhase"]),
                (move["targetId"], move["targetPhase"]),
            )
            checked += 1
            if verdict != "ACCEPT" or citation != f"FamilyA:{move['operatorId']}":
                first_failure = {
                    "move": move["id"], "verdict": verdict,
                    "reasons": reasons, "citation": citation,
                }
                return {"checked": checked, "expected": 5040,
                        "passed": checked - 1, "firstFailure": first_failure}
        return {"checked": checked, "expected": 5040, "passed": checked, "firstFailure": None}

    def check_familyb_conformance(self):
        queries = 0
        citations = Counter()
        for pair in self.sub3["familyBPairs"]:
            for left, right in ((pair["leftMask"], pair["rightMask"]),
                                (pair["rightMask"], pair["leftMask"])):
                for phase in range(NODE_PHASES):
                    verdict, reasons, checks, citation = self.world.gate((left, phase), (right, phase))
                    queries += 1
                    if verdict != "ACCEPT":
                        return {"queries": queries, "expected": 1008,
                                "passed": queries - 1,
                                "firstFailure": {"left": left, "right": right, "phase": phase,
                                                 "verdict": verdict, "reasons": reasons,
                                                 "citation": citation}}
                    citations["Tier-1-first" if citation is None else citation] += 1
        return {"queries": queries, "expected": 1008, "passed": queries,
                "citations": dict(citations), "firstFailure": None}

    def check_probes(self):
        receipt = load_json(f"{SCRATCH}/plv3_receipt_nonvacuity.json")
        case501 = load_json(f"{SCRATCH}/plv3_receipt_case501.json")
        probes = []
        for name, probe in receipt["constraintTier"].items():
            if name == "pass":
                continue
            probes.append({
                "name": name,
                "current": probe["current"],
                "candidate": probe["candidate"],
                "expectedVerdict": probe["verdict"],
                "expectedReasons": probe["reasons"],
                "expectedCitation": probe["citation"],
            })
        rerun = case501["v3Rerun"]
        probes.append({
            "name": "case501",
            "current": rerun["current"],
            "candidate": rerun["candidate"],
            "expectedVerdict": rerun["verdict"],
            "expectedReasons": rerun["reasons"],
            "expectedCitation": rerun["citation"],
        })
        results = []
        for probe in probes:
            verdict, reasons, checks, citation = self.world.gate(
                tuple(probe["current"]), tuple(probe["candidate"])
            )
            match = (
                verdict == probe["expectedVerdict"]
                and reasons == probe["expectedReasons"]
                and citation == probe["expectedCitation"]
            )
            results.append({**probe, "actualVerdict": verdict, "actualReasons": reasons,
                            "actualCitation": citation, "match": match})
        return {
            "checked": len(results),
            "passed": sum(1 for r in results if r["match"]),
            "details": results,
            "firstFailure": next((r["name"] for r in results if not r["match"]), None),
        }

    def summary(self):
        return {
            "nodes": len(self.nodes),
            "nodeDerivation": {"census": 462, "phases": 12, "product": 462 * 12},
            "seamCatalog": len(self.seam_moves),
            "seamCatalogDerivation": {
                "familyA": len(self.catalog["familyA"]["edges"]),
                "familyB": len(self.catalog["familyB"]["edges"]),
            },
            "tier1": self.tier1_count,
            "tier1Derivation": {
                "familySizeSquares": self.family_size_squares,
                "phases": 12,
                "product": 12 * self.family_size_squares,
                "includesSelf": True,
            },
            "boundaryTransit": self.boundary["count"],
            "boundaryDerivation": {
                "exits": len(self.boundary["exits"]),
                "entries": len(self.boundary["entries"]),
                "distinctRows": self.boundary["distinctRows"],
            },
            "offices": len(self.office_names),
            "governsEdges": self.governs_edges,
            "repo": self.repo,
        }


class Handler(BaseHTTPRequestHandler):
    model = None

    def _headers(self, code, length):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(length))
        self.end_headers()

    def _send(self, code, payload):
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self._headers(code, len(body))
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._headers(204, 0)

    def do_GET(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        try:
            if parsed.path == "/api/nodes":
                self._send(200, {
                    "schemaVersion": "governed-loop.orrery-nav.nodes.v1",
                    "count": len(self.model.nodes),
                    "derivation": {"census": 462, "phases": 12},
                    "offices": self.model.office_names,
                    "nodes": self.model.nodes,
                })
            elif parsed.path == "/api/legal-moves":
                self._send(200, {
                    "schemaVersion": "governed-loop.orrery-nav.legal-moves.v1",
                    "count": len(self.model.seam_moves),
                    "moves": self.model.seam_moves,
                })
            elif parsed.path == "/api/tier1-moves":
                node = query.get("node", [None])[0]
                if node is None:
                    moves = self.model.tier1_catalog()
                    self._send(200, {
                        "schemaVersion": "governed-loop.orrery-nav.tier1-moves.v1",
                        "count": len(moves),
                        "nodes": sum(1 for n in self.model.nodes if n["governingRoot"] is not None),
                        "moves": moves,
                    })
                else:
                    if "@" not in node:
                        self._send(400, {"error": "node must be mask@phase"})
                        return
                    mask_text, phase_text = node.split("@", 1)
                    mask, phase = int(mask_text), int(phase_text)
                    moves = self.model.tier1_for(mask, phase)
                    self._send(200, {
                        "schemaVersion": "governed-loop.orrery-nav.tier1-moves.v1",
                        "node": f"{mask}@{phase}",
                        "count": len(moves),
                        "moves": moves,
                    })
            elif parsed.path == "/api/boundary-transit":
                self._send(200, {
                    "schemaVersion": "governed-loop.orrery-nav.boundary-transit.v1",
                    "count": self.model.boundary["count"],
                    "distinctRows": self.model.boundary["distinctRows"],
                    "semantics": BOUNDARY_SEMANTICS,
                    "rows": self.model.boundary["rows"],
                })
            else:
                self._send(404, {"error": "not found", "readOnly": True})
        except (KeyError, ValueError) as exc:
            self._send(400, {"error": str(exc)})

    def _reject_write(self):
        self._send(405, {"error": "read-only bridge: no write route exists"})

    do_POST = _reject_write
    do_PUT = _reject_write
    do_DELETE = _reject_write
    do_PATCH = _reject_write

    def log_message(self, fmt, *args):
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    model = Model()
    summary = model.summary()
    print("ORRERY-NAV-1 BRIDGE")
    print(json.dumps(summary, indent=2, sort_keys=True))
    if args.check:
        return

    Handler.model = model
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"serving read-only on http://127.0.0.1:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
