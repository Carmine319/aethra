/**
 * Ω v15 — Minimal protocol schema envelope (identity + version + invariants slot).
 */

export type ProtocolSchema = {
  name: string;
  version: string;
  invariants?: string[];
  fields: Record<string, string>;
};

export function defineProtocolSchema(spec: ProtocolSchema) {
  return { ...spec, schemaKind: "aethra.protocol.v15" as const };
}
