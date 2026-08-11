// Watches for Telegram's fullscreen media viewer opening and injects a
// download button into its button row, once, per open.
//
// Replaces polling (setInterval) with a MutationObserver scoped to the app
// root so we only re-check the DOM when it actually changes, and debounce
// the check since Telegram's SPA can mutate the DOM very frequently (typing
// indicators, message list virtualization, etc).

import { createDownloadButton, setBusy } from "../lib/dom.js";
import { downloadImageDirect, downloadVideo } from "../lib/download.js";
import { logger } from "../lib/logger.js";
import { DOWNLOAD_BUTTON_CLASS, SELECTORS } from "../lib/selectors.js";

const DEBOUNCE_MS = 150;

/** @returns {MutationObserver} */
export function observeMediaViewer() {
  const root = document.querySelector(SELECTORS.appRoot) || document.body;
  if (root === document.body) {
    logger.warn(
      `App root selector "${SELECTORS.appRoot}" not found; falling back to document.body. ` +
        "This still works but observes more of the DOM than necessary — see README troubleshooting."
    );
  }

  const debouncedCheck = debounce(safeCheckMediaViewer, DEBOUNCE_MS);
  const observer = new MutationObserver(debouncedCheck);
  observer.observe(root, { childList: true, subtree: true });

  // Handle the case where the viewer is already open when we attach.
  safeCheckMediaViewer();

  return observer;
}

function safeCheckMediaViewer() {
  try {
    checkMediaViewer();
  } catch (err) {
    // Telegram's DOM structure is undocumented and can change at any time.
    // Never let a mismatch here throw into the page.
    logger.error("Media viewer check failed:", err);
  }
}

function checkMediaViewer() {
  const container = document.querySelector(SELECTORS.mediaViewerWhole);
  if (!container) return;

  const aspecter = container.querySelector(SELECTORS.mediaViewerAspecter);
  const buttons = container.querySelector(SELECTORS.mediaViewerButtons);
  if (!aspecter || !buttons) return;
  if (buttons.querySelector(`.${DOWNLOAD_BUTTON_CLASS}`)) return;

  const video = aspecter.querySelector("video");
  const image = aspecter.querySelector(SELECTORS.imageThumbnail);

  if (video) {
    buttons.prepend(createDownloadButton((button) => handleVideoClick(button, video)));
  } else if (image && image.src) {
    buttons.prepend(createDownloadButton(() => handleImageClick(image)));
  }
}

async function handleVideoClick(button, videoEl) {
  setBusy(button, true);
  try {
    logger.log("Source URL:", videoEl.currentSrc || videoEl.src);
    const fileName = await downloadVideo(videoEl, (percent) => {
      logger.log(`Downloading... ${percent}%`);
    });
    logger.log("Saved", fileName);
  } catch (err) {
    logger.error("Video download failed:", err);
    alert("Download failed — see the browser console for details.");
  } finally {
    setBusy(button, false);
  }
}

function handleImageClick(imageEl) {
  try {
    downloadImageDirect(imageEl.src);
  } catch (err) {
    logger.error("Image download failed:", err);
    alert("Download failed — see the browser console for details.");
  }
}

function debounce(fn, delayMs) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}
