import dynamic from "next/dynamic";

// Admin-specific components
const CameraDashboard = dynamic(() => import("./pages/admin/CameraHome"));
const CameraSettings = dynamic(() => import("./pages/admin/CameraSettings"));

// Legacy routes (for backward compatibility - applies to both admin and resident)
const routes = [];

// Admin-specific routes
const adminRoutes = [
  {
    path: "/admin",
    component: CameraDashboard,
    title: "Dashboard",
    icon: "video",
  },
  {
    path: "/admin/settings",
    component: CameraSettings,
    title: "Camera Settings",
    icon: "sliders",
  },
];

// Resident-specific routes
const residentRoutes = [];

export default {
  routes, // Legacy: for backward compatibility
  adminRoutes,
  residentRoutes,
};
