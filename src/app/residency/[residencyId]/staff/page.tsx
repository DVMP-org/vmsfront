"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Briefcase, Home as HomeIcon, Plus } from "lucide-react";
import { useProfile } from "@/hooks/use-auth";
import { useCreateResidencyStaff, useResidencyStaff } from "@/hooks/use-staff";
import { useAppStore } from "@/store/app-store";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { formatDateTime, getFullName, titleCase } from "@/lib/utils";
import type { StaffMember, StaffProfileCreate, StaffResidencyAssignment } from "@/types/staff";
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { StaffBadgeHoverCard } from "@/components/staff/StaffBadgeHoverCard";
const initialCreateForm: StaffProfileCreate = {
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  staff_type: "",
  role_title: "",
};

export default function ResidencyStaffPage() {
  const router = useRouter();
  const params = useParams<{ residencyId?: string }>();
  const rawResidencyId = params?.residencyId;
  const routeResidencyId = Array.isArray(rawResidencyId) ? rawResidencyId[0] : rawResidencyId;
  const { selectedResidency, setSelectedResidency, setSelectedResidencyRole } = useAppStore();
  const { data: profile } = useProfile();

  // Determine if the user is staff-only (staff but not resident)
  const isResident = profile?.is_resident ?? false;
  const isStaff = profile?.is_staff ?? false;
  const isStaffOnly = isStaff && !isResident;
  // User is both resident and staff (can see their staff badge on this page)
  const isResidentAndStaff = isResident && isStaff;

  const residencyId = routeResidencyId ?? selectedResidency?.id ?? null;

  // Find the current user's staff assignment for this residency (if they are also staff)
  const userStaff = profile?.staff as StaffMember | null | undefined;
  const userStaffAssignment = useMemo<StaffResidencyAssignment | null>(() => {
    if (!userStaff || !residencyId) return null;
    const assignments = (userStaff as any).assignments as StaffResidencyAssignment[] | undefined;
    if (assignments) {
      return assignments.find((a) => a.residency_id === residencyId) ?? null;
    }
    // Check single assignment
    if (userStaff.assignment?.residency_id === residencyId) {
      return userStaff.assignment ?? null;
    }
    return null;
  }, [userStaff, residencyId]);

  // User is staff in this specific residency
  const isStaffInThisResidency = !!userStaffAssignment;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [form, setForm] = useState<StaffProfileCreate>(initialCreateForm);

  // Only fetch staff list for residents (not staff-only users who see their own dashboard)
  const { data, isLoading, isFetching } = useResidencyStaff(
    !isStaffOnly ? residencyId : null,
    {
      page,
      pageSize,
      search: search.trim() || undefined,
      status: status || undefined,
    }
  );
  const createMutation = useCreateResidencyStaff(!isStaffOnly ? residencyId : null);

  useEffect(() => {
    setSelectedResidencyRole("staff");
  }, [setSelectedResidencyRole]);

  useEffect(() => {
    if (!routeResidencyId || !profile?.residencies) return;
    if (selectedResidency?.id === routeResidencyId) return;
    const match = profile.residencies.find((residency) => residency.id === routeResidencyId);
    if (match) {
      setSelectedResidency(match);
    }
  }, [routeResidencyId, profile?.residencies, selectedResidency?.id, setSelectedResidency]);

  const staff = useMemo(() => data?.items ?? [], [data]);

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Staff member",
      sortable: true,
      accessor: (row) => (
        <div>
          <p className="font-medium text-foreground">
            {getFullName(row.user?.first_name, row.user?.last_name)}
          </p>
          <p className="text-xs text-muted-foreground">{row.user?.email ?? "No email"}</p>
        </div>
      ),
    },
    {
      key: "staff_type",
      header: "Type",
      accessor: (row) => titleCase(row.staff_type ?? "unknown"),
    },
    {
      key: "role_title",
      header: "Role",
      accessor: (row) => row.assignment?.role_title || row.role_title || "—",
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <Badge variant={row.status === "active" ? "success" : row.status === "suspended" ? "warning" : "secondary"}>
          {titleCase(row.status ?? "pending")}
        </Badge>
      ),
    },
    {
      key: "kyc",
      header: "KYC",
      accessor: (row) => (
        <Badge
          variant={row.latest_kyc?.status === "verified" ? "success" : row.latest_kyc?.status === "failed" ? "danger" : "secondary"}
        >
          {titleCase(row.latest_kyc?.status ?? "pending")}
        </Badge>
      ),
    },
    {
      key: "updated_at",
      header: "Updated",
      accessor: (row) => row.updated_at ? formatDateTime(row.updated_at) : "—",
    },
    {
      key: "actions",
      header: "",
      accessor: (row) => (
        <Button variant="ghost" size="sm" onClick={() => router.push(`/residency/${residencyId}/staff/${row.id}`)}>
          View
        </Button>
      ),
      className: "text-right",
    },
  ];

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createMutation.mutate(form, {
      onSuccess: (response) => {
        setIsCreateModalOpen(false);
        setForm(initialCreateForm);
        const createdId = response.data?.id;
        if (createdId && residencyId) {
          router.push(`/residency/${residencyId}/staff/${createdId}`);
        }
      },
    });
  };

  if (!residencyId) {
    return (
      <Card>
        <CardContent className="p-10">
          <EmptyState
            icon={HomeIcon}
            title="Select a residency to continue"
            description="Choose a residency from the workspace launcher to manage residency staff."
            action={{ label: "Choose Residency", onClick: () => router.push("/select") }}
          />
        </CardContent>
      </Card>
    );
  }

  // Staff-only users see their own dashboard instead of staff management
  if (isStaffOnly) {
    return <StaffDashboard />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className="text-muted-foreground">
            Register staff for this residency, manage permissions, review KYC, and inspect movement logs.
          </p>
          {/* Show hover card if user is both resident and staff in this residency */}
          {isResidentAndStaff && isStaffInThisResidency && (
            <StaffBadgeHoverCard
              staff={userStaff}
              user={profile}
              currentAssignment={userStaffAssignment}
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => router.push(`/residency/${residencyId}`)}>
            <HomeIcon className="h-4 w-4" />
            Dashboard
          </Button>
          <Button className="gap-2" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Register Staff
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5" />
              Residency staff directory
            </CardTitle>
            <CardDescription>
              The person can be a resident and staff at the same time. Staff movement remains tied to the staff profile.
            </CardDescription>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search by name or email"
            />
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
              className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            data={staff}
            columns={columns}
            searchable={false}
            showPagination={false}
            emptyMessage="No staff found for this residency yet"
            isLoading={isLoading || isFetching}
            disableClientSideFiltering
            disableClientSideSorting
          />
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={data?.total ?? staff.length}
            totalPages={data?.total_pages ?? 1}
            hasNext={data?.has_next ?? false}
            hasPrevious={data?.has_previous ?? page > 1}
            isFetching={isFetching}
            resourceLabel="staff"
            onChange={setPage}
          />
        </CardContent>
      </Card>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Register staff" size="lg">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
            <Input
              label="Phone"
              value={form.phone ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <Input
              label="First name"
              value={form.first_name ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
            />
            <Input
              label="Last name"
              value={form.last_name ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
            />
            <div className="space-y-1">
              <label className="text-sm font-medium">Staff type</label>
              <select
                value={form.staff_type ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, staff_type: e.target.value }))}
                className="flex h-10 w-full rounded-[4px] border border-[#DEDEDE] bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
              >
                <option value="">Select staff type</option>
                <option value="driver">Driver</option>
                <option value="domestic_help">Domestic help</option>
                <option value="nanny">Nanny</option>
                <option value="gardener">Gardener</option>
                <option value="artisan">Artisan</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Input
              label="Role title"
              value={form.role_title ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, role_title: e.target.value }))}
              placeholder="Head driver"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save Staff Member
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}