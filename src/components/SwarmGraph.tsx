"use client";

import { useMemo } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { useSwarm, type AgentNode } from "@/lib/store";
import { AgentFlowNode, type FlowNodeData } from "./AgentFlowNode";

const nodeTypes = { agent: AgentFlowNode };

const COL = 300;
const ROW = 150;

/** Longest-path layering so dependencies always flow downward. */
function layout(agents: Record<string, AgentNode>): Record<string, { x: number; y: number }> {
  const depth: Record<string, number> = {};
  const get = (id: string): number => {
    if (depth[id] != null) return depth[id];
    const a = agents[id];
    if (!a) return 0;
    if (a.agentType === "planner") return (depth[id] = 0);
    if (a.agentType === "synthesizer") return (depth[id] = 0); // fixed up below
    const deps = a.dependsOn.map((d) => `agent-${d}`).filter((d) => agents[d]);
    depth[id] = deps.length ? 1 + Math.max(...deps.map(get)) : 1;
    return depth[id];
  };
  Object.keys(agents).forEach((id) => {
    if (agents[id].agentType !== "validator") get(id);
  });

  const workerDepths = Object.entries(agents)
    .filter(([, a]) => a.agentType !== "planner" && a.agentType !== "validator" && a.agentType !== "synthesizer")
    .map(([id]) => depth[id] ?? 1);
  const maxWorker = workerDepths.length ? Math.max(...workerDepths) : 1;

  Object.entries(agents).forEach(([id, a]) => {
    if (a.agentType === "synthesizer") depth[id] = maxWorker + 1;
  });

  // Bucket by depth and spread vertically, centered.
  const byDepth: Record<number, string[]> = {};
  Object.entries(agents).forEach(([id, a]) => {
    if (a.agentType === "validator") return;
    const d = depth[id] ?? 1;
    (byDepth[d] ??= []).push(id);
  });

  const pos: Record<string, { x: number; y: number }> = {};
  const maxDepth = Math.max(0, ...Object.keys(byDepth).map(Number));
  Object.entries(byDepth).forEach(([d, ids]) => {
    ids.forEach((id, i) => {
      pos[id] = { x: Number(d) * COL, y: (i - (ids.length - 1) / 2) * ROW };
    });
  });
  // Validator parked to the right, mid-graph.
  pos["validator"] = { x: (maxDepth + 1) * COL, y: -ROW };
  return pos;
}

const EDGE_COLOR: Record<string, string> = {
  assign: "#a78bfa",
  depends: "#64748b",
  review: "#fb7185",
  revise: "#f59e0b",
  result: "#c084fc",
  context: "#475569",
};

export function SwarmGraph() {
  const agents = useSwarm((s) => s.agents);
  const edges = useSwarm((s) => s.edges);
  const selected = useSwarm((s) => s.selected);
  const select = useSwarm((s) => s.select);

  const pos = useMemo(() => layout(agents), [agents]);

  const rfNodes: Node<FlowNodeData>[] = useMemo(
    () =>
      Object.values(agents).map((a) => {
        const clean = a.output.replace(/[#*`>_-]/g, " ").replace(/\s+/g, " ").trim();
        return {
          id: a.id,
          type: "agent",
          position: pos[a.id] ?? { x: 0, y: 0 },
          data: {
            agentType: a.agentType,
            title: a.title,
            status: a.status,
            score: a.score,
            preview: clean.length > 110 ? clean.slice(-110) : clean,
            selected: selected === a.id,
          },
          draggable: true,
        };
      }),
    [agents, pos, selected],
  );

  const rfEdges: Edge[] = useMemo(
    () =>
      edges
        .filter((e) => agents[e.source] && agents[e.target])
        .map((e) => {
          const liveTarget = ["thinking", "streaming", "validating", "retrying"].includes(
            agents[e.target]?.status,
          );
          const color = EDGE_COLOR[e.label] ?? "#475569";
          return {
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            animated: liveTarget,
            style: { stroke: color, strokeWidth: liveTarget ? 2 : 1.2, opacity: 0.8 },
            labelStyle: { fill: "#94a3b8", fontSize: 10 },
            labelBgStyle: { fill: "#0b0b14", fillOpacity: 0.7 },
            markerEnd: { type: MarkerType.ArrowClosed, color },
          };
        }),
    [edges, agents],
  );

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, n) => select(n.id)}
      onPaneClick={() => select(null)}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.2}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#1e293b" />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}
