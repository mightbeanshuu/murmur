# Deployment checklist

## Web adapter (Vercel)

- Set `OPENROUTER_API_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `APP_URL`.
- Set managed `DATABASE_URL`, `REDIS_URL`, and Kafka TLS/SASL variables. Kafka is
  required: readiness fails and new runs are rejected when the broker or topic is
  unavailable.
- Use `MURMUR_EXECUTION_MODE=direct` only for a constrained Vercel showcase. For durable
  production execution, set it to `temporal` and configure the reachable Temporal
  address/namespace/task queue plus the always-on Worker below.
- Set `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET`.
- Production builds validate required URLs/secrets, then run the idempotent
  `pnpm db:migrate` release step under a PostgreSQL advisory lock before
  `next build`. Preview builds skip Production migrations.

### Free hosted Kafka (Aiven)

1. Create an Aiven for Apache Kafka free-tier service in a region near `iad1`.
2. Enable SASL authentication and `letsencrypt_sasl`, then create
   `murmur.swarm.events` with two partitions.
3. Add the service URI values to Vercel Production as `KAFKA_BROKERS` (use only
   `host:port`, without a URL scheme), `KAFKA_USERNAME`, and `KAFKA_PASSWORD`.
4. Set `KAFKA_SSL=1`, `KAFKA_SASL_MECHANISM=scram-sha-256`, and
   `KAFKA_SWARM_EVENTS_TOPIC=murmur.swarm.events`.

Aiven may power off an inactive free service. A required Kafka dependency means
Murmur will reject runs until that service is active again.

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
