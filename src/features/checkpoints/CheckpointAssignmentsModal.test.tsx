import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { CheckpointAssignmentsModal } from "./CheckpointAssignmentsModal";
const m = vi.hoisted(() => ({
  managers: vi.fn(),
  operators: vi.fn(),
  save: vi.fn(),
}));
vi.mock("@/features/managers/api", () => ({
  managersApi: { list: m.managers },
}));
vi.mock("./api", () => ({
  checkpointsApi: { operators: m.operators, setOperators: m.save },
}));
beforeEach(() => {
  vi.resetAllMocks();
  m.managers.mockResolvedValue({
    managers: [
      {
        assignment_id: "admin1",
        status: "active",
        user: {
          name: "First manager",
          email: "one@example.test",
          is_active: true,
        },
      },
      {
        assignment_id: "admin2",
        status: "active",
        user: {
          name: "Second manager",
          email: "two@example.test",
          is_active: true,
        },
      },
    ],
  });
  m.operators.mockResolvedValue({
    assignments: [{ gate_id: "gate", site_admin: { id: "admin1" } }],
  });
  m.save.mockResolvedValue({ assignments: [] });
});
function mount() {
  const close = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <CheckpointAssignmentsModal
        gate={{ id: "gate", name: "Main Gate" }}
        siteId="site"
        onClose={close}
      />
    </QueryClientProvider>,
  );
  return { close };
}
it("loads current assignments and saves several Site managers", async () => {
  const { close } = mount();
  const first = await screen.findByRole("checkbox", { name: /First manager/ });
  await waitFor(() => expect(first).toBeChecked());
  fireEvent.click(screen.getByRole("checkbox", { name: /Second manager/ }));
  fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));
  await waitFor(() =>
    expect(m.save).toHaveBeenCalledWith("gate", ["admin1", "admin2"]),
  );
  await waitFor(() => expect(close).toHaveBeenCalled());
});
it("allows saving an empty selection to leave the checkpoint unassigned", async () => {
  const { close } = mount();
  const first = await screen.findByRole("checkbox", { name: /First manager/ });
  await waitFor(() => expect(first).toBeChecked());
  fireEvent.click(first);
  expect(
    screen.getByText(/leaves this checkpoint unassigned/),
  ).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));
  await waitFor(() => expect(m.save).toHaveBeenCalledWith("gate", []));
  await waitFor(() => expect(close).toHaveBeenCalled());
});
it("keeps the form open when the API rejects the selection", async () => {
  m.save.mockRejectedValue(
    new Error("Checkpoint assignment requires Site management"),
  );
  const { close } = mount();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Save assignments" }),
    ).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Save assignments" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Checkpoint assignment requires Site management",
  );
  expect(close).not.toHaveBeenCalled();
});
