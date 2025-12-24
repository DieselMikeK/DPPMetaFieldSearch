import { json } from "@remix-run/node";

// Mock fetch to avoid calling a real Shopify API during the test
global.fetch = async (url, opts) => {
  return {
    async json() {
      return {
        shop: { name: "Mock Shop", myshopifyDomain: "mock.myshopify.com" },
        products: { edges: [{ node: { id: "gid://shopify/Product/1", title: "Test Product" } }] }
      };
    }
  };
};

export async function loader() {
  const shop = process.env.SHOP_CUSTOM_DOMAIN ?? "mock.myshopify.com";
  const token = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN ?? "fake-token";

  const response = await fetch(
    `https://${shop}/admin/api/2024-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token
      },
      body: JSON.stringify({
        query: `
          {
            shop { name myshopifyDomain }
            products(first: 5) {
              edges { node { id title } }
            }
          }
        `
      })
    }
  );

  const data = await response.json();
  return json(data);
}

async function run() {
  const res = await loader();
  console.log("Response status:", res.status);
  const text = await res.text();
  console.log("Response body:", text);
}

run().catch(err => { console.error(err); process.exit(1); });
