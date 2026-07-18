import { getRequestSession } from "@/lib/auth";
import { getBillingState } from "@/lib/billing/repository";
import { getAppUrl, getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getRequestSession(req);
  if (!session) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const billing = await getBillingState(session.user.id);
    if (!billing.customerId) {
      return Response.json({ error: "No billing account exists yet." }, { status: 404 });
    }

    const portal = await getStripe().billingPortal.sessions.create({
      customer: billing.customerId,
      return_url: getAppUrl(),
    });
    return Response.json({ url: portal.url });
  } catch (error) {
    console.error("Unable to create Stripe Customer Portal session", error);
    return Response.json({ error: "Billing is temporarily unavailable." }, { status: 503 });
  }
}
