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

    // GraphQL query to fetch product by variant SKU
    const query = `
      query ($sku: String!) {
        products(first: 5, query: $sku) {
          edges {
            node {
              id
              title
              variants(first: 5, query: $sku) {
                edges {
                  node {
                    id
                    sku
                    metafields(first: 10) {
                      edges {
                        node {
                          namespace
                          key
                          type
                          value
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${SHOP}/admin/api/2025-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query, variables: { sku } }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: "Shopify API error", details: text }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data } = await response.json();

    const results = [];

    for (const productEdge of data.products.edges) {
      const product = productEdge.node;

      for (const variantEdge of product.variants.edges) {
        const variant = variantEdge.node;

        // Find add_ons and options metafields
        const addOnsMF = variant.metafields.edges.find(
          (mf: any) => mf.node.namespace === "custom" && mf.node.key === "add_ons"
        );
        const optionsMF = variant.metafields.edges.find(
          (mf: any) => mf.node.namespace === "custom" && mf.node.key === "options"
        );

        const hasAddOns =
          addOnsMF && addOnsMF.node.value && JSON.parse(addOnsMF.node.value).length > 0;

        const hasOptions =
          optionsMF && optionsMF.node.value && JSON.parse(optionsMF.node.value).length > 0;

        results.push({
          productId: product.id,
          productTitle: product.title,
          variantId: variant.id,
          sku: variant.sku,
          addOnsMetaobject: hasAddOns ? "Yes" : "No",
          optionsMetaobject: hasOptions ? "Yes" : "No",
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
