"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminResidents, useImportResidents, useUpdateResident, useDeleteResident, usePrefetchResident } from "@/hooks/use-admin";
import { useUrlQuerySync } from "@/hooks/use-url-query-sync";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column, BulkAction, FilterDefinition, FilterConfig } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Users, Trash2, Download, Eye, Pencil, Upload, Plug, Plus } from "lucide-react";
import { getFullName } from "@/lib/utils";
import { formatFiltersForAPI, formatSortForAPI } from "@/lib/table-utils";
import { ImportResponse, ResidentUser } from "@/types";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const editResidentSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[\d\s-]{10,20}$/, "Invalid phone number format"),
  address: z.string().min(5, "Address must be at least 5 characters"),
});

type EditResidentFormData = z.infer<typeof editResidentSchema>;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const PAGE_SIZE = 10;

export default function ResidentsPage() {
  // URL query sync
  const config = useMemo(() => ({
    page: { defaultValue: 1 },
    pageSize: { defaultValue: PAGE_SIZE },
    search: { defaultValue: "" },
    status: { defaultValue: undefined },
    sort: { defaultValue: null },
    startDate: { defaultValue: undefined },
    endDate: { defaultValue: undefined },
  }), []);

  const { initializeFromUrl, syncToUrl } = useUrlQuerySync({
    config,
    skipInitialSync: true,
  });

  // Initialize state from URL
  const [page, setPage] = useState(() => initializeFromUrl("page"));
  const [pageSize, setPageSize] = useState(() => initializeFromUrl("pageSize"));
  const [search, setSearch] = useState(() => initializeFromUrl("search"));
  const [status, setStatus] = useState<string | undefined>(() => initializeFromUrl("status"));
  const [sort, setSort] = useState<string | null>(() => initializeFromUrl("sort"));
  const [selectedResidents, setSelectedResidents] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState<string | undefined>(() => initializeFromUrl("startDate"))
  const [endDate, setEndDate] = useState<string | undefined>(() => initializeFromUrl("endDate"))

  const activeFilters = useMemo(() => {
    const filters: FilterConfig[] = [];
    if (status) {
      filters.push({ field: "status", operator: "eq", value: status });
    }
    if (startDate) {
      filters.push({ field: "created_at", operator: "gte", value: startDate });
    }
    if (endDate) {
      filters.push({ field: "created_at", operator: "lte", value: endDate });
    }
    return filters;
  }, [status, startDate, endDate]);

  // Sync state to URL
  useEffect(() => {
    syncToUrl({ page, pageSize, search, status, sort, startDate, endDate });
  }, [page, pageSize, search, status, sort, startDate, endDate, syncToUrl]);


  const availableFilters = useMemo(() => {
    const filters: FilterDefinition[] = [
      {
        field: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      },
      {
        field: "created_at",
        label: "Created Between",
        type: "date-range",
      }
    ];

    return filters;
  }, [status]);

  const { data, isLoading, isFetching } = useAdminResidents({
    page,
    pageSize,
    search: search.trim() || undefined,
    status,
    filters: formatFiltersForAPI(activeFilters),
    sort: sort || undefined,
  });

  const importResidentsMutation = useImportResidents();
  const prefetchResident = usePrefetchResident();
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

  // Mutations
  const updateResidentMutation = useUpdateResident();
  const deleteResidentMutation = useDeleteResident();

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<ResidentUser | null>(null);

  const {
    register,
    handleSubmit: handleHookSubmit,
    reset,
    formState: { errors },
  } = useForm<EditResidentFormData>({
    resolver: zodResolver(editResidentSchema),
  });

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<ResidentUser | null>(null);

  const handleEdit = (resident: ResidentUser) => {
    setSelectedResident(resident);
    reset({
      first_name: resident.user.first_name || "",
      last_name: resident.user.last_name || "",
      phone: resident.user.phone || "",
      address: resident.user.address || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (resident: ResidentUser) => {
    setResidentToDelete(resident);
    setIsDeleteModalOpen(true);
  };

  const onEditSubmit = (data: EditResidentFormData) => {
    if (!selectedResident) return;

    updateResidentMutation.mutate(
      {
        residentId: selectedResident.resident.id,
        data: data,
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setSelectedResident(null);
        },
      }
    );
  };

  const confirmDelete = () => {
    if (residentToDelete) {
      deleteResidentMutation.mutate(residentToDelete.resident.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setResidentToDelete(null);
        },
      });
    }
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
  const total = data?.total ?? 0;


  const columns: Column<ResidentUser>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
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
      accessor: (row) => row?.user?.email,
    },
    {
      key: "phone",
      header: "Phone",
      sortable: true,
      accessor: (row) => row?.user?.phone || "-",
    },
    {
      key: "houses",
      header: "Houses",
      sortable: false,
      accessor: (row) =>
        row.houses && row?.houses?.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.houses.slice(0, 3).map((house) => (
              <Badge key={house.id} variant="secondary">
                {house.name}
              </Badge>
            ))}
            {row.houses.length > 3 && (
              <Badge variant="secondary">+ {row.houses.length - 3}</Badge>
            )}
          </div>
        ) : (
          "-"
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (row) => (
        <Badge variant={row.user.is_active ? "success" : "secondary"}>
          {row.user.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    }, {
      key: "actions",
      header: "Actions",
      sortable: false,
      accessor: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/residents/${row.resident.id}`)}
            onMouseEnter={() => prefetchResident(row.resident.id)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row)}
            title="Edit Resident"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row)}
            title="Delete Resident"
            disabled={deleteResidentMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }
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
              <Upload className="h-4 w-4" />
              Bulk Import
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => router.push("/admin/residents/create")}
            >
              <Plus className="h-4 w-4" />
              Add resident
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="space-y-6 p-6">

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
              initialSearch={search}
              onSearchChange={(value) => {
                setPage(1);
                setSearch(value);
              }}
              availableFilters={availableFilters}
              initialFilters={activeFilters}
              onFiltersChange={(filters) => {
                setPage(1);
                const statusFilter = filters.find((f) => f.field === "status");
                setStatus(statusFilter?.value as string | undefined || undefined);
                const startDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "gte");
                setStartDate(startDateFilter?.value as string | undefined || undefined);
                const endDateFilter = filters.find((f) => f.field === "created_at" && f.operator === "lte");
                setEndDate(endDateFilter?.value as string | undefined || undefined);
              }}
              onSortChange={(newSort) => {
                setPage(1);
                setSort(newSort);
              }}
              disableClientSideFiltering={true}
              disableClientSideSorting={true}
              selectable={true}
              getRowId={(row) => row.resident.id}
              selectedRows={selectedResidents}
              onSelectionChange={setSelectedResidents}
              bulkActions={bulkActions}
              isLoading={isLoading || isFetching}
            />

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

      {/* Delete Confirmation Modal */}
      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedResident(null);
        }}
        title="Edit Resident"
      >
        <form onSubmit={handleHookSubmit(onEditSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              {...register("first_name")}
              error={errors.first_name?.message}
            />
            <Input
              label="Last Name"
              {...register("last_name")}
              error={errors.last_name?.message}
            />
          </div>
          <Input
            label="Phone"
            {...register("phone")}
            error={errors.phone?.message}
          />
          <Input
            label="Address"
            {...register("address")}
            error={errors.address?.message}
          />
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedResident(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateResidentMutation.isPending}>
              Update Resident
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setResidentToDelete(null);
        }}
        title="Delete Resident"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{residentToDelete ? getFullName(residentToDelete.user.first_name, residentToDelete.user.last_name) : "this resident"}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setResidentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              isLoading={deleteResidentMutation.isPending}
            >
              Delete Resident
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
