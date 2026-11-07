import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FirstWorkspaceSetup } from "./FirstWorkspaceSetup";

describe("FirstWorkspaceSetup", () => {
  it("shows completion context and opens the property hierarchy", () => {
    const openProperties = vi.fn();
    render(
      <FirstWorkspaceSetup
        rootPlaceCount={1}
        onOpenProperties={openProperties}
        onDismiss={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Your management workspace is ready",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 root property")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Review first property/ }),
    );
    expect(openProperties).toHaveBeenCalledOnce();
  });

  it("guides users to create a property when none exists", () => {
    render(
      <FirstWorkspaceSetup
        rootPlaceCount={0}
        onOpenProperties={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("No property created yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create first property/ }),
    ).toBeInTheDocument();
  });
});
