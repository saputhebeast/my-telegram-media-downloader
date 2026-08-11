# My Telegram Media Downloader

A Manifest V3 Chrome extension that adds a download button to Telegram Web's
(`web.telegram.org/k/`) fullscreen media viewer, for images and videos.

## How it works

- Telegram Web already loads the full-size image/video into the page when
  you open it in the fullscreen media viewer — this extension doesn't fetch
  anything Telegram wasn't already going to send your browser.
- **Images** are downloaded directly via an anchor tag's `download`
  attribute, pointed at the already-loaded `<img>` element's `src`.
- **Videos** are served from streaming endpoints rather than static files,
  so the extension re-fetches the video URL in a loop using HTTP `Range`
  requests (the same technique Telegram's own player uses), assembles the
  chunks into a `Blob`, then triggers a normal browser download. That
  re-fetch runs in the page's own JS context via a small `postMessage`
  bridge (`src/content/mainWorld.js` / `src/lib/bridgeFetch.js`) rather
  than the extension's isolated content script — Telegram's Service Worker
  only resolves these streaming URLs for fetches issued by the page itself.
- A content script watches the page for Telegram's media viewer opening
  (via `MutationObserver`, not polling) and injects a download button into
  the viewer's existing button row, styled to match Telegram's own
  icon-buttons.

## Setup

```sh
npm install
npm run build      # bundles into dist/content.js and dist/mainWorld.js
```

Requires Chrome 111+.

### Load into Chrome

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this project's root directory
4. Open `https://web.telegram.org/k/`, open any photo or video in the
   fullscreen media viewer, and use the download button in the top bar

### Development

```sh
npm run watch    # rebuild on file changes
npm run lint     # ESLint
npm run test     # Vitest
```

After rebuilding, reload the extension on `chrome://extensions` and refresh
the Telegram Web tab (content scripts aren't hot-reloaded).

## Scope

Not handled: voice messages, stories, or the `/a/` webapp variant — only
`web.telegram.org/k/`.
