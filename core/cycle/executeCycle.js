"use strict";

const path = require("path");

let executeCycleImpl;
try {
  executeCycleImpl = require(path.join(__dirname, "..", "dist-cjs", "execution", "loop.js")).executeCycle;
} catch {
  executeCycleImpl = null;
}

if (typeof executeCycleImpl !== "function") {
  executeCycleImpl = require("./legacyExecuteCycle.js").executeCycle;
}

module.exports = { executeCycle: executeCycleImpl };
