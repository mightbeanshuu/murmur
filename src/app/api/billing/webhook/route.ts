import { processStripeEvent, verifyStripeWebhook } from "@/lib/billing/service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return Response.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event;
  try {
    // Stripe signs the exact raw payload. Parsing JSON before verification would
    // change the bytes and remove the authenticity guarantee.
    event = verifyStripeWebhook(await req.text(), signature);
  } catch (error) {
    return Response.json({ error: `Invalid webhook: ${(error as Error).message}` }, { status: 400 });
  }

  try {
    await processStripeEvent(event);
    return Response.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed`, error);
    return Response.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
