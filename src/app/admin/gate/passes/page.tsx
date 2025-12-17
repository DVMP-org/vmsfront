"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { User } from "lucide-react";
import { GatePassStatus } from "@/types";
import { useAdminGatePasses } from "@/hooks/use-admin";

const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: "All statuses", value: undefined },
  { label: "Active / Checked-in", value: GatePassStatus.CHECKED_IN },
  { label: "Checked-out", value: GatePassStatus.CHECKED_OUT },
  { label: "Pending", value: GatePassStatus.PENDING },
  { label: "Completed", value: GatePassStatus.COMPLETED },
  { label: "Revoked", value: GatePassStatus.REVOKED },
  { label: "Expired", value: GatePassStatus.EXPIRED },
];

export default function AdminGatePassesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching } = useAdminGatePasses({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    status,
  });

  const passes = useMemo(() => data?.items ?? [], [data?.items]);
  const totalPages = data?.total_pages ?? 1;

  const summary = useMemo(() => {
    const total = data?.total ?? 0;
    const active = passes.filter(
      (pass) => pass.status === GatePassStatus.CHECKED_IN
    ).length;
    const pending = passes.filter(
      (pass) => pass.status === GatePassStatus.PENDING
    ).length;
    return { total, active, pending };
  }, [data?.total, passes]);

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[var(--brand-primary,#213928)] to-[var(--brand-secondary,#64748b)] text-white shadow-xl">
          <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="text-sm uppercase tracking-wide text-white/80">
                Gate operations
              </p>
              <h1 className="text-3xl font-semibold">Gate Passes</h1>
              <p className="text-white/80">
                Monitor every issued pass, status transitions, and quick insights.
              </p>
            </div>
            <div className="grid w-full gap-3 text-center text-sm md:w-auto md:grid-cols-3">
              <HeroStat label="Total" value={summary.total} />
              <HeroStat label="Checked in" value={summary.active} />
              <HeroStat label="Pending" value={summary.pending} />
            </div>
          </div>
        </section>

        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Pass registry</CardTitle>
              <CardDescription>
                Search or filter passes to trace their lifecycle.
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-3 md:w-[420px] md:flex-row">
              <Input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Search pass code, resident or visitor..."
              />
              <select
                value={status ?? ""}
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value || undefined);
                }}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {STATUS_FILTERS.map((option) => (
                  <option key={option.label} value={option.value ?? ""}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-xl bg-muted/60"
                  />
                ))}
              </div>
            ) : passes.length === 0 ? (
              <EmptyState
                icon={User}
                title="No passes yet"
                description="Once visitors or residents generate passes, they will appear here."
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pass code</TableHead>
                        <TableHead>Resident</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead>Uses</TableHead>
                        <TableHead className="text-right">Last updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {passes.map((pass) => (
                        <TableRow
                          key={pass.id}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() =>
                            router.push(`/admin/gate/passes/${pass.id}`)
                          }
                        >
                          <TableCell className="font-semibold">
                            {pass.code}
                          </TableCell>
                          <TableCell>
                            {pass.visitors?.[0]?.name ??
                              pass.visitors?.[0]?.email ??
                              "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={pass.status} />
                          </TableCell>
                          <TableCell>
                            {pass.valid_from && pass.valid_to ? (
                              <span className="text-sm text-muted-foreground">
                                {new Date(pass.valid_from).toLocaleDateString()} –{" "}
                                {new Date(pass.valid_to).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Flexible</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {pass.uses_count}/{pass.max_uses ?? "∞"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {pass.updated_at
                              ? formatDistanceToNow(new Date(pass.updated_at), {
                                  addSuffix: true,
                                })
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-muted-foreground">
                    {isFetching ? "Refreshing..." : `${passes.length} results on this page`}
                  </p>
                  {totalPages > 1 && (
                    <PaginationBar
                      page={page}
                      pageSize={PAGE_SIZE}
                      total={data?.total ?? passes.length}
                      totalPages={totalPages}
                      resourceLabel="passes"
                      onChange={setPage}
                    />
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left">
      <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { label: string; className: string }> = {
    [GatePassStatus.CHECKED_IN]: {
      label: "Checked in",
      className: "bg-emerald-50 text-emerald-700",
    },
    [GatePassStatus.CHECKED_OUT]: {
      label: "Checked out",
      className: "bg-slate-100 text-slate-700",
    },
    [GatePassStatus.PENDING]: {
      label: "Pending",
      className: "bg-amber-50 text-amber-700",
    },
    [GatePassStatus.REVOKED]: {
      label: "Revoked",
      className: "bg-rose-50 text-rose-700",
    },
    [GatePassStatus.EXPIRED]: {
      label: "Expired",
      className: "bg-gray-100 text-gray-600",
    },
    [GatePassStatus.COMPLETED]: {
      label: "Completed",
      className: "bg-blue-50 text-blue-700",
    },
  };

  const data = statusMap[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="secondary" className={data.className}>
      {data.label}
    </Badge>
  );
}
