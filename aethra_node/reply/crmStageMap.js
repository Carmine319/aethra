"use strict";

const { STATES } = require("./dealStateMachine");

/** CRM pipeline row.stage ↔ deal state machine (single source of truth). */
const CRM_TO_DEAL = {
  lead: STATES.NEW,
  contacted: STATES.CONTACTED,
  replied: STATES.ENGAGED,
  negotiation: STATES.QUALIFIED,
  closed: STATES.CLOSED,
  lost: STATES.LOST,
  archived: STATES.ARCHIVED,
};

const DEAL_TO_CRM = {
  [STATES.NEW]: "lead",
  [STATES.CONTACTED]: "contacted",
  [STATES.ENGAGED]: "replied",
  [STATES.QUALIFIED]: "negotiation",
  [STATES.BOOKED]: "negotiation",
  [STATES.OFFER_SENT]: "negotiation",
  [STATES.CLOSED]: "closed",
  [STATES.LOST]: "lost",
  [STATES.TESTIMONIAL]: "closed",
  [STATES.ARCHIVED]: "archived",
};

function normalizeDealStageFromCrm(stage) {
  const s = String(stage || "lead").toLowerCase();
  if (CRM_TO_DEAL[s]) return CRM_TO_DEAL[s];
  if (Object.values(STATES).includes(s)) return s;
  return STATES.NEW;
}

function dealStateToCrmStage(dealState) {
  const d = String(dealState || STATES.NEW).toLowerCase();
  return DEAL_TO_CRM[d] != null ? DEAL_TO_CRM[d] : "lead";
}

module.exports = {
  CRM_TO_DEAL,
  dealStateToCrmStage,
  normalizeDealStageFromCrm,
};
