"""Strict float-free canonical JSON and SHA-256 helpers."""

from __future__ import annotations

from collections.abc import Mapping
from decimal import Decimal
from fractions import Fraction
import hashlib
import hmac
import json
import re
from typing import Any


SHA256_PATTERN = re.compile(r"^[0-9a-f]{64}$")


def _require_unicode_scalar_text(value: str) -> str:
    if any(0xD800 <= ord(character) <= 0xDFFF for character in value):
        raise ValueError("unicode_surrogate_not_allowed")
    return value


def _canonical_value(value: Any) -> Any:
    if value is None or isinstance(value, bool):
        return value
    if isinstance(value, str):
        return _require_unicode_scalar_text(value)
    if type(value) is int:
        return value
    if isinstance(value, (float, Decimal, Fraction)):
        raise TypeError("non_integral_number_not_allowed")
    if isinstance(value, Mapping):
        if any(not isinstance(key, str) for key in value):
            raise TypeError("json_object_key_must_be_string")
        return {
            _require_unicode_scalar_text(key): _canonical_value(value[key])
            for key in sorted(value)
        }
    if isinstance(value, (list, tuple)):
        return [_canonical_value(item) for item in value]
    raise TypeError(f"unsupported_json_type:{type(value).__name__}")


def canonical_json_bytes(value: Any) -> bytes:
    """Serialize the strict intrinsic JSON subset into deterministic UTF-8."""

    normalized = _canonical_value(value)
    return json.dumps(
        normalized,
        ensure_ascii=False,
        allow_nan=False,
        separators=(",", ":"),
        sort_keys=True,
    ).encode("utf-8")


def sha256_bytes(payload: bytes) -> str:
    if not isinstance(payload, bytes):
        raise TypeError("sha256_payload_must_be_bytes")
    return hashlib.sha256(payload).hexdigest()


def sha256_payload(value: Any) -> str:
    return sha256_bytes(canonical_json_bytes(value))


def is_sha256(value: object) -> bool:
    return isinstance(value, str) and SHA256_PATTERN.fullmatch(value) is not None


def verify_sha256_payload(value: Any, expected_sha256: str) -> bool:
    if not is_sha256(expected_sha256):
        return False
    return hmac.compare_digest(sha256_payload(value), expected_sha256)
