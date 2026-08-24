import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  experimental: {
    cpus: 2,
    serverActions: {
      bodySizeLimit: "2mb"
    }
  }
};

export default nextConfig;
