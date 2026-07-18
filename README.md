<p align="center">
  <img src="public/brand/murmur-logo.svg" width="360" alt="Murmur" />
</p>

<p align="center"><strong>Turn one complex goal into a live, durable, validated agent swarm.</strong></p>
<p align="center">Plan · Delegate · Execute · Validate · Synthesize</p>

<p align="center">
  <img src="social-assets/murmur-iphone-loop-4x5.gif" width="480" alt="Murmur live agent swarm product walkthrough" />
</p>

Murmur is a production-oriented orchestration workspace and an inspectable engineering portfolio project. A planner creates a task DAG, workers execute ready tasks in parallel, mode-aware validation can request focused revisions, and a synthesizer produces the final answer while React Flow renders every event.

The system pairs a focused product experience with production-grade identity, billing, durable workflows, streaming state, distributed infrastructure, and observability.

## What makes this a production-shaped project

- Better Auth email/password sessions backed by PostgreSQL; every run is owned by a user.
- Stripe Checkout, signed webhooks, Customer Portal, and PostgreSQL entitlement projection.
- Low, Auto, and Max modes control DAG size, validation depth, and repeated-context budgets.
- Free plan: 3 runs/hour, with at most 1 Max run/hour. Pro plan: 100 runs/hour. Limits are atomically enforced in Redis by user ID.
- Temporal moves long-running orchestration out of the HTTP process.
- Redis stores run state, replayable events, and distributed rate limits.
- Kafka receives versioned swarm events; an isolated Go consumer exports Prometheus metrics.
- SSE streams live events to a Zustand store and React Flow graph.
- Zod validates the planner and validator's structured LLM outputs.
- Cloudinary stores attached images as authenticated assets before a vision model derives instruction-resistant text context.
- Researcher agents use bounded Firecrawl web search, preserve source links, and state clearly when live search is unavailable.
- A read-only, account-scoped Streamable HTTP MCP server lets Codex or Claude Code discover retained runs and retrieve final Markdown deliverables.

## Request path

```text
Browser
  │ authenticated POST /api/swarm { goal, mode, attachments }
  ▼
Next.js route adapter
  ├─ session + origin + bounded input + infrastructure checks
  ├─ PostgreSQL plan lookup → Redis user quota
  ├─ text file ─────────────────────────────┐
  ├─ public GitHub repo → fixed GitHub API ─┤→ untrusted reference context
  ├─ image → authenticated Cloudinary asset ┘→ vision-derived text
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

Codex / Claude Code ──bearer token──▶ /api/mcp
                                      ├─ list_runs
                                      └─ get_final_deliverable (Markdown + retained source links)
```

The planner, worker, validator, and synthesizer are code roles, not separate servers. TypeScript controls their order and data flow; the LLM supplies language reasoning.

## Live research and MCP handoff

When a goal needs current public evidence, the planner assigns a Researcher task. The server sends a bounded query to Firecrawl, accepts only HTTP(S) source URLs, caps source count and excerpt size, marks page content as untrusted, and asks the Researcher to cite the supplied links. Search failures become an explicit limitation in the prompt instead of a fabricated browsing claim.

The resulting citations flow through validation and synthesis into the retained final Markdown. A user can create one account-wide read-only token in **Connect MCP**, configure either Codex or Claude Code, call `list_runs`, then call `get_final_deliverable`. Raw tokens are shown once, stored only as SHA-256 hashes, scoped to the authenticated owner, and cannot start, edit, or delete runs.

## Execution modes

| Mode | DAG size | Revision budget | Repeated-context policy | Best fit |
| --- | ---: | ---: | --- | --- |
| Low | 1–2 tasks | 0 revisions | smallest budgets | fast, concise work |
| Auto | 2–4 tasks | up to 1 revision | balanced budgets | normal adaptive use |
| Max | 4–6 tasks | up to 2 revisions | largest bounded context | deep, multi-angle work |

Max is deliberately more expensive and slower, but it is not unbounded. Every mode has deterministic caps on material that gets repeated between model calls.

## Token-efficiency design

The orchestration layer reduces repeated prompt material before it reaches the provider:

- upstream blackboard outputs, validator inputs, revision feedback, and the synthesis corpus each have a mode-specific character budget;
- labeled sections share a budget fairly, so one oversized worker cannot crowd out every other specialist;
- compaction preserves section labels plus the opening and conclusion, with an explicit truncation marker;
- the original goal, task title, and task brief stay outside the repeated-context cuts;
- attachment data is prepared once for planning instead of copying raw files or images into every worker prompt.

| Mode | Upstream handoff | Revision feedback | Worker output sent to validation | Synthesis corpus |
| --- | ---: | ---: | ---: | ---: |
| Low | 4,000 chars | 1,000 chars | 8,000 chars | 12,000 chars |
| Auto | 8,000 chars | 2,000 chars | 12,000 chars | 24,000 chars |
| Max | 16,000 chars | 4,000 chars | 24,000 chars | 48,000 chars |

The live token meter and run statistics use `ceil(characters / 4)`. That is a fast UI estimate, not provider-reported usage, an exact tokenizer result, or a promise of a fixed percentage saving. The practical benefit is measurable bounded prompt growth as agent output and DAG size increase.

## Attachment security boundary

- Text files are type-checked and size-bounded before becoming untrusted planner context.
- GitHub attachments accept only exact public `https://github.com/owner/repository` URLs. Murmur constructs the `api.github.com` request itself, which prevents user-controlled host fetching.
- Image attachments are validated, stored with Cloudinary's `authenticated` delivery type, and described by a vision model that is told to treat visible instructions as data.
- Raw base64 image data is not written to Murmur's Redis run state, Kafka events, or Temporal input. Only the derived text description enters orchestration; the original image remains in the authenticated Cloudinary asset store.

## Clean architecture boundaries

```text
src/app/                    HTTP/pages: Next.js adapters and UI composition
src/components/             browser-facing components
src/lib/auth.ts             identity and shared authentication policy
src/lib/billing/            plans, Stripe gateway, entitlement repository
src/lib/media/              authenticated Cloudinary image storage adapter
src/lib/swarm/              orchestration domain + application services
src/lib/temporal/           durable-workflow client adapter
src/temporal/               workflow/worker process boundary
services/telemetry/         independent Go Kafka consumer
scripts/                    idempotent database migrations
```

Routes authenticate and translate HTTP. `launchSwarm` hides direct-vs-Temporal execution. Billing policy is centralized in `plans.ts`; Stripe is the subscription source of truth and PostgreSQL is the fast local projection.

## Local setup

Requirements: Node.js 20+, pnpm 11, Docker, and an OpenRouter API key. A Firecrawl API key is optional but required for live Researcher web search.

```bash
pnpm install
cp .env.example .env.local
# Fill OPENROUTER_API_KEY and BETTER_AUTH_SECRET.
# Fill FIRECRAWL_API_KEY to enable sourced live Researcher searches.
# Image attachments also need the three CLOUDINARY_* values; Stripe is optional.

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
- production auth, OpenRouter, Stripe, and infrastructure environment variables;
- Cloudinary credentials when image attachments are enabled.

Do not use Compose hostnames or `localhost` from Vercel. Use TLS-enabled managed endpoints and run `pnpm db:migrate` as a release step. See [docs/architecture.md](docs/architecture.md) and [docs/deployment.md](docs/deployment.md).

Vercel Production builds use `scripts/vercel-build.ts` to run those idempotent
release migrations before `next build`; Preview builds never mutate Production.
