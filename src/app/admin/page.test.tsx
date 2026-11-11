import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Page from "./page";
const state = vi.hoisted(() => ({ domain: "residential" }));
vi.mock("@/features/context/use-workspace-context", () => ({
  useWorkspaceContext: () => ({
    data: { effective_use_case: state.domain },
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/features/residential/ResidentialOverview", () => ({
  default: () => <div>Residential dashboard</div>,
}));
vi.mock("@/features/commercial/CommercialOverview", () => ({
  default: () => <div>Commercial dashboard</div>,
}));
vi.mock("@/features/hospitality/HospitalityOverview", () => ({
  default: () => <div>Hospitality dashboard</div>,
}));
vi.mock("@/features/mixed-use/MixedUseOverview", () => ({
  MixedUseOverview: () => <div>Mixed-use dashboard</div>,
}));
vi.mock("@/features/dashboard/DefaultAdminOverview", () => ({
  default: () => <div>Default dashboard</div>,
}));
describe("domain overview at /admin", () => {
  it.each([
    ["residential", "Residential"],
    ["commercial", "Commercial"],
    ["hospitality", "Hospitality"],
    ["mixed_use", "Mixed-use"],
  ])("loads the %s overview", (domain, label) => {
    state.domain = domain;
    render(<Page />);
    expect(screen.getByText(`${label} dashboard`)).toBeInTheDocument();
  });
});
