"use client";

import { useEffect, useState } from "react";

interface HealthResponse {
  status: "ready" | "not_ready";
  executionMode: "direct" | "temporal";
  dependencies: Record<string, { ok: boolean }>;
}

export function SystemStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const ready = health?.status === "ready";
  const mode = health?.executionMode ?? "temporal";

  return (
    <div className="murmur-system" title={ready ? "All required services are ready" : "Checking services"}>
      <span className={`murmur-system-dot${ready ? " is-ready" : ""}`} />
      <span>{mode === "temporal" ? "Temporal durable" : "Direct execution"}</span>
      <span>Go telemetry</span>
    </div>
  );
}
