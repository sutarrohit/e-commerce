import { prisma } from "@/lib/prisma.js";
import { ApiError } from "@/lib/app-error.js";
import { generateDiscountCode } from "@/lib/discount-code.js";
import { BAD_REQUEST } from "stoker/http-status-codes";
import { BAD_REQUEST as BAD_REQUEST_PHRASE } from "stoker/http-status-phrases";

const DISCOUNT_CONFIG = {
  nthOrder: 5,
  discountPercent: 10
};

export async function generateDiscountForNthOrder(userId: string) {
  const userCounter = await prisma.userOrderCounter.findUnique({
    where: { userId }
  });

  const userCount = userCounter?.count ?? 0;

  if (userCount === 0 || userCount % DISCOUNT_CONFIG.nthOrder !== 0) {
    throw new ApiError(
      BAD_REQUEST,
      BAD_REQUEST_PHRASE,
      `Discount condition not met. User's order count (${userCount}) is not a multiple of ${DISCOUNT_CONFIG.nthOrder}`
    );
  }

  return await generateDiscountCode(userId);
}

export async function getAdminSummary() {
  const [orders, discountCodes, orderCounter] = await Promise.all([
    prisma.order.findMany({ include: { items: true } }),
    prisma.discountCode.findMany(),
    prisma.orderCounter.findUnique({ where: { id: 1 } })
  ]);

  const totalItemsPurchased = orders.reduce(
    (sum, order) => sum + order.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  const totalDiscountCodes = discountCodes.length;
  const totalDiscountsGiven = orders.reduce((sum, order) => sum + order.discountAmount, 0);

  return {
    totalItemsPurchased,
    totalRevenue,
    totalDiscountCodes,
    totalDiscountsGiven,
    totalOrders: orderCounter?.count ?? 0
  };
}
