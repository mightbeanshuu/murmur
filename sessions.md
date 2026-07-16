# Murmur Learning Sessions

## Session 1
- **Route:** Basic to Interview
- **Prerequisite Check:** Corrected to Murmur - Agent Swarm Orchestrator. Grasp speed: FAST.
- **Concepts Taught:** Mental model of Planner/Workers/Validator/Synthesizer, DAG, SSE. EventBus (AsyncIterator). Planner (Zod), Orchestrator (DAG execution).
- **Learner Gaps:** (None yet)

## Session 2
- **Route:** Basic to Interview
- **Prerequisite Check:** Handled in Session 1.
- **Concepts Taught:** Worker/Validator loop, Shared Blackboard (upstream results), Zod schema (quality gate), Failure fallback (rate limits).
- **Learner Gaps:** (Pending)

## Session 3
- **Route:** Basic to Interview
- **Prerequisite Check:** Continuing from Session 2. Current target: live streaming/UI data path.
- **Concepts Taught:** In progress — SSE route, EventBus AsyncIterator, client stream reader, Zustand reducer, React Flow rendering.
- **Learner Gaps:** Pending checkpoint response.
- **Next Session Focus:** TBD after Session 3 checkpoint.

## Session 4
- **Route:** Basic to Interview
- **Prerequisite Check:** Continuing prior route; user asked specifically for Zod in this project.
- **Concepts Taught:** Zod as runtime schema for AI structured outputs; planner schema; validator schema; `genObject` type contract; difference between TypeScript interfaces and runtime validation.
- **Learner Gaps:** Pending checkpoint response.
- **Next Session Focus:** Trace one real planner output through `plan()` into `runSwarm()`.

## Session 5
- **Route:** Basic to Interview
- **Prerequisite Check:** User requested production upgrade: Kafka for distributed event streaming and Redis for rate limit management.
- **Concepts Taught:** In progress — in-memory event bus vs distributed event stream; Kafka event publishing; Redis shared counters for rate limits; optional infrastructure via env vars.
- **Learner Gaps:** Pending review after PR.
- **Next Session Focus:** Explain Kafka topic/message key design and Redis fixed-window tradeoffs.

## Session 6
- **Route:** Basic to Interview
- **Prerequisite Check:** User asked to store the current API/SSE/live-streaming explanation and flowchart.
- **Concepts Taught:** API call from `useRunSwarm.ts` to `/api/swarm`; Next.js route mapping; request JSON validation; backend-only API key check; normal API vs streaming API; SSE `data: ...\n\n` format; `ReadableStream`; `TextEncoder`; browser `TextDecoder`; buffer handling; Zustand `apply(event)` update path.
- **Examples Used:** User prompt `"Generate research on AI agents in healthcare"` and click `Swarm`.
- **Small Terms Explained:** `fetch`, `POST`, `headers`, `content-type`, `JSON.stringify`, `signal`, `ReadableStream`, `controller.enqueue`, `SSE`, `TextEncoder`, `TextDecoder`, `buffer`.
- **Learner Gaps:** User is clarifying streaming and SSE mechanics; next focus should be client-side stream reading.
- **Next Session Focus:** `useRunSwarm.ts` deep dive: `AbortController`, `response.body.getReader()`, decoding chunks, buffering partial SSE frames, `JSON.parse`, `apply(event)`, and common stream bugs.

## Session 7
- **Route:** Basic to Interview
- **Prerequisite Check:** User asked to store Kafka/rate-limiting updates in the learning sessions and add the related skills.
- **Concepts Taught:** Production upgrade path from in-memory EventBus to durable/shared infrastructure; Kafka producer; Kafka topic/key/message headers; Redis shared connection; Redis fixed-window rate limiter; HTTP 429 + `retry-after`; Redis run session projection; Redis Stream event replay; `runId`; event envelope versioning and sequence numbers; strict vs non-strict event delivery.
- **Examples Used:** Current Murmur production files: `src/lib/swarm/kafka.ts`, `src/lib/swarm/rateLimit.ts`, `src/lib/swarm/session.ts`, `src/lib/swarm/bus.ts`, `src/app/api/swarm/route.ts`, `src/app/api/swarm/[runId]/route.ts`.
- **Small Terms Explained:** Kafka, topic, producer, message key, `acks: -1`, idempotent producer, Redis, `INCR`, `EXPIRE`, `TTL`, fixed-window limit, Redis Stream, `runId`, sequence, replay, HTTP 429.
- **Learner Gaps:** Needs line-by-line reinforcement of Kafka topic/key partitioning and Redis rate-limit script.
- **Next Session Focus:** Kafka topic/message-key/partition ordering, then Redis fixed-window rate limiter line-by-line.

