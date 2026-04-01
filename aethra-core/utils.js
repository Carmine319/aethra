"use strict";

const fs = require("fs");
const path = require("path");
const LOG_DIR = path.join(__dirname, "logs");

function append(file, row) {
  fs.appendFileSync(path.join(LOG_DIR, file), JSON.stringify({ ts: Date.now(), ...row }) + "\n", "utf8");
}

function writeCoreLog(row) { append("core.log", row); }
function writeActionLog(row) { append("actions.log", row); }

module.exports = { writeCoreLog, writeActionLog };