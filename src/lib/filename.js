// Pure filename-generation logic. We always generate a name (rather than
// trusting any filename Telegram embeds in the media URL) so the extension
// doesn't depend on undocumented, easily-changed URL formats.

export function extensionFromMime(mime, fallback) {
  if (!mime || !mime.includes("/")) return fallback;
  const subtype = mime.split("/")[1].replace(/[^a-z0-9]/gi, "");
  return subtype || fallback;
}

export function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/** Small deterministic hash used to disambiguate files from the same second. */
export function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * @param {object} options
 * @param {"photo"|"video"} options.mediaType
 * @param {string} options.ext file extension, no leading dot
 * @param {Date} [options.date]
 * @param {string} [options.seed] distinguishes files downloaded in the same second
 */
export function generateFilename({ mediaType, ext, date = new Date(), seed = "" }) {
  const timestamp = formatTimestamp(date);
  const suffix = seed ? `-${hashString(seed)}` : "";
  return `telegram-${mediaType}-${timestamp}${suffix}.${ext}`;
}
