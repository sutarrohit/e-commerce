import { createRouter } from "../../lib/create-app.js";

import * as handlers from "./product.handler.js";
import * as routes from "./product.route.js";

const productRoutes = createRouter().openapi(
  routes.listProductsRoute,
  handlers.listProductsHandler,
);

export default productRoutes;
