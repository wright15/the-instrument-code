#!/usr/bin/env python3
"""MVP8.6 functional-harmony tests (scratch-authored, landed as L35).

Covers the F-term arithmetic (Bet F4), the hybrid P-term matcher (Bet F2), the
measured bet receipts (F1-F4), the signed ear gate (Bet D), the eight fences,
and the Option C lookup invariant.
"""
import ast
import json
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
OBS = REPO / "tools/governed-loop/node-observatory"
sys.path.insert(0, str(OBS))

import mvp8_6_harmonic as harmonic

F_TABLE_D50 = {
    1: {"H1": 23, "H2": 11, "H3": 0, "H4": -11, "H5": -23},
    2: {"H1": 11, "H2": 5, "H3": 0, "H4": -5, "H5": -11},
    3: {"H1": 8, "H2": 4, "H3": 0, "H4": -4, "H5": -8},
    4: {"H1": 7, "H2": 3, "H3": 0, "H4": -3, "H5": -7},
    5: {"H1": 15, "H2": 7, "H3": 0, "H4": -7, "H5": -15},
    6: {"H1": 8, "H2": 4, "H3": 0, "H4": -4, "H5": -8},
    7: {"H1": 7, "H2": 3, "H3": 0, "H4": -3, "H5": -7},
}
F_TABLE_D60 = {
    1: {"H1": 19, "H2": 9, "H3": 0, "H4": -9, "H5": -19},
    2: {"H1": 9, "H2": 4, "H3": 0, "H4": -4, "H5": -9},
    3: {"H1": 6, "H2": 3, "H3": 0, "H4": -3, "H5": -6},
    4: {"H1": 5, "H2": 2, "H3": 0, "H4": -2, "H5": -5},
    5: {"H1": 12, "H2": 6, "H3": 0, "H4": -6, "H5": -12},
    6: {"H1": 7, "H2": 3, "H3": 0, "H4": -3, "H5": -7},
    7: {"H1": 6, "H2": 3, "H3": 0, "H4": -3, "H5": -6},
}
RECEIPTS = (
    "qa/mvp8_6_task_0_receipt.json",
    "qa/mvp8_6_task_a_receipt.json",
    "qa/mvp8_6_task_b_receipt.json",
    "qa/mvp8_6_task_c_receipt.json",
    "qa/mvp8_6_task_d_receipt.json",
    "qa/mvp8_6_task_e_receipt.json",
    "qa/mvp8_6_fence_audit.json",
    "qa/mvp8_6_ear_scorecard.json",
    "tools/governed-loop/node-observatory/mvp8_6_predeclared_bets.json",
    "tools/governed-loop/node-observatory/mvp8_6_ear_manifest.json",
)
VERBATIM_KEYS = {"verbatim", "verbatimNotes", "overallVerbatim",
                 "verdictNotes", "armAVerbatimNotes", "sttKey"}
ROMAN = re.compile(r"\b(VII|VI|IV|V|III|II|I)\b", re.ASCII)


def load(relative_path):
    return json.loads((REPO / relative_path).read_text(encoding="utf-8"))


def find_floats(value, path="root"):
    found = []
    if isinstance(value, float):
        found.append(path)
    elif isinstance(value, dict):
        for key, child in value.items():
            found.extend(find_floats(child, f"{path}.{key}"))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(find_floats(child, f"{path}[{index}]"))
    return found


def iter_strings(value, path="root", skip_keys=frozenset()):
    if isinstance(value, str):
        yield path, value
    elif isinstance(value, dict):
        for key, child in value.items():
            if key in skip_keys:
                continue
            yield from iter_strings(child, f"{path}.{key}", skip_keys)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from iter_strings(child, f"{path}[{index}]", skip_keys)


def test_f_term_table_and_divisor():
    assert harmonic.F_TERM_DIVISOR == 50
    assert harmonic.W_BASE == 50
    assert harmonic.WEIGHTS_DENOMINATOR == 407
    assert harmonic.CHALDEAN_WEIGHTS == {1: 116, 2: 56, 3: 41, 4: 35,
                                        5: 77, 6: 44, 7: 38}
    assert harmonic.f_table(50) == F_TABLE_D50
    assert harmonic.f_table(60) == F_TABLE_D60


