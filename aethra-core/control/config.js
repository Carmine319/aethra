"use strict";

function getAutonomyConfig() {
  const level = Number(process.env.CORE_AUTONOMY_LEVEL || 2);
  return {
    level,
    mode: level <= 1 ? "assist" : level === 2 ? "semi-auto" : "full-auto",
    canExecute: level >= 2,
    canKill: level >= 3,
  };
}

module.exports = { getAutonomyConfig };