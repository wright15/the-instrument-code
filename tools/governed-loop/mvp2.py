#!/usr/bin/env python3
"""MVP-2a — the licensed loop: human proposer, Tier-2 seam gate, dispute flag.

State is a lifted pair (mask, phase). Gate v2 rules (adjudicated order):
  1 membership  2 self  3 Tier 1 (same governed family AND same phase)
  4 Tier 2A (R1/L1 lifted image, carry +1/-1, recomputed from frozen substrate)
  5 Tier 2B (Family B bridge pair, same phase, derived at freeze)
  6 boundary veto  7 else unlicensed-transition
Record-only audits never veto. No floats in the gate path.

v2-P4 interpretation (flagged): Tier 1 requires same phase as well as same
governing root, honoring the load-bearing "no free phase steps" clause; a
same-mask phase shift with no operator image is rejected.

Commands:
  regression  mixed-random v0-emulation + v2 runs, comparisons, reports
  oracle      exhaustive R1/L1 (420 rows) + Family B (42 pairs, both directions)
              + negative checks
  script      scripted session from a canned JSON file (smoke tests)
  play        interactive human session (CLI)
  verify      recompute a gate-log hash chain
"""
import argparse
import hashlib
import json
import sys
from collections import Counter
from random import Random

SCRATCH = "/home/erick/workspace/governed-loop"
GT_PATH = f"{SCRATCH}/frozen_ground_truth.json"
SUB_PATH = f"{SCRATCH}/frozen_seam_substrate.json"
MVP1_LOG = f"{SCRATCH}/gate_log.jsonl"
INITIAL_STATE = (1387, 0)
GENESIS = "0" * 64


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def sha256_text(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def fail(msg):
    print(f"FAIL: {msg}")
    sys.exit(1)


def parse_free(spec, default_phase):
    """Parse a free-entry spec. Accepts `<mask>`, `<mask>:<phase>`, or `<mask> <phase>`.

    Returns (mask, phase); raises ValueError on malformed input or a phase
    outside 0..11. Mask membership is deliberately NOT checked here: free entry
    exists to probe vetoes (e.g. not-census-state), so the gate classifies it.
    """
    text = str(spec).strip().replace(":", " ")
    parts = text.split()
    if not parts or len(parts) > 2:
        raise ValueError(f"bad free spec: {spec!r}")
    mask = int(parts[0])
    phase = int(parts[1]) if len(parts) > 1 else default_phase
    if not (0 <= phase <= 11):
        raise ValueError(f"phase {phase} outside 0..11")
    return mask, phase


class World:
    def __init__(self):
        gt = json.load(open(GT_PATH))
        sub = json.load(open(SUB_PATH))
        self.gt = gt
        self.sub = sub
        self.masks = {int(k): v for k, v in gt["census"]["masks"].items()}
        self.role = {int(k): v for k, v in gt["census"]["role"].items()}
        self.tier = {int(k): v for k, v in gt["census"]["tier"].items()}
        self.pc_sum = {int(k): v for k, v in gt["census"]["pcSum"].items()}
        self.office = {int(k): v for k, v in gt["census"]["office"].items()}
        self.office_index = {int(k): v for k, v in gt["census"]["officeIndex"].items()}
        self.parent = {int(k): v for k, v in gt["governs"]["parent"].items()}
        self.parent_mode = {int(k): v for k, v in gt["governs"]["parentMode"].items()}
        self.gov_root = {int(k): v for k, v in gt["governingRoot"].items()}
        self.families = {int(k): v for k, v in gt["families"].items()}
        self.orbit_of = {}
        for o in gt["orbits"]:
            for sid in o["memberIds"]:
                self.orbit_of[sid] = o["orbitId"]
        self.census_ids = sorted(self.masks)
        self.carries = {k: int(v) for k, v in sub["carries"].items()}
        self.rl = {int(k): [tuple(x) for x in v] for k, v in sub["rlImages"].items()}
        self.pairs = sub["familyBPairs"]
        bridges = {}
        for p in self.pairs:
            l, r = p["leftMask"], p["rightMask"]
            bridges.setdefault(l, [])
            if r not in bridges[l]:
                bridges[l].append(r)
            bridges.setdefault(r, [])
            if l not in bridges[r]:
                bridges[r].append(l)
        self.bridges = bridges
        # integer orbit-phase sums (record-only audit context; zero floats)
        self.orbit_phase_sum = {}
        for o in gt["orbits"]:
            members = o["memberIds"]
            sums = []
            for c in range(12):
                s = 0
                for m in members:
                    for pc in range(12):
                        if (m >> pc) & 1:
                            s += (pc + c) % 12
                sums.append(s)
            self.orbit_phase_sum[o["orbitId"]] = {"sums": sums, "n": len(members)}

    # ---- audits -----------------------------------------------------------
    def audit(self, m, p):
        oid = self.orbit_of.get(m)
        aud = {
            "role": self.role[m],
            "tier": self.tier[m],
            "pcSum": self.pc_sum[m],
            "office": self.office[m],
            "officeIndex": self.office_index[m],
            "orbit": oid,
            "governingRoot": self.gov_root[m],
            "attachmentMode": self.parent_mode.get(m),
            "phase": p,
        }
        if oid is not None:
            rec = self.orbit_phase_sum[oid]
            aud["orbitPhaseSum"] = rec["sums"][p % 12]
            aud["orbitMemberCount"] = rec["n"]
        return aud

    # ---- gate v2 ----------------------------------------------------------
    def gate(self, cur, cand, tier2=True):
        cm, cp = cur
        nm, np_ = cand
        checks = {}
        if nm not in self.masks:
            return "REJECT", ["not-census-state"], {"candidate_membership": False}, None
        checks["candidate_membership"] = True
        checks["hamming"] = bin(self.masks[cm] ^ self.masks[nm]).count("1")
        checks["phaseDelta"] = (np_ - cp) % 12
        checks["current_audit"] = self.audit(cm, cp)
        checks["candidate_audit"] = self.audit(nm, np_)
        checks["self_transition"] = (cm == nm and cp == np_)
        if cm == nm and cp == np_:
            if self.gov_root[cm] is None:
                checks["boundary_endpoint"] = True
                checks["same_family"] = False
                return "REJECT", ["ungoverned-transition"], checks, None
            checks["same_family"] = True
            return "ACCEPT", [], checks, None

        cr, nr = self.gov_root[cm], self.gov_root[nm]
        checks["current_governing_root"] = cr
        checks["candidate_governing_root"] = nr
        checks["boundary_endpoint"] = cr is None or nr is None
        known = False
        if nm in self.parent and self.parent[nm] == cm:
            known = True
        if cm in self.parent and self.parent[cm] == nm:
            known = True
        checks["pair_known_attachment"] = known

        same_root = cr is not None and nr is not None and cr == nr
        checks["same_family"] = same_root
        if same_root and cp == np_:
            return "ACCEPT", [], checks, None

        if tier2:
            for op, tgt in self.rl.get(cm, []):
                carry = self.carries[op]
                if nm == tgt and np_ == (cp + carry) % 12:
                    return "ACCEPT", [], checks, f"FamilyA:{op}"
            for pm in self.bridges.get(cm, []):
                if nm == pm and np_ == cp:
                    return "ACCEPT", [], checks, "FamilyB:bridge"

        if checks["boundary_endpoint"]:
            return "REJECT", ["ungoverned-transition"], checks, None
        return "REJECT", ["unlicensed-transition"], checks, None

    # ---- menus ------------------------------------------------------------
    def menu(self, cur):
        cm, cp = cur
        entries = []
        if self.gov_root[cm] is not None:
            for m in self.families[self.gov_root[cm]]:
                entries.append({"kind": "family", "mask": m, "phase": cp})
        for op, tgt in self.rl.get(cm, []):
            carry = self.carries[op]
            entries.append({"kind": f"seamA:{op}", "mask": tgt, "phase": (cp + carry) % 12})
        for pm in self.bridges.get(cm, []):
            entries.append({"kind": "seamB:bridge", "mask": pm, "phase": cp})
        return entries

    # ---- ledger -----------------------------------------------------------
    def append_line(self, lines, prev, seq, cur, cand, verdict, reasons, checks, cite,
                    arm, dispute, choice):
        line = {
            "seq": seq,
            "current": [cur[0], cur[1]],
            "candidate": [cand[0], cand[1]],
            "verdict": verdict,
            "reasons": reasons,
            "checks": checks,
            "proposerArm": arm,
            "dispute": bool(dispute),
            "seamCitation": cite,
            "choice": choice,
            "prev_hash": prev,
        }
        text = canonical(line)
        return text, sha256_text(text)


def write_log(path, lines):
    payload = "\n".join(lines) + "\n"
    with open(path, "w") as f:
        f.write(payload)
    return hashlib.sha256(payload.encode()).hexdigest()


def verify_chain(path):
    prev = GENESIS
    expected = None
    n = 0
    errors = []
    with open(path) as f:
        for raw in f:
            text = raw.rstrip("\n")
            n += 1
            try:
                line = json.loads(text)
            except json.JSONDecodeError as exc:
                errors.append(f"line {n}: invalid JSON: {exc}")
                break
            if canonical(line) != text:
                errors.append(f"line {n}: non-canonical serialization")
            if line.get("prev_hash") != prev:
                errors.append(f"line {n}: prev_hash mismatch")
            if expected is not None and line.get("current") != expected:
                errors.append(f"line {n}: current-state discontinuity")
            expected = line.get("candidate") if line.get("verdict") == "ACCEPT" else line.get("current")
            prev = sha256_text(text)
    return {"ok": not errors, "lines": n, "errors": errors, "finalHash": prev}


# ---------------------------------------------------------------------------
# mixed-random regression
# ---------------------------------------------------------------------------

def run_mixed(world, steps, seed, tier2, out_path):
    rng = Random(seed)
    cur = INITIAL_STATE
    lines = []
    prev = GENESIS
    metrics = {
        "steps": steps, "seed": seed, "tier2": tier2,
        "accepts": 0, "vetoes": 0,
        "reasonCounts": Counter(), "armCounts": Counter(), "armAccepts": Counter(),
        "tier2Accepts": 0, "citedAccepts": Counter(), "selfTransitions": 0,
        "boundaryCandidates": 0, "boundaryVetoes": 0,
        "attributionViolations": 0, "decisions": [],
    }
    for seq in range(steps):
        current_before = cur
        if rng.random() < 0.5:
            fam = world.families[world.gov_root[cur[0]]]
            nm = fam[rng.randrange(len(fam))]
            arm = "in_family"
        else:
            nm = world.census_ids[rng.randrange(len(world.census_ids))]
            arm = "uniform"
        cand = (nm, cur[1])
        verdict, reasons, checks, cite = world.gate(cur, cand, tier2=tier2)
        # attribution invariant: v0 verdict must persist unless Tier 2 licensed
        v0v, _, _, _ = world.gate(cur, cand, tier2=False)
        if not (v0v == verdict or (verdict == "ACCEPT" and cite)):
            metrics["attributionViolations"] += 1
        metrics["armCounts"][arm] += 1
        if world.role[nm] == "boundary":
            metrics["boundaryCandidates"] += 1
        if checks.get("self_transition"):
            metrics["selfTransitions"] += 1
        if verdict == "ACCEPT":
            metrics["accepts"] += 1
            metrics["armAccepts"][arm] += 1
            if cite:
                metrics["tier2Accepts"] += 1
                metrics["citedAccepts"][cite] += 1
            cur = cand
        else:
            metrics["vetoes"] += 1
            for r in reasons:
                metrics["reasonCounts"][r] += 1
            if checks.get("boundary_endpoint"):
                metrics["boundaryVetoes"] += 1
        text, prev = world.append_line(lines, prev, seq, current_before, cand, verdict,
                                       reasons, checks, cite, "mixed-random", False, None)
        lines.append(text)
        metrics["decisions"].append([current_before[0], cand[0], verdict])
    file_sha = write_log(out_path, lines)
    metrics.pop("decisions")
    metrics["reasonCounts"] = dict(sorted(metrics["reasonCounts"].items()))
    metrics["armCounts"] = dict(sorted(metrics["armCounts"].items()))
    metrics["armAccepts"] = dict(sorted(metrics["armAccepts"].items()))
    metrics["citedAccepts"] = dict(sorted(metrics["citedAccepts"].items()))
    metrics["vetoRate"] = metrics["vetoes"] / steps
    metrics["gateLog"] = out_path
    metrics["gateLogSha256"] = file_sha
    metrics["finalState"] = [cur[0], cur[1]]
    metrics["chain"] = verify_chain(out_path)
    return metrics


def cmd_regression(world, steps=1000):
    ref_log = MVP1_LOG if steps == 1000 else f"{SCRATCH}/gate_log_10k.jsonl"
    # v0-emulation identity test vs MVP-1 reference ledger
    emul = run_mixed(world, steps, 42, tier2=False, out_path=f"{SCRATCH}/gate_log_mvp2_v0emul_{steps}.jsonl")
    mvp1 = [json.loads(l) for l in open(ref_log)]
    mvp1_seq = [[l["current"], l["candidate"], l["verdict"]] for l in mvp1]
    emul_seq = []
    for l in (json.loads(x) for x in open(emul["gateLog"])):
        emul_seq.append([l["current"][0], l["candidate"][0], l["verdict"]])
    identity = mvp1_seq == emul_seq
    emul["mvp1DecisionSequenceIdentity"] = identity
    emul["mvp1ReferenceSha256"] = hashlib.sha256(open(MVP1_LOG, "rb").read()).hexdigest()[:16] + "…"

    # v2 run
    v2 = run_mixed(world, steps, 42, tier2=True, out_path=f"{SCRATCH}/gate_log_mvp2_regression_{steps}.jsonl")
    decisions = v2.pop("decisions") if "decisions" in v2 else None
    # divergence analysis needs the sequence; recompute from ledger
    v2_lines = [json.loads(x) for x in open(v2["gateLog"])]
    v2_seq = [[l["current"][0], l["candidate"][0], l["verdict"]] for l in v2_lines]
    first_div = None
    for i, (a, b) in enumerate(zip(mvp1_seq, v2_seq)):
        if a != b:
            first_div = i
            break
    div_kind = None
    if first_div is not None:
        line = v2_lines[first_div]
        div_kind = {
            "index": first_div,
            "v0": mvp1_seq[first_div],
            "v2": v2_seq[first_div],
            "citation": line.get("seamCitation"),
            "isTier2": bool(line.get("seamCitation")) and line.get("verdict") == "ACCEPT",
        }
    expected = 0.49242424242424243
    import math
    se = math.sqrt(expected * (1 - expected) / steps)
    v2["preRegistration"] = {
        "expectedVetoRate": expected,
        "plan": "veto rate <= 49.24% in expectation (Tier 2 widens acceptance only); exact per-line attribution invariant enforced",
        "observedVetoRate": v2["vetoRate"],
        "z": (v2["vetoRate"] - expected) / se,
        "ci95": [expected - 1.96 * se, expected + 1.96 * se],
        "tier2Accepts": v2["tier2Accepts"],
        "preregWidths": world.sub["preregistration"],
        "firstDivergence": div_kind,
        "mvp1DecisionSequenceIdentity": identity,
    }
    emul_report = {k: v for k, v in emul.items() if k != "decisions"}
    with open(f"{SCRATCH}/run_report_mvp2_v0emul_{steps}.json", "w") as f:
        json.dump(emul_report, f, indent=2, sort_keys=True)
        f.write("\n")
    with open(f"{SCRATCH}/run_report_mvp2_regression_{steps}.json", "w") as f:
        json.dump(v2, f, indent=2, sort_keys=True)
        f.write("\n")

    mvp1_rate = sum(1 for l in mvp1 if l["verdict"] == "REJECT") / len(mvp1)
    print("REGRESSION")
    print(f"  v0-emulation vs MVP-1 decision sequence identity: {identity}")
    print(f"  v0-emul veto rate {emul['vetoRate']:.4f} (MVP-1 {mvp1_rate:.4f})")
    print(f"  v2 veto rate {v2['vetoRate']:.4f} | tier2 accepts {v2['tier2Accepts']} {v2['citedAccepts']}")
    print(f"  attribution violations: {v2['attributionViolations']} (emul {emul['attributionViolations']})")
    print(f"  first divergence: {json.dumps(div_kind)}")
    print(f"  chain v0emul {emul['chain']['ok']} | v2 {v2['chain']['ok']}")


# ---------------------------------------------------------------------------
# oracle
# ---------------------------------------------------------------------------

def cmd_oracle(world):
    rows_ok = 0
    tier1_first = 0
    fam_a = 0
    errors = []
    for src_s, images in world.sub["rlImages"].items():
        src = int(src_s)
        for op_s, tgt in images:
            carry = world.carries[op_s]
            verdict, reasons, checks, cite = world.gate((src, 0), (tgt, carry % 12), tier2=True)
            if verdict != "ACCEPT":
                errors.append(f"row {op_s}:{src}:{tgt} not accepted: {reasons}")
            else:
                rows_ok += 1
                if cite == f"FamilyA:{op_s}":
                    fam_a += 1
                elif checks.get("same_family"):
                    tier1_first += 1
                else:
                    errors.append(f"row {op_s}:{src}:{tgt} accepted without FamilyA or Tier1 (cite={cite})")
    # negatives: free phase steps (boundary masks hit the boundary rule first)
    neg_phase = 0
    for m in world.census_ids:
        expected_reason = "ungoverned-transition" if world.role[m] == "boundary" else "unlicensed-transition"
        for ph in (1, 11):
            verdict, reasons, checks, cite = world.gate((m, 0), (m, ph), tier2=True)
            if verdict == "REJECT" and reasons == [expected_reason]:
                neg_phase += 1
            else:
                errors.append(f"free phase step {m}@0->{m}@{ph}: {verdict} {reasons} cite={cite}")
    # family B both directions at phase 0 and 7
    bridge_pos = 0
    bridge_err = 0
    for p in world.pairs:
        for (a, b) in ((p["leftMask"], p["rightMask"]), (p["rightMask"], p["leftMask"])):
            for ph in (0, 7):
                verdict, reasons, checks, cite = world.gate((a, ph), (b, ph), tier2=True)
                if verdict != "ACCEPT":
                    bridge_err += 1
                    errors.append(f"bridge {a}@{ph}->{b}@{ph}: {reasons}")
                else:
                    bridge_pos += 1
                    if cite != "FamilyB:bridge" and not checks.get("same_family"):
                        bridge_err += 1
                        errors.append(f"bridge {a}->{b} accepted without citation (cite={cite})")
        # wrong-phase bridge must not be licensed by Tier 2B
        verdict, reasons, checks, cite = world.gate((p["leftMask"], 0), (p["rightMask"], 1), tier2=True)
        if verdict == "ACCEPT" and cite == "FamilyB:bridge":
            errors.append(f"wrong-phase bridge {p['leftMask']}->{p['rightMask']}@1 licensed")
    report = {
        "rlRowsAccepted": rows_ok,
        "familyACitations": fam_a,
        "tier1First": tier1_first,
        "freePhaseStepNegatives": neg_phase,
        "bridgePositiveChecks": bridge_pos,
        "bridgeErrors": bridge_err,
        "errors": errors,
        "allPass": not errors and rows_ok == 420 and neg_phase == 462 * 2,
    }
    with open(f"{SCRATCH}/oracle_report_mvp2.json", "w") as f:
        json.dump(report, f, indent=2, sort_keys=True)
        f.write("\n")
    print("ORACLE")
    print(f"  R1/L1 rows accepted: {rows_ok}/420 (FamilyA {fam_a}, Tier1-first {tier1_first})")
    print(f"  free-phase negatives: {neg_phase}/{462*2}")
    print(f"  bridge positive checks: {bridge_pos} (errors {bridge_err})")
    print(f"  allPass: {report['allPass']}")
    if errors:
        print("  sample errors:", errors[:5])


# ---------------------------------------------------------------------------
# sessions
# ---------------------------------------------------------------------------

def run_session(world, steps, out_path, mode):
    """steps: list of dicts {"pick"| "free", "dispute"} — deterministic replay."""
    cur = INITIAL_STATE
    lines = []
    prev = GENESIS
    summary = {"accepts": 0, "vetoes": 0, "disputes": 0, "reasons": Counter(), "citations": Counter()}
    for seq, s in enumerate(steps):
        entries = world.menu(cur)
        if "pick" in s:
            idx = int(s["pick"])
            if not (0 <= idx < len(entries)):
                fail(f"script step {seq}: pick {idx} outside menu (0..{len(entries)-1})")
            e = entries[idx]
            cand = (e["mask"], e["phase"])
            choice = f"{e['kind']}:{idx}"
        elif "free" in s:
            try:
                m, ph = parse_free(s["free"], cur[1])
            except ValueError as exc:
                fail(f"script step {seq}: {exc}")
            cand = (m, ph)
            choice = f"free:{m}:{ph}"
        else:
            fail(f"script step {seq}: neither pick nor free")
        verdict, reasons, checks, cite = world.gate(cur, cand, tier2=True)
        dispute = bool(s.get("dispute", False))
        if dispute and verdict != "REJECT":
            fail(f"script step {seq}: dispute set on an accept")
        current_before = cur
        if verdict == "ACCEPT":
            summary["accepts"] += 1
            cur = cand
        else:
            summary["vetoes"] += 1
            for r in reasons:
                summary["reasons"][r] += 1
            if dispute:
                summary["disputes"] += 1
        if cite:
            summary["citations"][cite] += 1
        text, prev = world.append_line(lines, prev, seq, current_before, cand, verdict,
                                       reasons, checks, cite, mode, dispute, choice)
        lines.append(text)
    file_sha = write_log(out_path, lines)
    summary["reasons"] = dict(sorted(summary["reasons"].items()))
    summary["citations"] = dict(sorted(summary["citations"].items()))
    summary["gateLog"] = out_path
    summary["gateLogSha256"] = file_sha
    summary["finalState"] = [cur[0], cur[1]]
    summary["chain"] = verify_chain(out_path)
    return summary


def cmd_script(world, script_path, out_path, report_path):
    script = json.load(open(script_path))
    summary = run_session(world, script["steps"], out_path, "human-scripted")
    with open(report_path, "w") as f:
        json.dump(summary, f, indent=2, sort_keys=True)
        f.write("\n")
    print("SCRIPT SESSION")
    print(json.dumps(summary, indent=2, sort_keys=True))


def cmd_play(world, out_path, report_path):
    cur = INITIAL_STATE
    lines = []
    prev = GENESIS
    summary = {"accepts": 0, "vetoes": 0, "disputes": 0, "reasons": Counter(), "citations": Counter()}
    seq = 0
    print("MVP-2 licensed loop — type a menu number, 'free <mask>[:phase]', or 'q' to quit.")
    while True:
        entries = world.menu(cur)
        print(f"\ncurrent: {cur[0]}@{cur[1]}  ({world.role[cur[0]]}, {world.tier[cur[0]] or '-'}, office {world.office[cur[0]] or '-'})")
        for i, e in enumerate(entries):
            label = e["kind"]
            note = ""
            if label == "family" and e["mask"] == cur[0]:
                note = " (self)"
            print(f"  [{i}] {label:14s} {e['mask']}@{e['phase']}{note}")
        raw = input("choice> ").strip()
        if raw in ("q", "quit", "exit"):
            break
        dispute = False
        if raw.startswith("free"):
            try:
                m, ph = parse_free(raw[4:], cur[1])
            except ValueError:
                print("usage: free <mask> [phase]  |  free <mask>:<phase>")
                continue
            cand = (m, ph)
            choice = f"free:{m}:{ph}"
        else:
            try:
                idx = int(raw)
                e = entries[idx]
            except (ValueError, IndexError):
                print("invalid choice")
                continue
            cand = (e["mask"], e["phase"])
            choice = f"{e['kind']}:{idx}"
        verdict, reasons, checks, cite = world.gate(cur, cand, tier2=True)
        current_before = cur
        if verdict == "ACCEPT":
            print(f"ACCEPT  {cand[0]}@{cand[1]}" + (f"  [{cite}]" if cite else "  [within-family]"))
            summary["accepts"] += 1
            cur = cand
        else:
            print(f"VETO    {reasons[0]}  boundary_endpoint={checks.get('boundary_endpoint', False)}")
            summary["vetoes"] += 1
            for r in reasons:
                summary["reasons"][r] += 1
            ans = input("dispute? (was this veto musically wrong?) [y/N] ").strip().lower()
            dispute = ans == "y"
            if dispute:
                summary["disputes"] += 1
        if cite:
            summary["citations"][cite] += 1
        text, prev = world.append_line(lines, prev, seq, current_before, cand, verdict,
                                       reasons, checks, cite, "human", dispute, choice)
        lines.append(text)
        seq += 1
    file_sha = write_log(out_path, lines)
    summary["reasons"] = dict(sorted(summary["reasons"].items()))
    summary["citations"] = dict(sorted(summary["citations"].items()))
    summary["gateLog"] = out_path
    summary["gateLogSha256"] = file_sha
    summary["finalState"] = [cur[0], cur[1]]
    summary["chain"] = verify_chain(out_path)
    with open(report_path, "w") as f:
        json.dump(summary, f, indent=2, sort_keys=True)
        f.write("\n")
    print("\nSESSION SUMMARY")
    print(json.dumps(summary, indent=2, sort_keys=True))


def cmd_parsetest():
    cases = [
        ("2773:0", 11, (2773, 0)),
        ("2773 0", 11, (2773, 0)),
        ("2773", 11, (2773, 11)),
        ("2773:11", 0, (2773, 11)),
        ("501", 11, (501, 11)),
    ]
    bad = ["", ":", "a:b", "2773:13", "2773:-1", "2773 0 1", "2773:x"]
    passed = 0
    for spec, default, expected in cases:
        got = parse_free(spec, default)
        if got != expected:
            fail(f"parsetest {spec!r}: {got} != {expected}")
        passed += 1
    rejected = 0
    for spec in bad:
        try:
            parse_free(spec, 11)
        except ValueError:
            rejected += 1
        else:
            fail(f"parsetest {spec!r}: expected ValueError")
    print("PARSETEST")
    print(f"  accepted cases: {passed}/{len(cases)}")
    print(f"  rejected cases: {rejected}/{len(bad)}")
    print("  allPass: True")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("command", choices=["regression", "oracle", "script", "play", "verify", "parsetest", "bridge"])
    ap.add_argument("path", nargs="?")
    ap.add_argument("--out", default=None)
    ap.add_argument("--report", default=None)
    ap.add_argument("--steps", type=int, default=1000)
    args = ap.parse_args()

    if args.command == "verify":
        result = verify_chain(args.path)
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["ok"] else 1)

    if args.command == "parsetest":
        cmd_parsetest()
        return

    world = World()
    if args.command == "regression":
        cmd_regression(world, steps=getattr(args, "steps", 1000))
    elif args.command == "oracle":
        cmd_oracle(world)
    elif args.command == "script":
        out = args.out or f"{SCRATCH}/gate_log_mvp2_smoke.jsonl"
        rep = args.report or f"{SCRATCH}/run_report_mvp2_smoke.json"
        cmd_script(world, args.path, out, rep)
    elif args.command == "play":
        out = args.out or f"{SCRATCH}/gate_log_mvp2_live.jsonl"
        rep = args.report or f"{SCRATCH}/run_report_mvp2_live.json"
        cmd_play(world, out, rep)
    elif args.command == "bridge":
        import os
        live = os.environ.get("ORRERY_BRIDGE_MODE", "smoke") == "live"
        log = args.path or f"{SCRATCH}/gate_log_mvp2_live_mac1.jsonl"
        out = f"{SCRATCH}/bridge_live_log.json" if live else f"{SCRATCH}/bridge_smoke_log.json"
        js = f"{SCRATCH}/bridge_replay_live.js" if live else f"{SCRATCH}/bridge_replay.js"
        cmd_bridge(world, log, out, js, f"{SCRATCH}/mvp2_bridge.sh")




