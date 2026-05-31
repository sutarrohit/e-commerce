import createApp from "./lib/create-app.js";
import { configureOpenAPI } from "./lib/configure-open-api.js";
import cartRoutes from "./routes/cart/index.js";

const app = createApp();
configureOpenAPI(app);

// Mount once with full paths preserved in types
const routes = app.route("/api/v1", cartRoutes);
export type AppType = typeof routes;
export default routes;
