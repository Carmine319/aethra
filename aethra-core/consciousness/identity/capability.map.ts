export function mapCapabilities(capabilities: string[]) {
  return capabilities.map((capability, idx) => ({
    capability,
    maturity: Number((0.55 + idx * 0.08).toFixed(4)),
  }));
}
