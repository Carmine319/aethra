export function getProxyConfig(region?: string) {
  return {
    server: process.env.PROXY_SERVER || "",
    region: region || "default",
    compliant_use_only: true,
    note: "Geo routing and latency optimisation only; never for evasion or identity masking.",
  };
}
