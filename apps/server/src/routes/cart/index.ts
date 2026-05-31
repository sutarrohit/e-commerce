import { createRouter } from "../../lib/create-app.js";

import * as handlers from "./cart.handler.js";
import * as routes from "./cart.route.js";

const cartRoutes = createRouter().openapi(routes.addToCartRoute, handlers.addToCartHandler);

export default cartRoutes;
