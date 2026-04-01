export function reduceFriction(landing: Record<string, unknown>) {
  const base = landing && typeof landing === "object" ? landing : {};
  const cta = String((base.CTA || (base.hero as Record<string, unknown> | undefined)?.cta || "Start now") as string);
  return {
    ...base,
    CTA: cta.replace("Learn more", "Start now"),
    checkoutSteps: 1,
    choiceCount: 1,
    clarityMode: "enforced",
  };
}
