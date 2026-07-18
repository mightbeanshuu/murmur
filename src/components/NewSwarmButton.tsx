"use client";

import { useSwarm } from "@/lib/store";
import { PlusIcon } from "./ui/Icons";

export function NewSwarmButton() {
  const runStatus = useSwarm((state) => state.runStatus);
  const goHome = useSwarm((state) => state.goHome);
  const running = runStatus === "running";

  return (
    <button
      className="murmur-icon-link murmur-new-swarm"
      type="button"
      disabled={running}
      title={running ? "Wait for the active swarm to finish" : "Start a new swarm"}
      onClick={() => {
        if (runStatus !== "idle") goHome();
        window.requestAnimationFrame(() => {
          document.querySelector<HTMLTextAreaElement>('[aria-label="Swarm goal"]')?.focus();
        });
      }}
    >
      <PlusIcon size={16} />
      <span>New swarm</span>
    </button>
  );
}
