"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { Header } from "./Header";
import { RecentContextBar } from "./RecentContextBar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useRequireEmailVerification } from "@/hooks/use-email-verification-guard";

const Sidebar = dynamic(() => import("./Sidebar").then((mod) => mod.Sidebar), {
  ssr: false,
  loading: () => (
    <div className="hidden lg:block w-64 h-full border-r bg-background flex-shrink-0" />
  ),
});

interface DashboardLayoutProps {
  children: React.ReactNode;
  type: "resident" | "admin";
}

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // Keep the first render deterministic. The effect below applies the
  // viewport-specific shell after hydration without changing the tree shape
  // between server and client.
  const [isMobile, setIsMobile] = useState(false);
  useRequireEmailVerification(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      // Close sidebar on mobile when resizing to desktop
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleMenuClick = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return;

    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const panel = sidebarRef.current;
    const selector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(selector) || []).filter(
        (element) => element.offsetParent !== null,
      );

    document.body.style.overflow = "hidden";
    window.setTimeout(() => focusable()[0]?.focus(), 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleSidebarClose();
        return;
      }
      if (event.key !== "Tab") return;

      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        panel?.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [handleSidebarClose, isMobile, sidebarOpen]);

  return (
    <div
      className="app-shell flex h-screen flex-col overflow-hidden bg-[hsl(var(--background))] text-foreground"
      data-surface={type === "admin" ? "management" : "occupancy"}
    >
      <Header
        onMenuClick={handleMenuClick}
        sidebarOpen={sidebarOpen}
        type={type}
      />
      <div className="flex min-h-0 flex-1">
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={handleSidebarClose}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {(isMobile ? sidebarOpen : true) && (
            <motion.div
              ref={sidebarRef}
              key="sidebar-container"
              initial={isMobile ? { x: "-100%" } : false}
              animate={{ x: 0 }}
              exit={isMobile ? { x: "-100%" } : undefined}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 300, damping: 35 }
              }
              role={isMobile ? "dialog" : undefined}
              aria-modal={isMobile ? true : undefined}
              aria-label={isMobile ? "Workspace navigation" : undefined}
              tabIndex={isMobile ? -1 : undefined}
              className={cn(
                "z-50 flex-shrink-0",
                isMobile
                  ? "fixed inset-y-0 left-0 w-64 lg:hidden"
                  : "hidden h-full self-start overflow-hidden lg:block",
              )}
              style={{ willChange: "transform, width" }}
            >
              <Sidebar type={type} onMobileClose={handleSidebarClose} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <main
            className={cn(
              "min-h-0 flex-1 overflow-y-auto",
              "px-3 py-4 xs:px-4 xs:py-5 sm:px-5 sm:py-6 md:px-6 md:py-7 lg:px-7 lg:py-7 xl:px-9 xl:py-8",
            )}
          >
            <div
              className={cn(
                "mx-auto flex w-full max-w-[1440px] flex-col",
                "gap-4 xs:gap-5 sm:gap-5 md:gap-6",
              )}
            >
              {type === "admin" ? <RecentContextBar /> : null}
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
