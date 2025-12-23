import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const test = await prisma.$queryRaw`SELECT NOW()`;
  console.log("Connected to DB:", test);
  
  await prisma.product.create({
    data: {
      product_id: "test-001",
      product_title: "Dummy Product",
      product_sku: "DUMMY-001"
    }
  });

  const all = await prisma.product.findMany();
  console.log("All products:", all);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
