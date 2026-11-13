import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";
import { Modal } from "./Modal";
import { Drawer } from "./Drawer";
import { SlideOver } from "./SlideOver";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Archive property?"
        description="This property will leave the active register."
      >
        <Button variant="outline">Keep property</Button>
      </Modal>
    </>
  );
}

describe("accessible overlays", () => {
  it("labels the dialog, traps focus and restores the trigger", async () => {
    render(<ModalHarness />);
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", {
      name: "Archive property?",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription(
      "This property will leave the active register.",
    );
    expect(document.body.style.overflow).toBe("hidden");

    const close = screen.getByRole("button", { name: "Close dialog" });
    const confirm = screen.getByRole("button", { name: "Keep property" });
    await waitFor(() => expect(close).toHaveFocus());

    confirm.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("portals the shared drawer, focuses it and restores its trigger on Escape", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open unit</Button>
          <Drawer isOpen={open} onClose={() => setOpen(false)} title="Unit A">
            <Button>Assign resident</Button>
          </Drawer>
        </>
      );
    }
    const { container } = render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open unit" });
    trigger.focus();
    fireEvent.click(trigger);
    const panel = screen.getByRole("dialog", { name: "Unit A" });
    expect(container).not.toContainElement(panel);
    expect(panel.parentElement).toHaveClass("fixed", "inset-0");
    await waitFor(() => expect(panel).toHaveFocus());
    fireEvent.keyDown(document, { key: "Escape" });
    // The focus boundary and scroll lock remain until the exit completes.
    expect(panel).toHaveAttribute("data-state", "closed");
    expect(document.body.style.overflow).toBe("hidden");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("uses the same dialog contract for a drawer", async () => {
    function DrawerHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open drawer</Button>
          <SlideOver
            isOpen={open}
            onClose={() => setOpen(false)}
            title="Cedar Court"
            description="Property details"
          >
            <p>Contextual details remain available beside the source record.</p>
          </SlideOver>
        </>
      );
    }

    render(<DrawerHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Open drawer" }));
    expect(screen.getByRole("dialog", { name: "Cedar Court" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(document.body.style.overflow).toBe("hidden");
  });
  it("keeps atomic drawer work open while dismissal is disabled", () => {
    const close = vi.fn();
    render(
      <SlideOver
        isOpen
        onClose={close}
        title="Saving Site"
        dismissible={false}
        busy
      >
        Saving…
      </SlideOver>,
    );

    const dialog = screen.getByRole("dialog", { name: "Saving Site" });
    expect(dialog).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Close panel" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(dialog.previousElementSibling as HTMLElement);
    expect(close).not.toHaveBeenCalled();
    expect(dialog).toHaveAttribute("data-state", "open");
  });
  it("only dismisses the top overlay and preserves its parent's scroll lock", async () => {
    function NestedHarness() {
      const [parent, setParent] = useState(false);
      const [child, setChild] = useState(false);
      return (
        <>
          <Button onClick={() => setParent(true)}>Open property</Button>
          <Drawer
            isOpen={parent}
            onClose={() => setParent(false)}
            title="Property"
          >
            <Button onClick={() => setChild(true)}>Edit details</Button>
          </Drawer>
          <Modal
            isOpen={child}
            onClose={() => setChild(false)}
            title="Edit property"
          >
            <input aria-label="Name" />
          </Modal>
        </>
      );
    }
    const { container } = render(<NestedHarness />);
    const trigger = screen.getByRole("button", { name: "Open property" });
    trigger.focus();
    fireEvent.click(trigger);
    const parent = screen.getByRole("dialog", { name: "Property" });
    const edit = screen.getByRole("button", { name: "Edit details" });
    edit.focus();
    fireEvent.click(edit);
    const child = screen.getByRole("dialog", { name: "Edit property" });
    expect(container.inert).toBe(true);
    expect(parent.parentElement?.inert).toBe(true);
    expect(child.parentElement?.inert).toBe(false);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(parent).toHaveAttribute("data-state", "open");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Edit property" }),
      ).not.toBeInTheDocument(),
    );
    expect(parent.parentElement?.inert).toBe(false);
    expect(document.body.style.overflow).toBe("hidden");
    expect(edit).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    expect(container.inert).not.toBe(true);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("restores the record trigger after handing a closing drawer to a modal", async () => {
    function Handoff() {
      const [drawer, setDrawer] = useState(false);
      const [modal, setModal] = useState(false);
      return (
        <>
          <Button onClick={() => setDrawer(true)}>Open record</Button>
          <Drawer
            isOpen={drawer}
            onClose={() => setDrawer(false)}
            title="Record"
          >
            <Button
              onClick={() => {
                setDrawer(false);
                setModal(true);
              }}
            >
              Edit record
            </Button>
          </Drawer>
          <Modal
            isOpen={modal}
            onClose={() => setModal(false)}
            title="Edit record"
          >
            Form
          </Modal>
        </>
      );
    }
    render(<Handoff />);
    const trigger = screen.getByRole("button", { name: "Open record" });
    trigger.focus();
    fireEvent.click(trigger);
    const edit = screen.getByRole("button", { name: "Edit record" });
    edit.focus();
    fireEvent.click(edit);
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Record" }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("cancels pending dismissal when reopened and respects reduced motion", async () => {
    const { rerender } = render(
      <Drawer isOpen onClose={() => {}} title="Reopened">
        <p>Details</p>
      </Drawer>,
    );
    rerender(
      <Drawer isOpen={false} onClose={() => {}} title="Reopened">
        <p>Details</p>
      </Drawer>,
    );
    rerender(
      <Drawer isOpen onClose={() => {}} title="Reopened">
        <p>Details</p>
      </Drawer>,
    );
    await new Promise((resolve) => setTimeout(resolve, 260));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    try {
      rerender(
        <Drawer isOpen={false} onClose={() => {}} title="Reopened">
          <p>Details</p>
        </Drawer>,
      );
      await waitFor(
        () => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
        { timeout: 100 },
      );
    } finally {
      window.matchMedia = original;
    }
  });
});
