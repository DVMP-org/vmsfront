import manifest from "./manifest.json";
import routes from "./routes";

const cameraPlugin = {
    manifest,
    adminRoutes: routes.adminRoutes,
    residentRoutes: routes.residentRoutes
};

export default cameraPlugin;
