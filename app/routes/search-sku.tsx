// app/routes/search-sku.tsx
export async function loader({ request }: any) {
  const url = new URL(request.url);
  const skuQuery = url.searchParams.get("sku");

  const SHOP = process.env.SHOP_CUSTOM_DOMAIN;
  const ACCESS_TOKEN = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  if (!skuQuery || !SHOP || !ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Missing SKU, shop, or token" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // GraphQL query: search product variants by SKU and get metafields
  const query = `
    {
      products(first: 10, query: "sku:${skuQuery}") {
        edges {
          node {
            title
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  sku
                  metafield(namespace: "custom", key: "add_ons") {
                    value
                  }
                  metafield2: metafield(namespace: "custom", key: "options") {
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(`https://${SHOP}/admin/api/2025-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ACCESS_TOKEN,
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();

  const variants = json.data.products.edges.flatMap((p: any) =>
    p.node.variants.edges.map((v: any) => ({
      id: v.node.id,
      title: p.node.title,
      sku: v.node.sku,
      hasAddOns: !!v.node.metafield?.value,
      hasOptions: !!v.node.metafield2?.value,
    }))
  );

  return new Response(JSON.stringify({ variants }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
