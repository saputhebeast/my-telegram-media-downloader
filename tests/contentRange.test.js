import { describe, expect, it } from "vitest";
import { calculateProgress, hasGap, parseContentRange } from "../src/lib/contentRange.js";

describe("parseContentRange", () => {
  it("parses a valid Content-Range header", () => {
    expect(parseContentRange("bytes 0-1048575/52428800")).toEqual({
      start: 0,
      end: 1048575,
      total: 52428800,
    });
  });

  it("parses a mid-stream range", () => {
    expect(parseContentRange("bytes 1048576-2097151/52428800")).toEqual({
      start: 1048576,
      end: 2097151,
      total: 52428800,
    });
  });

  it("returns null for a missing header", () => {
    expect(parseContentRange(null)).toBeNull();
    expect(parseContentRange(undefined)).toBeNull();
    expect(parseContentRange("")).toBeNull();
  });

  it("returns null for a malformed header", () => {
    expect(parseContentRange("bytes */52428800")).toBeNull();
    expect(parseContentRange("not-a-range")).toBeNull();
    expect(parseContentRange("bytes 0-1048575")).toBeNull();
  });
});

describe("hasGap", () => {
  it("detects no gap when the chunk continues where the last one left off", () => {
    expect(hasGap(1048576, 1048576)).toBe(false);
  });

  it("detects a gap when bytes were skipped", () => {
    expect(hasGap(1048576, 2097152)).toBe(true);
  });

  it("detects a gap when bytes overlap/duplicate", () => {
    expect(hasGap(1048576, 524288)).toBe(true);
  });
});

describe("calculateProgress", () => {
  it("computes a percentage", () => {
    expect(calculateProgress(26214400, 52428800)).toBe(50);
  });

  it("caps at 100", () => {
    expect(calculateProgress(60000000, 52428800)).toBe(100);
  });

  it("returns null when total is unknown or zero", () => {
    expect(calculateProgress(1000, null)).toBeNull();
    expect(calculateProgress(1000, 0)).toBeNull();
  });
});
