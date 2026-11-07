#!/usr/bin/env python3
"""Guarded L28 landing script for MVP8-DIR-1.

This script refuses to execute unless:
  1. --authorize-l28 is passed, and
  2. task-e/mvp8_task_e_receipt.json records outcome ADOPT_RUNTIME_READING or
     CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR.

The current DEFER outcome is not eligible. The script is scratch evidence only.
"""
import json
import sys
from pathlib import Path

SCRATCH = Path(__file__).resolve().parents[1]
RECEIPT = SCRATCH / "task-e" / "mvp8_task_e_receipt.json"


def main():
    if "--authorize-l28" not in sys.argv:
        print("NOT AUTHORIZED: pass --authorize-l28 after a governance ruling")
        return 2
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    outcome = receipt["adjudication"]["outcome"]
    if outcome not in ("ADOPT_RUNTIME_READING",
                       "CONDITIONAL_ADOPT_RUNTIME_READING_PENDING_EAR"):
        print(f"NOT AUTHORIZED: outcome is {outcome}; no L28 landing is proposed")
        return 2
    print("AUTHORIZED: L28 landing would run the MVP-7 landing cascade here")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
