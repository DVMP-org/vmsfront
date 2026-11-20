import { describe, expect, it } from "vitest";
import { planEntitlements } from "./plan-entitlements";

describe("plan entitlements", () => {
  it("names limits and benefits without exposing raw feature keys", () => {
    expect(
      planEntitlements({
        max_admins: 20,
        max_residents: 100,
        max_gates: 5,
        priority_support: true,
        white_labeling: false,
      }),
    ).toEqual([
      {
        key: "max_admins",
        label: "Organization administrators",
        detail: "20 included",
      },
      { key: "max_residents", label: "Residents", detail: "100 included" },
      { key: "max_gates", label: "Gates", detail: "5 included" },
      {
        key: "priority_support",
        label: "Priority support",
        detail: "Included",
      },
    ]);
  });

  it("does not present malformed limits as unlimited or zero", () => {
    expect(planEntitlements({ max_admins: "<000" })).toEqual([
      {
        key: "max_admins",
        label: "Organization administrators",
        detail: "Contact your account team for details",
      },
    ]);
  });

  it("shows scoped usage only for named numeric limits", () => {
    expect(
      planEntitlements(
        { max_admins: 5, max_residents: 20, priority_support: true },
        { max_admins: 2, max_residents: 22 },
      ),
    ).toEqual([
      {
        key: "max_admins",
        label: "Organization administrators",
        detail: "2 used of 5 · 3 available",
      },
      {
        key: "max_residents",
        label: "Residents",
        detail: "22 used of 20 · 2 over limit",
      },
      { key: "priority_support", label: "Priority support", detail: "Included" },
    ]);
  });
});
