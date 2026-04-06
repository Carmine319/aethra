export type HealthLevel = "OK" | "WARNING" | "CRITICAL";

export type MarketRegion = "UK" | "US" | "EU" | "OTHER";

export interface SignalSource {
  name: string;
  observedAt: number;
  rawConfidence: number;
}

export interface RealSignal {
  id: string;
  topic: string;
  sources: SignalSource[];
  /** 0–1 aggregate after cross-check */
  confidence: number;
  payload: Record<string, unknown>;
}

export interface SystemState {
  operational: boolean;
  health: HealthLevel;
  portfolio: Record<string, unknown>;
  diagnostics: Record<string, unknown>;
}

export interface CapitalAssessment {
  approved: boolean;
  reason?: string;
  estimatedCostGbp: number;
  timeToCashDays: number;
  downsideRisk01: number;
  liquidityAfterGbp: number;
}

export interface ExecutionContext {
  seedText?: string;
  baseUrl?: string;
  user_id?: string;
  userId?: string;
  deploy_limit?: number;
  mode?: "autonomous" | "assisted";
  autonomous_enabled?: boolean;
  skip_access_check?: boolean;
  campaign_id?: string;
  test_group?: string;
}

export interface CycleResult {
  ok: boolean;
  halted?: boolean;
  reason?: string;
  logs: string[];
  trace?: Record<string, unknown>;
  cycle?: unknown;
  capital?: CapitalAssessment;
  revenue?: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  topTemplateId?: string;
  profit?: Record<string, unknown>;
}
