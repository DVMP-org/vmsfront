"use client";

import { useState } from "react";
import {
    useBrandingThemes,
    useActiveBrandingTheme,
    useCreateBrandingTheme,
    useUpdateBrandingTheme,
    useDeleteBrandingTheme,
    useActivateBrandingTheme,
} from "@/hooks/use-admin-branding";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { BrandingTheme, CreateBrandingThemeRequest, UpdateBrandingThemeRequest } from "@/types";
import { Palette, Plus, Edit, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

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
    primary_color: "#213928",
    secondary_color: "#64748b",
    logo_url: "",
    dark_logo_url: "",
    favicon_url: "",
    custom_css: "",
    custom_js: "",
};

export function BrandingSection() {
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
            primary_color: theme.primary_color || "#213928",
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
            name: formState.name.trim() || editingTheme.name,
            primary_color: formState.primary_color || editingTheme.primary_color,
            secondary_color: formState.secondary_color || editingTheme.secondary_color,
            logo_url: formState.logo_url.trim() || null,
            dark_logo_url: formState.dark_logo_url.trim() || null,
            favicon_url: formState.favicon_url.trim() || null,
            custom_css: formState.custom_css.trim() || null,
            custom_js: formState.custom_js.trim() || null,
            active: editingTheme.active,
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

    if (themesLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-xs text-muted-foreground">Create and manage branding themes</p>
                </div>
                <Button size="sm" onClick={handleOpenCreateModal} className="h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create Theme
                </Button>
            </div>

            {activeTheme && (
                <div className="border border-green-200 bg-green-50/50 dark:bg-green-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div>
                            <p className="text-sm font-medium text-green-900">Active Theme: {activeTheme.name}</p>
                            <p className="text-xs text-green-700">This theme is currently applied to your application.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="border border-zinc-200 rounded-lg">
                <div className="border-b border-zinc-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-foreground">Branding Themes</h2>
                </div>
                {!themes || themes.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No branding themes yet. Create your first theme to customize the appearance.
                    </div>
                ) : (
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
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="h-8 w-8 rounded border flex items-center justify-center"
                                                    style={{
                                                        background: `linear-gradient(135deg, ${theme.primary_color} 0%, ${theme.secondary_color} 100%)`,
                                                    }}
                                                >
                                                    <Palette className="h-4 w-4 text-white" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-foreground">{theme.name}</div>
                                                    <div className="text-xs text-muted-foreground">#{theme.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className="h-5 w-5 rounded-full border border-zinc-300"
                                                    style={{ backgroundColor: theme.primary_color }}
                                                    title={`Primary: ${theme.primary_color}`}
                                                />
                                                <div
                                                    className="h-5 w-5 rounded-full border border-zinc-300"
                                                    style={{ backgroundColor: theme.secondary_color }}
                                                    title={`Secondary: ${theme.secondary_color}`}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isActive ? (
                                                <Badge className="bg-green-500 text-white text-xs">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {theme.created_at ? formatDate(theme.created_at) : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1.5">
                                                {!isActive && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleActivateTheme(theme.id)}
                                                        isLoading={activateTheme.isPending}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        Activate
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenEditModal(theme)}
                                                    className="h-7 px-2"
                                                >
                                                    <Edit className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleOpenDeleteModal(theme)}
                                                    isLoading={deleteTheme.isPending && deletingTheme?.id === theme.id}
                                                    className="h-7 px-2"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
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
                                    placeholder="#213928"
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
                                    placeholder="#213928"
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
        </>
    );
}

