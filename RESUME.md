# Murmur — Resume Description (verified 2026-07-28)

**Repo:** https://github.com/mightbeanshuu/murmur

## Resume bullets (current, verified against source)

**MURMUR — Event-Driven AI Agent-Swarm Orchestrator**
*Kafka · PostgreSQL · Redis · Stripe · Next.js · Go*

- Engineered a distributed orchestrator where a planner decomposes one goal into a concurrent **task DAG**; parallel workers execute, validators request revisions, and a synthesizer merges results, streamed live over SSE to a React Flow graph.
- Guaranteed replay-safety with a single **atomic Redis Lua script** that updates the run projection and appends to an XADD stream under a deterministic `sequence-0` id, so a replayed event is a no-op; **Kafka** mirrors those events to an isolated **Go** consumer exporting Prometheus metrics.
- Shipped production concerns end to end: PostgreSQL-backed auth and per-run ownership, Stripe billing with signed webhooks, schema-validated LLM output and Docker Compose deployment.

## Facts these bullets rest on

| Claim | Source in repo |
|---|---|
| Planner → DAG → workers → validator → synthesizer | `README.md` request path; Temporal `swarm` activity |
| SSE → Zustand → React Flow | `README.md`; `src/` stream + store |
| Temporal durable workflows | `Dockerfile.temporal`, `services/`, `docker-compose.yml` |
| Kafka events → Go consumer → `/metrics` (Prometheus text format) | `src/lib/swarm/kafka.ts`, `services/telemetry/main.go:178,185` |
| Redis run state, replayable events, atomic per-user rate limits | `README.md` (Free 3 runs/hr, Pro 100/hr) |
| Better Auth + PostgreSQL sessions, run ownership | `README.md` |
| Stripe Checkout, signed webhooks, entitlement projection | `README.md` |
| Zod-validated planner/validator structured output | `README.md` |
| Read-only account-scoped MCP server (`list_runs`, `get_final_deliverable`) | `README.md` |

## Claims deliberately NOT made
- No user/traffic numbers (no production telemetry to cite).
- No latency or throughput figures (none benchmarked).

## Claims removed from the resume (2026-08-19, revised)

- **Temporal** — REMOVED from every resume variant. `src/temporal/workflows.ts:11` sets `retry: { maximumAttempts: 1 }` (automatic Activity replay is disabled until each phase has an idempotency key) and `getExecutionMode()` defaults to `direct`, so Temporal is not on the live path at all. Any "retries safely after a crash" wording is contradicted by the source. Do not reintroduce.
- **Kafka — KEPT** (reversed 2026-08-19 on Anshu's call). The code is real (`src/lib/swarm/kafka.ts:29-49` — idempotent producer, `acks:-1`, `allowAutoTopicCreation:false`; franz-go consumer in `services/telemetry/main.go`). Interview caveat to volunteer: it is a **best-effort telemetry mirror** — publish failures are swallowed in `src/lib/swarm/bus.ts:104-109` and Redis is the source of truth. If asked "why not Prometheus directly": Prometheus scrapes, it cannot ingest application events; the Go consumer IS the Prometheus exporter, and Kafka decouples it from the web tier.
