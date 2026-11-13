import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OrganizationAdministratorsPage from "./page";

const mocks = vi.hoisted(() => ({
  admins: vi.fn(),
  roles: vi.fn(),
  create: vi.fn(),
  updateRole: vi.fn(),
  remove: vi.fn(),
  profile: vi.fn(),
}));

// The page reads its route to decide whether it is embedded in settings.
vi.mock("next/navigation", () => ({
  usePathname: () => "/organization/administrators",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/hooks/use-admin", () => ({
  useAdmins: mocks.admins,
  useAdminRoles: mocks.roles,
  useCreateAdmin: () => ({
    mutate: mocks.create,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useUpdateAdminRole: () => ({
    mutate: mocks.updateRole,
    isPending: false,
    isError: false,
    error: null,
  }),
  useDeleteAdmin: () => ({
    mutate: mocks.remove,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/services/admin-service", () => ({
  adminService: { getAdminProfile: mocks.profile },
}));

const role = {
  id: "role-admin",
  name: "Organization administrator",
  code: "organization_admin",
  description: "Tenant administration",
  permissions: ["admins.create"],
  permissions_parsed: ["admins.create"],
  created_at: "2026-11-08T00:00:00Z",
  updated_at: "2026-11-08T00:00:00Z",
};

const admin = {
  id: "admin-1",
  role_id: role.id,
  role,
  roles: [role],
  effective_permissions: ["admins.create"],
  permissions: null,
  name: "Ada Okafor",
  user: {
    id: "user-1",
    email: "ada@example.com",
    first_name: "Ada",
    last_name: "Okafor",
  },
  created_at: "2026-11-08T00:00:00Z",
  updated_at: "2026-11-08T00:00:00Z",
};

function mount() {
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
      <OrganizationAdministratorsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.profile.mockResolvedValue({
    data: {
      effective_permissions: [
        "admins.create",
        "admins.update",
        "admins.delete",
      ],
    },
  });
  mocks.admins.mockReturnValue({
    data: { items: [admin], total: 1, total_pages: 1, page: 1 },
    isPending: false,
    isFetching: false,
    isError: false,
  });
  mocks.roles.mockReturnValue({
    data: { items: [role], total: 1, total_pages: 1, page: 1 },
    isError: false,
  });
});

describe("organization administrators", () => {
  it("shows administrators without presenting them as place relationships", async () => {
    mount();
    expect((await screen.findAllByText("Ada Okafor")).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("Organization administrator").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        /Site administration and occupancy relationships remain separate/i,
      ),
    ).toBeInTheDocument();
  });

  it("uses a linked validation summary before creating an administrator", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Add administrator" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Add organization administrator",
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add administrator" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter the administrator's first name.",
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("submits a complete administrator draft", async () => {
    mocks.create.mockImplementation((_payload, options) =>
      options.onSuccess({ data: admin }),
    );
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Add administrator" }),
    );
    const dialog = screen.getByRole("dialog", {
      name: "Add organization administrator",
    });
    fireEvent.change(screen.getByLabelText(/First name/), {
      target: { value: "Tunde" },
    });
    fireEvent.change(screen.getByLabelText(/Last name/), {
      target: { value: "Bello" },
    });
    fireEvent.change(screen.getByLabelText(/Work email/), {
      target: { value: "tunde@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm email/), {
      target: { value: "tunde@example.com" },
    });
    fireEvent.change(
      within(screen.getByRole("dialog")).getByLabelText(/Role/),
      {
        target: { value: role.id },
      },
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add administrator" }),
    );

    await waitFor(() =>
      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: "Tunde",
          last_name: "Bello",
          email: "tunde@example.com",
          role_id: role.id,
        }),
        expect.any(Object),
      ),
    );
  });

  it("keeps destructive removal behind a confirmation dialog", async () => {
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Remove Ada Okafor" }),
    );
    expect(
      screen.getByRole("dialog", {
        name: "Remove organization administrator?",
      }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it("renders a read-only explanation when grants do not allow changes", async () => {
    mocks.profile.mockResolvedValue({
      data: { effective_permissions: ["admins.list"] },
    });
    mount();
    expect(
      await screen.findByText(/your role does not allow changes/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add administrator" }),
    ).not.toBeInTheDocument();
  });
});
