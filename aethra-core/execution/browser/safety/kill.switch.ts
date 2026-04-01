import fs from "fs";
import path from "path";

const policyFile = path.join(__dirname, "..", "config", "policies.json");

export function assertKillSwitchAllowsExecution() {
  if (!fs.existsSync(policyFile)) return;
  const parsed = JSON.parse(fs.readFileSync(policyFile, "utf8"));
  if (parsed && parsed.kill_switch === false) {
    throw new Error("Browser agent kill-switch is active");
  }
}
