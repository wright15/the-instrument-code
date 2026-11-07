#!/usr/bin/env python3
"""Guarded L28 landing script for MVP8.1-DIR-1. Refuses unless authorized and
the adjudication outcome is ADOPT_RUNTIME_READING."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RECEIPT = ROOT / "task-e" / "mvp8_1_task_e_receipt.json"


def main():
    if "--authorize-l28" not in sys.argv:
        print("NOT AUTHORIZED: pass --authorize-l28 after a governance ruling")
        return 2
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    outcome = receipt["adjudication"]["outcome"]
    if outcome != "ADOPT_RUNTIME_READING":
        print(f"NOT AUTHORIZED: outcome is {outcome}")
        return 2
    print("AUTHORIZED: the L28 landing cascade would run here")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
