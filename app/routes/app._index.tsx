import { useState } from "react";

interface ParentProduct {
  productId: string;
  productTitle: string;
  productSku: string;
  metafieldType: string;
}

interface MetaobjectMatch {
  metaobjectId: string;
  metaobjectName: string;
  parentProducts: ParentProduct[];
}

interface SearchResponse {
  results?: MetaobjectMatch[];
  searchedSku?: string;
  foundInProducts?: Array<{
    id: string;
    title: string;
    sku: string;
  }>;
  message?: string;
  error?: string;
}

export default function Index() {
  const [sku, setSku] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!sku.trim()) return;

    setLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const response = await fetch(`/search-sku?sku=${encodeURIComponent(sku)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      console.log("Received data:", data);

      if (data.error) {
        setError(data.error);
      }

      setSearchResults(data);
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Search failed");
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  // 🛡️ Safe derived data (fixes TypeScript error)
  const results = searchResults?.results ?? [];

  const hasResults = results.length > 0;

  const totalMetaobjects = results.length;

  const totalParentProducts = results.reduce(
    (sum, m) => sum + m.parentProducts.length,
    0
  );

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "1200px" }}>
      <h1>DPP Metafield Reverse Lookup</h1>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Search for a SKU to find which metaobjects contain it and which products use those metaobjects
      </p>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="Enter SKU (e.g., GAR-403069-0166)..."
          style={{
            padding: "10px",
            width: "400px",
            marginRight: "10px",
            fontSize: "14px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            backgroundColor: loading ? "#ccc" : "#008060",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#d72c0d",
            marginBottom: "20px",
            padding: "12px",
            backgroundColor: "#fef1f1",
            borderRadius: "4px",
            border: "1px solid #fecdca",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          <p>Searching through metaobjects... This may take a moment.</p>
        </div>
      )}

      {searchResults?.message && !hasResults && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#fff4e6",
            borderRadius: "4px",
            border: "1px solid #ffd79d",
            marginBottom: "20px",
          }}
        >
          <p>{searchResults.message}</p>

          {searchResults.foundInProducts && searchResults.foundInProducts.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <strong>Found in these products:</strong>
              <ul>
                {searchResults.foundInProducts.map((p, idx) => (
                  <li key={idx}>
                    {p.title} (SKU: {p.sku})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {hasResults && !loading && (
        <>
          <div
            style={{
              padding: "12px",
              backgroundColor: "#e3f2e1",
              borderRadius: "4px",
              border: "1px solid #9dc99b",
              marginBottom: "20px",
            }}
          >
            <strong>Results Summary:</strong>
            <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
              <li>
                SKU "{searchResults?.searchedSku}" found in <strong>{totalMetaobjects}</strong> metaobject(s)
              </li>
              <li>
                These metaobjects are used by <strong>{totalParentProducts}</strong> parent product(s)
              </li>
            </ul>
          </div>

          <h3>Metaobjects containing this SKU:</h3>

          {results.map((metaobject, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: "30px",
                padding: "15px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
              }}
            >
              <h4 style={{ marginTop: 0 }}>
                {idx + 1}. {metaobject.metaobjectName}
              </h4>

              <p>
                <strong>Used by {metaobject.parentProducts.length} product(s)</strong>
              </p>
            </div>
          ))}
        </>
      )}

      {!hasResults && !loading && searchResults && !searchResults.message && (
        <p style={{ color: "#666", fontStyle: "italic" }}>
          No metaobjects found containing SKU: {sku}
        </p>
      )}
    </div>
  );
}
