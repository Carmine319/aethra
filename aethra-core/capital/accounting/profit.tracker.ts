import fs from "fs";
import path from "path";

type ProfitRow = {
  source: string;
  amount: number;
  timestamp: number;
  meta?: Record<string, unknown>;
};

const profits: ProfitRow[] = [];
const cashflowFile = path.join(__dirname, "cashflow.log.jsonl");

function ensureCashflowFile() {
  const dir = path.dirname(cashflowFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(cashflowFile)) fs.writeFileSync(cashflowFile, "", "utf8");
}

export function appendCashflowLog(row: Record<string, unknown>) {
  ensureCashflowFile();
  fs.appendFileSync(cashflowFile, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}

export function recordProfit(source: string, amount: number, meta?: Record<string, unknown>) {
  const row: ProfitRow = {
    source: String(source || "unknown"),
    amount: Number(amount || 0),
    timestamp: Date.now(),
    meta,
  };
  profits.push(row);
  appendCashflowLog({ event: "profit_recorded", ...row });
}

export function getTotalProfit() {
  return profits.reduce((sum, p) => sum + Number(p.amount || 0), 0);
}

export function getProfitHistory(limit = 200): ProfitRow[] {
  return profits.slice(-Math.max(1, Number(limit || 200)));
}
