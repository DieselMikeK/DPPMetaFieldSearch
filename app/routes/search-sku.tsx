import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const sku = url.searchParams.get("sku");

    if (!sku) {
      return Response.json({ results: [], error: "Missing SKU query parameter" }, { status: 400 });
    }

    const SHOP = process.env.VITE_SHOPIFY_SHOP_DOMAIN;
    const TOKEN = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    if (!SHOP || !TOKEN) {
      return Response.json({ results: [], error: "Missing Shopify credentials" }, { status: 500 });
    }

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
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Shopify API error:", text);
      return Response.json({ results: [], error: "Shopify API error", details: text }, { status: 500 });
    }

    const responseData = await response.json();

    if (responseData.errors) {
      console.error("GraphQL errors:", responseData.errors);
      return Response.json({ results: [], error: "GraphQL errors", details: responseData.errors }, { status: 500 });
    }

    const results: any[] = [];

    for (const productEdge of responseData.data.products.edges) {
      const product = productEdge.node;

      const addOnsValue = product.addOns?.value || null;
      const optionsValue = product.options?.value || null;

      const hasAddOns = addOnsValue ? (JSON.parse(addOnsValue) || []).length > 0 : false;
      const hasOptions = optionsValue ? (JSON.parse(optionsValue) || []).length > 0 : false;

      for (const variantEdge of product.variants.edges) {
        const variant = variantEdge.node;

        if (variant.sku.toLowerCase().includes(sku.toLowerCase())) {
          results.push({
            productId: product.id,
            productTitle: product.title,
            variantId: variant.id,
            sku: variant.sku,
            addOnsMetaobject: hasAddOns ? "Yes" : "No",
            addOnsValue,
            optionsMetaobject: hasOptions ? "Yes" : "No",
            optionsValue,
          });
        }
      }
    }

    return Response.json({ results });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return Response.json({ results: [], error: err.message || "Unexpected error" }, { status: 500 });
  }
}
