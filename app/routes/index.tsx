// app/routes/index.tsx
import { useEffect, useState } from "react";

export default function Index() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch from your /test-shopify route
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/test-shopify");
        const data = await res.json();
        setProducts(data.data.products.edges.map((edge: any) => edge.node));
      } catch (err: any) {
        setError(err.message || "Error fetching products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>DPP Metafield Search</h1>
      <p>Headless app landing page — fetching products from Shopify API:</p>

      {loading && <p>Loading products...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.title} (ID: {product.id})
          </li>
        ))}
      </ul>
    </div>
  );
}
