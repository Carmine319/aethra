export function predict(input: any) {
  const expected = Number(input?.expected ?? input?.expectedValue ?? 0);
  return Math.round(expected * 1.1 * 100) / 100;
}
