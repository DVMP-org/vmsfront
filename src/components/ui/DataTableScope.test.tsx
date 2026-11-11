import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DataTable } from "./DataTable";

// URL synchronization is exercised by its own hook suite.
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/gates",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("DataTable scope filters", () => {
  it("preserves a hidden Site filter when an editable filter changes or clears", async () => {
    const changed = vi.fn();
    render(
      <DataTable
        data={[]}
        columns={[{ key: "name", header: "Name" }]}
        initialFilters={[{ field: "site_id", operator: "eq", value: "site-a" }]}
        availableFilters={[
          {
            field: "status",
            label: "Status",
            type: "select",
            options: [{ value: "active", label: "Active" }],
          },
        ]}
        onFiltersChange={changed}
      />,
    );
    const control = screen.getAllByLabelText("Filter by Status")[0];
    fireEvent.change(control, { target: { value: "active" } });
    await waitFor(() =>
      expect(changed).toHaveBeenLastCalledWith([
        { field: "site_id", operator: "eq", value: "site-a" },
        { field: "status", operator: "eq", value: "active" },
      ]),
    );
    fireEvent.change(control, { target: { value: "" } });
    await waitFor(() =>
      expect(changed).toHaveBeenLastCalledWith([
        { field: "site_id", operator: "eq", value: "site-a" },
      ]),
    );
  });
});
