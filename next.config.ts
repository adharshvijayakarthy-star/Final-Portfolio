import type { NextConfig } from "next";

/**
 * Project AURA — Next.js configuration.
 *
 * Deliberately minimal. Every option here exists for a stated reason; nothing
 * is enabled speculatively. Turbopack is the default bundler in Next 16, so it
 * is not configured explicitly.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,

  // The Quick Discovery experience is heavily art-directed. Typed routes catch
  // broken internal links at compile time once Stay Awhile adds real routing.
  typedRoutes: true,

  images: {
    unoptimized: true,
    // Portfolio imagery will be large and photographic. AVIF first, WebP as the
    // fallback, so we never ship the original JPEG/PNG to a modern browser.
    formats: ["image/avif", "image/webp"],
  },

  // Fail loudly rather than shipping a broken build. (Next 16 removed the
  // `eslint` counterpart to this option along with `next lint`; linting now
  // runs as its own `npm run lint` step.)
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
