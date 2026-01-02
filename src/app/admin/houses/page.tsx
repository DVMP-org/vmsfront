"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminResidents, useImportResidents } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, FilterableField, BulkAction } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Users, Trash2, Download } from "lucide-react";
import { getFullName } from "@/lib/utils";
import { formatFiltersForAPI, formatSortForAPI } from "@/lib/table-utils";
import { ImportResponse, ResidentUser } from "@/types";
import { toast } from "sonner";
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;

export default function ResidentsPage() {
  // URL query sync
  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config: {
      page: { defaultValue: 1 },
      pageSize: { defaultValue: PAGE_SIZE },
      search: { defaultValue: "" },
      status: { defaultValue: undefined },
      sort: { defaultValue: null },
    },
    skipInitialSync: true,
  });

  // Initialize state from URL
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("status"));
  const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
  const [selectedResidents, setSelectedResidents] = useState<Set<string>>(new Set());

  // Sync state to URL
  useEffect(() => {
    syncToUrl({ page, pageSize, search, status, sort });
  }, [page, pageSize, search, status, sort, syncToUrl]);

  // Build filterable fields from payload
  const filterableFields = useMemo(() => {
    const fields: Array<{ field: string; operator?: "eq"; value?: string | null }> = [];
    if (status) {
      fields.push({ field: "status", operator: "eq", value: status });
    }
    return fields;
  }, [status]);

  const { data, isLoading, isFetching } = useAdminResidents({
    page,
    pageSize,
    search: search.trim() || undefined,
    status,
    filters: formatFiltersForAPI(
      filterableFields.map((f) => ({
        field: f.field,
        operator: f.operator || "eq",
        value: f.value!,
      }))
    ),
    sort: sort || undefined,
  });

  const importResidentsMutation = useImportResidents();
  const router = useRouter();

  // Bulk actions
  const handleBulkDelete = (selectedIds: string[]) => {
    toast.info(`Deleting ${selectedIds.length} resident(s)...`);
    setSelectedResidents(new Set());
  };

  const handleBulkExport = (selectedIds: string[]) => {
    toast.info(`Exporting ${selectedIds.length} resident(s)...`);
    // TODO: Implement export functionality
  };

  const bulkActions: BulkAction[] = [
    {
      label: "Export",
      icon: Download,
      onClick: handleBulkExport,
      variant: "outline",
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: handleBulkDelete,
      variant: "destructive",
      requiresConfirmation: true,
    },
  ];
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
  const total = data?.total ?? 0;


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
              <DataTable
                data={residents}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search residents by name, email, or phone..."
                pageSize={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageSizeChange={setPageSize}
                showPagination={true}
                emptyMessage="No residents found"
                serverSide={true}
                total={total}
                currentPage={page}
                onPageChange={setPage}
                externalSearch={search}
                onSearchChange={(value) => {
                  setPage(1);
                  setSearch(value);
                }}
                filterableFields={filterableFields}
                onFiltersChange={(filters) => {
                  setPage(1);
                  const statusFilter = filters.find((f) => f.field === "status");
                  setStatus(statusFilter?.value as string | undefined || undefined);
                }}
                onSortChange={(newSort) => {
                  setPage(1);
                  setSort(newSort);
                }}
                disableClientSideFiltering={true}
                disableClientSideSorting={true}
                selectable={true}
                selectedRows={selectedResidents}
                onSelectionChange={setSelectedResidents}
                bulkActions={bulkActions}
              />
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
    </ >
  );
}