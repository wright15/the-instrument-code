from __future__ import annotations

from pathlib import Path
import sys


PACKAGE_ROOT = Path(__file__).resolve().parents[1]
INTEGRATED_ROOT = PACKAGE_ROOT.parent
for source in (PACKAGE_ROOT / "src", INTEGRATED_ROOT / "court-mathematics/src"):
    sys.path.insert(0, str(source))
