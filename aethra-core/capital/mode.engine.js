"use strict";

function selectMode(context) {
  const c = context && typeof context === "object" ? context : {};
  const capital = Number(c.capital || 0);
  const confidence = Number(c.confidence || 0);
  const signalStrength = Number(c.signalStrength || 0);
  if (capital < 200) return "capital_preservation";
  if (confidence > 0.7 && signalStrength > 0.7) return "aggressive";
  return "adaptive";
}

function applyUserMode(systemMode, userPreference) {
  if (!userPreference || userPreference === "auto") return systemMode;
  if (userPreference === "safe") return "capital_preservation";
  if (userPreference === "aggressive" && systemMode !== "capital_preservation") return "aggressive";
  return systemMode;
}

module.exports = { selectMode, applyUserMode };
