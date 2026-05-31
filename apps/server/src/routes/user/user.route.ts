import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { CreateUserResponseSchema } from "@/types/types.js";

export const createUserRoute = createRoute({
  tags: ["Users"],
  method: "post",
  path: "/users",
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      CreateUserResponseSchema,
      "User created",
    ),
  },
});

export type createUserRoute = typeof createUserRoute;
