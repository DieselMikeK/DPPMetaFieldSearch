import { useState } from "react";

export default function SearchSKU() {
  const [sku, setSku] = useState("");
  const [searchResults, setSearchResults] = useState<any>({ results: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!sku.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/search-sku?sku=${encodeURIComponent(sku)}`);
      const data = await response.json();

      setSearchResults(data);
      if (data.error) setError(data.error);
    } catch (err: any) {
      console.error("Search failed:", err);
      setError("Search failed");
      setSearchResults({ results: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Search Products by SKU</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="Enter SKU..."
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>}

      {searchResults?.results?.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Product Title</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>SKU</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Has Add-ons</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Has Options</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.results.map((result: any, idx: number) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{result.productTitle}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{result.sku}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{result.addOnsMetaobject}</td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>{result.optionsMetaobject}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No results found for SKU: {sku}</p>
      )}
    </div>
  );
}
