#!/usr/bin/env node
/**
 * CI / local smoke: Python stdio + Node enrichment must return venture + operator_activity.
 * Exit 0 on success, 1 on failure.
 */

"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function findPythonRunner() {
  const trials = [
    { cmd: "python", prefix: [] },
    { cmd: "py", prefix: ["-3"] },
    { cmd: "python3", prefix: [] },
  ];
  for (const { cmd, prefix } of trials) {
    const r = spawnSync(cmd, [...prefix, "-m", "aethra", "schema"], {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 60000,
    });
    if (r.status !== 0) continue;
    let out = (r.stdout || "").trim();
    if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
    if (!out) continue;
    try {
      JSON.parse(out);
      return { cmd, prefix };
    } catch {
      continue;
    }
  }
  return null;
}

function runStdio(payload, py) {
  const r = spawnSync(py.cmd, [...py.prefix, "-m", "aethra", "stdio"], {
    cwd: ROOT,
    input: JSON.stringify(payload),
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 120000,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const msg = (r.stderr || r.stdout || "aethra stdio failed").trim();
    const e = new Error(msg);
    e.code = "AETHRA_EXIT";
    throw e;
  }
  let out = (r.stdout || "").trim();
  if (out.charCodeAt(0) === 0xfeff) out = out.slice(1);
  return JSON.parse(out);
}

function fail(msg) {
  console.error("[smoke] FAIL:", msg);
  process.exit(1);
}

async function main() {
  const py = findPythonRunner();
  if (!py) fail("Python + aethra not found (pip install -e . from project root).");

  let raw;
  try {
    raw = runStdio(
      {
        cmd: "idea",
        text: "Smoke test: ice machine cleaning for UK hospitality — supply and outreach",
        context: {},
      },
      py
    );
  } catch (e) {
    fail(e.message || String(e));
  }

  if (!raw || typeof raw !== "object") fail("stdio returned non-object.");

  const { enrichWithOperator } = require(path.join(ROOT, "aethra_node", "core", "enrichRun.js"));

  let enriched;
  try {
    enriched = await enrichWithOperator(raw, "smoke", { plan: "portfolio" });
  } catch (e) {
    fail(`enrichWithOperator threw: ${e.message || e}`);
  }

  if (!enriched || typeof enriched !== "object") fail("enrichment returned non-object.");

  const aut = enriched.autonomous;
  if (!aut || typeof aut !== "object") fail("missing enriched.autonomous");

  const act = aut.operator_activity;
  if (!act || typeof act !== "object") fail("missing autonomous.operator_activity");

  if (typeof act.leads_generated !== "number") fail("operator_activity.leads_generated not a number.");

  const v = enriched.venture;
  if (!v || typeof v !== "object") fail("missing enriched.venture");
  if (!v.wallet || typeof v.wallet.balance !== "number") fail("missing venture.wallet.balance");

  const port = enriched.portfolio;
  if (!port || typeof port !== "object") fail("missing enriched.portfolio");
  if (typeof port.total_wallet !== "number") fail("portfolio.total_wallet not a number");
  if (typeof port.total_revenue !== "number") fail("portfolio.total_revenue not a number");
  if (typeof port.net_profit !== "number") fail("portfolio.net_profit not a number");
  if (typeof port.success_rate !== "string") fail("portfolio.success_rate not a string");

  const agg = enriched.wallets_aggregate;
  if (!agg || typeof agg !== "object") fail("missing wallets_aggregate");
  if (typeof agg.total_combined !== "number") fail("wallets_aggregate.total_combined not a number");
  if (!Array.isArray(agg.wallets)) fail("wallets_aggregate.wallets not an array");

  if (!enriched.synergy || typeof enriched.synergy !== "object") fail("missing enriched.synergy");

  const ep = aut.execution_pack;
  if (!ep || typeof ep !== "object") fail("missing autonomous.execution_pack (supply execution bundle).");
  if (!Array.isArray(ep.outreach.supplier_emails) || ep.outreach.supplier_emails.length < 3)
    fail("execution_pack.outreach should include at least 3 supplier email drafts.");
  if (
    !Array.isArray(ep.outreach.client_outreach_messages) ||
    ep.outreach.client_outreach_messages.length < 3
  )
    fail("execution_pack should include at least 3 client outreach messages.");

  const sai = aut.supplier_intel && aut.supplier_intel.supply_access;
  if (!sai || typeof sai !== "object") fail("missing supplier_intel.supply_access (three-layer supply).");
  const l1 = sai.layer1_curated;
  if (!l1 || !l1.matched) fail("ice-machine smoke text should match curated supply library (layer1.matched).");
  if (!sai.layer3_interpretation || !sai.layer3_interpretation.execution_stack)
    fail("missing layer3_interpretation.execution_stack.");

  console.log("[smoke] OK — Python stdio + Node enrichment pipeline healthy.");
  console.log(
    `[smoke] leads=${act.leads_generated} wallet=£${v.wallet.balance} net_profit=£${port.net_profit} combined=£${agg.total_combined}`
  );
}

main().catch((e) => fail(e.message || String(e)));
