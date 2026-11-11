import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceRelationship } from "@/types";
import { AccessWorkspace } from "./AccessWorkspace";
import { accessJourneyApi, type VisitAuthorization } from "./api";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return {
    ...actual,
    accessJourneyApi: {
      list: vi.fn(),
      create: vi.fn(),
      get: vi.fn(),
      cancel: vi.fn(),
      checkpointEvents: vi.fn(),
      credentials: vi.fn(),
    },
  };
});

const relationship: WorkspaceRelationship = {
  id: "relationship",
  organization_id: "org",
  site_id: "site",
  role: "resident",
  status: "active",
  effective_from: null,
  effective_to: null,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  party: {
    id: "party",
    kind: "person",
    display_name: "Alex Morgan",
    email: "alex@example.com",
    is_active: true,
  },
  place: {
    id: "place",
    name: "Apartment A-101",
    slug: "apartment-a-101",
    kind: "unit",
    is_active: true,
  },
};

const invitation: VisitAuthorization = {
  id: "invite",
  host_party_id: "party",
  destination_place_id: "place",
  code: "VISIT-ABC123",
  qr_code_url: null,
  status: "approved",
  valid_from: new Date(Date.now() + 3_600_000).toISOString(),
  valid_to: new Date(Date.now() + 3 * 3_600_000).toISOString(),
  max_uses: 2,
  uses_count: 0,
  purpose: "Family visit",
  additional_information: null,
  decline_reason: null,
  requested_at: "2026-01-01",
  decided_at: "2026-01-01",
  host_party: { display_name: "Alex Morgan" },
  destination_place: {
    id: "place",
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

function renderWorkspace({ siteId = "site" }: { siteId?: string | null } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AccessWorkspace
        relationship={{ ...relationship, site_id: siteId ?? undefined }}
        partyName="Alex Morgan"
        partyEmail="alex@example.com"
      />
    </QueryClientProvider>,
  );
}

describe("AccessWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accessJourneyApi.list).mockResolvedValue({
      items: [invitation],
      total: 1,
      page: 1,
      page_size: 100,
      total_pages: 1,
    });
    vi.mocked(accessJourneyApi.create).mockResolvedValue(invitation);
    vi.mocked(accessJourneyApi.get).mockResolvedValue(invitation);
    vi.mocked(accessJourneyApi.checkpointEvents).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 100,
      total_pages: 0,
    });
    vi.mocked(accessJourneyApi.credentials).mockResolvedValue([
      {
        guest_id: "guest",
        display_name: "Ada Visitor",
        suffix: "001",
        credential_type: "invitation_qr",
        credential: "signed.invitation.token",
      },
    ]);
  });

  it("shows the host's invitations and active pass", async () => {
    renderWorkspace();

    expect((await screen.findAllByText("Ada Visitor")).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("VISIT-ABC123").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /invite visitor/i }),
    ).toBeInTheDocument();
  });

  it("opens the create form in a side drawer", async () => {
    renderWorkspace();
    fireEvent.click(
      await screen.findByRole("button", { name: /invite visitor/i }),
    );
    expect(
      await screen.findByRole("dialog", { name: /create invitation/i }),
    ).toBeVisible();
  });

  it("blocks submission when the workspace has no Site reference", async () => {
    renderWorkspace({ siteId: null });
    fireEvent.click(
      await screen.findByRole("button", { name: /invite visitor/i }),
    );
    fireEvent.change(screen.getByLabelText(/visitor name/i), {
      target: { value: "New Guest" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /submit invitation/i }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /missing its Site reference/i,
    );
    expect(accessJourneyApi.create).not.toHaveBeenCalled();
  });

  it("creates an invitation for the selected workspace", async () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: /invite visitor/i }));
    fireEvent.change(screen.getByLabelText(/visitor name/i), {
      target: { value: "New Guest" },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: "Meeting" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit invitation/i }));

    await waitFor(() => expect(accessJourneyApi.create).toHaveBeenCalled());
    expect(vi.mocked(accessJourneyApi.create).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        site_id: "site",
        destination_place_id: "place",
        purpose: "Meeting",
        guests: [
          expect.objectContaining({
            display_name: "New Guest",
          }),
        ],
      }),
    );
  });

  it("sends the maximum entries the operator typed", async () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: /invite visitor/i }));
    fireEvent.change(screen.getByLabelText(/visitor name/i), {
      target: { value: "New Guest" },
    });
    const maxEntries = screen.getByLabelText(/maximum entries/i);
    fireEvent.change(maxEntries, { target: { value: "7" } });
    fireEvent.click(screen.getByRole("button", { name: /submit invitation/i }));

    await waitFor(() => expect(accessJourneyApi.create).toHaveBeenCalled());
    expect(
      vi.mocked(accessJourneyApi.create).mock.calls[0][0].max_uses,
    ).toBe(7);
  });

  it("creates one invitation for a group of guests", async () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: /invite visitor/i }));
    fireEvent.change(screen.getByLabelText(/visitor name/i), {
      target: { value: "Primary Guest" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add another guest/i }));
    fireEvent.change(screen.getByLabelText(/additional visitor 1 name/i), {
      target: { value: "Second Guest" },
    });
    fireEvent.change(screen.getByLabelText(/additional visitor 1 email/i), {
      target: { value: "second@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit invitation/i }));

    await waitFor(() => expect(accessJourneyApi.create).toHaveBeenCalled());
    expect(vi.mocked(accessJourneyApi.create).mock.calls[0][0].guests).toEqual([
      expect.objectContaining({ display_name: "Primary Guest" }),
      expect.objectContaining({
        display_name: "Second Guest",
        email: "second@example.com",
      }),
    ]);
  });

  it("requires a name for every added guest", async () => {
    renderWorkspace();
    fireEvent.click(screen.getByRole("button", { name: /invite visitor/i }));
    fireEvent.change(screen.getByLabelText(/visitor name/i), {
      target: { value: "Primary Guest" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add another guest/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit invitation/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter visitor 2’s name.",
    );
    expect(accessJourneyApi.create).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /remove guest 2/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit invitation/i }));
    await waitFor(() =>
      expect(accessJourneyApi.create).toHaveBeenCalledTimes(1),
    );
    expect(
      vi.mocked(accessJourneyApi.create).mock.calls[0][0].guests,
    ).toHaveLength(1);
  });

  it("opens the reusable invitation detail and QR", async () => {
    renderWorkspace();

    fireEvent.click(
      await screen.findByRole("button", { name: /open invitation/i }),
    );

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(accessJourneyApi.get).toHaveBeenCalledWith("invite");
    expect(
      await screen.findByRole("button", { name: /share invitation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Human-readable invitation reference"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Alex Morgan").length).toBeGreaterThan(0);
    expect(
      await screen.findByText(
        "No checkpoint scans have been recorded for this visitor.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps invitation details keyboard-contained and restores focus", async () => {
    renderWorkspace();
    const openButton = await screen.findByRole("button", {
      name: /open invitation/i,
    });
    openButton.focus();
    fireEvent.click(openButton);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close invitation details" }),
    ).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(openButton).toHaveFocus();
  });

  it("shows host-owned checkpoint arrival history", async () => {
    vi.mocked(accessJourneyApi.checkpointEvents).mockResolvedValue({
      items: [
        {
          id: "event",
          organization_id: "org",
          visit_authorization_id: "invite",
          visit_session_id: "session",
          visit_guest_id: "guest",
          checkpoint_presence_id: null,
          place_id: "place",
          gate_id: "gate-12345678",
          lane_id: null,
          direction: "entry",
          outcome: "allowed",
          reason_code: "active_authorization",
          idempotency_key: "scan-1",
          scanned_by_admin_id: null,
          occurred_at: "2026-01-01T10:00:00.000Z",
          created_at: "2026-01-01T10:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      page_size: 100,
      total_pages: 1,
    });
    renderWorkspace();

    fireEvent.click(
      await screen.findByRole("button", { name: /open invitation/i }),
    );

    expect((await screen.findAllByText(/Checked in/)).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gate gate-123/)).toBeInTheDocument();
    expect(screen.getByText(/active_authorization/)).toBeInTheDocument();
  });
});
