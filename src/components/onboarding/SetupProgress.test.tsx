import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetupProgress } from "./SetupProgress";

describe("SetupProgress", () => {
  it("marks completed, current and upcoming setup steps", () => {
    render(<SetupProgress currentStep="plan" />);

    const current = screen.getByText("Plan").closest("li");
    const organization = screen.getByText("Organization").closest("li");
    const site = screen.getByText("First Site").closest("li");

    expect(current).toHaveAttribute("aria-current", "step");
    expect(organization).not.toHaveAttribute("aria-current");
    expect(site).not.toHaveAttribute("aria-current");
  });
});
