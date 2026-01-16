import {
    Home,
    Users,
    CreditCard,
    Building2,
    BarChart3,
    Settings,
    Shield,
    Scan,
    Activity,
    Receipt,
    FolderTree,
    Puzzle,
    UserCog,
    MessageSquare,
    type LucideIcon,
} from "lucide-react";

export interface AdminRoute {
    href: string;
    label: string;
    icon: LucideIcon;
    permission?: string | string[];
    children?: AdminRoute[];
}

export const adminLinks: AdminRoute[] = [
    { href: "/admin", label: "Dashboard", icon: Home },
    { href: "/admin/gate", label: "Gate Console", icon: Scan, permission: "gate_passes.console" },
    { href: "/admin/gate/passes", label: "Gate Passes", icon: CreditCard, permission: "gate_passes.list" },
    { href: "/admin/gate/events", label: "Gate Events", icon: Activity, permission: "gate_passes.list" },
    { href: "/admin/houses", label: "Houses", icon: Building2, permission: "houses.list" },
    { href: "/admin/house-groups", label: "House Groups", icon: FolderTree, permission: "house_groups.list" },
    {
        href: "/admin/dues",
        label: "Dues",
        icon: Receipt,
        permission: ["dues.list", "dues.houses"],
        children: [
            { href: "/admin/dues", label: "All Dues", icon: Receipt, permission: "dues.list" },
            { href: "/admin/dues/houses", label: "House Dues", icon: Building2, permission: "dues.houses" },
        ],
    },
    { href: "/admin/residents", label: "Residents", icon: Users, permission: "residents.list" },
    {
        href: "#",
        label: "Admins",
        icon: UserCog,
        permission: ["admins.list", "roles.list"],
        children: [
            { href: "/admin/admins", label: "Admins", icon: UserCog, permission: "admins.list" },
            { href: "/admin/admins/roles", label: "Roles", icon: Shield, permission: "roles.list" },
        ],
    },
    { href: "/admin/forums", label: "Forums", icon: MessageSquare, permission: "forum_posts.list" },
    { href: "/admin/settings", label: "Settings", icon: Settings, permission: ["branding.list", 'settings.show'] },
    { href: "/admin/plugins", label: "Plugins", icon: Puzzle, permission: "plugins.list" },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "analytics.summary" },
    { href: "/admin/profile", label: "Profile", icon: UserCog },
];
