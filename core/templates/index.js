"use strict";

const registry = require("./registry");
const { selectBestTemplate } = require("./selectBestTemplate");

module.exports = {
  ...registry,
  selectBestTemplate,
};
