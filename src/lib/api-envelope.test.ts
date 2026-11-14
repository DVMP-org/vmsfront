import { describe, expect, it } from "vitest";

import { unwrap } from "./api-envelope";

describe("unwrap", () => {
  it("returns the payload, not the envelope", () => {
    const response = {
      success: true,
      message: "Bookings fetched successfully",
      data: { items: [{ id: "b1" }], total: 1 },
    };

    expect(unwrap(response)).toEqual({ items: [{ id: "b1" }], total: 1 });
  });

  it("keeps the message out of the payload the UI consumes", () => {
    const response = {
      success: true,
      message: "Payment recorded",
      data: { id: "p1", amount: "150.00" },
    };

    const payment = unwrap(response);

    expect(payment).not.toHaveProperty("message");
    expect(payment.amount).toBe("150.00");
  });
});
