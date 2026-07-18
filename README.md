<p align="center">
  <img src="public/brand/murmur-logo.svg" width="360" alt="Murmur" />
</p>

<p align="center"><strong>Turn one complex goal into a live, durable, validated agent swarm.</strong></p>
<p align="center">Plan · Delegate · Execute · Validate · Synthesize</p>

Murmur is a production-oriented orchestration workspace and an inspectable engineering portfolio project. A planner creates a task DAG, workers execute ready tasks in parallel, a validator can request one revision, and a synthesizer produces the final answer while React Flow renders every event.

The system pairs a focused product experience with production-grade identity, billing, durable workflows, streaming state, distributed infrastructure, and observability.

## What makes this a production-shaped project

- Better Auth email/password sessions backed by PostgreSQL; every run is owned by a user.
- Stripe Checkout, signed webhooks, Customer Portal, and PostgreSQL entitlement projection.
- Free plan: 10 runs/hour. Pro plan: 100 runs/hour. Limits are Redis-backed and enforced by user ID.
- Temporal moves long-running orchestration out of the HTTP process.
- Redis stores run state, replayable events, and distributed rate limits.
- Kafka receives versioned swarm events; an isolated Go consumer exports Prometheus metrics.
- SSE streams live events to a Zustand store and React Flow graph.
- Zod validates the planner and validator's structured LLM outputs.

## Request path

```text
Browser
  │ authenticated POST /api/swarm { goal }
  ▼
Next.js route adapter
  ├─ session + input + infrastructure checks
  ├─ PostgreSQL plan lookup → Redis user quota
  └─ starts Temporal workflow
          │
          ▼
Temporal Worker → swarm Activity → planner → DAG workers → validators → synthesizer
          │                         │
          │                         ├─ OpenRouter through Vercel AI SDK
          │                         └─ Zod structured-output validation
          ▼
Redis event stream ──SSE──▶ Zustand ──▶ React Flow
          │
          └─ Kafka ──▶ Go telemetry consumer ──▶ /metrics
```

The planner, worker, validator, and synthesizer are code roles, not separate servers. TypeScript controls their order and data flow; the LLM supplies language reasoning.

## Clean architecture boundaries

```text
src/app/                    HTTP/pages: Next.js adapters and UI composition
src/components/             browser-facing components
src/lib/auth.ts             identity and shared authentication policy
src/lib/billing/            plans, Stripe gateway, entitlement repository
src/lib/swarm/              orchestration domain + application services
src/lib/temporal/           durable-workflow client adapter
src/temporal/               workflow/worker process boundary
services/telemetry/         independent Go Kafka consumer
scripts/                    idempotent database migrations
```

Routes authenticate and translate HTTP. `launchSwarm` hides direct-vs-Temporal execution. Billing policy is centralized in `plans.ts`; Stripe is the subscription source of truth and PostgreSQL is the fast local projection.

## Local setup

Requirements: Node.js 20+, pnpm 11, Docker, and an OpenRouter API key.

```bash
pnpm install
cp .env.example .env.local
# Fill OPENROUTER_API_KEY, BETTER_AUTH_SECRET, and optional Stripe values.

pnpm infra:up
pnpm db:migrate
pnpm temporal:worker       # run in a second terminal
pnpm dev                   # http://localhost:3000
```

Generate an auth secret with `openssl rand -base64 32`.

Local services:

| Service | Address | Purpose |
| --- | --- | --- |
| Next.js | `http://localhost:3000` | UI, auth, API, SSE |
| Temporal UI | `http://localhost:8233` | workflow inspection |
| Go telemetry | `http://localhost:9091/metrics` | Prometheus metrics |
| PostgreSQL | `localhost:5432` | users, sessions, billing |
| Redis | `localhost:6379` | state, replay, limits |
| Kafka | `localhost:9092` | event stream |

`pnpm infra:full` builds and starts the Temporal Worker too. It requires a populated `.env.local` because the Worker calls OpenRouter.

## Pro payments

Murmur uses Stripe-hosted surfaces so card data never enters this application:

1. Create a Stripe Product and recurring Price.
2. Set `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID`.
3. Configure a webhook at `https://your-domain/api/billing/webhook` for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Set its signing secret as `STRIPE_WEBHOOK_SECRET`.
5. Enable the Stripe Customer Portal and set `APP_URL` to the deployed app URL.

For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Checkout and Portal routes always derive the Stripe customer from the authenticated server session. Webhooks verify the raw signed body, deduplicate event IDs transactionally, reconcile the customer's current Stripe subscriptions, and reject customer-to-user ownership mismatches before changing Pro access.

## Why Go is here

Go is not a second Murmur backend. `services/telemetry` is a distinct Kafka consumer that demonstrates a useful polyglot boundary:

- joins the `murmur-telemetry-v1` consumer group;
- parses versioned swarm envelopes;
- manually commits offsets after each batch is handled; malformed events are counted and skipped so a poison message cannot block a partition;
- exports health and Prometheus counters with a tiny runtime footprint;
- shuts down gracefully.

Deleting the Go service would remove metrics, but authentication, AI orchestration, and the UI would still work. That independence is the point.

Kafka is a required part of the run contract. Murmur refuses new runs when either
Kafka or Redis is unavailable, and an unacknowledged Kafka event fails the run
instead of silently degrading to a Redis-only path.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm typecheck` | TypeScript verification |
| `pnpm lint` | ESLint checks |
| `pnpm test` | unit/integration test suite |
| `pnpm db:migrate` | Better Auth + billing schemas |
| `pnpm infra:up` | start local dependencies |
| `pnpm infra:full` | start dependencies + containerized Worker |
| `pnpm infra:topic` | inspect the six-partition Kafka topic |
| `pnpm infra:logs` | follow infrastructure logs |
| `pnpm infra:down` | stop containers, preserve volumes |
| `pnpm infra:reset` | remove containers and local data volumes |

## Honest durability boundary

Temporal durably accepts a run and allows the Worker to live outside Vercel/Next.js. The current Workflow executes the whole swarm as one Activity and deliberately disables automatic Activity retries because model calls are not yet fully idempotent. A Worker crash can restart the Activity, but phase-level resume is not implemented yet. The next reliability step is to split planning, task waves, validation, and synthesis into idempotent Activities with persisted checkpoints.

## Deployment

Vercel can host the Next.js web adapter, but it cannot host the continuously polling Temporal Worker or Go consumer. A real deployment needs:

- Vercel for Next.js;
- managed PostgreSQL, Redis, Kafka, and Temporal Cloud/self-hosted Temporal;
- one container service for the Temporal Worker;
- one small container service for Go telemetry;
- production auth, OpenRouter, Stripe, and infrastructure environment variables.

Do not use Compose hostnames or `localhost` from Vercel. Use TLS-enabled managed endpoints and run `pnpm db:migrate` as a release step. See [docs/architecture.md](docs/architecture.md) and [docs/deployment.md](docs/deployment.md).

Vercel Production builds use `scripts/vercel-build.ts` to run those idempotent
release migrations before `next build`; Preview builds never mutate Production.
