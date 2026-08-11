// Entry point bundled by esbuild into dist/content.js and loaded as the
// Manifest V3 content script (see manifest.json).

import { observeMediaViewer } from "./mediaViewer.js";
import { logger } from "../lib/logger.js";

try {
  observeMediaViewer();
  logger.log("Content script loaded.");
} catch (err) {
  logger.error("Failed to initialize:", err);
}
