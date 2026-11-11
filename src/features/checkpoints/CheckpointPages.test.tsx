import {
  act,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, it, expect, vi } from "vitest";
import {
  CheckpointConsole,
  CheckpointDirectory,
  CheckpointRecord,
  createIdempotencyKey,
} from "./CheckpointPages";
const m = vi.hoisted(() => ({
  profile: vi.fn(),
  permissions: ["*"] as string[],
  gates: vi.fn(),
  myAssignments: vi.fn(),
  gate: vi.fn(),
  console: vi.fn(),
  history: vi.fn(),
  accessEvents: vi.fn(),
  record: vi.fn(),
  preview: vi.fn(),
  event: vi.fn(),
  topology: vi.fn(),
  simulate: vi.fn(),
  commands: vi.fn(),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (f: any) =>
    f({ organization: { id: "org" }, selectedProperty: { id: "site" } }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (f: any) => f({ user: { id: "user" } }),
}));
vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: m.profile },
}));
vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({
    data: {
      effective_permissions: m.permissions,
      management: { is_administrator: true, mode: "local" },
    },
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/services/access-control-service", () => ({
  accessControlService: {
    getTopology: m.topology,
    simulateDecision: m.simulate,
    listCommands: m.commands,
  },
}));
vi.mock("./api", () => ({ checkpointsApi: m }));
function mount(element: React.ReactNode) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {element}
    </QueryClientProvider>,
  );
}
const event = {
  id: "event",
  gate_id: "gate",
  direction: "entry",
  outcome: "allowed",
  reason_code: "entry_recorded",
  person_name: "Guest",
  subject_type: "visitor",
  state_before: "not_checked_in",
  state_after: "checked_in",
  occurred_at: "2026-11-07T10:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  m.permissions = ["*"];
  m.profile.mockResolvedValue({ data: { role: { permissions: ["*"] } } });
  m.gates.mockResolvedValue({
    items: [{ id: "gate", name: "Main entrance" }],
    total_pages: 1,
  });
  m.myAssignments.mockResolvedValue({
    assignments: [
      {
        id: "assignment",
        gate_id: "gate",
        gate_name: "Main entrance",
        place: { id: "site", name: "North Campus" },
        party: { id: "party", display_name: "Operator" },
      },
    ],
  });
  m.gate.mockResolvedValue({ id: "gate", name: "Main entrance" });
  m.console.mockResolvedValue({
    id: "gate",
    name: "Main entrance",
    place_id: "site",
    place_name: "North Campus",
    allowed_entry: true,
    allowed_exit: true,
    automatic_direction: true,
    manual_direction_override: false,
    policy_version: 1,
    operator_site_admin_id: "site-admin",
    operator_name: "Operator",
    lanes: [
      {
        id: "lane",
        place_id: "site",
        gate_id: "gate",
        name: "Entry barrier",
        slug: "entry-barrier",
        kind: "barrier",
        driver_name: "simulator",
        availability: "online",
        observed_state: "closed",
        created_at: "2026-11-07T10:00:00Z",
        updated_at: "2026-11-07T10:00:00Z",
      },
    ],
  });
  m.history.mockResolvedValue({ items: [], total_pages: 0 });
  m.accessEvents.mockResolvedValue({
    items: [],
    total: 0,
    total_pages: 0,
  });
  m.event.mockResolvedValue(event);
  m.preview.mockResolvedValue({
    credential_reference: "INV-123456-001",
    subject_type: "visitor",
    credential_type: "invitation_code",
    person_name: "Ade Guest",
    invitation: {
      code: "INV-123456",
      status: "approved",
      purpose: null,
      valid_from: "2026-11-07T09:00:00Z",
      valid_to: "2026-11-07T18:00:00Z",
      max_uses: 3,
      uses_count: 0,
      host_name: "Host Resident",
      place_name: "North Campus",
    },
    guests: [
      {
        suffix: "001",
        display_name: "Ade Guest",
        phone: null,
        state: "not_checked_in",
      },
    ],
    requires_guest_selection: false,
    selected_guest_suffix: "001",
    suggested_direction: "entry",
    can_check_in: true,
    can_check_out: true,
    blocking_reason: null,
  });
  m.topology.mockResolvedValue({
    places: [
      {
        site: { id: "site", name: "North Campus" },
        gates: [
          {
            id: "gate",
            name: "Main entrance",
            status: "ready",
            lanes: [
              {
                id: "lane",
                site_id: "site",
                gate_id: "gate",
                name: "Entry barrier",
                slug: "entry-barrier",
                kind: "barrier",
                driver_name: "simulator",
                availability: "online",
                observed_state: "closed",
                created_at: "2026-11-07T10:00:00Z",
                updated_at: "2026-11-07T10:00:00Z",
              },
            ],
          },
        ],
      },
    ],
  });
  m.simulate.mockResolvedValue({
    decision: {
      id: "decision",
      outcome: "allowed",
      reason_code: "authorization_valid",
    },
    command: {
      id: "command",
      action: "open",
      status: "pending",
    },
    lane: { observed_state: "closed" },
  });
  m.commands.mockResolvedValue([]);
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
});
it("creates idempotency keys without crypto.randomUUID on local HTTP", () => {
  vi.stubGlobal("crypto", {
    getRandomValues: (bytes: Uint8Array) => {
      bytes.fill(7);
      return bytes;
    },
  });
  try {
    expect(createIdempotencyKey()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  } finally {
    vi.unstubAllGlobals();
  }
});
it("lists every Site checkpoint with a direct console action", async () => {
  mount(<CheckpointDirectory />);
  expect(await screen.findByText("Main entrance")).toBeVisible();
  expect(screen.getByRole("button", { name: "Assign managers" })).toBeVisible();
  expect(screen.getByRole("link", { name: "Open console" })).toHaveAttribute(
    "href",
    "/admin/checkpoints/console",
  );
  expect(
    screen
      .getAllByRole("link", { name: "Movement log" })
      .find(
        (link) => link.getAttribute("href") === "/admin/passages?gate_id=gate",
      ),
  ).toHaveAttribute("href", "/admin/passages?gate_id=gate");
});
it("retries the same immutable passage after unknown failure then offers next person", async () => {
  m.record
    .mockRejectedValueOnce(new Error("network interrupted"))
    .mockResolvedValue({ ...event, replayed: true });
  mount(<CheckpointConsole />);
  await screen.findAllByText("Main entrance");
  fireEvent.change(screen.getByLabelText("Credential"), {
    target: { value: "VISIT123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check in" }));
  await screen.findByRole("button", { name: "Retry same passage" });
  expect(screen.getByLabelText("Credential")).toBeDisabled();
  const first = m.record.mock.calls[0][0];
  fireEvent.click(screen.getByRole("button", { name: "Retry same passage" }));
  await screen.findByText("Entry permitted");
  expect(m.record.mock.calls[1][0]).toEqual(first);
  expect(first.idempotency_key).toBeTruthy();
  expect(screen.getByText(/Previously recorded/)).toBeInTheDocument();
  expect(m.simulate).toHaveBeenCalledWith(
    "lane",
    expect.objectContaining({
      checkpoint_event_id: "event",
      outcome: "allowed",
    }),
  );
  expect(
    screen.getByText("Waiting for device acknowledgement"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Next person" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Credential")).toHaveValue(""),
  );
  expect(screen.getByLabelText("Credential")).toBeEnabled();
});
it("distinguishes denied result and checkout direction", async () => {
  m.record.mockResolvedValue({
    ...event,
    direction: "exit",
    outcome: "denied",
    reason_code: "not_present",
  });
  m.simulate.mockResolvedValue({
    decision: {
      id: "decision-denied",
      outcome: "denied",
      reason_code: "not_present",
    },
    command: null,
    lane: { observed_state: "closed" },
  });
  mount(<CheckpointConsole />);
  await screen.findAllByText("Main entrance");
  fireEvent.change(screen.getByLabelText("Credential"), {
    target: { value: "VISIT123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check out" }));
  await screen.findByText("Access denied");
  expect(screen.getByText("Not present")).toBeInTheDocument();
  expect(screen.getByText("2. Device command")).toBeInTheDocument();
  expect(screen.getByText("No command")).toBeInTheDocument();
});

