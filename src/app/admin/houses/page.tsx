"use client";

import { useRef, useState } from "react";
import { useAdminHouses, useCreateHouse, useImportHouses } from "@/hooks/use-admin";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Plus, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ImportResponse } from "@/types";
import { House } from "@/types";

export default function HousesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportResponse | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const importFormRef = useRef<HTMLFormElement>(null);
  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
    setImportFile(null);
    importFormRef.current?.reset();
  };

  const { data: houses, isLoading } = useAdminHouses();
  const createHouseMutation = useCreateHouse();
  const importHousesMutation = useImportHouses();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.address) newErrors.address = "Address is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    createHouseMutation.mutate(formData, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setFormData({ name: "", description: "", address: "" });
        setErrors({});
      },
    });
  };

  const columns: Column<House>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      filterable: true,
      className: "font-medium",
    },
    {
      key: "address",
      header: "Address",
      sortable: true,
      filterable: true,
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      filterable: true,
      accessor: (row) => row.description || "-",
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      accessor: (row) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Houses</h1>
            <p className="text-muted-foreground">Manage properties in your estate</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
              Bulk Import
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create House
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <TableSkeleton />
            ) : !houses || houses.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No houses yet"
                description="Create your first house to get started"
                action={{
                  label: "Create House",
                  onClick: () => setIsCreateModalOpen(true),
                }}
              />
            ) : (
              <DataTable
                data={houses}
                columns={columns}
                searchable={true}
                searchPlaceholder="Search houses..."
                pageSize={10}
                showPagination={true}
                emptyMessage="No houses found"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Houses Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        title="Bulk Import Houses"
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
            importHousesMutation.mutate(formData, {
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
            <code className="rounded bg-muted px-1">name</code>,{" "}
            <code className="rounded bg-muted px-1">address</code>, and optional{" "}
            <code className="rounded bg-muted px-1">description</code>. You can use the
            template below as a guide.
          </p>
          <pre className="rounded-lg bg-muted p-3 text-xs">
{`name,address,description
Oak Villa,12 Creek Lane,Luxury duplex
Maple Court,44 Sunset Ave,`}
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
            <Button type="submit" isLoading={importHousesMutation.isPending}>
              Import Houses
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

      {/* Create House Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New House"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="House Name"
            placeholder="Villa 123"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
          />
          <Input
            label="Address"
            placeholder="123 Main Street"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            error={errors.address}
          />
          <div>
            <label className="block text-sm font-medium mb-2">
              Description (Optional)
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Additional details about the house"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createHouseMutation.isPending}>
              Create House
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
