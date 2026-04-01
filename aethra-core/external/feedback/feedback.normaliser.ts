export function normaliseFeedback(data: { response: unknown; value: unknown }) {
  return {
    signal: data.response,
    value: data.value,
  };
}
