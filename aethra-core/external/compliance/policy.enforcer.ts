import fs from "fs";
import path from "path";
import { logExternalEvent } from "./audit.bridge";

function readPolicy() {
  const file = path.join(__dirname, "..", "policies", "external.policy.json");
  if (!fs.existsSync(file))
    return { require_attribution_on_all_actions: true, global_kill_switch: false, max_channel_fanout_per_cycle: 24 };
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function assertExternalPolicies(context: { attributed?: boolean; channelCount?: number }) {
  const p = readPolicy();
  if (p.global_kill_switch) {
    throw new Error("External layer halted by policy kill switch");
  }
  if (p.require_attribution_on_all_actions && context.attributed === false) {
    throw new Error("Attribution is mandatory for external actions");
  }
  const maxFan = Number(p.max_channel_fanout_per_cycle ?? 24);
  if (context.channelCount != null && context.channelCount > maxFan) {
    throw new Error("Uncontrolled channel fanout blocked");
  }
  logExternalEvent({ event: "policy_assert_ok", context });
}
