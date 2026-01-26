import { useMemo, useState, ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
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
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function CreateRolePage() {
    const router = useRouter();
    const [form, setForm] = useState({ name: "", code: "", description: "" });
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [grantAll, setGrantAll] = useState(false);

    const createRole = useCreateRole();
    const { data: permissionsMap, isLoading: isLoadingPermissions, isError: permissionsError, refetch } = useAdminPermissions();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim() || !form.code.trim()) { toast.error("Name and code are required."); return; }
        if (!grantAll && selectedPermissions.length === 0) { toast.error("Select at least one permission."); return; }

        createRole.mutate(
            { name: form.name.trim(), code: form.code.trim(), description: form.description.trim() || undefined, permissions: grantAll ? ["*"] : selectedPermissions },
            { onSuccess: () => router.push("/admin/admins/roles") }
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Link href="/admin/admins/roles" className="text-primary hover:underline">Roles</Link>
                        <span>/</span><span>Create</span>
                    </p>
                    <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldPlus className="h-6 w-6 text-[rgb(var(--brand-primary))]" />New Role</h1>
                </div>
                <Button variant="outline" onClick={() => router.push("/admin/admins/roles")}>Back to roles</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Role details</CardTitle>
                    <CardDescription>Define the role identity and attach permissions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input label="Role name" placeholder="Security Supervisor" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            <Input label="Role code" placeholder="SEC_SUPERVISOR" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Description</label>
                            <textarea className="w-full h-32 border rounded-md p-2" placeholder="Responsibilities..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>

                        <div className="space-y-4 border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div><p className="font-medium">Permissions</p><p className="text-xs text-muted-foreground">Assign capabilities.</p></div>
                                <Checkbox label="Grant all" checked={grantAll} onChange={e => { setGrantAll(e.target.checked); if (e.target.checked) setSelectedPermissions([]); }} />
                            </div>
                            {!grantAll && permissionsMap && <PermissionSelector permissions={permissionsMap as any} value={selectedPermissions} onChange={setSelectedPermissions} />}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.push("/admin/admins/roles")}>Cancel</Button>
                            <Button type="submit" isLoading={createRole.isPending}>Create role</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

CreateRolePage.getLayout = function getLayout(page: ReactElement) {
    return (
        <RouteGuard>
            <DashboardLayout type="admin">
                <AdminPermissionGuard>
                    {page}
                </AdminPermissionGuard>
            </DashboardLayout>
        </RouteGuard>
    );
};
