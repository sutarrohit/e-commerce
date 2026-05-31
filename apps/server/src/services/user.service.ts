import { prisma } from "@/lib/prisma.js";
import { randomUUID } from "crypto";

export async function createUser() {
  const id = randomUUID();

  await prisma.cart.create({
    data: { userId: id },
  });

  return { id };
}
