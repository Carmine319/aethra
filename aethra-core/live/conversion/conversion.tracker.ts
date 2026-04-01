export function trackConversion(events: Array<{ responded: boolean; paid?: boolean }>) {
  const responses = events.filter((event) => event.responded).length;
  const paid = events.filter((event) => event.paid).length;
  return {
    responseRate: Number((responses / Math.max(1, events.length)).toFixed(4)),
    conversionRate: Number((paid / Math.max(1, events.length)).toFixed(4)),
  };
}
