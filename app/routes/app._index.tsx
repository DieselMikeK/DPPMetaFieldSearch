// src/routes/index.tsx
import { useState } from "react";
import { useFetcher } from "react-router";

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
  const fetcher = useFetcher<SearchResponse>();
  const searchResults = fetcher.data ?? null;

  const handleSearch = () => {
    if (!sku.trim()) return;
    fetcher.load(`/search-sku?sku=${encodeURIComponent(sku)}`);
  };

  const results = searchResults?.results ?? [];
  const hasResults = results.length > 0;
  const totalMetaobjects = results.length;
  const totalParentProducts = results.reduce((sum, m) => sum + m.parentProducts.length, 0);

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
          disabled={fetcher.state === "loading"}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            backgroundColor: fetcher.state === "loading" ? "#ccc" : "#008060",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: fetcher.state === "loading" ? "not-allowed" : "pointer",
          }}
        >
          {fetcher.state === "loading" ? "Searching..." : "Search"}
        </button>
      </div>

      {searchResults?.error && (
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
          <strong>Error:</strong> {searchResults.error}
        </div>
      )}

      {fetcher.state === "loading" && (
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

      {hasResults && (
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

          {searchResults?.foundInProducts && searchResults.foundInProducts.length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <h3>Product(s) with this SKU:</h3>
              <ul>
                {searchResults.foundInProducts.map((p, idx) => (
                  <li key={idx}>
                    <strong>{p.title}</strong> (SKU: {p.sku})
                  </li>
                ))}
              </ul>
            </div>
          )}

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
              <h4 style={{ marginTop: 0, color: "#303030" }}>
                {idx + 1}. {metaobject.metaobjectName}
              </h4>

              {metaobject.parentProducts.length > 0 ? (
                <>
                  <p style={{ margin: "8px 0", color: "#666" }}>
                    <strong>Used by {metaobject.parentProducts.length} parent product(s):</strong>
                  </p>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#e8e8e8" }}>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>
                          Parent Product
                        </th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>
                          Parent SKU
                        </th>
                        <th style={{ border: "1px solid #ccc", padding: "8px", textAlign: "left" }}>
                          Metafield Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {metaobject.parentProducts.map((parent, pIdx) => (
                        <tr key={pIdx}>
                          <td style={{ border: "1px solid #ccc", padding: "8px" }}>{parent.productTitle}</td>
                          <td style={{ border: "1px solid #ccc", padding: "8px" }}>{parent.productSku || "N/A"}</td>
                          <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: "4px",
                                backgroundColor: parent.metafieldType === "add_ons" ? "#e3f2fd" : "#fff3e0",
                                fontSize: "12px",
                              }}
                            >
                              {parent.metafieldType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p style={{ color: "#999", fontStyle: "italic" }}>This metaobject is not currently used by any products</p>
              )}
            </div>
          ))}
        </>
      )}

      {!hasResults && fetcher.state !== "loading" && searchResults && !searchResults.message && (
        <p style={{ color: "#666", fontStyle: "italic" }}>No metaobjects found containing SKU: {sku}</p>
      )}
    </div>
  );
}
