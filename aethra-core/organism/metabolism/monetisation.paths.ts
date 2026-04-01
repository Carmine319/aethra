export function buildMonetisationPaths(opportunity: Record<string, unknown>) {
  const archetype = String(opportunity.deploymentType || "digital_product");
  const paths = archetype === "service_arbitrage"
    ? ["audit-offer", "upsell-retainer", "performance-bonus"]
    : ["entry-offer", "core-offer", "subscription-backend"];
  return {
    paths,
    primaryPath: paths[0],
    pathCount: paths.length,
  };
}
