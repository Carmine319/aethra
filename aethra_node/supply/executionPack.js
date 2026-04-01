"use strict";

function clip(s, n) {
  const t = String(s || "").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "\u2026";
}

function slug(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 32);
}

function verdictViable(dec) {
  if (!dec || typeof dec !== "object") return { viable: null, label: "Assessment pending" };
  const v = String(dec.verdict || "").toLowerCase();
  const blocked = new Set(["kill", "reject", "no_go", "no-go", "halt"]);
  if (blocked.has(v)) return { viable: false, label: "Not viable under current gates — revise wedge before supply spend." };
  if (v === "proceed" || v === "advance" || v === "go") return { viable: true, label: "Viable — execute under verification discipline." };
  return { viable: true, label: "Conditional — proceed only as validation clears." };
}

/**
 * Full execution artefact: decision framing, supplier stack narrative, brand/WEB/outreach, calendar.
 */
function buildExecutionPack({ pyPayload, supplyAccess, productLine, ventureName }) {
  const dec = (pyPayload && pyPayload.decision) || {};
  const viable = verdictViable(dec);
  const brand = (pyPayload && pyPayload.brand) || {};
  const handles = brand.handles || {};
  const l1 = (supplyAccess && supplyAccess.layer1_curated) || {};
  const l3 = (supplyAccess && supplyAccess.layer3_interpretation) || {};
  const roles = l3.supplier_roles || {};
  const stack = l3.execution_stack || {};

  const offer = clip(
    ((pyPayload.execution || {}).offer || (pyPayload.execution || {}).product_focus || productLine || "your service").trim(),
    120
  );
  const vn = ventureName || brand.name || brand.brand_name || clip(productLine, 48) || "Venture";

  const primaryChem = (roles.chemicals && roles.chemicals[0] && roles.chemicals[0].name) || "primary chemical supplier";
  const primaryEq = (roles.equipment && roles.equipment[0] && roles.equipment[0].name) || "equipment supplier";
  const primaryBk = (roles.backup_supplier && roles.backup_supplier[0] && roles.backup_supplier[0].name) || "backup supplier lane";

  const dom = handles.domain || `${slug(vn)}.co.uk`;
  const handle = handles.primary || slug(vn).replace(/_+/g, "");

  const hero = `${vn} — ${offer}. Food-safe, time-boxed pilots with written scope.`;
  const website = {
    landing_hero: hero,
    structure: [
      "Hero: outcome + geography + response CTA",
      "Proof: before/after hygiene compliance or downtime saved (placeholder until you have cases)",
      "Offer: pilot cap, SLA window, single commercial owner",
      "FAQ: chemicals, certifications, insurance",
      "Footer: company, ICO basics, contact",
    ],
    primary_cta: "Book a 15-minute scoping call",
    secondary_cta: "Download one-page pilot PDF",
  };

  const supplier_emails = [
    `Subject: Quote request — ${clip(offer, 60)} (starter order)\n\nWe're standing up ${vn} and need written MOQ, SDS, and lead time for food-safe concentrate suitable for ice / slush lines. Target first delivery UK within 10 days. Please confirm trade account terms.`,
    `Subject: Equipment bundle — brushes, foamers, PPE\n\nParallel to chemicals, please quote a technician starter kit for commercial ice machine sanitation. Prefer single invoice with next-week delivery.`,
    `Subject: Second source / backup pricing\n\nWe're locking a primary but need a backup line on ${clip(productLine, 50)} consumables for redundancy. Please advise pallet vs case economics.`,
  ];

  const client_messages = [
    `Hi — we run documented ice & slush hygiene visits for independents. Pilot is a single site, fixed cap, 14-day measurable outcome. Open to a 12-minute call this week?`,
    `Quick follow-up: if budget is the blocker we can stage chemicals-only first visit with your existing team — still under written scope.`,
    `Last note — if timing is wrong, reply \u201clater\u201d and I\u2019ll check in next quarter. If useful I can send Thursday AM slots.`,
  ];

  const inbound_funnel = {
    channels: ["Landing CTA \u2192 Calendly or form", "One LinkedIn touch to facilities/ops in target postcodes", "Optional WhatsApp Business for repeat sites only"],
    qualification: "Must confirm site address, machine count, and access window before dispatch.",
    handoff: "After booking: send one-pager + SDS pack + pilot invoice draft same day.",
  };

  const execution_calendar = [
    { day: 1, focus: "Contact suppliers", actions: [`Email ${primaryChem} for quote + SDS`, "Confirm insurance and COSHH posture"] },
    { day: 2, focus: "Buy starter kit", actions: [`Place equipment order with ${primaryEq} if quote acceptable`, "Load CRM with three target venues"] },
    { day: 3, focus: "Launch page", actions: ["Publish landing draft from AETHRA structure", "Set analytics + form routing"] },
    { day: 4, focus: "Outreach live", actions: ["Send three client messages", "Log replies in CRM; trigger auto-drafts"] },
    { day: 5, focus: "Review & scale gate", actions: [`If throughput climbs, activate ${primaryBk}`, "Re-read execution stack thresholds at \u00a32k and \u00a310k / month"] },
  ];

  return {
    business_decision: {
      verdict: dec.verdict || "unknown",
      viable: viable.viable,
      summary: viable.label,
    },
    supplier_stack: {
      chemicals: roles.chemicals || [],
      equipment: roles.equipment || [],
      backup: roles.backup_supplier || [],
      execution_stack: stack,
      layer_note: l3.layer3_note,
    },
    brand: {
      name: brand.name || brand.brand_name || vn,
      domain_candidate: dom,
      domain_availability: "verify_via_registrar",
      handles: {
        primary: handle || "—",
        alternatives: Array.isArray(handles.alternatives) ? handles.alternatives : [`@${slug(vn)}`, `@${slug(vn)}_hq`],
      },
      tagline: brand.tagline || clip(hero, 90),
    },
    website,
    outreach: {
      supplier_emails,
      client_outreach_messages: client_messages,
      linkedin_note: clip(client_messages[0], 280),
      whatsapp_script: `${vn}: Hi {name}, we\u2019re scheduling ice-line hygiene visits in {area} — reply YES for a one-line scope + pilot cap.`,
      inbound_funnel,
    },
    execution_plan_calendar: execution_calendar,
    curated_match: !!l1.matched,
    at: Date.now(),
  };
}

module.exports = { buildExecutionPack, verdictViable };
