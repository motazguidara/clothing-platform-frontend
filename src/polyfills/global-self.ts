/**
 * Define `self` during SSR so browser-focused packages relying on it do not crash.
 */
const globalRecord = globalThis as Record<string, unknown>;
if (typeof globalRecord["self"] === "undefined") {
  globalRecord["self"] = globalThis;
}
