"use client";

import { useState } from "react";
import type { BillingPlan } from "@/lib/billing/plans";

export function BillingControls({ plan }: { plan: BillingPlan }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openBilling() {
    setLoading(true);
    setError("");
    try {
      const endpoint = plan === "pro" ? "/api/billing/portal" : "/api/billing/checkout";
      const response = await fetch(endpoint, { method: "POST" });
      const body = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error ?? "Unable to open billing.");
      window.location.assign(body.url);
    } catch (billingError) {
      setError((billingError as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="murmur-billing">
      <span className={`murmur-plan is-${plan}`}>{plan}</span>
      <span className="murmur-plan-copy">{plan === "pro" ? "100 runs/hr" : "10 runs/hr"}</span>
      <button onClick={openBilling} disabled={loading}>
        {loading ? "Opening…" : plan === "pro" ? "Manage billing" : "Upgrade to Pro"}
      </button>
      {error ? <span className="murmur-billing-error" title={error}>Billing unavailable</span> : null}
    </div>
  );
}
