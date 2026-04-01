export function buildResponseEngine(signal: string) {
  return {
    signal,
    response: signal === "price-cut" ? "shift-to-roi-criteria" : "reinforce-outcomes",
    speedClass: "same-cycle",
  };
}
