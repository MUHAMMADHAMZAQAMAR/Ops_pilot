import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Client-side router cache: revisiting a page within 30s is instant
    // (no server roundtrip). Fresh data loads after the window expires.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    // Only bundle the icons actually used instead of the whole library
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
