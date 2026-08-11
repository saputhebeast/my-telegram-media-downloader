// Every Telegram Web DOM selector the extension depends on, in one place.
// If Telegram changes their markup, this is the only file that should need
// to change. See README.md "How to fix it if Telegram changes their DOM".

export const SELECTORS = {
  // Scopes the MutationObserver so we're not watching the entire document.
  // Falls back to document.body in mediaViewer.js if this isn't found yet.
  appRoot: "#column-center",

  mediaViewerWhole: ".media-viewer-whole",
  mediaViewerAspecter: ".media-viewer-movers .media-viewer-aspecter",
  mediaViewerButtons: ".media-viewer-topbar .media-viewer-buttons",
  imageThumbnail: "img.thumbnail",
};

// Class added to our injected button so re-injection can be skipped.
export const DOWNLOAD_BUTTON_CLASS = "tel-ext-download";

// tweb's icon-font glyph for "download" (private-use codepoint U+E979).
export const DOWNLOAD_ICON_GLYPH = "";
