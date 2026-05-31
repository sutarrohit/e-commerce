import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  listProducts,
  getProductById,
} from "../../src/services/product.service.js";
import { ApiError } from "../../src/lib/app-error.js";

vi.mock("@/lib/prisma.js", () => ({
  prisma: {
    product: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  },
}));

import { prisma } from "../../src/lib/prisma.js";

const mockProducts = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Product A",
    price: 1999,
    image: "https://example.com/a.jpg",
    createdAt: new Date("2025-01-03"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    name: "Product B",
    price: 2999,
    image: "https://example.com/b.jpg",
    createdAt: new Date("2025-01-02"),
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    name: "Product C",
    price: 3999,
    image: "https://example.com/c.jpg",
    createdAt: new Date("2025-01-01"),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listProducts", () => {
  it("returns first page with default pagination", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(
      mockProducts.slice(0, 2),
    );
    vi.mocked(prisma.product.count).mockResolvedValue(3);

    const result = await listProducts(1, 2);

    expect(result).toEqual({
      products: mockProducts.slice(0, 2),
      total: 3,
      page: 1,
      limit: 2,
      totalPages: 2,
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 2,
      orderBy: { createdAt: "desc" },
    });
    expect(prisma.product.count).toHaveBeenCalled();
  });

  it("returns second page correctly", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts.slice(2));
    vi.mocked(prisma.product.count).mockResolvedValue(3);

    const result = await listProducts(2, 2);

    expect(result).toEqual({
      products: mockProducts.slice(2),
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      skip: 2,
      take: 2,
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns empty array when page exceeds total pages", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.count).mockResolvedValue(3);

    const result = await listProducts(10, 10);

    expect(result).toEqual({
      products: [],
      total: 3,
      page: 10,
      limit: 10,
      totalPages: 1,
    });
  });

  it("returns zero total when no products exist", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);
    vi.mocked(prisma.product.count).mockResolvedValue(0);

    const result = await listProducts(1, 10);

    expect(result).toEqual({
      products: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });
  });

  it("calculates totalPages correctly for exact division", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(prisma.product.count).mockResolvedValue(3);

    const result = await listProducts(1, 3);

    expect(result.totalPages).toBe(1);
  });

  it("calculates totalPages correctly for partial last page", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts);
    vi.mocked(prisma.product.count).mockResolvedValue(5);

    const result = await listProducts(1, 3);

    expect(result.totalPages).toBe(2);
  });
});

describe("getProductById", () => {
  it("returns product when found", async () => {
    const product = mockProducts[0];
    vi.mocked(prisma.product.findUnique).mockResolvedValue(product);

    const result = await getProductById(product.id);

    expect(result).toEqual(product);
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: product.id },
    });
  });

  it("throws 404 when product does not exist", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const result = getProductById("nonexistent-id");

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow("Product not found");
  });
});
