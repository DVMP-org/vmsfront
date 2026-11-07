import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VisitAuthorization } from "@/features/access-journey/api";
import { invitationApprovalsApi } from "./api";
import { InvitationApprovals } from "./InvitationApprovals";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./api", () => ({
  invitationApprovalsApi: {
    list: vi.fn(),
    approve: vi.fn(),
    decline: vi.fn(),
  },
}));

const invitation: VisitAuthorization = {
  id: "invite",
  host_party_id: "host",
  destination_place_id: "unit",
  code: "VISIT-ABC123",
  qr_code_url: null,
  status: "requested",
  valid_from: "2026-11-07T10:00:00.000Z",
  valid_to: "2026-11-07T16:00:00.000Z",
  max_uses: 2,
  uses_count: 0,
  purpose: "Family visit",
  additional_information: null,
  decline_reason: null,
  requested_at: "2026-11-07T08:00:00.000Z",
  decided_at: null,
  host_party: { display_name: "Alex Morgan" },
  destination_place: {
    id: "unit",
    name: "Apartment A-101",
    kind: "unit",
    address: "1 Harbour Way",
  },
  guests: [
    {
      id: "guest",
      display_name_snapshot: "Ada Visitor",
      email_snapshot: null,
      phone_snapshot: null,
      suffix: "001",
    },
  ],
};

function renderApprovals() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <InvitationApprovals />
    </QueryClientProvider>,
  );
}

describe("InvitationApprovals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invitationApprovalsApi.list).mockResolvedValue({
      items: [invitation],
      total: 1,
      page: 1,
      page_size: 100,
      total_pages: 1,
    });
    vi.mocked(invitationApprovalsApi.approve).mockResolvedValue({
      ...invitation,
      status: "approved",
    });
    vi.mocked(invitationApprovalsApi.decline).mockResolvedValue({
      ...invitation,
      status: "declined",
      decline_reason: "Host unavailable",
    });
  });

  it("shows the canonical pending invitation with host and destination context", async () => {
    renderApprovals();

    expect(await screen.findByText("Ada Visitor")).toBeInTheDocument();
    expect(screen.getByText("VISIT-ABC123")).toBeInTheDocument();
    expect(screen.getByText("Invited by Alex Morgan")).toBeInTheDocument();
    expect(screen.getByText("Apartment A-101")).toBeInTheDocument();
    expect(screen.getAllByText("Awaiting approval")).toHaveLength(3);
  });

  it("approves a requested invitation", async () => {
    renderApprovals();

    fireEvent.click(
      await screen.findByRole("button", { name: /approve invitation/i }),
    );

    await waitFor(() =>
      expect(invitationApprovalsApi.approve).toHaveBeenCalledWith("invite"),
    );
  });

  it("requires a reason before declining an invitation", async () => {
    renderApprovals();

    fireEvent.click(await screen.findByRole("button", { name: "Decline" }));
    fireEvent.change(screen.getByLabelText("Decline reason"), {
      target: { value: "Host unavailable" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm decline" }));

    await waitFor(() =>
      expect(invitationApprovalsApi.decline).toHaveBeenCalledWith(
        "invite",
        "Host unavailable",
      ),
    );
  });

  it("reloads the queue for the selected status", async () => {
    renderApprovals();
    await screen.findByText("Ada Visitor");

    fireEvent.click(screen.getByRole("button", { name: "Approved" }));

    await waitFor(() =>
      expect(invitationApprovalsApi.list).toHaveBeenLastCalledWith("approved"),
    );
  });
});
