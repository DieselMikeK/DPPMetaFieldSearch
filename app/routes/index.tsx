import { useEffect, useState } from "react";

type Product = {
  node: {
    id: string;
    title: string;
  };
};

type ShopifyData = {
  shop: {
    name: string;
    myshopifyDomain: string;
  };
  products: {
    edges: Product[];
  };
};

export default function Index() {
  const [data, setData] = useState<ShopifyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/test-shopify");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();
        setData(json.data);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  if (loading) return <p>Loading Shopify products...</p>;
  if (error) return <p>Error loading products: {error}</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Products in {data?.shop.name}</h1>
      <ul>
        {data?.products.edges.map((product) => (
          <li key={product.node.id}>
            {product.node.title} — <code>{product.node.id}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
