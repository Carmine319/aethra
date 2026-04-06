import type { NextConfig } from "next";

/** Backend for rewrites defaults to localhost:4000. */
const API =
  process.env.AETHRA_API_ORIGIN?.replace(/\/$/, "") ||
  "http://localhost:4000";

const nextConfig: NextConfig = {
  /** Pin Turbopack root when multiple lockfiles exist (monorepo). */
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API}/api/:path*` },
      { source: "/run", destination: `${API}/run` },
      { source: "/core/:path*", destination: `${API}/core/:path*` },
      { source: "/webhooks/:path*", destination: `${API}/webhooks/:path*` },
    ];
  },
};

export default nextConfig;
