import { describe, expect, it } from "vitest";
import { brandVariables, contrastRatio, validateBrandKit } from "../../packages/ui/src/brand";

const valid = {
  light: { primary: "#175e56", surface: "#faf9f6", text: "#202a2a" },
  dark: { primary: "#8bd7c6", surface: "#18211f", text: "#f4f5ef" },
};

describe("tenant brand kit", () => {
  it("measures WCAG contrast and accepts both accessible modes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(validateBrandKit(valid)).toEqual([]);
    expect(brandVariables(valid, "dark")["--vms-on-primary"]).toBe("#000000");
  });
  it("rejects invalid colors and inaccessible text or focus colors", () => {
    expect(validateBrandKit({ ...valid, light: { ...valid.light, text: "#eeeeee", primary: "#eeeeee" } })).toHaveLength(2);
    expect(() => brandVariables({ ...valid, dark: { ...valid.dark, primary: "red; color: red" } }, "light")).toThrow();
  });
});
