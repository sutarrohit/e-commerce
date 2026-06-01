import {
  ValidateDiscountRequestSchema,
  ValidateDiscountResponseSchema,
} from "@/types/types.js";
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";

export const validateDiscountRoute = createRoute({
  tags: ["Discount"],
  method: "post",
  path: "/discount/validate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ValidateDiscountRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      ValidateDiscountResponseSchema,
      "Discount validation result",
    ),
  },
});

export type validateDiscountRoute = typeof validateDiscountRoute;
