"""Phase 2 (zero-capital execution) + Phase 3 (delivery system) — always attached to public payloads."""

from __future__ import annotations

from typing import Any


def _s(x: object) -> str:
    return str(x or "").strip()


def _non_empty(x: object) -> bool:
    return bool(_s(x))


def _product_line(public: dict[str, Any]) -> str:
    ex = public.get("execution") or {}
    dec = public.get("decision") or {}
    val = dec.get("validation") if isinstance(dec.get("validation"), dict) else {}
    pf = _s(ex.get("product_focus"))
    if pf:
        return pf[:220]
    slots = val.get("slots") if isinstance(val.get("slots"), dict) else {}
    hyp = _s(slots.get("product_hypothesis"))
    if hyp:
        return hyp[:220]
    stub = val.get("synthetic_idea_stub_for_engines")
    if isinstance(stub, dict):
        t = _s(stub.get("label") or stub.get("summary"))
        if t:
            return t[:220]
    ing = val.get("ingestion") if isinstance(val.get("ingestion"), dict) else {}
    if _s(ing.get("url")):
        return f"Offer anchored to analysed page: {_s(ing.get('title')) or _s(ing.get('url'))}"[:220]
    return "The stated commercial hypothesis under review."


def _niche_icp(public: dict[str, Any]) -> str:
    dec = public.get("decision") or {}
    val = dec.get("validation") if isinstance(dec.get("validation"), dict) else {}
    niche = _s(val.get("selected_niche")).replace("_", " ")
    if niche:
        return f"Primary ICP: operators in the «{niche}» wedge with budget authority and a recurring pain tied to the offer."
    return (
        "Primary ICP: a narrow buyer persona you can name in one sentence — role, company size band, "
        "and trigger event — until you replace this default with evidence from live conversations."
    )


def _strategy_channel(public: dict[str, Any]) -> str:
    strat = public.get("strategy") or {}
    se = strat.get("strategic_engine") if isinstance(strat.get("strategic_engine"), dict) else {}
    sel = se.get("selected") if isinstance(se.get("selected"), dict) else {}
    sid = _s(sel.get("id")).upper() or "A"
    if sid == "B":
        return (
            "Acquisition channel: one landing page variant with transparent pricing and a calendar or payment CTA above the fold; "
            "drive 100 qualified visits via a single paid or organic test within 48 hours — no second channel until conversion is logged."
        )
    if sid == "C":
        return (
            "Acquisition channel: partner or workflow embed — three warm introductions into teams that already run the adjacent process; "
            "each conversation ends with a dated pilot decision, not a roadmap review."
        )
    return (
        "Acquisition channel: direct outbound to a named list (30–50 accounts) using one message template and one follow-up; "
        "measure replies-to-meeting, not sends. No automation spend until ten manual conversations complete."
    )


def _price_gbp_line(public: dict[str, Any]) -> str:
    monet = public.get("monetisation") or {}
    ex = public.get("execution") or {}
    ps = monet.get("pricing_strategy") if isinstance(monet.get("pricing_strategy"), dict) else {}
    cur = _s(ps.get("currency")).upper() or "GBP"
    sym = "£" if cur == "GBP" else f"{cur} "
    model = _s(ps.get("model")).replace("_", " ") or "value-based packaging"
    scenarios = ex.get("profit_scenarios") if isinstance(ex.get("profit_scenarios"), list) else []
    for row in scenarios:
        if not isinstance(row, dict):
            continue
        if row.get("label") == "unconfigured":
            continue
        sp = row.get("sell_price")
        if sp is not None and sp != "":
            try:
                spf = float(sp)
                low = max(25, int(spf * 0.75))
                high = max(low + 1, int(spf * 1.15))
                return (
                    f"Working anchor {sym}{spf:.0f} per unit on configured economics; publish a scoped pilot or bundle in the "
                    f"{sym}{low}–{sym}{high} band until three written quotes lock the floor. Model posture: {model}."
                )
            except (TypeError, ValueError):
                break
    return (
        f"Publish a single scoped pilot or diagnostic in the {sym}49–{sym}249 range for a defined outcome and timebox; "
        f"revise after three paying or deposit-backed conversations. Model posture: {model}. No scale until margin is written down."
    )


