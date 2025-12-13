import manifest from "./manifest.json";
import routes from "./routes";

export default {
    manifest,
    routes: routes.routes, // Legacy routes for backward compatibility
    adminRoutes: routes.adminRoutes,
    residentRoutes: routes.residentRoutes
};
