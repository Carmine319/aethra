"use strict";

const { executeBrowserTask } = require("../../execution/browser/bridge.js");

async function distribute(content) {
  const platforms = ["x", "linkedin", "youtube"];
  const rows = Array.isArray(content) ? content : [];
  const timestamps = [];
  for (let i = 0; i < rows.length; i += 1) {
    const target = platforms[i % platforms.length];
    await executeBrowserTask({
      idea: String(rows[i].hook || `content-${i + 1}`),
      actions: ["compose-post", "publish-post", "capture-link"],
      context: { platform: target, payload: rows[i] },
    });
    timestamps.push(Date.now());
  }
  return {
    platformsUsed: platforms.slice(0, Math.min(platforms.length, Math.max(1, rows.length))),
    postsPublished: rows.length,
    timestamps,
  };
}

module.exports = { distribute };
