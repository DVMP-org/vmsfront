import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCheckinPass, useAdminHouses } from "@/hooks/use-admin";
import { adminService } from "@/services/admin-service";

// Mock the admin service
vi.mock("@/services/admin-service", () => ({
  adminService: {
    getHouses: vi.fn(),
    checkinPass: vi.fn(),
  },
}));

describe("Admin Hooks", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch houses", async () => {
    const mockHouses = {
      data: [
        {
          id: "1",
          name: "Villa 123",
          address: "123 Main St",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    };

    vi.mocked(adminService.getHouses).mockResolvedValue(mockHouses);

    const { result } = renderHook(() => useAdminHouses(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockHouses.data);
  });

  it("should check in a pass", async () => {
    const mockResponse = {
      data: {
        status: "success",
        message: "Check-in successful",
        gate_pass: {
          id: "1",
          code: "ABC123",
          status: "active",
        },
      },
    };

    vi.mocked(adminService.checkinPass).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCheckinPass(), { wrapper });

    result.current.mutate({ code: "ABC123" });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

