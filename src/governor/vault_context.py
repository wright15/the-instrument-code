"""Deterministic, read-only Obsidian context bundles for GOV-208."""

from __future__ import annotations

from dataclasses import dataclass
import json
import os
from pathlib import Path
import re
from typing import Any, Mapping, Sequence

from .classifier import classify
from .hashing import sha256_bytes, sha256_payload


CONTEXT_BUNDLE_SCHEMA_VERSION = "gov-208.context-bundle.v1"
CONTEXT_RESULT_SCHEMA_VERSION = "gov-208.contextual-classification.v1"

_BASE_FIELDS = frozenset(
    {
        "noteId",
        "title",
        "aspectRefs",
        "ruleRefs",
        "governor",
        "admissionStatus",
        "source",
        "sensitivity",
        "maxTraversalDepth",
    }
)
_COURT_FIELDS = frozenset(
    {
        "courtRootedPosition",
        "pentatonicSetClass",
        "kappaCourt",
        "courtFilterMask",
        "courtProvenanceRef",
    }
)
_REQUIRED_FIELDS = frozenset({"noteId", "admissionStatus", "source", "sensitivity"})
_ADMISSION_STATUSES = frozenset({"admitted", "admitted-bridge", "proposed", "unresolved"})
_SENSITIVITIES = frozenset({"public", "private", "restricted"})
_ID_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$")
_FRONTMATTER_KEY = re.compile(r"^([A-Za-z][A-Za-z0-9]*):(?:\s*(.*))?$")
_WIKILINK = re.compile(r"\[\[([^\]\n]+)\]\]")


class VaultContextError(ValueError):
    """Raised when vault input violates the bounded context contract."""


@dataclass(frozen=True)
class VaultLimits:
    max_files: int = 128
    max_total_bytes: int = 512 * 1024
    max_note_bytes: int = 32 * 1024
    max_frontmatter_bytes: int = 8 * 1024
    max_traversal_depth: int = 4
    max_links_per_note: int = 64
    max_result_notes: int = 64
    max_excerpt_chars: int = 1200

    def __post_init__(self) -> None:
        for name, value in vars(self).items():
            if not isinstance(value, int) or isinstance(value, bool) or value <= 0:
                raise VaultContextError(f"invalid_limit:{name}")


@dataclass(frozen=True)
class _VaultNote:
    relative_path: str
    metadata: Mapping[str, Any]
    body: str
    body_sha256: str
    links: tuple[str, ...]


def _parse_scalar(text: str) -> Any:
    text = text.strip()
    if not text:
        raise VaultContextError("frontmatter_empty_scalar")
    if text in {"null", "~"}:
        return None
    if text == "true":
        return True
    if text == "false":
        return False
    if text.startswith("["):
        try:
            value = json.loads(text)
        except json.JSONDecodeError as error:
            raise VaultContextError("frontmatter_invalid_inline_list") from error
        if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
            raise VaultContextError("frontmatter_list_must_contain_strings")
        return value
    if text.startswith('"'):
        try:
            value = json.loads(text)
        except json.JSONDecodeError as error:
            raise VaultContextError("frontmatter_invalid_quoted_string") from error
        if not isinstance(value, str):
            raise VaultContextError("frontmatter_quoted_value_must_be_string")
        return value
    if text.startswith("'") and text.endswith("'") and len(text) >= 2:
        return text[1:-1].replace("''", "'")
    if re.fullmatch(r"-?(?:0|[1-9][0-9]*)", text):
        return int(text)
    if re.fullmatch(r"-?(?:0|[1-9][0-9]*)\.[0-9]+", text):
        return float(text)
    if any(character in text for character in "{}[]"):
        raise VaultContextError("frontmatter_nested_values_forbidden")
    return text


