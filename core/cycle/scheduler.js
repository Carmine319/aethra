"use strict";

const path = require("path");
const ROOT = path.resolve(__dirname, "..", "..");
const { loadState, writeState } = require(path.join(ROOT, "aethra_node", "portfolioExecution", "stateStore"));
const { checkAccess } = require(path.join(ROOT, "aethra_node", "portfolioExecution", "infraMonetisation"));
const { executeCycle } = require("./executeCycle");

const INTERVAL_MS = Math.max(45000, Number(process.env.AETHRA_ORGANISM_INTERVAL_MS) || 120000);

let _timer = null;
let _running = false;

async function tickOrganism() {
  if (_running) return;
  let s;
  try {
    s = loadState();
  } catch {
    return;
  }
  if (!s.autonomous_enabled) return;
  const gate = checkAccess("anonymous", "autonomous_cycle");
  if (!gate.allowed) return;

  try {
    const { getLastDiagnostics } = require(path.join(ROOT, "core", "dist-cjs", "diagnostics", "index.js"));
    const d = getLastDiagnostics();
    if (d && d.health === "CRITICAL" && process.env.AETHRA_IGNORE_CRITICAL_HEALTH !== "1") {
      return;
    }
  } catch {
    /* dist may be absent */
  }

  _running = true;
  try {
    await executeCycle({
      user_id: "anonymous",
      mode: "autonomous",
      autonomous_enabled: true,
      skip_access_check: false,
      baseUrl: process.env.AETHRA_PUBLIC_BASE_URL || "",
    });
  } catch (e) {
    try {
      const { detectFailure } = require("../resilience/index");
      detectFailure(e, { phase: "organism_scheduler" });
    } catch {
      /* ignore */
    }
  } finally {
    _running = false;
    try {
      s = loadState();
      s.last_organism_tick = Date.now();
      writeState(s);
    } catch {
      /* ignore */
    }
  }
}

function startOrganismAutonomousLoop() {
  if (String(process.env.AETHRA_ORGANISM_AUTORUN || "").toLowerCase() === "0") {
    return;
  }
  if (_timer) return;
  _timer = setInterval(tickOrganism, INTERVAL_MS);
  if (typeof _timer.unref === "function") _timer.unref();
}

function stopOrganismAutonomousLoop() {
  if (!_timer) return false;
  clearInterval(_timer);
  _timer = null;
  return true;
}

module.exports = {
  startOrganismAutonomousLoop,
  stopOrganismAutonomousLoop,
  tickOrganism,
  INTERVAL_MS,
};
