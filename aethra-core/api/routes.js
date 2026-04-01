"use strict";

const express = require("express");
const core = require("../index.js");
const loop = require("../loop/engine.js");
const memory = require("../memory/index.js");
const { runRevenueLoop, readOffer } = require("../revenue/engine.js");
const { summarizePerformance } = require("../metrics/performance.js");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { computeSystemState, readSystemState } = require("../state/engine.js");
const { readEnvironmentState, scanEnvironment } = require("../sense/engine.js");
const { runOrganismTick, runMicroCycle } = require("../micro/loop.js");
const { PRIVATE_ONLY, assertPrivateOperatorMode } = require("../institutional/operator.js");
const { packageOutcome } = require("../institutional/packaging.js");
const { LICENCE_TIERS, createLicenceOffer } = require("../institutional/licensing.js");
const { runClientExecutionMode } = require("../institutional/client-mode.js");
const { COMPLIANCE_POLICY, getRegulatorSafeLanguage } = require("../institutional/compliance.js");
const { generateDeal } = require("../institutional/deals.js");

const NETWORK_DATA_FILE = path.join(__dirname, "..", "memory", "network-data.json");
const GRAPH_FILE = path.join(__dirname, "..", "memory", "intelligence_graph.json");
const PATTERN_FILE = path.join(__dirname, "..", "memory", "pattern_library.json");

let _revenueTimer = null;
let _revenueStarted = false;
let _microTimer = null;
let _microStarted = false;
let _organismTimer = null;
let _organismStarted = false;

function safeReadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function safeWriteJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function hashDoc(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value || {}), "utf8").digest("hex");
}

