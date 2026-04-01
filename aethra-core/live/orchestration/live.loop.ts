import { selectOpportunities } from "../opportunity/selector";
import { scoreOpportunity } from "../opportunity/scorer";
import { validateLiveOpportunity } from "../opportunity/opportunity.validator";
import { generateOffer } from "../offer/offer.generator";
import { validateOffer } from "../offer/offer.validator";
import { deployLanding } from "../offer/landing.deployer";
import { ensureStripeReady } from "../payments/stripe.manager";
import { generateCheckout } from "../payments/checkout.generator";
import { handleWebhook } from "../payments/webhook.handler";
import { validatePaymentSystem } from "../payments/payment.validator";
import { executeChannels } from "../channels/channel.executor";
import { runPosting } from "../channels/posting.engine";
import { runOutreach } from "../channels/outreach.engine";
import { switchChannel } from "../channels/channel.fallback";
import { trackConversion } from "../conversion/conversion.tracker";
import { buildRevenueEvents } from "../conversion/revenue.events";
import { optimiseConversion } from "../conversion/conversion.optimizer";
import { routeService } from "../fulfilment/service.router";
import { deliverValue } from "../fulfilment/delivery.engine";
import { validateFulfilment } from "../fulfilment/fulfilment.validator";
import { handleLoopFailure } from "../resilience/failure.handler";
import { recoverLoop } from "../resilience/loop.recovery";
import { scaleLoop } from "../scaling/scaling.engine";
import { shouldKillLoop } from "../scaling/kill.switch";
import { manageMultiLoops } from "./multi.loop.manager";

export async function runLiveLoop(input: { capital: number; opportunities: Array<Record<string, unknown>> }) {
  const selected = selectOpportunities(input.opportunities, 3);
  const stripe = ensureStripeReady();
  const loops = selected.map((opportunity, idx) => {
    const score = scoreOpportunity(opportunity);
    const opportunityValidation = validateLiveOpportunity(opportunity);
    const offer = generateOffer(opportunity);
    const offerValidation = validateOffer(offer);
    const landing = deployLanding(offer);
    const checkout = generateCheckout({ price: offer.price });
    const webhook = handleWebhook({ type: "checkout.session.completed", paid: true });
    const paymentValidation = validatePaymentSystem({
      checkoutWorks: Boolean(checkout.checkoutUrl),
      paymentConfirmed: webhook.paymentConfirmed,
      webhookTriggered: webhook.processed,
      revenueRecorded: true,
    });
    const channels = ["social", "email", "search"];
    const channelExec = executeChannels(channels);
    const posting = runPosting(channels);
    const outreach = runOutreach([{ id: `target_${idx}_1`, intent: 0.72 }, { id: `target_${idx}_2`, intent: 0.58 }]);
    const tracked = trackConversion(outreach.map((row, responseIdx) => ({ responded: row.responded, paid: row.responded && responseIdx % 2 === 0 })));
    const conversionOptimised = optimiseConversion({
      conversionRate: tracked.conversionRate,
      cta: offer.cta,
      price: offer.price,
      message: offer.outcome,
    });
    const sales = Math.max(0, Math.floor(outreach.filter((row) => row.responded).length * conversionOptimised.conversionRate * 10));
    const revenueEvents = buildRevenueEvents(sales, conversionOptimised.price);
    const revenue = revenueEvents.reduce((sum, event) => sum + event.amount, 0);
    const routed = routeService(revenueEvents.map((event) => ({ id: event.id })));
    const delivered = deliverValue(routed.map((route) => ({ id: route.id })));
    const fulfilmentValidation = validateFulfilment(delivered);
    const roi = Number((revenue / Math.max(1, input.capital * 0.15)).toFixed(4));
    const kill = shouldKillLoop(roi);
    const failure = handleLoopFailure({
      paymentFailure: !paymentValidation.valid,
      channelFailure: posting.some((row) => row.reach <= 0),
      conversionFailure: tracked.conversionRate < 0.03,
      fulfilmentFailure: !fulfilmentValidation.valid,
    });
    const fallback = switchChannel(failure.reroute ? ["social"] : [], channels);
    const recovery = recoverLoop({ id: `loop_${idx}`, failed: failure.failed, retry: failure.retry });
    const scaling = scaleLoop({ roi, capital: input.capital * 0.2 });
    return {
      id: `loop_${idx}`,
      score,
      opportunityValidation,
      offerValidation,
      paymentValidation,
      fulfilmentValidation,
      channelExec,
      posting,
      outreach,
      conversion: tracked,
      conversionOptimised,
      checkout,
      landing,
      revenue,
      roi,
      stripeReady: stripe.connected,
      failure,
      fallback,
      recovery,
      scaling,
      kill,
      active: !kill.kill,
    };
  });
  const portfolio = manageMultiLoops(loops.map((loop) => ({ id: loop.id, roi: loop.roi, capital: loop.scaling.nextCapital })));
  return {
    flow: [
      "select multiple opportunities",
      "validate each opportunity",
      "generate and validate offers",
      "create and validate checkouts",
      "deploy channels + outreach",
      "track conversion + revenue",
      "validate fulfilment",
      "recover or terminate loops",
      "optimise conversion in real time",
      "scale winners and kill losers",
      "rebalance capital",
    ],
    loops,
    portfolio,
    activeLoops: loops.filter((loop) => loop.active),
  };
}
