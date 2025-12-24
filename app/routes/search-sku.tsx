// server-side loader
export async function loader({ request }: any) {
  try {
    const url = new URL(request.url);
    const sku = url.searchParams.get("sku");

    if (!sku) {
      return new Response(
        JSON.stringify({ error: "Missing SKU query parameter" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const SHOP = process.env.VITE_SHOPIFY_SHOP_DOMAIN;
    const TOKEN = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    const query = `
      query {
        products(first: 10, query: "sku:${sku}") {
          edges {
            node {
              id
              title
              variants(first: 10) {
                edges {
                  node {
                    id
                    sku
                  }
                }
              }
              addOns: metafield(namespace: "custom", key: "add_ons") {
                type
                value
              }
              options: metafield(namespace: "custom", key: "options") {
                type
                value
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${SHOP}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN || "",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: "Shopify API error", details: text }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const responseData = await response.json();

    if (responseData.errors) {
      return new Response(
        JSON.stringify({ error: "GraphQL errors", details: responseData.errors }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data } = responseData;
    const results = [];

    for (const productEdge of data.products.edges) {
      const product = productEdge.node;

      // Safely parse metafields
      let addOnsArray: any[] = [];
      let optionsArray: any[] = [];

      try {
        addOnsArray = product.addOns?.value ? JSON.parse(product.addOns.value) : [];
      } catch (e) {
        addOnsArray = [];
      }

      try {
        optionsArray = product.options?.value ? JSON.parse(product.options.value) : [];
      } catch (e) {
        optionsArray = [];
      }

      const hasAddOns = addOnsArray.length > 0;
      const hasOptions = optionsArray.length > 0;

      // Only include variants that match the SKU
      for (const variantEdge of product.variants.edges) {
        const variant = variantEdge.node;
        if (variant.sku.toLowerCase().includes(sku.toLowerCase())) {
          results.push({
            productId: product.id,
            productTitle: product.title,
            variantId: variant.id,
            sku: variant.sku,
            addOnsMetaobject: hasAddOns ? "Yes" : "No",
            addOnsValue: addOnsArray,
            optionsMetaobject: hasOptions ? "Yes" : "No",
            optionsValue: optionsArray,
          });
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Unexpected error", stack: err.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
