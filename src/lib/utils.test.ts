import { describe, expect, it } from "vitest";

import { getFullName } from "@/lib/utils";

describe("getFullName", () => {
  it("falls back to the account email instead of Unknown User", () => {
    expect(getFullName(null, undefined, "user@example.test")).toBe(
      "user@example.test",
    );
  });
});
