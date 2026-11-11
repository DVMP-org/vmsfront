"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, fieldControlClassName } from "@/components/ui/form/Field";
import { FormDrawer } from "@/components/ui/form/FormDrawer";
import { FormSection } from "@/components/ui/form/FormSection";
import { usePlaceWorkspace } from "@/features/place-workspace/PlaceWorkspaceShell";
import { roleLabel } from "@/features/workspaces/catalog";
import { parseApiError } from "@/lib/error-utils";
import { cn } from "@/lib/utils";
import {
    type HouseholdAccessLevel,
    type HouseholdMember,
    type PlacePreferences,
    type SettingsTab,
} from "./api";
import { HouseholdAccessCard } from "./components/HouseholdAccessCard";
import { NotificationPreferencesCard } from "./components/NotificationPreferencesCard";
import { PrivacyPreferencesCard } from "./components/PrivacyPreferencesCard";
import { SitePolicyNotice } from "./components/SitePolicyNotice";
import { SettingsSaveBar } from "./components/SettingsSaveBar";
import { VisitorPreferencesCard } from "./components/VisitorPreferencesCard";
import {
    useAddHouseholdMember,
    useHouseholdMembers,
    usePlacePreferences,
    useRemoveHouseholdMember,
    useSavePlacePreferences,
} from "./queries";

const tabs: Array<{ value: SettingsTab; label: string }> = [
    { value: "notifications", label: "Notifications" },
    { value: "visitors", label: "Visitor preferences" },
    { value: "household", label: "Household access" },
    { value: "privacy", label: "Privacy" },
];

/**
 * Place settings page.
 *
 * The page composes cards and owns only view state: data comes from the query
 * layer (`./queries`) and each card is a first-order component with its own
 * file, so a card can be reused or reordered without touching the others.
 */
export function PlaceSettingsPage() {
    const { place, party, is_place_admin } = usePlaceWorkspace();
    const [tab, setTab] = useState<SettingsTab>("notifications");
    const [draft, setDraft] = useState<PlacePreferences | null>(null);
    const [accessLevels, setAccessLevels] = useState<
        Record<string, HouseholdAccessLevel>
    >({});
    const [addOpen, setAddOpen] = useState(false);
    const [pendingRemoval, setPendingRemoval] = useState<HouseholdMember | null>(
        null,
    );

    const preferences = usePlacePreferences(place.id);
    const savePreferences = useSavePlacePreferences(place.id);
    const members = useHouseholdMembers(place.id, {
        enabled: tab === "household" || tab === "notifications" || tab === "privacy",
    });

    const current = draft ?? preferences.data ?? null;
    const dirty = useMemo(() => {
        if (!draft || !preferences.data) return false;
        return JSON.stringify(draft) !== JSON.stringify(preferences.data);
    }, [draft, preferences.data]);

    const update = (patch: Partial<PlacePreferences>) => {
        setDraft({ ...(current ?? {}), ...patch } as PlacePreferences);
    };

    const remove = (member: HouseholdMember) => setPendingRemoval(member);

    const siteLabel = place.site_name?.trim() || place.name;

    return (
        <div className="space-y-4">
            <nav aria-label="Place settings sections">
                <ul className="-mb-px flex flex-wrap gap-6 border-b border-[var(--vms-line)]">
                    {tabs.map((item) => {
                        const active = tab === item.value;
                        return (
                            <li key={item.value}>
                                <button
                                    type="button"
                                    aria-current={active ? "page" : undefined}
                                    onClick={() => setTab(item.value)}
                                    className={cn(
                                        "relative -mb-px block whitespace-nowrap border-b-2 px-0.5 pb-2.5 pt-1 text-sm font-semibold transition-colors",
                                        active
                                            ? "border-[var(--vms-coral)] text-[var(--vms-ink)]"
                                            : "border-transparent text-[var(--vms-ink-muted)] hover:text-[var(--vms-ink)]",
                                    )}
                                >
                                    {item.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {savePreferences.isSuccess && !dirty ? (
                <p role="status" className="text-xs text-[var(--vms-success)]">
                    Preferences saved.
                </p>
            ) : null}

            {preferences.isPending ? (
                <p role="status" className="text-sm text-[var(--vms-ink-muted)]">
                    Loading preferences…
                </p>
            ) : !current ? null : (
                <>
                    {tab === "notifications" ? (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)] xl:items-start">
                            <div className="space-y-4">
                                <NotificationPreferencesCard
                                    preferences={current}
                                    email={party.email}
                                    onChange={update}
                                />
                                <VisitorPreferencesCard
                                    preferences={current}
                                    siteName={siteLabel}
                                    onChange={update}
                                />
                            </div>
                            <div className="space-y-4">
                                <HouseholdAccessCard
                                    members={members.data ?? []}
                                    isLoading={members.isPending}
                                    canManage={is_place_admin}
                                    onAdd={() => setAddOpen(true)}
                                    onRemove={remove}
                                    onAccessLevelChange={(id, level) =>
                                        setAccessLevels((state) => ({ ...state, [id]: level }))
                                    }
                                    accessLevels={accessLevels}
                                />
                                <SitePolicyNotice siteName={siteLabel} />
                            </div>
                        </div>
                    ) : null}

                    {tab === "visitors" ? (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)] xl:items-start">
                            <VisitorPreferencesCard
                                preferences={current}
                                siteName={siteLabel}
                                onChange={update}
                            />
                            <SitePolicyNotice siteName={siteLabel} />
                        </div>
                    ) : null}

                    {tab === "household" ? (
                        <HouseholdAccessCard
                            members={members.data ?? []}
                            isLoading={members.isPending}
                            canManage={is_place_admin}
                            onAdd={() => setAddOpen(true)}
                            onRemove={remove}
                            onAccessLevelChange={(id, level) =>
                                setAccessLevels((state) => ({ ...state, [id]: level }))
                            }
                            accessLevels={accessLevels}
                        />
                    ) : null}

                    {tab === "privacy" ? (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,1fr)] xl:items-start">
                            <PrivacyPreferencesCard
                                preferences={current}
                                onChange={update}
                            />
                            <SitePolicyNotice siteName={siteLabel} />
                        </div>
                    ) : null}
                </>
            )}

            {dirty ? (
                <SettingsSaveBar
                    isSaving={savePreferences.isPending}
                    onDiscard={() => setDraft(null)}
                    onSave={() => {
                        if (current) {
                            savePreferences.mutate(current, {
                                onSuccess: () => setDraft(null),
                            });
                        }
                    }}
                />
            ) : null}

            {addOpen ? (
                <AddMemberDrawer
                    placeId={place.id}
                    placeLabel={place.name}
                    onClose={() => setAddOpen(false)}
                />
            ) : null}

            {pendingRemoval ? (
                <RemoveMemberDialog
                    member={pendingRemoval}
                    onClose={() => setPendingRemoval(null)}
                />
            ) : null}
        </div>
    );
}

