import { getRequestSession } from "@/lib/auth";
import { getBillingState, saveStripeCustomer } from "@/lib/billing/repository";
import { PRO_SUBSCRIPTION_STATUSES } from "@/lib/billing/plans";
import { getAppUrl, getProPriceId, getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getRequestSession(req);
  if (!session) return Response.json({ error: "Authentication required." }, { status: 401 });

  try {
    const stripe = getStripe();
    const billing = await getBillingState(session.user.id);
    if (PRO_SUBSCRIPTION_STATUSES.has(billing.status)) {
      return Response.json({ error: "Your account already has Pro access." }, { status: 409 });
    }

    let customerId = billing.customerId;
    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: session.user.email,
          name: session.user.name,
          metadata: { murmurUserId: session.user.id },
        },
        { idempotencyKey: `murmur-customer-${session.user.id}` },
      );
      customerId = customer.id;
      await saveStripeCustomer(session.user.id, customerId);
    }

    const appUrl = getAppUrl();
    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: session.user.id,
      line_items: [{ price: getProPriceId(), quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { murmurUserId: session.user.id },
      subscription_data: { metadata: { murmurUserId: session.user.id } },
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
    });

    if (!checkout.url) throw new Error("Stripe did not return a Checkout URL.");
    return Response.json({ url: checkout.url });
  } catch (error) {
    console.error("Unable to create Stripe Checkout session", error);
    return Response.json({ error: "Billing is temporarily unavailable." }, { status: 503 });
  }
}
