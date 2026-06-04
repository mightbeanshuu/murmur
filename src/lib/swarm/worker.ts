import { streamText } from "ai";
import { models } from "./models";
import type { EventBus } from "./bus";
import type { SwarmTask } from "./types";

const SYSTEM: Record<SwarmTask["type"], string> = {
  researcher:
    "You are a Researcher agent. Produce a dense, well-structured briefing: key facts, " +
    "landscape, players, and concrete specifics. Use markdown with tight bullets. No fluff.",
  analyst:
    "You are an Analyst agent. Reason rigorously: compare options, weigh trade-offs, quantify " +
    "where possible, and state clear recommendations with justification. Use markdown.",
  writer:
    "You are a Writer agent. Produce polished, persuasive prose for the assigned section. " +
    "Clear structure, strong voice, concrete detail. Use markdown.",
  coder:
    "You are a Coder agent. Produce correct, idiomatic, well-commented code or a precise " +
    "technical spec. Use fenced code blocks. Be concrete and runnable where possible.",
};

export interface WorkerResult {
  output: string;
  feedbackApplied?: string;
}

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
): Promise<string> {
  bus.emit({ kind: "agent.status", id: agentId, status: feedback ? "retrying" : "thinking" });

  const blackboard = deps.length
    ? "\n\n## Upstream results you must build on:\n" +
      deps.map((d) => `### ${d.title}\n${d.output}`).join("\n\n")
    : "";

  const revision = feedback
    ? `\n\n## Validator feedback to fix on this revision:\n${feedback}`
    : "";

  const result = streamText({
    model: models.worker,
    system: SYSTEM[task.type],
    prompt: `Task: ${task.title}\n\n${task.brief}${blackboard}${revision}`,
  });

  bus.emit({ kind: "agent.status", id: agentId, status: "streaming" });
  let output = "";
  for await (const delta of result.textStream) {
    output += delta;
    bus.emit({ kind: "agent.token", id: agentId, delta });
  }
  return output;
}
