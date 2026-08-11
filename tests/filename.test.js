import { describe, expect, it } from "vitest";
import {
  extensionFromMime,
  formatTimestamp,
  generateFilename,
  hashString,
} from "../src/lib/filename.js";

describe("extensionFromMime", () => {
  it("extracts the subtype", () => {
    expect(extensionFromMime("video/mp4", "bin")).toBe("mp4");
    expect(extensionFromMime("image/jpeg", "bin")).toBe("jpeg");
  });

  it("strips non-alphanumeric characters from the subtype", () => {
    expect(extensionFromMime("video/mp4; codecs=avc1", "bin")).toBe("mp4codecsavc1");
  });

  it("falls back when mime is missing or malformed", () => {
    expect(extensionFromMime(null, "mp4")).toBe("mp4");
    expect(extensionFromMime("", "mp4")).toBe("mp4");
    expect(extensionFromMime("video", "mp4")).toBe("mp4");
  });
});

describe("formatTimestamp", () => {
  it("formats a date as YYYYMMDD-HHMMSS with zero padding", () => {
    const date = new Date(2026, 0, 5, 9, 3, 7);
    expect(formatTimestamp(date)).toBe("20260105-090307");
  });
});

describe("hashString", () => {
  it("is deterministic", () => {
    expect(hashString("https://example.com/a")).toBe(hashString("https://example.com/a"));
  });

  it("differs for different inputs", () => {
    expect(hashString("https://example.com/a")).not.toBe(hashString("https://example.com/b"));
  });
});

describe("generateFilename", () => {
  it("builds a deterministic name from mediaType, date, ext, and seed", () => {
    const date = new Date(2026, 7, 11, 15, 30, 45);
    const name = generateFilename({ mediaType: "video", ext: "mp4", date, seed: "https://x/y" });
    expect(name).toBe(`telegram-video-20260811-153045-${hashString("https://x/y")}.mp4`);
  });

  it("omits the hash suffix when no seed is given", () => {
    const date = new Date(2026, 7, 11, 15, 30, 45);
    expect(generateFilename({ mediaType: "photo", ext: "jpg", date })).toBe(
      "telegram-photo-20260811-153045.jpg"
    );
  });
});
