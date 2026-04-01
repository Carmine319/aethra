import { injectLiquidity } from "./liquidity.engine";
import { discoverClearingPrice } from "./pricing.discovery";
import { appendSwarmMemory } from "../memory/swarm.memory";

export function runMarketTick(input: { tasks: any[]; system_liquidity: number; bids: number[] }) {
  const tasks = injectLiquidity(input.tasks || [], input.system_liquidity || 0);
  const price = discoverClearingPrice(input.bids || []);
  appendSwarmMemory({ event: "market_tick", tasks: tasks.length, clearing_hint: price });
  return { tasks, clearing_price_hint: price };
}