## Session 8
- **Route:** Basic to Interview
- **Prerequisite Check:** Learner already understood SSE as the browser-facing stream and asked to make Kafka/Redis deeply integrated rather than optional.
- **Concepts Taught:** Required infrastructure contract; fail-closed readiness gate; Kafka topic provisioning; `runId` partition key; all-replica acknowledgement; Redis `PING`; AOF persistence; atomic Lua persistence; deterministic Redis Stream IDs; idempotency; health/readiness endpoint; non-root Docker services; local single-node vs managed replicated production infrastructure; Redis-first durable delivery; transactional-outbox limitation.
- **Examples Used:** `POST /api/swarm → readiness → Redis rate limit → EventBus branches into immediate SSE plus ordered Redis→Kafka durability`; local `murmur.swarm.events` topic with six partitions and seven-day retention; production container connected to `kafka:19092` and `redis:6379`.
- **Small Terms Explained:** readiness, fail closed, topic provisioning, partition, message key, ISR, AOF, append-only log, deterministic ID, idempotency, Lua atomicity, health check, named volume, non-root container, transactional outbox.
- **Implementation Work:** Added required validated config, Kafka/Redis readiness checks, `/api/health`, atomic Redis event persistence, visible durable-delivery errors, Docker Compose Kafka/Redis stack, topic initializer, production Dockerfile, KafkaJS Node 24 patch, and deployment documentation.
- **Doubts and Answers:** Kafka/Redis are no longer optional. Redis is the recoverable source record; Kafka is the required distributed event stream; SSE remains the live browser transport.
- **Learner Gaps:** Still needs line-by-line reinforcement of Kafka partition ordering and the Redis Lua persistence/rate-limit scripts.
- **Grasp-Speed Signal:** Fast, architecture-oriented requests; learner prefers implementation first with interview explanation attached.
- **Adaptation Used:** Implemented the full path, then mapped every operational failure to a production concept instead of teaching Kafka only in isolation.
- **Recurring Difficult Topics:** EventBus vs Kafka vs SSE responsibilities; Redis atomic commands and TTL behavior.
- **Next Session Focus:** Trace one `run.start` envelope through Redis and Kafka, then explain the two Lua scripts line by line and answer medium/hard production interview questions.

## Current learning position after Session 8
- **Completed foundation:** Swarm roles, DAG scheduling, shared blackboard, Zod validation, EventBus, SSE, browser stream decoding, Zustand updates, Kafka/Redis purpose, and production infrastructure setup.
- **Can explain with support:** Full request path from button click to live UI; why `runId` is the Kafka key; why Redis stores run history; why Kafka, SSE, and EventBus have different responsibilities.
- **Needs deeper mastery:** TypeScript syntax without copying; Next.js server/client boundaries; model-provider fallback behavior; Kafka consumers/offsets/lag; Redis Lua scripts; tests; observability; security; cancellation; job queues; transactional outbox; deployment architecture; concise interview delivery.
- **Route Decision:** Continue **Basic to Interview**, but enter Phase 2: project internals, failure diagnosis, production tradeoffs, and senior interview questions.

## Fresh roadmap: Sessions 9–18

### Session 9 — AI provider flow and screenshot failure diagnosis
- Trace `OPENROUTER_API_KEY → createOpenRouter() → chainFor() → runText()/runObject()`.
- Distinguish a provider key from a selected model. A key can authorize access without proving Grok is the model used.
- Diagnose 401, 402, 408, 429, 5xx, empty output, timeout, and all-models-failed behavior.
- Explain why the orchestrator continues with `"(this subtask failed)"` and why that produces a degraded final answer.

### Session 10 — TypeScript through Murmur
- `type`, `interface`, unions, `Exclude`, generics, maps, type guards, `unknown`, assertions, and async return types.
- Read `types.ts`, `run.ts`, and `orchestrator.ts` line by line.
- Interview focus: compile-time types vs runtime Zod validation.

