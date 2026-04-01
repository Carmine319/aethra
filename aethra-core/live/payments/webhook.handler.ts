export function handleWebhook(event: { type: string; paid: boolean }) {
  return {
    processed: true,
    paymentConfirmed: event.type === "checkout.session.completed" && event.paid,
  };
}
