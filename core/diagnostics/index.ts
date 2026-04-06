import * as fs from "fs";
import * as path from "path";
import { getRepoRoot } from "../repoPaths";
import type { HealthLevel } from "../types";

export interface DiagnosticsReport {
  health: HealthLevel;
  checks: Array<{ name: string; status: HealthLevel; detail: string }>;
  executionLatencyMsHint?: number;
  memoryIntegrity: boolean;
  revenueMismatch?: string;
  stuckDeployments: string[];
  dataSources: Record<string, boolean>;
  at: number;
}

let _last: DiagnosticsReport | null = null;

export function getLastDiagnostics(): DiagnosticsReport | null {
  return _last;
}

function fileOk(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function runDiagnostics(): Promise<DiagnosticsReport> {
  const root = getRepoRoot();
  const checks: DiagnosticsReport["checks"] = [];
  const dataSources: Record<string, boolean> = {
    portfolio_state: fileOk(path.join(root, "aethra_node", "portfolioExecution", "portfolio_execution_state.json")),
    organism_memory: fileOk(path.join(root, "core", "memory", "organism_memory.json")),
    learning_performance: fileOk(path.join(root, "aethra_node", "memory", "learning_performance.json")),
    serpapi: !!process.env.SERPAPI_KEY,
    marketplace_signals_file: !!process.env.AETHRA_MARKETPLACE_SIGNALS_JSON,
    trends_proxy: !!process.env.AETHRA_TRENDS_PROXY_URL,
  };

  let memoryIntegrity = true;
  try {
    const memPath = path.join(root, "core", "memory", "organism_memory.json");
    if (fileOk(memPath)) {
      const j = JSON.parse(fs.readFileSync(memPath, "utf8"));
      if (!Array.isArray(j.historicalLog)) {
        memoryIntegrity = false;
        checks.push({ name: "memory_shape", status: "CRITICAL", detail: "historicalLog not an array" });
      }
    }
  } catch (e) {
    memoryIntegrity = false;
    checks.push({
      name: "memory_read",
      status: "WARNING",
      detail: String((e as Error).message || e).slice(0, 200),
    });
  }

  const stuckDeployments: string[] = [];
  let revenueMismatch: string | undefined;
  try {
    const statePath = path.join(root, "aethra_node", "portfolioExecution", "portfolio_execution_state.json");
    if (fileOk(statePath)) {
      const s = JSON.parse(fs.readFileSync(statePath, "utf8"));
      const businesses = Array.isArray(s.businesses) ? s.businesses : [];
      const now = Date.now();
      for (const b of businesses) {
        if (b.status === "draft" && b.created_ts && now - Number(b.created_ts) > 48 * 3600000) {
          stuckDeployments.push(String(b.id || "unknown"));
        }
      }
      if (stuckDeployments.length) {
        checks.push({
          name: "stuck_deployments",
          status: "WARNING",
          detail: `${stuckDeployments.length} draft(s) idle >48h`,
        });
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const learnPath = path.join(root, "aethra_node", "memory", "learning_performance.json");
    const memPath = path.join(root, "core", "memory", "organism_memory.json");
    if (fileOk(learnPath) && fileOk(memPath)) {
      const learn = JSON.parse(fs.readFileSync(learnPath, "utf8"));
      const mem = JSON.parse(fs.readFileSync(memPath, "utf8"));
      const paySum = (Array.isArray(learn.payments) ? learn.payments : []).reduce(
        (a: number, p: { amount_gbp?: number }) => a + (Number(p.amount_gbp) || 0),
        0
      );
      const verified = Number(mem.verifiedRevenueGbp);
      if (Number.isFinite(verified) && paySum > 0 && Math.abs(paySum - verified) > paySum * 0.5 + 50) {
        revenueMismatch = "learning payments sum diverges from verified organism book (audit)";
        checks.push({ name: "revenue_book", status: "WARNING", detail: revenueMismatch });
      }
    }
  } catch {
    /* ignore */
  }

  if (!dataSources.portfolio_state) {
    checks.push({
      name: "portfolio_state",
      status: "CRITICAL",
      detail: "portfolio_execution_state.json missing or unreadable",
    });
  }

  const hasExternalSignal =
    dataSources.serpapi || dataSources.marketplace_signals_file || dataSources.trends_proxy;
  if (!hasExternalSignal) {
    checks.push({
      name: "external_market_data",
      status: "WARNING",
      detail: "No external signal providers configured — operating on internal + operational memory only",
    });
  }

  let health: HealthLevel = "OK";
  for (const c of checks) {
    if (c.status === "CRITICAL") health = "CRITICAL";
    else if (c.status === "WARNING" && health !== "CRITICAL") health = "WARNING";
  }
  if (!memoryIntegrity && health === "OK") health = "WARNING";

  const report: DiagnosticsReport = {
    health,
    checks,
    memoryIntegrity,
    revenueMismatch,
    stuckDeployments,
    dataSources,
    at: Date.now(),
  };
  _last = report;
  return report;
}

export async function getSystemState(): Promise<import("../types").SystemState> {
  const diagnostics = await runDiagnostics();
  const root = getRepoRoot();
  let portfolio: Record<string, unknown> = {};
  try {
    const p = path.join(root, "aethra_node", "portfolioExecution", "portfolio_execution_state.json");
    if (fileOk(p)) portfolio = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    portfolio = {};
  }

  const portfolioReadable = !!diagnostics.dataSources.portfolio_state;
  const operational =
    portfolioReadable &&
    (diagnostics.health !== "CRITICAL" || process.env.AETHRA_FORCE_OPERATIONAL === "1");
  return {
    operational,
    health: diagnostics.health,
    portfolio,
    diagnostics: reportToPlain(diagnostics),
  };
}

function reportToPlain(d: DiagnosticsReport): Record<string, unknown> {
  return { ...d };
}
