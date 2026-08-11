// Runs in the page's MAIN world (declared via manifest.json's "world":
// "MAIN"), not the extension's isolated world. This is required because
// Telegram's Service Worker only intercepts /k/stream/... requests issued
// by the page's own JS — a fetch() from an isolated-world content script
// bypasses that interception and hits Telegram's real backend, which
// doesn't have a route for that client-side-only synthetic URL and
// returns a 302. Running the fetch here makes it indistinguishable (to the
// Service Worker) from a request Telegram's own code made.
//
// Bridges results back to the isolated-world content script via
// window.postMessage, since the two worlds don't share a JS realm.

import { BRIDGE_MARKER, MSG_FETCH_REQUEST, MSG_FETCH_RESPONSE } from "../lib/bridgeProtocol.js";

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (!data || data.__bridge !== BRIDGE_MARKER || data.type !== MSG_FETCH_REQUEST) return;

  const { requestId, url, headers } = data;

  fetch(url, { headers })
    .then(async (res) => {
      const buffer = await res.arrayBuffer();
      window.postMessage(
        {
          __bridge: BRIDGE_MARKER,
          type: MSG_FETCH_RESPONSE,
          requestId,
          ok: true,
          status: res.status,
          redirected: res.redirected,
          url: res.url,
          headersEntries: [...res.headers.entries()],
          buffer,
        },
        "*",
        [buffer]
      );
    })
    .catch((err) => {
      window.postMessage(
        {
          __bridge: BRIDGE_MARKER,
          type: MSG_FETCH_RESPONSE,
          requestId,
          ok: false,
          error: String((err && err.message) || err),
        },
        "*"
      );
    });
});
