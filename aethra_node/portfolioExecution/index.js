"use strict";

const path = require("path");
const { executeCycle } = require(path.join(__dirname, "..", "..", "core", "cycle", "executeCycle.js"));

const { detectOpportunities } = require("./opportunityEngine");
const { selectOpportunity, selectTopOpportunities } = require("./decisionEngine");
const { buildBusiness, renderLandingHtml } = require("./buildEngine");
const { launchBusiness } = require("./launchEngine");
const { measurePerformance } = require("./feedbackEngine");
const { allocateCapital } = require("./capitalEngine");
const { generateReports } = require("./intelligenceMonetisation");
const { enableRevShare, trackRevShareRevenue } = require("./revShareEngine");
const { getSubscriptionTiers, trackUsage, checkAccess } = require("./infraMonetisation");
const { runAethraCycle } = require("./cycle");
const { buildMasterExecutionBriefing, PORTFOLIO_MIX_TARGET } = require("./executionBriefing");
const { createMonetisationLayer } = require("./monetisationLayer");
const {
  storeAndReuseAssets,
  getRecycleHintsForBuild,
  loadRecycleStore,
  getRecycleStatsForApi,
} = require("./assetRecycleStore");
const {
  loadState,
  writeState,
  pushFeed,
  saveBusinesses,
  ARTIFACTS_DIR,
} = require("./stateStore");

module.exports = {
  executeCycle,
  detectOpportunities,
  selectOpportunity,
  selectTopOpportunities,
  buildBusiness,
  launchBusiness,
  measurePerformance,
  allocateCapital,
  generateReports,
  enableRevShare,
  trackRevShareRevenue,
  getSubscriptionTiers,
  trackUsage,
  checkAccess,
  runAethraCycle,
  buildMasterExecutionBriefing,
  PORTFOLIO_MIX_TARGET,
  createMonetisationLayer,
  storeAndReuseAssets,
  getRecycleHintsForBuild,
  loadRecycleStore,
  getRecycleStatsForApi,
  renderLandingHtml,
  loadState,
  writeState,
  pushFeed,
  saveBusinesses,
  ARTIFACTS_DIR,
};
