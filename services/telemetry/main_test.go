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
