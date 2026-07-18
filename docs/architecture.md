# Murmur architecture

## Boundaries

| Layer | Owns | Must not own |
| --- | --- | --- |
| Next.js adapters | HTTP parsing, auth checks, status codes, SSE framing | LLM workflow rules |
| Application services | launching a run, plan entitlements, orchestration use cases | browser rendering |
| Swarm domain | plans, DAG waves, worker/validator/synthesis rules | Stripe or HTTP |
| Infrastructure adapters | PostgreSQL, Redis, Kafka, Temporal, OpenRouter | product policy |
| UI | user intent and event projection | secrets or subscription authority |
| Go telemetry | Kafka consumption and metrics | core run execution |

## Data ownership

- PostgreSQL owns users, sessions, Stripe customer/subscription projections.
- Stripe owns the actual payment and subscription lifecycle.
- Redis owns live run projections, replay streams, and quota counters.
- Kafka owns the scalable downstream event log.
- Temporal owns workflow execution history.
- Zustand owns only the current browser projection.

## Research and MCP boundaries

- Researcher tasks call Firecrawl only from the server through a fixed HTTPS endpoint; the browser never receives the provider key.
- Search results are URL-validated, count-bounded, excerpt-bounded, and framed as untrusted reference data before entering a worker prompt.
- Source links remain in the final Markdown, so downstream CLI agents can inspect the evidence instead of receiving an opaque summary.
- `/api/mcp` exposes only `list_runs` and `get_final_deliverable`. Both are read-only, owner-scoped, and operate inside the existing run-retention window.
- MCP bearer tokens are shown once and persisted only as SHA-256 hashes. The MCP boundary cannot launch, mutate, or delete swarms.

## Failure behavior

- Missing session: HTTP 401 before infrastructure or model work.
- Invalid goal: HTTP 400.
- Kafka/Redis unavailable: HTTP 503 before model spend.
- Quota exceeded: HTTP 429 with `Retry-After`.
- Temporal start failure: HTTP 503; run is marked failed.
- Browser disconnect: Temporal mode continues independently; reconnect can read persisted events.
- Stripe webhook signature failure: HTTP 400 and no entitlement mutation.
- Go consumer failure: swarm remains available; monitoring becomes unhealthy.

## Scaling notes

Run IDs key Kafka records, preserving per-run partition order. Redis writes are idempotent by run sequence. Redis and Kafka still do not share one transaction; a production-hardening step is a transactional outbox relay. The current Temporal boundary is coarse-grained and should become phase-level Activities before claiming exact mid-run recovery.
