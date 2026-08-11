// Orchestrates a download: pairs a media element with the right download
// strategy (direct anchor download for images, chunked Range fetch for
// video), generates a filename, and triggers the browser's save flow.

import { bridgeFetch } from "./bridgeFetch.js";
import { extensionFromMime, generateFilename } from "./filename.js";
import { downloadStream } from "./streamDownload.js";

export function downloadImageDirect(imageUrl) {
  const fileName = generateFilename({ mediaType: "photo", ext: "jpg", seed: imageUrl });
  triggerAnchorDownload(imageUrl, fileName);
}

/**
 * @param {HTMLVideoElement} videoEl
 * @param {(percent: number) => void} [onProgress]
 * @returns {Promise<string>} the filename that was saved
 */
export async function downloadVideo(videoEl, onProgress) {
  const url = videoEl.currentSrc || videoEl.src;
  if (!url) throw new Error("Video element has no source URL");

  const { blob, mimeType } = await downloadStream(url, {
    mimePrefix: "video/",
    onProgress,
    fetchImpl: bridgeFetch,
  });

  const ext = extensionFromMime(mimeType, "mp4");
  const fileName = generateFilename({ mediaType: "video", ext, seed: url });

  saveBlob(blob, fileName);
  return fileName;
}

function triggerAnchorDownload(href, fileName) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function saveBlob(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  triggerAnchorDownload(objectUrl, fileName);
  URL.revokeObjectURL(objectUrl);
}
