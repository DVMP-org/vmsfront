/**
 * String helpers shared by every screen.
 *
 * Server values are snake_case and often shown to people, so the helpers here
 * own that translation once instead of each component inventing its own
 * `replaceAll("_", " ")`.
 */

/** `household_member` → `Household member`. */
export function humanize(value?: string | null): string {
    if (!value) return "";
    const spaced = value
        .trim()
        .replaceAll(/[_-]+/g, " ")
        .replaceAll(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** `household member` → `Household Member`. */
export function titleCase(value?: string | null): string {
    return humanize(value).replace(/\b\w/g, (character) => character.toUpperCase());
}

/** Status keys are compared lowercase with single underscores. */
export function normalizeKey(value?: string | null): string {
    return (value ?? "").trim().toLowerCase().replaceAll(/[\s-]+/g, "_");
}

/** `Ade Bola Guest` → `AB`. */
export function initials(value?: string | null, fallback = "?"): string {
    const parts = (value ?? "").split(/\s+/).filter(Boolean).slice(0, 2);
    const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
    return letters || fallback;
}

/** Shorten without cutting a word mid-way when a space is available. */
export function truncate(value: string, max: number): string {
    if (value.length <= max) return value;
    const cut = value.slice(0, max);
    const boundary = cut.lastIndexOf(" ");
    return `${(boundary > max * 0.6 ? cut.slice(0, boundary) : cut).trimEnd()}…`;
}

/** `1 visitor` / `3 visitors`. */
export function pluralize(count: number, singular: string, plural?: string) {
    return `${count} ${count === 1 ? singular : (plural ?? `${singular}s`)}`;
}

/** `Apt 01 → apt-01`. */
export function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

/** `guest@example.com` → `g•••@example.com` for public surfaces. */
export function maskEmail(value?: string | null): string {
    if (!value || !value.includes("@")) return value ?? "";
    const [local, domain] = value.split("@");
    const visible = local.slice(0, 1);
    return `${visible}${"•".repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

/** Uppercase and strip whitespace, the shape credentials are stored in. */
export function normalizeCode(value?: string | null): string {
    return (value ?? "").replaceAll(/\s+/g, "").toUpperCase();
}
