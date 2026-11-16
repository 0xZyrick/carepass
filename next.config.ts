import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PGlite (embedded Postgres, used only when DATABASE_URL is unset) ships wasm; keep it out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
