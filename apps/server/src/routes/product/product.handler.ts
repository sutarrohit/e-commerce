import { AppRouteHandler } from "../../lib/types.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { listProductsRoute, getProductRoute } from "./product.route.js";
import { listProducts, getProductById } from "@/services/product.service.js";

export const listProductsHandler: AppRouteHandler<
  typeof listProductsRoute
> = async (c) => {
  const { page, limit } = c.req.valid("query");
  const result = await listProducts(page, limit);
  return c.json(result, HttpStatusCodes.OK);
};

export const getProductHandler: AppRouteHandler<
  typeof getProductRoute
> = async (c) => {
  const { id } = c.req.valid("param");
  const product = await getProductById(id);
  return c.json(product, HttpStatusCodes.OK);
};
