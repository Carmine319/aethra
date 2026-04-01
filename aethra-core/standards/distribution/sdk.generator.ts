/**
 * Ω v15 — Stub SDK surface generator from protocol field map.
 */

export function generateSdkStub(schema: { name: string; fields: Record<string, string> }) {
  return {
    moduleName: `${schema.name.replace(/\s+/g, "")}Client`,
    methods: Object.keys(schema.fields).map((k) => `invoke_${k}`),
  };
}
