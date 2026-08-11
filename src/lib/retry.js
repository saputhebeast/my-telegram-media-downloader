// Pure/near-pure retry helpers used by streamDownload.js.

/** Exponential backoff, capped, in milliseconds. */
export function backoffDelay(attempt, baseMs = 300, maxMs = 5000) {
  return Math.min(maxMs, baseMs * 2 ** attempt);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