# ---------------------------------------------------------------------------
# MVP-2b bridge: gate log -> orrery (read-only Playwright channel)
# ---------------------------------------------------------------------------

def office_a0_pitches(world):
    """Office palette = the A0 anchor's sorted pitch classes + octave root.

    A1/A2 anchors display their own identity but voice the office's A0 palette
    (orrery README); the array order matches the voicing instrumentation.
    """
    out = {}
    for mask, office in world.office.items():
        if office and world.role[mask] == "anchor" and world.tier[mask] == "A0":
            out[office] = sorted(pc for pc in range(12) if (world.masks[mask] >> pc) & 1) + [0]
    if len(out) != 7:
        fail(f"office palette derivation produced {len(out)} offices, expected 7")
    return out


def bridge_plan(world, log_path, live=False):
    lines = [json.loads(x) for x in open(log_path) if x.strip()]
    a_tier_anchors = {s for s in world.masks if world.role[s] == "anchor" and world.tier[s] in ("A0", "A1", "A2")}
    office_pitches = office_a0_pitches(world)
    steps = []
    displayed = 1387
    for line in lines:
        if line["verdict"] == "ACCEPT":
            mask = line["candidate"][0]
            anchor = mask if world.role[mask] == "anchor" else world.gov_root[mask]
            if anchor not in a_tier_anchors:
                fail(f"bridge display anchor {anchor} outside the 21 A0-A2 anchors")
            office = world.office[anchor]
            steps.append({
                "seq": line["seq"],
                "verdict": "ACCEPT",
                "displayAnchor": anchor,
                "expectedHeading": f"{office} {world.tier[anchor]}",
                "expectedPalette": f"{office} {world.tier[anchor]}",
                "newAnchor": anchor != displayed,
                "dispute": bool(line.get("dispute")),
            })
            if office not in office_pitches:
                fail(f"office {office} has no derived bridge pitch expectation")
            steps[-1]["expectedFrequencies"] = office_pitches[office] if anchor != displayed else None
            displayed = anchor
        else:
            steps.append({
                "seq": line["seq"],
                "verdict": "VETO",
                "dispute": bool(line.get("dispute")),
            })
    plan = {
        "schemaVersion": "governed-loop.mvp2b-bridge-plan.v1",
        "sourceLog": log_path,
        "initialAnchor": 1387,
        "replaySpan": 12,
        "enableFrequencies": office_pitches[world.office[1387]],
        "steps": steps,
    }
    if live:
        plan["mode"] = "live"
        plan["dwellMs"] = int(__import__("os").environ.get("ORRERY_BRIDGE_DWELL_MS", "1500"))
    return plan


