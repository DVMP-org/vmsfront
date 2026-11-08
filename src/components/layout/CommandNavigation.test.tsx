import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandNavigation, permittedCommands } from "./CommandNavigation";
import type { Admin } from "@/types";

const role = (permissions: string[]) => ({ effective_permissions:permissions }) as Admin;

describe("command navigation", () => {
  it("fails closed without role data, honors child permissions, and deduplicates routes", () => {
    expect(permittedCommands(null).map((entry) => entry.label)).toEqual([
      "Dashboard",
      "Profile",
    ]);
    const commands = permittedCommands(role(["roles.list"]));
    expect(commands.some((entry) => entry.label === "Roles & permissions")).toBe(false);
    expect(commands.some((entry) => entry.href === "/admin/admins")).toBe(false);
    expect(commands.some((entry) => entry.href === "/admin/organization")).toBe(false);
    const all = permittedCommands(role(["*"]));
    expect(new Set(all.map((entry) => entry.href)).size).toBe(all.length);
  });
  it("uses the server module groups for contextual command grouping", () => {
    const moduleGroups = [
      { key: "finance", label: "Finance", modules: ["charges"] },
      {
        key: "hospitality",
        label: "Hospitality operations",
        modules: ["hospitality"],
      },
    ];
    const commands = permittedCommands(
      role(["*"]),
      ["charges", "hospitality"],
      moduleGroups,
    );
    expect(commands.find((entry) => entry.label === "Charges")?.group).toBe(
      "Finance",
    );
    expect(commands.find((entry) => entry.label === "Guest stays")?.group).toBe(
      "Hospitality operations",
    );
  });
  it("supports the current single-role payload until RBAC union grants land", () => {
    const currentAdmin = {
      role: {
        permissions: ["places.list"],
        permissions_parsed: ["places.list"],
      },
    } as unknown as Admin;
    expect(permittedCommands(currentAdmin).some((entry) => entry.href === "/admin/properties")).toBe(true);
    expect(permittedCommands(currentAdmin).some((entry) => entry.href === "/admin/charges")).toBe(false);
  });
  it("shows property people only to a property manager", () => {
    expect(
      permittedCommands(
        role(["places.list"]),
        ["dashboard", "people"],
        [],
        false,
      ).some((entry) => entry.href === "/admin/people"),
    ).toBe(false);
    expect(
      permittedCommands(
        null,
        ["dashboard", "people"],
        [],
        true,
      ).some((entry) => entry.href === "/admin/people"),
    ).toBe(true);
  });
  it("searches permitted routes, handles empty results, and navigates with Enter", () => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
    const navigate = vi.fn();
    render(<CommandNavigation role={role(["charges.list"])} contextKey="tenant:user" navigate={navigate} />);
    fireEvent.click(screen.getByRole("button", { name: /Find a page/ }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "no match" } });
    expect(screen.getByRole("status").textContent).toContain("No available pages");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "charges" } });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(navigate).toHaveBeenCalledWith("/admin/charges");
  });
});

it("invalidates open navigation on tenant and permission changes and restores focus", () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
  const admin = role(["*"]);
  const { rerender } = render(<CommandNavigation role={admin} contextKey="org-a:user" navigate={vi.fn()} />);
  const trigger = screen.getByRole("button", { name: /Find a page/ });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole("combobox")).toHaveFocus();
  rerender(<CommandNavigation role={admin} contextKey="org-b:user" navigate={vi.fn()} />);
  expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  rerender(<CommandNavigation role={null} contextKey="org-b:user" navigate={vi.fn()} />);
  expect(document.querySelector("dialog")).not.toHaveAttribute("open");
});

it("opens one shortcut dialog when existing layouts mount multiple headers", () => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
  render(<><CommandNavigation contextKey="same" navigate={vi.fn()} /><CommandNavigation contextKey="same" navigate={vi.fn()} /></>);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  expect(document.querySelectorAll("dialog[open]")).toHaveLength(1);
  const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
  expect(new Set(ids).size).toBe(ids.length);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  fireEvent.click(screen.getAllByRole("button", { name: /Find a page/ })[1]);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  expect(document.querySelectorAll("dialog[open]")).toHaveLength(0);
});
