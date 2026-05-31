import { AppRouteHandler } from "../../lib/types.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { checkoutRoute } from "./checkout.route.js";
import { checkout } from "@/services/checkout.service.js";

export const checkoutHandler: AppRouteHandler<checkoutRoute> = async (c) => {
  const { userId, discountCode } = c.req.valid("json");
  const result = await checkout(userId, discountCode);
  return c.json(result, HttpStatusCodes.CREATED);
};
