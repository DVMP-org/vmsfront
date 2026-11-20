import { describe, expect, it } from "vitest";

import type { WalletJournalEntry } from "./api";
import {
    dayLabel,
    groupByDay,
    kindLabel,
    matchesSearch,
    moduleLabel,
    pageTotals,
    toCsv,
} from "./lib";

function entry(overrides: Partial<WalletJournalEntry> = {}): WalletJournalEntry {
    return {
        id: "journal-1",
        reference: "REF-1",
        kind: "funding",
        description: "Wallet top-up",
        source_module: "wallet",
        source_reference: "txn-1",
        amount: "25.00",
        amount_minor: 2500,
        currency: "NGN",
        direction: "credit",
        created_at: "2026-11-20T09:15:00Z",
        ...overrides,
    };
}

describe("wallet activity helpers", () => {
    it("labels modules and kinds without leaking enums", () => {
        expect(moduleLabel("electricity")).toBe("Electricity");
        expect(moduleLabel("shared_expense")).toBe("Shared expense");
        expect(moduleLabel(null)).toBe("Core");
        expect(moduleLabel("mystery_module")).toBe("mystery module");
        expect(kindLabel("settlement")).toBe("Payment");
        expect(kindLabel("adjustment")).toBe("Adjustment");
    });

    it("groups entries by day, newest first", () => {
        const groups = groupByDay([
            entry({ id: "a", created_at: "2026-11-20T09:15:00Z" }),
            entry({ id: "b", created_at: "2026-11-20T18:00:00Z" }),
            entry({ id: "c", created_at: "2026-11-19T08:00:00Z" }),
        ]);
        expect(groups).toHaveLength(2);
        expect(groups[0][1].map((item) => item.id)).toEqual(["a", "b"]);
        expect(groups[1][1].map((item) => item.id)).toEqual(["c"]);
    });

    it("names today and yesterday relative to the supplied clock", () => {
        const now = new Date("2026-11-20T12:00:00Z");
        expect(dayLabel(new Date("2026-11-20T09:00:00Z").toDateString(), now)).toBe(
            "Today",
        );
        expect(dayLabel(new Date("2026-11-19T09:00:00Z").toDateString(), now)).toBe(
            "Yesterday",
        );
    });

    it("separates inbound from outbound amounts", () => {
        const totals = pageTotals([
            entry({ amount_minor: 2500, direction: "credit" }),
            entry({ id: "x", amount_minor: 1000, direction: "debit" }),
            entry({ id: "y", amount_minor: 500, direction: "debit" }),
        ]);
        expect(totals).toEqual({ inbound: 2500, outbound: 1500 });
    });

    it("searches reference, description and source reference", () => {
        const item = entry();
        expect(matchesSearch(item, "REF-1")).toBe(true);
        expect(matchesSearch(item, "top-up")).toBe(true);
        expect(matchesSearch(item, "txn-1")).toBe(true);
        expect(matchesSearch(item, "nope")).toBe(false);
        expect(matchesSearch(item, "   ")).toBe(true);
    });

    it("escapes CSV cells and keeps one header row", () => {
        const csv = toCsv([
            entry({ description: 'Top-up, "bonus"\nline two' }),
        ]);
        const [header, row] = csv.split("\n").slice(0, 2);
        expect(header).toContain("date,kind,direction");
        expect(row).toContain('"Top-up, ""bonus""');
    });
});
