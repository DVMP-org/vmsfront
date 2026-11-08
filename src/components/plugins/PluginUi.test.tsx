import { render, screen } from "@testing-library/react";
import { Zap } from "lucide-react";
import { describe, expect, it } from "vitest";

import { PluginMetricStrip, PluginNotice } from "./PluginUi";

describe("plugin Operations Hub primitives", () => {
  it("renders a single labelled metric region", () => {
    render(
      <PluginMetricStrip
        label="Electricity summary"
        metrics={[
          {
            label: "Meters",
            value: 4,
            detail: "Registered",
            icon: Zap,
          },
        ]}
      />,
    );

    const summary = screen.getByLabelText("Electricity summary");
    expect(summary.tagName).toBe("DL");
    expect(summary).toHaveTextContent("Meters4Registered");
  });

  it("exposes contextual notices and actions", () => {
    render(
      <PluginNotice
        tone="danger"
        title="Settings unavailable"
        action={<button type="button">Retry</button>}
      >
        Try a later request.
      </PluginNotice>,
    );

    expect(screen.getByText("Settings unavailable")).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();
    expect(screen.getByText("Try a later request.")).toBeVisible();
  });
});
