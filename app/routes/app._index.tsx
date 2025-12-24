// app/routes/app._index.tsx
import { useState } from "react";

interface VariantResult {
  id: string;
  title: string;
  sku: string;
  hasAddOns: boolean;
  hasOptions: boolean;
}

export default function AppHome() {
  const [sku, setSku] = useState("");
  const [results, setResults] = useState<VariantResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSKU = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/search-sku?sku=${encodeURIComponent(sku)}`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setResults(data.variants);
    } catch (err: any) {
      setError(err.message || "Error fetching variants");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>DPP Metafield Search</h1><p>Hi</p>
      <p>Search a product SKU and see variant info and metafield presence:</p>

      <input
        type="text"
        placeholder="Enter SKU"
        value={sku}
        onChange={(e) => setSku(e.currentTarget.value)}
        style={{ marginRight: "0.5rem", padding: "0.5rem" }}
      />
      <button onClick={searchSKU} style={{ padding: "0.5rem 1rem" }}>
        Search
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {results.length > 0 && (
        <table
          style={{
            marginTop: "1rem",
            borderCollapse: "collapse",
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Title</th>
              <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Variant ID</th>
              <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>SKU</th>
              <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Add-Ons Metaobject</th>
              <th style={{ border: "1px solid #ccc", padding: "0.5rem" }}>Options Metaobject</th>
            </tr>
          </thead>
          <tbody>
            {results.map((v) => (
              <tr key={v.id}>
                <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{v.title}</td>
                <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{v.id}</td>
                <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>{v.sku}</td>
                <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  {v.hasAddOns ? "Yes" : "No"}
                </td>
                <td style={{ border: "1px solid #ccc", padding: "0.5rem" }}>
                  {v.hasOptions ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
