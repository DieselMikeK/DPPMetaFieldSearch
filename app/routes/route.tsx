import { Outlet } from "react-router";

export default function Root() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>DPP Metafield Search</title>
      </head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}
