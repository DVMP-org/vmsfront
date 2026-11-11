import { describe, expect, it } from "vitest";

import {
    formatDate,
    formatDateTime,
    formatDateRange,
    formatMonthYear,
    formatTime,
    fromDateInputValue,
    isPast,
    relativeTime,
    toDate,
    toDateInputValue,
    toDateTimeInputValue,
} from "@/lib/datetime";
import { formatAmount, formatMoney, sumAmounts } from "@/lib/currency";
import {
    humanize,
    initials,
    maskEmail,
    normalizeCode,
    normalizeKey,
    pluralize,
    slugify,
    titleCase,
    truncate,
} from "@/lib/strings";

describe("datetime helpers", () => {
    it("formats a date without a year-only or invalid fallback", () => {
        const date = formatDate("2026-11-04T09:00:00Z");
        expect(date).toContain("2026");
        expect(date).toMatch(/Nov/);
        expect(date).toContain("4");
        expect(formatMonthYear("2026-11-04T09:00:00Z")).toMatch(/November 2026/);
        expect(formatTime("2026-11-04T09:00:00Z")).toMatch(/\d{2}:\d{2}/);
        expect(formatDateTime("2026-11-04T09:00:00Z")).toMatch(/2026/);
    });

    it("returns an em dash instead of Invalid Date", () => {
        expect(formatDate(null)).toBe("—");
        expect(formatDate("not-a-date")).toBe("—");
        expect(formatDateTime(undefined)).toBe("—");
        expect(formatDateRange(null, "2026-11-04")).toBe("—");
    });

    it("compresses a multi-day window into a readable range", () => {
        const range = formatDateRange(
            "2026-11-04T09:00:00Z",
            "2026-11-06T18:00:00Z",
        );
        expect(range).toContain("–");
        expect(range).toMatch(/Nov/);
    });

    it("round-trips date input values at UTC midnight", () => {
        expect(toDateInputValue("2026-11-04T00:00:00Z")).toBe("2026-11-04");
        expect(fromDateInputValue("2026-11-04")?.toISOString()).toBe(
            "2026-11-04T00:00:00.000Z",
        );
        expect(toDateTimeInputValue(null)).toBe("");
        expect(fromDateInputValue("")).toBeNull();
    });

    it("describes relative time and past instants", () => {
        const now = new Date("2026-11-04T12:00:00Z");
        expect(relativeTime("2026-11-04T15:00:00Z", now)).toMatch(/hour/);
        expect(relativeTime(null, now)).toBe("—");
        expect(isPast("2026-11-01T00:00:00Z", now)).toBe(true);
        expect(isPast("2026-12-01T00:00:00Z", now)).toBe(false);
    });

    it("hands back a Date or null", () => {
        expect(toDate("2026-11-04")).toBeInstanceOf(Date);
        expect(toDate("")).toBeNull();
    });
});

describe("string helpers", () => {
    it("humanizes and title cases server values", () => {
        expect(humanize("household_member")).toBe("Household member");
        expect(humanize("checkpoint-outside-schedule")).toBe(
            "Checkpoint outside schedule",
        );
        expect(titleCase("household_member")).toBe("Household Member");
        expect(humanize(undefined)).toBe("");
    });

    it("normalizes keys for comparisons", () => {
        expect(normalizeKey(" Awaiting-Approval ")).toBe("awaiting_approval");
    });

    it("builds initials, plurals, slugs and masked emails", () => {
        expect(initials("Ade Bola Guest")).toBe("AB");
        expect(initials("")).toBe("?");
        expect(initials(null, "U")).toBe("U");
        expect(pluralize(1, "visitor")).toBe("1 visitor");
        expect(pluralize(2, "visitor")).toBe("2 visitors");
        expect(pluralize(2, "entry", "entries")).toBe("2 entries");
        expect(slugify(" Pebble Court – Apt 01 ")).toBe("pebble-court-apt-01");
        expect(maskEmail("guest@example.com")).toMatch(/^g•+@example\.com$/);
        expect(maskEmail(null)).toBe("");
    });

    it("truncates on a word boundary", () => {
        expect(truncate("short", 10)).toBe("short");
        expect(truncate("Kitchen tap leaking badly", 14)).toBe("Kitchen tap…");
    });

    it("normalizes credential codes", () => {
        expect(normalizeCode(" inv-123 456 ")).toBe("INV-123456");
    });
});

describe("currency helpers", () => {
    it("formats whole and fractional amounts", () => {
        expect(formatMoney("15000", "NGN")).toContain("15,000");
        expect(formatMoney("15000.5", "NGN")).toMatch(/15,000\.50?/);
        expect(formatMoney("15000")).toContain("15,000");
    });

    it("falls back safely for unusable input", () => {
        expect(formatMoney(null)).toBe("—");
        expect(formatMoney("nope")).toBe("—");
        expect(formatMoney("1000", "NOTACODE")).toContain("1,000");
    });

    it("sums mixed amount types", () => {
        expect(sumAmounts(["10.50", 2, null, "0.5"])).toBe(13);
        expect(formatAmount("13")).toBe("13.00");
    });
});