def bridge_replay_js(plan):
    plan_json = json.dumps(plan, sort_keys=True)
    if plan.get("mode") == "live":
        return f"""async (page) => {{
  const plan = {plan_json};
  const log = {{ mode: "live", steps: [], enable: null, consoleErrors: [], pageErrors: [] }};
  page.on("console", (message) => {{ if (message.type() === "error") log.consoleErrors.push(message.text()); }});
  page.on("pageerror", (error) => log.pageErrors.push(String(error.message)));
  const assert = (condition, label) => {{ if (!condition) throw new Error(label); }};
  const dwell = plan.dwellMs || 0;
  const rest = () => (dwell > 0 ? page.waitForTimeout(dwell) : Promise.resolve());
  const snapshot = () => page.evaluate(() => ({{
    search: window.location.search,
    heading: document.querySelector("#inspector-heading")?.textContent,
    palette: document.querySelector("#selected-audio-palette")?.textContent?.trim(),
    pause: document.querySelector("#audio-pause")?.textContent,
  }}));
  await page.waitForFunction(() => document.querySelector("#inspector-heading")?.textContent === "Saturn A0");
  await page.waitForFunction(() => document.querySelector("#audio-enable")?.disabled === false);
  const pre = await snapshot();
  assert(pre.search === `?anchor=${{plan.initialAnchor}}`, "initial deep-link url: " + pre.search);
  await page.locator("#audio-enable").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector("#audio-pause")?.textContent === "Pause sound");
  log.enable = {{ anchor: plan.initialAnchor, realAudio: true }};
  for (const step of plan.steps) {{
    if (step.verdict === "VETO") {{
      const before = await snapshot();
      const after = await snapshot();
      assert(before.search === after.search && before.palette === after.palette, "veto rest: state held");
      log.steps.push({{ seq: step.seq, verdict: "VETO", rest: true, search: after.search, palette: after.palette, dispute: step.dispute }});
      await rest();
      continue;
    }}
    await page.locator(`button[data-state-id="${{step.displayAnchor}}"]`).click();
    await page.waitForFunction((anchor) => window.location.search === `?anchor=${{anchor}}`, step.displayAnchor);
    const state = await snapshot();
    assert(state.heading === step.expectedHeading, `heading seq ${{step.seq}}: ${{state.heading}}`);
    assert(state.palette.includes(step.expectedPalette), `palette seq ${{step.seq}}: ${{state.palette}}`);
    log.steps.push({{ seq: step.seq, verdict: "ACCEPT", anchor: step.displayAnchor, search: state.search, heading: state.heading, palette: state.palette, dispute: step.dispute }});
    await rest();
  }}
  log.allPass = log.consoleErrors.length === 0 && log.pageErrors.length === 0;
  await page.evaluate((payload) => {{ window.__bridgeLog = payload; }}, JSON.stringify(log));
  return "bridge-live-replay-complete";
}}
"""
    return f"""async (page) => {{
  const plan = {plan_json};
  const log = {{ steps: [], anchors: [], enable: null, consoleErrors: [], pageErrors: [] }};
  page.on("console", (message) => {{ if (message.type() === "error") log.consoleErrors.push(message.text()); }});
  page.on("pageerror", (error) => log.pageErrors.push(String(error.message)));
  const assert = (condition, label) => {{ if (!condition) throw new Error(label); }};
  const pitchClasses = () => page.evaluate(() =>
    window.__orreryAudioEvents.frequencies.map((frequency) => ((Math.round(69 + 12 * Math.log2(frequency / 440)) % 12) + 12) % 12));
  const snapshot = () => page.evaluate(() => ({{
    search: window.location.search,
    heading: document.querySelector("#inspector-heading")?.textContent,
    palette: document.querySelector("#selected-audio-palette")?.textContent?.trim(),
    pause: document.querySelector("#audio-pause")?.textContent,
  }}));
  const dwell = plan.dwellMs || 0;
  const rest = () => (dwell > 0 ? page.waitForTimeout(dwell) : Promise.resolve());

  await page.waitForFunction(() => document.querySelector("#inspector-heading")?.textContent === "Saturn A0");
  await page.waitForFunction(() => document.querySelector("#audio-enable")?.disabled === false);
  const pre = await snapshot();
  assert(pre.search === `?anchor=${{plan.initialAnchor}}`, "initial deep-link url: " + pre.search);

  await page.locator("#audio-enable").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => document.querySelector("#audio-pause")?.textContent === "Pause sound");
  const enableFrequencies = await pitchClasses();
  assert(JSON.stringify(enableFrequencies) === JSON.stringify(plan.enableFrequencies), "enable voicing: " + JSON.stringify(enableFrequencies));
  log.enable = {{ anchor: plan.initialAnchor, pitchClasses: enableFrequencies }};

  for (const step of plan.steps) {{
    if (step.verdict === "VETO") {{
      const before = await snapshot();
      const after = await snapshot();
      assert(before.search === after.search && before.palette === after.palette, "veto rest: state held");
      log.steps.push({{ seq: step.seq, verdict: "VETO", rest: true, search: after.search, palette: after.palette, dispute: step.dispute }});
      await rest();
      continue;
    }}
    if (step.newAnchor) {{
      await page.evaluate(() => {{ window.__orreryAudioEvents.frequencies.length = 0; }});
    }}
    await page.locator(`button[data-state-id="${{step.displayAnchor}}"]`).click();
    await page.waitForFunction((anchor) => window.location.search === `?anchor=${{anchor}}`, step.displayAnchor);
    if (step.newAnchor) {{
      await page.waitForFunction(() => window.__orreryAudioEvents.frequencies.length >= 8);
    }}
    const state = await snapshot();
    assert(state.heading === step.expectedHeading, `heading seq ${{step.seq}}: ${{state.heading}}`);
    assert(state.palette.includes(step.expectedPalette), `palette seq ${{step.seq}}: ${{state.palette}}`);
    let frequencies = null;
    if (step.newAnchor) {{
      frequencies = await pitchClasses();
      assert(JSON.stringify(frequencies) === JSON.stringify(step.expectedFrequencies), `frequencies seq ${{step.seq}}: ${{JSON.stringify(frequencies)}}`);
      log.anchors.push({{ anchor: step.displayAnchor, pitchClasses: frequencies }});
    }}
    log.steps.push({{ seq: step.seq, verdict: "ACCEPT", anchor: step.displayAnchor, search: state.search, heading: state.heading, palette: state.palette, pitchClasses: frequencies, dispute: step.dispute }});
  }}
  log.allPass = log.consoleErrors.length === 0 && log.pageErrors.length === 0;
  await page.evaluate((payload) => {{ window.__bridgeLog = payload; }}, JSON.stringify(log));
  return "bridge-replay-complete";
}}
"""


