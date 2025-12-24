import { useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useFetcher } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // This will throw/redirect if the session is not authenticated
  await authenticate.admin(request);
  return null;
};

export default function Index() {
  const fetcher = useFetcher();

  useEffect(() => {
    // optional: you could fetch initial data here if needed
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1>A short heading about [Your App]</h1>
        <p>A tagline about [Your App] that describes your value proposition.</p>
      </header>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Shop Domain</h2>
        <p>e.g: my-shop-domain.myshopify.com</p>
        <button
          onClick={() => {
            // optionally trigger login flow if user somehow got here unauthenticated
            fetcher.submit({}, { method: "POST" });
          }}
        >
          Log in
        </button>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Product Features</h2>
        <ul>
          <li>Product feature. Some detail about your feature and its benefit to your customer.</li>
          <li>Product feature. Some detail about your feature and its benefit to your customer.</li>
          <li>Product feature. Some detail about your feature and its benefit to your customer.</li>
        </ul>
      </section>
    </div>
  );
}
