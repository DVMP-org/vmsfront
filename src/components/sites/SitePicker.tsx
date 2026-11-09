"use client";

import { useQuery } from "@tanstack/react-query";

import { fieldControlClassName } from "@/components/ui/form/Field";
import { useVerifyToken } from "@/hooks/use-auth";
import { useAppStore } from "@/store/app-store";

export function SitePicker({
  value,
  onChange,
  label = "Site",
}: {
  value: { id: string; name: string } | null;
  onChange: (site: { id: string; name: string } | null) => void;
  label?: string;
}) {
  const organization = useAppStore((state) => state.organization);
  const currentUser = useVerifyToken();
  const sites = useQuery({
    queryKey: [
      "site-picker",
      "managed",
      organization?.id,
      currentUser.data?.user.id,
    ],
    queryFn: async () => {
      const byId = new Map(
        (currentUser.data?.site_workspaces || [])
          .filter(
            (workspace) =>
              !organization?.id ||
              workspace.site.organization_id === organization.id,
          )
          .map((workspace) => [workspace.site.id, workspace.site]),
      );
      return Array.from(byId.values()).sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    },
    enabled: currentUser.isSuccess,
  });
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-semibold">{label}</span>
      <select
        className={fieldControlClassName}
        value={value?.id || ""}
        onChange={(event) => {
          const site = sites.data?.find(
            (item) => item.id === event.target.value,
          );
          onChange(site ? { id: site.id, name: site.name } : null);
        }}
        disabled={currentUser.isPending || sites.isPending}
      >
        <option value="">
          {currentUser.isPending || sites.isPending
            ? "Loading Sites…"
            : "Choose a Site"}
        </option>
        {value && !sites.data?.some((site) => site.id === value.id) ? (
          <option value={value.id}>{value.name}</option>
        ) : null}
        {sites.data?.map((site) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>
      {currentUser.isError || sites.isError ? (
        <span className="block text-xs text-[var(--vms-danger)]">
          Sites could not be loaded.
        </span>
      ) : currentUser.isSuccess && !sites.data?.length ? (
        <span className="block text-xs text-[var(--vms-ink-muted)]">
          No Site workspaces are assigned to this account.
        </span>
      ) : null}
    </label>
  );
}
