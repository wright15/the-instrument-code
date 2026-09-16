#!/usr/bin/env python3
"""Inventory script ledger consumers and reject literal ledger SHA bindings.

Scope: Python named assignments/dictionary keys (AST), JS/TS named declarations
and ledger-keyed literals (lexical scan). This is a source hygiene check, not a
proof against arbitrary computed/encoded constants or transitive data flow.
"""

import ast
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
HEX = re.compile(r"[0-9a-f]{64}", re.I)
LEDGER = re.compile(r"ledger", re.I)
CONSUMER = re.compile(r"(?:DECISION|OBSERVATION)_LEDGER|(?:decision|observation)Ledger", re.I)
JS_ASSIGN = re.compile(
    r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*(?::\s*string\s*)?=\s*['\"]([0-9a-f]{64})['\"]", re.I
)
JS_LEDGER = re.compile(
    r"['\"]?([\w$]*ledger[\w$]*)['\"]?\s*[:=]\s*['\"]([0-9a-f]{64})['\"]", re.I
)


def inspect(root: Path, allowlist: list[dict]) -> dict:
    if not (root / "scripts").is_dir():
        raise ValueError("missing_script_inventory_root")
    allowed = {}
    for item in allowlist:
        if set(item) != {"path", "name", "sha256", "reason"}:
            raise ValueError("invalid_allowlist_fields")
        if not isinstance(item["reason"], str) or not item["reason"].strip():
            raise ValueError("allowlist_reason_required")
        if not all(isinstance(item[key], str) and item[key] for key in ("path", "name", "sha256")):
            raise ValueError("invalid_allowlist_identity")
        if LEDGER.search(item["name"]) or not HEX.fullmatch(item["sha256"]):
            raise ValueError("ledger_pin_cannot_be_allowlisted_or_invalid_digest")
        key = (item["path"], item["name"], item["sha256"].lower())
        if key in allowed:
            raise ValueError("duplicate_allowlist_entry")
        allowed[key] = item["reason"]

    constants, consumers, violations, used = [], [], [], set()
    paths = sorted(path for path in (root / "scripts").rglob("*")
                   if path.is_file() and path.suffix in {".py", ".js", ".mjs", ".cjs", ".ts"}
                   and not {"__pycache__", "node_modules"}.intersection(path.parts))
    for path in paths:
        relative = path.relative_to(root).as_posix()
        text = path.read_text(encoding="utf-8")
        if CONSUMER.search(text):
            consumers.append(relative)
        found = set()
        if path.suffix == ".py":
            for node in ast.walk(ast.parse(text, filename=relative)):
                if isinstance(node, (ast.Assign, ast.AnnAssign)):
                    targets = node.targets if isinstance(node, ast.Assign) else [node.target]
                    if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str) and HEX.fullmatch(node.value.value):
                        for target in targets:
                            if isinstance(target, ast.Name):
                                found.add((target.id, node.value.value.lower(), node.lineno))
                if isinstance(node, ast.Dict):
                    for key, value in zip(node.keys, node.values):
                        if (isinstance(key, ast.Constant) and isinstance(key.value, str) and LEDGER.search(key.value)
                            and isinstance(value, ast.Constant) and isinstance(value.value, str) and HEX.fullmatch(value.value)):
                            found.add((key.value, value.value.lower(), value.lineno))
        else:
            for pattern in (JS_ASSIGN, JS_LEDGER):
                for match in pattern.finditer(text):
                    found.add((match[1], match[2].lower(), text.count("\n", 0, match.start()) + 1))
        for name, digest, line in sorted(found):
            key = (relative, name, digest)
            record = {"path": relative, "name": name, "sha256": digest, "line": line}
            if LEDGER.search(name):
                violations.append({**record, "reason": "literal_ledger_pin"})
            elif key not in allowed:
                violations.append({**record, "reason": "unreviewed_literal_pin"})
            else:
                used.add(key)
                record["reason"] = allowed[key]
            constants.append(record)
    for key in allowed.keys() - used:
        violations.append({"path": key[0], "name": key[1], "reason": "unused_allowlist_entry"})
    return {"verdict": "FAIL" if violations else "PASS", "filesScanned": len(paths),
            "ledgerConsumers": consumers, "literalPins": constants, "violations": violations}


if __name__ == "__main__":
    result = inspect(ROOT, json.loads((ROOT / "schemas/ledger-pin-allowlist.json").read_text()))
    print(json.dumps(result, indent=2, sort_keys=True))
    raise SystemExit(1 if result["violations"] else 0)
