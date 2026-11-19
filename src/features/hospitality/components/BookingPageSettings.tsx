"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Image as ImageIcon, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { parseApiError } from "@/lib/error-utils";
import { useAppStore } from "@/store/app-store";
import { useWorkspaceContext } from "@/features/context/use-workspace-context";
import { AttachmentManager } from "@/features/files/components/AttachmentManager";
import { attachmentUrl } from "@/features/files/api";
import { useAttachments } from "@/features/files/queries";
import {
    useHospitalityPublicPage,
    useUpdateHospitalityPublicPage,
} from "../queries";

const SECTIONS: Array<{ key: string; label: string; hint: string }> = [
    { key: "description", label: "Description", hint: "A short introduction." },
    { key: "gallery", label: "Gallery", hint: "Public photos of the property." },
    { key: "rooms", label: "Rooms", hint: "Bookable room categories." },
    { key: "amenities", label: "Amenities", hint: "What each category includes." },
    { key: "contact", label: "Contact", hint: "Phone, email and address." },
];

type Draft = {
    description: string;
    contact_email: string;
    contact_phone: string;
    contact_address: string;
    primary_color: string;
    secondary_color: string;
    sections: string[];
    is_published: boolean;
};

const EMPTY: Draft = {
    description: "",
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    primary_color: "#213928",
    secondary_color: "#64748b",
    sections: SECTIONS.map((section) => section.key),
    is_published: true,
};

/**
 * The booking page, configured as a form.
 *
 * Deliberately structured: a hotel turns supported sections on or off, writes
 * its copy and chooses images. There is no drag-and-drop canvas and no HTML
 * field, so nothing saved here can become arbitrary markup on the booking page.
 */
