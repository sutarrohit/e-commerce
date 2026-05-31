import {
  AddToCartSchema,
  CartSchema,
  CartParamsSchema,
} from "@/types/types.js";
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

const errorResponse = {
  description: "Cart not found",
};

export const addToCartRoute = createRoute({
  tags: ["Cart"],
  method: "post",
  path: "/add/items",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AddToCartSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(CartSchema, "Cart updated"),
  },
});

export const getCartRoute = createRoute({
  tags: ["Cart"],
  method: "get",
  path: "/cart/{userId}",
  request: {
    params: CartParamsSchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(CartSchema, "Cart details"),
    [HttpStatusCodes.NOT_FOUND]: errorResponse,
  },
});

export type addToCartRoute = typeof addToCartRoute;
export type getCartRoute = typeof getCartRoute;
