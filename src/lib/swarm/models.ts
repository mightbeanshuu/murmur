import { anthropic } from "@ai-sdk/anthropic";

// Model roles are env-configurable so judges can swap in whatever they have a key for.
// Defaults target the current Claude family (Opus 4.8 / Sonnet 4.6 / Haiku 4.5).
const PLANNER = process.env.MURMUR_PLANNER_MODEL ?? "claude-opus-4-8";
const WORKER = process.env.MURMUR_WORKER_MODEL ?? "claude-sonnet-4-6";
const VALIDATOR = process.env.MURMUR_VALIDATOR_MODEL ?? "claude-haiku-4-5-20251001";

export const models = {
  planner: anthropic(PLANNER),
  worker: anthropic(WORKER),
  validator: anthropic(VALIDATOR),
  synthesizer: anthropic(PLANNER),
};

export const MODEL_NAMES = { PLANNER, WORKER, VALIDATOR };
