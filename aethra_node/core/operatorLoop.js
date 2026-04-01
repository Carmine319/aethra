"use strict";

const crm = require("../crm/crm");
const { evaluateAndLaunch } = require("../venture/ventureEngine");
const { findLeads } = require("../operator/leadEngine");
const { generateSequence, generateMessage } = require("../outreach/outreachEngine");
const { sendOutreachEmail } = require("../outreach/realOutreach");
const { findSuppliers } = require("../supplier/supplierEngine");
const { buildExecutionPack } = require("../supply/executionPack");
const { classifyReply, generateResponse, buildReplyDraft } = require("../operator/replyAI");
const { processReply: processRevenueReply } = require("../reply/replyEngine");
const { generateClosingMessage } = require("../operator/closing");
const { saveMemory, getInsights } = require("../memory/memory");
const {
  recordCycle,
  getLearningSignals,
  learn,
  learnCapitalFromVenture,
  getCMSSnapshot,
} = require("../memory/learningEngine");
const { runResearchCycle } = require("../intelligence/researchEngine");
const { createNewAngle } = require("../intelligence/categoryEngine");
const { improveSystem } = require("../intelligence/improvementEngine");
const { applySimulatedCloses, describeCycle } = require("../venture/ventureCycle");
const { getPortfolioStats } = require("../portfolio/portfolioEngine");
const {
  evaluateAllActiveVentures,
  applyKillDecisions,
} = require("../portfolio/scalingEngine");
const { getSynergyInsights } = require("../portfolio/synergyEngine");
const wallet = require("../venture/wallet");

const SIMULATED_INBOX = [
  "yes — thursday 3pm works for us",
  "not for us right now, budget is tight",
  "can you send pricing and what’s included in week one?",
];

/** Relentless profit mode — single-pass triggers when ledger is below threshold. */
function profitLoop(portfolioStats, thresholdGbp = 0) {
  if (!portfolioStats || typeof portfolioStats.net_profit !== "number") {
    return {
      active: false,
      mantra: "Define net profit on the ledger to enable profit-loop triggers.",
      triggers: [],
    };
  }
  if (portfolioStats.net_profit > thresholdGbp) {
    return {
      active: false,
      mantra: "Fastest money path: deepen the validated pipeline before new categories.",
      triggers: [],
    };
  }
  return {
    active: true,
    mantra: "Profit below threshold — pivot angle, offer, or pricing before more volume.",
    triggers: ["new_idea_angle", "outreach_depth", "pricing_test", "research_cycle"],
    actions: [
      "Run categoryEngine reframing on the current wedge",
      "One pricing or pilot-cap test on the next touch",
      "Tighten ICP; second outreach pass only on narrowed list",
    ],
  };
}

/** One-cycle directives when ledger shows no net profit — no blocking loops. */
function profitRecoveryDirectives(portfolioStats) {
  if (!portfolioStats || typeof portfolioStats.net_profit !== "number") {
    return { active: false, actions: [] };
  }
  if (portfolioStats.net_profit > 0) {
    return { active: false, actions: [] };
  }
  return {
    active: true,
    actions: [
      "Recovery mode (this run only): second outreach pass when a second lead exists.",
      "Offer line may include an explicit pilot cap — see second touch copy.",
      "If CRM progression stays cold, narrow ICP keywords on the next idea or URL run.",
    ],
  };
}

