import type { ReactNode } from "react";

export const metadata = {
  title: "VMS Admin",
  description: "Property and estate operations",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
