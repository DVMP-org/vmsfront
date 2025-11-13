import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/services/auth-service";

// Mock the auth service
vi.mock("@/services/auth-service", () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getDashboardSelect: vi.fn(),
  },
}));

// Mock the router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("Auth Hook", () => {
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

  it("should handle login", async () => {
    const mockResponse = {
      data: {
        user: {
          id: "1",
          email: "test@example.com",
          first_name: "Test",
          last_name: "User",
          is_active: true,
        },
        token: "mock-token",
      },
    };

    vi.mocked(authService.login).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    result.current.login({ email: "test@example.com", password: "password" });

    await waitFor(() => {
      expect(result.current.isLoggingIn).toBe(false);
    });
  });

  it("should handle logout", async () => {
    vi.mocked(authService.logout).mockResolvedValue();

    const { result } = renderHook(() => useAuth(), { wrapper });

    result.current.logout();

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(false);
    });
  });
});
