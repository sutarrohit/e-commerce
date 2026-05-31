import {
  CheckoutRequestSchema,
  CheckoutResponseSchema,
} from "@/types/types.js";
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

export const checkoutRoute = createRoute({
  tags: ["Checkout"],
  method: "post",
  path: "/checkout",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CheckoutRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      CheckoutResponseSchema,
      "Order placed",
    ),
  },
});

export type checkoutRoute = typeof checkoutRoute;