/** Kept beside the page so the drawer and dialog stay single-purpose. */
function AddMemberDrawer({
    placeId,
    placeLabel,
    onClose,
}: {
    placeId: string;
    placeLabel: string;
    onClose: () => void;
}) {
    const [values, setValues] = useState({
        display_name: "",
        email: "",
        role: "household_member",
    });
    const add = useAddHouseholdMember(placeId);

    return (
        <FormDrawer
            isOpen
            onClose={() => (add.isPending ? undefined : onClose())}
            title="Add household member"
            description={`Create a Place relationship at ${placeLabel}. Place relationships never grant Site administration.`}
            onSubmit={(event) => {
                event.preventDefault();
                add.mutate(values, { onSuccess: onClose });
            }}
            submitLabel="Add member"
            isSubmitting={add.isPending}
            error={add.isError ? parseApiError(add.error).message : null}
            footerNote="The person receives an invitation to join this Place."
        >
            <FormSection title="Person" description="We use the email to link their account.">
                <Field id="member-name" label="Full name" required>
                    {(control) => (
                        <input
                            {...control}
                            autoComplete="name"
                            className={fieldControlClassName}
                            required
                            value={values.display_name}
                            onChange={(event) =>
                                setValues({ ...values, display_name: event.target.value })
                            }
                        />
                    )}
                </Field>
                <Field id="member-email" label="Email" required>
                    {(control) => (
                        <input
                            {...control}
                            type="email"
                            autoComplete="email"
                            className={fieldControlClassName}
                            required
                            value={values.email}
                            onChange={(event) =>
                                setValues({ ...values, email: event.target.value })
                            }
                        />
                    )}
                </Field>
            </FormSection>
            <FormSection
                title="Relationship"
                description="Determines which workspace pages the person can open."
            >
                <Field id="member-role" label="Relationship" required>
                    {(control) => (
                        <select
                            {...control}
                            className={fieldControlClassName}
                            value={values.role}
                            onChange={(event) =>
                                setValues({ ...values, role: event.target.value })
                            }
                        >
                            {[
                                "household_member",
                                "resident",
                                "tenant",
                                "owner",
                                "employee",
                                "guest",
                            ].map((role) => (
                                <option key={role} value={role}>
                                    {roleLabel(role)}
                                </option>
                            ))}
                        </select>
                    )}
                </Field>
            </FormSection>
        </FormDrawer>
    );
}

function RemoveMemberDialog({
    member,
    onClose,
}: {
    member: HouseholdMember;
    onClose: () => void;
}) {
    const { place } = usePlaceWorkspace();
    const removeMember = useRemoveHouseholdMember(place.id);

    return (
        <Modal
            isOpen
            onClose={() => (removeMember.isPending ? undefined : onClose())}
            title="Remove household access?"
            description="The person's active relationship to this Place will end."
            size="sm"
        >
            <div className="space-y-4">
                <p className="text-sm text-[var(--vms-ink)]">
                    {member.party?.display_name ?? "This person"} will lose access to{" "}
                    {place.name}.
                </p>
                {removeMember.isError ? (
                    <p role="alert" className="text-sm text-[var(--vms-danger)]">
                        {parseApiError(removeMember.error).message}
                    </p>
                ) : null}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        variant="outline"
                        disabled={removeMember.isPending}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        isLoading={removeMember.isPending}
                        onClick={() =>
                            removeMember.mutate(member.id, { onSuccess: onClose })
                        }
                    >
                        Remove access
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
