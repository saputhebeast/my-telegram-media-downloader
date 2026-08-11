// Pure helpers for interpreting HTTP Range/Content-Range semantics.
// No DOM, no fetch — kept separate so the chunking logic in streamDownload.js
// can be unit tested without mocking the network.

const CONTENT_RANGE_RE = /^bytes (\d+)-(\d+)\/(\d+)$/;

/**
 * @param {string|null} headerValue e.g. "bytes 0-1048575/52428800"
 * @returns {{start: number, end: number, total: number} | null}
 */
export function parseContentRange(headerValue) {
  if (!headerValue) return null;
  const match = headerValue.match(CONTENT_RANGE_RE);
  if (!match) return null;
  return {
    start: parseInt(match[1], 10),
    end: parseInt(match[2], 10),
    total: parseInt(match[3], 10),
  };
}

/**
 * True if the chunk we just received doesn't start where the previous one
 * left off, meaning some bytes were skipped or duplicated by the server.
 */
export function hasGap(expectedOffset, rangeStart) {
  return rangeStart !== expectedOffset;
}

/**
 * @returns {number|null} percent complete, or null if total is unknown.
 */
export function calculateProgress(offset, total) {
  if (!total) return null;
  return Math.min(100, Math.round((offset * 100) / total));
}
