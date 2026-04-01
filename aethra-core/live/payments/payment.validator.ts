export function validatePaymentSystem(input: { checkoutWorks: boolean; paymentConfirmed: boolean; webhookTriggered: boolean; revenueRecorded: boolean }) {
  const valid = input.checkoutWorks && input.paymentConfirmed && input.webhookTriggered && input.revenueRecorded;
  return { valid, failure: valid ? null : "payment-integrity-failure" };
}
