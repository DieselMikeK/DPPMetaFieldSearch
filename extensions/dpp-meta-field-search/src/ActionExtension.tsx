import { render } from "preact";
import { useEffect, useState } from "preact/hooks";

// Shopify injects this global for extensions
declare const shopify: any;

export default async function Extension() {
  render(<AdminActionComponent />, document.body);
}

function AdminActionComponent() {
  const { i18n, close, data, extension } = shopify;
  const [productTitle, setProductTitle] = useState("");

  // Fetch product title via Admin GraphQL API
  useEffect(() => {
    (async function fetchProduct() {
      if (!data.selected || !data.selected[0]) return;

      const getProductQuery = {
        query: `query Product($id: ID!) {
          product(id: $id) {
            title
          }
        }`,
        variables: { id: data.selected[0].id },
      };

      try {
        const res = await fetch("shopify:admin/api/graphql.json", {
          method: "POST",
          body: JSON.stringify(getProductQuery),
        });

        if (!res.ok) throw new Error("Network error");

        const productData = await res.json();
        setProductTitle(productData.data.product.title);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [data.selected]);

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>{i18n.translate("welcome", { target: extension.target })}</h2>
      <p>Current product: {productTitle || "Loading..."}</p>
      <button
        style={{ marginRight: "0.5rem" }}
        onClick={() => {
          console.log("Done clicked");
          close();
        }}
      >
        Done
      </button>
      <button
        onClick={() => {
          console.log("Close clicked");
          close();
        }}
      >
        Close
      </button>
    </div>
  );
}
