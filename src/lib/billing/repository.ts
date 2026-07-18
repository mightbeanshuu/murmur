import type Stripe from "stripe";
import { database } from "@/lib/database";
import { PRO_SUBSCRIPTION_STATUSES, type BillingPlan } from "./plans";

interface BillingRow {
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_end: Date | null;
}

export interface BillingState {
  customerId: string | null;
  subscriptionId: string | null;
  priceId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
}

function toState(row?: BillingRow): BillingState {
  return {
    customerId: row?.stripe_customer_id ?? null,
    subscriptionId: row?.stripe_subscription_id ?? null,
    priceId: row?.stripe_price_id ?? null,
    status: row?.status ?? "free",
    currentPeriodEnd: row?.current_period_end ?? null,
  };
}

export async function getBillingState(userId: string) {
  const result = await database.query<BillingRow>(
    `select stripe_customer_id, stripe_subscription_id, stripe_price_id, status, current_period_end
       from billing_subscription
      where user_id = $1`,
    [userId],
  );
  return toState(result.rows[0]);
}

export async function getUserPlan(userId: string): Promise<BillingPlan> {
  const state = await getBillingState(userId);
  const configuredPrice = process.env.STRIPE_PRO_PRICE_ID;
  const isExpectedProduct = !configuredPrice || state.priceId === configuredPrice;
  return PRO_SUBSCRIPTION_STATUSES.has(state.status) && isExpectedProduct ? "pro" : "free";
}

export async function saveStripeCustomer(userId: string, customerId: string) {
  await database.query(
    `insert into billing_subscription (user_id, stripe_customer_id)
     values ($1, $2)
     on conflict (user_id) do update
       set stripe_customer_id = excluded.stripe_customer_id,
           updated_at = now()`,
    [userId, customerId],
  );
}

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer) {
  return typeof customer === "string" ? customer : customer.id;
}

function periodEnd(subscription: Stripe.Subscription) {
  const timestamps = subscription.items.data.map((item) => item.current_period_end);
  return timestamps.length > 0 ? new Date(Math.max(...timestamps) * 1000) : null;
}

/**
 * Stripe is the source of truth. This table is a local entitlement projection
 * used for fast request-time authorization; repeated webhook deliveries simply
 * overwrite the same subscription row.
 */
export async function syncStripeSubscription(
  subscription: Stripe.Subscription,
  explicitUserId?: string,
) {
  const stripeCustomerId = customerId(subscription.customer);
  const found = explicitUserId
    ? { rows: [{ user_id: explicitUserId }] }
    : await database.query<{ user_id: string }>(
        "select user_id from billing_subscription where stripe_customer_id = $1",
        [stripeCustomerId],
      );
  const userId = found.rows[0]?.user_id;
  if (!userId) throw new Error(`No Murmur user owns Stripe customer ${stripeCustomerId}.`);

  await database.query(
    `insert into billing_subscription (
       user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
       status, current_period_end
     ) values ($1, $2, $3, $4, $5, $6)
     on conflict (user_id) do update set
       stripe_customer_id = excluded.stripe_customer_id,
       stripe_subscription_id = excluded.stripe_subscription_id,
       stripe_price_id = excluded.stripe_price_id,
       status = excluded.status,
       current_period_end = excluded.current_period_end,
       updated_at = now()`,
    [
      userId,
      stripeCustomerId,
      subscription.id,
      subscription.items.data[0]?.price.id ?? null,
      subscription.status,
      periodEnd(subscription),
    ],
  );
}
