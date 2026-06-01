import { AppRouteHandler } from "../../lib/types.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { validateDiscountRoute } from "./discount.route.js";
import { validateDiscount } from "@/services/discount.service.js";

export const validateDiscountHandler: AppRouteHandler<
  typeof validateDiscountRoute
> = async (c) => {
  const { userId, discountCode, subtotal } = c.req.valid("json");
  const result = await validateDiscount(userId, discountCode, subtotal);
  return c.json(result, HttpStatusCodes.OK);
};