async function runOperatorCycle(pyPayload, inputText) {
  const venture = evaluateAndLaunch(pyPayload);
  if (
    venture.name &&
    (venture.launched || venture.reason === "venture_already_active")
  ) {
    wallet.bumpVentureOutreach(venture.name);
  }

  const ex = pyPayload.execution || {};
  const offer = String(ex.offer || ex.product_focus || "scoped outcome").slice(0, 200);
  const productLine = String(ex.product_focus || offer || inputText).slice(0, 300);

  const supplierPack = await findSuppliers(productLine, { limit: 8 });
  const executionPack = buildExecutionPack({
    pyPayload,
    supplyAccess: supplierPack.supply_access,
    productLine,
    ventureName: venture.name,
  });

  const leads = findLeads(String(ex.target_customer || ""));
  const sequences = leads.slice(0, 5).map((L) => ({ lead_id: L.id, ...generateSequence(L) }));
  for (const L of leads) {
    crm.addLead({ ...L, stage: "lead" });
  }
  if (leads[0]) {
    crm.updateStage(leads[0].id, "contacted");
  }

  const offerLine = generateMessage(leads[0] || { name: "Operator", location: "" }, offer);

  let emailsSent = 0;
  let emailsSimulated = 0;
  const emailResults = [];
  if (leads[0] && leads[0].email) {
    const dispatch = await sendOutreachEmail({
      to: leads[0].email,
      subject: `Quick fit — ${String(pyPayload.brand?.brand_name || "AETHRA").slice(0, 40)}`,
      text: offerLine,
    });
    emailResults.push({ lead_id: leads[0].id, ...dispatch });
    crm.recordEmailSent(leads[0].id);
    if (dispatch.mode === "live") emailsSent++;
    else emailsSimulated++;
    learn(
      {
        type: "outreach_email",
        context_niche: String(ex.target_customer || productLine || "").slice(0, 120),
      },
      { outcome: dispatch.mode }
    );
  }

  let repliesSimulated = 0;
  const replyLog = [];
  const pipeline = crm.getPipeline();

  for (let i = 0; i < Math.min(3, pipeline.length); i++) {
    const msg = SIMULATED_INBOX[i % SIMULATED_INBOX.length];
    const cl = classifyReply(msg);
    repliesSimulated++;
    const id = pipeline[i].id;
    const draft = buildReplyDraft(pipeline[i], offer, msg, cl);
    let revenueReplyLayer = null;
    try {
      revenueReplyLayer = await processRevenueReply(msg, { stage: pipeline[i].stage }, {
        offer,
        niche: String(ex.target_customer || productLine || "").slice(0, 120),
      });
    } catch {
      /* optional enrichment */
    }
    if (revenueReplyLayer && revenueReplyLayer.crm_stage) {
      crm.updateStage(id, revenueReplyLayer.crm_stage);
    } else if (cl.category === "interested") {
      crm.updateStage(id, "negotiation");
    } else if (cl.category === "objection") {
      crm.updateStage(id, "contacted");
    } else if (cl.category === "follow_up") {
      crm.updateStage(id, "replied");
    } else {
      crm.updateStage(id, "contacted");
    }
    replyLog.push({
      lead_id: id,
      inbound_simulated: msg,
      category: cl.category,
      confidence: cl.confidence,
      suggested_reply: generateResponse(cl.category),
      reply_draft: draft,
      closing: generateClosingMessage(cl.category),
      revenue_reply_layer: revenueReplyLayer,
    });
    learn(
      {
        type: "simulated_reply",
        context_niche: String(ex.target_customer || productLine || "").slice(0, 120),
      },
      { outcome: cl.category }
    );
  }

  const wBefore = wallet.getBalance();
  const closeResult = applySimulatedCloses(venture.name, replyLog, venture.launched);

  try {
    saveMemory({
      idea: inputText,
      decision: pyPayload.decision || {},
      execution: pyPayload.execution || {},
      results: {
        venture_launched: venture.launched,
        venture_name: venture.name,
        budget: venture.budget,
        replies_simulated: repliesSimulated,
        suppliers: supplierPack.suppliers.length,
        emails_dispatched: emailResults.length,
        simulated_closes: closeResult.closes,
      },
      conversion_signals: {
        leads_in_pipeline: pipeline.length,
        revenue_sim_gbp: closeResult.revenue_gbp,
      },
    });
  } catch {
    /* memory file optional */
  }

  try {
    recordCycle({
      leads: leads.length,
      suppliers_found: supplierPack.suppliers.length,
      emails_sent: emailsSent,
      emails_simulated: emailsSimulated,
      replies_classified: repliesSimulated,
      simulated_closes: closeResult.closes,
      revenue_delta_gbp: closeResult.revenue_gbp,
      wallet_after: wallet.getBalance(),
    });
  } catch {
    /* learning file optional */
  }

  if (Number(closeResult.revenue_gbp) > 0) {
    learn(
      {
        type: "close_cycle",
        context_niche: String(venture.name || productLine || "").slice(0, 120),
      },
      { outcome: "close", revenue_gbp: closeResult.revenue_gbp }
    );
    if (venture.name && venture.budget != null) {
      learnCapitalFromVenture(venture.name, venture.budget, closeResult.revenue_gbp);
    }
  }

  const crmMetrics = crm.getMetrics();
  const scalingEvaluations = evaluateAllActiveVentures(crmMetrics);
  const killsApplied = applyKillDecisions(scalingEvaluations);

  let portfolioStats = getPortfolioStats();
  const recovery = profitRecoveryDirectives(portfolioStats);

  if (recovery.active && leads[1] && leads[1].email) {
    const line2 = `${offerLine} — Pilot: fixed cap in writing (recovery outreach pass).`;
    const d2 = await sendOutreachEmail({
      to: leads[1].email,
      subject: `Fit follow-up — ${String(pyPayload.brand?.brand_name || "AETHRA").slice(0, 36)}`,
      text: line2,
    });
    emailResults.push({ lead_id: leads[1].id, recovery_pass: true, ...d2 });
    crm.recordEmailSent(leads[1].id);
    if (d2.mode === "live") emailsSent++;
    else emailsSimulated++;
    learn(
      {
        type: "outreach_recovery",
        context_niche: String(ex.target_customer || productLine || "").slice(0, 120),
      },
      { outcome: d2.mode }
    );
  }

  portfolioStats = getPortfolioStats();

  const insightPack = getInsights();
  const memoryLines = insightPack.lines || [];
  const learningLines = getLearningSignals();

  const synergy = getSynergyInsights({
    ventures: wallet.getWalletSummary().ventures,
    learningLines,
    execution: ex,
    brand: pyPayload.brand || {},
  });

  const researchCycle = runResearchCycle({
    product_line: productLine,
    target_customer: ex.target_customer,
    crm_health: crmMetrics.pipeline_health || "unknown",
  });
  const categoryAngle = createNewAngle(
    [venture.name, offer, productLine].filter(Boolean).join(" ") || inputText
  );
  const improvement = improveSystem({ envelope: pyPayload });
  const profitMode = profitLoop(portfolioStats, 0);
  const cmsSnapshot = getCMSSnapshot();

  const next_actions = [
    "Verify supplier rows with real quotes before any PO; no URL in mock is vetted.",
    describeCycle(venture, closeResult),
    "Review CRM metrics — if reply_progression_rate is cold, tighten first-line copy.",
    ...(recovery.active ? recovery.actions : []),
    ...(profitMode.active && Array.isArray(profitMode.actions) ? profitMode.actions : []),
  ];

  const walletsBreakdown = wallet.getWalletsBreakdown();

  const autonomousPatch = {
    leads,
    supplier_intel: supplierPack,
    execution_pack: executionPack,
    supply_layers: {
      curated_match: !!(supplierPack.supply_access && supplierPack.supply_access.layer1_curated && supplierPack.supply_access.layer1_curated.matched),
      live_places:
        supplierPack.supply_access &&
        supplierPack.supply_access.layer2_connectors &&
        (supplierPack.supply_access.layer2_connectors.connector_manifest || []).some((c) => c.status === "ok"),
      interpretation_ready: !!(supplierPack.supply_access && supplierPack.supply_access.layer3_interpretation),
    },
    outreach: {
      sequences,
      sample_initial: offerLine,
      email_dispatch: emailResults,
      reply_simulations: replyLog,
    },
    crm: { pipeline: crm.getPipeline(), metrics: crmMetrics },
    learning_signals: learningLines,
    next_actions,
    profit_recovery: recovery,
    profit_loop: profitMode,
    compounding: {
      research_top: (researchCycle.top_opportunities || []).slice(0, 3),
      category_angle: categoryAngle,
      improvement_refinements: (improvement.refinements || []).slice(0, 4),
      cms_counts: cmsSnapshot.counts,
    },
    scaling_evaluations: scalingEvaluations,
    scaling_kills_applied: killsApplied,
    operator_activity: {
      leads_generated: leads.length,
      suppliers_surfaced: supplierPack.suppliers.length,
      replies_simulated: repliesSimulated,
      venture_launched: venture.launched,
      venture_name: venture.name || null,
      budget_allocated: venture.budget || 0,
      emails_live: emailsSent,
      emails_simulated: emailsSimulated,
      simulated_closes: closeResult.closes,
      simulated_revenue_gbp: closeResult.revenue_gbp,
      reinvest_tagged_gbp: closeResult.reinvest_gbp,
    },
  };

  const wsum = wallet.getWalletSummary();

  try {
    const { runLivePortfolioBrain } = require("../portfolio/portfolioBrain");
    runLivePortfolioBrain({ recordMemory: true });
  } catch {
    /* portfolio brain memory is best-effort */
  }

  return {
    autonomousPatch,
    venture: {
      wallet: {
        balance: wsum.balance,
        currency: "GBP",
        reinvest_pool: wsum.reinvest_pool,
      },
      active_ventures: wsum.ventures,
      last_launch: venture,
      cycle: {
        simulated_closes: closeResult.closes,
        revenue_gbp: closeResult.revenue_gbp,
        reinvest_gbp: closeResult.reinvest_gbp,
        narrative: describeCycle(venture, closeResult),
      },
    },
    portfolio: portfolioStats,
    scaling: {
      evaluations: scalingEvaluations,
      kills_applied: killsApplied,
    },
    synergy,
    wallets_aggregate: {
      total_combined: wallet.getTotalBalance(),
      wallets: walletsBreakdown,
    },
    memory_insight_lines: [...memoryLines, ...learningLines.slice(0, 1)],
    operator_meta: {
      cycle: "post_analysis_automation",
      at: Date.now(),
      wallet_before_snapshot: wBefore,
    },
    compounding_intelligence: {
      research_cycle: researchCycle,
      category_angle: categoryAngle,
      improvement,
      profit_loop: profitMode,
      cms: cmsSnapshot,
    },
  };
}

module.exports = { runOperatorCycle, profitRecoveryDirectives, profitLoop };
