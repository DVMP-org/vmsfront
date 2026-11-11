import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import AdminForumsPage from "./page";
vi.mock("@/features/forum/ForumEntry", () => ({
  SiteForum: () => <h1>Site community forum</h1>,
}));
it("uses the shared Site forum rather than the retired Residency forum", () => {
  render(<AdminForumsPage />);
  expect(
    screen.getByRole("heading", { name: "Site community forum" }),
  ).toBeInTheDocument();
});
