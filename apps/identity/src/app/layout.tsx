import type { ReactNode } from "react";

export const metadata = {
  title: "VMS Identity",
  description: "Authentication and organization onboarding",
};

export default function IdentityLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
