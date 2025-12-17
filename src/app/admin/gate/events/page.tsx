"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Activity, Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { useAdminGateEvents } from "@/hooks/use-admin";
import { titleCase } from "@/lib/utils";

const PAGE_SIZE = 15;

export default function AdminGateEventsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [passFilter, setPassFilter] = useState("");
  const [houseFilter, setHouseFilter] = useState("");

  const { data, isLoading, isFetching } = useAdminGateEvents({
    page,
    pageSize: PAGE_SIZE,
    passId: passFilter.trim() || undefined,
    houseId: houseFilter.trim() || undefined,
  });

  const events = useMemo(() => data?.items ?? [], [data?.items]);
  const totalPages = data?.total_pages ?? 1;

  const breakdown = useMemo(() => {
    const total = data?.total ?? 0;
    const entries = events.filter((event) => event.checkout_time === null).length;
    const exits = events.filter((event) => !!event.checkout_time).length;
    return { total, entries, exits };
  }, [data?.total, events]);

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-br from-[var(--brand-primary,#213928)] to-[var(--brand-secondary,#64748b)] text-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted">
                Gate telemetry
              </p>
              <h1 className="text-3xl font-semibold">Gate Events</h1>
              <p className="text-muted">
                Every scan at the community gate, grouped across houses and passes.
              </p>
            </div>
            <div className="grid w-full gap-3 text-center text-sm md:w-auto md:grid-cols-3">
              <SummaryPill label="Events logged" value={breakdown.total} />
              <SummaryPill label="Entries" value={breakdown.entries} />
              <SummaryPill label="Exits" value={breakdown.exits} />
            </div>
          </div>
        </section>

        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Live event stream</CardTitle>
              <CardDescription>Filter by pass or house to investigate anomalies.</CardDescription>
            </div>
            <div className="grid w-full gap-3 md:w-auto md:grid-cols-2">
              <Input
                placeholder="Filter by pass ID"
                value={passFilter}
                onChange={(event) => {
                  setPage(1);
                  setPassFilter(event.target.value);
                }}
              />
              <Input
                placeholder="Filter by house ID"
                value={houseFilter}
                onChange={(event) => {
                  setPage(1);
                  setHouseFilter(event.target.value);
                }}
              />
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
            ) : events.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No events match these filters"
                description="Try removing filters or check back after the next scan."
              />
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Pass</TableHead>
                        <TableHead>House</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Scanner</TableHead>
                        <TableHead className="text-right">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow
                          key={event.id}
                          className="cursor-pointer hover:bg-muted/40"
                          onClick={() => router.push(`/admin/gate/events/${event.id}`)}
                        >
                          <TableCell>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                              {titleCase(event.owner_type) ?? "Scan"}
                            </Badge>
                          </TableCell>
                          <TableCell>{event?.gate_pass?.code ?? "—"}</TableCell>
                          <TableCell>{event?.gate_pass?.house_id ?? "—"}</TableCell>
                          <TableCell>
                            {event.owner && "name" in event.owner
                              ? event.owner.name ?? event.owner.email ?? "—"
                              : "—"}
                          </TableCell>
                          <TableCell>{event?.scanned_by?.name ?? "—"}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {event.created_at
                              ? formatDistanceToNow(new Date(event.created_at), {
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
                    {isFetching ? "Refreshing..." : `${events.length} events on this page`}
                  </p>
                  {totalPages > 1 && (
                    <PaginationBar
                      page={page}
                      pageSize={PAGE_SIZE}
                      total={data?.total ?? events.length}
                      totalPages={totalPages}
                      resourceLabel="events"
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

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-left text-muted">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
