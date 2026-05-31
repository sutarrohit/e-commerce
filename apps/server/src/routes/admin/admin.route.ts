import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import {
  GenerateDiscountRequestSchema,
  GenerateDiscountResponseSchema,
  AdminSummaryResponseSchema,
} from "@/types/types.js";

export const generateDiscountRoute = createRoute({
  tags: ["Admin"],
  method: "post",
  path: "/admin/generate-discount",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GenerateDiscountRequestSchema,
        },
      },
    },
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      GenerateDiscountResponseSchema,
      "Discount code generated",
    ),
    [HttpStatusCodes.BAD_REQUEST]: {
      description: "Condition not met or invalid request",
    },
  },
});

export const adminSummaryRoute = createRoute({
  tags: ["Admin"],
  method: "get",
  path: "/admin/summary",
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      AdminSummaryResponseSchema,
      "Admin summary",
    ),
  },
});

export type generateDiscountRoute = typeof generateDiscountRoute;
export type adminSummaryRoute = typeof adminSummaryRoute;
