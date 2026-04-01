"""Human-readable CLI layer above canonical JSON; does not mutate the envelope dict."""

from __future__ import annotations

from typing import Any

from aethra.signal_compress import (
    MAX_BULLETS,
    compress_bullets,
    confidence_tail,
    humanize_token,
    is_generic_line,
    used_text_blob,
)
from aethra.util_json import canonical_dumps

_DIVIDER = "--------------------------------"


def _clip(text: str, max_len: int = 220) -> str:
    t = " ".join((text or "").split())
    if len(t) <= max_len:
        return t
    return t[: max_len - 1].rstrip() + "..."


def _idea_line(payload: dict[str, Any]) -> str:
    dec = payload.get("decision") or {}
    val = dec.get("validation") if isinstance(dec.get("validation"), dict) else {}
    meta = payload.get("meta") or {}

    if meta.get("module") == "market_intelligence":
        opps = dec.get("opportunities") or []
        if opps:
            return _clip(f"{len(opps)} ranked hypotheses (feed).", 120)
        return "Idle — add sourced trend_summaries."

    ing = val.get("ingestion") if isinstance(val.get("ingestion"), dict) else {}
    if ing.get("url"):
        title = str(ing.get("title") or "").strip()
        u = str(ing.get("url") or "").strip()
        if title:
            return _clip(f"{u} — {title}", 200)
        return _clip(u, 200)

    slots = val.get("slots") if isinstance(val.get("slots"), dict) else {}
    raw = str(slots.get("raw_idea") or slots.get("product_hypothesis") or "").strip()
    if raw:
        return _clip(raw, 200)
    bv = str(val.get("best_version") or "").strip()
    if bv:
        return _clip(bv, 200)
    return "—"


def _brief_decision(payload: dict[str, Any]) -> str:
    dec = payload.get("decision") or {}
    scores = dec.get("scores") if isinstance(dec.get("scores"), dict) else {}
    via = scores.get("viability_0_100")
    conf = dec.get("confidence_0_100")
    bits: list[str] = []
    if via is not None:
        bits.append(f"via {via}%")
    if conf is not None:
        bits.append(f"conf {conf}%")
    score_suffix = f" · {' · '.join(bits)}" if bits else ""

    if dec.get("build_recommended"):
        return f"BUILD{score_suffix}"
    if str(dec.get("verdict") or "").lower() == "kill":
        return f"KILL{score_suffix}"
    if str(dec.get("verdict") or "").lower() == "advance" and dec.get("proceed"):
        return f"HOLD (advance, no build){score_suffix}"
    return f"HOLD{score_suffix}"


def _brief_why_bullets(payload: dict[str, Any]) -> list[str]:
    dec = payload.get("decision") or {}
    candidates: list[str] = []
    es = str(dec.get("executive_summary") or "").strip()
    if es:
        for c in [p.strip() for p in es.replace(";", ".").split(".") if p.strip()]:
            line = _clip(c, 130)
            if line and not is_generic_line(line):
                candidates.append(line)
    br = dec.get("blocked_reasons") if isinstance(dec.get("blocked_reasons"), list) else []
    for b in br:
        hb = humanize_token(str(b))
        if hb:
            candidates.append(_clip(hb, 110))

    out = compress_bullets(candidates, max_n=MAX_BULLETS)
    if not out:
        v = str(dec.get("verdict") or "hold").lower()
        sc = dec.get("scores") if isinstance(dec.get("scores"), dict) else {}
        via = sc.get("viability_0_100")
        if via is not None:
            out = [f"{v.upper()} · viability {via}%"]
        elif br:
            out = [humanize_token(str(br[0]))[:100]]
        else:
            out = [v.upper()]
    return out[:MAX_BULLETS]


def _brief_best_move(payload: dict[str, Any]) -> str:
    strat = payload.get("strategy") or {}
    meta = payload.get("meta") or {}
    if meta.get("module") == "market_intelligence":
        ah = str((payload.get("decision") or {}).get("allocation_hint") or "").strip()
        if ah:
            return _clip(ah, 160)
        return "Ship top hypothesis into IDEA with sources."

    eng = strat.get("strategic_engine") if isinstance(strat.get("strategic_engine"), dict) else {}
    sel = eng.get("selected") if isinstance(eng.get("selected"), dict) else {}
    sid = str(sel.get("id") or "")
    for c in eng.get("candidates") or []:
        if isinstance(c, dict) and str(c.get("id")) == sid:
            su = str(c.get("summary") or "").strip()
            if su:
                return _clip(su, 170)
    hooks = sel.get("execution_hooks") if isinstance(sel.get("execution_hooks"), list) else []
    if hooks:
        parts = [humanize_token(h) for h in hooks[:MAX_BULLETS]]
        return _clip(" · ".join(parts), 170)
    pex = strat.get("predictive_engine") if isinstance(strat.get("predictive_engine"), dict) else {}
    ps = str(pex.get("summary") or "").strip()
    if ps:
        return _clip(ps, 160)
    nar = str(strat.get("narrative") or "").strip()
    if nar:
        return _clip(nar, 160)
    name = str(sel.get("name") or "").replace("_", " ").strip()
    return _clip(name, 120) if name else "—"


