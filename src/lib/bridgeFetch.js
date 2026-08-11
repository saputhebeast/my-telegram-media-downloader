// Isolated-world side of the main-world fetch bridge. Drop-in replacement
// for `fetch` as a streamDownload.js `fetchImpl` — see mainWorld.js for why
// this indirection exists.

import { BRIDGE_MARKER, MSG_FETCH_REQUEST, MSG_FETCH_RESPONSE } from "./bridgeProtocol.js";
import { createResponseShim } from "./responseShim.js";

const RESPONSE_TIMEOUT_MS = 30000;

let nextRequestId = 0;

export function bridgeFetch(url, options = {}) {
  const requestId = `${Date.now()}-${nextRequestId++}`;
  const headers = options.headers || {};

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener("message", onMessage);
      reject(new Error("Timed out waiting for main-world fetch bridge response"));
    }, RESPONSE_TIMEOUT_MS);

    function onMessage(event) {
      if (event.source !== window) return;
      const data = event.data;
      if (!data || data.__bridge !== BRIDGE_MARKER || data.type !== MSG_FETCH_RESPONSE) return;
      if (data.requestId !== requestId) return;

      clearTimeout(timer);
      window.removeEventListener("message", onMessage);

      if (!data.ok) {
        reject(new Error(data.error || "Main-world fetch failed"));
        return;
      }

      resolve(
        createResponseShim({
          status: data.status,
          url: data.url,
          redirected: data.redirected,
          headersEntries: data.headersEntries,
          buffer: data.buffer,
        })
      );
    }

    window.addEventListener("message", onMessage);
    window.postMessage(
      { __bridge: BRIDGE_MARKER, type: MSG_FETCH_REQUEST, requestId, url, headers },
      "*"
    );
  });
}
