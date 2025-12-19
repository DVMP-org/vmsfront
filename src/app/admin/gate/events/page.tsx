"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-medium">Gate Events</h1>
            <p className="text-xs text-muted-foreground">
              Total: {breakdown.total} | Entries: {breakdown.entries} | Exits: {breakdown.exits}
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Pass ID"
              value={passFilter}
              onChange={(event) => {
                setPage(1);
                setPassFilter(event.target.value);
              }}
              className="h-8 w-40 text-sm"
            />
            <Input
              placeholder="House ID"
              value={houseFilter}
              onChange={(event) => {
                setPage(1);
                setHouseFilter(event.target.value);
              }}
              className="h-8 w-40 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-9 animate-pulse rounded border border-border bg-muted/30"
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
                <div className="overflow-x-auto border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-9 text-xs font-medium">Event</TableHead>
                        <TableHead className="h-9 text-xs font-medium">Pass</TableHead>
                        <TableHead className="h-9 text-xs font-medium">House</TableHead>
                        <TableHead className="h-9 text-xs font-medium">Owner</TableHead>
                        <TableHead className="h-9 text-xs font-medium">Scanner</TableHead>
                        <TableHead className="h-9 text-right text-xs font-medium">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow
                          key={event.id}
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => router.push(`/admin/gate/events/${event.id}`)}
                        >
                          <TableCell className="h-9 py-1.5">
                            <Badge variant="secondary" className="h-5 text-xs font-normal">
                              {titleCase(event.owner_type) ?? "Scan"}
                            </Badge>
                          </TableCell>
                          <TableCell className="h-9 py-1.5 text-xs">{event?.gate_pass?.code ?? "—"}</TableCell>
                          <TableCell className="h-9 py-1.5 text-xs">{event?.gate_pass?.house_id ?? "—"}</TableCell>
                          <TableCell className="h-9 py-1.5 text-xs">
                            {event.owner && "name" in event.owner
                              ? event.owner.name ?? event.owner.email ?? "—"
                              : "—"}
                          </TableCell>
                          <TableCell className="h-9 py-1.5 text-xs">{event?.scanned_by?.name ?? "—"}</TableCell>
                          <TableCell className="h-9 py-1.5 text-right text-xs text-muted-foreground">
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

                <div className="flex flex-col gap-2 border-t border-border pt-2 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-muted-foreground">
                {isFetching ? "Refreshing..." : `${events.length} of ${data?.total ?? 0} events`}
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
      </div>
    </DashboardLayout>
  );
}
