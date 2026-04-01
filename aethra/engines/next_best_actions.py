"""Exactly three concrete, revenue-oriented next steps for dashboard + API consumers."""

from __future__ import annotations

from typing import Any


def _humanize_key(s: str) -> str:
    return " ".join(str(s).replace("_", " ").split()).strip() or "this gap"


def _short(text: str, n: int = 88) -> str:
    t = " ".join((text or "").split())
    if len(t) <= n:
        return t
    return t[: n - 1].rstrip() + "…"


def _currency_symbol(currency: str) -> str:
    c = (currency or "GBP").upper().strip()
    if c == "GBP":
        return "£"
    if c == "EUR":
        return "€"
    if c == "USD":
        return "$"
    return f"{c} "


def _idea_text_blob(idea_payload: dict[str, Any] | None) -> str:
    if not idea_payload:
        return ""
    slots = idea_payload.get("slots") if isinstance(idea_payload.get("slots"), dict) else {}
    parts = [
        str(slots.get("raw_idea") or ""),
        str(slots.get("product_hypothesis") or ""),
        str(idea_payload.get("best_version") or ""),
    ]
    return " ".join(parts).lower()


def _product_line(idea_payload: dict[str, Any] | None, execution: dict[str, Any] | None) -> str:
    slots = (idea_payload or {}).get("slots") if isinstance((idea_payload or {}).get("slots"), dict) else {}
    p = str(slots.get("product_hypothesis") or "").strip()
    if not p and execution:
        p = str(execution.get("product_focus") or "").strip()
    return _short(p, 90) or "this offer"


def _vertical(blob: str, product: str) -> str:
    b = f"{blob} {product}".lower()
    if any(k in b for k in ("saas", "software", "app ", "api", "platform", "dashboard", "subscription")):
        return "digital"
    if any(
        k in b
        for k in (
            "supplement",
            "vitamin",
            "cosmetic",
            "skincare",
            "food",
            "snack",
            "beverage",
            "apparel",
            "clothing",
            "hardware",
            "device",
            "manufactur",
        )
    ):
        return "physical"
    return "general"


def _moq_phrase(context: dict[str, Any]) -> str:
    mq = context.get("supplier_moq")
    if mq is None:
        return "under 500 units"
    try:
        m = int(float(mq))
        return f"at or below {m} units MOQ"
    except (TypeError, ValueError):
        return "under 500 units"


def _channel_touchpoint(blob: str, niche: str, product: str) -> str:
    b = blob
    label = niche or product
    if "tiktok" in b:
        return (
            f"Record and post 3 short TikToks naming the specific late-night (or primary) buyer pain for «{label}», "
            "each ending with a CTA to your landing link—publish today without paid boost."
        )
    if "instagram" in b or "reels" in b:
        return (
            f"Publish 3 Instagram Reels or feed posts aimed at «{label}» with the same hook → proof → CTA arc; "
            "link the offer in bio or sticker."
        )
    if "linkedin" in b:
        return (
            f"Post one LinkedIn thread and two DMs to ICP profiles: lead with a metric or workflow pain for «{label}», "
            "then link to book or buy."
        )
    return (
        f"Ship 3 organic shorts or feed posts that quote the buyer pain for «{label}» in their words and link straight "
        "to your revenue page—no ad spend until you capture emails, calls, or pre-orders."
    )


