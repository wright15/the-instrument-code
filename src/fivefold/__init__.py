"""Fivefold overlay namespaces (incubator family).

This package holds overlay/design dynamics that are separate from the
registered `governor` engine namespace. Fence #3 (SPEC-001 §0.1) is applied
to code layout: nothing here may import from `governor` or be read as
registered engine semantics.
"""

from __future__ import annotations

__all__ = ["quintessence"]
