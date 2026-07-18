import {
  assertInfrastructureReady,
  InfrastructureUnavailableError,
} from "@/lib/swarm/infrastructure";
import { enforceRateLimit, rateLimitKey, RateLimitError } from "@/lib/swarm/rateLimit";
import { getRequestSession } from "@/lib/auth";
import { getUserPlan } from "@/lib/billing/repository";
import { runAllowance } from "@/lib/billing/plans";
import { launchSwarm } from "@/lib/swarm/launch";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const authSession = await getRequestSession(req);
  if (!authSession) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  // Defensive parsing: invalid JSON becomes an empty goal so validation below
  // returns a clean 400 instead of crashing the route.
  const { goal } = await req.json().catch(() => ({ goal: "" }));
  if (!goal || typeof goal !== "string" || goal.trim().length < 4) {
    return new Response(JSON.stringify({ error: "Provide a goal (min 4 chars)." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    // API keys stay server-side in Next.js route handlers. Never expose this
    // key from a client component.
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY is not set on the server." }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    // Kafka and Redis are part of the run contract. Reject new work before any
    // model tokens are spent when either dependency or the Kafka topic is down.
    await assertInfrastructureReady();
  } catch (error) {
    const health = error instanceof InfrastructureUnavailableError ? error.health : undefined;
    return new Response(
      JSON.stringify({
        error: "Required Kafka/Redis infrastructure is unavailable.",
        dependencies: health
          ? { kafka: health.kafka.ok ? "up" : "down", redis: health.redis.ok ? "up" : "down" }
          : undefined,
      }),
      {
        status: 503,
        headers: { "content-type": "application/json", "retry-after": "5" },
      },
    );
  }

  try {
    const plan = await getUserPlan(authSession.user.id);
    await enforceRateLimit({
      key: rateLimitKey("runs", authSession.user.id),
      ...runAllowance(plan),
    });
  } catch (e) {
    if (e instanceof RateLimitError) {
      return new Response(JSON.stringify({ error: e.message, retryAfterSeconds: e.retryAfterSeconds }), {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": String(e.retryAfterSeconds),
        },
      });
    }
    return new Response(JSON.stringify({ error: "Rate limiter unavailable." }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  const runId = crypto.randomUUID();
  const encoder = new TextEncoder();
  let running;
  try {
    running = await launchSwarm({
      runId,
      ownerId: authSession.user.id,
      goal: goal.trim(),
      signal: req.signal,
    });
  } catch (error) {
    return Response.json(
      { error: `Unable to start swarm: ${(error as Error).message}` },
      { status: 503, headers: { "retry-after": "5" } },
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of running.events) {
          // Server-Sent Events frame format. The blank line terminates one event.
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ kind: "error", message: (e as Error).message })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      // text/event-stream tells the browser/client this is a long-lived SSE stream.
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-murmur-run-id": runId,
      "x-murmur-execution-mode": running.mode,
    },
  });
}
