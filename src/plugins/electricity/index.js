import manifest from "./manifest.json";
import routes from "./routes";

const electricityPlugin = {
    manifest,
    adminRoutes: routes.adminRoutes,
    residentRoutes: routes.residentRoutes
};

export default electricityPlugin;
