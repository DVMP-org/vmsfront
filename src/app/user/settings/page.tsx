"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Camera,
    Mail,
    Phone,
    Save,
    RotateCcw,
    User,
    ArrowRight,
    Shield,
    Home,
    KeyRound,
    CheckCircle2,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth-store";
import { useAdminProfile } from "@/hooks/use-admin";
import { getFullName, getInitials } from "@/lib/utils";
import {
    useResidentProfileDetails,
    useUpdateResidentProfile,
    useUpdateAdminProfile,
} from "@/hooks/use-profile";
import { useProfile } from "@/hooks/use-auth";

interface FormState {
    first_name: string;
    last_name: string;
    phone: string;
    avatar_url: string;
}

function UserSettingsContent() {
    const { user } = useAuthStore();
    const { data: profile, isLoading: isProfileLoading } = useProfile();
    const { data: adminProfile, isError: isAdminError } = useAdminProfile();
    const { data: residentProfile, isLoading: isResidentLoading } = useResidentProfileDetails();
    const updateResident = useUpdateResidentProfile();
    const updateAdmin = useUpdateAdminProfile();

    const isAdminByRole = !!adminProfile && !isAdminError;

    const currentUser = profile ?? user;

    const [form, setForm] = useState<FormState>({
        first_name: "",
        last_name: "",
        phone: "",
        avatar_url: "",
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState(false);

    const isLoading = isProfileLoading || isResidentLoading;
    const isPending = updateResident.isPending || updateAdmin.isPending;

    useEffect(() => {
        if (currentUser) {
            setForm({
                first_name: currentUser.first_name ?? "",
                last_name: currentUser.last_name ?? "",
                phone: currentUser.phone ?? "",
                avatar_url: currentUser.avatar_url ?? "",
            });
            setAvatarPreview(currentUser.avatar_url ?? null);
            setAvatarError(false);
        }
    }, [currentUser]);

    const handleReset = () => {
        if (!currentUser) return;
        setForm({
            first_name: currentUser.first_name ?? "",
            last_name: currentUser.last_name ?? "",
            phone: currentUser.phone ?? "",
            avatar_url: currentUser.avatar_url ?? "",
        });
        setAvatarPreview(currentUser.avatar_url ?? null);
        setAvatarError(false);
    };

    const handleAvatarUrlChange = (url: string) => {
        setForm((s) => ({ ...s, avatar_url: url }));
        setAvatarError(false);
        setAvatarPreview(url || null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            avatar_url: form.avatar_url || null,
        };
        // Always submit to the actual role's endpoint, not the layout type,
        // so we don't accidentally call the wrong API.
        if (isAdminByRole) {
            updateAdmin.mutate(payload);
        } else {
            updateResident.mutate(payload);
        }
    };

    const fullName = currentUser ? getFullName(currentUser.first_name, currentUser.last_name) : "User";
    const initials = currentUser ? getInitials(currentUser.first_name, currentUser.last_name) : "U";

    // Role-specific deep-link
    const roleProfileHref = `/${isAdminByRole ? "admin" : "resident"}/profile`;
    const roleLabel = isAdminByRole ? "Admin Profile" : "Resident Profile";
    const roleDescription = isAdminByRole
        ? "Manage your admin title, permissions & role"
        : "Manage your residency, pass code & preferences";

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col">
                <Header type="select" />
                <main className="flex-1 flex flex-col items-center">
                    <div className="w-full max-w-3xl mx-auto py-12 px-6 sm:py-16 lg:px-8 space-y-6">
                        <div className="border-b border-border pb-4">
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-40 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col">
            <Header type="select" />
            <main className="flex-1 flex flex-col items-center">
                <div className="w-full max-w-3xl mx-auto py-12 px-6 sm:py-16 lg:px-8 space-y-6">
                    {/* Page heading + actions */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
                            <p className="text-sm text-muted-foreground mt-1">Manage your personal profile and preferences</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                disabled={isPending}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                Reset
                            </Button>
                            <Button size="sm" onClick={handleSubmit} isLoading={isPending}>
                                <Save className="mr-2 h-3.5 w-3.5" />
                                Save Changes
                            </Button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar card */}
                        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-border bg-muted/20">
                                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Camera className="h-4 w-4 text-muted-foreground" />
                                    Profile Picture
                                </h2>
                            </div>
                            <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                                <div className="relative flex-shrink-0">
                                    {avatarPreview && !avatarError ? (
                                        <Image
                                            src={avatarPreview}
                                            alt={fullName}
                                            width={80}
                                            height={80}
                                            className="h-20 w-20 rounded-full object-cover ring-4 ring-background border-2 border-border/60 shadow"
                                            onError={() => setAvatarError(true)}
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center text-[rgb(var(--brand-primary))] text-2xl font-bold ring-4 ring-background border-2 border-border/60 shadow">
                                            {initials}
                                        </div>
                                    )}
                                    <span className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background" />
                                </div>
                                <div className="flex-1 space-y-2 w-full">
                                    <Input
                                        label="Photo URL"
                                        placeholder="https://example.com/my-photo.jpg"
                                        value={form.avatar_url}
                                        onChange={(e) => handleAvatarUrlChange(e.target.value)}
                                        icon={Camera}
                                    />
                                    <p className="text-xs text-muted-foreground pl-1">
                                        Paste a public image URL. Recommended: 256×256px or larger, square crop.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Personal info card */}
                        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-border bg-muted/20">
                                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Personal Information
                                </h2>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Input
                                        label="First Name"
                                        placeholder="First name"
                                        value={form.first_name}
                                        onChange={(e) => setForm((s) => ({ ...s, first_name: e.target.value }))}
                                        icon={User}
                                    />
                                    <Input
                                        label="Last Name"
                                        placeholder="Last name"
                                        value={form.last_name}
                                        onChange={(e) => setForm((s) => ({ ...s, last_name: e.target.value }))}
                                        icon={User}
                                    />
                                </div>
                                <Input
                                    label="Email"
                                    value={currentUser?.email ?? ""}
                                    disabled
                                    icon={Mail}
                                    className="bg-muted/50"
                                />
                                <Input
                                    label="Phone"
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    value={form.phone}
                                    onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                                    icon={Phone}
                                />
                            </div>
                        </section>
                    </form>

                    {/* Role-specific deep link */}
                    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/20">
                            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                {isAdminByRole ? (
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Home className="h-4 w-4 text-muted-foreground" />
                                )}
                                Role Settings
                            </h2>
                        </div>
                        <div className="p-4">
                            <Link
                                href={roleProfileHref}
                                className="flex items-center justify-between gap-4 rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]">
                                        {isAdminByRole ? <Shield className="h-4 w-4" /> : <Home className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{roleLabel}</p>
                                        <p className="text-xs text-muted-foreground">{roleDescription}</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>
                    </section>

                    {/* Security section */}
                    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/20">
                            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <KeyRound className="h-4 w-4 text-muted-foreground" />
                                Security
                            </h2>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-400">Email Verified</p>
                                    <p className="text-xs text-emerald-700/80 dark:text-emerald-500">
                                        {currentUser?.email_verified_at
                                            ? `Verified on ${new Date(currentUser.email_verified_at).toLocaleDateString()}`
                                            : "Your email address is verified"}
                                    </p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground pl-1">
                                To change your password, use the forgotten password flow from the login page.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default function UserSettingsPage() {
    return <UserSettingsContent />;
}
