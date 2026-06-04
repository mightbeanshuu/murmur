import { streamObject } from "ai";
import { z } from "zod";
import { models } from "./models";
import type { EventBus } from "./bus";
import type { SwarmPlan } from "./types";

const planSchema = z.object({
  summary: z.string().describe("One-sentence read of the goal and the strategy to solve it."),
  tasks: z
    .array(
      z.object({
        id: z.string().describe("Short stable id, e.g. 't1'."),
        type: z
          .enum(["researcher", "analyst", "writer", "coder"])
          .describe("Which specialist agent should own this task."),
        title: z.string().describe("3-6 word task name shown on the graph node."),
        brief: z.string().describe("Clear, self-contained instruction for the worker agent."),
        dependsOn: z
          .array(z.string())
          .describe("Ids of tasks whose output this task needs. Empty for root tasks."),
      }),
    )
    .min(2)
    .max(7),
  synthesisBrief: z
    .string()
    .describe("How to fuse all worker outputs into one polished final deliverable."),
});

const SYSTEM = `You are the Planner of an autonomous agent swarm.
Decompose the user's goal into a small DAG (2-7 tasks) of specialist subtasks that
together fully solve it. Maximize PARALLELISM: independent tasks should have no
dependencies so they run at the same time. Only add a dependency when a task
genuinely needs another's output. Each task must be self-contained and assigned to
the best-fit specialist: researcher (gather/structure knowledge), analyst (reason,
compare, evaluate trade-offs), writer (produce prose/sections), coder (produce code
or technical specs). Keep the graph tight — no redundant tasks.`;

export async function plan(goal: string, bus: EventBus): Promise<SwarmPlan> {
  bus.emit({ kind: "plan.start" });

  const result = streamObject({
    model: models.planner,
    schema: planSchema,
    system: SYSTEM,
    prompt: `Goal:\n${goal}`,
  });

  // Stream the planner's partial thinking into the UI for liveness.
  let lastLen = 0;
  for await (const partial of result.partialObjectStream) {
    const text = partial.summary ?? "";
    if (text.length > lastLen) {
      bus.emit({ kind: "plan.token", delta: text.slice(lastLen) });
      lastLen = text.length;
    }
  }

  const object = await result.object;
  const plan: SwarmPlan = { goal, ...object };
  bus.emit({ kind: "plan.done", plan });
  return plan;
}