function createTrustOriginReceipt({
  venture_id,
  business_record,
  execution_proof,
  revenue_snapshot,
  mutation_history,
  previous_hash,
}) {
  const payload = {
    venture_id: String(venture_id || "n/a"),
    hashed_business_record: hashDoc(business_record),
    timestamped_execution_proof: { ts: Date.now(), hash: hashDoc(execution_proof) },
    revenue_proof_snapshot: hashDoc(revenue_snapshot),
    mutation_history_hash: hashDoc(mutation_history || []),
    previous_hash: String(previous_hash || "genesis"),
  };
  const verification_hash = hashDoc(payload);
  const short = verification_hash.slice(0, 12);
  const receipt = {
    verification_hash,
    lineage_chain: [payload.previous_hash, verification_hash],
    public_verification_endpoint: `/core/trustorigin/${short}`,
    timestamp: Date.now(),
    receipt_id: `TRUSTORIGIN-${short}`,
    venture_id: payload.venture_id,
  };
  const dir = path.join(__dirname, "..", "logs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `receipt_${short}.json`), JSON.stringify({ payload, receipt }, null, 2) + "\n", "utf8");
  return receipt;
}

function ingestUserActivity(userAction) {
  const rows = safeReadJson(NETWORK_DATA_FILE, []);
  const structured = {
    ts: Date.now(),
    action_type: String(userAction.action_type || "unknown"),
    user_id: String(userAction.user_id || "anonymous"),
    venture_id: String(userAction.venture_id || "n/a"),
    idea_input: String(userAction.idea_input || ""),
    business_type: String(userAction.business_type || ""),
    pricing_decision: userAction.pricing_decision ?? "",
    conversion_rate: Number(userAction.conversion_rate || 0),
    failure: String(userAction.failure || ""),
    revenue_outcome: Number(userAction.revenue_outcome || 0),
    context: userAction.context && typeof userAction.context === "object" ? userAction.context : {},
  };
  rows.push(structured);
  safeWriteJson(NETWORK_DATA_FILE, rows);
  return structured;
}

function buildIntelligenceGraph() {
  const rows = safeReadJson(NETWORK_DATA_FILE, []);
  const nodeMap = new Map();
  const edgeMap = new Map();

  const upsertNode = (type, label) => {
    const safeLabel = String(label || "unknown").slice(0, 120);
    const id = `${type}:${safeLabel.toLowerCase()}`;
    const node = nodeMap.get(id) || { id, type, label: safeLabel, weight: 0 };
    node.weight += 1;
    nodeMap.set(id, node);
    return id;
  };
  const upsertEdge = (source, target, kind, score = 1) => {
    const id = `${source}|${target}|${kind}`;
    const edge = edgeMap.get(id) || { source, target, kind, strength: 0 };
    edge.strength += score;
    edgeMap.set(id, edge);
  };

  for (const row of rows) {
    const user = upsertNode("user", row.user_id || "anonymous");
    const venture = upsertNode("venture", row.venture_id || "n/a");
    const niche = upsertNode("niche", row.business_type || "general");
    const offer = upsertNode("offer", String(row.pricing_decision || "unspecified"));
    const channel = upsertNode("channel", String((row.context && row.context.channel) || "unknown"));
    upsertEdge(user, venture, "ownership", 1);
    upsertEdge(venture, niche, "targets_niche", 1);
    upsertEdge(venture, offer, "offer_configuration", 1);
    upsertEdge(venture, channel, "distribution_channel", 1);
    if (Number(row.revenue_outcome || 0) > 0) upsertEdge(offer, niche, "success_relationship", 2);
    if (String(row.failure || "").trim()) upsertEdge(offer, niche, "failure_correlation", 2);
    if (Number(row.revenue_outcome || 0) > 0) upsertEdge(channel, offer, "revenue_pathway", Number(row.revenue_outcome || 0));
  }

  const graph = {
    generated_at: Date.now(),
    node_count: nodeMap.size,
    edge_count: edgeMap.size,
    nodes: [...nodeMap.values()],
    edges: [...edgeMap.values()],
  };
  safeWriteJson(GRAPH_FILE, graph);
  return graph;
}

function extractDominantPatterns() {
  const rows = safeReadJson(NETWORK_DATA_FILE, []);
  const byOffer = new Map();
  const byNiche = new Map();
  const byPath = new Map();

  for (const row of rows) {
    const offer = String(row.pricing_decision || "unspecified");
    const niche = String(row.business_type || "general");
    const channel = String((row.context && row.context.channel) || "unknown");
    const pathKey = `${niche} -> ${channel} -> ${offer}`;
    const revenue = Number(row.revenue_outcome || 0);
    const conversion = Number(row.conversion_rate || 0);

    const o = byOffer.get(offer) || { offer, conversions: 0, revenue: 0, runs: 0 };
    o.conversions += conversion;
    o.revenue += revenue;
    o.runs += 1;
    byOffer.set(offer, o);

    const n = byNiche.get(niche) || { niche, revenue: 0, conversions: 0, runs: 0 };
    n.revenue += revenue;
    n.conversions += conversion;
    n.runs += 1;
    byNiche.set(niche, n);

    const p = byPath.get(pathKey) || { path: pathKey, wins: 0, speed_hint: 0 };
    if (revenue > 0) p.wins += 1;
    p.speed_hint += conversion;
    byPath.set(pathKey, p);
  }

  const library = {
    generated_at: Date.now(),
    highest_converting_offers: [...byOffer.values()].sort((a, b) => b.conversions - a.conversions).slice(0, 10),
    fastest_revenue_paths: [...byPath.values()].sort((a, b) => b.wins + b.speed_hint - (a.wins + a.speed_hint)).slice(0, 10),
    best_performing_niches: [...byNiche.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    refinement_note: "Winning patterns are reused system-wide and refined continuously.",
  };
  safeWriteJson(PATTERN_FILE, library);
  return library;
}

function convertDataToAdvantage() {
  const rows = safeReadJson(NETWORK_DATA_FILE, []);
  const patterns = safeReadJson(PATTERN_FILE, {});
  return {
    generated_at: Date.now(),
    total_data_points: rows.length,
    top_performing_strategies: {
      offer: patterns.highest_converting_offers && patterns.highest_converting_offers[0],
      niche: patterns.best_performing_niches && patterns.best_performing_niches[0],
      path: patterns.fastest_revenue_paths && patterns.fastest_revenue_paths[0],
    },
    flywheel: "Better data -> better decisions -> more revenue -> more users -> more data",
  };
}

function processUserFeedback() {
  const rows = safeReadJson(NETWORK_DATA_FILE, []);
  const successes = rows.filter((r) => Number(r.revenue_outcome || 0) > 0).length;
  const failures = rows.filter((r) => String(r.failure || "").trim()).length;
  return {
    generated_at: Date.now(),
    success_reports: successes,
    failures,
    usage_patterns: {
      total_actions: rows.length,
      average_conversion_rate:
        rows.length === 0 ? 0 : rows.reduce((a, r) => a + Number(r.conversion_rate || 0), 0) / rows.length,
    },
    system_updates: ["Promote high-signal strategies", "Suppress weak strategies"],
  };
}

function shareLearnings() {
  const patterns = safeReadJson(PATTERN_FILE, {});
  const strong = Array.isArray(patterns.highest_converting_offers) ? patterns.highest_converting_offers.slice(0, 3) : [];
  const weak = Array.isArray(patterns.highest_converting_offers) ? patterns.highest_converting_offers.slice(-3) : [];
  return {
    generated_at: Date.now(),
    strategy_packets_propagated: strong,
    suppressed_weak_strategies: weak,
  };
}

function buildDataMoat() {
  const rows = safeReadJson(NETWORK_DATA_FILE, []);
  return {
    generated_at: Date.now(),
    proprietary_data_points: rows.length,
    competitive_rule: "Competitors cannot access this private structured dataset.",
  };
}

function increaseMarketControl() {
  const patterns = safeReadJson(PATTERN_FILE, {});
  return {
    generated_at: Date.now(),
    high_value_niches: Array.isArray(patterns.best_performing_niches) ? patterns.best_performing_niches.slice(0, 5) : [],
    dominance_equation: "Speed + data + replication = dominance",
  };
}

function trustLoop(receipt) {
  return {
    flow: [
      "user builds venture",
      "aethra executes",
      "trustorigin verifies",
      "result published",
      "new users attracted",
    ],
    signal: "Trust -> adoption -> data -> intelligence -> more trust",
    receipt,
  };
}

function maybeStartRevenueAutoloop() {
  if (_revenueStarted) return;
  if (process.env.CORE_ENABLED !== "true") return;
  _revenueStarted = true;
  const interval = Math.max(60_000, Number(process.env.CORE_REVENUE_INTERVAL_MS || 86_400_000));
  const tick = () => {
    runRevenueLoop({ auto: true }).catch(() => {});
  };
  if (process.env.CORE_REVENUE_AUTORUN !== "0") tick();
  _revenueTimer = setInterval(tick, interval);
  if (typeof _revenueTimer.unref === "function") _revenueTimer.unref();
}

function maybeStartOrganismMicroLoops() {
  if (process.env.CORE_ENABLED !== "true") return;
  const microMs = Number(process.env.CORE_MICRO_MS || 0);
  if (microMs > 0 && !_microStarted) {
    _microStarted = true;
    const tick = () => {
      try {
        runMicroCycle({ auto: true });
      } catch {
        /* non-fatal */
      }
    };
    if (process.env.CORE_MICRO_AUTORUN !== "0") tick();
    _microTimer = setInterval(tick, Math.max(5000, microMs));
    if (typeof _microTimer.unref === "function") _microTimer.unref();
  }

  const organismMs = Number(process.env.CORE_ORGANISM_MS || 0);
  if (organismMs > 0 && !_organismStarted) {
    _organismStarted = true;
    const tickFull = () => {
      try {
        runOrganismTick({ auto: true });
      } catch {
        /* non-fatal */
      }
    };
    if (process.env.CORE_ORGANISM_AUTORUN !== "0") tickFull();
    _organismTimer = setInterval(tickFull, Math.max(30_000, organismMs));
    if (typeof _organismTimer.unref === "function") _organismTimer.unref();
  }
}

function createCoreRouter() {
  const router = express.Router();
  maybeStartRevenueAutoloop();
  maybeStartOrganismMicroLoops();

  function parseInstitutionalToken(req) {
    const explicit = req.headers["x-aethra-institutional-token"];
    if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
    const auth = req.headers.authorization;
    if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
      return auth.slice(7).trim();
    }
    return "";
  }

  function requireInstitutionalGate(req, res) {
    if (process.env.CORE_INSTITUTIONAL_ENABLED !== "true") {
      res.status(403).json({
        ok: false,
        error: "institutional_disabled",
        detail: "Institutional interface is disabled on this host.",
      });
      return false;
    }
    const expected = String(process.env.CORE_INSTITUTIONAL_TOKEN || "").trim();
    if (!expected) {
      res.status(503).json({
        ok: false,
        error: "institutional_not_configured",
        detail: "Missing CORE_INSTITUTIONAL_TOKEN.",
      });
      return false;
    }
    const provided = parseInstitutionalToken(req);
    if (!provided || provided !== expected) {
      res.status(401).json({
        ok: false,
        error: "unauthorized",
        detail: "Institutional access requires manual approval token.",
      });
      return false;
    }
    return true;
  }

  function readRecentJsonl(filePath, limit) {
    try {
      if (!fs.existsSync(filePath)) return [];
      const txt = fs.readFileSync(filePath, "utf8");
      const lines = String(txt || "")
        .split(/\r?\n/)
        .filter((x) => x.trim());
      const sliced = lines.slice(-Math.max(1, Number(limit || 200)));
      return sliced
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  function buildInternalProofStatus() {
    const venturesFile = path.join(__dirname, "..", "memory", "ventures.jsonl");
    const revenueFile = path.join(__dirname, "..", "memory", "revenue.jsonl");
    const actionsFile = path.join(__dirname, "..", "logs", "actions.log");
    const dossiersDir = path.join(__dirname, "..", "logs");

    const ventures = readRecentJsonl(venturesFile, 5000);
    const revenueRows = readRecentJsonl(revenueFile, 5000);
    const actions = readRecentJsonl(actionsFile, 5000);
    const internalDossiers = fs.existsSync(dossiersDir)
      ? fs
          .readdirSync(dossiersDir)
          .filter((f) => f.startsWith("institutional_dossier_") || f.startsWith("dossier_"))
      : [];

    const revenueTotal = revenueRows.reduce((a, r) => a + Number(r.amount || r.revenue || 0), 0);
    const trustoriginEvents = actions.filter(
      (a) => a && (a.type === "trustorigin_dossier" || a.type === "trustorigin_manual_receipt")
    ).length;

    const passes = revenueTotal > 0 && internalDossiers.length > 0;
    return {
      passes,
      checks: {
        revenue_positive: revenueTotal > 0,
        institutional_dossier_present: internalDossiers.length > 0,
        trustorigin_events_present: trustoriginEvents > 0,
      },
      evidence: {
        ventures_recorded: ventures.length,
        revenue_entries: revenueRows.length,
        revenue_total_gbp: Math.round(revenueTotal * 100) / 100,
        trustorigin_events: trustoriginEvents,
        dossier_files: internalDossiers.slice(-20),
      },
      rule: "NO external sale without internal proof.",
    };
  }

  router.post("/core/create-venture", async (req, res) => {
    const b = req.body || {};
    const out = await core.runCoreLoop({
      seed: String(b.idea || b.seed || "local B2B diagnostic"),
      concurrency: Number(b.concurrency || 1),
      context: b.context && typeof b.context === "object" ? b.context : {},
    });
    const ventureId = String((out && out.id) || `venture_${Date.now()}`);
    const receipt = createTrustOriginReceipt({
      venture_id: ventureId,
      business_record: {
        idea: String(b.idea || b.seed || "local B2B diagnostic"),
        business_type: String((b.context && b.context.business_type) || b.business_type || "general"),
        pricing: (b.context && b.context.pricing) || b.pricing || "",
      },
      execution_proof: { core_ok: !!(out && out.ok), output_id: ventureId },
      revenue_snapshot: { revenue: Number((out && out.revenue) || 0) },
      mutation_history: [{ action: "venture_created", ts: Date.now() }],
      previous_hash: String(b.previous_hash || "genesis"),
    });
    ingestUserActivity({
      action_type: "venture_created",
      user_id: String(b.user_id || "anonymous"),
      venture_id: ventureId,
      idea_input: String(b.idea || b.seed || "local B2B diagnostic"),
      business_type: String((b.context && b.context.business_type) || b.business_type || "general"),
      pricing_decision: (b.context && b.context.pricing) || b.pricing || "",
      conversion_rate: Number((b.context && b.context.conversion_rate) || 0),
      revenue_outcome: Number((out && out.revenue) || 0),
      context: {
        ...(b.context && typeof b.context === "object" ? b.context : {}),
        trustorigin_receipt: receipt.receipt_id,
        hash: receipt.verification_hash,
        lineage_chain: receipt.lineage_chain,
        proof_link: receipt.public_verification_endpoint,
      },
    });
    buildIntelligenceGraph();
    extractDominantPatterns();
    convertDataToAdvantage();
    processUserFeedback();
    res.status(out.ok ? 200 : 400).json(out);
  });

  router.get("/core/ventures", (_req, res) => {
    const insights = memory.getInsights();
    res.status(200).json({ ok: true, ventures: insights.ventures.slice(-200) });
  });

  router.get("/core/metrics", (_req, res) => {
    const insights = memory.getInsights();
    res.status(200).json({ ok: true, ...insights.metrics, top_patterns: memory.getTopPerformingPatterns() });
  });

  router.post("/core/kill/:id", (req, res) => {
    const out = loop.markKill(String(req.params.id || ""));
    res.status(out.ok ? 200 : 404).json(out);
  });

  router.post("/core/revenue/run", async (req, res) => {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const out = await runRevenueLoop(b);
    const revenueReceipt = createTrustOriginReceipt({
      venture_id: String(b.venture_id || "n/a"),
      business_record: {
        idea: String(b.idea || ""),
        business_type: String(b.business_type || "general"),
        price: b.price || "",
      },
      execution_proof: { revenue_run_ok: !!(out && out.ok), ts: Date.now() },
      revenue_snapshot: { revenue: Number((out && out.revenue) || 0) },
      mutation_history: [{ action: "revenue_run", ts: Date.now() }],
      previous_hash: String(b.previous_hash || "genesis"),
    });
    ingestUserActivity({
      action_type: "revenue_run",
      user_id: String(b.user_id || "anonymous"),
      venture_id: String(b.venture_id || "n/a"),
      idea_input: String(b.idea || ""),
      business_type: String(b.business_type || "general"),
      pricing_decision: b.price || "",
      conversion_rate: Number(b.conversion_rate || 0),
      revenue_outcome: Number((out && out.revenue) || 0),
      failure: out.ok ? "" : "revenue_run_failed",
      context: {
        ...b,
        trustorigin_receipt: revenueReceipt.receipt_id,
        hash: revenueReceipt.verification_hash,
        lineage_chain: revenueReceipt.lineage_chain,
        proof_link: revenueReceipt.public_verification_endpoint,
      },
    });
    buildIntelligenceGraph();
    extractDominantPatterns();
    res.status(out.ok ? 200 : 400).json(out);
  });

  router.get("/core/revenue/metrics", (_req, res) => {
    res.status(200).json({ ok: true, ...summarizePerformance(), offer: readOffer() });
  });

  router.get("/core/revenue/today", (_req, res) => {
    const dayMs = 86_400_000;
    const now = Date.now();
    const ventures = memory.readJsonl(memory.FILES.ventures, 2000).filter(
      (v) => now - Number(v.ts || 0) < dayMs
    );
    const revenueRows = memory.readJsonl(memory.FILES.revenue, 2000).filter(
      (r) => now - Number(r.ts || 0) < dayMs
    );
    const revenue = revenueRows.reduce((a, r) => a + Number(r.amount || 0), 0);
    res.status(200).json({
      ok: true,
      ventures_launched_today: ventures.length,
      revenue_generated_today_gbp: revenue,
      experiments_running: summarizePerformance().messages_sent,
    });
  });

  router.get("/core/trustorigin/:id", (req, res) => {
    const id = String(req.params.id || "").replace(/[^a-f0-9]/gi, "").slice(0, 24);
    const dir = path.join(__dirname, "..", "logs");
    const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    const match = files.find((f) => f.startsWith(`dossier_${id}`) || f.startsWith(`receipt_${id}`));
    if (!match) {
      res.status(404).type("text/plain").send("dossier not found");
      return;
    }
    const filePath = path.join(dir, match);
    const txt = fs.readFileSync(filePath, "utf8");
    if (match.startsWith("receipt_")) {
      res.status(200).json({ ok: true, receipt: JSON.parse(txt) });
      return;
    }
    res.status(200).type("text/plain").send(txt);
  });

  router.post("/core/sample-dossier", (req, res) => {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const email = String(b.email || "").trim();
    if (email) memory.logLead({ name: email, platform: "site", problem_detected: "sample_request", contact_method: "email_capture" });
    const dossier = require("../trustorigin/engine.js").generateDossier({
      venture: String(b.idea || "Sample venture").slice(0, 200),
      pricing: readOffer().price,
    });
    ingestUserActivity({
      action_type: "trustorigin_sample",
      user_id: email || "anonymous",
      venture_id: `sample_${Date.now()}`,
      idea_input: String(b.idea || "Sample venture"),
      business_type: "sample",
      pricing_decision: readOffer().price,
      context: { trustorigin_receipt: dossier.receipt_id, hash: dossier.hash },
    });
    res.status(200).json({ ok: true, dossier, notice: "Scenario-based sample for demonstration." });
  });

  router.post("/core/network/ingest", (req, res) => {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const row = ingestUserActivity(b);
    res.status(200).json({ ok: true, row });
  });

  router.post("/core/network/rebuild", (_req, res) => {
    const graph = buildIntelligenceGraph();
    const patterns = extractDominantPatterns();
    res.status(200).json({ ok: true, graph, patterns });
  });

  router.post("/core/trustorigin/receipt", (req, res) => {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const ventureId = String(b.venture_id || `venture_${Date.now()}`);
    const receipt = createTrustOriginReceipt({
      venture_id: ventureId,
      business_record: {
        idea: String(b.idea || ""),
        business_type: String(b.business_type || "general"),
        pricing: b.pricing || b.price || "",
      },
      execution_proof: b.execution_proof && typeof b.execution_proof === "object" ? b.execution_proof : { source: "manual_dashboard_trigger" },
      revenue_snapshot: b.revenue_snapshot && typeof b.revenue_snapshot === "object" ? b.revenue_snapshot : { revenue: Number(b.revenue || 0) },
      mutation_history: Array.isArray(b.mutation_history) ? b.mutation_history : [{ action: "manual_trustorigin_receipt", ts: Date.now() }],
      previous_hash: String(b.previous_hash || "genesis"),
    });
    ingestUserActivity({
      action_type: "trustorigin_manual_receipt",
      user_id: String(b.user_id || "operator"),
      venture_id: ventureId,
      idea_input: String(b.idea || ""),
      business_type: String(b.business_type || "general"),
      pricing_decision: b.pricing || b.price || "",
      revenue_outcome: Number(b.revenue || 0),
      context: {
        trustorigin_receipt: receipt.receipt_id,
        hash: receipt.verification_hash,
        lineage_chain: receipt.lineage_chain,
        proof_link: receipt.public_verification_endpoint,
      },
    });
    res.status(200).json({ ok: true, receipt });
  });

  router.get("/core/network/intelligence", (_req, res) => {
    const rows = safeReadJson(NETWORK_DATA_FILE, []);
    const graph = safeReadJson(GRAPH_FILE, { nodes: [], edges: [] });
    const patterns = safeReadJson(PATTERN_FILE, {
      highest_converting_offers: [],
      fastest_revenue_paths: [],
      best_performing_niches: [],
    });
    const aggregatedRevenue = rows.reduce((a, r) => a + Number(r.revenue_outcome || 0), 0);
    const trustoriginReceipts = rows
      .map((r) => (r.context && r.context.trustorigin_receipt ? r.context : null))
      .filter(Boolean)
      .slice(-10)
      .map((x) => ({
        receipt_id: x.trustorigin_receipt,
        hash: x.hash || "",
        proof_link: x.hash ? `/core/trustorigin/${String(x.hash).slice(0, 12)}` : "",
      }));

    const trust = trustLoop(trustoriginReceipts[trustoriginReceipts.length - 1] || null);
    res.status(200).json({
      ok: true,
      totals: {
        ventures_across_users: new Set(rows.map((r) => String(r.venture_id || ""))).size,
        aggregated_revenue: aggregatedRevenue,
        user_actions_logged: rows.length,
      },
      top_performing_strategies: patterns.best_performing_niches.slice(0, 3),
      live_system_learning: {
        graph_nodes: Number(graph.node_count || 0),
        graph_edges: Number(graph.edge_count || 0),
        advantage: convertDataToAdvantage(),
        feedback: processUserFeedback(),
        distributed: shareLearnings(),
        moat: buildDataMoat(),
        dominance: increaseMarketControl(),
      },
      trustorigin: {
        verified_by: "TrustOrigin",
        proof_links: trustoriginReceipts,
        trust_loop: trust,
      },
    });
  });

  router.get("/core/organism/state", (req, res) => {
    const u = String((req.query && req.query.refresh) || "");
    const state = u === "1" ? computeSystemState({}) : readSystemState();
    res.status(200).json({ ok: true, state });
  });

  router.get("/core/organism/environment", (req, res) => {
    const u = String((req.query && req.query.refresh) || "");
    const env = u === "1" ? scanEnvironment({}) : readEnvironmentState();
    res.status(200).json({ ok: true, environment: env });
  });

  router.post("/core/organism/tick", (req, res) => {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const full = b.full !== false;
    const out = full ? runOrganismTick(b) : runMicroCycle(b);
    res.status(200).json({ ok: true, ...out });
  });

  router.post("/core/organism/micro", (_req, res) => {
    res.status(200).json({ ok: true, ...runMicroCycle({}) });
  });

  router.get("/core/institutional/status", (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    const policy = assertPrivateOperatorMode();
    res.status(200).json({
      ok: true,
      institutional_mode: true,
      private_only: PRIVATE_ONLY,
      policy,
      licensing: {
        limited_licences_per_quarter: true,
        manual_approval_required: true,
        public_price_negotiation: false,
      },
    });
  });

  router.get("/core/institutional/licensing/tiers", (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    res.status(200).json({
      ok: true,
      tiers: LICENCE_TIERS.map((t) => createLicenceOffer(t.key)),
    });
  });

  router.post("/core/institutional/licensing/offer", (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const tier = String(b.tier || "tier_1_pilot");
    try {
      res.status(200).json({ ok: true, offer: createLicenceOffer(tier) });
    } catch (e) {
      res.status(400).json({ ok: false, error: "invalid_tier", message: String(e.message || e) });
    }
  });

  router.post("/core/institutional/deal/generate", (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    const proof = buildInternalProofStatus();
    if (!proof.passes) {
      res.status(412).json({
        ok: false,
        error: "internal_proof_required",
        detail: "Pilot/licensing blocked until internal proof is established.",
        proof,
      });
      return;
    }
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const target = String(b.target || "SME");
    const safeTarget = target === "operator" || target === "team" ? target : "SME";
    res.status(200).json({ ok: true, proof, deal: generateDeal(safeTarget) });
  });

  router.get("/core/institutional/compliance", (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    res.status(200).json({
      ok: true,
      policy: COMPLIANCE_POLICY,
      language: getRegulatorSafeLanguage(),
    });
  });

  router.post("/core/institutional/package", (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const dossier = packageOutcome(b.venture || b);
    res.status(200).json({ ok: true, dossier });
  });

  router.post("/core/institutional/client-execute", async (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const request = {
      client_id: String(b.client_id || "client_unknown"),
      client_name: String(b.client_name || ""),
      problem_statement: String(b.problem_statement || "institutional execution request"),
      use_case: String(b.use_case || ""),
      requested_tier: String(b.requested_tier || "tier_1_pilot"),
    };
    const executionInput = b.execution_result && typeof b.execution_result === "object" ? b.execution_result : {};
    try {
      const out = await runClientExecutionMode(request, async () => ({
        venture_id: String(executionInput.venture_id || `venture_${Date.now()}`),
        venture_name: String(executionInput.venture_name || request.client_name || request.client_id),
        revenue_report:
          executionInput.revenue_report && typeof executionInput.revenue_report === "object"
            ? executionInput.revenue_report
            : { revenue_gbp: Number(executionInput.revenue_gbp || 0) },
        growth_trajectory:
          executionInput.growth_trajectory && typeof executionInput.growth_trajectory === "object"
            ? executionInput.growth_trajectory
            : { stage: "pilot" },
        execution_log: Array.isArray(executionInput.execution_log)
          ? executionInput.execution_log
          : [{ action: "internal_execution", ts: Date.now(), actor: "aethra_operator" }],
        mutation_history: Array.isArray(executionInput.mutation_history)
          ? executionInput.mutation_history
          : [{ action: "institutional_delivery", ts: Date.now() }],
        optimisation_log: Array.isArray(executionInput.optimisation_log)
          ? executionInput.optimisation_log
          : [{ action: "baseline_optimisation", ts: Date.now() }],
        previous_hash: String(executionInput.previous_hash || "genesis"),
      }));
      res.status(200).json({ ok: true, ...out });
    } catch (e) {
      res.status(400).json({ ok: false, error: "client_execution_failed", message: String(e.message || e) });
    }
  });

  router.get("/core/institutional/internal-proof", (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    const proof = buildInternalProofStatus();
    res.status(proof.passes ? 200 : 412).json({ ok: proof.passes, proof });
  });

  router.get("/core/institutional/playbook", (req, res) => {
    if (!requireInstitutionalGate(req, res)) return;
    const proof = buildInternalProofStatus();
    const canSellPilot = proof.passes;
    res.status(200).json({
      ok: true,
      mode: "private_first_institutional",
      sequence: [
        "Prioritise owner ventures and execute internally",
        "Generate revenue and document TrustOrigin-backed records",
        "Validate internal proof status",
        "Offer GBP 5000 pilot only if internal proof passes",
        "Convert validated pilots into annual licences",
      ],
      internal_proof: proof,
      pilot_sale_allowed: canSellPilot,
      licensing_allowed: canSellPilot,
      scarcity_policy: {
        limited_licences_per_quarter: true,
        manual_approval_required: true,
        pricing_not_publicly_negotiable: true,
      },
    });
  });

  return router;
}

module.exports = { createCoreRouter };