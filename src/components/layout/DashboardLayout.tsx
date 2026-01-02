"use client";

import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { useRequireResidentOnboarding } from "@/hooks/use-onboarding-guard";

interface DashboardLayoutProps {
  children: React.ReactNode;
  type: "resident" | "admin";
}

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
          // Base state: Hidden on mobile (translated left), Visible on desktop (reset transform)
          "-translate-x-full lg:translate-x-0",
          // Mobile Open state: Visible (slide in)
          sidebarOpen && "translate-x-0"
        )}
      >
        <Sidebar type={type} onMobileClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col w-full lg:w-auto min-w-0">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} type={type} />
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
