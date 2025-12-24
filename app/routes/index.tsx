import { useState } from "react";

interface SearchResult {
  productId: string;
  productTitle: string;
  variantId: string;
  sku: string;
  addOnsMetaobject: string;
  addOnsValue: any[];
  optionsMetaobject: string;
  optionsValue: any[];
}

interface SearchResponse {
  results?: SearchResult[];
  error?: string;
}

export default function Index() {
  const [sku, setSku] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!sku.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults([]); // Clear previous results

    try {
      const response = await fetch(`/search-sku?sku=${encodeURIComponent(sku)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();

      console.log("Received data:", data); // Debug log

      // Validate the response structure
      if (data && typeof data === 'object') {
        if (data.error) {
          setError(data.error);
        }
        
        if (Array.isArray(data.results)) {
          setSearchResults(data.results);
        } else {
          console.warn("data.results is not an array:", data.results);
          setSearchResults([]);
        }
      } else {
        console.error("Invalid response format:", data);
        setError("Invalid response from server");
        setSearchResults([]);
      }
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Search failed");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const hasResults = searchResults.length > 0;

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>DPP Metafield Search</h1><p>HI</p>

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

      {error && (
        <div style={{ color: "red", marginBottom: "20px", padding: "10px", backgroundColor: "#fee" }}>
          Error: {error}
        </div>
      )}

      {loading && <p>Loading...</p>}

      {hasResults && !loading && (
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
            {searchResults.map((result, idx) => (
              <tr key={idx}>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {result.productTitle || "N/A"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {result.sku || "N/A"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {result.addOnsMetaobject || "No"}
                </td>
                <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                  {result.optionsMetaobject || "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!hasResults && !loading && sku && (
        <p>No results found for SKU: {sku}</p>
      )}
    </div>
  );
}
