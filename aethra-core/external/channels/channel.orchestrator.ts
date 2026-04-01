import { assertExternalPolicies } from "../compliance/policy.enforcer";
import { logExternalEvent } from "../compliance/audit.bridge";

function channelLoad(channel: string, salt: number): number {
  let h = 0;
  const s = `${channel}:${salt}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return ((h % 1000) + 1) / 1000;
}

/**
 * Multi-channel presence map — deterministic load for observability / replay.
 */
export function orchestrateChannels(channels: string[], cycleId = 0) {
  assertExternalPolicies({ attributed: true, channelCount: channels?.length ?? 0 });
  const salt =
    Number(cycleId) ||
    (channels || []).reduce((h, c) => ((h * 31 + String(c).charCodeAt(0)) >>> 0) || 1, 7);
  const out = (channels || []).map((c) => ({
    channel: c,
    active: true,
    load: channelLoad(String(c), salt),
  }));
  logExternalEvent({ event: "channels_orchestrated", channels: out.map((x) => x.channel) });
  return out;
}