def build_next_best_actions(
    *,
    mode: str,
    idea_payload: dict[str, Any] | None = None,
    analysis_payload: dict[str, Any] | None = None,
    page_title: str = "",
    monetisation: dict[str, Any] | None = None,
    brand: dict[str, Any] | None = None,
    execution: dict[str, Any] | None = None,
    context: dict[str, Any] | None = None,
    decision: dict[str, Any] | None = None,
) -> list[str]:
    ctx = dict(context or {})
    monet = monetisation if isinstance(monetisation, dict) else {}
    br = brand if isinstance(brand, dict) else {}
    ex = execution if isinstance(execution, dict) else {}
    mode_l = (mode or "idea").lower().strip()

    ps = monet.get("pricing_strategy") if isinstance(monet.get("pricing_strategy"), dict) else {}
    currency = str(ps.get("currency") or "GBP")
    sym = _currency_symbol(currency)

    headline = str(br.get("headline") or "").strip()
    if not headline:
        bn = str(br.get("brand_name") or "").strip()
        tg = str(br.get("tagline") or "").strip()
        headline = f"{bn}: {tg}".strip(": ").strip()

    product = _product_line(idea_payload, ex)
    blob = _idea_text_blob(idea_payload)
    if not headline:
        headline = _short(product, 70)

    niche = ""
    if idea_payload and str(idea_payload.get("selected_niche") or "").strip():
        niche = str(idea_payload.get("selected_niche")).replace("_", " ").strip()

    sell = ctx.get("assumed_sell_price")
    price_bit = ""
    if sell is not None:
        try:
            sp = float(sell)
            price_bit = f"{sym}{sp:.2f}".replace(".00", "")
        except (TypeError, ValueError):
            price_bit = ""

    if mode_l == "miae":
        dec = decision if isinstance(decision, dict) else {}
        opps = dec.get("opportunities") if isinstance(dec.get("opportunities"), list) else []
        if opps:
            row0 = opps[0] if isinstance(opps[0], dict) else {}
            t0 = str(row0.get("title") or row0.get("gap_hypothesis") or "the top-ranked hypothesis").strip()
            t0 = _short(t0, 100)
            return [
                f"Take «{t0}» and attach one primary source URL plus a 5-line note on who pays and why today.",
                "Message two operators or buyers in that vertical with a concrete ask: would they pre-pay or pilot at a named price—log verbatim replies.",
                "Book 25 minutes on your calendar to either kill the hypothesis, narrow the ICP, or commit one paid distribution test with a revenue KPI.",
            ]
        return [
            "Paste at least three `trend_summaries` objects (title, gap_hypothesis, score, source_ref) into your scan context so rankings use real signals.",
            "Open each `source_ref` from those rows and capture one verifiable number or quote in a spreadsheet column today.",
            "Pick one vertical sentence you will defend on tomorrow’s first outbound or stakeholder call—no new ideas until that sentence is tested once.",
        ]

    if mode_l == "url":
        an = analysis_payload if isinstance(analysis_payload, dict) else {}
        gaps = [str(g).strip() for g in (an.get("monetisation_gaps") or []) if str(g).strip()]
        conv = [str(c).strip() for c in (an.get("conversion_issues") or []) if str(c).strip()]
        g0 = _humanize_key(gaps[0]) if gaps else "pricing or qualification clarity above the fold"
        c0 = _humanize_key(conv[0]) if conv else "primary CTA and proof placement"
        title = _short(page_title or product or "this page", 72)
        return [
            f"On «{title}», ship one live change today targeting «{g0}» (visible price path, book-a-call, or lead form)—deploy, don’t draft.",
            f"Move one proof element (metric, testimonial snippet, or logo) immediately beside the main CTA to fix «{c0}».",
            "Export today’s baseline: primary CTA clicks and form starts from analytics into a single row so the next edit ties to revenue evidence.",
        ]

    vert = _vertical(blob, product)

    if vert == "physical":
        moq = _moq_phrase(ctx)
        step2 = (
            f"Publish a one-page landing with «{headline}» as the hero and a pre-order or deposit button at {price_bit} ({currency})—live today."
            if price_bit
            else f"Publish a one-page landing with «{headline}» as the hero and a named {currency} pre-order tier you will reconcile against tonight’s supplier quotes."
        )
        return [
            f"Email or call 3 UK or EU manufacturers or wholesalers for «{product}»—request written quotes with {moq}, unit cost ex-VAT, and sample lead time (include a one-page spec in the same thread).",
            step2,
            _channel_touchpoint(blob, niche, product),
        ]

    if vert == "digital":
        return [
            f"Book 3 separate 20-minute calls with ICP buyers for «{product}» today—close each with a yes/no on pilot pricing in {currency}.",
            f"Turn on checkout for a single tier only ({sym}… or your floor) and link it from a one-pager titled «{headline}».",
            "Send 10 outbound emails or DMs with a two-sentence pitch plus the booking or payment link; paste objections into a running doc.",
        ]

    tasks = ex.get("research_tasks") if isinstance(ex.get("research_tasks"), list) else []
    q1 = ""
    if tasks and isinstance(tasks[0], dict):
        q1 = _short(str(tasks[0].get("query") or ""), 130)

    step1 = (
        f"Execute today: {q1}"
        if q1
        else f"Identify and contact 3 credible suppliers, partners, or buyers for «{product}» and obtain written terms or next-step dates."
    )
    step2 = (
        f"Stand up one landing or Notion page with «{headline}» and a revenue action (pay, book, deposit) at {price_bit}."
        if price_bit
        else f"Stand up one landing or Notion page with «{headline}» and a single revenue CTA priced in {currency} once your floor is set."
    )
    return [
        step1,
        step2,
        f"Run 3 live buyer touches (call, DM, or meeting) referencing «{niche or product}»; end each with an ask that can produce cash or a signed next step.",
    ]
