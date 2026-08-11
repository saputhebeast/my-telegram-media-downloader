// Fetches a streaming media URL (Telegram serves video/audio from streaming
// endpoints, not static files) in chunks using HTTP Range requests, and
// assembles the result into a single Blob.

import { calculateProgress, hasGap, parseContentRange } from "./contentRange.js";
import { backoffDelay, sleep } from "./retry.js";

export class StreamDownloadError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "StreamDownloadError";
  }
}

const DEFAULT_MAX_RETRIES = 3;

/**
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.mimePrefix] e.g. "video/" — reject unexpected content types
 * @param {(percent: number) => void} [options.onProgress]
 * @param {typeof fetch} [options.fetchImpl] injectable for testing
 * @param {number} [options.maxRetries] per-chunk retry attempts on transient failures
 * @returns {Promise<{blob: Blob, mimeType: string|null, totalSize: number|null}>}
 */
export async function downloadStream(url, options = {}) {
  const {
    mimePrefix = null,
    onProgress = null,
    fetchImpl = fetch,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = options;

  let offset = 0;
  let totalSize = null;
  let mimeType = null;
  const chunks = [];

  while (true) {
    const res = await fetchChunkWithRetry(url, offset, fetchImpl, maxRetries);

    if (res.status !== 200 && res.status !== 206) {
      const location = res.headers.get("Location");
      throw new StreamDownloadError(
        `Unexpected response status ${res.status} for ${res.url}` +
          (res.redirected ? " (redirected)" : "") +
          (location ? ` -> Location: ${location}` : "")
      );
    }

    const contentType = (res.headers.get("Content-Type") || "").split(";")[0].trim();
    if (mimePrefix && contentType && !contentType.startsWith(mimePrefix)) {
      throw new StreamDownloadError(`Unexpected content type "${contentType}"`);
    }
    if (contentType) mimeType = contentType;

    const range = parseContentRange(res.headers.get("Content-Range"));
    const blob = await res.blob();
    chunks.push(blob);

    if (!range) {
      // No Content-Range header: treat the response as the complete file.
      totalSize = blob.size;
      break;
    }

    if (hasGap(offset, range.start)) {
      throw new StreamDownloadError(
        `Gap detected while downloading: expected byte ${offset}, server returned ${range.start}`
      );
    }

    totalSize = range.total;
    offset = range.end + 1;

    const progress = calculateProgress(offset, totalSize);
    if (onProgress && progress !== null) onProgress(progress);

    if (offset >= totalSize) break;
  }

  return {
    blob: new Blob(chunks, mimeType ? { type: mimeType } : undefined),
    mimeType,
    totalSize,
  };
}

async function fetchChunkWithRetry(url, offset, fetchImpl, maxRetries) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetchImpl(url, { headers: { Range: `bytes=${offset}-` } });
      if (res.status >= 500 && attempt < maxRetries) {
        lastError = new StreamDownloadError(`Server error ${res.status}`);
        await sleep(backoffDelay(attempt));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await sleep(backoffDelay(attempt));
      }
    }
  }

  throw new StreamDownloadError(`Failed to fetch chunk at offset ${offset}`, { cause: lastError });
}
