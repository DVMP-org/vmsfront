import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { accessJourneyKeys, useCreateInvitation } from "./queries";

vi.mock("./api", () => ({
  accessJourneyApi: { create: vi.fn().mockResolvedValue({ id: "new" }) },
}));

describe("invitation creation", () => {
  it("invalidates visitor and invitation views across Places and retains unrelated data", async () => {
    const client = new QueryClient();
    const first = accessJourneyKeys.list("place-a", "party-a");
    const second = accessJourneyKeys.list("place-b", "party-b");
    client.setQueryData(first, { items: [] });
    client.setQueryData(second, { items: [] });
    client.setQueryData(["unrelated"], []);
    const { result } = renderHook(() => useCreateInvitation(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });
    await act(async () => {
      await result.current.mutateAsync({} as never);
    });
    expect(client.getQueryState(first)?.isInvalidated).toBe(true);
    expect(client.getQueryState(second)?.isInvalidated).toBe(true);
    expect(client.getQueryState(["unrelated"])?.isInvalidated).toBe(false);
  });
  it("matches scoped domain keys independently of object identity and pagination", async () => {
    const client = new QueryClient();
    const first = queryKeys.charges.definitions(
      queryKeys.scope("org", "site-a", "user"),
      1,
      "site-a",
    );
    const second = queryKeys.charges.definitions(
      queryKeys.scope("org", "site-a", "user"),
      2,
      "site-a",
    );
    const other = queryKeys.charges.definitions(
      queryKeys.scope("org", "site-b", "user"),
      1,
      "site-b",
    );
    [first, second, other].forEach((key) => client.setQueryData(key, []));
    await client.invalidateQueries({
      queryKey: ["charges", { siteId: "site-a" }],
    });
    expect(client.getQueryState(first)?.isInvalidated).toBe(true);
    expect(client.getQueryState(second)?.isInvalidated).toBe(true);
    expect(client.getQueryState(other)?.isInvalidated).toBe(false);
  });
});
