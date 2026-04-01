"use strict";

function generateIdeas(seed = "local services") {
  const basis = String(seed || "local services").trim() || "local services";
  return [
    {
      idea: `${basis} diagnostic + setup sprint`,
      monetisationMethod: "One-off implementation fee + monthly retainer",
      speedToRevenue: 8,
      requiredEffort: 5,
      sourceSignals: ["trends", "inefficiencies", "service gaps"],
    },
    {
      idea: `${basis} outbound automation service`,
      monetisationMethod: "Subscription offer with onboarding fee",
      speedToRevenue: 7,
      requiredEffort: 6,
      sourceSignals: ["trends", "service gaps"],
    },
    {
      idea: `${basis} conversion optimisation audit`,
      monetisationMethod: "Audit fee + performance bonus",
      speedToRevenue: 9,
      requiredEffort: 4,
      sourceSignals: ["inefficiencies", "complaints"],
    },
  ];
}

module.exports = { generateIdeas };
