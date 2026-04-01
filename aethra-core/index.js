"use strict";

const loop = require("./loop/engine.js");
const { writeCoreLog } = require("./utils.js");
const { runAethra } = require("./engine/core.loop.js");

function initCore(options = {}) {
  if (process.env.CORE_ENABLED !== "true") return { ok: false, enabled: false };
  loop.setRunning(true);
  loop.startScheduler(options);
  writeCoreLog({ event: "core_init", options });
  return { ok: true, enabled: true };
}

async function runCoreLoop(options = {}) {
  if (process.env.CORE_ENABLED !== "true") return { ok: false, enabled: false };
  const unified = await runAethra(options);
  const legacy = await loop.runCoreLoop(options);
  return { ...unified, legacy };
}

function shutdownCore() {
  loop.stopScheduler();
  loop.setRunning(false);
  writeCoreLog({ event: "core_shutdown" });
  return { ok: true, running: false };
}

module.exports = { initCore, runCoreLoop, shutdownCore, runAethra };