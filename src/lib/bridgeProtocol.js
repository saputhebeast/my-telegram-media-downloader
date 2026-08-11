// Message contract shared between the isolated-world content script
// (bridgeFetch.js) and the main-world content script (mainWorld.js).
// See README "Design notes" for why this bridge exists.

export const BRIDGE_MARKER = "tel-ext-bridge";
export const MSG_FETCH_REQUEST = "fetch-request";
export const MSG_FETCH_RESPONSE = "fetch-response";
