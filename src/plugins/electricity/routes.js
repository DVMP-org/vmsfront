import dynamic from "next/dynamic";

// Admin-specific components
const AdminElectricityDashboard = dynamic(
  () => import("./pages/admin/ElectricityHome"),
);
const AdminMetersPage = dynamic(() => import("./pages/admin/MetersPage"));
const AdminPurchasesPage = dynamic(() => import("./pages/admin/PurchasesPage"));

// Party (place workspace) pages
const ElectricityPartyPage = dynamic(
  () => import("./pages/party/ElectricityPartyPage"),
);

// Admin-specific routes
const adminRoutes = [
  {
    path: "/admin",
    component: AdminElectricityDashboard,
    title: "Dashboard",
    icon: "zap",
  },
  {
    path: "/admin/meters",
    component: AdminMetersPage,
    title: "Meters",
    icon: "zap",
  },
  {
    path: "/admin/purchases",
    component: AdminPurchasesPage,
    title: "Purchases",
    icon: "credit-card",
  },
];

// Party routes render inside the place workspace shell
const residentRoutes = [
  {
    path: "/",
    component: ElectricityPartyPage,
    title: "Electricity",
    icon: "zap",
  },
];

const pluginRoutes = {
  adminRoutes,
  residentRoutes,
};

export default pluginRoutes;
