import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "./page";

const { query, refetch } = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn() }));
vi.mock("@/hooks/use-admin", () => ({ useAdminDashboard: query }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));

describe("admin dashboard request failures", () => {
  it("offers retry instead of showing zero metrics after an initial failure", () => {
    query.mockReturnValue({ isLoading: false, isError: true, isFetching: false, refetch });
    render(<AdminDashboardPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Dashboard unavailable");
    expect(screen.queryByText("Residencies")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
  it("warns when a refresh fails but cached data remains", () => {
    query.mockReturnValue({ data: {}, isLoading: false, isError: true, isFetching: true, refetch });
    render(<AdminDashboardPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Showing the last available results");
    expect(screen.getByRole("button", { name: "Retrying…" })).toBeDisabled();
    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });
});
