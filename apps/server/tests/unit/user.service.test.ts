import { describe, expect, it, vi, beforeEach } from "vitest";
import { createUser } from "../../src/services/user.service.js";

vi.mock("@/lib/prisma.js", () => ({
  prisma: {
    cart: { create: vi.fn() },
  },
}));

import { prisma } from "../../src/lib/prisma.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createUser", () => {
  it("creates a cart with a generated UUID and returns the id", async () => {
    const result = await createUser();

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
    expect(result.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    expect(prisma.cart.create).toHaveBeenCalledWith({
      data: { userId: result.id },
    });
  });

  it("generates a different UUID on each call", async () => {
    const result1 = await createUser();
    const result2 = await createUser();

    expect(result1.id).not.toBe(result2.id);
  });
});
