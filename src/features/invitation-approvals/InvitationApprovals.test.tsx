import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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
  profileData: {
    effective_permissions: [] as string[],
    management: { is_administrator: true },
    site_id: "site",
    organization_id: "org",
  },
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("@/features/context/use-site-access", () => ({
  useSiteAccess: () => ({
    workspace: {
      data: mocks.profileData,
      isPending: false,
      isError: false,
      isSuccess: true,
      isFetchedAfterMount: true,
      site_id: "site",
      organization_id: "org",
      refetch: vi.fn(),
    },
    contextKey: "org:site:user",
    allowed: (requirement: string | string[]) => {
      const checks = Array.isArray(requirement) ? requirement : [requirement];
      return checks.some((permission) =>
        mocks.profileData.effective_permissions.includes(permission),
      );
    },
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/invitations",
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock("@/components/facets/FacetPicker", () => ({
  FacetPicker: ({
    label,
    onChange,
  }: {
    label: string;
    onChange: (item: {
      value: string;
      label: string;
      disabled: boolean;
      meta: { kind: string; user_linked: boolean };
    }) => void;
  }) => (
    <button
      type="button"
      aria-label={label}
      onClick={() =>
        onChange({
          value: label.startsWith("Host") ? "host" : "unit",
          label: label.startsWith("Host") ? "Alex Morgan" : "Apartment A-101",
          disabled: false,
          meta: { kind: "person", user_linked: true },
        })
      }
    >
      {label}
    </button>
  ),
}));

vi.mock("./api", () => ({
  invitationApprovalsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
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
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>,
  );
}

describe("invitation approvals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams();
    mocks.profileData = {
      management: { is_administrator: true },
      site_id: "site",
      organization_id: "org",
      effective_permissions: [
        "visit_authorizations.list",
        "visit_authorizations.show",
        "visit_authorizations.create",
        "visit_authorizations.approve",
        "visit_authorizations.decline",
        "visit_authorizations.revoke",
        "checkpoint_events.list",
      ],
    };
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
    vi.mocked(invitationApprovalsApi.create).mockResolvedValue(invitation);
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

    expect((await screen.findAllByText("Ada Visitor")).length).toBeGreaterThan(
      0,
    );
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

    fireEvent.click(screen.getByRole("button", { name: /^Approved/ }));
    expect(mocks.replace).toHaveBeenCalledWith(
      "/admin/invitations?status=approved",
      { scroll: false },
    );
  });

  it("shows a read-only queue when approval grants are absent", async () => {
    mocks.profileData = {
      management: { is_administrator: true },
      site_id: "site",
      organization_id: "org",
      effective_permissions: [
        "visit_authorizations.list",
        "visit_authorizations.show",
      ],
    };
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

  it("renders a group authorization as one row and lists every visitor in detail", async () => {
    const group = {
      ...invitation,
      id: "group-invite",
      code: "VISIT-GROUP",
      guests: [
        invitation.guests[0],
        {
          ...invitation.guests[0],
          id: "guest-2",
          display_name_snapshot: "Bola Visitor",
          suffix: "002",
        },
        {
          ...invitation.guests[0],
          id: "guest-3",
          display_name_snapshot: "Chidi Visitor",
          suffix: "003",
        },
      ],
    };
    vi.mocked(invitationApprovalsApi.list).mockResolvedValue({
      items: [group],
      total: 1,
      page: 1,
      page_size: 25,
      total_pages: 1,
    });
    vi.mocked(invitationApprovalsApi.get).mockResolvedValue(group);

    const register = renderWithClient(<InvitationApprovals />);
    expect(await screen.findByText("Group · 3 visitors")).toBeInTheDocument();
    expect(screen.getAllByText("VISIT-GROUP")).toHaveLength(2);
    expect(
      screen.getByText("Ada Visitor, Bola Visitor, Chidi Visitor"),
    ).toBeInTheDocument();
    register.unmount();

    renderWithClient(<InvitationDetail invitationId="group-invite" />);
    expect(await screen.findByText("Bola Visitor")).toBeInTheDocument();
    expect(screen.getByText("Chidi Visitor")).toBeInTheDocument();
    expect(screen.getByText("Group suffix 003")).toBeInTheDocument();
  });

  it("creates one invitation containing every visitor in a group drawer", async () => {
    renderWithClient(<InvitationApprovals />);
    await screen.findAllByText("Ada Visitor");

    fireEvent.click(screen.getByRole("button", { name: "Create invitation" }));
    const drawer = await screen.findByRole("dialog", {
      name: "New invitation",
    });
    fireEvent.click(within(drawer).getByRole("radio", { name: "Group" }));
    fireEvent.click(within(drawer).getByRole("button", { name: "Host Party" }));
    fireEvent.click(
      within(drawer).getByRole("button", { name: "Destination Place" }),
    );
    fireEvent.change(within(drawer).getByLabelText(/^Visitor full name/), {
      target: { value: "Ada Visitor" },
    });
    fireEvent.change(within(drawer).getByLabelText(/^Visitor 2/), {
      target: { value: "Bola Visitor" },
    });
    fireEvent.click(
      within(drawer).getByRole("button", { name: /Create group pass/ }),
    );

    await waitFor(() =>
      expect(invitationApprovalsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          host_party_id: "host",
          destination_place_id: "unit",
          guests: [
            expect.objectContaining({
              display_name: "Ada Visitor",
              suffix: "001",
            }),
            expect.objectContaining({
              display_name: "Bola Visitor",
              suffix: "002",
            }),
          ],
        }),
      ),
    );
  });
});