def _brief_monet_lines(payload: dict[str, Any]) -> tuple[str, str, str]:
    monet = payload.get("monetisation") or {}
    strat = payload.get("strategy") or {}
    ps = monet.get("pricing_strategy") if isinstance(monet.get("pricing_strategy"), dict) else {}
    pex = strat.get("predictive_engine") if isinstance(strat.get("predictive_engine"), dict) else {}
    path = pex.get("selected_pricing_path") if isinstance(pex.get("selected_pricing_path"), dict) else {}
    label = str(path.get("label") or "").replace("_", " ").strip()
    currency = str(ps.get("currency") or "GBP").strip()
    anchors = ps.get("anchors") if isinstance(ps.get("anchors"), list) else []
    if anchors:
        a = " · ".join(str(x).replace("_", " ") for x in anchors[:3])
        price_range = _clip(f"{currency} · {a}", 130)
    elif label:
        price_range = _clip(f"Path · {label}", 100)
    else:
        price_range = "Floor price from quotes + unit economics"

    off = monet.get("offer_structure") if isinstance(monet.get("offer_structure"), dict) else {}
    core = str(off.get("core") or "").replace("_", " ").strip()
    ups = str(off.get("upsell") or "").replace("_", " ").strip()
    if core:
        offer_type = _clip(core, 90)
    elif ups:
        offer_type = _clip(ups, 90)
    else:
        offer_type = "Outcome-led offer + ladder"

    rev = str(monet.get("consultant_thesis") or "").strip()
    low_pre = rev.lower()
    if low_pre.startswith("monetisation thesis:"):
        rev = rev.split(":", 1)[-1].strip()
    if not rev:
        imp = monet.get("revenue_improvements") if isinstance(monet.get("revenue_improvements"), list) else []
        if imp:
            rev = humanize_token(str(imp[0]))
    if rev:
        low = rev.lower()
        cut = rev
        for sep in (" with ", ";", " — "):
            if sep in low:
                i = rev.lower().find(sep)
                if i > 24:
                    cut = rev[:i].strip()
                    break
        revenue_logic = _clip(cut, 100)
    else:
        revenue_logic = "Value metric + transparent terms"

    return price_range, offer_type, revenue_logic


def _brief_execution_bullets(payload: dict[str, Any]) -> list[str]:
    ex = payload.get("execution") or {}
    meta = payload.get("meta") or {}
    candidates: list[str] = []
    ch = ex.get("execution_checklist") if isinstance(ex.get("execution_checklist"), list) else []
    for x in ch:
        t = str(x).strip()
        if t:
            candidates.append(_clip(t, 160))
    if len(candidates) < MAX_BULLETS:
        plan = ex.get("execution_plan") if isinstance(ex.get("execution_plan"), dict) else {}
        phases = plan.get("phases") if isinstance(plan.get("phases"), list) else []
        for p in phases:
            s = humanize_token(str(p))
            if s:
                candidates.append(_clip(s, 140))
    if not candidates and meta.get("module") == "market_intelligence":
        candidates = [
            "Load trend_summaries (title, gap, score, source_ref).",
            "Run IDEA on the strongest item with receipts.",
        ]
    if not candidates:
        rt = ex.get("research_tasks") if isinstance(ex.get("research_tasks"), list) else []
        for t in rt[:2]:
            if isinstance(t, dict) and str(t.get("query") or "").strip():
                candidates.append(_clip(str(t["query"]), 150))
    out = compress_bullets(candidates, max_n=MAX_BULLETS)
    if not out and str(ex.get("product_focus") or "").strip():
        out = [_clip(str(ex.get("product_focus")), 120)]
    return out[:MAX_BULLETS]


def _brief_confidence(payload: dict[str, Any], why_bullets: list[str]) -> str:
    dec = payload.get("decision") or {}
    c = dec.get("confidence_0_100")
    if c is None:
        c = 55 if dec.get("proceed") else 40
    blob = used_text_blob(why_bullets)
    tail = confidence_tail(dec, avoid_substring_of=blob)
    if tail:
        return f"{c}% — {_clip(tail, 95)}"
    return f"{c}%"


def _memory_insight_line(payload: dict[str, Any]) -> str:
    mi = str((payload.get("meta") or {}).get("memory_insight") or "").strip()
    if not mi:
        return ""
    parts = [p.strip() for p in mi.split(".") if p.strip()]
    if len(parts) > 2:
        parts = parts[:2]
    merged = ". ".join(parts)
    if merged and not merged.endswith("."):
        merged += "."
    return _clip(merged, 260)


def build_human_summary(payload: dict[str, Any]) -> str:
    """Executive brief only; envelope dict unchanged (JSON appended by format_cli_output)."""
    idea = _idea_line(payload)
    decision = _brief_decision(payload)
    why = _brief_why_bullets(payload)
    best = _brief_best_move(payload)
    m1, m2, m3 = _brief_monet_lines(payload)
    exec_b = _brief_execution_bullets(payload)
    conf = _brief_confidence(payload, why)
    mi_line = _memory_insight_line(payload)

    why_lines = "\n".join(f"- {b}" for b in why)
    exec_lines = "\n".join(f"- {b}" for b in exec_b)

    lines: list[str] = [
        "=== AETHRA EXECUTIVE BRIEF ===",
        "",
        "🧠 Idea:",
        idea,
        "",
        "📊 Decision:",
        decision,
        "",
        "🎯 Why it matters:",
        why_lines,
        "",
    ]
    if mi_line:
        lines.extend(["📚 Memory insight:", mi_line, ""])
    lines.extend(
        [
            "🚀 Best Move:",
            best,
            "",
            "💰 Monetisation:",
            f"- {m1}",
            f"- {m2}",
            f"- {m3}",
            "",
            "⚙️ Execution Snapshot:",
            exec_lines,
            "",
            "📈 Confidence:",
            conf,
            "",
            _DIVIDER,
            "",
        ]
    )
    return "\n".join(lines)


def format_cli_output(payload: dict[str, Any]) -> str:
    """Summary block, divider, then full canonical JSON (unchanged structure)."""
    return build_human_summary(payload) + canonical_dumps(payload) + "\n"
