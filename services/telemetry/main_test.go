package main

import "testing"

func TestProcessCountsKnownEvents(t *testing.T) {
	stats := &metrics{}
	event := []byte(`{"version":1,"runId":"run-1","sequence":1,"occurredAt":123,"event":{"kind":"run.start"}}`)

	if err := process(event, stats); err != nil {
		t.Fatalf("process returned error: %v", err)
	}
	if got := stats.events.Load(); got != 1 {
		t.Fatalf("events = %d, want 1", got)
	}
	if got := stats.runsStarted.Load(); got != 1 {
		t.Fatalf("runsStarted = %d, want 1", got)
	}
}

func TestProcessRejectsInvalidEnvelope(t *testing.T) {
	stats := &metrics{}
	if err := process([]byte(`{"version":1}`), stats); err == nil {
		t.Fatal("expected invalid envelope error")
	}
}

func TestLoadConfigAcceptsHostedKafkaTLSAndSASL(t *testing.T) {
	t.Setenv("KAFKA_BROKERS", "kafka.example.com:12345")
	t.Setenv("KAFKA_SSL", "1")
	t.Setenv("KAFKA_SASL_MECHANISM", "scram-sha-256")
	t.Setenv("KAFKA_USERNAME", "consumer")
	t.Setenv("KAFKA_PASSWORD", "secret")

	cfg, err := loadConfig()
	if err != nil {
		t.Fatalf("loadConfig returned error: %v", err)
	}
	if !cfg.ssl || cfg.saslMechanism != "scram-sha-256" || cfg.username != "consumer" {
		t.Fatalf("unexpected hosted Kafka config: %+v", cfg)
	}
	if _, err := kafkaOptions(cfg); err != nil {
		t.Fatalf("kafkaOptions returned error: %v", err)
	}
}

func TestLoadConfigRequiresCompleteSASLCredentials(t *testing.T) {
	t.Setenv("KAFKA_USERNAME", "consumer")
	t.Setenv("KAFKA_PASSWORD", "")
	if _, err := loadConfig(); err == nil {
		t.Fatal("expected incomplete SASL credentials error")
	}
}

func TestKafkaOptionsRejectsUnsupportedSASLMechanism(t *testing.T) {
	_, err := kafkaOptions(config{
		brokers:       []string{"kafka.example.com:12345"},
		topic:         "murmur.swarm.events",
		groupID:       "murmur-telemetry-v1",
		saslMechanism: "oauth",
		username:      "consumer",
		password:      "secret",
	})
	if err == nil {
		t.Fatal("expected unsupported SASL mechanism error")
	}
}
