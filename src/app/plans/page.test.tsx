import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PlansPage from "./page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  subscribe: vi.fn(),
  needsFirstSite: true,
}));

vi.mock("@/components/layout/Header", () => ({ Header: () => null }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock("@/hooks/use-organization", () => ({
  usePlans: () => ({
    data: [
      {
        id: "free-plan",
        name: "Free Plan",
        slug: "free-plan",
        description: null,
        price_monthly: 0,
        price_yearly: 0,
        features: {},
        trial_days: null,
        is_active: true,
        sort_order: 0,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    isLoading: false,
  }),
  useCurrentOrganization: () => ({
    organization: {
      id: "org",
      name: "Harbour",
      slug: "harbour",
      needs_first_site: mocks.needsFirstSite,
    },
    isPending: false,
  }),
}));
vi.mock("@/hooks/use-subscription", () => ({
  useSubscribeToPlan: () => ({
    mutateAsync: mocks.subscribe,
    isPending: false,
  }),
  useSubscriptionPaymentStatus: () => ({ data: null }),
}));

describe("plan activation setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.needsFirstSite = true;
    window.sessionStorage.clear();
    window.history.replaceState({}, "", "/plans?setup=first-workspace");
    mocks.subscribe.mockResolvedValue({
      data: {
        id: "subscription",
        plan_id: "free-plan",
        status: "active",
      },
    });
  });

  it("continues to first-place creation instead of the dashboard", async () => {
    render(<PlansPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Activate and continue/ }),
    );

    await waitFor(() =>
      expect(mocks.subscribe).toHaveBeenCalledWith({
        plan_id: "free-plan",
        billing_cycle: "monthly",
      }),
    );
    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/properties/new?setup=first-place",
    );
    expect(mocks.push).not.toHaveBeenCalledWith("/admin");
  });

  it("returns to the property directory when the first place already exists", async () => {
    mocks.needsFirstSite = false;
    render(<PlansPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Activate and continue/ }),
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/admin/properties"),
    );
    expect(mocks.push).not.toHaveBeenCalledWith("/admin");
  });

  it("keeps the first-place gate even when the setup query was lost", async () => {
    window.history.replaceState({}, "", "/plans");
    render(<PlansPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Activate Free Plan/ }),
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        "/admin/properties/new?setup=first-place",
      ),
    );
    expect(mocks.replace).not.toHaveBeenCalledWith("/admin");
  });
});
