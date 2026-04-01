import { assertPrivateOperatorMode } from "./operator";
import { packageOutcome, type RevenueDossier } from "./packaging";

export type ClientProblemRequest = {
  client_id: string;
  client_name?: string;
  problem_statement: string;
  use_case?: string;
  requested_tier?: string;
};

export type InternalExecutionResult = {
  venture_id: string;
  venture_name?: string;
  revenue_report: Record<string, unknown>;
  growth_trajectory: Record<string, unknown>;
  execution_log: Array<Record<string, unknown>>;
  mutation_history: Array<Record<string, unknown>>;
  optimisation_log: Array<Record<string, unknown>>;
  previous_hash?: string;
};

export type ClientModeResponse = {
  mode: "controlled_internal_execution";
  direct_system_access: false;
  request: ClientProblemRequest;
  dossier: RevenueDossier;
};

export async function runClientExecutionMode(
  request: ClientProblemRequest,
  executeInternally: (input: ClientProblemRequest) => Promise<InternalExecutionResult>
): Promise<ClientModeResponse> {
  assertPrivateOperatorMode();
  const internalResult = await executeInternally(request);
  const dossier = packageOutcome({
    venture_id: internalResult.venture_id,
    venture_name: internalResult.venture_name || request.client_name || request.client_id,
    revenue_report: internalResult.revenue_report || {},
    growth_trajectory: internalResult.growth_trajectory || {},
    execution_log: internalResult.execution_log || [],
    mutation_history: internalResult.mutation_history || [],
    optimisation_log: internalResult.optimisation_log || [],
    previous_hash: internalResult.previous_hash,
  });
  return {
    mode: "controlled_internal_execution",
    direct_system_access: false,
    request,
    dossier,
  };
}
