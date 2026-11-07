import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { it, vi, expect } from "vitest";
import { FacetPicker } from "./FacetPicker";
import { loadFacets } from "./client";
vi.mock("./client", () => ({ loadFacets: vi.fn() }));
const item = {
  value: "a",
  label: "Ada",
  disabled: false,
  meta: { kind: "person" as const, user_linked: false },
};
it("handles option failure, pagination, search reset and selection", async () => {
  const change = vi.fn();
  vi.mocked(loadFacets).mockRejectedValueOnce(new Error("offline"));
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <FacetPicker
        facet="parties"
        kind="person"
        contextKey="org"
        label="Guest"
        value={null}
        onChange={change}
      />
    </QueryClientProvider>,
  );
  await screen.findByRole("button", { name: "Retry options" });
  vi.mocked(loadFacets).mockResolvedValue({
    facet: "parties",
    contract_version: "vmscore.facets/v1",
    items: [item],
    has_more: true,
    next_cursor: "cursor",
    revision: "r",
  });
  fireEvent.click(screen.getByRole("button", { name: "Retry options" }));
  await screen.findByRole("button", { name: "Ada" });
  fireEvent.click(screen.getByRole("button", { name: "More options" }));
  await waitFor(() =>
    expect(loadFacets).toHaveBeenCalledWith(
      "parties",
      expect.objectContaining({ cursor: "cursor" }),
    ),
  );
  fireEvent.change(screen.getByLabelText("Search guest"), {
    target: { value: "Ada" },
  });
  await waitFor(() =>
    expect(loadFacets).toHaveBeenCalledWith(
      "parties",
      expect.objectContaining({ search: "Ada", cursor: null }),
    ),
  );
  fireEvent.click(await screen.findByRole("button", { name: "Ada" }));
  expect(change).toHaveBeenCalledWith(item);
});
it("invalidates a selected option that no longer exists or is permitted", async () => {
  vi.mocked(loadFacets).mockResolvedValue({
    facet: "parties",
    contract_version: "vmscore.facets/v1",
    items: [],
    has_more: false,
    next_cursor: null,
    revision: "r",
  });
  const change = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FacetPicker
        facet="parties"
        kind="person"
        contextKey="new-org"
        label="Guest"
        value={item}
        onChange={change}
      />
    </QueryClientProvider>,
  );
  await waitFor(() => expect(change).toHaveBeenCalledWith(null));
});
