import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "playwright", "playwright-core"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
