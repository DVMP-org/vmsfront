import { useState } from "react";
import { Admin, AdminRole } from "@/types";
import { useUpdateAdminRole } from "@/hooks/use-admin";
import { Button } from "@/components/ui/Button";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface UpdateAdminRoleFormProps {
    admin: Admin;
    roles: AdminRole[];
    onSuccess: () => void;
    onCancel: () => void;
}

export function UpdateAdminRoleForm({
    admin,
    roles,
    onSuccess,
    onCancel,
}: UpdateAdminRoleFormProps) {
    const [roleId, setRoleId] = useState(admin.role_id || "");
    const updateAdminRole = useUpdateAdminRole();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateAdminRole.mutate(
            { adminId: admin.id, roleId },
            {
                onSuccess: () => {
                    onSuccess();
                },
            }
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background font-semibold text-[rgb(var(--brand-primary))]">
                    {(admin.user?.first_name?.[0] || admin.name?.[0] || "A").toUpperCase()}
                </div>
                <div>
                    <p className="font-medium">
                        {admin.user
                            ? `${admin.user.first_name} ${admin.user.last_name}`
                            : admin.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{admin.user?.email}</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Assign Role</label>
                <div className="grid gap-2">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={cn(
                                "relative flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all hover:bg-accent",
                                roleId === role.id
                                    ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary)/0.05)] ring-1 ring-[rgb(var(--brand-primary))]"
                                    : "border-border"
                            )}
                            onClick={() => setRoleId(role.id)}
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                                <Shield className={cn(
                                    "h-5 w-5",
                                    roleId === role.id ? "text-[rgb(var(--brand-primary))]" : "text-muted-foreground"
                                )} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm sm:text-base truncate">{role.name}</p>
                                {role.description && (
                                    <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                                )}
                            </div>
                            <div className={cn(
                                "h-5 w-5 rounded-full border flex items-center justify-center shrink-0",
                                roleId === role.id
                                    ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]"
                                    : "border-muted-foreground/30"
                            )}>
                                {roleId === role.id && (<div className="h-2 w-2 rounded-full bg-white" />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel} disabled={updateAdminRole.isPending}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={updateAdminRole.isPending}>
                    Update Role
                </Button>
            </div>
        </form>
    );
}
