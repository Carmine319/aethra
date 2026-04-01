"""Layer 3 — Market reality: saturation, niches, scoring, kill weak markets."""

from __future__ import annotations

from dataclasses import dataclass
import re
from typing import Any

from aethra.config import AethraConfig
from aethra.util_json import stable_sort_str_list

_GENERIC = re.compile(
    r"\b(shop|store|app|saas|tool|platform|service|consulting|agency|marketplace)\b",
    re.I,
)
_SATURATION_HINTS = re.compile(
    r"\b(crowded|saturated|commodit|me[- ]too|generic|red\s+ocean|everyone\s+is)\b",
    re.I,
)
_THIN_IDEA = re.compile(r"^\s*\w+\s*$")


@dataclass(frozen=True)
class NicheScore:
    label: str
    score: float
    rationale: str
    facets: dict[str, float]
    tags: tuple[str, ...]


@dataclass(frozen=True)
class MarketRealityResult:
    saturation_level: str
    saturation_signals: list[str]
    niche_candidates: list[NicheScore]
    kill_market: bool
    kill_reason: str | None


def _tokenize(text: str) -> list[str]:
    return [w.lower() for w in re.findall(r"[a-zA-Z][a-zA-Z\-]{2,}", text)]


def _clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def _facet_bundle(
    fit: float,
    defensibility: float,
    speed_to_mvp: float,
    compliance_fit: float,
    margin_potential_proxy: float,
) -> dict[str, float]:
    return {
        "idea_fit": round(_clamp(fit), 4),
        "defensibility_proxy": round(_clamp(defensibility), 4),
        "speed_to_mvp_proxy": round(_clamp(speed_to_mvp), 4),
        "compliance_alignment": round(_clamp(compliance_fit), 4),
        "margin_potential_proxy": round(_clamp(margin_potential_proxy), 4),
    }


def _aggregate_facet_score(facets: dict[str, float]) -> float:
    w = {
        "idea_fit": 0.28,
        "defensibility_proxy": 0.2,
        "speed_to_mvp_proxy": 0.18,
        "compliance_alignment": 0.17,
        "margin_potential_proxy": 0.17,
    }
    return round(sum(facets[k] * w[k] for k in w), 4)


def _detect_saturation(text: str, tokens: set[str], word_count: int) -> tuple[str, list[str]]:
    signals: list[str] = []
    t = text or ""
    low = t.lower()

    if _SATURATION_HINTS.search(t):
        signals.append("explicit_saturation_language")
    if _GENERIC.search(t) and len(tokens) < 7:
        signals.append("generic_category_language_with_low_specificity")
    if word_count < 6:
        signals.append("very_short_idea_text")
    if _THIN_IDEA.match(low.strip()) and word_count <= 2:
        signals.append("single_word_or_token_idea")

    if "explicit_saturation_language" in signals:
        return "high", sorted(signals)
    if "generic_category_language_with_low_specificity" in signals or len(tokens) < 5:
        return "high" if len(tokens) < 4 else "medium", sorted(signals)
    if word_count < 10:
        return "medium", sorted(signals)
    return "low", sorted(signals)


def _niche_templates() -> list[dict[str, Any]]:
    return [
        {
            "label": "uk_eu_compliance_first_wedge",
            "base": 0.52,
            "rationale": "Lead with UK/EU compliance, labeling, and auditability as the buying trigger.",
            "tags": ("geo", "compliance", "b2b"),
            "bonuses": {"geo_uk_eu": 0.12, "high_saturation": 0.06},
            "facets": _facet_bundle(0.72, 0.55, 0.48, 0.88, 0.5),
        },
        {
            "label": "vertical_slice_mid_market",
            "base": 0.5,
            "rationale": "Serve one vertical end-to-end; narrower TAM, higher willingness to pay.",
            "tags": ("vertical", "b2b"),
            "bonuses": {"vertical_hit": 0.14, "high_saturation": 0.08},
            "facets": _facet_bundle(0.78, 0.62, 0.55, 0.58, 0.62),
        },
        {
            "label": "workflow_embed_integration_first",
            "base": 0.48,
            "rationale": "Embed in existing workflows (API, SSO, data sync) to raise switching value.",
            "tags": ("integration", "dev", "b2b"),
            "bonuses": {"vertical_dev": 0.1, "moat_language": 0.08, "high_saturation": 0.05},
            "facets": _facet_bundle(0.7, 0.7, 0.42, 0.52, 0.58),
        },
        {
            "label": "outcome_guarantee_service_wrapper",
            "base": 0.46,
            "rationale": "Product + measurable service outcome; premium pricing with clear accountability.",
            "tags": ("offer", "margin"),
            "bonuses": {"outcome_language": 0.1, "high_saturation": 0.07},
            "facets": _facet_bundle(0.74, 0.48, 0.5, 0.55, 0.72),
        },
        {
            "label": "community_led_distribution",
            "base": 0.44,
            "rationale": "One community or partner channel before broad paid acquisition.",
            "tags": ("gtm", "b2c_or_prosumer"),
            "bonuses": {"channel_hint": 0.12, "b2c": 0.06},
            "facets": _facet_bundle(0.62, 0.42, 0.68, 0.45, 0.48),
        },
        {
            "label": "sku_simplification_private_label_plus",
            "base": 0.43,
            "rationale": "Fewer SKUs, clearer hero SKU, bundle adjacent consumables for AOV.",
            "tags": ("commerce", "sku"),
            "bonuses": {"vertical_commerce": 0.12, "high_saturation": 0.06},
            "facets": _facet_bundle(0.68, 0.4, 0.72, 0.5, 0.65),
        },
        {
            "label": "ops_efficiency_roi_packaging",
            "base": 0.47,
            "rationale": "Sell time saved / error reduction with ROI worksheet, not feature laundry list.",
            "tags": ("ops", "b2b"),
            "bonuses": {"vertical_hr_finance": 0.1, "outcome_language": 0.08},
            "facets": _facet_bundle(0.76, 0.45, 0.58, 0.52, 0.6),
        },
        {
            "label": "regtech_light_audit_trail",
            "base": 0.45,
            "rationale": "Immutable logs, export, role-based access for regulated-ish buyers without full regtech.",
            "tags": ("compliance", "b2b"),
            "bonuses": {"vertical_legal": 0.11, "geo_uk_eu": 0.07},
            "facets": _facet_bundle(0.65, 0.58, 0.45, 0.8, 0.55),
        },
    ]


