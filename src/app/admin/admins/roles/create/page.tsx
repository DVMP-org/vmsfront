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
import { useAdminPermissions, useCreateRole } from "@/hooks/use-admin";
import { toast } from "sonner";
import { ShieldPlus } from "lucide-react";

export default function CreateRolePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [grantAll, setGrantAll] = useState(false);

  const createRole = useCreateRole();
  const {
    data: permissionsMap,
    isLoading: isLoadingPermissions,
    isError: permissionsError,
    refetch,
  } = useAdminPermissions();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required.");
      return;
    }

    if (!grantAll && selectedPermissions.length === 0) {
      toast.error("Select at least one permission or grant all access.");
      return;
    }

    createRole.mutate(
      {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        permissions: grantAll ? ["*"] : selectedPermissions,
      },
      {
        onSuccess: () => {
          router.push("/admin/admins/roles");
        },
      }
    );
  };

  const permissionsReady = useMemo(
    () => !isLoadingPermissions && !permissionsError && permissionsMap,
    [isLoadingPermissions, permissionsError, permissionsMap]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Link href="/admin/roles" className="text-primary hover:underline">
                Roles
              </Link>
              <span>/</span>
              <span>Create</span>
            </p>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldPlus className="h-6 w-6 text-primary" />
              New Role
            </h1>
            <p className="text-muted-foreground">
              Bundle permissions into a reusable role for your admin team.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/roles")}
          >
            Back to roles
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role details</CardTitle>
            <CardDescription>
              Define the role identity and attach the precise permissions it needs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Role name"
                  placeholder="Security Supervisor"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
                <Input
                  label="Role code"
                  placeholder="SEC_SUPERVISOR"
                  value={form.code}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Explain what this role is responsible for..."
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Permissions</p>
                    <p className="text-xs text-muted-foreground">
                      Assign granular capabilities or grant full access.
                    </p>
                  </div>
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
                </div>

                {!grantAll && (
                  <>
                    {isLoadingPermissions && (
                      <p className="text-sm text-muted-foreground">
                        Loading permissions...
                      </p>
                    )}
                    {permissionsError && (
                      <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        <span>Unable to fetch permissions right now.</span>
                        <Button size="sm" variant="outline" onClick={() => refetch()}>
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

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/roles")}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={createRole.isPending}>
                  Create role
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
