import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { checkpointsApi } from "@/features/checkpoints/api";
import { managersApi } from "@/features/managers/api";
import { GateOperatorModal } from "./GateOperatorModal";

vi.mock("@/features/managers/api", () => ({
  managersApi: { list: vi.fn() },
}));
vi.mock("@/features/checkpoints/api", () => ({
  checkpointsApi: {
    operators: vi.fn(),
    assignOperator: vi.fn(),
  },
}));

const gate = {
  id: "checkpoint-1",
  name: "Main entrance",
  slug: "main-entrance",
  is_default: true,
  site_id: "site-1",
  place_id: null,
  dependency_id: null,
  created_at: "2026-11-09T00:00:00Z",
  updated_at: "2026-11-09T00:00:00Z",
};

function mount(onClose = vi.fn()) {
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
      <GateOperatorModal open onClose={onClose} gate={gate} />
    </QueryClientProvider>,
  );
}

describe("GateOperatorModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(managersApi.list).mockResolvedValue({
      site: {
        id: "site-1",
        organization_id: "org-1",
        parent_site_id: null,
        name: "Harbour Campus",
        slug: "harbour-campus",
        use_case: "hospitality",
        description: null,
        address: "",
        is_active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
      effective_use_case: "hospitality",
      managers: [
        {
          assignment_id: "admin-1",
          party: {
            id: "party-1",
            kind: "person",
            display_name: "Amina Bello",
            email: "amina@example.test",
            is_active: true,
          },
          role: "site_admin",
          status: "active",
          roles: [],
          effective_permissions: ["*"],
        },
      ],
    });
    vi.mocked(checkpointsApi.operators).mockResolvedValue({
      site_id: "site-1",
      assignments: [],
    });
    vi.mocked(checkpointsApi.assignOperator).mockResolvedValue({
      id: "assignment-1",
      gate_id: "checkpoint-1",
      gate_name: "Main entrance",
      place: {
        id: "site-1",
        name: "Harbour Campus",
        slug: "harbour-campus",
        kind: "site",
        is_active: true,
      },
      party: {
        id: "party-1",
        kind: "person",
        display_name: "Amina Bello",
        email: "amina@example.test",
        is_active: true,
      },
      assigned_at: "2026-11-09T00:00:00Z",
      is_active: true,
    });
  });

  it("assigns one site administrator and closes after success", async () => {
    const onClose = vi.fn();
    mount(onClose);

    expect(
      await screen.findByText(/This checkpoint is unassigned/),
    ).toBeVisible();
    await screen.findByText("Select a site administrator");
    const chooser = screen.getByRole("combobox");
    fireEvent.keyDown(chooser, { key: "ArrowDown" });
    fireEvent.click(await screen.findByText("Amina Bello"));
    fireEvent.click(screen.getByRole("button", { name: "Assign operator" }));

    await waitFor(() =>
      expect(checkpointsApi.assignOperator).toHaveBeenCalledWith(
        "checkpoint-1",
        "party-1",
      ),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
