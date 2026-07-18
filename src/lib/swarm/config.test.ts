import { afterEach, describe, expect, it, vi } from "vitest";
import { isKafkaConfigured, isKafkaRequired } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("Kafka deployment mode", () => {
  it("keeps Kafka strict by default", () => {
    vi.stubEnv("MURMUR_KAFKA_REQUIRED", "");
    expect(isKafkaRequired()).toBe(true);
  });

  it("allows an explicit Redis-only deployment", () => {
    vi.stubEnv("MURMUR_KAFKA_REQUIRED", "0");
    expect(isKafkaRequired()).toBe(false);
  });

  it("requires both broker and topic before optional publishing", () => {
    vi.stubEnv("KAFKA_BROKERS", "broker:9092");
    vi.stubEnv("KAFKA_SWARM_EVENTS_TOPIC", "");
    expect(isKafkaConfigured()).toBe(false);
    vi.stubEnv("KAFKA_SWARM_EVENTS_TOPIC", "murmur.swarm.events");
    expect(isKafkaConfigured()).toBe(true);
  });
});
