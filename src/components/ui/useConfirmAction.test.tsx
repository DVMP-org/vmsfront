import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useConfirmAction } from "./useConfirmAction";

function Harness({ remove }: { remove: () => unknown | Promise<unknown> }) {
  const { confirmAction, confirmationDialog } = useConfirmAction();
  return (
    <>
      <button
        onClick={() =>
          confirmAction({
            title: "Delete record?",
            description: "Delete Cedar Court? This cannot be undone.",
            confirmLabel: "Delete record",
            onConfirm: remove,
          })
        }
      >
        Remove record
      </button>
      {confirmationDialog}
    </>
  );
}

describe("destructive action confirmation", () => {
  it("requires explicit approval and cancels without running the action", async () => {
    const remove = vi.fn();
    render(<Harness remove={remove} />);
    const trigger = screen.getByRole("button", { name: "Remove record" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "Delete record?" });
    expect(dialog).toHaveAccessibleDescription(
      "Delete Cedar Court? This cannot be undone.",
    );
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(remove).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Delete record" }));
    await waitFor(() => expect(remove).toHaveBeenCalledOnce());
  });

  it("prevents duplicate submission and dismissal during an in-flight deletion", async () => {
    let resolve!: () => void;
    const remove = vi.fn(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    );
    render(<Harness remove={remove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove record" }));
    const confirm = screen.getByRole("button", { name: "Delete record" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(remove).toHaveBeenCalledOnce();
    expect(confirm).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
    await act(async () => resolve());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("shows failures and allows an explicit retry", async () => {
    const remove = vi
      .fn()
      .mockRejectedValueOnce(new Error("Removal failed"))
      .mockResolvedValue(undefined);
    render(<Harness remove={remove} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove record" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete record" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Removal failed",
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("data-state", "open");
    fireEvent.click(screen.getByRole("button", { name: "Delete record" }));
    await waitFor(() => expect(remove).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
