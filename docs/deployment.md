# Deployment checklist

## Web adapter (Vercel)

- Set `OPENROUTER_API_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `APP_URL`.
- Set managed `DATABASE_URL`, `REDIS_URL`, and Kafka TLS/SASL variables.
- If no managed Kafka service is available for a demo, set
  `MURMUR_KAFKA_REQUIRED=0`. This preserves Redis durability but disables the Go
  telemetry stream; production/full deployments should keep the default `1`.
- Use `MURMUR_EXECUTION_MODE=direct` only for a constrained Vercel showcase. For durable
  production execution, set it to `temporal` and configure the reachable Temporal
  address/namespace/task queue plus the always-on Worker below.
- Set `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`.
- Production builds validate required URLs/secrets, then run the idempotent
  `pnpm db:migrate` release step under a PostgreSQL advisory lock before
  `next build`. Preview builds skip Production migrations.

## Background services

Deploy `Dockerfile.temporal` to an always-on container platform. Deploy `services/telemetry/Dockerfile` separately. Both must use managed endpoints, not Compose service names.

## Stripe

- Create a recurring Pro Price.
- Register `/api/billing/webhook` and select Checkout + subscription lifecycle events.
- Enable Customer Portal cancellation and payment-method updates.
- Test success, cancellation, failed renewal, deletion, and repeated webhook delivery.

## Production controls still recommended

- phase-level Temporal Activities and idempotency keys;
- Redis-to-Kafka transactional outbox;
- OpenTelemetry traces and structured logs keyed by `runId`;
- dashboards/alerts for latency, errors, Temporal failures, Kafka lag, Redis pressure, and LLM cost;
- verified email, password-reset flow, and stronger abuse controls;
- managed backups, secret rotation, and a tested rollback procedure.
