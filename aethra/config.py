"""Central thresholds and limits — single source of truth."""

from __future__ import annotations

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class AethraConfig:
    min_viability_margin_pct: float = 60.0
    max_launch_days: int = 14
    max_opportunities_returned: int = 3
    max_strategies_generated: int = 3
    max_active_businesses: int = 5
    min_active_businesses_cap: int = 3
    ingest_max_chars: int = 4500
    ingest_min_chars_target: int = 3000
    control_min_confidence: float = 0.55
    cache_ttl_seconds: int = 86400
    # Idea Engine — deterministic rubric gates
    idea_min_demand_score: float = 0.42
    idea_min_differentiation_score: float = 0.4
    # Spec: kill / no-build if composite viability < 60% (0–1 scale)
    viability_kill_threshold: float = 0.6
    idea_viability_build_threshold: float = 0.6
    idea_max_niches_returned: int = 8


def load_config() -> AethraConfig:
    return AethraConfig()


def memory_dir() -> str:
    return os.environ.get("AETHRA_MEMORY_DIR", ".aethra_memory")
