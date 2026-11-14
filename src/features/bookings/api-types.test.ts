import { describe, expect, it } from "vitest";

import { canDecide } from "./api-types";

describe("canDecide", () => {
  it("allows a requested residential booking", () => {
    expect(canDecide({ status: "requested", domain: "residential" })).toBe(true);
  });

  it("allows a requested hospitality booking", () => {
    expect(canDecide({ status: "requested", domain: "hospitality" })).toBe(true);
  });

  it("refuses a booking that is still awaiting payment", () => {
    expect(canDecide({ status: "pending_payment", domain: "hospitality" })).toBe(
      false,
    );
  });

  it("refuses a booking that is already decided", () => {
    expect(canDecide({ status: "confirmed", domain: "residential" })).toBe(false);
    expect(canDecide({ status: "declined", domain: "hospitality" })).toBe(false);
  });

  it("refuses domains whose workflow is not specified", () => {
    expect(canDecide({ status: "requested", domain: "commercial" })).toBe(false);
    expect(canDecide({ status: "requested", domain: "mixed_use" })).toBe(false);
  });
});
