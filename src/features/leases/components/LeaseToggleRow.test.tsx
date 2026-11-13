import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LeaseToggleRow } from "./LeaseToggleRow";

/**
 * A bare `Switch` renders only the track: its label and description are
 * accessibility-only. Anything that changes money must show the explanation on
 * screen, and the description the switch points at must actually exist.
 */
describe("lease toggle row", () => {
  it("shows the label and the explanation, not just a slider", () => {
    render(
      <LeaseToggleRow
        id="rent-definition"
        label="Create a new Rent charge definition"
        description="Off reuses the Site's existing Rent definition."
        checked={false}
        onChange={() => {}}
      />,
    );

    expect(
      screen.getByText("Create a new Rent charge definition"),
    ).toBeVisible();
    expect(
      screen.getByText("Off reuses the Site's existing Rent definition."),
    ).toBeVisible();
  });

  it("points the switch at a description element that exists", () => {
    render(
      <LeaseToggleRow
        id="rent-definition"
        label="Create a new Rent charge definition"
        description="Off reuses the Site's existing Rent definition."
        checked={false}
        onChange={() => {}}
      />,
    );

    const control = screen.getByRole("switch", {
      name: "Create a new Rent charge definition",
    });
    expect(control).toHaveAttribute("aria-describedby", "rent-definition-description");
    expect(document.getElementById("rent-definition-description")).toHaveTextContent(
      "Off reuses the Site's existing Rent definition.",
    );
  });

  it("reports the opposite state when toggled", () => {
    const onChange = vi.fn();
    render(
      <LeaseToggleRow
        id="rent-definition"
        label="Create a new definition"
        description="Off reuses the Site definition with the same name."
        checked={false}
        onChange={onChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("switch", { name: "Create a new definition" }),
    );
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
