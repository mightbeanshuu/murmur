"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import { AGENT_META, type AgentStatus, type AgentType } from "@/lib/swarm/types";

export interface FlowNodeData {
  agentType: AgentType;
  title: string;
  status: AgentStatus;
  score?: number;
  preview: string;
  selected: boolean;
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "idle",
  thinking: "thinking",
  streaming: "working",
  validating: "in review",
  retrying: "revising",
  done: "done",
  failed: "failed",
};

const STATUS_DOT: Record<AgentStatus, string> = {
  idle: "#52525b",
  thinking: "#fbbf24",
  streaming: "#38bdf8",
  validating: "#fb7185",
  retrying: "#f59e0b",
  done: "#34d399",
  failed: "#ef4444",
};

const active = (s: AgentStatus) =>
  s === "thinking" || s === "streaming" || s === "validating" || s === "retrying";

export function AgentFlowNode({ data }: NodeProps<FlowNodeData>) {
  const meta = AGENT_META[data.agentType];
  const live = active(data.status);
  return (
    <div
      className="murmur-node"
      style={{
        borderColor: data.selected ? meta.color : "rgba(255,255,255,0.08)",
        boxShadow: live
          ? `0 0 0 1px ${meta.color}55, 0 0 24px ${meta.color}33`
          : data.selected
            ? `0 0 0 1px ${meta.color}aa`
            : "0 1px 2px rgba(0,0,0,0.4)",
      }}
    >
      <Handle type="target" position={Position.Top} className="murmur-handle" />
      <div className="murmur-node-head">
        <span className="murmur-emoji" style={{ background: `${meta.color}22` }}>
          {meta.emoji}
        </span>
        <div className="murmur-node-titles">
          <span className="murmur-node-type" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="murmur-node-title">{data.title}</span>
        </div>
        {data.score != null && (
          <span className="murmur-score" title="Validator score">
            {data.score}/10
          </span>
        )}
      </div>

      <div className="murmur-status">
        <span
          className="murmur-dot"
          style={{
            background: STATUS_DOT[data.status],
            animation: live ? "murmur-pulse 1.1s ease-in-out infinite" : "none",
          }}
        />
        {STATUS_LABEL[data.status]}
      </div>

      {data.preview && <div className="murmur-preview">{data.preview}</div>}
      <Handle type="source" position={Position.Bottom} className="murmur-handle" />
    </div>
  );
}
