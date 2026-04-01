import fs from "fs";
import path from "path";
import { createTrustOriginReceipt } from "../../trustorigin/integration";
import { getVentures } from "../portfolio/portfolio.registry";
import { distributeCapital } from "../portfolio/capital.distribution";
import { calculateReinvestment } from "./reinvestment.engine";
import { appendCashflowLog } from "../accounting/profit.tracker";
import { applyTreasuryMove } from "./treasury.manager";

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

export function allocateCapital() {
  const ventures = getVentures();
  const { reinvest, reserve, withdraw } = calculateReinvestment();
  const policy = readCapitalPolicy();

  const allocations = distributeCapital(ventures, reinvest, {
    minViableRoi: Number(policy.min_viable_roi || 1.2),
    maxExposurePerVenture: Number(policy.max_exposure_per_venture || 0.4),
  });

  applyTreasuryMove(
    { allocated: reinvest, reserved: reserve, withdrawn: withdraw },
    "policy_split_reinvest_reserve_withdraw"
  );

  const receipt = createTrustOriginReceipt({
    venture_id: "capital_allocation_cycle",
    business_record: {
      ventures_count: ventures.length,
      total_reinvest: reinvest,
      reserve,
      withdraw,
      policy,
    },
    execution_proof: {
      allocations,
    },
    revenue_snapshot: {
      reinvest,
      reserve,
      withdraw,
    },
    mutation_history: [{ action: "allocate_capital", ts: Date.now() }],
    previous_hash: "genesis",
  });

  appendCashflowLog({
    event: "capital_allocation",
    reinvest,
    reserve,
    withdraw,
    allocations,
    trustorigin_receipt_id: receipt.receipt_id,
    trustorigin_verification_hash: receipt.verification_hash,
  });

  return {
    allocations,
    reinvest,
    reserve,
    withdraw,
    trustorigin: receipt,
  };
}
