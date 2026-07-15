import type { SwarmEvent } from "./types";

/**
 * Async event queue that lets many parallel agents push events while a single
 * consumer (the HTTP stream) drains them in order. This is what makes concurrent
 * agent token streams interleave live in the UI.
 */
export class EventBus implements AsyncIterable<SwarmEvent> {
  private queue: SwarmEvent[] = [];
  private waiters: ((r: IteratorResult<SwarmEvent>) => void)[] = [];
  private closed = false;

  emit(event: SwarmEvent) {
    if (this.closed) return;
    // If the HTTP stream is already waiting for the next event, resolve it
    // immediately. Otherwise, buffer the event until a reader asks for it.
    const w = this.waiters.shift();
    if (w) w({ value: event, done: false });
    else this.queue.push(event);
  }

  close() {
    this.closed = true;
    // Wake any pending `for await` readers so the response stream can finish.
    let w;
    while ((w = this.waiters.shift())) w({ value: undefined as never, done: true });
  }

  [Symbol.asyncIterator](): AsyncIterator<SwarmEvent> {
    return {
      next: () => {
        // Drain already-buffered events first.
        if (this.queue.length) return Promise.resolve({ value: this.queue.shift()!, done: false });
        if (this.closed) return Promise.resolve({ value: undefined as never, done: true });
        // No event yet: suspend the reader until emit() resolves this promise.
        return new Promise((resolve) => this.waiters.push(resolve));
      },
    };
  }
}
