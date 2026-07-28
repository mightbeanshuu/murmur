# Murmur — Resume Description (verified 2026-07-28)

**Repo:** https://github.com/mightbeanshuu/murmur

## Resume bullets (current, verified against source)

**MURMUR — Event-Driven AI Agent-Swarm Orchestrator**
*Kafka · Temporal · PostgreSQL · Redis · Next.js · Go*

- Engineered a distributed orchestrator where a planner decomposes one goal into a concurrent **task DAG**; parallel workers execute, validators request revisions, and a synthesizer merges results, streamed live over SSE to a React Flow graph.
- Guaranteed **fault tolerance and durable retries** with Temporal workflows, atomic Redis rate limits and replayable event streams, plus versioned **Kafka** events consumed by an isolated Go service exporting Prometheus metrics.
- Shipped production concerns end to end: PostgreSQL-backed auth and per-run ownership, Stripe billing with signed webhooks, schema-validated LLM output and Docker Compose deployment.

## Facts these bullets rest on

| Claim | Source in repo |
|---|---|
| Planner → DAG → workers → validator → synthesizer | `README.md` request path; Temporal `swarm` activity |
| SSE → Zustand → React Flow | `README.md`; `src/` stream + store |
| Temporal durable workflows | `Dockerfile.temporal`, `services/`, `docker-compose.yml` |
| Kafka versioned events → Go consumer → `/metrics` | `services/` Go telemetry consumer |
| Redis run state, replayable events, atomic per-user rate limits | `README.md` (Free 3 runs/hr, Pro 100/hr) |
| Better Auth + PostgreSQL sessions, run ownership | `README.md` |
| Stripe Checkout, signed webhooks, entitlement projection | `README.md` |
| Zod-validated planner/validator structured output | `README.md` |
| Read-only account-scoped MCP server (`list_runs`, `get_final_deliverable`) | `README.md` |

## Claims deliberately NOT made
- No user/traffic numbers (no production telemetry to cite).
- No latency or throughput figures (none benchmarked).
