import { resolveLegalEntity } from "../compliance/identity.mapping";
import { logExternalEvent } from "../compliance/audit.bridge";
import { generateEvidence } from "../compliance/evidence.generator";

export function bindToEntity(action: Record<string, unknown>) {
  const entity = resolveLegalEntity();
  const bound = {
    ...action,
    entity,
    legal_entity: entity,
    timestamp: Date.now(),
  };
  logExternalEvent({ event: "entity_bind", entity, action_type: action.type });
  return { ...bound, evidence: generateEvidence(bound) };
}
