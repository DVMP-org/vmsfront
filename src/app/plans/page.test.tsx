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
    window.history.replaceState({}, "", "/plans?setup=first-site");
    mocks.subscribe.mockResolvedValue({
      data: {
        id: "subscription",
        plan_id: "free-plan",
        status: "active",
      },
    });
  });

  it("continues to first-Site creation instead of the dashboard", async () => {
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
    expect(mocks.replace).toHaveBeenCalledWith("/setup/first-site");
    expect(mocks.push).not.toHaveBeenCalledWith("/admin");
  });

  it("returns to workspace selection when the first Site already exists", async () => {
    mocks.needsFirstSite = false;
    render(<PlansPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Activate and continue/ }),
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/"),
    );
    expect(mocks.push).not.toHaveBeenCalledWith("/admin");
  });

  it("keeps the first-Site gate even when the setup query was lost", async () => {
    window.history.replaceState({}, "", "/plans");
    render(<PlansPage />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Activate Free Plan/ }),
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/setup/first-site"),
    );
    expect(mocks.replace).not.toHaveBeenCalledWith("/admin");
  });

  it("ignores the retired first-workspace setup query", async () => {
    window.history.replaceState({}, "", "/plans?setup=first-workspace");
    render(<PlansPage />);

    expect(
      await screen.findByRole("heading", { name: "Choose Your Plan" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Continue setting up" }),
    ).toBeNull();
  });
});
