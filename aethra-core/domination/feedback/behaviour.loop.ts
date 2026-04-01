export function runBehaviourLoop(events: Array<Record<string, unknown>>) {
  const conversions = events.filter((event) => Number(event.converted || 0) > 0).length;
  const behaviourIndex = Number((conversions / Math.max(1, events.length)).toFixed(4));
  return {
    behaviourIndex,
    conversionSignals: conversions,
  };
}
