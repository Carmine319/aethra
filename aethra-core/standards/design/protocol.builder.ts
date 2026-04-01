import { defineProtocolSchema, type ProtocolSchema } from "./protocol.schema";
import { enforceDeterminism } from "./determinism.engine";

/**
 * Ω v15 — Compose a protocol definition with a stable canonical fingerprint.
 */

export function buildProtocol(spec: ProtocolSchema) {
  const schema = defineProtocolSchema(spec);
  const fingerprint = enforceDeterminism({ name: schema.name, version: schema.version }, schema);
  return { schema, fingerprint };
}