export function BookingPageSettings() {
    const selectedSite = useAppStore((state) => state.selectedSite);
    const workspace = useWorkspaceContext();
    const siteSlug = workspace.data?.site_slug ?? null;
    const query = useHospitalityPublicPage();
    const update = useUpdateHospitalityPublicPage();
    const [draft, setDraft] = useState<Draft>(EMPTY);
    const gallery = useAttachments("site", selectedSite?.id, "gallery");
    const cover = useAttachments("site", selectedSite?.id, "cover");
    const logo = useAttachments("site", selectedSite?.id, "logo");

    useEffect(() => {
        if (!query.data) return;
        setDraft({
            description: query.data.description ?? "",
            contact_email: query.data.contact_email ?? "",
            contact_phone: query.data.contact_phone ?? "",
            contact_address: query.data.contact_address ?? "",
            primary_color: query.data.primary_color || EMPTY.primary_color,
            secondary_color: query.data.secondary_color || EMPTY.secondary_color,
            sections: query.data.sections?.length
                ? query.data.sections
                : EMPTY.sections,
            is_published: query.data.is_published,
        });
    }, [query.data]);

    function save() {
        update.mutate(
            {
                description: draft.description.trim() || null,
                contact_email: draft.contact_email.trim() || null,
                contact_phone: draft.contact_phone.trim() || null,
                contact_address: draft.contact_address.trim() || null,
                primary_color: draft.primary_color,
                secondary_color: draft.secondary_color,
                sections: draft.sections,
                is_published: draft.is_published,
            },
            {
                onSuccess: () => toast.success("Booking page saved."),
                onError: (error) => toast.error(parseApiError(error).message),
            },
        );
    }

    if (!selectedSite?.id) {
        return (
            <InlineAlert tone="warning" title="Select a Site">
                Booking page branding belongs to one hospitality Site.
            </InlineAlert>
        );
    }

    if (query.isPending) {
        return <p role="status">Loading booking page settings…</p>;
    }

    const coverUrl = attachmentUrl(
        cover.data?.find((row) => row.is_primary)?.url ?? cover.data?.[0]?.url,
    );
    const logoUrl = attachmentUrl(
        logo.data?.find((row) => row.is_primary)?.url ??
        logo.data?.[0]?.url ??
        query.data?.logo_url,
    );
    const galleryUrls = (gallery.data ?? [])
        .slice(0, 4)
        .map((row) => attachmentUrl(row.thumbnail_url))
        .filter(Boolean) as string[];

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <form
                className="space-y-5"
                onSubmit={(event) => {
                    event.preventDefault();
                    save();
                }}
            >
                <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
                    <h2 className="text-base font-semibold">Page details</h2>
                    <div className="mt-4 space-y-4">
                        <label className="block space-y-1.5 text-sm font-medium">
                            <span>Short description</span>
                            <textarea
                                className="min-h-24 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 py-2 text-sm"
                                maxLength={2000}
                                value={draft.description}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder="A quiet harbour hotel with twelve rooms and a rooftop bar."
                            />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Contact email"
                                type="email"
                                value={draft.contact_email}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        contact_email: event.target.value,
                                    }))
                                }
                            />
                            <Input
                                label="Contact phone"
                                value={draft.contact_phone}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        contact_phone: event.target.value,
                                    }))
                                }
                            />
                        </div>
                        <Input
                            label="Contact address"
                            value={draft.contact_address}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    contact_address: event.target.value,
                                }))
                            }
                        />
                    </div>
                </section>

                <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold">Brand colours</h2>
                            <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                                Empty colours inherit the organization&apos;s active branding
                                theme. Choose a colour to override it for this Site only.
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                update.mutate(
                                    { primary_color: "", secondary_color: "" },
                                    {
                                        onSuccess: () => toast.success("Using organization branding."),
                                        onError: (error) =>
                                            toast.error(parseApiError(error).message),
                                    },
                                )
                            }
                        >
                            Use organization branding
                        </Button>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <ColorField
                            label="Primary"
                            value={draft.primary_color}
                            onChange={(primary_color) =>
                                setDraft((current) => ({ ...current, primary_color }))
                            }
                        />
                        <ColorField
                            label="Secondary"
                            value={draft.secondary_color}
                            onChange={(secondary_color) =>
                                setDraft((current) => ({ ...current, secondary_color }))
                            }
                        />
                    </div>
                </section>

                <section className="rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
                    <h2 className="text-base font-semibold">Sections</h2>
                    <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                        Only these sections appear on the booking page.
                    </p>
                    <div className="mt-3 space-y-2">
                        {SECTIONS.map((section) => (
                            <Checkbox
                                key={section.key}
                                checked={draft.sections.includes(section.key)}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        sections: event.target.checked
                                            ? [...current.sections, section.key]
                                            : current.sections.filter((key) => key !== section.key),
                                    }))
                                }
                                label={
                                    <span>
                                        <strong className="block text-sm">{section.label}</strong>
                                        <span className="text-xs text-[var(--vms-ink-muted)]">
                                            {section.hint}
                                        </span>
                                    </span>
                                }
                            />
                        ))}
                    </div>
                    <div className="mt-4 border-t border-[var(--vms-line)] pt-4">
                        <Checkbox
                            checked={draft.is_published}
                            onChange={(event) =>
                                setDraft((current) => ({
                                    ...current,
                                    is_published: event.target.checked,
                                }))
                            }
                            label="Published"
                        />
                    </div>
                </section>

                <section className="space-y-5 rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5">
                    <div>
                        <h2 className="text-base font-semibold">Images</h2>
                        <p className="mt-1 text-xs text-[var(--vms-ink-muted)]">
                            Only images uploaded here are marked public. Private documents and
                            staff files never appear on the booking page.
                        </p>
                    </div>
                    <AttachmentManager
                        entityType="site"
                        entityId={selectedSite.id}
                        category="logo"
                        variant="single"
                        isPublic
                        allowCrop
                        aspect="wide"
                        title="Logo"
                        description="Shown in the page header."
                    />
                    <AttachmentManager
                        entityType="site"
                        entityId={selectedSite.id}
                        category="cover"
                        variant="single"
                        isPublic
                        allowCrop
                        aspect="wide"
                        title="Cover image"
                        description="The banner behind the property name."
                    />
                    <AttachmentManager
                        entityType="site"
                        entityId={selectedSite.id}
                        category="gallery"
                        variant="gallery"
                        isPublic
                        title="Property gallery"
                        description="Photos shown in the gallery section."
                    />
                </section>

                {update.isError ? (
                    <InlineAlert tone="danger" title="That did not save">
                        {parseApiError(update.error).message}
                    </InlineAlert>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={siteSlug ? `/book/${siteSlug}` : "#"}
                        target="_blank"
                        aria-disabled={!siteSlug}
                        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
                    >
                        <ExternalLink aria-hidden="true" className="size-4" />
                        Open booking page
                    </Link>
                    <Button type="submit" isLoading={update.isPending}>
                        <Save aria-hidden="true" className="size-4" />
                        Save booking page
                    </Button>
                </div>
            </form>

            <aside className="space-y-4">
                <h2 className="text-sm font-semibold">Live preview</h2>
                <div className="overflow-hidden rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface)] shadow-sm">
                    <div
                        className="relative flex h-36 items-end p-4 text-white"
                        style={{
                            backgroundColor: draft.primary_color,
                            backgroundImage: coverUrl ? `url(${coverUrl})` : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                        }}
                    >
                        <div className="absolute inset-0 bg-black/25" aria-hidden="true" />
                        <div className="relative flex items-center gap-3">
                            {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element -- signed API content
                                <img
                                    src={logoUrl}
                                    alt=""
                                    className="size-10 rounded-lg bg-white/90 object-contain p-1"
                                />
                            ) : null}
                            <p className="text-lg font-semibold">{selectedSite.name}</p>
                        </div>
                    </div>
                    <div className="space-y-3 p-4">
                        {draft.sections.includes("description") ? (
                            <p className="text-sm text-[var(--vms-ink-muted)]">
                                {draft.description || "Your description appears here."}
                            </p>
                        ) : null}
                        {draft.sections.includes("gallery") ? (
                            galleryUrls.length ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {galleryUrls.map((url) => (
                                        // eslint-disable-next-line @next/next/no-img-element -- signed API content
                                        <img
                                            key={url}
                                            src={url}
                                            alt=""
                                            className="aspect-square w-full rounded-lg object-cover"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--vms-line)] px-3 py-4 text-xs text-[var(--vms-ink-muted)]">
                                    <ImageIcon aria-hidden="true" className="size-4" />
                                    Add gallery images to see them here.
                                </p>
                            )
                        ) : null}
                        {draft.sections.includes("contact") ? (
                            <p className="text-xs text-[var(--vms-ink-muted)]">
                                {[draft.contact_phone, draft.contact_email]
                                    .filter(Boolean)
                                    .join(" · ") || "Contact details appear here."}
                            </p>
                        ) : null}
                        <span
                            className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
                            style={{ backgroundColor: draft.secondary_color }}
                        >
                            Book a stay
                        </span>
                    </div>
                </div>
            </aside>
        </div>
    );
}

function ColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="space-y-1.5 text-sm font-medium">
            <span>{label}</span>
            <span className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="size-11 cursor-pointer rounded-lg border border-[var(--vms-line)] bg-transparent p-1"
                    aria-label={`${label} colour`}
                />
                <input
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="h-11 w-full rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 font-mono text-sm uppercase"
                    maxLength={7}
                    aria-label={`${label} colour value`}
                />
            </span>
        </label>
    );
}
