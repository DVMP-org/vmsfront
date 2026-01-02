"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminResidents, useImportResidents } from "@/hooks/use-admin";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { Users } from "lucide-react";
import { getFullName } from "@/lib/utils";
import { ImportResponse, ResidentUser } from "@/types";
import { toast } from "sonner";
const PAGE_SIZE = 10;
const STATUS_FILTERS: Array<{ label: string; value: string | undefined }> = [
  { label: "All Residents", value: undefined },
  { label: "Super User", value: "super_user" },
];
export default function ResidentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching } = useAdminResidents({
    page,
    pageSize: PAGE_SIZE,
    search: search.trim() || undefined,
    status,
  });
  const importResidentsMutation = useImportResidents();
  const router = useRouter();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportResponse | null>(null);
  const importFormRef = useRef<HTMLFormElement>(null);
  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    importFormRef.current?.reset();
  };

  const residents = useMemo(() => data?.items ?? [], [data]);
  const totalPages = data?.total_pages ?? 1;
  const pageSize = data?.page_size ?? PAGE_SIZE;
  const showPagination = (data?.total_pages ?? 0) > 1;

  const handlePageChange = (nextPage: number) => {
    const safeMax = Math.max(totalPages, 1);
    const safePage = Math.min(Math.max(nextPage, 1), safeMax);
    setPage(safePage);
  };
  const columns: Column<ResidentUser>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      filterable: true,
      accessor: (row) => (
        <span className="font-medium">
          {getFullName(row?.user?.first_name, row?.user?.last_name)}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      filterable: true,
      accessor: (row) => row?.user?.email,
    },
    {
      key: "phone",
      header: "Phone",
      sortable: true,
      filterable: true,
      accessor: (row) => row?.user?.phone || "-",
    },
    {
      key: "houses",
      header: "Houses",
      sortable: false,
      accessor: (row) =>
        row.houses && row?.houses?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.houses.map((house) => (
              <Badge key={house.id} variant="secondary">
                {house.name}
              </Badge>
            ))}
          </div>
        ) : (
          "-"
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      filterable: true,
      filterType: "select",
      filterOptions: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      accessor: (row) => (
        <Badge variant={row.user.is_active ? "success" : "secondary"}>
          {row.user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Residents</h1>
            <p className="text-muted-foreground">View and manage residents</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              Bulk Import
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => router.push("/admin/residents/create")}
            >
              Add resident
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                value={search}
                onChange={(event) => {
                  setPage(1);
                  setSearch(event.target.value);
                }}
                placeholder="Search residents by name, email, or phone..."
                className="md:w-1/2"
              />
              <select
                value={status ?? ""}
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value || undefined);
                }}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.label} value={filter.value ?? ""}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <TableSkeleton />
            ) : !residents || residents.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No residents yet"
                description="Residents will appear here once they are created"
                action={{
                  label: "Add resident",
                  onClick: () => router.push("/admin/residents/create"),
                }}
              />
            ) : (
              <>
                <DataTable
                  data={residents}
                  columns={columns}
                  searchable={false}
                  showPagination={false}
                  emptyMessage="No residents found"
                />
                {showPagination && (
                  <PaginationBar
                    page={page}
                    pageSize={pageSize}
                    total={data?.total ?? residents.length}
                    totalPages={totalPages}
                    hasNext={data?.has_next}
                    hasPrevious={data?.has_previous}
                    resourceLabel="residents"
                    onChange={handlePageChange}
                    isFetching={isFetching}
                    className="mt-6"
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Bulk Import Residents"
      >
        <form
          ref={importFormRef}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!importFile) {
              toast.error("Please select a CSV file to import.");
              return;
            }
            const formData = new FormData();
            formData.append("file", importFile);
            importResidentsMutation.mutate(formData, {
              onSuccess: (response) => {
                setImportSummary(response.data);
                setImportFile(null);
                importFormRef.current?.reset();
                setIsImportModalOpen(false);
              },
            });
          }}
        >
          <p className="text-sm text-muted-foreground">
            Upload a CSV file with columns{" "}
            <code className="rounded bg-muted px-1">email</code>, optional{" "}
            <code className="rounded bg-muted px-1">first_name</code>,{" "}
            <code className="rounded bg-muted px-1">last_name</code>,{" "}
            <code className="rounded bg-muted px-1">phone</code>,{" "}
            <code className="rounded bg-muted px-1">address</code>, and{" "}
            <code className="rounded bg-muted px-1">house_names</code> (comma-separated).
          </p>
          <pre className="rounded-lg bg-muted p-3 text-xs">
            {`email,first_name,last_name,phone,address,house_names
jane@example.com,Jane,Doe,+1234567890,Block 1,"Villa 1,Villa 2"
bob@example.com,Bob,Wilson,,,"House B"`}
          </pre>
          <Input
            type="file"
            accept=".csv"
            onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
          />
          {importFile && (
            <p className="text-xs text-muted-foreground">
              Selected file: {importFile.name}
            </p>
          )}
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={handleCloseImportModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={importResidentsMutation.isPending}>
              Import Residents
            </Button>
          </div>
          {importSummary && (
            <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm">
              <p className="font-semibold text-foreground">Last import</p>
              <p>
                {importSummary.successful} of {importSummary.total} succeeded.
              </p>
              {importSummary.failed > 0 && (
                <p className="text-destructive">
                  {importSummary.failed} item(s) failed. Review the server logs for
                  details.
                </p>
              )}
            </div>
          )}
        </form>
      </Modal>
    </>
  );
}
