"use client";

import { useState, useMemo } from "react";
import {
    useBrandingThemes,
    useActiveBrandingTheme,
    useCreateBrandingTheme,
    useUpdateBrandingTheme,
    useDeleteBrandingTheme,
    useActivateBrandingTheme,
} from "@/hooks/use-admin-branding";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { BrandingTheme, CreateBrandingThemeRequest, UpdateBrandingThemeRequest } from "@/types";
import { Palette, Plus, Edit, Trash2, CheckCircle2, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ThemeFormState {
    name: string;
    primary_color: string;
    secondary_color: string;
    logo_url: string;
    dark_logo_url: string;
    favicon_url: string;
    custom_css: string;
    custom_js: string;
}

const initialFormState: ThemeFormState = {
    name: "",
    primary_color: "#2563eb",
    secondary_color: "#64748b",
    logo_url: "",
    dark_logo_url: "",
    favicon_url: "",
    custom_css: "",
    custom_js: "",
};

export default function BrandingThemesPage() {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [formState, setFormState] = useState<ThemeFormState>(initialFormState);
    const [editingTheme, setEditingTheme] = useState<BrandingTheme | null>(null);
    const [deletingTheme, setDeletingTheme] = useState<BrandingTheme | null>(null);

    const { data: themes, isLoading: themesLoading } = useBrandingThemes();
    const { data: activeTheme } = useActiveBrandingTheme();
    const createTheme = useCreateBrandingTheme();
    const updateTheme = useUpdateBrandingTheme();
    const deleteTheme = useDeleteBrandingTheme();
    const activateTheme = useActivateBrandingTheme();

    const handleOpenCreateModal = () => {
        setFormState(initialFormState);
        setCreateModalOpen(true);
    };

    const handleOpenEditModal = (theme: BrandingTheme) => {
        setEditingTheme(theme);
        setFormState({
            name: theme.name || "",
            primary_color: theme.primary_color || "#2563eb",
            secondary_color: theme.secondary_color || "#64748b",
            logo_url: theme.logo_url || "",
            dark_logo_url: theme.dark_logo_url || "",
            favicon_url: theme.favicon_url || "",
            custom_css: theme.custom_css || "",
            custom_js: theme.custom_js || "",
        });
        setEditModalOpen(true);
    };

    const handleOpenDeleteModal = (theme: BrandingTheme) => {
        setDeletingTheme(theme);
        setDeleteModalOpen(true);
    };

    const handleCreateTheme = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data: CreateBrandingThemeRequest = {
            name: formState.name.trim(),
            primary_color: formState.primary_color,
            secondary_color: formState.secondary_color,
            logo_url: formState.logo_url.trim() || undefined,
            dark_logo_url: formState.dark_logo_url.trim() || undefined,
            favicon_url: formState.favicon_url.trim() || undefined,
            custom_css: formState.custom_css.trim() || undefined,
            custom_js: formState.custom_js.trim() || undefined,
        };

        createTheme.mutate(data, {
            onSuccess: () => {
                setCreateModalOpen(false);
                setFormState(initialFormState);
            },
        });
    };

    const handleUpdateTheme = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingTheme) return;

        const data: UpdateBrandingThemeRequest = {
            name: formState.name.trim(),
            primary_color: formState.primary_color,
            secondary_color: formState.secondary_color,
            logo_url: formState.logo_url.trim() || undefined,
            dark_logo_url: formState.dark_logo_url.trim() || undefined,
            favicon_url: formState.favicon_url.trim() || undefined,
            custom_css: formState.custom_css.trim() || undefined,
            custom_js: formState.custom_js.trim() || undefined,
        };

        updateTheme.mutate(
            { themeId: editingTheme.id, data },
            {
                onSuccess: () => {
                    setEditModalOpen(false);
                    setEditingTheme(null);
                    setFormState(initialFormState);
                },
            }
        );
    };

    const handleDeleteTheme = () => {
        if (!deletingTheme) return;
        deleteTheme.mutate(deletingTheme.id, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setDeletingTheme(null);
            },
        });
    };

    const handleActivateTheme = (themeId: string) => {
        activateTheme.mutate(themeId);
    };

    const renderTable = () => {
        if (themesLoading) {
            return <TableSkeleton />;
        }

        if (!themes || themes.length === 0) {
            return (
                <EmptyState
                    icon={Palette}
                    title="No branding themes yet"
                    description="Create your first theme to customize the appearance of your application."
                    action={{
                        label: "Create theme",
                        onClick: handleOpenCreateModal,
                    }}
                />
            );
        }

        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Theme</TableHead>
                        <TableHead>Colors</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {themes.map((theme) => {
                        const isActive = theme.active || theme.id === activeTheme?.id;
                        return (
                            <TableRow key={theme.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="h-10 w-10 rounded-lg border-2 flex items-center justify-center"
                                            style={{
                                                background: `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color} 100%)`,
                                            }}
                                        >
                                            <Palette className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{theme.name}</p>
                                            <p className="text-xs text-muted-foreground">#{theme.id.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="h-6 w-6 rounded-full border border-border"
                                            style={{ backgroundColor: theme.primary_color }}
                                            title={`Primary: ${theme.primary_color}`}
                                        />
                                        <div
                                            className="h-6 w-6 rounded-full border border-border"
                                            style={{ backgroundColor: theme.secondary_color }}
                                            title={`Secondary: ${theme.secondary_color}`}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {isActive ? (
                                        <Badge className="bg-green-500 text-white">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{theme.created_at ? formatDate(theme.created_at) : "—"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {!isActive && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleActivateTheme(theme.id)}
                                                isLoading={activateTheme.isPending}
                                            >
                                                Activate
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenEditModal(theme)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleOpenDeleteModal(theme)}
                                            isLoading={deleteTheme.isPending && deletingTheme?.id === theme.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        );
    };

    return (
        <DashboardLayout type="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Customization workspace
                        </p>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Palette className="h-6 w-6 text-[var(--brand-primary,#2563eb)]" />
                            Branding Themes
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Create and manage multiple branding themes. Activate one to apply it across the application.
                        </p>
                    </div>
                    <Button
                        className="gap-2 bg-[var(--brand-primary,#2563eb)] text-white hover:bg-[var(--brand-primary,#2563eb)/90]"
                        onClick={handleOpenCreateModal}
                    >
                        <Plus className="h-4 w-4" />
                        Create Theme
                    </Button>
                </div>

                {activeTheme && (
                    <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-900">Active Theme: {activeTheme.name}</p>
                                    <p className="text-sm text-green-700">
                                        This theme is currently applied to your application.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>All Themes</CardTitle>
                    </CardHeader>
                    <CardContent>{renderTable()}</CardContent>
                </Card>
            </div>

            {/* Create Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => {
                    if (!createTheme.isPending) {
                        setCreateModalOpen(false);
                        setFormState(initialFormState);
                    }
                }}
                title="Create Branding Theme"
                size="lg"
            >
                <form onSubmit={handleCreateTheme} className="space-y-4">
                    <Input
                        label="Theme Name"
                        placeholder="Corporate Theme"
                        value={formState.name}
                        onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                        required
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium mb-2">Primary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formState.primary_color}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, primary_color: e.target.value }))}
                                    className="h-10 w-20 rounded border border-input cursor-pointer"
                                />
                                <Input
                                    value={formState.primary_color}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, primary_color: e.target.value }))}
                                    placeholder="#2563eb"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Secondary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formState.secondary_color}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, secondary_color: e.target.value }))}
                                    className="h-10 w-20 rounded border border-input cursor-pointer"
                                />
                                <Input
                                    value={formState.secondary_color}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, secondary_color: e.target.value }))}
                                    placeholder="#64748b"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Logo URL"
                        placeholder="https://example.com/logo.png"
                        value={formState.logo_url}
                        onChange={(e) => setFormState((prev) => ({ ...prev, logo_url: e.target.value }))}
                        type="url"
                    />

                    <Input
                        label="Dark Mode Logo URL"
                        placeholder="https://example.com/logo-dark.png"
                        value={formState.dark_logo_url}
                        onChange={(e) => setFormState((prev) => ({ ...prev, dark_logo_url: e.target.value }))}
                        type="url"
                    />

                    <Input
                        label="Favicon URL"
                        placeholder="https://example.com/favicon.ico"
                        value={formState.favicon_url}
                        onChange={(e) => setFormState((prev) => ({ ...prev, favicon_url: e.target.value }))}
                        type="url"
                    />

                    <div>
                        <label className="block text-sm font-medium mb-2">Custom CSS</label>
                        <textarea
                            value={formState.custom_css}
                            onChange={(e) => setFormState((prev) => ({ ...prev, custom_css: e.target.value }))}
                            placeholder=":root { --custom-var: value; }"
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Custom JavaScript</label>
                        <textarea
                            value={formState.custom_js}
                            onChange={(e) => setFormState((prev) => ({ ...prev, custom_js: e.target.value }))}
                            placeholder="console.log('Custom JS');"
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" isLoading={createTheme.isPending}>
                            Create Theme
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setCreateModalOpen(false);
                                setFormState(initialFormState);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => {
                    if (!updateTheme.isPending) {
                        setEditModalOpen(false);
                        setEditingTheme(null);
                        setFormState(initialFormState);
                    }
                }}
                title="Edit Branding Theme"
                size="lg"
            >
                <form onSubmit={handleUpdateTheme} className="space-y-4">
                    <Input
                        label="Theme Name"
                        placeholder="Corporate Theme"
                        value={formState.name}
                        onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                        required
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium mb-2">Primary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formState.primary_color}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, primary_color: e.target.value }))}
                                    className="h-10 w-20 rounded border border-input cursor-pointer"
                                />
                                <Input
                                    value={formState.primary_color}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, primary_color: e.target.value }))}
                                    placeholder="#2563eb"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Secondary Color</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formState.secondary_color}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, secondary_color: e.target.value }))}
                                    className="h-10 w-20 rounded border border-input cursor-pointer"
                                />
                                <Input
                                    value={formState.secondary_color}
                                    onChange={(e) => setFormState((prev) => ({ ...prev, secondary_color: e.target.value }))}
                                    placeholder="#64748b"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Logo URL"
                        placeholder="https://example.com/logo.png"
                        value={formState.logo_url}
                        onChange={(e) => setFormState((prev) => ({ ...prev, logo_url: e.target.value }))}
                        type="url"
                    />

                    <Input
                        label="Dark Mode Logo URL"
                        placeholder="https://example.com/logo-dark.png"
                        value={formState.dark_logo_url}
                        onChange={(e) => setFormState((prev) => ({ ...prev, dark_logo_url: e.target.value }))}
                        type="url"
                    />

                    <Input
                        label="Favicon URL"
                        placeholder="https://example.com/favicon.ico"
                        value={formState.favicon_url}
                        onChange={(e) => setFormState((prev) => ({ ...prev, favicon_url: e.target.value }))}
                        type="url"
                    />

                    <div>
                        <label className="block text-sm font-medium mb-2">Custom CSS</label>
                        <textarea
                            value={formState.custom_css}
                            onChange={(e) => setFormState((prev) => ({ ...prev, custom_css: e.target.value }))}
                            placeholder=":root { --custom-var: value; }"
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Custom JavaScript</label>
                        <textarea
                            value={formState.custom_js}
                            onChange={(e) => setFormState((prev) => ({ ...prev, custom_js: e.target.value }))}
                            placeholder="console.log('Custom JS');"
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button type="submit" isLoading={updateTheme.isPending}>
                            Update Theme
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setEditModalOpen(false);
                                setEditingTheme(null);
                                setFormState(initialFormState);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => {
                    if (!deleteTheme.isPending) {
                        setDeleteModalOpen(false);
                        setDeletingTheme(null);
                    }
                }}
                title="Delete Theme"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete the theme <strong>{deletingTheme?.name}</strong>? This action cannot be undone.
                    </p>
                    {deletingTheme?.active && (
                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                            <p className="text-sm text-yellow-800">
                                This is the active theme. Deleting it will remove the active branding from your application.
                            </p>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTheme}
                            isLoading={deleteTheme.isPending}
                        >
                            Delete
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setDeleteModalOpen(false);
                                setDeletingTheme(null);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}



