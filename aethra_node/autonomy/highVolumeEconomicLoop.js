"use strict";

const { runEconomicLoop } = require("./economicLoop");
const { ensureMinimumVolume } = require("../execution/volumeEngine");
const { resolveActionTrigger } = require("../execution/actionTrigger");
const { computeBalancedVolume } = require("../execution/balanceEngine");
const { detectFriction } = require("../friction/frictionEngine");
const { resolveFriction } = require("../friction/fixEngine");
const { prioritizeSpeedToCash } = require("../profit/speedEngine");
const { simplifyFulfilment } = require("../fulfilment/simplifier");
const { accelerateProof } = require("../proof/accelerator");
const { runAdaptationCycle } = require("../adaptation/adaptationEngine");
const { connectRealWorld } = require("../integration/realWorldLayer");
const { appendEconomicMemory } = require("../profit/systemMemory");

async function runHighVolumeEconomicLoop(inputText, context = {}) {
  const trigger = resolveActionTrigger({
    inactive_hours: Number(context.inactive_hours || 0),
    approved_once: context.approved_once !== false,
    cooldown_minutes: Number(context.cooldown_minutes || 0),
  });

  if (!trigger.auto_cycle_enabled) {
    return {
      executed: false,
      trigger,
      system_behaviour: "Execution window pending",
    };
  }

  const base = await runEconomicLoop(inputText, context);

  const volume = ensureMinimumVolume({
    leads_generated: base.leads.total,
    outreach_sent: base.outreach.sent_count,
    replies_processed: base.replies.replied_count,
    booking_attempts: base.replies.booked_count,
  });

  const balance = computeBalancedVolume({
    current_volume: volume.outreach_sent,
    bounce_rate: Number(context.bounce_rate || 0),
    reply_rate: Number(base.kpis.reply_rate || 0),
  });

  const speed = prioritizeSpeedToCash([
    {
      niche: base.niche.selected.niche,
      type: "service diagnostic local b2b",
      time_to_cash_days: Number(String(base.niche.selected.time_to_cash || "7").split("-")[0]) || 7,
      roi: Number(base.kpis.ROI || 0),
    },
  ]);

  const simplifiedFulfilment = simplifyFulfilment({
    ...base.fulfilment,
    fulfilment_complexity: Number(context.fulfilment_complexity || 45),
  });

  const friction = detectFriction({
    reply_rate: base.kpis.reply_rate,
    bookings: base.replies.booked_count,
    failed_payments: Number(context.failed_payments || 0),
    fulfilment_complexity: simplifiedFulfilment.fulfilment_complexity,
  });

  const fixes = resolveFriction(friction, { current_offer: base.offer.title });

  const acceleratedProof = accelerateProof({
    niche: base.niche.selected.niche,
    projected_outcome: "improved reply-to-booking conversion",
    timeline: "10-14 days",
  });

  const adaptation = runAdaptationCycle({
    messages: [{ id: "m1", reply_rate: Number(base.kpis.reply_rate || 0) }],
    niches: [{ id: base.niche.selected.niche, roi: Number(base.kpis.ROI || 0) }],
    offers: [{ id: base.offer.title, close_rate: Number(base.kpis.close_rate || 0) }],
  });

  const realWorld = connectRealWorld({
    leads: base.leads.sample,
    suppliers: base.fulfilment.supplier ? [{ name: base.fulfilment.supplier }] : [],
    delivery: {
      supplier: base.fulfilment.supplier,
      steps: simplifiedFulfilment.steps && simplifiedFulfilment.steps.length
        ? simplifiedFulfilment.steps
        : base.fulfilment.steps,
    },
  });

  const ui = {
    execution_status: {
      outreach_active: volume.outreach_sent >= 20,
      leads_generated: volume.leads_generated,
      replies_in_progress: volume.replies_processed,
    },
    friction_status: {
      blockers_detected: friction.friction_type !== "none",
      blockers: friction,
      fixes_applied: fixes,
    },
    system_behaviour: {
      continuous_execution: trigger.auto_cycle_enabled,
      adapting: true,
      statement: "Execution is continuous. System is adapting.",
    },
  };

  const out = {
    executed: true,
    trigger,
    flow: "NICHE -> OFFER -> LEADS -> OUTREACH -> REPLIES -> CLOSE -> DELIVERY -> PROOF -> KPI -> FRICTION -> SCALE/KILL",
    base,
    volume,
    balance,
    speed,
    friction,
    fixes,
    simplified_fulfilment: simplifiedFulfilment,
    accelerated_proof: acceleratedProof,
    adaptation,
    real_world: realWorld,
    ui,
  };

  appendEconomicMemory({
    kind: "high_volume_loop_run",
    input: String(inputText || "").slice(0, 220),
    kpis: base.kpis,
    volume,
    friction,
    fixes,
  });

  return out;
}

module.exports = { runHighVolumeEconomicLoop };