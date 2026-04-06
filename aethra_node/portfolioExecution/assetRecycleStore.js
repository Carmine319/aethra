"use strict";

const fs = require("fs");
const path = require("path");

const STORE_FILE = path.join(__dirname, "recycled_assets.json");
const MAX_SCALE = 120;
const MAX_KILL = 120;

function defaultStore() {
  return {
    scale_assets: [],
    kill_assets: [],
    updated_at: 0,
  };
}

function loadRecycleStore() {
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const j = JSON.parse(raw);
    const base = defaultStore();
    return {
      ...base,
      ...j,
      scale_assets: Array.isArray(j.scale_assets) ? j.scale_assets : [],
      kill_assets: Array.isArray(j.kill_assets) ? j.kill_assets : [],
    };
  } catch {
    return defaultStore();
  }
}

function persistRecycleStore(store) {
  const s = store && typeof store === "object" ? store : defaultStore();
  s.updated_at = Date.now();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(s, null, 2), "utf8");
  } catch {
    /* read-only env */
  }
}

/**
 * Persist headlines / offers from kill or scale outcomes for reuse.
 * @param {{ business: Record<string, unknown>, performance: Record<string, unknown>, capital: Record<string, unknown> }} payload
 */
function storeAndReuseAssets(payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  const business = p.business && typeof p.business === "object" ? p.business : {};
  const performance = p.performance && typeof p.performance === "object" ? p.performance : {};
  const capital = p.capital && typeof p.capital === "object" ? p.capital : {};
  const action = String(capital.action || "").toLowerCase();
  const st = loadRecycleStore();

  const headline = String(business.product_concept?.headline || business.opportunity_ref || "").slice(0, 200);
  const venture_id = String(business.id || "");
  const anchor =
    Number(business.pricing_model?.anchor_gbp) ||
    Number(business.pricing_model?.tiers?.[0]?.price_gbp) ||
    null;

  let mutated = false;
  if (action === "scale") {
    st.scale_assets.unshift({
      ts: Date.now(),
      venture_id,
      headline,
      offer_summary: String(business.offer_structure?.core || "").slice(0, 240),
      anchor_gbp: anchor,
      signal: performance.signal_strength,
      conversion_rate: performance.conversion_rate,
    });
    while (st.scale_assets.length > MAX_SCALE) st.scale_assets.pop();
    mutated = true;
  } else if (action === "kill") {
    const tokens = headline
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 4)
      .slice(0, 8);
    st.kill_assets.unshift({
      ts: Date.now(),
      venture_id,
      headline,
      avoid_tokens: tokens,
      note: String(capital.note || "").slice(0, 200),
    });
    while (st.kill_assets.length > MAX_KILL) st.kill_assets.pop();
    mutated = true;
  }

  if (mutated) persistRecycleStore(st);
  return { stored: mutated, action, counts: scaleKillCounts(st) };
}

function scaleKillCounts(st) {
  return {
    scale_assets: (st.scale_assets || []).length,
    kill_assets: (st.kill_assets || []).length,
  };
}

/**
 * Hints for buildBusiness — inject proven angles; soft-avoid crowded losers.
 */
function getRecycleHintsForBuild() {
  const st = loadRecycleStore();
  const winner = st.scale_assets[0];
  const suggested_angle = winner?.headline
    ? `Proven angle (scaled): ${String(winner.headline).slice(0, 100)}`
    : null;

  const avoid = new Set();
  for (const k of st.kill_assets.slice(0, 40)) {
    for (const t of k.avoid_tokens || []) avoid.add(t);
  }

  return {
    suggested_subhead: winner
      ? `Similar offers recently hit signal in-market — tighten KPI and cap pilot.`
      : null,
    suggested_angle,
    avoid_tokens: [...avoid].slice(0, 24),
    stats: scaleKillCounts(st),
  };
}

/**
 * Read-only snapshot for dashboards (no secrets).
 * @param {{ limit?: number }} [opts]
 */
function getRecycleStatsForApi(opts) {
  const o = opts && typeof opts === "object" ? opts : {};
  const limit = Math.max(1, Math.min(40, Number(o.limit) || 15));
  const st = loadRecycleStore();
  const scale = Array.isArray(st.scale_assets) ? st.scale_assets : [];
  const kill = Array.isArray(st.kill_assets) ? st.kill_assets : [];
  return {
    updated_at: st.updated_at || 0,
    counts: { scale_assets: scale.length, kill_assets: kill.length },
    recent_scale: scale.slice(0, limit).map((x) => ({
      ts: x.ts,
      venture_id: x.venture_id,
      headline: String(x.headline || "").slice(0, 200),
      signal: x.signal,
      anchor_gbp: x.anchor_gbp,
    })),
    recent_kill: kill.slice(0, limit).map((x) => ({
      ts: x.ts,
      venture_id: x.venture_id,
      headline: String(x.headline || "").slice(0, 200),
      avoid_tokens: Array.isArray(x.avoid_tokens) ? x.avoid_tokens.slice(0, 12) : [],
    })),
  };
}

module.exports = {
  loadRecycleStore,
  persistRecycleStore,
  storeAndReuseAssets,
  getRecycleHintsForBuild,
  getRecycleStatsForApi,
  STORE_FILE,
};
