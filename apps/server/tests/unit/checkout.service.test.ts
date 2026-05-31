import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkout } from "../../src/services/checkout.service";
import { ApiError } from "../../src/lib/app-error.js";

vi.mock("@/lib/prisma.js", () => ({
  prisma: {
    cart: { findUnique: vi.fn(), delete: vi.fn() },
    discountCode: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    orderCounter: { update: vi.fn() },
    userOrderCounter: { upsert: vi.fn() },
    order: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../../src/lib/prisma.js";

const mockProduct = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Test Product",
  price: 1999,
  image: "https://example.com/product.jpg",
  createdAt: new Date("2025-01-01"),
};

const mockCartItem = {
  id: "660e8400-e29b-41d4-a716-446655440001",
  cartId: "770e8400-e29b-41d4-a716-446655440002",
  productId: mockProduct.id,
  name: mockProduct.name,
  price: mockProduct.price,
  quantity: 2,
  product: mockProduct,
};

const mockCart = {
  id: "770e8400-e29b-41d4-a716-446655440002",
  userId: "880e8400-e29b-41d4-a716-446655440003",
  items: [mockCartItem],
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
};

const mockOrder = {
  id: "990e8400-e29b-41d4-a716-446655440005",
  userId: mockCart.userId,
  subtotal: 3998,
  discountCode: null,
  discountAmount: 0,
  total: 3998,
  orderNumber: 1,
  items: [
    {
      id: "aa0e8400-e29b-41d4-a716-446655440006",
      orderId: "990e8400-e29b-41d4-a716-446655440005",
      productId: mockProduct.id,
      name: mockProduct.name,
      price: mockProduct.price,
      quantity: 2,
    },
  ],
  placedAt: new Date("2025-01-01"),
};

const mockDiscountCode = {
  code: "DISCOUNT10",
  discountPercent: 10,
  isUsed: false,
  createdAt: new Date("2025-01-01"),
  usedAt: null,
  userId: mockCart.userId,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkout", () => {
  it("throws 404 when cart does not exist", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(null);

    const result = checkout(mockCart.userId);

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow("Cart not found");
  });

  it("throws 400 when cart is empty", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue({
      id: mockCart.id,
      userId: mockCart.userId,
      items: [],
      createdAt: mockCart.createdAt,
      updatedAt: mockCart.updatedAt,
    } as any);

    const result = checkout(mockCart.userId);

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow("Cart is empty");
  });

  it("throws 404 when discount code is invalid", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(null);

    const result = checkout(mockCart.userId, "INVALID");

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow("Invalid discount code");
  });

  it("throws 409 when discount code is already used", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue({
      ...mockDiscountCode,
      isUsed: true,
    });

    const result = checkout(mockCart.userId, "USEDCODE");

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow("Discount code already used");
  });

  it("throws 403 when discount code belongs to another user", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue({
      ...mockDiscountCode,
      userId: "other-user-id",
    });

    const result = checkout(mockCart.userId, "OTHERUSER");

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow(
      "Discount code does not belong to you",
    );
  });

  it("completes checkout successfully without discount code", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);

    const mockTx = {
      $queryRaw: vi.fn(),
      orderCounter: {
        upsert: vi.fn().mockResolvedValue({ id: 1, count: 1 }),
      },
      userOrderCounter: {
        upsert: vi
          .fn()
          .mockResolvedValue({ userId: mockCart.userId, count: 1 }),
      },
      order: {
        create: vi.fn().mockResolvedValue(mockOrder),
      },
      discountCode: {
        update: vi.fn(),
      },
      cart: {
        delete: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      return await fn(mockTx);
    });

    const result = await checkout(mockCart.userId);

    expect(result.order).toEqual(mockOrder);
    expect(mockTx.orderCounter.upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      create: { id: 1, count: 1 },
      update: { count: { increment: 1 } },
    });
    expect(mockTx.userOrderCounter.upsert).toHaveBeenCalledWith({
      where: { userId: mockCart.userId },
      create: { userId: mockCart.userId, count: 1 },
      update: { count: { increment: 1 } },
    });
    expect(mockTx.cart.delete).toHaveBeenCalledWith({
      where: { userId: mockCart.userId },
    });
  });

  it("applies valid discount code and reduces total", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);
    vi.mocked(prisma.discountCode.findUnique).mockResolvedValue(
      mockDiscountCode,
    );

    const discountAmount = Math.floor(
      (mockCart.items[0].price * mockCart.items[0].quantity * 10) / 100,
    );
    const discountedOrder = {
      ...mockOrder,
      discountCode: mockDiscountCode.code,
      discountAmount,
      total: mockOrder.subtotal - discountAmount,
    };

    const mockTx = {
      $queryRaw: vi.fn(),
      orderCounter: {
        upsert: vi.fn().mockResolvedValue({ id: 1, count: 2 }),
      },
      userOrderCounter: {
        upsert: vi
          .fn()
          .mockResolvedValue({ userId: mockCart.userId, count: 2 }),
      },
      order: {
        create: vi.fn().mockResolvedValue(discountedOrder),
      },
      discountCode: {
        update: vi.fn(),
      },
      cart: {
        delete: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      return await fn(mockTx);
    });

    const result = await checkout(mockCart.userId, mockDiscountCode.code);

    expect(result.order.discountCode).toBe(mockDiscountCode.code);
    expect(result.order.discountAmount).toBe(discountAmount);
    expect(result.order.total).toBe(mockOrder.subtotal - discountAmount);
    expect(mockTx.discountCode.update).toHaveBeenCalledWith({
      where: { code: mockDiscountCode.code },
      data: { isUsed: true, usedAt: expect.any(Date) },
    });
  });

  it("completes checkout on user's nth order without auto-generating discount", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);

    const mockTx = {
      $queryRaw: vi.fn(),
      orderCounter: {
        upsert: vi.fn().mockResolvedValue({ id: 1, count: 10 }),
      },
      userOrderCounter: {
        upsert: vi
          .fn()
          .mockResolvedValue({ userId: mockCart.userId, count: 5 }),
      },
      order: {
        create: vi.fn().mockResolvedValue(mockOrder),
      },
      discountCode: {
        update: vi.fn(),
      },
      cart: {
        delete: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      return await fn(mockTx);
    });

    const result = await checkout(mockCart.userId);

    expect(result.order).toEqual(mockOrder);
    expect((result as any).earnedDiscountCode).toBeUndefined();
  });

  it("completes checkout on non-nth user order without discount code", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);

    const mockTx = {
      $queryRaw: vi.fn(),
      orderCounter: {
        upsert: vi.fn().mockResolvedValue({ id: 1, count: 7 }),
      },
      userOrderCounter: {
        upsert: vi.fn().mockResolvedValue({
          userId: mockCart.userId,
          count: 3,
        }),
      },
      order: {
        create: vi.fn().mockResolvedValue(mockOrder),
      },
      discountCode: {
        update: vi.fn(),
      },
      cart: {
        delete: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      return await fn(mockTx);
    });

    const result = await checkout(mockCart.userId);

    expect(result.order).toEqual(mockOrder);
    expect((result as any).earnedDiscountCode).toBeUndefined();
  });

  it("first order for a new user succeeds without discount code", async () => {
    vi.mocked(prisma.cart.findUnique).mockResolvedValue(mockCart);

    const mockTx = {
      $queryRaw: vi.fn(),
      orderCounter: {
        upsert: vi.fn().mockResolvedValue({ id: 1, count: 1 }),
      },
      userOrderCounter: {
        upsert: vi
          .fn()
          .mockResolvedValue({ userId: mockCart.userId, count: 1 }),
      },
      order: {
        create: vi.fn().mockResolvedValue(mockOrder),
      },
      discountCode: {
        update: vi.fn(),
      },
      cart: {
        delete: vi.fn(),
      },
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      return await fn(mockTx);
    });

    const result = await checkout(mockCart.userId);

    expect(result.order).toEqual(mockOrder);
    expect((result as any).earnedDiscountCode).toBeUndefined();
  });
});