def run_market_reality(
    idea_text: str,
    category_keywords: list[str] | None = None,
    slots: dict[str, Any] | None = None,
    cfg: AethraConfig | None = None,
) -> MarketRealityResult:
    text = idea_text or ""
    cats = category_keywords or []
    s = slots or {}
    cfg = cfg or AethraConfig()

    tokens_list = _tokenize(text)
    tokens = set(tokens_list) | {c.lower() for c in cats}
    word_count = len(text.split())

    sat, sat_signals = _detect_saturation(text, tokens, word_count)
    low = text.lower()
    stats = s.get("stats") or {}
    verticals = set(s.get("verticals_detected") or [])
    geo_hints = s.get("geo_hints") or []
    channel_hints = s.get("channel_hints") or []
    b2b_b2c = str(s.get("b2b_b2c") or "unknown")

    geo_bonus = any(x in low for x in ("uk", "eu", "europe", "germany", "france", "ireland")) or bool(geo_hints)
    vertical_dev = "dev_engineering" in verticals
    vertical_commerce = "commerce" in verticals
    vertical_hr_fin = bool(verticals & {"hr_people", "finance_ops"})
    vertical_legal = "legal_governance" in verticals
    outcome_lang = "outcome" in str(s.get("problem_class") or "") or bool(stats.get("has_moat_language"))

    niches: list[NicheScore] = []
    for tmpl in _niche_templates():
        label = str(tmpl["label"])
        base = float(tmpl["base"])
        facets = dict(tmpl["facets"])
        bonus = 0.0
        if geo_bonus and "geo" in tmpl["tags"]:
            bonus += float(tmpl["bonuses"].get("geo_uk_eu", 0.0))
        if sat == "high":
            bonus += float(tmpl["bonuses"].get("high_saturation", 0.0))
        if vertical_dev and tmpl["bonuses"].get("vertical_dev"):
            bonus += float(tmpl["bonuses"]["vertical_dev"])
        if vertical_commerce and tmpl["bonuses"].get("vertical_commerce"):
            bonus += float(tmpl["bonuses"]["vertical_commerce"])
        if vertical_hr_fin and tmpl["bonuses"].get("vertical_hr_finance"):
            bonus += float(tmpl["bonuses"]["vertical_hr_finance"])
        if vertical_legal and tmpl["bonuses"].get("vertical_legal"):
            bonus += float(tmpl["bonuses"]["vertical_legal"])
        if outcome_lang and tmpl["bonuses"].get("outcome_language"):
            bonus += float(tmpl["bonuses"]["outcome_language"])
        if channel_hints and tmpl["bonuses"].get("channel_hint"):
            bonus += float(tmpl["bonuses"]["channel_hint"])
        if b2b_b2c == "b2c" and tmpl["bonuses"].get("b2c"):
            bonus += float(tmpl["bonuses"]["b2c"])
        if stats.get("has_moat_language") and tmpl["bonuses"].get("moat_language"):
            bonus += float(tmpl["bonuses"]["moat_language"])
        if verticals and "vertical" in tmpl["tags"]:
            bonus += min(0.06, 0.03 * len(verticals))

        facet_score = _aggregate_facet_score(facets)
        combined = _clamp(0.55 * facet_score + 0.45 * (base + bonus), 0.0, 0.96)
        niches.append(
            NicheScore(
                label=label,
                score=round(combined, 4),
                rationale=str(tmpl["rationale"]),
                facets=facets,
                tags=tuple(sorted(tmpl["tags"])),
            )
        )

    niches = sorted(niches, key=lambda n: (-n.score, n.label))[: cfg.idea_max_niches_returned]

    kill = (sat == "high" and len(tokens) < 6) or (word_count < 5 and sat != "low")
    kill_reason = None
    if kill:
        kill_reason = "oversaturated_or_under_specified_weak_wedge"

    return MarketRealityResult(
        saturation_level=sat,
        saturation_signals=sat_signals,
        niche_candidates=niches,
        kill_market=kill,
        kill_reason=kill_reason,
    )


def niches_to_json(result: MarketRealityResult, category_keywords: list[str] | None = None) -> dict:
    return {
        "saturation_level": result.saturation_level,
        "saturation_signals": list(result.saturation_signals),
        "niche_candidates": [
            {
                "label": n.label,
                "score": n.score,
                "rationale": n.rationale,
                "facets": n.facets,
                "tags": list(n.tags),
            }
            for n in result.niche_candidates
        ],
        "kill_market": result.kill_market,
        "kill_reason": result.kill_reason,
        "category_keywords_used": stable_sort_str_list(list(category_keywords or [])),
    }
