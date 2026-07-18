import { runText } from "./run";
import type { EventBus } from "./bus";
import type { SwarmMode, SwarmTask } from "./types";
import { executionPolicy } from "./executionMode";
import { boundContext, boundContextSections, contextBudgetFor } from "./tokenBudget";

const BREVITY = " Be concise and high-signal: ~250-350 words. No preamble or filler.";

// Record<SwarmTask["type"], string> forces every worker type to have a prompt.
// If a new worker type is added later, TypeScript will catch a missing prompt.
const SYSTEM: Record<SwarmTask["type"], string> = {
  researcher:
    "You are a Researcher agent. Produce a dense, well-structured briefing: key facts, " +
    "landscape, players, and concrete specifics. Use markdown with tight bullets. No fluff." +
    BREVITY,
  analyst:
    "You are an Analyst agent. Reason rigorously: compare options, weigh trade-offs, quantify " +
    "where possible, and state clear recommendations with justification. Use markdown." +
    BREVITY,
  writer:
    "You are a Writer agent. Produce polished, persuasive prose for the assigned section. " +
    "Clear structure, strong voice, concrete detail. Use markdown." +
    BREVITY,
  coder:
    "You are a Coder agent. Produce correct, idiomatic, well-commented code or a precise " +
    "technical spec. Use fenced code blocks. Be concrete and runnable where possible." +
    BREVITY,
};

/**
 * Runs one task. `deps` is the shared-blackboard context: outputs of upstream tasks.
 * `feedback` is non-empty on a retry after the validator rejected the first attempt.
 */
export async function runWorker(
  agentId: string,
  task: SwarmTask,
  deps: { title: string; output: string }[],
  bus: EventBus,
  feedback?: string,
  signal?: AbortSignal,
  mode: SwarmMode = "auto",
): Promise<string> {
  bus.emit({ kind: "agent.status", id: agentId, status: feedback ? "retrying" : "thinking" });

  const budget = contextBudgetFor(mode);

  // Shared-blackboard prompt injection: downstream workers receive dependency
  // outputs so they can build on prior work instead of starting cold.
  const blackboard = deps.length
    ? "\n\n## Upstream results you must build on:\n" +
      boundContextSections(
        deps.map((dependency) => ({
          heading: `### ${dependency.title}`,
          body: dependency.output,
        })),
        budget.dependencyChars,
      )
    : "";
  const revision = feedback
    ? `\n\n## Validator feedback to fix on this revision:\n${boundContext(feedback, budget.revisionChars)}`
    : "";

  let started = false;
  const { text } = await runText("worker", {
    system: [SYSTEM[task.type], executionPolicy(mode).workerDirective].filter(Boolean).join("\n\n"),
    prompt: `Task: ${task.title}\n\n${task.brief}${blackboard}${revision}`,
    onDelta: (delta) => {
      if (!started) {
        started = true;
        // The first streamed token marks the agent as visibly active in the UI.
        bus.emit({ kind: "agent.status", id: agentId, status: "streaming" });
      }
      // Each token delta is streamed to the frontend through SSE.
      bus.emit({ kind: "agent.token", id: agentId, delta });
    },
    signal,
  });
  return text;
}
