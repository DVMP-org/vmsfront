/** Controlled tenant color inputs. Raw CSS is deliberately not accepted. */
export type BrandPalette = { primary: string; surface: string; text: string };
export type BrandKit = { light: BrandPalette; dark: BrandPalette };

const HEX = /^#[0-9a-f]{6}$/i;

function luminance(color: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const value = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrastRatio(first: string, second: string): number {
  if (!HEX.test(first) || !HEX.test(second)) throw new Error("Colors must be six-digit hex values");
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

/** Reject palettes that cannot support readable text or an identifiable focus ring. */
export function validateBrandKit(kit: BrandKit): string[] {
  const errors: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    const palette = kit[mode];
    if (![palette.primary, palette.surface, palette.text].every((color) => HEX.test(color))) {
      errors.push(`${mode}: colors must be six-digit hex values`);
      continue;
    }
    if (contrastRatio(palette.text, palette.surface) < 4.5) errors.push(`${mode}: text contrast must be at least 4.5:1`);
    if (contrastRatio(palette.primary, palette.surface) < 3) errors.push(`${mode}: primary contrast must be at least 3:1`);
    if (Math.max(contrastRatio(palette.primary, "#ffffff"), contrastRatio(palette.primary, "#000000")) < 4.5) errors.push(`${mode}: primary needs readable button text`);
  }
  return errors;
}

export function brandVariables(kit: BrandKit, mode: keyof BrandKit): Record<string, string> {
  const errors = validateBrandKit(kit);
  if (errors.length) throw new Error(errors.join("; "));
  const palette = kit[mode];
  return {
    "--vms-surface": palette.surface,
    "--vms-text": palette.text,
    "--vms-primary": palette.primary,
    "--vms-on-primary": contrastRatio(palette.primary, "#ffffff") >= 4.5 ? "#ffffff" : "#000000",
    "--vms-focus": palette.primary,
  };
}
