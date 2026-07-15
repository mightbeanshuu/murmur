# Murmur Learning Progress

## Session 3 startup
- Read `sessions.md`, `progress.md`, `README.md`, and `package.json`.
- Scanned project file list with `rg --files`.
- Read streaming/UI path files:
  - `src/lib/swarm/types.ts`
  - `src/lib/swarm/bus.ts`
  - `src/app/api/swarm/route.ts`
  - `src/lib/store.ts`
  - `src/lib/useRunSwarm.ts`
  - `src/components/SwarmGraph.tsx`
  - `src/components/SidePanel.tsx`
  - `src/app/page.tsx`
- Selected Session 3 topic: SSE event pipeline from backend swarm events to live graph UI.

## Interview revision request
- User asked to explain project mapping files, important code blocks, senior-interview concepts, medium/hard questions with answers, Next.js/TypeScript fundamentals, and production/token tradeoffs.
- Read:
  - `src/lib/swarm/planner.ts`
  - `src/lib/swarm/orchestrator.ts`
  - `src/lib/swarm/worker.ts`
  - `src/lib/swarm/validator.ts`

## Teaching continuation
- Continued from build-from-zero roadmap.
- Focus: first commands, first folders/files, Next.js/TypeScript basics, and explaining why the swarm backend should be built before UI.

## Session 4 Zod explanation
- User asked to explain Zod using the tutor skill.
- Read `tech-learning-tutor` skill instructions.
- Scanned repo for Zod usage with `rg`.
- Read:
  - `src/lib/swarm/planner.ts`
  - `src/lib/swarm/validator.ts`
  - `src/lib/swarm/run.ts`
  - `src/lib/swarm/types.ts`
  - `src/lib/swarm/orchestrator.ts`
- Finding: Zod is used as the runtime contract for structured LLM outputs in planner and validator flows.

## Production upgrade: Kafka and Redis
- User requested production-level upgrades and a PR.
- Read:
  - `package.json`
  - `src/lib/swarm/bus.ts`
  - `src/app/api/swarm/route.ts`
  - `src/lib/swarm/run.ts`
  - `src/lib/swarm/models.ts`
  - `README.md`
- Added dependencies: `kafkajs`, `ioredis`.
- Added optional Kafka publisher for swarm events.
- Added optional Redis fixed-window rate limiter for run starts and model attempts.
- Added `.env.example` documenting OpenRouter, Kafka, and Redis settings.
