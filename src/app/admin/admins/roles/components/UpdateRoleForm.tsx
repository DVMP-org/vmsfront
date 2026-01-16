"use client";

import { useState } from "react";
import { AdminRole, PermissionDictionary } from "@/types";
import { useUpdateRole, useAdminPermissions } from "@/hooks/use-admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PermissionSelector } from "@/components/admin/PermissionSelector";
import { Shield, Info } from "lucide-react";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface UpdateRoleFormProps {
    role: AdminRole;
    onSuccess: () => void;
    onCancel: () => void;
}

export function UpdateRoleForm({
    role,
    onSuccess,
    onCancel,
}: UpdateRoleFormProps) {
    const [formData, setFormData] = useState({
        name: role.name,
        code: role.code,
        description: role.description || "",
    });
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        role.permissions_parsed || []
    );

    const { data: allPermissions, isLoading: permissionsLoading } = useAdminPermissions();
    const updateRole = useUpdateRole();

    const isSuperAdmin = role.code === "super_admin" || selectedPermissions.includes("*");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateRole.mutate(
            {
                roleId: role.id,
                data: {
                    ...formData,
                    permissions: selectedPermissions,
                },
            },
            {
                onSuccess: () => {
                    onSuccess();
                },
            }
        );
    };

    if (permissionsLoading) {
        return <CardSkeleton />;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
                <Input
                    label="Role Name"
                    placeholder="e.g. Finance Manager"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                <Input
                    label="Role Code"
                    placeholder="e.g. finance_manager"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    disabled={role.code === "super_admin"} // Prevent breaking super_admin
                />
                <Input
                    label="Description"
                    placeholder="Briefly describe what this role can do"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                    }
                />
            </div>

            {!isSuperAdmin && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Shield className="h-4 w-4 text-[var(--brand-primary,#213928)]" />
                            Permissions
                        </label>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Info className="h-3 w-3" />
                            <span>Select resource-level actions</span>
                        </div>
                    </div>

                    {allPermissions && (
                        <PermissionSelector
                            permissions={allPermissions as unknown as PermissionDictionary}
                            value={selectedPermissions}
                            onChange={setSelectedPermissions}
                        />
                    )}
                </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t sticky bottom-0 bg-background pb-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={updateRole.isPending}
                >
                    Cancel
                </Button>
                <Button type="submit" isLoading={updateRole.isPending}>
                    Save Role
                </Button>
            </div>
        </form>
    );
}