### Session 11 — Next.js App Router and client/server boundaries
- Route handlers, `Request`, `Response`, environment variables, server-only secrets, client components, hooks, and API mapping.
- Trace `GoalBar → useRunSwarm → POST /api/swarm → SSE response`.
- Explain why Kafka/Redis clients belong on the server.

### Session 12 — Kafka deeply
- Topic, partition, key hashing, per-partition ordering, producer acknowledgement, ISR, replication, consumer groups, offsets, replay, and lag.
- Follow one Murmur envelope through partition selection and a future analytics consumer.
- Medium/hard interview drills on ordering and delivery guarantees.

### Session 13 — Redis deeply
- Strings, hashes, streams, TTL, `INCR`, `EXPIRE`, `XADD`, `XRANGE`, transactions, and Lua atomicity.
- Explain both Murmur Lua scripts line by line: fixed-window rate limiting and idempotent event persistence.
- Tradeoffs: fixed window vs sliding window/token bucket; Redis Stream vs Kafka.

### Session 14 — Testing and failure injection
- Unit-test DAG waves, cycles, missing dependencies, worker failures, event order, rate limits, and replay.
- Integration-test Kafka/Redis and the SSE parser.
- Simulate broker loss, Redis loss, timeout, duplicate events, and reconnect.

### Session 15 — Reliable orchestration architecture
- Background job queue, durable workflow state, cancellation propagation, backpressure, retries with jitter, dead-letter handling, and idempotency.
- Design the transactional outbox worker that closes the Redis→Kafka consistency gap.
- Compare BullMQ, Temporal, Inngest, and a custom worker conceptually.

### Session 16 — Observability, cost, and security
- Structured logs, metrics, traces, Kafka lag, Redis memory, latency percentiles, token/cost accounting, and alerting.
- Auth, per-user limits, prompt-injection boundaries, secret rotation, input limits, and abuse protection.

### Session 17 — DevOps and deployment
- Docker stages, Compose networking, health/readiness probes, CI/CD, managed Kafka/Redis, TLS/SASL, backups, rollback, and scaling.
- Understand why `localhost` infrastructure works locally but not from Vercel.
- Decide between Vercel for UI/API and a container/background-worker platform for long swarm jobs.

### Session 18 — Senior interview and project presentation
- Two-minute architecture explanation, code walkthrough, system-design extension, failure scenarios, tradeoff answers, and mock interview.
- Prepare resume bullets and a production-readiness answer grounded in implemented code.

## Session 9 — Started
- **Route:** Basic to Interview, Phase 2
- **Prerequisite Check:** Screenshot shows the learner can operate the deployed swarm and recognize that a provider key is configured. The learner has not yet distinguished provider authentication from model selection.
- **Evidence From Screenshot:** Planner execution occurred; five agents were rendered; the analyst completed with 9/10; three worker subtasks failed; synthesis continued using fallback text. Therefore the request passed the missing-key guard, but some model attempts later failed.
- **Key Correction:** This repository reads only `OPENROUTER_API_KEY`. It currently has no `GROK_API_KEY`/`XAI_API_KEY` integration and no Grok model in its default chains. A Vercel key and local `.env.local` are separate configurations.
- **Concepts To Teach Next:** Provider vs model; role model chains; paid-access probe; fallback loop; timeout; provider status codes; degraded completion policy; how to inspect the exact worker error safely.
- **Learner Gaps:** Needs to connect UI statuses (`Done`, `Failed`, `Working`) to exact backend catch/fallback branches.
- **Adaptation:** Begin with the screenshot and trace one failed worker backward through the source before introducing more Kafka/Redis theory.
- **Checkpoint For Next Lesson:** Explain why a configured provider key does not guarantee every worker succeeds or prove that Grok handled the request.

