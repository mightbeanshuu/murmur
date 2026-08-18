# Murmur — Resume Description (verified 2026-07-28)

**Repo:** https://github.com/mightbeanshuu/murmur

## Resume bullets (current, verified against source)

**MURMUR — Event-Driven AI Agent-Swarm Orchestrator**
*Temporal · PostgreSQL · Redis · Stripe · Next.js · Go*

- Engineered a distributed orchestrator where a planner decomposes one goal into a concurrent **task DAG**; parallel workers execute, validators request revisions, and a synthesizer merges results, streamed live over SSE to a React Flow graph.
- Guaranteed **fault tolerance** with Temporal workflows, atomic Redis rate limits and replayable event streams, plus an isolated Go telemetry service exporting run metrics in Prometheus format.
- Shipped production concerns end to end: PostgreSQL-backed auth and per-run ownership, Stripe billing with signed webhooks, schema-validated LLM output and Docker Compose deployment.

## Facts these bullets rest on

| Claim | Source in repo |
|---|---|
| Planner → DAG → workers → validator → synthesizer | `README.md` request path; Temporal `swarm` activity |
| SSE → Zustand → React Flow | `README.md`; `src/` stream + store |
| Temporal durable workflows | `Dockerfile.temporal`, `services/`, `docker-compose.yml` |
| Go consumer → `/metrics` (Prometheus text format) | `services/telemetry/main.go` |
| Redis run state, replayable events, atomic per-user rate limits | `README.md` (Free 3 runs/hr, Pro 100/hr) |
| Better Auth + PostgreSQL sessions, run ownership | `README.md` |
| Stripe Checkout, signed webhooks, entitlement projection | `README.md` |
| Zod-validated planner/validator structured output | `README.md` |
| Read-only account-scoped MCP server (`list_runs`, `get_final_deliverable`) | `README.md` |

## Claims deliberately NOT made
- No user/traffic numbers (no production telemetry to cite).
- No latency or throughput figures (none benchmarked).

## Claims removed from the resume (2026-08-19)

- **Kafka** — dropped from every resume variant by Anshu's call. The code is real (`src/lib/swarm/kafka.ts`, idempotent producer, franz-go consumer in `services/telemetry`), but it is a best-effort mirror whose publish failures are swallowed in `src/lib/swarm/bus.ts` (Redis is the source of truth), and the hosted broker is a free Aiven service that powers off when idle. Do not reintroduce.
- **"Temporal retries safely after a crash"** — still worded this way on some variants but contradicted by `src/temporal/workflows.ts:11` (`retry: { maximumAttempts: 1 }`; automatic replay is disabled until each phase has an idempotency key). Temporal durably queues and supervises runs; it does not retry them.