def cmd_bridge(world, log_path, out_json, js_path, bridge_sh):
    live = __import__("os").environ.get("ORRERY_BRIDGE_MODE", "smoke") == "live"
    plan = bridge_plan(world, log_path, live=live)
    plan_path = f"{SCRATCH}/bridge_plan_live.json" if live else f"{SCRATCH}/bridge_plan.json"
    with open(plan_path, "w") as f:
        json.dump(plan, f, indent=2, sort_keys=True)
        f.write("\n")
    with open(js_path, "w") as f:
        f.write(bridge_replay_js(plan))
    subprocess = __import__("subprocess")
    raw_path = f"{SCRATCH}/bridge_raw_log_live.json" if live else f"{SCRATCH}/bridge_raw_log.json"
    result = subprocess.run(["bash", bridge_sh, js_path, raw_path],
                            capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(result.stderr[-2000:])
        fail("bridge run failed")
    raw = json.load(open(raw_path))
    if isinstance(raw, str):
        raw = json.loads(raw)
    with open(out_json, "w") as f:
        json.dump(raw, f, indent=2, sort_keys=True)
        f.write("\n")
    print("BRIDGE SUMMARY")
    for s in raw["steps"]:
        detail = "rest" if s["verdict"] == "VETO" else f"{s['heading']} -> {s.get('pitchClasses', '(live: no pitch capture)')}"
        print(f"  seq{s['seq']} {s['verdict']} dispute={s['dispute']} {detail}")
    print(f"  mode: {raw.get('mode', 'smoke')} | anchors voiced: {[a['anchor'] for a in raw.get('anchors', [])]}")
    print(f"  console errors: {raw['consoleErrors']} | page errors: {raw['pageErrors']}")

if __name__ == "__main__":
    main()
