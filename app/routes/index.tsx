import { useState } from "react";

export default function Index() {
  const [sku, setSku] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!sku.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/search-sku?sku=${encodeURIComponent(sku)}`);
      const data = await response.json();

      // Ensure results is always an array
      if (!data.results) {
        data.results = [];
      }

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

  // Safe access to results
  const results = searchResults?.results || [];
  const hasResults = Array.isArray(results) && results.length > 0;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>DPP Metafield Search</h1>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="Enter SKU..."
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <div style={{ color: "red", marginBottom: "20px" }}>Error: {error}</div>}

      {hasResults ? (
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
            {results.map((result: any, idx: number) => (
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
        !loading && searchResults && <p>No results found for SKU: {sku}</p>
      )}
    </div>
  );
}
