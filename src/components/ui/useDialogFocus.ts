"use client";

import * as React from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

// One stack owns scroll locking and background isolation across nested overlays.
const dialogs: HTMLElement[] = [];
const originalInert = new Map<HTMLElement, boolean>();
let savedOverflow = "";
let savedPadding = "";
let sessionTrigger: HTMLElement | null = null;

function isolateTopDialog() {
  const top = dialogs[dialogs.length - 1];
  for (const child of Array.from(document.body.children)) {
    if (
      !(child instanceof HTMLElement) ||
      ["SCRIPT", "STYLE"].includes(child.tagName)
    )
      continue;
    if (!originalInert.has(child)) originalInert.set(child, child.inert);
    child.inert = top
      ? !child.contains(top)
      : (originalInert.get(child) ?? false);
  }
}

export function useDialogFocus(
  isOpen: boolean,
  onClose: () => void,
  panelRef: React.RefObject<HTMLElement | null>,
  initialFocusSelector?: string,
  dismissible = true,
) {
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose;

  React.useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (!dialogs.length) {
      sessionTrigger = previouslyFocused;
      savedOverflow = document.body.style.overflow;
      savedPadding = document.body.style.paddingRight;
      const viewport = document.documentElement.clientWidth;
      const scrollbar = viewport ? window.innerWidth - viewport : 0;
      if (scrollbar > 0) {
        const padding =
          parseFloat(getComputedStyle(document.body).paddingRight) || 0;
        document.body.style.paddingRight = `${padding + scrollbar}px`;
      }
      document.body.style.overflow = "hidden";
    }
    dialogs.push(panel);
    isolateTopDialog();
    const isTop = () => dialogs[dialogs.length - 1] === panel;
    const getFocusable = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" &&
          !element.closest("[hidden], [inert]") &&
          (element.getClientRects().length > 0 ||
            process.env.NODE_ENV === "test"),
      );
    const focusFrame = window.requestAnimationFrame(() => {
      if (!isTop()) return;
      const first = initialFocusSelector
        ? panel.querySelector<HTMLElement>(initialFocusSelector)
        : getFocusable()[0];
      (first || panel).focus({ preventScroll: true });
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTop()) return;
      if (event.key === "Escape") {
        if (!dismissible) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === first || active === panel || !panel.contains(active))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (active === last || !panel.contains(active))
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      const wasTop = isTop();
      dialogs.splice(dialogs.indexOf(panel), 1);
      const fallbackTrigger = sessionTrigger;
      if (!dialogs.length) {
        sessionTrigger = null;
        document.body.style.overflow = savedOverflow;
        document.body.style.paddingRight = savedPadding;
        originalInert.forEach((inert, element) => {
          element.inert = inert;
        });
        originalInert.clear();
      } else {
        isolateTopDialog();
      }
      if (wasTop) {
        const top = dialogs[dialogs.length - 1];
        const target =
          previouslyFocused?.isConnected &&
          (!top || top.contains(previouslyFocused))
            ? previouslyFocused
            : top || (fallbackTrigger?.isConnected ? fallbackTrigger : null);
        target?.focus({ preventScroll: true });
      }
    };
  }, [dismissible, initialFocusSelector, isOpen, panelRef]);
}
