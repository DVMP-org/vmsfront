import type { ReactNode } from "react";
import "@vms/ui/tokens.css";

export const metadata = {
  title: "VMS Admin",
  description: "Property and estate operations",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "var(--vms-canvas)",
          color: "var(--vms-ink)",
          fontFamily: "var(--vms-font-interface)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
