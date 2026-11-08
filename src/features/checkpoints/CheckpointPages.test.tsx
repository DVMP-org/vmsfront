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
  gates: vi.fn(),
  gate: vi.fn(),
  history: vi.fn(),
  record: vi.fn(),
  event: vi.fn(),
  topology: vi.fn(),
  simulate: vi.fn(),
  commands: vi.fn(),
}));
vi.mock("@/store/app-store", () => ({
  useAppStore: (f: any) => f({ organization: { id: "org" } }),
}));
vi.mock("@/store/auth-store", () => ({
  useAuthStore: (f: any) => f({ user: { id: "user" } }),
}));
vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: m.profile },
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
  occurred_at: "2026-11-07T10:00:00Z",
};
beforeEach(() => {
  vi.resetAllMocks();
  m.profile.mockResolvedValue({ data: { role: { permissions: ["*"] } } });
  m.gates.mockResolvedValue({
    items: [{ id: "gate", name: "Main entrance" }],
    total_pages: 1,
  });
  m.gate.mockResolvedValue({ id: "gate", name: "Main entrance" });
  m.history.mockResolvedValue({ items: [], total_pages: 0 });
  m.event.mockResolvedValue(event);
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
it("uses real routes for gate directory and passage drilldown", async () => {
  mount(<CheckpointDirectory />);
  expect(
    (await screen.findAllByRole("link", { name: /Main entrance/ }))[0],
  ).toHaveAttribute("href", "/admin/checkpoints/gate");
});
it("retries the same immutable passage after unknown failure then offers next person", async () => {
  m.record
    .mockRejectedValueOnce(new Error("network interrupted"))
    .mockResolvedValue({ ...event, replayed: true });
  mount(<CheckpointConsole gateId="gate" />);
  await screen.findByRole("heading", { name: "Main entrance" });
  fireEvent.change(screen.getByLabelText("Authorization code"), {
    target: { value: "VISIT123" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Record and verify passage" }),
  );
  await screen.findByRole("button", { name: "Retry same passage" });
  expect(screen.getByLabelText("Authorization code")).toBeDisabled();
  const first = m.record.mock.calls[0][1];
  fireEvent.click(screen.getByRole("button", { name: "Retry same passage" }));
  await screen.findByRole("heading", { name: "Allowed · Check-in" });
  expect(m.record.mock.calls[1][1]).toEqual(first);
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
    expect(screen.getByLabelText("Authorization code")).toHaveValue(""),
  );
  expect(screen.getByLabelText("Authorization code")).toBeEnabled();
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
  mount(<CheckpointConsole gateId="gate" />);
  await screen.findByRole("heading", { name: "Main entrance" });
  fireEvent.change(screen.getByLabelText("Authorization code"), {
    target: { value: "VISIT123" },
  });
  fireEvent.change(screen.getByLabelText("Direction"), {
    target: { value: "exit" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Record and verify passage" }),
  );
  await screen.findByRole("heading", { name: "Denied · Checkout" });
  expect(screen.getByText("not present")).toBeInTheDocument();
  expect(screen.getByText("2. Device command")).toBeInTheDocument();
  expect(screen.getByText("No command")).toBeInTheDocument();
});

it("queues offline passages provisionally and verifies them after reconnect", async () => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: false,
  });
  m.record.mockResolvedValue(event);
  mount(<CheckpointConsole gateId="gate" />);
  await screen.findByRole("heading", { name: "Main entrance" });
  fireEvent.change(screen.getByLabelText("Authorization code"), {
    target: { value: "VISIT-OFFLINE" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Queue offline check" }));

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
  await screen.findByRole("heading", { name: "Allowed · Check-in" });
  await waitFor(() => expect(m.record).toHaveBeenCalledTimes(1));
  expect(screen.queryByText(/provisional passage queued/i)).toBeNull();
});
it("fails closed for missing permission instead of loading forever", async () => {
  m.profile.mockResolvedValue({ data: { role: { permissions: [] } } });
  mount(<CheckpointConsole gateId="gate" />);
  await screen.findByText("You do not have permission to open this gate.");
  expect(m.gate).not.toHaveBeenCalled();
  expect(m.record).not.toHaveBeenCalled();
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
