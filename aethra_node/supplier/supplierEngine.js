"use strict";

/**
 * AETHRA supply access — three layers (curated / connectors / interpretation).
 * Exposes legacy `suppliers` rows for existing panels + full `supply_access` tree.
 */

const { resolveSupplyAccess } = require("../supply/supplyAccess");

async function findSuppliers(productContext, options = {}) {
  return resolveSupplyAccess(productContext, options);
}

module.exports = { findSuppliers };
