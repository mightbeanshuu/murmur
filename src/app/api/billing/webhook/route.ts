import type Stripe from "stripe";
import { syncStripeSubscription } from "@/lib/billing/repository";
import { getStripe } from "@/lib/billing/stripe";

export const runtime = "nodejs";

function webhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return secret;
}

async function syncCheckout(session: Stripe.Checkout.Session) {
  if (!session.subscription) return;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const userId = session.client_reference_id ?? session.metadata?.murmurUserId;
  await syncStripeSubscription(subscription, userId ?? undefined);
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    // Stripe signs the exact raw payload. Parsing JSON before verification would
    // change the bytes and remove the authenticity guarantee.
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret());
  } catch (error) {
    return Response.json({ error: `Invalid webhook: ${(error as Error).message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await syncCheckout(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscription(event.data.object);
        break;
      default:
        // Acknowledge unrelated Stripe events so they are not retried forever.
        break;
    }
    return Response.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed`, error);
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
