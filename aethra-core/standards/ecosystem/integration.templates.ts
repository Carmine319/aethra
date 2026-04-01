/**
 * Ω v15 — Named integration templates reduce decision overhead.
 */

const templates: Record<string, string[]> = {
  minimal: ["register", "handshake", "invoke"],
  full: ["register", "handshake", "invoke", "meter", "settle", "observe"],
};

export function listTemplates() {
  return { ...templates };
}

export function getTemplate(name: string) {
  return templates[name] ?? null;
}
