"use client";

import { useState } from "react";
import { useSwarm } from "@/lib/store";
import { useRunSwarm } from "@/lib/useRunSwarm";

const EXAMPLES = [
  "Create a go-to-market strategy for an AI code-review startup",
  "Design a scalable architecture for a real-time multiplayer game",
  "Write an investor-ready brief on the agentic AI market in 2026",
  "Plan and spec a personal finance app with AI insights",
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
    <div className="murmur-goalbar">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(goal);
        }}
        className="murmur-goalform"
      >
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Give the swarm a complex goal…"
          className="murmur-input"
          disabled={busy}
        />
        <button type="submit" className="murmur-run" disabled={busy || goal.trim().length < 4}>
          {busy ? "Swarming…" : "Deploy swarm"}
        </button>
      </form>
      <div className="murmur-examples">
        {EXAMPLES.map((ex) => (
          <button key={ex} className="murmur-chip" onClick={() => submit(ex)} disabled={busy}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
