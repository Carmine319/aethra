export function reduceCognitiveLoad(layer: Record<string, unknown>) {
  return {
    ...layer,
    messageComplexity: "low",
    maxChoices: 1,
    stepsToConversion: 1,
  };
}
