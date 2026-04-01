import { detectDropOff } from "../analytics/dropoff.detector";
import { optimiseLanding } from "../landing/landing.optimizer";
import { generatePricing } from "../pricing/pricing.engine";
import { adjustPricing } from "../pricing/elasticity.model";
import { applyPsychology } from "../psychology/persuasion.engine";
import { generateVariants } from "../experimentation/variant.generator";
import { runABTest } from "../experimentation/ab.engine";
import { selectWinner } from "../experimentation/winner.selector";
import { trackConversionMetrics } from "../analytics/conversion.tracker";
import { mapBehaviourJourney } from "../analytics/behaviour.map";
import { inferIntent } from "../analytics/intent.inference";
import { scheduleTests } from "../experimentation/test.scheduler";
import { scheduleOptimisationLoop } from "./optimisation.scheduler";

export async function runConversionLoop(landing: Record<string, unknown>, data: Array<Record<string, unknown>>) {
  const events = Array.isArray(data) ? data : [];
  const dropoff = detectDropOff(events);
  const optimisedLanding = optimiseLanding(landing, events);
  const tracked = trackConversionMetrics(events);
  const pricing = generatePricing(Number((landing.price as number) || 499));
  const elasticity = adjustPricing(tracked.conversionRate, inferIntent(events).buyingIntent);
  const psychologicalLayer = applyPsychology({
    landing: optimisedLanding,
    dropoff,
    intent: inferIntent(events),
    journey: mapBehaviourJourney(events),
  });
  const variants = generateVariants({
    headline: optimisedLanding.headline,
    corePrice: pricing.core,
    cta: optimisedLanding.CTA,
  });
  const experiments = runABTest(variants);
  const winningVariant = selectWinner(experiments);

  return {
    optimisedLanding,
    pricing: { ...pricing, elasticity },
    psychologicalLayer,
    winningVariant,
    analytics: {
      dropoff,
      tracked,
    },
    scheduler: {
      tests: scheduleTests(),
      optimisation: scheduleOptimisationLoop(),
    },
  };
}
