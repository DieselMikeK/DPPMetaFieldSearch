export default async function handler(req, res) {
  const shop = process.env.SHOP_CUSTOM_DOMAIN;
  const token = process.env.VITE_SHOPIFY_ADMIN_API_ACCESS_TOKEN;

  const response = await fetch(
    `https://${shop}/admin/api/2024-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token
      },
      body: JSON.stringify({
        query: `
          {
            shop {
              name
              myshopifyDomain
            }
            products(first: 5) {
              edges {
                node {
                  id
                  title
                }
              }
            }
          }
        `
      })
    }
  );

  const data = await response.json();
  res.status(200).json(data);
}
