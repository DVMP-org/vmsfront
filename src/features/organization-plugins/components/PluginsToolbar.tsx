"use client";

import { fieldControlClassName } from "@/components/ui/form/Field";
import { SearchField } from "@/components/ui/SearchField";
import { titleCase } from "@/lib/strings";
import type { MarketplaceCategory } from "@/types/plugin";

import type { PluginView } from "../lib";
import { TabStrip } from "./TabStrip";

export function PluginsToolbar({
    view,
    installedCount,
    catalogTotal,
    search,
    category,
    categories,
    onViewChange,
    onSearchChange,
    onCategoryChange,
}: {
    view: PluginView;
    installedCount?: number;
    catalogTotal?: number;
    search: string;
    category: string;
    categories: MarketplaceCategory[];
    onViewChange: (view: PluginView) => void;
    onSearchChange: (value: string) => void;
    onCategoryChange: (value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-4 border-b border-[var(--vms-line)] pb-5 lg:flex-row lg:items-end lg:justify-between">
            <TabStrip<PluginView>
                items={[
                    {
                        id: "installed",
                        label: `Installed${typeof installedCount === "number" ? ` (${installedCount})` : ""
                            }`,
                    },
                    {
                        id: "catalog",
                        label: `Catalogue${typeof catalogTotal === "number" ? ` (${catalogTotal})` : ""
                            }`,
                    },
                ]}
                value={view}
                onChange={onViewChange}
                label="Plugin collection"
                panelId="plugins-panel"
            />

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
                <SearchField
                    value={search}
                    onValueChange={onSearchChange}
                    label="Search plugins"
                    placeholder="Search by name or description"
                    className="w-full sm:w-72"
                />
                {view === "catalog" ? (
                    <div className="w-full sm:w-52">
                        <label
                            htmlFor="plugin-category"
                            className="mb-1 block text-xs font-semibold"
                        >
                            Category
                        </label>
                        <select
                            id="plugin-category"
                            className={`${fieldControlClassName} text-base sm:text-sm`}
                            value={category}
                            onChange={(event) => onCategoryChange(event.target.value)}
                        >
                            <option value="">All categories</option>
                            {categories.map((entry) => (
                                <option key={entry.name} value={entry.name}>
                                    {titleCase(entry.name)} ({entry.pluginCount})
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
