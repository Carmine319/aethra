import { trackPerception } from "../narrative/perception.tracker";

export function runPerceptionLoop(data: Array<Record<string, unknown>>) {
  const perception = trackPerception(data);
  return {
    ...perception,
    updated: true,
  };
}
