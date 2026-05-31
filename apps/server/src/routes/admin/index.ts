import { createRouter } from "../../lib/create-app.js";

import * as handlers from "./admin.handler.js";
import * as routes from "./admin.route.js";

const adminRoutes = createRouter()
  .openapi(routes.generateDiscountRoute, handlers.generateDiscountHandler)
  .openapi(routes.adminSummaryRoute, handlers.adminSummaryHandler);

export default adminRoutes;
