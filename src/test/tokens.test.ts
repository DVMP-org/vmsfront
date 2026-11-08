import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const tokensCss = readFileSync(
  resolve(process.cwd(), "packages/ui/src/tokens.css"),
  "utf8",
);

function token(name: string): string {
  const value = tokensCss.match(
    new RegExp(
      `${name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\s*:\\s*(#[0-9a-f]{6})`,
      "i",
    ),
  )?.[1];
  if (!value) throw new Error(`Missing token ${name}`);
  return value;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("Operations Hub tokens", () => {
  it("contains one light product theme and no runtime dark theme", () => {
    expect(tokensCss).toContain('[data-vms-theme="light"]');
    expect(tokensCss).not.toContain('[data-vms-theme="dark"]');
    expect(tokensCss).toContain("prefers-reduced-motion: reduce");
    expect(tokensCss).toContain("--vms-coral-accent: #ff6b4a");
    expect(tokensCss).toContain("--vms-space-3: 16px");
    expect(tokensCss).toContain("--vms-radius-lg: 12px");
    expect(tokensCss).toContain("--vms-type-heading-size: 24px");
  });

  it("keeps primary text and actions WCAG AA readable", () => {
    expect(
      contrast(token("--vms-ink"), token("--vms-canvas")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token("--vms-ink-muted"), token("--vms-surface")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token("--vms-action"), token("--vms-on-action")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token("--vms-focus"), token("--vms-surface")),
    ).toBeGreaterThanOrEqual(3);
  });

  it("keeps semantic status text readable on subtle surfaces", () => {
    expect(
      contrast(token("--vms-success"), token("--vms-success-subtle")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token("--vms-warning"), token("--vms-warning-subtle")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token("--vms-danger"), token("--vms-danger-subtle")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
