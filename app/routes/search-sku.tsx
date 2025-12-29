// src/routes/search-sku.ts
import type { LoaderFunction } from "react-router";

interface ParentProduct {
  productId: string;
  productTitle: string;
  productSku: string | null;
  metafieldType: "add_ons" | "options";
  metaobjectIds: string[];
}

interface MetaobjectFieldReference {
  node: { id: string };
}

interface MetaobjectField {
  key: string;
  type: string;
  value: string | null;
  references?: { edges: MetaobjectFieldReference[] };
}

interface Metaobject {
  id: string;
  displayName: string;
  fields: MetaobjectField[];
}

interface ProductVariantNode {
  sku: string | null;
}

interface ProductVariantEdge {
  node: ProductVariantNode;
}

interface ProductNode {
  id: string;
  title: string;
  variants: { edges: ProductVariantEdge[] };
  addOns?: { value: string };
  options?: { value: string };
}

interface ProductEdge {
  node: ProductNode;
}

interface ProductsResponse {
  products: {
    edges: ProductEdge[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

interface MetaobjectMatch {
  metaobjectId: string;
  metaobjectName: string;
  parentProducts: ParentProduct[];
}

interface SearchResponse {
  results: MetaobjectMatch[];
  searchedSku: string;
  foundInProducts: { id: string; title: string; sku: string | null }[];
  message?: string;
  error?: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const sku = url.searchParams.get("sku");
    if (!sku) {
      return new Response(JSON.stringify({ results: [], error: "Missing SKU" }), { status: 400 });
    }

    const SHOP = process.env.VITE_SHOPIFY_SHOP_DOMAIN;
    const TOKEN = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN;
    if (!SHOP || !TOKEN) {
      return new Response(JSON.stringify({ results: [], error: "Missing credentials" }), { status: 500 });
    }

    // --- STEP 1: Find products matching SKU ---
    const matchingProducts = await fetchProductsBySku(SHOP, TOKEN, sku);

    if (matchingProducts.length === 0) {
      return new Response(
        JSON.stringify({
          results: [],
          message: "No products found with that SKU",
          searchedSku: sku,
          foundInProducts: [],
        })
      );
    }

    const productIds = matchingProducts.map((p) => p.id);

    // --- STEP 2: Fetch all metaobjects ---
    const metaobjects = await fetchAllMetaobjectsWithProducts(SHOP, TOKEN);

    // --- STEP 3: Match metaobjects containing products ---
    const matchingMetaobjects: MetaobjectMatch[] = metaobjects
      .filter((mo) => {
        const references = mo.fields.flatMap((f) => f.references?.edges.map((e) => e.node.id) ?? []);
        return productIds.some((id) => references.includes(id));
      })
      .map((mo) => ({ metaobjectId: mo.id, metaobjectName: mo.displayName, parentProducts: [] }));

    // --- STEP 4: Fetch parent products referencing these metaobjects ---
    const parentProducts = await findParentProducts(SHOP, TOKEN, matchingMetaobjects.map((m) => m.metaobjectId));

    // Attach parent products
    for (const match of matchingMetaobjects) {
      match.parentProducts = parentProducts.filter((p) => p.metaobjectIds.includes(match.metaobjectId));
    }

    const response: SearchResponse = {
      results: matchingMetaobjects,
      searchedSku: sku,
      foundInProducts: matchingProducts.map((p) => ({
        id: p.id,
        title: p.title,
        sku: p.variants.edges[0]?.node.sku ?? null,
      })),
    };

    if (matchingMetaobjects.length === 0) {
      response.message = `SKU "${sku}" found in products but not used in any metaobjects`;
    }

    return new Response(JSON.stringify(response));
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ results: [], error: err.message }), { status: 500 });
  }
};

// =======================
// Helper Functions
// =======================

async function fetchProductsBySku(shop: string, token: string, sku: string): Promise<ProductNode[]> {
  const query = `
    query {
      products(first: 20, query: "sku:${sku}") {
        edges {
          node {
            id
            title
            variants(first: 10) {
              edges { node { sku } }
            }
          }
        }
      }
    }
  `;
  const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query }),
  });
  const data: { data: ProductsResponse; errors?: any } = await response.json();
  if (data.errors) throw new Error("Product query failed");

  return data.data.products.edges
    .map((e) => e.node)
    .filter((p) => p.variants.edges.some((v) => v.node.sku?.toLowerCase().includes(sku.toLowerCase())));
}

async function fetchAllMetaobjectsWithProducts(shop: string, token: string): Promise<Metaobject[]> {
  const metaobjects: Metaobject[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const query = `
      query {
        metaobjects(first: 250, type: "product_builder_section"${cursor ? `, after: "${cursor}"` : ""}) {
          edges { node { id displayName fields { key type value references(first: 50) { edges { node { id } } } } } }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;
    const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query }),
    });
    const data: { data: { metaobjects: { edges: { node: Metaobject }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }; errors?: any } = await response.json();
    if (data.errors) throw new Error("Metaobject fetch failed");

    metaobjects.push(...data.data.metaobjects.edges.map((e) => e.node));
    hasNextPage = data.data.metaobjects.pageInfo.hasNextPage;
    cursor = data.data.metaobjects.pageInfo.endCursor;
  }

  return metaobjects;
}

async function findParentProducts(shop: string, token: string, metaobjectIds: string[]): Promise<ParentProduct[]> {
  const parents: ParentProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const query = `
      query {
        products(first: 250${cursor ? `, after: "${cursor}"` : ""}) {
          edges { node { id title variants(first: 1) { edges { node { sku } } } addOns: metafield(namespace: "custom", key: "add_ons") { value } options: metafield(namespace: "custom", key: "options") { value } } }
          pageInfo { hasNextPage endCursor }
        }
      }
    `;
    const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
      body: JSON.stringify({ query }),
    });
    const data: { data: ProductsResponse; errors?: any } = await response.json();
    if (data.errors) throw new Error("Parent product fetch failed");

    for (const edge of data.data.products.edges) {
      const p = edge.node;

      const processField = (value: string | null, type: "add_ons" | "options") => {
        if (!value) return;
        try {
          const ids: string[] = JSON.parse(value);
          const matches = ids.filter((id) => metaobjectIds.includes(id));
          if (matches.length > 0) {
            parents.push({
              productId: p.id,
              productTitle: p.title,
              productSku: p.variants.edges[0]?.node.sku ?? null,
              metafieldType: type,
              metaobjectIds: matches,
            });
          }
        } catch (e) {
          console.error(`Error parsing ${type}:`, e);
        }
      };

      processField(p.addOns?.value ?? null, "add_ons");
      processField(p.options?.value ?? null, "options");
    }

    hasNextPage = data.data.products.pageInfo.hasNextPage;
    cursor = data.data.products.pageInfo.endCursor;
  }

  return parents;
}
