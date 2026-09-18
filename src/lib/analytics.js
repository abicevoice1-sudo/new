// ── Analytics event queue ────────────────────────────────────────────────────
// Records behavioral events (profile_viewed, interest_sent, message_sent,
// account_created, waitlist_joined) so funnel metrics become possible.
//
// HONESTY CONTRACT: events are queued in this browser only. There is NO
// network call anywhere in this module — no analytics service is connected,
// so none is claimed. When a server endpoint exists, add it in `flush()`
// and delete this comment.
//
// Storage is injectable so unit tests can run in plain Node without a DOM.

const QUEUE_KEY = 'shiarishta_events_v1';
const MAX_EVENTS = 500;

export function createAnalytics(storage = globalThis.localStorage) {
  const readQueue = () => {
    try {
      const raw = storage.getItem(QUEUE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeQueue = (events) => {
    try {
      // Keep the newest MAX_EVENTS; drop the oldest beyond that.
      storage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch {
      /* quota — non-fatal: analytics must never break the product */
    }
  };

  return {
    /** Record one event. `name` must be a short snake_case string. */
    track(name, props = {}) {
      if (typeof name !== 'string' || !name.trim()) return null;
      const event = {
        event: name,
        props,
        ts: new Date().toISOString(),
      };
      const queue = readQueue();
      queue.push(event);
      writeQueue(queue);
      return event;
    },

    /** All queued events, oldest first. */
    getEvents() {
      return readQueue();
    },

    /** Count of events matching a name (all events when name omitted). */
    count(name) {
      const queue = readQueue();
      return name ? queue.filter(e => e.event === name).length : queue.length;
    },

    /** JSON export — attach to a support email or save via DevTools. */
    exportJson() {
      return JSON.stringify(readQueue(), null, 2);
    },

    clear() {
      try { storage.removeItem(QUEUE_KEY); } catch { /* non-fatal */ }
    },
  };
}

export const analytics = createAnalytics();
