import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Portability (Vercel → Cloudflare Workers): no Vercel image optimizer.
  images: { unoptimized: true },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
