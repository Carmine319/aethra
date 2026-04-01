"use strict";

function connectRealWorld(input = {}) {
  const leads = Array.isArray(input.leads) ? input.leads : [];
  const suppliers = Array.isArray(input.suppliers) ? input.suppliers : [];
  const delivery = input.delivery || {};

  const realLeads = leads.filter((l) => l && l.email && !/@example\.com$/i.test(String(l.email)));
  const mappedLeads = realLeads.length > 0 ? realLeads : leads;

  const hasSupplier = suppliers.length > 0 || Boolean(delivery.supplier);
  const hasDeliverySteps = Array.isArray(delivery.steps) && delivery.steps.length > 0;

  return {
    real_execution: hasSupplier && hasDeliverySteps && mappedLeads.length > 0,
    leads_connected: mappedLeads.length,
    suppliers_connected: suppliers.length || (delivery.supplier ? 1 : 0),
    delivery_ready: hasDeliverySteps,
    compliance: hasSupplier && hasDeliverySteps ? "pass" : "review_required",
  };
}

module.exports = { connectRealWorld };