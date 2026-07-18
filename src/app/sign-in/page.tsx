import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AuthForm } from "@/components/AuthForm";
import { auth } from "@/lib/auth";
import { MurmurBrand } from "@/components/ui/Brand";
import {
  AgentIcon,
  ArrowUpRightIcon,
  CheckIcon,
  GitHubIcon,
  RadioIcon,
} from "@/components/ui/Icons";

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");

  return (
    <main className="murmur-auth-page">
      <section className="murmur-auth-showcase" aria-labelledby="murmur-auth-title">
        <div className="murmur-auth-showcase-top">
          <MurmurBrand tagline="Live agent swarm orchestration" />
          <a
            className="murmur-auth-source"
            href="https://github.com/mightbeanshuu/murmur"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon size={17} />
            GitHub
            <ArrowUpRightIcon size={15} />
          </a>
        </div>

        <div className="murmur-auth-story">
          <div className="murmur-live-label">
            <RadioIcon size={15} />
            Durable orchestration, visible live
          </div>
          <h1 id="murmur-auth-title">One ambitious goal. A swarm that proves its work.</h1>
          <p>
            Murmur plans the work, runs specialists in parallel, validates their output, and
            synthesizes one usable result—while you watch the complete execution graph unfold.
          </p>
        </div>

        <div className="murmur-auth-graph" aria-label="Example agent swarm flow">
          <div className="murmur-auth-node is-planner">
            <AgentIcon type="planner" size={17} />
            <span>Planner</span>
            <small>Task graph ready</small>
          </div>
          <span className="murmur-auth-edge is-one" />
          <span className="murmur-auth-edge is-two" />
          <div className="murmur-auth-node is-research">
            <AgentIcon type="researcher" size={17} />
            <span>Research</span>
            <small>Running</small>
          </div>
          <div className="murmur-auth-node is-analysis">
            <AgentIcon type="analyst" size={17} />
            <span>Analysis</span>
            <small>Running</small>
          </div>
          <span className="murmur-auth-edge is-three" />
          <span className="murmur-auth-edge is-four" />
          <div className="murmur-auth-node is-synthesis">
            <AgentIcon type="synthesizer" size={17} />
            <span>Synthesis</span>
            <small>Waiting on 2 agents</small>
          </div>
        </div>

        <ul className="murmur-auth-proof">
          <li><CheckIcon size={15} /> Temporal durability</li>
          <li><CheckIcon size={15} /> Redis replay</li>
          <li><CheckIcon size={15} /> Validated output</li>
        </ul>
      </section>

      <section className="murmur-auth-entry" aria-label="Murmur account access">
        <AuthForm />
        <p className="murmur-auth-footnote">Secure sessions powered by Better Auth. Payments stay on Stripe.</p>
      </section>
    </main>
  );
}
