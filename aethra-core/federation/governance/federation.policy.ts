import fs from "fs";
import path from "path";

export function readFederationPolicy() {
  const file = path.join(__dirname, "..", "policies", "federation.policy.json");
  if (!fs.existsSync(file)) {
    return {
      federation_kill_switch: false,
      max_partner_dependency_share: 0.35,
      correlation_block_threshold: 0.8,
      contract_price_adjustment_bounds: { up: 1.15, down: 0.85 },
      require_contract_for_exchange: true,
      compression_window: 5,
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function assertFederationOperational() {
  const p = readFederationPolicy();
  if (p.federation_kill_switch) {
    throw new Error("Federation halted by policy");
  }
}