def _parse_frontmatter(text: str, *, allow_court: bool, max_bytes: int) -> tuple[dict[str, Any], str]:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    if not normalized.startswith("---\n"):
        raise VaultContextError("frontmatter_required")
    end = normalized.find("\n---\n", 4)
    if end < 0:
        raise VaultContextError("frontmatter_unterminated")
    frontmatter = normalized[4:end]
    if len(frontmatter.encode("utf-8")) > max_bytes:
        raise VaultContextError("frontmatter_too_large")
    lines = frontmatter.split("\n")
    parsed: dict[str, Any] = {}
    index = 0
    while index < len(lines):
        line = lines[index]
        index += 1
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line[:1].isspace():
            raise VaultContextError("frontmatter_unexpected_indentation")
        match = _FRONTMATTER_KEY.fullmatch(line)
        if match is None:
            raise VaultContextError("frontmatter_invalid_line")
        key, raw_value = match.groups()
        if key in parsed:
            raise VaultContextError(f"frontmatter_duplicate_key:{key}")
        if raw_value:
            if key == "courtFilterMask" and re.fullmatch(r"[01]{12}", raw_value.strip()):
                parsed[key] = raw_value.strip()
            else:
                parsed[key] = _parse_scalar(raw_value)
            continue
        values: list[str] = []
        while index < len(lines) and lines[index].startswith("  - "):
            value = _parse_scalar(lines[index][4:])
            if not isinstance(value, str):
                raise VaultContextError("frontmatter_list_must_contain_strings")
            values.append(value)
            index += 1
        parsed[key] = values

    allowed = _BASE_FIELDS | (_COURT_FIELDS if allow_court else frozenset())
    unknown = sorted(set(parsed) - allowed)
    if unknown:
        raise VaultContextError(f"frontmatter_unknown_field:{unknown[0]}")
    missing = sorted(_REQUIRED_FIELDS - set(parsed))
    if missing:
        raise VaultContextError(f"frontmatter_missing_field:{missing[0]}")
    _validate_frontmatter(parsed)
    body = normalized[end + 5 :].strip()
    return parsed, body


def _validate_string_list(metadata: Mapping[str, Any], field: str) -> None:
    value = metadata.get(field, [])
    if not isinstance(value, list) or any(not isinstance(item, str) or not _ID_PATTERN.fullmatch(item) for item in value):
        raise VaultContextError(f"frontmatter_invalid_field:{field}")
    if len(value) != len(set(value)):
        raise VaultContextError(f"frontmatter_duplicate_reference:{field}")


def _validate_frontmatter(metadata: Mapping[str, Any]) -> None:
    for field in ("noteId", "source"):
        value = metadata.get(field)
        if not isinstance(value, str) or not _ID_PATTERN.fullmatch(value):
            raise VaultContextError(f"frontmatter_invalid_field:{field}")
    for field in ("aspectRefs", "ruleRefs"):
        _validate_string_list(metadata, field)
    title = metadata.get("title")
    if title is not None and (not isinstance(title, str) or not title.strip() or len(title) > 200):
        raise VaultContextError("frontmatter_invalid_field:title")
    governor = metadata.get("governor")
    if governor is not None and governor not in {"Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"}:
        raise VaultContextError("frontmatter_invalid_field:governor")
    if metadata["admissionStatus"] not in _ADMISSION_STATUSES:
        raise VaultContextError("frontmatter_invalid_field:admissionStatus")
    if metadata["sensitivity"] not in _SENSITIVITIES:
        raise VaultContextError("frontmatter_invalid_field:sensitivity")
    depth = metadata.get("maxTraversalDepth", 1)
    if not isinstance(depth, int) or isinstance(depth, bool) or depth < 0:
        raise VaultContextError("frontmatter_invalid_field:maxTraversalDepth")


def _link_target(raw: str) -> str:
    target = raw.split("|", 1)[0].split("#", 1)[0].strip().replace("\\", "/")
    if target.endswith(".md"):
        target = target[:-3]
    if not target or target.startswith("/") or ".." in target.split("/"):
        raise VaultContextError("wikilink_invalid_target")
    return target


