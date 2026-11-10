import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card, CardContent, CardHeader, CardTitle } from "./Card";
import { Input } from "./Input";

describe("Operations Hub foundations", () => {
  it("forwards the button ref and exposes a stable loading state", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Button ref={ref} isLoading loadingLabel="Saving decision…">
        Save decision
      </Button>,
    );

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toBeDisabled();
    expect(ref.current).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("button", { name: /save decision/i }),
    ).toBeVisible();
  });

  it("applies button styling directly to a linked action", () => {
    render(
      <Button asChild className="w-full">
        <a href="/admin/places/unit-1">View unit</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "View unit" })).toHaveClass(
      "inline-flex",
      "w-full",
    );
  });

  it("associates persistent input labels, help and errors", () => {
    render(
      <Input
        label="Workspace URL"
        description="Use a property name."
        error="That URL is already used."
        showAsterisk
      />,
    );

    const input = screen.getByLabelText(/workspace url/i);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      /use a property name.*that url is already used/i,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "That URL is already used.",
    );
  });

  it("renders semantic status text inside a non-interactive badge", () => {
    render(<Badge variant="success">Paid</Badge>);
    const badge = screen.getByText("Paid");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).toHaveClass("text-[var(--vms-success)]");
  });

  it("uses one flat surface rather than hover-lifting cards", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Property summary</CardTitle>
        </CardHeader>
        <CardContent>Operations context</CardContent>
      </Card>,
    );
    const card = container.firstElementChild;
    expect(card).not.toHaveClass("card-inset");
    expect(card).toHaveClass("bg-[var(--vms-surface)]");
  });
});
