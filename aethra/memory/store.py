"""Append-only versioned JSON memory — persistent, auditable."""

from __future__ import annotations

import json
import os
import time
from typing import Any

from aethra.util_json import canonical_dumps, content_hash


class VersionedMemoryStore:
    def __init__(self, base_dir: str) -> None:
        self.base_dir = base_dir
        os.makedirs(base_dir, exist_ok=True)
        os.makedirs(os.path.join(base_dir, "versions"), exist_ok=True)
        os.makedirs(os.path.join(base_dir, "cache"), exist_ok=True)

    def _path(self, *parts: str) -> str:
        return os.path.join(self.base_dir, *parts)

    def append_record(self, namespace: str, payload: dict[str, Any]) -> dict[str, Any]:
        ts = int(time.time() * 1000)
        h = content_hash({"ns": namespace, "ts": ts, "payload": payload})
        record = {
            "version_id": h[:16],
            "namespace": namespace,
            "ts_ms": ts,
            "payload": payload,
        }
        fn = f"{ts}_{record['version_id']}.json"
        with open(self._path("versions", fn), "w", encoding="utf-8") as f:
            f.write(canonical_dumps(record))
        idx_path = self._path("index.jsonl")
        with open(idx_path, "a", encoding="utf-8") as f:
            f.write(canonical_dumps(record) + "\n")
        return record

    def get_cache(self, key: str) -> dict[str, Any] | None:
        p = self._path("cache", f"{key}.json")
        if not os.path.isfile(p):
            return None
        with open(p, encoding="utf-8") as f:
            return json.load(f)

    def set_cache(self, key: str, payload: dict[str, Any], ttl_seconds: int) -> None:
        wrapped = {
            "expires_at": int(time.time()) + ttl_seconds,
            "payload": payload,
        }
        p = self._path("cache", f"{key}.json")
        with open(p, "w", encoding="utf-8") as f:
            f.write(canonical_dumps(wrapped))

    def get_valid_cache(self, key: str) -> dict[str, Any] | None:
        raw = self.get_cache(key)
        if raw is None:
            return None
        if int(time.time()) > int(raw.get("expires_at", 0)):
            return None
        return raw.get("payload") if isinstance(raw.get("payload"), dict) else None
