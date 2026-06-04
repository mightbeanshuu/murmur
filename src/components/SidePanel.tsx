"use client";

import { useSwarm } from "@/lib/store";
import { AGENT_META } from "@/lib/swarm/types";
import { Markdown } from "./Markdown";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="murmur-stat">
      <span className="murmur-stat-val">{value}</span>
      <span className="murmur-stat-label">{label}</span>
    </div>
  );
}

export function SidePanel() {
  const { agents, selected, planSummary, planThinking, final, stats, runStatus, error } = useSwarm();
  const agent = selected ? agents[selected] : null;

  return (
    <aside className="murmur-side">
      {error && <div className="murmur-error">⚠ {error}</div>}

      {agent ? (
        <>
          <div className="murmur-side-head">
            <span style={{ color: AGENT_META[agent.agentType].color }}>
              {AGENT_META[agent.agentType].emoji} {AGENT_META[agent.agentType].label}
            </span>
            <h3>{agent.title}</h3>
            {agent.score != null && (
              <div className="murmur-verdict">
                Validator: <strong>{agent.score}/10</strong>
                {agent.feedback && <p>{agent.feedback}</p>}
              </div>
            )}
          </div>
          <div className="murmur-scroll">
            {agent.output ? <Markdown>{agent.output}</Markdown> : <p className="murmur-muted">Waiting for output…</p>}
          </div>
        </>
      ) : (
        <>
          <div className="murmur-side-head">
            <span className="murmur-kicker">
              {runStatus === "running" ? "Swarm is working…" : runStatus === "done" ? "Final deliverable" : "Plan"}
            </span>
            {planSummary && <h3>{planSummary}</h3>}
          </div>

          {stats && (
            <div className="murmur-stats">
              <Stat label="agents" value={String(Object.keys(agents).length - 2)} />
              <Stat label="time" value={`${(stats.ms / 1000).toFixed(1)}s`} />
              <Stat label="tokens≈" value={`${((stats.tokensIn + stats.tokensOut) / 1000).toFixed(1)}k`} />
            </div>
          )}

          <div className="murmur-scroll">
            {final ? (
              <Markdown>{final}</Markdown>
            ) : runStatus === "running" ? (
              <div className="murmur-thinking">
                <p className="murmur-muted">Planner is decomposing the goal…</p>
                {planThinking && <p className="murmur-plan-think">{planThinking}</p>}
              </div>
            ) : (
              <p className="murmur-muted">
                Give the swarm a goal. The planner will decompose it into a DAG of specialist
                agents that run in parallel, validate each other&apos;s work, and synthesize a final
                answer. Click any node to watch it think.
              </p>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
