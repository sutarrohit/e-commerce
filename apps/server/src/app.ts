import createApp from "./lib/create-app.js";
import { configureOpenAPI } from "./lib/configure-open-api.js";
import cartRoutes from "./routes/cart/index.js";
import checkoutRoutes from "./routes/checkout/index.js";
import adminRoutes from "./routes/admin/index.js";
import productRoutes from "./routes/product/index.js";
import userRoutes from "./routes/user/index.js";

const app = createApp();
configureOpenAPI(app);

// Mount once with full paths preserved in types
const routes = app
  .route("/api/v1", cartRoutes)
  .route("/api/v1", checkoutRoutes)
  .route("/api/v1", adminRoutes)
  .route("/api/v1", productRoutes)
  .route("/api/v1", userRoutes);
export type AppType = typeof routes;
export default routes;
