"use client";

import { useState } from "react";
import { MoreHorizontal, UserPlus } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { roleLabel } from "@/features/workspaces/catalog";
import { humanize } from "@/lib/strings";
import {
    ACCESS_LEVELS,
    type HouseholdAccessLevel,
    type HouseholdMember,
} from "../api";
import { SettingsCard, SettingsSelect } from "./SettingsPrimitives";

export function HouseholdAccessCard({
    members,
    isLoading,
    canManage,
    onAdd,
    onRemove,
    onAccessLevelChange,
    accessLevels,
}: {
    members: HouseholdMember[];
    isLoading: boolean;
    /** Only a Place administrator may add or remove people. */
    canManage: boolean;
    onAdd: () => void;
    onRemove: (member: HouseholdMember) => void;
    onAccessLevelChange: (memberId: string, level: HouseholdAccessLevel) => void;
    accessLevels: Record<string, HouseholdAccessLevel>;
}) {
    const [menuFor, setMenuFor] = useState<string | null>(null);

    return (
        <SettingsCard
            title="Household access"
            description="People in your household who can access this Place."
            action={
                canManage ? (
                    <Button onClick={onAdd} className="gap-2">
                        <UserPlus aria-hidden="true" className="h-4 w-4" />
                        Add household member
                    </Button>
                ) : null
            }
            bodyClassName="px-4 pb-2 pt-1 sm:px-5 sm:pb-3"
        >
            {isLoading ? (
                <p role="status" className="py-6 text-sm text-[var(--vms-ink-muted)]">
                    Loading household members…
                </p>
            ) : !members.length ? (
                <p className="py-6 text-sm text-[var(--vms-ink-muted)]">
                    No one is linked to this Place yet.
                </p>
            ) : (
                <ul className="divide-y divide-[var(--vms-line)]">
                    {members.map((member) => {
                        const level =
                            accessLevels[member.id] ??
                            member.access_level ??
                            "view_only";
                        const name = member.party?.display_name ?? "Household member";
                        const role = member.is_super_admin
                            ? "Super admin · Full access"
                            : humanize(member.role);
                        return (
                            <li
                                key={member.id}
                                className="flex flex-wrap items-center gap-3 py-3"
                            >
                                <Avatar name={name} size="md" tone="ink" decorative />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold leading-5 text-[var(--vms-ink)]">
                                        {name}
                                    </p>
                                    <p className="truncate text-xs text-[var(--vms-ink-muted)]">
                                        {member.is_super_admin ? role : `${role} · ${levelLabel(level)}`}
                                    </p>
                                </div>
                                <SettingsSelect
                                    ariaLabel={`Access level for ${name}`}
                                    value={level}
                                    onChange={(value) =>
                                        onAccessLevelChange(member.id, value as HouseholdAccessLevel)
                                    }
                                    options={ACCESS_LEVELS.map((option) => ({
                                        value: option.value,
                                        label: option.label,
                                    }))}
                                    shape="inline"
                                />
                                {canManage ? (
                                    <div className="relative">
                                        <button
                                            type="button"
                                            aria-label={`More options for ${name}`}
                                            aria-expanded={menuFor === member.id}
                                            onClick={() =>
                                                setMenuFor(menuFor === member.id ? null : member.id)
                                            }
                                            className="grid h-9 w-9 place-items-center rounded-[var(--vms-radius-control)] text-[var(--vms-ink-muted)] transition hover:bg-[var(--vms-surface-subtle)] hover:text-[var(--vms-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)]"
                                        >
                                            <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                                        </button>
                                        {menuFor === member.id ? (
                                            <div
                                                role="menu"
                                                className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-[var(--vms-radius-control)] border border-[var(--vms-line)] bg-[var(--vms-surface)] shadow-[var(--vms-shadow-overlay)]"
                                            >
                                                <p className="border-b border-[var(--vms-line)] px-3 py-2 text-[11px] text-[var(--vms-ink-muted)]">
                                                    {member.party?.email || roleLabel(member.role)}
                                                </p>
                                                <button
                                                    type="button"
                                                    role="menuitem"
                                                    disabled={member.is_super_admin}
                                                    onClick={() => {
                                                        setMenuFor(null);
                                                        onRemove(member);
                                                    }}
                                                    className="block w-full px-3 py-2 text-left text-sm text-[var(--vms-danger)] transition hover:bg-[var(--vms-surface-subtle)] disabled:cursor-not-allowed disabled:text-[var(--vms-ink-muted)]"
                                                >
                                                    Remove from household
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </li>
                        );
                    })}
                </ul>
            )}
        </SettingsCard>
    );
}

function levelLabel(level: HouseholdAccessLevel) {
    return ACCESS_LEVELS.find((option) => option.value === level)?.label ?? level;
}
