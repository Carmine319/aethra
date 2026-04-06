"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type HealthPayload = {
  status?: string;
  backend?: string;
};

export default function ProfitCounter() {
  const [online, setOnline] = useState(false);
  const [message, setMessage] = useState("AETHRA is initialising backend...");

  const checkBackend = useCallback(async () => {
    try {
      const data = (await apiFetch("/health")) as HealthPayload;
      const ok = String(data?.status || "").toUpperCase() === "OK";
      setOnline(ok);
      setMessage(ok ? "Backend connected on localhost:4000" : "AETHRA is initialising backend...");
    } catch {
      setOnline(false);
      setMessage("AETHRA is initialising backend...");
    }
  }, []);

  useEffect(() => {
    void checkBackend();
    const id = window.setInterval(() => {
      void checkBackend();
    }, 8000);
    return () => window.clearInterval(id);
  }, [checkBackend]);

  return (
    <div className="profit-strip" role="status" aria-live="polite">
      <div className="profit-strip-inner">
        <div className="profit-strip-metrics">
          <span className="profit-metric">
            <span className="profit-metric-label">Backend</span>
            <span className="profit-metric-value">{online ? "ONLINE" : "BOOTING"}</span>
          </span>
          <span className="profit-metric">
            <span className="profit-metric-label">Runtime</span>
            <span className="profit-metric-value">localhost:3000 → localhost:4000</span>
          </span>
        </div>
        <p className="profit-strip-feed">{message}</p>
      </div>
    </div>
  );
}
