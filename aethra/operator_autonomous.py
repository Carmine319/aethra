"""Operator mode (brand + marketing + testing) and autonomous stack — always attached to public payloads."""

from __future__ import annotations

import re
from typing import Any


def _s(x: object) -> str:
    return str(x or "").strip()


def _non_empty(x: object) -> bool:
    return bool(_s(x))


def _slug_domain_hint(text: str) -> str:
    t = re.sub(r"[^a-z0-9]+", "", (text or "").lower())[:20]
    return t or "brand"


def humanize_ch(c: object) -> str:
    return _s(c).replace("_", " ")


def _product_line(public: dict[str, Any]) -> str:
    ex = public.get("execution") or {}
    dec = public.get("decision") or {}
    val = dec.get("validation") if isinstance(dec.get("validation"), dict) else {}
    pf = _s(ex.get("product_focus"))
    if pf:
        return pf[:160]
    slots = val.get("slots") if isinstance(val.get("slots"), dict) else {}
    return _s(slots.get("product_hypothesis"))[:160] or "your offer"


def attach_operator_autonomous_layer(out: dict[str, Any]) -> None:
    b = out.setdefault("brand", {})
    ex = out.setdefault("execution", {})
    strat = out.get("strategy") or {}
    se = strat.get("strategic_engine") if isinstance(strat.get("strategic_engine"), dict) else {}
    sel = se.get("selected") if isinstance(se.get("selected"), dict) else {}
    sid = _s(sel.get("id")).upper() or "A"

    if not _non_empty(b.get("name")):
        b["name"] = _s(b.get("brand_name")) or "Working name (confirm before registration)"
    if not _non_empty(b.get("tone")):
        vp = b.get("voice_principles") if isinstance(b.get("voice_principles"), list) else []
        b["tone"] = (
            " ".join(_s(x) for x in vp[:3])
            if vp
            else "Calm, precise, proof-led; no false urgency; UK/EU compliance-aware."
        )
    if not _non_empty(b.get("visual_direction")):
        b["visual_direction"] = (
            "Classical editorial system: marble and sky tones, serif headlines, generous whitespace, "
            "subtle gold accent, documentary-style photography only where it supports proof."
        )

    hs = b.get("handle_suggestions") if isinstance(b.get("handle_suggestions"), list) else []
    hs_str = [_s(h) for h in hs if _s(h)]
    dom_hint = _slug_domain_hint(b.get("brand_name") or b.get("name") or _product_line(out))
    if not isinstance(b.get("handles"), dict) or not _non_empty((b.get("handles") or {}).get("primary")):
        b["handles"] = {
            "primary": hs_str[0] if hs_str else "@yourhandle",
            "alternatives": hs_str[1:5],
            "domain": f"Register a short .com or .co.uk matching «{dom_hint}» after trademark skim; avoid hyphen stacks.",
        }

    posting = b.get("posting_strategy") if isinstance(b.get("posting_strategy"), dict) else {}
    channels_pri = posting.get("channels_priority") if isinstance(posting.get("channels_priority"), list) else []
    cadence = _s(posting.get("cadence")).replace("_", " ") or "two to three high-signal posts per week"

    mk = out.setdefault("marketing", {})
    if not _non_empty(mk.get("outreach_message")):
        product = _product_line(out)
        mk["outreach_message"] = (
            f"Subject: {product[:60]} — quick fit check. Body: one line on who you help, one line on outcome, "
            f"one question on whether this is a priority this quarter. No attachments on first touch."
        )
    if not isinstance(mk.get("channels"), list) or not mk["channels"]:
        chans = [humanize_ch(c) for c in channels_pri[:4]] if channels_pri else []
        if sid == "B":
            chans = ["Single landing + one paid or organic test channel", "Email follow-up to responders only"]
        elif sid == "C":
            chans = ["Partner introductions", "Workflow owner DM sequence"]
        else:
            chans = chans or ["Direct outbound (named list)", "Owned site proof page", "Email"]
        mk["channels"] = chans
    ideas = b.get("content_ideas") if isinstance(b.get("content_ideas"), list) else []
    if not isinstance(mk.get("content_angles"), list) or not mk["content_angles"]:
        mk["content_angles"] = [_s(x) for x in ideas[:6] if _s(x)] or [
            "Problem → wedge → who it is not for",
            "Proof artefact (redacted numbers acceptable)",
            "Pricing logic tied to one value metric",
            "Objection → response in one screen",
            "Compliance or risk note buyers can reuse",
        ]
    if not _non_empty(mk.get("posting_frequency")):
        mk["posting_frequency"] = (
            f"{cadence}; batch creative in one sitting, schedule, then ignore vanity metrics until replies or meetings land."
        )

    tst = out.setdefault("testing", {})
    if not _non_empty(tst.get("goal")):
        tst["goal"] = "Primary: qualified reply or booked call; secondary: deposit or signed mini-scope within seven days."
    if not isinstance(tst.get("variables"), list) or not tst["variables"]:
        tst["variables"] = [
            "Headline (problem vs outcome framing)",
            "CTA (book call vs pay deposit)",
            "Price band (single pilot tier)",
            "Channel (only one live per cycle)",
        ]
    if not _non_empty(tst.get("cycle")):
        tst["cycle"] = "48-hour sprint: ship variant A, measure, ship variant B if A underperforms; kill loser on evidence."

    au = out.setdefault("autonomous", {})
    if not isinstance(au.get("lead_sources"), list) or not au["lead_sources"]:
        au["lead_sources"] = [
            "Google Maps and directory listings in target geography (manual export to sheet)",
            "Trade association or chamber member lists (public)",
            "LinkedIn title + company size filters (manual list build, capped at 50)",
        ]
    if not _non_empty(au.get("scraping_method")):
        au["scraping_method"] = (
            "Manual first: copy name, site, role, one signal into columns. No scrapers until schema and consent path are clear; "
            "automation follows repeatability, not curiosity."
        )
    if not _non_empty(au.get("outreach_sequence")):
        au["outreach_sequence"] = (
            "Touch 1: short personalised note with one relevant observation. "
            "Touch 2 (48h): single proof line or micro-case. "
            "Touch 3 (72h): direct ask for fifteen minutes or clear no. Stop after three without reply."
        )
    if not _non_empty(au.get("follow_up_logic")):
        au["follow_up_logic"] = (
            "If reply but stalled: one calendar link + deadline. If meeting: send one-page scope same day. "
            "If ghosted after three touches: mark lost with reason code; do not bulk reblast."
        )
    if not _non_empty(au.get("tracking_method")):
        au["tracking_method"] = (
            "One spreadsheet or lightweight CRM stage model: lead_id, source, last_touch, next_action_date, outcome. "
            "Review weekly; no new leads until follow-up queue is current."
        )

    chv = _s(ex.get("acquisition_channel")) or _s(ex.get("channel"))
    if chv:
        ex["acquisition_channel"] = chv
        if not _non_empty(ex.get("channel")):
            ex["channel"] = chv


def ensure_memory_insight_line(out: dict[str, Any]) -> None:
    meta = out.setdefault("meta", {})
    if _non_empty(meta.get("memory_insight")):
        return
    ms = meta.get("memory_similarity") if isinstance(meta.get("memory_similarity"), dict) else {}
    ins = ms.get("insights") if isinstance(ms.get("insights"), list) else []
    if ins and _s(ins[0]):
        meta["memory_insight"] = _s(ins[0])
        return
    meta["memory_insight"] = (
        "Local memory has no close overlap with this phrasing yet. This run establishes a baseline pattern; "
        "future ideas will be compared against its decision, score, and outcome signals."
    )
