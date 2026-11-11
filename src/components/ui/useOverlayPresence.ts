"use client";

import { useEffect, useState } from "react";

/** Keep the portal and its focus boundary alive through the exit transition. */
export function useOverlayPresence(open: boolean) {
  const [retained, setRetained] = useState(open);

  useEffect(() => {
    if (open) {
      setRetained(true);
      return;
    }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => setRetained(false), reduced ? 0 : 220);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return { present: open || retained, state: open ? "open" : "closed" } as const;
}
