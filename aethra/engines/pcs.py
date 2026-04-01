"""PCS — Portfolio Control System."""

from __future__ import annotations

from typing import Any

from aethra.config import AethraConfig
from aethra.util_json import stable_sort_str_list


def run_pcs(cfg: AethraConfig, context: dict[str, Any] | None = None) -> dict[str, Any]:
    ctx = context or {}
    raw = ctx.get("portfolio_businesses")
    businesses: list[dict[str, Any]] = []
    if isinstance(raw, list):
        for b in raw:
            if isinstance(b, dict) and str(b.get("id", "")).strip():
                businesses.append(
                    {
                        "id": str(b["id"]).strip(),
                        "name": str(b.get("name", "")).strip(),
                        "score": float(b.get("score", 0.0)),
                        "status": str(b.get("status", "active")).strip(),
                    }
                )

    businesses.sort(key=lambda x: (-x["score"], x["id"]))
    cap = cfg.max_active_businesses
    active = [b for b in businesses if b["status"] == "active"][:cap]
    kill_list = [b["id"] for b in businesses if b["score"] < 0.35 and b["status"] == "active"]

    allocation = [
        {"business_id": b["id"], "resource_weight": round(1.0 / max(len(active), 1), 4)} for b in active
    ]

    return {
        "active_cap": cap,
        "active_businesses": active,
        "prioritisation_order": [b["id"] for b in active],
        "resource_allocation_weights": allocation,
        "scale_winners_rule": "increase_weight_if_margin_and_retention_verified",
        "kill_weak_projects": stable_sort_str_list(kill_list),
        "notes": "Maintain 3_to_5_active_projects_maximum_per_config",
    }
