import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile lives one level up).
  turbopack: { root: path.join(__dirname) },
};

export default nextConfig;
