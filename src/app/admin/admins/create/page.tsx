"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { PermissionSelector } from "@/components/admin/PermissionSelector";
import {
  useAdminPermissions,
  useAdminRoles,
  useCreateAdmin,
} from "@/hooks/use-admin";
import { toast } from "sonner";
import { UserPlus2 } from "lucide-react";

export default function CreateAdminPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    role_id: "",
    email: "",
  });
  const [useCustomPermissions, setUseCustomPermissions] = useState(false);
  const [grantAll, setGrantAll] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: roles, isLoading: rolesLoading } = useAdminRoles({
    page: 1,
    pageSize: 1000,
  });
  const {
    data: permissionsMap,
    isLoading: permissionsLoading,
    isError: permissionsError,
    refetch,
  } = useAdminPermissions();
  const createAdmin = useCreateAdmin();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First and last names are required.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("email is required.");
      return;
    }

    if (!form.role_id) {
      toast.error("Select a base role to inherit permissions from.");
      return;
    }

    if (useCustomPermissions && !grantAll && selectedPermissions.length === 0) {
      toast.error("Select at least one custom permission or grant all access.");
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      role_id: form.role_id,
      email: form.email.trim(),
      permissions: useCustomPermissions
        ? grantAll
          ? "*"
          : selectedPermissions.join(",")
        : undefined,
    };

    createAdmin.mutate(payload, {
      onSuccess: () => {
        router.push("/admin");
      },
    });
  };

  const permissionsReady = useMemo(
    () => useCustomPermissions && !permissionsLoading && !permissionsError && permissionsMap,
    [useCustomPermissions, permissionsLoading, permissionsError, permissionsMap]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Link href="/admin" className="text-[var(--brand-primary,#213928)] hover:underline">
                Admin dashboard
              </Link>
              <span>/</span>
              <span>Onboard admin</span>
            </p>
            <h1 className="text-2xl sm:text-xl font-bold flex items-center gap-2">
              <UserPlus2 className="h-6 w-6 text-[var(--brand-primary,#213928)]" />
              Onboard Admin
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Assign a role and optional overrides for a teammate who needs console access.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="bg-background gap-2"
            onClick={() => router.push("/admin")}
          >
            Back to dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Admin profile</CardTitle>
            <CardDescription>
              Provide their identity details, base role, and fine-tune extra permissions if needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Email"
                  placeholder="email@ada.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
                <Input
                  label="First name"
                  placeholder="Ada"
                  value={form.first_name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, first_name: event.target.value }))
                  }
                  required
                />
                <Input
                  label="Last name"
                  placeholder="Obi"
                  value={form.last_name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, last_name: event.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role
                </label>
                {rolesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading roles...</p>
                ) : !roles || roles?.items?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No roles available. Create one first.
                  </p>
                ) : (
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={form.role_id}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, role_id: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select a role</option>
                    {roles?.items?.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium">Custom permission overrides</p>
                    <p className="text-xs text-muted-foreground">
                      Optionally augment or restrict the role with direct permissions.
                    </p>
                  </div>
                  <Checkbox
                    label="Enable custom permissions"
                    checked={useCustomPermissions}
                    onChange={(event) => {
                      setUseCustomPermissions(event.target.checked);
                      if (!event.target.checked) {
                        setGrantAll(false);
                        setSelectedPermissions([]);
                      }
                    }}
                  />
                </div>

                {useCustomPermissions && (
                  <div className="space-y-3">
                    <Checkbox
                      label="Grant all permissions"
                      checked={grantAll}
                      onChange={(event) => {
                        setGrantAll(event.target.checked);
                        if (event.target.checked) {
                          setSelectedPermissions([]);
                        }
                      }}
                    />
                    {!grantAll && (
                      <>
                        {permissionsLoading && (
                          <p className="text-sm text-muted-foreground">
                            Loading permissions...
                          </p>
                        )}
                        {permissionsError && (
                          <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                            <span>Unable to fetch permissions.</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => refetch()}
                            >
                              Retry
                            </Button>
                          </div>
                        )}
                        {permissionsReady && (
                          <PermissionSelector
                            permissions={permissionsMap ?? {}}
                            value={selectedPermissions}
                            onChange={setSelectedPermissions}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin")}
                >
                  Cancel
                </Button>
                <Button type="submit"
                  className="border-[var(--brand-primary,#213928)] gap-2 text-white bg-[var(--brand-primary,#213928)] hover:bg-[var(--brand-primary,#213928)/90]"
                  isLoading={createAdmin.isPending}>
                  Onboard admin
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
