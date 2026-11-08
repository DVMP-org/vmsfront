import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CheckpointEvent,
  VisitAuthorization,
} from "@/features/access-journey/api";
import { InvitationDetail } from "./InvitationDetail";
import { invitationApprovalsApi } from "./api";
import { InvitationApprovals } from "./InvitationApprovals";

const mocks = vi.hoisted(() => ({
  profile: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/invitations",
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock("./api", () => ({
  invitationApprovalsApi: {
    list: vi.fn(),
    get: vi.fn(),
    approve: vi.fn(),
    decline: vi.fn(),
    revoke: vi.fn(),
    sessions: vi.fn(),
    events: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
      email_snapshot: "ada@example.com",
      phone_snapshot: null,
      suffix: "001",
    },
  ],
};

const event: CheckpointEvent = {
  id: "event",
  organization_id: "org",
  visit_authorization_id: "invite",
  visit_session_id: null,
  visit_guest_id: "guest",
  checkpoint_presence_id: null,
  place_id: "unit",
  gate_id: "gate",
  lane_id: null,
  direction: "entry",
  outcome: "allowed",
  reason_code: "valid_authorization",
  idempotency_key: "event",
  scanned_by_admin_id: null,
  occurred_at: "2026-11-07T10:15:00.000Z",
  created_at: "2026-11-07T10:15:00.000Z",
};

function renderWithClient(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

describe("invitation approvals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    mocks.profile.mockResolvedValue({
      data: {
        effective_permissions: [
          "visit_authorizations.list",
          "visit_authorizations.show",
          "visit_authorizations.approve",
          "visit_authorizations.decline",
          "visit_authorizations.revoke",
          "checkpoint_events.list",
        ],
      },
    });
    vi.mocked(invitationApprovalsApi.list).mockResolvedValue({
      items: [invitation],
      total: 1,
      page: 1,
      page_size: 25,
      total_pages: 1,
    });
    vi.mocked(invitationApprovalsApi.get).mockResolvedValue(invitation);
    vi.mocked(invitationApprovalsApi.sessions).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 100,
      total_pages: 0,
    });
    vi.mocked(invitationApprovalsApi.events).mockResolvedValue({
      items: [event],
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
    vi.mocked(invitationApprovalsApi.revoke).mockResolvedValue({
      ...invitation,
      status: "revoked",
    });
  });

  it("shows a canonical responsive invitation register", async () => {
    renderWithClient(<InvitationApprovals />);

    expect((await screen.findAllByText("Ada Visitor")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("VISIT-ABC123").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Alex Morgan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Apartment A-101").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: /Open invitation for Ada Visitor/i }),
    ).toHaveAttribute("href", "/admin/invitations/invite");
  });

  it("updates the URL when switching status", async () => {
    renderWithClient(<InvitationApprovals />);
    await screen.findAllByText("Ada Visitor");

    fireEvent.click(screen.getByRole("button", { name: "Approved" }));
    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/invitations?status=approved",
      { scroll: false },
    );
  });

  it("shows a read-only queue when approval grants are absent", async () => {
    mocks.profile.mockResolvedValue({
      data: {
        effective_permissions: [
          "visit_authorizations.list",
          "visit_authorizations.show",
        ],
      },
    });
    renderWithClient(<InvitationDetail invitationId="invite" />);

    await screen.findAllByText("Ada Visitor");
    expect(
      screen.queryByRole("button", { name: /Approve invitation/i }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull();
  });

  it("approves from the canonical detail route", async () => {
    renderWithClient(<InvitationDetail invitationId="invite" />);

    fireEvent.click(
      await screen.findByRole("button", { name: /Approve invitation/i }),
    );
    await waitFor(() =>
      expect(invitationApprovalsApi.approve).toHaveBeenCalledWith("invite"),
    );
  });

  it("requires a reason before declining an invitation", async () => {
    renderWithClient(<InvitationDetail invitationId="invite" />);

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

  it("shows canonical checkpoint history on the detail route", async () => {
    renderWithClient(<InvitationDetail invitationId="invite" />);

    expect(await screen.findByText("entry allowed")).toBeInTheDocument();
    expect(screen.getByText(/valid_authorization/)).toBeInTheDocument();
  });
});
