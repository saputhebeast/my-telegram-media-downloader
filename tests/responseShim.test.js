import { describe, expect, it } from "vitest";
import { createResponseShim } from "../src/lib/responseShim.js";

describe("createResponseShim", () => {
  it("exposes status/url/redirected and case-insensitive header lookup", async () => {
    const buffer = new TextEncoder().encode("hello").buffer;
    const shim = createResponseShim({
      status: 206,
      url: "https://example.com/x",
      redirected: false,
      headersEntries: [
        ["Content-Type", "video/mp4"],
        ["Content-Range", "bytes 0-4/5"],
      ],
      buffer,
    });

    expect(shim.status).toBe(206);
    expect(shim.url).toBe("https://example.com/x");
    expect(shim.redirected).toBe(false);
    expect(shim.headers.get("content-type")).toBe("video/mp4");
    expect(shim.headers.get("CONTENT-RANGE")).toBe("bytes 0-4/5");
    expect(shim.headers.get("missing-header")).toBeNull();
  });

  it("wraps the transferred buffer in a Blob", async () => {
    const buffer = new TextEncoder().encode("hello").buffer;
    const shim = createResponseShim({
      status: 200,
      url: "https://example.com/x",
      redirected: false,
      headersEntries: [],
      buffer,
    });

    const blob = await shim.blob();
    expect(blob.size).toBe(5);
  });
});
