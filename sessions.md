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
