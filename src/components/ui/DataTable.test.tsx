import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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

  it("generates an accessible mobile summary when no custom card is supplied", () => {
    render(
      <DataTable
        data={[{ id: "one", name: "Ada", role: "Resident" }]}
        columns={columns}
        tableLabel="People register"
      />,
    );

    expect(
      screen.getByRole("list", { name: "People register row summaries" }),
    ).toHaveTextContent("NameAdaRoleResident");
  });

  it("lets operators hide and restore columns", () => {
    render(
      <DataTable
        data={[{ id: "one", name: "Ada", role: "Resident" }]}
        columns={columns}
      />,
    );

    fireEvent.click(screen.getByText("Columns"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Role" }));
    expect(screen.queryByRole("columnheader", { name: "Role" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Reset columns" }));
    expect(
      screen.getByRole("columnheader", { name: "Role" }),
    ).toBeInTheDocument();
  });

  it("dismisses the column picker outside and on Escape without resetting choices", () => {
    render(
      <DataTable
        data={[{ id: "one", name: "Ada", role: "Resident" }]}
        columns={columns}
      />,
    );
    const trigger = screen.getByText("Columns").closest("summary")!;
    const picker = trigger.closest("details")!;
    fireEvent.click(trigger);
    const role = screen.getByRole("checkbox", { name: "Role" });
    fireEvent.pointerDown(role);
    fireEvent.click(role);
    expect(picker).toHaveAttribute("open");
    expect(role).not.toBeChecked();
    fireEvent.pointerDown(document.body, { pointerType: "touch" });
    expect(picker).not.toHaveAttribute("open");
    fireEvent.click(trigger);
    expect(role).not.toBeChecked();
    role.focus();
    fireEvent.keyDown(role, { key: "Escape" });
    expect(picker).not.toHaveAttribute("open");
    expect(trigger).toHaveFocus();
    expect(
      screen.queryByRole("columnheader", { name: "Role" }),
    ).not.toBeInTheDocument();
  });

  it("debounces remote search while keeping the input responsive", () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    render(
      <DataTable
        data={[]}
        columns={columns}
        searchPlaceholder="Search people"
        onSearchChange={onSearchChange}
      />,
    );

    const search = screen.getByPlaceholderText("Search people");
    fireEvent.change(search, { target: { value: "Ada" } });
    expect(search).toHaveValue("Ada");
    expect(onSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearchChange).toHaveBeenCalledWith("Ada");
    vi.useRealTimers();
  });

  it("confirms a destructive bulk action for the selected rows", async () => {
    const archive = vi.fn();
    render(
      <DataTable
        data={[{ id: "one", name: "Ada", role: "Resident" }]}
        columns={columns}
        selectable
        bulkActions={[{ label: "Archive", onClick: archive }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Select row" }));
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    expect(archive).toHaveBeenCalledWith(["one"]);
  });

  it("applies searchable select filters to client-side collections", async () => {
    render(
      <DataTable
        data={[
          { id: "one", name: "Ada", role: "Administrator" },
          { id: "two", name: "Tunde", role: "Resident" },
        ]}
        columns={columns}
        availableFilters={[
          {
            field: "role",
            label: "Scope",
            type: "select",
            options: [
              { value: "Administrator", label: "Administrator" },
              { value: "Resident", label: "Resident" },
            ],
          },
        ]}
      />,
    );

    fireEvent.change(
      screen.getAllByRole("combobox", { name: "Filter by Scope" })[0],
      {
        target: { value: "Resident" },
      },
    );
    await waitFor(() =>
      expect(screen.queryByText("Ada")).not.toBeInTheDocument(),
    );
    expect(screen.getAllByText("Tunde").length).toBeGreaterThan(0);
  });
});

afterEach(() => {
  vi.useRealTimers();
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
