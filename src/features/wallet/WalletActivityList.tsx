"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  ReceiptText,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  EmptyRow,
  SectionCard,
  Tabs,
  formatMoney,
  listRowClass,
} from "@/features/place-workspace/ui";

import type { WalletJournalEntry } from "./api";
import {
  dayLabel,
  groupByDay,
  kindLabel,
  matchesSearch,
  moduleLabel,
  pageTotals,
  timeLabel,
  toCsv,
} from "./lib";
import { useWalletActivity } from "./queries";
import { WalletReceiptDrawer } from "./WalletReceiptDrawer";

const KIND_TABS = [
  { value: "all", label: "All" },
  { value: "funding", label: "Top-ups" },
  { value: "settlement", label: "Payments" },
  { value: "refund", label: "Refunds" },
] as const;

export function WalletActivityList({ placeId }: { placeId: string }) {
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<string>("all");
  const [module, setModule] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<WalletJournalEntry | null>(null);

  const activity = useWalletActivity(placeId, page, 20, {
    kind: kind === "all" ? undefined : kind,
    sourceModule: module === "all" ? undefined : module,
  });
  const items = useMemo(() => activity.data?.items ?? [], [activity.data]);
  const total = activity.data?.total ?? 0;
  const pageSize = activity.data?.page_size ?? 20;
  const hasNext = page * pageSize < total;

  const modules = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.source_module).filter(Boolean)),
      ).sort() as string[],
    [items],
  );

  const visible = useMemo(
    () => items.filter((item) => matchesSearch(item, search)),
    [items, search],
  );
  const groups = useMemo(() => groupByDay(visible), [visible]);
  const totals = useMemo(() => pageTotals(items), [items]);

  const hasAny = total > 0 || items.length > 0;
  const filtering = kind !== "all" || module !== "all" || search.trim() !== "";

  const exportCsv = () => {
    const url = URL.createObjectURL(
      new Blob([toCsv(visible)], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `wallet-activity-page-${page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SectionCard
      title="Wallet activity"
      description="Every top-up, payment and refund, newest first. Each row is an immutable posted journal."
      action={
        hasAny ? (
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download aria-hidden className="mr-1 h-3.5 w-3.5" />
            Export
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-3">
        <Tabs
          tabs={KIND_TABS.map((tab) => ({ value: tab.value, label: tab.label }))}
          value={kind}
          onChange={(value) => {
            setKind(value);
            setPage(1);
          }}
          label="Filter wallet activity by kind"
        />

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[12rem] flex-1">
            <span className="sr-only">Search wallet activity</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--vms-ink-muted)]"
            />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference or description"
              className="pl-8"
            />
          </label>
          {modules.length > 1 ? (
            <label className="flex items-center gap-1.5 text-xs text-[var(--vms-ink-muted)]">
              <span className="font-semibold uppercase tracking-[0.08em]">
                Source
              </span>
              <select
                value={module}
                onChange={(event) => {
                  setModule(event.target.value);
                  setPage(1);
                }}
                className="min-h-9 rounded-md border border-[var(--vms-line)] bg-[var(--vms-surface)] px-2 text-sm text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
              >
                <option value="all">All sources</option>
                {modules.map((value) => (
                  <option key={value} value={value}>
                    {moduleLabel(value)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>

        {items.length ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-[var(--vms-surface-subtle)] px-3 py-2 text-xs text-[var(--vms-ink-muted)]">
            <span className="inline-flex items-center gap-1">
              <ArrowDownLeft aria-hidden className="h-3.5 w-3.5" />
              <span className="font-semibold text-[var(--vms-ink)]">
                {formatMoney(totals.inbound / 100)}
              </span>
              in
            </span>
            <span className="inline-flex items-center gap-1">
              <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
              <span className="font-semibold text-[var(--vms-ink)]">
                {formatMoney(totals.outbound / 100)}
              </span>
              out
            </span>
            <span>
              on this page · {total} journal{total === 1 ? "" : "s"} in total
            </span>
          </div>
        ) : null}

        {activity.isLoading && !items.length ? (
          <ul aria-hidden className="space-y-2">
            {[0, 1, 2].map((row) => (
              <li
                key={row}
                className="h-14 animate-pulse rounded-lg bg-[var(--vms-surface-subtle)]"
              />
            ))}
          </ul>
        ) : groups.length === 0 ? (
          <EmptyRow
            icon={ReceiptText}
            title={
              hasAny ? "Nothing matches those filters" : "No wallet activity yet"
            }
            description={
              hasAny
                ? "Try a different source, kind or search term."
                : "Top-ups and payments will appear here as soon as they post."
            }
            action={
              hasAny && filtering ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setKind("all");
                    setModule("all");
                    setSearch("");
                  }}
                >
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {groups.map(([key, entries]) => (
              <div key={key}>
                <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--vms-ink-muted)]">
                  {dayLabel(key)}
                </p>
                <ul>
                  {entries.map((entry) => {
                    const credit = entry.direction === "credit";
                    return (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(entry)}
                          className={`${listRowClass} w-full items-center text-left transition hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]`}
                        >
                          <span
                            aria-hidden
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                              credit
                                ? "bg-[var(--vms-success-subtle)] text-[var(--vms-success)]"
                                : "bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]"
                            }`}
                          >
                            {credit ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-[var(--vms-ink)]">
                              {entry.description || kindLabel(entry.kind)}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-[var(--vms-ink-muted)]">
                              {timeLabel(entry.created_at)} ·{" "}
                              {moduleLabel(entry.source_module)} ·{" "}
                              <span className="font-mono">{entry.reference}</span>
                            </span>
                          </span>
                          <span className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-sm font-semibold tabular-nums text-[var(--vms-ink)]">
                              {credit ? "+" : "−"}
                              {formatMoney(Number(entry.amount))}
                            </span>
                            <Badge
                              variant={credit ? "success" : "neutral"}
                              className="text-[10px]"
                            >
                              {kindLabel(entry.kind)}
                            </Badge>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {total > pageSize ? (
          <div className="flex items-center justify-between border-t border-[var(--vms-line)] pt-3">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-[var(--vms-ink-muted)]">
              Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      <WalletReceiptDrawer entry={selected} onClose={() => setSelected(null)} />
    </SectionCard>
  );
}