### Session 9 production incident — Vercel readiness failure
- **Observed Symptom:** The deployed UI showed `Required Kafka/Redis infrastructure is unavailable.` before the swarm plan could run.
- **Evidence:** `GET /api/health` returned HTTP 503 with both Kafka and Redis marked down and `latencyMs: 0`. Vercel environment inspection showed only `OPENROUTER_API_KEY`; the required `KAFKA_BROKERS`, `KAFKA_SWARM_EVENTS_TOPIC`, and `REDIS_URL` variables were absent.
- **Root Cause:** Local Docker addresses such as `localhost:9092`, `kafka:19092`, and `redis:6379` exist only on the developer machine or its Compose network. A Vercel function cannot connect to them. Production needs publicly reachable, authenticated managed Kafka and Redis endpoints.
- **Important Terms:** A deployment environment is the isolated runtime where production code executes. An endpoint is the network address of a service. A managed service is infrastructure operated by a provider. Readiness answers whether dependencies are usable now; a successful build does not prove runtime readiness.
- **Architecture Decision:** Keep Kafka and Redis mandatory. Do not hide the incident with an in-memory fallback. Vercel Marketplace can supply Redis, but Kafka requires an external provider such as Confluent Cloud, Aiven, or Redpanda Cloud.
- **Next Required Action:** Provision/connect managed Redis and managed Kafka, add their production variables, redeploy, and require `/api/health` to return HTTP 200 before testing a swarm run.
- **Provider Decision (this session):** Upstash Kafka is discontinued (shut down March 11, 2025) — confirmed via web search, corrected in-session. User chose **Redpanda Cloud** for Kafka and **Redis Cloud via Vercel Marketplace** for Redis. Both require user-side signup (their own login); not yet completed as of end of Session 9.

## Session 9 — Closed
- **Concepts Taught:** Provider (OpenRouter key) vs. model selection; `chainFor(role)` ordered fallback chain; `hasPaidAccess()` one-time paid-tier probe; why workers stay on free models even on a paid key (cost control); `shouldFallback()` status-code triage (402/408/429/5xx); `AbortSignal.timeout`.
- **Small Terms Explained:** `createOpenRouter`, `model(id)`, `chainFor`, `hasPaidAccess`, `AbortSignal.timeout`, status codes 402/408/429.
- **Real Bug Found:** In `src/lib/swarm/run.ts` `runText()`, `if (!shouldFallback(e)) continue;` does not actually gate the loop — there is no `else { throw }`, so every error (including non-retryable ones) falls through to the next model. `runObject`/`genObject` don't call `shouldFallback` at all. Non-retryable failures burn through the entire chain before `AllModelsFailed` throws.
- **Checkpoint:** Asked but not yet answered by learner — left open, flagged as recurring topic feeding into Session 15 (retry/dead-letter correctness).
- **Learner Gaps:** Retry-loop correctness (shouldFallback dead branch) needs revisiting in Session 15.
- **Next Session Focus:** Session 10 — TypeScript through Murmur.

## Session 10 — TypeScript through Murmur
- **Route:** Basic to Interview, Phase 2
- **Concepts Taught:** String-literal unions (`AgentType`), `interface` vs `type` convention, `Exclude<A,B>` encoding a business rule at compile time, discriminated unions (`SwarmEvent` + `kind` narrowing), `Record<K,V>` exhaustiveness, custom type guards (`d is Done`), type assertions vs `unknown` in `catch`, async `Promise<T>` return types.
- **Small Terms Explained:** `type`, `interface`, `Exclude`, discriminated union, `Record`, `Map<K,V>` generics, type guard, type assertion (`as`), `Promise<T>`.
- **Checkpoint Asked:** What happens to `completed`'s value type and every reader of it if `Done.output` became `string | null` and the failure fallback used `null` instead of placeholder text? — **not yet answered**, left open.
- **Learner Gaps:** Same retry-loop issue from Session 9 remains open; TypeScript narrowing behavior on unions not yet confirmed understood.
- **Next Session Focus (per learner request, out of roadmap order):** SSE/EventBus deep-dive review, then Redis deep dive, then Docker/docker-compose deep dive. Next.js App Router session explicitly deferred to the very end.