it("queues offline passages provisionally and verifies them after reconnect", async () => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: false,
  });
  m.record.mockResolvedValue(event);
  mount(<CheckpointConsole />);
  await screen.findAllByText("Main entrance");
  fireEvent.change(screen.getByLabelText("Credential"), {
    target: { value: "VISIT-OFFLINE" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check in" }));

  expect(screen.getByText("1 provisional passage queued")).toBeInTheDocument();
  expect(
    screen.getByText(
      "These are not checked in. Keep this device online until the server confirms each result.",
    ),
  ).toBeInTheDocument();
  expect(m.record).not.toHaveBeenCalled();

  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: true,
  });
  await act(async () => {
    window.dispatchEvent(new Event("online"));
  });
  await screen.findByText("Entry permitted");
  await waitFor(() => expect(m.record).toHaveBeenCalledTimes(1));
  expect(screen.queryByText(/provisional passage queued/i)).toBeNull();
});
it("keeps the console visible and lets the API enforce recording permission", async () => {
  m.permissions = [];
  m.console.mockRejectedValue(
    new Error("No checkpoint is assigned to the signed-in Site manager"),
  );
  m.record.mockRejectedValue(
    new Error("Checkpoint recording permission is required"),
  );
  mount(<CheckpointConsole />);
  await screen.findByText("No checkpoint assigned");
  expect(
    screen.getByRole("heading", { name: "Check-in console" }),
  ).toBeVisible();
  fireEvent.change(screen.getByLabelText("Credential"), {
    target: { value: "VISIT123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Check in" }));
  await waitFor(() => expect(m.record).toHaveBeenCalledTimes(1));
  expect(m.console).toHaveBeenCalledWith();
});
it("does not show a passage fetched under another gate route", async () => {
  m.event.mockResolvedValue({ ...event, gate_id: "other" });
  mount(<CheckpointRecord gateId="gate" eventId="event" />);
  await screen.findByText(
    "This passage does not belong to the selected checkpoint.",
  );
  expect(
    screen.queryByRole("heading", { name: "Allowed · Check-in" }),
  ).toBeNull();
});

