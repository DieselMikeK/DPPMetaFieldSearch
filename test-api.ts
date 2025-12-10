import 'dotenv/config';

const SHOP = process.env.VITE_SHOPIFY_SHOP_DOMAIN!;
const ACCESS_TOKEN = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN!;

async function testProducts() {
  const response = await fetch(`https://${SHOP}/admin/api/2024-10/products.json`, {
    method: "GET",
    headers: {
      "X-Shopify-Access-Token": ACCESS_TOKEN,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();
  console.log("Product response:", data);
}

testProducts();
