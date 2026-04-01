"use strict";

function scoreOpportunity(item) {
  const speedToRevenue = Math.max(0, 10 - Number(item.timeToRevenue || 0));
  return Number(
    (
      Number(item.expectedROI || 0) * 0.4 +
      speedToRevenue * 0.3 +
      Number(item.confidenceScore || 0) * 0.2 -
      Number(item.difficulty || 0) * 0.1
    ).toFixed(4)
  );
}

function matchSignal(problem, keyword) {
  return String(problem || "").toLowerCase().includes(String(keyword || "").toLowerCase());
}

function signalFor(opportunityName, signals) {
  const rows = Array.isArray(signals) ? signals : [];
  let totalFreq = 0;
  let totalVelocity = 0;
  let hits = 0;
  const name = String(opportunityName || "").toLowerCase();
  for (const s of rows) {
    const p = String((s && s.problem) || "").toLowerCase();
    if (
      (name.includes("service") && (matchSignal(p, "compliance") || matchSignal(p, "local service"))) ||
      (name.includes("digital") && (matchSignal(p, "ai") || matchSignal(p, "automation"))) ||
      (name.includes("marketplace") && (matchSignal(p, "listing") || matchSignal(p, "marketplace")))
    ) {
      totalFreq += Number((s && s.frequency) || 0);
      totalVelocity += Number((s && s.velocity) || 0);
      hits += 1;
    }
  }
  if (!hits) return { signalStrength: 4.5, demandVelocity: 4.5 };
  return {
    signalStrength: Number(Math.min(10, totalFreq / hits).toFixed(3)),
    demandVelocity: Number(Math.min(10, totalVelocity / hits).toFixed(3)),
  };
}

function generateOpportunityMatrix(capital, signals) {
  const c = Math.max(0, Number(capital || 0));
  const base = [
    {
      name: "Local Service Arbitrage",
      category: "safe",
      deploymentType: "service_arbitrage",
      description: "Compliance-focused local service resale with contractor fulfilment.",
      expectedROI: 8.8,
      timeToRevenue: 2,
      difficulty: 3,
      capitalRequired: Math.min(c, 140),
      confidenceScore: 8.6,
      executionPath: ["scrape_local_leads", "send_outreach", "book_job", "assign_contractor"],
    },
    {
      name: "Signal-Based Digital Product",
      category: "scalable",
      deploymentType: "digital_product",
      description: "Build and distribute digital assets from repeated public pain signals.",
      expectedROI: 9.4,
      timeToRevenue: 3,
      difficulty: 4,
      capitalRequired: Math.min(c, 60),
      confidenceScore: 8.2,
      executionPath: ["ingest_signals", "generate_product", "create_checkout", "distribute_social"],
    },
    {
      name: "Marketplace Arbitrage Flip",
      category: "experimental",
      deploymentType: "marketplace_flip",
      description: "Acquire weak listings, optimise positioning, and relist for margin.",
      expectedROI: 8.1,
      timeToRevenue: 2,
      difficulty: 5,
      capitalRequired: Math.min(c, 90),
      confidenceScore: 7.2,
      executionPath: ["scan_etsy_ebay", "identify_weak_listings", "rewrite_positioning", "relist"],
    },
  ];

  return base
    .map((item) => {
      const signal = signalFor(item.name, signals);
      const score = scoreOpportunity(item);
      const dynamicPriority = Number((score + signal.signalStrength * 0.08 + signal.demandVelocity * 0.07).toFixed(4));
      return { ...item, ...signal, score, dynamicPriority };
    })
    .sort((a, b) => b.dynamicPriority - a.dynamicPriority);
}

module.exports = { generateOpportunityMatrix };
