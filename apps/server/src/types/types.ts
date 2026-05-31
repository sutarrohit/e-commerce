import { z } from "zod";

// Zod Types
export const ProductSchema = z.object({
  id: z.uuid().describe("Unique identifier for the product"),
  name: z.string().describe("Name of the product"),
  price: z
    .number()
    .int()
    .nonnegative()
    .describe("Price of the product in the smallest currency unit (e.g. cents or paise)"),
  image: z.url().describe("URL of the product image"),
  createdAt: z.date().describe("Timestamp when the product was created")
});

export const CartItemSchema = z.object({
  id: z.uuid().describe("Unique identifier for the cart item"),
  cartId: z.uuid().describe("Identifier of the cart that owns this item"),
  productId: z.uuid().describe("Identifier of the associated product"),
  name: z.string().describe("Snapshot of the product name at the time it was added to the cart"),
  price: z.number().int().nonnegative().describe("Snapshot of the product price at the time it was added to the cart"),
  quantity: z.number().int().positive().describe("Number of units of the product in the cart")
});

export const CartSchema = z.object({
  id: z.uuid().describe("Unique identifier for the shopping cart"),
  userId: z.string().describe("Identifier of the user who owns the cart"),
  items: z.array(CartItemSchema).describe("List of items currently in the cart"),
  createdAt: z.date().describe("Timestamp when the cart was created"),
  updatedAt: z.date().describe("Timestamp when the cart was last updated")
});

export const OrderItemSchema = z.object({
  id: z.uuid().describe("Unique identifier for the order item"),
  orderId: z.uuid().describe("Identifier of the order that contains this item"),
  productId: z.uuid().describe("Identifier of the purchased product"),
  name: z.string().describe("Snapshot of the product name at purchase time"),
  price: z.number().int().nonnegative().describe("Snapshot of the product price at purchase time"),
  quantity: z.number().int().positive().describe("Quantity purchased")
});

export const DiscountCodeSchema = z.object({
  code: z.string().describe("Unique discount code"),
  discountPercent: z.number().int().min(0).max(100).describe("Percentage discount applied by the code"),
  isUsed: z.boolean().describe("Whether the discount code has already been redeemed"),
  createdAt: z.date().describe("Timestamp when the discount code was created"),
  usedAt: z.date().nullable().optional().describe("Timestamp when the discount code was redeemed"),
  userId: z.string().describe("Identifier of the user who owns this discount code")
});

export const OrderSchema = z.object({
  id: z.uuid().describe("Unique identifier for the order"),
  userId: z.string().describe("Identifier of the user who placed the order"),
  items: z.array(OrderItemSchema).describe("List of purchased items"),
  subtotal: z.number().int().nonnegative().describe("Total amount before discounts"),
  discountCode: z.string().optional().nullable().describe("Applied discount code, if any"),
  discountAmount: z.number().int().nonnegative().describe("Amount deducted from the subtotal"),
  total: z.number().int().nonnegative().describe("Final payable amount after discounts"),
  orderNumber: z.number().int().positive().describe("Human-readable sequential order number"),
  placedAt: z.date().describe("Timestamp when the order was placed")
});

export const OrderCounterSchema = z.object({
  id: z.number().int().describe("Singleton record identifier"),
  count: z.number().int().nonnegative().describe("Current order sequence counter")
});

export const AddToCartSchema = z.object({
  userId: z.uuid().describe("Unique identifier of the user"),
  productId: z.string().uuid().describe("Unique identifier of the product"),
  quantity: z.number().int().positive().describe("Quantity of the product to add to the cart")
});

// Typescript Types
export type Product = z.infer<typeof ProductSchema>;
export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type DiscountCode = z.infer<typeof DiscountCodeSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderCounter = z.infer<typeof OrderCounterSchema>;

export type AddToCart = z.infer<typeof AddToCartSchema>;