def test_f_term_truncation_toward_zero():
    assert harmonic.f_term(1, "H1") == 23
    assert harmonic.f_term(1, "H4") == -11
    assert harmonic.f_term(5, "H1") == 15
    assert harmonic.trunc_div(-58, 50) == -1
    assert harmonic.trunc_div(-50, 50) == -1
    assert harmonic.trunc_div(58, 50) == 1


def test_walk_pattern_matcher():
    plagal = harmonic.PATTERNS["plagal_4_1"]
    assert plagal["kind"] == "walk"
    assert harmonic.match_step(plagal, 0, (4, 2, 3), (0, 4, 7)) is True
    assert harmonic.match_step(plagal, 0, (5, 2, 3), (0, 4, 7)) is False
    assert harmonic.match_step(plagal, 1, (1, 2, 3), (0, 3, 7)) is True
    assert harmonic.match_step(plagal, 1, (1, 1, 3), (0, 3, 7)) is False
    assert harmonic.p_term_for(plagal, 1, (1, 2, 3), (0, 3, 7)) == 50
    for name, walk in (("authentic_5_1", ((5, 2), (1, 2))),
                       ("deceptive_5_6", ((5, 2), (6, 2)))):
        pattern = harmonic.PATTERNS[name]
        assert tuple(tuple(entry) for entry in pattern["walk"]) == walk


def test_andalusian_exact_matcher():
    target = harmonic.PATTERNS["andalusian"]
    assert target["kind"] == "exact"
    assert harmonic.match_step(target, 0, (1, 2, 3), (0, 3, 7)) is True
    assert harmonic.match_step(target, 0, (1, 2, 3), (0, 4, 7)) is False
    assert harmonic.match_step(target, 3, (5, 1, 3), (0, 1, 4)) is True
    assert harmonic.match_step(target, 3, (5, 1, 3), (0, 4, 7)) is False


def test_bet_f1_receipt():
    receipt = load("qa/mvp8_6_task_a_receipt.json")
    bet = receipt["bets"]["F1"]
    assert bet["pass"] is True
    assert len(bet["arms"]) == 3
    for arm in bet["arms"]:
        assert arm["terminatedReason"] == "completed"
        assert arm["steps"] == 20
        assert arm["distinctStates"] >= 21
        assert arm["distinctFamilies"] >= 3
        assert arm["seamTransitions"] >= 7
        assert arm["gateCalls"] == arm["gateAccepts"] >= 20


def test_bet_f2_receipt():
    receipt = load("qa/mvp8_6_task_b_receipt.json")
    bet = receipt["bets"]["F2"]
    assert bet["pass"] is True
    per = bet["perPattern"]
    expected = {"plagal_4_1": 19, "authentic_5_1": 19,
                "deceptive_5_6": 18, "andalusian": 9}
    totals = {"plagal_4_1": 193, "authentic_5_1": 192,
              "deceptive_5_6": 184, "andalusian": 21}
    early = {"plagal_4_1": 1, "authentic_5_1": 1,
             "deceptive_5_6": 2, "andalusian": 0}
    for name, arms in expected.items():
        assert per[name]["completedArmsWithCompletion"] == arms
        assert per[name]["totalCompletions"] == totals[name]
        assert len(per[name]["earlyTerminatedArms"]) == early[name]
        assert per[name]["pass"] is True
    assert per["andalusian"]["l34Control"]["armsWithCompletion"] == 9


def test_bet_f3_receipt():
    receipt = load("qa/mvp8_6_task_a_receipt.json")
    bet = receipt["bets"]["F3"]
    assert bet["pass"] is True
    assert bet["delta"] == 0
    assert bet["llmCalls"] == 0
    assert receipt["llmCalls"] == 0


def test_bet_f4_receipt_and_baseline():
    receipt = load("qa/mvp8_6_task_a_receipt.json")
    bet = receipt["bets"]["F4"]
    assert bet["pass"] is True
    overall = bet["allPatternArms"]
    assert overall["sumF"] == 13704
    assert overall["count"] == 1095
    assert overall["meanAtLeastPlus5"] is True
    baseline = bet["l34Baseline"]["allPatternArms"]
    assert baseline["sumF"] == 13697
    assert baseline["count"] == 1096


