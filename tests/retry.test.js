import { describe, expect, it } from "vitest";
import { backoffDelay } from "../src/lib/retry.js";

describe("backoffDelay", () => {
  it("doubles with each attempt", () => {
    expect(backoffDelay(0, 300, 5000)).toBe(300);
    expect(backoffDelay(1, 300, 5000)).toBe(600);
    expect(backoffDelay(2, 300, 5000)).toBe(1200);
  });

  it("caps at maxMs", () => {
    expect(backoffDelay(10, 300, 5000)).toBe(5000);
  });
});
