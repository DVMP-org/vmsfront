import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";
import { Loader } from "./loader";

describe("Operations Hub accessibility contracts", () => {
  it("exposes one page heading and wraps its actions responsively", () => {
    render(
      <PageHeader
        eyebrow="Harbour Estate / Properties"
        title="Properties"
        description="Manage the property register."
        primaryAction={<button>Add property</button>}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Properties" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add property" }),
    ).toBeInTheDocument();
  });

  it("keeps decorative loaders out of the accessibility tree", () => {
    const { container } = render(<Loader colour="action" />);
    const icon = container.querySelector("svg");
    const glyph = container.querySelector("path");

    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveAttribute("focusable", "false");
    expect(glyph).toHaveClass("text-[var(--vms-action)]");
  });
});
