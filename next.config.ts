import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node runtime so server code can reach Postgres directly.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
