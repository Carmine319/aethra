"""Layer 1 — Intent lock: allowed optimisation targets only."""

from __future__ import annotations

from dataclasses import dataclass
import re

_FORBIDDEN = re.compile(
    r"\b("
    r"fake\s*scarcity|limited\s*time\s*only\s*lie|bait\s*and\s*switch|"
    r"hidden\s*fee|undisclosed|spam\s*blast|misleading|deceptive|"
    r"counterfeit|pump\s*and\s*dump"
    r")\b",
    re.I,
)


@dataclass(frozen=True)
class IntentLockResult:
    allowed: bool
    violations: list[str]
    objectives_active: list[str]


def evaluate_intent_lock(text: str) -> IntentLockResult:
    t = text or ""
    violations: list[str] = []
    if _FORBIDDEN.search(t):
        violations.append("forbidden_intent_pattern_detected")

    objectives = [
        "sustainable_profit",
        "brand_longevity",
        "compliance_uk_eu",
        "reputation_preservation",
    ]
    allowed = len(violations) == 0
    return IntentLockResult(
        allowed=allowed,
        violations=sorted(violations),
        objectives_active=objectives if allowed else [],
    )
