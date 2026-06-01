import { prisma } from "@/lib/prisma.js";
import type { ValidateDiscountResponse } from "@/types/types.js";

export async function validateDiscount(
  userId: string,
  discountCode: string,
  subtotal: number,
): Promise<ValidateDiscountResponse> {
  const discount = await prisma.discountCode.findUnique({
    where: { code: discountCode },
  });

  if (!discount || discount.isUsed || discount.userId !== userId) {
    return {
      valid: false,
      discountPercent: 0,
      discountAmount: 0,
      total: subtotal,
    };
  }

  const discountAmount = Math.floor(
    (subtotal * discount.discountPercent) / 100,
  );
  return {
    valid: true,
    discountPercent: discount.discountPercent,
    discountAmount,
    total: subtotal - discountAmount,
  };
}
