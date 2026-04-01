import fs from "fs";
import path from "path";
import { getTotalProfit } from "../accounting/profit.tracker";

function readCapitalPolicy() {
  const file = path.join(__dirname, "..", "policies", "capital.policy.json");
  if (!fs.existsSync(file)) {
    return {
      reinvestment_ratio: 0.7,
      reserve_ratio: 0.2,
      withdraw_ratio: 0.1,
      max_exposure_per_venture: 0.4,
      min_viable_roi: 1.2,
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function calculateReinvestment() {
  const profit = getTotalProfit();
  const policy = readCapitalPolicy();
  return {
    profit,
    reinvest: profit * Number(policy.reinvestment_ratio || 0.7),
    reserve: profit * Number(policy.reserve_ratio || 0.2),
    withdraw: profit * Number(policy.withdraw_ratio || 0.1),
    policy,
  };
}
