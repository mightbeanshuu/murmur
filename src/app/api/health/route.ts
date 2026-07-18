import { getInfrastructureHealth } from "@/lib/swarm/infrastructure";
import { pingDatabase } from "@/lib/database";
import { getExecutionMode, pingTemporal } from "@/lib/temporal/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const executionMode = getExecutionMode();
  const [health, postgres, temporal] = await Promise.all([
    getInfrastructureHealth({ force: true }),
    check(pingDatabase),
    executionMode === "temporal" ? check(pingTemporal) : Promise.resolve({ ok: true, latencyMs: 0 }),
  ]);
  const ready = health.ok && postgres.ok && temporal.ok;
  return Response.json(
    {
      status: ready ? "ready" : "not_ready",
      executionMode,
      checkedAt: new Date(health.checkedAt).toISOString(),
      dependencies: {
        kafka: {
          ok: health.kafka.ok,
          required: health.kafka.required,
          latencyMs: health.kafka.latencyMs,
        },
        redis: { ok: health.redis.ok, latencyMs: health.redis.latencyMs },
        postgres,
        temporal,
      },
    },
    {
      status: ready ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}

async function check(probe: () => Promise<void>) {
  const startedAt = Date.now();
  try {
    await probe();
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch {
    return { ok: false, latencyMs: Date.now() - startedAt };
  }
}
