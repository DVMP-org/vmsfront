import dynamic from "next/dynamic";

// Admin-specific components
const AdminElectricityDashboard = dynamic(() => import("./pages/admin/ElectricityHome"));
const AdminMetersPage = dynamic(() => import("./pages/admin/MetersPage"));
const AdminPurchasesPage = dynamic(() => import("./pages/admin/PurchasesPage"));


// Resident-specific components
const ResidentElectricityDashboard = dynamic(() => import("./pages/resident/ElectricityHome"));
const ResidentPurchaseMeter = dynamic(() => import("./pages/resident/PurchaseMeter"));

// Legacy routes (for backward compatibility - applies to both admin and resident)
const routes = [];

// Admin-specific routes
const adminRoutes = [
    {
        path: "/admin",
        component: AdminElectricityDashboard,
        title: "Dashboard",
        icon: "zap"
    },
    {
        path: "/admin/meters",
        component: AdminMetersPage,
        title: "Meters",
        icon: "zap"
    },
    {
        path: "/admin/purchases",
        component: AdminPurchasesPage,
        title: "Purchases",
        icon: "credit-card"
    },
];

// Resident-specific routes
const residentRoutes = [
    {
        path: "/",
        component: ResidentElectricityDashboard,
        title: "Dashboard",
        icon: "zap"
    },
    {
        path: "/purchase",
        component: ResidentPurchaseMeter,
        title: "Purchase",
        icon: "credit-card"
    }
];

export default {
    routes, // Legacy: for backward compatibility
    adminRoutes,
    residentRoutes
};
