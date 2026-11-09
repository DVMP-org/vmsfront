import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { expect, it, vi } from "vitest";

import { checkpointsApi } from "@/features/checkpoints/api";
import { AccessEventDetail } from "./AccessEventDetail";

vi.mock("@/features/checkpoints/api", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/checkpoints/api")
  >("@/features/checkpoints/api");
  return {
    ...actual,
    checkpointsApi: { accessEvent: vi.fn() },
  };
});

it("shows the auditable state transition and override reason", async () => {
  vi.mocked(checkpointsApi.accessEvent).mockResolvedValue({
    id: "event",
    subject_type: "party",
    person_name: "Ada Okafor",
    gate_id: "gate",
    gate_name: "Main entrance",
    place_id: "site",
    place_name: "Harbour Campus",
    direction: "entry",
    outcome: "allowed",
    reason_code: "checkpoint_override",
    state_before: "checked_out",
    state_after: "checked_in",
    credential_type: "badge_qr",
    credential_reference: "badge_qr",
    operator_name: "Site Security",
    policy_version: 4,
    manual_override: true,
    override_reason: "Emergency service access",
    occurred_at: "2026-11-09T08:00:00Z",
  });

  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })
      }
    >
      <AccessEventDetail eventId="event" />
    </QueryClientProvider>,
  );

  expect(
    await screen.findByRole("heading", { name: "Ada Okafor" }),
  ).toBeVisible();
  expect(screen.getByText("checked out to checked in")).toBeVisible();
  expect(screen.getByText("Emergency service access")).toBeVisible();
  expect(screen.getByText("4")).toBeVisible();
});
