"""NEMDE — Network Effect / Memory Distribution Engine."""

from __future__ import annotations

from typing import Any

from aethra.memory.store import VersionedMemoryStore
from aethra.util_json import content_hash


def run_nemde(
    store: VersionedMemoryStore,
    namespace: str,
    envelope_dict: dict[str, Any],
) -> dict[str, Any]:
    fingerprint = content_hash(envelope_dict)[:16]
    record = store.append_record(
        namespace,
        {
            "fingerprint": fingerprint,
            "input_type": envelope_dict.get("input_type"),
            "decision_keys": sorted((envelope_dict.get("decision") or {}).keys()),
        },
    )
    return {
        "stored_version_id": record["version_id"],
        "namespace": namespace,
        "global_pattern_stub": "aggregate_offline_batch_jobs_only",
        "shareable_insight": {
            "title": "Deterministic decision fingerprint",
            "hash": fingerprint,
            "note": "Batch-analyse fingerprints across runs; no PII stored by default.",
        },
    }
