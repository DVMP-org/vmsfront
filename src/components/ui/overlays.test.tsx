import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";
import { Modal } from "./Modal";
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
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
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
    expect(
      screen.getByRole("dialog", { name: "Cedar Court" }),
    ).toHaveAttribute("aria-modal", "true");
    expect(document.body.style.overflow).toBe("hidden");
  });
});
