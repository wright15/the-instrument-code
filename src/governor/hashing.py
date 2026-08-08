"""Canonical JSON and SHA-256 helpers for intrinsic projection identities."""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from decimal import Decimal
import hashlib
import hmac
import json
import math
from typing import Any


def _canonical_number(value: int | float | Decimal) -> str:
    if isinstance(value, bool):
        raise TypeError("boolean_is_not_numeric_here")
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if not math.isfinite(value):
            raise ValueError("non_finite_number")
        number = Decimal(str(value))
    else:
        number = value
        if not number.is_finite():
            raise ValueError("non_finite_number")
    if number == 0:
        return "0"
    text = format(number, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text


def _canonical_text(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, (int, float, Decimal)):
        return _canonical_number(value)
    if isinstance(value, Mapping):
        keys = tuple(value.keys())
        if any(not isinstance(key, str) for key in keys):
            raise TypeError("json_object_key_must_be_string")
        return "{" + ",".join(
            f"{json.dumps(key, ensure_ascii=False)}:{_canonical_text(value[key])}"
            for key in sorted(keys)
        ) + "}"
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return "[" + ",".join(_canonical_text(item) for item in value) + "]"
    raise TypeError(f"unsupported_json_type:{type(value).__name__}")


def canonical_json_bytes(value: Any) -> bytes:
    """Serialize JSON-like data into deterministic compact UTF-8 bytes."""

    return _canonical_text(value).encode("utf-8")


def sha256_bytes(payload: bytes) -> str:
    """Hash exact bytes and return lowercase hexadecimal SHA-256."""

    if not isinstance(payload, bytes):
        raise TypeError("sha256_payload_must_be_bytes")
    return hashlib.sha256(payload).hexdigest()


def sha256_payload(value: Any) -> str:
    """Hash the canonical JSON representation of a value."""

    return sha256_bytes(canonical_json_bytes(value))


def verify_sha256_payload(value: Any, expected_sha256: str) -> bool:
    """Compare a canonical payload digest without accepting malformed hashes."""

    if not isinstance(expected_sha256, str) or len(expected_sha256) != 64:
        return False
    if any(character not in "0123456789abcdef" for character in expected_sha256):
        return False
    return hmac.compare_digest(sha256_payload(value), expected_sha256)