class ObsidianVaultProvider:
    """Read a bounded vault snapshot and compile deterministic context bundles."""

    def __init__(
        self,
        vault_root: str | os.PathLike[str],
        *,
        limits: VaultLimits | None = None,
        allow_court_fields: bool = False,
    ) -> None:
        supplied = Path(vault_root)
        if not supplied.is_absolute():
            raise VaultContextError("vault_path_must_be_absolute")
        try:
            resolved = supplied.resolve(strict=True)
        except OSError as error:
            raise VaultContextError("vault_path_unavailable") from error
        if supplied.absolute() != resolved or supplied.is_symlink():
            raise VaultContextError("vault_root_symlink_rejected")
        if not resolved.is_dir():
            raise VaultContextError("vault_path_must_be_directory")
        self._root = resolved
        self._limits = limits or VaultLimits()
        self._allow_court_fields = allow_court_fields

    @property
    def limits(self) -> VaultLimits:
        return self._limits

    def _walk(self) -> tuple[list[Path], list[dict[str, Any]]]:
        files: list[Path] = []
        exclusions: list[dict[str, Any]] = []

        def visit(directory: Path) -> None:
            try:
                entries = sorted(os.scandir(directory), key=lambda entry: entry.name)
            except OSError as error:
                raise VaultContextError("vault_directory_unreadable") from error
            for entry in entries:
                relative = Path(entry.path).relative_to(self._root).as_posix()
                if entry.is_symlink():
                    raise VaultContextError(f"vault_symlink_rejected:{relative}")
                if entry.name.startswith("."):
                    exclusions.append({"reasonCode": "hidden_path_excluded", "relativePath": relative})
                    continue
                if entry.is_dir(follow_symlinks=False):
                    visit(Path(entry.path))
                    continue
                if not entry.is_file(follow_symlinks=False):
                    exclusions.append({"reasonCode": "non_regular_file_excluded", "relativePath": relative})
                    continue
                if Path(entry.name).suffix.lower() != ".md":
                    exclusions.append({"reasonCode": "attachment_excluded", "relativePath": relative})
                    continue
                files.append(Path(entry.path))
                if len(files) > self._limits.max_files:
                    raise VaultContextError("vault_file_limit_exceeded")

        visit(self._root)
        return files, exclusions

    def _read_notes(self) -> tuple[tuple[_VaultNote, ...], tuple[dict[str, Any], ...]]:
        paths, exclusions = self._walk()
        notes: list[_VaultNote] = []
        total_bytes = 0
        note_ids: set[str] = set()
        for path in paths:
            relative = path.relative_to(self._root).as_posix()
            try:
                size = path.stat(follow_symlinks=False).st_size
            except OSError as error:
                raise VaultContextError(f"vault_note_unreadable:{relative}") from error
            if size > self._limits.max_note_bytes:
                raise VaultContextError(f"vault_note_too_large:{relative}")
            total_bytes += size
            if total_bytes > self._limits.max_total_bytes:
                raise VaultContextError("vault_byte_limit_exceeded")
            try:
                payload = path.read_bytes()
                text = payload.decode("utf-8")
            except (OSError, UnicodeDecodeError) as error:
                raise VaultContextError(f"vault_note_not_utf8:{relative}") from error
            if "\x00" in text:
                raise VaultContextError(f"vault_note_binary:{relative}")
            metadata, body = _parse_frontmatter(
                text,
                allow_court=self._allow_court_fields,
                max_bytes=self._limits.max_frontmatter_bytes,
            )
            note_id = metadata["noteId"]
            if note_id in note_ids:
                raise VaultContextError(f"duplicate_note_id:{note_id}")
            note_ids.add(note_id)
            if metadata["sensitivity"] != "public":
                exclusions.append({"reasonCode": "sensitive_note_excluded"})
                continue
            links = tuple(_link_target(match.group(1)) for match in _WIKILINK.finditer(body))
            if len(links) > self._limits.max_links_per_note:
                raise VaultContextError(f"vault_link_limit_exceeded:{note_id}")
            notes.append(
                _VaultNote(
                    relative_path=relative,
                    metadata=metadata,
                    body=body,
                    body_sha256=sha256_bytes(body.encode("utf-8")),
                    links=links,
                )
            )
        return tuple(sorted(notes, key=lambda note: note.metadata["noteId"])), tuple(
            sorted(exclusions, key=lambda item: (item["reasonCode"], item.get("relativePath", "")))
        )

    def compile(self, request: Mapping[str, Any]) -> dict[str, Any]:
        allowed_request = {"schemaVersion", "requestId", "policyFingerprint", "seedNoteIds", "maxDepth"}
        unknown = sorted(set(request) - allowed_request)
        if unknown:
            raise VaultContextError(f"context_request_unknown_field:{unknown[0]}")
        if request.get("schemaVersion") != "gov-208.context-request.v1":
            raise VaultContextError("context_request_schema_version")
        for field in ("requestId", "policyFingerprint"):
            value = request.get(field)
            if not isinstance(value, str) or not _ID_PATTERN.fullmatch(value):
                raise VaultContextError(f"context_request_invalid_field:{field}")
        policy = request["policyFingerprint"]
        if len(policy) != 64 or any(character not in "0123456789abcdef" for character in policy):
            raise VaultContextError("context_request_invalid_policy_fingerprint")
        seed_ids = request.get("seedNoteIds", [])
        if not isinstance(seed_ids, list) or any(not isinstance(item, str) or not _ID_PATTERN.fullmatch(item) for item in seed_ids):
            raise VaultContextError("context_request_invalid_field:seedNoteIds")
        if len(seed_ids) != len(set(seed_ids)):
            raise VaultContextError("context_request_duplicate_seed")
        max_depth = request.get("maxDepth", 1)
        if not isinstance(max_depth, int) or isinstance(max_depth, bool) or not 0 <= max_depth <= self._limits.max_traversal_depth:
            raise VaultContextError("context_request_invalid_field:maxDepth")

        notes, exclusions = self._read_notes()
        by_id = {note.metadata["noteId"]: note for note in notes}
        by_target: dict[str, list[str]] = {}
        for note in notes:
            targets = {
                note.metadata["noteId"],
                note.relative_path[:-3],
                Path(note.relative_path).stem,
            }
            for target in targets:
                by_target.setdefault(target, []).append(note.metadata["noteId"])

        resolved_links: dict[str, tuple[dict[str, Any], ...]] = {}
        for note in notes:
            records: list[dict[str, Any]] = []
            for target in note.links:
                candidates = sorted(set(by_target.get(target, [])))
                if len(candidates) == 1:
                    records.append({"target": target, "status": "resolved", "targetNoteId": candidates[0]})
                elif not candidates:
                    records.append({"target": target, "status": "broken", "targetNoteId": None})
                else:
                    records.append({"target": target, "status": "ambiguous", "targetNoteId": None})
            resolved_links[note.metadata["noteId"]] = tuple(
                sorted(records, key=lambda item: (item["target"], item["status"]))
            )

        seeds = sorted(seed_ids or by_id)
        missing_seeds = sorted(set(seeds) - set(by_id))
        diagnostics: list[dict[str, Any]] = [
            {"reasonCode": "seed_not_found", "noteId": note_id} for note_id in missing_seeds
        ]
        frontier = [(note_id, 0) for note_id in seeds if note_id in by_id]
        selected: dict[str, int] = {}
        while frontier:
            note_id, depth = frontier.pop(0)
            if note_id in selected and selected[note_id] <= depth:
                continue
            selected[note_id] = depth
            if len(selected) > self._limits.max_result_notes:
                raise VaultContextError("context_result_note_limit_exceeded")
            note_depth = min(max_depth, int(by_id[note_id].metadata.get("maxTraversalDepth", max_depth)))
            if depth >= note_depth:
                continue
            children = sorted(
                record["targetNoteId"]
                for record in resolved_links[note_id]
                if record["status"] == "resolved"
            )
            frontier.extend((child, depth + 1) for child in children)

        output_notes = []
        for note_id in sorted(selected):
            note = by_id[note_id]
            output_fields = _BASE_FIELDS | (_COURT_FIELDS if self._allow_court_fields else frozenset())
            metadata = {
                key: note.metadata[key]
                for key in sorted(output_fields)
                if key in note.metadata and key != "sensitivity"
            }
            output_notes.append(
                {
                    "noteId": note_id,
                    "relativePath": note.relative_path,
                    "depth": selected[note_id],
                    "metadata": metadata,
                    "excerpt": note.body[: self._limits.max_excerpt_chars],
                    "contentSha256": note.body_sha256,
                    "links": list(resolved_links[note_id]),
                }
            )
            diagnostics.extend(
                {"reasonCode": f"{record['status']}_link", "noteId": note_id, "target": record["target"]}
                for record in resolved_links[note_id]
                if record["status"] != "resolved"
            )

        vault_core = [
            {
                "noteId": note.metadata["noteId"],
                "relativePath": note.relative_path,
                "metadata": {key: note.metadata[key] for key in sorted(note.metadata) if key != "sensitivity"},
                "contentSha256": note.body_sha256,
            }
            for note in notes
        ]
        normalized_request = {
            "schemaVersion": request["schemaVersion"],
            "requestId": request["requestId"],
            "policyFingerprint": policy,
            "seedNoteIds": sorted(seed_ids),
            "maxDepth": max_depth,
        }
        core = {
            "schemaVersion": CONTEXT_BUNDLE_SCHEMA_VERSION,
            "status": "ok" if output_notes else "empty",
            "requestFingerprint": sha256_payload(normalized_request),
            "policyFingerprint": policy,
            "vaultFingerprint": sha256_payload(vault_core),
            "notes": output_notes,
            "exclusions": list(exclusions),
            "diagnostics": sorted(
                diagnostics,
                key=lambda item: (item["reasonCode"], item.get("noteId", ""), item.get("target", "")),
            ),
        }
        return {**core, "bundleFingerprint": sha256_payload(core)}


