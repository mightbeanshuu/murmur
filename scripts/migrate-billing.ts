import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function migrate() {
  const { database } = await import("../src/lib/database");
  try {
    await database.query(`
      create table if not exists billing_subscription (
        user_id text primary key references "user" (id) on delete cascade,
        stripe_customer_id text unique,
        stripe_subscription_id text unique,
        stripe_price_id text,
        status text not null default 'free',
        current_period_end timestamptz,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );

      create index if not exists billing_subscription_status_idx
        on billing_subscription (status);
    `);
    console.log("Billing migration is up to date.");
  } finally {
    await database.end();
  }
}

migrate().catch((error) => {
  console.error("Billing migration failed:", error);
  process.exitCode = 1;
});
