// Builds a minimal Response-like object from data that crossed the
// postMessage bridge (which can't transfer a real Response/Headers object).
// Only implements the subset of the Response interface streamDownload.js
// actually uses, so it's a safe drop-in for the `fetchImpl` it expects.

export function createResponseShim({ status, url, redirected, headersEntries, buffer }) {
  const headerMap = new Map(headersEntries.map(([name, value]) => [name.toLowerCase(), value]));

  return {
    status,
    url,
    redirected,
    headers: {
      get: (name) => headerMap.get(name.toLowerCase()) ?? null,
    },
    blob: async () => new Blob([buffer]),
  };
}
