import { AddToCartSchema, CartSchema } from "@/types/types.js";
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

export const addToCartRoute = createRoute({
  tags: ["Cart"],
  method: "post",
  path: "/add/items",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AddToCartSchema
        }
      }
    }
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(CartSchema, "Cart updated")
  }
});

export type addToCartRoute = typeof addToCartRoute;
