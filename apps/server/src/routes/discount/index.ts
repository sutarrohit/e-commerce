import { createRouter } from "../../lib/create-app.js";
import * as handlers from "./discount.handler.js";
import * as routes from "./discount.route.js";

const discountRoutes = createRouter().openapi(
  routes.validateDiscountRoute,
  handlers.validateDiscountHandler,
);

export default discountRoutes;
