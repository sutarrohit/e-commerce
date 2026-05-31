import { AppRouteHandler } from "../../lib/types.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { addToCartRoute } from "./cart.route.js";
import { addToCart } from "@/services/cart.service.js";

export const addToCartHandler: AppRouteHandler<addToCartRoute> = async (c) => {
  const data = c.req.valid("json");
  const cart = await addToCart(data);
  return c.json(cart, HttpStatusCodes.CREATED);
};
