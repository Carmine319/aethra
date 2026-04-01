import fs from "fs";
import path from "path";
import { readForesightPolicy } from "../governance/policy.gate";

const outcomesFile = path.join(__dirname, "outcomes.log.jsonl");
const auditFile = path.join(__dirname, "decision.audit.jsonl");

function ensure(f: string) {
  const dir = path.dirname(f);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(f)) fs.writeFileSync(f, "", "utf8");
}

export function appendOutcome(row: Record<string, unknown>) {
  ensure(outcomesFile);
  fs.appendFileSync(outcomesFile, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}

export function appendDecisionAudit(row: Record<string, unknown>) {
  ensure(auditFile);
  fs.appendFileSync(auditFile, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}

export type ForecastRecord = {
  id: string;
  forecast: unknown;
  uncertainty: unknown;
  regime: string;
  replay_seed?: string;
};

const forecastBook: ForecastRecord[] = [];

export function registerForecast(rec: ForecastRecord) {
  forecastBook.push(rec);
  appendOutcome({ event: "forecast_registered", ...rec });
}

export function listForecasts(limit = 50): ForecastRecord[] {
  return forecastBook.slice(-Math.max(1, limit));
}

const decisionLog: any[] = [];

/** In-memory snapshot + append-only audit (replayable). */
export function logDecision(decision: any) {
  const pol = readForesightPolicy();
  if (pol.require_decision_audit === false) {
    throw new Error("Decision audit disabled by policy — blocked");
  }
  const row = {
    ...decision,
    timestamp: Date.now(),
  };
  decisionLog.push(row);
  appendDecisionAudit(row);
  return row;
}

export function getLoggedDecisions(limit = 200) {
  return decisionLog.slice(-Math.max(1, limit));
}