it("resolves the assigned console without fetching gates or sending a gate ID", async () => {
  mount(<CheckpointConsole />);
  await screen.findAllByText("Main entrance");
  expect(m.console).toHaveBeenCalledWith();
  expect(m.gates).not.toHaveBeenCalled();
});

it("lists every visitor on a group invitation and records the chosen suffix", async () => {
  m.preview.mockImplementation(async (body: { guest_suffix?: string }) => ({
    credential_reference: body.guest_suffix
      ? `INV-123456-${body.guest_suffix}`
      : "INV-123456",
    subject_type: "visitor",
    credential_type: "invitation_code",
    person_name: "Ade Guest",
    invitation: {
      code: "INV-123456",
      status: "approved",
      purpose: null,
      valid_from: "2026-11-07T09:00:00Z",
      valid_to: "2026-11-07T18:00:00Z",
      max_uses: 5,
      uses_count: 0,
      host_name: "Host Resident",
      place_name: "North Campus",
    },
    guests: [
      {
        suffix: "001",
        display_name: "Ade Guest",
        phone: null,
        state: "not_checked_in",
      },
      {
        suffix: "002",
        display_name: "Bola Guest",
        phone: null,
        state: "not_checked_in",
      },
    ],
    requires_guest_selection: !body.guest_suffix,
    selected_guest_suffix: body.guest_suffix ?? null,
    suggested_direction: body.guest_suffix ? "entry" : null,
    can_check_in: Boolean(body.guest_suffix),
    can_check_out: false,
    blocking_reason: body.guest_suffix ? null : "guest_suffix_required",
  }));
  m.record.mockResolvedValue(event);

  mount(<CheckpointConsole />);
  await screen.findAllByText("Main entrance");
  fireEvent.change(screen.getByLabelText("Credential"), {
    target: { value: "123456" },
  });

  expect(
    await screen.findByText(/Visitors on this invitation \(2\)/),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Check in" })).toBeDisabled();
  expect(
    screen.getByText(/This invitation covers several visitors/),
  ).toBeVisible();

  fireEvent.click(
    await screen.findByRole("button", { name: /Bola Guest/ }),
  );

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Check in" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Check in" }));
  await waitFor(() =>
    expect(m.record).toHaveBeenCalledWith(
      expect.objectContaining({ credential: "123456", guest_suffix: "002" }),
    ),
  );
});

it("checks in a single visitor without asking for a guest suffix", async () => {
  m.record.mockResolvedValue(event);
  mount(<CheckpointConsole />);
  await screen.findAllByText("Main entrance");
  fireEvent.change(screen.getByLabelText("Credential"), {
    target: { value: "INV-123456" },
  });

  expect(
    await screen.findByText(/Single visitor invited — Ade Guest/),
  ).toBeVisible();
  expect(screen.queryByText(/Visitors on this invitation/)).toBeNull();

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Check in" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Check in" }));
  await waitFor(() => expect(m.record).toHaveBeenCalledTimes(1));
});

it("explains an unapproved invitation instead of a bare reason code", async () => {
  m.preview.mockResolvedValue({
    credential_reference: "INV-123456",
    subject_type: "visitor",
    credential_type: "invitation_code",
    person_name: "Ade Guest",
    invitation: {
      code: "INV-123456",
      status: "requested",
      purpose: null,
      valid_from: "2026-11-07T09:00:00Z",
      valid_to: "2026-11-07T18:00:00Z",
      max_uses: 1,
      uses_count: 0,
      host_name: "Host Resident",
      place_name: "North Campus",
    },
    guests: [
      {
        suffix: "001",
        display_name: "Ade Guest",
        phone: null,
        state: "not_checked_in",
      },
    ],
    requires_guest_selection: false,
    selected_guest_suffix: "001",
    suggested_direction: null,
    can_check_in: false,
    can_check_out: false,
    blocking_reason: "authorization_requested",
  });

  mount(<CheckpointConsole />);
  await screen.findAllByText("Main entrance");
  fireEvent.change(screen.getByLabelText("Credential"), {
    target: { value: "INV-123456" },
  });

  expect(
    (
      await screen.findAllByText(
        /still awaiting approval, so nobody can check in yet/i,
      )
    ).length,
  ).toBeGreaterThan(0);
  expect(screen.getByRole("button", { name: "Check in" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Check out" })).toBeDisabled();
});
