export function buildIdentity(state: { mission?: string; capabilities?: string[] }) {
  return {
    mission: String(state.mission || "preserve and compound capital"),
    capabilities: state.capabilities || ["sensing", "probing", "allocation", "adaptation"],
    doctrine: ["survival-first", "adaptive-growth-second", "reversible-actions"],
  };
}
