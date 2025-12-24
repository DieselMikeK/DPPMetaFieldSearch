import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Test DB connection
    const test = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW() as now`;
    console.log("Connected to DB:", test[0].now);

    // Create dummy product
    const created = await prisma.product.create({
      data: {
        product_id: "test-001",
        product_title: "Dummy Product",
        product_sku: "DUMMY-001",
      },
    });
    console.log("Created product:", created);

    // Fetch all products
    const all = await prisma.product.findMany();
    console.log("All products:", all);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