def _offer_line(public: dict[str, Any]) -> str:
    product = _product_line(public)
    verdict = _s((public.get("decision") or {}).get("verdict")).lower()
    if verdict == "kill":
        return (
            f"Offer (validation-only, not for public sale until reframed): a 30-minute structured diagnostic on «{product[:120]}» "
            f"that ends with a written pass/fail on economics — used only to disprove or reshape the wedge, not to scale revenue."
        )
    if verdict == "hold":
        return (
            f"Offer: a tight, time-boxed pilot of «{product[:140]}» with a single measurable outcome, fixed scope, and a kill rule "
            f"if the buyer will not commit to price or deposit by the agreed date."
        )
    return (
        f"Offer: a clear paid entry point for «{product[:140]}» — one hero SKU or service package with published scope, "
        f"timeline, and what the buyer receives in week one. No catalogue sprawl until the first tranche repeats."
    )


def _demand_test(public: dict[str, Any]) -> str:
    verdict = _s((public.get("decision") or {}).get("verdict")).lower()
    if verdict == "kill":
        return (
            "Demand test (24–48h): five structured discovery calls with buyers who match the ICP sketch. "
            "Success is not enthusiasm — it is willingness to name price sensitivity and next step. "
            "If zero commit to a follow-up concrete step, pause the concept."
        )
    return (
        "Demand test (24–48h): ten outbound touches or one micro-campaign to a named list; success = at least three substantive replies "
        "with budget or timing disclosed, or one deposit / signed SOW. Use manual messages — no tooling spend."
    )


def _first_money(public: dict[str, Any]) -> str:
    verdict = _s((public.get("decision") or {}).get("verdict")).lower()
    if verdict == "kill":
        return (
            "First money: do not invoice on the current framing. If you must test, cap at symbolic deposits only after a written "
            "scope change; otherwise redeploy calendar time to a narrower offer that clears the gates in a fresh run."
        )
    if verdict == "hold":
        return (
            "First money: target one £100–£1,000 deposit or equivalent against a written mini-scope within seven days; "
            "if the buyer hesitates on price, stop and fix the offer or ICP before adding volume."
        )
    return (
        "First money: close the first £ within 48–72 hours via invoice or payment link tied to a dated deliverable — "
        "not a proposal queue. Log objection verbatim; if price is not accepted twice, narrow scope before you chase more leads."
    )


def build_zero_capital_execution(public: dict[str, Any]) -> dict[str, str]:
    ch = _strategy_channel(public)
    return {
        "offer": _offer_line(public),
        "price": _price_gbp_line(public),
        "target_customer": _niche_icp(public),
        "channel": ch,
        "acquisition_channel": ch,
        "demand_test": _demand_test(public),
        "first_money": _first_money(public),
    }


def build_delivery_system(public: dict[str, Any]) -> dict[str, Any]:
    ex = public.get("execution") if isinstance(public.get("execution"), dict) else {}
    checklist = ex.get("execution_checklist") if isinstance(ex.get("execution_checklist"), list) else []
    steps: list[str] = []
    for item in checklist[:5]:
        t = _s(item)
        if t:
            steps.append(t)
    if len(steps) < 3:
        steps.extend(
            [
                "Confirm intake: scope, success criteria, and single point of contact in writing.",
                "Execute the core deliverable manually; document time and variance.",
                "Deliver outputs with a dated handover note and acceptance checkpoint.",
            ]
        )
    product = _product_line(public)
    client_output = (
        f"The client receives a defined artefact tied to «{product[:100]}»: written outcomes, access or physical delivery as scoped, "
        f"plus a one-page recap of what was done and what is excluded — no implied unlimited support."
    )
    retention = (
        "Retention: schedule a fixed 14-day check-in; if value lands, propose a light recurring checkpoint (monthly or quarterly) "
        "with a capped hours band — repeat revenue before new acquisition spend."
    )
    upsell = (
        "Upsell path: only after the baseline delivery is accepted — offer an adjacent module (deeper audit, additional geography, "
        "or higher SLA) as a second statement of work, not a discount on the core package."
    )
    return {
        "service_steps": steps[:6],
        "client_output": client_output,
        "retention": retention,
        "upsell": upsell,
    }


def attach_execution_delivery_layer(out: dict[str, Any]) -> None:
    """Ensures execution Phase-2 fields and delivery Phase-3 object are always populated."""
    ex = out.setdefault("execution", {})
    dl = out.setdefault("delivery", {})

    zc = build_zero_capital_execution(out)
    for key, val in zc.items():
        if not _non_empty(ex.get(key)):
            ex[key] = val

    built = build_delivery_system(out)
    steps = dl.get("service_steps")
    if not isinstance(steps, list) or not steps or not all(_non_empty(x) for x in steps):
        dl["service_steps"] = built["service_steps"]
    for key in ("client_output", "retention", "upsell"):
        if not _non_empty(dl.get(key)):
            dl[key] = built[key]
