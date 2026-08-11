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

  const buttons = container.querySelector(SELECTORS.mediaViewerButtons);
  if (!buttons) return;
  if (buttons.querySelector(`.${DOWNLOAD_BUTTON_CLASS}`)) return;

  // The button is injected once per viewer session, but the media inside
  // it changes as the user navigates next/prev without the viewer closing.
  // Re-resolve the *current* media at click time rather than capturing it
  // here, or the button would keep downloading whatever was open first.
  buttons.prepend(createDownloadButton((button) => handleDownloadClick(button)));
}

// Telegram appears to keep more than one <video>/<img> in the DOM at once
// (likely for prev/current/next slide transitions — "media-viewer-movers"
// is plural), so picking the first DOM match can grab a slide that isn't
// actually on screen. A size/display check alone isn't enough — carousel
// slides positioned off-screen via CSS transform still report a non-zero
// size. Instead, pick whichever candidate is rendered closest to the
// center of the viewport, since that should be the active slide
// regardless of how the carousel is implemented.
function isRenderedVisible(el) {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === "hidden" || style.display === "none") return false;
  if (parseFloat(style.opacity) === 0) return false;
  return true;
}

function distanceFromViewportCenter(el) {
  const rect = el.getBoundingClientRect();
  const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
  const dy = rect.top + rect.height / 2 - window.innerHeight / 2;
  return Math.hypot(dx, dy);
}

function pickMostCentered(elements) {
  const candidates = elements.filter(isRenderedVisible);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, el) =>
    distanceFromViewportCenter(el) < distanceFromViewportCenter(best) ? el : best
  );
}

function findCurrentMedia() {
  const container = document.querySelector(SELECTORS.mediaViewerWhole);
  const aspecter = container && container.querySelector(SELECTORS.mediaViewerAspecter);
  if (!aspecter) return null;

  const video = pickMostCentered(Array.from(aspecter.querySelectorAll("video")));
  if (video) return { type: "video", element: video };

  const images = Array.from(aspecter.querySelectorAll(SELECTORS.imageThumbnail)).filter(
    (img) => img.src
  );
  const image = pickMostCentered(images);
  if (image) return { type: "image", element: image };

  return null;
}

async function handleDownloadClick(button) {
  const media = findCurrentMedia();
  if (!media) {
    logger.warn("No video or image found in the media viewer at click time.");
    return;
  }

  if (media.type === "video") {
    await handleVideoClick(button, media.element);
  } else {
    handleImageClick(media.element);
  }
}

async function handleVideoClick(button, videoEl) {
  setBusy(button, true);
  try {
    logger.log("Source URL:", videoEl.src || videoEl.currentSrc);
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