## Session 11 — SSE/EventBus review + Redis deep dive + Docker/Compose deep dive
- **Route:** Basic to Interview, Phase 2 (learner-directed order, deviates from the Session 9-18 roadmap)
- **Part A — SSE + EventBus:** Re-explained end-to-end path (button click → route.ts → EventBus → ReadableStream → SSE frame). Taught the two-sided producer/consumer handoff (`emit()` resolves a waiting reader or buffers; `next()` drains the queue or suspends), the `this.delivery` reassigned-promise-chain acting as an async mutex for ordered Redis/Kafka writes from concurrent workers, and why `close()` blocks on that same chain before ending the stream.
- **Part B — Redis deep dive:** Fixed-window rate limiter Lua script (`INCR`+`EXPIRE` atomicity, race condition it prevents), the event-persistence Lua script (idempotency via sequence guard + deterministic Redis Stream ID `sequence-0`), hash-vs-stream dual data shape (current-state projection vs. full replay, a lightweight CQRS pattern), and `redis.ts` fail-fast connection settings (`maxRetriesPerRequest: 1`, `enableOfflineQueue: false`).
- **Part C — Docker/Compose deep dive:** 4-stage Dockerfile (base/dependencies/builder/runner) and why the final image excludes the build toolchain, non-root `USER nextjs`, `HEALTHCHECK` hitting the real `/api/health` readiness endpoint (not just process liveness), Compose `depends_on` with `service_completed_successfully` vs `service_healthy`, and `KAFKA_LISTENERS` vs `KAFKA_ADVERTISED_LISTENERS` (internal Docker DNS vs host-visible address — same class of problem as the Session 9 Vercel incident).
- **Learner Gaps:** Two prior checkpoints (Session 9 fallback-loop question, Session 10 nullable-`Done.output` question) remain unanswered — flagged as recurring/spaced-repetition items.
- **Next Session Focus:** Resume roadmap — remainder of Kafka deep dive (Session 12: partitions/consumer groups/offsets/lag), then Redis Lua-script drills already partially covered here, then Next.js App Router (explicitly deferred), then back to the outstanding Vercel Redpanda Cloud + Redis Cloud provisioning task.

## Session 12 — Full backend scan → master reference document
- **Route:** Basic to Interview, Phase 2 (learner-directed)
- **Request:** Scan the entire backend and produce one very detailed master explanation, in chat and stored in the notes file.
- **Concepts Taught:** Config fail-fast validation (`required`/`positiveInt`/`bool`/SASL pairing); readiness caching + in-flight probe dedup (thundering herd); singleton connection lifecycle for Redis/Kafka; `acks:-1` + idempotent producer + `allowAutoTopicCreation:false`; admin topic-existence probe vs TCP liveness; the five ordered API gates and why infra precedes rate limit; replay route input validation before key construction; Zustand reducer pattern (`apply` switch over the discriminated union); `force-dynamic`/`no-store` on the health route; full failure-mode table mapping every failure to what the user sees.
- **Artifacts:** "MASTER DEEP DIVE — Full Backend Scan (Session 12)" appended to `imp notes.md` — file map, 10 layers, master flowchart, failure table, interview answer set.
- **Learner Gaps:** Three checkpoints now open (S9 fallback-loop, S10 nullable-output, S11/12 Kafka-fail-mid-run walkthrough) — spaced repetition due.
- **Next Session Focus:** Learner to answer at least one open checkpoint; then Kafka consumer-side deep dive (partitions/consumer groups/offsets/lag) or Vercel Redpanda/Redis Cloud provisioning.

## Session 13 — Rate-limit algorithm deep dive + what is Lua
- **Route:** Basic to Interview, Phase 2
- **Prerequisite Check:** Learner asked "what are we rate limiting here," then "what algo is used," then genuinely didn't know what Lua was as a language — real gap, backed off to plain-English decomposition per the complexity-decomposition process.
- **Concepts Taught:** Two separate rate limits (`RUN_RATE_LIMIT` per-client-IP vs `MODEL_RATE_LIMIT` per-role-model, shared globally); fixed-window counter algorithm walked through with concrete numbers; boundary-burst weakness; why INCR+EXPIRE must be atomic (crash/race leaves a counter stuck with no TTL); what Lua actually is (embedded scripting language inside Redis, executed server-side as one atomic unit); `redis.call`, `KEYS`/`ARGV` convention; `client.eval(script, numKeys, ...args)` from ioredis.
- **Checkpoint Asked:** If `EXPIRE` ran after every `INCR` (not just count===1), what breaks? **Answered correctly** — learner identified the TTL-reset mechanism; corrected/extended to the sharper consequence: the client could become PERMANENTLY rate-limited since count never resets to 0 as long as they keep sending any requests.
- **Learner Gaps:** None new — Lua-as-a-language gap resolved this session.
- **Next Session Focus:** Learner asked "what's left to learn" — summarized full remaining roadmap.

