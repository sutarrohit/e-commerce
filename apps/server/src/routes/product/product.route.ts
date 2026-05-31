import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ProductListRequestSchema,
  ProductListResponseSchema,
  ProductSchema,
  ProductParamsSchema,
} from "@/types/types.js";

const errorResponse = {
  description: "Product not found",
};

export const listProductsRoute = createRoute({
  tags: ["Products"],
  method: "get",
  path: "/products",
  request: {
    query: ProductListRequestSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ProductListResponseSchema,
      "Paginated list of products",
    ),
  },
});

export const getProductRoute = createRoute({
  tags: ["Products"],
  method: "get",
  path: "/products/{id}",
  request: {
    params: ProductParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(ProductSchema, "Product details"),
    [HttpStatusCodes.NOT_FOUND]: errorResponse,
  },
});

export type listProductsRoute = typeof listProductsRoute;
export type getProductRoute = typeof getProductRoute;
