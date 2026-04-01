export function manageRedundancy(components: string[]) {
  return components.map((component) => ({
    component,
    redundant: true,
    fallbackReady: true,
  }));
}
