import { prisma } from "@/lib/prisma.js";
import { randomUUID } from "crypto";

const DISCOUNT_CONFIG = {
  nthOrder: 5,
  discountPercent: 10
};

function generateCode(): string {
  return randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase();
}

export async function generateDiscountCode(userId: string) {
  const code = generateCode();

  return await prisma.discountCode.create({
    data: {
      code,
      discountPercent: DISCOUNT_CONFIG.discountPercent,
      userId
    }
  });
}