def classify_with_optional_context(
    policy: Mapping[str, Any],
    request: Mapping[str, Any],
    *,
    provider: ObsidianVaultProvider | None = None,
    context_request: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Preserve exact context-free classifier output and add evidence only when enabled."""

    base = classify(policy, request)
    if provider is None:
        return base
    if context_request is None:
        raise VaultContextError("context_request_required")
    bundle = provider.compile(context_request)
    candidates = []
    for note in bundle["notes"]:
        metadata = note["metadata"]
        candidates.append(
            {
                "noteId": note["noteId"],
                "admissionStatus": metadata["admissionStatus"],
                "aspectRefs": metadata.get("aspectRefs", []),
                "ruleRefs": metadata.get("ruleRefs", []),
                "disposition": (
                    "evidence_only"
                    if metadata["admissionStatus"] in {"admitted", "admitted-bridge"}
                    else "candidate_only"
                ),
            }
        )
    refinement = {
        "status": "available" if candidates else "abstained",
        "authority": "context_evidence_only",
        "baseResultFingerprint": base["resultFingerprint"],
        "contextBundleFingerprint": bundle["bundleFingerprint"],
        "evidenceCandidates": candidates,
        "canonicalClassificationChanged": False,
    }
    core = {
        "schemaVersion": CONTEXT_RESULT_SCHEMA_VERSION,
        "baseClassification": base,
        "contextBundle": bundle,
        "contextualRefinement": refinement,
    }
    return {**core, "resultFingerprint": sha256_payload(core)}
