import { AppRouteHandler } from "../../lib/types.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { createUserRoute } from "./user.route.js";
import { createUser } from "@/services/user.service.js";

export const createUserHandler: AppRouteHandler<
  typeof createUserRoute
> = async (c) => {
  const result = await createUser();
  return c.json(result, HttpStatusCodes.CREATED);
};
