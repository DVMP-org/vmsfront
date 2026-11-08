import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

import { Field } from "./Field";
import { FormErrorSummary } from "./FormErrorSummary";

describe("form primitives", () => {
  it("links a persistent label, description and field error", () => {
    render(
      <Field
        id="property-name"
        label="Property name"
        description="Shown across the workspace."
        error="Enter a property name."
        required
      >
        {(control) => <input {...control} />}
      </Field>,
    );

    const input = screen.getByLabelText(/Property name/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(
      "Shown across the workspace. Enter a property name.",
    );
  });

  it("announces errors, focuses the summary and links to the invalid control", async () => {
    render(
      <>
        <FormErrorSummary errors={{ "property-name": "Enter a property name." }} />
        <input id="property-name" aria-label="Property name" />
      </>,
    );

    const summary = screen.getByRole("alert");
    await waitFor(() => expect(summary).toHaveFocus());
    fireEvent.click(screen.getByRole("link", { name: "Enter a property name." }));
    expect(screen.getByLabelText("Property name")).toHaveFocus();
  });

  it("warns before unload and asks before discarding dirty work", () => {
    let canLeave: (message?: string) => boolean = () => true;

    function Harness() {
      const [dirty, setDirty] = useState(false);
      canLeave = useUnsavedChanges(dirty);
      return (
        <button type="button" onClick={() => setDirty(true)}>
          Edit
        </button>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const beforeUnload = new Event("beforeunload", { cancelable: true });
    fireEvent(window, beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);

    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    expect(canLeave()).toBe(false);
    expect(confirm).toHaveBeenCalledWith("Discard unsaved changes?");
    confirm.mockRestore();
  });
});
