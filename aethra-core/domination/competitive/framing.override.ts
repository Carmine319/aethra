export function overrideFraming(defaultFrame: string, preferredFrame: string) {
  return {
    previous: defaultFrame,
    next: preferredFrame,
    overridden: defaultFrame !== preferredFrame,
  };
}
