import { render, screen } from "@testing-library/react";
import { Building2 } from "lucide-react";
import { describe, expect, it } from "vitest";

import { VmsWordmark } from "@/components/brand/VmsBrand";
import { OperationsIllustration } from "@/components/illustrations/OperationsIllustration";
import { ActionCard } from "./ActionCard";

describe("UI visual system", () => {
  it("renders the VMS Core wordmark and accessible property illustration", () => {
    render(
      <>
        <VmsWordmark />
        <OperationsIllustration variant="property" />
      </>,
    );

    expect(screen.getByText(/VMS/i)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /property and place illustration/i }),
    ).toBeInTheDocument();
  });

  it("renders action cards as links with a complete description", () => {
    render(
      <ActionCard
        href="/admin/properties/new"
        icon={Building2}
        title="Add property"
        description="Create the next managed place."
        eyebrow="Portfolio"
        meta="Building operations"
        tone="coral"
      />,
    );

    const link = screen.getByRole("link", { name: /add property/i });
    expect(link).toHaveAttribute("href", "/admin/properties/new");
    expect(link).toHaveTextContent("Create the next managed place.");
    expect(link).toHaveTextContent("Building operations");
  });
});
