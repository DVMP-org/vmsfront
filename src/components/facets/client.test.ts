import { vi, it, expect } from "vitest";
import { apiClient } from "@/lib/api-client";
import { loadFacets } from "./client";
import manifest from "@/contracts/facets.v1.json";
vi.mock("@/lib/api-client", () => ({ apiClient: { get: vi.fn() } }));
it("keeps the allowlist aligned with the published facet contract", () => {
  expect(Object.keys(manifest.facets).sort()).toEqual(["parties", "places"]);
  expect(manifest.contract_version).toBe("vmscore.facets/v1");
});
it("omits empty search and serializes repeated ids for selected hydration", async () => {
  vi.mocked(apiClient.get).mockResolvedValue({
    facet: "parties",
    contract_version: "vmscore.facets/v1",
    items: [],
    has_more: false,
    next_cursor: null,
    revision: "r",
  });
  await loadFacets("parties", {
    filters: { kind: "person" },
    search: " ",
    ids: ["a", "b"],
  });
  const url = new URL(
    vi.mocked(apiClient.get).mock.calls.at(-1)![0],
    "https://api.test",
  );
  expect(url.searchParams.has("search")).toBe(false);
  expect(url.searchParams.getAll("ids")).toEqual(["a", "b"]);
});
it("rejects an incompatible response instead of rendering invalid options", async () => {
  vi.mocked(apiClient.get).mockResolvedValue({
    facet: "parties",
    contract_version: "old",
  });
  await expect(loadFacets("parties", { filters: {} })).rejects.toThrow(
    "Unsupported",
  );
});
