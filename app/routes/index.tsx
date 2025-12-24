// app/routes/index.tsx
import { useEffect, useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // No need to authenticate if using Admin API token
  return null;
};

interface Product {
  id: string;
  title: string;
}

export default function Index() {
  const fetcher = useFetcher<{ shopName?: string; products?: Product[] }>();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  const fetchProducts = async () => {
    const shop = process.env.SHOP_CUSTOM_DOMAIN!;
    const token = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN!;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    };

    const response = await fetch(
      `https://${shop}/admin/api/2024-01/graphql.json`,
      {
        method: "POST",
        headers,
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
      }
    );

    const data = await response.json();
    setShopName(data?.data?.shop?.name ?? null);
    setProducts(
      data?.data?.products?.edges.map((edge: any) => edge.node) ?? []
    );
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Shopify Store: {shopName ?? "Loading..."}</h1>

      <h2>Products:</h2>
      {products ? (
        <ul>
          {products.map((p) => (
            <li key={p.id}>{p.title}</li>
          ))}
        </ul>
      ) : (
        <p>Loading products...</p>
      )}

      <button onClick={fetchProducts} style={{ marginTop: "1rem" }}>
        Refresh
      </button>
    </main>
  );
}
