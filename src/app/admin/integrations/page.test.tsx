import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import IntegrationsSection from "@/app/admin/settings/components/IntegrationsSection";
import AdminIntegrationsPage from "./page";

const mocks = vi.hoisted(() => ({
  integrations: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  push: vi.fn(),
  refetch: vi.fn(),
  pathname: "/admin/integrations",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  usePathname: () => mocks.pathname,
}));

vi.mock("@/hooks/use-integrations", () => ({
  useIntegrations: mocks.integrations,
  useEnableIntegration: () => ({
    mutate: mocks.enable,
    isPending: false,
    variables: undefined,
    error: null,
  }),
  useDisableIntegration: () => ({
    mutate: mocks.disable,
    isPending: false,
    variables: undefined,
    error: null,
  }),
}));

const twilio = {
  id: "twilio",
  name: "twilio",
  provider: "messaging",
  description: "Transactional SMS and delivery receipts.",
  logo_url: null,
  enabled: true,
  configured: true,
};

const stripe = {
  id: "stripe",
  name: "stripe",
  provider: "payment",
  description: "Card payments and settlement for organization charges.",
  logo_url: null,
  enabled: false,
  configured: true,
};

const whatsapp = {
  id: "whatsapp",
  name: "whatsapp",
  provider: "messaging",
  description: "Resident and visitor conversations through WhatsApp.",
  logo_url: null,
  enabled: false,
  configured: false,
};

function healthyResponse(items = [twilio, stripe, whatsapp]) {
  return {
    data: {
      items,
      total: items.length,
      page: 1,
      page_size: 100,
      total_pages: 1,
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: mocks.refetch,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pathname = "/admin/integrations";
  mocks.integrations.mockReturnValue(healthyResponse());
});

describe("integration catalog", () => {
  it("presents connected, paused and needs-setup providers as a catalog", () => {
    render(<AdminIntegrationsPage />);

    expect(screen.getByRole("heading", { name: "Integrations" })).toBeInTheDocument();
    expect(screen.getByText("Twilio")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.getByText("Whatsapp")).toBeInTheDocument();

    const twilioCard = screen.getByText("Twilio").closest("article");
    expect(twilioCard).not.toBeNull();
    expect(within(twilioCard!).getByText("Connected")).toBeInTheDocument();

    const stripeCard = screen.getByText("Stripe").closest("article");
    expect(within(stripeCard!).getByText("Paused")).toBeInTheDocument();

    const whatsappCard = screen.getByText("Whatsapp").closest("article");
    expect(within(whatsappCard!).getByText("Needs setup")).toBeInTheDocument();
  });

  it("summarises connection state without fabricating metrics", () => {
    render(<AdminIntegrationsPage />);

    const summary = screen.getByRole("region", { name: "Integration summary" });
    expect(within(summary).getByText("Connected").closest("div")).toHaveTextContent(
      "1",
    );
    expect(within(summary).getByText("Configured").closest("div")).toHaveTextContent(
      "2",
    );
    expect(within(summary).getByText("Needs setup").closest("div")).toHaveTextContent(
      "1",
    );
  });

  it("filters by search, status and category", () => {
    render(<AdminIntegrationsPage />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search integrations" }), {
      target: { value: "settlement" },
    });
    expect(screen.getByText("Stripe")).toBeInTheDocument();
    expect(screen.queryByText("Twilio")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    fireEvent.click(screen.getByRole("button", { name: "Needs setup" }));
    expect(screen.getByText("Whatsapp")).toBeInTheDocument();
    expect(screen.queryByText("Stripe")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.click(screen.getByRole("button", { name: "Messaging" }));
    expect(screen.getByText("Twilio")).toBeInTheDocument();
    expect(screen.getByText("Whatsapp")).toBeInTheDocument();
    expect(screen.queryByText("Stripe")).not.toBeInTheDocument();
  });

  it("explains an empty filter result and clears it", () => {
    render(<AdminIntegrationsPage />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search integrations" }), {
      target: { value: "no-such-provider" },
    });

    expect(
      screen.getByText("No integrations match these filters"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByText("Twilio")).toBeInTheDocument();
  });

  it("disables a connected provider through the labelled switch", () => {
    render(<AdminIntegrationsPage />);

    fireEvent.click(
      screen.getByRole("switch", { name: "Disable Twilio" }),
    );

    expect(mocks.disable).toHaveBeenCalledWith("twilio");
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("sends an unconfigured provider to setup instead of exposing a toggle", () => {
    render(<AdminIntegrationsPage />);

    expect(
      screen.queryByRole("switch", { name: /Whatsapp/ }),
    ).not.toBeInTheDocument();

    const whatsappCard = screen.getByText("Whatsapp").closest("article")!;
    fireEvent.click(within(whatsappCard).getByRole("button", { name: "Set up" }));

    expect(mocks.push).toHaveBeenCalledWith("/admin/integrations/whatsapp");
  });

  it("keeps organization settings navigation inside the organization route", () => {
    mocks.pathname = "/organization/settings/integrations";
    render(<IntegrationsSection embedded />);

    expect(
      screen.queryByRole("heading", { name: "Integrations" }),
    ).not.toBeInTheDocument();

    const whatsappCard = screen.getByText("Whatsapp").closest("article")!;
    fireEvent.click(within(whatsappCard).getByRole("button", { name: "Set up" }));

    expect(mocks.push).toHaveBeenCalledWith(
      "/organization/settings/integrations/whatsapp",
    );
  });

  it("shows a recoverable error state", () => {
    mocks.integrations.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isFetching: false,
      refetch: mocks.refetch,
    });

    render(<AdminIntegrationsPage />);

    expect(
      screen.getByText("Integrations could not be loaded"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.refetch).toHaveBeenCalled();
  });
});
