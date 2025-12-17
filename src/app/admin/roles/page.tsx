"use client";

import { useRouter } from "next/navigation";
import { useAdminRoles } from "@/hooks/use-admin";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Shield } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function RolesPage() {
  const { data: roles, isLoading } = useAdminRoles();
  const router = useRouter();

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Roles & Permissions</h1>
            <p className="text-muted-foreground">
              Manage admin roles and their permissions
            </p>
          </div>
          <Button
            type="button"
            onClick={() => router.push("/admin/roles/create")}
          >
            Create role
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <TableSkeleton />
            ) : !roles || roles.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No roles defined"
                description="Admin roles will appear here"
                action={{
                  label: "Create role",
                  onClick: () => router.push("/admin/roles/create"),
                }}
              />
            ) : (
              <div className="space-y-3">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-[var(--brand-primary,#213928)]" />
                        <div>
                          <p className="font-medium text-lg">{role.name}</p>
                          {role.description && (
                            <p className="text-sm text-muted-foreground">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">{role.code}</Badge>
                    </div>
                    {role.permissions_parsed && role.permissions_parsed.length > 0 && (
                      <div className="ml-8 mt-2">
                        <p className="text-sm font-medium mb-1">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions_parsed.slice(0, 5).map((perm, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {role.permissions_parsed.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{role.permissions_parsed.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground ml-8 mt-2">
                      Created: {formatDate(role.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
