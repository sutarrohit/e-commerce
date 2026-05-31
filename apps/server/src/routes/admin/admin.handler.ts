import { AppRouteHandler } from "../../lib/types.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { generateDiscountRoute, adminSummaryRoute } from "./admin.route.js";
import {
  generateDiscountForNthOrder,
  getAdminSummary,
} from "@/services/admin.service.js";

export const generateDiscountHandler: AppRouteHandler<
  typeof generateDiscountRoute
> = async (c) => {
  const { userId } = c.req.valid("json");
  const discount = await generateDiscountForNthOrder(userId);
  return c.json(discount, HttpStatusCodes.CREATED);
};

export const adminSummaryHandler: AppRouteHandler<
  typeof adminSummaryRoute
> = async (c) => {
  const summary = await getAdminSummary();
  return c.json(summary, HttpStatusCodes.OK);
};
