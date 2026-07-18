"use client";

import { useSwarm } from "@/lib/store";
import { AGENT_META } from "@/lib/swarm/types";
import { Markdown } from "./Markdown";
import { AgentIcon, SparklesIcon, WarningIcon } from "./ui/Icons";

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
      {error && <div className="murmur-error" role="alert"><WarningIcon size={17} /><span>{error}</span></div>}

      {agent ? (
        <>
          <div className="murmur-side-head">
            <span style={{ color: AGENT_META[agent.agentType].color }} className="murmur-side-label">
              <AgentIcon type={agent.agentType} size={15} /> {AGENT_META[agent.agentType].label}
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
            {agent.output ? <Markdown>{agent.output}</Markdown> : (
              <div className="murmur-empty-output">
                <span><AgentIcon type={agent.agentType} size={20} /></span>
                <p>Waiting for this agent&apos;s first output…</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="murmur-side-head">
            <span className="murmur-side-label">
              <SparklesIcon size={15} />
              {runStatus === "running" ? "Swarm in progress" : runStatus === "done" ? "Final deliverable" : "Run briefing"}
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
              <div className="murmur-empty-output">
                <span><SparklesIcon size={20} /></span>
                <h4>Your result will land here</h4>
                <p>
                  Deploy a goal to generate a task graph. Select any node to inspect its live work,
                  or stay here for the synthesized deliverable.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
