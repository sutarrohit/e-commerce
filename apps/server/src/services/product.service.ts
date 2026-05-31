import { prisma } from "@/lib/prisma.js";
import { ApiError } from "@/lib/app-error.js";
import { NOT_FOUND } from "stoker/http-status-codes";
import { NOT_FOUND as NOT_FOUND_PHRASE } from "stoker/http-status-phrases";

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product)
    throw new ApiError(NOT_FOUND, NOT_FOUND_PHRASE, "Product not found");

  return product;
}

export async function listProducts(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count(),
  ]);

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
