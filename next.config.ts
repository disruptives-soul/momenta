import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/render": ["./features/rendering/assets/**/*"],
    "/api/admin/catalog/sync": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
