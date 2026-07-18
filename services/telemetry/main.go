package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"sync/atomic"
	"syscall"
	"time"

	"github.com/twmb/franz-go/pkg/kgo"
)

type config struct {
	brokers []string
	topic   string
	groupID string
	address string
}

type envelope struct {
	Version    int    `json:"version"`
	RunID      string `json:"runId"`
	Sequence   int64  `json:"sequence"`
	OccurredAt int64  `json:"occurredAt"`
	Event      struct {
		Kind string `json:"kind"`
	} `json:"event"`
}

type metrics struct {
	consumerUp    atomic.Bool
	events        atomic.Int64
	invalidEvents atomic.Int64
	runsStarted   atomic.Int64
	runsCompleted atomic.Int64
	runErrors     atomic.Int64
	agentSpawns   atomic.Int64
	tokenChunks   atomic.Int64
	lastEventAt   atomic.Int64
}

func main() {
	cfg, err := loadConfig()
	if err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	stats := &metrics{}
	client, err := kgo.NewClient(
		kgo.SeedBrokers(cfg.brokers...),
		kgo.ClientID("murmur-go-telemetry"),
		kgo.ConsumerGroup(cfg.groupID),
		kgo.ConsumeTopics(cfg.topic),
		kgo.DisableAutoCommit(),
		kgo.ConsumeResetOffset(kgo.NewOffset().AtStart()),
	)
	if err != nil {
		slog.Error("create Kafka client", "error", err)
		os.Exit(1)
	}
	defer client.Close()

	server := &http.Server{
		Addr:              cfg.address,
		Handler:           routes(stats),
		ReadHeaderTimeout: 3 * time.Second,
	}

	go consume(ctx, client, stats)
	go func() {
		slog.Info("telemetry HTTP server started", "address", cfg.address)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("telemetry HTTP server failed", "error", err)
			stop()
		}
	}()

	<-ctx.Done()
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_ = server.Shutdown(shutdownCtx)
}

func consume(ctx context.Context, client *kgo.Client, stats *metrics) {
	for ctx.Err() == nil {
		if err := client.Ping(ctx); err != nil {
			stats.consumerUp.Store(false)
			slog.Warn("Kafka unavailable", "error", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(time.Second):
			}
			continue
		}

		stats.consumerUp.Store(true)
		fetches := client.PollFetches(ctx)
		if fetches.IsClientClosed() || ctx.Err() != nil {
			return
		}
		if errs := fetches.Errors(); len(errs) > 0 {
			stats.consumerUp.Store(false)
			for _, fetchErr := range errs {
				slog.Warn("Kafka fetch failed", "topic", fetchErr.Topic, "partition", fetchErr.Partition, "error", fetchErr.Err)
			}
			continue
		}

		records := make([]*kgo.Record, 0, fetches.NumRecords())
		fetches.EachRecord(func(record *kgo.Record) {
			if err := process(record.Value, stats); err != nil {
				stats.invalidEvents.Add(1)
				slog.Warn("invalid swarm event", "error", err, "partition", record.Partition, "offset", record.Offset)
			}
			// Invalid records are observed and then acknowledged too. Otherwise one
			// poison message would be fetched forever and block its partition. A
			// production expansion can publish the raw record to a dead-letter topic.
			records = append(records, record)
		})

		if len(records) > 0 {
			if err := client.CommitRecords(ctx, records...); err != nil {
				stats.consumerUp.Store(false)
				slog.Warn("Kafka offset commit failed", "error", err)
			}
		}
	}
}

func process(value []byte, stats *metrics) error {
	var event envelope
	if err := json.Unmarshal(value, &event); err != nil {
		return fmt.Errorf("decode envelope: %w", err)
	}
	if event.Version != 1 || event.RunID == "" || event.Sequence < 1 || event.Event.Kind == "" {
		return errors.New("missing required envelope fields")
	}

	stats.events.Add(1)
	stats.lastEventAt.Store(event.OccurredAt)
	switch event.Event.Kind {
	case "run.start":
		stats.runsStarted.Add(1)
	case "run.done":
		stats.runsCompleted.Add(1)
	case "error":
		stats.runErrors.Add(1)
	case "agent.spawn":
		stats.agentSpawns.Add(1)
	case "agent.token":
		stats.tokenChunks.Add(1)
	}
	return nil
}

func routes(stats *metrics) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("content-type", "application/json")
		if !stats.consumerUp.Load() {
			w.WriteHeader(http.StatusServiceUnavailable)
		}
		_, _ = fmt.Fprintf(w, `{"status":%q}`, map[bool]string{true: "ready", false: "not_ready"}[stats.consumerUp.Load()])
	})
	mux.HandleFunc("GET /metrics", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("content-type", "text/plain; version=0.0.4")
		writeGauge(w, "murmur_consumer_up", boolValue(stats.consumerUp.Load()))
		writeCounter(w, "murmur_events_consumed_total", stats.events.Load())
		writeCounter(w, "murmur_invalid_events_total", stats.invalidEvents.Load())
		writeCounter(w, "murmur_runs_started_total", stats.runsStarted.Load())
		writeCounter(w, "murmur_runs_completed_total", stats.runsCompleted.Load())
		writeCounter(w, "murmur_run_errors_total", stats.runErrors.Load())
		writeCounter(w, "murmur_agent_spawns_total", stats.agentSpawns.Load())
		writeCounter(w, "murmur_token_chunks_total", stats.tokenChunks.Load())
		writeGauge(w, "murmur_last_event_timestamp_milliseconds", stats.lastEventAt.Load())
	})
	return mux
}

func writeCounter(w http.ResponseWriter, name string, value int64) {
	_, _ = fmt.Fprintf(w, "# TYPE %s counter\n%s %d\n", name, name, value)
}

func writeGauge(w http.ResponseWriter, name string, value int64) {
	_, _ = fmt.Fprintf(w, "# TYPE %s gauge\n%s %d\n", name, name, value)
}

func boolValue(value bool) int64 {
	if value {
		return 1
	}
	return 0
}

func loadConfig() (config, error) {
	brokers := splitNonEmpty(env("KAFKA_BROKERS", "kafka:19092"))
	if len(brokers) == 0 {
		return config{}, errors.New("KAFKA_BROKERS must contain at least one broker")
	}
	port := env("TELEMETRY_PORT", "9091")
	if _, err := strconv.Atoi(port); err != nil {
		return config{}, fmt.Errorf("TELEMETRY_PORT must be numeric: %w", err)
	}
	return config{
		brokers: brokers,
		topic:   env("KAFKA_SWARM_EVENTS_TOPIC", "murmur.swarm.events"),
		groupID: env("KAFKA_TELEMETRY_GROUP_ID", "murmur-telemetry-v1"),
		address: ":" + port,
	}, nil
}

func env(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func splitNonEmpty(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}
