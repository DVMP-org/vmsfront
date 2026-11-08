"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Header } from "./Header";
import { RecentContextBar } from "./RecentContextBar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
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
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={handleSidebarClose}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {(isMobile ? sidebarOpen : true) && (
            <motion.div
              key="sidebar-container"
              initial={isMobile ? { x: "-100%" } : false}
              animate={{ x: 0 }}
              exit={isMobile ? { x: "-100%" } : undefined}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
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
