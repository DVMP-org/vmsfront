import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateGatePass, useGatePasses } from "@/hooks/use-resident";
import { residentService } from "@/services/resident-service";

// Mock the resident service
vi.mock("@/services/resident-service", () => ({
  residentService: {
    getGatePasses: vi.fn(),
    createGatePass: vi.fn(),
  },
}));

describe("Resident Hooks", () => {
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

  it("should fetch gate passes", async () => {
    const mockPasses = {
      data: {
        items: [
          {
            id: "1",
            code: "ABC123",
            status: "active",
            visitors: [],
          },
        ],
        total: 1,
        page: 1,
        page_size: 10,
        total_pages: 1,
      },
    };

    vi.mocked(residentService.getGatePasses).mockResolvedValue(mockPasses);

    const { result } = renderHook(() => useGatePasses("house-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPasses.data);
    expect(residentService.getGatePasses).toHaveBeenCalledWith(
      "house-1",
      1,
      10
    );
  });

  it("should create a gate pass", async () => {
    const mockResponse = {
      data: {
        id: "1",
        code: "ABC123",
        status: "active",
        visitors: [],
      },
    };

    vi.mocked(residentService.createGatePass).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateGatePass("house-1"), { wrapper });

    const passData = {
      resident_id: "user-1",
      house_id: "house-1",
      valid_from: new Date().toISOString(),
      valid_to: new Date().toISOString(),
      visitors: [{ name: "John", email: "john@test.com" }],
    };

    result.current.mutate(passData);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(residentService.createGatePass).toHaveBeenCalledWith("house-1", passData);
  });
});
