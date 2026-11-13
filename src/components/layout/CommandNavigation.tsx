"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  adminLinks,
  contextualAdminLinks,
  type AdminRoute,
} from "@/config/admin-routes";
import type { ModuleGroup } from "@/features/context/api";
import { hasAdminPermission } from "@/lib/permissions";
import type { Admin } from "@/types";
import styles from "./CommandNavigation.module.css";

export function permittedCommands(
  role: Admin | null | undefined,
  modules?: readonly string[],
  moduleGroups?: readonly ModuleGroup[],
  canManage = false,
  useCase?: string,
): AdminRoute[] {
  const result: AdminRoute[] = [];
  const visit = (routes: AdminRoute[]) =>
    routes.forEach((route) => {
      if (route.managementOnly && !canManage) return;
      if (route.permission && !hasAdminPermission(role, route.permission))
        return;
      if (
        route.href.startsWith("/") &&
        !result.some((entry) => entry.href === route.href)
      )
        result.push(route);
      if (route.children) visit(route.children);
    });
  visit(
    modules
      ? contextualAdminLinks(modules, moduleGroups, useCase)
      : adminLinks,
  );
  return result;
}

/** Navigation uses only the current role and local routes; no tenant selection is persisted. */
export function CommandNavigation({
  role,
  contextKey,
  navigate,
  modules,
  moduleGroups = [],
  canManage = false,
  useCase,
  routes,
  searchLabel = "Search VMS Core",
}: {
  role?: Admin | null;
  modules?: readonly string[];
  moduleGroups?: readonly ModuleGroup[];
  contextKey: string;
  navigate: (href: string) => void;
  canManage?: boolean;
  useCase?: string;
  routes?: AdminRoute[];
  searchLabel?: string;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const commands = useMemo(
    () =>
      routes ??
      permittedCommands(role, modules, moduleGroups, canManage, useCase),
    [role, modules, moduleGroups, canManage, useCase, routes],
  );
  const matches = commands.filter((entry) =>
    entry.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const close = () => dialog.current?.close();
  const open = () => {
    if (dialog.current?.open) return;
    restoreFocus.current = document.activeElement as HTMLElement;
    setQuery("");
    setActive(0);
    dialog.current?.showModal();
    input.current?.focus();
  };
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const existing = document.querySelector<HTMLDialogElement>(
          "dialog[data-vms-command-navigation][open]",
        );
        if (existing) existing.close();
        else open();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  // A changed user, tenant or role invalidates an open command session.
  useEffect(() => {
    close();
    setQuery("");
    setActive(0);
  }, [contextKey, role]);

  useEffect(() => {
    document
      .getElementById(`${id}-command-${active}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [active, query, id]);

  const choose = (index: number) => {
    const entry = matches[index];
    if (!entry) return;
    close();
    navigate(entry.href);
  };
  return (
    <>
      <button
        type="button"
        onClick={open}
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-label={searchLabel}
      >
        <Search aria-hidden="true" />
        <span className={styles.triggerLabel}>{searchLabel}</span>
        <kbd>⌘ K</kbd>
      </button>
      <dialog
        data-vms-command-navigation
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={`${id}-title`}
        onClose={() =>
          restoreFocus.current?.isConnected && restoreFocus.current.focus()
        }
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.panel}>
          <header>
            <h2 id={`${id}-title`}>Go to a page</h2>
            <button type="button" onClick={close} aria-label="Close navigation">
              Esc
            </button>
          </header>
          <label htmlFor={`${id}-query`}>Search available pages</label>
          <input
            ref={input}
            id={`${id}-query`}
            value={query}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={`${id}-results`}
            aria-activedescendant={
              matches.length
                ? `${id}-command-${Math.min(active, matches.length - 1)}`
                : undefined
            }
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                setActive((index) =>
                  matches.length
                    ? (index +
                        (event.key === "ArrowDown" ? 1 : -1) +
                        matches.length) %
                      matches.length
                    : 0,
                );
              }
              if (event.key === "Enter") {
                event.preventDefault();
                choose(active);
              }
            }}
          />
          <ul id={`${id}-results`} role="listbox" aria-label="Available pages">
            {matches.map((entry, index) => (
              <li
                key={entry.href}
                id={`${id}-command-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseMove={() => setActive(index)}
                onClick={() => choose(index)}
              >
                <span>{entry.label}</span>
                <span aria-hidden="true">↵</span>
              </li>
            ))}
          </ul>
          {!matches.length && (
            <p role="status">
              No available pages match “{query}”. Try another name.
            </p>
          )}
          <footer>↑ ↓ to choose · Enter to open · Escape to close</footer>
        </div>
      </dialog>
    </>
  );
}
