import { scaleShockIntensity } from "./shock.intensity.scaler";
import { classifyShock } from "./shock.classifier";
import { registerShock } from "./shock.registry";

export function detectShock(series: Array<{ value: number; ts?: number }>) {
  const s = series || [];
  if (s.length < 2) return null;
  const last = Number(s[s.length - 1].value || 0);
  const prev = Number(s[s.length - 2].value || 0);
  const velocity = Math.abs(last - prev);
  const variance =
    s.slice(-5).reduce((a, x, _i, arr) => {
      const m = arr.reduce((b, y) => b + Number(y.value), 0) / arr.length;
      return a + (Number(x.value) - m) ** 2;
    }, 0) / Math.max(1, Math.min(5, s.length));
  const scaled = scaleShockIntensity({ variance, velocity, duration: s.length });
  const shockClass = classifyShock({ intensity: scaled.intensity, channels: [] });
  const record = { scaled, shockClass, last, prev };
  registerShock({ event: "shock_detected", ...record });
  return record;
}
