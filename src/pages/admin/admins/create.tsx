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
import {
    useAdminPermissions,
    useAdminRoles,
    useCreateAdmin,
} from "@/hooks/use-admin";
import { toast } from "sonner";
import { UserPlus2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

export default function CreateAdminPage() {
    const router = useRouter();
    const [form, setForm] = useState({ first_name: "", last_name: "", role_id: "", email: "" });
    const [useCustomPermissions, setUseCustomPermissions] = useState(false);
    const [grantAll, setGrantAll] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const { data: roles, isLoading: rolesLoading } = useAdminRoles({
        page: 1,
        pageSize: 100,
    });
    const { data: permissionsMap, isLoading: permissionsLoading, isError: permissionsError, refetch } = useAdminPermissions();
    const createAdmin = useCreateAdmin();

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.first_name.trim() || !form.last_name.trim()) { toast.error("Names are required."); return; }
        if (!form.email.trim()) { toast.error("Email is required."); return; }
        if (!form.role_id) { toast.error("Select a base role."); return; }

        const payload = {
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            role_id: form.role_id,
            email: form.email.trim(),
            permissions: useCustomPermissions ? (grantAll ? "*" : selectedPermissions.join(",")) : undefined,
        };

        createAdmin.mutate(payload, { onSuccess: () => router.push("/admin/admins") });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Link href="/admin/admins" className="text-[rgb(var(--brand-primary))] hover:underline">Admins</Link>
                        <span>/</span><span>Onboard</span>
                    </p>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <UserPlus2 className="h-6 w-6 text-[rgb(var(--brand-primary))]" />
                        Onboard Admin
                    </h1>
                </div>
                <Button variant="outline" onClick={() => router.push("/admin/admins")}>Back to list</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Admin profile</CardTitle>
                    <CardDescription>Provide details and assign a role.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                            <Input label="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                            <Input label="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <select className="w-full h-10 border rounded-md" value={form.role_id} onChange={e => setForm({ ...form, role_id: e.target.value })} required>
                                    <option value="">Select a role</option>
                                    {roles?.items.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div><p className="font-medium">Overrides</p><p className="text-xs text-muted-foreground">Optional custom permissions.</p></div>
                                <Checkbox label="Enable" checked={useCustomPermissions} onChange={e => setUseCustomPermissions(e.target.checked)} />
                            </div>
                            {useCustomPermissions && (
                                <div className="space-y-4 pt-4 border-t">
                                    <Checkbox label="Grant all" checked={grantAll} onChange={e => setGrantAll(e.target.checked)} />
                                    {!grantAll && permissionsMap && <PermissionSelector permissions={permissionsMap as any} value={selectedPermissions} onChange={setSelectedPermissions} />}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.push("/admin/admins")}>Cancel</Button>
                            <Button type="submit" isLoading={createAdmin.isPending}>Onboard admin</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

CreateAdminPage.getLayout = function getLayout(page: ReactElement) {
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
