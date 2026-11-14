import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

// If the contracts have been deployed (public/testnet.json exists) the app shows its live Stellar-testnet panel.
// Checked at build/start time so there is no failing network request when the file is absent.
const hasTestnet = fs.existsSync(path.join(process.cwd(), "public", "testnet.json"));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // PGlite (embedded Postgres, used only when DATABASE_URL is unset) ships wasm; keep it out of the bundle.
  serverExternalPackages: ["@electric-sql/pglite"],
  env: { NEXT_PUBLIC_HAS_TESTNET: hasTestnet ? "1" : "" },
};

export default nextConfig;
