import type { ReactNode } from "react";

export const metadata = {
  title: "VMS Workspace",
  description: "Resident, owner and personal staff workspace",
};

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
