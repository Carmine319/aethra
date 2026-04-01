"""ABGE — Autonomous Brand & Growth Engine (premium, non-spam patterns)."""

from __future__ import annotations

import re
from typing import Any

from aethra.engines.idea_extract import extract_idea_slots


def _slug_tokens(text: str, max_parts: int = 3) -> list[str]:
    words = [w.lower() for w in re.findall(r"[A-Za-z]{3,14}", text)][:8]
    return words[:max_parts]


def run_abge(idea_text: str, selected_niche: str) -> dict[str, Any]:
    slots = extract_idea_slots(idea_text)
    raw = slots.get("raw_idea", "") or "offering"
    parts = _slug_tokens(raw, 4)
    brand_core = "".join(p[:1].upper() + p[1:3] for p in parts[:2]) or "Aethra"
    brand_name = f"{brand_core} {parts[-1].title()}" if len(parts) >= 2 else brand_core[:12]

    niche_label = selected_niche.replace("_", " ") if selected_niche else "focused wedge"

    tagline = f"Calm, precise {niche_label} for teams that care about outcomes."
    positioning = (
        "Premium positioning: proof-led, compliance-aware, no urgency tricks. "
        "Emphasise longevity and service quality over hype."
    )

    handles = [
        f"@{'_'.join(parts[:2])}" if len(parts) >= 2 else "@brandhandle",
        f"{''.join(parts[:2])}_hq" if len(parts) >= 2 else "brand_hq",
    ]

    content_ideas = [
        "Founder memo: why the wedge exists and who it is not for",
        "Before/after workflow diagram with measurable time saved",
        "UK/EU compliance checklist your buyers can reuse",
        "Customer story with numbers redacted until approved",
        "Explainer on pricing logic tied to value metric",
        "Deep dive: failure modes in the category and how you avoid them",
        "Office-hours Q&A transcript (edited for clarity)",
        "Partner integration spotlight with setup expectations",
        "Quarterly roadmap transparency post",
        "Analyst-style category map with fair competitor mentions",
    ]

    posting_strategy = {
        "cadence": "2_to_3_high_signal_posts_per_week",
        "channels_priority": ["owned_site", "email", "one_social_core_channel"],
        "rules": ["no_engagement_bait", "no_fake_scarcity", "cite_sources_when_claiming_stats"],
    }

    voice_principles = [
        "Specific over sensational; numbers only when sourced.",
        "UK/EU compliance-aware; no false urgency or fake scarcity.",
        "Founder-led clarity: who it is for, and who should not buy.",
    ]

    content_calendar_stub = [
        {"week": 1, "theme": "problem_and_wedge", "format": "memo_plus_diagram"},
        {"week": 2, "theme": "proof_and_objection_handling", "format": "case_outline"},
        {"week": 3, "theme": "pricing_logic", "format": "explainer_short"},
        {"week": 4, "theme": "integration_or_workflow", "format": "technical_deep_dive_light"},
    ]

    return {
        "brand_name": brand_name.strip()[:48],
        "tagline": tagline,
        "positioning": positioning,
        "handle_suggestions": handles,
        "content_ideas": content_ideas[:10],
        "posting_strategy": posting_strategy,
        "voice_principles": voice_principles,
        "content_calendar_stub": content_calendar_stub,
    }
