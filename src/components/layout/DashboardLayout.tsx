"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRequireResidentOnboarding } from "@/hooks/use-onboarding-guard";
import { useRequireEmailVerification } from "@/hooks/use-email-verification-guard";

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
  useRequireResidentOnboarding(type === "resident");

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
    setSidebarOpen(prev => !prev);
  }, []);

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Mobile Overlay */}
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

      {/* Sidebar */}
      {isMobile ? (
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
            >
              <Sidebar type={type} onMobileClose={handleSidebarClose} />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <div className="hidden lg:block">
          <Sidebar type={type} onMobileClose={handleSidebarClose} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col w-full lg:w-auto min-w-0">
        <Header onMenuClick={handleMenuClick} sidebarOpen={sidebarOpen} type={type} />
        <main
          className={cn(
            "flex-1 overflow-y-auto",
            "px-3 py-4 xs:px-4 xs:py-5 sm:px-5 sm:py-6 md:px-6 md:py-7 lg:px-8 lg:py-8 xl:px-12"
          )}
        >
          <div
            className={cn(
              "mx-auto flex w-full max-w-6xl flex-col",
              "gap-4 xs:gap-5 sm:gap-6 md:gap-7 lg:gap-8"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
