import { useEffect, useMemo, useState, ReactElement } from "react";
import {
    Shield,
    Mail,
    Building2,
    UserCog,
    CheckCircle2,
    AlertTriangle,
    Save,
    RotateCcw,
    User,
    Phone,
    MapPin,
    Briefcase,
    Lock,
} from "lucide-react";
import { titleCase, getFullName, getInitials, cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth-store";
import {
    useAdminProfileDetails,
    useUpdateAdminProfile,
} from "@/hooks/use-profile";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPermissionGuard } from "@/components/auth/AdminPermissionGuard";
import { RouteGuard } from "@/components/auth/RouteGuard";

interface AdminFormState {
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    title: string;
}

export default function AdminProfilePage() {
    const { user } = useAuthStore();
    const { data: adminProfile, isLoading } = useAdminProfileDetails();
    const updateAdminProfile = useUpdateAdminProfile();
    const adminUser = adminProfile?.user ?? user ?? null;

    const [formState, setFormState] = useState<AdminFormState>({
        first_name: adminUser?.first_name ?? "",
        last_name: adminUser?.last_name ?? "",
        phone: adminUser?.phone ?? "",
        address: adminUser?.address ?? "",
        title: adminProfile?.name ?? "",
    });

    useEffect(() => {
        if (adminUser) {
            setFormState({
                first_name: adminUser.first_name ?? "",
                last_name: adminUser.last_name ?? "",
                phone: adminUser.phone ?? "",
                address: adminUser.address ?? "",
                title: adminProfile?.name ?? "",
            });
        }
    }, [adminUser, adminProfile?.name]);

    const permissions = useMemo(
        () => normalizePermissions(adminProfile?.role?.permissions ?? adminProfile?.permissions ?? null),
        [adminProfile?.role?.permissions, adminProfile?.permissions]
    );

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        updateAdminProfile.mutate(formState);
    };

    if (isLoading || !adminUser) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <div className="space-y-1">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        );
    }

    const fullName = getFullName(adminUser.first_name, adminUser.last_name);
    const initials = getInitials(adminUser.first_name, adminUser.last_name);
    const roleName = adminProfile?.role?.name ?? "Administrator";
    const isActive = adminUser.is_active ?? true;

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-10 -mx-6 -mt-6 bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--brand-primary)/0.2)] text-lg font-medium text-[rgb(var(--brand-primary))] ring-2 ring-[rgb(var(--brand-primary)/0.8)] shadow-sm">
                            {initials}
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold tracking-tight text-foreground">{fullName}</h1>
                                <Badge variant={isActive ? "outline" : "danger"} className={cn(
                                    "text-xs font-normal border-transparent",
                                    isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                                )}>
                                    {isActive ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{adminUser.email}</span>
                                <span className="text-border">|</span>
                                <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {roleName}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (adminUser) {
                                    setFormState({
                                        first_name: adminUser.first_name ?? "",
                                        last_name: adminUser.last_name ?? "",
                                        phone: adminUser.phone ?? "",
                                        address: adminUser.address ?? "",
                                        title: adminProfile?.name ?? "",
                                    });
                                }
                            }}
                            disabled={updateAdminProfile.isPending}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                            Reset
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            isLoading={updateAdminProfile.isPending}
                            className="shadow-sm"
                        >
                            <Save className="mr-2 h-3.5 w-3.5" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                <div className="space-y-8 lg:col-span-2">
                    <section className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                                <UserCog className="h-5 w-5 text-muted-foreground" />
                                Public Profile
                            </h2>
                        </div>
                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4 md:col-span-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Identity</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Input
                                            label="First Name"
                                            value={formState.first_name}
                                            onChange={(e) => setFormState(s => ({ ...s, first_name: e.target.value }))}
                                            icon={User}
                                            className="h-10"
                                        />
                                        <Input
                                            label="Last Name"
                                            value={formState.last_name}
                                            onChange={(e) => setFormState(s => ({ ...s, last_name: e.target.value }))}
                                            icon={User}
                                            className="h-10"
                                        />
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Job Title"
                                                placeholder="e.g. Operations Manager"
                                                value={formState.title}
                                                onChange={(e) => setFormState(s => ({ ...s, title: e.target.value }))}
                                                icon={Briefcase}
                                                className="h-10"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="h-px bg-border md:col-span-2" />
                                <div className="space-y-4 md:col-span-2">
                                    <h3 className="text-sm font-medium text-muted-foreground">Contact</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Input
                                            label="Work Email"
                                            value={adminUser.email}
                                            disabled
                                            icon={Mail}
                                            className="bg-muted/50 h-10"
                                        />
                                        <Input
                                            label="Work Phone"
                                            type="tel"
                                            placeholder="+1 (555) 000-0000"
                                            value={formState.phone}
                                            onChange={(e) => setFormState(s => ({ ...s, phone: e.target.value }))}
                                            icon={Phone}
                                            className="h-10"
                                        />
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-medium text-muted-foreground mb-2 block ml-1">Office Address</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <textarea
                                                    className="min-h-[80px] w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="123 Admin Way, Suite 400..."
                                                    value={formState.address}
                                                    onChange={(e) => setFormState(s => ({ ...s, address: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="space-y-8">
                    <section className="space-y-4 p-4">
                        <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            Security
                        </h2>
                        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-border bg-muted/10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium">Role Permissions</span>
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">Read-only</Badge>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {permissions.length === 0 ? (
                                        <span className="text-xs text-muted-foreground italic pl-1">No special permissions</span>
                                    ) : (
                                        permissions.slice(0, 10).map((perm) => (
                                            <Badge key={perm} variant="secondary" className="bg-background hover:bg-background text-xs font-normal border-border/50 text-muted-foreground">
                                                {perm}
                                            </Badge>
                                        ))
                                    )}
                                    {permissions.length > 10 && (
                                        <Badge variant="secondary" className="bg-muted text-xs font-normal">+{permissions.length - 10}</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex items-center gap-3 rounded-md bg-emerald-500/5 p-3 border border-emerald-500/10">
                                    <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-emerald-900">MFA Enabled</p>
                                        <p className="text-xs text-emerald-700/80">Account is secured with 2FA.</p>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 h-8 text-xs justify-start px-2">
                                        <Lock className="mr-2 h-3.5 w-3.5" />
                                        Request Security Log
                                    </Button>
                                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 h-8 text-xs justify-start px-2">
                                        <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                                        Deactivate Account
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            Scope
                        </h2>
                        <div className="rounded-lg border border-border bg-card p-1 shadow-sm">
                            <div className="grid grid-cols-2 divide-x divide-border">
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-semibold tracking-tight">{permissions.length > 0 ? permissions.length : 1}</div>
                                    <div className="text-xs text-muted-foreground mt-1">Capabilities</div>
                                </div>
                                <div className="p-4 text-center">
                                    <div className="text-2xl font-semibold tracking-tight">Active</div>
                                    <div className="text-xs text-muted-foreground mt-1">Status</div>
                                </div>
                            </div>
                            <div className="border-t border-border p-3 bg-muted/20">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Account ID</span>
                                    <span className="font-mono">{adminProfile?.id?.substring(0, 12)}...</span>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-1.5">
                                    <span className="text-muted-foreground">Role ID</span>
                                    <span className="font-mono">{titleCase(adminProfile?.role?.code) ?? "N/A"}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function normalizePermissions(
    raw: string | string[] | Record<string, string[]> | Record<string, unknown> | null
): string[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return normalizePermissions(parsed);
        } catch {
            return raw.split(/[,|]/).map((item) => item.trim()).filter(Boolean);
        }
    }
    if (typeof raw === "object") {
        return Object.entries(raw).flatMap(([group, value]) => {
            if (Array.isArray(value)) {
                return value.map((permission) => `${group}:${permission}`);
            }
            return `${group}`;
        });
    }
    return [];
}

AdminProfilePage.getLayout = function getLayout(page: ReactElement) {
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
