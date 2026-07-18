import { afterEach, describe, expect, it, vi } from "vitest";
import { getKafkaConfig, InfrastructureConfigError } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("Kafka infrastructure configuration", () => {
  it("builds a hosted SASL/TLS configuration", () => {
    vi.stubEnv("KAFKA_BROKERS", "kafka.example.com:12345");
    vi.stubEnv("KAFKA_SWARM_EVENTS_TOPIC", "murmur.swarm.events");
    vi.stubEnv("KAFKA_SSL", "1");
    vi.stubEnv("KAFKA_SASL_MECHANISM", "scram-sha-256");
    vi.stubEnv("KAFKA_USERNAME", "murmur");
    vi.stubEnv("KAFKA_PASSWORD", "secret");

    expect(getKafkaConfig()).toMatchObject({
      brokers: ["kafka.example.com:12345"],
      topic: "murmur.swarm.events",
      ssl: true,
      sasl: { mechanism: "scram-sha-256", username: "murmur", password: "secret" },
    });
  });

  it("rejects missing broker configuration", () => {
    vi.stubEnv("KAFKA_BROKERS", "");
    vi.stubEnv("KAFKA_SWARM_EVENTS_TOPIC", "murmur.swarm.events");
    expect(() => getKafkaConfig()).toThrow(InfrastructureConfigError);
  });

  it("rejects broker URL schemes KafkaJS cannot consume", () => {
    vi.stubEnv("KAFKA_BROKERS", "SASL_SSL://kafka.example.com:12345");
    vi.stubEnv("KAFKA_SWARM_EVENTS_TOPIC", "murmur.swarm.events");
    expect(() => getKafkaConfig()).toThrow("without URL schemes");
  });

  it("requires username and password together", () => {
    vi.stubEnv("KAFKA_BROKERS", "kafka.example.com:12345");
    vi.stubEnv("KAFKA_SWARM_EVENTS_TOPIC", "murmur.swarm.events");
    vi.stubEnv("KAFKA_USERNAME", "murmur");
    vi.stubEnv("KAFKA_PASSWORD", "");
    expect(() => getKafkaConfig()).toThrow("KAFKA_USERNAME and KAFKA_PASSWORD must be configured together");
  });
});
