"use client";

import { useEffect, useState } from "react";

/**
 * Track a CSS media query in React.
 *
 * Used where a layout renders the same record twice — once in a large-screen
 * sidebar and once in a small-screen drawer — so only one of them can mount.
 */
export function useMediaQuery(query: string, defaultValue = false) {
  const [matches, setMatches] = useState(defaultValue);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}
