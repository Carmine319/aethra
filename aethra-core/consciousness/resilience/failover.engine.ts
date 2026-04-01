export function activateFallback(state: { failedComponents: string[] }) {
  const active = (state.failedComponents || []).map((name) => ({ component: name, fallbackActive: true }));
  return {
    activated: active,
    continuityMaintained: true,
  };
}