## Session 14 — DAG wave scheduling + Redis integration testing
- **Route:** Basic to Interview, Phase 2
- **Prerequisite Check:** Learner explicitly chose: drop Kafka for now, focus on Redis, cover "rest of project's DAG waves etc whatever left." Confirmed local Redis container already running.
- **Concepts Taught:** Topological/wave-based DAG scheduling (`nextWave`/`planWaves`), why "tasks remain but none ready" doubles as cycle detection without a dedicated algorithm, why an LLM-produced plan specifically needs this runtime guard; unit test vs integration test distinction; Vitest syntax (`describe`/`it`/`expect`/`toBe`/`toEqual`/`.rejects.toThrow`/`beforeEach`/`afterAll`); why tests need unique per-test keys to avoid shared-mutable-state flakiness; how the Redis integration tests directly verify the count===1 TTL-guard checkpoint and the session.ts idempotency/stale-sequence guards against REAL Redis, not mocks.
- **Implementation Work:** Installed `vitest`; extracted `src/lib/swarm/dagSchedule.ts` (pure `nextWave`/`planWaves`) out of `orchestrator.ts`'s inline closure, behavior-preserving (typecheck clean); added `dagSchedule.test.ts` (7 tests) and `redis.integration.test.ts` (8 tests) — all 15 passing; added `pnpm test` script.
- **Checkpoint Asked:** If the session.ts Lua guard used `current > sequence` instead of `current >= sequence`, would the stale-sequence test still pass? Walk through `current`/`sequence` values at that moment. — not yet answered.
- **Learner Gaps:** Two older checkpoints (S9 fallback chain, S10 nullable output) still open; new S14 checkpoint added to the queue.
- **Next Session Focus:** Kafka intentionally deferred per learner request. Remaining: reliable orchestration architecture, observability/cost/security, DevOps/deployment (blocked on Vercel Redpanda+Redis Cloud signups), Next.js session (deferred to very end), senior interview prep (last).

## Session 13 — Placement handbook and interview mastery artifact
- **Route:** Basic to Interview, architecture-first, fast pacing.
- **Request:** Convert the full project and learning history into one professional placement PDF with separate frontend/backend modules, detailed flowcharts, hard code in easy words, production reasoning, cliché questions, and researched interview themes.
- **Repository Audit:** Re-verified the current client, API routes, EventBus, DAG orchestrator, AI wrappers, Zod schemas, Redis clients/Lua, Kafka producer/readiness, Dockerfile, Compose topology, package versions, and existing notes before writing.
- **Frontend Modules:** React/Next client boundaries; Fetch/Web Streams/SSE/AbortController; Zustand event projection; React Flow layout and performance.
- **Backend Modules:** Route gates/readiness; EventBus ordering/dual delivery; DAG waves/blackboard/validation; AI SDK/OpenRouter/Zod/TypeScript; Redis algorithms/session Lua; Kafka semantics/topology/consumer boundary.
- **Production Modules:** Docker/Compose; failure matrix/outbox/cancellation; security/testing/observability/performance/100× design.
- **Interview Modules:** Project introductions, 100+ embedded and cliché Q&A prompts, twelve senior scenarios, mock interview, glossary, seven-day route, last-day sheet, and 95+ self-rating rubric.
- **Research:** Used official Next.js, MDN, TypeScript, React, Zod, AI SDK, OpenRouter, Redis, Kafka/KafkaJS, and Docker documentation. Used LeetCode Discuss, Naukri Code360, and GeeksforGeeks only for recurring interview themes. Firecrawl was unavailable because the configured account had zero remaining credits, so direct web research was used as explicitly requested.
- **Accuracy Corrections:** Live events are not durable-before-visible; browser replay and backend cancellation are not implemented; Kafka has no consumer; no end-to-end exactly-once; local RF1/single Redis are not HA; validator/retry degradation and the ineffective `shouldFallback` condition are documented.
- **Artifacts:** `Murmur_Placement_Handbook.md`, print HTML, 35-page A4 PDF, CSS, and six custom SVG flowcharts under `docs/placement-handbook/assets/`.
- **Verification:** Headless Chrome PDF render; visual inspection of opening/TOC, sampled frontend/backend/Redis/Kafka/production pages, glossary, source list, and final rubric; no sampled clipping or blank page.
- **Open Recall Checkpoints:** S9 fallback policy, S10 runtime nullable/invalid output, S12 Kafka event 7/20. These are included in Module 18 for spaced repetition.
- **Next Session Focus:** Learner delivers the 30-second introduction and answers one open checkpoint aloud before moving to Kafka consumer implementation or managed Redpanda/Redis provisioning.
