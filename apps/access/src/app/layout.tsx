import type { ReactNode } from "react";

export const metadata = {
  title: "VMS Access",
  description: "Gate, visitor and access-control operations",
};

export default function AccessLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
