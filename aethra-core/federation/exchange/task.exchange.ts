import { federationLog } from "../memory/partner.registry";
import { routeCapability } from "./capability.routing";
import type { FederationContract } from "../contracts/contract.schema";

export function routeTask(
  task: { type: string; id: string },
  systems: Array<{ id: string; capabilities: string[] }>,
  contract: FederationContract
) {
  const target = routeCapability(task, systems, contract);
  federationLog({ event: "task_routed", task_id: task.id, target: target?.id ?? null });
  return target;
}
