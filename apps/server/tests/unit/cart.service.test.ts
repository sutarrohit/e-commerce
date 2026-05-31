import { describe, expect, it, vi, beforeEach } from "vitest";
import { addToCart } from "../../src/services/cart.service";
import { ApiError } from "../../src/lib/app-error.js";

vi.mock("@/lib/prisma.js", () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    cart: { findUnique: vi.fn(), create: vi.fn() },
    cartItem: { update: vi.fn(), create: vi.fn() }
  }
}));

import { prisma } from "../../src/lib/prisma.js";

const mockProduct = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Test Product",
  price: 1999,
  image: "https://example.com/product.jpg",
  createdAt: new Date("2025-01-01")
};

const mockCartItem = {
  id: "660e8400-e29b-41d4-a716-446655440001",
  cartId: "770e8400-e29b-41d4-a716-446655440002",
  productId: mockProduct.id,
  name: mockProduct.name,
  price: mockProduct.price
};

const mockCartWithItem = {
  id: "770e8400-e29b-41d4-a716-446655440002",
  userId: "880e8400-e29b-41d4-a716-446655440003",
  items: [{ ...mockCartItem, quantity: 1 }],
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01")
};

const mockEmptyCart = {
  id: "990e8400-e29b-41d4-a716-446655440004",
  userId: "880e8400-e29b-41d4-a716-446655440003",
  items: [],
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01")
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("addToCart", () => {
  it("throws 404 when product does not exist", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const result = addToCart({
      userId: mockCartWithItem.userId,
      productId: "nonexistent-id",
      quantity: 1
    });

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow("Product with id nonexistent-id not found");
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: "nonexistent-id" }
    });
  });

  it("creates a new cart and adds the item when user has no cart", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
    vi.mocked(prisma.cart.findUnique).mockResolvedValueOnce(null).mockResolvedValueOnce(mockCartWithItem);
    vi.mocked(prisma.cart.create).mockResolvedValue(mockEmptyCart);
    vi.mocked(prisma.cartItem.create).mockResolvedValue({
      ...mockCartItem,
      quantity: 2
    });

    const result = await addToCart({
      userId: mockEmptyCart.userId,
      productId: mockProduct.id,
      quantity: 2
    });

    expect(prisma.cart.create).toHaveBeenCalledWith({
      data: { userId: mockEmptyCart.userId },
      include: { items: true }
    });
    expect(prisma.cartItem.create).toHaveBeenCalledWith({
      data: {
        cartId: mockEmptyCart.id,
        productId: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        quantity: 2
      }
    });
    expect(result).toEqual(mockCartWithItem);
  });

  it("adds a new item to an existing cart", async () => {
    const existingCart = {
      ...mockEmptyCart,
      items: []
    };
    const updatedCart = {
      ...mockCartWithItem,
      items: [{ ...mockCartItem, quantity: 3 }]
    };

    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
    vi.mocked(prisma.cart.findUnique).mockResolvedValueOnce(existingCart).mockResolvedValueOnce(updatedCart);
    vi.mocked(prisma.cartItem.create).mockResolvedValue({
      ...mockCartItem,
      quantity: 3
    });

    const result = await addToCart({
      userId: existingCart.userId,
      productId: mockProduct.id,
      quantity: 3
    });

    expect(prisma.cart.create).not.toHaveBeenCalled();
    expect(prisma.cartItem.update).not.toHaveBeenCalled();
    expect(prisma.cartItem.create).toHaveBeenCalledWith({
      data: {
        cartId: existingCart.id,
        productId: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        quantity: 3
      }
    });
    expect(result).toEqual(updatedCart);
  });

  it("increments quantity when the product already exists in the cart", async () => {
    const existingCart = {
      ...mockCartWithItem,
      items: [{ ...mockCartItem, quantity: 1 }]
    };
    const updatedCart = {
      ...mockCartWithItem,
      items: [{ ...mockCartItem, quantity: 4 }]
    };

    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
    vi.mocked(prisma.cart.findUnique).mockResolvedValueOnce(existingCart).mockResolvedValueOnce(updatedCart);
    vi.mocked(prisma.cartItem.update).mockResolvedValue({
      ...mockCartItem,
      quantity: 4
    });

    const result = await addToCart({
      userId: existingCart.userId,
      productId: mockProduct.id,
      quantity: 3
    });

    expect(prisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: existingCart.items[0].id },
      data: { quantity: { increment: 3 } }
    });
    expect(prisma.cartItem.create).not.toHaveBeenCalled();
    expect(result).toEqual(updatedCart);
  });

  it("throws 500 if the updated cart cannot be retrieved", async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct);
    vi.mocked(prisma.cart.findUnique).mockResolvedValueOnce(mockCartWithItem).mockResolvedValueOnce(null);

    const result = addToCart({
      userId: mockCartWithItem.userId,
      productId: mockProduct.id,
      quantity: 1
    });

    await expect(result).rejects.toThrow(ApiError);
    await expect(result).rejects.toThrow("Failed to retrieve updated cart");
  });
});
