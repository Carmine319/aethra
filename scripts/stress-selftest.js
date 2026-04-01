#!/usr/bin/env node
"use strict";

/**
 * AETHRA stress/self-test harness.
 * Additive validation layer for real-world survivability checks.
 */

const BASE = process.env.AETHRA_BASE_URL || "http://127.0.0.1:3847";
const RUNS = Number(process.env.AETHRA_STRESS_RUNS || 30);
const CONCURRENCY = Number(process.env.AETHRA_STRESS_CONCURRENCY || 4);
const TIMEOUT_MS = Number(process.env.AETHRA_STRESS_TIMEOUT_MS || 12000);
const MAX_FAIL_RATE = Number(process.env.AETHRA_STRESS_MAX_FAIL_RATE || 0.08);
const PLAN = process.env.AETHRA_STRESS_PLAN || "portfolio";
const REFERRALS = Number(process.env.AETHRA_STRESS_REFERRALS || 999);

const IDEA_PROBES = [
  "Emergency plumber lead interception for Manchester rentals",
  "Local glazing repair demand capture for Birmingham offices",
  "Same-day lockout mobile response in Leeds",
  "Dental whitening short-notice booking optimisation in Bristol",
  "B2B HVAC service callout acquisition for London facilities",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowMs() {
  return Date.now();
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

async function withTimeout(url, opts, timeoutMs) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

async function probeHealth() {
  const start = nowMs();
  const res = await withTimeout(`${BASE}/health`, {}, TIMEOUT_MS);
  const text = await res.text();
  return { ok: res.ok, ms: nowMs() - start, status: res.status, body: text };
}

async function probeSchema() {
  const start = nowMs();
  const res = await withTimeout(`${BASE}/api/v1/schema`, {}, TIMEOUT_MS);
  const json = await res.json();
  const pathCount = Object.keys(json.paths || {}).length;
  return { ok: res.ok && pathCount >= 4, ms: nowMs() - start, status: res.status, pathCount };
}

async function probeRun(i) {
  const idea = IDEA_PROBES[i % IDEA_PROBES.length];
  const payload = {
    mode: "idea",
    text: `Stress self-test ${i + 1}: ${idea}`,
    noCache: true,
    plan: PLAN,
    referrals: REFERRALS,
  };
  const start = nowMs();
  const res = await withTimeout(
    `${BASE}/api/v1/run`,
    {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    },
    TIMEOUT_MS
  );
  const json = await res.json().catch(() => ({}));
  const throttled = res.status === 429;
  const ok = res.ok && json && typeof json === "object" && !throttled;
  return { ok, throttled, ms: nowMs() - start, status: res.status, keys: Object.keys(json || {}) };
}

async function runSequential(n, fn) {
  const out = [];
  for (let i = 0; i < n; i++) {
    try {
      out.push(await fn(i));
    } catch (e) {
      out.push({ ok: false, ms: TIMEOUT_MS, status: 0, error: e && e.message ? e.message : String(e) });
    }
    await sleep(35);
  }
  return out;
}

async function runParallel(total, concurrency, fn) {
  const out = [];
  let cursor = 0;
  async function worker() {
    for (;;) {
      const idx = cursor++;
      if (idx >= total) return;
      try {
        out[idx] = await fn(idx);
      } catch (e) {
        out[idx] = { ok: false, ms: TIMEOUT_MS, status: 0, error: e && e.message ? e.message : String(e) };
      }
      await sleep(20 + Math.floor(Math.random() * 40));
    }
  }
  const pool = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(pool);
  return out;
}

function summarize(name, rows) {
  const ok = rows.filter((r) => r && r.ok).length;
  const fail = rows.length - ok;
  const failRate = rows.length ? fail / rows.length : 0;
  const throttled = rows.filter((r) => r && r.throttled).length;
  const ms = rows.map((r) => Number(r.ms || 0));
  const p50 = percentile(ms, 0.5);
  const p95 = percentile(ms, 0.95);
  const max = ms.length ? Math.max(...ms) : 0;
  const statusMap = {};
  rows.forEach((r) => {
    const k = String((r && r.status) || 0);
    statusMap[k] = (statusMap[k] || 0) + 1;
  });
  return { name, total: rows.length, ok, fail, failRate, throttled, p50, p95, max, statusMap };
}

function printSummary(s) {
  console.log(
    `[self-test] ${s.name}: total=${s.total} ok=${s.ok} fail=${s.fail} failRate=${(s.failRate * 100).toFixed(
      1
    )}% throttled=${s.throttled} p50=${s.p50}ms p95=${s.p95}ms max=${s.max}ms statuses=${JSON.stringify(s.statusMap)}`
  );
}

async function main() {
  console.log(
    `[self-test] base=${BASE} runs=${RUNS} concurrency=${CONCURRENCY} timeoutMs=${TIMEOUT_MS} plan=${PLAN} referrals=${REFERRALS}`
  );

  const health = await runSequential(Math.min(10, RUNS), probeHealth);
  const schema = await runSequential(Math.min(8, RUNS), probeSchema);
  const runSeq = await runSequential(RUNS, probeRun);
  const runPar = await runParallel(RUNS, CONCURRENCY, probeRun);

  const sHealth = summarize("health", health);
  const sSchema = summarize("schema", schema);
  const sRunSeq = summarize("run-sequential", runSeq);
  const sRunPar = summarize("run-parallel", runPar);

  [sHealth, sSchema, sRunSeq, sRunPar].forEach(printSummary);

  const failures = [];
  if (sHealth.fail > 0) failures.push("health endpoint instability detected");
  if (sSchema.fail > 0) failures.push("schema endpoint instability detected");
  if (sRunSeq.failRate > MAX_FAIL_RATE) failures.push("run sequential failure rate exceeded threshold");
  if (sRunPar.failRate > MAX_FAIL_RATE) failures.push("run parallel failure rate exceeded threshold");
  if (sRunPar.p95 > TIMEOUT_MS * 0.9) failures.push("parallel p95 latency near timeout budget");
  if (sRunSeq.throttled > 0 || sRunPar.throttled > 0) {
    console.warn("[self-test] WARN: observed throttling (429). Gate is active; survivability logic should handle degradation.");
  }

  if (failures.length) {
    console.error("[self-test] FAIL:", failures.join("; "));
    process.exit(1);
  }

  console.log("[self-test] OK: core acquisition surfaces stable under stress window.");
}

main().catch((e) => {
  console.error("[self-test] FATAL:", e && e.message ? e.message : String(e));
  process.exit(1);
});

