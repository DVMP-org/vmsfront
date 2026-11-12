import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandNavigation, permittedCommands } from "./CommandNavigation";
import type { Admin } from "@/types";

const role = (permissions: string[]) =>
  ({ effective_permissions: permissions }) as Admin;

describe("command navigation", () => {
  it("fails closed without role data, honors child permissions, and deduplicates routes", () => {
    expect(permittedCommands(null).map((entry) => entry.label)).toEqual([
      "Dashboard",
      "Profile",
    ]);
    const commands = permittedCommands(role(["roles.list"]));
    expect(
      commands.some((entry) => entry.label === "Roles & permissions"),
    ).toBe(false);
    expect(commands.some((entry) => entry.href === "/admin/admins")).toBe(
      false,
    );
    expect(commands.some((entry) => entry.href === "/admin/organization")).toBe(
      false,
    );
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
      ["charges", "hospitality", "reservations"],
      moduleGroups,
      false,
      "hospitality",
    );
    expect(
      commands.find((entry) => entry.label === "Guest folios & billing")?.group,
    ).toBe("Guest accounting");
    expect(
      commands.find((entry) => entry.label === "Reservations & stays")?.group,
    ).toBe("Front office");
  });
  it("supports the current single-role payload until RBAC union grants land", () => {
    const currentAdmin = {
      role: {
        permissions: ["places.list"],
        permissions_parsed: ["places.list"],
      },
    } as unknown as Admin;
    expect(
      permittedCommands(currentAdmin).some(
        (entry) => entry.href === "/admin/properties",
      ),
    ).toBe(false);
    expect(
      permittedCommands(currentAdmin).some(
        (entry) => entry.href === "/admin/charges",
      ),
    ).toBe(false);
  });
  it("no longer offers the retired people directory", () => {
    expect(
      permittedCommands(
        role(["places.list"]),
        ["dashboard", "people"],
        [],
        false,
      ).some((entry) => entry.href === "/admin/people"),
    ).toBe(false);
    expect(
      permittedCommands(null, ["dashboard", "people"], [], true).some(
        (entry) => entry.href === "/admin/people",
      ),
    ).toBe(false);
  });
  it("searches permitted routes, handles empty results, and navigates with Enter", () => {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
    const navigate = vi.fn();
    render(
      <CommandNavigation
        role={role(["charges.list"])}
        contextKey="tenant:user"
        navigate={navigate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Search VMS Core/ }));
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "no match" },
    });
    expect(screen.getByRole("status").textContent).toContain(
      "No available pages",
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "charges" },
    });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(navigate).toHaveBeenCalledWith("/admin/charges");
  });
});

it("invalidates open navigation on tenant and permission changes and restores focus", () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  const admin = role(["*"]);
  const { rerender } = render(
    <CommandNavigation
      role={admin}
      contextKey="org-a:user"
      navigate={vi.fn()}
    />,
  );
  const trigger = screen.getByRole("button", { name: /Search VMS Core/ });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole("combobox")).toHaveFocus();
  rerender(
    <CommandNavigation
      role={admin}
      contextKey="org-b:user"
      navigate={vi.fn()}
    />,
  );
  expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  rerender(
    <CommandNavigation
      role={null}
      contextKey="org-b:user"
      navigate={vi.fn()}
    />,
  );
  expect(document.querySelector("dialog")).not.toHaveAttribute("open");
});

it("opens one shortcut dialog when existing layouts mount multiple headers", () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
  render(
    <>
      <CommandNavigation contextKey="same" navigate={vi.fn()} />
      <CommandNavigation contextKey="same" navigate={vi.fn()} />
    </>,
  );
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  expect(document.querySelectorAll("dialog[open]")).toHaveLength(1);
  const ids = [...document.querySelectorAll("[id]")].map(
    (element) => element.id,
  );
  expect(new Set(ids).size).toBe(ids.length);
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  fireEvent.click(
    screen.getAllByRole("button", { name: /Search VMS Core/ })[1],
  );
  fireEvent.keyDown(window, { key: "k", ctrlKey: true });
  expect(document.querySelectorAll("dialog[open]")).toHaveLength(0);
});

it("exposes forum participation to active Site managers without moderation grants", () => {
  expect(
    permittedCommands(null, ["forum"], [], true, "hospitality").some(
      (entry) => entry.href === "/admin/forums",
    ),
  ).toBe(true);
  expect(
    permittedCommands(null, ["forum"], [], false, "hospitality").some(
      (entry) => entry.href === "/admin/forums",
    ),
  ).toBe(false);
});
