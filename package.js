// Builds the extension and zips exactly what the Chrome Web Store needs
// (manifest.json, dist/, icons/) into release/<name>-v<version>.zip.

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const zipName = `my-telegram-media-downloader-v${manifest.version}.zip`;

execFileSync("node", ["build.js"], { stdio: "inherit" });

rmSync("release", { recursive: true, force: true });
mkdirSync("release");

execFileSync(
  "zip",
  ["-r", `release/${zipName}`, "manifest.json", "dist", "icons"],
  { stdio: "inherit" }
);

console.log(`\nWrote release/${zipName}`);
