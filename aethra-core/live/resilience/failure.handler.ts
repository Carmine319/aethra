export function handleLoopFailure(input: { paymentFailure: boolean; channelFailure: boolean; conversionFailure: boolean; fulfilmentFailure: boolean }) {
  const failed = input.paymentFailure || input.channelFailure || input.conversionFailure || input.fulfilmentFailure;
  return {
    failed,
    isolate: failed,
    reroute: input.channelFailure || input.paymentFailure,
    retry: input.conversionFailure || input.fulfilmentFailure,
  };
}
