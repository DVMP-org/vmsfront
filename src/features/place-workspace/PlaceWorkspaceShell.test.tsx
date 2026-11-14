import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { PlaceWorkspaceShell } from "./PlaceWorkspaceShell";
const m=vi.hoisted(()=>({context:vi.fn(),push:vi.fn(),select:vi.fn()}));
vi.mock("next/navigation",()=>({useParams:()=>({placeId:"home"}),usePathname:()=>"/workspace/home/",useRouter:()=>({push:m.push})}));
vi.mock("@/components/layout/Header", () => ({ Header: ({ onMenuClick }: { onMenuClick?: () => void }) => <button onClick={onMenuClick}>Open workspace menu</button> }));
vi.mock("@/hooks/use-auth", () => ({ useVerifyToken: () => ({ data: { workspaces: [{ id: "relationship-home", role: "resident", place: { id: "home", name: "My home", kind: "unit" } }, { id: "relationship-office", role: "tenant", place: { id: "office", name: "My office", kind: "space" } }], site_workspaces: [{ assignment_id: "assignment", role: "site_admin", site: { id: "site", name: "Sunset Estate" }, effective_permissions: [] }] } }) }));
vi.mock("@/store/auth-store",()=>({useAuthStore:(selector:any)=>selector({user:{id:"user"}})}));
vi.mock("@/store/app-store",()=>({useAppStore:(selector:any)=>selector({organization:{id:"org"},setSelectedSite:m.select})}));
vi.mock("./api",()=>({placeWorkspaceApi:{context:m.context}}));
beforeEach(()=>{vi.resetAllMocks();m.context.mockResolvedValue({place:{id:"home",name:"My home"},party:{id:"party"},effective_use_case:"residential",modules:["access_control","people","billing"],is_place_admin:false});});
function mount(){render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><PlaceWorkspaceShell><h1>My dashboard</h1></PlaceWorkspaceShell></QueryClientProvider>);}
it("renders a Place sidebar, active page, and the workspace switcher", async () => {
    mount(); const navigation = await screen.findByRole("navigation", { name: "Place workspace navigation" }); expect(navigation).toBeVisible(); expect(await screen.findByRole("link", { name: "Home overview" })).toHaveAttribute("aria-current", "page"); expect(screen.queryByRole("link", { name: "Place settings" })).toBeNull();
    fireEvent.click(screen.getAllByRole("button", { name: /My home/ })[0]); expect(screen.getByText("Sunset Estate management")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /My office/ })); expect(m.push).toHaveBeenCalledWith("/workspace/office"); expect(m.select).toHaveBeenCalledWith({ id: "office", name: "My office" });
});
it("keeps the shell mounted while Place context resolves", () => {
    m.context.mockImplementation(() => new Promise(() => { })); mount(); expect(screen.getByRole("navigation", { name: "Place workspace navigation" })).toBeVisible(); expect(screen.getByRole("status")).toBeInTheDocument(); expect(screen.queryByText("My dashboard")).toBeNull();
});
it("opens the mobile navigation as a dialog",async()=>{
 mount();await screen.findByText("My dashboard");fireEvent.click(screen.getByRole("button",{name:"Open workspace menu"}));expect(await screen.findByRole("dialog",{name:"Place workspace"})).toBeVisible();
});
it("shows an API membership denial without rendering workspace content",async()=>{
 m.context.mockRejectedValue(new Error("An active Party relationship to this Place is required"));mount();expect(await screen.findByRole("alert")).toHaveTextContent("Party relationship");expect(screen.queryByText("My dashboard")).toBeNull();expect(m.push).not.toHaveBeenCalled();
});
