import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  env: {
    NEXT_PUBLIC_READ_ONLY: process.env.VERCEL === "1" ? "true" : "false",
  },
};

export default nextConfig;
