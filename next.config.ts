import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  typedRoutes: true,
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
