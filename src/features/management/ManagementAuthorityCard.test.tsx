import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ManagementAuthorityCard } from "./ManagementAuthorityCard";

const management = {
  mode: "inherited" as const,
  management_required: false,
  is_administrator: true,
  authoritative_place: {
    id: "complex",
    name: "Harbour Complex",
    slug: "harbour-complex",
    kind: "site",
  },
  administrators: [
    {
      party_id: "admin",
      display_name: "Complex Admin",
      email: "admin@example.test",
      role: "admin",
    },
  ],
};

describe("ManagementAuthorityCard", () => {
  it("shows inherited management without creating a local admin", () => {
    render(<ManagementAuthorityCard management={management} />);

    expect(screen.getByText("Inherited administration")).toBeInTheDocument();
    expect(screen.getByText("Managed by Harbour Complex")).toBeInTheDocument();
    expect(screen.getByText("Complex Admin")).toBeInTheDocument();
  });

  it("shows nothing when the party is not an administrator", () => {
    const { container } = render(
      <ManagementAuthorityCard
        management={{ ...management, is_administrator: false }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
