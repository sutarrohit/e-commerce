import { prisma } from "@/lib/prisma.js";
import { ApiError } from "@/lib/app-error.js";

import {
  BAD_REQUEST,
  CONFLICT,
  FORBIDDEN,
  NOT_FOUND,
} from "stoker/http-status-codes";
import {
  BAD_REQUEST as BAD_REQUEST_PHRASE,
  CONFLICT as CONFLICT_PHRASE,
  FORBIDDEN as FORBIDDEN_PHRASE,
  NOT_FOUND as NOT_FOUND_PHRASE,
} from "stoker/http-status-phrases";

import { CheckoutResponse } from "@/types/types.js";

export async function checkout(
  userId: string,
  discountCode?: string,
): Promise<CheckoutResponse> {
  // get cart with items
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!cart) throw new ApiError(NOT_FOUND, NOT_FOUND_PHRASE, "Cart not found");
  if (cart.items.length === 0)
    throw new ApiError(BAD_REQUEST, BAD_REQUEST_PHRASE, "Cart is empty");

  // calculate subtotal
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // validate discount code if provided
  let discountAmount = 0;
  let validatedCode: string | undefined;

  if (discountCode) {
    const discount = await prisma.discountCode.findUnique({
      where: { code: discountCode },
    });

    if (!discount)
      throw new ApiError(NOT_FOUND, NOT_FOUND_PHRASE, "Invalid discount code");
    if (discount.isUsed)
      throw new ApiError(
        CONFLICT,
        CONFLICT_PHRASE,
        "Discount code already used",
      );
    if (discount.userId !== userId)
      throw new ApiError(
        FORBIDDEN,
        FORBIDDEN_PHRASE,
        "Discount code does not belong to you",
      );

    discountAmount = Math.floor((subtotal * discount.discountPercent) / 100);
    validatedCode = discountCode;
  }

  const total = subtotal - discountAmount;

  // run everything in a transaction — all or nothing
  const result = await prisma.$transaction(async (tx) => {
    // Lock product rows for the duration of this transaction
    for (const item of cart.items) {
      await tx.$queryRaw`SELECT * FROM "Product" WHERE id = ${item.productId} FOR UPDATE`;
    }

    // increment global order counter → get display orderNumber
    const counter = await tx.orderCounter.upsert({
      where: { id: 1 },
      create: { id: 1, count: 1 },
      update: { count: { increment: 1 } },
    });

    // increment per-user order counter → for discount eligibility
    const userCounter = await tx.userOrderCounter.upsert({
      where: { userId },
      create: { userId, count: 1 },
      update: { count: { increment: 1 } },
    });

    // create order + orderItems in one shot
    const order = await tx.order.create({
      data: {
        userId,
        subtotal,
        discountCode: validatedCode ?? null,
        discountAmount,
        total,
        orderNumber: counter.count,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // mark discount code as used
    if (validatedCode) {
      await tx.discountCode.update({
        where: { code: validatedCode },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });
    }

    // clear cart → cascades CartItems automatically
    await tx.cart.delete({ where: { userId } });

    // return both order and userCounter so we can check discount outside transaction
    return { order, userCount: userCounter.count };
  });

  // // check if this user's nth order → auto generate coupon
  // let earnedDiscountCode: string | undefined;
  //
  // if (result.userCount % DISCOUNT_CONFIG.nthOrder === 0) {
  //   const earned = await generateDiscountCode(userId);
  //   earnedDiscountCode = earned.code;
  // }
  //
  // //return order + earned coupon if any
  // return {
  //   order: result.order,
  //   ...(earnedDiscountCode && {
  //     earnedDiscountCode,
  //     message: `Congrats! You earned a ${DISCOUNT_CONFIG.discountPercent}% discount code: ${earnedDiscountCode}`
  //   })
  // };

  return { order: result.order };
}
