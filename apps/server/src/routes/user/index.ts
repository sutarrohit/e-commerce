import { createRouter } from "../../lib/create-app.js";

import * as handlers from "./user.handler.js";
import * as routes from "./user.route.js";

const userRoutes = createRouter().openapi(
  routes.createUserRoute,
  handlers.createUserHandler,
);

export default userRoutes;
