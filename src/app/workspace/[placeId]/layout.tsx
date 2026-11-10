import { PlaceWorkspaceShell } from "@/features/place-workspace/PlaceWorkspaceShell";
export default function PlaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlaceWorkspaceShell>{children}</PlaceWorkspaceShell>;
}
