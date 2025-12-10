/** @jsx h */
import { h, render } from "preact";
import { useState } from "preact/hooks";

function AppHome() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const searchProducts = async () => {
    const SHOP = import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN;
    const ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN;

    const res = await fetch(
      `https://${SHOP}/admin/api/2025-10/products.json?title=${query}`,
      {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();
    setResults(data.products || []);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>DPP MetaField Search</h1>
      <input
        type="text"
        value={query}
        placeholder="Search by title or SKU"
        onInput={(e: any) => setQuery(e.target.value)}
        style={{ marginRight: "0.5rem" }}
      />
      <button onClick={searchProducts}>Search</button>

      <ul style={{ marginTop: "1rem" }}>
        {results.map((p: any) => (
          <li key={p.id}>
            <strong>{p.title}</strong> -{" "}
            {p.variants.map((v: any) => v.sku).join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Shopify scaffold expects an element with id="app"
render(<AppHome />, document.getElementById("app")!);
