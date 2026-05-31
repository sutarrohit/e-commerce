import { prisma } from "@/lib/prisma.js";
import type { AddToCart, Cart } from "@/types/types.js";
import { ApiError } from "@/lib/app-error.js";

import { NOT_FOUND, INTERNAL_SERVER_ERROR } from "stoker/http-status-codes";
import {
  NOT_FOUND as NOT_FOUND_PHRASE,
  INTERNAL_SERVER_ERROR as INTERNAL_SERVER_ERROR_PHRASE,
} from "stoker/http-status-phrases";

export async function getCartByUserId(userId: string) {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!cart) throw new ApiError(NOT_FOUND, NOT_FOUND_PHRASE, "Cart not found");

  return cart;
}

export async function addToCart(data: AddToCart): Promise<Cart> {
  const product = await prisma.product.findUnique({
    where: { id: data.productId },
  });
  if (!product)
    throw new ApiError(
      NOT_FOUND,
      NOT_FOUND_PHRASE,
      `Product with id ${data.productId} not found`,
    );

  let cart = await prisma.cart.findUnique({
    where: { userId: data.userId },
    include: { items: true },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: data.userId },
      include: { items: true },
    });
  }

  const existingItem = cart.items.find(
    (item) => item.productId === data.productId,
  );

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: { increment: data.quantity } },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        name: product.name,
        price: product.price,
        quantity: data.quantity,
      },
    });
  }

  const updatedCart = await prisma.cart.findUnique({
    where: { userId: data.userId },
    include: { items: true },
  });

  if (!updatedCart) {
    throw new ApiError(
      INTERNAL_SERVER_ERROR,
      INTERNAL_SERVER_ERROR_PHRASE,
      "Failed to retrieve updated cart",
    );
  }

  return updatedCart;
}
