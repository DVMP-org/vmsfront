import { fireEvent, render, screen } from "@testing-library/react";
import { Building2 } from "lucide-react";
import { describe, expect, it } from "vitest";

import { VmsWordmark } from "@/components/brand/VmsBrand";
import { OperationsIllustration } from "@/components/illustrations/OperationsIllustration";
import { ActionCard } from "./ActionCard";
import { Avatar } from "./Avatar";
import { Breadcrumbs } from "./Breadcrumbs";
import { PropertyImage } from "./PropertyImage";
import { SearchField } from "./SearchField";
import { StatusBadge } from "./StatusBadge";
import { WorkflowTimeline } from "./WorkflowTimeline";

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

  it("provides deterministic identity and place fallbacks", () => {
    render(
      <>
        <Avatar name="Ada Okafor" />
        <PropertyImage name="Harbour Court" />
        <StatusBadge tone="warning">Awaiting approval</StatusBadge>
      </>,
    );

    expect(screen.getByRole("img", { name: "Ada Okafor" })).toHaveTextContent(
      "AO",
    );
    expect(screen.getByRole("img", { name: "Harbour Court" })).toBeVisible();
    expect(screen.getByText("Awaiting approval")).toBeVisible();
  });

  it("keeps breadcrumbs and workflow progress semantically labelled", () => {
    render(
      <>
        <Breadcrumbs
          items={[
            { label: "Harbour Court", href: "/admin" },
            { label: "Properties", href: "/admin/properties" },
            { label: "Anchor House" },
          ]}
        />
        <WorkflowTimeline
          steps={[
            { id: "details", label: "Details", state: "complete" },
            { id: "review", label: "Review", state: "current" },
            { id: "create", label: "Create", state: "pending" },
          ]}
        />
      </>,
    );

    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Workflow progress" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Review").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("offers compact search clearing without losing the label", () => {
    const changes: string[] = [];
    render(
      <SearchField
        label="Search records"
        value="Harbour"
        onValueChange={(value) => changes.push(value)}
        shortcut="⌘K"
      />,
    );

    expect(screen.getByLabelText("Search records")).toHaveValue("Harbour");
    fireEvent.click(
      screen.getByRole("button", { name: "Clear search records" }),
    );
    expect(changes).toContain("");
  });
});
