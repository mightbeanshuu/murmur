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
import { MurmurBrand } from "@/components/ui/Brand";
import { CheckIcon, GitHubIcon, WarningIcon } from "@/components/ui/Icons";

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
        <MurmurBrand tagline="Live agent swarm orchestration" />
        <div className="murmur-header-actions">
          <SystemStatus />
          <BillingControls plan={plan} />
          <a
            aria-label="View Murmur source on GitHub"
            className="murmur-icon-link"
            href="https://github.com/mightbeanshuu/murmur"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon size={17} />
            <span>Source</span>
          </a>
          <UserMenu name={session.user.name} email={session.user.email} />
        </div>
      </header>

      {query.billing === "success" ? (
        <div className="murmur-billing-notice is-success">
          <CheckIcon size={16} />
          <span>Payment received. Pro activates as soon as Stripe confirms the subscription.</span>
        </div>
      ) : query.billing === "cancelled" ? (
        <div className="murmur-billing-notice">
          <WarningIcon size={16} />
          <span>Checkout cancelled. Your plan was not changed.</span>
        </div>
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
