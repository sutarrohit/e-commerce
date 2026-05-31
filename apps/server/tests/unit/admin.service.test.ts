import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  generateDiscountForNthOrder,
  getAdminSummary,
} from "../../src/services/admin.service.js";
import { ApiError } from "../../src/lib/app-error.js";

vi.mock("@/lib/prisma.js", () => ({
  prisma: {
    userOrderCounter: { findUnique: vi.fn() },
    order: { findMany: vi.fn() },
    discountCode: { findMany: vi.fn(), create: vi.fn() },
    orderCounter: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/discount-code.js", () => ({
  generateDiscountCode: vi.fn(),
}));

import { prisma } from "../../src/lib/prisma.js";
import { generateDiscountCode } from "../../src/lib/discount-code.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateDiscountForNthOrder", () => {
  const userId = "880e8400-e29b-41d4-a716-446655440003";

  it("throws 400 when user has no order counter (count = 0)", async () => {
    vi.mocked(prisma.userOrderCounter.findUnique).mockResolvedValue(null);

    const result = generateDiscountForNthOrder(userId);

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow(
      "Discount condition not met. User's order count (0) is not a multiple of 5",
    );
  });

  it("throws 400 when user order count is not a multiple of 5", async () => {
    vi.mocked(prisma.userOrderCounter.findUnique).mockResolvedValue({
      userId,
      count: 3,
    });

    const result = generateDiscountForNthOrder(userId);

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow(
      "Discount condition not met. User's order count (3) is not a multiple of 5",
    );
  });

  it("throws 400 when user order count is zero", async () => {
    vi.mocked(prisma.userOrderCounter.findUnique).mockResolvedValue({
      userId,
      count: 0,
    });

    const result = generateDiscountForNthOrder(userId);

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow(
      "Discount condition not met. User's order count (0) is not a multiple of 5",
    );
  });

  it("generates discount code when user order count is a multiple of 5", async () => {
    vi.mocked(prisma.userOrderCounter.findUnique).mockResolvedValue({
      userId,
      count: 5,
    });

    const mockDiscount = {
      code: "NTHCODE",
      discountPercent: 10,
      isUsed: false,
      createdAt: new Date("2025-01-01"),
      usedAt: null,
      userId,
    };
    vi.mocked(generateDiscountCode).mockResolvedValue(mockDiscount as any);

    const result = await generateDiscountForNthOrder(userId);

    expect(result).toEqual(mockDiscount);
    expect(generateDiscountCode).toHaveBeenCalledWith(userId);
  });

  it("generates discount code on higher multiples of 5 (e.g. 10)", async () => {
    vi.mocked(prisma.userOrderCounter.findUnique).mockResolvedValue({
      userId,
      count: 10,
    });

    const mockDiscount = {
      code: "NTHCODE2",
      discountPercent: 10,
      userId,
    };
    vi.mocked(generateDiscountCode).mockResolvedValue(mockDiscount as any);

    const result = await generateDiscountForNthOrder(userId);

    expect(result).toEqual(mockDiscount);
    expect(generateDiscountCode).toHaveBeenCalledWith(userId);
  });
});

describe("getAdminSummary", () => {
  it("returns zeros when no orders exist", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.discountCode.findMany).mockResolvedValue([]);
    vi.mocked(prisma.orderCounter.findUnique).mockResolvedValue(null);

    const result = await getAdminSummary();

    expect(result).toEqual({
      totalItemsPurchased: 0,
      totalRevenue: 0,
      totalDiscountCodes: 0,
      totalDiscountsGiven: 0,
      totalOrders: 0,
    });
  });

  it("returns correct aggregates when orders exist", async () => {
    const mockOrders = [
      {
        id: "1",
        userId: "user-1",
        subtotal: 5000,
        discountCode: null,
        discountAmount: 0,
        total: 5000,
        orderNumber: 1,
        placedAt: new Date("2025-01-01"),
        items: [
          {
            id: "i1",
            orderId: "1",
            productId: "p1",
            name: "A",
            price: 2500,
            quantity: 2,
          },
        ],
      },
      {
        id: "2",
        userId: "user-2",
        subtotal: 3000,
        discountCode: "SAVE10",
        discountAmount: 300,
        total: 2700,
        orderNumber: 2,
        placedAt: new Date("2025-01-02"),
        items: [
          {
            id: "i2",
            orderId: "2",
            productId: "p2",
            name: "B",
            price: 3000,
            quantity: 1,
          },
        ],
      },
    ];

    const mockDiscountCodes = [
      {
        code: "SAVE10",
        discountPercent: 10,
        isUsed: true,
        createdAt: new Date(),
        usedAt: new Date(),
        userId: "user-2",
      },
    ];

    vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);
    vi.mocked(prisma.discountCode.findMany).mockResolvedValue(
      mockDiscountCodes as any,
    );
    vi.mocked(prisma.orderCounter.findUnique).mockResolvedValue({
      id: 1,
      count: 2,
    });

    const result = await getAdminSummary();

    expect(result).toEqual({
      totalItemsPurchased: 3,
      totalRevenue: 7700,
      totalDiscountCodes: 1,
      totalDiscountsGiven: 300,
      totalOrders: 2,
    });
  });

  it("calls all three prisma queries in parallel", async () => {
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);
    vi.mocked(prisma.discountCode.findMany).mockResolvedValue([]);
    vi.mocked(prisma.orderCounter.findUnique).mockResolvedValue(null);

    await getAdminSummary();

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      include: { items: true },
    });
    expect(prisma.discountCode.findMany).toHaveBeenCalled();
    expect(prisma.orderCounter.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });
});
