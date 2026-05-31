import { AppRouteHandler } from "../../lib/types.js";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { addToCartRoute, getCartRoute } from "./cart.route.js";
import { addToCart, getCartByUserId } from "@/services/cart.service.js";

export const addToCartHandler: AppRouteHandler<addToCartRoute> = async (c) => {
  const data = c.req.valid("json");
  const cart = await addToCart(data);
  return c.json(cart, HttpStatusCodes.CREATED);
};

export const getCartHandler: AppRouteHandler<getCartRoute> = async (c) => {
  const { userId } = c.req.valid("param");
  const cart = await getCartByUserId(userId);
  return c.json(cart, HttpStatusCodes.OK);
};
