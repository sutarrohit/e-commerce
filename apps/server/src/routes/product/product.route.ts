import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import {
  ProductListRequestSchema,
  ProductListResponseSchema,
} from "@/types/types.js";

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

export type listProductsRoute = typeof listProductsRoute;
