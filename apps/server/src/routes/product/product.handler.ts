import { AppRouteHandler } from "../../lib/types.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { listProductsRoute } from "./product.route.js";
import { listProducts } from "@/services/product.service.js";

export const listProductsHandler: AppRouteHandler<
  typeof listProductsRoute
> = async (c) => {
  const { page, limit } = c.req.valid("query");
  const result = await listProducts(page, limit);
  return c.json(result, HttpStatusCodes.OK);
};
