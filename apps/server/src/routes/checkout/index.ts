import { createRouter } from "../../lib/create-app.js";

import * as handlers from "./checkout.handler.js";
import * as routes from "./checkout.route.js";

const checkoutRoutes = createRouter().openapi(
  routes.checkoutRoute,
  handlers.checkoutHandler,
);

export default checkoutRoutes;
