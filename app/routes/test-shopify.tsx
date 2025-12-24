// app/routes/test-shopify.jsx
export async function loader() {
  try {
    const shop = process.env.SHOP_CUSTOM_DOMAIN;
    const token = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    if (!shop || !token) {
      return new Response(
        JSON.stringify({ error: "Missing Shopify store domain or Admin API token" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query: `
          {
            shop {
              name
              myshopifyDomain
            }
            products(first: 5) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: "Shopify API error", details: text }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: "Unexpected error", details: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
