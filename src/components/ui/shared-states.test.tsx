import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";
import { EmptyState } from "./EmptyState";
import PageLoader from "./PageLoader";

describe("shared Operations Hub states", () => {
  it("links checkbox help and preserves label interaction", () => {
    const onChange = vi.fn();
    render(
      <Checkbox
        label="Include archived records"
        description="Archived records stay read-only."
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Include archived records",
    });
    expect(checkbox).toHaveAccessibleDescription(
      "Archived records stay read-only.",
    );

    fireEvent.click(screen.getByText("Include archived records"));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("carries an explicit next action in the empty state", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="No properties yet"
        description="Create the first property to begin."
        action={{ label: "Add property", onClick }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add property" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("announces loading without relying on an emoji", () => {
    render(<PageLoader message="Loading properties" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading properties");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});
