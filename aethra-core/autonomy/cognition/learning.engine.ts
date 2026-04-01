export function learn(data: any[]) {
  return (data || []).map((d) => ({
    pattern: d.input,
    outcome: d.output,
  }));
}
