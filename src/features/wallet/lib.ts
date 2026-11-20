import type { WalletJournalEntry } from "./api";

export const KIND_LABELS: Record<string, string> = {
    funding: "Top-up",
    settlement: "Payment",
    refund: "Refund",
    adjustment: "Adjustment",
};

const MODULE_LABELS: Record<string, string> = {
    wallet: "Wallet",
    charge: "Charge",
    electricity: "Electricity",
    booking: "Booking",
    lease: "Lease",
    shared_expense: "Shared expense",
    wallet_migration: "Imported",
};

/** Human label for the module that posted a journal. */
export function moduleLabel(value?: string | null) {
    if (!value) return "Core";
    return MODULE_LABELS[value] ?? value.replaceAll("_", " ");
}

export function kindLabel(value?: string | null) {
    if (!value) return "Journal";
    return KIND_LABELS[value] ?? value.replaceAll("_", " ");
}

/** Stable day bucket key for grouping journals. */
export function dayKey(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toDateString();
}

export function dayLabel(key: string, now: Date = new Date()) {
    const parsed = new Date(key);
    if (Number.isNaN(parsed.getTime())) return key;
    const today = now.toDateString();
    if (parsed.toDateString() === today) return "Today";
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (parsed.toDateString() === yesterday.toDateString()) return "Yesterday";
    return parsed.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function timeLabel(value: string) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
    });
}

/** Group journals into ordered day buckets, newest first. */
export function groupByDay(
    entries: WalletJournalEntry[],
): Array<[string, WalletJournalEntry[]]> {
    const map = new Map<string, WalletJournalEntry[]>();
    for (const entry of entries) {
        const key = dayKey(entry.created_at);
        map.set(key, [...(map.get(key) ?? []), entry]);
    }
    return Array.from(map.entries());
}

/** Totals for one page of journals, in minor units. */
export function pageTotals(entries: WalletJournalEntry[]) {
    let inbound = 0;
    let outbound = 0;
    for (const entry of entries) {
        if (entry.direction === "credit") inbound += entry.amount_minor;
        else outbound += entry.amount_minor;
    }
    return { inbound, outbound };
}

/** Client-side search across the fields a Party would recognise. */
export function matchesSearch(entry: WalletJournalEntry, term: string) {
    const needle = term.trim().toLowerCase();
    if (!needle) return true;
    return [entry.description, entry.reference, entry.source_reference, entry.kind]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
}

function csvCell(value: unknown) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const CSV_HEADER = [
    "date",
    "kind",
    "direction",
    "amount",
    "currency",
    "reference",
    "module",
    "source_reference",
    "description",
];

/** CSV of the rows the user can currently see. */
export function toCsv(entries: WalletJournalEntry[]) {
    const rows = entries.map((entry) => [
        entry.created_at,
        kindLabel(entry.kind),
        entry.direction,
        entry.amount,
        entry.currency,
        entry.reference,
        moduleLabel(entry.source_module),
        entry.source_reference ?? "",
        entry.description ?? "",
    ]);
    return [CSV_HEADER, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}
