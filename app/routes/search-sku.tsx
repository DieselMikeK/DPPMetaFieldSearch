import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const sku = url.searchParams.get("sku")?.trim();

    if (!sku) {
      return Response.json({ error: "Missing SKU parameter" }, { status: 400 });
    }

    const SHOP = process.env.VITE_SHOPIFY_SHOP_DOMAIN;
    const TOKEN = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    if (!SHOP || !TOKEN) {
      return Response.json({ error: "Missing Shopify credentials" }, { status: 500 });
    }

    // 1️⃣ Find product(s) containing this SKU
    const productSearchQuery = `
      query {
        products(first: 10, query: "sku:${sku}") {
          edges {
            node {
              id
              title
              variants(first: 10) {
                edges {
                  node {
                    sku
                  }
                }
              }
            }
          }
        }
      }
    `;

    const productRes = await fetch(`https://${SHOP}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query: productSearchQuery }),
    });

    const productData = await productRes.json();

    const foundInProducts = productData.data.products.edges.map((p: any) => {
      const matchingVariant = p.node.variants.edges.find((v: any) =>
        v.node.sku?.toLowerCase().includes(sku.toLowerCase())
      );

      return {
        id: p.node.id,
        title: p.node.title,
        sku: matchingVariant?.node.sku || "",
      };
    });

    if (!foundInProducts.length) {
      return Response.json({
        searchedSku: sku,
        results: [],
        message: "SKU not found in any product variants",
      });
    }

    // 2️⃣ Load all metaobjects
    const metaobjectQuery = `
      query {
        metaobjects(first: 250, type: "add_ons") {
          edges {
            node {
              id
              displayName
              fields {
                key
                value
              }
            }
          }
        }
        options: metaobjects(first: 250, type: "options") {
          edges {
            node {
              id
              displayName
              fields {
                key
                value
              }
            }
          }
        }
      }
    `;

    const metaRes = await fetch(`https://${SHOP}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": TOKEN,
      },
      body: JSON.stringify({ query: metaobjectQuery }),
    });

    const metaData = await metaRes.json();

    const allMetaobjects = [
      ...metaData.data.metaobjects.edges.map((e: any) => ({ ...e.node, type: "add_ons" })),
      ...metaData.data.options.edges.map((e: any) => ({ ...e.node, type: "options" })),
    ];

    // 3️⃣ Find which metaobjects reference the SKU
    const matchingMetaobjects = allMetaobjects.filter((m: any) =>
      m.fields.some((f: any) => f.value?.includes(sku))
    );

    if (!matchingMetaobjects.length) {
      return Response.json({
        searchedSku: sku,
        foundInProducts,
        results: [],
        message: "SKU found in product but not referenced in any metaobjects",
      });
    }

    // 4️⃣ Find parent products that reference those metaobjects
    const results = [];

    for (const meta of matchingMetaobjects) {
      const parentQuery = `
        query {
          products(first: 50) {
            edges {
              node {
                id
                title
                variants(first: 1) { edges { node { sku } } }
                addOns: metafield(namespace: "custom", key: "add_ons") { value }
                options: metafield(namespace: "custom", key: "options") { value }
              }
            }
          }
        }
      `;

      const parentRes = await fetch(`https://${SHOP}/admin/api/2024-10/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": TOKEN,
        },
        body: JSON.stringify({ query: parentQuery }),
      });

      const parentData = await parentRes.json();

      const parentProducts = [];

      for (const p of parentData.data.products.edges) {
        const node = p.node;

        for (const field of ["add_ons", "options"] as const) {
          const raw = field === "add_ons" ? node.addOns?.value : node.options?.value;
          if (raw && raw.includes(meta.id)) {
            parentProducts.push({
              productId: node.id,
              productTitle: node.title,
              productSku: node.variants.edges[0]?.node.sku || "",
              metafieldType: field,
            });
          }
        }
      }

      results.push({
        metaobjectId: meta.id,
        metaobjectName: meta.displayName,
        parentProducts,
      });
    }

    return Response.json({
      searchedSku: sku,
      foundInProducts,
      results,
    });
  } catch (err: any) {
    console.error(err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
