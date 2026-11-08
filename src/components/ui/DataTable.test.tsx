import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Column, DataTable } from "./DataTable";
import { PaginationBar } from "./PaginationBar";

type Person = { id: string; name: string; role: string };

const columns: Column<Person>[] = [
  { key: "name", header: "Name", sortable: true },
  { key: "role", header: "Role" },
];

describe("DataTable register foundation", () => {
  it("renders an optional labelled mobile representation without duplicating actions", () => {
    render(
      <DataTable
        data={[{ id: "one", name: "Ada", role: "Resident" }]}
        columns={columns}
        tableLabel="People register"
        mobileSummary={(row) => (
          <div>
            <strong>{row.name}</strong>
            <span>{row.role}</span>
          </div>
        )}
      />,
    );

    expect(
      screen.getByRole("region", { name: "People register" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "People register row summaries" }),
    ).toHaveTextContent("AdaResident");
  });

  it("keeps stale data visible with an explicit retry action", () => {
    const retry = vi.fn();
    render(
      <DataTable
        data={[{ id: "one", name: "Ada", role: "Resident" }]}
        columns={columns}
        isStale
        staleMessage="The latest update failed. Showing saved results."
        onRetry={retry}
      />,
    );

    expect(
      screen.getByText("The latest update failed. Showing saved results."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});

describe("PaginationBar", () => {
  it("reports zero results without a nonsensical 1-0 range", () => {
    render(
      <PaginationBar
        page={1}
        pageSize={10}
        total={0}
        totalPages={0}
        resourceLabel="properties"
        onChange={() => undefined}
      />,
    );

    expect(
      screen.getByRole("navigation", { name: "properties pagination" }),
    ).toHaveTextContent("Showing 0-0 of 0 properties");
  });
});
