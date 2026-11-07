import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    await screen.findByRole("link", { name: /Main entrance/ }),
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
  fireEvent.click(screen.getByRole("button", { name: "Record passage" }));
  await screen.findByRole("button", { name: "Retry same passage" });
  expect(screen.getByLabelText("Authorization code")).toBeDisabled();
  const first = m.record.mock.calls[0][1];
  fireEvent.click(screen.getByRole("button", { name: "Retry same passage" }));
  await screen.findByRole("heading", { name: "Allowed · Check-in" });
  expect(m.record.mock.calls[1][1]).toEqual(first);
  expect(first.idempotency_key).toBeTruthy();
  expect(screen.getByText(/Previously recorded/)).toBeInTheDocument();
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
  mount(<CheckpointConsole gateId="gate" />);
  await screen.findByRole("heading", { name: "Main entrance" });
  fireEvent.change(screen.getByLabelText("Authorization code"), {
    target: { value: "VISIT123" },
  });
  fireEvent.change(screen.getByLabelText("Direction"), {
    target: { value: "exit" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Record passage" }));
  await screen.findByRole("heading", { name: "Denied · Checkout" });
  expect(screen.getByText("not present")).toBeInTheDocument();
  expect(screen.getByText(/Hardware command/)).toBeInTheDocument();
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
