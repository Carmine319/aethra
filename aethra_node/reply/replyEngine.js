"use strict";

const { classifyReply } = require("./classifyReply");
const { generateReply } = require("./generateReply");
const { createBookingLink, shouldOfferBooking } = require("./bookingEngine");
const { generateOffer, closingMessage } = require("./closingEngine");
const { STATES, nextState } = require("./dealStateMachine");
const { normalizeDealStageFromCrm, dealStateToCrmStage } = require("./crmStageMap");
const { scoreConversation } = require("../conversion/conversationScoring");
const { handleObjection } = require("../conversion/objectionMatrix");

function normalizeDealStage(stage) {
  return normalizeDealStageFromCrm(stage);
}

/**
 * Map classifier output → state-machine signal (transition key).
 */
function classificationToSignal(state, classification) {
  const c = String(classification || "unclear");
  const st = String(state || STATES.NEW);

  if (c === "negative") return "negative";
  if (c === "delay" || c === "unclear") return "unclear";

  if (c === "ready_to_book") {
    if (st === STATES.QUALIFIED) return "book";
    if (st === STATES.NEW || st === STATES.CONTACTED) return "reply";
    return "positive";
  }

  if (c === "price_interest") {
    if (st === STATES.QUALIFIED) return "price_pushback";
    if (st === STATES.NEW || st === STATES.CONTACTED) return "reply";
    return "positive";
  }

  if (c === "positive") {
    if (st === STATES.NEW || st === STATES.CONTACTED) return "reply";
    return "positive";
  }

  return "reply";
}

/**
 * Structured revenue conversion pass: classify → compose → state transition.
 */
async function processReply(message, deal = {}, context = {}) {
  const msgStr = String(message || "");
  const classification = await classifyReply(msgStr);

  const priorThread = Array.isArray(deal.thread) ? deal.thread.map((t) => String(t || "")) : [];
  const thread = [...priorThread, msgStr].filter((t) => t.trim());
  const conversation = scoreConversation(thread.length ? thread : [msgStr]);

  const current = normalizeDealStage(deal.stage);
  const signal = classificationToSignal(current, classification);

  let reply = generateReply(classification, context);

  if (shouldOfferBooking(classification)) {
    const link = createBookingLink(context);
    reply += `\n\nBook here: ${link}`;
  }

  if (classification === "price_interest" && current === STATES.QUALIFIED) {
    const offer = generateOffer(context);
    reply = closingMessage(offer);
    if (shouldOfferBooking(classification)) {
      reply += `\n\nBook here: ${createBookingLink(context)}`;
    }
  }

  const objectionHit = handleObjection(msgStr);
  if (objectionHit) {
    reply = objectionHit.response;
  }

  const newState = nextState(current, signal);
  const crm_stage = dealStateToCrmStage(newState);

  return {
    classification,
    signal,
    reply,
    prior_state: current,
    new_state: newState,
    crm_stage,
    conversation,
    conversation_quality_label: `${String(conversation.quality).toUpperCase()} (${conversation.score})`,
    conversion_likelihood: conversation.conversion_likelihood,
    next_action: conversation.next_action,
    next_action_label: conversation.next_action_label,
    objection_handled: Boolean(objectionHit),
    objection_type: objectionHit ? objectionHit.key : null,
    states: STATES,
  };
}

function processReplyCycle(messages, context = {}) {
  const rows = Array.isArray(messages) ? messages : [];
  let replied = 0;
  let booked = 0;
  let closed = 0;
  const stageFlow = [];

  for (let i = 0; i < rows.length; i++) {
    const m = String(rows[i].message || rows[i].text || "").toLowerCase();
    let stage = "new";
    if (/\b(interested|call|meeting|book|price|how much|details)\b/.test(m)) {
      stage = "replied";
      replied++;
    }
    if (stage === "replied" && /\b(call|meeting|book)\b/.test(m)) {
      stage = "booked";
      booked++;
    }
    if (stage === "booked" && i % 4 === 0) {
      stage = "closed";
      closed++;
    }
    stageFlow.push({
      id: rows[i].id || `msg_${i + 1}`,
      stage,
      niche: context.niche || null,
    });
  }

  return {
    replied_count: replied,
    booked_count: booked,
    closed_count: closed,
    stages: stageFlow,
  };
}

module.exports = {
  processReply,
  processReplyCycle,
  normalizeDealStage,
  classificationToSignal,
  dealStateToCrmStage,
  STATES,
};
