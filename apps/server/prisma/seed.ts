import { data } from "@/constants/seed-data.js";
import { prisma } from "@/lib/prisma.js";

async function main() {
  console.log("🌱 Seeding products...");

  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: data
  });

  console.log("✅ Products seeded successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
