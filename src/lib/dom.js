// DOM-manipulation helpers for the injected download button.
// Kept free of download/network logic so it can change independently of
// how a download actually happens.

import { DOWNLOAD_BUTTON_CLASS, DOWNLOAD_ICON_GLYPH } from "./selectors.js";

/**
 * @param {(button: HTMLButtonElement) => void} onClick
 * @returns {HTMLButtonElement}
 */
export function createDownloadButton(onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.title = "Download";
  button.setAttribute("aria-label", "Download");
  button.className = `btn-icon tgico-download ${DOWNLOAD_BUTTON_CLASS}`;

  const icon = document.createElement("span");
  icon.className = "tgico";
  icon.textContent = DOWNLOAD_ICON_GLYPH;
  button.appendChild(icon);

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick(button);
  });

  return button;
}

export function setBusy(button, busy) {
  button.disabled = busy;
  button.style.opacity = busy ? "0.5" : "1";
}
