import { GoalBar } from "@/components/GoalBar";
import { SwarmGraph } from "@/components/SwarmGraph";
import { SidePanel } from "@/components/SidePanel";
import { RecentRuns } from "@/components/RecentRuns";
import { UserMenu } from "@/components/UserMenu";
import { SystemStatus } from "@/components/SystemStatus";
import { BillingControls } from "@/components/BillingControls";
import { auth } from "@/lib/auth";
import { getUserPlan } from "@/lib/billing/repository";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  const [plan, query] = await Promise.all([getUserPlan(session.user.id), searchParams]);

  return (
    <main className="murmur-app">
      <header className="murmur-header">
        <div className="murmur-brand">
          <span className="murmur-logo">✺</span>
          <div>
            <h1>Murmur</h1>
            <p>An agent swarm that plans, delegates, validates, and synthesizes — live.</p>
          </div>
        </div>
        <div className="murmur-header-actions">
          <SystemStatus />
          <BillingControls plan={plan} />
          <a className="murmur-gh" href="https://github.com/mightbeanshuu/murmur" target="_blank" rel="noreferrer">
            Agent Swarms · Microsoft Build AI 2026
          </a>
          <UserMenu name={session.user.name} email={session.user.email} />
        </div>
      </header>

      {query.billing === "success" ? (
        <div className="murmur-billing-notice is-success">
          Payment received. Pro activates as soon as Stripe confirms the subscription.
        </div>
      ) : query.billing === "cancelled" ? (
        <div className="murmur-billing-notice">Checkout cancelled — your plan was not changed.</div>
      ) : null}

      <GoalBar />

      <section className="murmur-stage">
        <RecentRuns />
        <div className="murmur-graph">
          <SwarmGraph />
        </div>
        <SidePanel />
      </section>
    </main>
  );
}
