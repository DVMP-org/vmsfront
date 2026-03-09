import {
    Home,
    Users,
    CreditCard,
    Building2,
    BarChart3,
    Settings,
    Shield,
    Scan,
    Puzzle,
    UserCog,
    type LucideIcon,
    DoorOpen,
    Activity,
    FolderTree,
    Briefcase,
    UserCheck,
    Receipt,
    MessageSquare,
    AlertTriangle,
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
    {
        href: "/admin/gate",
        label: "Gate",
        icon: Scan,
        permission: ["gate_passes.console", "gate_passes.list", "gates.list"],
        children: [
            { href: "/admin/gate?tab=console", label: "Gate Console", icon: Scan, permission: "gate_passes.console" },
            { href: "/admin/gate?tab=passes", label: "Passes", icon: CreditCard, permission: "gate_passes.list" },
            { href: "/admin/gate?tab=events", label: "Events", icon: Activity, permission: "gate_passes.list" },
            { href: "/admin/gate?tab=gates", label: "Gates", icon: DoorOpen, permission: "gates.list" },
        ],
    },
    {
        href: "/admin/residencies",
        label: "Residencies",
        icon: Building2,
        permission: [
            "residencies.list",
            "residency_groups.list",
            "residents.list",
            "visitors.list",
            "dues.list",
            "forum_posts.list",
            "emergencies.list",
        ],
        children: [
            { href: "/admin/residencies?tab=residencies", label: "Residencies", icon: Building2, permission: "residencies.list" },
            { href: "/admin/residencies?tab=groups", label: "Groups", icon: FolderTree, permission: "residency_groups.list" },
            { href: "/admin/residencies?tab=residents", label: "Residents", icon: Users, permission: "residents.list" },
            { href: "/admin/residencies?tab=staff", label: "Staff", icon: Briefcase, permission: "residents.list" },
            { href: "/admin/residencies?tab=visitors", label: "Visitors", icon: UserCheck, permission: "visitors.list" },
            { href: "/admin/residencies?tab=dues", label: "Dues", icon: Receipt, permission: "dues.list" },
            { href: "/admin/residencies?tab=forums", label: "Forums", icon: MessageSquare, permission: "forum_posts.list" },
            { href: "/admin/residencies?tab=emergencies", label: "Emergencies", icon: AlertTriangle, permission: "emergencies.list" },
        ],
    },
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
    { href: "/admin/transactions", label: "Transactions", icon: CreditCard, permission: "transactions.list" },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, permission: "analytics.summary" },
    { href: "/admin/settings", label: "Settings", icon: Settings, permission: ["branding.list", "settings.show"] },
    { href: "/admin/plugins", label: "Plugins", icon: Puzzle, permission: "plugins.list" },
    { href: "/admin/profile", label: "Profile", icon: UserCog },
];
