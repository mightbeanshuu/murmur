"use client";

import { useState } from "react";
import { useSwarm } from "@/lib/store";
import { useRunSwarm } from "@/lib/useRunSwarm";
import { AgentIcon, RocketIcon, SparklesIcon } from "./ui/Icons";

const EXAMPLES = [
  { label: "Go-to-market plan", goal: "Create a go-to-market strategy for an AI code-review startup" },
  { label: "System architecture", goal: "Design a scalable architecture for a real-time multiplayer game" },
  { label: "Market brief", goal: "Write an investor-ready brief on the agentic AI market in 2026" },
  { label: "Product specification", goal: "Plan and spec a personal finance app with AI insights" },
];

export function GoalBar() {
  const [goal, setGoal] = useState("");
  const run = useRunSwarm();
  const runStatus = useSwarm((s) => s.runStatus);
  const busy = runStatus === "running";

  const submit = (g: string) => {
    const v = g.trim();
    if (v.length < 4 || busy) return;
    setGoal(v);
    run(v);
  };

  return (
    <section
      className={`murmur-goalbar${busy ? " is-live" : ""}`}
      aria-labelledby="murmur-goal-title"
    >
      <div className="murmur-goalbar-head">
        <div>
          <span className="murmur-section-icon"><SparklesIcon size={16} /></span>
          <div>
            <h2 id="murmur-goal-title">What should the swarm solve?</h2>
            <p>Give it a complex outcome. Murmur will plan the path and verify the work.</p>
          </div>
        </div>
        <span className={`murmur-key-hint${busy ? " is-live" : ""}`} aria-live="polite">
          {busy ? "Live orchestration" : "⌘ ↵ to deploy"}
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(goal);
        }}
        className="murmur-goalform"
      >
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submit(goal);
            }
          }}
          placeholder="e.g. Design a launch strategy, pressure-test the assumptions, and deliver a 30-day execution plan…"
          className="murmur-input"
          disabled={busy}
          rows={2}
          maxLength={2000}
          aria-label="Swarm goal"
        />
        <button type="submit" className="murmur-primary-button murmur-deploy" disabled={busy || goal.trim().length < 4}>
          {busy ? <><span className="murmur-button-loader" />Swarming…</> : <><RocketIcon size={18} />Deploy swarm</>}
        </button>
      </form>
      <div className="murmur-goalbar-foot">
        <div className="murmur-examples" aria-label="Example goals">
        {EXAMPLES.map((ex) => (
          <button key={ex.label} className="murmur-chip" onClick={() => setGoal(ex.goal)} disabled={busy} type="button">
            {ex.label}
          </button>
        ))}
        </div>
        <div
          className={`murmur-pipeline${busy ? " is-live" : ""}`}
          aria-label="Swarm execution phases"
        >
          <span><AgentIcon type="planner" size={14} />Plan</span>
          <i />
          <span><AgentIcon type="researcher" size={14} />Execute</span>
          <i />
          <span><AgentIcon type="validator" size={14} />Validate</span>
          <i />
          <span><AgentIcon type="synthesizer" size={14} />Synthesize</span>
        </div>
      </div>
    </section>
  );
}
