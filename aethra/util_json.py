"""Deterministic JSON helpers."""

from __future__ import annotations

import hashlib
import json
from typing import Any


def canonical_dumps(obj: Any) -> str:
    # ASCII wire form: reliable UTF-8 bytes for Node / Windows stdio and hashing.
    return json.dumps(obj, sort_keys=True, ensure_ascii=True, separators=(",", ":"))


def content_hash(obj: Any) -> str:
    return hashlib.sha256(canonical_dumps(obj).encode("utf-8")).hexdigest()


def stable_sort_str_list(items: list[str]) -> list[str]:
    return sorted(set(items))
