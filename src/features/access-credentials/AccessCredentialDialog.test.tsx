import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";

import { accessCredentialsApi } from "./api";
import { AccessCredentialDialog } from "./AccessCredentialDialog";

vi.mock("./api", () => ({
  accessCredentialsApi: {
    list: vi.fn(),
    issue: vi.fn(),
    lifecycle: vi.fn(),
  },
}));

const person = {
  assignment_id: "assignment",
  role: "employee",
  is_super_admin: false,
  status: "active",
  source: "occupancy" as const,
  party: {
    id: "party",
    kind: "person",
    display_name: "Ada Okafor",
    email: "ada@example.test",
    is_active: true,
  },
};

it("issues and displays a one-time permanent access credential", async () => {
  vi.mocked(accessCredentialsApi.list).mockResolvedValue([]);
  vi.mocked(accessCredentialsApi.issue).mockResolvedValue({
    id: "credential",
    credential_type: "permanent_code",
    label: "Primary",
    status: "active",
    issued_at: "2026-11-09T08:00:00Z",
    party: person.party,
    credential: "ACC-TEST-CODE",
    warning: "Shown once",
  });

  render(
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
      <AccessCredentialDialog person={person} onClose={vi.fn()} />
    </QueryClientProvider>,
  );

  expect(await screen.findByText("No access credentials have been issued.")).toBeVisible();
  fireEvent.change(screen.getByLabelText("Label"), {
    target: { value: "Primary" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Issue credential" }));

  await waitFor(() =>
    expect(accessCredentialsApi.issue).toHaveBeenCalledWith({
      party_id: "party",
      credential_type: "permanent_code",
      label: "Primary",
    }),
  );
  expect(await screen.findByText("ACC-TEST-CODE")).toBeVisible();
});
