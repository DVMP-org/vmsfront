import type { ReactNode } from "react";
import "@vms/ui/tokens.css";

export const metadata = {
  title: "VMS Identity",
  description: "Authentication and organization onboarding",
};

export default function IdentityLayout({ children }: { children: ReactNode }) {
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