def test_signed_ear_gate():
    manifest = load("tools/governed-loop/node-observatory/"
                    "mvp8_6_ear_manifest.json")
    scorecard = load("qa/mvp8_6_ear_scorecard.json")
    for document in (manifest, scorecard):
        assert document["status"] == "SIGNED"
        assert document["signed"] is True
        assert document["signedBy"] == "Erick"
        assert document["signedAt"] == "2026-11-15"
        assert document["overallVerdict"] == "adopt"
        assert "no reason not to adopt" in document["overallVerbatim"]
    assert manifest["signedVerdicts"] == {"armA": "adopt", "armB": "adopt",
                                          "armC": "adopt"}
    for arm in ("A", "B", "C"):
        assert manifest["arms"][arm]["verdict"] == "adopt"
        assert manifest["arms"][arm]["sttKey"] is None
        assert manifest["arms"][arm]["verbatim"]
        assert scorecard["arms"][arm]["verdict"] == "adopt"
        assert scorecard["arms"][arm]["sttKey"] is None


def test_eight_fences_audit():
    audit = load("qa/mvp8_6_fence_audit.json")
    expected = {"noRomanNumeralLabels", "noWeightsInOntology",
                "zeroSymbolicFloats", "cHNull", "qEngineUntouchedUnadmitted",
                "bandsHypothesis", "noLlmTasteClaims", "degreesAndStride"}
    assert set(audit["fences"]) == expected
    assert all(row["pass"] is True for row in audit["fences"].values())


def test_lookup_stays_unpatched():
    lines = (REPO / "tools/governed-loop/mvp4/task-a/mvp4_task_a.py"
             ).read_text(encoding="utf-8").splitlines()
    assert lines[165].strip() == "def degree(self, mask):"
    assert lines[166].strip() == "return self.model.office.get(mask)"
    assert lines[216].strip() == ("base = self.weights.get(degree, "
                                  "self.w_seam_base)")


def test_weights_not_in_ontology():
    ladder = (OBS / "degree_ladder.py").read_text(encoding="utf-8")
    for token in ("CHALDEAN_WEIGHTS", "weights_numerator",
                  "weightsNumerator", "116", "77"):
        assert token not in ladder
    steering = (OBS / "mvp8_6_harmonic.py").read_text(encoding="utf-8")
    assert "CHALDEAN_WEIGHTS" in steering
    assert "F_TERM_DIVISOR = 50" in steering
    assert "W_BASE = 50" in steering


def test_receipts_have_no_floats():
    for relative_path in RECEIPTS:
        assert find_floats(load(relative_path)) == []
    module = OBS / "mvp8_6_harmonic.py"
    tree = ast.parse(module.read_text(encoding="utf-8"))
    assert not any(isinstance(node, ast.Constant)
                   and isinstance(node.value, float)
                   for node in ast.walk(tree))


def test_no_roman_numeral_labels_in_records():
    for relative_path in RECEIPTS:
        for json_path, text in iter_strings(load(relative_path),
                                            skip_keys=VERBATIM_KEYS):
            assert ROMAN.search(text) is None, (relative_path, json_path, text)


def test_guards():
    for relative_path in RECEIPTS:
        guard = load(relative_path).get("guards")
        if guard is None:
            continue
        assert guard["globalCHNull"] is True
        assert guard["causationClaim"] is False
        assert guard["physicalQuantityClaim"] is False
        assert guard["tierClassifier"] is False
        assert guard["gov517_correspondence_claimed"] is False
        assert guard["qEngineAdmissionStatus"] == "unadmitted"
        assert guard["harmonicBandStatus"] == "stated_hypothesis"
        assert guard["llmCalls"] == 0


def test_predeclared_thresholds_frozen():
    predecl = load("tools/governed-loop/node-observatory/"
                   "mvp8_6_predeclared_bets.json")
    assert predecl["status"] == "locked-before-evaluation"
    assert predecl["taskA"]["divisor"] == 50
    assert predecl["taskA"]["scope"].startswith("tier-1 candidates only")
    assert predecl["taskB"]["matcher"]["walks"].startswith("(degree, stride)")
    assert predecl["taskB"]["matcher"]["andalusian"].startswith("exact")
    assert ">=15/20 arms per 2-bar" in predecl["bets"]["F2"]["threshold"]
    assert ">=8/20 arms single bar" in predecl["bets"]["F2"]["threshold"]
    assert predecl["bets"]["F4"]["threshold"].startswith("mean tier-1 F >= +5")
    assert predecl["lookupInvariant"]["patched"] is False
