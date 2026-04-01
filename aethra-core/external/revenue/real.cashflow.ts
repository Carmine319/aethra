import fs from "fs";
import path from "path";

const file = path.join(__dirname, "real.cashflow.jsonl");

function ensure() {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, "", "utf8");
}

export function appendCashflow(row: Record<string, unknown>) {
  ensure();
  fs.appendFileSync(file, JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}
