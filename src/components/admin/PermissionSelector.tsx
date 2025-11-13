import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { PermissionDictionary } from "@/types";

interface PermissionSelectorProps {
  permissions: PermissionDictionary;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  className?: string;
}

interface PermissionGroup {
  resource: string;
  actions: string[];
}

export function PermissionSelector({
  permissions,
  value,
  onChange,
  disabled,
  className,
}: PermissionSelectorProps) {
  const [search, setSearch] = useState("");

  const groups = useMemo<PermissionGroup[]>(() => {
    return Object.entries(permissions || {})
      .map(([resource, actions]) => ({
        resource,
        actions: actions ?? [],
      }))
      .sort((a, b) => a.resource.localeCompare(b.resource));
  }, [permissions]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) {
      return groups;
    }
    const needle = search.toLowerCase();
    return groups
      .map((group) => {
        const filteredActions = group.actions.filter(
          (action) =>
            action.toLowerCase().includes(needle) ||
            group.resource.toLowerCase().includes(needle)
        );
        return { ...group, actions: filteredActions };
      })
      .filter((group) => group.actions.length > 0);
  }, [groups, search]);

  const selectedSet = useMemo(() => new Set(value), [value]);

  const togglePermission = (permission: string) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    if (next.has(permission)) {
      next.delete(permission);
    } else {
      next.add(permission);
    }
    onChange(Array.from(next));
  };

  const toggleGroup = (resource: string, actions: string[]) => {
    if (disabled) return;
    const next = new Set(selectedSet);
    const dotPermissions = actions.map((action) => `${resource}.${action}`);
    const allSelected = dotPermissions.every((perm) => next.has(perm));
    dotPermissions.forEach((perm) => {
      if (allSelected) {
        next.delete(perm);
      } else {
        next.add(perm);
      }
    });
    onChange(Array.from(next));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const selectAll = () => {
    if (disabled) return;
    const next: string[] = [];
    groups.forEach((group) => {
      group.actions.forEach((action) => {
        next.push(`${group.resource}.${action}`);
      });
    });
    onChange(next);
  };

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search permissions..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={disabled}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={disabled || value.length === 0}
          >
            Clear all
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={disabled || groups.length === 0}
          >
            Select all
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4 max-h-[360px] overflow-y-auto rounded-lg border p-4">
        {filteredGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No permissions match your search.
          </p>
        ) : (
          filteredGroups.map((group) => {
            const dotPermissions = group.actions.map(
              (action) => `${group.resource}.${action}`
            );
            const selectedCount = dotPermissions.filter((perm) =>
              selectedSet.has(perm)
            ).length;
            const allSelected =
              selectedCount > 0 && selectedCount === dotPermissions.length;

            return (
              <div key={group.resource} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{group.resource}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCount}/{dotPermissions.length} selected
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroup(group.resource, group.actions)}
                    disabled={disabled}
                  >
                    {allSelected ? "Deselect group" : "Select group"}
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {group.actions.map((action) => {
                    const permission = `${group.resource}.${action}`;
                    return (
                      <Checkbox
                        key={permission}
                        label={action}
                        checked={selectedSet.has(permission)}
                        onChange={() => togglePermission(permission)}
                        disabled={disabled}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
