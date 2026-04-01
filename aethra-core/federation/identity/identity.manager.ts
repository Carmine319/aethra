import { federationLog } from "../memory/partner.registry";

/** Records a sovereign peer — identity is not transferred or merged. */
export function declareIdentity(entityId: string) {
  federationLog({ event: "identity_declared", entity_id: entityId, sovereign_peer: true });
  return { entity_id: entityId, sovereign_peer: true };
}
